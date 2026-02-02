import React, { useState } from 'react'; // [수정] { useState }가 반드시 있어야 합니다!
import InputPanel from '../components/InputPanel';
import ResultPanel from '../components/ResultPanel';
import { CheckCircle } from '@phosphor-icons/react';

const CreationPage = () => {
  // 1. 상태 관리 (생성된 결과물, 로딩 상태)
  const [generatedResult, setGeneratedResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 2. API 호출 함수 (InputPanel에서 버튼 누르면 실행됨)
  const handleGenerate = async (inputData) => {
    setIsLoading(true); // 로딩 시작
    try {
      // Flask 서버(5000번 포트)로 요청 전송
      const response = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputData), // 사용자가 입력한 데이터를 서버로 보냄
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedResult(data.result); // 성공 시 결과창 업데이트
      } else {
        alert("생성 실패: " + (data.error || "알 수 없는 오류"));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("서버 연결에 실패했습니다. 백엔드 터미널이 켜져 있는지 확인하세요.");
    } finally {
      setIsLoading(false); // 로딩 끝
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      
      {/* 1. 상단 헤더 영역 */}
      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">콘텐츠 생성 스튜디오</h1>
          <p className="text-gray-500 mt-1">
            저장된 브랜드 톤앤매너로 수정부터 내보내기까지 한 번에 완료하세요.
          </p>
        </div>
        
        {/* 우측 상단 키워드 뱃지 */}
        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
          <CheckCircle weight="fill" />
          키워드: 저당 간식
        </div>
      </div>

      {/* 2. 메인 그리드 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[600px]">
        {/* InputPanel에 함수(handleGenerate)와 상태(isLoading) 전달 */}
        <InputPanel onGenerate={handleGenerate} isLoading={isLoading} />
        
        {/* ResultPanel에 결과 데이터(generatedResult) 전달 */}
        <ResultPanel content={generatedResult} />
      </div>

    </div>
  );
};

export default CreationPage;