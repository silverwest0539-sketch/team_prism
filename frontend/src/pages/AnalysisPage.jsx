// src/pages/AnalysisPage.jsx
import React from 'react';
import InfoCard from '../components/analysis/InfoCard';
import { MagnifyingGlass, Bell, ArrowsClockwise, BookmarkSimple, Star, Copy, Export, PlayCircle } from '@phosphor-icons/react';

const AnalysisPage = () => {
  return (
    <div className="space-y-6">
      {/* 1. 상단 헤더 (검색 및 프로필) */}
      <header className="flex justify-between items-center mb-4">
        <div className="relative w-1/3">
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="관심있는 키워드나 주제를 검색해보세요..." 
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm transition-all"
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
            <Bell size={24} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-10 h-10 bg-indigo-100 rounded-full border-2 border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-indigo-500 transition"></div>
        </div>
      </header>

      {/* 2. 최상단 요약 카드 (3열) */}
      <section className="grid grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold">#</div>
          <div>
            <p className="text-xs text-gray-500 font-medium">검색키워드</p>
            <p className="text-lg font-bold text-gray-800">키워드</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">📅</div>
          <div>
            <p className="text-xs text-gray-500 font-medium">기간</p>
            <p className="text-lg font-bold text-gray-800">타임라인</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">📊</div>
          <div>
            <p className="text-xs text-gray-500 font-medium">플랫폼</p>
            <p className="text-lg font-bold text-gray-800">플랫폼명</p>
          </div>
        </div>
      </section>

      {/* 3. 중간 분석 영역 (이미지의 빨간 동그라미 3구간) */}
      <section className="grid grid-cols-3 gap-6">
        {/* 구간 1: 언급량 추이 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          <h3 className="text-sm font-bold text-indigo-600 flex items-center gap-1 mb-4">
            <span className="text-lg">📈</span> 언급량 추이
          </h3>
          <div className="h-48 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-gray-400">
             Line Chart Area
          </div>
          <div className="flex gap-2 mt-4">
            <button className="flex items-center gap-1 text-xs font-bold px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
              <ArrowsClockwise size={14} weight="bold" /> 새로고침
            </button>
            <button className="flex items-center gap-1 text-xs font-bold px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <BookmarkSimple size={14} weight="fill" /> 스크랩 저장
            </button>
          </div>
        </div>

        {/* 구간 2: 연관어 분석 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-indigo-600 flex items-center gap-1 mb-4">
            <span className="text-lg">☁️</span> 연관어 분석
          </h3>
          <div className="h-40 bg-gray-50 rounded-lg mb-4 flex items-center justify-center">
             Word Cloud Image
          </div>
          <div className="space-y-2">
            {['연관어1', '연관어2', '연관어3'].map((word, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 pb-1">
                <span className="font-medium text-gray-700">{word}</span>
                <span className="w-full mx-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400" style={{width: `${80 - (idx*20)}%`}}></div>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 구간 3: 긍부정 분석 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-indigo-600 flex items-center gap-1 mb-4">
            <span className="text-lg">😊</span> 긍부정 분석
          </h3>
          <div className="grid grid-cols-2 gap-2 h-48">
             <div className="bg-gray-50 rounded-full flex items-center justify-center text-[10px] text-gray-400 border border-gray-100">Donut Chart</div>
             <div className="bg-gray-50 rounded flex items-center justify-center text-[10px] text-gray-400 border border-gray-100">Mini Line Chart</div>
          </div>
        </div>
      </section>

      {/* 4. 하단 상세 영역 (좌측 3칸 : 우측 1칸) */}
      <section className="grid grid-cols-4 gap-6">
        {/* 하단 좌측: 영상 + AI 요약 (3칸 차지) */}
        <div className="col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">관련 영상</h3>
              <button className="text-xs text-gray-500 hover:underline">더 보기</button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="group cursor-pointer">
                  <div className="relative aspect-video bg-gray-200 rounded-lg mb-2 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                      <PlayCircle size={32} className="text-white" weight="fill" />
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-gray-800 line-clamp-1">관련 영상 {i}</p>
                      <p className="text-[10px] text-gray-500">조회 {i*10}만 · {i}일 전</p>
                    </div>
                    <Star size={14} className="text-gray-300 hover:text-yellow-400 cursor-pointer" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
              <MagnifyingGlass size={18} className="text-indigo-600" /> AI 키워드 분석 요약
            </h3>
            <div className="p-4 bg-indigo-50/50 rounded-xl border-l-4 border-indigo-500 text-sm text-gray-700 leading-relaxed">
              해당 밈의 의미와 맥락 등을 AI가 분석하여 요약 정리한 내용이 여기에 표시됩니다. 
              현재 트렌드의 핵심 파악과 마케팅 활용 포인트를 제공합니다.
            </div>
          </div>
        </div>

        {/* 하단 우측: 실제 사용 사례 (1칸 차지) */}
        <div className="col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b">실제 사용 사례</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="group">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-gray-700">예시 {i}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Star size={14} className="text-gray-400 hover:text-yellow-400 cursor-pointer" />
                    <Copy size={14} className="text-gray-400 hover:text-indigo-600 cursor-pointer" />
                  </div>
                </div>
                <div className="h-px bg-gray-100 w-full"></div>
              </div>
            ))}
            <button className="w-full py-2 text-xs text-indigo-600 font-bold bg-indigo-50 rounded-lg hover:bg-indigo-100 transition mt-4">
              더 많은 사례 보기
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalysisPage;