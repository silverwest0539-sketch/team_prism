// src/scripts/insertTrends.js
//
// 사용법:
//   node src/scripts/insertTrends.js
//
// 실행 전 data/ 폴더에 아래 두 파일을 넣어주세요:
//   - trending_keywords_{PREV_DATE}_{TARGET_DATE}.json
//   - keyword_timeline_{TARGET_DATE}.json

const fs   = require('fs');
const path = require('path');
const db   = require('../database');

// ===========================
// 설정
// ===========================
const TARGET_DATE = '20260221';
const PREV_DATE   = '20260220';

const KEYWORDS_DIR      = path.join(__dirname, '../../data/keywords');
const TIMELINE_DIR      = path.join(__dirname, '../../data/mention_timeline');
const KEYWORDS_FILE = path.join(KEYWORDS_DIR, `trending_keywords_${PREV_DATE}_${TARGET_DATE}.json`);
const TIMELINE_FILE = path.join(TIMELINE_DIR, `keyword_timeline_${TARGET_DATE}.json`);

// '20260223' → '2026-02-23'
function toSqlDate(dateStr) {
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

async function main() {
  // ── 파일 로드 ─────────────────────────────────────
  if (!fs.existsSync(KEYWORDS_FILE)) {
    console.error(`❌ 파일 없음: ${KEYWORDS_FILE}`);
    process.exit(1);
  }
  if (!fs.existsSync(TIMELINE_FILE)) {
    console.error(`❌ 파일 없음: ${TIMELINE_FILE}`);
    process.exit(1);
  }

  const keywordsData  = JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf-8'));
  const timelineData  = JSON.parse(fs.readFileSync(TIMELINE_FILE, 'utf-8'));
  const collectedDate = toSqlDate(TARGET_DATE);
  const targetSqlDate = toSqlDate(TARGET_DATE);

  console.log(`✅ 키워드 ${keywordsData.length}개 로드`);
  console.log(`✅ 타임라인 ${Object.keys(timelineData).length}개 키워드 로드`);

  // ── 1. TREND_KEYWORD 전체 upsert ──────────────────
  console.log('\n📌 TREND_KEYWORD INSERT 중...');
  const allKeywords = [
    ...new Set([
      ...keywordsData.map(item => item.Keyword),
      ...Object.keys(timelineData),
    ])
  ];

  const keywordValues = allKeywords.map(kw => [kw]);
  await db.query(
    `INSERT IGNORE INTO TREND_KEYWORD (keyword_name) VALUES ?`,
    [keywordValues]
  );

  // keyword_id 한 번에 조회
  const [kwRows] = await db.query(
    `SELECT keyword_id, keyword_name FROM TREND_KEYWORD WHERE keyword_name IN (?)`,
    [allKeywords]
  );
  const keywordIdMap = {};
  kwRows.forEach(row => { keywordIdMap[row.keyword_name] = row.keyword_id; });

  // trend_score 맵 생성 (keyword → Trend_Score)
  const trendScoreMap = {};
  keywordsData.forEach(item => {
    trendScoreMap[item.Keyword] = item.Trend_Score || 0;
  });

  console.log(`  ✅ TREND_KEYWORD: ${allKeywords.length}개 처리`);

  // ── 2. USAGE_EXAMPLE + KEYWORD_EXAMPLE bulk insert ─
  console.log('\n📌 USAGE_EXAMPLE INSERT 중...');

  let exampleCount = 0;

  for (const item of keywordsData) {
    const keywordId = keywordIdMap[item.Keyword];
    if (!keywordId) continue;

    const examples = item.Examples || {};
    const exampleValues = [];

    for (const [platform, commentList] of Object.entries(examples)) {
      for (const ex of commentList) {
        const content = ex.comment || '';
        const url     = ex.link    || '';
        if (!content) continue;
        exampleValues.push([platform, url, content, collectedDate]);
      }
    }

    if (exampleValues.length === 0) continue;

    const [result] = await db.query(
      `INSERT INTO USAGE_EXAMPLE (platform, url, content, collected_date) VALUES ?`,
      [exampleValues]
    );

    const firstId      = result.insertId;
    const affectedRows = result.affectedRows;

    const mappingValues = [];
    for (let i = 0; i < affectedRows; i++) {
      mappingValues.push([keywordId, firstId + i]);
    }
    await db.query(
      `INSERT IGNORE INTO KEYWORD_EXAMPLE (keyword_id, example_id) VALUES ?`,
      [mappingValues]
    );

    exampleCount += affectedRows;
  }

  console.log(`  ✅ USAGE_EXAMPLE: ${exampleCount}개 INSERT`);

  // ── 3. KEYWORD_STATS bulk upsert ──────────────────
  // timeline 데이터: mention_count만, trend_score는 NULL
  // TARGET_DATE 행: trend_score도 같이 저장
  console.log('\n📌 KEYWORD_STATS INSERT 중...');

  const statsValues = [];

  for (const [keyword, dateCounts] of Object.entries(timelineData)) {
    const keywordId  = keywordIdMap[keyword];
    if (!keywordId) continue;

    for (const [dateStr, mentions] of Object.entries(dateCounts)) {
      const statDate   = toSqlDate(dateStr);
      // TARGET_DATE 날짜면 trend_score 포함, 나머지는 NULL
      const trendScore = statDate === targetSqlDate ? (trendScoreMap[keyword] ?? null) : null;
      statsValues.push([keywordId, statDate, mentions, trendScore]);
    }
  }

  if (statsValues.length > 0) {
    await db.query(
      `INSERT INTO KEYWORD_STATS (keyword_id, stat_date, mention_count, trend_score) VALUES ?
       ON DUPLICATE KEY UPDATE
         mention_count = VALUES(mention_count),
         trend_score   = VALUES(trend_score)`,
      [statsValues]
    );
  }

  console.log(`  ✅ KEYWORD_STATS: ${statsValues.length}개 INSERT/UPDATE`);
  console.log('\n✅ 전체 완료');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});