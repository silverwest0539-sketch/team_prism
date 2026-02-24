// src/scripts/insertTrends.js
//
// 사용법:
//   node src/scripts/insertTrends.js
//
// 실행 전 data/ 폴더에 아래 파일들을 넣어주세요:
//   - trending_keywords_{PREV_DATE}_{TARGET_DATE}.json
//   - keyword_stats_{TARGET_DATE}.json               ← 통합 키워드 날짜별 언급량
//   - trending_by_platform_{PREV_DATE}_{TARGET_DATE}.json
//   - platform_keyword_timeline_{TARGET_DATE}.json   ← 플랫폼 신규 키워드 날짜별 언급량

const fs   = require('fs');
const path = require('path');
const db   = require('../database');

// ===========================
// 설정
// ===========================
const TARGET_DATE = '20260224';
const PREV_DATE   = '20260223';

const KEYWORDS_DIR           = path.join(__dirname, '../../data/keywords');
const KEYWORDS_TIMELINE_DIR  = path.join(__dirname, '../../data/keywords_mention_timeline');
const PLATFORM_DIR           = path.join(__dirname, '../../data/platform_keywords');
const PLATFORM_TIMELINE_DIR  = path.join(__dirname, '../../data/platform_mention_timeline');
const KEYWORDS_FILE          = path.join(KEYWORDS_DIR,          `trending_keywords_${PREV_DATE}_${TARGET_DATE}.json`);
const KEYWORD_STATS_FILE     = path.join(KEYWORDS_TIMELINE_DIR, `keyword_timeline_${TARGET_DATE}.json`);
const PLATFORM_FILE          = path.join(PLATFORM_DIR,          `trending_by_platform_${PREV_DATE}_${TARGET_DATE}.json`);
const PLATFORM_TIMELINE_FILE = path.join(PLATFORM_TIMELINE_DIR, `platform_keyword_timeline_${TARGET_DATE}.json`);

// 플랫폼명 → score 컬럼명 매핑
const PLATFORM_SCORE_COL = {
  youtube:  'youtube_score',
  fmkorea:  'fmkorea_score',
  ruliweb:  'ruliweb_score',
  nate:     'nate_score',
  theqoo:   'theqoo_score',
  dcinside: 'dcinside_score',
};

// '20260224' → '2026-02-24'
function toSqlDate(dateStr) {
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

// null → 0 변환 헬퍼
function toCount(val) {
  return val === null || val === undefined ? 0 : val;
}

// USAGE_EXAMPLE + KEYWORD_EXAMPLE bulk insert 헬퍼
async function insertExamples(exampleRows) {
  if (exampleRows.length === 0) return 0;

  const exampleValues = exampleRows.map(r => [r.platform, r.url, r.content, r.collectedDate]);
  const [result] = await db.query(
    `INSERT INTO USAGE_EXAMPLE (platform, url, content, collected_date) VALUES ?`,
    [exampleValues]
  );

  const firstId      = result.insertId;
  const affectedRows = result.affectedRows;

  const mappingValues = [];
  for (let i = 0; i < affectedRows; i++) {
    mappingValues.push([exampleRows[i].keywordId, firstId + i]);
  }
  await db.query(
    `INSERT IGNORE INTO KEYWORD_EXAMPLE (keyword_id, example_id) VALUES ?`,
    [mappingValues]
  );

  return affectedRows;
}

async function main() {
  // ── 파일 로드 ─────────────────────────────────────
  for (const f of [KEYWORDS_FILE, KEYWORD_STATS_FILE, PLATFORM_FILE, PLATFORM_TIMELINE_FILE]) {
    if (!fs.existsSync(f)) {
      console.error(`❌ 파일 없음: ${f}`);
      process.exit(1);
    }
  }

  const keywordsData      = JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf-8'));
  const keywordStatsData  = JSON.parse(fs.readFileSync(KEYWORD_STATS_FILE, 'utf-8'));
  const platformData      = JSON.parse(fs.readFileSync(PLATFORM_FILE, 'utf-8'));
  const platformTimeline  = JSON.parse(fs.readFileSync(PLATFORM_TIMELINE_FILE, 'utf-8'));
  const collectedDate     = toSqlDate(TARGET_DATE);
  const targetSqlDate     = toSqlDate(TARGET_DATE);

  console.log(`✅ 통합 키워드 ${keywordsData.length}개 로드`);
  console.log(`✅ keyword_stats ${Object.keys(keywordStatsData).length}개 키워드 로드`);
  console.log(`✅ platform_keyword_timeline ${Object.keys(platformTimeline).length}개 키워드 로드`);

  // 통합에서 뽑힌 키워드 Set
  const integratedKeywordNames = new Set(keywordsData.map(item => item.Keyword));

  // 플랫폼별 키워드 수집
  const platformKeywords = {};
  for (const pl of Object.keys(PLATFORM_SCORE_COL)) {
    platformKeywords[pl] = platformData[pl]?.keywords || [];
  }
  const allPlatformKwNames = [
    ...new Set(Object.values(platformKeywords).flat().map(item => item.Keyword))
  ];

  // ── 1. TREND_KEYWORD 전체 bulk upsert ─────────────
  console.log('\n📌 TREND_KEYWORD INSERT 중...');
  const allKeywords = [
    ...new Set([
      ...keywordsData.map(item => item.Keyword),
      ...Object.keys(keywordStatsData),
      ...allPlatformKwNames,
      ...Object.keys(platformTimeline),
    ])
  ];

  await db.query(
    `INSERT IGNORE INTO TREND_KEYWORD (keyword_name) VALUES ?`,
    [allKeywords.map(kw => [kw])]
  );

  const [kwRows] = await db.query(
    `SELECT keyword_id, keyword_name FROM TREND_KEYWORD WHERE keyword_name IN (?)`,
    [allKeywords]
  );
  const keywordIdMap = {};
  kwRows.forEach(row => { keywordIdMap[row.keyword_name] = row.keyword_id; });

  console.log(`  ✅ TREND_KEYWORD: ${allKeywords.length}개 처리`);

  // ── 2. 통합 키워드 USAGE_EXAMPLE bulk insert ───────
  console.log('\n📌 통합 USAGE_EXAMPLE INSERT 중...');

  const integratedExamples = [];
  for (const item of keywordsData) {
    const keywordId = keywordIdMap[item.Keyword];
    if (!keywordId) continue;
    for (const [platform, commentList] of Object.entries(item.Examples || {})) {
      for (const ex of commentList) {
        if (!ex.comment) continue;
        integratedExamples.push({ keywordId, platform, content: ex.comment, url: ex.link || '', collectedDate });
      }
    }
  }
  const integratedCount = await insertExamples(integratedExamples);
  console.log(`  ✅ 통합 USAGE_EXAMPLE: ${integratedCount}개 INSERT`);

  // ── 3. 플랫폼별 신규 키워드 USAGE_EXAMPLE bulk insert ─
  console.log('\n📌 플랫폼별 USAGE_EXAMPLE INSERT 중...');

  const platformExamples = [];
  for (const [platform, kwList] of Object.entries(platformKeywords)) {
    for (const item of kwList) {
      if (integratedKeywordNames.has(item.Keyword)) continue;
      const keywordId = keywordIdMap[item.Keyword];
      if (!keywordId) continue;
      for (const ex of (item.Examples || [])) {
        if (!ex.comment) continue;
        platformExamples.push({ keywordId, platform, content: ex.comment, url: ex.link || '', collectedDate });
      }
    }
  }
  const platformExampleCount = await insertExamples(platformExamples);
  console.log(`  ✅ 플랫폼별 USAGE_EXAMPLE: ${platformExampleCount}개 INSERT`);

  // ── 4. KEYWORD_STATS: 통합 키워드 날짜별 언급량 bulk INSERT ──
  // keyword_stats_{TARGET_DATE}.json 기준
  // 이미 DB에 있는 키워드는 스킵
  console.log('\n📌 통합 KEYWORD_STATS INSERT 중...');

  // DB에 이미 있는 keyword_id 조회
  const [existingRows] = await db.query(
    `SELECT DISTINCT keyword_id FROM KEYWORD_STATS`
  );
  const existingKeywordIds = new Set(existingRows.map(r => r.keyword_id));

  const statsValues = [];
  for (const [keyword, dateCounts] of Object.entries(keywordStatsData)) {
    const keywordId = keywordIdMap[keyword];
    if (!keywordId) continue;
    if (existingKeywordIds.has(keywordId)) continue; // 이미 DB에 있으면 스킵

    for (const [dateStr, counts] of Object.entries(dateCounts)) {
      statsValues.push([
        keywordId,
        toSqlDate(dateStr),
        toCount(counts.mention_count),
        toCount(counts.youtube_count),
        toCount(counts.fmkorea_count),
        toCount(counts.ruliweb_count),
        toCount(counts.nate_count),
        toCount(counts.theqoo_count),
        toCount(counts.dcinside_count),
        null, // trend_score는 아래에서 별도 UPDATE
      ]);
    }
  }

  if (statsValues.length > 0) {
    await db.query(
      `INSERT INTO KEYWORD_STATS
         (keyword_id, stat_date, mention_count,
          youtube_count, fmkorea_count, ruliweb_count,
          nate_count, theqoo_count, dcinside_count, trend_score)
       VALUES ?
       ON DUPLICATE KEY UPDATE
         mention_count  = VALUES(mention_count),
         youtube_count  = VALUES(youtube_count),
         fmkorea_count  = VALUES(fmkorea_count),
         ruliweb_count  = VALUES(ruliweb_count),
         nate_count     = VALUES(nate_count),
         theqoo_count   = VALUES(theqoo_count),
         dcinside_count = VALUES(dcinside_count)`,
      [statsValues]
    );
  }
  console.log(`  ✅ 통합 KEYWORD_STATS: ${statsValues.length}개 INSERT`);

  // ── 5. KEYWORD_STATS: 플랫폼 신규 키워드 날짜별 언급량 bulk INSERT ──
  // platform_keyword_timeline_{TARGET_DATE}.json 기준
  // 통합에 없고 DB에도 없는 키워드만
  console.log('\n📌 플랫폼별 신규 KEYWORD_STATS INSERT 중...');

  const platformStatsValues = [];
  for (const [keyword, dateCounts] of Object.entries(platformTimeline)) {
    if (integratedKeywordNames.has(keyword)) continue; // 통합에 있으면 스킵
    const keywordId = keywordIdMap[keyword];
    if (!keywordId) continue;
    if (existingKeywordIds.has(keywordId)) continue; // 이미 DB에 있으면 스킵

    for (const [dateStr, counts] of Object.entries(dateCounts)) {
      platformStatsValues.push([
        keywordId,
        toSqlDate(dateStr),
        toCount(counts.mention_count),
        toCount(counts.youtube_count),
        toCount(counts.fmkorea_count),
        toCount(counts.ruliweb_count),
        toCount(counts.nate_count),
        toCount(counts.theqoo_count),
        toCount(counts.dcinside_count),
        null,
      ]);
    }
  }

  if (platformStatsValues.length > 0) {
    await db.query(
      `INSERT INTO KEYWORD_STATS
         (keyword_id, stat_date, mention_count,
          youtube_count, fmkorea_count, ruliweb_count,
          nate_count, theqoo_count, dcinside_count, trend_score)
       VALUES ?
       ON DUPLICATE KEY UPDATE
         mention_count  = VALUES(mention_count),
         youtube_count  = VALUES(youtube_count),
         fmkorea_count  = VALUES(fmkorea_count),
         ruliweb_count  = VALUES(ruliweb_count),
         nate_count     = VALUES(nate_count),
         theqoo_count   = VALUES(theqoo_count),
         dcinside_count = VALUES(dcinside_count)`,
      [platformStatsValues]
    );
  }
  console.log(`  ✅ 플랫폼별 신규 KEYWORD_STATS: ${platformStatsValues.length}개 INSERT`);

  // ── 6. 통합 trend_score bulk UPDATE ───────────────
  console.log('\n📌 통합 TREND_SCORE UPDATE 중...');

  const trendScoreValues = [];
  for (const item of keywordsData) {
    const keywordId = keywordIdMap[item.Keyword];
    if (!keywordId) continue;
    trendScoreValues.push([
      keywordId, targetSqlDate,
      toCount(item.Target_Day_Mentions),
      null, null, null, null, null, null,
      item.Trend_Score ?? null,
    ]);
  }
  if (trendScoreValues.length > 0) {
    await db.query(
      `INSERT INTO KEYWORD_STATS
         (keyword_id, stat_date, mention_count,
          youtube_count, fmkorea_count, ruliweb_count,
          nate_count, theqoo_count, dcinside_count, trend_score)
       VALUES ?
       ON DUPLICATE KEY UPDATE trend_score = VALUES(trend_score)`,
      [trendScoreValues]
    );
  }
  console.log(`  ✅ 통합 TREND_SCORE: ${trendScoreValues.length}개 UPDATE`);

  // ── 7. 플랫폼별 score bulk UPDATE (플랫폼당 1 쿼리) ──
  console.log('\n📌 플랫폼별 SCORE UPDATE 중...');

  let platformScoreCount = 0;
  for (const [platform, kwList] of Object.entries(platformKeywords)) {
    const col = PLATFORM_SCORE_COL[platform];
    if (!col) continue;

    const scoreValues = [];
    for (const item of kwList) {
      const keywordId = keywordIdMap[item.Keyword];
      if (!keywordId) continue;
      scoreValues.push([keywordId, targetSqlDate, toCount(item.Target_Day_Mentions), item.Trend_Score ?? null]);
    }
    if (scoreValues.length === 0) continue;

    await db.query(
      `INSERT INTO KEYWORD_STATS (keyword_id, stat_date, mention_count, ${col}) VALUES ?
       ON DUPLICATE KEY UPDATE ${col} = VALUES(${col})`,
      [scoreValues]
    );
    platformScoreCount += scoreValues.length;
  }
  console.log(`  ✅ 플랫폼별 SCORE: ${platformScoreCount}개 UPDATE`);

  console.log('\n✅ 전체 완료');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});