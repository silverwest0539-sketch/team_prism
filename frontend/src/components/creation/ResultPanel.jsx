// src/components/creation/ResultPanel.jsx
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
      <div className="flex flex-col items-center justify-center h-full border border-red-200 bg-red-50 rounded-xl p-6 text-center">
        <WarningCircle size={32} className="text-red-500 mb-2" weight="fill" />
        <p className="text-base sm:text-lg font-bold text-red-700">생성에 실패했어요</p>
        <p className="text-sm sm:text-base text-red-600 mt-1">{errorMessage}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-red-700 bg-white border border-red-200 hover:bg-red-100 transition"
        >
          <ArrowsClockwise size={18} weight="bold" />
          다시 시도
        </button>
      </div>
    );
  } else if (!v1Content) {
    bodyContent = (
      // ✅ 문구를 화면 정중앙에 배치 (flex-col, items-center, justify-center, h-full 적용)
      <div className="flex flex-col items-center justify-center h-full border border-gray-200 bg-gray-50 rounded-xl p-6 text-center space-y-2">
        <p className="font-semibold text-gray-700 text-base sm:text-lg">생성된 프롬프트가 아직 없습니다.</p>
        <p className="text-gray-500 text-sm sm:text-base">왼쪽 정보를 입력하고 생성 버튼을 눌러 프롬프트를 만들어 보세요.</p>
      </div>
    );
  } else {
    bodyContent = (
      <div className="space-y-3 h-full flex flex-col">
        {errorMessage && (
          <div className="border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 text-sm text-amber-800">
            {errorMessage}
          </div>
        )}
        <div className="flex flex-col flex-1 min-h-0">
          <label className="block text-sm font-bold text-gray-700 mb-2">생성 프롬프트</label>
          {/* ✅ 텍스트 에어리어가 영역 전체를 채우도록 flex-1 설정 */}
          <textarea
            className="flex-1 w-full h-full border border-gray-200 rounded-xl p-3 sm:p-4 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none whitespace-pre-wrap text-gray-800 leading-relaxed text-sm sm:text-base"
            value={editableContent}
            onChange={(event) => setEditableContent(event.target.value)}
            placeholder="생성된 프롬프트를 자유롭게 다듬어 보세요."
          />
        </div>
      </div>
    );
  }

  return (
    // ✅ 모바일에서 너무 작게 찌그러지지 않도록 min-h-[400px] 추가. 데스크탑은 h-full로 꽉 참.
    <div className="creation-result-panel bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full min-h-[280px]">

      {/* 헤더 */}
      <div className="flex-shrink-0 flex items-center justify-between p-3 sm:p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-bold text-gray-800">AI 생성 프롬프트</span>
          {v1Content && <span className="w-2.5 h-2.5 rounded-full bg-green-500" />}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!v1Content || isLoading || typeof onSave !== 'function'}
            className={`flex items-center gap-1 p-2 rounded-lg transition ${
              v1Content && !isLoading && typeof onSave === 'function'
                ? 'text-gray-600 hover:bg-gray-100 cursor-pointer'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="마이페이지에 저장하기"
          >
            {isSaved ? (
              <>
                <Check size={22} weight="bold" className="text-green-600" />
                <span className="text-sm font-bold text-green-600 hidden sm:inline">저장됨</span>
              </>
            ) : (
              <BookmarkSimple size={22} weight="bold" />
            )}
          </button>

          <button
            onClick={handleCopy}
            disabled={!v1Content || isLoading}
            className={`flex items-center gap-1 p-2 rounded-lg transition ${
              v1Content && !isLoading
                ? 'text-gray-600 hover:bg-gray-100 cursor-pointer'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="프롬프트 복사하기"
          >
            {isCopied ? (
              <>
                <Check size={22} weight="bold" className="text-green-600" />
                <span className="text-sm font-bold text-green-600 hidden sm:inline">복사됨</span>
              </>
            ) : (
              <Copy size={22} weight="bold" />
            )}
          </button>
        </div>
      </div>

      {/* 본문 컨텐츠 영역 */}
      <div className="relative flex-1 min-h-0 flex flex-col">
        {/* h-full을 주어 내부 bodyContent가 꽉 차도록 설정 */}
        <div className="absolute inset-0 p-3 sm:p-4 h-full">
          {bodyContent}
        </div>

        {/* 로딩 오버레이 */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-b-xl transition-all duration-300">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <span className="text-indigo-600 font-bold animate-pulse text-lg">프롬프트 생성중...</span>
          </div>
        )}
      </div>

    </div>
  );
};

export default ResultPanel;
