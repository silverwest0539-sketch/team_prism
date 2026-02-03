// src/pages/HomePage.jsx
import React from 'react';
import { Search, Bell, PlayCircle } from 'lucide-react'; // PlayCircle 아이콘 추가
import { Link } from 'react-router-dom';

const HomePage = ({ openModal = () => {} }) => {
  
  // 1. 트렌드 키워드 데이터
  const risingKeywords = [
    { rank: 1, keyword: "저당(Low Sugar) 간식", volume: "검색량 1.5만회", change: "▲ 12%", isUp: true },
    { rank: 2, keyword: "여름 휴가 룩북", volume: "검색량 8,200회", change: "▲ 8%", isUp: true },
    { rank: 3, keyword: "AI 영상 편집", volume: "검색량 5,400회", change: "▼ 2%", isUp: false },
    { rank: 4, keyword: "캠핑 용품 추천", volume: "검색량 4,100회", change: "▲ 5%", isUp: true },
    { rank: 5, keyword: "편의점 신상", volume: "검색량 3,200회", change: "-", isUp: null },
  ];

  // 2. 플랫폼별 키워드 데이터
  const risingVideos = [
    { rank: 1, title: "[먹방] 신메뉴 솔직 리뷰", stats: "조회수 120만 • 댓글 3,400개" },
    { rank: 2, title: "10분 홈트레이닝 루틴", stats: "조회수 85만 • 댓글 800개" },
    { rank: 3, title: "개발자 취업 현실", stats: "조회수 50만 • 댓글 1,200개" },
    { rank: 4, title: "[브이로그] 직장인 주말 일상", stats: "조회수 42만 • 댓글 560개" },
    { rank: 5, title: "갤럭시 Z플립6 언박싱", stats: "조회수 28만 • 댓글 1,100개" },
  ];

  // 3. 유튜브 인기 동영상 데이터 (실제 영상 썸네일형)
  // * 이미지는 무료 플레이스홀더 서비스를 사용했습니다. 추후 실제 유튜브 썸네일 URL로 교체하세요.
  const youtubeTrends = [
    {
      id: 1,
      title: "2024년 하반기 마케팅 트렌드 총정리! 이거 모르면 손해봅니다",
      channel: "마케팅 팩토리",
      views: "조회수 34만회",
      date: "2일 전",
      thumbnail: "https://placehold.co/600x400/png?text=Marketing+Trend" 
    },
    {
      id: 2,
      title: "AI로 영상 자동 편집하는 법 (초보자 가이드)",
      channel: "테크 리뷰어",
      views: "조회수 85만회",
      date: "5일 전",
      thumbnail: "https://placehold.co/600x400/2563eb/white?text=AI+Video+Edit"
    },
    {
      id: 3,
      title: "요즘 뜨는 숏폼 콘텐츠의 비밀 3가지",
      channel: "크리에이터 랩",
      views: "조회수 12만회",
      date: "1주 전",
      thumbnail: "https://placehold.co/600x400/fbbf24/white?text=Shorts+Secret"
    },
    {
      id: 4,
      title: "[Vlog] 퇴사 후 시골에서 한 달 살기 1편",
      channel: "데일리 로그",
      views: "조회수 150만회",
      date: "3주 전",
      thumbnail: "https://placehold.co/600x400/10b981/white?text=Vlog+Summer"
    },
    {
      id: 5,
      title: "탕후루 다음은 이거? 편의점 신상 디저트 털기",
      channel: "먹방 요정",
      views: "조회수 55만회",
      date: "1개월 전",
      thumbnail: "https://placehold.co/600x400/f43f5e/white?text=Food+Review"
    }
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      
      {/* 상단 헤더 영역 */}
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

      {/* 메인 2열 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        
        {/* 카드 1: 트렌드 키워드 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg flex items-center gap-2 border-b-2 border-transparent hover:border-black transition-colors">
              트렌드 키워드 Top 5
            </h2>
            <span className="text-xs text-gray-400">실시간 기준</span>
          </div>
          <ul className="space-y-6">
            {risingKeywords.map((item, index) => (
              <li 
                key={index} 
                onClick={() => openModal({ 
                    title: item.keyword, 
                    desc: `${item.keyword}에 대한 AI 심층 분석 결과입니다.`,
                    badges: [
                      { text: "급상승", color: "bg-orange-100 text-orange-600" },
                      { text: "실시간", color: "bg-blue-100 text-blue-600" },
                      { text: "요약분석", color: "bg-purple-100 text-purple-600" },
                    ]
                })}
                className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="font-bold text-blue-600 w-3">{item.rank}</span>
                  <div>
                    <p className="font-medium text-gray-900">{item.keyword}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.volume}</p>
                  </div>
                </div>
                <div className={`text-xs font-bold ${item.isUp ? 'text-red-500' : item.isUp === false ? 'text-blue-500' : 'text-gray-400'}`}>
                  {item.change}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 카드 2: 플랫폼별 키워드 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg flex items-center gap-2">
              플랫폼별 키워드
            </h2>
            <span className="text-xs text-gray-400">최근 24시간</span>
          </div>
          <ul className="space-y-6">
            {risingVideos.map((item, index) => (
              <li 
                key={index}
                onClick={() => openModal({ 
                    title: item.title, 
                    desc: `영상 '${item.title}'의 트렌드 분석 리포트입니다.`,
                    badges: [
                      { text: "플랫폼키워드", color: "bg-red-100 text-red-600" },
                      { text: "24시간", color: "bg-gray-100 text-gray-600" },
                      { text: "요약분석", color: "bg-purple-100 text-purple-600" },
                    ]
                })}
                className="flex items-start gap-4 text-sm cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors"
              >
                <span className="font-bold text-blue-600 mt-0.5">{item.rank}</span>
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.stats}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 하단 섹션: 유튜브 인기 동영상 (영상 썸네일 카드형 5개) */}
      <div className="mb-8">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2 border-b-2 border-gray-800 w-fit pb-1">
          유튜브 인기 동영상
        </h2>
        
        {/* 5열 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {youtubeTrends.map((video, index) => (
            <div 
                key={index} 
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex flex-col"
                onClick={() => openModal({
                    title: video.title,
                    desc: `영상 '${video.title}' 상세 분석 내용을 확인하세요.`,
                    badges: [{ text: "YouTube", color: "bg-red-100 text-red-600" }]
                })}
            >
              {/* 썸네일 영역 */}
              <div className="relative w-full aspect-video bg-gray-200">
                <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* 플레이 아이콘 (호버시 등장) */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="text-white w-10 h-10 drop-shadow-lg" />
                </div>
              </div>
              
              {/* 영상 정보 영역 */}
              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-2">
                    {video.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">{video.channel}</p>
                </div>
                <div className="mt-2 text-[11px] text-gray-400">
                    {video.views} • {video.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HomePage;