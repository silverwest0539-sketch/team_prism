// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import { showToast } from '../utils/toast';


const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  const handleLogoClick = () => {
    navigate('/home');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        showToast(`환영합니다! ${response.data.user.nickname}님`, { type: 'success' });
        navigate('/home');
      }
    } catch (error) {
      showToast(error.response?.data?.message || '로그인에 실패했습니다.', { type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">

      <div className="card-soft w-full max-w-md shadow-lg">
        <div className="text-center mb-10">
          <h1
            role="button"
            tabIndex={0}
            onClick={handleLogoClick}
            className={`text-4xl font-bold mb-2 transition-all duration-500 cursor-pointer select-none`}
            title={`Prism 홈으로 이동`}
            aria-label="Prism 로고"
          >
            Prism
          </h1>
          <p className="text-gray-600 font-medium">서비스 이용을 위해 로그인해주세요</p>
        </div>

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

        <div className="mt-6 space-y-2">
          <button className="btn-kakao">카카오톡으로 시작하기</button>
          <button className="btn-naver">네이버로 시작하기</button>
        </div>

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
