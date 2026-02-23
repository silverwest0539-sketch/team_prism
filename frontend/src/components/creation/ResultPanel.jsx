import React, { useState } from 'react';
import { Copy, Check, MagicWand } from '@phosphor-icons/react';

const ResultPanel = ({ content }) => {
  // 복사 상태 관리 (복사 완료 시 아이콘 변경을 위함)
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return; // 내용이 없으면 아무 일도 일어나지 않음

    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      
      // 2초 뒤에 다시 복사 아이콘으로 복구
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
      
      {/* 1. 상단 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
        {/* 좌측 타이틀 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-700">
            V1. AI 생성본
          </span>
          {content && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
        </div>

        {/* 우측 상단 복사 버튼 (요청 위치) */}
        <button 
          onClick={handleCopy}
          disabled={!content}
          className={`flex items-center gap-1 p-2 rounded-lg transition
            ${content 
              ? 'text-gray-500 hover:bg-gray-100 cursor-pointer' 
              : 'text-gray-300 cursor-not-allowed'
            }`}
          title="내용 복사하기"
        >
          {isCopied ? (
            <>
              <Check size={20} weight="bold" className="text-green-600" />
              <span className="text-xs font-bold text-green-600">복사됨</span>
            </>
          ) : (
            <Copy size={20} weight="bold" />
          )}
        </button>
      </div>

      {/* 2. 에디터 영역 */}
      <div 
        className="flex-1 p-4 sm:p-6 overflow-y-auto outline-none" 
        contentEditable="true" 
        suppressContentEditableWarning={true}
      >
        {content ? (
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base sm:text-lg">
            {content}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
             <MagicWand size={48} weight="duotone" className="mb-4 opacity-50"/>
             <p className="text-lg font-medium">왼쪽에서 내용을 입력하고 버튼을 눌러보세요!</p>
             <p className="text-sm">AI가 멋진 문구를 만들어드립니다.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ResultPanel;