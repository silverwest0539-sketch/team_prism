// src/pages/LoginPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const LOGO_TRIGGER_COUNT = 5;
const CLICK_RESET_MS = 1500;
const EASTER_EGG_MS = 1600;
const EASTER_EGG_IMAGE = '/flying_toasts.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [isEasterEggActive, setIsEasterEggActive] = useState(false);
  const [showEasterEggToast, setShowEasterEggToast] = useState(false);
  const [showEasterEggImage, setShowEasterEggImage] = useState(false);
  const [isImageFlying, setIsImageFlying] = useState(false);

  const clickResetTimerRef = useRef(null);
  const easterEggTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (clickResetTimerRef.current) clearTimeout(clickResetTimerRef.current);
      if (easterEggTimerRef.current) clearTimeout(easterEggTimerRef.current);
    };
  }, []);

  const handleLogoClick = () => {
    if (clickResetTimerRef.current) clearTimeout(clickResetTimerRef.current);

    const nextCount = logoClickCount + 1;
    if (nextCount >= LOGO_TRIGGER_COUNT) {
      setLogoClickCount(0);
      setIsEasterEggActive(true);
      setShowEasterEggToast(true);
      setShowEasterEggImage(true);
      setIsImageFlying(false);

      requestAnimationFrame(() => {
        setIsImageFlying(true);
      });

      if (easterEggTimerRef.current) clearTimeout(easterEggTimerRef.current);
      easterEggTimerRef.current = setTimeout(() => {
        setIsEasterEggActive(false);
        setShowEasterEggToast(false);
        setShowEasterEggImage(false);
        setIsImageFlying(false);
      }, EASTER_EGG_MS);
      return;
    }

    setLogoClickCount(nextCount);
    clickResetTimerRef.current = setTimeout(() => {
      setLogoClickCount(0);
    }, CLICK_RESET_MS);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        alert(`환영합니다! ${response.data.user.nickname}님`);
        navigate('/home');
      }
    } catch (error) {
      alert(error.response?.data?.message || '로그인 실패');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {showEasterEggToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-bold shadow-lg animate-pulse">
          Toasts are flying!
        </div>
      )}

      {showEasterEggImage && (
        <div className="pointer-events-none fixed inset-0 z-40">
          <img
            src={EASTER_EGG_IMAGE}
            alt="Flying toasts"
            className="fixed left-1/2 top-1/2 w-[78vw] max-w-[500px] select-none drop-shadow-2xl"
            style={{
              transform: isImageFlying
                ? 'translate(calc(-50% + 55vw), calc(-50% - 48vh)) scale(0.72) rotate(18deg)'
                : 'translate(-50%, -50%) scale(1) rotate(0deg)',
              opacity: isImageFlying ? 0 : 1,
              transition: `transform ${EASTER_EGG_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity ${EASTER_EGG_MS}ms ease-out`,
            }}
          />
        </div>
      )}

      <div className="card-soft w-full max-w-md shadow-lg">
        <div className="text-center mb-10">
          <h1
            role="button"
            tabIndex={0}
            onClick={handleLogoClick}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleLogoClick();
              }
            }}
            className={`text-4xl font-bold mb-2 transition-all duration-500 cursor-pointer select-none ${
              isEasterEggActive
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-pink-500 to-emerald-500 scale-110 drop-shadow-[0_0_12px_rgba(99,102,241,0.45)]'
                : 'text-indigo-600 hover:text-indigo-700'
            }`}
            title="Prism"
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
