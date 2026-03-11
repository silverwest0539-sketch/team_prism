import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { showToast } from '../../utils/toast';
import { toApiUrl } from '../../utils/apiClient';

const formatSavedAt = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const SavedPromptsSection = ({ email = '' }) => {
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [copiedId, setCopiedId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  const getPromptKeyword = (item = {}) => {
    const keyword = String(item.keyword || '').trim();
    return keyword || '키워드 없음';
  };

  const getPromptType = (item = {}) => String(item.type || '').trim();

  const extractIndustryFromPrompt = (prompt = '') => {
    const text = String(prompt || '').trim();
    if (!text) return '';

    const byTitleMatch = text.match(/(?:^|\n)\s*-?\s*업종\s*[:：]\s*([^\n]+)/i);
    if (byTitleMatch?.[1]) {
      return byTitleMatch[1].trim();
    }

    const byIntroMatch = text.match(/당신은\s+(.+?)\s+전문\s+카피라이터/i);
    if (byIntroMatch?.[1]) {
      return byIntroMatch[1].trim();
    }

    return '';
  };

  const extractPurposeFromPrompt = (prompt = '') => {
    const text = String(prompt || '').trim();
    if (!text) return '';

    const byLine = text.match(/(?:^|\n)\s*-?\s*(?:제작\s*목적|목적)\s*[:：]\s*([^\n]+)/i);
    if (byLine?.[1]) return byLine[1].trim();

    const bySentence = text.match(/목적은\s*(.+?)\s*(?:이며|이고|입니다|[.,\n])/);
    if (bySentence?.[1]) return bySentence[1].trim();

    return '';
  };

  const extractTargetFromPrompt = (prompt = '') => {
    const text = String(prompt || '').trim();
    if (!text) return '';

    const byLine = text.match(/(?:^|\n)\s*-?\s*(?:타겟\s*고객|타겟|대상)\s*[:：]\s*([^\n]+)/i);
    if (byLine?.[1]) return byLine[1].trim();

    const bySentence = text.match(/타겟은\s*(.+?)\s*(?:이며|이고|입니다|[.,\n])/);
    if (bySentence?.[1]) return bySentence[1].trim();

    return '';
  };

  const getPromptIndustry = (item = {}) => {
    const raw = String(item.industry || '').trim();
    if (raw) return raw;
    return extractIndustryFromPrompt(item.prompt);
  };

  const getPromptPurpose = (item = {}) => {
    const raw = String(item.purpose || '').trim();
    if (raw) return raw;
    return extractPurposeFromPrompt(item.prompt);
  };

  const getPromptTarget = (item = {}) => {
    const raw = String(item.target || '').trim();
    if (raw) return raw;
    return extractTargetFromPrompt(item.prompt);
  };

  useEffect(() => {
    if (!selectedPrompt) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedPrompt(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedPrompt]);

  useEffect(() => {
    if (!email) return;

    const fetchSavedPrompts = async () => {
      try {
        setIsLoading(true);
        // GET 요청 시 email을 쿼리스트링으로 전달
        const response = await fetch(toApiUrl(`/list?email=${encodeURIComponent(email)}`), {
          headers: {
            'Authorization': `Bearer ${window.localStorage.getItem('token')}` // 필요한 경우 토큰 추가
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          setSavedPrompts(result.data);
        } else {
          showToast(result.error || '목록을 불러오지 못했습니다.', { type: 'error' });
        }
      } catch (error) {
        console.error('프롬프트 목록 조회 에러:', error);
        showToast('서버 통신 중 오류가 발생했습니다.', { type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedPrompts();
  }, [email]);

  const hasPrompts = savedPrompts.length > 0;
  const visiblePrompts = useMemo(() => savedPrompts.slice(0, 20), [savedPrompts]);

  const handleCopyPrompt = async (item) => {
    const promptText = String(item?.prompt || '').trim();
    if (!promptText) return;

    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(''), 1500);
      showToast('프롬프트를 복사했습니다.', { type: 'success' });
    } catch {
      showToast('프롬프트 복사에 실패했습니다.', { type: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId || !email) return;

    const id = deleteTargetId;
    setDeleteTargetId(null); // 모달 먼저 닫기

    try {
      const response = await fetch(toApiUrl(`/${id}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email }) 
      });

      const result = await response.json();

      if (result.success) {
        setSavedPrompts((prev) => prev.filter((item) => item.id !== id));
        showToast('저장한 프롬프트를 삭제했습니다.', { type: 'info' });
      } else {
        showToast(result.error || '삭제에 실패했습니다.', { type: 'error' });
      }
    } catch (error) {
      console.error('프롬프트 삭제 에러:', error);
      showToast('삭제 중 서버 오류가 발생했습니다.', { type: 'error' });
    }
  };

  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-end justify-between gap-3 mb-4 sm:mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">저장한 프롬프트</h2>
          <p className="text-sm text-gray-500 mt-1">
            콘텐츠 생성 페이지에서 저장한 프롬프트입니다.
          </p>
        </div>
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 whitespace-nowrap">
          {savedPrompts.length}개 저장
        </span>
      </div>

      {isLoading ? (
        // 로딩 UI 처리
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-12 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
          <p className="text-sm font-semibold text-gray-700">프롬프트를 불러오는 중입니다...</p>
        </div>
      ) : !hasPrompts ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-gray-700">저장된 프롬프트가 없습니다.</p>
          <p className="text-xs text-gray-500 mt-1">
            콘텐츠 생성 결과에서 저장 버튼을 눌러 마이페이지에 보관해 보세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visiblePrompts.map((item) => (
            <article
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPrompt(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedPrompt(item);
                }
              }}
              className="group cursor-pointer transition-all duration-300 border border-gray-100 bg-white rounded-xl p-4 hover:border-blue-200 hover:shadow-md"
            >
              {(() => {
                const promptType = getPromptType(item);
                const promptIndustry = getPromptIndustry(item);
                return (
                  <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-gray-900 truncate transition-colors group-hover:text-blue-600">
                    {getPromptKeyword(item)}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCopyPrompt(item);
                    }}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                    title="복사"
                  >
                    {copiedId === item.id ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeleteTargetId(item.id);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                {promptType && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-gray-200 text-gray-600">
                    {promptType}
                  </span>
                )}
                {promptIndustry && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-gray-200 text-gray-600">
                    {promptIndustry}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center text-xs text-gray-400 pt-3 border-t border-gray-50 mt-3">
                <span>{formatSavedAt(item.savedAt)} 저장됨</span>
                <span className="font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  프롬프트 보기
                </span>
              </div>
                  </>
                );
              })()}
            </article>
          ))}
        </div>
      )}

      {selectedPrompt && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
          <button
            type="button"
            onClick={() => setSelectedPrompt(null)}
            className="absolute inset-0"
            aria-label="프롬프트 상세 닫기"
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] p-5 sm:p-6 flex flex-col">
            {(() => {
              const promptType = getPromptType(selectedPrompt);
              const promptIndustry = getPromptIndustry(selectedPrompt);
              const promptPurpose = getPromptPurpose(selectedPrompt);
              const promptTarget = getPromptTarget(selectedPrompt);
              return (
                <>
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 break-words">
                  {getPromptKeyword(selectedPrompt)}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{formatSavedAt(selectedPrompt.savedAt)}</p>
                {(promptType || promptIndustry) && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {promptType && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-gray-200 text-gray-600">
                        {promptType}
                      </span>
                    )}
                    {promptIndustry && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-gray-200 text-gray-600">
                        {promptIndustry}
                      </span>
                    )}
                  </div>
                )}
                {(promptPurpose || promptTarget) && (
                  <div className="mt-2 space-y-1">
                    {promptPurpose && (
                      <p className="text-xs text-gray-600">
                        목적: {promptPurpose}
                      </p>
                    )}
                    {promptTarget && (
                      <p className="text-xs text-gray-600">
                        타겟: {promptTarget}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyPrompt(selectedPrompt)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  {copiedId === selectedPrompt.id ? (
                    <>
                      <Check size={14} className="text-green-600" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      전체 복사
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPrompt(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
              <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                {String(selectedPrompt.prompt || '').trim() || '프롬프트 내용이 없습니다.'}
              </p>
            </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 sm:p-6 animate-fade-in-up">
            <div className="flex items-start gap-3 mb-5">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-full shrink-0">
                <AlertCircle size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">프롬프트 삭제</h3>
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                  이 프롬프트를 정말 삭제하시겠습니까?<br/>
                  삭제한 데이터는 다시 복구할 수 없습니다.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-6">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm shadow-red-200"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedPromptsSection;
