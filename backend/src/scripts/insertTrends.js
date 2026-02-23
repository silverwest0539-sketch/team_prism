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
const TARGET_DATE = '20260223';
const PREV_DATE   = '20260222';

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

  console.log(`✅ 키워드 ${keywordsData.length}개 로드`);
  console.log(`✅ 타임라인 ${Object.keys(timelineData).length}개 키워드 로드`);

  let keywordCount = 0;
  let exampleCount = 0;
  let statCount    = 0;

  // ── 1. TREND_KEYWORD + USAGE_EXAMPLE + KEYWORD_EXAMPLE ──
  console.log('\n📌 TREND_KEYWORD & USAGE_EXAMPLE INSERT 중...');

  for (const item of keywordsData) {
    const keyword = item.Keyword;

    // TREND_KEYWORD - 없으면 INSERT, 있으면 무시
    await db.execute(
      `INSERT IGNORE INTO TREND_KEYWORD (keyword_name) VALUES (?)`,
      [keyword]
    );

    // keyword_id 조회
    const [kwRows] = await db.execute(
      `SELECT keyword_id FROM TREND_KEYWORD WHERE keyword_name = ?`,
      [keyword]
    );
    if (kwRows.length === 0) {
      console.warn(`  ⚠️  keyword_id 조회 실패: ${keyword} (건너뜀)`);
      continue;
    }
    const keywordId = kwRows[0].keyword_id;
    keywordCount++;

    // USAGE_EXAMPLE INSERT + KEYWORD_EXAMPLE 매핑
    const examples = item.Examples || {};
    for (const [platform, commentList] of Object.entries(examples)) {
      for (const ex of commentList) {
        const content = ex.comment || '';
        const url     = ex.link    || '';
        if (!content) continue;

        // USAGE_EXAMPLE INSERT
        const [result] = await db.execute(
          `INSERT INTO USAGE_EXAMPLE (platform, url, content, collected_date)
           VALUES (?, ?, ?, ?)`,
          [platform, url, content, collectedDate]
        );
        const exampleId = result.insertId;

        // KEYWORD_EXAMPLE 매핑 INSERT
        await db.execute(
          `INSERT IGNORE INTO KEYWORD_EXAMPLE (keyword_id, example_id)
           VALUES (?, ?)`,
          [keywordId, exampleId]
        );
        exampleCount++;
      }
    }
  }

  console.log(`  ✅ TREND_KEYWORD: ${keywordCount}개 처리`);
  console.log(`  ✅ USAGE_EXAMPLE: ${exampleCount}개 INSERT`);

  // ── 2. KEYWORD_STATS ───────────────────────────────
  console.log('\n📌 KEYWORD_STATS INSERT 중...');

  for (const [keyword, dateCounts] of Object.entries(timelineData)) {
    // keyword_id 조회 (없으면 INSERT)
    await db.execute(
      `INSERT IGNORE INTO TREND_KEYWORD (keyword_name) VALUES (?)`,
      [keyword]
    );
    const [kwRows] = await db.execute(
      `SELECT keyword_id FROM TREND_KEYWORD WHERE keyword_name = ?`,
      [keyword]
    );
    if (kwRows.length === 0) {
      console.warn(`  ⚠️  keyword_id 조회 실패: ${keyword} (건너뜀)`);
      continue;
    }
    const keywordId = kwRows[0].keyword_id;

    for (const [dateStr, mentions] of Object.entries(dateCounts)) {
      const statDate = toSqlDate(dateStr);

      await db.execute(
        `INSERT INTO KEYWORD_STATS (keyword_id, stat_date, mention_count)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE mention_count = VALUES(mention_count)`,
        [keywordId, statDate, mentions]
      );
      statCount++;
    }
  }

  console.log(`  ✅ KEYWORD_STATS: ${statCount}개 INSERT/UPDATE`);
  console.log('\n✅ 전체 완료');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});