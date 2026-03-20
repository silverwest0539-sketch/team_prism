// 즐겨찾기 페이지 (검색, 정렬, 다중삭제, 뷰전환, 드래그, 뱃지, 내보내기, 애니메이션)
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trash, BookmarkSimple,
    Tag, X,
    DotsSixVertical, Fire, Sparkle,
    MagnifyingGlass, SortAscending, SquaresFour, List,
    Export, Checks
} from '@phosphor-icons/react';
import SummaryModal from '../home/SummaryModal';
import apiClient from '../../utils/apiClient';
import { getStoredUserEmail } from '../../utils/authStorage';
import { showToast } from '../../utils/toast';
import PaginationBar from '../common/PaginationBar';


// ─── 날짜 계산 헬퍼 함수 (수정사항 3번 해결) ───
const getRelativeDate = (dateString) => {
    if (!dateString) return '날짜 정보 없음';

    const savedDate = new Date(dateString);
    const now = new Date();

    // 시간을 제거하고 날짜(Year, Month, Day)만 비교하여 당일 여부 판단
    const d1 = new Date(savedDate.getFullYear(), savedDate.getMonth(), savedDate.getDate());
    const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = d2 - d1;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    // 필요하다면 '1일 전'을 '어제'로 변경 가능
    return `${diffDays}일 전`;
};

// ─── 정렬 옵션 ───
const SORT_OPTIONS = [
    { label: '최신순', value: 'newest' },
    { label: '오래된순', value: 'oldest' },
    { label: '이름순', value: 'name_asc' },
    { label: '이름 역순', value: 'name_desc' },
];
const LAPTOP_BREAKPOINT = 1024;
const ITEMS_PER_PAGE_MOBILE = 3;
const ITEMS_PER_PAGE_LAPTOP = 9;
const getKeywordText = (item) => String(item?.keyword || '').trim();
const normalizeScrapItem = (item) => {
    if (!item || typeof item !== 'object') return null;
    return item;
};
const resolveItemsPerPage = () => {
    if (typeof window === 'undefined') return ITEMS_PER_PAGE_MOBILE;
    return window.innerWidth >= LAPTOP_BREAKPOINT ? ITEMS_PER_PAGE_LAPTOP : ITEMS_PER_PAGE_MOBILE;
};

const ScrapPage = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const [scraps, setScraps] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedKeyword, setSelectedKeyword] = useState(null);

    // 검색
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(() => resolveItemsPerPage());

    // 정렬
    const [sortBy, setSortBy] = useState('newest');
    const [isSortOpen, setIsSortOpen] = useState(false);

    // 뷰 모드 (grid / list) - (수정사항 2번: 기본형식 고정을 위해 grid 유지)
    const [viewMode] = useState('grid');

    // 다중 선택 삭제
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [deleteSelection, setDeleteSelection] = useState(new Set());

    // 드래그 앤 드롭
    const [dragIndex, setDragIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    // 퇴장 애니메이션
    const [removingKeywords, setRemovingKeywords] = useState(new Set());

    // 정리 완료 메시지
    const [showClearMsg, setShowClearMsg] = useState(false);
    const prevCountRef = useRef(0);

    // ─── 데이터 로드 ───
    const fetchScraps = useCallback(async () => {
        const userEmail = getStoredUserEmail();
        if (!userEmail) return;

        try {
            const response = await apiClient.get('/scraps', {
                params: { email: userEmail }
            });
            if (response.data && response.data.success) {
                const rawScraps = Array.isArray(response.data.scraps) ? response.data.scraps : [];
                const normalizedScraps = rawScraps.map(normalizeScrapItem).filter(Boolean);
                setScraps(normalizedScraps);
            } else {
                setScraps([]);
            }
        } catch (error) {
            console.error("스크랩 데이터를 불러오는데 실패했습니다.", error);
            setScraps([]); // 실패 시 빈 배열 처리 (DB 에러 확인 용이)
        }
    }, []);

    useEffect(() => {
        fetchScraps();
    }, [fetchScraps]);

    useEffect(() => {
        const handleResize = () => {
            setItemsPerPage(resolveItemsPerPage());
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Empty State 도달 감지
    useEffect(() => {
        if (prevCountRef.current > 0 && scraps.length === 0) {
            setShowClearMsg(true);
            setTimeout(() => setShowClearMsg(false), 3000);
        }
        prevCountRef.current = scraps.length;
    }, [scraps.length]);

    // ─── 필터 + 검색 + 정렬 파이프라인 ───
    const processedScraps = useMemo(() => {
        let result = scraps.filter((item) => item && typeof item === 'object');

        // 1. 검색
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            result = result.filter(item =>
                getKeywordText(item).toLowerCase().includes(q) ||
                String(item?.desc || '').toLowerCase().includes(q)
            );
        }

        // 2. 정렬
        if (sortBy === 'newest') {
            result.sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
        } else if (sortBy === 'oldest') {
            result.sort((a, b) => new Date(a.savedAt || 0) - new Date(b.savedAt || 0));
        } else if (sortBy === 'name_asc') {
            result.sort((a, b) => getKeywordText(a).localeCompare(getKeywordText(b), 'ko'));
        } else if (sortBy === 'name_desc') {
            result.sort((a, b) => getKeywordText(b).localeCompare(getKeywordText(a), 'ko'));
        }

        return result;
    }, [scraps, searchQuery, sortBy]);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(processedScraps.length / itemsPerPage)),
        [processedScraps.length, itemsPerPage]
    );

    const pageStartIndex = (currentPage - 1) * itemsPerPage;
    const paginatedScraps = useMemo(
        () => processedScraps.slice(pageStartIndex, pageStartIndex + itemsPerPage),
        [processedScraps, pageStartIndex, itemsPerPage]
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortBy]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // ─── 핸들러 ───

    const refreshScraps = () => {
        fetchScraps();
    };

    const deleteScrapItem = useCallback((email, keyword) => (
        apiClient.delete('/scraps', {
            params: {
                email,
                keyword,
            }
        })
    ), []);

    // 단일 삭제 (애니메이션 포함)
    const handleDelete = async (e, item) => {
        e.stopPropagation();
        const userEmail = getStoredUserEmail();
        if (!userEmail) return;
        const keyword = getKeywordText(item);
        if (!keyword) {
            showToast('삭제할 키워드 정보가 없습니다.', { type: 'error' });
            return;
        }

        if (window.confirm(`'${keyword}' 스크랩을 삭제하시겠습니까?`)) {
            setRemovingKeywords(new Set([keyword]));
            try {
                await deleteScrapItem(userEmail, keyword);
                setTimeout(() => {
                    refreshScraps();
                    setRemovingKeywords(new Set());
                }, 300);
            } catch {
                showToast('삭제에 실패했습니다.', { type: 'error' });
                setRemovingKeywords(new Set());
            }
        }
    };

    // 다중 삭제
    const handleBulkDelete = async () => {
        if (deleteSelection.size === 0) return;
        const userEmail = getStoredUserEmail();
        if (!userEmail) return;

        const count = deleteSelection.size;
        if (window.confirm(`선택된 ${count}개의 스크랩을 삭제하시겠습니까?`)) {
            setRemovingKeywords(new Set(deleteSelection));
            try {
                // 선택된 키워드들을 서버에서 일괄 삭제 시도
                const keywordsToDelete = Array.from(deleteSelection);
                const results = await Promise.allSettled(
                    keywordsToDelete.map((keyword) => deleteScrapItem(userEmail, keyword))
                );
                
                if (results.some((result) => result.status === 'rejected')) {
                    throw new Error('SERVER_BULK_DELETE_FAILED');
                }

                setTimeout(() => {
                    refreshScraps();
                    setRemovingKeywords(new Set());
                    setDeleteSelection(new Set());
                    setIsDeleteMode(false);
                }, 300);
            } catch {
                showToast('일부 항목 삭제에 실패했습니다.', { type: 'error' });
                setRemovingKeywords(new Set());
            }
        }
    };

    // 다중 삭제 전체 선택/해제
    const toggleSelectAll = () => {
        if (deleteSelection.size === processedScraps.length) {
            setDeleteSelection(new Set());
        } else {
            setDeleteSelection(new Set(processedScraps.map((s) => getKeywordText(s)).filter(Boolean)));
        }
    };

    // 다중 삭제 토글
    const toggleDeleteSelect = (keyword) => {
        setDeleteSelection(prev => {
            const next = new Set(prev);
            if (next.has(keyword)) next.delete(keyword);
            else next.add(keyword);
            return next;
        });
    };

    // 카드 클릭 → 모달 또는 선택
    const handleCardClick = (item) => {
        if (!item || typeof item !== 'object') return;
        if (isDeleteMode) {
            toggleDeleteSelect(getKeywordText(item));
            return;
        }
        const keyword = getKeywordText(item);
        setSelectedKeyword({
            keyword: keyword || '키워드 없음',
            rank: item.rank,
            type: item.type || 'trend',
            title: keyword || '키워드 없음',
            desc: item.desc || '요약 정보 없음',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedKeyword(null);
        refreshScraps();
    };

    const handleScrapChange = () => refreshScraps();

    // ─── 드래그 앤 드롭 ───
    const handleDragStart = (e, index) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDragOver = (e, index) => { e.preventDefault(); setDragOverIndex(index); };
    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === dropIndex) return;
        const reordered = [...scraps];
        const [moved] = reordered.splice(dragIndex, 1);
        reordered.splice(dropIndex, 0, moved);
        setScraps(reordered);
        setDragIndex(null);
        setDragOverIndex(null);
    };
    const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

    // ─── 모드 진입/해제 ───
    const enterDeleteMode = () => {
        setIsDeleteMode(true);
        setDeleteSelection(new Set());
    };
    const exitAllModes = () => {
        setIsDeleteMode(false);
        setDeleteSelection(new Set());
    };

    // ─── 카드 체크 상태 ───
    const getCheckState = (keyword) => {
        if (isDeleteMode) return deleteSelection.has(keyword);
        return false;
    };

    // ─────────────────── 렌더링 ───────────────────

    // 카드 컨텐츠 (그리드/리스트 공용 추출)
    const renderCardContent = (item, index) => {
        const keyword = getKeywordText(item);
        const isRemoving = removingKeywords.has(keyword);
        const isSelected = getCheckState(keyword);
        const isDragOver = dragOverIndex === index;
        const savedAtText = item?.savedAt ? getRelativeDate(item.savedAt) : '날짜 정보 없음';

        return (
            <div
                key={`${keyword || 'scrap'}-${index}`}
                draggable={!isDeleteMode && sortBy === 'custom'}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => handleCardClick(item)}
                className={`mypage-saved-card group cursor-pointer transition-all duration-300 border relative
                    ${viewMode === 'grid'
                        ? 'bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 lg:p-5 min-h-[132px] sm:min-h-[148px] lg:min-h-[160px] h-full'
                        : 'bg-white rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4 p-4'}
                    ${isRemoving ? 'opacity-0 scale-95 -translate-y-2' : 'opacity-100 scale-100'}
                    ${isSelected
                        ? 'delete-selection-card border-red-400 bg-red-50/20'
                        : 'border-gray-100 hover:border-blue-200'
                    }
                    ${isDragOver ? 'border-indigo-400 border-dashed bg-indigo-50/20' : ''}
                    hover:shadow-md
                `}
            >
                {/* 드래그 핸들 (커스텀 정렬 + 모드 비활성 시만) */}
                {!isDeleteMode && sortBy === 'custom' && (
                    <div className={`mypage-saved-card-handle absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500`}>
                        <DotsSixVertical size={16} weight="bold" />
                    </div>
                )}

                {/* 체크박스 (삭제 모드) */}
                {isDeleteMode && (
                    <div className={`absolute top-3 left-3 ${viewMode === 'list' ? 'relative top-0 left-0 flex-shrink-0 mt-1' : ''}`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            isSelected
                                ? 'bg-red-500 border-red-500'
                                : 'border-gray-300 bg-white'
                        }`}>
                            {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    </div>
                )}

                {/* 메인 컨텐츠 */}
                <div className={`flex-1 flex flex-col h-full ${viewMode === 'list' ? 'min-w-0' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                        <div className={isDeleteMode && viewMode === 'grid' ? 'ml-7' : ''}>
                            <h3 className={`mypage-saved-card-title font-bold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors ${viewMode === 'list' ? 'text-base' : 'text-lg'}`}>
                                {keyword || '키워드 없음'}
                            </h3>
                            {/* ✂️ 원래 여기 있던 '분석 보기' span 코드를 지워줍니다. */}
                        </div>
                        {!isDeleteMode && viewMode === 'grid' && (
                            <button
                                onClick={(e) => handleDelete(e, item)}
                                className="mypage-saved-card-icon-btn p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                                title="삭제"
                            >
                                <Trash size={18} />
                            </button>
                        )}
                    </div>
                    
                    {/* 👇 여기 div에 flex justify-between items-center 를 추가했습니다! */}
                    <div className="mypage-saved-card-meta flex justify-between items-center text-xs text-gray-400 pt-3 border-t border-gray-50 mt-auto">
                        <span>{savedAtText} 저장됨</span>
                        
                        {!isDeleteMode && (
                            <span className="mypage-saved-card-link text-[12px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                분석 보기
                            </span>
                        )}
                    </div>
                </div>

                {/* 리스트 뷰: 우측 삭제 버튼 */}
                {!isDeleteMode && viewMode === 'list' && (
                    <button
                        onClick={(e) => handleDelete(e, item)}
                        className="mypage-saved-card-icon-btn p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition flex-shrink-0 self-center"
                        title="삭제"
                    >
                        <Trash size={18} />
                    </button>
                )}
            </div>
        );
    };

    const rootClassName = isEmbedded ? 'w-full p-5 sm:p-6 h-full flex flex-col' : 'page';

    return (
        <div className={rootClassName} onClick={() => isSortOpen && setIsSortOpen(false)}>
            {/* ─── 헤더 ─── */}
            <div className="mb-5 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 xl:pt-7 xl:min-h-[120px]">
                    <div>
                        <h1 className="mypage-saved-title text-xl sm:text-2xl font-bold flex items-center gap-2">
                            <BookmarkSimple className="mypage-saved-title-icon text-blue-600" size={32} weight="fill" />
                            저장한 키워드
                        </h1>
                        <p className="mypage-saved-subtitle text-gray-500 text-sm mt-1">
                            카드를 클릭하면 해당 키워드의 분석 요약 정보를 볼 수 있습니다.
                        </p>
                    </div>
                    <span className="mypage-saved-count-badge text-xs font-semibold text-indigo-600 bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-100 whitespace-nowrap self-start">
                        {scraps.length}개 키워드 저장됨
                    </span>
                </div>
            </div>

            {scraps.length > 0 && (
                <>
                    {/* ─── 검색 바 ─── */}
                    <div className="relative mb-4">
                        <MagnifyingGlass size={16} className="mypage-saved-search-icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="키워드 검색..."
                            className="mypage-saved-search-input w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all bg-white"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mypage-saved-search-clear absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} weight="bold" />
                            </button>
                        )}
                    </div>

                    {/* ─── 툴바: 정렬 + (뷰전환 삭제됨) + 모드 토글 ─── */}
                    <div className="flex items-center justify-between gap-2 mb-6">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            {/* 정렬 드롭다운 */}
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => setIsSortOpen(!isSortOpen)}
                                    className="mypage-saved-toolbar-btn flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-all bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                                >
                                    <SortAscending size={12} />
                                    {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                                </button>

                                {isSortOpen && (
                                    <div className="mypage-saved-dropdown absolute top-full left-0 mt-1 w-28 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden py-1 z-50">
                                        {SORT_OPTIONS.map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => { setSortBy(option.value); setIsSortOpen(false); }}
                                                className={`mypage-saved-dropdown-item w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                                                    sortBy === option.value ? 'text-gray-700 font-bold' : 'text-gray-600'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* (수정사항 2번: 뷰 토글 버튼 삭제됨) */}
                        </div>

                        {/* 모드 버튼들 */}
                        <div className="flex items-center gap-2 shrink-0 ml-auto">
                            {/* 다중 삭제 모드 액션 */}
                            {isDeleteMode && (
                                <>
                                    <button
                                        onClick={toggleSelectAll}
                                        className="mypage-saved-toolbar-btn flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-gray-500 border border-gray-200 hover:border-gray-400 transition-all"
                                    >
                                        <Checks size={14} />
                                        {deleteSelection.size === processedScraps.length ? '전체 해제' : '전체 선택'}
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        disabled={deleteSelection.size === 0}
                                        className={`mypage-saved-toolbar-btn mypage-saved-toolbar-btn-danger flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            deleteSelection.size > 0
                                                ? 'bg-red-500 text-white hover:bg-red-600 shadow-sm'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        <Trash size={14} />
                                        삭제 ({deleteSelection.size})
                                    </button>
                                </>
                            )}

                            {/* 모드 토글 버튼 */}
                            {!isDeleteMode ? (
                                <button
                                    onClick={enterDeleteMode}
                                    className="mypage-saved-toolbar-btn mypage-saved-toolbar-btn-danger px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-white text-gray-500 border-gray-200 hover:border-red-300 hover:text-red-500"
                                >
                                    선택 삭제
                                </button>
                            ) : (
                                <button
                                    onClick={exitAllModes}
                                    className="mypage-saved-toolbar-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                                >
                                    취소
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}

            <div className="flex-1 flex flex-col">
                {/* ─── 콘텐츠 영역 ─── */}
                {processedScraps.length === 0 && scraps.length > 0 ? (
                    // 검색/필터 결과 없음
                    <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
                        {searchQuery ? (
                            <>
                                <MagnifyingGlass size={36} className="mb-3 opacity-50" />
                                <p className="font-medium text-sm">'{searchQuery}' 검색 결과가 없습니다.</p>
                            </>
                        ) : (
                            <>
                                <Tag size={36} className="mb-3 opacity-50" />
                                <p className="font-medium text-sm">현재 조건에 맞는 키워드가 없습니다.</p>
                            </>
                        )}
                        <button
                            onClick={() => { setSearchQuery(''); }}
                            className="mt-3 text-blue-600 hover:underline text-xs font-bold"
                        >
                            전체 보기
                        </button>
                    </div>
                ) : scraps.length === 0 ? (
                    // Empty State
                    <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
                        {showClearMsg ? (
                            <>
                                <Sparkle size={48} className="mb-4 text-indigo-400 animate-bounce" weight="fill" />
                                <p className="font-bold text-indigo-600 text-lg">깔끔하게 정리 완료!</p>
                                <p className="text-sm text-gray-400 mt-1">새로운 트렌드를 발견하러 가볼까요?</p>
                            </>
                        ) : (
                            <>
                                <BookmarkSimple size={48} className="mb-4 opacity-50" />
                                <p className="font-medium">아직 스크랩한 키워드가 없습니다.</p>
                            </>
                        )}
                        <button
                            onClick={() => navigate('/home')}
                            className="mt-4 text-blue-600 hover:underline text-sm font-bold"
                        >
                            트렌드 둘러보러 가기
                        </button>
                    </div>
                ) : (
                    // 카드 그리드 (뷰 모드 선택 메뉴가 사라졌으므로 Grid 고정)
                    <div className={
                        viewMode === 'grid'
                            ? (isEmbedded
                                ? 'flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 content-start'
                                : 'flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 content-start')
                            : 'flex flex-col gap-3'
                    }>
                        {paginatedScraps.map((item, index) => renderCardContent(item, pageStartIndex + index))}
                    </div>
                )}

                {processedScraps.length > 0 && (
                    <PaginationBar
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageStartIndex={pageStartIndex}
                        itemsPerPage={itemsPerPage}
                        totalItems={processedScraps.length}
                        onPageChange={setCurrentPage}
                        className="mt-auto pt-6"
                    />
                )}
            </div>

            {/* 트렌드 요약 모달 */}
            <SummaryModal
                isOpen={isModalOpen}
                onClose={closeModal}
                data={selectedKeyword}
                onScrapChange={handleScrapChange}
            />
        </div>
    );
};

export default ScrapPage;
