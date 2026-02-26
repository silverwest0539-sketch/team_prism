// src/pages/AnalysisPage.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  ArrowsClockwise,
  BookmarkSimple,
  Export,
  PlayCircle,
  CaretLeft,
  CaretRight,
  ChartLineUp,
  Newspaper,
  Star,
  Copy,
  X, 
  ArrowsOutSimple,
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
import { DOTS, getPaginationItems } from '../utils/analysisPagination';

const getFormattedDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AnalysisPage = () => {
  const { keyword: pathKeyword } = useParams();
  const [searchParams] = useSearchParams();
  const keyword = pathKeyword || searchParams.get('keyword');
  const navigate = useNavigate();

  const initialToday = new Date();
  const initialYesterday = new Date(initialToday);
  initialYesterday.setDate(initialYesterday.getDate() - 1);

  // 기존 State
  const [data, setData] = useState(null);
  const [, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(getFormattedDate(initialYesterday));
  const [endDate, setEndDate] = useState(getFormattedDate(initialToday));
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [news, setNews] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isScrapped, setIsScrapped] = useState(false);

  // 차트 확대 모달 상태 추가
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;
  const commentsTopRef = useRef(null);

  // 데이터 불러오기
  const fetchData = useCallback(async (currentStart, currentEnd) => {
    if (!keyword) return;

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
        if (!currentStart && analysisData.history?.length > 0) {
          setStartDate(formatDateForInput(analysisData.history[0].date));
          setEndDate(formatDateForInput(analysisData.history[analysisData.history.length - 1].date));
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
  }, [keyword]);

  const fetchAiSummary = useCallback(async (targetKeyword, start, end) => {
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
  }, []);

  useEffect(() => {
    if (!keyword) return;

    setAiSummary(null);
    setIsAiLoading(true);
    const todayDate = getFormattedDate(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = getFormattedDate(yesterday);

    setStartDate(yesterdayDate);
    setEndDate(todayDate);
    setCurrentPage(1);
    
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
  }, [keyword, fetchData, fetchAiSummary]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      // 1. 페이지 이동
      navigate(`/analysis/${encodeURIComponent(searchTerm.trim())}`);
      
      // 2. [추가] 검색어 입력창 비우기 (자동완성 탭 닫기 위해)
      setSearchTerm(''); 

      // 3. [추가] 입력창 포커스 해제 (커서 깜빡임 없애고 드롭다운 확실히 닫기)
      e.target.blur();
    }
  };

  const handleDateApply = () => {
    fetchData(startDate, endDate);
    setCurrentPage(1);
    // fetchAiSummary(keyword, startDate, endDate);
  };

  const handleDateReset = () => {
    const todayDate = getFormattedDate(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = getFormattedDate(yesterday);

    setStartDate(yesterdayDate);
    setEndDate(todayDate);
    setCurrentPage(1);
    
    fetchData(yesterdayDate, todayDate);
    fetchAiSummary(keyword, yesterdayDate, todayDate);
  };

  const handleScrapToggle = async () => {
    const savedUser = getStoredUser();

    // 로그인이 안 되어 있을 경우 예외 처리
    if (!savedUser?.email) {
      if (
        window.confirm(
          '관심 키워드 저장(스크랩) 기능은 로그인이 필요합니다.\n로그인 페이지로 이동하시겠습니까?'
        )
      ) {
        navigate('/login');
      }
      return;
    }

    try {
      if (isScrapped) {
        // 이미 스크랩된 상태면 삭제 요청
        await apiClient.delete('/scraps', {
          params: { email: savedUser.email, keyword: keyword },
        });
        setIsScrapped(false);
        showToast('스크랩이 취소되었습니다.', { type: 'info' });
      } else {
        // 스크랩 안 된 상태면 추가 요청
        await apiClient.post('/scraps', {
          email: savedUser.email,
          keyword: keyword,
        });
        setIsScrapped(true);
        showToast('관심 키워드로 저장되었습니다.', { type: 'success' });
      }
    } catch (error) {
      console.error(error);
      showToast('스크랩 처리 중 오류가 발생했습니다.', { type: 'error' });
    }
  };

  const handleGoToCreation = () => {
    if (keyword) {
      // 1. 키워드가 있을 경우: URL 쿼리 스트링으로 키워드를 붙여서 이동
      // encodeURIComponent는 한글이나 특수문자가 깨지지 않게 해줍니다.
      navigate(`/creation?keyword=${encodeURIComponent(keyword)}`);
    } else {
      // 2. 키워드가 없을 경우: 그냥 이동
      navigate('/creation');
    }
  };

  // 데이터 필터링 (useMemo)
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
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const historyMap = {};
      
      // 1. 기존 DB에서 가져온 날짜 데이터를 Map 형태로 변환하여 검색 최적화
      (sourceData.history || []).forEach((h) => {
        historyMap[h.date] = h;
      });

      // 2. startDate부터 endDate까지 하루씩 증가하며 모든 날짜 확인
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}${mm}${dd}`; // 예: "20260225"

        if (historyMap[dateStr]) {
          // 데이터가 존재하면 그대로 넣기 (undefined 방지를 위해 데이터가 없으면 0 세팅)
          historyFiltered.push({
            ...historyMap[dateStr],
            [chartDataKey]: historyMap[dateStr][chartDataKey] || 0
          });
        } else {
          // 💡 데이터가 아예 없는 날짜는 언급량을 0으로 설정한 가짜 객체를 삽입
          historyFiltered.push({
            date: dateStr,
            mentions: 0,
            score: 0,
            [chartDataKey]: 0 
          });
        }
      }
    } else {
      historyFiltered = sourceData.history || [];
    }

    // 기존 댓글 필터링 로직 유지
    let allComments = sourceData.comments || [];
    if (selectedPlatform !== 'all') {
      allComments = allComments.filter((c) => (c?.source || '').includes(selectedPlatform));
    }
    const youtubeComments = (allComments || []).filter((c) => (c?.source || '').includes('youtube'));
    const otherComments = (allComments || []).filter((c) => !(c?.source || '').includes('youtube'));

    return {
      ...data,
      history: historyFiltered,
      comments: allComments,
      chartDataKey,
      youtubeComments: youtubeComments.slice(0, 4),
      otherComments: otherComments.slice(0, 6),
      wordCloud: data.wordCloud || data.word_cloud || [], 
      videos: data.videos || [],
    };
  }, [data, startDate, endDate, selectedPlatform]);

  // 메인 차트용 데이터 가공 (최근 7일만 자르기)
  const { chartDataKey = 'mentions' } = filteredData || {};

  const mainChartData = useMemo(() => {
    const history = filteredData?.history || [];
    // 데이터가 7개보다 많으면 뒤에서 7개만 자름, 아니면 그대로 사용
    return history.length > 7 ? history.slice(-7) : history;
  }, [filteredData]);

  // 더보기 버튼 표시 여부
  const showMoreChartBtn = (filteredData?.history?.length || 0) > 7;

  const sentimentChartData = useMemo(() => {
    const comments = filteredData?.comments || [];
    let pos = 0, neg = 0, neu = 0;

    comments.forEach(c => {
      if (c.sentiment === 'positive') pos++;
      else if (c.sentiment === 'negative') neg++;
      else neu++; // 라벨이 없거나 neutral인 경우
    });

    return [
      { name: '긍정', value: pos, color: '#3B82F6' }, // 파란색
      { name: '부정', value: neg, color: '#EF4444' }, // 빨간색
      { name: '중립', value: neu, color: '#9CA3AF' }, // 회색
    ];
  }, [filteredData]);

  // 페이지네이션 로직
  const usageExamples = useMemo(() => {
    if (!filteredData?.comments) return [];
    return filteredData.comments;
  }, [filteredData]);

  const totalItems = usageExamples.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const currentUsageExamples = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return usageExamples.slice(startIndex, endIndex);
  }, [usageExamples, currentPage]);

  const paginationItems = useMemo(
    () => getPaginationItems(currentPage, totalPages, 1),
    [currentPage, totalPages]
  );

  const goToPage = (p) => {
    setCurrentPage(p);
    requestAnimationFrame(() => {
      commentsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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

  const todayStr = getFormattedDate(new Date()).replace(/-/g, ''); // 예: "20260224"
  const todayData = filteredData?.history?.find(h => h.date === todayStr);
  const todayScore = Math.round(todayData?.score || 0);

  // ---------------- Render ----------------
  return (
    <div className="page space-y-6">
      {/* 상단 헤더 */}
      <header className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-4">
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

      {/* 메인 콘텐츠 */}
      <div
        className={`w-full transition-all duration-500 ease-in-out flex flex-col gap-6 sm:gap-8 ${
          !keyword ? 'blur-disabled' : 'blur-enabled'
        }`}
      >
        {/* 타이틀 및 상단 정보 */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-2">
          
          {/* 왼쪽: 스크랩 + 키워드 + 스코어 (한줄 처리) */}
          <div className="flex items-center gap-3">
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
              <div className="flex items-baseline gap-1 text-gray-600">
                {todayScore > 0 ? (
                  // <span className="text-xs sm:text-sm font-medium">트렌드 스코어</span>,
                  <span className="text-sm sm:text-base font-bold text-indigo-600 ml-1">
                    트렌드 스코어 {todayScore}점
                  </span>
                ) : (
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md ml-1">
                    오늘의 트렌드 키워드가 아닙니다
                  </span>
                )}
              </div>
            </div>
            
            {/* 순위 표시가 필요하다면 여기에 추가 */}
            {/* {filteredData.rank && (
               <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm">
                 #{filteredData.rank}위
               </span>
            )} */}
          </div>
          
          {/* 오른쪽: 콘텐츠 생성 버튼 */}
          <div className="flex gap-2">
             <button 
               onClick={handleGoToCreation}
               className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-1"
             >
               <Export size={20} />
               <span>콘텐츠 생성</span>
             </button>
          </div>
        </div>

        {/* 설정 카드 섹션 (2개) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
          <div className="card h-40 flex flex-col justify-between shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <h3 className="text-gray-500 font-medium text-sm flex items-center gap-2">
                <ArrowsClockwise size={18} /> 분석 기간 설정
              </h3>
              <button 
                  onClick={handleDateReset}
                  className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                  title="전체 기간으로 초기화"
                >
                  <ArrowsClockwise size={16} weight="bold"/>
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="flex-1 p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 transition-all" 
                />
                <span className="text-gray-400">~</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
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

        {/* 차트 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:h-80 w-full">
          
          {/* 언급량 추이 차트 (최근 7일 + 더보기 버튼) */}
          <div className="card lg:col-span-1 flex flex-col min-h-[280px] lg:min-h-0 relative">
            <div className="card-header flex justify-between items-center">
              <h3 className="section-title">
                <ChartLineUp className="text-indigo-500" /> 언급량 추이
              </h3>
              {/* 데이터가 7일 넘을 때만 버튼 표시 */}
              {showMoreChartBtn && (
                <button
                  onClick={() => setIsChartModalOpen(true)}
                  className="text-xs flex items-center gap-1 text-gray-400 hover:text-indigo-600 font-medium transition-colors bg-gray-50 px-2 py-1 rounded hover:bg-indigo-50"
                >
                  더보기 <ArrowsOutSimple size={12} />
                </button>
              )}
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                {/* 7일치 데이터 사용 */}
                <LineChart 
                  data={mainChartData}
                  // [수정] left를 0으로 원상복구하되, right를 30으로 주어 오른쪽 끝 날짜 잘림 방지
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
                    // [수정] 아까 30은 너무 좁아서 잘렸으니, 40 정도로 살짝 여유를 줌 (기본값 60보다는 좁음)
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

          <div className="card flex flex-col min-h-[260px] lg:min-h-0">
            <h3 className="section-title card-header">
              <BookmarkSimple className="text-yellow-500" /> 워드 클라우드
            </h3>
            <div className="flex-1 flex flex-wrap content-center justify-center gap-2 overflow-hidden">
              <SimpleWordCloud words={filteredData.wordCloud} />
            </div>
          </div>

          <div className="card flex flex-col min-h-[260px] lg:min-h-0">
            <h3 className="section-title card-header">
              <BookmarkSimple className="text-yellow-500" /> 여론 분석
            </h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie data={sentimentChartData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={5} dataKey="value">
                    {sentimentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  {/* Tooltip에 건수를 명시적으로 보여주도록 포맷 변경 */}
                  <Tooltip formatter={(value, name) => [`${value}건`, name]} />
                  <Legend verticalAlign="bottom" height={24} iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 하단 영역 (AI, 뉴스, 유튜브, 댓글) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start w-full">
          {/* 왼쪽 컬럼 */}
          <div className="card">
            <h3 className="section-title mb-4 pb-2 border-b flex justify-between">
              <span>AI 트렌드 요약</span>
            </h3>
            <div className="p-4 bg-indigo-50 rounded-xl border-l-4 border-indigo-500 text-sm text-gray-700 leading-relaxed mb-6">
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
                        className="mb-2 pl-2 border-l-2 border-indigo-200 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: aiSummary }} 
                      />
                  </div>
                ) : (
                  <p className="text-gray-400 text-center text-xs">키워드를 분석할 준비가 되었습니다.</p>
                )
              )}
            </div>

            <h3 className="section-title mb-4 pb-2 border-b">
              <Newspaper size={20} className="text-red-500" /> 관련 뉴스
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

            <div className="mt-8">
              <h3 className="section-title mb-4 border-b pb-2 flex items-center gap-2">
                <PlayCircle size={20} className="text-red-500" /> 관련 유튜브 반응
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

          {/* 오른쪽 컬럼 (댓글 리스트) */}
          <div className="card h-fit flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="section-title">관련 댓글 반응</h3>
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">총 {totalItems}건</span>
            </div>

            <div ref={commentsTopRef} />

            <div className="space-y-4 flex-1">
              {currentUsageExamples?.length > 0 ? (
                currentUsageExamples.map((comment, i) => {
                  const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + i + 1;
                  return (
                    <CommentItem 
                      key={i} 
                      comment={comment} 
                      globalIndex={globalIndex}
                      keyword={keyword} 
                    />
                  );
                })
              ) : (
                <div className="text-center py-10 text-gray-400">데이터가 없습니다.</div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-1.5 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => goToPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="이전 페이지"
                >
                  <CaretLeft size={16} weight="bold" />
                </button>

                {paginationItems.map((it, idx) => {
                  if (it === DOTS) {
                    return (
                      <span key={`dots-${idx}`} className="px-2 text-xs text-gray-400 select-none">
                        ...
                      </span>
                    );
                  }
                  const pageNum = it;
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

                <button
                  onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="다음 페이지"
                >
                  <CaretRight size={16} weight="bold" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 키워드 없을 때 오버레이 */}
      {!keyword && (
        <div className="overlay-center top-20 sm:top-24 px-4">
          <div className="bg-white/80 backdrop-blur-md p-5 sm:p-8 rounded-3xl shadow-xl border border-white/50 text-center transform sm:translate-y-[-10%] w-full max-w-md">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">분석할 키워드를 입력해주세요</h2>
            <p className="text-gray-500">
              상단 검색창에 검색어를 입력하면
              <br />
              빅데이터 분석 리포트가 즉시 생성됩니다.
            </p>
          </div>
        </div>
      )}

      {/* 차트 확대 모달 */}
      {isChartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
            {/* 모달 헤더 */}
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

            {/* 모달 차트 바디 (전체 데이터) */}
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
        </div>
      )}

    </div>
  );
};

export default AnalysisPage;
