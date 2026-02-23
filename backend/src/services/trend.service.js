const axios = require('axios');
const db = require('../database');
const { toISODate, extractWordCloudData } = require('../utils/formatters');

let searchCache = {};

exports.getRisingTrends = async () => {
  // 가장 최근 날짜와 그 전날 조회
  const [[{ maxDate }]] = await db.execute(
    `SELECT MAX(stat_date) AS maxDate FROM KEYWORD_STATS`
  );
  const [[{ prevDate }]] = await db.execute(
    `SELECT MAX(stat_date) AS prevDate FROM KEYWORD_STATS WHERE stat_date < ?`,
    [maxDate]
  );

  // 최신 날짜 언급량 + 전날 언급량 조회 → 상승률 계산 후 정렬
  const [rows] = await db.execute(
    `SELECT
       k.keyword_name,
       t.mention_count                          AS today_count,
       COALESCE(y.mention_count, 0)             AS yesterday_count,
       t.mention_count / COALESCE(y.mention_count, 1) AS growth_ratio
     FROM TREND_KEYWORD k
     JOIN KEYWORD_STATS t
       ON k.keyword_id = t.keyword_id AND t.stat_date = ?
     LEFT JOIN KEYWORD_STATS y
       ON k.keyword_id = y.keyword_id AND y.stat_date = ?
     ORDER BY growth_ratio DESC
     LIMIT 5`,
    [maxDate, prevDate]
  );

  return rows.map((item, index) => {
    const todayCount     = item.today_count     || 0;
    const yesterdayCount = item.yesterday_count || 0;
    const base           = yesterdayCount === 0 ? 1 : yesterdayCount;
    const growthRatio    = (todayCount - yesterdayCount) / base * 100;
    const isUp           = growthRatio > 0;
    const isDown         = growthRatio < 0;
    const changeStr      = isUp
      ? `+${growthRatio.toFixed(1)}%`
      : isDown
        ? `${growthRatio.toFixed(1)}%`
        : '0.0%';

    return {
      rank:    index + 1,
      keyword: item.keyword_name,
      count:   todayCount,
      change:  changeStr,
      isUp:    isUp ? true : (isDown ? false : null),
    };
  });
};

exports.getPlatformTrends = async (platform) => {
  let targetKey = platform || 'youtube';
  if (platform === 'x')        targetKey = 'x_trends';
  if (platform === 'dcinside') targetKey = 'dcinside';
  if (platform === 'natepan')  targetKey = 'nate';

  const { getLatestPlatformData } = require('../dataLoader');
  const platformData = getLatestPlatformData(targetKey) || [];
  if (platformData.length === 0) return [];

  return platformData.slice(0, 5).map((item, index) => ({
    rank:    item.Rank || index + 1,
    keyword: item.Keyword || '알 수 없음',
    count:   item.Target_Day_Mentions || item.Target_Week_Mentions || item.Total_Mentions || item.Mentions || 0,
    score:   item.Trend_Score || item.Score || 0,
  }));
};

exports.getAllTrends = async (keyword, date) => {
  let sql = `
    SELECT k.keyword_name, s.mention_count, s.stat_date
    FROM TREND_KEYWORD k
    JOIN KEYWORD_STATS s ON k.keyword_id = s.keyword_id
    WHERE 1=1
  `;
  const params = [];

  if (date) {
    sql += ` AND s.stat_date = ?`;
    params.push(date);
  }
  if (keyword) {
    sql += ` AND k.keyword_name LIKE ?`;
    params.push(`%${keyword}%`);
  }

  sql += ` ORDER BY s.stat_date DESC, s.mention_count DESC`;

  const [rows] = await db.execute(sql, params);
  return rows;
};

const API_KEYS = process.env.YOUTUBE_API_KEYS ? process.env.YOUTUBE_API_KEYS.split(',') : [];
console.log(`🔑 로드된 API 키 개수: ${API_KEYS.length}개`);
let currentKeyIndex = 0;

const getActiveKey = () => API_KEYS[currentKeyIndex];
const rotateKey = () => {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
};

exports.getAnalysis = async (keyword, startDate, endDate) => {
  const now = Date.now();

  // 캐시 확인
  if (!startDate && !endDate && searchCache[keyword] && (now - searchCache[keyword].timestamp < 60 * 60 * 1000)) {
    console.log(`📦 [Cache] 캐시된 분석 데이터 반환: ${keyword}`);
    return searchCache[keyword].data;
  }

  // ── 1. 키워드 기본 정보 ───────────────────────────────
  const [kwRows] = await db.execute(
    `SELECT keyword_id, keyword_name FROM TREND_KEYWORD WHERE keyword_name = ?`,
    [keyword]
  );
  if (kwRows.length === 0) return { found: false, message: '데이터 없음' };

  const keywordId   = kwRows[0].keyword_id;
  const keywordName = kwRows[0].keyword_name;

  // 가장 최근 날짜의 언급량
  const [latestStats] = await db.execute(
    `SELECT mention_count FROM KEYWORD_STATS
     WHERE keyword_id = ? ORDER BY stat_date DESC LIMIT 1`,
    [keywordId]
  );
  const totalMentions = latestStats.length > 0 ? latestStats[0].mention_count : 0;

  // ── 2. 히스토리 (날짜별 언급량) ──────────────────────
  let statsSql = `
    SELECT stat_date, mention_count
    FROM KEYWORD_STATS
    WHERE keyword_id = ?
  `;
  const statsParams = [keywordId];

  if (startDate) {
    statsSql += ` AND stat_date >= ?`;
    statsParams.push(startDate);
  }
  if (endDate) {
    statsSql += ` AND stat_date <= ?`;
    statsParams.push(endDate);
  }
  statsSql += ` ORDER BY stat_date ASC`;

  const [statsRows] = await db.execute(statsSql, statsParams);
  const history = statsRows.map(row => ({
    date:     row.stat_date.toISOString().slice(0, 10).replace(/-/g, ''),
    mentions: row.mention_count,
  }));

  // ── 3. 댓글 예시 ─────────────────────────────────────
  const [exampleRows] = await db.execute(
    `SELECT u.platform, u.url, u.content
     FROM USAGE_EXAMPLE u
     JOIN KEYWORD_EXAMPLE ke ON u.example_id = ke.example_id
     WHERE ke.keyword_id = ?`,
    [keywordId]
  );

  const parsedComments = exampleRows.map(row => ({
    source: row.platform,
    text:   row.content,
    link:   row.url,
  }));

  const wordCloudData = extractWordCloudData(parsedComments, keyword);

  // ── 4. 유튜브 영상 검색 ───────────────────────────────
  let relatedVideos = [];

  if (API_KEYS.length > 0 && keyword) {
    const fetchYoutubeWithRotation = async (retryCount = 0) => {
      const currentKey = getActiveKey();

      try {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const searchParams = {
          part: 'snippet', q: keyword, type: 'video',
          maxResults: 3, key: currentKey, regionCode: 'KR', order: 'viewCount', publishedAfter: threeDaysAgo.toISOString()
        };
        // if (startDate) searchParams.publishedAfter  = toISODate(startDate);
        // if (endDate)   searchParams.publishedBefore = toISODate(endDate, true);

        const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', { params: searchParams });
        const videoIds  = searchRes.data.items.map(i => i.id.videoId).join(',');
        if (!videoIds) return [];

        const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: { part: 'snippet,statistics', id: videoIds, key: currentKey },
        });
        return videoRes.data.items.map(item => ({
          id:           item.id,
          title:        item.snippet.title,
          channel:      item.snippet.channelTitle,
          views:        parseInt(item.statistics.viewCount || 0),
          thumbnail:    item.snippet.thumbnails.medium.url,
          publish_time: item.snippet.publishedAt,
        }));
      } catch (err) {
        const isQuotaError = err.response?.status === 403;
        if (isQuotaError && retryCount < API_KEYS.length - 1) {
          console.log(`🔄 [Trend API Rotation] 할당량 초과로 키 교체 (Index: ${currentKeyIndex})`);
          rotateKey();
          return fetchYoutubeWithRotation(retryCount + 1);
        }
        console.error('❌ 유튜브 API 최종 실패:', err.message);
        return [];
      }
    };
    relatedVideos = await fetchYoutubeWithRotation();
  }

  if (relatedVideos.length === 0) {
    const youtubeComments = parsedComments.filter(c => c.source.toLowerCase().includes('youtube'));
    relatedVideos = youtubeComments.slice(0, 3).map((c, i) => ({
      id:           `local-${i}`,
      title:        c.text.length > 50 ? c.text.substring(0, 50) + '...' : c.text,
      channel:      'YouTube 반응 (Local)',
      views:        0,
      thumbnail:    'https://via.placeholder.com/320x180/E5E7EB/9CA3AF?text=No+Video',
      publish_time: new Date().toISOString(),
    }));
  }

  const finalResponse = {
    found:         true,
    keyword:       keywordName,
    totalMentions,
    history,
    comments:      parsedComments,
    wordCloud:     wordCloudData,
    videos:        relatedVideos,
  };

  if (!startDate && !endDate && relatedVideos.length > 0) {
    searchCache[keyword] = { data: finalResponse, timestamp: now };
  }

  return finalResponse;
};