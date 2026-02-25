import React from 'react';
import { showToast } from '../../utils/toast';
import CreationKeywordSection from './CreationKeywordSection';
import CreationProfileSection from './CreationProfileSection';
import CreationTargetSection from './CreationTargetSection';
import { useCreationForm } from './useCreationForm';

const InputPanel = ({
  onGenerate,
  isLoading,
  initialKeyword = '',
}) => {
  const {
    keyword,
    selectedType,
    industry,
    purpose,
    target,
    otherRequests,
    isAutoProfileEnabled,
    recommendedProfile,
    contentTypes,
    industries,
    setKeyword,
    setSelectedType,
    setIndustry,
    setPurpose,
    setTarget,
    setOtherRequests,
    toggleAutoProfile,
    buildSubmitPayload,
  } = useCreationForm({ initialKeyword });

  const handleSubmit = () => {
    const payload = buildSubmitPayload();
    if (!payload.keyword) {
      showToast('주제 키워드를 입력해 주세요.', { type: 'warning' });
      return;
    }

    onGenerate(payload);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 2xl:p-4 flex flex-col">
      <div className="flex flex-col 2xl:grid 2xl:grid-cols-2 2xl:gap-3">
        <div className="order-1 2xl:h-full">
          <CreationKeywordSection
            keyword={keyword}
            onKeywordChange={setKeyword}
            recommendedReason={recommendedProfile.reason}
            isAutoProfileEnabled={isAutoProfileEnabled}
            onToggleAutoProfile={toggleAutoProfile}
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
            onChangePurpose={setPurpose}
          />
        </div>

        <div className="order-3 2xl:col-span-2">
          <CreationTargetSection
            target={target}
            otherRequests={otherRequests}
            onChangeTarget={setTarget}
            onChangeOtherRequests={setOtherRequests}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className={`w-full text-white font-bold py-3.5 sm:py-4 2xl:py-3 rounded-xl transition flex items-center justify-center mt-2 2xl:mt-1 text-base sm:text-lg shadow-md ${
          isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isLoading ? '생성 중...' : '생성'}
      </button>
    </div>
  );
};

export default InputPanel;

