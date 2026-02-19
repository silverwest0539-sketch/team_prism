// src/components/layout/Sidebar.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getMenuClass = (path) => {
    return location.pathname === path
      ? "bg-blue-50 text-blue-600 font-bold p-3 rounded-lg cursor-pointer transition-colors"
      : "text-gray-500 hover:text-blue-600 hover:bg-gray-50 font-medium p-3 rounded-lg cursor-pointer transition-colors";
  };

  const bottomMenuClass = "text-gray-500 p-3 cursor-pointer flex items-center gap-2 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors font-medium";

  // 로그아웃 핸들러
  const handleLogout = () => {
    // 여기에 실제 로그아웃 로직 (예: 토큰 삭제 등) 추가
    const confirmLogout = window.confirm("정말 로그아웃 하시겠습니까?");
    if (confirmLogout) {
        alert("로그아웃 되었습니다.");
        navigate('/'); // 로그인 페이지 등으로 이동
    }
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col p-6 fixed left-0 top-0 font-sans z-50">
      <h1
        className="text-2xl font-bold text-blue-600 mb-10 cursor-pointer"
        onClick={() => navigate('/home')}
      >
        Prism
      </h1>

      <nav className="flex-1 space-y-2">
        <div className={getMenuClass('/home')} onClick={() => navigate('/home')}>
          트렌드 대시보드
        </div>

        <div className={getMenuClass('/analysis')} onClick={() => navigate('/analysis')}>
          키워드 심층 분석
        </div>

        <div className={getMenuClass('/creation')} onClick={() => navigate('/creation')}>
          컨텐츠 생성
        </div>

        <div className={getMenuClass('/scrap')} onClick={() => navigate('/scrap')}>
          내 스크랩
        </div>
      </nav>

      {/* 하단 메뉴 영역 */}
      <div className="mt-auto space-y-1 pt-4 border-t border-gray-100">
        <div 
          className={bottomMenuClass}
          onClick={() => alert('알림 기능은 준비 중입니다.')}
        >
          알림
        </div>
        
        <div 
          className={getMenuClass('/mypage')}
          onClick={() => navigate('/mypage')}
        >
          마이페이지
        </div>

        {/* ✅ 로그아웃 추가됨 */}
        <div 
          className="text-red-500 p-3 cursor-pointer flex items-center gap-2 hover:bg-red-50 rounded-lg transition-colors font-medium mt-2"
          onClick={handleLogout}
        >
          로그아웃
        </div>
      </div>
    </div>
  );
};

export default Sidebar;