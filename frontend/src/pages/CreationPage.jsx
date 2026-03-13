// src/pages/CreationPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ErrorBoundary from '../components/common/ErrorBoundary';
import InputPanel from '../components/creation/InputPanel';
import ResultPanel from '../components/creation/ResultPanel';
import { showToast } from '../utils/toast';
import { getStoredUser } from '../utils/authStorage';
import { toApiUrl } from '../utils/apiClient';
import { createHttpError, safeParseJson } from '../utils/fetchError';

const CreationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [generatedResult, setGeneratedResult] = useState('');
  const [resultRevision, setResultRevision] = useState(0);
  const [lastPayload, setLastPayload] = useState(null);
  const [generationError, setGenerationError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const savedUser = getStoredUser();

    if (!savedUser) {
      showToast('콘텐츠 생성 서비스는 로그인 후 이용할 수 있습니다. 로그인 페이지로 이동합니다.', {
        type: 'warning',
      });
      navigate('/login', { replace: true });
      return;
    }

    setAuthChecked(true);
  }, [navigate]);

  const initialKeyword = useMemo(() => {
    return (searchParams.get('keyword') || '').trim();
  }, [searchParams]);

  const resolveFriendlyErrorMessage = (error, fallbackMessage = '') => {
    if (!error) {
      return (
        String(fallbackMessage || '').trim() ||
        '프롬프트 생성 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.'
      );
    }
    const status = error?.response?.status;
    const apiError = String(error?.response?.data?.error || fallbackMessage || '').trim();

    if (status === 400) return apiError || '입력 정보를 확인한 뒤 다시 시도해 주세요.';
    if (status === 401 || status === 403) return '로그인 상태가 만료되었어요. 다시 로그인 후 시도해 주세요.';
    if (status === 429) return '요청이 몰려 잠시 지연되고 있어요. 잠시 후 다시 시도해 주세요.';
    if (status >= 500) return '서버가 일시적으로 불안정합니다. 잠시 후 다시 시도해 주세요.';
    if (error?.code === 'ECONNABORTED') return '요청 시간이 초과되었어요. 네트워크 상태를 확인하고 다시 시도해 주세요.';
    if (!error?.response) return '서버에 연결하지 못했어요. 백엔드 실행 상태를 확인해 주세요.';
    return apiError || '프롬프트 생성 중 오류가 발생했어요. 다시 시도해 주세요.';
  };

  const handleGenerate = async (inputData) => {
    const fullUrl = toApiUrl('/generate');
    setLastPayload(inputData);
    setGenerationError('');
    setGeneratedResult('');
    setIsLoading(true);

    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.localStorage.getItem('token')}`
        },
        body: JSON.stringify(inputData),
      });

      if (!response.ok) {
        const errorData = await safeParseJson(response);
        throw createHttpError({ status: response.status, data: errorData });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let isFinished = false;
      while (!isFinished) {
        const { value, done: doneReading } = await reader.read();
        if (doneReading) break;

        const chunkValue = decoder.decode(value);
        const lines = chunkValue.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.replace('data: ', '').trim();

          if (dataStr === '[DONE]') {
            isFinished = true;
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.chunk) {
              setGeneratedResult((prev) => prev + parsed.chunk);
            }
          } catch {
            console.warn("JSON chunk parsing wait...");
          }
        }
      }
      setResultRevision((prev) => prev + 1);
    } catch (error) {
      setGenerationError(resolveFriendlyErrorMessage(error));
      console.error("Streaming error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (!lastPayload || isLoading) return;
    handleGenerate(lastPayload);
  };

  const handleSavePrompt = async (promptText) => {
    const normalizedPrompt = String(promptText || '').trim();
    const currentUser = getStoredUser();
    const userEmail = String(currentUser?.email || '').trim();

    // 사용자 입력 키워드를 프롬프트 앞에 마커로 심기
    const keywordMarker = lastPayload?.keyword
      ? `[키워드:${lastPayload.keyword}]\n\n`
      : '';
    const promptWithMarker = keywordMarker + normalizedPrompt;

    if (!normalizedPrompt) {
      showToast('저장할 프롬프트가 없습니다.', { type: 'warning' });
      return false;
    }
    if (!userEmail) {
      showToast('로그인 정보가 확인되지 않아 저장할 수 없습니다.', { type: 'error' });
      return false;
    }

    try {
      const fullUrl = toApiUrl('/save');
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: userEmail,
          type: lastPayload?.type || '기본',
          content: promptWithMarker,
          keyword: lastPayload?.keyword || '',
        }),
      });

      if (!response.ok) {
        const errorData = await safeParseJson(response);
        throw createHttpError({ status: response.status, data: errorData });
      }

      const result = await response.json();
      if (result.success) {
        showToast('마이페이지에 프롬프트를 저장했습니다.', { type: 'success' });
        return true;
      } else {
        showToast(result.error || '프롬프트 저장에 실패했습니다.', { type: 'error' });
        return false;
      }
    } catch (error) {
      console.error('[Save Prompt Error]:', error);
      showToast('프롬프트 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', { type: 'error' });
      return false;
    }
  };

  if (!authChecked) return null;

  return (
    <div className="w-full">
      {/* ✅ 타이틀 아래와 패널 사이의 여백(space-y)을 대폭 줄였습니다. */}
      <div className="page creation-page space-y-2.5 sm:space-y-3 px-4 pt-2 pb-3 sm:px-5 sm:pt-3 sm:pb-4 2xl:px-5 2xl:pt-3 2xl:pb-4">

        {/* ✅ 구분선(border-b)을 삭제하고 아래쪽 여백(pb)을 최소화했습니다. */}
        <div className="creation-heading flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 pb-0">
          <div>
            <h1 className="creation-page-title text-2xl sm:text-3xl 2xl:text-2xl font-bold text-gray-900">
              콘텐츠 생성 스튜디오
            </h1>
          </div>
        </div>

        <div className="creation-grid gap-4 sm:gap-6 2xl:gap-5 items-stretch">
          <ErrorBoundary
            variant="section"
            resetKey={initialKeyword}
            title="입력 섹션을 표시하지 못했습니다."
            description="페이지를 새로고침하거나 잠시 후 다시 시도해 주세요."
          >
            <InputPanel
              onGenerate={handleGenerate}
              isLoading={isLoading}
              initialKeyword={initialKeyword}
            />
          </ErrorBoundary>

          <ErrorBoundary
            variant="section"
            resetKey={resultRevision}
            title="결과 섹션을 표시하지 못했습니다."
            description="생성을 다시 시도하거나 잠시 후 다시 시도해 주세요."
          >
            <ResultPanel
              key={resultRevision}
              content={generatedResult}
              isLoading={isLoading}
              errorMessage={generationError}
              onRetry={handleRetry}
              onSave={handleSavePrompt}
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default CreationPage;
