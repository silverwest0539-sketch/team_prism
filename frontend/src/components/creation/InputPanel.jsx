import React from 'react';
import { ArrowsClockwise } from '@phosphor-icons/react';
import { showToast } from '../../utils/toast';
import CreationKeywordSection from './CreationKeywordSection';
import CreationProfileSection from './CreationProfileSection';
import CreationPromptTemplateSection from './CreationPromptTemplateSection';
import CreationTargetSection from './CreationTargetSection';
import { useCreationForm } from './useCreationForm';

const InputPanel = ({ onGenerate, isLoading, initialKeyword = '' }) => {
  const {
    keyword,
    selectedType,
    industry,
    purpose,
    target,
    otherRequests,
    selectedPromptTemplate,
    promptTemplateText,
    isAutoProfileEnabled,
    recommendedProfile,
    recommendedTemplate,
    recommendedTemplateMeta,
    selectedTemplateMeta,
    contentTypes,
    industries,
    setKeyword,
    setSelectedType,
    setIndustry,
    setPurpose,
    setTarget,
    setOtherRequests,
    toggleAutoProfile,
    applyRecommendedTemplate,
    handlePromptTemplateChange,
    restorePromptTemplateText,
    handlePromptTemplateTextChange,
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 h-full min-h-0 flex flex-col overflow-y-auto">
      <CreationKeywordSection
        keyword={keyword}
        onKeywordChange={setKeyword}
        recommendedReason={recommendedProfile.reason}
        isAutoProfileEnabled={isAutoProfileEnabled}
        onToggleAutoProfile={toggleAutoProfile}
      />

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

      <CreationPromptTemplateSection
        recommendedTemplateMetaName={recommendedTemplateMeta.name}
        recommendedTemplateReason={recommendedTemplate.reason}
        selectedPromptTemplate={selectedPromptTemplate}
        selectedTemplateMeta={selectedTemplateMeta}
        promptTemplateText={promptTemplateText}
        onApplyRecommendedTemplate={applyRecommendedTemplate}
        onChangePromptTemplate={handlePromptTemplateChange}
        onRestorePromptTemplateText={restorePromptTemplateText}
        onChangePromptTemplateText={handlePromptTemplateTextChange}
      />

      <CreationTargetSection
        target={target}
        otherRequests={otherRequests}
        onChangeTarget={setTarget}
        onChangeOtherRequests={setOtherRequests}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className={`w-full text-white font-bold py-3.5 sm:py-4 rounded-xl transition flex items-center justify-center gap-2 mt-auto text-base sm:text-lg shadow-md ${
          isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isLoading ? (
          '✨ 열심히 쓰는 중...'
        ) : (
          <>
            <ArrowsClockwise weight="bold" className="text-xl" />
            수정사항 반영하여 다시 생성
          </>
        )}
      </button>
    </div>
  );
};

export default InputPanel;
