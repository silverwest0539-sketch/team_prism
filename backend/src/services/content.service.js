const axios = require('axios');
const Parser = require('rss-parser');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const { getLatestData, getCommunityHotPosts } = require('../dataLoader');

// RSS 파서 설정
const parser = new Parser({
  customFields: {
    item: [['source', 'newsSource']] 
  }
});

const getPythonPath = () => {
  if (process.env.NODE_ENV === 'production') {
    return '/opt/venv/bin/python'; // Docker 환경
  }
  return os.platform() === 'win32' ? 'python' : 'python3'; // 로컬 환경
};

// console.log("내장 자체 형태소 분석기를 사용합니다.");

const fallbackTokenizeForNouns = (text) => {
  // '그런데' 같은 부사, 접속사를 걸러내기 위한 1차 필터
  const nonNouns = new Set(['그런데', '그리고', '그래서', '하지만', '그러나', '너무', '정말', '진짜', '매우', '가장']);
  const cleanText = text.replace(/[^가-힣a-zA-Z0-9\s]/g, ' ');
  const words = cleanText.split(/\s+/);
  
  const nouns = [];
  words.forEach(word => {
    let noun = word.replace(/(은|는|이|가|을|를|의|에|에서|로|으로|과|와|도|까지|마저|조차|부터|요|다|입니다|습니다)$/, '');
    if (noun.length >= 2 && noun.length <= 7 && !nonNouns.has(noun)) {
      nouns.push(noun);
    }
  });
  return nouns;
};


const extractNounsBatch = (payloadArray) => {
  return new Promise((resolve) => {
    const pythonPath = getPythonPath();
    
    // 환경에 맞게 경로 설정 (앞서 수정한 경로 방식 유지)
    const scriptPath = path.join(__dirname, '..', 'utils', 'noun_extractor.py');

    const pythonProcess = spawn(pythonPath, [scriptPath]);
    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error("[Kiwi Error]:", data.toString());
    });

    // Fallback 처리용 헬퍼 함수
    const runFallback = () => {
      const fallbackResults = [];
      payloadArray.forEach(item => {
        if (item.text) {
          const nouns = fallbackTokenizeForNouns(item.text);
          nouns.forEach(noun => {
            fallbackResults.push({
              word: noun,
              platform: item.platform || 'unknown',
              type: item.type || 'trend'
            });
          });
        }
      });
      return fallbackResults;
    };

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.warn("Python 형태소 분석 프로세스 비정상 종료. 내장 정규식 필터로 폴백(Fallback)합니다.");
        return resolve(runFallback());
      }
      try {
        const results = JSON.parse(dataString);
        resolve(results);
      } catch (e) {
        console.error("JSON 파싱 오류. 내장 정규식 필터로 폴백(Fallback)합니다:", e);
        resolve(runFallback());
      }
    });

    pythonProcess.stdin.write(JSON.stringify(payloadArray));
    pythonProcess.stdin.end();
  });
};


let newsKeywordCache = {};

const updateSingleCategoryKeyword = async (category) => {
  try {
    const newsList = await exports.getNewsByCategory(category);
    if (!newsList || newsList.length === 0) return [];

    const batchPayload = newsList.map(news => {
      let cleanTitle = news.title.replace(/\s*[-|][^-|]*$/, '');
      cleanTitle = cleanTitle.replace(/\[.*?\]|\(.*?\)|<.*?>|【.*?】/g, '').trim();
      return { text: cleanTitle, platform: "news", type: "news" };
    });

    const extractedData = await extractNounsBatch(batchPayload);

    const keywordMap = {};
    extractedData.forEach(item => {
      const noun = item.word;
      keywordMap[noun] = (keywordMap[noun] || 0) + 1;
    });

    const formattedData = Object.entries(keywordMap)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50)
      .map((item, index) => ({
        rank: index + 1,
        keyword: item.keyword,
        count: item.count 
      }));

    newsKeywordCache[category] = { data: formattedData, timestamp: Date.now() };
    return formattedData;
  } catch (error) {
    console.error(`[Single Update] '${category}' 업데이트 실패:`, error.message);
    return [];
  }
};

const updateNewsKeywords = async () => {
  try {
    console.log("🔄 [Background] 뉴스 키워드 업데이트 시작...");
    
    const categories = ['korea', 'business', 'tech', 'world', 'entertainment', 'sports'];
    
    for (const category of categories) {
      const newsList = await exports.getNewsByCategory(category);
      if (!newsList || newsList.length === 0) continue;

      // 1. Python으로 보낼 Batch 페이로드 생성
      const batchPayload = newsList.map(news => {
        let cleanTitle = news.title.replace(/\s*[-|][^-|]*$/, '');
        cleanTitle = cleanTitle.replace(/\[.*?\]|\(.*?\)|<.*?>|【.*?】/g, '').trim();
        return {
          text: cleanTitle,
          platform: "news",
          type: "news"
        };
      });

      // 2. Python 프로세스 1회 호출로 해당 카테고리의 모든 기사 형태소 분석
      const extractedData = await extractNounsBatch(batchPayload);

      // 3. 반환된 단어들의 빈도수 계산
      const keywordMap = {};
      
      extractedData.forEach(item => {
        const noun = item.word;
        // Python에서 이미 숫자, 단일글자, 불용어가 필터링되어 넘어오므로 카운트만 수행
        keywordMap[noun] = (keywordMap[noun] || 0) + 1;
      });

      // 4. 빈도수 기준 상위 20개 추출
      const formattedData = Object.entries(keywordMap)
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
        .map((item, index) => ({
          rank: index + 1,
          keyword: item.keyword,
          count: item.count
        }));

      // 카테고리를 키 값으로 하여 캐시 저장
      newsKeywordCache[category] = { data: formattedData, timestamp: Date.now() };
    }
    
    console.log("✅ [Background] 카테고리별 뉴스 키워드 업데이트 완료");
  } catch (error) {
    console.error('❌ [Background] 업데이트 실패:', error.message);
  }
};

// [추가] 서버 실행 5초 후 첫 실행, 이후 1시간마다 자동 갱신
setTimeout(updateNewsKeywords, 5000); 
setInterval(updateNewsKeywords, 1000 * 60 * 60);


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
    const currentKey = getActiveKey();
    console.log(`[Youtube API] '${category}' - 요청 중... (Key Index: ${currentKeyIndex})`);

    try {
      const categoryMap = { '전체': '', '음악': '10', '엔터테인먼트': '24', '게임': '20', '뉴스': '25', '스포츠': '17', '브이로그': '22' };
      const categoryId = categoryMap[category] || '';
      
      const apiParams = { 
        part: 'snippet,statistics', chart: 'mostPopular', regionCode: 'KR', 
        maxResults: 12, 
        key: currentKey 
      };
      
      if (categoryId) apiParams.videoCategoryId = categoryId;
      
      const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', { params: apiParams });
      return response.data;

    } catch (error) {
      const isQuotaError = error.response?.status === 403;
      
      if (isQuotaError && retryCount < API_KEYS.length - 1) {
        rotateKey(); 
        return fetchFromYoutube(retryCount + 1); 
      }
      throw error; 
    }
  };

  // 3. 실행 및 결과 처리
  try {
    const apiData = await fetchFromYoutube();
    
    // 일관된 데이터 매핑
    const videos = apiData.items.map(item => ({
      id: item.id, 
      title: item.snippet.title, 
      channel: item.snippet.channelTitle,
      views: item.statistics.viewCount || 0, 
      publish_time: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails.medium.url, 
      scraped_category_name: category || '인기'
    }));

    videoCache[category] = { data: videos, timestamp: Date.now() };
    return videos;

  } catch (error) {
    console.error(`[Youtube API Error] 최종 에러 (${category}):`, error.response?.data?.error?.message || error.message);
    return videoCache[category]?.data || []; 
  }
};

// 3. 커뮤니티 인기글 조회
exports.getCommunityPosts = (platform) => {
  const platformPosts = getCommunityHotPosts(platform) || [];
  
  // 1. 원본 배열을 복사한 뒤 무작위로 섞습니다. (원본 배열 훼손 방지)
  const shuffledPosts = [...platformPosts].sort(() => 0.5 - Math.random());

  // 2. 무작위로 섞인 배열에서 10개를 추출하고 포맷팅합니다.
  return shuffledPosts.slice(0, 10).map((post, index) => ({
    category: post.category,
    title: post.title || post.Title || post.subject || post.Subject || post.text || "제목 없음", 
    link: post.link || post.url || post.href || post.Link || post.Url || "#"
  }));
};

// 4. 구글 뉴스 RSS 조회
exports.getNews = async (keyword, startDate, endDate) => {
  if (!keyword) return [];

  // 한국 시간(KST) 기준 YYYY-MM-DD 형식을 반환하는 헬퍼 함수
  const getKSTDateString = (daysOffset = 0) => {
    const date = new Date(); // 프론트엔드 파라미터 무시하고 무조건 현재 실제 시간 기준
    date.setDate(date.getDate() + daysOffset);
    
    return new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'Asia/Seoul', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).format(date);
  };

  // 무조건 실제 날짜 기준 어제와 내일(오늘 데이터를 포함하기 위해 before는 내일로 설정)로 고정
  const searchStart = getKSTDateString(-1); // 어제
  const searchEnd = getKSTDateString(1);    // 내일

  // startDate, endDate 파라미터를 사용하지 않고 고정된 날짜로 쿼리 생성
  const query = `${keyword} after:${searchStart} before:${searchEnd}`;
  console.log(`📰 뉴스 검색 쿼리: ${query}`);

  try {
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
    const feed = await parser.parseURL(feedUrl);

    const normalizedKeyword = keyword.replace(/\s+/g, '').toLowerCase();
    const excludeKeywords = ['인벤', 'inven', '루리웹', 'ruliweb', '디시인사이드', 'dcinside'];

    // 1. 최신글이 최상단에 오도록 pubDate 기준으로 내림차순 정렬
    const sortedItems = feed.items
      .filter(item => {
        if (!item.title) return false;

        // 출처(publisher) 파악
        let publisher = '';
        if (item.newsSource) {
          if (typeof item.newsSource === 'string') publisher = item.newsSource.toLowerCase();
          else if (item.newsSource._) publisher = item.newsSource._.toLowerCase();
        }

        // [추가] 링크나 출처에 제외 키워드가 있는지 확인
        const link = (item.link || '').toLowerCase();
        const isExcluded = excludeKeywords.some(ex => publisher.includes(ex) || link.includes(ex));
        
        // 커뮤니티 사이트면 뉴스 목록에서 제외
        if (isExcluded) return false;

        // 기사 제목에서 띄어쓰기를 다 없애버림
        const normalizedTitle = item.title.replace(/\s+/g, '').toLowerCase();
        // 띄어쓰기가 제거된 상태에서 키워드가 포함되어 있는지 확인
        return normalizedTitle.includes(normalizedKeyword);
      })
      .sort((a, b) => {
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      });

    // 2. 정렬된 데이터에서 상위 5개 추출
    return sortedItems.slice(0, 50).map(item => {
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

// 5. 카테고리별 구글 뉴스 RSS 조회 (새로 추가)
exports.getNewsByCategory = async (category) => {
  // 프론트엔드 카테고리 값을 구글 뉴스 토픽 ID로 매핑
  const topicMap = {
    'korea': 'NATION',
    'world': 'WORLD',
    'business': 'BUSINESS',
    'tech': 'TECHNOLOGY',
    'entertainment': 'ENTERTAINMENT',
    'sports': 'SPORTS'
  };

  const topic = topicMap[category] || 'NATION';
  const feedUrl = `https://news.google.com/news/rss/headlines/section/topic/${topic}?hl=ko&gl=KR&ceid=KR:ko`;

  try {
    const feed = await parser.parseURL(feedUrl);
    
    // 최신순 정렬
    const sortedItems = feed.items.sort((a, b) => {
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });

    // 상위 100개 추출
    return sortedItems.slice(0, 100).map(item => {
      let publisher = 'Google News';
      if (item.newsSource) {
        if (typeof item.newsSource === 'string') publisher = item.newsSource;
        else if (item.newsSource._) publisher = item.newsSource._;
      }

      return {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        press: publisher // 프론트엔드 변수명(press)과 맞춤
      };
    });
  } catch (error) {
    console.error(`RSS Category Error (${category}):`, error);
    return [];
  }
};

// 뉴스 키워드 추출용 함수
exports.getNewsKeywordRankings = async (category = 'korea') => {
  // 요청한 카테고리의 캐시가 아직 없다면, '해당 카테고리만' 즉시 생성하여 응답 속도 최적화
  if (!newsKeywordCache[category] || !newsKeywordCache[category].data) {
    console.log(`[On-Demand] '${category}' 캐시가 없어 즉시 생성합니다.`);
    await updateSingleCategoryKeyword(category);
  }
  
  return newsKeywordCache[category]?.data || [];
};