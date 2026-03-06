// services/promptService.js
const pool = require('../database');
const { OpenAI } = require('openai');
const https = require('https');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ 네이버 뉴스 API 검색
const fetchNaverNews = (keyword) => {
  return new Promise((resolve) => {
    const query = encodeURIComponent(keyword);
    const options = {
      hostname: 'openapi.naver.com',
      path: `/v1/search/news.json?query=${query}&display=5&sort=date`,
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
      },
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const items = (parsed.items || []).map((item, i) => 
            `${i + 1}. [${item.pubDate}] ${item.title.replace(/<[^>]+>/g, '')} — ${item.description.replace(/<[^>]+>/g, '')}`
          );
          resolve(items.join('\n'));
        } catch {
          resolve('');
        }
      });
    }).on('error', () => resolve(''));
  });
};

// ✅ DB 함수들
exports.getKeywordId = async (keyword) => {
  const query = `SELECT keyword_id FROM TREND_KEYWORD WHERE keyword_name = ? LIMIT 1`;
  const [rows] = await pool.query(query, [keyword]);
  return rows.length > 0 ? rows[0].keyword_id : null;
};

exports.getTrendStats = async (keywordId) => {
  const query = `
    SELECT 
      SUM(mention_count) as total_mentions,
      AVG(positive_score) as avg_positive,
      AVG(negative_score) as avg_negative,
      AVG(neutral_score) as avg_neutral,
      MAX(keyword_summary) as keyword_summary
    FROM KEYWORD_STATS
    WHERE keyword_id = ? 
      AND stat_date >= CURDATE() - INTERVAL 1 DAY
  `;
  const [rows] = await pool.query(query, [keywordId]);
  if (!rows.length || !rows[0].total_mentions) return null;
  return rows[0];
};

exports.getUsageExamples = async (keywordId) => {
  const query = `
    SELECT u.platform, u.content, u.sentiment_label
    FROM USAGE_EXAMPLE u
    JOIN KEYWORD_EXAMPLE ke ON u.example_id = ke.example_id
    WHERE ke.keyword_id = ?
      AND u.collected_date >= CURDATE() - INTERVAL 1 DAY
    ORDER BY u.collected_date DESC
    LIMIT 10
  `;
  const [rows] = await pool.query(query, [keywordId]);
  return rows;
};

exports.createPromptWithAI = async (formData, trendData, onStream) => {
  const { keyword, type, industry, context, target, otherRequests } = formData;

  // ✅ STEP 1: 네이버 뉴스 API로 최신 뉴스 수집
  const newsText = await fetchNaverNews(keyword);

  // ✅ STEP 2: DB keyword_summary + 뉴스 → 핵심 분위기 요약문 생성
  let trendMoodSummary = '';
  const hasComments = trendData?.examples?.length > 0;
  const keywordSummary = trendData?.stats?.keyword_summary || '';
  const hasNews = newsText.length > 0;

  if (keywordSummary || hasNews || hasComments) {
    let analysisInput = `'${keyword}'에 대한 아래 데이터를 분석해서, 현재 사람들의 반응과 분위기를 2~3문장으로 자연스럽게 요약해줘. 마케팅 프롬프트에 삽입할 문장이니까 "~한 분위기입니다" 형태로 끝내줘. 수치는 포함하지 말고 감성적인 표현으로 써줘.\n\n`;

    if (keywordSummary) {
      analysisInput += `[AI 키워드 요약]\n${keywordSummary}\n\n`;
    }
    if (hasNews) {
      analysisInput += `[최신 뉴스]\n${newsText}\n\n`;
    }
    if (hasComments) {
      analysisInput += `[실제 유저 댓글]\n${trendData.examples.map((ex, i) => `${i + 1}. [${ex.platform}] "${ex.content}" (${ex.sentiment_label})`).join('\n')}`;
    }

    try {
      const moodResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: analysisInput }],
        temperature: 0.5,
        max_tokens: 200,
      });
      trendMoodSummary = moodResponse.choices[0]?.message?.content?.trim() || '';
    } catch (err) {
      console.error('분위기 요약 실패:', err.message);
    }
  }

  // ✅ STEP 3: type별 Few-shot 예시 및 구성 지시 분기
  const typeConfig = {
    카드뉴스: {
      fewShot: `
---예시 시작---
당신은 푸드 트렌드 전문 카피라이터입니다.
실제 카드뉴스 이미지 세트를 제작해 주세요. 목적은 봄철 제철 식재료 '봄동'을 활용한 봄동비빔밥이 SNS와 방송을 통해 다시 주목받고 있는 트렌드를 포착하여, 요리 비주얼과 레시피 정보를 감각적으로 전달하는 것입니다.

[작성 조건]
## 1. 형식
- 콘텐츠 유형: 카드뉴스 (정방형 이미지 세트)
- 이미지 비율: 1:1 (1080x1080px)
- 슬라이드 수: 6장
- 각 슬라이드는 독립된 이미지로 제작하되, 전체 시리즈로서 시각적 일관성을 유지할 것

## 2. 주제
봄철 제철 식재료 '봄동'을 활용한 봄동비빔밥이 SNS와 방송을 통해 다시 주목받고 있는 트렌드를 포착하여,
요리 비주얼과 레시피 정보를 감각적으로 전달하는 푸드 트렌드형 카드뉴스

## 3. 타겟
- 주요 타겟: 트렌드에 민감한 20대 여성
- 관심사: 푸드 트렌드, SNS 맛집, 홈쿡, 건강한 식단, 비주얼 요리
- 소비 채널: 인스타그램, 틱톡, 유튜브 숏츠

## 4. 톤앤매너
- 트렌디하고 감각적인 푸드 매거진 스타일
- 친근하고 유쾌한 어조, 20대 여성 공감형 표현
- 정보는 간결하게, 비주얼 중심으로 구성
- 과도한 광고성 문구 지양, 자연스럽고 솔직한 트렌드 소개 방식

## 5. 전체 디자인 조건
1) 컬러 팔레트
- 메인 컬러: 봄 연두(#C8E6A0), 크림 화이트(#FAFAF2), 라이트 옐로우(#FFF5CC)
- 포인트 컬러: 비비드 그린(#4CAF50), 웜 코랄(#FF7043)
- 배경: 밝고 따뜻한 봄 감성의 그라데이션 (화이트 → 연한 연두/크림 계열)
- 텍스트: 딥 올리브(#3B3B2F) / 강조 텍스트: 비비드 그린 또는 웜 코랄
2) 타이포그래피
- 헤드라인: 굵고 임팩트 있는 현대적 산세리프체 (Bold, 자간 타이트)
- 본문: 가독성 높은 레귤러 산세리프체 (자간 보통)
- 포인트 문구: 손글씨 느낌의 스크립트체 혼용 가능 (감성 강조용)
3) 그래픽 스타일
- 봄 감성의 신선하고 청량한 비주얼 (봄동 잎, 나물, 참기름 윤기 모티프)
- 음식 사진을 연상시키는 탑뷰(Top View) 구도의 일러스트 또는 텍스처 배경 활용
- 반투명 태그, 스티커, 뱃지 형태의 포인트 UI 요소 삽입
- 각 슬라이드 하단 또는 모서리에 일관된 브랜드 워터마크 영역 확보
- 전체적으로 '봄 피크닉', '건강한 한 끼' 무드 유지

## 6. 슬라이드 구성

SLIDE 01 — 훅 (시선 끌기)
- 메인 타이틀: 요즘 SNS 뒤덮은 그 비빔밥
- 서브 타이틀: 봄동비빔밥, 알고 있어?
- 디자인 포인트:
  · 봄동 잎과 비빔밥 그릇을 연상시키는 일러스트 또는 텍스처 배경
  · 메인 타이틀은 화면 중앙에 크고 굵게, 봄 연두 컬러 강조
  · 하단에 "지금 난리난 봄의 맛" 보조 문구 삽입

SLIDE 02 — 트렌드 배경 소개
- 헤드라인: 봄동비빔밥이 다시 뜨는 이유
- 서브 문구: 방송에서 재현된 한 장면이 대중의 입맛을 깨웠다
- 본문 키워드 목록:
  · 봄에만 맛볼 수 있는 제철 재료, 봄동
  · 방송을 통해 재조명된 18년 전 그 맛
  · SNS와 유튜브에서 활발히 퍼지는 중
- 디자인 포인트:
  · 키워드 목록은 아이콘 + 텍스트 조합의 카드 형태로 배치
  · 배경에 봄동 잎 텍스처 반투명 오버레이

SLIDE 03 — 봄동 소개
- 헤드라인: 봄동이 뭐길래?
- 서브 문구: 봄에만 나오는 특별한 배추, 맛도 영양도 다르다
- 본문 키워드 목록:
  · 봄철 한정 수확되는 어린 배추
  · 아삭하고 달큰한 특유의 식감
  · 비타민·식이섬유 풍부한 제철 건강 식재료
  · 비빔밥과 만나면 환상의 조합
- 디자인 포인트:
  · 봄동 일러스트 또는 식물 그래픽 중앙 배치
  · 정보 항목은 글래스모피즘 카드 UI로 깔끔하게 정리

SLIDE 04 — 레시피 핵심 포인트
- 헤드라인: 봄동비빔밥, 이것만 알면 완성
- 서브 문구: 재료는 단순하게, 맛은 진하게
- 본문 키워드 목록 (STEP 형식):
  · STEP 1: 봄동은 먹기 좋게 손으로 찢어 준비
  · STEP 2: 된장·참기름·마늘 양념장으로 맛의 베이스 잡기
  · STEP 3: 따뜻한 밥 위에 봄동과 양념장 올리기
  · STEP 4: 달걀 후라이 또는 날달걀로 마무리
  · STEP 5: 쓱쓱 비벼서 바로 먹기
- 디자인 포인트:
  · STEP 번호는 원형 뱃지 형태, 포인트 컬러 적용
  · 각 STEP 사이 점선 구분선으로 시각적 흐름 유도

SLIDE 05 — 공감 포인트 / 반응 소개
- 헤드라인: 먹어본 사람들의 반응
- 서브 문구: 고기보다 맛있다는 말, 이제 이해된다
- 본문 키워드 목록 (말풍선 스타일):
  · "이게 이렇게 맛있을 줄이야"
  · "봄 되면 꼭 먹어야 하는 음식 추가"
  · "건강하면서 맛있는 조합 실화냐"
  · "이미 세 번째 해먹는 중"
- 디자인 포인트:
  · 말풍선 UI 요소로 댓글 느낌 연출
  · 배경은 따뜻한 크림+연두 그라데이션으로 공감 무드 강조

SLIDE 06 — CTA (행동 유도) / 마지막 슬라이드
- 헤드라인: 이번 봄, 당신도 한 번은 먹게 된다
- 서브 문구: 봄동비빔밥, 지금이 딱 제철
- CTA 문구:
  · 저장해두고 이번 주말에 도전해보세요
  · 만들어봤다면 댓글로 후기 남겨주세요
- 보조 문구: 봄이 가기 전에, 꼭 한 그릇
- 디자인 포인트:
  · CTA 버튼 형태의 UI 요소로 '저장' 및 '댓글' 행동 시각화
  · 전체 슬라이드 중 가장 강한 포인트 컬러(비비드 그린 + 코랄) 적용
  · 하단에 브랜드 계정 태그 영역 및 해시태그 예시 삽입
---예시 끝---

위 예시처럼:
- 컬러는 반드시 HEX 코드(#XXXXXX)까지 명시합니다.
- 디자인 포인트는 슬라이드마다 3줄 이상, UI 형태(글래스모피즘/말풍선/뱃지/카드 등)를 구체적으로 지정합니다.
- 본문 키워드는 단어 나열이 아닌 완성된 문장 형태로 씁니다.
- SLIDE별 소주제명을 붙이고, 각 슬라이드마다 독립적인 콘셉트를 가져야 합니다.
- 슬라이드마다 STEP형/말풍선형/리스트형/카드형 등 다른 UI 형식을 적용합니다.`,
      structureGuide: `
## 6. 슬라이드 구성
  SLIDE 01 — 훅 (고정: 시선을 끄는 메인 타이틀과 서브 타이틀로 구성)
  SLIDE 02~05 — 키워드의 배경, 핵심 정보, 트렌드 등 콘텐츠에 가장 적합한 주제로 자유롭게 구성.
               각 슬라이드마다 소주제명을 붙이고, STEP형/말풍선형/리스트형/카드형 등 슬라이드마다 다른 UI 형식 적용.
               단, DB 유저 댓글 데이터가 제공된 경우 활용 가치가 있다고 판단되면 유저 반응을 자연스럽게 녹여서 활용할 것.
  SLIDE 06 — CTA (고정: 마지막 슬라이드, 행동 유도 문구와 시각 요소 포함)`,
    },

    포스터: {
      fewShot: `
---예시 시작---
당신은 오프라인/온라인 광고 캠페인을 다수 진행한 시각 커뮤니케이션 전문 디자이너입니다.
실제 포스터 이미지를 제작해 주세요. 목적은 봄철 제철 식재료 '봄동비빔밥'의 감성을 단 한 장의 이미지로 강렬하게 전달하는 것입니다.

[작성 조건]
## 1. 형식
- 콘텐츠 유형: 포스터 (단일 이미지)
- 이미지 비율: 2:3 (1080x1620px) 또는 세로형 A4 비율
- 구성: 단일 이미지 1장으로 모든 메시지를 완결
- 시각적 위계: 메인 카피 → 서브 카피 → 보조 정보 순으로 시선 흐름 설계

## 2. 주제
봄동비빔밥의 계절감과 트렌드를 단 한 장의 강렬한 비주얼로 압축하여,
브랜드 감성과 핵심 메시지를 동시에 전달하는 감성 포스터

## 3. 타겟
- 주요 타겟: 트렌드에 민감한 20대 여성
- 관심사: 푸드 트렌드, 감성 비주얼, SNS 공유
- 소비 채널: 인스타그램 피드, 오프라인 매장 부착

## 4. 톤앤매너
- 감각적이고 세련된 푸드 매거진 무드
- 절제된 텍스트, 임팩트 있는 비주얼 중심
- 봄의 청량함과 음식의 풍성함을 동시에 표현

## 5. 전체 디자인 조건
1) 컬러 팔레트
- 메인 컬러: 봄 연두(#C8E6A0), 크림 화이트(#FAFAF2)
- 포인트 컬러: 비비드 그린(#4CAF50), 웜 코랄(#FF7043)
- 배경: 자연광을 연상시키는 밝고 따뜻한 그라데이션
- 텍스트: 딥 올리브(#3B3B2F)
2) 타이포그래피
- 메인 카피: 초대형 Bold 산세리프체, 화면 상단 1/3 배치
- 서브 카피: 미디엄 웨이트 산세리프체, 메인 카피 하단
- 보조 정보: 소형 레귤러체, 하단 여백 활용
- 자간: 타이트하게, 행간: 넉넉하게
3) 그래픽 스타일
- 봄동비빔밥 탑뷰 사진 또는 일러스트를 화면 중앙 크게 배치
- 텍스트와 이미지의 레이어드 구성으로 깊이감 연출
- 여백을 충분히 활용한 고급스러운 레이아웃
- 하단 브랜드 로고 및 해시태그 영역 확보
4) 레이아웃 원칙
- 상단: 메인 카피 (전체 높이의 25%)
- 중앙: 핵심 비주얼 이미지 (전체 높이의 50%)
- 하단: 서브 카피 + 보조 정보 + 브랜드 영역 (전체 높이의 25%)

## 6. 포스터 구성 요소
- 메인 카피: 봄이 왔다, 봄동비빔밥도 왔다
- 서브 카피: 제철의 맛은 딱 지금뿐
- 핵심 비주얼: 봄동비빔밥 탑뷰 이미지, 싱그러운 봄 연두 배경
- 보조 문구: 매년 봄, 한 번은 꼭 먹게 되는 그 맛
- 브랜드 영역: 하단 로고 + 해시태그 (#봄동비빔밥 #봄제철음식)
- 디자인 포인트:
  · 메인 카피는 이미지 위에 오버레이되어 레이어드 효과 연출
  · 봄동 잎 그래픽 요소를 모서리 장식으로 활용
  · 전체적으로 여백을 넉넉히 두어 고급스러운 무드 유지
---예시 끝---

위 예시처럼:
- 포스터는 단일 이미지이므로 슬라이드 구성 대신 '포스터 구성 요소'로 작성합니다.
- 메인 카피는 단 한 문장으로 강렬하게, 서브 카피는 1~2줄로 압축합니다.
- 레이아웃 비율(상단/중앙/하단)을 반드시 수치로 명시합니다.
- 컬러는 HEX 코드(#XXXXXX)까지 명시합니다.
- 디자인 포인트는 3줄 이상 구체적으로 작성합니다.`,
      structureGuide: `
## 6. 포스터 구성 요소
  - 메인 카피 (단 한 문장, 강렬하고 함축적으로)
  - 서브 카피 (1~2줄, 메인 카피를 보완)
  - 핵심 비주얼 설명 (중앙 배치할 이미지/일러스트 묘사)
  - 보조 문구 (선택)
  - 브랜드 영역 (로고 위치, 해시태그는 필요한 경우에만 포함)
  - 디자인 포인트 (레이아웃 비율, 시선 흐름, 특수 효과 등 3줄 이상)`,
    },

    썸네일: {
      fewShot: `
---예시 시작---
당신은 구독자 100만 채널의 영상 썸네일을 전담하는 썸네일 전문 디자이너입니다.
실제 썸네일 이미지를 제작해 주세요. 목적은 봄동비빔밥 관련 영상/게시물의 클릭률을 극대화하는 강렬한 썸네일을 만드는 것입니다.

[작성 조건]
## 1. 형식
- 콘텐츠 유형: 썸네일 (단일 이미지)
- 이미지 비율: 16:9 (1280x720px) 또는 유튜브 표준 썸네일 사이즈
- 구성: 단번에 시선을 사로잡는 단일 이미지
- 핵심 원칙: 작은 화면에서도 텍스트와 비주얼이 명확하게 읽혀야 함

## 2. 주제
봄동비빔밥의 비주얼 임팩트와 트렌드성을 활용하여,
클릭하지 않고는 못 배기는 호기심 유발형 썸네일

## 3. 타겟
- 주요 타겟: 유튜브/인스타그램 피드를 빠르게 스크롤하는 20~30대
- 관심사: 푸드 콘텐츠, 레시피, SNS 트렌드
- 소비 채널: 유튜브, 인스타그램 릴스, 틱톡

## 4. 톤앤매너
- 직관적이고 임팩트 있는 메시지
- 과장되지 않되 강한 호기심을 유발하는 표현
- 밝고 생동감 있는 비주얼

## 5. 전체 디자인 조건
1) 컬러 팔레트
- 배경 컬러: 강렬한 대비를 주는 비비드 연두(#8BC34A) 또는 크림 화이트(#FAFAF2)
- 텍스트 컬러: 진한 다크 그린(#1B5E20) 또는 화이트(#FFFFFF) (배경과 강한 대비)
- 포인트: 웜 코랄(#FF5722)로 강조 텍스트 처리
2) 타이포그래피
- 메인 텍스트: 초대형 Bold, 썸네일 전체 면적의 30~40% 차지
- 서브 텍스트: 메인의 50% 크기, 메인 텍스트 하단 또는 좌측 배치
- 폰트: 굵고 가독성 높은 산세리프체, 획이 두꺼운 것 선택
- 텍스트에 그림자 또는 외곽선 처리로 배경과 분리
3) 그래픽 스타일
- 봄동비빔밥 클로즈업 사진을 우측 또는 중앙에 크게 배치
- 텍스트는 좌측 또는 상단에 몰아서 명확한 영역 분리
- 화살표, 원형 강조 박스 등 시선 유도 그래픽 요소 활용
- 배경에 단색 또는 단순한 패턴으로 텍스트 가독성 확보
4) 레이아웃 원칙
- 좌측 40%: 메인 텍스트 영역
- 우측 60%: 핵심 비주얼 이미지
- 상단 모서리: 채널명 또는 로고 (소형)
- 전체적으로 3초 안에 내용이 파악되는 구성

## 6. 썸네일 구성 요소
- 메인 텍스트: 요즘 난리난 봄동비빔밥
- 서브 텍스트: 만들어봤습니다
- 핵심 비주얼: 봄동비빔밥 클로즈업, 윤기 있고 먹음직스러운 앵글
- 강조 요소: "봄동" 단어에 코랄 컬러 포인트 + 원형 강조 박스
- 디자인 포인트:
  · 메인 텍스트는 썸네일 좌측에 크게, 배경과 강한 대비로 처리
  · 음식 이미지는 우측에 배치, 클로즈업으로 식욕 자극
  · 전체 구성이 모바일 피드 스크롤 중에도 0.3초 안에 인식 가능하도록 설계
---예시 끝---

위 예시처럼:
- 썸네일은 단일 이미지이므로 슬라이드 구성 대신 '썸네일 구성 요소'로 작성합니다.
- 메인 텍스트는 짧고 강렬하게 (10자 내외), 클릭 욕구를 자극하는 문구로 작성합니다.
- 레이아웃 비율(좌/우 또는 상/하)을 반드시 수치로 명시합니다.
- 컬러는 HEX 코드(#XXXXXX)까지 명시하고 배경과 텍스트의 대비를 강조합니다.
- 디자인 포인트는 3줄 이상 구체적으로 작성합니다.`,
      structureGuide: `
## 6. 썸네일 구성 요소
  - 메인 텍스트 (10자 내외, 클릭 욕구를 자극하는 강렬한 문구)
  - 서브 텍스트 (선택, 메인 텍스트 보완)
  - 핵심 비주얼 설명 (배치할 이미지/일러스트 묘사)
  - 강조 요소 (화살표/원형 박스/포인트 컬러 등 시선 유도 장치)
  - 디자인 포인트 (레이아웃 비율, 가독성 처리, 시선 흐름 등 3줄 이상)`,
    },
  };

  // type에 해당하는 config 가져오기 (없으면 카드뉴스로 fallback)
  const config = typeConfig[type] || typeConfig['카드뉴스'];
  const roleByType = {
    카드뉴스: '10년 차 수석 마케터이자 전문 프롬프트 엔지니어',
    포스터: '오프라인/온라인 광고 캠페인 경험이 풍부한 시각 디자인 전문 프롬프트 엔지니어',
    썸네일: '구독자 100만 채널 운영 경험이 있는 SNS 콘텐츠 전문 프롬프트 엔지니어',
  };
  const role = roleByType[type] || roleByType['카드뉴스'];

  const systemPrompt = `
당신은 ${role}입니다.
사용자가 ChatGPT나 Gemini에 바로 복사/붙여넣기 할 수 있는 '완성형 ${type} 제작 프롬프트'를 작성하세요.

[절대 규칙]
1. 인사말, 요약, 부연 설명 없이 오직 프롬프트 텍스트만 출력합니다.
2. 마크다운 코드블록(백틱) 없이 텍스트로만 출력합니다.
3. 이모지는 사용하지 않습니다.
4. 출력 분량은 최소 1500자 이상이어야 합니다.

[품질 기준 — 아래 예시 수준으로 작성할 것]
${config.fewShot}
  `.trim();

  // ✅ STEP 4: userPrompt 구성
  const moodSentence = trendMoodSummary
    ? trendMoodSummary
    : `'${keyword}'에 대한 최신 트렌드와 대중의 관심이 높아지고 있는 분위기입니다.`;

  const imageLabel = {
    카드뉴스: '이미지 세트',
    포스터: '단일 이미지',
    썸네일: '단일 이미지',
  };
  const label = imageLabel[type] || '이미지';

  let userPrompt = `
다음 조건을 바탕으로 최적의 마케팅 콘텐츠 생성 프롬프트를 작성해 주세요.

[사용자 입력 정보]
- 메인 키워드: ${keyword}
- 콘텐츠 유형: ${type}
- 업종: ${industry}
- 제작 목적: ${context || '일반적인 정보 전달 및 홍보'}
- 타겟 고객: ${target || '일반 대중'}
- 추가 요구사항: ${otherRequests || '없음'}
  `;

  // keyword_summary 있으면 주입
  if (keywordSummary) {
    userPrompt += `
\n[키워드 배경 정보 — 주제 구성 및 본문 내용에 적극 반영하세요]
${keywordSummary}
    `;
  }

  // 뉴스 있으면 주입
  if (hasNews) {
    userPrompt += `
\n[최신 뉴스 — 트렌드 배경 소개에 적극 활용하세요]
${newsText}
    `;
  }

  // DB 댓글 있으면 주입
  if (hasComments) {
    userPrompt += `
\n[실제 댓글 데이터 — 아래 실제 댓글 중 긍정적인 것을 선별해서 활용하세요]
${trendData.examples.map((ex, i) => `  ${i + 1}. [${ex.platform}] "${ex.content}" (${ex.sentiment_label})`).join('\n')}
    `;
  }

  userPrompt += `
\n[출력 구조 — 위 예시와 동일한 형식과 밀도로 작성. 아래 첫 4줄은 수정 없이 그대로 출력에 포함할 것]

당신은 ${industry} 전문 카피라이터입니다.
실제 ${type} ${label}를 제작해 주세요. 목적은 ${context || '정보 전달'}이며, 타겟은 ${target || '일반 대중'}입니다.
최근 '${keyword}'에 대한 사람들의 반응은 ${moodSentence}
이러한 여론과 트렌드를 적극 활용하여 ${target || '일반 대중'}의 시선을 끄는 콘텐츠를 만들어 주세요.
${otherRequests ? `추가 요구사항: ${otherRequests} — 이 요구사항은 톤앤매너, 슬라이드 구성, 디자인 조건 등 전반에 걸쳐 반드시 반영하세요.` : ''}

[작성 조건]
## 1. 형식
## 2. 주제 (3개 이상, 문장형으로)
## 3. 타겟
## 4. 톤앤매너 (3개 이상)
## 5. 전체 디자인 조건
  1) 컬러 팔레트 (HEX 코드 포함)
  2) 타이포그래피
  3) 그래픽 스타일 (3개 이상)
  4) 레이아웃 원칙 (3개 이상)
${config.structureGuide}
  `.trim();

  // ✅ STEP 5: 스트리밍 생성
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.65,
    max_tokens: 3000,
    stream: true,
  });

  let fullContent = '';
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      fullContent += content;
      if (onStream) onStream(content);
    }
  }

  return fullContent;
};

exports.saveGeneratedPrompt = async (userEmail, outputType, content, keyword) => {
  const connection = await pool.getConnection(); // 안전한 다중 저장을 위한 커넥션 획득
  
  try {
    await connection.beginTransaction(); // 트랜잭션 시작

    // 1. MARKETING_OUTPUT에 프롬프트 저장
    const outputQuery = `
      INSERT INTO MARKETING_OUTPUT (user_email, output_type, content, created_at)
      VALUES (?, ?, ?, NOW())
    `;
    const [outputResult] = await connection.query(outputQuery, [userEmail, outputType, content]);
    const outputId = outputResult.insertId;

    if (keyword && keyword.trim() !== '') {
      const cleanKeyword = keyword.trim();
      
      // ✨ 핵심: 공백 차이로 못 찾는 경우를 방지하기 위해 띄어쓰기 무시하고 비교
      const keywordQuery = `
        SELECT keyword_id 
        FROM TREND_KEYWORD 
        WHERE REPLACE(keyword_name, ' ', '') = REPLACE(?, ' ', '') 
        LIMIT 1
      `;
      const [keywordRows] = await connection.query(keywordQuery, [cleanKeyword]);
      
      // DB에 일치하는 키워드가 있을 때만 매핑 (새로 생성하지 않음)
      if (keywordRows.length > 0) {
        const keywordId = keywordRows[0].keyword_id;
        
        const mappingQuery = `INSERT INTO KEYWORD_OUTPUT (output_id, keyword_id) VALUES (?, ?)`;
        await connection.query(mappingQuery, [outputId, keywordId]);
      }
    }

    await connection.commit(); // 트랜잭션 완료
    return outputId;

  } catch (error) {
    await connection.rollback(); // 에러 발생 시 롤백 (데이터 꼬임 방지)
    throw error;
  } finally {
    connection.release(); // 커넥션 반환
  }
};

// 2️⃣ 마이페이지용 프롬프트 목록 조회 (JOIN 추가)
exports.getPromptsByUserEmail = async (userEmail) => {
  // LEFT JOIN을 사용해 키워드가 없는 경우에도 프롬프트가 조회되도록 처리
  const query = `
    SELECT 
      m.output_id AS id, 
      m.output_type AS type, 
      m.content AS prompt, 
      m.created_at AS savedAt,
      k.keyword_name AS keyword  -- ✨ 키워드명 추가 조회
    FROM MARKETING_OUTPUT m
    LEFT JOIN KEYWORD_OUTPUT ko ON m.output_id = ko.output_id
    LEFT JOIN TREND_KEYWORD k ON ko.keyword_id = k.keyword_id
    WHERE m.user_email = ? 
    ORDER BY m.created_at DESC
  `;
  const [rows] = await pool.query(query, [userEmail]);
  return rows;
};

// 프롬프트 삭제
exports.deletePromptById = async (outputId, userEmail) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction(); // 트랜잭션 시작
    
    // ✨ 핵심 1: 자식 테이블(KEYWORD_OUTPUT)에서 매핑된 데이터를 먼저 삭제
    await connection.query(`DELETE FROM KEYWORD_OUTPUT WHERE output_id = ?`, [outputId]);
    
    // ✨ 핵심 2: 부모 테이블(MARKETING_OUTPUT)에서 프롬프트 삭제
    const deleteQuery = `DELETE FROM MARKETING_OUTPUT WHERE output_id = ? AND user_email = ?`;
    const [result] = await connection.query(deleteQuery, [outputId, userEmail]);
    
    await connection.commit(); // 트랜잭션 성공
    return result.affectedRows > 0;
    
  } catch (error) {
    await connection.rollback(); // 에러 시 롤백
    throw error;
  } finally {
    connection.release(); // 커넥션 반환
  }
};