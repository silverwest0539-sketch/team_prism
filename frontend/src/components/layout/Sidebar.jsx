import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react'; // 아이콘 import

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 메인 메뉴 스타일
  const getMenuClass = (path) => {
    return location.pathname === path
      ? "bg-blue-50 text-blue-600 font-bold p-3 rounded-lg cursor-pointer transition-colors"
      : "text-gray-500 hover:text-blue-600 hover:bg-gray-50 font-medium p-3 rounded-lg cursor-pointer transition-colors";
  };

  // 하단 메뉴 공통 스타일
  const bottomMenuClass =
    "text-gray-500 p-3 cursor-pointer flex items-center gap-2 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors font-medium";

  // 로그아웃 핸들러
  const handleLogout = () => {
    const confirmLogout = window.confirm("정말 로그아웃 하시겠습니까?");
    if (confirmLogout) {
      navigate('/'); // 로그인 페이지로 이동
    }
  };

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

      {/* 하단 고정 영역 */}
      <div className="mt-auto space-y-1 pt-4 border-t border-gray-100">
        
        {/* 알림 & 마이페이지 */}
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

        {/* 👇 [수정됨] 하단 Row: 좌측(은색 원) vs 우측(로그아웃) */}
        <div className="flex items-center justify-between mt-6 px-1">
          
          {/* 1. 좌측: 은색 서클 아이콘 (추후 메뉴용 placeholder) */}
          <div 
            className="w-10 h-10 rounded-full bg-gray-300 hover:bg-gray-400 cursor-pointer transition-colors shadow-sm"
            title="추후 기능 추가 예정"
            onClick={() => console.log("New Feature Button Clicked")}
          ></div>

          {/* 2. 우측: 작은 로그아웃 버튼 */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
            title="로그아웃"
          >
            <LogOut size={14} />
            로그아웃
          </button>
        </div>

      </div>
    </div>
  );
};

export default Sidebar;