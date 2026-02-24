import React, { useState } from 'react';
import { Copy, Check, ArrowsClockwise, WarningCircle } from '@phosphor-icons/react';

const ResultPanel = ({ content, isLoading = false, errorMessage = '', onRetry }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [editableContent, setEditableContent] = useState(() => String(content || ''));

  const v1Content = editableContent.trim();

  const handleCopy = async () => {
    if (!v1Content) return;

    try {
      await navigator.clipboard.writeText(v1Content);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
      <div className="flex items-center justify-between p-4 2xl:p-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-700">V1. AI 생성 프롬프트</span>
          {v1Content && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
        </div>

        <button
          onClick={handleCopy}
          disabled={!v1Content || isLoading}
          className={`flex items-center gap-1 p-2 rounded-lg transition ${
            v1Content && !isLoading
              ? 'text-gray-500 hover:bg-gray-100 cursor-pointer'
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title="프롬프트 복사하기"
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

      <div className="p-4 sm:p-6 2xl:p-4 outline-none">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-40 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-100 border border-gray-200 rounded-xl" />
            <div className="h-3 w-48 bg-gray-200 rounded" />
            <div className="h-3 w-56 bg-gray-200 rounded" />
            <p className="text-sm text-gray-500 pt-1">프롬프트를 생성하는 중입니다...</p>
          </div>
        ) : !v1Content && errorMessage ? (
          <div className="border border-red-200 bg-red-50 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <WarningCircle size={20} className="text-red-600 mt-0.5" weight="fill" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-700">생성에 실패했어요</p>
                <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-red-700 bg-white border border-red-200 hover:bg-red-100"
            >
              <ArrowsClockwise size={16} weight="bold" />
              다시 시도
            </button>
          </div>
        ) : !v1Content ? (
          <div className="border border-gray-200 bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
            <p className="font-semibold text-gray-700">생성된 프롬프트가 아직 없습니다.</p>
            <p>왼쪽 정보를 입력하고 생성 버튼을 눌러 프롬프트를 만들어 보세요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {errorMessage && (
              <div className="border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-800">
                {errorMessage}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">생성 프롬프트</label>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 2xl:p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-y min-h-[220px] 2xl:min-h-[150px] whitespace-pre-wrap text-gray-800 leading-relaxed text-sm sm:text-base"
                value={editableContent}
                onChange={(event) => setEditableContent(event.target.value)}
                placeholder="생성된 프롬프트를 자유롭게 다듬어 보세요."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultPanel;
