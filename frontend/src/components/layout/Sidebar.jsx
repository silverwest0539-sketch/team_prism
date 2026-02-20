import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Bell, User, Settings, ChevronRight } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false); // 프로필 팝업 상태
  const menuRef = useRef(null); // 외부 클릭 감지용

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getMenuClass = (path) => {
    return location.pathname === path
      ? "bg-blue-50 text-blue-600 font-bold p-3 rounded-lg cursor-pointer transition-colors"
      : "text-gray-500 hover:text-blue-600 hover:bg-gray-50 font-medium p-3 rounded-lg cursor-pointer transition-colors";
  };

  const handleLogout = () => {
    if (window.confirm("정말 로그아웃 하시겠습니까?")) {
      navigate('/');
    }
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col p-6 fixed left-0 top-0 font-sans z-50">
      {/* 로고 */}
      <h1
        className="text-2xl font-bold text-blue-600 mb-10 cursor-pointer"
        onClick={() => navigate('/home')}
      >
        Prism
      </h1>

      {/* 메인 메뉴 */}
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
      </nav>

      {/* 하단 프로필 영역 (팝업 메뉴 포함) */}
      <div className="mt-auto relative" ref={menuRef}>
        
        {/* 팝업 메뉴 (프로필 아이콘 클릭 시 등장) */}
        {isProfileOpen && (
          <div className="absolute bottom-14 left-0 w-60 bg-white border border-gray-200 rounded-xl shadow-lg p-2 animate-fade-in-up z-50 mb-2">
            {/* 사용자 정보 간략 표시 */}
            <div className="px-4 py-3 border-b border-gray-100 mb-1">
              <p className="text-sm font-bold text-gray-900">마케터님</p>
              <p className="text-xs text-gray-500 truncate">marketer@trendguard.ai</p>
            </div>

            {/* 메뉴 리스트 */}
            <div 
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer text-gray-700 text-sm"
              onClick={() => { navigate('/mypage'); setIsProfileOpen(false); }}
            >
              <Settings size={16} /> 마이페이지
            </div>
            
            <div 
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer text-gray-700 text-sm"
              onClick={() => { alert('알림 기능 준비중'); setIsProfileOpen(false); }}
            >
              <Bell size={16} /> 알림
            </div>

            <div 
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 rounded-lg cursor-pointer text-red-500 text-sm mt-1"
              onClick={handleLogout}
            >
              <LogOut size={16} /> 로그아웃
            </div>
          </div>
        )}

        {/* 프로필 서클 버튼 */}
        <div 
          className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-gray-50 transition-colors"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold shadow-sm">
            {/* 이미지가 있다면 <img /> 태그 사용, 없다면 이니셜 */}
            M
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-700">마케터님</p>
            <p className="text-xs text-gray-400">설정 더보기</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;