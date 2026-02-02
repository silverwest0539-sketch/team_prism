// src/pages/HomePage.jsx
import React from 'react';
import { Search, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

// ✅ 핵심 수정: openModal을 props로 받고, 기본값 설정
const HomePage = ({ openModal = () => {} }) => {
  
  // 1. 급상승 키워드 데이터 (Mock Data)
  const risingKeywords = [
    { rank: 1, keyword: "저당(Low Sugar) 간식", volume: "검색량 1.5만회", change: "▲ 12%", isUp: true },
    { rank: 2, keyword: "여름 휴가 룩북", volume: "검색량 8,200회", change: "▲ 8%", isUp: true },
    { rank: 3, keyword: "AI 영상 편집", volume: "검색량 5,400회", change: "▼ 2%", isUp: false },
    { rank: 4, keyword: "캠핑 용품 추천", volume: "검색량 4,100회", change: "▲ 5%", isUp: true },
    { rank: 5, keyword: "편의점 신상", volume: "검색량 3,200회", change: "-", isUp: null },
  ];

  // 2. 조회수 급등 영상 데이터
  const risingVideos = [
    { rank: 1, title: "[먹방] 신메뉴 솔직 리뷰", stats: "조회수 120만 • 댓글 3,400개" },
    { rank: 2, title: "10분 홈트레이닝 루틴", stats: "조회수 85만 • 댓글 800개" },
    { rank: 3, title: "개발자 취업 현실", stats: "조회수 50만 • 댓글 1,200개" },
  ];

  // 3. AI 인사이트 데이터
  const aiInsights = [
    {
      type: "opportunity",
      label: "기회 요인",
      title: "'제로 슈거' 트렌드 활용 적기입니다!",
      desc: "현재 관련 커뮤니티에서 긍정적인 반응이 80% 이상입니다. 특히 '건강'과 '맛'을 동시에 잡은 제품 리뷰가 인기입니다.",
      color: "green"
    },
    {
      type: "risk",
      label: "리스크 감지",
      title: "'OO 챌린지' 참여 신중하게 결정하세요.",
      desc: "해당 챌린지는 안전 문제로 인해 부정적 댓글이 급증하고 있습니다. 브랜드 이미지 보호를 위해 참여를 보류하는 것을 추천합니다.",
      color: "red"
    },
    {
      type: "info",
      label: "트렌드 정보",
      title: "숏폼 콘텐츠 길이 변화 감지",
      desc: "1분 미만 영상보다 1분 30초 내외의 스토리텔링형 영상의 체류 시간이 늘어나는 추세입니다.",
      color: "gray"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        
        {/* 카드 1: 급상승 키워드 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg flex items-center gap-2">
              🔥 급상승 키워드 Top 5
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

        {/* 카드 2: 조회수 급등 영상 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg flex items-center gap-2">
              📺 조회수 급등 영상
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
                      { text: "급등영상", color: "bg-red-100 text-red-600" },
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

      {/* AI 맥락 분석 & 추천 섹션 */}
      <div className="mb-8">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          🤖 AI 맥락 분석 & 추천
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {aiInsights.map((card, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-64">
              <div>
                <span className={`
                  inline-block px-2 py-1 rounded-md text-xs font-bold mb-3
                  ${card.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                  ${card.color === 'red' ? 'bg-red-100 text-red-700' : ''}
                  ${card.color === 'gray' ? 'bg-gray-100 text-gray-600' : ''}
                `}>
                  {card.type === 'opportunity' && '⚡ '}
                  {card.type === 'risk' && '⚠️ '}
                  {card.type === 'info' && '📊 '}
                  {card.label}
                </span>
                
                <h3 className="font-bold text-gray-900 mb-2 leading-snug">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed overflow-hidden text-ellipsis line-clamp-3">
                  {card.desc}
                </p>
              </div>
              
              <div className="text-right mt-4">
                <button 
                  onClick={() => openModal({ 
                    title: card.title, 
                    desc: card.desc,
                    badges: [
                      { text: card.label, color: card.color === 'green' ? 'bg-green-100 text-green-600' : card.color === 'red' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600' },
                    ]
                  })}
                  className="text-xs text-blue-600 font-semibold flex items-center justify-end gap-1 w-full hover:underline"
                >
                  {index === 0 ? "관련 키워드 보기" : index === 1 ? "댓글 반응 분석 보기" : "통계 자세히 보기"} →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HomePage;