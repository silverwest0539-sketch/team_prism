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

  // 프론트엔드 리스트에 내려가기 전에 source를 실제 플랫폼명으로 교체
  result = result.map(item => {
    // 1. 기본 source는 item 안에 있는 기존 값을 쓰거나, 없으면 'all'로 간주
    let displaySource = item.source || 'all'; 

    // 2. 만약 현재 source가 'all'이고, Examples 데이터가 존재한다면
    if (displaySource === 'all' && item.Examples && item.Examples.length > 0) {
      const firstComment = item.Examples[0];
      
      // 첫 번째 댓글이 문자열인지 확인하고 정규식으로 앞의 [플랫폼명]을 추출
      if (typeof firstComment === 'string') {
        const match = firstComment.match(/^\[(.*?)\]/);
        if (match) {
          displaySource = match[1]; // 예: 'x_trends', 'youtube' 등
          displaySource = displaySource.replace('_trends', ''); // '_trends' 꼬리표 떼기 (선택)
        }
      } else if (typeof firstComment === 'object' && firstComment !== null && firstComment.platform) {
        // 혹시 객체 형태라면 여기서 가져옵니다.
        displaySource = firstComment.platform.replace('_trends', '');
      }
    }

    // 기존 객체를 유지하면서 source만 교체하여 반환
    return {
      ...item,
      source: displaySource
    };
  });

  return result;
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
      
      // 🌟 [추가된 로직] defaultSource가 'all'일 경우, 첫 번째 댓글에서 실제 사이트명을 찾습니다.
      let actualSource = defaultSource;
      
      if (defaultSource === 'all') {
        if (!Array.isArray(item.Examples) && typeof item.Examples === 'object') {
          // 1. 데이터가 객체 형태인 경우 (예: { "fmkorea": [...] }) 첫 번째 키값을 가져옵니다.
          const keys = Object.keys(item.Examples);
          if (keys.length > 0) actualSource = keys[0];
        } else {
          // 2. 데이터가 배열 형태인 경우 첫 번째 요소에서 플랫폼 이름을 추출합니다.
          const examplesList = Array.isArray(item.Examples) ? item.Examples : [];
          if (examplesList.length > 0) {
            const firstEx = examplesList[0];
            if (typeof firstEx === 'object' && firstEx !== null && firstEx.platform) {
              actualSource = firstEx.platform;
            } else if (typeof firstEx === 'string' && firstEx.startsWith('[')) {
              const match = firstEx.match(/^\[(.*?)\]/);
              if (match) actualSource = match[1];
            }
          }
        }
      }

      // 기존처럼 배열 형태로 평탄화
      const examplesList = Array.isArray(item.Examples) ? item.Examples : (typeof item.Examples === 'object' ? Object.values(item.Examples).flat() : []);

      examplesList.forEach(ex => {
        const isObj = typeof ex === 'object' && ex !== null;
        const text = isObj ? (ex.comment || ex.text) : ex;
        if (!text || typeof text !== 'string') return;

        // 🌟 defaultSource 대신 actualSource를 적용합니다.
        let source = isObj ? (ex.platform || actualSource) : actualSource;
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
  
  // API 키가 있고 키워드가 있을 때만 실행
  if (API_KEYS.length > 0 && keyword) {
    const fetchYoutubeWithRotation = async (retryCount = 0) => {
      const currentKey = getActiveKey();
      
      try {
        // A. 영상 검색 (Search API)
        const searchParams = { 
          part: 'snippet', q: keyword, type: 'video', maxResults: 3, 
          key: currentKey, regionCode: 'KR', order: 'date' 
        };
        if (startDate) searchParams.publishedAfter = toISODate(startDate);
        if (endDate) searchParams.publishedBefore = toISODate(endDate, true);

        const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', { params: searchParams });
        const videoIds = searchRes.data.items.map(i => i.id.videoId).join(',');
        
        if (!videoIds) return [];

        // B. 영상 상세 정보 (Videos API - 조회수 등 가져오기)
        const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', { 
          params: { part: 'snippet,statistics', id: videoIds, key: currentKey } 
        });

        return videoRes.data.items.map(item => ({
          id: item.id, 
          title: item.snippet.title, 
          channel: item.snippet.channelTitle,
          views: item.statistics.viewCount, 
          thumbnail: item.snippet.thumbnails.medium.url, 
          publish_time: item.snippet.publishedAt
        }));

      } catch (err) {
        // 할당량 초과(403) 시 키 교체 후 재시도
        const isQuotaError = err.response?.status === 403;
        if (isQuotaError && retryCount < API_KEYS.length - 1) {
          console.log(`🔄 [Trend API Rotation] 할당량 초과로 키 교체 (Index: ${currentKeyIndex})`);
          rotateKey();
          return fetchYoutubeWithRotation(retryCount + 1); // 재시도
        }
        
        console.error("❌ 유튜브 API 최종 실패:", err.message);
        return []; // 모든 키 소진 또는 일반 에러 시 빈 배열 반환
      }
    };

    relatedVideos = await fetchYoutubeWithRotation();
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

  if (!startDate && !endDate && relatedVideos.length > 0) {
    searchCache[keyword] = { data: finalResponse, timestamp: now };
  }

  return finalResponse;
};