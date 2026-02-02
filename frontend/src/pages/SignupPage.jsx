// src/pages/SignupPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SignupPage = () => {
  // 이메일 인증 버튼 클릭 시 인증번호 입력칸을 보여주기 위한 상태
  const [isEmailSent, setIsEmailSent] = useState(false);

  // 인증 버튼 클릭 핸들러 (더미 기능)
  const handleVerifyEmail = () => {
    alert("인증번호가 발송되었습니다. (테스트)");
    setIsEmailSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-8 border border-gray-200">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">Prism</h1>
          <p className="text-gray-600 font-medium">그 첫 시작, Prism과 함께하세요.</p>
        </div>

        {/* 입력 폼 */}
        <form className="space-y-5">
          {/* 이름 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">이름</label>
            <input 
              type="text" 
              placeholder="홍길동"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {/* 닉네임 + 중복확인 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">닉네임</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="사용할 닉네임"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button 
                type="button"
                className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-bold hover:bg-gray-300 whitespace-nowrap"
              >
                중복확인
              </button>
            </div>
          </div>

          {/* 이메일 + 인증 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">이메일</label>
            <div className="flex gap-2 mb-2">
              <input 
                type="email" 
                placeholder="example@prism.com"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button 
                type="button"
                onClick={handleVerifyEmail}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 whitespace-nowrap"
              >
                인증
              </button>
            </div>
            
            {/* 인증번호 입력칸 (인증 버튼 누르면 나타남) */}
            {isEmailSent && (
              <input 
                type="text" 
                placeholder="인증번호 6자리 입력"
                className="w-full border border-indigo-300 bg-indigo-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">비밀번호</label>
            <input 
              type="password" 
              placeholder="8자 이상 입력해주세요"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">비밀번호 확인</label>
            <input 
              type="password" 
              placeholder="비밀번호를 한 번 더 입력해주세요"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 회원가입 버튼 */}
          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white font-bold text-lg py-3 rounded-lg hover:bg-indigo-700 transition mt-6"
          >
            회원가입 완료
          </button>
        </form>

        {/* 하단 링크 */}
        <div className="text-center mt-6">
          <span className="text-gray-500 text-sm">이미 계정이 있으신가요? </span>
          <Link to="/login" className="text-indigo-600 font-bold text-sm hover:underline ml-1">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;