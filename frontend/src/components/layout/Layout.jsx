// src/components/layout/Layout.jsx
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import SummaryModal from "../analysis/SummaryModal"; // 1. 모달 컴포넌트 import

const Layout = ({ children }) => {
  // 2. 모달 상태 관리 (열림 여부, 선택된 데이터)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState(null);

  // 3. 모달 열기 함수
  const openModal = (data = null) => {
    setSelectedKeyword(data); // 데이터가 있으면 설정 (없으면 null)
    setIsModalOpen(true);     // 모달 열기
  };

  // 4. 모달 닫기 함수
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // 5. children(HomePage 등)에 openModal 함수를 props로 전달하기 위한 처리
  // (App.jsx에서 <Layout><HomePage /></Layout> 구조로 쓰고 계시므로 필요합니다)
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { openModal });
    }
    return child;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 6. Sidebar에도 모달 열기 함수 전달 (사이드바 메뉴 클릭 시 사용) */}
      <Sidebar onOpenSummary={() => openModal(null)} />
      
      <main className="ml-64 p-8 flex-1">
        {/* 기존 children 대신 props가 주입된 children 렌더링 */}
        {childrenWithProps}
      </main>

      {/* 7. 모달 컴포넌트 배치 */}
      <SummaryModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        data={selectedKeyword} 
      />
    </div>
  );
};

export default Layout;