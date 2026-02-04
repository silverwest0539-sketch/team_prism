// src/components/analysis/SummaryModal.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SummaryModal({ isOpen, onClose, data }) {
  const navigate = useNavigate();

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null;

  // 데이터가 없을 때 보여줄 기본값 (이미지 시안 내용 반영)
  const content = data || {
    title: "키워드", // 실제 연동 시 data.title
    summary: "해당 키워드가 이슈가 된 이유 요약 내용이 들어갑니다. 최근 2030 세대 사이에서 급격하게 확산되고 있으며...",
    examples: [
      { platform: "인스타그램", text: "이거 진짜 대박임 ㅋㅋ 완전 추천" },
      { platform: "유튜브", text: "영상 보고 바로 구매했습니다. 가성비 좋네요." },
    ]
  };

  // 상세 페이지 이동 핸들러 (수정된 부분)
  const handleDetailMove = () => {
    onClose(); // 1. 모달을 먼저 닫고
    navigate('/analysis'); // 2. 페이지를 이동합니다
  };


  return (
    // 배경 (Backdrop)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
      
      {/* 모달 컨테이너 (너비를 이미지 비율에 맞춰 조정) */}
      <div className="bg-white w-[550px] max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto relative p-8 scrollbar-hide">
        
        {/* 닫기 버튼 (우측 상단) */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 1. 헤더 영역 */}
        <div className="mb-8">
          {/* 긍부정 신호등 뱃지 */}
          <div className="inline-block bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded mb-2">
            긍부정 신호등
          </div>
          {/* 키워드 타이틀 (녹색 강조) */}
          <h2 className="text-3xl font-extrabold text-green-500 tracking-tight">
            {content.title}
          </h2>
        </div>

        {/* 2. AI 분석 요약 */}
        <div className="mb-8">
          <h3 className="flex items-center gap-2 text-md font-bold text-violet-600 mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            AI 분석 요약
          </h3>
          {/* 왼쪽 보라색 라인이 있는 회색 박스 */}
          <div className="bg-gray-50 rounded-r-lg border-l-4 border-violet-500 p-4 text-sm text-gray-700 leading-relaxed min-h-[80px] flex items-center">
             {content.desc || content.summary || "해당 키워드가 이슈가 된 이유 요약"}
          </div>
        </div>

        {/* 3. 키워드 언급량 추이 (그래프) */}
        <div className="mb-8">
          <h3 className="flex items-center gap-2 text-md font-bold text-violet-600 mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
            키워드 언급량 추이
          </h3>
          <div className="bg-white p-2 rounded-xl border border-gray-100 relative h-48 flex items-end justify-center overflow-hidden">
            {/* SVG 그래프 그리기 */}
            <svg className="absolute bottom-0 left-0 w-full h-full" preserveAspectRatio="none">
              {/* 그라데이션 정의 */}
              <defs>
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {/* 채워진 영역 */}
              <path d="M0,150 Q120,100 250,50 T500,80 V190 H0 Z" fill="url(#purpleGradient)" />
              {/* 선 */}
              <path d="M0,150 Q120,100 250,50 T500,80" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
              {/* 포인트 점들 */}
              <circle cx="20" cy="145" r="3" fill="white" stroke="#8b5cf6" strokeWidth="2" />
              <circle cx="250" cy="50" r="3" fill="white" stroke="#8b5cf6" strokeWidth="2" />
              <circle cx="480" cy="80" r="3" fill="white" stroke="#8b5cf6" strokeWidth="2" />
            </svg>
            
            {/* X축 레이블 */}
            <div className="absolute bottom-2 w-full flex justify-between px-4 text-xs text-gray-400 font-medium">
              <span>D-3</span>
              <span>D-2</span>
              <span>D-1</span>
              <span className="text-violet-600 font-bold">Today</span>
              <span>Future</span>
            </div>
          </div>
        </div>

        {/* 4. 키워드 언급 실제 사례 */}
        <div className="mb-8">
          <h3 className="flex items-center gap-2 text-md font-bold text-violet-600 mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
            키워드 언급 실제 사례
          </h3>
          <div className="space-y-3">
            {/* 사례 1 */}
            <div className="flex items-center gap-3 border border-gray-200 p-3 rounded-xl shadow-sm bg-white">
              <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded font-bold whitespace-nowrap">
                {content.examples ? content.examples[0]?.platform : "플랫폼명"}
              </span>
              <span className="text-sm font-medium text-gray-800 truncate">
                {content.examples ? content.examples[0]?.text : "실제 댓글 내용이 여기에 들어갑니다."}
              </span>
            </div>
            {/* 사례 2 */}
            <div className="flex items-center gap-3 border border-gray-200 p-3 rounded-xl shadow-sm bg-white">
              <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded font-bold whitespace-nowrap">
                {content.examples ? content.examples[1]?.platform : "플랫폼명"}
              </span>
              <span className="text-sm font-medium text-gray-800 truncate">
                {content.examples ? content.examples[1]?.text : "사용자들의 실제 반응을 보여줍니다."}
              </span>
            </div>
          </div>
        </div>

        {/* 5. 하단 버튼 영역 */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button className="px-5 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm">
            즐겨찾기 저장
          </button>
          
          {/* ✅ 수정된 버튼: 클릭 시 함수(닫기+이동) 실행 */}
          <button 
            className="px-5 py-3 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors shadow-md"
            onClick={handleDetailMove} 
          >
            해당 키워드의 상세페이지 이동
          </button>
        </div>

      </div>
    </div>
  );
}