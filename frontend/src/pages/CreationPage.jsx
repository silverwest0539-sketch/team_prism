// src/pages/CreationPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ErrorBoundary from '../components/common/ErrorBoundary';
import InputPanel from '../components/creation/InputPanel';
import ResultPanel from '../components/creation/ResultPanel';
import { showToast } from '../utils/toast';
import apiClient from '../utils/apiClient';
import { getStoredUser } from '../utils/authStorage';

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

    if (status === 400) {
      return apiError || '입력 정보를 확인한 뒤 다시 시도해 주세요.';
    }
    if (status === 401 || status === 403) {
      return '로그인 상태가 만료되었어요. 다시 로그인 후 시도해 주세요.';
    }
    if (status === 429) {
      return '요청이 몰려 잠시 지연되고 있어요. 잠시 후 다시 시도해 주세요.';
    }
    if (status >= 500) {
      return '서버가 일시적으로 불안정합니다. 잠시 후 다시 시도해 주세요.';
    }
    if (error?.code === 'ECONNABORTED') {
      return '요청 시간이 초과되었어요. 네트워크 상태를 확인하고 다시 시도해 주세요.';
    }
    if (!error?.response) {
      return '서버에 연결하지 못했어요. 백엔드 실행 상태를 확인해 주세요.';
    }
    return apiError || '프롬프트 생성 중 오류가 발생했어요. 다시 시도해 주세요.';
  };

  const handleGenerate = async (inputData) => {
    setLastPayload(inputData);
    setGenerationError('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/generate', inputData);
      const data = response.data;

      if (data.success) {
        setGeneratedResult(data.result);
        setResultRevision((prev) => prev + 1);

        if (data.selectedTemplate?.name) {
          showToast(`생성 프롬프트 유형: ${data.selectedTemplate.name}`, {
            type: 'info',
            duration: 1800,
          });
        }
      } else {
        const message = resolveFriendlyErrorMessage(null, data.error || '');
        setGenerationError(message);
        showToast(message, { type: 'error' });
      }
    } catch (error) {
      const message = resolveFriendlyErrorMessage(error);
      setGenerationError(message);
      showToast(message, { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (!lastPayload || isLoading) return;
    handleGenerate(lastPayload);
  };

  if (!authChecked) {
    return null;
  }

  return (
    <div className="page space-y-6 sm:space-y-8 2xl:space-y-4 2xl:p-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-gray-200 pb-5 2xl:pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl 2xl:text-xl font-bold text-gray-900">콘텐츠 생성 스튜디오</h1>
          <p className="text-sm sm:text-base 2xl:text-sm text-gray-500 mt-1 2xl:mt-0.5">
            다양한 브랜드 톤앤매너로 수정부터 재생성까지 한 번에 완료하세요.
          </p>
        </div>
      </div>

      <div className="creation-grid 2xl:gap-3">
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
          />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default CreationPage;
