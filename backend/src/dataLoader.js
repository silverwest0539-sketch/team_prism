const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const dataDirectory = path.join(__dirname, '../data');
const youtubeFilePath = path.join(__dirname, '../data');

// 날짜별 데이터를 저장할 객체 (Key: 'YYYYMMDD', Value: List)
// 날짜별 데이터를 저장할 객체
let trendHistory = {};
let latestDate = null;

// 모든 트렌드 데이터 로드 함수
const loadTrendData = () => {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(dataDirectory)) {
        console.warn(`⚠️ 경고: ${dataDirectory} 폴더가 없습니다.`);
        resolve({});
        return;
      }

      // 1. 파일 목록 가져오기 (두 가지 포맷 모두 허용)
      const files = fs.readdirSync(dataDirectory)
        .filter(file => (file.startsWith('trend_keywords_final_') || file.startsWith('trending_keywords_')) && file.endsWith('.json'));

      if (files.length === 0) {
        resolve({});
        return;
      }

      trendHistory = {}; 
      
      files.forEach(file => {
        // 2. 날짜 추출 (파일명에서 첫 번째 8자리 숫자만 쏙 뽑아냅니다)
        const dateMatch = file.match(/(\d{8})/);
        if (dateMatch) {
          const dateStr = dateMatch[1]; // 예: '20260218'
          const filePath = path.join(dataDirectory, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          try {
            trendHistory[dateStr] = JSON.parse(fileContent);
          } catch (e) {
            console.error(`⚠️ JSON 파싱 에러 (${file}):`, e);
          }
        }
      });

      // 3. 최신 날짜 구하기
      const sortedDates = Object.keys(trendHistory).sort((a, b) => b.localeCompare(a));
      latestDate = sortedDates.length > 0 ? sortedDates[0] : null;

      console.log(`✅ 데이터 로드 완료! 최신 날짜: ${latestDate}`);
      resolve(trendHistory);
    } catch (error) {
      console.error("데이터 로드 중 에러 발생:", error);
      reject(error);
    }
  });
};

// 최신 데이터 반환
const getLatestData = () => {
  if (!latestDate || !trendHistory[latestDate]) return [];
  return trendHistory[latestDate].integrated;
};

// 전체 히스토리 데이터 반환 (그래프용)
const getHistoryData = () => trendHistory;

// 최신 플랫폼별 데이터 반환
const getLatestPlatformData = (platformKey = 'all') => {
  if (!latestDate || !trendHistory[latestDate]) return [];
  
  const latestData = trendHistory[latestDate];

  // 포맷 3: 최신 포맷 ({"all": [...], "youtube": [...]})
  if (latestData && latestData.all) {
    return latestData[platformKey] || [];
  }
  
  // 포맷 1: 초기 포맷 ({"Integrated_Trends": [...], "Platform_Trends": {...}})
  if (latestData && latestData.Integrated_Trends) {
    if (platformKey === 'all') return latestData.Integrated_Trends || [];
    return (latestData.Platform_Trends && latestData.Platform_Trends[platformKey]) || [];
  }
  
  // 포맷 2: 과도기 포맷 (배열 형태)
  if (Array.isArray(latestData)) {
    if (platformKey === 'all') return latestData;
    return []; 
  }

  return [];
};

// 특정 키워드의 전체 기간 데이터 찾기 (그래프용)
const findKeywordOverAll = (keyword) => {
  if (!latestDate || !trendHistory[latestDate]) return null;
  const latestData = trendHistory[latestDate];

  // 1. 데이터 포맷에 맞춰 통합 배열과 플랫폼 객체 분리
  let allArray = [];
  let platformsObj = {};

  if (latestData.all) {
    allArray = latestData.all;
    platformsObj = latestData; // 포맷 3: 최상위에 플랫폼 키들이 같이 있음
  } else if (latestData.Integrated_Trends) {
    allArray = latestData.Integrated_Trends;
    platformsObj = latestData.Platform_Trends || {}; // 포맷 1
  } else if (Array.isArray(latestData)) {
    allArray = latestData; // 포맷 2: 배열만 존재
  }

  // 2. 통합(all) 데이터에서 먼저 검색
  let found = allArray.find(item => (item.Keyword === keyword || item.keyword === keyword));
  if (found) return found;

  // 3. 통합에 없다면, 플랫폼별 데이터(youtube, theqoo 등)를 순회하며 샅샅이 검색
  for (const pKey of Object.keys(platformsObj)) {
    // 시스템 키값들은 건너뛰기
    if (['all', 'meta', 'Integrated_Trends', 'Platform_Trends'].includes(pKey)) continue;

    const pList = Array.isArray(platformsObj[pKey]) ? platformsObj[pKey] : [];
    const pItem = pList.find(item => (item.Keyword === keyword || item.keyword === keyword));
    
    // 플랫폼에서 키워드를 발견하면 즉시 반환!
    if (pItem) return pItem; 
  }

  // 끝까지 찾아봐도 없으면 null 반환
  return null;
};


// 유튜브 데이터를 읽어오는 함수 추가
const getYoutubeData = () => {
  try {
    // 1. data 폴더가 있는지 확인
    if (!fs.existsSync(dataDirectory)) {
      console.warn("⚠️ 데이터 폴더가 없습니다.");
      return [];
    }

    // 2. 폴더 내에서 .json 확장자를 가진 파일 찾기
    const files = fs.readdirSync(dataDirectory).filter(file => file.endsWith('.json'));

    if (files.length === 0) {
      console.warn("⚠️ 유튜브 데이터 파일(.json)이 없습니다.");
      return [];
    }

    // 3. 가장 최신 파일(또는 첫 번째 파일) 선택
    // 파일이 여러 개일 경우를 대비해 정렬 후 첫 번째 것을 가져옵니다.
    const targetFile = files.sort().reverse()[0]; 
    const filePath = path.join(dataDirectory, targetFile);

    // console.log(`📂 유튜브 데이터 로드 중: ${targetFile}`); // 확인용 로그

    // 4. 파일 읽기
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(rawData);
    return jsonData;

  } catch (error) {
    console.error("❌ 유튜브 데이터 로딩 실패:", error);
    return [];
  }
};

// 커뮤니티 인기글 목록
const getCommunityHotPosts = (platform) => {
  try {
    if (!fs.existsSync(dataDirectory)) {
      console.warn("⚠️ 데이터 폴더가 없습니다.");
      return [];
    }

    // ✅ 핵심: 프론트엔드의 platform 값과 실제 파일 접두사(prefix) 매핑
    const prefixMap = {
      'theqoo': 'theqoo_hot_selector_',
      'ruliweb': 'ruliweb_full_',
      'natepan': 'nate_rank100_completed_',
      'fmkorea': 'fmkorea_',
      'dcinside': 'final_dc_best_DC_Best_'
    };

    const prefix = prefixMap[platform];

    if (!prefix) {
      console.warn(`⚠️ 알 수 없는 플랫폼 요청입니다: ${platform}`);
      return [];
    }

    // 1. 해당 접두사로 시작하고 .json으로 끝나는 파일들만 필터링
    const files = fs.readdirSync(dataDirectory).filter(file => 
      file.startsWith(prefix) && file.endsWith('.json')
    );

    if (files.length === 0) {
      console.warn(`⚠️ ${platform} 인기글 데이터 파일이 없습니다. (접두사: ${prefix})`);
      return []; 
    }

    // 2. 시간순 정렬 후 가장 최신 파일(첫 번째)을 선택
    const latestFile = files.sort().reverse()[0];
    const filePath = path.join(dataDirectory, latestFile);

    // 3. 파일 읽기 및 JSON 파싱
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const parsedData = JSON.parse(rawData);

    // 만약 JSON 파일 최상단이 객체이고 그 안에 배열이 있다면 배열만 추출
    // (보통 크롤링 데이터는 [ {...}, {...} ] 형태의 배열이므로 그대로 반환)
    return Array.isArray(parsedData) ? parsedData : (parsedData.data || parsedData.items || []);

  } catch (error) {
    console.error(`❌ ${platform} 인기글 데이터 로딩 실패:`, error);
    return [];
  }
};

module.exports = { loadTrendData, getLatestData, getYoutubeData, getHistoryData, getLatestPlatformData, findKeywordOverAll, getCommunityHotPosts};