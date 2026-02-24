import React from 'react';

const CreationProfileSection = ({
  contentTypes,
  selectedType,
  onSelectType,
  industries,
  industry,
  onChangeIndustry,
  purpose,
  onChangePurpose,
}) => {
  return (
    <>
      <div className="mb-5 sm:mb-6 2xl:mb-3">
        <label className="block text-sm font-bold text-gray-800 mb-2 2xl:mb-1.5">1. 콘텐츠 유형</label>
        <div className="grid grid-cols-3 gap-2 2xl:gap-1.5">
          {contentTypes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onSelectType(item)}
              className={`border rounded-lg p-3 2xl:p-2.5 text-center transition font-medium text-sm 2xl:text-xs ${
                selectedType === item
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 sm:mb-6 2xl:mb-3">
        <label className="block text-sm font-bold text-gray-800 mb-2 2xl:mb-1.5">2. 업종</label>
        <select
          className="w-full border border-gray-300 rounded-lg p-3 2xl:p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          value={industry}
          onChange={(event) => onChangeIndustry(event.target.value)}
        >
          {industries.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-5 sm:mb-6 2xl:mb-3">
        <label className="block text-sm font-bold text-gray-800 mb-2 2xl:mb-1.5">3. 목적</label>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 2xl:p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          rows={2}
          value={purpose}
          onChange={(event) => onChangePurpose(event.target.value)}
          placeholder="콘텐츠를 만드는 목적이나 핵심 내용을 자유롭게 적어주세요."
        />
      </div>
    </>
  );
};

export default CreationProfileSection;
