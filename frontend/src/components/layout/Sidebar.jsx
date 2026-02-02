// src/components/layout/Sidebar.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ onOpenSummary = () => {} }) => {  // ✅ 기본값
  const navigate = useNavigate();
  const location = useLocation();

  const getMenuClass = (path) => {
    return location.pathname === path
      ? "bg-blue-50 text-blue-600 font-bold p-3 rounded-lg cursor-pointer transition-colors"
      : "text-gray-500 hover:text-blue-600 hover:bg-gray-50 font-medium p-3 rounded-lg cursor-pointer transition-colors";
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col p-6 fixed left-0 top-0 font-sans">
      <h1
        className="text-2xl font-bold text-blue-600 mb-10 cursor-pointer"
        onClick={() => navigate('/home')}
      >
        Prism
      </h1>

      <nav className="flex-1 space-y-2">
        <div className={getMenuClass('/home')} onClick={() => navigate('/home')}>
          📊 트렌드 대시보드
        </div>

        <div className={getMenuClass('/analysis')} onClick={() => navigate('/analysis')}>
          📑 키워드 심층 분석
        </div>

        <div className={getMenuClass('/creation')} onClick={() => navigate('/creation')}>
          📝 컨텐츠 생성
        </div>

        {/* ✅ 요약 분석 모달 열기 메뉴 */}
        <div
          className="text-gray-500 hover:text-blue-600 hover:bg-gray-50 font-medium p-3 rounded-lg cursor-pointer transition-colors"
          onClick={onOpenSummary}
        >
          ⚡ 요약 분석
        </div>

        <div className="text-gray-500 hover:text-blue-600 cursor-pointer font-medium p-3 rounded-lg">
          🏷️ 내 스크랩
        </div>
      </nav>

      <div
        className="text-gray-500 mt-auto p-2 cursor-pointer flex items-center gap-2 hover:text-blue-600"
        onClick={() => navigate('/mypage')}
      >
        ⚙️ 설정
      </div>
    </div>
  );
};

export default Sidebar;