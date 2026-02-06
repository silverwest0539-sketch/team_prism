// 스크랩한 내용 테스트를 위해 로컬 저장용 파일

const STORAGE_KEY = 'trend_scraps';

/**
 * 스크랩된 모든 데이터를 가져옵니다.
 * @returns {Array} 스크랩된 데이터 배열
 */
export const getScraps = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

/**
 * 특정 키워드가 스크랩되어 있는지 확인합니다.
 * @param {string} keyword - 확인할 키워드
 * @returns {boolean} 스크랩 여부
 */
export const isScrapped = (keyword) => {
    const scraps = getScraps();
    return scraps.some(item => item.keyword === keyword);
};

/**
 * 스크랩을 추가합니다. (중복 방지)
 * @param {Object} item - 저장할 데이터 객체 (keyword, rank, date 등)
 */
export const addScrap = (item) => {
    const scraps = getScraps();
    if (!scraps.some(saved => saved.keyword === item.keyword)) {
        const newItem = {
            ...item,
            savedAt: new Date().toISOString() // 저장 시점 기록
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify([newItem, ...scraps]));
    }
};

/**
 * 스크랩을 삭제합니다.
 * @param {string} keyword - 삭제할 키워드
 */
export const removeScrap = (keyword) => {
    const scraps = getScraps();
    const newScraps = scraps.filter(item => item.keyword !== keyword);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newScraps));
};