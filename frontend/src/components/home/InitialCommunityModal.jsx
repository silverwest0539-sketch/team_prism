// src/components/home/InitialCommunityModal.jsx
import React, { useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react'; 

const COMMUNITY_OPTIONS = [
  { label: '더쿠', value: 'theqoo' },
  { label: '디시인사이드', value: 'dcinside' },
  { label: '루리웹', value: 'ruliweb' },
  { label: '네이트판', value: 'natepan' },
  { label: 'FM코리아', value: 'fmkorea' },
  { label: '다음에 선택하기', value: 'skip' }, // ✅ 추가됨
];

const InitialCommunityModal = ({ isOpen, onSubmit }) => {
  const [selected, setSelected] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selected) {
      onSubmit(selected);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 flex flex-col gap-6">
        
        {/* 헤더 영역 */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            관심 커뮤니티를 선택해주세요
          </h2>
          <p className="text-sm text-gray-500">
            선택하신 커뮤니티의 인기글을 먼저 보여드릴게요!
          </p>
        </div>

        {/* 선택 버튼 영역 (2x3 그리드) */}
        <div className="grid grid-cols-2 gap-3">
          {COMMUNITY_OPTIONS.map((comm) => {
            const isSelected = selected === comm.value;
            const isSkip = comm.value === 'skip';

            return (
              <button
                key={comm.value}
                onClick={() => setSelected(comm.value)}
                className={`
                  relative flex items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
                  ${isSelected 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-md' 
                    : isSkip 
                      ? 'border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400 hover:bg-gray-100 font-medium' // '다음에 선택하기' 전용 스타일
                      : 'border-gray-100 bg-white text-gray-600 hover:border-indigo-200 hover:bg-gray-50 font-medium'
                  }
                `}
              >
                {comm.label}
                {isSelected && (
                  <CheckCircle 
                    weight="fill" 
                    className="absolute right-3 w-5 h-5 text-indigo-600 animate-fade-in" 
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* 하단 확인 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className={`
            w-full py-3.5 rounded-xl font-bold text-white text-lg transition-all
            ${selected 
              ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200' 
              : 'bg-gray-300 cursor-not-allowed'
            }
          `}
        >
          {selected === 'skip' ? '건너뛰기' : 'Prism 시작하기'}
        </button>
      </div>
    </div>
  );
};

export default InitialCommunityModal;