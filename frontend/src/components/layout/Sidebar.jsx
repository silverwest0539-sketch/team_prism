import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ onOpenSummary = () => { } }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 경로와 일치하면 파란색, 아니면 회색 스타일 적용
  const getMenuClass = (path) => {
    return location.pathname === path
      ? "bg-blue-50 text-blue-600 font-bold p-3 rounded-lg cursor-pointer transition-colors"
      : "text-gray-500 hover:text-blue-600 hover:bg-gray-50 font-medium p-3 rounded-lg cursor-pointer transition-colors";
  };

  // 하단 메뉴용 스타일 (기존 메뉴보다 조금 더 심플하게 유지하되 통일감 부여)
  const bottomMenuClass = "text-gray-500 p-3 cursor-pointer flex items-center gap-2 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors font-medium";

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col p-6 fixed left-0 top-0 font-sans z-50">
      {/* 로고 영역 */}
      <h1
        className="text-2xl font-bold text-blue-600 mb-10 cursor-pointer"
        onClick={() => navigate('/home')}
      >
        Prism
      </h1>

      {/* 메인 네비게이션 */}
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

      {/* 하단 메뉴 영역 (알림, 마이페이지 이동) */}
      <div className="mt-auto space-y-1 pt-4 border-t border-gray-100">
        <div 
          className={bottomMenuClass}
          onClick={() => alert('알림 기능은 준비 중입니다.')} // 혹은 navigate('/notifications')
        >
          알림
        </div>
        
        <div 
          className={getMenuClass('/mypage')} // 현재 페이지가 마이페이지면 활성화 표시
          onClick={() => navigate('/mypage')}
        >
          마이페이지
        </div>
      </div>
    </div>
  );
};

export default Sidebar;