import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { showToast } from '../../utils/toast';
import { toApiUrl } from '../../utils/apiClient';

const PREVIEW_LIMIT = 220;

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

const toPreview = (text = '') => {
  const normalized = String(text || '').trim();
  if (normalized.length <= PREVIEW_LIMIT) return normalized;
  return `${normalized.slice(0, PREVIEW_LIMIT)}...`;
};

const SavedPromptsSection = ({ email = '' }) => {
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [copiedId, setCopiedId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

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
        <div className="space-y-3">
          {visiblePrompts.map((item) => (
            <article key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">
                    {/* ✨ 키워드가 있으면 [키워드] 타입 프롬프트 형태로 보여주기 */}
                    {item.keyword 
                      ? `[${item.keyword}] ${item.type || ''} 프롬프트` 
                      : (item.type ? `${item.type} 생성 프롬프트` : '저장된 프롬프트')}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{formatSavedAt(item.savedAt)}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCopyPrompt(item)}
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
                    onClick={() => setDeleteTargetId(item.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                {item.type && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-gray-200 text-gray-600">
                    {item.type}
                  </span>
                )}
              </div>

              <p className="mt-2.5 text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                {toPreview(item.prompt)}
              </p>
            </article>
          ))}
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
