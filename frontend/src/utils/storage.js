// 스크랩 저장 유틸리티 (태그, 메모, 순서 지원)

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
 * @param {Object} item - 저장할 데이터 객체 (keyword, rank, type, desc 등)
 */
export const addScrap = (item) => {
    const scraps = getScraps();
    if (!scraps.some(saved => saved.keyword === item.keyword)) {
        const newItem = {
            ...item,
            tags: item.tags || [],
            memo: item.memo || '',
            savedAt: new Date().toISOString()
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

/**
 * 스크랩 항목을 업데이트합니다. (태그, 메모 등)
 * @param {string} keyword - 업데이트할 키워드
 * @param {Object} updates - 업데이트할 필드 객체
 */
export const updateScrap = (keyword, updates) => {
    const scraps = getScraps();
    const updated = scraps.map(item =>
        item.keyword === keyword ? { ...item, ...updates } : item
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

/**
 * 특정 키워드의 스크랩 데이터를 가져옵니다.
 * @param {string} keyword
 * @returns {Object|null}
 */
export const getScrap = (keyword) => {
    const scraps = getScraps();
    return scraps.find(item => item.keyword === keyword) || null;
};

/**
 * 스크랩 순서를 저장합니다. (드래그 앤 드롭)
 * @param {Array} reorderedScraps - 새 순서의 스크랩 배열
 */
export const reorderScraps = (reorderedScraps) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reorderedScraps));
};

/**
 * 사용 중인 모든 태그 목록을 가져옵니다.
 * @returns {Array<string>} 유니크 태그 배열
 */
export const getAllTags = () => {
    const scraps = getScraps();
    const tagSet = new Set();
    scraps.forEach(item => {
        (item.tags || []).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
};
