const axios = require('axios');
const { getLatestPlatformData, getLatestData, findKeywordOverAll, getHistoryData } = require('../dataLoader');
const { toISODate, extractWordCloudData } = require('../utils/formatters');

let searchCache = {};

exports.getRisingTrends = () => {
  const allData = getLatestPlatformData('all') || [];
  if (allData.length === 0) return [];

  return allData.slice(0, 5).map((item, index) => {
    const growthStr = String(item.Growth_Percentage || "+0.0%"); 
    const isUp = growthStr.startsWith('+');
    const isDown = growthStr.startsWith('-');

    return {
      rank: item.Rank || index + 1,
      keyword: item.Keyword || "알 수 없음",
      score: item.Trend_Score || item.Score || 0,
      change: growthStr,
      isUp: isUp ? true : (isDown ? false : null)
    };
  });
};

exports.getPlatformTrends = (platform) => {
  let targetKey = platform || 'youtube';
  if (platform === 'x') targetKey = 'x_trends';
  if (platform === 'dcinside') targetKey = 'dcinside';
  if (platform === 'natepan') targetKey = 'nate';

  const platformData = getLatestPlatformData(targetKey) || [];
  if (platformData.length === 0) return [];

  return platformData.slice(0, 5).map((item, index) => ({
    rank: item.Rank || index + 1,
    keyword: item.Keyword || "알 수 없음",
    count: item.Target_Day_Mentions || item.Target_Week_Mentions || item.Total_Mentions || item.Mentions || 0,
    score: item.Trend_Score || item.Score || 0
  }));
};

exports.getAllTrends = (keyword, date) => {
  // 원본의 getData()를 getLatestData()로 대체 (필요시 dataLoader의 함수명 확인 요망)
  let result = getLatestData ? getLatestData() : [];

  if (date) result = result.filter(item => item.Date === date);
  if (keyword) result = result.filter(item => item.Keyword.includes(keyword));

  return result;
};

exports.getAnalysis = async (keyword, startDate, endDate) => {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  const now = Date.now();

  // 캐시 확인
  if (!startDate && !endDate && searchCache[keyword] && (now - searchCache[keyword].timestamp < 60 * 60 * 1000)) {
    console.log(`📦 [Cache] 캐시된 분석 데이터 반환: ${keyword}`);
    return searchCache[keyword].data;
  }

  // 1. 키워드 기본 정보
  const currentItem = findKeywordOverAll(keyword);
  if (!currentItem) return { found: false, message: "데이터 없음" };

  // 2. 히스토리 데이터 구성
  const historyMap = getHistoryData();
  const dates = Object.keys(historyMap).sort();
  let rawCommentsMap = new Map();

  const history = dates.map(date => {
    const dayData = historyMap[date];
    let allArray = [];
    let platformsObj = {};
    
    if (dayData.all) { allArray = dayData.all; platformsObj = dayData; } 
    else if (dayData.Integrated_Trends) { allArray = dayData.Integrated_Trends; platformsObj = dayData.Platform_Trends || {}; } 
    else if (Array.isArray(dayData)) { allArray = dayData; }

    let found = allArray.find(item => (item.Keyword || item.keyword) === keyword);
    if (!found) {
      for (const pKey of Object.keys(platformsObj)) {
        if (['all', 'meta', 'Integrated_Trends', 'Platform_Trends'].includes(pKey)) continue;
        const pList = Array.isArray(platformsObj[pKey]) ? platformsObj[pKey] : [];
        const pItem = pList.find(pi => (pi.Keyword || pi.keyword) === keyword);
        if (pItem) { found = pItem; break; }
      }
    }

    const mentions = found ? (found.Target_Day_Mentions || found.Target_Week_Mentions || found.Total_Mentions || found.Mentions || found.Count || 0) : 0;

    // 댓글 추출 로직
    const extractComments = (item, defaultSource) => {
      if (!item || !item.Examples) return;
      const examplesList = Array.isArray(item.Examples) ? item.Examples : (typeof item.Examples === 'object' ? Object.values(item.Examples).flat() : []);

      examplesList.forEach(ex => {
        const isObj = typeof ex === 'object' && ex !== null;
        const text = isObj ? (ex.comment || ex.text) : ex;
        if (!text || typeof text !== 'string') return;

        let source = isObj ? (ex.platform || defaultSource) : defaultSource;
        let link = isObj ? (ex.link || null) : null;
        let cleanText = text;

        if (!isObj && text.startsWith('[')) {
          const match = text.match(/^\[(.*?)\](?:\(.*\))?\s*(.*)/);
          if (match) { source = match[1]; cleanText = match[2]; }
        }

        source = source.replace('_trends', '');
        if (!rawCommentsMap.has(cleanText)) {
          rawCommentsMap.set(cleanText, { source, text: cleanText, link });
        }
      });
    };

    extractComments(allArray.find(i => (i.Keyword || i.keyword) === keyword), 'all');
    Object.keys(platformsObj).forEach(pKey => {
      if (['all', 'meta', 'Integrated_Trends', 'Platform_Trends'].includes(pKey)) return;
      const pList = Array.isArray(platformsObj[pKey]) ? platformsObj[pKey] : [];
      extractComments(pList.find(i => (i.Keyword || i.keyword) === keyword), pKey);
    });

    return { date, mentions };
  });

  const parsedComments = Array.from(rawCommentsMap.values());
  const wordCloudData = extractWordCloudData(parsedComments, keyword);

  // 3. 유튜브 영상 검색
  let relatedVideos = [];
  if (API_KEY) {
    try {
      const searchParams = { part: 'snippet', q: keyword, type: 'video', maxResults: 3, key: API_KEY, regionCode: 'KR', order: 'date' };
      if (startDate) searchParams.publishedAfter = toISODate(startDate);
      if (endDate) searchParams.publishedBefore = toISODate(endDate, true);

      const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', { params: searchParams });
      const videoIds = searchRes.data.items.map(i => i.id.videoId).join(',');
      
      if (videoIds) {
        const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', { params: { part: 'snippet,statistics', id: videoIds, key: API_KEY } });
        relatedVideos = videoRes.data.items.map(item => ({
          id: item.id, title: item.snippet.title, channel: item.snippet.channelTitle,
          views: item.statistics.viewCount, thumbnail: item.snippet.thumbnails.medium.url, publish_time: item.snippet.publishedAt
        }));
      }
    } catch (err) {
      console.error("❌ 유튜브 API 에러:", err.message);
    }
  }

  if (relatedVideos.length === 0) {
    const youtubeComments = parsedComments.filter(c => c.source.toLowerCase().includes('youtube'));
    relatedVideos = youtubeComments.slice(0, 3).map((c, i) => ({
      id: `local-${i}`, title: c.text.length > 50 ? c.text.substring(0, 50) + "..." : c.text,
      channel: 'YouTube 반응 (Local)', views: 0, thumbnail: 'https://via.placeholder.com/320x180/E5E7EB/9CA3AF?text=No+Video', publish_time: new Date().toISOString()
    }));
  }

  const finalResponse = {
    found: true, keyword: currentItem.Keyword, rank: currentItem.Rank,
    totalMentions: currentItem.Target_Day_Mentions || currentItem.Target_Week_Mentions || currentItem.Total_Mentions || currentItem.Mentions || 0,
    score: currentItem.Trend_Score || currentItem.Score || 0,
    history, comments: parsedComments, wordCloud: wordCloudData, videos: relatedVideos 
  };

  if (!startDate && !endDate) {
    searchCache[keyword] = { data: finalResponse, timestamp: now };
  }

  return finalResponse;
};