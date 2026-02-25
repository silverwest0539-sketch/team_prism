const axios = require('axios');
const Parser = require('rss-parser');
const db = require('../database');

const parser = new Parser();
// let summaryCache = {};
let summaryLocks = {};

const getKstDateString = (offsetDays = 0) => {
  const curr = new Date();
  const utc = curr.getTime() + (curr.getTimezoneOffset() * 60 * 1000);
  const kst = new Date(utc + (9 * 60 * 60 * 1000)); // UTC+9
  kst.setDate(kst.getDate() + offsetDays);
  
  const yyyy = kst.getFullYear();
  const mm = String(kst.getMonth() + 1).padStart(2, '0');
  const dd = String(kst.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

exports.generateSummary = async (keyword, startDate, endDate) => {
  const todayKst = getKstDateString(0);
  const yesterdayKst = getKstDateString(-1);

  // 1. Lock 확인 (중복 요청 방지) - 날짜 상관없이 키워드 단위로 락
  if (summaryLocks[keyword]) {
    console.log(`🛑 [Lock] 이미 분석 중인 키워드입니다. 중복 요청 차단: ${keyword}`);
    return { status: 429, summary: "잠시 후 다시 시도해주세요." };
  }
  summaryLocks[keyword] = true;

  try {
    // 2. 키워드 ID 획득
    const [kwRows] = await db.execute(
      `SELECT keyword_id FROM TREND_KEYWORD WHERE keyword_name = ?`,
      [keyword]
    );

    if (kwRows.length === 0) {
      return { status: 200, summary: "데이터가 부족하여 분석할 수 없습니다." };
    }
    const keywordId = kwRows[0].keyword_id;

    let targetStatDate = todayKst; 
    const [statRows] = await db.execute(
      `SELECT stat_date, keyword_summary 
       FROM KEYWORD_STATS 
       WHERE keyword_id = ? AND stat_date = ?`,
      [keywordId, todayKst]
    );

    if (statRows.length > 0) {
      if (statRows[0].keyword_summary) {
        console.log(`📦 [DB Cache] 오늘자(${todayKst}) 요약 반환: ${keyword}`);
        return { status: 200, summary: statRows[0].keyword_summary };
      }
    }

    // 대중 반응(댓글) 및 플랫폼 통계 수집
    const [exampleRows] = await db.execute(
      `SELECT u.platform, u.content
       FROM USAGE_EXAMPLE u
       JOIN KEYWORD_EXAMPLE ke ON u.example_id = ke.example_id
       WHERE ke.keyword_id = ?
         AND DATE(u.collected_date) BETWEEN ? AND ?
       ORDER BY u.collected_date DESC 
       LIMIT 200`,
      [keywordId, yesterdayKst, todayKst]
    );

    let collectedComments = [];
    let platformStats = {};

    exampleRows.forEach(row => {
      const commentText = row.content;
      // DB에 플랫폼 정보가 없으면 '기타'로 처리
      const platformName = row.platform || '기타';

      if (commentText) collectedComments.push(commentText);
      platformStats[platformName] = (platformStats[platformName] || 0) + 1;
    });

    if (collectedComments.length === 0) {
      return { status: 200, summary: "최근 2일(어제~오늘)간 수집된 대중 반응 데이터가 부족하여 분석할 수 없습니다." };
    }

    // 🏆 확산처(Top Platform) 계산
    let topPlatform = "알 수 없음";
    let maxCount = -1;
    Object.entries(platformStats).forEach(([plat, count]) => {
      if (count > maxCount && plat !== '알 수 없음' && plat !== '기타') { 
        maxCount = count; 
        topPlatform = plat; 
      }
    });

    console.log(`📊 [Data Check] 추출된 플랫폼 통계:`, platformStats);
    console.log(`💬 [Data Check] 수집된 원본 댓글 수: ${collectedComments.length}개`);

    // 4. 데이터 셔플 & 정제
    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    const refinedComments = shuffleArray([...new Set(collectedComments)])
      .map(c => {
        const text = (typeof c === 'object' && c !== null && c.text) ? c.text : c;
        if (typeof text !== 'string') return '';
        return text.replace(/\n/g, ' ').trim();
      })
      .filter(c => c.length > 10)
      .slice(0, 10)
      .map(c => c.length > 80 ? c.substring(0, 80) : c);

    const commentsForPrompt = refinedComments.length > 0 
      ? refinedComments.map(c => `- "${c}"`).join('\n') 
      : "관련 댓글 데이터가 없습니다.";

    // 5. 뉴스 데이터 수집
    let newsContext = "관련된 최신 뉴스가 없습니다.";
    try {
      // 구글 뉴스 검색어에 after(어제)와 before(오늘) 적용
      const newsQuery = `${keyword} after:${yesterdayKst} before:${todayKst}`;
      const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(newsQuery)}&hl=ko&gl=KR&ceid=KR:ko`;
      const feed = await parser.parseURL(feedUrl);

      if (feed.items && feed.items.length > 0) {
        newsContext = feed.items.slice(0, 5).map(item => {
          let snippet = item.contentSnippet || item.content || "";
          snippet = snippet.length > 200 ? snippet.substring(0, 200) + "..." : snippet;
          return `- [기사 제목] ${item.title}\n  [기사 내용] ${snippet}`;
        }).join('\n\n');
      }
    } catch (newsErr) {
      console.log("뉴스 수집 실패:", newsErr.message);
    }

    // 6. Prompt 구성
    const systemPrompt = `당신은 콘텐츠 크리에이터를 위한 '트렌드 분석 전문가'입니다. 오직 제공된 [뉴스 팩트]와 [대중 반응]을 종합하여 키워드를 콘텐츠로 다룰 때 필요한 정보를 브리핑하세요. 말투는 "~함", "~임" 체를 사용하여 보고서처럼 명확하게 작성하세요.`;
    const userPrompt = `[분석 키워드]: ${keyword}
    [최신 뉴스 팩트]: ${newsContext}
    [주요 확산처]: ${topPlatform}
    [대중 반응]:
    ${commentsForPrompt}

    위 내용을 바탕으로 **총 450자 이내**로 명확하게 요약해.

    [🚨 필수 출력 템플릿 🚨] - 반드시 아래의 1, 2, 3번 양식을 그대로 복사해서 내용만 채울 것!
    1. **정의 및 배경**: (여기에 내용 작성 - 줄임말 해독 포함, 추측성 가격 정보 금지)
    2. **여론 및 반응**: (여기에 내용 작성 - 감정과 주요 의견 요약. 가격 비판 반응 주의)
    3. **크리에이터 팁 & 주의점**: (콘텐츠 제작 꿀팁을 최우선으로 작성함. 만약 비도덕적, 불법적, 혹은 커뮤니티 가이드라인 위반 등 '실질적 리스크'가 데이터상에 존재할 때만 내용 맨 마지막에 <<< 주의사항 내용 >>> 형태로 작성함. '리스크 발생 시 주의할 것' 같은 알맹이 없는 문구는 절대 생성하지 말 것. 특별한 주의사항이 없다면 <<< >>> 기호 자체를 출력하지 말고 꿀팁 문장으로 즉시 종료할 것.)

    [스타일 제약]
    1. '다.'로 끝내지 말 것. (~함, ~임 체 사용)
    2. 사실 지어내지 말 것.
    3. 예시 베끼지 말 것.
    4. 반복 출력 금지.
    5. [우선순위 강제 규칙]: [최신 뉴스 팩트]의 내용과 [대중 반응]의 문맥이 서로 다른 대상(예: 뉴스=스팸문자, 반응=먹는 스팸)을 지칭할 경우, 무조건 **[대중 반응]의 문맥을 진짜 트렌드로 간주**하고, 맥락에 맞지 않는 뉴스 팩트는 요약에서 완전히 버릴 것.
    6. 꼬리말 금지: 3번 항목의 출력이 끝난 이후에는 "또한,", "참고로" 등의 어떠한 추가 문장도 덧붙이지 말고 즉시 출력을 종료할 것.`;

    // 7. AI API 요청
    const provider = process.env.AI_PROVIDER || 'local';
    let rawContent = "";

    console.log(`🤖 AI 요약 요청 [${keyword}] (Mode: ${provider})`);

    if (provider === 'openai') {
      const openaiResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        { model: "gpt-4o-mini", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], temperature: 0.3, max_tokens: 1000 },
        { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` } }
      );
      rawContent = openaiResponse.data.choices[0].message.content;
    } else {
      const localUrl = process.env.LOCAL_LLM_URL || 'http://192.168.219.107:1234/v1/chat/completions';
      const localResponse = await axios.post(localUrl, {
        model: "local-model", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], temperature: 0.1, max_tokens: 1000
      });
      rawContent = localResponse.data.choices[0].message.content;
    }

    // 8. 텍스트 후처리
   let finalSummary = rawContent.trim()
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
      .replace(/\[작성 양식\]/g, '')
      .replace(/\[출력 예시\]/g, '');
    finalSummary = finalSummary.replace(/<<<([\s\S]*?)>>>\.?/g, function(match, text) {
      // 박스 내부의 텍스트 끝에 있는 마침표(.)나 공백도 깔끔하게 제거
      let cleanText = text.trim().replace(/\.$/, ''); 
      const formattedText = cleanText.replace(/\n/g, '<br>');
      return `<div style="margin-top: 15px; color: #e11d48; font-weight: 800; background-color: #ffe4e6; padding: 12px 15px; border-radius: 6px; line-height: 1.6;">⚠️ ${formattedText}</div>`;
    });
    finalSummary = finalSummary.replace(/(?:★?주의할\s*점|★?주의사항|⚠️\s*주의|★?주의):\s*([\s\S]*)$/g, function(match, text) {
      const formattedText = text.trim().replace(/\n/g, '<br>');
      return `<div style="margin-top: 15px; color: #e11d48; font-weight: 800; background-color: #ffe4e6; padding: 12px 15px; border-radius: 6px; line-height: 1.6;">⚠️ ${formattedText}</div>`;
    });
    finalSummary += `\n\n(🔥 Hot: ${topPlatform})`;
    finalSummary = finalSummary.replace(/\n/g, '<br>');

    console.log("✅ AI 요약 완료!");

    // 생성된 요약본을 DB에 저장 (UPDATE) 및 Lock 해제
    await db.execute(
      `UPDATE KEYWORD_STATS SET keyword_summary = ? WHERE keyword_id = ? AND stat_date = ?`,
      [finalSummary, keywordId, targetStatDate]
    );
    console.log(`💾 [DB Cache] 저장 완료: ${keyword} (${targetStatDate})`);

    return { status: 200, summary: finalSummary };

  } catch (error) {
    if (error.response) console.error("❌ AI API 에러:", error.response.status, error.response.data);
    else console.error("❌ 서버 에러:", error.message);
    throw new Error("AI_ERROR");
  } finally {
    delete summaryLocks[keyword];
  }
};