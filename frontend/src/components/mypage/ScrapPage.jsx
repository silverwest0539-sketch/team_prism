// 즐겨찾기 페이지 (검색, 정렬, 태그, 비교, 다중삭제, 뷰전환, 드래그, 뱃지, 내보내기, 메모, 애니메이션)
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trash, ArrowRight, BookmarkSimple,
    Tag, Plus, X, ChartLineUp,
    DotsSixVertical, NotePencil, Fire, Sparkle,
    MagnifyingGlass, SortAscending, SquaresFour, List,
    Export, CheckSquare, Checks
} from '@phosphor-icons/react';
import { getScraps, removeScrap, updateScrap, reorderScraps, getAllTags } from '../../utils/storage';
import { formatDate } from '../../utils/formatters';
import SummaryModal from '../home/SummaryModal';
import CompareModal from '../scrap/CompareModal';
import apiClient from '../../utils/apiClient';
import { getStoredUserEmail } from '../../utils/authStorage';
import { showToast } from '../../utils/toast';

// // ─── 태그 프리셋 색상 ───
// const TAG_COLORS = {
//     '마케팅': 'bg-purple-100 text-purple-700 border-purple-200',
//     '경쟁사': 'bg-red-100 text-red-700 border-red-200',
//     '트렌드': 'bg-blue-100 text-blue-700 border-blue-200',
//     '아이디어': 'bg-amber-100 text-amber-700 border-amber-200',
//     '리서치': 'bg-green-100 text-green-700 border-green-200',
// };
// const DEFAULT_TAG_COLOR = 'bg-gray-100 text-gray-600 border-gray-200';
// const getTagColor = (tag) => TAG_COLORS[tag] || DEFAULT_TAG_COLOR;

// ─── 변동 뱃지 (더미: 해시 기반 할당, 실제론 API 연동) ───
const BADGE_TYPES = [
    { label: '급상승', icon: Fire, color: 'bg-red-50 text-red-500 border-red-200' },
    { label: '신규', icon: Sparkle, color: 'bg-indigo-50 text-indigo-500 border-indigo-200' },
    null, null, null
];
const getBadge = (keyword) => {
    const hash = keyword.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return BADGE_TYPES[hash % BADGE_TYPES.length];
};

// ─── 정렬 옵션 ───
const SORT_OPTIONS = [
    { label: '커스텀', value: 'custom' },
    { label: '최신순', value: 'newest' },
    { label: '오래된순', value: 'oldest' },
    { label: '이름순', value: 'name_asc' },
    { label: '이름 역순', value: 'name_desc' },
];

const ScrapPage = () => {
    const navigate = useNavigate();
    const [scraps, setScraps] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedKeyword, setSelectedKeyword] = useState(null);

    // 검색
    const [searchQuery, setSearchQuery] = useState('');

    // 정렬
    const [sortBy, setSortBy] = useState('custom');
    const [isSortOpen, setIsSortOpen] = useState(false);

    // 뷰 모드 (grid / list)
    const [viewMode, setViewMode] = useState('grid');

    // // 태그 관련
    // const [activeTag, setActiveTag] = useState('전체');
    // const [tagInput, setTagInput] = useState('');
    // const [editingTagFor, setEditingTagFor] = useState(null);
    // const tagInputRef = useRef(null);

    // 비교 모드
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [compareSelection, setCompareSelection] = useState(new Set());
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

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
            if (response.data.success) {
                setScraps(response.data.scraps);
            }
        } catch (error) {
            console.error("스크랩 데이터를 불러오는데 실패했습니다.", error);
        }
    }, []);

    useEffect(() => {
        fetchScraps();
    }, [fetchScraps]);

    // Empty State 도달 감지
    useEffect(() => {
        if (prevCountRef.current > 0 && scraps.length === 0) {
            setShowClearMsg(true);
            setTimeout(() => setShowClearMsg(false), 3000);
        }
        prevCountRef.current = scraps.length;
    }, [scraps.length]);

    // 전체 태그 목록
    // const allTags = useMemo(() => ['전체', ...getAllTags()], [scraps]);

    // ─── 필터 + 검색 + 정렬 파이프라인 ───
    const processedScraps = useMemo(() => {
        let result = [...scraps];

        // 1. 검색
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            result = result.filter(item =>
                item.keyword.toLowerCase().includes(q) ||
                (item.desc || '').toLowerCase().includes(q)
            );
        }

        // 2. 정렬
        if (sortBy === 'newest') {
            result.sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
        } else if (sortBy === 'oldest') {
            result.sort((a, b) => new Date(a.savedAt || 0) - new Date(b.savedAt || 0));
        } else if (sortBy === 'name_asc') {
            result.sort((a, b) => a.keyword.localeCompare(b.keyword, 'ko'));
        } else if (sortBy === 'name_desc') {
            result.sort((a, b) => b.keyword.localeCompare(a.keyword, 'ko'));
        }

        return result;
    }, [scraps, searchQuery, sortBy]);

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
    const handleDelete = async (e, keyword) => {
        e.stopPropagation();
        const userEmail = getStoredUserEmail();
        if (!userEmail) return;

        if (window.confirm(`'${keyword}' 스크랩을 삭제하시겠습니까?`)) {
            setRemovingKeywords(new Set([keyword]));
            try {
                await deleteScrapItem(userEmail, keyword);
                setTimeout(() => {
                    refreshScraps();
                    setRemovingKeywords(new Set());
                }, 300);
            } catch (error) {
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
                // 병렬로 API 호출
                const promises = Array.from(deleteSelection).map(keyword => 
                    deleteScrapItem(userEmail, keyword)
                );
                await Promise.all(promises);

                setTimeout(() => {
                    refreshScraps();
                    setRemovingKeywords(new Set());
                    setDeleteSelection(new Set());
                    setIsDeleteMode(false);
                }, 300);
            } catch (error) {
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
            setDeleteSelection(new Set(processedScraps.map(s => s.keyword)));
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
        if (isCompareMode) {
            toggleCompareSelect(item.keyword);
            return;
        }
        if (isDeleteMode) {
            toggleDeleteSelect(item.keyword);
            return;
        }
        setSelectedKeyword({
            keyword: item.keyword,
            rank: item.rank,
            type: item.type || 'trend',
            title: item.keyword,
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

    // ─── 태그 관리 ───
    // const handleAddTag = (keyword) => {
    //     const tag = tagInput.trim();
    //     if (!tag) return;
    //     const item = scraps.find(s => s.keyword === keyword);
    //     const currentTags = item?.tags || [];
    //     if (!currentTags.includes(tag)) {
    //         updateScrap(keyword, { tags: [...currentTags, tag] });
    //         refreshScraps();
    //     }
    //     setTagInput('');
    //     setEditingTagFor(null);
    // };

    // const handleRemoveTag = (e, keyword, tag) => {
    //     e.stopPropagation();
    //     const item = scraps.find(s => s.keyword === keyword);
    //     const newTags = (item?.tags || []).filter(t => t !== tag);
    //     updateScrap(keyword, { tags: newTags });
    //     refreshScraps();
    // };

    // ─── 비교 모드 ───
    const toggleCompareSelect = (keyword) => {
        setCompareSelection(prev => {
            const next = new Set(prev);
            if (next.has(keyword)) next.delete(keyword);
            else if (next.size < 4) next.add(keyword);
            return next;
        });
    };

    const openCompare = () => {
        if (compareSelection.size < 2) return;
        setIsCompareModalOpen(true);
    };

    const compareKeywords = useMemo(
        () => scraps.filter(s => compareSelection.has(s.keyword)),
        [scraps, compareSelection]
    );

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
        reorderScraps(reordered);
        setScraps(reordered);
        setDragIndex(null);
        setDragOverIndex(null);
    };
    const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

    // ─── CSV 내보내기 ───
    const handleExport = () => {
        const data = processedScraps;
        if (data.length === 0) return;

        const BOM = '\uFEFF';
        const headers = ['키워드', '순위', '타입', '저장일'];
        const rows = data.map(item => [
            item.keyword,
            item.rank || '?',
            item.type || 'trend',
            item.savedAt ? new Date(item.savedAt).toLocaleDateString('ko-KR') : ''
        ]);

        const csv = BOM + [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `스크랩_키워드_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // ─── 모드 진입 시 다른 모드 해제 ───
    const enterCompareMode = () => {
        setIsDeleteMode(false);
        setDeleteSelection(new Set());
        setIsCompareMode(true);
        setCompareSelection(new Set());
    };
    const enterDeleteMode = () => {
        setIsCompareMode(false);
        setCompareSelection(new Set());
        setIsDeleteMode(true);
        setDeleteSelection(new Set());
    };
    const exitAllModes = () => {
        setIsCompareMode(false);
        setCompareSelection(new Set());
        setIsDeleteMode(false);
        setDeleteSelection(new Set());
    };

    // 현재 활성 모드 여부
    const isAnyMode = isCompareMode || isDeleteMode;

    // ─── 카드 체크 상태 ───
    const getCheckState = (keyword) => {
        if (isCompareMode) return compareSelection.has(keyword);
        if (isDeleteMode) return deleteSelection.has(keyword);
        return false;
    };

    // ─────────────────── 렌더링 ───────────────────

    // 카드 컨텐츠 (그리드/리스트 공용 추출)
    const renderCardContent = (item, index) => {
        const badge = getBadge(item.keyword);
        const isRemoving = removingKeywords.has(item.keyword);
        const isSelected = getCheckState(item.keyword);
        const isDragOver = dragOverIndex === index;

        return (
            <div
                key={item.keyword}
                draggable={!isAnyMode && sortBy === 'custom'}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => handleCardClick(item)}
                className={`group cursor-pointer transition-all duration-300 border relative
                    ${viewMode === 'grid' ? 'card-soft' : 'card-soft flex items-start gap-4 p-4'}
                    ${isRemoving ? 'opacity-0 scale-95 -translate-y-2' : 'opacity-100 scale-100'}
                    ${isSelected
                        ? (isDeleteMode ? 'border-red-400 ring-2 ring-red-200 bg-red-50/30' : 'border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/30')
                        : 'border-gray-100 hover:border-blue-200'
                    }
                    ${isDragOver ? 'border-indigo-400 border-dashed bg-indigo-50/20' : ''}
                    hover:shadow-md
                `}
            >
                {/* 드래그 핸들 (커스텀 정렬 + 모드 비활성 시만) */}
                {!isAnyMode && sortBy === 'custom' && (
                    <div className={`absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500`}>
                        <DotsSixVertical size={16} weight="bold" />
                    </div>
                )}

                {/* 체크박스 (비교/삭제 모드) */}
                {isAnyMode && (
                    <div className={`absolute top-3 left-3 ${viewMode === 'list' ? 'relative top-0 left-0 flex-shrink-0 mt-1' : ''}`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            isSelected
                                ? (isDeleteMode ? 'bg-red-500 border-red-500' : 'bg-indigo-600 border-indigo-600')
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

                {/* 변동 뱃지 */}
                {badge && (
                    <div className={`absolute ${viewMode === 'list' ? 'top-3 right-4' : 'top-3 right-12'} flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                        <badge.icon size={10} weight="fill" />
                        {badge.label}
                    </div>
                )}

                {/* 메인 컨텐츠 */}
                <div className={`flex-1 ${viewMode === 'list' ? 'min-w-0' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                        <div className={isAnyMode && viewMode === 'grid' ? 'ml-7' : ''}>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                No.{item.rank || '?'}
                            </span>
                            <h3 className={`font-bold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors ${viewMode === 'list' ? 'text-base' : 'text-lg'}`}>
                                {item.keyword}
                            </h3>
                        </div>
                        {!isAnyMode && viewMode === 'grid' && (
                            <button
                                onClick={(e) => handleDelete(e, item.keyword)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                                title="삭제"
                            >
                                <Trash size={18} />
                            </button>
                        )}
                    </div>

                    <p className={`text-sm text-gray-500 mb-3 ${viewMode === 'list' ? 'line-clamp-1' : 'line-clamp-2 h-10'}`}>
                        {item.desc}
                    </p>



                    <div className="flex justify-between items-center text-xs text-gray-400 pt-3 border-t border-gray-50">
                        <span>{item.savedAt ? formatDate(item.savedAt) : '날짜 정보 없음'} 저장됨</span>
                        {!isAnyMode && (
                            <span className="flex items-center gap-1 text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                분석 보기 <ArrowRight />
                            </span>
                        )}
                    </div>
                </div>

                {/* 리스트 뷰: 우측 삭제 버튼 */}
                {!isAnyMode && viewMode === 'list' && (
                    <button
                        onClick={(e) => handleDelete(e, item.keyword)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition flex-shrink-0 self-center"
                        title="삭제"
                    >
                        <Trash size={18} />
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="page" onClick={() => isSortOpen && setIsSortOpen(false)}>
            {/* ─── 헤더 ─── */}
            <div className="mb-5 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                            <BookmarkSimple className="text-blue-600" size={32} weight="fill" />
                            내 스크랩
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            관심 있게 본 트렌드 키워드를 모아두었습니다.
                        </p>
                    </div>

                    {/* 내보내기 버튼 */}
                    {scraps.length > 0 && (
                        <button
                            onClick={handleExport}
                            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-all"
                            title="CSV로 내보내기"
                        >
                            <Export size={14} />
                            내보내기
                        </button>
                    )}
                </div>
            </div>

            {scraps.length > 0 && (
                <>
                    {/* ─── 검색 바 ─── */}
                    <div className="relative mb-4">
                        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="키워드 검색..."
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all bg-white"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} weight="bold" />
                            </button>
                        )}
                    </div>

                    {/* ─── 툴바: 카운트 + 정렬 + 뷰전환 + 모드 토글 ─── */}
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 mb-6">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <span className="text-xs text-gray-400">
                                {processedScraps.length}개 키워드
                                {/* {searchQuery && ` (검색: "${searchQuery}")`} */}
                            </span>

                            {/* 정렬 드롭다운 */}
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => setIsSortOpen(!isSortOpen)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                        sortBy !== 'custom'
                                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                    <SortAscending size={12} />
                                    {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                                </button>

                                {isSortOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-28 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden py-1 z-50">
                                        {SORT_OPTIONS.map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => { setSortBy(option.value); setIsSortOpen(false); }}
                                                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                                                    sortBy === option.value ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-gray-600'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 뷰 토글 */}
                            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
                                    title="그리드 뷰"
                                >
                                    <SquaresFour size={14} weight="bold" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
                                    title="리스트 뷰"
                                >
                                    <List size={14} weight="bold" />
                                </button>
                            </div>
                        </div>

                        {/* 모드 버튼들 */}
                        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                            {/* 다중 삭제 모드 액션 */}
                            {isDeleteMode && (
                                <>
                                    <button
                                        onClick={toggleSelectAll}
                                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-gray-500 border border-gray-200 hover:border-gray-400 transition-all"
                                    >
                                        <Checks size={14} />
                                        {deleteSelection.size === processedScraps.length ? '전체 해제' : '전체 선택'}
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        disabled={deleteSelection.size === 0}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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

                            {/* 비교 모드 액션 */}
                            {isCompareMode && (
                                <button
                                    onClick={openCompare}
                                    disabled={compareSelection.size < 2}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        compareSelection.size >= 2
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    <ChartLineUp size={14} />
                                    비교하기 ({compareSelection.size}/4)
                                </button>
                            )}

                            {/* 모드 토글 버튼들 */}
                            {!isAnyMode ? (
                                <>
                                    <button
                                        onClick={enterDeleteMode}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-white text-gray-500 border-gray-200 hover:border-red-300 hover:text-red-500"
                                    >
                                        선택 삭제
                                    </button>
                                    <button
                                        onClick={enterCompareMode}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                                    >
                                        비교 모드
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={exitAllModes}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                                >
                                    취소
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}

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
                            <p className="font-medium text-sm">'{activeTag}' 태그가 설정된 키워드가 없습니다.</p>
                        </>
                    )}
                    <button
                        onClick={() => { setActiveTag('전체'); setSearchQuery(''); }}
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
                // 카드 그리드 or 리스트
                <div className={
                    viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
                        : 'flex flex-col gap-3'
                }>
                    {processedScraps.map((item, index) => renderCardContent(item, index))}
                </div>
            )}

            {/* 트렌드 요약 모달 */}
            <SummaryModal
                isOpen={isModalOpen}
                onClose={closeModal}
                data={selectedKeyword}
                onScrapChange={handleScrapChange}
            />

            {/* 비교 모달 */}
            <CompareModal
                isOpen={isCompareModalOpen}
                onClose={() => setIsCompareModalOpen(false)}
                keywords={compareKeywords}
            />
        </div>
    );
};

export default ScrapPage;
