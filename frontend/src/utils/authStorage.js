const USER_STORAGE_KEY = 'user';

export const getStoredUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // 최소한의 구조 검증 — email 필드가 없는 데이터는 손상된 것으로 간주
    if (parsed && typeof parsed === 'object' && typeof parsed.email === 'string') {
      return parsed;
    }

    // 유효하지 않은 형식이면 정리
    window.sessionStorage.removeItem(USER_STORAGE_KEY);
    return null;
  } catch {
    // JSON 파싱 실패 시 손상 데이터 제거
    window.sessionStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

export const getStoredUserEmail = () => getStoredUser()?.email || '';
