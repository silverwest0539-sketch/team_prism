import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Moon, Sun, X } from 'lucide-react'; // Settings 아이콘은 마이페이지 메뉴 이동으로 사용하지 않아 제거됨
import { getStoredUser } from '../../utils/authStorage';
import { THEMES, getStoredTheme, applyTheme, saveTheme, toggleTheme, resetThemeToLight } from '../../utils/theme';

const MAIN_MENUS = [
  { path: '/home', label: '트렌드 대시보드' },
  { path: '/analysis', label: '키워드 심층 분석' },
  { path: '/creation', label: '콘텐츠 생성' },
];

const Sidebar = ({ isOpen = false, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [theme, setTheme] = useState(() => getStoredTheme());

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
    const storedUser = getStoredUser();
    setUserInfo(storedUser);
    if (!storedUser) {
      setTheme(THEMES.LIGHT);
    }
  }, [location.pathname, isOpen]);

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!isLogoutConfirmOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsLogoutConfirmOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isLogoutConfirmOpen]);

  const getMenuClass = (path) =>
    location.pathname === path
      ? 'bg-blue-50 text-blue-600 font-bold p-3 rounded-lg cursor-pointer transition-colors'
      : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50 font-medium p-3 rounded-lg cursor-pointer transition-colors';

  const handleNavigate = (path) => {
    navigate(path);
    setIsProfileOpen(false);
    onClose?.();
  };

  const requestLogout = () => {
    setIsProfileOpen(false);
    setIsLogoutConfirmOpen(true);
  };

  const handleThemeToggle = () => {
    setTheme((prev) => toggleTheme(prev));
    setIsProfileOpen(false);
  };

  const cancelLogout = () => {
    setIsLogoutConfirmOpen(false);
  };

  const confirmLogout = () => {
    setIsLogoutConfirmOpen(false);
    window.sessionStorage.removeItem('token');
    window.sessionStorage.removeItem('user');
    resetThemeToLight();
    setTheme(THEMES.LIGHT);
    navigate('/');
    onClose?.();
  };

  // 로그인 상태일 때만 마이페이지를 사이드바 메뉴에 동적으로 추가
  const dynamicMenus = userInfo
    ? [...MAIN_MENUS, { path: '/mypage', label: '마이페이지 / 저장내역' }]
    : MAIN_MENUS;

  const DesktopSidebar = () => (
    <aside className="hidden lg:flex w-64 h-screen bg-white border-r border-gray-200 p-6 fixed left-0 top-0 font-sans z-50 overflow-y-auto">
      <div className="w-full flex flex-col">
        <h1
          className="text-2xl font-bold text-blue-600 mb-10 cursor-pointer"
          onClick={() => handleNavigate('/home')}
        >
          PicKey
        </h1>

        <nav className="flex-1 space-y-2">
          {dynamicMenus.map((menu) => (
            <div
              key={menu.path}
              className={getMenuClass(menu.path)}
              onClick={() => handleNavigate(menu.path)}
            >
              {menu.label}
            </div>
          ))}
        </nav>

        <div className="sidebar-user-wrap mt-auto relative pt-4 border-t border-gray-100" ref={menuRef}>
          {userInfo ? (
            <>
              {isProfileOpen && (
                <div className="sidebar-profile-menu absolute bottom-full left-0 w-full bg-white rounded-2xl shadow-xl border border-gray-100 py-2 mb-2 z-50">
                  <div className="sidebar-profile-menu-header px-4 py-3 border-b border-gray-100 mb-1">
                    <p className="sidebar-profile-menu-name text-sm font-bold text-gray-900">{userInfo.nickname}님</p>
                    <p className="sidebar-profile-menu-email text-xs text-gray-500 truncate">{userInfo.user_email || userInfo.email}</p>
                  </div>
                  {/* 기존 마이페이지 버튼 위치 (사이드바로 이동하여 제거함) */}
                  <button
                    onClick={handleThemeToggle}
                    className="sidebar-profile-action-btn sidebar-profile-theme-btn w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {theme === THEMES.DARK ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} 테마 변경
                    <span className="sidebar-profile-theme-state ml-auto text-xs text-gray-400">
                      {theme === THEMES.DARK ? '다크' : '라이트'}
                    </span>
                  </button>
                  <button
                    onClick={requestLogout}
                    className="sidebar-profile-action-btn sidebar-profile-logout-btn w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> 로그아웃
                  </button>
                </div>
              )}
              <div
                className="sidebar-user-trigger flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-gray-50 transition-colors"
                onClick={() => setIsProfileOpen((prev) => !prev)}
              >
                <div className="sidebar-user-avatar w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-sm">
                  {userInfo.nickname?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="sidebar-user-name text-sm font-bold text-gray-700 truncate">{userInfo.nickname}님</p>
                  <p className="sidebar-user-sub text-xs text-gray-400">설정 열기</p>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={() => handleNavigate('/login')}
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
              PicKey
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
            {dynamicMenus.map((menu) => (
              <div
                key={menu.path}
                className={getMenuClass(menu.path)}
                onClick={() => handleNavigate(menu.path)}
              >
                {menu.label}
              </div>
            ))}
          </nav>

          <div className="sidebar-user-wrap pt-4 border-t border-gray-100 space-y-2">
            {userInfo ? (
              <div className="space-y-1">
                <div className="sidebar-profile-menu px-3 py-3 mb-2 bg-gray-50 rounded-xl">
                  <p className="sidebar-profile-menu-name text-sm font-bold text-gray-900">{userInfo.nickname}님</p>
                  <p className="sidebar-profile-menu-email text-xs text-gray-500 truncate">{userInfo.user_email || userInfo.email}</p>
                </div>

                {/* 기존 모바일용 마이페이지 버튼 위치 (사이드바로 이동하여 제거함) */}

                <button
                  onClick={handleThemeToggle}
                  className="sidebar-profile-action-btn sidebar-profile-theme-btn w-full flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {theme === THEMES.DARK ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} 테마 변경
                  <span className="sidebar-profile-theme-state ml-auto text-xs text-gray-400">
                    {theme === THEMES.DARK ? '다크' : '라이트'}
                  </span>
                </button>

                <button
                  onClick={requestLogout}
                  className="sidebar-profile-action-btn sidebar-profile-logout-btn w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" /> 로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavigate('/login')}
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

      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={cancelLogout}
            className="absolute inset-0 bg-black/45"
            aria-label="로그아웃 취소"
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white border border-gray-200 shadow-2xl p-5">
            <h3 className="text-base font-bold text-gray-900">로그아웃</h3>
            <p className="mt-2 text-sm text-gray-600">정말 로그아웃 하시겠습니까?</p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelLogout}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
