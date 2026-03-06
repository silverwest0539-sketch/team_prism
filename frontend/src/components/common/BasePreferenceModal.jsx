// src/components/common/BasePreferenceModal.jsx
import React, { useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react'; 

const BasePreferenceModal = ({ 
  isOpen, 
  title, 
  subtitle, 
  options, 
  hasSkip = false, // '다음에 선택하기' 포함 여부
  submitText = '저장하기', 
  onSubmit,
  onClose // 마이페이지용 닫기 버튼 (옵션)
}) => {
  const [selected, setSelected] = useState(null);

  if (!isOpen) return null;

  // '다음에 선택하기'가 필요한 경우 옵션 배열 끝에 추가
  const displayOptions = hasSkip 
    ? [...options, { label: '다음에 선택하기', value: 'skip' }] 
    : options;

  const handleSubmit = () => {
    if (selected) {
      onSubmit(selected);
      setSelected(null); // 제출 후 초기화
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 flex flex-col gap-6 relative">
        
        {/* 마이페이지 등에서 모달을 닫아야 할 때 (onClose가 있을 때만 렌더링) */}
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            ✕
          </button>
        )}

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>

        {/* 선택 버튼 영역 (자동 균형 그리드) */}
        <div className="grid grid-cols-2 gap-3">
          {displayOptions.map((opt, idx) => {
            const isSelected = selected === opt.value;
            // 🔥 핵심: 전체 개수가 홀수이고, 현재 요소가 마지막 요소이면 2칸을 차지함
            const isLastOdd = idx === displayOptions.length - 1 && displayOptions.length % 2 !== 0;

            return (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className={`
                  ${isLastOdd ? 'col-span-2' : 'col-span-1'} 
                  relative flex items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                  ${isSelected 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' 
                    : 'border-gray-100 bg-white text-gray-600 hover:border-indigo-200 hover:bg-gray-50 font-medium'
                  }
                `}
              >
                {opt.label}
                {isSelected && <CheckCircle weight="fill" className="absolute right-3 w-5 h-5 text-indigo-600 animate-fade-in" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selected}
          className={`
            w-full py-3.5 rounded-xl font-bold text-white text-lg transition-all
            ${selected ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'}
          `}
        >
          {submitText}
        </button>
      </div>
    </div>
  );
};

export default BasePreferenceModal;