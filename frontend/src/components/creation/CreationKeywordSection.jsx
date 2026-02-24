import React from 'react';
import { MagicWand } from '@phosphor-icons/react';

const CreationKeywordSection = ({
  keyword,
  onKeywordChange,
  recommendedReason,
  isAutoProfileEnabled,
  onToggleAutoProfile,
}) => {
  return (
    <div className="mb-5 sm:mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
      <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
        <MagicWand weight="fill" /> 주제 키워드 (자동 분석됨)
      </label>
      <input
        type="text"
        className="w-full border border-indigo-200 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700"
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder="트렌드 키워드 또는 원하는 주제 입력"
      />
      <p className="text-xs text-indigo-500 mt-2">
        기본적으로 트렌드 키워드가 입력되지만, 원하는 주제로 변경 가능합니다.
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-indigo-700">
          자동 추천: <span className="font-semibold">{recommendedReason}</span>
        </p>
        <button
          type="button"
          onClick={onToggleAutoProfile}
          className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors ${
            isAutoProfileEnabled
              ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {isAutoProfileEnabled ? '자동추천 ON' : '자동추천 OFF'}
        </button>
      </div>
    </div>
  );
};

export default CreationKeywordSection;

