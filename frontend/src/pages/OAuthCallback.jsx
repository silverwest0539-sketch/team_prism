// src/pages/OAuthCallback.jsx
import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import { showToast } from '../utils/toast';
import { getStoredUser } from '../utils/authStorage';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { provider } = useParams(); // URL 파라미터에서 kakao 또는 naver 추출
  
  // React 18의 StrictMode로 인해 useEffect가 두 번 실행되는 것을 방지하기 위한 Ref
  const isProcessed = useRef(false);

  useEffect(() => {
    if (isProcessed.current) return;

    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state'); // 네이버용

    if (code) {
      isProcessed.current = true;

      const storedUser = getStoredUser();

      if (storedUser) {
        apiClient.post(`/auth/link/${provider}`, { 
          email: storedUser.email, 
          code, 
          state 
        })
        .then(response => {
          if (response.data.success) {
            // 연동 후 업데이트된 유저 정보를 다시 저장 (kakaoId 등 반영 위함)
            localStorage.setItem('user', JSON.stringify(response.data.user));
            showToast('계정 연동 및 통합이 완료되었습니다.', { type: 'success' });
            navigate('/mypage');
          }
        })
        .catch(error => {
          console.error("연동 에러:", error);
          showToast('계정 연동에 실패했습니다.', { type: 'error' });
          navigate('/mypage');
        });
      } else {
      // 상황 B: 로그아웃 상태에서 버튼을 누른 경우 -> 일반 로그인 수행
      apiClient.post(`/auth/${provider}`, { code, state })
        .then(response => {
          if (response.data.success) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            showToast(`환영합니다! ${response.data.user.nickname}님`, { type: 'success' });
            navigate('/home');
          }
        })
        .catch(error => {
          console.error("소셜 로그인 에러:", error);
          showToast('소셜 로그인에 실패했습니다.', { type: 'error' });
          navigate('/login');
        });
    }
  }
}, [location, navigate, provider]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-xl font-bold text-gray-700 animate-pulse">
        {provider === 'kakao' ? '카카오' : '네이버'} 로그인 처리 중입니다...
      </div>
    </div>
  );
};

export default OAuthCallback;