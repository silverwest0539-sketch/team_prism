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
      <div className="mb-3 sm:mb-4 2xl:mb-2.5">
        <label className="block text-sm font-bold text-gray-800 mb-2 2xl:mb-1.5">1. 콘텐츠 유형</label>
        <div className="grid grid-cols-3 gap-1.5 2xl:gap-1">
          {contentTypes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onSelectType(item)}
              className={`border rounded-lg p-2.5 2xl:p-2 text-center transition font-medium text-[13px] 2xl:text-xs ${
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

      <div className="mb-3 sm:mb-4 2xl:mb-2.5">
        <label className="block text-sm font-bold text-gray-800 mb-2 2xl:mb-1.5">2. 업종</label>
        <select
          className="w-full border border-gray-300 rounded-lg p-2.5 2xl:p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
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

      <div className="mb-3 sm:mb-4 2xl:mb-2.5">
        <label className="block text-sm font-bold text-gray-800 mb-2 2xl:mb-1.5">3. 목적</label>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-2.5 2xl:p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
          rows={2}
          value={purpose}
          onChange={(event) => onChangePurpose(event.target.value)}
          placeholder="예: 신규 유입을 늘리고 예약/문의 전환을 높이고 싶어요."
        />
      </div>
    </>
  );
};

export default CreationProfileSection;
