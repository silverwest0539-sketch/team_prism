// src/pages/AnalysisPage.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  ArrowsClockwise,
  BookmarkSimple,
  Export,
  PlayCircle,
  CaretDoubleLeft, // << 아이콘 추가
  CaretDoubleRight, // [추가됨] >> 아이콘
  CaretLeft,
  CaretRight,
  ChartLineUp,
  Newspaper,
  Star,
  Copy,
  X, 
  ArrowsOutSimple,
  Question, 
  LockKey,
  Book,
  WarningCircle
} from '@phosphor-icons/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// 공통 컴포넌트
import SearchBar from '../components/common/SearchBar';

// 유틸리티
import { formatDateLabel, formatDateForInput, formatViews } from '../utils/formatters';
import apiClient from '../utils/apiClient';
import { getStoredUser } from '../utils/authStorage';
import { showToast } from '../utils/toast';
import SimpleWordCloud from '../components/analysis/SimpleWordCloud';
import CommentItem from '../components/analysis/CommentItem';
import { DUMMY_DATA, PLATFORM_OPTIONS, SENTIMENT_DATA } from '../constants/analysisConstants';

const getFormattedDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AnalysisPage = () => {
  const { keyword: pathKeyword } = useParams();
  const [searchParams] = useSearchParams();
  const keyword = (pathKeyword || searchParams.get('keyword') || '').trim();
  const navigate = useNavigate();

  const initialToday = new Date();
  const initialYesterday = new Date(initialToday);
  initialYesterday.setDate(initialYesterday.getDate() - 1);

  // ==========================================
  // [추가] 로그인 상태 관리
  // ==========================================
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const savedUser = getStoredUser();
    setIsLoggedIn(!!savedUser?.email);
  }, []);
  // ==========================================

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 댓글 무한 스크롤 & 페이지네이션용 상태
  const [commentOffset, setCommentOffset] = useState(70);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // 입력용 날짜와 실제 적용(차트렌더링)용 날짜를 분리
  const [inputStartDate, setInputStartDate] = useState(getFormattedDate(initialYesterday));
  const [inputEndDate, setInputEndDate] = useState(getFormattedDate(initialToday));
  
  const [appliedStartDate, setAppliedStartDate] = useState(getFormattedDate(initialYesterday));
  const [appliedEndDate, setAppliedEndDate] = useState(getFormattedDate(initialToday));

  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [news, setNews] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isScrapped, setIsScrapped] = useState(false);

  const [showScoreTooltip, setShowScoreTooltip] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);

  // 여론 분석 모달 관련 상태
  const [sentimentModalConfig, setSentimentModalConfig] = useState({ isOpen: false, sentiment: null });
  const [isNegativeRevealed, setIsNegativeRevealed] = useState(false);

  // 정보 수정 제보 모달 관련 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRequestText, setEditRequestText] = useState('');

  // 개별 댓글 반응용 동의 상태 관리 (Set)
  const [revealedCommentIds, setRevealedCommentIds] = useState(new Set());

  const handleRevealComment = useCallback((commentId) => {
    setRevealedCommentIds((prev) => {
      const next = new Set(prev);
      next.add(commentId);
      return next;
    });
  }, []);

  // 메인 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;
  const commentsTopRef = useRef(null);

  // 여론 분석 모달 전용 페이지네이션 상태 (새로 추가됨)
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const MODAL_ITEMS_PER_PAGE = 7;
  const modalCommentsTopRef = useRef(null);

  // 인물 판별 로직
  const isPersonKeyword = data?.is_person === 1;

  // 기준 날짜 (오늘 날짜) 포맷팅
  const todayForText = new Date();
  const baseDateText = `${todayForText.getMonth() + 1}월 ${todayForText.getDate()}일 기준`;

  // 데이터 불러오기
  const fetchData = useCallback(async (currentStart, currentEnd) => {
    if (!keyword || !isLoggedIn) return; // 로그인 안되어있으면 API 호출 방지 (리소스 절약)

    setLoading(true);

    const params = { keyword };
    if (currentStart) params.startDate = currentStart;
    if (currentEnd) params.endDate = currentEnd;

    try {
      const [analysisRes, newsRes] = await Promise.all([
        apiClient.get('/analysis', { params }),
        apiClient.get('/news', { params }),
      ]);

      const analysisData = analysisRes.data;
      const newsData = newsRes.data;

      if (analysisData.found) {
        setData(analysisData);
        
        // 처음 서버에서 받아온 실제 댓글 개수 확인
        const initialCommentCount = analysisData.comments?.length || 0;
        
        // offset을 실제 받아온 개수로 정확하게 세팅
        setCommentOffset(initialCommentCount); 
        
        // 받아온 댓글이 70개(서버 1회 전송량)보다 적다면, 뒤에 더 이상 데이터가 없는 것임
        if (initialCommentCount < 70) {
          setHasMoreComments(false);
        } else {
          setHasMoreComments(true);
        }

        if (!currentStart && analysisData.history?.length > 0) {
          const sDate = formatDateForInput(analysisData.history[0].date);
          const eDate = formatDateForInput(analysisData.history[analysisData.history.length - 1].date);
          setInputStartDate(sDate);
          setInputEndDate(eDate);
          setAppliedStartDate(sDate);
          setAppliedEndDate(eDate);
        }
      } else {
        setData(null);
      }

      setNews(newsData || []);
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      showToast('데이터를 불러오지 못했습니다.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [keyword, isLoggedIn]); 

  const fetchAiSummary = useCallback(async (targetKeyword, start, end) => {
    if (!isLoggedIn) return; // 비로그인 시 차단

    setIsAiLoading(true);
    try {
      const params = { keyword: targetKeyword };
      if (start) params.startDate = start;
      if (end) params.endDate = end;

      const res = await apiClient.get('/summary', { params });
      setAiSummary(res.data.summary);
    } catch (err) {
      console.error('AI 요약 로드 실패:', err);
      setAiSummary('요약 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsAiLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!keyword || !isLoggedIn) return;

    setAiSummary(null);
    setIsAiLoading(true);
    setShowScoreTooltip(false);
    
    // 키워드가 변경되면 개별 댓글 동의 상태도 초기화
    setRevealedCommentIds(new Set());
    
    const todayDate = getFormattedDate(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = getFormattedDate(yesterday);

    setInputStartDate(yesterdayDate);
    setInputEndDate(todayDate);
    setAppliedStartDate(yesterdayDate);
    setAppliedEndDate(todayDate);
    setCurrentPage(1);
    setModalCurrentPage(1); // 검색 시 모달 페이지도 초기화
    
    const savedUser = getStoredUser();
    if (savedUser?.email) {
      apiClient
        .get('/scraps/check', {
          params: { email: savedUser.email, keyword: keyword },
        })
        .then((res) => setIsScrapped(Boolean(res.data?.isBookmarked)))
        .catch(() => setIsScrapped(false));
    } else {
      setIsScrapped(false);
    }

    fetchData(yesterdayDate, todayDate);
    fetchAiSummary(keyword, yesterdayDate, todayDate);

  }, [keyword, fetchAiSummary, fetchData, isLoggedIn]); 

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/analysis/${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm(''); 
      e.target.blur();
    }
  };

  // ** 변경된 댓글 추가 불러오기 함수 (페이지네이션 이동 중 호출됨) **
  const fetchMoreComments = async () => {
    if (isLoadingMore || !hasMoreComments) return false;
    setIsLoadingMore(true);
    try {
      const res = await apiClient.get('/analysis/comments', {
        params: {
          keyword,
          startDate: appliedStartDate,
          endDate: appliedEndDate,
          offset: commentOffset
        }
      });

      const newComments = res.data.comments || [];
      if (newComments.length > 0) {
        setData(prev => ({
          ...prev,
          comments: [...(prev?.comments || []), ...newComments]
        }));
        setCommentOffset(prev => prev + newComments.length);
        
        // 만약 설정된 기본 수량(예: 70개)보다 적게 가져왔다면 마지막 데이터로 간주
        if (newComments.length < 70) {
          setHasMoreComments(false);
        }
        return true;
      } else {
        setHasMoreComments(false);
        return false;
      }
    } catch (err) {
      console.error('댓글 더보기 실패:', err);
      showToast('댓글을 추가로 불러오지 못했습니다.', { type: 'error' });
      return false;
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleDateApply = () => {
    setAppliedStartDate(inputStartDate);
    setAppliedEndDate(inputEndDate);
    fetchData(inputStartDate, inputEndDate);
    setCurrentPage(1);
    setModalCurrentPage(1);
  };

  const handleDateReset = () => {
    const todayDate = getFormattedDate(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = getFormattedDate(yesterday);

    setInputStartDate(yesterdayDate);
    setInputEndDate(todayDate);
    setAppliedStartDate(yesterdayDate);
    setAppliedEndDate(todayDate);
    setCurrentPage(1);
    setModalCurrentPage(1);
    
    fetchData(yesterdayDate, todayDate);
    fetchAiSummary(keyword, yesterdayDate, todayDate);
  };

  const resolveScrapKeyword = useCallback(async () => {
    const cachedKeyword = String(data?.keyword || '').trim();
    if (cachedKeyword) return cachedKeyword;

    const inputKeyword = String(keyword || '').trim();
    if (!inputKeyword) return '';

    try {
      const res = await apiClient.get('/analysis', { params: { keyword: inputKeyword } });
      const resolvedKeyword = String(res.data?.keyword || '').trim();
      if (res.data?.found && resolvedKeyword) {
        return resolvedKeyword;
      }
      return '';
    } catch (error) {
      console.error('스크랩 키워드 확인 실패:', error);
      return '';
    }
  }, [data?.keyword, keyword]);

  const handleScrapToggle = async () => {
    const savedUser = getStoredUser();
    if (!savedUser?.email) {
      if (window.confirm('관심 키워드 저장(스크랩) 기능은 로그인이 필요합니다.\n로그인 페이지로 이동하시겠습니까?')) {
        navigate('/login');
      }
      return;
    }

    const resolvedKeyword = await resolveScrapKeyword();
    const fallbackKeyword = String(keyword || '').trim();
    const targetKeyword = resolvedKeyword || fallbackKeyword;
    if (!targetKeyword) {
      showToast('스크랩할 키워드가 없습니다.', { type: 'warning' });
      return;
    }

    try {
      if (isScrapped) {
        if (resolvedKeyword) {
          await apiClient.delete('/scraps', {
            params: { email: savedUser.email, keyword: resolvedKeyword },
          });
        }
        setIsScrapped(false);
        showToast('스크랩이 취소되었습니다.', { type: 'info' });
      } else {
        if (!resolvedKeyword) throw new Error('NO_SERVER_KEYWORD');
        await apiClient.post('/scraps', {
          email: savedUser.email,
          keyword: resolvedKeyword,
        });
        setIsScrapped(true);
        showToast('관심 키워드로 저장되었습니다.', { type: 'success' });
      }
    } catch (error) {
      console.error(error);
      showToast('스크랩 처리 중 오류가 발생했습니다.', { type: 'error' });
    }
  };

  useEffect(() => {
    const savedUser = getStoredUser();
    const resolvedKeyword = String(data?.keyword || keyword || '').trim();
    if (!savedUser?.email || !resolvedKeyword) return;

    apiClient
      .get('/scraps/check', {
        params: { email: savedUser.email, keyword: resolvedKeyword },
      })
      .then((res) => setIsScrapped(Boolean(res.data?.isBookmarked)))
      .catch(() => setIsScrapped(false));
  }, [data?.keyword, keyword]);

  const handleGoToCreation = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (keyword) {
      navigate(`/creation?keyword=${encodeURIComponent(keyword)}`);
    } else {
      navigate('/creation');
    }
  };

  const handleGoToNamuwiki = () => {
    if (!keyword) return;
    const namuwikiUrl = `https://namu.wiki/w/${encodeURIComponent(keyword)}`;
    window.open(namuwikiUrl, '_blank', 'noopener,noreferrer');
  };

  const handleEditRequestSubmit = async (e) => {
    e.preventDefault();
    if (!editRequestText.trim()) {
      showToast('수정이나 추가가 필요한 내용을 입력해주세요.', { type: 'warning' });
      return;
    }
    
    try {
      await apiClient.post('/auth/report', {
        keyword: keyword, 
        content: editRequestText, 
        userEmail: getStoredUser()?.email || '비로그인 사용자'
      });

      showToast('소중한 의견 감사합니다. 검토 후 신속히 반영하겠습니다.', { type: 'success' });
      setIsEditModalOpen(false);
      setEditRequestText('');
    } catch (error) {
      console.error('제보 메일 전송 실패:', error);
      showToast('의견 전송에 실패했습니다. 잠시 후 다시 시도해주세요.', { type: 'error' });
    }
  };

  const filteredData = useMemo(() => {
    const sourceData = data || DUMMY_DATA;
    const chartDataKey = selectedPlatform === 'all' ? 'mentions' : selectedPlatform;
    if (!data) {
      return {
        ...sourceData,
        history: sourceData.history,
        comments: [],
        youtubeComments: [],
        otherComments: [],
        wordCloud: [],
        videos: [],
        chartDataKey
      };
    }

    let historyFiltered = [];
    if (appliedStartDate && appliedEndDate) {
      const start = new Date(appliedStartDate);
      const end = new Date(appliedEndDate);
      const historyMap = {};
      
      (sourceData.history || []).forEach((h) => {
        historyMap[h.date] = h;
      });

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}${mm}${dd}`;

        if (historyMap[dateStr]) {
          historyFiltered.push({
            ...historyMap[dateStr],
            [chartDataKey]: historyMap[dateStr][chartDataKey] || 0
          });
        } else {
          historyFiltered.push({ date: dateStr, mentions: 0, score: 0, [chartDataKey]: 0 });
        }
      }
    } else {
      historyFiltered = sourceData.history || [];
    }

    let allComments = sourceData.comments || [];
    if (selectedPlatform !== 'all') {
      allComments = allComments.filter((c) => (c?.source || '').includes(selectedPlatform));
    }
    const youtubeComments = (allComments || []).filter((c) => (c?.source || '').includes('youtube'));
    const otherComments = (allComments || []).filter((c) => !(c?.source || '').includes('youtube'));

    let selectedWordCloud = [];
    const rawWordCloud = sourceData.wordCloud || sourceData.word_cloud || { all: [] };

    if (Array.isArray(rawWordCloud)) {
      selectedWordCloud = rawWordCloud;
    } else if (rawWordCloud) {
      selectedWordCloud = rawWordCloud[selectedPlatform] || rawWordCloud['all'] || [];
    }

    return {
      ...data,
      history: historyFiltered,
      comments: allComments,
      chartDataKey,
      youtubeComments: youtubeComments.slice(0, 4),
      otherComments: otherComments.slice(0, 6),
      wordCloud: selectedWordCloud, 
      videos: data.videos || [],
    };
  }, [data, appliedStartDate, appliedEndDate, selectedPlatform]);

  const { chartDataKey = 'mentions' } = filteredData || {};

  const mainChartData = useMemo(() => {
    const history = filteredData?.history || [];
    return history.length > 7 ? history.slice(-7) : history;
  }, [filteredData]);

  const showMoreChartBtn = (filteredData?.history?.length || 0) > 7;

  const sentimentChartData = useMemo(() => {
    const comments = filteredData?.comments || [];
    let pos = 0, neg = 0, neu = 0;

    comments.forEach(c => {
      if (c.sentiment === 'positive') pos++;
      else if (c.sentiment === 'negative') neg++;
      else neu++;
    });

    // --- [수정된 로직 추가] ---
    // 현재 프론트엔드에 로드된 댓글 수
    const loadedCount = pos + neg + neu;
    
    // 백엔드에서 넘겨준 진짜 총 댓글 수
    const backendTotal = data?.totalCommentCount || data?.total_comments || data?.totalCount;
    
    // 플랫폼 필터가 'all(전체)'일 때만 백엔드 총합을 사용하고, 특정 커뮤니티면 현재 필터링된 개수를 사용
    const totalCount = (selectedPlatform === 'all' && backendTotal) ? backendTotal : loadedCount;

    // 데이터가 모두 불러와졌거나 없는 경우 원본 그대로 반환
    if (loadedCount === 0 || loadedCount === totalCount) {
      return [
        { name: '긍정', value: pos, color: '#3B82F6' },
        { name: '부정', value: neg, color: '#EF4444' },
        { name: '중립', value: neu, color: '#9CA3AF' },
      ];
    }

    // 일부 댓글만 로드된 경우, 비율을 계산해 전체 수량(totalCount)에 맞게 숫자 스케일링
    const posScaled = Math.round((pos / loadedCount) * totalCount);
    const negScaled = Math.round((neg / loadedCount) * totalCount);
    
    // 총합이 정확히 일치하도록 반올림 오차를 중립(neu)에 보정
    let neuScaled = totalCount - posScaled - negScaled;
    if (neuScaled < 0) neuScaled = 0;

    return [
      { name: '긍정', value: posScaled, color: '#3B82F6' },
      { name: '부정', value: negScaled, color: '#EF4444' },
      { name: '중립', value: neuScaled, color: '#9CA3AF' },
    ];
  }, [filteredData, data, selectedPlatform]);

  const sentimentModalComments = useMemo(() => {
    if (!sentimentModalConfig.isOpen || !sentimentModalConfig.sentiment) return [];
    return (filteredData?.comments || []).filter(c => c.sentiment === sentimentModalConfig.sentiment);
  }, [filteredData, sentimentModalConfig]);

    // 도넛 차트의 스케일링된 숫자와 모달 상단 숫자를 완벽하게 동기화
  const displayModalTotalCount = useMemo(() => {
    if (!sentimentModalConfig.sentiment) return 0;
    const labelMap = { positive: '긍정', negative: '부정', neutral: '중립' };
    const targetLabel = labelMap[sentimentModalConfig.sentiment];
    const matchedData = sentimentChartData.find(d => d.name === targetLabel);
    
    return matchedData ? matchedData.value : sentimentModalComments.length;
  }, [sentimentModalConfig.sentiment, sentimentChartData, sentimentModalComments.length]);

  const handleSentimentClick = (data) => {
    const clickedName = data?.name || data?.value || data?.payload?.name;
    let targetSentiment = null;
    if (clickedName === '긍정') targetSentiment = 'positive';
    else if (clickedName === '부정') targetSentiment = 'negative';
    else if (clickedName === '중립') targetSentiment = 'neutral';

    if (targetSentiment) {
      setSentimentModalConfig({ isOpen: true, sentiment: targetSentiment });
      setIsNegativeRevealed(false); 
      setModalCurrentPage(1); // 모달 오픈 시 1페이지로 셋팅
    }
  };

  const usageExamples = useMemo(() => {
    if (!filteredData?.comments) return [];
    return filteredData.comments;
  }, [filteredData]);

  // 현재 프론트엔드에 불러와진 댓글 개수 (페이지네이션 계산용)
  const loadedItemsCount = usageExamples.length; 
  const totalPages = Math.max(1, Math.ceil(loadedItemsCount / ITEMS_PER_PAGE));

  // 화면 우측 상단에 보여줄 '진짜 전체 댓글 개수' (도넛 차트와 완벽 동기화)
  const displayTotalCount = (selectedPlatform === 'all' && (data?.totalCommentCount || data?.total_comments || data?.totalCount)) 
    ? (data?.totalCommentCount || data?.total_comments || data?.totalCount) 
    : loadedItemsCount;

  // 플랫폼 필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
    setModalCurrentPage(1);
  }, [selectedPlatform]);

  // 페이지 바운더리 체크 (메인 리스트)
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages && !hasMoreComments && !isLoadingMore) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage, hasMoreComments, isLoadingMore]);

  const currentUsageExamples = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return usageExamples.slice(startIndex, endIndex);
  }, [usageExamples, currentPage]);

  const scrollToTop = () => {
    requestAnimationFrame(() => {
      commentsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const goToPage = (p) => {
    setCurrentPage(p);
    scrollToTop();
  };

  const availablePlatforms = useMemo(() => {
    if (!data || !data.comments) return ['all']; 
    const sources = data.comments.map(comment => comment.source);
    const uniqueSources = [...new Set(sources)];
    return ['all', ...uniqueSources]; 
  }, [data]);

  const filteredPlatforms = PLATFORM_OPTIONS.filter(opt => 
    opt.value === 'all' || availablePlatforms.includes(opt.value)
  );

  const todayStr = getFormattedDate(new Date()).replace(/-/g, '');
  const todayData = filteredData?.history?.find(h => h.date === todayStr);
  const todayScore = Math.round(todayData?.score || 0);

  // ==========================================
  // [메인 리스트] 10단위 그룹 페이지네이션 & 페칭 연동 로직
  // ==========================================
  const PAGE_GROUP_SIZE = 10;
  const currentGroup = Math.floor((currentPage - 1) / PAGE_GROUP_SIZE);
  const startPage = currentGroup * PAGE_GROUP_SIZE + 1;
  const endPage = Math.min(startPage + PAGE_GROUP_SIZE - 1, totalPages);

  const visiblePages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  const hasPrevGroup = startPage > 1;
  const hasNextGroup = endPage < totalPages || hasMoreComments;

  const handlePrevGroupClick = () => goToPage(Math.max(1, startPage - PAGE_GROUP_SIZE));
  const handlePrevClick = () => goToPage(Math.max(1, currentPage - 1));

  const handleNextClick = async () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    } else if (hasMoreComments) {
      const fetched = await fetchMoreComments();
      if (fetched) {
        setCurrentPage((prev) => prev + 1);
        scrollToTop();
      }
    }
  };

  const handleNextGroupTextClick = async () => {
    const targetPage = startPage + PAGE_GROUP_SIZE;
    if (targetPage <= totalPages) {
      goToPage(targetPage);
    } else if (hasMoreComments) {
      const fetched = await fetchMoreComments();
      if (fetched) {
        setCurrentPage(targetPage);
        scrollToTop();
      }
    }
  };

  // ==========================================
  // [모달 리스트] 10단위 그룹 페이지네이션 & 페칭 연동 로직
  // ==========================================
  const modalLoadedItemsCount = sentimentModalComments.length;
  const modalTotalPages = Math.max(1, Math.ceil(modalLoadedItemsCount / MODAL_ITEMS_PER_PAGE));

  // 페이지 바운더리 체크 (모달 리스트)
  useEffect(() => {
    if (modalTotalPages > 0 && modalCurrentPage > modalTotalPages && !hasMoreComments && !isLoadingMore) {
      setModalCurrentPage(modalTotalPages);
    }
  }, [modalTotalPages, modalCurrentPage, hasMoreComments, isLoadingMore]);

  const currentModalComments = useMemo(() => {
    const startIndex = (modalCurrentPage - 1) * MODAL_ITEMS_PER_PAGE;
    const endIndex = startIndex + MODAL_ITEMS_PER_PAGE;
    return sentimentModalComments.slice(startIndex, endIndex);
  }, [sentimentModalComments, modalCurrentPage]);

  const scrollToModalTop = () => {
    requestAnimationFrame(() => {
      modalCommentsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const goToModalPage = (p) => {
    setModalCurrentPage(p);
    scrollToModalTop();
  };

  const MODAL_PAGE_GROUP_SIZE = 10;
  const modalCurrentGroup = Math.floor((modalCurrentPage - 1) / MODAL_PAGE_GROUP_SIZE);
  const modalStartPage = modalCurrentGroup * MODAL_PAGE_GROUP_SIZE + 1;
  const modalEndPage = Math.min(modalStartPage + MODAL_PAGE_GROUP_SIZE - 1, modalTotalPages);

  const modalVisiblePages = Array.from(
    { length: modalEndPage - modalStartPage + 1 },
    (_, i) => modalStartPage + i
  );

  const modalHasPrevGroup = modalStartPage > 1;
  const modalHasNextGroup = modalEndPage < modalTotalPages || hasMoreComments;

  const handleModalPrevGroupClick = () => goToModalPage(Math.max(1, modalStartPage - MODAL_PAGE_GROUP_SIZE));
  const handleModalPrevClick = () => goToModalPage(Math.max(1, modalCurrentPage - 1));

  const handleModalNextClick = async () => {
    if (modalCurrentPage < modalTotalPages) {
      goToModalPage(modalCurrentPage + 1);
    } else if (hasMoreComments) {
      const fetched = await fetchMoreComments();
      if (fetched) {
        setModalCurrentPage((prev) => prev + 1);
        scrollToModalTop();
      }
    }
  };

  const handleModalNextGroupTextClick = async () => {
    const targetPage = modalStartPage + MODAL_PAGE_GROUP_SIZE;
    if (targetPage <= modalTotalPages) {
      goToModalPage(targetPage);
    } else if (hasMoreComments) {
      const fetched = await fetchMoreComments();
      if (fetched) {
        setModalCurrentPage(targetPage);
        scrollToModalTop();
      }
    }
  };
  // ==========================================


  // ---------------- Render ----------------
  return (
    <div className="page space-y-6 relative">
      <header className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-4 relative z-10">
        <Link to="/home" className="p-2 bg-white rounded-full text-gray-500 hover:text-indigo-600 shadow-sm transition">
          <CaretLeft size={20} />
        </Link>
        <div className="flex-1">
          <SearchBar
            placeholder="분석하고 싶은 키워드 검색 (예: 쿠팡)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
            className="search-input w-full" 
          />
        </div>
      </header>

      <div className="relative flex-1"></div>

      <div
        className={`w-full transition-all duration-500 ease-in-out flex flex-col gap-6 sm:gap-8 ${
          !isLoggedIn
            ? 'opacity-30 blur-[6px] pointer-events-none select-none'
            : (!keyword ? 'blur-disabled' : 'blur-enabled')
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-2 mb-2 sm:mb-4 w-full">
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap flex-1 w-full sm:w-auto">
            <button
              onClick={handleScrapToggle}
              className="p-1 hover:scale-110 transition-transform focus:outline-none"
              title="스크랩"
            >
              <Star
                size={32}
                weight={isScrapped ? 'fill' : 'regular'}
                className={isScrapped ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}
              />
            </button>

            <div className="flex items-baseline gap-2 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-none">
                {keyword || '검색 키워드 예시'}
              </h1>
              {isPersonKeyword && (
                <span className="bg-indigo-100 text-indigo-700 text-sm font-bold px-2.5 py-1 rounded-full align-middle ml-1">
                  인물
                </span>
              )}
              
              <div className="flex items-center gap-1 text-gray-600 relative ml-1">
                {todayScore > 0 ? (
                  <>
                    <span className="text-sm sm:text-base font-bold text-indigo-600">
                      트렌드 스코어 {todayScore}점
                    </span>
                    <button
                      onClick={() => setShowScoreTooltip(!showScoreTooltip)}
                      className="text-gray-400 hover:text-indigo-500 transition-colors p-1"
                    >
                      <Question size={20} weight="fill" />
                    </button>

                    {showScoreTooltip && (
                      <div className="absolute top-8 left-0 z-50 w-64 p-3 bg-gray-800 text-white text-xs rounded-xl shadow-xl animate-fade-in">
                        <div className="absolute -top-1 left-4 w-3 h-3 bg-gray-800 transform rotate-45"></div>
                        <p className="font-semibold mb-1">트렌드 스코어란?</p>
                        <p className="opacity-90 leading-relaxed">
                          최근 검색량, 언급량, 확산도를 종합적으로 분석하여 산출된 트렌드 지표입니다.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md mt-1 sm:mt-0">
                    오늘의 트렌드 키워드가 아닙니다
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-start sm:justify-end overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
             <button 
               onClick={() => setIsEditModalOpen(true)}
               className="flex whitespace-nowrap items-center gap-1.5 sm:gap-2 bg-white hover:bg-gray-50 text-gray-500 border border-gray-200 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm shadow-sm transition-all hover:-translate-y-1"
               title="데이터 오류 제보 및 수정 요청"
             >
               <WarningCircle size={20} className="sm:w-5 sm:h-5 text-gray-400" />
               <span className="hidden sm:inline">정보 수정 제보</span>
               <span className="sm:hidden">수정제보</span>
             </button>
 
             <button 
               onClick={handleGoToNamuwiki}
               className="flex whitespace-nowrap items-center gap-1.5 sm:gap-2 bg-white hover:bg-teal-50 text-gray-700 border border-gray-200 px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-base shadow-sm transition-all hover:-translate-y-1"
               title="나무위키에서 검색"
             >
               <Book size={20} className="sm:w-5 sm:h-5 text-teal-600" weight="bold" />
               <span>나무위키 검색</span>
             </button>

             <button 
               onClick={handleGoToCreation}
               className="flex whitespace-nowrap items-center gap-1.5 sm:gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-base transition-all hover:-translate-y-1"
             >
               <Export size={20} className="sm:w-5 sm:h-5" />
               <span>콘텐츠 생성</span>
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
          <div className="card h-40 flex flex-col justify-between shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <h3 className="text-gray-500 font-medium text-sm flex items-center gap-2">
                <ArrowsClockwise size={18} /> 분석 기간 설정
              </h3>
              <button 
                  onClick={handleDateReset}
                  className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                  title="분석 기간 초기화"
                >
                  <ArrowsClockwise size={16} weight="bold"/>
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <input 
                  type="date" 
                  value={inputStartDate} 
                  onChange={(e) => setInputStartDate(e.target.value)} 
                  className="flex-1 p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all" 
                />
                <span className="text-gray-400">~</span>
                <input 
                  type="date" 
                  value={inputEndDate} 
                  onChange={(e) => setInputEndDate(e.target.value)} 
                  className="flex-1 p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all" 
                />
                <button
                  onClick={handleDateApply}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  조회
                </button>
              </div>
              <div className="text-xs text-gray-400 text-right">원하는 기간을 직접 선택하세요</div>
            </div>
          </div>

          <div className="card h-40 flex flex-col justify-between shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <h3 className="text-gray-500 font-medium text-sm flex items-center gap-2">
                <BookmarkSimple size={18} /> 플랫폼 필터
              </h3>
            </div>
            <div>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-gray-700 bg-gray-50 focus:bg-white cursor-pointer transition-all"
               >
                {filteredPlatforms.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-400 mt-2 text-right">특정 커뮤니티 반응만 모아보기</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:h-80 w-full">
          
          <div className="card lg:col-span-1 flex flex-col min-h-[280px] lg:min-h-0 relative overflow-hidden">
            <div className="card-header flex justify-between items-center">
              <h3 className="section-title">
                <ChartLineUp className="text-indigo-500" /> 언급량 추이
              </h3>
              {showMoreChartBtn && (
                <button
                  onClick={() => setIsChartModalOpen(true)}
                  className="text-xs flex items-center gap-1 text-gray-400 hover:text-indigo-600 font-medium transition-colors bg-gray-50 px-2 py-1 rounded hover:bg-indigo-50"
                >
                  더보기 <ArrowsOutSimple size={12} />
                </button>
              )}
            </div>
            <div className="flex-1 w-full min-h-0 relative">
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-10 flex flex-col items-center justify-center animate-fade-in">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                  <span className="text-indigo-600 font-bold animate-pulse text-lg">분석중...</span>
                </div>
              )}

              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart 
                  data={mainChartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    dy={10}
                    interval={0} 
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={chartDataKey}
                    stroke="#4F46E5"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card flex flex-col min-h-[260px] lg:min-h-0 relative overflow-hidden">
            <h3 className="section-title card-header">
              <BookmarkSimple className="text-yellow-500" /> 워드 클라우드
            </h3>
            <div className="flex-1 flex flex-wrap content-center justify-center gap-2 overflow-hidden relative">
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-10 flex flex-col items-center justify-center animate-fade-in">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                  <span className="text-indigo-600 font-bold animate-pulse text-lg">분석중...</span>
                </div>
              )}
              <SimpleWordCloud words={filteredData.wordCloud} />
            </div>
          </div>

          <div className="card flex flex-col min-h-[260px] lg:min-h-0 relative overflow-hidden">
            <h3 className="section-title card-header flex items-baseline gap-2">
              <div className="flex items-center gap-1">
                <BookmarkSimple className="text-yellow-500" /> 여론 분석
              </div>
              <span className="text-[11px] font-normal text-gray-400 tracking-tight">
                * 해당 반응 선택시 댓글 확인 가능
              </span>
            </h3>
            <div className="flex-1 relative">
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-10 flex flex-col items-center justify-center animate-fade-in">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                  <span className="text-indigo-600 font-bold animate-pulse text-lg">분석중...</span>
                </div>
              )}

              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie 
                    data={sentimentChartData} 
                    cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={5} dataKey="value"
                    onClick={handleSentimentClick}
                    style={{ cursor: 'pointer' }}
                  >
                    {sentimentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}건`, name]} />
                  <Legend 
                    verticalAlign="bottom" height={24} iconSize={8} 
                    onClick={handleSentimentClick}
                    wrapperStyle={{ cursor: 'pointer' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start w-full">
          
          <div className="flex flex-col h-full w-full gap-4">
            
            <div className="flex justify-between items-end pb-2 border-b-2 border-gray-200 px-1">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  관련 댓글 반응
                </h2>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                  커뮤니티 및 미디어 주요 여론
                </p>
              </div>
              
              {/* 백엔드에서 전달받은 실제 전체 데이터 개수를 출력합니다. */}
              <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full shadow-sm border border-indigo-100 whitespace-nowrap">
                총 {displayTotalCount}건
              </span>
            </div>

            <div className="card h-fit flex flex-col">
              <div ref={commentsTopRef} />

              <div className="space-y-4 flex-1">
                {currentUsageExamples?.length > 0 ? (
                  currentUsageExamples.map((comment, i) => {
                    const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + i + 1;
                    const uniqueId = comment.id || `comment-${globalIndex}`;
                    const isRevealed = revealedCommentIds.has(uniqueId);

                    return (
                      <CommentItem 
                        key={i} 
                        comment={comment} 
                        globalIndex={globalIndex}
                        keyword={keyword}
                        isIndividualFilter={true} 
                        isPersonKeyword={isPersonKeyword}
                        isRevealed={isRevealed}
                        onReveal={() => handleRevealComment(uniqueId)}
                      />
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-gray-400">데이터가 없습니다.</div>
                )}
              </div>

              {/* 메인 리스트 페이지네이션 */}
              {(totalPages > 1 || hasMoreComments) && (
                <div className="flex flex-wrap justify-center items-center gap-1.5 mt-6 pt-4 border-t border-gray-100">
                  
                  {/* << 이전 10페이지 (이전 그룹) */}
                  <button
                    onClick={handlePrevGroupClick}
                    disabled={!hasPrevGroup}
                    className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    aria-label="이전 10페이지"
                  >
                    <CaretDoubleLeft size={16} weight="bold" />
                  </button>

                  {/* < 이전 1페이지 */}
                  <button
                    onClick={handlePrevClick}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    aria-label="이전 페이지"
                  >
                    <CaretLeft size={16} weight="bold" />
                  </button>

                  <div className="flex items-center gap-1.5 mx-1 sm:mx-2">
                    {visiblePages.map((pageNum) => {
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium transition-all
                            ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-indigo-600'}`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* > 다음 1페이지 */}
                  <button
                    onClick={handleNextClick}
                    disabled={currentPage === totalPages && !hasMoreComments}
                    className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    aria-label="다음 페이지"
                  >
                    {isLoadingMore && currentPage === totalPages ? (
                      <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    ) : (
                      <CaretRight size={16} weight="bold" />
                    )}
                  </button>

                  {/* >> 다음 10페이지 (다음 그룹) 버튼 */}
                  {hasNextGroup && (
                    <button
                      onClick={handleNextGroupTextClick}
                      disabled={isLoadingMore}
                      className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      aria-label="다음 10페이지"
                    >
                      {isLoadingMore ? (
                        <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      ) : (
                        <CaretDoubleRight size={16} weight="bold" />
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col h-full w-full gap-4">
            
            <div className="flex justify-between items-end pb-2 border-b-2 border-gray-200 px-1">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  종합 트렌드 인사이트
                </h2>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                  AI 요약 및 주요 뉴스, 미디어 반응 종합 리포트
                </p>
              </div>
              
              <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full shadow-sm border border-indigo-100 whitespace-nowrap">
                {baseDateText}
              </span>
            </div>

            <div className="card h-fit flex flex-col space-y-8">
              
              <div>
                <h3 className="section-title mb-4 pb-2 border-b">
                  AI 트렌드 요약
                </h3>
                <div className="ai-summary-box p-4 bg-indigo-50 rounded-xl border-l-4 border-indigo-500 text-sm text-gray-700 leading-relaxed">
                  {isAiLoading ? (
                    <div className="flex flex-col items-center justify-center py-4 gap-3">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                      </div>
                      <span className="text-xs text-indigo-400 font-medium animate-pulse">
                        AI가 데이터를 분석하여 리포트를 작성 중입니다...
                      </span>
                    </div>
                  ) : (
                    aiSummary ? (
                      <div className="animate-fade-in-up">
                          <div 
                            className="ai-summary-content mb-2 pl-2 border-l-2 border-indigo-200 text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: aiSummary }} 
                          />
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center text-xs">키워드를 분석할 준비가 되었습니다.</p>
                    )
                  )}
                </div>
              </div>

              <div>
                <h3 className="section-title mb-4 pb-2 border-b">
                  관련 뉴스
                </h3>
                <div className="space-y-3">
                  {news?.length > 0 ? (
                    news.map((item, idx) => (
                      <a
                        key={idx}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="row-hover border border-transparent hover:border-gray-100"
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-gray-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                            {item.title}
                          </p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2 mt-0.5">
                            {new Date(item.pubDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="badge bg-gray-100 text-gray-500">{item.source}</span>
                        </div>
                      </a>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">관련 뉴스가 없습니다.</div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="section-title mb-4 border-b pb-2 flex items-center gap-2">
                  관련 유튜브 반응
                </h3>
                <div className="space-y-4">
                  {filteredData.videos && filteredData.videos.length > 0 ? (
                    filteredData.videos.slice(0, 3).map((video) => (
                      <a
                        key={video.id}
                        href={video.views === 0 ? '#' : `https://www.youtube.com/watch?v=${encodeURIComponent(String(video.id || ''))}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 group cursor-pointer"
                      >
                        <div className="w-full sm:w-32 h-44 sm:h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                          <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                          {video.views > 0 && (
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">Video</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition leading-snug">
                            {video.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                            <span className="truncate">{video.channel}</span>
                            {video.views > 0 && <span>• 조회수 {formatViews(video.views)}</span>}
                          </div>
                        </div>
                      </a>
                    ))
                  ) : (
                    <div className="text-gray-400 text-sm py-4 text-center bg-gray-50 rounded-lg">
                      관련 유튜브 영상을 찾을 수 없습니다.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {!isLoggedIn ? (
        <div className="absolute inset-x-0 top-[25vh] sm:top-[30vh] z-50 flex items-start justify-center px-4">
          <div className="p-8 sm:p-10 rounded-3xl border border-gray-200 bg-white shadow-2xl text-center max-w-md w-full">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-5">
              <LockKey size={32} weight="fill" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">로그인이 필요한 서비스입니다</h2>
            <p className="text-gray-500 mb-8 leading-relaxed text-sm sm:text-base">
              키워드 심층 분석 및 상세 데이터는<br />
              가입 회원에게만 제공되고 있습니다.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-base sm:text-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-1"
            >
              로그인하고 분석결과 보기
            </button>
          </div>
        </div>
      ) : !keyword ? (
        <div className="absolute inset-x-0 top-[25vh] sm:top-[30vh] z-50 flex justify-center px-4 pointer-events-none">
          <div className="analysis-empty-state-card p-5 sm:p-8 rounded-3xl border border-gray-200 bg-white/95 backdrop-blur-sm shadow-xl text-center w-full max-w-md pointer-events-auto animate-fade-in">
            <div className="analysis-empty-icon w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="analysis-empty-title text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              분석할 키워드를 입력해주세요
            </h2>
            <p className="analysis-empty-desc text-gray-500 text-sm sm:text-base">
              바로 위 상단 검색창에 검색어를 입력하면
              <br />
              빅데이터 분석 리포트가 즉시 생성됩니다.
            </p>
          </div>
        </div>
      ) : null}

      {/* ======================================================= */}
      {/* 3가지 모달: z-[9999] 및 createPortal 적용으로 여백 문제 해결 */}
      {/* ======================================================= */}
      
      {/* 1. 차트 확대 모달 */}
      {isChartModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ChartLineUp className="text-indigo-600" /> 전체 기간 언급량 추이
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredData?.history?.[0]?.date && formatDateForInput(filteredData.history[0].date)} ~ {filteredData?.history?.at(-1)?.date && formatDateForInput(filteredData.history.at(-1).date)} ({filteredData?.history?.length}일간 데이터)
                </p>
              </div>
              <button 
                onClick={() => setIsChartModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 p-6 bg-gray-50/50">
              <div className="w-full h-full bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData?.history}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateLabel}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      dy={10}
                      minTickGap={30}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                      itemStyle={{ color: '#4F46E5', fontWeight: 'bold' }}
                    />
                    <Line
                      type="monotone"
                      dataKey={chartDataKey}
                      stroke="#4F46E5"
                      strokeWidth={3}
                      dot={{r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff'}}
                      activeDot={{ r: 6, fill: '#4F46E5' }}
                      animationDuration={1000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 2. 여론 분석 (긍정/부정/중립) 댓글 모달 */}
      {sentimentModalConfig.isOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden relative">
            
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white z-20">
              <div className="flex items-baseline gap-3">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  {sentimentModalConfig.sentiment === 'positive' && <span className="text-blue-500">긍정</span>}
                  {sentimentModalConfig.sentiment === 'negative' && <span className="text-red-500">부정</span>}
                  {sentimentModalConfig.sentiment === 'neutral' && <span className="text-gray-500">중립</span>}
                  <span className="text-gray-800">댓글 반응</span>
                </h3>
                {/* ❌ 기존 코드: 총 {sentimentModalComments.length}건 */}
                {/* ✅ 수정된 코드: 총 {displayModalTotalCount}건 */}
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 hidden sm:inline-block">
                  총 {displayModalTotalCount}건
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {sentimentModalConfig.sentiment === 'negative' && !isPersonKeyword && (
                  <button
                    onClick={() => setIsNegativeRevealed(!isNegativeRevealed)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all border ${
                      isNegativeRevealed 
                         ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                        : 'bg-white text-gray-500 border-gray-300 hover:border-red-400 hover:text-red-500 shadow-sm'
                    }`}
                  >
                    {isNegativeRevealed ? '부정 댓글 가리기' : '부정 댓글 전체 보기 동의'}
                  </button>
                )}

                <button 
                  onClick={() => setSentimentModalConfig({ isOpen: false, sentiment: null })}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto bg-gray-50/50 relative">
              <div ref={modalCommentsTopRef} /> {/* 모달 스크롤 탑 위치 */}

              {sentimentModalConfig.sentiment === 'negative' && isPersonKeyword ? (
                <div className="flex flex-col items-center justify-center py-20 text-center h-full">
                  <LockKey size={48} className="mb-4 text-gray-300" weight="fill" />
                  <h4 className="text-lg font-bold text-gray-700 mb-2">인물 관련 부정 댓글 비공개</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    사이트 정책상 인물에 대한 부정 댓글은 공개되지 않습니다.
                  </p>
                </div>
              ) : (
                <div className="relative h-full flex flex-col">
                  
                  {sentimentModalConfig.sentiment === 'negative' && !isPersonKeyword && !isNegativeRevealed && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pt-10">
                      <span className="bg-white/90 backdrop-blur-sm px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 shadow-sm border border-gray-200">
                        우측 상단의 <strong className="text-red-500">동의 버튼</strong>을 누르시면 확인할 수 있습니다.
                      </span>
                    </div>
                  )}

                  <div className={`space-y-4 transition-all duration-300 flex-1 ${
                    sentimentModalConfig.sentiment === 'negative' && !isNegativeRevealed 
                      ? 'pointer-events-none select-none opacity-40 blur-[3px]' 
                      : ''
                  }`}>
                    {currentModalComments.length > 0 ? (
                      currentModalComments.map((comment, idx) => {
                        const globalIndex = (modalCurrentPage - 1) * MODAL_ITEMS_PER_PAGE + idx + 1;
                        const uniqueId = comment.id || `modal-comment-${globalIndex}`;
                        
                        // ✅ 수정됨: 상단 '전체 보기 동의(isNegativeRevealed)'를 눌렀다면 모두 true로 전달되도록 추가
                        const isRevealed = isNegativeRevealed || revealedCommentIds.has(uniqueId);

                        return (
                          <CommentItem 
                            key={idx} 
                            comment={comment} 
                            globalIndex={globalIndex}
                            keyword={keyword} 
                            isIndividualFilter={true} 
                            isPersonKeyword={isPersonKeyword}
                            isRevealed={isRevealed}
                            onReveal={() => handleRevealComment(uniqueId)}
                          />
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                        <BookmarkSimple size={32} className="mb-3 text-gray-300" />
                        <p>해당 반응에 분류된 댓글이 없습니다.</p>
                      </div>
                    )}
                  </div>

                  {/* 모달 전용 페이지네이션 컴포넌트 */}
                  {(modalTotalPages > 1 || hasMoreComments) && (
                    <div className="flex flex-wrap justify-center items-center gap-1.5 mt-6 pt-4 border-t border-gray-200 pb-2">
                      
                      {/* << 이전 10페이지 */}
                      <button
                        onClick={handleModalPrevGroupClick}
                        disabled={!modalHasPrevGroup}
                        className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <CaretDoubleLeft size={16} weight="bold" />
                      </button>

                      {/* < 이전 1페이지 */}
                      <button
                        onClick={handleModalPrevClick}
                        disabled={modalCurrentPage === 1}
                        className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <CaretLeft size={16} weight="bold" />
                      </button>

                      <div className="flex items-center gap-1.5 mx-1 sm:mx-2">
                        {modalVisiblePages.map((pageNum) => {
                          const isActive = pageNum === modalCurrentPage;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToModalPage(pageNum)}
                              className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium transition-all
                                ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-indigo-600'}`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      {/* > 다음 1페이지 */}
                      <button
                        onClick={handleModalNextClick}
                        disabled={modalCurrentPage === modalTotalPages && !hasMoreComments}
                        className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        {isLoadingMore && modalCurrentPage === modalTotalPages ? (
                          <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        ) : (
                          <CaretRight size={16} weight="bold" />
                        )}
                      </button>

                      {/* >> 다음 10페이지 */}
                      {modalHasNextGroup && (
                        <button
                          onClick={handleModalNextGroupTextClick}
                          disabled={isLoadingMore}
                          className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                          {isLoadingMore ? (
                            <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                          ) : (
                            <CaretDoubleRight size={16} weight="bold" />
                          )}
                        </button>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 3. 정보 수정 제보 모달 */}
      {isEditModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden relative">
            
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <WarningCircle size={24} className="text-orange-500" weight="fill" />
                정보 수정 제보
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleEditRequestSubmit} className="p-5 bg-gray-50/50">
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                현재 분석된 <strong className="text-indigo-600">'{keyword}'</strong> 데이터 중 누락되었거나 수정이 필요한 부분이 있다면 편하게 남겨주세요.
              </p>
              
              <textarea
                value={editRequestText}
                onChange={(e) => setEditRequestText(e.target.value)}
                placeholder="예) 특정 커뮤니티의 반응이 키워드와 다릅니다. / 여론 분석이 부정확한 것 같습니다."
                className="w-full h-32 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-sm resize-none mb-6 bg-white transition-all shadow-inner"
                autoFocus
              ></textarea>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-md"
                >
                  의견 제출하기
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div> // 최상위 page 감싸는 div
  );
};

export default AnalysisPage;                    