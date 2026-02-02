import React from 'react';

const AiSummary = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-blue-600 font-bold mb-4 flex items-center gap-2">
        🔍 AI 키워드 분석 요약
      </h3>
      <div className="bg-gray-50 p-6 rounded-lg text-gray-600 min-h-[100px]">
        해당 밈(키워드)의 의미와 맥락 등을 요약 정리하는 텍스트가 여기에 들어옵니다.
        <br />
        (LLM 모델이 생성한 텍스트가 표시될 영역)
      </div>
    </div>
  );
};
export default AiSummary;