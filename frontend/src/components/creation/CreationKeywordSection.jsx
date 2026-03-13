import React from 'react';

const CreationKeywordSection = ({
  keyword,
  onKeywordChange,
  helperMessage = '',
  isHelperError = false,
}) => {
  return (
    // ✅ 아래쪽 여백(mb)을 줄여서 하단 요소들을 위로 더 끌어올렸습니다.
    <div className="creation-keyword-section mb-2 sm:mb-2.5">
      {/* ✅ 라벨 폰트 크기 통일성 있게 확대 (text-sm -> text-base) */}
      <label className="creation-keyword-label block text-sm sm:text-base font-bold text-gray-800 mb-1.5">
        주제 키워드
      </label>
      
      {/* ✅ 입력창 폰트 및 패딩 조정 */}
      <input
        type="text"
        className="w-full border border-gray-300 rounded-lg p-2 sm:p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm sm:text-[15px] placeholder:text-sm sm:placeholder:text-[15px] text-gray-800"
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder="트렌드 키워드 또는 원하는 주제 입력"
      />
      
      {/* ✅ 불필요한 기본 텍스트 삭제. 에러 메시지(helperMessage)가 있을 때만 영역이 나타나도록 수정하여 평상시 공간 절약 */}
      {helperMessage && (
        <p
          className={`text-xs sm:text-sm mt-1.5 ${
            isHelperError ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          {helperMessage}
        </p>
      )}
    </div>
  );
};

export default CreationKeywordSection;
