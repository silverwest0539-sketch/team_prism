import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import { getStoredUser } from '../utils/authStorage';
import { setStoredToken } from '../utils/authToken';
import { validateAndConsumeOAuthState } from '../utils/oauthState';
import { showToast } from '../utils/toast';

const SUPPORTED_PROVIDERS = new Set(['kakao', 'naver']);

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { provider } = useParams();
  const isProcessed = useRef(false);

  useEffect(() => {
    if (isProcessed.current) return;

    const normalizedProvider = String(provider || '').trim().toLowerCase();
    if (!SUPPORTED_PROVIDERS.has(normalizedProvider)) {
      isProcessed.current = true;
      showToast('잘못된 OAuth 요청입니다.', { type: 'error' });
      navigate('/login', { replace: true });
      return;
    }

    const params = new URLSearchParams(location.search);
    const code = String(params.get('code') || '').trim();
    const state = String(params.get('state') || '').trim();

    if (!code) return;
    isProcessed.current = true;

    const storedUser = getStoredUser();

    if (normalizedProvider === 'naver' || normalizedProvider === 'kakao') {
      const isValidState = validateAndConsumeOAuthState(normalizedProvider, state);
      if (!isValidState) {
        showToast('소셜 로그인 검증에 실패했습니다. 다시 시도해 주세요.', { type: 'error' });
        navigate(storedUser ? '/mypage' : '/login', { replace: true });
        return;
      }
    }

    if (storedUser) {
      apiClient
        .post(`/auth/link/${normalizedProvider}`, {
          email: storedUser.email,
          code,
          state,
        })
        .then((response) => {
          if (!response.data.success) return;

          sessionStorage.setItem('user', JSON.stringify(response.data.user));
          showToast('계정 연동 및 통합이 완료되었습니다.', { type: 'success' });
          navigate('/mypage');
        })
        .catch((error) => {
          console.error('연동 에러:', error);
          showToast('계정 연동에 실패했습니다.', { type: 'error' });
          navigate('/mypage');
        });
      return;
    }

    apiClient
      .post(`/auth/${normalizedProvider}`, { code, state })
      .then((response) => {
        if (!response.data.success) return;

        const isTokenSaved = setStoredToken(response.data.token);
        if (!isTokenSaved) {
          showToast('인증 정보 처리에 실패했습니다. 다시 로그인해 주세요.', { type: 'error' });
          navigate('/login', { replace: true });
          return;
        }

        sessionStorage.setItem('user', JSON.stringify(response.data.user));
        showToast(`환영합니다 ${response.data.user.nickname}님`, { type: 'success' });
        navigate('/home');
      })
      .catch((error) => {
        console.error('소셜 로그인 에러:', error);
        showToast('소셜 로그인에 실패했습니다.', { type: 'error' });
        navigate('/login');
      });
  }, [location.search, navigate, provider]);

  const providerLabel = provider === 'kakao' ? '카카오' : '네이버';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-xl font-bold text-gray-700 animate-pulse">
        {providerLabel} 로그인 처리 중입니다...
      </div>
    </div>
  );
};

export default OAuthCallback;
