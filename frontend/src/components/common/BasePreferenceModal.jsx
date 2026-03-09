// src/components/common/BasePreferenceModal.jsx
import React, { useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react'; 

const BasePreferenceModal = ({ 
  isOpen, 
  title, 
  subtitle, 
  options, 
  submitText = '저장하기', 
  onSubmit,
  onReset, // [추가] 초기화 버튼 핸들러
  onClose 
}) => {
  const [selected, setSelected] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selected) {
      onSubmit(selected);
      setSelected(null); 
    }
  };

  const handleReset = () => {
    setSelected(null); // 모달 내 선택 해제
    if (onReset) onReset(); // 부모 컴포넌트에 초기화 동작 전달
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 flex flex-col gap-6 relative">
        
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            ✕
          </button>
        )}

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {options.map((opt, idx) => {
            const isSelected = selected === opt.value;
            const isLastOdd = idx === options.length - 1 && options.length % 2 !== 0;

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

        {/* 🔥 핵심: 3대7 비율의 초기화 및 저장 버튼 */}
        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={handleReset}
            className="w-[30%] py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all text-sm sm:text-base"
          >
            초기화
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selected}
            className={`
              w-[70%] py-3.5 rounded-xl font-bold text-white transition-all text-sm sm:text-base
              ${selected ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'}
            `}
          >
            {submitText}
          </button>
        </div>

      </div>
    </div>
  );
};

export default BasePreferenceModal;