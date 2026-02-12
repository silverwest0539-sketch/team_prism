const express = require('express');
const cors = require('cors');
const axios = require('axios')
const path = require('path')
const { loadTrendData, getLatestData, getYoutubeData, getHistoryData, getLatestPlatformData, findKeywordOverAll } = require('./dataLoader');
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
  const text = comments.join(' ');
  
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
  const data = getLatestData();
  if (data.length === 0) return res.json([]);

  // ✅ 핵심 수정 1: 전체 데이터 중 '가장 큰 날짜(최신)'를 직접 계산
  const latestDate = data.reduce((max, curr) => curr.Date > max ? curr.Date : max, data[0].Date);
  console.log(`🔎 급상승 키워드 요청됨 - 최신 날짜 기준: ${latestDate}`);

  // ✅ 핵심 수정 2: 최신 날짜 데이터만 필터링 + 랭크순 정렬
  const latestTrends = data
    .filter(item => item.Date === latestDate)
    .sort((a, b) => a.Rank - b.Rank)
    .slice(0, 5); // Top 5

  // 변동률 계산을 위한 어제 날짜 데이터 찾기
  const allDates = [...new Set(data.map(d => d.Date))].sort().reverse();
  const prevDate = allDates[1]; 
  const prevTrends = prevDate ? data.filter(item => item.Date === prevDate) : [];

  const response = latestTrends.map(item => {
    const prevItem = prevTrends.find(p => p.Keyword === item.Keyword);
    let changeRate = 0;
    let isUp = true;
    
    if (prevItem) {
        changeRate = ((item.Score - prevItem.Score) / prevItem.Score) * 100;
        isUp = changeRate >= 0;
    }

    // 예시 텍스트 추출 (Examples 배열의 첫 번째 값)
    const rawExample = item.Examples && item.Examples.length > 0 ? item.Examples[0] : "";
    // [platform] 태그 제거 정규식
    const cleanExample = rawExample.replace(/^\[.*?\]\s*/, '');

    return {
      rank: item.Rank, // 원본 랭크 사용
      keyword: item.Keyword,
      volume: `언급량 ${item.Mentions.toLocaleString()}회`,
      change: `${isUp ? '▲' : '▼'} ${Math.abs(changeRate).toFixed(1)}%`,
      isUp: isUp,
      desc: cleanExample || "관련된 코멘트가 없습니다.",
      color: isUp ? 'red' : 'blue'
    };
  });

  res.json(response);
});

// 플랫폼별 상위 키워드 API
app.get('/api/trends/platform', (req, res) => {
  const { platform } = req.query;
  let targetKey = platform;
  if (platform === 'dcinside') targetKey = 'dc'; 
  if (platform === 'natepan') targetKey = 'nate';
  if (platform === 'x') targetKey = 'x_trends';

  const reqPlatform = getLatestPlatformData(targetKey || 'all'); 

  if (!reqPlatform || reqPlatform.length === 0) {
      return res.json([]);
  }

  // 플랫폼 매핑
  const platformMap = {
    'youtube': 'youtube',
    'dcinside': 'dc_lol',
    'theqoo': 'theqoo',
    'natepan': 'nate',
    'fmkorea': 'fmkorea',
    'ruliweb': 'ruliweb',
    'x': 'x_trends'
  };

  // // 1. 데이터 키값 정규화 (대문자 -> 소문자 통일)
  // // 예: Item.Keyword -> item.keyword, Item.Count -> item.count
  // const normalizedData = data.map(item => ({
  //   platform: item.Platform || 'Unknown',
  //   keyword: item.Keyword || '키워드 없음',
  //   count: item.Count || item.mentions || item.Mentions || 0,
  //   comments: item.Examples || item.Comments || []
  // }));

  // let filteredData = normalizedData;

  // // 2. 필터링
  // if (reqPlatform !== 'all' && reqPlatform !== 'community') {
  //   const targetPlatformName = platformMap[reqPlatform] || reqPlatform;
  //   filteredData = normalizedData.filter(item => item.platform.includes(targetPlatformName));
  // }

  // // 3. 정렬 (count 기준)
  // filteredData.sort((a, b) => b.count - a.count);

  // // 4. 반환
  // res.json(filteredData.slice(0, 5).map((item, idx) => ({
  //     ...item,
  //     rank: idx + 1 // 순위 재산정
  // })));

  const response = reqPlatform
    .sort((a, b) => a.Rank - b.Rank) // 언급량 내림차순
    .slice(0, 5)
    .map((item, idx) => {
        const rawEx = item.Examples && item.Examples.length > 0 ? item.Examples[0] : "";
        const cleanEx = rawEx.replace(/^\[.*?\]\s*/, '');
        
        return {
          rank: item.Rank,
          keyword: item.Keyword,
          count: item.Total_Mentions || 0, // ✅ 해당 플랫폼 내 언급량 사용
          platform: platform,
          desc: cleanEx
        };
    });

  res.json(response);
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
        // 태그 추출 (예: [youtube])
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

// [HomePage] 유튜브 리스트 API (추가)
app.get('/api/videos', async (req, res) => {
  const { category } = req.query;
  const API_KEY = process.env.YOUTUBE_API_KEY; // API 키 가져오기

  // 카테고리 이름 -> 유튜브 카테고리 ID 매핑
  const categoryMap = {
    '전체': '', // 전체는 ID 없음 (기본값)
    '음악': '10',
    '엔터테인먼트': '24',
    '게임': '20',
    '뉴스': '25',
    '스포츠': '17',
    '영화/드라마': '1', // 영화/애니메이션
    '브이로그': '22', // 인물/블로그
  };

  const categoryId = categoryMap[category] || '';

  try {
    // 1. 유튜브 인기 동영상 API 호출 (chart=mostPopular)
    const apiParams = {
      part: 'snippet,statistics',
      chart: 'mostPopular',
      regionCode: 'KR',
      maxResults: 12,
      key: API_KEY
    };

    // categoryId가 빈 문자열('')이 아닐 때만 파라미터에 추가
    if (categoryId) {
      apiParams.videoCategoryId = categoryId;
    }

    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: apiParams // 수정된 params 객체 사용
    });

    // 2. 프론트엔드 형식에 맞춰 데이터 가공
    const videos = response.data.items.map(item => ({
      id: item.id,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      views: item.statistics.viewCount || 0,
      publish_time: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails.medium.url,
      scraped_category_name: category || '인기'
    }));

    res.json(videos);

  } catch (error) {
    console.error("유튜브 인기 동영상 로드 실패:", error.message);
    // 에러 발생 시 빈 배열 반환 (화면이 깨지지 않게)
    res.json([]);
  }
});

// app.get('/api/youtube/list', (req, res) => {
//   const videoData = getYoutubeData();
//   const category = req.query.category || '전체'; // 프론트에서 보낸 한글 카테고리

//   // 1. [핵심] 한글 버튼 -> 유튜브 데이터의 영어 카테고리 매핑
//   const categoryMap = {
//     '게임': ['Gaming'],
//     '음악': ['Music'],
//     '라이프': ['Howto_Style'], 
//     '일상': ['People_Blogs'], 
//     '코미디': ['Comedy', 'Entertainment'],
//     '전체': []
//   };

//   let filteredData = videoData;

//   // 2. 카테고리 필터링 (scraped_category_name 활용)
//   if (category !== '전체') {
//     const targetCategories = categoryMap[category] || [];

//     filteredData = videoData.filter(video => {
//       // ✅ [핵심 수정] 데이터의 카테고리에서 공백 제거 (.trim())
//       const rawCategory = video.scraped_category_name || "";
//       const cleanCategory = rawCategory.trim(); 

//       // 1) 카테고리 이름이 일치하는지 확인
//       const isCategoryMatch = targetCategories.includes(cleanCategory);
      
//       return isCategoryMatch 
//     });
//   }

//   // video_id 기준 중복 제거 로직
//   // Set을 사용하여 이미 담은 ID는 건너뜁니다.
//   const uniqueData = [];
//   const seenIds = new Set();

//   filteredData.forEach(video => {
//     if (!seenIds.has(video.video_id)) {
//       seenIds.add(video.video_id); // ID 등록
//       uniqueData.push(video);      // 데이터 담기
//     }
//   });
  
//   filteredData = uniqueData;
 
//     // if (targetCategories) {
//     //   filteredData = videoData.filter(video => {
//     //     // 데이터에 있는 카테고리 값 (없을 경우 대비해 안전하게 처리)
//     //     const videoCategory = video.scraped_category_name || "";
        
//     //     // 매핑된 리스트 중에 포함되는지 확인 (예: 'Gaming'이 리스트에 있나?)
//     //     return targetCategories.includes(videoCategory);
//     //   });
//     // }
//   // }

//   // 3. 조회수 기준 내림차순 정렬 & 데이터 가공
//   filteredData.sort((a, b) => {
//     // 정규식: 한글이 한 글자라도 포함되어 있는지 확인
//     const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    
//     // 제목이나 채널명에 한글이 있는지 체크 (제목만 검사하려면 a.title만 쓰면 됩니다)
//     const isAKorean = koreanRegex.test(a.title) || koreanRegex.test(a.channel);
//     const isBKorean = koreanRegex.test(b.title) || koreanRegex.test(b.channel);

//     // [1단계] 언어 우선순위 비교
//     // A는 한글이고 B는 영어면 -> A가 앞으로 (-1)
//     if (isAKorean && !isBKorean) {
//       return -1; 
//     }
//     // A는 영어고 B는 한글이면 -> B가 앞으로 (1)
//     if (!isAKorean && isBKorean) {
//       return 1;
//     }

//     // [2단계] 언어 조건이 같다면(둘 다 한글 or 둘 다 영어), 조회수 비교
//     return b.stats.views - a.stats.views;
//   });
  
//   // 필요한 데이터만 정제해서 전송 (선택사항)
//   const formattedData = filteredData.map(video => ({
//     id: video.video_id,
//     title: video.title,
//     channel: video.channel,
//     views: video.stats.views,
//     publish_time: video.publish_time,
//     category: video.scraped_category_name, // 확인용
//     // 유튜브 썸네일 URL 공식: https://img.youtube.com/vi/[video_id]/[옵션].jpg
//     thumbnail: `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`
//   }));

//   res.json(formattedData);
// });

// [AnalysisPage] 특정 키워드 상세 분석 API
// 사용법: /api/analysis?keyword=쿠팡
// [AnalysisPage] 상세 분석 API (댓글 통합 로직 추가)
// [AnalysisPage] 상세 분석 API
app.get('/api/analysis', async (req, res) => {
  const { keyword, startDate, endDate } = req.query;
  const API_KEY = process.env.YOUTUBE_API_KEY; // API 키 로드

  if (!keyword) return res.status(400).json({ error: 'Keyword required' });

  // -----------------------------------------------------------
  // ✅ 1. 캐시 확인 (API 비용 절약 핵심 로직)
  // -----------------------------------------------------------
  const now = Date.now();
  // 날짜 필터가 없고(전체 기간), 캐시에 데이터가 있으며, 1시간(60분)이 지나지 않았다면?
  if (!startDate && !endDate && searchCache[keyword] && (now - searchCache[keyword].timestamp < 60 * 60 * 1000)) {
     console.log(`📦 [Cache] 캐시된 데이터 반환: ${keyword}`);
     return res.json(searchCache[keyword].data);
  }
  // -----------------------------------------------------------

  try {
    // 1. [로컬 분석] 키워드 기본 정보 찾기
    const currentItem = findKeywordOverAll(keyword);
    if (!currentItem) return res.json({ found: false, message: "데이터 없음" });

    // 2. [로컬 분석] 히스토리 데이터 구성
    const historyMap = getHistoryData();
    const dates = Object.keys(historyMap).sort();

    const history = dates.map(date => {
        const dayData = historyMap[date];
        const dayIntegrated = dayData.integrated || [];
        let found = dayIntegrated.find(item => item.Keyword === keyword);
        
        if (!found && dayData.platform) {
            const platforms = dayData.platform;
            for (const pKey of Object.keys(platforms)) {
                const pList = Array.isArray(platforms[pKey]) ? platforms[pKey] : [];
                const pItem = pList.find(pi => (pi.Keyword || pi.keyword) === keyword);
                if (pItem) {
                    found = { Mentions: pItem.Total_Mentions || pItem.Count || 0 };
                    break; 
                }
            }
        }
        return {
          date: date,
          mentions: found ? (found.Mentions || found.Total_Mentions || 0) : 0
        };
    });

    // 3. [로컬 분석] 댓글 수집 및 워드클라우드
    let allRawComments = [];
    dates.forEach(date => {
        const dayData = historyMap[date];
        if (dayData.integrated) {
            const item = dayData.integrated.find(i => i.Keyword === keyword);
            if (item?.Examples) allRawComments.push(...item.Examples);
        }
        if (dayData.platform) {
            Object.keys(dayData.platform).forEach(pKey => {
                const pList = dayData.platform[pKey];
                const pItem = pList.find(i => (i.Keyword || i.keyword) === keyword);
                if (pItem?.Examples) {
                    allRawComments.push(...pItem.Examples.map(e => e.startsWith('[') ? e : `[${pKey}] ${e}`));
                }
            });
        }
    });

    const uniqueComments = [...new Set(allRawComments)];
    const parsedComments = uniqueComments.map(ex => {
      const match = ex.match(/^\[(.*?)\]\s*(.*)/);
      return match ? { source: match[1], text: match[2] } : null;
    }).filter(Boolean);

    const wordCloudData = extractWordCloudData(allRawComments, keyword);


    // -----------------------------------------------------------
    // ✅ 4. 유튜브 영상 검색 (API 연동)
    // -----------------------------------------------------------
    let relatedVideos = [];
    
    if (API_KEY) {
      try {
        console.log(`🚀 유튜브 검색 시작: [${keyword}] (기간: ${startDate || '전체'} ~ ${endDate || '전체'})`);
        
        // (1) 검색 파라미터 설정
        const searchParams = {
            part: 'snippet',
            q: keyword,
            type: 'video',
            maxResults: 3,
            key: API_KEY,
            regionCode: 'KR',
            order: 'date' // 최신순 정렬
        };

        // 날짜 필터가 있다면 파라미터에 추가 (toISODate 함수 필요)
        if (startDate) searchParams.publishedAfter = toISODate(startDate);
        if (endDate) searchParams.publishedBefore = toISODate(endDate, true);

        // (2) 검색 API 호출
        const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: searchParams
        });
        
        console.log(`📦 검색된 영상 개수: ${searchRes.data.items.length}개`);
        
        // (3) 상세 정보(조회수) 조회를 위한 ID 추출
        const videoIds = searchRes.data.items.map(i => i.id.videoId).join(',');
        
        if (videoIds) {
          const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
              part: 'snippet,statistics',
              id: videoIds,
              key: API_KEY
            }
          });
          
          relatedVideos = videoRes.data.items.map(item => ({
            id: item.id,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            views: item.statistics.viewCount, // 조회수
            thumbnail: item.snippet.thumbnails.medium.url,
            publish_time: item.snippet.publishedAt
          }));
        }
      } catch (err) {
        console.error("❌ 유튜브 API 에러:", err.message);
        // 에러가 나도 로컬 데이터는 보여주기 위해 relatedVideos는 빈 배열로 유지
      }
    } else {
        console.log("⚠️ API 키 없음: 유튜브 검색 생략");
    }

    // Fallback: API 실패 혹은 키 없음 시 로컬 댓글 데이터로 가짜 영상 데이터 생성 (선택 사항)
    if (relatedVideos.length === 0) {
        const youtubeComments = parsedComments.filter(c => c.source === 'youtube' || c.source === 'Youtube');
        relatedVideos = youtubeComments.slice(0, 3).map((c, i) => ({
            id: `local-${i}`,
            title: c.text.length > 50 ? c.text.substring(0, 50) + "..." : c.text,
            channel: 'YouTube 반응 (Local)',
            views: 0,
            thumbnail: 'https://via.placeholder.com/320x180/E5E7EB/9CA3AF?text=No+Video',
            publish_time: new Date().toISOString()
        }));
    }

    // -----------------------------------------------------------
    // ✅ 5. 최종 응답 데이터 구성 및 캐싱
    // -----------------------------------------------------------
    const finalResponse = {
      found: true,
      keyword: currentItem.Keyword,
      rank: currentItem.Rank,
      totalMentions: currentItem.Mentions || currentItem.Total_Mentions || 0,
      score: currentItem.Score,
      history: history,
      comments: parsedComments,
      wordCloud: wordCloudData,
      videos: relatedVideos 
    };

    // [캐싱 저장] 날짜 필터가 없는 '기본 검색'일 때만 저장합니다.
    if (!startDate && !endDate) {
        searchCache[keyword] = {
            data: finalResponse,
            timestamp: now
        };
        console.log(`💾 [Cache] 결과 저장 완료: ${keyword}`);
    }

    res.json(finalResponse);

  } catch (error) {
    console.error("서버 내부 에러:", error);
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

// ✅ 7. [AI] LM Studio 연동 요약 API (크리에이터 조언 & 붉은 강조 모드)
app.get('/api/summary', async (req, res) => {
  const { keyword, startDate, endDate } = req.query;
  if (!keyword) return res.status(400).json({ error: 'Keyword required' });

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
        .map(c => c.replace(/\n/g, ' ').trim()) 
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
    // 4️⃣ LM Studio 전송
    // -------------------------------------------------------
    console.log(`🤖 AI 요약 요청 [${keyword}] (Creator Advice Mode)`);
    
    const llmResponse = await axios.post(`http://localhost:1234/v1/chat/completions`, {
      model: "local-model",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1, 
      max_tokens: 1000
    });

    let rawContent = llmResponse.data.choices[0].message.content;

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
    res.json({ summary: finalSummary });

  } catch (error) {
    console.error("❌ 오류:", error.message);
    res.json({ summary: "분석 중 오류가 발생했습니다." });
  }
});

// 서버 시작
loadTrendData().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});