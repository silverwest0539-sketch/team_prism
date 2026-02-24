export const PROMPT_TEMPLATE_OPTIONS = [
  {
    key: 'trend_reaction',
    name: '트렌드 반응 프롬프트',
    description: '급상승 이슈에 빠르게 반응하는 프롬프트 생성 유형',
    prompt: `당신은 트렌드 반응형 콘텐츠를 만들기 위한 프롬프트 엔지니어입니다.
아래 정보를 바탕으로 "콘텐츠 생성용 최종 프롬프트"를 작성하세요.

[입력 정보]
- 키워드: {{keyword}}
- 콘텐츠 유형: {{type}}
- 업종: {{industry}}
- 목적: {{purpose}}
- 타겟: {{target}}
- 기타 요청: {{otherRequests}}

[프롬프트 설계 지시]
1. 생성 모델의 역할을 트렌드 반응형 카피 전문가로 지정
2. 결과물 목표를 "강한 훅 + 지금의 맥락 + 행동 유도"로 명시
3. 톤은 짧고 리듬감 있게 유지하도록 지시
4. 금지사항(과장/반복/불명확 표현)을 포함

[출력 형식]
- 최종 프롬프트 1개
- 부가 설명/해설/예시 콘텐츠 출력 금지`,
  },
  {
    key: 'practical_tip',
    name: '정보형 프롬프트',
    description: '방법·정리·가이드 중심 프롬프트 생성 유형',
    prompt: `당신은 정보형 콘텐츠를 만들기 위한 프롬프트 엔지니어입니다.
아래 정보를 바탕으로 "정보/꿀팁형 콘텐츠 생성용 최종 프롬프트"를 작성하세요.

[입력 정보]
- 키워드: {{keyword}}
- 콘텐츠 유형: {{type}}
- 업종: {{industry}}
- 목적: {{purpose}}
- 타겟: {{target}}
- 기타 요청: {{otherRequests}}

[프롬프트 설계 지시]
1. 생성 모델 역할을 실용 정보형 에디터로 지정
2. 결과물 구조를 "문제 인식 -> 실행 팁 -> 요약 -> CTA"로 지정
3. 톤은 과장 없이 명확하고 신뢰감 있게 유지
4. 저장/공유 유도 문구를 포함하도록 지시

[출력 형식]
- 최종 프롬프트 1개
- 부가 설명/해설/예시 콘텐츠 출력 금지`,
  },
  {
    key: 'promo_conversion',
    name: '전환형 프롬프트',
    description: '이벤트/할인/런칭에 최적화된 프롬프트 생성 유형',
    prompt: `당신은 전환 중심 마케팅 콘텐츠를 만들기 위한 프롬프트 엔지니어입니다.
아래 정보를 바탕으로 "프로모션 전환형 콘텐츠 생성용 최종 프롬프트"를 작성하세요.

[입력 정보]
- 키워드: {{keyword}}
- 콘텐츠 유형: {{type}}
- 업종: {{industry}}
- 목적: {{purpose}}
- 타겟: {{target}}
- 기타 요청: {{otherRequests}}

[프롬프트 설계 지시]
1. 생성 모델 역할을 전환형 카피 전문가로 지정
2. 결과물에 혜택, 기간, 조건, CTA가 반드시 포함되게 지시
3. 클릭/구매 행동 유도를 명확히 요구
4. 불필요한 수식 없이 간결한 문장으로 제한

[출력 형식]
- 최종 프롬프트 1개
- 부가 설명/해설/예시 콘텐츠 출력 금지`,
  },
  {
    key: 'review_trust',
    name: '신뢰형 프롬프트',
    description: '후기·비교·체감 포인트를 강조하는 프롬프트 생성 유형',
    prompt: `당신은 리뷰/신뢰형 콘텐츠를 만들기 위한 프롬프트 엔지니어입니다.
아래 정보를 바탕으로 "리뷰/신뢰형 콘텐츠 생성용 최종 프롬프트"를 작성하세요.

[입력 정보]
- 키워드: {{keyword}}
- 콘텐츠 유형: {{type}}
- 업종: {{industry}}
- 목적: {{purpose}}
- 타겟: {{target}}
- 기타 요청: {{otherRequests}}

[프롬프트 설계 지시]
1. 생성 모델 역할을 신뢰형 카피 에디터로 지정
2. 체감 변화/비교 포인트를 중심으로 쓰게 지시
3. 허위/과장 금지 규칙과 구체적 사용 장면 묘사 규칙 포함
4. 문의/상담/체험 CTA를 포함하도록 지시

[출력 형식]
- 최종 프롬프트 1개
- 부가 설명/해설/예시 콘텐츠 출력 금지`,
  },
  {
    key: 'community_engagement',
    name: '참여형 프롬프트',
    description: '댓글·투표·공유를 이끄는 프롬프트 생성 유형',
    prompt: `당신은 참여형 콘텐츠를 만들기 위한 프롬프트 엔지니어입니다.
아래 정보를 바탕으로 "참여 유도형 콘텐츠 생성용 최종 프롬프트"를 작성하세요.

[입력 정보]
- 키워드: {{keyword}}
- 콘텐츠 유형: {{type}}
- 업종: {{industry}}
- 목적: {{purpose}}
- 타겟: {{target}}
- 기타 요청: {{otherRequests}}

[프롬프트 설계 지시]
1. 생성 모델 역할을 커뮤니티 소셜 에디터로 지정
2. 질문형 훅과 선택지/의견 유도 구조를 강제
3. 댓글/공유/태그 유도 문구를 포함하도록 지시
4. 가볍고 참여하기 쉬운 톤을 유지하도록 제한

[출력 형식]
- 최종 프롬프트 1개
- 부가 설명/해설/예시 콘텐츠 출력 금지`,
  },
];

const containsAny = (text, terms) => terms.some((term) => text.includes(term));

export const recommendPromptTemplate = ({
  keyword = '',
  type = '',
  industry = '',
  context = '',
  otherRequests = '',
}) => {
  const merged = `${keyword} ${type} ${industry} ${context} ${otherRequests}`.toLowerCase();

  if (containsAny(merged, ['할인', '세일', '특가', '이벤트', '쿠폰', '증정', '런칭', '오픈'])) {
    return {
      key: 'promo_conversion',
      reason: '할인/이벤트 성격 키워드가 감지되어 전환형 프롬프트 유형을 추천합니다.',
    };
  }

  if (containsAny(merged, ['리뷰', '후기', '비교', '사용기', '전후', '추천'])) {
    return {
      key: 'review_trust',
      reason: '리뷰/신뢰 기반 메시지에 맞는 프롬프트 유형을 추천합니다.',
    };
  }

  if (containsAny(merged, ['방법', '꿀팁', '가이드', '정리', '체크리스트', '노하우', '비법'])) {
    return {
      key: 'practical_tip',
      reason: '정보 전달 목적에 맞는 정보형 프롬프트 유형을 추천합니다.',
    };
  }

  if (
    containsAny(merged, ['챌린지', '밈', '숏츠', '릴스', '유행', '바이럴', '트렌드']) ||
    (type || '').includes('썸네일')
  ) {
    return {
      key: 'trend_reaction',
      reason: '확산형 주제/포맷으로 판단되어 트렌드 반응 프롬프트 유형을 추천합니다.',
    };
  }

  if (containsAny(merged, ['투표', '참여', '댓글', '공유', '질문'])) {
    return {
      key: 'community_engagement',
      reason: '참여 유도 중심 표현이 감지되어 참여형 프롬프트 유형을 추천합니다.',
    };
  }

  if ((industry || '').includes('교육') || (industry || '').includes('클래스')) {
    return {
      key: 'practical_tip',
      reason: '업종 특성상 설명형/정보형 프롬프트 구성이 유리해 추천합니다.',
    };
  }

  return {
    key: 'trend_reaction',
    reason: '기본 프롬프트 유형으로 트렌드 반응형을 추천합니다.',
  };
};

export const getTemplateMeta = (key) =>
  PROMPT_TEMPLATE_OPTIONS.find((item) => item.key === key) || PROMPT_TEMPLATE_OPTIONS[0];

const PLACEHOLDER_KEYS = ['keyword', 'type', 'industry', 'purpose', 'target', 'otherRequests'];

export const interpolatePromptTemplate = (templateText, values = {}) => {
  const safeValues = PLACEHOLDER_KEYS.reduce((acc, key) => {
    const rawValue = values[key];
    const fallback =
      key === 'otherRequests'
        ? '없음'
        : key === 'keyword'
          ? '주제 키워드'
          : key === 'type'
            ? '콘텐츠 유형'
            : key === 'industry'
              ? '업종'
              : key === 'purpose'
                ? '목적'
                : '타겟';

    acc[key] = String(rawValue || '').trim() || fallback;
    return acc;
  }, {});

  let result = String(templateText || '');
  PLACEHOLDER_KEYS.forEach((key) => {
    result = result.replaceAll(`{{${key}}}`, safeValues[key]);
  });
  return result;
};

const CREATION_PRESET_RULES = [
  {
    key: 'creator_youtube',
    terms: ['유튜브', 'youtube', '쇼츠', 'shorts', '릴스', 'reels', '썸네일', '영상', '브이로그'],
    preset: {
      type: '썸네일',
      industry: '크리에이터/유튜브',
      purpose: '클릭률을 높이는 강한 훅 중심으로 영상 유입을 확대',
      target: '10~30대 영상 소비층, 트렌드 반응이 빠른 사용자',
      reason: '영상/채널 키워드가 감지되어 크리에이터 운영형 세팅을 적용합니다.',
    },
  },
  {
    key: 'cafe_dessert',
    terms: ['카페', '디저트', '커피', '베이커리', '빵', '라떼', '케이크'],
    preset: {
      type: '카드뉴스',
      industry: '카페/디저트',
      purpose: '신메뉴 관심도를 높이고 오프라인 방문 및 재방문을 유도',
      target: '20~30대 직장인, 주말 카페 탐색 사용자',
      reason: '카페/디저트 성격 키워드가 감지되어 매장 방문형 세팅을 적용합니다.',
    },
  },
  {
    key: 'food_restaurant',
    terms: ['맛집', '식당', '메뉴', '레시피', '먹방', '배달', '요리'],
    preset: {
      type: '카드뉴스',
      industry: '맛집/요식업',
      purpose: '메뉴 강점을 명확히 전달해 예약·주문 전환을 높임',
      target: '식사 장소를 탐색하는 20~40대 지역 사용자',
      reason: '요식/메뉴 중심 키워드가 감지되어 주문 전환형 세팅을 적용합니다.',
    },
  },
  {
    key: 'beauty_hair',
    terms: ['헤어', '염색', '펌', '네일', '뷰티', '메이크업', '스타일링'],
    preset: {
      type: '카드뉴스',
      industry: '뷰티/헤어샵',
      purpose: '시술 포인트를 강조해 예약 문의 전환을 유도',
      target: '외모 관리에 관심 높은 20~30대 여성/남성 고객',
      reason: '뷰티/헤어 키워드가 감지되어 예약 유도형 세팅을 적용합니다.',
    },
  },
  {
    key: 'cosmetics_skincare',
    terms: ['스킨케어', '토너', '세럼', '크림', '화장품', '피부', '보습'],
    preset: {
      type: '카드뉴스',
      industry: '화장품/스킨케어',
      purpose: '효능 포인트와 사용 상황을 연결해 구매 신뢰를 강화',
      target: '피부 고민 기반 제품을 비교하는 20~40대 소비자',
      reason: '스킨케어/화장품 키워드가 감지되어 신뢰형 세팅을 적용합니다.',
    },
  },
  {
    key: 'fashion',
    terms: ['패션', '코디', '룩북', '신상', '의류', 'ootd', '스타일'],
    preset: {
      type: '카드뉴스',
      industry: '패션/의류',
      purpose: '착장 포인트를 짧고 강하게 전달해 저장/구매 전환을 유도',
      target: '트렌디한 스타일을 찾는 10~30대 패션 관심층',
      reason: '패션/코디 키워드가 감지되어 스타일 제안형 세팅을 적용합니다.',
    },
  },
  {
    key: 'fitness',
    terms: ['운동', '헬스', '다이어트', 'pt', '근력', '체지방', '식단'],
    preset: {
      type: '카드뉴스',
      industry: '헬스/피트니스',
      purpose: '실행 가능한 루틴을 제시해 상담/체험 등록을 유도',
      target: '건강 관리 니즈가 높은 20~40대 직장인',
      reason: '운동/다이어트 키워드가 감지되어 실행 유도형 세팅을 적용합니다.',
    },
  },
  {
    key: 'education',
    terms: ['공부', '학습', '강의', '자격증', '취업', '영어', '클래스'],
    preset: {
      type: '카드뉴스',
      industry: '교육/클래스',
      purpose: '학습 성과와 커리큘럼 강점을 전달해 수강 문의를 확대',
      target: '자기계발 및 취업 준비 중인 10~30대 학습층',
      reason: '교육/학습 키워드가 감지되어 수강 전환형 세팅을 적용합니다.',
    },
  },
  {
    key: 'travel',
    terms: ['여행', '숙소', '호텔', '항공', '투어', '휴가', '국내여행'],
    preset: {
      type: '카드뉴스',
      industry: '여행/숙박',
      purpose: '여행 동선을 단순화해 예약/문의 전환을 유도',
      target: '주말·연휴 여행을 계획하는 20~40대 사용자',
      reason: '여행/숙박 키워드가 감지되어 예약 유도형 세팅을 적용합니다.',
    },
  },
  {
    key: 'living',
    terms: ['리빙', '인테리어', '가구', '집꾸미기', '수납', '홈스타일링'],
    preset: {
      type: '카드뉴스',
      industry: '리빙/인테리어',
      purpose: '공간 문제 해결 포인트를 보여주며 상품 관심도를 높임',
      target: '신혼/1인 가구 및 홈 인테리어 관심층',
      reason: '리빙/인테리어 키워드가 감지되어 문제해결형 세팅을 적용합니다.',
    },
  },
  {
    key: 'joint_market',
    terms: ['공구', '공동구매', '단독딜', '한정수량', '품절임박'],
    preset: {
      type: '포스터',
      industry: '공구/마켓',
      purpose: '한정성/마감 포인트를 강조해 즉시 구매를 유도',
      target: '가격 민감도가 높은 20~40대 실속형 소비자',
      reason: '공동구매 성격 키워드가 감지되어 마감 유도형 세팅을 적용합니다.',
    },
  },
  {
    key: 'ecommerce',
    terms: ['쇼핑', '특가', '쿠폰', '세일', '할인', '행사', '무료배송'],
    preset: {
      type: '포스터',
      industry: '온라인 쇼핑몰',
      purpose: '혜택/마감 정보를 명확히 제시해 클릭·구매 전환을 높임',
      target: '혜택 비교 후 구매하는 20~40대 온라인 소비자',
      reason: '프로모션 키워드가 감지되어 전환 집중형 세팅을 적용합니다.',
    },
  },
];

const DEFAULT_CREATION_PRESET = {
  type: '카드뉴스',
  industry: '카페/디저트',
  purpose: '키워드 핵심 포인트를 간결하게 전달해 관심과 문의를 확대',
  target: '20~30대 트렌드 민감 사용자',
  reason: '기본 자동 추천 세팅을 적용합니다.',
};

export const recommendCreationPreset = ({ keyword = '' }) => {
  const normalizedKeyword = String(keyword || '').toLowerCase().trim();
  if (!normalizedKeyword) return DEFAULT_CREATION_PRESET;

  const matchedRule = CREATION_PRESET_RULES.find(({ terms }) =>
    containsAny(normalizedKeyword, terms),
  );

  return matchedRule ? matchedRule.preset : DEFAULT_CREATION_PRESET;
};
