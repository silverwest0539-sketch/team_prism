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
    <div className="bg-gray-50 p-3 2xl:p-2.5 rounded-xl border border-gray-100 mb-3 sm:mb-4 2xl:mb-2.5">
      <div className="flex justify-end mb-2 2xl:mb-1.5">
        <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-500">
          선택 항목
        </span>
      </div>
      <label className="block text-sm font-bold text-gray-700 mb-2 2xl:mb-1.5">
        상세 타겟 설정
      </label>
      <input
        type="text"
        className="w-full border border-gray-300 rounded-lg p-2.5 2xl:p-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3 2xl:mb-2 text-sm"
        value={target}
        onChange={(event) => onChangeTarget(event.target.value)}
        placeholder="예: 20~30대 직장인, 간편식/헬스 관심 사용자"
      />

      <label className="block text-sm font-bold text-gray-700 mb-2 2xl:mb-1.5">
        꼭 포함할 정보
      </label>
      <textarea
        className="w-full border border-gray-300 rounded-lg p-2.5 2xl:p-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm mb-3 2xl:mb-2"
        rows={3}
        value={essentialDetails}
        onChange={(event) => onChangeEssentialDetails(event.target.value)}
        placeholder="예: 행사 일정, 행사 장소, 참여 조건, 신청 링크, 신청 마감일"
      />

      <label className="block text-sm font-bold text-gray-700 mb-2 2xl:mb-1.5">기타 요구사항</label>
      <textarea
        className="w-full border border-gray-300 rounded-lg p-2.5 2xl:p-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
        rows={2}
        value={otherRequests}
        onChange={(event) => onChangeOtherRequests(event.target.value)}
        placeholder="예: 존댓말 사용, '최고'라는 단어 금지 등 자유롭게 입력"
      />
    </div>
  );
};

export default CreationTargetSection;
