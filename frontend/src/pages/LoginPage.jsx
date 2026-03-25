import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import BrandLogo from '../components/common/BrandLogo';
import { setStoredToken } from '../utils/authToken';
import { createAndStoreOAuthState } from '../utils/oauthState';
import { showToast } from '../utils/toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleKakaoLogin = () => {
    const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const REDIRECT_URI = `${window.location.origin}/oauth/callback/kakao`;
    const state = createAndStoreOAuthState('kakao');
    const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&state=${state}`;
    window.location.href = kakaoURL;
  };

  const handleNaverLogin = () => {
    const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID;
    const REDIRECT_URI = `${window.location.origin}/oauth/callback/naver`;
    const state = createAndStoreOAuthState('naver');
    const naverURL = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${state}`;
    window.location.href = naverURL;
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      if (!response.data.success) return;

      const isTokenSaved = setStoredToken(response.data.token);
      if (!isTokenSaved) {
        showToast('인증 정보 처리에 실패했습니다. 다시 로그인해 주세요.', { type: 'error' });
        return;
      }

      sessionStorage.setItem('user', JSON.stringify(response.data.user));
      showToast(`환영합니다 ${response.data.user.nickname}님`, { type: 'success' });
      navigate('/home');
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
            className="mb-2 transition-all duration-500 cursor-pointer select-none"
            title="PicKey 메인으로 이동"
            aria-label="PicKey 로고"
          >
            <BrandLogo
              imageHeightClass="h-10"
              imageClassName="mx-auto"
              textClassName="text-4xl font-bold"
            />
          </h1>
          <p className="text-gray-600 font-medium">서비스 이용을 위해 로그인해 주세요.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="form-label">이메일</label>
            <input
              type="text"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="이메일을 입력해 주세요."
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력해 주세요."
              className="form-input"
            />
          </div>

          <button type="submit" className="btn-auth-primary text-lg">
            로그인
          </button>
        </form>

        <div className="mt-6 space-y-2">
          <button type="button" onClick={handleKakaoLogin} className="btn-kakao w-full py-2 bg-yellow-300 rounded font-bold">
            카카오톡으로 시작하기
          </button>
          <button type="button" onClick={handleNaverLogin} className="btn-naver w-full py-2 bg-green-500 text-white rounded font-bold">
            네이버로 시작하기
          </button>
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
