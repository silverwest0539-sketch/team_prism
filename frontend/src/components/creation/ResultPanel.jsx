import React, { useState, useEffect } from 'react';
import { Copy, Check, ArrowsClockwise, WarningCircle, BookmarkSimple } from '@phosphor-icons/react';

const ResultPanel = ({ content, isLoading = false, errorMessage = '', onRetry, onSave }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [editableContent, setEditableContent] = useState(() => String(content || ''));

  useEffect(() => {
    if (content) {
      setEditableContent(content);
    }
  }, [content]);

  const v1Content = editableContent.trim();
  useEffect(() => {
    setIsSaved(false);
  }, [v1Content]);

  const handleCopy = async () => {
    if (!v1Content) return;
    try {
      await navigator.clipboard.writeText(v1Content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  const handleSave = async () => {
    if (!v1Content || typeof onSave !== 'function') return;

    try {
      const didSave = await onSave(v1Content);
      if (!didSave) return;
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error('저장 실패:', err);
    }
  };

  let bodyContent;
  if (!v1Content && errorMessage) {
    bodyContent = (
      <div className="border border-red-200 bg-red-50 rounded-xl p-3">
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
          className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-white border border-red-200 hover:bg-red-100"
        >
          <ArrowsClockwise size={16} weight="bold" />
          다시 시도
        </button>
      </div>
    );
  } else if (!v1Content) {
    bodyContent = (
      <div className="border border-gray-200 bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
        <p className="font-semibold text-gray-700">생성된 프롬프트가 아직 없습니다.</p>
        <p>왼쪽 정보를 입력하고 생성 버튼을 눌러 프롬프트를 만들어 보세요.</p>
      </div>
    );
  } else {
    bodyContent = (
      <div className="space-y-2.5 h-full flex flex-col">
        {errorMessage && (
          <div className="border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-800">
            {errorMessage}
          </div>
        )}
        <div className="flex flex-col flex-1 min-h-0">
          <label className="block text-xs font-bold text-gray-700 mb-2">생성 프롬프트</label>
          {/* ✅ textarea가 남은 높이를 모두 채움 */}
          <textarea
            className="flex-1 w-full border border-gray-200 rounded-xl p-2.5 2xl:p-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none whitespace-pre-wrap text-gray-800 leading-relaxed text-sm"
            value={editableContent}
            onChange={(event) => setEditableContent(event.target.value)}
            placeholder="생성된 프롬프트를 자유롭게 다듬어 보세요."
          />
        </div>
      </div>
    );
  }

  return (
    /* ✅ h-full로 부모(grid cell) 높이를 꽉 채움 */
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">

      {/* 헤더 — 고정 높이 */}
      <div className="flex-shrink-0 flex items-center justify-between p-3 2xl:p-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-700">V1. AI 생성 프롬프트</span>
          {v1Content && <span className="w-2 h-2 rounded-full bg-green-500" />}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            disabled={!v1Content || isLoading || typeof onSave !== 'function'}
            className={`flex items-center gap-1 p-1.5 rounded-lg transition ${
              v1Content && !isLoading && typeof onSave === 'function'
                ? 'text-gray-500 hover:bg-gray-100 cursor-pointer'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="마이페이지에 저장하기"
          >
            {isSaved ? (
              <>
                <Check size={20} weight="bold" className="text-green-600" />
                <span className="text-xs font-bold text-green-600">저장됨</span>
              </>
            ) : (
              <BookmarkSimple size={20} weight="bold" />
            )}
          </button>

          <button
            onClick={handleCopy}
            disabled={!v1Content || isLoading}
            className={`flex items-center gap-1 p-1.5 rounded-lg transition ${
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
      </div>

      {/* ✅ 본문 — 남은 높이를 채우고 내부 스크롤 */}
      <div className="relative flex-1 min-h-0">

        {/* 스크롤 가능한 본문 */}
        <div className="absolute inset-0 p-3 sm:p-4 2xl:p-3 overflow-y-auto flex flex-col">
          {bodyContent}
        </div>

        {/* 로딩 오버레이 */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-10 flex flex-col items-center justify-center animate-fade-in rounded-b-xl">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
            <span className="text-indigo-600 font-bold animate-pulse text-lg">생성중...</span>
          </div>
        )}
      </div>

    </div>
  );
};

export default ResultPanel;
