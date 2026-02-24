// src/pages/CreationPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import InputPanel from '../components/creation/InputPanel';
import ResultPanel from '../components/creation/ResultPanel';
import { showToast } from '../utils/toast';
import apiClient from '../utils/apiClient';
import { getStoredUser } from '../utils/authStorage';

const CreationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [generatedResult, setGeneratedResult] = useState('');
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

  const handleGenerate = async (inputData) => {
    setIsLoading(true);

    try {
      const response = await apiClient.post('/generate', inputData);
      const data = response.data;

      if (data.success) {
        setGeneratedResult(data.result);
        if (data.selectedTemplate?.name) {
          showToast(`적용 템플릿: ${data.selectedTemplate.name}`, { type: 'info', duration: 1800 });
        }
      } else {
        showToast(`생성 실패: ${data.error || '알 수 없는 오류'}`, { type: 'error' });
      }
    } catch (error) {
      showToast(error.response?.data?.error || '서버 연결에 실패했습니다. 백엔드 터미널이 켜져 있는지 확인하세요.', {
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!authChecked) {
    return null;
  }

  return (
    <div className="page space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">콘텐츠 생성 스튜디오</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            다양한 브랜드 톤앤매너로 수정부터 재생성까지 한 번에 완료하세요.
          </p>
        </div>
      </div>

      <div className="creation-grid">
        <InputPanel onGenerate={handleGenerate} isLoading={isLoading} initialKeyword={initialKeyword} />
        <ResultPanel content={generatedResult} />
      </div>
    </div>
  );
};

export default CreationPage;
