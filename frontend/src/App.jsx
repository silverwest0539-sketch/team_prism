// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ToastViewport from './components/common/ToastViewport';
import ScrollToTop from './components/common/ScrollToTop'; // ✅ 추가
import Layout from './components/layout/Layout';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const FindPasswordPage = lazy(() => import('./pages/FindPasswordPage'));
const OAuthCallback = lazy(()=> import('./pages/OAuthCallback'))
const HomePage = lazy(() => import('./pages/HomePage'));
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'));
const CreationPage = lazy(() => import('./pages/CreationPage'));
const ScrapPage = lazy(() => import('./components/mypage/ScrapPage'));
const MyPage = lazy(() => import('./pages/MyPage'));

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">
    페이지 로딩 중...
  </div>
);

const withLayout = (element) => <Layout>{element}</Layout>;

function App() {
  return (
    <BrowserRouter>
      <ToastViewport />
      <ScrollToTop /> {/* ✅ 추가 */}
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/find-password" element={<FindPasswordPage />} />
          <Route path="/oauth/callback/:provider" element={<OAuthCallback />} />
          <Route path="/home" element={withLayout(<HomePage />)} />
          <Route path="/analysis" element={withLayout(<AnalysisPage />)} />
          {/* [추가] 키워드를 파라미터로 받는 경로 */}
          <Route path="/analysis/:keyword" element={withLayout(<AnalysisPage />)} />
          <Route path="/creation" element={withLayout(<CreationPage />)} />
          <Route path="/scrap" element={withLayout(<ScrapPage />)} />
          <Route path="/mypage" element={withLayout(<MyPage />)} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
