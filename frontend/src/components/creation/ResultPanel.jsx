// src/components/creation/ResultPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, ArrowsClockwise, WarningCircle, BookmarkSimple, MagicWand, Sparkle } from '@phosphor-icons/react';

const ResultPanel = ({ content, isLoading = false, errorMessage = '', onRetry, onSave }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [editableContent, setEditableContent] = useState(() => String(content || ''));
  const panelRef = useRef(null);
  
  // 로딩 진행 단계를 위한 상태 (0, 1, 2, 3)
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (content) {
      setEditableContent(content);
    }
  }, [content]);

  const v1Content = editableContent.trim();

  useEffect(() => {
    const panelElement = panelRef.current;
    if (!panelElement) return undefined;

    const syncHeight = () => {
      if (window.innerWidth < 1280) {
        panelElement.style.height = '';
        return;
      }

      const inputPanel = document.querySelector('.creation-input-panel');
      if (!inputPanel) {
        panelElement.style.height = '';
        return;
      }

      const nextHeight = Math.ceil(inputPanel.getBoundingClientRect().height);
      panelElement.style.height = nextHeight > 0 ? `${nextHeight}px` : '';
    };

    syncHeight();

    const observer = new ResizeObserver(() => syncHeight());
    const inputPanel = document.querySelector('.creation-input-panel');
    if (inputPanel) {
      observer.observe(inputPanel);
    }

    window.addEventListener('resize', syncHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncHeight);
    };
  }, []);
  
  // 새로운 내용이 오면 저장 상태 초기화
  useEffect(() => {
    setIsSaved(false);
  }, [v1Content]);

  // 로딩 중일 때 5초마다 텍스트와 게이지를 변경하는 로직
  useEffect(() => {
    let timer1, timer2, timer3;
    if (isLoading) {
      setLoadingStep(0);
      timer1 = setTimeout(() => setLoadingStep(1), 5000); // 5초
      timer2 = setTimeout(() => setLoadingStep(2), 10000); // 10초
      timer3 = setTimeout(() => setLoadingStep(3), 15000); // 15초 (이후 홀딩)
    } else {
      setLoadingStep(0);
    }
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isLoading]);

  const handleCopy = async () => {
    if (!v1Content) return;
    try {
      await navigator.clipboard.writeText(v1Content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // 복사는 2초 후 원상복구 유지
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
      // 🔥 수정됨: 저장 버튼은 setTimeout을 제거하여 상태가 원상복구되지 않도록 함
    } catch (err) {
      console.error('저장 실패:', err);
    }
  };

  // 로딩 단계별 문구 설정
  const loadingMessages = [
    "AI가 입력된 조건을 꼼꼼히 분석하고 있어요",
    "트렌드 분석 결과를 프롬프트에 담는 중이에요",
    "매력적인 문장으로 프롬프트를 다듬고 있어요",
    "거의 다 왔어요! 잠시만 기다려주세요" // 생성이 길어질 때 여기서 홀딩
  ];

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
      <div className="creation-result-empty flex flex-col items-center justify-center h-full border border-gray-200 bg-gray-50 rounded-xl p-4 sm:p-5 text-center space-y-1.5 -translate-y-4">
        <p className="creation-result-empty-title font-semibold text-gray-700 text-base sm:text-lg">생성된 프롬프트가 아직 없습니다.</p>
        <p className="creation-result-empty-desc text-gray-500 text-sm sm:text-base">왼쪽 정보를 입력하고 생성 버튼을 눌러 프롬프트를 만들어 보세요.</p>
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
          <label className="creation-result-label block text-sm font-bold text-gray-700 mb-2">생성 프롬프트</label>
          <textarea
            className="creation-result-textarea flex-1 w-full h-full border border-gray-200 rounded-xl p-3 sm:p-4 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none whitespace-pre-wrap text-gray-800 leading-relaxed text-sm sm:text-base"
            value={editableContent}
            onChange={(event) => setEditableContent(event.target.value)}
            placeholder="생성된 프롬프트를 자유롭게 다듬어 보세요."
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="creation-result-panel bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[220px]"
    >

      {/* 헤더 */}
      <div className="creation-result-header flex-shrink-0 flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="creation-result-title text-base sm:text-lg font-bold text-gray-800">AI 생성 프롬프트</span>
          {v1Content && <span className="w-2.5 h-2.5 rounded-full bg-green-500" />}
        </div>

        <div className="flex items-center gap-2">
          {/* 🔥 수정됨: 저장 버튼 아이콘 상태 명확히 변경 (빈 아이콘 -> 색칠된 아이콘) */}
          <button
            onClick={handleSave}
            disabled={!v1Content || isLoading || typeof onSave !== 'function'}
            className={`creation-result-action-btn flex items-center gap-1 p-2 rounded-lg transition ${
              v1Content && !isLoading && typeof onSave === 'function'
                ? 'text-gray-600 hover:bg-gray-100 cursor-pointer'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="마이페이지에 저장하기"
          >
            {isSaved ? (
              <>
                {/* 저장 완료 시 꽉 찬 아이콘과 파란색 텍스트 */}
                <BookmarkSimple size={22} weight="fill" className="text-indigo-600" />
                <span className="text-sm font-bold text-indigo-600 hidden sm:inline">저장됨</span>
              </>
            ) : (
              <BookmarkSimple size={22} weight="bold" />
            )}
          </button>

          <button
            onClick={handleCopy}
            disabled={!v1Content || isLoading}
            className={`creation-result-action-btn flex items-center gap-1 p-2 rounded-lg transition ${
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
        <div className="creation-result-body absolute inset-0 p-3 h-full">
          {bodyContent}
        </div>

        {/* 🔥 수정됨: 지루하지 않은 로딩 오버레이 애니메이션 */}
        {isLoading && (
          <div className="creation-result-loading-overlay absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-b-xl transition-all duration-300">
            {/* 재미를 더하는 아이콘 애니메이션 */}
            <div className="relative mb-6">
              <MagicWand size={48} weight="duotone" className="text-indigo-500 animate-bounce" />
              <Sparkle size={24} weight="fill" className="text-yellow-400 absolute -top-1 -right-3 animate-pulse" />
            </div>

            {/* 단계별로 변하는 텍스트 */}
            <span className="creation-result-loading-text text-indigo-700 font-bold text-[15px] sm:text-base mb-4 tracking-tight transition-opacity duration-300">
              {loadingMessages[loadingStep]}
            </span>

            {/* 가상의 프로그레스 바 (자연스럽게 차오르다가 95%에서 홀딩) */}
            <div className="w-48 sm:w-64 h-2 bg-indigo-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 ease-out"
                style={{
                  width: loadingStep === 0 ? '25%' 
                       : loadingStep === 1 ? '55%' 
                       : loadingStep === 2 ? '80%' 
                       : '95%',
                  transitionDuration: '5000ms', // CSS만으로 부드럽게 차오르는 효과
                  transitionProperty: 'width'
                }}
              />
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ResultPanel;
