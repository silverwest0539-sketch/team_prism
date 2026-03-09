import React from 'react';

const CONTENT_TYPE_LABEL = '1. 콘텐츠 유형';
const INDUSTRY_LABEL = '2. 업종';
const PURPOSE_LABEL = '3. 목적';
const PURPOSE_PLACEHOLDER =
  '예: 신규 유입을 늘리고 예약/문의 전환을 높이고 싶어요.';

const CreationProfileSection = ({
  contentTypes,
  selectedType,
  onSelectType,
  industries,
  industry,
  onChangeIndustry,
  purpose,
  onChangePurpose,
  purposeError = '',
}) => {
  return (
    <>
      <div className="mb-3 sm:mb-4 2xl:mb-2.5">
        <label className="block text-sm font-bold text-gray-800 mb-2 2xl:mb-1.5">{CONTENT_TYPE_LABEL}</label>
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
        <label className="block text-sm font-bold text-gray-800 mb-2 2xl:mb-1.5">{INDUSTRY_LABEL}</label>
        <div className="grid grid-cols-2 gap-1.5 2xl:gap-1">
          {industries.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onChangeIndustry(item)}
              className={`border rounded-lg p-2.5 2xl:p-2 text-center transition font-medium text-[13px] 2xl:text-xs ${
                industry === item
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
        <label className="block text-sm font-bold text-gray-800 mb-2 2xl:mb-1.5">{PURPOSE_LABEL}</label>
        <textarea
          className={`w-full border rounded-lg p-2.5 2xl:p-2 focus:outline-none focus:ring-2 resize-none text-sm ${
            purposeError
              ? 'border-red-400 focus:ring-red-200'
              : 'border-gray-300 focus:ring-indigo-500'
          }`}
          rows={2}
          value={purpose}
          onChange={(event) => onChangePurpose(event.target.value)}
          placeholder={PURPOSE_PLACEHOLDER}
        />
        {purposeError && <p className="text-sm mt-1 text-red-500">{purposeError}</p>}
      </div>
    </>
  );
};

export default CreationProfileSection;
