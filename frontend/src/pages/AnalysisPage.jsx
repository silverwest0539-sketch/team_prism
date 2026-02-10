// src/pages/AnalysisPage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
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

const DUMMY_DATA = {
  rank: '-',
  score: 0,
  totalMentions: 0,
  history: [
    { date: '20240101', mentions: 20 },
    { date: '20240102', mentions: 40 },
    { date: '20240103', mentions: 30 },
    { date: '20240104', mentions: 70 },
    { date: '20240105', mentions: 50 },
    { date: '20240106', mentions: 90 },
  ],
  comments: [],
};

const PLATFORM_OPTIONS = [
  { label: '전체 플랫폼', value: 'all' },
  { label: '유튜브', value: 'youtube' },
  { label: '더쿠', value: 'theqoo' },
  { label: '디시인사이드', value: 'dc' },
  { label: '루리웹', value: 'ruliweb' },
  { label: '네이트판', value: 'nate' },
  { label: 'FM코리아', value: 'fmkorea' },
  { label: 'X (트위터)', value: 'x_trends' },
];

const InfoCard = ({ title, value, subText, color }) => (
  <div className="card relative overflow-hidden group card-hover h-40">
    <div className={`absolute top-0 right-0 p-4 opacity-10 ${color}`}></div>
    <div className="flex justify-between items-start z-10">
      <h3 className="text-gray-500 font-medium text-sm">{title}</h3>
      <div className={`p-2 rounded-lg bg-gray-50 ${color.replace('text-', 'text-opacity-80 text-')}`}></div>
    </div>
    <div className="z-10">
      <div className="text-3xl font-bold text-gray-800 mb-1">{value}</div>
      <div className="text-xs text-gray-400">{subText}</div>
    </div>
  </div>
);

const SENTIMENT_DATA = [
  { name: '긍정', value: 65, color: '#4F46E5' },
  { name: '중립', value: 25, color: '#9CA3AF' },
  { name: '부정', value: 10, color: '#EF4444' },
];

// 간단한 워드클라우드 컴포넌트 (외부 라이브러리 없이 구현)
const SimpleWordCloud = ({ words }) => {
  if (!words || words.length === 0)
    return <div className="flex justify-center items-center h-full text-gray-400 text-sm">데이터 부족</div>;

  const maxVal = Math.max(...words.map((w) => w.value));
  const minVal = Math.min(...words.map((w) => w.value));

  const getFontSize = (val) => {
    if (maxVal === minVal) return 16;
    return 12 + ((val - minVal) / (maxVal - minVal)) * 14;
  };

  const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6'];

  return (
    <div className="flex flex-wrap gap-2 justify-center content-center h-full p-4 overflow-hidden">
      {words.slice(0, 15).map((w, i) => (
        <span
          key={i}
          style={{
            fontSize: `${getFontSize(w.value)}px`,
            color: colors[i % colors.length],
            opacity: 0.8 + (w.value / maxVal) * 0.2,
          }}
          className="font-bold cursor-default hover:scale-110 transition-transform duration-200 whitespace-nowrap"
          title={`${w.value}회 언급`}
        >
          {w.text}
        </span>
      ))}
    </div>
  );
};

// --- Ellipsis Pagination Helper ---
const DOTS = 'dots';

function getPaginationItems(currentPage, totalPages, siblingCount = 1) {
  if (totalPages <= 1) return [1];

  // 전체 페이지가 적으면 그대로 출력
  const maxVisible = 2 * siblingCount + 5; // 1, ..., (siblings), ..., last
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 2);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages - 1);

  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < totalPages - 1;

  const items = [1];

  if (showLeftDots) items.push(DOTS);

  for (let p = leftSibling; p <= rightSibling; p++) items.push(p);

  if (showRightDots) items.push(DOTS);

  items.push(totalPages);

  return items;
}

const AnalysisPage = () => {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword');
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [news, setNews] = useState([]);

  // ✅ 페이지네이션(7개 고정)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  const commentsTopRef = useRef(null);

  // 데이터 불러오기
  const fetchData = (currentStart, currentEnd) => {
    if (!keyword) return;

    setLoading(true);

    let query = `keyword=${keyword}`;
    if (currentStart) query += `&startDate=${currentStart}`;
    if (currentEnd) query += `&endDate=${currentEnd}`;

    Promise.all([
      fetch(`http://localhost:5000/api/analysis?${query}`).then((res) => res.json()),
      fetch(`http://localhost:5000/api/news?${query}`).then((res) => res.json()),
    ])
      .then(([analysisData, newsData]) => {
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
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  // 초기 로드 (키워드 변경 시)
  useEffect(() => {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    fetchData('', '');
  }, [keyword]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/analysis?keyword=${searchTerm}`);
    }
  };

  const handleDateApply = () => {
    fetchData(startDate, endDate);
    setCurrentPage(1);
  };

  // 데이터 필터링
  const filteredData = useMemo(() => {
    const sourceData = data || DUMMY_DATA;

    if (!data) {
      return {
        ...sourceData,
        history: sourceData.history,
        comments: [],
        youtubeComments: [],
        otherComments: [],
        wordCloud: [],
        videos: [],
      };
    }

    const historyFiltered = data.history.filter((h) => {
      const d = formatDateForInput(h.date);
      return (!startDate || d >= startDate) && (!endDate || d <= endDate);
    });

    // ✅ 플랫폼 필터를 comments에 반영
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
      youtubeComments: youtubeComments.slice(0, 4),
      otherComments: otherComments.slice(0, 6),
      wordCloud: data.wordCloud || [],
      videos: data.videos || [],
    };
  }, [data, startDate, endDate, selectedPlatform]);

  // 오른쪽: 실제 사용 사례 (모든 텍스트 댓글)
  const usageExamples = useMemo(() => {
    if (!filteredData?.comments) return [];
    return filteredData.comments;
  }, [filteredData]);

  // 페이지네이션 계산
  const totalItems = usageExamples.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  // currentPage가 totalPages보다 커지는 케이스 방어(플랫폼 변경 등)
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
    // UX: 페이지 변경 시 리스트 상단으로
    requestAnimationFrame(() => {
      commentsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="page space-y-6">
      {/* 상단 헤더 */}
      <header className="flex justify-between items-center mb-4">
        <Link to="/home" className="mr-4 p-2 bg-white rounded-full text-gray-500 hover:text-indigo-600 shadow-sm transition">
          <CaretLeft size={20} />
        </Link>

        <SearchBar
          placeholder="분석하고 싶은 키워드 검색 (예: 쿠팡)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearch}
          className="search-input"
        />

        <div className="flex items-center gap-4">
          <button className="icon-btn icon-btn-hover">
            <Bell size={24} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white shadow-sm"></div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div
        className={`container-7xl transition-all duration-500 ease-in-out flex flex-col gap-8 ${
          !keyword ? 'blur-disabled' : 'blur-enabled'
        }`}
      >
        {/* 타이틀 */}
        <div className="flex justify-between items-end mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-3">
              {keyword || '검색 키워드 예시'}
              <span className="pill bg-indigo-50 text-indigo-600">#{filteredData.rank || '-'}위</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-outline">
              <Export size={16} /> 내보내기
            </button>
          </div>
        </div>

        {/* 정보 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard
            title="트렌드 스코어"
            value={`${filteredData.score?.toFixed(1) || 0}점`}
            subText="전일 대비 12% 상승 ▲"
            color="text-indigo-600"
          />

          <div className="card h-40 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <h3 className="text-gray-500 font-medium text-sm">분석 기간</h3>
              <div className="p-2 rounded-lg bg-green-50 text-green-600">
                <ArrowsClockwise size={20} weight="fill" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-1">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="date-input" />
                ~
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="date-input" />
                <button
                  onClick={handleDateApply}
                  className="bg-white hover:bg-indigo-50 text-indigo-600 border border-gray-200 hover:border-indigo-200 text-xs px-2 py-1 rounded shadow-sm transition-all"
                >
                  조회
                </button>
              </div>
              <div className="text-xs text-gray-400">직접 기간 설정 가능</div>
            </div>
          </div>

          <div className="card h-40 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <h3 className="text-gray-500 font-medium text-sm">플랫폼 선택</h3>
            </div>
            <div>
              <select
                className="select"
                value={selectedPlatform}
                onChange={(e) => {
                  setSelectedPlatform(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-80">
          <div className="card lg:col-span-1 flex flex-col">
            <div className="card-header flex justify-between items-center">
              <h3 className="section-title">
                <ChartLineUp className="text-indigo-500" /> 언급량 추이
              </h3>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData?.history}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mentions"
                    stroke="#4F46E5"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card flex flex-col">
            <h3 className="section-title card-header">
              <BookmarkSimple className="text-yellow-500" /> 워드 클라우드
            </h3>
            <div className="flex-1 flex flex-wrap content-center justify-center gap-2 overflow-hidden">
              <SimpleWordCloud words={filteredData.wordCloud} />
            </div>
          </div>

          <div className="card flex flex-col">
            <h3 className="section-title card-header">
              <BookmarkSimple className="text-yellow-500" /> 여론 분석
            </h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={SENTIMENT_DATA} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={5} dataKey="value">
                    {SENTIMENT_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={24} iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 하단 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* 왼쪽 */}
          <div className="card">
            <h3 className="section-title mb-4 pb-2 border-b flex justify-between">
              <span>AI 트렌드 요약</span>
              <span className="text-xs font-normal text-gray-400 mt-1">Updated 10m ago</span>
            </h3>
            <div className="p-4 bg-indigo-50 rounded-xl border-l-4 border-indigo-500 text-sm text-gray-700 leading-relaxed mb-6">
              <strong>"{keyword}"</strong>에 대한 분석 결과, 최근 다양한 채널을 중심으로 긍정적인 반응이 확산되고 있습니다.
              특히 '가성비'와 '디자인' 키워드가 함께 언급되는 빈도가 높습니다.
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
                      href={video.views === 0 ? '#' : `https://www.youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex gap-4 group cursor-pointer"
                    >
                      <div className="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
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
                          <span className="truncate max-w-[100px]">{video.channel}</span>
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

          {/* 오른쪽: 실제 사용 사례 (커뮤니티) */}
          <div className="card h-fit flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="section-title">실제 사용 사례 (커뮤니티)</h3>
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">총 {totalItems}건</span>
            </div>

            <div ref={commentsTopRef} />

            <div className="space-y-4 flex-1">
              {currentUsageExamples?.length > 0 ? (
                currentUsageExamples.map((comment, i) => {
                  const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + i + 1;

                  return (
                    <div key={i} className="group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-gray-700">
                          반응 {globalIndex}{' '}
                          <span className="text-xs font-normal text-gray-400 ml-1">({comment.source})</span>
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Star size={14} className="text-gray-400 hover:text-yellow-400 cursor-pointer" />
                          <Copy size={14} className="text-gray-400 hover:text-indigo-600 cursor-pointer" />
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 leading-relaxed border border-transparent group-hover:border-indigo-100 group-hover:bg-indigo-50/30 transition-all">
                        "{comment.text}"
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-gray-400">데이터가 없습니다.</div>
              )}
            </div>

            {/* Ellipsis Pagination */}
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
        <div className="overlay-center top-24">
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white/50 text-center transform translate-y-[-10%]">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">분석할 키워드를 입력해주세요</h2>
            <p className="text-gray-500">
              상단 검색창에 검색어를 입력하면
              <br />
              빅데이터 분석 리포트가 즉시 생성됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;