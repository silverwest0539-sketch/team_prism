const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const dataDirectory = path.join(__dirname, '../data');
const youtubeFilePath = path.join(__dirname, '../data');

// 날짜별 데이터를 저장할 객체 (Key: 'YYYYMMDD', Value: List)
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

      // 1. 파일 목록 가져오기
      const files = fs.readdirSync(dataDirectory)
        .filter(file => file.startsWith('trend_keywords_final_') && file.endsWith('.json'));

      if (files.length === 0) {
        resolve({});
        return;
      }

      console.log(`📂 총 ${files.length}개의 트렌드 데이터 파일을 로드합니다.`);

      // 2. 모든 파일 순회하며 데이터 적재
      trendHistory = {}; // 초기화
      
      files.forEach(file => {
        // 파일명에서 날짜 추출 (trend_keywords_final_20260201.json -> 20260201)
        const match = file.match(/(\d{8})\.json$/);
        if (match) {
          const date = match[1];
          const filePath = path.join(dataDirectory, file);
          const rawData = fs.readFileSync(filePath, 'utf-8');
          const jsonData = JSON.parse(rawData);

          // 1. 통합 트렌드 저장
          const integratedData = jsonData.Integrated_Trends 
            ? jsonData.Integrated_Trends.map(item => ({
                ...item,
                Date: date,
                Mentions: item.Total_Mentions || 0,
                Type: 'integrated'
              })) 
            : [];

          // 2. 플랫폼별 트렌드 저장
          // 파일 구조: "Platform_Trends": { "youtube": [...], "fmkorea": [...] }
          let platformData = {};
          if (jsonData.Platform_Trends && typeof jsonData.Platform_Trends === 'object') {
             platformData = jsonData.Platform_Trends;
          }

          trendHistory[date] = {
            integrated: integratedData,
            platform: platformData
          };
        }
      });

      // 3. 최신 날짜 확인 (파일명 기준 정렬)
      const dates = Object.keys(trendHistory).sort();
      latestDate = dates[dates.length - 1];

      console.log(`✅ 데이터 로드 완료. 최신 날짜: ${latestDate}`);
      resolve(trendHistory);

    } catch (error) {
      console.error("❌ 데이터 로딩 실패:", error);
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

// 최신 플랫폼별 데이터 반환 (여기가 핵심)
const getLatestPlatformData = (platformKey) => {
  if (!latestDate || !trendHistory[latestDate]) return [];
  
  const pData = trendHistory[latestDate].platform;

  // 1. 정확히 일치하는 키가 있으면 반환
  if (pData[platformKey]) return pData[platformKey];

  // 2. 키가 없으면 검색 (예: 'dc' 요청 시 'dc_lol', 'dc_comic' 등 병합)
  // 사용자가 요청한 키가 포함된 모든 플랫폼 데이터를 합침
  let mergedData = [];
  Object.keys(pData).forEach(key => {
    if (key.includes(platformKey)) {
      mergedData = [...mergedData, ...pData[key]];
    }
  });

  return mergedData;
};

// ✅ [추가됨] 키워드를 통합+모든 플랫폼에서 찾아내는 함수
const findKeywordOverAll = (keyword) => {
  if (!latestDate || !trendHistory[latestDate]) return null;
  const currentData = trendHistory[latestDate];

  // 1. 통합 데이터에서 먼저 찾기 (가장 정확)
  let found = currentData.integrated.find(item => item.Keyword === keyword);
  if (found) return { ...found, SourceType: 'Integrated' };

  // 2. 통합에 없으면, 모든 플랫폼 데이터를 순회하며 찾기
  const platforms = currentData.platform;
  for (const pKey of Object.keys(platforms)) {
    const pList = platforms[pKey];
    found = pList.find(item => item.Keyword === keyword);
    if (found) {
      // 플랫폼 데이터 포맷을 통합 데이터 포맷과 비슷하게 맞춤
      return {
        ...found,
        Mentions: found.Total_Mentions || found.Count || 0,
        SourceType: pKey // 어디서 찾았는지 기록
      };
    }
  }

  return null; // 진짜 없음
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


module.exports = { loadTrendData, getLatestData, getYoutubeData, getHistoryData, getLatestPlatformData, findKeywordOverAll};