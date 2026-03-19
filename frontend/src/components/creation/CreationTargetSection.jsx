import React from 'react';

const CreationTargetSection = ({
  target,
  otherRequests,
  onChangeTarget,
  onChangeOtherRequests,
}) => {
  return (
    <div className="creation-target-section bg-gray-50 rounded-xl border border-gray-100 pb-3 mb-0">
      <div className="creation-target-header border-b border-gray-200 mb-3">
        <span className="inline-flex items-center text-base font-bold text-gray-700">
          선택 항목
        </span>
      </div>
      
      <div className="px-3">
        <label className="block text-sm font-bold text-gray-800 mb-1">
          상세 타겟 설정
        </label>
        <input
          type="text"
          className="creation-target-input w-full border border-gray-300 rounded-lg p-2.5 2xl:p-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-4"
          value={target}
          onChange={(event) => onChangeTarget(event.target.value)}
          placeholder="예: 20~30대 직장인, 간편식/헬스 관심 사용자"
        />

        <label className="block text-sm font-bold text-gray-800 mb-1">
          기타 요구사항
        </label>
        <textarea
          className="creation-target-textarea w-full border border-gray-300 rounded-lg p-2.5 2xl:p-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
          rows={3} 
          value={otherRequests}
          onChange={(event) => onChangeOtherRequests(event.target.value)}
          placeholder="예: 행사 일정, 행사 장소, 참여 조건, 신청 링크, 신청 마감일등 꼭 포함하고 싶은 기타 정보"
        />
      </div>
    </div>
  );
};

export default CreationTargetSection;