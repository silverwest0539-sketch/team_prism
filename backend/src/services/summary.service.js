const axios = require('axios');
const Parser = require('rss-parser');
const { findKeywordOverAll, getHistoryData } = require('../dataLoader');

const parser = new Parser();
let summaryCache = {};
let summaryLocks = {};

exports.generateSummary = async (keyword, startDate, endDate) => {
  const now = Date.now();

  // 1. 캐시 확인
  if (!startDate && !endDate && summaryCache[keyword] && (now - summaryCache[keyword].timestamp < 60 * 60 * 1000)) {
    console.log(`📦 [Summary Cache] 캐시된 요약 데이터 반환: ${keyword}`);
    return { status: 200, summary: summaryCache[keyword].data };
  }

  // 2. Lock 확인 (중복 요청 방지)
  if (!startDate && !endDate) {
    if (summaryLocks[keyword]) {
      console.log(`🛑 [Lock] 이미 분석 중인 키워드입니다. 중복 요청 차단: ${keyword}`);
      return { status: 429, summary: "잠시 후 다시 시도해주세요." };
    }
    summaryLocks[keyword] = true;
  }

  try {
    // 3. 로컬 데이터 수집
    const currentItem = findKeywordOverAll(keyword);
    if (!currentItem) {
      if (!startDate && !endDate) delete summaryLocks[keyword];
      return { status: 200, summary: "데이터가 부족하여 분석할 수 없습니다." };
    }

    const historyMap = getHistoryData();
    const dates = Object.keys(historyMap).sort();
    let collectedComments = [];
    let platformStats = {};

    // 💡 [디버깅] 현재 서버가 인식하고 있는 모든 키워드 목록 확인
    let availableKeywords = new Set();
    dates.forEach(date => {
      const dayData = historyMap[date];
      if (dayData && dayData.all) {
        dayData.all.forEach(item => {
          if (item.Keyword) availableKeywords.add(item.Keyword);
          if (item.keyword) availableKeywords.add(item.keyword);
        });
      }
    });
    console.log(`📂 [Data Check] 현재 검색 가능한 키워드 목록:`, Array.from(availableKeywords).join(', '));

    dates.forEach(date => {
      const dayData = historyMap[date];
      if (!dayData) return;

      // JSON의 키들("all", "youtube", "ruliweb" 등)을 모두 순회
      Object.keys(dayData).forEach(categoryKey => {
        const items = dayData[categoryKey];
        if (!Array.isArray(items)) return; // 배열이 아니면 패스

        // "Keyword"가 일치하는 항목 찾기 (대소문자 방어)
        const targetItem = items.find(item => 
          (item.Keyword || item.keyword) === keyword
        );

        if (targetItem && targetItem.Examples) {
          targetItem.Examples.forEach(rawComment => {
            // 방어 1: 데이터가 비어있으면(null, undefined) 패스
            if (!rawComment) return;

            // 방어 2: 데이터가 문자열이 아닌 경우, 텍스트 형태로 강제 변환/추출
            let commentText = "";
            if (typeof rawComment === 'string') {
              commentText = rawComment; // 정상적인 문자열인 경우
            } else if (typeof rawComment === 'object') {
              // 객체 형태인 경우, 주로 쓰이는 key 값(text, content, comment 등)에서 추출
              commentText = rawComment.text || rawComment.content || rawComment.comment || JSON.stringify(rawComment);
            } else {
              // 숫자나 다른 타입일 경우 강제로 문자열 변환
              commentText = String(rawComment);
            }

            // 1. 변환된 안전한 텍스트를 원본 댓글 수집 배열에 추가
            collectedComments.push(commentText);

            // 2. 플랫폼 통계 수집 (.match 에러 완벽 방어)
            const platformMatch = commentText.match(/^\[([^\]]+)\]/);
            
            if (platformMatch) {
              const platformName = platformMatch[1]; // 추출된 플랫폼 이름
              platformStats[platformName] = (platformStats[platformName] || 0) + 1;
            } else if (categoryKey !== 'all') {
              platformStats[categoryKey] = (platformStats[categoryKey] || 0) + 1;
            }
          });
        }
      });
    });

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
      let newsQuery = `${keyword}`;
      if (startDate) newsQuery += ` after:${startDate}`;
      if (endDate) newsQuery += ` before:${endDate}`;

      const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(newsQuery)}&hl=ko&gl=KR&ceid=KR:ko`;
      const feed = await parser.parseURL(feedUrl);

      if (feed.items && feed.items.length > 0) {
        newsContext = feed.items.slice(0, 5).map(item => {
          const title = item.title || "";
          let snippet = item.contentSnippet || item.content || "";
          snippet = snippet.length > 200 ? snippet.substring(0, 200) + "..." : snippet;
          return `- [기사 제목] ${title}\n  [기사 내용] ${snippet}`;
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
    3. **크리에이터 팁 & 주의점**: (여기에 내용 작성 - 꿀팁 작성. 리스크 발생 시에만 문장을 <<< 와 >>> 로 감쌀 것)

    [스타일 제약]
    1. '다.'로 끝내지 말 것. (~함, ~임 체 사용)
    2. 사실 지어내지 말 것.
    3. 예시 베끼지 말 것.
    4. 반복 출력 금지.`;

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
    finalSummary = finalSummary.replace(/<<<(.*?)>>>/g, '<br><br><span style="color: #e11d48; font-weight: 800; background-color: #ffe4e6; padding: 2px 5px; border-radius: 4px;">⚠️ $1</span>');
    finalSummary = finalSummary.replace(/(?:★?주의할\s*점|★?주의사항|⚠️\s*주의|★?주의):\s*([\s\S]*)$/g, function(match, text) {
      const formattedText = text.trim().replace(/\n/g, '<br>');
      return `<div style="margin-top: 15px; color: #e11d48; font-weight: 800; background-color: #ffe4e6; padding: 12px 15px; border-radius: 6px; line-height: 1.6;">⚠️ ${formattedText}</div>`;
    });
    finalSummary += `\n\n(🔥 Hot: ${topPlatform})`;

    console.log("✅ AI 요약 완료!");

    // 9. 캐시 저장 및 Lock 해제
    if (!startDate && !endDate) {
      summaryCache[keyword] = { data: finalSummary, timestamp: now };
      delete summaryLocks[keyword];
    }

    return { status: 200, summary: finalSummary };

  } catch (error) {
    if (!startDate && !endDate) delete summaryLocks[keyword];
    if (error.response) console.error("❌ AI API 에러 응답:", error.response.status, error.response.data);
    else console.error("❌ 서버 내부 에러:", error.message);
    
    throw new Error("AI_ERROR");
  }
};