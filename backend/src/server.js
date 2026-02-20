const express = require('express');
const cors = require('cors');
const axios = require('axios')
const path = require('path')
const { loadTrendData, getLatestData, getYoutubeData, getHistoryData, getLatestPlatformData, findKeywordOverAll, getCommunityHotPosts } = require('./dataLoader');
const dotenvResult = require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Parser = require('rss-parser');
const parser = new Parser({
  customFields: {
    // XML의 <source> 태그를 item.newsSource 라는 이름으로 가져오겠다는 설정
    item: [['source', 'newsSource']] 
  }
});

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let searchCache = {}; // { '쿠팡': { data: [...], timestamp: 12345678 } }

// 날짜 변환 유틸리티 (YYYY-MM-DD -> ISO 8601)
// 유튜브 API는 "2024-01-01T00:00:00Z" 형식이 필요합니다.
const toISODate = (dateStr, isEnd = false) => {
  if (!dateStr) return undefined;
  // 종료일이면 그 날의 마지막 시간(23:59:59)으로 설정
  const time = isEnd ? '23:59:59' : '00:00:00';
  return new Date(`${dateStr}T${time}Z`).toISOString();
};

// 워드클라우드용
const extractWordCloudData = (comments, keyword) => {
  if (!comments || comments.length === 0) return [];

  // 1. 모든 텍스트 합치기 및 기본 정제
  const textList = comments.map(c => (typeof c === 'object' && c.text) ? c.text : c);
  const text = textList.join(' ');
  
  // 2. 불필요한 태그, URL, 특수문자 제거
  const cleanText = text
    .replace(/\[.*?\]/g, '') // [youtube] 등 태그 제거
    .replace(/http\S+/g, '') // URL 제거
    .replace(/[^\w가-힣\s]/g, '') // 한글, 영문, 숫자, 공백 외 제거
    .replace(/\s+/g, ' '); // 연속된 공백 하나로

  // 3. 단어 단위로 쪼개기
  const words = cleanText.split(' ');

  // 4. 빈도수 계산
  const frequency = {};
  words.forEach(word => {
    // 키워드 자체는 제외, 2글자 이상만 포함
    if (word.length > 1 && word !== keyword) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
  });

  // 5. 배열로 변환 및 정렬 (상위 50개)
  return Object.entries(frequency)
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 50);
};

// 1. [HomePage] 급상승 키워드 API (Top 5)
app.get('/api/trends/rising', (req, res) => {
  try {
    const allData = getLatestPlatformData('all') || [];
    
    // 데이터가 없으면 바로 빈 배열 리턴 (서버 안 뻗게 방어)
    if (allData.length === 0) {
      return res.json([]);
    }

    const response = allData.slice(0, 5).map((item, index) => {
      // Growth_Percentage가 아예 없는 구형 데이터 방어
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
    
    res.json(response);
  } catch (error) {
    console.error("❌ /api/trends/rising 에러:", error);
    res.json([]); // 에러 시 빈 화면이라도 띄우기 위함
  }
});

// 2. [오른쪽 카드] 플랫폼별 키워드 API
app.get('/api/trends/platform', (req, res) => {
  try {
    const { platform } = req.query;
    
    let targetKey = platform || 'youtube';
    if (platform === 'x') targetKey = 'x_trends';
    if (platform === 'dcinside') targetKey = 'dcinside';
    if (platform === 'natepan') targetKey = 'nate';

    const platformData = getLatestPlatformData(targetKey) || [];
    
    if (platformData.length === 0) {
      return res.json([]);
    }

    const response = platformData.slice(0, 5).map((item, index) => ({
      rank: item.Rank || index + 1,
      keyword: item.Keyword || "알 수 없음",
      count: item.Target_Day_Mentions || item.Target_Week_Mentions || item.Total_Mentions || item.Mentions || 0,
      score: item.Trend_Score || item.Score || 0
    }));

    res.json(response);
  } catch (error) {
    console.error("❌ /api/trends/platform 에러:", error);
    res.json([]); 
  }
});

// 2. [AnalysisPage] 차트 및 검색용 전체 데이터 API
app.get('/api/trends', (req, res) => {
  const { keyword, date } = req.query;
  let result = getData();

  if (date) {
    result = result.filter(item => item.Date === date);
  }

  if (keyword) {
    result = result.filter(item => item.Keyword.includes(keyword));
  }

  res.json(result);
});

// 3. [HomePage] 급상승 영상/콘텐츠 API (탭 기능 포함)
app.get('/api/contents/rising', (req, res) => {
  const { platform } = req.query;
  const data = getData();
  
  if (!data || data.length === 0) return res.json([]);

  // ✅ 핵심 수정 3: 콘텐츠 API도 최신 날짜 1개만 사용하도록 강제
  const latestDate = data.reduce((max, curr) => curr.Date > max ? curr.Date : max, data[0].Date);
  let targetData = data.filter(item => item.Date === latestDate);

  let contentList = [];
  
  targetData.forEach(item => {
    if (item.Examples && Array.isArray(item.Examples)) {
      item.Examples.forEach(ex => {
        if (typeof ex === 'object' && ex !== null) {
          // 객체일 경우 바로 사용
          contentList.push({
            keyword: item.Keyword,
            source: ex.platform || '알 수 없음',
            text: ex.text,
            score: item.Score, 
            mentions: item.Mentions
          });
        } else if (typeof ex === 'string') {
          // 문자열일 경우 정규식으로 추출
          const match = ex.match(/^\[(.*?)\]/); 
          if (match) {
            const source = match[1];
            contentList.push({
              keyword: item.Keyword,
              source: source,
              text: ex.replace(/^\[.*?\](\(comment\)|\(post\))?\s*/, ''),
              score: item.Score, 
              mentions: item.Mentions
            });
          }
        }
      });
    }
  });

  // 플랫폼 필터링
  if (platform === 'youtube') {
    contentList = contentList.filter(c => c.source.includes('youtube'));
  } else if (platform === 'community') {
    contentList = contentList.filter(c => !c.source.includes('youtube'));
  }

  // 인기순 정렬
  contentList.sort((a, b) => b.score - a.score);
  
  // ✅ 핵심 수정 4: Top 5 자르고 순위(rank)를 1~5로 새로 매김
  const response = contentList.slice(0, 5).map((item, index) => ({
    rank: index + 1, // 여기서 순위를 1, 2, 3... 으로 재설정
    title: item.keyword,
    desc: item.text.length > 50 ? item.text.substring(0, 50) + "..." : item.text,
    stats: `관련 언급 ${item.mentions}회 • ${item.source}`,
    thumbnail: null 
  }));

  res.json(response);
});

// 전역 변수로 비디오 캐시 저장소 선언
let videoCache = {}; // 형식: { '챌린지': { data: [...], timestamp: 12345678 } }

// [HomePage] 유튜브 리스트 API (추가)
app.get('/api/videos', async (req, res) => {
  const { category } = req.query;
  const API_KEY = process.env.YOUTUBE_API_KEY; // API 키 가져오기

  // 캐시 유효 시간 : 2시간 (밀리초단위)
  const CACHE_DURATION = 2 * 60 * 60 * 1000;
  const now = Date.now()

  // 캐시 확인 로직
  // 해당 카테고리의 데이터가 있고, 2시간이 지나지 않았다면 캐시된 데이터 반환
  if (videoCache[category] && (now - videoCache[category].timestamp < CACHE_DURATION)) {
    console.log(`📦 [Video Cache] '${category}' - 캐시 데이터 반환 (API 호출 안함)`);
    return res.json(videoCache[category].data);
  }

  console.log(`📡 [Youtube API] '${category}' - 새 데이터 요청 중...`);

  try {
    let videos = [];

    // ✅ CASE 1: '챌린지' 탭일 경우 -> 검색 API 사용 (쇼츠 필터링)
    if (category === '챌린지') {
      // 3일 전 날짜 계산
      const date = new Date();
      date.setDate(date.getDate() - 3) // 3일 전으로 설정
      const publishedAfter = date.toISOString();

      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: '챌린지',           // 검색어
          type: 'video',          // 동영상만
          videoDuration: 'short', // ✅ 핵심: 4분 미만 (쇼츠 포함)
          order: 'viewCount',     // 조회수 순 정렬
          publishedAfter: publishedAfter, // 1주일 내 영상만 필터링
          maxResults: 50,
          regionCode: 'KR',
          key: API_KEY
        }
      });

      // ✅ [핵심] '#무슨무슨챌린지' 패턴만 찾고, 순수 '#챌린지'는 제외
      const strictFilteredItems = response.data.items.filter(item => {
        // 제목과 설명을 합쳐서 검사
        const text = (item.snippet.title + " " + item.snippet.description);
        
        // 정규식 설명:
        // 1. # : 해시태그로 시작
        // 2. [^\s#]+ : 공백이나 #이 아닌 글자가 1개 이상 있음 (여기가 '무슨무슨'에 해당)
        // 3. 챌린지 : 끝이 '챌린지'로 끝남
        // 예: #슬릭백챌린지 (O), #챌린지 (X - 중간 글자가 없으므로)
        const specificChallengeRegex = /#[^\s#]+챌린지/g;

        const matches = text.match(specificChallengeRegex);

        // 매칭된 태그가 하나라도 있으면 통과
        // (단, 혹시라도 '#챌린지' 자체가 매칭되는 걸 방지하기 위해 이중 체크)
        if (matches) {
            // 추출된 태그들 중 '#챌린지'와 정확히 일치하지 않는 것이 하나라도 있으면 true
            return matches.some(tag => tag !== '#챌린지');
        }
        
        return false;
      });

      // 검색 API 응답 포맷 매핑
      videos = strictFilteredItems.slice(0, 12).map(item => ({
        id: item.id.videoId, // 검색 API는 id가 객체 형태임
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        views: 0, // 검색 API는 조회수 미제공(상세 조회 비용 절약을 위해 0처리)
        publish_time: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium.url,
        scraped_category_name: '챌린지'
      }));

    } 
    // ✅ CASE 2: 일반 카테고리 -> 인기 동영상 API 사용 (기존 로직)
    else {
      const categoryMap = {
        '전체': '',
        '음악': '10',
        '엔터테인먼트': '24',
        '게임': '20',
        '뉴스': '25',
        '스포츠': '17',
        '브이로그': '22',
      };

      const categoryId = categoryMap[category] || '';

      const apiParams = {
        part: 'snippet,statistics',
        chart: 'mostPopular',
        regionCode: 'KR',
        maxResults: 12,
        key: API_KEY
      };

      if (categoryId) {
        apiParams.videoCategoryId = categoryId;
      }

      const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: apiParams
      });

      videos = response.data.items.map(item => ({
        id: item.id, // 인기 동영상 API는 id가 문자열
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        views: item.statistics.viewCount || 0,
        publish_time: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails.medium.url,
        scraped_category_name: category || '인기'
      }));
    }

    // 데이터 캐싱 저장
    // 성공적으로 데이터를 가져왔다면 메모리에 저장 (타임스탬프 갱신)
    if (videos.length > 0) {
      videoCache[category] = {
        data: videos,
        timestamp: Date.now()
      };
      console.log(`💾 [Video Cache] '${category}' - 데이터 저장 완료`);
    }

    res.json(videos);

  } catch (error) {
    console.error(`❌ 유튜브 API 에러 (${category}):`, error.message);
    
    // 에러 발생 시, 만약 유효기간이 지났더라도 이전 캐시 데이터가 있다면(Fallback) 보여주는 것이 좋음
    if (videoCache[category]) {
        console.log(`⚠️ 에러 발생으로 만료된 캐시 데이터 반환`);
        return res.json(videoCache[category].data);
    }
    res.json([]);
  }
});

// [HomePage] 커뮤니티 인기글 전용 API
app.get('/api/community/posts', (req, res) => {
  try {
    const { platform } = req.query; // theqoo, dcinside, fmkorea 등
    
    // 1. dataLoader를 통해 최신 배열 데이터 가져오기
    const platformPosts = getCommunityHotPosts(platform);

    // 2. 프론트엔드에서 쓰기 좋게 10개만 가공
    const response = platformPosts.slice(0, 10).map((post, index) => ({
      rank: index + 1,
      // 크롤러마다 대소문자나 키 이름이 다를 수 있으므로 방어적으로 모두 체크
      title: post.title || post.Title || post.subject || post.Subject || post.text || "제목 없음", 
      link: post.link || post.url || post.href || post.Link || post.Url || "#"
    }));

    res.json(response);
  } catch (error) {
    console.error("❌ /api/community/posts 에러:", error);
    res.json([]);
  }
});

// [AnalysisPage] 상세 분석 API
app.get('/api/analysis', async (req, res) => {
  const { keyword, startDate, endDate } = req.query;
  const API_KEY = process.env.YOUTUBE_API_KEY; // API 키 로드

  if (!keyword) return res.status(400).json({ error: 'Keyword required' });

  // 1. 캐시 확인
  const now = Date.now();
  if (!startDate && !endDate && searchCache[keyword] && (now - searchCache[keyword].timestamp < 60 * 60 * 1000)) {
     console.log(`📦 [Cache] 캐시된 데이터 반환: ${keyword}`);
     return res.json(searchCache[keyword].data);
  }

  try {
    // 1. [로컬 분석] 키워드 기본 정보 찾기
    const currentItem = findKeywordOverAll(keyword);
    if (!currentItem) return res.json({ found: false, message: "데이터 없음" });

    // 2. [로컬 분석] 히스토리 데이터 구성 (모든 포맷 호환)
    const historyMap = getHistoryData();
    const dates = Object.keys(historyMap).sort();

    const history = dates.map(date => {
        const dayData = historyMap[date];
        
        // 포맷 호환 어댑터
        let allArray = [];
        let platformsObj = {};
        if (dayData.all) {
            allArray = dayData.all;
            platformsObj = dayData;
        } else if (dayData.Integrated_Trends) {
            allArray = dayData.Integrated_Trends;
            platformsObj = dayData.Platform_Trends || {};
        } else if (Array.isArray(dayData)) {
            allArray = dayData;
        }

        let found = allArray.find(item => (item.Keyword || item.keyword) === keyword);
        
        if (!found) {
            for (const pKey of Object.keys(platformsObj)) {
                if (['all', 'meta', 'Integrated_Trends', 'Platform_Trends'].includes(pKey)) continue;
                const pList = Array.isArray(platformsObj[pKey]) ? platformsObj[pKey] : [];
                const pItem = pList.find(pi => (pi.Keyword || pi.keyword) === keyword);
                if (pItem) {
                    found = pItem;
                    break; 
                }
            }
        }

        // 구/신형 키값 모두 확인하여 언급량 추출
        const mentions = found ? (found.Target_Day_Mentions || found.Target_Week_Mentions || found.Total_Mentions || found.Mentions || found.Count || 0) : 0;

        return {
          date: date,
          mentions: mentions
        };
    });

    // 3. [로컬 분석] 댓글 수집 및 워드클라우드 (모든 포맷 호환)
    let rawCommentsMap = new Map(); // 중복 제거용 Map

    dates.forEach(date => {
        const dayData = historyMap[date];
        
        let allArray = [];
        let platformsObj = {};
        if (dayData.all) {
            allArray = dayData.all;
            platformsObj = dayData;
        } else if (dayData.Integrated_Trends) {
            allArray = dayData.Integrated_Trends;
            platformsObj = dayData.Platform_Trends || {};
        } else if (Array.isArray(dayData)) {
            allArray = dayData;
        }

        // 통합 및 플랫폼 데이터를 모두 순회하며 댓글 추출하는 내부 함수
        const extractComments = (item, defaultSource) => {
            if (!item || !item.Examples) return;
            
            // Examples가 객체형({"theqoo": [...]})이거나 배열형([...])일 수 있음
            const examplesList = Array.isArray(item.Examples) 
                ? item.Examples 
                : (typeof item.Examples === 'object' ? Object.values(item.Examples).flat() : []);

            examplesList.forEach(ex => {
                const isObj = typeof ex === 'object' && ex !== null;
                const text = isObj ? (ex.comment || ex.text) : ex;
                if (!text || typeof text !== 'string') return;

                let source = isObj ? (ex.platform || defaultSource) : defaultSource;
                let link = isObj ? (ex.link || null) : null;
                let cleanText = text;

                // "[youtube] 내용..." 형태 분리
                if (!isObj && text.startsWith('[')) {
                    const match = text.match(/^\[(.*?)\](?:\(.*\))?\s*(.*)/);
                    if (match) { source = match[1]; cleanText = match[2]; }
                }

                // _trends 같은 불필요한 꼬리표 떼기
                source = source.replace('_trends', '');

                if (!rawCommentsMap.has(cleanText)) {
                    rawCommentsMap.set(cleanText, { source, text: cleanText, link });
                }
            });
        };

        // 1) 통합 데이터에서 추출
        extractComments(allArray.find(i => (i.Keyword || i.keyword) === keyword), 'all');

        // 2) 플랫폼별 데이터에서 추출
        Object.keys(platformsObj).forEach(pKey => {
            if (['all', 'meta', 'Integrated_Trends', 'Platform_Trends'].includes(pKey)) return;
            const pList = Array.isArray(platformsObj[pKey]) ? platformsObj[pKey] : [];
            extractComments(pList.find(i => (i.Keyword || i.keyword) === keyword), pKey);
        });
    });

    const parsedComments = Array.from(rawCommentsMap.values());
    const wordCloudData = extractWordCloudData(parsedComments, keyword);

    // 4. 유튜브 영상 검색 (API 연동 - 유지)
    let relatedVideos = [];
    if (API_KEY) {
      try {
        const searchParams = {
            part: 'snippet', q: keyword, type: 'video', maxResults: 3, key: API_KEY, regionCode: 'KR', order: 'date'
        };
        if (startDate) searchParams.publishedAfter = toISODate(startDate);
        if (endDate) searchParams.publishedBefore = toISODate(endDate, true);

        const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', { params: searchParams });
        const videoIds = searchRes.data.items.map(i => i.id.videoId).join(',');
        
        if (videoIds) {
          const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: { part: 'snippet,statistics', id: videoIds, key: API_KEY }
          });
          
          relatedVideos = videoRes.data.items.map(item => ({
            id: item.id,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            views: item.statistics.viewCount,
            thumbnail: item.snippet.thumbnails.medium.url,
            publish_time: item.snippet.publishedAt
          }));
        }
      } catch (err) {
        console.error("❌ 유튜브 API 에러:", err.message);
      }
    }

    if (relatedVideos.length === 0) {
        const youtubeComments = parsedComments.filter(c => c.source.toLowerCase().includes('youtube'));
        relatedVideos = youtubeComments.slice(0, 3).map((c, i) => ({
            id: `local-${i}`,
            title: c.text.length > 50 ? c.text.substring(0, 50) + "..." : c.text,
            channel: 'YouTube 반응 (Local)',
            views: 0,
            thumbnail: 'https://via.placeholder.com/320x180/E5E7EB/9CA3AF?text=No+Video',
            publish_time: new Date().toISOString()
        }));
    }

    // 5. 최종 응답 데이터 구성 및 캐싱
    const finalResponse = {
      found: true,
      keyword: currentItem.Keyword,
      rank: currentItem.Rank,
      totalMentions: currentItem.Target_Day_Mentions || currentItem.Target_Week_Mentions || currentItem.Total_Mentions || currentItem.Mentions || 0,
      score: currentItem.Trend_Score || currentItem.Score || 0,
      history: history,
      comments: parsedComments,
      wordCloud: wordCloudData,
      videos: relatedVideos 
    };

    if (!startDate && !endDate) {
        searchCache[keyword] = { data: finalResponse, timestamp: now };
    }

    res.json(finalResponse);

  } catch (error) {
    console.error("❌ /api/analysis 에러:", error);
    res.status(500).json({ error: 'Server Error' });
  }
});
  

// 6. [AnalysisPage] 뉴스 RSS API (구글 뉴스 검색 활용)
app.get('/api/news', async (req, res) => {
  const { keyword, startDate, endDate } = req.query;
  if (!keyword) return res.json([]);

  try {
    let query = `${keyword}`;
    if (startDate) query += ` after:${startDate}`;
    if (endDate) query += ` before:${endDate}`;

    console.log(`📰 뉴스 검색 쿼리: ${query}`);

    // 구글 뉴스 RSS (네이버는 API 키 필요, 구글은 무료/공개)
    // 한글 검색을 위해 URL 인코딩 필수
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
    
    const feed = await parser.parseURL(feedUrl);
    
    // 프론트엔드에서 쓰기 좋게 가공 (최신 5개만)
    const newsItems = feed.items.slice(0, 5).map(item => {
      // 2. 언론사 이름 추출 로직 강화
      let publisher = 'Google News';

      // newsSource가 존재하는 경우 처리
      if (item.newsSource) {
        // case A: 단순 문자열인 경우
        if (typeof item.newsSource === 'string') {
          publisher = item.newsSource;
        } 
        // case B: 객체인 경우 (속성이 있어서 { _: '연합뉴스', $: {url: ...} } 형태로 올 때)
        else if (item.newsSource._) {
          publisher = item.newsSource._;
        }
      }

      return {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        source: publisher // 추출한 언론사 이름 적용
      };
    });

    res.json(newsItems);
  } catch (error) {
    console.error('RSS Error:', error);
    res.json([]);
  }
});

let summaryCache = {};
let summaryLocks = {};

// ✅ 7. [AI] LM Studio 연동 요약 API (크리에이터 조언 & 붉은 강조 모드)
app.get('/api/summary', async (req, res) => {
  const { keyword, startDate, endDate } = req.query;
  if (!keyword) return res.status(400).json({ error: 'Keyword required' });

  const now = Date.now();
  if (!startDate && !endDate && summaryCache[keyword] && (now - summaryCache[keyword].timestamp < 60 * 60 * 1000)) {
     console.log(`📦 [Summary Cache] 캐시된 요약 데이터 반환: ${keyword}`);
     return res.json({ summary: summaryCache[keyword].data });
  }

  if (!startDate && !endDate) {
      if (summaryLocks[keyword]) {
          console.log(`🛑 [Lock] 이미 분석 중인 키워드입니다. 중복 요청 차단: ${keyword}`);
          // 두 번째 밀려온 요청은 쳐내버립니다. (프론트엔드는 첫 번째 요청의 응답을 쓸 것임)
          return res.status(429).json({ summary: "잠시 후 다시 시도해주세요." });
      }
      summaryLocks[keyword] = true; // 문 걸어 잠그기!
  }

  try {
    // -------------------------------------------------------
    // 1️⃣ 데이터 수집 (기존과 동일)
    // -------------------------------------------------------
    const currentItem = findKeywordOverAll(keyword);
    if (!currentItem) return res.json({ summary: "데이터가 부족하여 분석할 수 없습니다." });

    const historyMap = getHistoryData();
    const dates = Object.keys(historyMap).sort();
    
    let collectedComments = [];
    let platformStats = {};

    dates.forEach(date => {
        const dayData = historyMap[date];
        if (dayData.integrated) {
            const item = dayData.integrated.find(i => i.Keyword === keyword);
            if (item?.Examples) collectedComments.push(...item.Examples);
        }
        if (dayData.platform) {
            Object.keys(dayData.platform).forEach(pKey => {
                const pList = Array.isArray(dayData.platform[pKey]) ? dayData.platform[pKey] : [];
                const pItem = pList.find(pi => (pi.Keyword || pi.keyword) === keyword);
                if (pItem) {
                    const count = parseInt(pItem.Total_Mentions || pItem.Count || 0, 10);
                    platformStats[pKey] = (platformStats[pKey] || 0) + count;
                    if (pItem.Examples) collectedComments.push(...pItem.Examples);
                }
            });
        }
    });

    let topPlatform = "알 수 없음";
    let maxCount = -1;
    Object.entries(platformStats).forEach(([plat, count]) => {
        if (count > maxCount) {
            maxCount = count;
            topPlatform = plat;
        }
    });

    // -------------------------------------------------------
    // 2️⃣ 데이터 셔플 & 정제
    // -------------------------------------------------------
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    const refinedComments = shuffleArray([...new Set(collectedComments)])
        .map(c => {
            // [수정] c가 객체({ text, link... })이면 text만 꺼내고, 문자열이면 그대로 사용
            const text = (typeof c === 'object' && c !== null && c.text) ? c.text : c;
            // 문자열이 아닐 경우 빈 문자열 반환 (에러 방지)
            if (typeof text !== 'string') return '';
            return text.replace(/\n/g, ' ').trim();
        }) 
        .filter(c => c.length > 10) 
        .slice(0, 10) 
        .map(c => c.length > 80 ? c.substring(0, 80) : c);

    const commentsForPrompt = refinedComments.length > 0 
        ? refinedComments.map(c => `- "${c}"`).join('\n')
        : "관련 댓글 데이터가 없습니다.";

    // -------------------------------------------------------
    // 뉴스 데이터 수집 (구글 뉴스 RSS)
    // -------------------------------------------------------
    let newsContext = "관련된 최신 뉴스가 없습니다.";
    try{
      let newsQuery = `${keyword}`;
      if (startDate) newsQuery += ` after:${startDate}`;
      if (endDate) newsQuery += ` before:${endDate}`;

      console.log(`뉴스 검색 시작 : ${newsQuery}`);

      const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(newsQuery)}&hl=ko&gl=KR&ceid=KR:ko`;
      const feed = await parser.parseURL(feedUrl);

      // 뉴스 기사 3개만 추출해서 프롬프트에 넣음
      if (feed.items && feed.items.length > 0) {

        // 2. 필터링된 기사 중 상위 3개만 사용
        newsContext = feed.items.slice(0, 5).map(item => {
          const title = item.title || "";
          // 본문(Snippet)이 있으면 가져오고, 너무 길면 200자로 자름
          let snippet = item.contentSnippet || item.content || "";
          snippet = snippet.length > 200 ? snippet.substring(0, 200) + "..." : snippet;
          
          return `- [기사 제목] ${title}\n  [기사 내용] ${snippet}`;
        }).join('\n\n');
      }
    } catch (newsErr) {
        console.log("뉴스 수집 실패:", newsErr.message);
    }

    // -------------------------------------------------------
    // 3️⃣ Prompt Engineering (크리에이터/마케터 포커스)
    // -------------------------------------------------------
    
    const systemPrompt = `
    당신은 콘텐츠 크리에이터를 위한 '트렌드 분석 전문가'입니다.
    오직 제공된 [뉴스 팩트]와 [대중 반응]을 종합하여 키워드를 콘텐츠로 다룰 때 필요한 정보를 브리핑하세요.
    말투는 "~함", "~임" 체를 사용하여 보고서처럼 명확하게 작성하세요.
    `;
    
    const userPrompt = `
    [분석 키워드]: ${keyword}
    [최신 뉴스 팩트]: ${newsContext}
    [주요 확산처]: ${topPlatform}
    [대중 반응]:
    ${commentsForPrompt}

    위 내용을 바탕으로 **총 450자 이내**로 명확하게 요약해.

    [필수 문장 구성]
    1. **정의 및 배경**:  
       - **[줄임말 해독]**: 키워드가 줄임말이라면 뉴스 데이터를 분석해 **원래 단어**를 찾아 설명할 것.
       - **(주의)** 뉴스 팩트에 '저렴하다'는 명확한 언급이 없다면, 절대 '가격이 저렴하다'고 추측해서 쓰지 말 것. (오히려 최근 유행 간식은 비싼 경우가 많음)

    2. **여론 및 반응**: 
       - 대중들의 감정(긍정/부정)과 주요 의견을 핵심만 요약함.
       - **(해석 가이드)**: 
         - "국밥 가격이다", "사악하다", "텅장된다" 등의 표현은 **'가격이 매우 비싸다'는 부정적/비판적 반응**으로 해석할 것. (절대 칭찬이나 가성비 좋다는 뜻이 아님)

    3. **크리에이터 팁 & 주의점**: 
       - 제작에 도움되는 꿀팁을 평범한 텍스트로 작성함.
       - **(조건부 경고)**: 명확한 리스크(논란, 가짜뉴스 등)가 생길 수 있을 때만 해당 문장을 **<<< 와 >>>** 로 감싸서 출력함.

    [스타일 제약]
    1. **문장 끝을 절대 '다.'로 끝내지 말 것.** (~함, ~임 체 사용)
    2. 없는 사실을 지어내지 말 것.
    3. **(중요) 아래 [출력 예시]의 내용을 그대로 베끼지 말고, 반드시 분석 키워드인 '${keyword}'에 맞는 내용을 작성할 것.**
    4. **같은 내용을 두 번 반복해서 출력하지 말 것.**

    [출력 예시]
    정의 및 배경: '두쫀쿠'는 '두바이 쫀득 쿠키'의 줄임말로, 최근 편의점 신상으로 출시되어 품절 대란을 일으킴. 
    여론 및 반응: 맛에 대해서는 호평하지만, 일부는 "쿠키 하나가 국밥 값이다"라며 높은 가격에 대해 불만을 표함.
    크리에이터 팁 & 주의점: 편의점 앱 재고 조회 꿀팁을 함께 다루면 좋음.
    `;

    // -------------------------------------------------------
    // 4️⃣ AI API 요청 (OpenAI vs Local 분기 처리)
    // -------------------------------------------------------
    const provider = process.env.AI_PROVIDER || 'local'; // 기본값 local
    let rawContent = "";

    console.log(`🤖 AI 요약 요청 [${keyword}] (Mode: ${provider})`);

    if (provider === 'openai') {
      // [Option A] OpenAI GPT API 사용
      const openaiResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: "gpt-4o-mini", // 가성비 모델 (또는 "gpt-4o", "gpt-3.5-turbo")
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3, // 명확한 사실 전달을 위해 낮춤
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          }
        }
      );
      rawContent = openaiResponse.data.choices[0].message.content;

    } else {
      // [Option B] 로컬 LM Studio 사용 (기존 코드)
      const localUrl = process.env.LOCAL_LLM_URL || 'http://192.168.219.107:1234/v1/chat/completions';
      
      const localResponse = await axios.post(localUrl, {
        model: "local-model",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });
      rawContent = localResponse.data.choices[0].message.content;
    }

    // -------------------------------------------------------
    // 5️⃣ 후처리 (특수 기호를 HTML 스타일 태그로 변환)
    // -------------------------------------------------------
    let finalSummary = rawContent.trim();
    // finalSummary = finalSummary.replace(/^\d+\.\s*/gm, '');

    // [강제] 볼드체(**) 제거 
    finalSummary = finalSummary.replace(/\*\*/g, '');

    // [강제] 불필요한 헤더 제거 (혹시 AI가 또 출력했을 경우를 대비)
    finalSummary = finalSummary.replace(/\[작성 양식\]/g, '').replace(/\[출력 예시\]/g, '');

    // 🔥 [핵심] <<<문장>>> 을 찾아서 빨간색 볼드체 HTML로 변환
    // Tailwind CSS 클래스 (text-red-600 font-bold) 또는 인라인 스타일 사용
    finalSummary = finalSummary.replace(
        /<<<(.*?)>>>/g, 
        '<span style="color: #e11d48; font-weight: 800; background-color: #ffe4e6; padding: 2px 5px; border-radius: 4px;">⚠️ $1</span>'
    );

    finalSummary = finalSummary.replace(
        /(★?주의할\s*점|★?주의사항|⚠️\s*주의|★?주의):\s*(.*)/g,
        '<br><span style="color: #e11d48; font-weight: 800; background-color: #ffe4e6; padding: 2px 5px; border-radius: 4px;">⚠️ $2</span>'
    );

    // 플랫폼 정보 추가
    finalSummary += `\n\n(🔥 Hot: ${topPlatform})`;

    console.log("✅ AI 요약 완료!");

    if (!startDate && !endDate) {
      summaryCache[keyword] = {
        data: finalSummary,
        timestamp: now // 라우트 최상단에 선언된 now 변수 사용
      };
      console.log(`💾 [Summary Cache] 요약 결과 캐시 저장 완료: ${keyword}`);
      delete summaryLocks[keyword];
    }

    res.json({ summary: finalSummary });

  } catch (error) {
    // 에러 상세 로그 출력 (OpenAI 에러 메시지 확인용)
    if (!startDate && !endDate) {
        delete summaryLocks[keyword]; // ✅ 에러가 났을 때도 자물쇠를 꼭 풀어줘야 합니다.
    }
    if (error.response) {
        console.error("❌ AI API 에러 응답:", error.response.status, error.response.data);
    } else {
        console.error("❌ 서버 내부 에러:", error.message);
    }
    res.json({ summary: "현재 AI 분석 서비스를 이용할 수 없습니다." });
  }
});

// 서버 시작
loadTrendData().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});