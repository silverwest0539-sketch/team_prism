// services/promptService.js
const pool = require('../database');
const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 1. 키워드로 DB 내 keyword_id 찾기
exports.getKeywordId = async (keyword) => {
  // TREND_KEYWORD 테이블에 'keyword' 또는 'keyword_name' 컬럼이 있다고 가정
  const query = `SELECT keyword_id FROM TREND_KEYWORD WHERE keyword_name = ? LIMIT 1`;
  const [rows] = await pool.query(query, [keyword]);
  return rows.length > 0 ? rows[0].keyword_id : null;
};

// 2. 어제와 오늘의 통계 데이터 가져오기
exports.getTrendStats = async (keywordId) => {
  const query = `
    SELECT 
      SUM(mention_count) as total_mentions,
      AVG(positive_score) as avg_positive,
      AVG(negative_score) as avg_negative,
      AVG(neutral_score) as avg_neutral
    FROM KEYWORD_STATS
    WHERE keyword_id = ? 
      AND stat_date >= CURDATE() - INTERVAL 1 DAY
  `;
  const [rows] = await pool.query(query, [keywordId]);
  
  // 데이터가 없을 경우 방어 로직
  if (!rows[0].total_mentions) return null;
  return rows[0];
};

// 3. 어제와 오늘의 실제 사용 예문 가져오기 (최대 5개)
exports.getUsageExamples = async (keywordId) => {
  const query = `
    SELECT u.platform, u.content, u.sentiment_label
    FROM USAGE_EXAMPLE u
    JOIN KEYWORD_EXAMPLE ke ON u.example_id = ke.example_id
    WHERE ke.keyword_id = ?
      AND u.collected_date >= CURDATE() - INTERVAL 1 DAY
    ORDER BY u.collected_date DESC
    LIMIT 5
  `;
  const [rows] = await pool.query(query, [keywordId]);
  return rows;
};

// 4. OpenAI API를 이용해 메타 프롬프트 생성
exports.createPromptWithAI = async (formData, trendData, onStream) => {
  const { keyword, type, industry, context, target, otherRequests } = formData;

  const systemPrompt = `
# 지시문
당신은 10년 차 수석 마케터이자 '프롬프트 엔지니어'입니다. 
사용자가 ChatGPT나 Gemini에 바로 복사/붙여넣기 할 수 있는 '완벽한 결과물 생성용 프롬프트'를 만들어주세요.
# 제약조건
1. 사용자가 지정한 키워드의 트렌드 분석 결과와 사용자가 선택한 콘텐츠 생성 옵션을 바탕으로 실제 카드뉴스 이미지 세트를 만들 수 있는 프롬프트를 만들어야 합니다.
2. 슬라이드 구성은 메인 타이틀/서브 타이틀/헤드라인/서브 문구/본문 키워드/목록 등으로 구성합니다. 마지막 슬라이드는 반드시 CTA 문구로 구성합니다.
3. 입력문에서 제시한 상승 지표의 수치값은 실제 결과물에 활용하지 않습니다.
4. 입력문에 제시한 데이터 외에도 웹 검색, 뉴스 검색을 통해 해당 키워드에 대한 데이터를 추가로 확보해서 활용합니다.
4. *중요*: 인사말, 요약, 부연 설명은 절대 하지 마세요. 오직 사용자가 복사해서 사용할 '프롬프트 텍스트' 그 자체만 출력해야 합니다.

  `.trim();

  let userPrompt = `
다음 조건을 바탕으로 최적의 마케팅 콘텐츠 생성 프롬프트를 작성해 주세요.

[기본 정보]
- 메인 키워드: ${keyword}
- 콘텐츠 유형: ${type}
- 업종: ${industry}
- 제작 목적: ${context || '일반적인 정보 전달 및 홍보'}
- 타겟 고객: ${target || '일반 대중'}
- 추가 요구사항: ${otherRequests || '없음'}
  `;

  // DB 데이터 주입
  if (trendData && trendData.stats) {
    const { total_mentions, avg_positive, avg_negative, avg_neutral } = trendData.stats;
    const examples = trendData.examples;

    userPrompt += `
\n[💡 최신 트렌드 데이터 (어제/오늘)]
- 인터넷 반응: 총 ${total_mentions}회 언급 (긍정 ${Math.round(avg_positive)}%, 부정 ${Math.round(avg_negative)}%, 중립 ${Math.round(avg_neutral)}%)
- 실제 유저 반응 예시:
${examples.map((ex, i) => `  ${i + 1}. [${ex.platform}] ${ex.content} (${ex.sentiment_label})`).join('\n')}
    `;
  } else {
    userPrompt += `\n\n(최신 트렌드 데이터는 없습니다. 키워드에 대한 최신 지식을 바탕으로 가장 매력적인 프롬프트를 작성해 주세요.)`;
  }

  // ⭐️ 핵심: AI가 출력할 프롬프트의 뼈대를 강제하는 지시문 추가
  userPrompt += `
\n[출력 프롬프트 작성 지침 - 필수 준수]
당신이 출력할 프롬프트는 반드시 아래의 <프롬프트 구조 예시>와 같이 [작성 조건]을 명확히 포함하는 형태여야 합니다. 
주어진 트렌드 데이터를 분석하여 아래 [작성 조건] 내용을 주어진 데이터에 맞게 구체적이고 매력적으로 적절하게 변경해주세요.
마크다운 코드블록 없이 텍스트 형식으로 출력해야 하고, 이모지는 제외합니다.
실제 이미지 세트를 만들어야 한다는 문구를 포함해야 합니다.
각 조건마다 3개 이상의 항목을 출력합니다.


<프롬프트 구조 예시>
당신은 ${industry} 전문 카피라이터입니다. 
최근 '${keyword}'에 대한 사람들의 반응은 [트렌드 데이터 요약 및 실제 예시에서 뽑아낸 핵심 분위기]입니다. 
이러한 여론과 밈을 적극 활용하여 ${target || '일반 대중'}의 시선을 끄는 실제 ${type} 이미지 세트를 작성해 주세요. 목적은 ${context || '정보 전달'}입니다.

[작성 조건]
## 1. 형식
- 콘텐츠 유형: 
- 이미지 비율: 
- 슬라이드 수: 
- 각 슬라이드는 독립된 이미지로 제작하되, 전체 시리즈로서 시각적 일관성을 유지할 것
---
## 2. 주제
---
## 3. 타겟
- 주요 타겟:
- 관심사: 
- 소비 채널: 
---
## 4. 톤앤매너
- 
---
## 5. 전체 디자인 조건
1) 컬러 팔레트
2 )타이포그래피
- 헤드라인:
- 본문:
- 포인트 문구:
3) 그래픽 스타일
---
## 6. 슬라이드 구성
SLIDE 01 — 훅 (시선 끌기)
- 메인 타이틀: 
- 서브 타이틀: 
- 보조 문구: 
- 디자인 포인트: 

SLIDE 02~05
- 헤드라인: 
- 서브 문구: 
- 본문 키워드 목록:
- 디자인 포인트: 

SLIDE 06 — CTA (행동 유도) / 마지막 슬라이드
- 헤드라인: 
- 서브 문구: 
- CTA 문구:
- 보조 문구: 
- 디자인 포인트: 
  `.trim();
  // GPT 호출
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini', 
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.6,
    stream: true,
  });

  let fullContent = "";
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      fullContent += content;
      if (onStream) onStream(content); // 콜백 함수로 글자 전달
    }
  }

  return fullContent;
};