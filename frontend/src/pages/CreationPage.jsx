// src/pages/CreationPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ErrorBoundary from '../components/common/ErrorBoundary';
import InputPanel from '../components/creation/InputPanel';
import ResultPanel from '../components/creation/ResultPanel';
import { showToast } from '../utils/toast';
import apiClient from '../utils/apiClient';
import { getStoredUser } from '../utils/authStorage';
import { toApiUrl } from '../utils/apiClient';

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
    // 2. apiClient의 유틸리티 함수를 사용하여 안전하게 URL 생성
    // prompt.routes.js가 /api 밑에 붙어 있으므로 '/generate'만 넘기면 됩니다.
    const fullUrl = toApiUrl('/generate');
    
    console.log("Request URL:", fullUrl); 
    setLastPayload(inputData);
    setGenerationError('');
    setGeneratedResult('');
    setIsLoading(true);

    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // apiClient.js와 동일한 방식으로 토큰 추출
          'Authorization': `Bearer ${window.localStorage.getItem('token')}` 
        },
        body: JSON.stringify(inputData),
      });

      if (!response.ok) {
        // fetch는 에러 시 response.ok가 false가 됨
        const errorData = await response.json().catch(() => ({}));
        throw { response: { status: response.status, data: errorData } };
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
          
          // prompt.controller.js에서 보내는 종료 신호와 일치
          if (dataStr === '[DONE]') {
            isFinished = true;
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.chunk) {
              setGeneratedResult((prev) => prev + parsed.chunk);
            }
          } catch (e) {
            // 스트리밍 데이터가 잘려올 경우 대비
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

  if (!authChecked) {
    return null;
  }

  return (
    <div className="page space-y-4 sm:space-y-5 2xl:space-y-3 2xl:p-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-gray-200 pb-4 2xl:pb-2.5">
        <div>
          <h1 className="text-xl sm:text-2xl 2xl:text-xl font-bold text-gray-900">콘텐츠 생성 스튜디오</h1>
          <p className="text-sm sm:text-base 2xl:text-sm text-gray-500 mt-1 2xl:mt-0.5">
            컨텐츠 생성을 위한 프롬프트 초안을 만들어 드립니다.
          </p>
        </div>
      </div>

      <div className="creation-grid 2xl:gap-2.5">
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
