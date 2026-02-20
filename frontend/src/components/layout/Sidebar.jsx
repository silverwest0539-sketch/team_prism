import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Settings, X } from 'lucide-react';

const MAIN_MENUS = [
  { path: '/home', label: '트렌드 대시보드' },
  { path: '/analysis', label: '키워드 심층 분석' },
  { path: '/creation', label: '컨텐츠 생성' }

];

const Sidebar = ({ isOpen = false, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const menuRef = useRef(null);
  // 유저 정보 상태 추가
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUserInfo(JSON.parse(savedUser));
    }
  }, []);

  const getMenuClass = (path) =>
    location.pathname === path
      ? 'bg-blue-50 text-blue-600 font-bold p-3 rounded-lg cursor-pointer transition-colors'
      : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50 font-medium p-3 rounded-lg cursor-pointer transition-colors';

  const handleNavigate = (path) => {
    navigate(path);
    setIsProfileOpen(false);
    onClose?.();
  };

  const handleLogout = () => {
  if (window.confirm('정말 로그아웃 하시겠습니까?')) {
    localStorage.removeItem('token'); // 토큰 삭제
    localStorage.removeItem('user');  // 유저 정보 삭제
    navigate('/');
    onClose?.();
  }
};

  const DesktopSidebar = () => (
    <aside className="hidden lg:flex w-64 h-screen bg-white border-r border-gray-200 p-6 fixed left-0 top-0 font-sans z-50 overflow-y-auto">
      <div className="w-full flex flex-col">
        <h1
          className="text-2xl font-bold text-blue-600 mb-10 cursor-pointer"
          onClick={() => handleNavigate('/home')}
        >
          Prism
        </h1>

        <nav className="flex-1 space-y-2">
          {MAIN_MENUS.map((menu) => (
            <div
              key={menu.path}
              className={getMenuClass(menu.path)}
              onClick={() => handleNavigate(menu.path)}
            >
              {menu.label}
            </div>
          ))}
        </nav>

        <div className="mt-auto relative pt-4 border-t border-gray-100" ref={menuRef}>
          {userInfo ? (
          // 1. 로그인한 상태: 프로필 정보 표시
          <>
            {isProfileOpen && (
              <div className="absolute bottom-full left-0 w-full bg-white rounded-2xl shadow-xl border border-gray-100 py-2 mb-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100 mb-1">
                  <p className="text-sm font-bold text-gray-900">{userInfo.nickname}님</p>
                  <p className="text-xs text-gray-500 truncate">{userInfo.user_email || userInfo.email}</p>
                </div>
                <button
                  onClick={() => alert('기능 준비 중 입니다.')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Bell className="w-4 h-4" /> 알림
                </button>
                <button
                  onClick={() => handleNavigate('/mypage')}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4" /> 마이페이지
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> 로그아웃
                </button>
              </div>
            )}
            <div
              className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-gray-50 transition-colors"
              onClick={() => setIsProfileOpen((prev) => !prev)}
            >
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-sm">
                {userInfo.nickname?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-700 truncate">{userInfo.nickname}님</p>
                <p className="text-xs text-gray-400">설정 더보기</p>
              </div>
            </div>
          </>
        ) : (
          // 2. 로그인 안 한 상태: 로그인하기 버튼 표시
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md"
          >
            로그인하기
          </button>
        )}
        </div>
      </div>
    </aside>
  );

  const MobileSidebar = () => (
    <div
      className={`lg:hidden fixed inset-0 z-50 transition ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <button
        type="button"
        aria-label="사이드바 닫기"
        onClick={() => onClose?.()}
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white border-r border-gray-200 p-6 font-sans shadow-xl transition-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h1
              className="text-2xl font-bold text-blue-600 cursor-pointer"
              onClick={() => handleNavigate('/home')}
            >
              Prism
            </h1>
            <button
              type="button"
              onClick={() => onClose?.()}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="메뉴 닫기"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {MAIN_MENUS.map((menu) => (
              <div
                key={menu.path}
                className={getMenuClass(menu.path)}
                onClick={() => handleNavigate(menu.path)}
              >
                {menu.label}
              </div>
            ))}
          </nav>

          <div className="pt-4 border-t border-gray-100 space-y-2">
            {userInfo ? (
              <div className="space-y-1">
                {/* 모바일에서는 드롭다운보다 리스트 형태가 편리합니다 */}
                <div className="px-3 py-3 mb-2 bg-gray-50 rounded-xl">
                  <p className="text-sm font-bold text-gray-900">{userInfo.nickname}님</p>
                  <p className="text-xs text-gray-500 truncate">{userInfo.user_email || userInfo.email}</p>
                </div>
                
                <button
                  onClick={() => handleNavigate('/mypage')}
                  className="w-full flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" /> 마이페이지
                </button>
                
                <button
                  onClick={() => alert('알림 기능 준비중')}
                  className="w-full flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Bell className="w-4 h-4" /> 알림
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" /> 로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-xl font-bold"
              >
                로그인하기
              </button>
            )}
          </div>
        </div>
    </aside>
    </div>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
};

export default Sidebar;
