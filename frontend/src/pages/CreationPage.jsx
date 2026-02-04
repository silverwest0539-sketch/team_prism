// src/pages/CreationPage.jsx
import React, { useState } from 'react';
import InputPanel from '../components/creation/InputPanel';
import ResultPanel from '../components/creation/ResultPanel';
import { CheckCircle } from '@phosphor-icons/react';

const CreationPage = () => {
  const [generatedResult, setGeneratedResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (inputData) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputData),
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedResult(data.result);
      } else {
        alert("생성 실패: " + (data.error || "알 수 없는 오류"));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("서버 연결에 실패했습니다. 백엔드 터미널이 켜져 있는지 확인하세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      
      {/* 상단 헤더 */}
      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">콘텐츠 생성 스튜디오</h1>
          <p className="text-gray-500 mt-1">
            저장된 브랜드 톤앤매너로 수정부터 내보내기까지 한 번에 완료하세요.
          </p>
        </div>
        
        {/* 우측 상단 키워드 뱃지 */}
        <div className="pill bg-green-100 text-green-700 flex items-center gap-1">
          <CheckCircle weight="fill" />
          키워드: 저당 간식
        </div>
      </div>

      {/* 메인 그리드 */}
      <div className="creation-grid">
        <InputPanel onGenerate={handleGenerate} isLoading={isLoading} />
        <ResultPanel content={generatedResult} />
      </div>

    </div>
  );
};

export default CreationPage;