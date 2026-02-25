// src/scripts/insertPoolTimeline.js

const fs   = require('fs');
const path = require('path');
const db   = require('../database');

const TARGET_DATE = '20260225';

const POOL_TIMELINE_FILE = path.join(__dirname, '../../data/pool_mention_timeline', `keyword_timeline_${TARGET_DATE}.json`);

function toSqlDate(dateStr) {
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

function toCount(val) {
  return val === null || val === undefined ? 0 : val;
}

async function main() {
  if (!fs.existsSync(POOL_TIMELINE_FILE)) {
    console.error(`❌ 파일 없음: ${POOL_TIMELINE_FILE}`);
    process.exit(1);
  }

  const poolTimelineData = JSON.parse(fs.readFileSync(POOL_TIMELINE_FILE, 'utf-8'));
  console.log(`✅ pool_timeline(오늘) ${Object.keys(poolTimelineData).length}개 키워드 로드`);

  // 키워드 ID 조회
  const keywords = Object.keys(poolTimelineData);
  const [kwRows] = await db.query(
    `SELECT keyword_id, keyword_name FROM TREND_KEYWORD WHERE keyword_name IN (?)`,
    [keywords]
  );
  const keywordIdMap = {};
  kwRows.forEach(row => { keywordIdMap[row.keyword_name] = row.keyword_id; });

  // INSERT/UPDATE
  const poolStatsValues = [];
  for (const [keyword, dateCounts] of Object.entries(poolTimelineData)) {
    const keywordId = keywordIdMap[keyword];
    if (!keywordId) {
      console.warn(`⚠️  DB에 없는 키워드 스킵: ${keyword}`);
      continue;
    }
    for (const [dateStr, counts] of Object.entries(dateCounts)) {
      poolStatsValues.push([
        keywordId,
        toSqlDate(dateStr),
        toCount(counts.mention_count),
        toCount(counts.youtube_count),
        toCount(counts.fmkorea_count),
        toCount(counts.ruliweb_count),
        toCount(counts.nate_count),
        toCount(counts.theqoo_count),
        toCount(counts.dcinside_count),
      ]);
    }
  }

  if (poolStatsValues.length > 0) {
    await db.query(
      `INSERT INTO KEYWORD_STATS
         (keyword_id, stat_date, mention_count,
          youtube_count, fmkorea_count, ruliweb_count,
          nate_count, theqoo_count, dcinside_count)
       VALUES ?
       ON DUPLICATE KEY UPDATE
         mention_count  = VALUES(mention_count),
         youtube_count  = VALUES(youtube_count),
         fmkorea_count  = VALUES(fmkorea_count),
         ruliweb_count  = VALUES(ruliweb_count),
         nate_count     = VALUES(nate_count),
         theqoo_count   = VALUES(theqoo_count),
         dcinside_count = VALUES(dcinside_count)`,
      [poolStatsValues]
    );
  }

  console.log(`✅ pool 키워드 오늘 언급량: ${poolStatsValues.length}개 INSERT/UPDATE`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});