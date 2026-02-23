const db = require('../database');
const { findKeywordOverAll } = require('../dataLoader');

// 1. 스크랩 목록 조회
exports.getScrapsByUser = async (email) => {
  const [rows] = await db.execute(
    'SELECT * FROM USER_KEYWORD_SCRAP WHERE user_email = ? ORDER BY scrapped_at DESC', 
    [email]
  );
  
  return rows.map(row => {
    const keywordInfo = findKeywordOverAll(row.keyword_id) || {};
    return {
      keyword: row.keyword_id, 
      rank: keywordInfo.Rank || '?',
      type: keywordInfo.type || 'trend',
      desc: keywordInfo.desc || '요약 정보 없음',
      savedAt: row.scrapped_at,
      tags: [], 
      memo: ''  
    };
  });
};

// 2. 스크랩 추가
exports.addScrap = async (email, keyword) => {
  // 1. 키워드 테이블에서 '발렌타인'에 해당하는 숫자 ID를 찾습니다.
  // 🚨 주의: 'KEYWORDS' 테이블 이름과 'name' 컬럼명은 실제 DB에 맞게 수정해 주세요!
  const [keywordRows] = await db.execute(
    'SELECT id FROM KEYWORDS WHERE name = ?', 
    [keyword]
  );
  
  if (keywordRows.length === 0) {
    // DB에 해당 키워드가 아예 없는 경우 에러 처리
    throw new Error("DB에 해당 키워드가 존재하지 않습니다.");
  }
  
  const realKeywordId = keywordRows[0].id; // 찾아낸 실제 숫자 ID (예: 15)

  // 2. 찾아낸 숫자 ID를 사용하여 스크랩 중복 검사 및 추가를 진행합니다.
  const [exists] = await db.execute(
    'SELECT * FROM USER_KEYWORD_SCRAP WHERE user_email = ? AND keyword_id = ?', 
    [email, realKeywordId] // keyword 대신 realKeywordId 사용
  );
  
  if (exists.length === 0) {
    await db.execute(
      'INSERT INTO USER_KEYWORD_SCRAP (user_email, keyword_id, scrapped_at) VALUES (?, ?, NOW())', 
      [email, realKeywordId] // keyword 대신 realKeywordId 사용
    );
  }
};

// 3. 스크랩 단일 삭제
exports.deleteScrap = async (email, keyword) => {
  await db.execute(
    'DELETE FROM USER_KEYWORD_SCRAP WHERE user_email = ? AND keyword_id = ?', 
    [email, keyword]
  );
};

// 4. 스크랩 여부 확인
exports.checkScrap = async (email, keyword) => {
  const [rows] = await db.execute(
    'SELECT * FROM USER_KEYWORD_SCRAP WHERE user_email = ? AND keyword_id = ?', 
    [email, keyword]
  );
  return rows.length > 0;
};