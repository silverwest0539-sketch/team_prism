import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Settings, X } from 'lucide-react';

const MAIN_MENUS = [
  { path: '/home', label: '트렌드 대시보드' },
  { path: '/analysis', label: '키워드 심층 분석' },
  { path: '/creation', label: '컨텐츠 생성' },
  { path: '/scrap', label: '내 스크랩' }
];

const Sidebar = ({ isOpen = false, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
          {isProfileOpen && (
            <div className="absolute bottom-14 left-0 w-60 bg-white border border-gray-200 rounded-xl shadow-lg p-2 animate-fade-in-up z-50 mb-2">
              <div className="px-4 py-3 border-b border-gray-100 mb-1">
                <p className="text-sm font-bold text-gray-900">마케터님</p>
                <p className="text-xs text-gray-500 truncate">marketer@trendguard.ai</p>
              </div>

              <div
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer text-gray-700 text-sm"
                onClick={() => handleNavigate('/mypage')}
              >
                <Settings size={16} /> 마이페이지
              </div>

              <div
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer text-gray-700 text-sm"
                onClick={() => {
                  alert('알림 기능 준비중');
                  setIsProfileOpen(false);
                }}
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

          <div
            className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-gray-50 transition-colors"
            onClick={() => setIsProfileOpen((prev) => !prev)}
          >
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold shadow-sm">
              M
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-700 truncate">마케터님</p>
              <p className="text-xs text-gray-400">설정 더보기</p>
            </div>
          </div>
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
            <button
              type="button"
              className="w-full text-left text-gray-600 hover:text-blue-600 hover:bg-gray-50 font-medium p-3 rounded-lg transition-colors"
              onClick={() => handleNavigate('/mypage')}
            >
              마이페이지
            </button>
            <button
              type="button"
              className="w-full text-left text-gray-600 hover:text-blue-600 hover:bg-gray-50 font-medium p-3 rounded-lg transition-colors"
              onClick={() => alert('알림 기능 준비중')}
            >
              알림
            </button>
            <button
              type="button"
              className="w-full text-left text-red-500 hover:bg-red-50 font-medium p-3 rounded-lg transition-colors"
              onClick={handleLogout}
            >
              로그아웃
            </button>
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
