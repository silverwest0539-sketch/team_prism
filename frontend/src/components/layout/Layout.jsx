import React, { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import BrandLogo from '../common/BrandLogo';
import ScrollToTopButton from '../common/ScrollToTopButton'; // ?몚 異붽?

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
          aria-label="硫붾돱 ?닿린"
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <BrandLogo
          imageHeightClass="h-7"
          textClassName="text-lg font-bold text-blue-600"
        />
        <div className="w-9" />
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main
        className={`w-full min-w-0 pt-16 lg:pt-0 lg:pl-64 relative z-0 ${
          isSidebarOpen ? 'max-lg:pointer-events-none' : ''
        }`}
      >
        {children}
      </main>

      {/* ?몚 ?ш린??踰꾪듉 而댄룷?뚰듃瑜?異붽??섎㈃ 紐⑤뱺 ?섏씠吏???뚯븘???ㅼ뼱媛묐땲?? */}
      <ScrollToTopButton /> 
    </div>
  );
};

export default Layout;

