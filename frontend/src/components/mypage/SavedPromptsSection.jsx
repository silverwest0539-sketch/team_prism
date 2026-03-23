import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Trash2, Loader2, AlertCircle, Search, X } from 'lucide-react';
import { BookmarkSimple, SortAscending } from '@phosphor-icons/react';
import { showToast } from '../../utils/toast';
import { toApiUrl } from '../../utils/apiClient';
import { createHttpError, safeParseJson, toFriendlyFetchErrorMessage } from '../../utils/fetchError';
import PaginationBar from '../common/PaginationBar';

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

const SORT_OPTIONS = [
  { label: '최신순', value: 'newest' },
  { label: '오래된순', value: 'oldest' },
  { label: '키워드순', value: 'name_asc' },
  { label: '키워드 역순', value: 'name_desc' },
];
const LAPTOP_BREAKPOINT = 1024;
const ITEMS_PER_PAGE_MOBILE = 3;
const ITEMS_PER_PAGE_LAPTOP = 9;
const resolveItemsPerPage = () => {
  if (typeof window === 'undefined') return ITEMS_PER_PAGE_MOBILE;
  return window.innerWidth >= LAPTOP_BREAKPOINT ? ITEMS_PER_PAGE_LAPTOP : ITEMS_PER_PAGE_MOBILE;
};

const normalizeText = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();

const cleanTargetValue = (value = '') => {
  const normalized = normalizeText(value);
  if (!normalized) return '';
  if (/^(일반\s*대중|없음|없습니다)$/i.test(normalized)) return '';
  return normalized;
};

const cleanAdditionalValue = (value = '') => {
  const normalized = normalizeText(value);
  if (!normalized) return '';
  const withoutTemplateSuffix = normalized
    .replace(/\s*[—-]\s*이\s*요구사항은[\s\S]*$/i, '')
    .replace(/\s*이\s*요구사항은[\s\S]*$/i, '')
    .trim();
  if (!withoutTemplateSuffix) return '';
  if (/^(없음|없습니다)$/i.test(withoutTemplateSuffix)) return '';
  return withoutTemplateSuffix;
};

const SavedPromptsSection = ({ email = '' }) => {
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [copiedId, setCopiedId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => resolveItemsPerPage());
  const [sortBy, setSortBy] = useState('newest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedPromptIds, setSelectedPromptIds] = useState(new Set());
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const getPromptKeyword = (item = {}) => {
    const keyword = String(item.keyword || '').trim();
    if (keyword) return keyword;

    const match = String(item.prompt || '').match(/^\[키워드:([^\]]+)\]/);
    return match?.[1]?.trim() || '키워드 없음';
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

  const extractAdditionalRequestsFromPrompt = (prompt = '') => {
    const text = String(prompt || '').trim();
    if (!text) return '';

    const byLine = text.match(/(?:^|\n)\s*-?\s*(?:추가\s*요구사항|기타\s*요구사항)\s*[:：]\s*([^\n]+)/i);
    if (byLine?.[1]) return byLine[1].trim();

    const bySentence = text.match(/추가\s*요구사항(?:은|:)?\s*(.+?)(?:\n|$)/i);
    if (bySentence?.[1]) return bySentence[1].trim();

    return '';
  };

  const extractEssentialDetailsFromPrompt = (prompt = '') => {
    const text = String(prompt || '').trim();
    if (!text) return '';

    const byLine = text.match(/(?:^|\n)\s*-?\s*(?:꼭\s*포함할\s*정보|필수\s*포함\s*정보|필수\s*정보)\s*[:：]\s*([^\n]+)/i);
    if (byLine?.[1]) return byLine[1].trim();

    const bySentence = text.match(/꼭\s*포함할\s*정보(?:는|:)?\s*(.+?)(?:\n|$)/i);
    if (bySentence?.[1]) return bySentence[1].trim();

    return '';
  };

  const extractOtherRequestsFromPrompt = (prompt = '') => {
    const text = String(prompt || '').trim();
    if (!text) return '';

    const byLine = text.match(/(?:^|\n)\s*-?\s*기타\s*요구사항\s*[:：]\s*([^\n]+)/i);
    if (byLine?.[1]) return byLine[1].trim();

    const bySentence = text.match(/기타\s*요구사항(?:은|:)?\s*(.+?)(?:\n|$)/i);
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
    if (raw) return cleanTargetValue(raw);
    return cleanTargetValue(extractTargetFromPrompt(item.prompt));
  };

  const getPromptAdditionalRequests = (item = {}) => {
    const raw = String(item.otherRequests || item.additionalRequests || '').trim();
    if (raw) return cleanAdditionalValue(raw);
    return cleanAdditionalValue(extractAdditionalRequestsFromPrompt(item.prompt));
  };

  const getPromptEssentialDetails = (item = {}) => {
    const raw = String(item.essentialDetails || '').trim();
    if (raw) return cleanAdditionalValue(raw);
    return cleanAdditionalValue(extractEssentialDetailsFromPrompt(item.prompt));
  };

  const getPromptOtherRequests = (item = {}) => {
    const raw = String(item.otherRequestDetails || '').trim();
    if (raw) return cleanAdditionalValue(raw);
    return cleanAdditionalValue(extractOtherRequestsFromPrompt(item.prompt));
  };

  useEffect(() => {
    if (!selectedPrompt) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedPrompt(null);
        setShowOptionalFields(false);
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
            'Authorization': `Bearer ${window.sessionStorage.getItem('token')}` // 필요한 경우 토큰 추가
          }
        });

        const result = await safeParseJson(response);

        if (!response.ok) {
          throw createHttpError({ status: response.status, data: result });
        }

        if (result.success) {
          setSavedPrompts(result.data);
        } else {
          showToast(result.error || '목록을 불러오지 못했습니다.', { type: 'error' });
        }
      } catch (error) {
        console.error('프롬프트 목록 조회 에러:', error);
        showToast(toFriendlyFetchErrorMessage(error), { type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedPrompts();
  }, [email]);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(resolveItemsPerPage());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hasPrompts = savedPrompts.length > 0;
  const processedPrompts = useMemo(() => {
    let result = [...savedPrompts];

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((item) =>
        String(item.keyword || '').trim().toLowerCase().includes(query)
      );
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.savedAt || 0) - new Date(b.savedAt || 0));
    } else if (sortBy === 'name_asc') {
      result.sort((a, b) => getPromptKeyword(a).localeCompare(getPromptKeyword(b), 'ko'));
    } else if (sortBy === 'name_desc') {
      result.sort((a, b) => getPromptKeyword(b).localeCompare(getPromptKeyword(a), 'ko'));
    }

    return result;
  }, [savedPrompts, searchQuery, sortBy]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(processedPrompts.length / itemsPerPage)),
    [processedPrompts.length, itemsPerPage]
  );

  const pageStartIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPrompts = useMemo(
    () => processedPrompts.slice(pageStartIndex, pageStartIndex + itemsPerPage),
    [processedPrompts, pageStartIndex, itemsPerPage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const isAllVisibleSelected = processedPrompts.length > 0 && selectedPromptIds.size === processedPrompts.length;

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

  const deletePromptById = async (id) => {
    const response = await fetch(toApiUrl(`/${id}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.sessionStorage.getItem('token')}`
      },
      body: JSON.stringify({ email }),
    });

    const result = await safeParseJson(response);
    if (!response.ok) {
      throw createHttpError({ status: response.status, data: result });
    }
    if (!result.success) {
      throw new Error(result.error || '삭제에 실패했습니다.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId || !email) return;

    const id = deleteTargetId;
    setDeleteTargetId(null); // 모달 먼저 닫기

    try {
      await deletePromptById(id);
      setSavedPrompts((prev) => prev.filter((item) => item.id !== id));
      setSelectedPromptIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showToast('저장한 프롬프트를 삭제했습니다.', { type: 'info' });
    } catch (error) {
      console.error('프롬프트 삭제 에러:', error);
      showToast(toFriendlyFetchErrorMessage(error), { type: 'error' });
    }
  };

  const handleCardClick = (item) => {
    if (isDeleteMode) {
      setSelectedPromptIds((prev) => {
        const next = new Set(prev);
        if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
      return;
    }
    setShowOptionalFields(false);
    setSelectedPrompt(item);
  };

  const closePromptModal = () => {
    setSelectedPrompt(null);
    setShowOptionalFields(false);
  };

  const toggleSelectAll = () => {
    if (isAllVisibleSelected) {
      setSelectedPromptIds(new Set());
      return;
    }
    setSelectedPromptIds(new Set(processedPrompts.map((item) => item.id)));
  };

  const enterDeleteMode = () => {
    setIsDeleteMode(true);
    setSelectedPromptIds(new Set());
  };

  const exitDeleteMode = () => {
    setIsDeleteMode(false);
    setSelectedPromptIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedPromptIds.size === 0 || !email) return;

    const idsToDelete = Array.from(selectedPromptIds);
    if (!window.confirm(`선택된 ${idsToDelete.length}개의 프롬프트를 삭제하시겠습니까?`)) return;

    const results = await Promise.allSettled(idsToDelete.map((id) => deletePromptById(id)));
    const successIds = idsToDelete.filter((id, index) => results[index].status === 'fulfilled');
    const failedCount = idsToDelete.length - successIds.length;

    if (successIds.length > 0) {
      const successIdSet = new Set(successIds);
      setSavedPrompts((prev) => prev.filter((item) => !successIdSet.has(item.id)));
      showToast(`${successIds.length}개의 프롬프트를 삭제했습니다.`, { type: 'info' });
    }

    if (failedCount > 0) {
      showToast(`${failedCount}개의 프롬프트 삭제에 실패했습니다.`, { type: 'error' });
    }

    setSelectedPromptIds(new Set());
    setIsDeleteMode(false);
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  return (
    <div className="p-5 sm:p-6 h-full flex flex-col" onClick={() => isSortOpen && setIsSortOpen(false)}>
      <div className="mb-5 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 xl:pt-7 xl:min-h-[120px]">
          <div>
            <h1 className="mypage-saved-title text-xl sm:text-2xl font-bold flex items-center gap-2">
              <BookmarkSimple className="mypage-saved-title-icon text-blue-600" size={32} weight="fill" />
              저장한 프롬프트
            </h1>
            <p className="mypage-saved-subtitle text-gray-500 text-sm mt-1">
              카드를 클릭하면 전체 프롬프트 내용을 볼 수 있습니다.
            </p>
          </div>
          <span className="mypage-saved-count-badge text-xs font-semibold text-indigo-600 bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-100 whitespace-nowrap self-start">
            {savedPrompts.length}개 프롬프트 저장됨
          </span>
        </div>
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
        <>
          <div className="relative mb-4">
            <Search size={16} className="mypage-saved-search-icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="키워드 검색..."
              className="mypage-saved-search-input w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mypage-saved-search-clear absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="검색어 지우기"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="mypage-saved-toolbar-btn flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border bg-white text-gray-500 border-gray-200 hover:border-gray-400 transition-all"
                >
                  <SortAscending size={12} />
                  {SORT_OPTIONS.find((option) => option.value === sortBy)?.label}
                </button>
                {isSortOpen && (
                  <div className="mypage-saved-dropdown absolute top-full left-0 mt-1 w-28 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden py-1 z-10">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSortBy(option.value);
                          setIsSortOpen(false);
                        }}
                        className={`mypage-saved-dropdown-item w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${sortBy === option.value ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-gray-600'
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-auto">
              {isDeleteMode && (
                <>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="mypage-saved-toolbar-btn px-2 py-1.5 rounded-lg text-xs font-bold text-gray-500 border border-gray-200 hover:border-gray-400 transition-all"
                  >
                    {isAllVisibleSelected ? '전체 해제' : '전체 선택'}
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    disabled={selectedPromptIds.size === 0}
                    className={`mypage-saved-toolbar-btn mypage-saved-toolbar-btn-danger px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPromptIds.size > 0
                      ? 'bg-red-500 text-white hover:bg-red-600 shadow-sm'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    삭제 ({selectedPromptIds.size})
                  </button>
                </>
              )}
              {!isDeleteMode ? (
                <button
                  type="button"
                  onClick={enterDeleteMode}
                  className="mypage-saved-toolbar-btn mypage-saved-toolbar-btn-danger px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-white text-gray-500 border-gray-200 hover:border-red-300 hover:text-red-500"
                >
                  선택 삭제
                </button>
              ) : (
                <button
                  type="button"
                  onClick={exitDeleteMode}
                  className="mypage-saved-toolbar-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                >
                  취소
                </button>
              )}
            </div>
          </div>

          {processedPrompts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-gray-700">'{searchQuery}' 검색 결과가 없습니다.</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs font-bold text-blue-600 hover:underline"
              >
                전체 보기
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 content-start">
                {paginatedPrompts.map((item) => {
                  const promptType = getPromptType(item);
                  const promptIndustry = getPromptIndustry(item);
                  const isSelected = selectedPromptIds.has(item.id);
                  const hasDualMetaBadges = Boolean(promptType && promptIndustry);
                  const metaBadgeWidthClass = hasDualMetaBadges ? 'max-w-[48%]' : 'max-w-full';
                  const metaBadgeTextLength = String(promptType || '').length + String(promptIndustry || '').length;
                  const isTightMetaRow = hasDualMetaBadges && metaBadgeTextLength >= 11;
                  const metaBadgePaddingClass = isTightMetaRow ? 'px-0 py-0' : 'px-1.5 py-0.5';

                  return (
                    <article
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleCardClick(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleCardClick(item);
                        }
                      }}
                      className={`mypage-saved-card group cursor-pointer transition-all duration-300 border bg-white rounded-xl p-3 sm:p-4 lg:p-5 min-h-[132px] sm:min-h-[148px] lg:min-h-[160px] h-full flex flex-col hover:shadow-md relative ${isSelected
                        ? 'delete-selection-card border-red-400 bg-red-50/20'
                        : 'border-gray-100 hover:border-blue-200'
                        }`}
                    >
                      {isDeleteMode && (
                        <div className="absolute top-4 left-4">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-red-500 border-red-500' : 'border-gray-300 bg-white'
                            }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <div className={`min-w-0 ${isDeleteMode ? 'ml-7' : ''}`}>
                          <h3 className="mypage-saved-card-title text-base font-bold text-gray-900 transition-colors group-hover:text-blue-600 whitespace-normal break-all leading-snug">
                            {getPromptKeyword(item)}
                          </h3>
                        </div>

                        {!isDeleteMode && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleCopyPrompt(item);
                              }}
                              className="mypage-saved-card-icon-btn p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
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
                              className="mypage-saved-card-icon-btn p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="삭제"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className={`mt-2.5 flex w-full min-w-0 items-center justify-start gap-1.5 ${isDeleteMode ? 'ml-7' : ''}`}>
                        {promptType && (
                           <span className={`mypage-saved-meta-chip inline-flex min-w-0 w-auto items-center justify-center ${metaBadgePaddingClass} rounded text-[10px] leading-tight font-semibold text-center bg-white border border-gray-200 text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap ${metaBadgeWidthClass}`}>
                             {promptType}
                           </span>
                         )}
                         {promptIndustry && (
                           <span className={`mypage-saved-meta-chip inline-flex min-w-0 w-auto items-center justify-center ${metaBadgePaddingClass} rounded text-[10px] leading-tight font-semibold text-center bg-white border border-gray-200 text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap ${metaBadgeWidthClass}`}>
                             {promptIndustry}
                           </span>
                         )}
                      </div>

                      {/* 변경된 코드 */}
                      <div className={`mypage-saved-card-meta flex justify-between items-center text-xs text-gray-400 pt-3 border-t border-gray-50 mt-auto ${isDeleteMode ? 'ml-7' : ''}`}>
                        {/* 왼쪽: 날짜 영역 */}
                        <span>{formatSavedAt(item.savedAt)} 저장됨</span>

                        {/* 오른쪽: 프롬프트 전체보기 영역 (삭제 모드가 아닐 때만 보임) */}
                        {!isDeleteMode && (
                          <span className="mypage-saved-card-link text-[12px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            프롬프트 전체보기
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                pageStartIndex={pageStartIndex}
                itemsPerPage={itemsPerPage}
                totalItems={processedPrompts.length}
                onPageChange={goToPage}
                className="mt-auto pt-6"
              />
            </div>
          )}
        </>
      )}

      {selectedPrompt && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
          <button
            type="button"
            onClick={closePromptModal}
            className="absolute inset-0"
            aria-label="프롬프트 상세 닫기"
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] p-5 sm:p-6 flex flex-col">
            {(() => {
              const promptType = getPromptType(selectedPrompt);
              const promptIndustry = getPromptIndustry(selectedPrompt);
              const promptPurpose = getPromptPurpose(selectedPrompt);
              const promptTarget = getPromptTarget(selectedPrompt);
              const promptEssentialDetails = getPromptEssentialDetails(selectedPrompt);
              const promptOtherRequests = getPromptOtherRequests(selectedPrompt);
              const promptAdditionalRequests = getPromptAdditionalRequests(selectedPrompt);
              const additionalParts = String(promptAdditionalRequests || '')
                .split(/\s*\/\s*/)
                .map((part) => part.trim())
                .filter(Boolean);
              const fallbackEssentialDetails =
                !promptEssentialDetails && additionalParts.length >= 2 ? additionalParts[0] : '';
              const fallbackOtherRequests =
                !promptOtherRequests && additionalParts.length >= 2 ? additionalParts.slice(1).join(' / ') : '';
              const fallbackAdditionalRequests =
                !promptEssentialDetails && !promptOtherRequests && additionalParts.length === 1 ? additionalParts[0] : '';
              const detailedFields = [
                { label: '상세 타겟 설정', value: promptTarget },
                { label: '꼭 포함할 정보', value: promptEssentialDetails || fallbackEssentialDetails },
                { label: '기타 요구사항', value: promptOtherRequests || fallbackOtherRequests },
                { label: '추가 요구사항', value: fallbackAdditionalRequests },
              ].filter((field) => String(field.value || '').trim());
              const hasOptionalContent = detailedFields.length > 0;
              return (
                <>
                  <div className="pb-3 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-3">
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
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyPrompt(selectedPrompt)}
                          className="inline-flex items-center justify-center gap-1 min-w-[90px] px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
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
                          onClick={closePromptModal}
                          className="inline-flex items-center justify-center gap-1 min-w-[90px] px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <X size={14} />
                          닫기
                        </button>
                      </div>
                    </div>

                    {promptPurpose && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600">
                          목적: {promptPurpose}
                        </p>
                      </div>
                    )}

                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => setShowOptionalFields((prev) => !prev)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${showOptionalFields
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                          }`}
                      >
                        {showOptionalFields ? '선택항목 숨기기' : '선택항목 표기'}
                      </button>
                      {showOptionalFields && (
                        <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3 max-h-40 overflow-y-auto scrollbar-hide">
                          {hasOptionalContent ? (
                            <div className="space-y-2">
                              {detailedFields.map((field) => (
                                <div key={field.label}>
                                  <p className="text-[11px] font-semibold text-gray-500">{field.label}</p>
                                  <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                                    {field.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">
                              입력된 선택항목이 없습니다.
                            </p>
                          )}
                        </div>
                      )}
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
                  이 프롬프트를 정말 삭제하시겠습니까?<br />
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
