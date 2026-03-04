// src/components/common/ScrollToTopButton.jsx
import React, { useState, useEffect } from 'react';
import { CaretUp } from '@phosphor-icons/react'; // 프로젝트에서 사용하는 아이콘 라이브러리에 맞게 import 하세요

const ScrollToTopButton = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 스크롤 위치에 따라 버튼 표시 여부 결정
  useEffect(() => {
    const handleScroll = () => {
      // 스크롤이 300px 이상 내려갔을 때 버튼 표시
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 상단으로 부드럽게 스크롤하는 함수
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 p-3 sm:p-4 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-300 hover:bg-indigo-700 hover:-translate-y-1 transition-all duration-300 z-50 flex items-center justify-center animate-fade-in-up group"
          aria-label="상단으로 이동"
        >
          <CaretUp size={20} weight="bold" className="group-hover:scale-110 transition-transform" />
        </button>
      )}
    </>
  );
};

export default ScrollToTopButton;