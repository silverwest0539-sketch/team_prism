import React from 'react';

const CreationTargetSection = ({
  target,
  essentialDetails,
  otherRequests,
  onChangeTarget,
  onChangeEssentialDetails,
  onChangeOtherRequests,
}) => {
  return (
    <div className="creation-target-section bg-gray-50 p-2 2xl:p-1.5 rounded-xl border border-gray-100 mb-1 sm:mb-1.5 2xl:mb-1">
      <div className="creation-target-header mb-1 2xl:mb-0.5 border-b border-gray-200 pb-0.5 2xl:pb-0.5">
        <span className="inline-flex items-center text-base font-bold text-gray-700">
          선택 항목
        </span>
      </div>
      <label className="block text-sm font-bold text-gray-800 mb-1 2xl:mb-0.5">
        상세 타겟 설정
      </label>
      <input
        type="text"
        className="creation-target-input w-full border border-gray-300 rounded-lg p-2.5 2xl:p-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-1.5 2xl:mb-1 text-sm"
        value={target}
        onChange={(event) => onChangeTarget(event.target.value)}
        placeholder="예: 20~30대 직장인, 간편식/헬스 관심 사용자"
      />

      <label className="block text-sm font-bold text-gray-800 mb-1 2xl:mb-0.5">
        꼭 포함할 정보
      </label>
      <textarea
        className="creation-target-textarea-primary w-full border border-gray-300 rounded-lg p-2.5 2xl:p-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm mb-1.5 2xl:mb-1"
        rows={1}
        value={essentialDetails}
        onChange={(event) => onChangeEssentialDetails(event.target.value)}
        placeholder="예: 행사 일정, 행사 장소, 참여 조건, 신청 링크, 신청 마감일"
      />

      <label className="block text-sm font-bold text-gray-800 mb-2 2xl:mb-1.5">기타 요구사항</label>
      <textarea
        className="creation-target-textarea w-full border border-gray-300 rounded-lg p-2.5 2xl:p-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
        rows={1}
        value={otherRequests}
        onChange={(event) => onChangeOtherRequests(event.target.value)}
        placeholder="예: 존댓말 사용, '최고'라는 단어 금지 등 자유롭게 입력"
      />
    </div>
  );
};

export default CreationTargetSection;
