import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Trash2 } from 'lucide-react';
import { showToast } from '../../utils/toast';
import {
  getAccountSavedPrompts,
  removeAccountSavedPrompt,
} from '../../utils/promptStorage';

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

  useEffect(() => {
    setSavedPrompts(getAccountSavedPrompts(email));
  }, [email]);

  const hasPrompts = savedPrompts.length > 0;

  const visiblePrompts = useMemo(
    () => savedPrompts.slice(0, 20),
    [savedPrompts],
  );

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

  const handleDeletePrompt = (id) => {
    if (!id) return;
    removeAccountSavedPrompt(email, id);
    setSavedPrompts((prev) => prev.filter((item) => item.id !== id));
    showToast('저장한 프롬프트를 삭제했습니다.', { type: 'info' });
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

      {!hasPrompts ? (
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
                    {item.keyword ? `${item.keyword} 프롬프트` : '저장된 프롬프트'}
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
                    onClick={() => handleDeletePrompt(item.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                {item.templateName && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-gray-200 text-gray-600">
                    {item.templateName}
                  </span>
                )}
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
    </div>
  );
};

export default SavedPromptsSection;
