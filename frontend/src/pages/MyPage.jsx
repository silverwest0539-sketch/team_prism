// src/pages/MyPage.jsx
import React, { useState } from 'react';
import { ChevronRight, X, Shield, Trash } from 'lucide-react';
// 스크랩 페이지 컴포넌트 불러오기
import ScrapPage from '../components/mypage/ScrapPage';

const MyPage = () => {
  const [activeModal, setActiveModal] = useState(null);
  const closeModal = () => setActiveModal(null);

  return (
    <div className="page pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 페이지 헤더 */}
      <div className="mb-8 mt-8">
        <h1 className="text-3xl font-bold text-gray-900">마이페이지</h1>
        <p className="text-gray-500 text-sm mt-2">
          계정 설정을 관리하고 스크랩한 콘텐츠를 확인하세요.
        </p>
      </div>

      {/* =========================================
          [수정됨] 프로필 설정 섹션 -> 카드 디자인 적용
          - bg-white, rounded-2xl, shadow-sm, border: 카드 형태
          - flex-row: 좌우 분할
         ========================================= */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row mb-12 min-h-[240px]">
        
        {/* 좌측: 타이틀 및 설명 (회색 배경 적용) */}
        <div className="p-8 md:w-2/5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">프로필</h2>
          <p className="text-sm text-gray-500 leading-relaxed break-keep">
            개인정보 및 보안 설정, 알림 및<br className="hidden md:block"/> 
            회원 탈퇴를 관리할 수 있습니다.
          </p>
        </div>

        {/* 우측: 메뉴 리스트 영역 */}
        <div className="p-6 md:w-3/5 flex flex-col justify-center">
            
            {/* 1. 계정 정보 */}
            <div 
              onClick={() => setActiveModal('account')}
              className="group flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition">계정 정보</h3>
                <p className="text-xs text-gray-400 mt-1">프로필 편집, 비밀번호 변경</p>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-600 transition" />
            </div>

            {/* 2. 알림 설정 */}
            <div 
              onClick={() => setActiveModal('notification')}
              className="group flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition">알림 설정</h3>
                <p className="text-xs text-gray-400 mt-1">이메일 수신 및 푸시 알림 관리</p>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-600 transition" />
            </div>

            {/* 3. 회원 탈퇴 */}
            <div 
              onClick={() => setActiveModal('withdraw')}
              className="group flex items-center justify-between p-4 cursor-pointer hover:bg-red-50 rounded-xl transition-colors"
            >
              <div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-red-600 transition">회원 탈퇴</h3>
                <p className="text-xs text-gray-400 mt-1">계정 삭제 및 데이터 영구 파기</p>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-red-600 transition" />
            </div>

        </div>
      </section>

      {/* =========================================
          [하단 섹션] 내 스크랩 (기존 유지)
         ========================================= */}
      <section className="w-full">
        <div className="bg-white">
           <ScrapPage />
        </div>
      </section>


      {/* =========================================
          [MODAL AREA] - 모달 내용은 기존 코드 유지
         ========================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {activeModal === 'account' && '계정 정보 설정'}
                {activeModal === 'notification' && '알림 설정'}
                {activeModal === 'withdraw' && '회원 탈퇴'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="p-6 overflow-y-auto">
              
              {/* 1. 계정 정보 */}
              {activeModal === 'account' && (
                <div className="space-y-8">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4 text-3xl font-bold shadow-inner">
                      M
                    </div>
                    <div className="w-full">
                       <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                       <input type="text" defaultValue="마케터님" className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-200"/>
                       <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                       <input type="email" defaultValue="marketer@trendguard.ai" disabled className="w-full border bg-gray-50 text-gray-500 rounded-lg px-4 py-2"/>
                    </div>
                  </div>
                  <div className="border-t pt-6">
                    <h4 className="font-bold mb-4 flex items-center gap-2"><Shield size={18} className="text-green-600"/> 보안 설정</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">비밀번호 변경</span>
                        <button className="text-xs border bg-white px-3 py-1 rounded hover:bg-gray-100">변경</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. 알림 설정 */}
              {activeModal === 'notification' && (
                <div className="space-y-4">
                  {['마케팅 정보 수신', '분석 완료 알림', '이메일 뉴스레터'].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                      <span className="text-gray-900">{item}</span>
                      <div className={`w-11 h-6 rounded-full relative cursor-pointer transition ${idx === 1 ? 'bg-blue-500' : 'bg-gray-200'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${idx === 1 ? 'left-5' : 'left-0.5'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. 회원 탈퇴 */}
              {activeModal === 'withdraw' && (
                <div className="text-center">
                   <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash size={32} /></div>
                   <h4 className="text-lg font-bold mb-2">정말 탈퇴하시겠습니까?</h4>
                   <p className="text-gray-500 text-sm mb-6">모든 데이터가 삭제되며 복구할 수 없습니다.</p>
                   <div className="flex gap-3">
                      <button onClick={closeModal} className="flex-1 py-3 border rounded-lg hover:bg-gray-50">취소</button>
                      <button className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">탈퇴하기</button>
                   </div>
                </div>
              )}
            </div>

            {/* 저장 버튼 (탈퇴 제외) */}
            {activeModal !== 'withdraw' && (
              <div className="p-4 border-t bg-gray-50">
                <button onClick={closeModal} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">저장하기</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPage;