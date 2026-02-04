// src/pages/AnalysisPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Bell, ArrowsClockwise, BookmarkSimple, Export, PlayCircle, CaretLeft,
  ChartLineUp, Newspaper, Star, Copy
} from '@phosphor-icons/react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// 공통 컴포넌트
import SearchBar from '../components/common/SearchBar';

// 유틸리티
import { formatDateLabel, formatDateForInput } from '../utils/formatters';

const DUMMY_DATA = {
  rank: '-',
  score: 0,
  totalMentions: 0,
  history: [
    { date: '20240101', mentions: 20 }, { date: '20240102', mentions: 40 },
    { date: '20240103', mentions: 30 }, { date: '20240104', mentions: 70 },
    { date: '20240105', mentions: 50 }, { date: '20240106', mentions: 90 },
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

const WORD_CLOUD_DATA = [
  { text: "가성비", size: "text-2xl", color: "text-blue-600" },
  { text: "추천", size: "text-lg", color: "text-gray-600" },
  { text: "디자인", size: "text-xl", color: "text-indigo-500" },
  { text: "배송", size: "text-sm", color: "text-green-500" },
  { text: "선물", size: "text-3xl", color: "text-purple-600" },
  { text: "가격", size: "text-2xl", color: "text-gray-700" },
];

const SENTIMENT_DATA = [
  { name: '긍정', value: 65, color: '#4F46E5' },
  { name: '중립', value: 25, color: '#9CA3AF' },
  { name: '부정', value: 10, color: '#EF4444' },
];

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

  // 데이터 불러오기
  useEffect(() => {
    if (!keyword) {
      setData(null);
      setNews([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    Promise.all([
      fetch(`http://localhost:5000/api/analysis?keyword=${keyword}`).then(res => res.json()),
      fetch(`http://localhost:5000/api/news?keyword=${keyword}`).then(res => res.json())
    ])
      .then(([analysisResult, newsResult]) => {
        if (analysisResult.found) {
          setData(analysisResult);
          if (analysisResult.history && analysisResult.history.length > 0) {
            setStartDate(formatDateForInput(analysisResult.history[0].date));
            setEndDate(formatDateForInput(analysisResult.history[analysisResult.history.length - 1].date));
          }
        } else {
          setData(null);
        }

        setNews(newsResult || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [keyword]);

  // 검색 핸들러
  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/analysis?keyword=${searchTerm}`);
    }
  };

  // 데이터 필터링
  const filteredData = useMemo(() => {
    const sourceData = data || DUMMY_DATA;

    if (!data) return {
      ...sourceData,
      history: sourceData.history,
      youtubeComments: [],
      otherComments: []
    };

    const historyFiltered = data.history.filter(h => {
      const d = formatDateForInput(h.date);
      return d >= startDate && d <= endDate;
    });

    let allComments = sourceData.comments || [];
    if (selectedPlatform !== 'all') {
      allComments = allComments.filter(c => c.source.includes(selectedPlatform));
    }

    const youtubeComments = data.comments.filter(c => c.source.includes('youtube'));
    const otherComments = data.comments.filter(c => !c.source.includes('youtube'));

    return {
      ...data,
      history: historyFiltered,
      youtubeComments: youtubeComments.slice(0, 4),
      otherComments: otherComments.slice(0, 6)
    };
  }, [data, startDate, endDate, selectedPlatform]);

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
      <div className={`container-7xl transition-all duration-500 ease-in-out flex flex-col gap-8 ${!keyword ? 'blur-disabled' : 'blur-enabled'
        }`}>

        {/* 타이틀 */}
        <div className="flex justify-between items-end mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-3">
              {keyword || "검색 키워드 예시"}
              <span className="pill bg-indigo-50 text-indigo-600">
                #{filteredData.rank || '-'}위
              </span>
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
                onChange={(e) => setSelectedPlatform(e.target.value)}
              >
                {PLATFORM_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                  <XAxis dataKey="date" tickFormatter={formatDateLabel} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="mentions" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card flex flex-col">
            <h3 className="section-title card-header">
              <BookmarkSimple className="text-yellow-500" /> 워드 클라우드
            </h3>
            <div className="flex-1 flex flex-wrap content-center justify-center gap-2 overflow-hidden">
              {WORD_CLOUD_DATA.map((w, i) => (
                <span key={i} className={`${w.size} ${w.color} font-bold opacity-80`}>{w.text}</span>
              ))}
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
                    {SENTIMENT_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={24} iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 하단 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            <h3 className="section-title mb-4 pb-2 border-b mt-6">
              <PlayCircle size={20} className="text-red-500" /> 관련 유튜브 반응
            </h3>
            <div className="space-y-3">
              {filteredData?.youtubeComments?.length > 0 ? (
                filteredData.youtubeComments.map((comment, i) => (
                  <div key={i} className="flex items-start gap-3 row-hover">
                    <div className="thumb">Thumbnail</div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                        "{comment.text}"
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>Youtube</span> • <span>조회수 {Math.floor(Math.random() * 100)}만회</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">관련 유튜브 영상이 없습니다.</div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="section-title mb-4 pb-2 border-b">실제 사용 사례 (커뮤니티)</h3>
            <div className="space-y-4">
              {filteredData?.otherComments?.length > 0 ? (
                filteredData.otherComments.map((comment, i) => (
                  <div key={i} className="group">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-gray-700">
                        반응 {i + 1} <span className="text-xs font-normal text-gray-400 ml-1">({comment.source})</span>
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
                ))
              ) : (
                <div className="text-center py-10 text-gray-400">데이터가 없습니다.</div>
              )}
            </div>
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
              상단 검색창에 검색어를 입력하면<br />
              빅데이터 분석 리포트가 즉시 생성됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;