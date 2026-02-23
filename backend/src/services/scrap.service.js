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
  const [exists] = await db.execute(
    'SELECT * FROM USER_KEYWORD_SCRAP WHERE user_email = ? AND keyword_id = ?', 
    [email, keyword]
  );
  
  if (exists.length === 0) {
    await db.execute(
      'INSERT INTO USER_KEYWORD_SCRAP (user_email, keyword_id, scrapped_at) VALUES (?, ?, NOW())', 
      [email, keyword]
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