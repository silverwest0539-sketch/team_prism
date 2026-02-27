import React from 'react';

const CreationTargetSection = ({
  target,
  otherRequests,
  onChangeTarget,
  onChangeOtherRequests,
}) => {
  return (
    <div className="bg-gray-50 p-3 2xl:p-2.5 rounded-xl border border-gray-100 mb-3 sm:mb-4 2xl:mb-2.5">
      <label className="block text-sm font-bold text-gray-700 mb-2 2xl:mb-1.5">
        상세 타겟 설정 <span className="text-xs font-normal text-gray-500">(선택)</span>
      </label>
      <input
        type="text"
        className="w-full border border-gray-300 rounded-lg p-2.5 2xl:p-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3 2xl:mb-2 text-sm"
        value={target}
        onChange={(event) => onChangeTarget(event.target.value)}
        placeholder="예: 20~30대 직장인, 간편식/헬스 관심 사용자"
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
