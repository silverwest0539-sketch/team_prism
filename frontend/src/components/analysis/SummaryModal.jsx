// src/components/analysis/SummaryModal.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function SummaryModal({ isOpen, onClose, data }) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const content = data || {
    title: "요약 분석",
    desc: "상세 분석을 확인할 키워드를 선택하세요.",
    badges: [
      { text: "키워드 종류", color: "bg-orange-100 text-orange-600" },
      { text: "키워드 출처", color: "bg-red-100 text-red-600" },
      { text: "리스크 종류", color: "bg-yellow-100 text-yellow-600" },
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-[900px] max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto relative p-8">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
          aria-label="close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-8">
          <div className="flex gap-2 mb-3">
            {content.badges?.map((badge, idx) => (
              <span key={idx} className={`px-2 py-1 text-xs font-bold rounded ${badge.color}`}>
                {badge.text}
              </span>
            ))}
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-1">{content.title}</h2>
          <p className="text-gray-500 text-sm">{content.desc}</p>
        </div>

        <div className="mb-8">
          <h3 className="flex items-center gap-2 text-lg font-bold text-blue-600 mb-3">
            🔍 AI 키워드 분석 요약
          </h3>
          <div className="bg-gray-50 border-l-4 border-blue-500 p-5 rounded-r-lg text-sm text-gray-700 leading-relaxed space-y-2">
            <p><span className="font-bold text-black">[유래]</span> ...</p>
            <p><span className="font-bold text-black">[용례]</span> ...</p>
            <p><span className="font-bold text-black">[주의사항]</span> ...</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50">
            즐겨찾기 저장
          </button>
          <button
            className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700"
            onClick={() => navigate("/analysis")}
          >
            해당 키워드의 상세페이지 이동
          </button>
        </div>
      </div>
    </div>
  );
}

