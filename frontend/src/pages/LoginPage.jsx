// src/pages/LoginPage.jsx
import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { 
        email, 
        password 
      });

      if (response.data.success) {
        // 1. 발급받은 JWT 토큰을 localStorage에 저장
        localStorage.setItem('token', response.data.token);
        // 2. 유저 정보 저장
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        alert(`환영합니다, ${response.data.user.nickname}님!`);
        navigate('/home'); 
      }
    } catch (error) {
      alert(error.response?.data?.message || '로그인 실패');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card-soft w-full max-w-md shadow-lg">
        
        {/* 헤더 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">Prism</h1>
          <p className="text-gray-600 font-medium">서비스 이용을 위해 로그인해주세요.</p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="form-label">이메일</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">비밀번호</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="form-input"
            />
          </div>

          <button type="submit" className="btn-auth-primary text-lg">
            로그인
          </button>
        </form>

        {/* 소셜 로그인 */}
        <div className="mt-6 space-y-2">
          <button className="btn-kakao">
            카카오톡으로 시작하기
          </button>
          <button className="btn-naver">
            네이버로 시작하기
          </button>
        </div>

        {/* 하단 링크 */}
        <div className="text-center mt-8">
          <div>
            <span className="text-gray-500 text-sm">계정이 없으신가요? </span>
            <Link to="/signup" className="text-indigo-600 font-bold text-sm hover:underline ml-1">
              회원가입
            </Link>
          </div>
          <div className="border-l border-gray-300 h-4 self-center"></div>
          <Link to="/find-password" title="비밀번호 찾기" className="text-gray-500 text-sm hover:underline">
            비밀번호 찾기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;