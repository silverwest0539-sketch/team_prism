const fs = require('fs');
const path = require('path');

const dataDirectory = path.join(__dirname, '../data');

// 1. 서버 시작 시 호출되는 함수 (server.js 에러 방지용. 실제 로딩은 안 함)
const loadTrendData = async () => {
  console.log("✅ JSON 트렌드 로드 생략 (커뮤니티 인기글 외 DB 연동으로 전환 중)");
  return {};
};

// 2. 🌟 [유일하게 남길 핵심 기능] 커뮤니티 인기글 목록 불러오기
const getCommunityHotPosts = (platform) => {
  try {
    if (!fs.existsSync(dataDirectory)) return [];

    const prefixMap = {
      'theqoo': 'theqoo_hot_selector_',
      'ruliweb': 'ruliweb_full_',
      'natepan': 'nate_rank100_completed_',
      'fmkorea': 'fmkorea_',
      'dcinside': 'final_dc_best_DC_Best_'
    };

    const prefix = prefixMap[platform];
    if (!prefix) return [];

    const files = fs.readdirSync(dataDirectory).filter(file => 
      file.startsWith(prefix) && file.endsWith('.json')
    );

    if (files.length === 0) return []; 

    // 최신 파일 하나만 읽기
    const latestFile = files.sort().reverse()[0];
    const filePath = path.join(dataDirectory, latestFile);

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const parsedData = JSON.parse(rawData);

    return Array.isArray(parsedData) ? parsedData : (parsedData.data || parsedData.items || []);

  } catch (error) {
    console.error(`❌ ${platform} 인기글 데이터 로딩 실패:`, error);
    return [];
  }
};


// =========================================================================
// 🚨 아래는 다른 파일에서 참조하다 에러가 나는 것을 막기 위한 임시 빈 껍데기 함수들입니다.
// 추후 플랫폼별 키워드까지 완벽하게 DB로 전환되고 나면 모조리 삭제하시면 됩니다!
// =========================================================================

const getLatestData = () => [];
const getHistoryData = () => ({});
const getLatestPlatformData = () => [];
const findKeywordOverAll = () => null;
const getYoutubeData = () => [];

module.exports = { 
  loadTrendData, 
  getCommunityHotPosts, 
  getLatestData, 
  getHistoryData, 
  getLatestPlatformData, 
  findKeywordOverAll, 
  getYoutubeData 
};