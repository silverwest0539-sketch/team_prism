import React from 'react';
import { PROMPT_TEMPLATE_OPTIONS } from '../../utils/promptTemplates';

const CreationPromptTemplateSection = ({
  recommendedTemplateMetaName,
  recommendedTemplateReason,
  selectedPromptTemplate,
  selectedTemplateMeta,
  promptTemplateText,
  onApplyRecommendedTemplate,
  onChangePromptTemplate,
  onRestorePromptTemplateText,
  onChangePromptTemplateText,
}) => {
  return (
    <div className="mb-5 sm:mb-6 bg-amber-50 p-4 rounded-xl border border-amber-100">
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="block text-sm font-bold text-amber-900">4. 프롬프트 템플릿</label>
        <button
          type="button"
          onClick={onApplyRecommendedTemplate}
          className="text-xs font-semibold text-amber-700 hover:text-amber-900"
        >
          추천값 적용
        </button>
      </div>

      <p className="text-xs text-amber-700 mb-3">
        자동 추천: <span className="font-bold">{recommendedTemplateMetaName}</span> ·{' '}
        {recommendedTemplateReason}
      </p>

      <select
        className="w-full border border-amber-200 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
        value={selectedPromptTemplate}
        onChange={(event) => onChangePromptTemplate(event.target.value)}
      >
        {PROMPT_TEMPLATE_OPTIONS.map((template) => (
          <option key={template.key} value={template.key}>
            {template.name}
          </option>
        ))}
      </select>

      <p className="text-xs text-gray-600 mt-2">
        선택된 템플릿: <span className="font-semibold">{selectedTemplateMeta.name}</span> ·{' '}
        {selectedTemplateMeta.description}
      </p>

      <div className="mt-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <label className="block text-xs font-bold text-gray-700">템플릿 프롬프트(수정 가능)</label>
          <button
            type="button"
            onClick={onRestorePromptTemplateText}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900"
          >
            기본 프롬프트 복원
          </button>
        </div>
        <textarea
          className="w-full border border-amber-200 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none text-xs text-gray-700 leading-relaxed"
          rows={10}
          value={promptTemplateText}
          onChange={(event) => onChangePromptTemplateText(event.target.value)}
          placeholder="템플릿 프롬프트를 직접 작성하거나 수정할 수 있습니다."
        />
        <p className="text-[11px] text-gray-500 mt-1">
          현재 선택 템플릿을 기반으로 자동 생성되며, 직접 수정한 내용이 우선 사용됩니다.
        </p>
      </div>
    </div>
  );
};

export default CreationPromptTemplateSection;

