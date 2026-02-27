import React from 'react';

const CreationKeywordSection = ({
  keyword,
  onKeywordChange,
  helperMessage = '',
  isHelperError = false,
}) => {
  return (
    <div className="mb-3 sm:mb-4 2xl:mb-2.5">
      <label className="block text-[13px] 2xl:text-xs font-bold text-gray-800 mb-1.5 2xl:mb-1">
        주제 키워드
      </label>
      <input
        type="text"
        className="w-full border border-gray-300 rounded-lg p-2.5 2xl:p-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm text-gray-800"
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder="트렌드 키워드 또는 원하는 주제 입력"
      />
      <p
        className={`text-[11px] mt-1.5 2xl:mt-1 ${
          isHelperError ? 'text-red-500' : 'text-gray-500'
        }`}
      >
        {helperMessage || '원하는 주제 키워드를 직접 입력해 주세요.'}
      </p>
    </div>
  );
};

export default CreationKeywordSection;
