const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const dataDirectory = path.join(__dirname, '../data');
const youtubeFilePath = path.join(__dirname, '../data');

// 전체 데이터를 저장할 변수
let allTrendData = [];

const loadCSVData = () => {
  return new Promise((resolve, reject) => {
    // data 폴더가 없으면 생성 (에러 방지)
    if (!fs.existsSync(dataDirectory)){
      console.warn(`⚠️ 경고: ${dataDirectory} 폴더가 없습니다.`);
      resolve([]);
      return;
    }

    const files = fs.readdirSync(dataDirectory).filter(file => file.endsWith('.csv'));
    const tempResults = [];
    let filesProcessed = 0;

    if (files.length === 0) {
      console.warn("⚠️ 경고: 데이터 폴더에 CSV 파일이 없습니다.");
      resolve([]);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(dataDirectory, file);
      
      fs.createReadStream(filePath)
        // ✅ 핵심 수정: mapHeaders 옵션으로 BOM(\uFEFF) 제거 및 공백 제거
        .pipe(csv({
          mapHeaders: ({ header, index }) => {
            if (index === 0) {
              return header.replace(/^\uFEFF/, '').trim();
            }
            return header.trim();
          }
        }))
        .on('data', (data) => {
          // 데이터가 정상적으로 들어왔는지 확인
          if (!data.Date) {
             // Date 컬럼이 없으면 스킵하거나 로그 출력 (디버깅용)
             // console.log('데이터 누락:', data); 
             return; 
          }

          tempResults.push({
            ...data,
            Date: String(data.Date),
            Rank: parseInt(data.Rank),
            Score: parseFloat(data.Score),
            Mentions: parseInt(data.Mentions),
            Examples: data.Examples ? data.Examples.split(' || ') : [] 
          });
        })
        .on('end', () => {
          filesProcessed++;
          if (filesProcessed === files.length) {
            // 날짜 내림차순, 랭크 오름차순 정렬
            tempResults.sort((a, b) => b.Date.localeCompare(a.Date) || a.Rank - b.Rank);
            allTrendData = tempResults;
            console.log(`✅ 데이터 로드 완료: 총 ${allTrendData.length}개 (BOM 제거됨)`);
            resolve(allTrendData);
          }
        })
        .on('error', (err) => reject(err));
    });
  });
};

const getData = () => allTrendData;

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

// 플랫폼별 키워드 JSON 데이터 로드
const getPlatformKeywordData = () => {
  try {
    if (!fs.existsSync(dataDirectory)) return [];
    
    // 'platform_keyword_merged'로 시작하는 JSON 파일 찾기
    const files = fs.readdirSync(dataDirectory).filter(file => file.startsWith('platform_keyword_merged') && file.endsWith('.json'));
    
    if (files.length === 0) {
      console.warn("⚠️ 플랫폼 키워드 데이터 파일이 없습니다.");
      return [];
    }

    // 가장 최신 파일 읽기 (파일명 역순 정렬)
    const latestFile = files.sort().reverse()[0];
    const filePath = path.join(dataDirectory, latestFile);
    
    const rawData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(rawData);
  } catch (err) {
    console.error("❌ 플랫폼 키워드 로드 실패:", err);
    return [];
  }
};

module.exports = { loadCSVData, getData, getYoutubeData, getPlatformKeywordData };