const axios = require('axios');
const db = require('../database');
const { toISODate, extractWordCloudData } = require('../utils/formatters');

let searchCache = {};

exports.getRisingTrends = async () => {
  const [[{ maxDate }]] = await db.execute(
    `SELECT MAX(stat_date) AS maxDate FROM KEYWORD_STATS`
  );
  const [[{ prevDate }]] = await db.execute(
    `SELECT MAX(stat_date) AS prevDate FROM KEYWORD_STATS WHERE stat_date < ?`,
    [maxDate]
  );

  const [rows] = await db.execute(
    `SELECT
       k.keyword_name,
       t.mention_count                                AS today_count,
       COALESCE(y.mention_count, 0)                   AS yesterday_count,
       t.mention_count / COALESCE(y.mention_count, 1) AS growth_ratio,
       t.trend_score                                  AS trend_score
     FROM TREND_KEYWORD k
     JOIN KEYWORD_STATS t
       ON k.keyword_id = t.keyword_id AND t.stat_date = ?
     LEFT JOIN KEYWORD_STATS y
       ON k.keyword_id = y.keyword_id AND y.stat_date = ?
     WHERE t.trend_score > 0
     ORDER BY t.trend_score DESC
     LIMIT 20`,
    [maxDate, prevDate]
  );

  return rows.map((item, index) => {
    const todayCount = item.today_count || 0;
    const yesterdayCount = item.yesterday_count || 0;
    const base = yesterdayCount === 0 ? 1 : yesterdayCount;
    const growthRatio = (todayCount - yesterdayCount) / base * 100;
    const isUp = growthRatio > 0;
    const isDown = growthRatio < 0;
    const changeStr = isUp
      ? `+${growthRatio.toFixed(1)}%`
      : isDown
        ? `${growthRatio.toFixed(1)}%`
        : '0.0%';

    return {
      rank: index + 1,
      keyword: item.keyword_name,
      count: todayCount,
      change: changeStr,
      isUp: isUp ? true : (isDown ? false : null),
      trendScore: item.trend_score,
    };
  });
};

exports.getPlatformTrends = async (platform) => {
  const col = {
    youtube: 'youtube_score',
    fmkorea: 'fmkorea_score',
    ruliweb: 'ruliweb_score',
    natepan: 'nate_score',
    theqoo: 'theqoo_score',
    dcinside: 'dcinside_score',
  }[platform] || 'youtube_score';

  const [[{ maxDate }]] = await db.execute(
    `SELECT MAX(stat_date) AS maxDate FROM KEYWORD_STATS`
  );

  const [rows] = await db.execute(
    `SELECT k.keyword_name, s.mention_count, s.${col} AS platform_score
     FROM TREND_KEYWORD k
     JOIN KEYWORD_STATS s ON k.keyword_id = s.keyword_id
     WHERE s.stat_date = ? AND s.${col} IS NOT NULL
     ORDER BY s.${col} DESC
     LIMIT 5`,
    [maxDate]
  );

  return rows.map((item, index) => ({
    rank: index + 1,
    keyword: item.keyword_name,
    count: item.mention_count,
    score: item.platform_score,
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

  // 캐시 히트 시 is_person만 DB에서 새로 가져오기
  if (!startDate && !endDate && searchCache[keyword] && (now - searchCache[keyword].timestamp < 60 * 60 * 1000)) {
    const [[fresh]] = await db.execute(
      `SELECT is_person FROM TREND_KEYWORD WHERE keyword_name = ?`, [keyword]
    );
    return { ...searchCache[keyword].data, is_person: fresh?.is_person ?? 0 };
  }

  // ── 1. 키워드 기본 정보 ───────────────────────────────
  const [kwRows] = await db.execute(
    `SELECT keyword_id, keyword_name, is_person FROM TREND_KEYWORD WHERE keyword_name = ?`,
    [keyword]
  );
  if (kwRows.length === 0) return { found: false, message: '데이터 없음' };

  const keywordId = kwRows[0].keyword_id;
  const keywordName = kwRows[0].keyword_name;
  const isPerson = kwRows[0].is_person;

  // 가장 최근 날짜의 언급량 + 트렌드 스코어
  const [latestStats] = await db.execute(
    `SELECT 
       mention_count, 
       COALESCE(trend_score, 0) AS trend_score,
       COALESCE(positive_score, 0) AS positive_score,
       COALESCE(neutral_score, 0) AS neutral_score,
       COALESCE(negative_score, 0) AS negative_score
     FROM KEYWORD_STATS
     WHERE keyword_id = ? ORDER BY stat_date DESC LIMIT 1`,
    [keywordId]
  );
  const totalMentions = latestStats.length > 0 ? latestStats[0].mention_count : 0;
  const trendScore = latestStats.length > 0 ? latestStats[0].trend_score : 0;
  const positiveScore = latestStats.length > 0 ? latestStats[0].positive_score : 0;
  const neutralScore = latestStats.length > 0 ? latestStats[0].neutral_score : 0;
  const negativeScore = latestStats.length > 0 ? latestStats[0].negative_score : 0;

  // ── 2. 히스토리 (날짜별 언급량) ──────────────────────
  let statsSql = `
    SELECT stat_date, mention_count, COALESCE(trend_score, 0) AS trend_score,
      COALESCE(youtube_count, 0) AS youtube_count,
      COALESCE(fmkorea_count, 0) AS fmkorea_count,
      COALESCE(ruliweb_count, 0) AS ruliweb_count,
      COALESCE(nate_count, 0) AS nate_count,
      COALESCE(theqoo_count, 0) AS theqoo_count,
      COALESCE(dcinside_count, 0) AS dcinside_count
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

  const history = statsRows.map(row => {
    let dateStr = "";
    if (row.stat_date) {
      // 시간대(Timezone) 문제 해결: 한국 시간에 맞게 날짜 오프셋 보정
      const dateObj = new Date(row.stat_date);
      const offset = dateObj.getTimezoneOffset() * 60000;
      const localDate = new Date(dateObj.getTime() - offset);

      // 프론트엔드가 요구하는 'YYYYMMDD' 형식으로 변환
      dateStr = localDate.toISOString().slice(0, 10).replace(/-/g, '');
    }

    return {
      date: dateStr,
      mentions: row.mention_count || 0,
      youtube: row.youtube_count || 0,
      fmkorea: row.fmkorea_count || 0,
      ruliweb: row.ruliweb_count || 0,
      nate: row.nate_count || 0,
      theqoo: row.theqoo_count || 0,
      dcinside: row.dcinside_count || 0,
      score: row.trend_score || 0,
    };
  });

  // ── 3. 댓글 예시 ─────────────────────────────────────
  let countSql = `
    SELECT COUNT(*) as total
    FROM USAGE_EXAMPLE u
    JOIN KEYWORD_EXAMPLE ke ON u.example_id = ke.example_id
    WHERE ke.keyword_id = ?
  `;

  const countParams = [keywordId];

  // 프론트엔드에서 넘겨준 날짜로 댓글도 필터링
  if (startDate) {
    countSql += ` AND u.collected_date >= ?`;
    countParams.push(startDate);
  }
  if (endDate) {
    countSql += ` AND u.collected_date <= ?`;
    countParams.push(endDate);
  }
  const [[{ total: totalCommentCount }]] = await db.execute(countSql, countParams);

  let commentsSql = `
      SELECT u.platform, u.url, u.content, u.collected_date, u.sentiment_label
      FROM USAGE_EXAMPLE u
      JOIN KEYWORD_EXAMPLE ke ON u.example_id = ke.example_id
      WHERE ke.keyword_id = ?
  `;
  const commentsParams = [keywordId];

  if (startDate) {
    commentsSql += ` AND u.collected_date >= ?`;
    commentsParams.push(startDate);
  }
  if (endDate) {
    commentsSql += ` AND u.collected_date <= ?`;
    commentsParams.push(endDate);
  }

  // 최신순 정렬
  commentsSql += ` ORDER BY u.collected_date DESC LIMIT 70`;

  const [exampleRows] = await db.execute(commentsSql, commentsParams);

  const parsedComments = exampleRows.map(row => {
    // DB의 날짜 데이터를 YYYY-MM-DD 형식의 문자열로 안전하게 변환
    let formattedDate = null;
    if (row.collected_date) {
      const dateObj = new Date(row.collected_date);
      // 유효한 날짜인지 체크
      if (!isNaN(dateObj)) {
        // 한국 시간(KST)을 고려한 오프셋 적용 후 변환 (선택 사항이나 권장됨)
        const offset = dateObj.getTimezoneOffset() * 60000;
        const localDate = new Date(dateObj.getTime() - offset);
        formattedDate = localDate.toISOString().split('T')[0];
      }
    }

    return {
      source: row.platform,
      text: row.content,
      link: row.url,
      date: formattedDate, // 추가된 날짜 데이터
      sentiment: row.sentiment_label || 'neutral',
    };
  });

  const wordCloudData = await extractWordCloudData(parsedComments, keyword);


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
          maxResults: 10, key: currentKey, regionCode: 'KR', order: 'viewCount', publishedAfter: threeDaysAgo.toISOString()
        };
        // if (startDate) searchParams.publishedAfter  = toISODate(startDate);
        // if (endDate)   searchParams.publishedBefore = toISODate(endDate, true);

        const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', { params: searchParams });
        const videoIds = searchRes.data.items.map(i => i.id.videoId).join(',');
        if (!videoIds) return [];

        const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: { part: 'snippet,statistics', id: videoIds, key: currentKey },
        });
        return videoRes.data.items.map(item => ({
          id: item.id,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          views: parseInt(item.statistics.viewCount || 0),
          thumbnail: item.snippet.thumbnails.medium.url,
          publish_time: item.snippet.publishedAt,
        }))
          .filter(video =>
            /[가-힣]/.test(video.title || '')
          );
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
      id: `local-${i}`,
      title: c.text.length > 50 ? c.text.substring(0, 50) + '...' : c.text,
      channel: 'YouTube 반응 (Local)',
      views: 0,
      thumbnail: 'https://via.placeholder.com/320x180/E5E7EB/9CA3AF?text=No+Video',
      publish_time: new Date().toISOString(),
    }));
  }

  const finalResponse = {
    found: true,
    keyword: keywordName,
    is_person: isPerson,
    totalMentions,
    positive_score: positiveScore,
    neutral_score: neutralScore,
    negative_score: negativeScore,
    history,
    totalCommentCount,
    comments: parsedComments,
    wordCloud: wordCloudData,
    videos: relatedVideos,
  };

  if (!startDate && !endDate && relatedVideos.length > 0) {
    searchCache[keyword] = { data: finalResponse, timestamp: now };
  }

  return finalResponse;
};

// ── 5. 검색어 자동완성 (빠른 완성) ───────────────────────────────
exports.getAutocomplete = async (prefix) => {
  if (!prefix) return [];

  // 입력한 단어가 포함된(LIKE 단어%) 키워드를 최대 10개까지 조회
  const [rows] = await db.execute(
    `SELECT keyword_name 
     FROM TREND_KEYWORD 
     WHERE keyword_name LIKE ? 
     ORDER BY keyword_name ASC 
     LIMIT 10`,
    [`${prefix}%`]
  );

  return rows.map(row => row.keyword_name);
};

exports.getMoreComments = async (keyword, startDate, endDate, offset = 70) => {
  const [kwRows] = await db.execute(
    `SELECT keyword_id FROM TREND_KEYWORD WHERE keyword_name = ?`, [keyword]
  );
  if (kwRows.length === 0) return [];

  const keywordId = kwRows[0].keyword_id;
  let commentsSql = `
      SELECT u.platform, u.url, u.content, u.collected_date, u.sentiment_label
      FROM USAGE_EXAMPLE u
      JOIN KEYWORD_EXAMPLE ke ON u.example_id = ke.example_id
      WHERE ke.keyword_id = ?
  `;
  const commentsParams = [keywordId];

  if (startDate) {
    commentsSql += ` AND u.collected_date >= ?`;
    commentsParams.push(startDate);
  }
  if (endDate) {
    commentsSql += ` AND u.collected_date <= ?`;
    commentsParams.push(endDate);
  }

  const safeOffset = parseInt(offset, 10) || 70;

  commentsSql += ` ORDER BY u.collected_date DESC LIMIT 70 OFFSET ${safeOffset}`;

  const [exampleRows] = await db.execute(commentsSql, commentsParams);

  return exampleRows.map(row => {
    let formattedDate = null;
    if (row.collected_date) {
      const dateObj = new Date(row.collected_date);
      if (!isNaN(dateObj)) {
        const offsetMs = dateObj.getTimezoneOffset() * 60000;
        formattedDate = new Date(dateObj.getTime() - offsetMs).toISOString().split('T')[0];
      }
    }
    return {
      source: row.platform,
      text: row.content,
      link: row.url,
      date: formattedDate,
      sentiment: row.sentiment_label || 'neutral',
    };
  });
};