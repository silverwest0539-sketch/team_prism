// src/pages/AnalysisPage.jsx
import React from 'react';
import Sidebar from '../components/layout/Sidebar'; // 경로 확인 필요
import InfoCard from '../components/analysis/InfoCard';
import ChartSection from '../components/analysis/ChartSection';
import ContentList from '../components/analysis/ContentList';
import AiSummary from '../components/analysis/AiSummary';
import SentimentScrap from '../components/analysis/SentimentScrap';
import { Link } from 'react-router-dom'; // 👈 1. Link import 추가


const AnalysisPage = () => {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* 1. 사이드바 (고정) */}
      <Sidebar />

      {/* 2. 메인 콘텐츠 영역 (사이드바 너비만큼 왼쪽 여백 pl-64) */}
      <div className="flex-1 p-8">
        
        {/* 상단 검색바 & 프로필 */}
        <header className="flex justify-between items-center mb-8">
          <input 
            type="text" 
            placeholder="관심있는 키워드나 주제를 검색해보세요..." 
            className="w-1/2 p-3 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500 shadow-sm"
          />
          <div className="flex items-center gap-4">
            <span>🔔</span>
            {/* 👇 2. Link로 감싸기 */}
            <Link to="/mypage">
               <div className="w-8 h-8 bg-gray-300 rounded-full hover:ring-2 hover:ring-blue-500 transition cursor-pointer"></div>
            </Link>
          </div>
        </header>

        {/* 정보 카드 영역 (검색키워드, 기간, 카테고리) */}
        <section className="grid grid-cols-3 gap-4 mb-6">
          <InfoCard title="검색키워드" value="키워드" icon="#" />
          <InfoCard title="기간" value="타임라인" icon="📅" />
          <InfoCard title="카테고리" value="분류명" icon="📂" />
        </section>

        {/* 중간: 차트 및 연관 분석 */}
        <section className="mb-6">
           <ChartSection />
        </section>

        {/* 하단: 2단 레이아웃 (좌측: 콘텐츠+요약 / 우측: 분석+예시) */}
        <section className="grid grid-cols-3 gap-6">
          {/* 좌측 2칸 차지 */}
          <div className="col-span-2 space-y-6">
            <ContentList />
            <AiSummary /> {/* 여기가 요청하신 'AI 키워드 분석 요약' */}
          </div>

          {/* 우측 1칸 차지 */}
          <div className="col-span-1">
             <SentimentScrap />
          </div>
        </section>

      </div>
    </div>
  );
};

export default AnalysisPage;