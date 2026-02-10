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
app.get('/api/youtube/list', (req, res) => {
  const videoData = getYoutubeData();
  const category = req.query.category || '전체'; // 프론트에서 보낸 한글 카테고리

  // 1. [핵심] 한글 버튼 -> 유튜브 데이터의 영어 카테고리 매핑
  const categoryMap = {
    '게임': ['Gaming'],
    '음악': ['Music'],
    '라이프': ['Howto_Style'], 
    '일상': ['People_Blogs'], 
    '코미디': ['Comedy', 'Entertainment'],
    '전체': []
  };

  let filteredData = videoData;

  // 2. 카테고리 필터링 (scraped_category_name 활용)
  if (category !== '전체') {
    const targetCategories = categoryMap[category] || [];

    filteredData = videoData.filter(video => {
      // ✅ [핵심 수정] 데이터의 카테고리에서 공백 제거 (.trim())
      const rawCategory = video.scraped_category_name || "";
      const cleanCategory = rawCategory.trim(); 

      // 1) 카테고리 이름이 일치하는지 확인
      const isCategoryMatch = targetCategories.includes(cleanCategory);
      
      return isCategoryMatch 
    });
  }

  // video_id 기준 중복 제거 로직
  // Set을 사용하여 이미 담은 ID는 건너뜁니다.
  const uniqueData = [];
  const seenIds = new Set();

  filteredData.forEach(video => {
    if (!seenIds.has(video.video_id)) {
      seenIds.add(video.video_id); // ID 등록
      uniqueData.push(video);      // 데이터 담기
    }
  });
  
  filteredData = uniqueData;
 
    // if (targetCategories) {
    //   filteredData = videoData.filter(video => {
    //     // 데이터에 있는 카테고리 값 (없을 경우 대비해 안전하게 처리)
    //     const videoCategory = video.scraped_category_name || "";
        
    //     // 매핑된 리스트 중에 포함되는지 확인 (예: 'Gaming'이 리스트에 있나?)
    //     return targetCategories.includes(videoCategory);
    //   });
    // }
  // }

  // 3. 조회수 기준 내림차순 정렬 & 데이터 가공
  filteredData.sort((a, b) => {
    // 정규식: 한글이 한 글자라도 포함되어 있는지 확인
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    
    // 제목이나 채널명에 한글이 있는지 체크 (제목만 검사하려면 a.title만 쓰면 됩니다)
    const isAKorean = koreanRegex.test(a.title) || koreanRegex.test(a.channel);
    const isBKorean = koreanRegex.test(b.title) || koreanRegex.test(b.channel);

    // [1단계] 언어 우선순위 비교
    // A는 한글이고 B는 영어면 -> A가 앞으로 (-1)
    if (isAKorean && !isBKorean) {
      return -1; 
    }
    // A는 영어고 B는 한글이면 -> B가 앞으로 (1)
    if (!isAKorean && isBKorean) {
      return 1;
    }

    // [2단계] 언어 조건이 같다면(둘 다 한글 or 둘 다 영어), 조회수 비교
    return b.stats.views - a.stats.views;
  });
  
  // 필요한 데이터만 정제해서 전송 (선택사항)
  const formattedData = filteredData.map(video => ({
    id: video.video_id,
    title: video.title,
    channel: video.channel,
    views: video.stats.views,
    publish_time: video.publish_time,
    category: video.scraped_category_name, // 확인용
    // 유튜브 썸네일 URL 공식: https://img.youtube.com/vi/[video_id]/[옵션].jpg
    thumbnail: `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`
  }));

  res.json(formattedData);
});

// [AnalysisPage] 특정 키워드 상세 분석 API
// 사용법: /api/analysis?keyword=쿠팡
// [AnalysisPage] 상세 분석 API (댓글 통합 로직 추가)
app.get('/api/analysis', async (req, res) => {
  const { keyword, startDate, endDate } = req.query;
  const API_KEY = process.env.YOUTUBE_API_KEY;

  if (!keyword) return res.status(400).json({ error: 'Keyword required' });

  // 1. 전체 데이터 범위에서 키워드 찾기 (통합 + 플랫폼 전체)
  const currentItem = findKeywordOverAll(keyword);

  if (!currentItem) {
    return res.json({ found: false, message: "데이터 없음" });
  }

  // 2. 히스토리 데이터 준비
  const historyMap = getHistoryData();
  const dates = Object.keys(historyMap).sort();

  // (A) 그래프용 히스토리 데이터 생성
  const history = dates.map(date => {
    const dayData = historyMap[date];
    let foundVal = 0;
    
    // 1순위: 통합 데이터에서 찾기
    const dayIntegrated = dayData.integrated || [];
    let found = dayIntegrated.find(item => item.Keyword === keyword);
    
    // 2순위: 통합에 없으면 플랫폼 데이터에서 찾기 (그래프가 끊기지 않게)
    if (!found && dayData.platform) {
        const platforms = dayData.platform;
        for (const pKey of Object.keys(platforms)) {
            const pList = Array.isArray(platforms[pKey]) ? platforms[pKey] : [];
            const pItem = pList.find(pi => (pi.Keyword || pi.keyword) === keyword);
            if (pItem) {
                // 플랫폼 데이터에는 Total_Mentions 혹은 Count로 저장되어 있음
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

  // (B) 댓글(Examples) 수집 - 여기가 핵심 수정 부분입니다
  let allRawComments = [];
  
  dates.forEach(date => {
      const dayData = historyMap[date];

      // 1. 통합 데이터(Integrated_Trends)의 댓글 수집
      if (dayData.integrated) {
          const integratedItem = dayData.integrated.find(item => item.Keyword === keyword);
          if (integratedItem && integratedItem.Examples) {
              allRawComments.push(...integratedItem.Examples);
          }
      }

      // 2. 플랫폼 데이터(Platform_Trends)의 댓글 수집 (기존에 빠져있던 부분)
      if (dayData.platform) {
          // platform 객체 안의 모든 키(youtube, theqoo, fmkorea 등)를 순회
          Object.keys(dayData.platform).forEach(pKey => {
              const pList = dayData.platform[pKey];
              if (Array.isArray(pList)) {
                  const pItem = pList.find(item => (item.Keyword || item.keyword) === keyword);
                  
                  if (pItem && pItem.Examples) {
                      // [theqoo] 같은 태그가 없으면 붙여줌 (프론트엔드 분류를 위해)
                      const taggedExamples = pItem.Examples.map(ex => {
                          if (ex.trim().startsWith('[')) return ex; 
                          return `[${pKey}] ${ex}`; 
                      });
                      allRawComments.push(...taggedExamples);
                  }
              }
          });
      }
  });

  // 3. 중복 제거
  const uniqueComments = [...new Set(allRawComments)];

  // 4. 댓글 파싱 ("[소스] 내용" -> { source, text })
  const parsedComments = uniqueComments.map(ex => {
    const match = ex.match(/^\[(.*?)\]\s*(.*)/);
    if (match) {
      return { source: match[1], text: match[2] };
    }
    return null;
  }).filter(Boolean);

  // 워드클라우드 데이터 생성 (JSON 데이터 활용)
  const wordCloudData = extractWordCloudData(allRawComments, keyword);

  // 5. 유튜브 관련 영상 검색 (API 연동)
    let relatedVideos = [];
    if (API_KEY) {
      try {
        console.log(`🚀 유튜브 검색: [${keyword}] 기간: ${startDate || '전체'} ~ ${endDate || '전체'}`);
        
        // 1. 검색 파라미터 정의 (이 부분이 누락되어 에러가 났었습니다)
        const searchParams = {
            part: 'snippet',
            q: keyword,
            type: 'video',
            maxResults: 3,
            key: API_KEY,
            regionCode: 'KR',
            order: 'date' // 최신순
        };

        // 날짜가 있으면 파라미터에 추가
        if (startDate) searchParams.publishedAfter = toISODate(startDate);
        if (endDate) searchParams.publishedBefore = toISODate(endDate, true);

        // 2. 검색 API 호출
        const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: searchParams // 이제 searchParams가 정의되어 있으므로 에러가 안 납니다.
        });
        // items가 없으면 여기서 안전하게 멈추도록 수정 (에러 방지)
        if (!searchRes.data.items) {
            console.error("❌ [치명적 문제] 응답에 'items' 목록이 없습니다!");
            // 여기서 throw를 던져서 catch 블록으로 보냄
            throw new Error("YouTube API 응답에 items가 누락되었습니다. (Quota 문제거나 키 설정 문제 가능성)");
        }
        
        const videoIds = searchRes.data.items.map(i => i.id.videoId).join(',');
        
        if (videoIds) {
          const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: { part: 'snippet,statistics', id: videoIds, key: API_KEY.trim() }
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
        console.error("\n❌ [유튜브 API 에러 발생] --------------------");
        if (err.response) {
            // 서버(구글)가 응답을 줬지만, 에러 코드(4xx, 5xx)인 경우
            console.error(`1. 응답 상태 코드: ${err.response.status}`);
            console.error("2. 에러 상세 내용:", JSON.stringify(err.response.data, null, 2));
        } else if (err.request) {
            // 요청은 갔지만 응답을 못 받은 경우 (네트워크 문제 등)
            console.error("3. 응답 없음 (네트워크/방화벽 문제 가능성):", err.request);
        } else {
            // 설정 문제 등
            console.error("4. 요청 설정 에러:", err.message);
        }
        console.log("---------------------------------------------");
        console.log(`📡 [최종 응답 데이터 점검]`);
        console.log(`   - 키워드: ${currentItem.Keyword}`);
        console.log(`   - 영상 데이터 개수: ${relatedVideos.length}개`);
        
        if (relatedVideos.length > 0) {
          console.log(`   - 첫 번째 영상 제목: ${relatedVideos[0].title}`);
          console.log(`   - 첫 번째 영상 조회수: ${relatedVideos[0].views}`);
        } else {
          console.log("🚨 [경고] 영상 데이터가 0개입니다! (API 및 Fallback 모두 실패)");
        }
        console.error("---------------------------------------------\n");
      }
    }

  res.json({
    found: true,
    keyword: currentItem.Keyword,
    rank: currentItem.Rank,
    totalMentions: currentItem.Mentions || currentItem.Total_Mentions || 0,
    score: currentItem.Score,
    history: history,
    comments: parsedComments, // 이제 플랫폼 전용 댓글도 포함됩니다.
    wordCloud: wordCloudData, // 추가
    videos: relatedVideos
  });
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



// 서버 시작
loadTrendData().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});