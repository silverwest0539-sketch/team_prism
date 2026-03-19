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
    userType,
    purpose,
    target,
    otherRequests,
    contentTypes,
    industries,
    userTypes,
    setKeyword,
    setSelectedType,
    setIndustry,
    setUserType,
    setPurpose,
    setTarget,
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
      {/* ✅ flex-1을 제거하여 박스가 불필요하게 늘어나는 것을 방지했습니다. */}
      <div className="creation-input-stack flex flex-col gap-2.5">
        <div className="creation-input-main">
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
              userTypes={userTypes}
              userType={userType}
              onChangeUserType={setUserType}
              purpose={purpose}
              onChangePurpose={(value) => {
                setPurpose(value);
                if (purposeError && value.trim()) setPurposeError('');
              }}
              purposeError={purposeError}
            />
          </div>
        </div>

        {/* ✅ 불필요하게 자리만 차지하던 middle-spacer와 bottom-spacer를 완전히 제거했습니다. */}
        <div className="creation-input-target order-3">
          <CreationTargetSection
            target={target}
            otherRequests={otherRequests}
            onChangeTarget={setTarget}
            onChangeOtherRequests={setOtherRequests}
          />
        </div>
      </div>

      {/* ✅ 버튼 상단 마진을 mt-3으로 적절히 고정하여 섹션 바로 아래에 붙도록 수정했습니다. */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className={`creation-submit-button w-full text-white font-bold py-2.5 sm:py-3 rounded-xl transition flex items-center justify-center mt-3 text-base sm:text-lg shadow-md ${
          isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isLoading ? GENERATING_LABEL : GENERATE_LABEL}
      </button>
    </div>
  );
};

export default InputPanel;