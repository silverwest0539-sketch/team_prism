import React from 'react';
import { PROMPT_TEMPLATE_OPTIONS } from '../../utils/promptTemplates';

const CreationPromptTemplateSection = ({
  selectedPromptTemplate,
  onChangePromptTemplate,
}) => {
  return (
    <div className="mb-5 sm:mb-6 2xl:mb-3 bg-white p-4 2xl:p-3 rounded-xl border border-gray-200">
      <div className="mb-2 2xl:mb-1.5">
        <label className="block text-sm font-bold text-gray-700">4. 프롬프트 생성 유형</label>
      </div>

      <select
        className="w-full border border-gray-200 rounded-lg p-3 2xl:p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
        value={selectedPromptTemplate}
        onChange={(event) => onChangePromptTemplate(event.target.value)}
      >
        {PROMPT_TEMPLATE_OPTIONS.map((template) => (
          <option key={template.key} value={template.key}>
            {template.name}
          </option>
        ))}
      </select>

      <p className="text-[11px] text-gray-500 mt-2">
        선택한 유형을 기준으로 GPT API 요청용 프롬프트를 자동 생성합니다.
      </p>
    </div>
  );
};

export default CreationPromptTemplateSection;
