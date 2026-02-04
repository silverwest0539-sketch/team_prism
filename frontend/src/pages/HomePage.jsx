// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Bell, PlayCircle } from 'lucide-react'; 
import { Link } from 'react-router-dom';

const HomePage = ({ openModal = () => {} }) => {
  
  // 상태 관리
  const [risingKeywords, setRisingKeywords] = useState([]); 
  const [risingContents, setRisingContents] = useState([]); 
  const [selectedPlatform, setSelectedPlatform] = useState('youtube'); 
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [youtubeCategory, setYoutubeCategory] = useState('전체');

  // 드롭다운 열림/닫힘
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 커뮤니티 목록
  const platformLabels = {
    'community': '커뮤니티 전체',
    'dcinside': '디시인사이드',
    'theqoo': '더쿠',
    'natepan': '네이트판',
    'fmkorea': 'fmkorea',
    'ruliweb': '루리웹',
    'x': 'X'
  };

  // 1. 초기 데이터 로드
  useEffect(() => {
    fetch('http://localhost:5000/api/trends/rising')
      .then(res => res.json())
      .then(data => setRisingKeywords(data.slice(0, 5))) 
      .catch(err => console.error(err));
  }, []);

  // 2. 플랫폼 변경 시 데이터 요청
  useEffect(() => {
    let url = 'http://localhost:5000/api/contents/rising';
    if (selectedPlatform !== 'all') {
      url += `?platform=${selectedPlatform}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => setRisingContents(data))
      .catch(err => console.error(err));
  }, [selectedPlatform]);

  const youtubecategories = ['전체', '게임', '라이프', '음악', '일상', '코미디'];

  const formatViews = (views) => {
    if (!views) return '0회';
    const num = parseInt(views, 10);
    if (num >= 10000) return (num / 10000).toFixed(1) + '만회'; 
    else if (num >= 1000) return (num / 1000).toFixed(1) + '천회';
    return num + '회';
  };

  const formatDate = (dateString) => {
    const published = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - published);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return `${diffDays}일 전`; 
  };

  useEffect(() => {
    fetch(`http://localhost:5000/api/youtube/list?category=${youtubeCategory}`)
      .then(res => res.json())
      .then(data => setYoutubeVideos(data))
      .catch(err => console.error("유튜브 데이터 로드 실패:", err));
  }, [youtubeCategory]);

  return (
    <div 
        className="w-full min-h-screen bg-gray-50 p-8 font-sans text-gray-800"
        onClick={() => isDropdownOpen && setIsDropdownOpen(false)}
    >
      
      {/* 상단 헤더 */}
      <div className="flex justify-between items-start mb-8">
        <div className="relative w-full max-w-xl mx-auto"> 
          <input 
            type="text" 
            placeholder="관심있는 키워드나 주제를 검색해보세요..." 
            className="w-full py-3 pl-12 pr-4 rounded-full border border-gray-200 focus:outline-none focus:border-blue-500 shadow-sm text-sm"
          />
          <Search className="absolute left-4 top-3 text-gray-400 w-5 h-5" />
        </div>

        <div className="flex items-center gap-4 absolute right-8 top-8">
             <span className="text-gray-400 text-sm">Cont...</span>
             <Bell className="w-5 h-5 text-red-500 cursor-pointer" />
             <Link to="/mypage">
               <div className="w-8 h-8 rounded-full bg-gray-300 hover:ring-2 hover:ring-blue-500 transition cursor-pointer"></div>
             </Link>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-8">안녕하세요, 마케터님 👋</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        
        {/* 카드 1: 트렌드 키워드 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {/* ✅ [수정 핵심 1] 헤더 높이 고정 (h-10) */}
          <div className="flex justify-between items-center mb-6 h-10">
            <h2 className="font-bold text-lg flex items-center gap-2 border-b-2 border-transparent hover:border-black transition-colors">
              트렌드 키워드 Top 5
            </h2>
            <span className="text-xs text-gray-400">실시간 기준</span>
          </div>
          
          <ul className="flex flex-col gap-2">
            {risingKeywords.map((item, index) => (
              <li 
                key={index} 
                onClick={() => openModal({ 
                  keyword: item.keyword,
                  rank: item.rank,
                  score: item.score,
                  title: item.keyword,
                  desc: `${item.keyword}에 대한 트렌드 요약입니다.`
                })}
                // h-12 고정 높이
                className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors h-12"
              >
                <div className="flex items-center gap-4">
                  <span className="font-bold text-blue-600 w-3 text-center">{item.rank}</span>
                  <p className="font-medium text-gray-900">{item.keyword}</p>
                </div>
                {/* 등락폭 */}
                <div className={`text-xs font-bold ${item.isUp ? 'text-red-500' : item.isUp === false ? 'text-blue-500' : 'text-gray-400'}`}>
                  {item.change}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 카드 2: 플랫폼별 키워드 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative">
          
          {/* ✅ [수정 핵심 1] 헤더 높이 고정 (h-10) - 왼쪽과 동일하게 맞춤 */}
          <div className="flex justify-between items-center mb-6 h-10">
            <h2 className="font-bold text-lg flex items-center gap-2">
              플랫폼별 키워드
            </h2>
            
            {/* 탭 버튼 그룹 (드롭다운) */}
            <div 
                className="flex bg-gray-100 p-1 rounded-lg items-center relative z-10"
                onClick={(e) => e.stopPropagation()} 
            >
                <button 
                  onClick={() => {
                    setSelectedPlatform('youtube');
                    setIsDropdownOpen(false);
                  }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
                    selectedPlatform === 'youtube' 
                      ? 'bg-white shadow-sm text-red-600' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  유튜브
                </button>

                <div className="w-[1px] h-3 bg-gray-300 mx-1"></div>

                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
                      selectedPlatform !== 'youtube'
                        ? 'bg-white shadow-sm text-green-600'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <span>
                      {selectedPlatform === 'youtube' 
                        ? '커뮤니티' 
                        : platformLabels[selectedPlatform] || '커뮤니티'}
                    </span>
                    <svg 
                      className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden py-1 z-50">
                      {Object.entries(platformLabels).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setSelectedPlatform(key);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors ${
                            selectedPlatform === key ? 'text-green-600 font-bold bg-green-50' : 'text-gray-600'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
            </div>
          </div>

          <ul className="flex flex-col gap-2">
            {risingContents.map((item, index) => (
              <li 
                key={index}
                onClick={() => openModal({ 
                    title: item.title, 
                    desc: `영상 '${item.title}' 분석 리포트`,
                    badges: [
                      { text: "플랫폼키워드", color: "bg-red-100 text-red-600" },
                      { text: "24시간", color: "bg-gray-100 text-gray-600" },
                      { text: "요약분석", color: "bg-purple-100 text-purple-600" },
                    ]
                })}
                // h-12 고정 높이
                className="flex items-center gap-4 text-sm cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors h-12"
              >
                {/* 랭킹 숫자 (좌측 카드와 동일한 스타일 유지) */}
                <span className="font-bold text-blue-600 w-3 text-center">{item.rank}</span>
                
                {/* ✅ [수정 핵심 2] 가로 배치 + 여백 추가 */}
                <div className="flex items-baseline overflow-hidden">
                   {/* 제목 */}
                   <span className="font-medium text-gray-900 whitespace-nowrap">
                      {item.title}
                   </span>
                   {/* 여백(ml-3)과 함께 상세 내용 표시 */}
                   <span className="text-xs text-gray-400 truncate ml-3">
                      {item.stats}
                   </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 하단 섹션: 유튜브 일일 급상승 동영상 */}
      <div className="mb-8">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2 border-b-2 border-gray-800 w-fit pb-1">
          유튜브 일일 급상승 동영상
        </h2>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {youtubecategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setYoutubeCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                ${youtubeCategory === cat 
                  ? 'bg-black text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {youtubeVideos.slice(0, 5).map((video) => (
            <a 
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex flex-col"
            >
              <div className="relative w-full aspect-video bg-gray-200">
                <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="text-white w-10 h-10 drop-shadow-lg" />
                </div>
              </div>
              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-2">
                    {video.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">{video.channel}</p>
                </div>
                <div className="mt-2 text-[11px] text-gray-400">
                    <span>{formatViews(video.views)}</span>
                    <span>•</span>
                    <span>{formatDate(video.publish_time)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;