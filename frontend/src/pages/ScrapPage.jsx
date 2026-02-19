// 즐겨찾기 페이지 (태그, 비교, 드래그 정렬, 변동 뱃지, 메모, 애니메이션)
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trash, ArrowRight, BookmarkSimple,
    Tag, Plus, X, ChartLineUp,
    DotsSixVertical, NotePencil, Fire, Sparkle
} from '@phosphor-icons/react';
import { getScraps, removeScrap, updateScrap, reorderScraps, getAllTags } from '../utils/storage';
import { formatDate } from '../utils/formatters';
import SummaryModal from '../components/home/SummaryModal';
import CompareModal from '../components/scrap/CompareModal';

// ─── 태그 프리셋 색상 ───
const TAG_COLORS = {
    '마케팅': 'bg-purple-100 text-purple-700 border-purple-200',
    '경쟁사': 'bg-red-100 text-red-700 border-red-200',
    '트렌드': 'bg-blue-100 text-blue-700 border-blue-200',
    '아이디어': 'bg-amber-100 text-amber-700 border-amber-200',
    '리서치': 'bg-green-100 text-green-700 border-green-200',
};
const DEFAULT_TAG_COLOR = 'bg-gray-100 text-gray-600 border-gray-200';
const getTagColor = (tag) => TAG_COLORS[tag] || DEFAULT_TAG_COLOR;

// ─── 변동 뱃지 (더미: 랜덤 할당, 실제론 API 연동) ───
const BADGE_TYPES = [
    { label: '급상승', icon: Fire, color: 'bg-red-50 text-red-500 border-red-200' },
    { label: '신규', icon: Sparkle, color: 'bg-indigo-50 text-indigo-500 border-indigo-200' },
    null, null, null // 뱃지 없는 경우 비율
];
const getBadge = (keyword) => {
    // 간단한 해시로 일관된 뱃지 부여 (세션 내 동일 키워드는 같은 뱃지)
    const hash = keyword.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return BADGE_TYPES[hash % BADGE_TYPES.length];
};

const ScrapPage = () => {
    const navigate = useNavigate();
    const [scraps, setScraps] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedKeyword, setSelectedKeyword] = useState(null);

    // 태그 관련
    const [activeTag, setActiveTag] = useState('전체');
    const [tagInput, setTagInput] = useState('');
    const [editingTagFor, setEditingTagFor] = useState(null); // keyword
    const tagInputRef = useRef(null);

    // 비교 모드
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [compareSelection, setCompareSelection] = useState(new Set());
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

    // 드래그 앤 드롭
    const [dragIndex, setDragIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    // 퇴장 애니메이션
    const [removingKeyword, setRemovingKeyword] = useState(null);

    // 정리 완료 메시지
    const [showClearMsg, setShowClearMsg] = useState(false);
    const prevCountRef = useRef(0);

    // 데이터 로드
    useEffect(() => {
        const data = getScraps();
        setScraps(data);
        prevCountRef.current = data.length;
    }, []);

    // Empty State 도달 감지
    useEffect(() => {
        if (prevCountRef.current > 0 && scraps.length === 0) {
            setShowClearMsg(true);
            setTimeout(() => setShowClearMsg(false), 3000);
        }
        prevCountRef.current = scraps.length;
    }, [scraps.length]);

    // 전체 태그 목록
    const allTags = useMemo(() => ['전체', ...getAllTags()], [scraps]);

    // 필터링된 스크랩
    const filteredScraps = useMemo(() => {
        if (activeTag === '전체') return scraps;
        return scraps.filter(item => (item.tags || []).includes(activeTag));
    }, [scraps, activeTag]);

    // ─── 핸들러 ───

    const refreshScraps = useCallback(() => {
        setScraps(getScraps());
    }, []);

    // 삭제 (애니메이션 포함)
    const handleDelete = (e, keyword) => {
        e.stopPropagation();
        if (window.confirm(`'${keyword}' 스크랩을 삭제하시겠습니까?`)) {
            setRemovingKeyword(keyword);
            setTimeout(() => {
                removeScrap(keyword);
                refreshScraps();
                setRemovingKeyword(null);
            }, 300);
        }
    };

    // 카드 클릭 → 모달
    const handleCardClick = (item) => {
        if (isCompareMode) {
            toggleCompareSelect(item.keyword);
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
        refreshScraps(); // 모달 닫힐 때 목록 갱신 (스크랩 해제 반영)
    };

    const handleScrapChange = () => refreshScraps();

    // ─── 태그 관리 ───
    const handleAddTag = (keyword) => {
        const tag = tagInput.trim();
        if (!tag) return;
        const item = scraps.find(s => s.keyword === keyword);
        const currentTags = item?.tags || [];
        if (!currentTags.includes(tag)) {
            updateScrap(keyword, { tags: [...currentTags, tag] });
            refreshScraps();
        }
        setTagInput('');
        setEditingTagFor(null);
    };

    const handleRemoveTag = (e, keyword, tag) => {
        e.stopPropagation();
        const item = scraps.find(s => s.keyword === keyword);
        const newTags = (item?.tags || []).filter(t => t !== tag);
        updateScrap(keyword, { tags: newTags });
        refreshScraps();
    };

    // ─── 비교 모드 ───
    const toggleCompareSelect = (keyword) => {
        setCompareSelection(prev => {
            const next = new Set(prev);
            if (next.has(keyword)) {
                next.delete(keyword);
            } else if (next.size < 4) {
                next.add(keyword);
            }
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

    const handleDragOver = (e, index) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

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

    const handleDragEnd = () => {
        setDragIndex(null);
        setDragOverIndex(null);
    };

    return (
        <div className="page">
            {/* 헤더 */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BookmarkSimple className="text-blue-600" size={32} weight="fill" />
                    내 스크랩
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    관심 있게 본 트렌드 키워드를 모아두었습니다.
                </p>
            </div>

            {scraps.length > 0 && (
                <>
                    {/* 태그 필터 바 */}
                    <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
                        <Tag size={16} className="text-gray-400 flex-shrink-0" />
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setActiveTag(tag)}
                                className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap transition-all ${
                                    activeTag === tag
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    {/* 액션 바: 비교 모드 토글 */}
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-xs text-gray-400">
                            {filteredScraps.length}개 키워드
                        </span>
                        <div className="flex items-center gap-2">
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
                            <button
                                onClick={() => {
                                    setIsCompareMode(!isCompareMode);
                                    setCompareSelection(new Set());
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                    isCompareMode
                                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                                }`}
                            >
                                {isCompareMode ? '비교 취소' : '비교 모드'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {filteredScraps.length === 0 && scraps.length > 0 ? (
                // 필터 결과 없음
                <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
                    <Tag size={36} className="mb-3 opacity-50" />
                    <p className="font-medium text-sm">'{activeTag}' 태그가 설정된 키워드가 없습니다.</p>
                    <button
                        onClick={() => setActiveTag('전체')}
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
                // 카드 그리드
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredScraps.map((item, index) => {
                        const badge = getBadge(item.keyword);
                        const isRemoving = removingKeyword === item.keyword;
                        const isSelected = compareSelection.has(item.keyword);
                        const isDragOver = dragOverIndex === index;

                        return (
                            <div
                                key={item.keyword}
                                draggable={!isCompareMode}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                onClick={() => handleCardClick(item)}
                                className={`card-soft group cursor-pointer transition-all duration-300 border relative
                                    ${isRemoving ? 'opacity-0 scale-95 -translate-y-2' : 'opacity-100 scale-100'}
                                    ${isSelected ? 'border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/30' : 'border-gray-100 hover:border-blue-200'}
                                    ${isDragOver ? 'border-indigo-400 border-dashed bg-indigo-50/20' : ''}
                                    hover:shadow-md
                                `}
                            >
                                {/* 드래그 핸들 */}
                                {!isCompareMode && (
                                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500">
                                        <DotsSixVertical size={16} weight="bold" />
                                    </div>
                                )}

                                {/* 비교 체크박스 */}
                                {isCompareMode && (
                                    <div className="absolute top-3 left-3">
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                            isSelected
                                                ? 'bg-indigo-600 border-indigo-600'
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
                                    <div className={`absolute top-3 right-12 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                                        <badge.icon size={10} weight="fill" />
                                        {badge.label}
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-3">
                                    <div className={isCompareMode ? 'ml-7' : ''}>
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                            No.{item.rank || '?'}
                                        </span>
                                        <h3 className="text-lg font-bold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors">
                                            {item.keyword}
                                        </h3>
                                    </div>
                                    {!isCompareMode && (
                                        <button
                                            onClick={(e) => handleDelete(e, item.keyword)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                                            title="삭제"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    )}
                                </div>

                                <p className="text-sm text-gray-500 line-clamp-2 mb-3 h-10">
                                    {item.desc}
                                </p>

                                {/* 메모 미리보기 */}
                                {item.memo && (
                                    <div className="flex items-center gap-1.5 text-[11px] text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg mb-3">
                                        <NotePencil size={12} weight="fill" />
                                        <span className="truncate">{item.memo}</span>
                                    </div>
                                )}

                                {/* 태그 영역 */}
                                <div className="flex flex-wrap gap-1.5 mb-3 min-h-[24px]">
                                    {(item.tags || []).map(tag => (
                                        <span
                                            key={tag}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTagColor(tag)}`}
                                        >
                                            {tag}
                                            <button
                                                onClick={(e) => handleRemoveTag(e, item.keyword, tag)}
                                                className="hover:opacity-70 ml-0.5"
                                            >
                                                <X size={10} weight="bold" />
                                            </button>
                                        </span>
                                    ))}

                                    {/* 태그 추가 버튼 / 입력 */}
                                    {editingTagFor === item.keyword ? (
                                        <form
                                            onClick={(e) => e.stopPropagation()}
                                            onSubmit={(e) => { e.preventDefault(); handleAddTag(item.keyword); }}
                                            className="flex items-center"
                                        >
                                            <input
                                                ref={tagInputRef}
                                                type="text"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onBlur={() => { setEditingTagFor(null); setTagInput(''); }}
                                                placeholder="태그 입력"
                                                className="w-16 px-1.5 py-0.5 text-[10px] border border-indigo-300 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-300"
                                                maxLength={10}
                                                autoFocus
                                            />
                                        </form>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingTagFor(item.keyword);
                                                setTagInput('');
                                            }}
                                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border border-dashed border-gray-300 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition"
                                        >
                                            <Plus size={10} weight="bold" />
                                            태그
                                        </button>
                                    )}
                                </div>

                                <div className="flex justify-between items-center text-xs text-gray-400 pt-3 border-t border-gray-50">
                                    <span>{item.savedAt ? formatDate(item.savedAt) : '날짜 정보 없음'} 저장됨</span>
                                    {!isCompareMode && (
                                        <span className="flex items-center gap-1 text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                            분석 보기 <ArrowRight />
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
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
