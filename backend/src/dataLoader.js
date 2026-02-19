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

      // 1. 파일 목록 가져오기 (기존 파일명 & 새 파일명 모두 허용)
      const files = fs.readdirSync(dataDirectory)
        .filter(file => (file.startsWith('trend_keywords_final_') || file.startsWith('trending_keywords_')) && file.endsWith('.json'));

      if (files.length === 0) {
        resolve({});
        return;
      }

      console.log(`📂 총 ${files.length}개의 트렌드 데이터 파일을 로드합니다.`);

      trendHistory = {}; // 초기화
      
      files.forEach(file => {
        // 2. 날짜 추출 로직 수정 (YYYYMMDD 형식 또는 YYYYMMDD_YYYYMMDD 형식 모두 대응)
        // 파일명 끝부분의 8자리 숫자를 날짜로 사용 (종료일 기준)
        const match = file.match(/(\d{8})\.json$/);
        
        if (match) {
          const date = match[1];
          const filePath = path.join(dataDirectory, file);
          const rawData = fs.readFileSync(filePath, 'utf-8');
          const jsonData = JSON.parse(rawData);

          let integratedData = [];
          let platformData = {};

          // CASE A: 새 파일 형식 (배열 형태)
          if (Array.isArray(jsonData)) {
            // 1. 통합 데이터 변환
            integratedData = jsonData.map(item => {
              // Examples 객체를 기존 문자열 배열 포맷으로 변환 ["[플랫폼] 내용", ...]
              let formattedExamples = [];
              if (item.Examples && typeof item.Examples === 'object') {
                Object.entries(item.Examples).forEach(([platform, comments]) => {
                  if (Array.isArray(comments)) {
                    comments.forEach(c => {
                      // comment 객체에서 내용 추출 (없으면 문자열 자체라고 가정)
                      const text = c.comment || c; 
                      const link = c.link || null;
                      formattedExamples.push({
                        platform: platform,
                        text: text,
                        link: link
                      });
                    });
                  }
                });
              }

              return {
                ...item,
                Date: date,
                // 필드명 매핑 (새 파일 -> 기존 로직)
                Mentions: item.Target_Week_Mentions || item.Total_Mentions || 0, 
                Score: item.Trend_Score || 0,
                Examples: formattedExamples,
                Type: 'integrated'
              };
            });

            // 2. 플랫폼별 데이터 생성 (새 파일은 통합되어 있으므로 분리 작업 필요)
            integratedData.forEach(item => {
              if (item.Platform_List && Array.isArray(item.Platform_List)) {
                item.Platform_List.forEach(plat => {
                  if (!platformData[plat]) platformData[plat] = [];
                  // 해당 플랫폼용 데이터로 복제해서 추가
                  platformData[plat].push({
                    ...item,
                    // 플랫폼별 언급량이 따로 없으면 전체 언급량 사용하거나, Examples 개수로 추정 가능하나 여기선 전체 사용
                    Total_Mentions: item.Mentions 
                  });
                });
              }
            });

          } 
          // CASE B: 기존 파일 형식 (객체 형태)
          else {
            integratedData = jsonData.Integrated_Trends 
              ? jsonData.Integrated_Trends.map(item => ({
                  ...item,
                  Date: date,
                  Mentions: item.Total_Mentions || 0,
                  Type: 'integrated'
                })) 
              : [];

            if (jsonData.Platform_Trends && typeof jsonData.Platform_Trends === 'object') {
               platformData = jsonData.Platform_Trends;
            }
          }

          // 데이터 저장
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

// 최신 플랫폼별 데이터 반환
const getLatestPlatformData = (platformKey) => {
  if (!latestDate || !trendHistory[latestDate]) return [];
  
  const pData = trendHistory[latestDate].platform;

  // 1. 정확히 일치하는 키가 있으면 반환
  if (pData[platformKey]) return pData[platformKey];

  // 2. 키가 없으면 'all' 또는 빈 배열 반환
  if (platformKey === 'all') {
    // 모든 플랫폼 데이터를 합쳐서 반환 (중복 제거 필요 시 로직 추가)
    return Object.values(pData).flat();
  }

  return [];
};

// 특정 키워드의 전체 기간 데이터 찾기 (그래프용)
const findKeywordOverAll = (keyword) => {
  const result = [];
  const dates = Object.keys(trendHistory).sort();

  dates.forEach(date => {
    const dayData = trendHistory[date].integrated;
    const found = dayData.find(item => item.Keyword === keyword);
    if (found) {
      result.push({
        date: date,
        rank: found.Rank,
        mentions: found.Mentions || found.Total_Mentions || 0,
        score: found.Score || found.Trend_Score || 0
      });
    } else {
      // 해당 날짜에 키워드가 없으면 0 처리 (그래프 끊김 방지)
      result.push({
        date: date,
        rank: null,
        mentions: 0,
        score: 0
      });
    }
  });

  return result;
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