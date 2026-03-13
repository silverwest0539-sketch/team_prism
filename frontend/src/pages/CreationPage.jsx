// src/pages/CreationPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { LockKey } from '@phosphor-icons/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ErrorBoundary from '../components/common/ErrorBoundary';
import InputPanel from '../components/creation/InputPanel';
import ResultPanel from '../components/creation/ResultPanel';
import { showToast } from '../utils/toast';
import { getStoredUser } from '../utils/authStorage';
import { toApiUrl } from '../utils/apiClient';
import { createHttpError, safeParseJson } from '../utils/fetchError';

const LOGIN_REQUIRED_TOAST = '\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD55C \uC11C\uBE44\uC2A4\uC785\uB2C8\uB2E4.';
const DEFAULT_GENERATE_ERROR = '\uD504\uB86C\uD504\uD2B8 \uC0DD\uC131 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC5B4\uC694. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.';
const INVALID_INPUT_ERROR = '\uC785\uB825 \uC815\uBCF4\uB97C \uD655\uC778\uD55C \uB4A4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.';
const EXPIRED_LOGIN_ERROR = '\uB85C\uADF8\uC778 \uC0C1\uD0DC\uAC00 \uB9CC\uB8CC\uB418\uC5C8\uC5B4\uC694. \uB2E4\uC2DC \uB85C\uADF8\uC778 \uD6C4 \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.';
const RATE_LIMIT_ERROR = '\uC694\uCCAD\uC774 \uBAB0\uB824 \uC7A0\uC2DC \uC9C0\uC5F0\uB418\uACE0 \uC788\uC5B4\uC694. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.';
const SERVER_ERROR = '\uC11C\uBC84\uAC00 \uC77C\uC2DC\uC801\uC73C\uB85C \uBD88\uC548\uC815\uD569\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.';
const TIMEOUT_ERROR = '\uC694\uCCAD \uC2DC\uAC04\uC774 \uCD08\uACFC\uB418\uC5C8\uC5B4\uC694. \uB124\uD2B8\uC6CC\uD06C \uC0C1\uD0DC\uB97C \uD655\uC778\uD558\uACE0 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.';
const NETWORK_ERROR = '\uC11C\uBC84\uC5D0 \uC5F0\uACB0\uD558\uC9C0 \uBABB\uD588\uC5B4\uC694. \uBC31\uC5D4\uB4DC \uC2E4\uD589 \uC0C1\uD0DC\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.';
const RETRY_GENERATE_ERROR = '\uD504\uB86C\uD504\uD2B8 \uC0DD\uC131 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC5B4\uC694. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.';
const EMPTY_PROMPT_WARNING = '\uC800\uC7A5\uD560 \uD504\uB86C\uD504\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.';
const DEFAULT_PROMPT_TYPE = '\uAE30\uBCF8';
const SAVE_SUCCESS = '\uB9C8\uC774\uD398\uC774\uC9C0\uC5D0 \uD504\uB86C\uD504\uD2B8\uB97C \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.';
const SAVE_FAILURE = '\uD504\uB86C\uD504\uD2B8 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.';
const SAVE_ERROR = '\uD504\uB86C\uD504\uD2B8 \uC800\uC7A5 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.';
const KEYWORD_MARKER_LABEL = '\uD0A4\uC6CC\uB4DC: ';
const PAGE_TITLE = '\uCF58\uD150\uCE20 \uC0DD\uC131 \uC2A4\uD29C\uB514\uC624';
const INPUT_ERROR_TITLE = '\uC785\uB825 \uC139\uC158\uC744 \uD45C\uC2DC\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.';
const INPUT_ERROR_DESC = '\uD398\uC774\uC9C0\uB97C \uC0C8\uB85C\uACE0\uCE68\uD558\uAC70\uB098 \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.';
const RESULT_ERROR_TITLE = '\uACB0\uACFC \uC139\uC158\uC744 \uD45C\uC2DC\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.';
const RESULT_ERROR_DESC = '\uC0DD\uC131\uC744 \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uAC70\uB098 \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.';
const LOGIN_REQUIRED_DESC_LINE1 = '\uCF58\uD150\uCE20 \uC0DD\uC131\uACFC \uD504\uB86C\uD504\uD2B8 \uC800\uC7A5 \uAE30\uB2A5\uC740';
const LOGIN_REQUIRED_DESC_LINE2 = '\uAC00\uC785\uD55C \uD68C\uC6D0\uC5D0\uAC8C\uB9CC \uC81C\uACF5\uB418\uACE0 \uC788\uC2B5\uB2C8\uB2E4.';
const LOGIN_REQUIRED_BUTTON = '\uB85C\uADF8\uC778\uD558\uACE0 \uCF58\uD150\uCE20 \uC0DD\uC131\uD558\uAE30';

const CreationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [generatedResult, setGeneratedResult] = useState('');
  const [resultRevision, setResultRevision] = useState(0);
  const [lastPayload, setLastPayload] = useState(null);
  const [generationError, setGenerationError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const savedUser = getStoredUser();
    setIsLoggedIn(!!savedUser?.email);
    setAuthChecked(true);
  }, []);

  const initialKeyword = useMemo(() => {
    return (searchParams.get('keyword') || '').trim();
  }, [searchParams]);

  const resolveFriendlyErrorMessage = (error, fallbackMessage = '') => {
    if (!error) {
      return String(fallbackMessage || '').trim() || DEFAULT_GENERATE_ERROR;
    }

    const status = error?.response?.status;
    const apiError = String(error?.response?.data?.error || fallbackMessage || '').trim();

    if (status === 400) return apiError || INVALID_INPUT_ERROR;
    if (status === 401 || status === 403) return EXPIRED_LOGIN_ERROR;
    if (status === 429) return RATE_LIMIT_ERROR;
    if (status >= 500) return SERVER_ERROR;
    if (error?.code === 'ECONNABORTED') return TIMEOUT_ERROR;
    if (!error?.response) return NETWORK_ERROR;
    return apiError || RETRY_GENERATE_ERROR;
  };

  const handleGenerate = async (inputData) => {
    if (!getStoredUser()?.email) {
      showToast(LOGIN_REQUIRED_TOAST, { type: 'warning' });
      navigate('/login');
      return;
    }

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
            console.warn('JSON chunk parsing wait...');
          }
        }
      }

      setResultRevision((prev) => prev + 1);
    } catch (error) {
      setGenerationError(resolveFriendlyErrorMessage(error));
      console.error('Streaming error:', error);
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

    const keywordMarker = lastPayload?.keyword
      ? `[${KEYWORD_MARKER_LABEL}${lastPayload.keyword}]\n\n`
      : '';
    const promptWithMarker = keywordMarker + normalizedPrompt;

    if (!normalizedPrompt) {
      showToast(EMPTY_PROMPT_WARNING, { type: 'warning' });
      return false;
    }

    if (!userEmail) {
      showToast(LOGIN_REQUIRED_TOAST, { type: 'warning' });
      navigate('/login');
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
          type: lastPayload?.type || DEFAULT_PROMPT_TYPE,
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
        showToast(SAVE_SUCCESS, { type: 'success' });
        return true;
      }

      showToast(result.error || SAVE_FAILURE, { type: 'error' });
      return false;
    } catch (error) {
      console.error('[Save Prompt Error]:', error);
      showToast(SAVE_ERROR, { type: 'error' });
      return false;
    }
  };

  if (!authChecked) return null;

  return (
    <div className="w-full relative">
      <div
        className={`page creation-page space-y-2.5 sm:space-y-3 px-4 pt-2 pb-3 sm:px-5 sm:pt-3 sm:pb-4 2xl:px-5 2xl:pt-3 2xl:pb-4 transition-all duration-500 ease-in-out ${
          !isLoggedIn ? 'opacity-30 blur-[6px] pointer-events-none select-none' : ''
        }`}
      >
        <div className="creation-heading flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 pb-0">
          <div>
            <h1 className="creation-page-title text-2xl sm:text-3xl 2xl:text-2xl font-bold text-gray-900">
              {PAGE_TITLE}
            </h1>
          </div>
        </div>

        <div className="creation-grid gap-4 sm:gap-6 2xl:gap-5 items-stretch">
          <ErrorBoundary
            variant="section"
            resetKey={initialKeyword}
            title={INPUT_ERROR_TITLE}
            description={INPUT_ERROR_DESC}
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
            title={RESULT_ERROR_TITLE}
            description={RESULT_ERROR_DESC}
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

      {!isLoggedIn ? (
        <div className="creation-login-overlay absolute inset-x-0 z-50 flex justify-center px-4">
          <div className="creation-login-card rounded-3xl border border-gray-200 bg-white shadow-2xl text-center max-w-md w-full">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-5">
              <LockKey size={32} weight="fill" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
              {LOGIN_REQUIRED_TOAST}
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed text-sm sm:text-base">
              {LOGIN_REQUIRED_DESC_LINE1}
              <br />
              {LOGIN_REQUIRED_DESC_LINE2}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-base sm:text-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-1"
            >
              {LOGIN_REQUIRED_BUTTON}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CreationPage;
