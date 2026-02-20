// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout'; // 레이아웃

// 페이지 컴포넌트 import
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage'; // 👈 1. HomePage import 확인
import CreationPage from './pages/CreationPage';
import AnalysisPage from './pages/AnalysisPage';
import MyPage from './pages/MyPage'; // 👈 1. MyPage import 추가
import ScrapPage from './components/mypage/ScrapPage'; // 스크랩 페이지(컴포넌트 위치)
import FindPasswordPage from './pages/FindPasswordPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== 사이드바 없는 페이지들 (인증 관련) ===== */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/find-password" element={<FindPasswordPage />} />

        {/* ===== 사이드바 있는 페이지들 (메인 서비스) ===== */}

        {/* 1. 홈 화면 (로그인 후 이동할 경로) */}
        <Route path="/home" element={
          <Layout>
            <HomePage />
          </Layout>
        } />

        {/* 2. 상세 분석 페이지 */}
        <Route path="/analysis" element={
          <Layout>
            <AnalysisPage />
          </Layout>
        } />

        {/* 3. 컨텐츠 생성 페이지 */}
        <Route path="/creation" element={
          <Layout>
            <CreationPage />
          </Layout>
        } />

        {/* 👇 4. 스크랩 페이지 라우트 추가 */}
        <Route path="/scrap" element={
          <Layout>
            <ScrapPage />
          </Layout>
        } />

        {/* 👇 2. 마이페이지 라우트 추가 */}
        <Route path="/mypage" element={
          <Layout>
            <MyPage />
          </Layout>
        } />

      </Routes>
    </BrowserRouter>
  );
}

export default App;