const express = require('express');
const cors = require('cors');
const { loadCSVData, getData, getYoutubeData } = require('./dataLoader');
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

// 1. [HomePage] 급상승 키워드 API (Top 5)
app.get('/api/trends/rising', (req, res) => {
  const data = getData();
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

    return {
      rank: item.Rank, // 원본 랭크 사용
      keyword: item.Keyword,
      volume: `언급량 ${item.Mentions.toLocaleString()}회`,
      change: `${isUp ? '▲' : '▼'} ${Math.abs(changeRate).toFixed(1)}%`,
      isUp: isUp,
      desc: item.Examples[0] || "관련된 코멘트가 없습니다.",
      color: isUp ? 'red' : 'blue'
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
  
  if (data.length === 0) return res.json([]);

  // ✅ 핵심 수정 3: 콘텐츠 API도 최신 날짜 1개만 사용하도록 강제
  const latestDate = data.reduce((max, curr) => curr.Date > max ? curr.Date : max, data[0].Date);
  let targetData = data.filter(item => item.Date === latestDate);

  let contentList = [];
  
  targetData.forEach(item => {
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
app.get('/api/analysis', (req, res) => {
  const { keyword } = req.query;
  const data = getData(); // 전체 데이터 가져오기

  if (!keyword) {
    return res.status(400).json({ error: '키워드가 필요합니다.' });
  }

  // 1. 해당 키워드와 일치하는 모든 날짜의 데이터 찾기
  const keywordHistory = data.filter(item => item.Keyword === keyword);

  if (keywordHistory.length === 0) {
    return res.json({ found: false, message: '데이터가 없습니다.' });
  }

  // 2. 날짜 오름차순 정렬 (그래프 그리기 좋게 1/30 -> 1/31 -> 2/1)
  keywordHistory.sort((a, b) => a.Date.localeCompare(b.Date));

  // 3. 가장 최신 데이터 (현재 상태 표시용)
  const currentData = keywordHistory[keywordHistory.length - 1];

  // 4. 플랫폼 분포 계산 (Platform_List 활용)
  // 예: "dc_lol,fmkorea" -> { dc_lol: 1, fmkorea: 1 }
  const platformCount = {};
  if (currentData.Platform_List) {
      const platforms = currentData.Platform_List.split(',');
      platforms.forEach(p => {
          const cleanP = p.trim();
          platformCount[cleanP] = (platformCount[cleanP] || 0) + 1;
      });
  }

  // 5. 실제 댓글 예시 파싱 (Examples 컬럼 활용)
  const examples = [];
  if (currentData.Examples) {
      currentData.Examples.forEach(ex => {
          const match = ex.match(/^\[(.*?)\]/);
          if (match) {
              examples.push({
                  source: match[1],
                  text: ex.replace(/^\[.*?\](\(comment\)|\(post\))?\s*/, ''),
              });
          }
      });
  }

// 6. [AnalysisPage] 뉴스 RSS API (구글 뉴스 검색 활용)
app.get('/api/news', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.json([]);

  try {
    // 구글 뉴스 RSS (네이버는 API 키 필요, 구글은 무료/공개)
    // 한글 검색을 위해 URL 인코딩 필수
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=ko&gl=KR&ceid=KR:ko`;
    
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

  // 최종 응답 구성
  res.json({
    found: true,
    keyword: currentData.Keyword,
    rank: currentData.Rank,
    totalMentions: currentData.Mentions, // 최신 날짜 기준
    score: currentData.Score,
    history: keywordHistory.map(h => ({
        date: h.Date, // "20260201"
        mentions: h.Mentions,
        score: h.Score,
        rank: h.Rank
    })),
    platforms: platformCount,
    comments: examples.slice(0, 10) // 최대 10개만
  });
});

// 서버 시작
loadCSVData().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});