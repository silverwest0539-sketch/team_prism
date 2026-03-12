const DEFAULT_ERROR_MESSAGE = '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

export const safeParseJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

export const createHttpError = ({ status, data = {}, fallbackMessage = '' }) => {
  const normalizedMessage = String(
    data?.error || data?.message || fallbackMessage || DEFAULT_ERROR_MESSAGE,
  ).trim();

  const error = new Error(normalizedMessage || DEFAULT_ERROR_MESSAGE);
  error.response = { status, data };
  return error;
};

export const toFriendlyFetchErrorMessage = (error, fallbackMessage = '') => {
  if (!error) {
    return String(fallbackMessage || '').trim() || DEFAULT_ERROR_MESSAGE;
  }

  const status = error?.response?.status;
  const apiError = String(error?.response?.data?.error || error?.response?.data?.message || '').trim();

  if (status === 400) {
    return apiError || '입력 정보를 확인한 뒤 다시 시도해 주세요.';
  }

  if (status === 401 || status === 403) {
    return '로그인 상태가 만료되었어요. 다시 로그인해 주세요.';
  }

  if (status === 429) {
    return '요청이 많아 잠시 지연되고 있어요. 잠시 후 다시 시도해 주세요.';
  }

  if (typeof status === 'number' && status >= 500) {
    return '서버가 일시적으로 불안정해요. 잠시 후 다시 시도해 주세요.';
  }

  if (error?.code === 'ECONNABORTED') {
    return '요청 시간이 초과되었어요. 네트워크 상태를 확인해 주세요.';
  }

  if (!error?.response) {
    const localMessage = String(error?.message || fallbackMessage || '').trim();
    return localMessage || '서버와 연결하지 못했어요. 잠시 후 다시 시도해 주세요.';
  }

  return (
    apiError ||
    String(error?.message || fallbackMessage || '').trim() ||
    DEFAULT_ERROR_MESSAGE
  );
};
