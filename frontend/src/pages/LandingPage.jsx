// src/pages/LandingPage.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      
      {/* 메인 컨텐츠 영역 */}
      <div className="mb-12">
        <p className="text-gray-500 font-bold text-lg mb-4">데이터 속 숨겨진 인사이트를 찾다</p>
        <h1 className="text-6xl font-extrabold text-indigo-600 mb-6 tracking-tight">
          Prism
        </h1>
        <p className="text-gray-600 text-xl leading-relaxed max-w-2xl mx-auto">
          빅데이터 분석과 AI 예측으로<br />
          마케팅의 새로운 기회를 발견하세요.
        </p>
      </div>

      {/* 메인 액션 버튼 */}
      <button 
        onClick={() => navigate('/login')}
        className="bg-indigo-600 text-white font-bold text-xl px-12 py-4 rounded-full shadow-lg hover:bg-indigo-700 transform hover:scale-105 transition duration-200"
      >
        지금 시작하기
      </button>

      {/* 하단 링크 영역 */}
      <div className="mt-10 flex gap-6 text-gray-400 font-medium">
        <Link to="/login" className="hover:text-indigo-600 transition">로그인</Link>
        <span className="text-gray-300">|</span>
        <Link to="/signup" className="hover:text-indigo-600 transition">회원가입</Link>
      </div>

    </div>
  );
};

export default LandingPage;