const axios = require('axios');
const Parser = require('rss-parser');
const { getLatestData, getCommunityHotPosts } = require('../dataLoader');

// RSS 파서 설정
const parser = new Parser({
  customFields: {
    item: [['source', 'newsSource']] 
  }
});

// 유튜브 비디오 캐시 저장소
let videoCache = {}; 

// 1. 급상승 영상/콘텐츠 조회
exports.getRisingContents = (platform) => {
  // getData() 대신 getLatestData() 사용
  const data = getLatestData ? getLatestData() : []; 
  
  if (!data || data.length === 0) return [];

  const latestDate = data.reduce((max, curr) => curr.Date > max ? curr.Date : max, data[0].Date);
  let targetData = data.filter(item => item.Date === latestDate);

  let contentList = [];
  
  targetData.forEach(item => {
    if (item.Examples && Array.isArray(item.Examples)) {
      item.Examples.forEach(ex => {
        if (typeof ex === 'object' && ex !== null) {
          contentList.push({
            keyword: item.Keyword,
            source: ex.platform || '알 수 없음',
            text: ex.text,
            score: item.Score, 
            mentions: item.Mentions
          });
        } else if (typeof ex === 'string') {
          const match = ex.match(/^\[(.*?)\]/); 
          if (match) {
            contentList.push({
              keyword: item.Keyword,
              source: match[1],
              text: ex.replace(/^\[.*?\](\(comment\)|\(post\))?\s*/, ''),
              score: item.Score, 
              mentions: item.Mentions
            });
          }
        }
      });
    }
  });

  if (platform === 'youtube') {
    contentList = contentList.filter(c => c.source.includes('youtube'));
  } else if (platform === 'community') {
    contentList = contentList.filter(c => !c.source.includes('youtube'));
  }

  contentList.sort((a, b) => b.score - a.score);
  
  return contentList.slice(0, 5).map((item, index) => ({
    rank: index + 1,
    title: item.keyword,
    desc: item.text.length > 50 ? item.text.substring(0, 50) + "..." : item.text,
    stats: `관련 언급 ${item.mentions}회 • ${item.source}`,
    thumbnail: null 
  }));
};

// 2. 유튜브 영상 조회 (캐시 적용)
const API_KEYS = process.env.YOUTUBE_API_KEYS ? process.env.YOUTUBE_API_KEYS.split(',') : [];
let currentKeyIndex = 0;

// 키 로테이션 함수
const getActiveKey = () => API_KEYS[currentKeyIndex];
const rotateKey = () => {
  if (API_KEYS.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    console.log(`🔄 [API Rotation] 다음 키로 교체되었습니다. (Index: ${currentKeyIndex})`);
  }
};

exports.getVideos = async (category) => {
  const CACHE_DURATION = 2 * 60 * 60 * 1000;
  const now = Date.now();

  // 1. 캐시 확인
  if (videoCache[category] && (now - videoCache[category].timestamp < CACHE_DURATION)) {
    console.log(`📦 [Video Cache] '${category}' - 캐시 데이터 반환`);
    // 캐시 원본 수정을 방지하기 위해 복사본 반환 권장
    return JSON.parse(JSON.stringify(videoCache[category].data));
  }

  // 2. 실제 API 호출을 담당하는 내부 함수 (재시도 로직 포함)
  const fetchFromYoutube = async (retryCount = 0) => {
    const currentKey = getActiveKey(); // 현재 활성화된 키 가져오기
    console.log(`📡 [Youtube API] '${category}' - 요청 중... (Key Index: ${currentKeyIndex})`);

    try {
      let response;
      if (category === '챌린지') {
        const date = new Date();
        date.setDate(date.getDate() - 3);
        response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            part: 'snippet', q: '챌린지', type: 'video', videoDuration: 'short',
            order: 'viewCount', publishedAfter: date.toISOString(), 
            maxResults: 50, regionCode: 'KR', 
            key: currentKey // 수정: 정의된 키 사용
          }
        });
      } else {
        const categoryMap = { '전체': '', '음악': '10', '엔터테인먼트': '24', '게임': '20', '뉴스': '25', '스포츠': '17', '브이로그': '22' };
        const categoryId = categoryMap[category] || '';
        const apiParams = { 
          part: 'snippet,statistics', chart: 'mostPopular', regionCode: 'KR', 
          maxResults: 12, 
          key: currentKey // 수정: 정의된 키 사용
        };
        if (categoryId) apiParams.videoCategoryId = categoryId;
        response = await axios.get('https://www.googleapis.com/youtube/v3/videos', { params: apiParams });
      }
      return response.data;

    } catch (error) {
      // 403 에러(할당량 초과) 발생 시 로테이션 수행
      const isQuotaError = error.response?.status === 403;
      
      if (isQuotaError && retryCount < API_KEYS.length - 1) {
        rotateKey(); // 다음 키로 교체
        return fetchFromYoutube(retryCount + 1); // 재귀 호출로 재시도
      }
      throw error; // 모든 키를 소진했거나 다른 에러인 경우 throw
    }
  };

  // 3. 실행 및 결과 처리
  try {
    const apiData = await fetchFromYoutube();
    let videos = [];

    // --- 기존의 데이터 가공(map) 로직 시작 ---
    if (category === '챌린지') {
      const strictFilteredItems = apiData.items.filter(item => {
        const text = (item.snippet.title + " " + item.snippet.description);
        const matches = text.match(/#[^\s#]+챌린지/g);
        return matches && matches.some(tag => tag !== '#챌린지');
      });
      videos = strictFilteredItems.slice(0, 12).map(item => ({
        id: item.id.videoId, title: item.snippet.title, channel: item.snippet.channelTitle,
        views: 0, publish_time: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium.url,
        scraped_category_name: '챌린지'
      }));
    } else {
      videos = apiData.items.map(item => ({
        id: item.id, title: item.snippet.title, channel: item.snippet.channelTitle,
        views: item.statistics.viewCount || 0, publish_time: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails.medium.url, scraped_category_name: category || '인기'
      }));
    }
    // --- 기존의 데이터 가공(map) 로직 끝 ---

    videoCache[category] = { data: videos, timestamp: Date.now() };
    return videos;

  } catch (error) {
    console.error(`❌ 유튜브 API 최종 에러 (${category}):`, error.response?.data?.error?.message || error.message);
    return videoCache[category]?.data || []; // 실패 시 마지막 캐시라도 반환
  }
};

// 3. 커뮤니티 인기글 조회
exports.getCommunityPosts = (platform) => {
  const platformPosts = getCommunityHotPosts(platform) || [];
  return platformPosts.slice(0, 10).map((post, index) => ({
    rank: index + 1,
    title: post.title || post.Title || post.subject || post.Subject || post.text || "제목 없음", 
    link: post.link || post.url || post.href || post.Link || post.Url || "#"
  }));
};

// 4. 구글 뉴스 RSS 조회
exports.getNews = async (keyword, startDate, endDate) => {
  if (!keyword) return [];

  let query = `${keyword}`;
  if (startDate) query += ` after:${startDate}`;
  if (endDate) query += ` before:${endDate}`;

  console.log(`📰 뉴스 검색 쿼리: ${query}`);

  try {
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
    const feed = await parser.parseURL(feedUrl);
    
    return feed.items.slice(0, 5).map(item => {
      let publisher = 'Google News';
      if (item.newsSource) {
        if (typeof item.newsSource === 'string') publisher = item.newsSource;
        else if (item.newsSource._) publisher = item.newsSource._;
      }

      return {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        source: publisher 
      };
    });
  } catch (error) {
    console.error('RSS Error:', error);
    return [];
  }
};