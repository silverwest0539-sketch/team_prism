import React, { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isSidebarOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isSidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <header className="lg:hidden fixed inset-x-0 top-0 z-40 h-16 bg-white/95 backdrop-blur border-b border-gray-200 px-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="메뉴 열기"
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <span className="text-lg font-bold text-blue-600">Prism</span>
        <div className="w-9" />
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="w-full min-w-0 pt-16 lg:pt-0 lg:pl-64">
        {children}
      </main>
    </div>
  );
};

export default Layout;
