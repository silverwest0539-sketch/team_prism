// src/components/creation/InputPanel.jsx
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
    <div className="creation-input-panel bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col">
      {/* ✅ 각 섹션 간의 여백(gap)을 줄여서 전체적으로 위로 끌어올렸습니다. */}
      <div className="creation-input-stack flex flex-col gap-2.5 flex-1">
        <div className="creation-input-keyword order-1">
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

        <div className="creation-input-profile order-2">
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

        {/* ✅ 불필요한 하단 마진(mb) 제거하여 선택 항목을 밀착시켰습니다. */}
        <div className="creation-input-target order-3">
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
        className={`creation-submit-button w-full text-white font-bold py-2.5 sm:py-3 rounded-xl transition flex items-center justify-center mt-[3px] text-base sm:text-lg shadow-md ${
          isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isLoading ? GENERATING_LABEL : GENERATE_LABEL}
      </button>
    </div>
  );
};

export default InputPanel;
