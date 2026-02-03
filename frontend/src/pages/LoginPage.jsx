// src/pages/LoginPage.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // 로그인 처리 로직 후 메인으로 이동 (예시)
    navigate('/home'); 
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-8 border border-gray-200">
        
        {/* 헤더 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">Prism</h1>
          <p className="text-gray-600 font-medium">서비스 이용을 위해 로그인해주세요.</p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">닉네임</label>
            <input 
              type="text" 
              placeholder="닉네임을 입력하세요"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">비밀번호</label>
            <input 
              type="password" 
              placeholder="비밀번호를 입력하세요"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white font-bold text-lg py-3 rounded-lg hover:bg-indigo-700 transition"
          >
            로그인
          </button>
        </form>

        {/* 소셜 로그인 예시 (디자인 요소로 추가, 필요없으면 삭제 가능) */}
        <div className="mt-6 space-y-2">
            <button className="w-full bg-[#FEE500] text-[#3c1e1e] font-bold py-3 rounded-lg text-sm">
               카카오톡으로 시작하기
            </button>
             <button className="w-full bg-[#03C75A] text-white font-bold py-3 rounded-lg text-sm">
               네이버로 시작하기
            </button>
        </div>

        {/* 하단 링크 */}
        <div className="text-center mt-8">
          <span className="text-gray-500 text-sm">계정이 없으신가요? </span>
          <Link to="/signup" className="text-indigo-600 font-bold text-sm hover:underline ml-1">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;