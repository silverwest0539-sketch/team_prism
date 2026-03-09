import React, { useState } from 'react';
import CreationKeywordSection from './CreationKeywordSection';
import CreationProfileSection from './CreationProfileSection';
import CreationTargetSection from './CreationTargetSection';
import { useCreationForm } from './useCreationForm';

const INPUT_REQUIRED_MESSAGE = '주제 키워드를 입력해 주세요.';
const PURPOSE_REQUIRED_MESSAGE = '목적을 입력해 주세요.';
const GENERATING_LABEL = '생성 중...';
const GENERATE_LABEL = '생성';

const InputPanel = ({
  onGenerate,
  isLoading,
  initialKeyword = '',
}) => {
  const [keywordError, setKeywordError] = useState('');
  const [purposeError, setPurposeError] = useState('');

  const {
    keyword,
    selectedType,
    industry,
    purpose,
    target,
    essentialDetails,
    otherRequests,
    contentTypes,
    industries,
    setKeyword,
    setSelectedType,
    setIndustry,
    setPurpose,
    setTarget,
    setEssentialDetails,
    setOtherRequests,
    buildSubmitPayload,
  } = useCreationForm({ initialKeyword });

  const handleSubmit = () => {
    const payload = buildSubmitPayload();
    let hasError = false;

    if (!payload.keyword) {
      setKeywordError(INPUT_REQUIRED_MESSAGE);
      hasError = true;
    } else {
      setKeywordError('');
    }

    if (!String(payload.context || '').trim()) {
      setPurposeError(PURPOSE_REQUIRED_MESSAGE);
      hasError = true;
    } else {
      setPurposeError('');
    }

    if (hasError) return;

    onGenerate(payload);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 2xl:p-3 flex flex-col">
      <div className="flex flex-col gap-3 sm:gap-4 2xl:gap-2.5">
        <div className="order-1">
          <CreationKeywordSection
            keyword={keyword}
            onKeywordChange={(value) => {
              setKeyword(value);
              if (keywordError) setKeywordError('');
            }}
            helperMessage={keywordError}
            isHelperError={Boolean(keywordError)}
          />
        </div>

        <div className="order-2">
          <CreationProfileSection
            contentTypes={contentTypes}
            selectedType={selectedType}
            onSelectType={setSelectedType}
            industries={industries}
            industry={industry}
            onChangeIndustry={setIndustry}
            purpose={purpose}
            onChangePurpose={(value) => {
              setPurpose(value);
              if (purposeError && value.trim()) setPurposeError('');
            }}
            purposeError={purposeError}
          />
        </div>

        <div className="order-3">
          <CreationTargetSection
            target={target}
            essentialDetails={essentialDetails}
            otherRequests={otherRequests}
            onChangeTarget={setTarget}
            onChangeEssentialDetails={setEssentialDetails}
            onChangeOtherRequests={setOtherRequests}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className={`w-full text-white font-bold py-3 sm:py-3.5 2xl:py-2.5 rounded-xl transition flex items-center justify-center mt-1.5 2xl:mt-1 text-sm sm:text-base 2xl:text-sm shadow-md ${
          isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isLoading ? GENERATING_LABEL : GENERATE_LABEL}
      </button>
    </div>
  );
};

export default InputPanel;
