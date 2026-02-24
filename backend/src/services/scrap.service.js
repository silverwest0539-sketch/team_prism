const db = require('../database');

// 1. 스크랩 목록 조회
exports.getScrapsByUser = async (email) => {
  // DB JOIN을 사용하여 스크랩한 날짜와 키워드 이름을 한 번에 가져옵니다.
  const [rows] = await db.execute(`
    SELECT s.scrapped_at, k.keyword_name 
    FROM USER_KEYWORD_SCRAP s
    JOIN TREND_KEYWORD k ON s.keyword_id = k.keyword_id
    WHERE s.user_email = ?
    ORDER BY s.scrapped_at DESC
  `, [email]);
  
  return rows.map(row => ({
    keyword: row.keyword_name, 
    rank: '-', // 실시간 랭킹은 별도 집계 필요
    type: 'trend',
    desc: '급상승 트렌드',
    savedAt: row.scrapped_at,
    tags: [], 
    memo: ''  
  }));
};

// 2. 스크랩 추가
exports.addScrap = async (email, keywordName) => {
  // 1. 프론트에서 보낸 문자열(예: '봄동비빔밥')로 실제 DB의 keyword_id(숫자)를 찾음
  const [keywordRows] = await db.execute(
    'SELECT keyword_id FROM TREND_KEYWORD WHERE keyword_name = ?', 
    [keywordName]
  );
  
  if (keywordRows.length === 0) {
    throw new Error("DB에 해당 키워드가 존재하지 않습니다.");
  }
  
  const realKeywordId = keywordRows[0].keyword_id;

  // 2. 중복 검사 후 스크랩 저장
  const [exists] = await db.execute(
    'SELECT * FROM USER_KEYWORD_SCRAP WHERE user_email = ? AND keyword_id = ?', 
    [email, realKeywordId]
  );
  
  if (exists.length === 0) {
    await db.execute(
      'INSERT INTO USER_KEYWORD_SCRAP (user_email, keyword_id, scrapped_at) VALUES (?, ?, NOW())', 
      [email, realKeywordId]
    );
  }
};

// 3. 스크랩 단일 삭제
exports.deleteScrap = async (email, keywordName) => {
  // 1. 문자열로 숫자 ID 찾기
  const [keywordRows] = await db.execute(
    'SELECT keyword_id FROM TREND_KEYWORD WHERE keyword_name = ?', 
    [keywordName]
  );
  
  if (keywordRows.length === 0) return; // 지울 게 없으면 그냥 종료
  const realKeywordId = keywordRows[0].keyword_id;

  // 2. 삭제 진행
  await db.execute(
    'DELETE FROM USER_KEYWORD_SCRAP WHERE user_email = ? AND keyword_id = ?', 
    [email, realKeywordId]
  );
};

// 4. 스크랩 여부 확인 (별 아이콘 노란색 표시용)
exports.checkScrap = async (email, keywordName) => {
  // 1. 문자열로 숫자 ID 찾기
  const [keywordRows] = await db.execute(
    'SELECT keyword_id FROM TREND_KEYWORD WHERE keyword_name = ?', 
    [keywordName]
  );
  
  if (keywordRows.length === 0) return false;
  const realKeywordId = keywordRows[0].keyword_id;

  // 2. 스크랩 여부 체크
  const [rows] = await db.execute(
    'SELECT * FROM USER_KEYWORD_SCRAP WHERE user_email = ? AND keyword_id = ?', 
    [email, realKeywordId]
  );
  return rows.length > 0;
};