// src/pages/MyPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, X, Shield, Trash } from 'lucide-react';
import ErrorBoundary from '../components/common/ErrorBoundary';
import apiClient from '../utils/apiClient';
import { getStoredUser } from '../utils/authStorage';
import { useLocation, useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';
// 스크랩 페이지 컴포넌트 불러오기
import ScrapPage from '../components/mypage/ScrapPage';
import SavedPromptsSection from '../components/mypage/SavedPromptsSection';

const MODAL = Object.freeze({
  ACCOUNT: 'account',
  PASSWORD: 'password',
  WITHDRAW: 'withdraw',
  NOTIFICATION: 'notification',
});

const ROUTE = Object.freeze({
  MYPAGE: '/mypage',
  LOGIN: '/login',
});

const API_ENDPOINT = Object.freeze({
  UPDATE_PROFILE: '/auth/update-profile',
  CHANGE_PASSWORD: '/auth/change-password',
  WITHDRAW: '/auth/withdraw',
});

const STORAGE_KEY = Object.freeze({
  USER: 'user',
  TOKEN: 'token',
});

const TOAST_MESSAGE = Object.freeze({
  NOTIFICATION_UNAVAILABLE: '알림 기능은 현재 미구현 상태입니다.',
  PROFILE_UPDATE_SUCCESS: '프로필이 저장되었습니다.',
  PROFILE_UPDATE_ERROR: '이름 수정 중 오류가 발생했습니다.',
  PASSWORD_MISMATCH: '새 비밀번호 확인이 일치하지 않습니다.',
  PASSWORD_CHANGE_SUCCESS: '비밀번호가 변경되었습니다.',
  PASSWORD_CHANGE_ERROR: '비밀번호 변경에 실패했습니다.',
  WITHDRAW_SUCCESS: '회원 탈퇴가 완료되었습니다.',
  WITHDRAW_ERROR: '회원 탈퇴 중 오류가 발생했습니다.',
});

const MyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const hasShownAuthToastRef = useRef(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [userInfo, setUserInfo] = useState(() => storedUser || { nickname: '', email: '' });
  const [editNickname, setEditNickname] = useState(() => storedUser?.nickname || '');
  
  // 비밀번호 상태
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const savedUser = getStoredUser();

    if (!savedUser) {
      if (!hasShownAuthToastRef.current) {
        hasShownAuthToastRef.current = true;
        showToast('마이페이지 서비스는 로그인 후 이용할 수 있습니다. 로그인 페이지로 이동합니다.', {
          type: 'warning',
        });
      }
      navigate(ROUTE.LOGIN, { replace: true });
      return;
    }

    setAuthChecked(true);
  }, [navigate]);

  useEffect(() => {
    const modal = new URLSearchParams(location.search).get('modal');
    if (modal === MODAL.NOTIFICATION) {
      showToast(TOAST_MESSAGE.NOTIFICATION_UNAVAILABLE, { type: 'info' });
      navigate(ROUTE.MYPAGE, { replace: true });
    }
  }, [location.search, navigate]);

  const closeModal = () => {
    setActiveModal(null);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleNotificationNotice = () => {
    showToast(TOAST_MESSAGE.NOTIFICATION_UNAVAILABLE, { type: 'info' });
  };

  // 닉네임 수정 함수
  const handleSaveProfile = async () => {
    try {
      const response = await apiClient.post(API_ENDPOINT.UPDATE_PROFILE, {
        email: userInfo.email,
        newNickname: editNickname
      });

      if (response.data.success) {
        // 1. 로컬 상태 업데이트
        const updatedUser = { ...userInfo, nickname: editNickname };
        setUserInfo(updatedUser);
        
        // 2. localStorage 업데이트 (사이드바 등 반영 위함)
        localStorage.setItem(STORAGE_KEY.USER, JSON.stringify(updatedUser));
        
        showToast(response.data.message || TOAST_MESSAGE.PROFILE_UPDATE_SUCCESS, { type: 'success' });
        closeModal();
        window.location.reload(); // 전체 UI 동기화를 위해 새로고침 권장
      }
    } catch {
      showToast(TOAST_MESSAGE.PROFILE_UPDATE_ERROR, { type: 'error' });
    }
  };

  // 비밀번호 변경 함수
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast(TOAST_MESSAGE.PASSWORD_MISMATCH, { type: 'warning' });
      return;
    }
    try {
      await apiClient.post(API_ENDPOINT.CHANGE_PASSWORD, {
        email: userInfo.email,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      showToast(TOAST_MESSAGE.PASSWORD_CHANGE_SUCCESS, { type: 'success' });
      setActiveModal(null);
    } catch (error) {
      showToast(error.response?.data?.message || TOAST_MESSAGE.PASSWORD_CHANGE_ERROR, { type: 'error' });
    }
  };

  const handleWithdraw = async () => {
    try {
      const response = await apiClient.delete(API_ENDPOINT.WITHDRAW, {
        data: { email: userInfo.email } // DELETE 요청 본문
      });

      if (response.data.success) {
        showToast(response.data.message || TOAST_MESSAGE.WITHDRAW_SUCCESS, { type: 'success' });
        localStorage.removeItem(STORAGE_KEY.USER);
        localStorage.removeItem(STORAGE_KEY.TOKEN);
        window.location.href = ROUTE.LOGIN; // 데이터 파기 후 로그인 페이지로 강제 이동
      }
    } catch (error) {
      showToast(error.response?.data?.message || TOAST_MESSAGE.WITHDRAW_ERROR, {
        type: 'error',
      });
    }
  };

  if (!authChecked) {
    return null;
  }

  return (
    <div className="page pb-20">
      {/* 페이지 헤더 */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">마이페이지</h1>
        <p className="text-gray-500 text-sm mt-2">
          계정 설정을 관리하고 스크랩한 콘텐츠를 확인하세요.
        </p>
      </div>

      {/* =========================================
          [수정됨] 프로필 설정 섹션 -> 카드 디자인 적용
          - bg-white, rounded-2xl, shadow-sm, border: 카드 형태
          - flex-row: 좌우 분할
         ========================================= */}
      <ErrorBoundary
        variant="section"
        title="계정 설정 섹션을 표시하지 못했습니다."
        description="잠시 후 다시 시도해 주세요."
      >
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row mb-8 sm:mb-10 min-h-[240px]">
        
        {/* 좌측: 타이틀 및 설명 (회색 배경 적용) */}
        <div className="p-5 sm:p-8 md:w-2/5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">프로필</h2>
          <p className="text-sm text-gray-500 leading-relaxed break-keep">
            개인정보 및 보안 설정, 알림 및<br className="hidden md:block"/> 
            회원 탈퇴를 관리할 수 있습니다.
          </p>
        </div>

        {/* 우측: 메뉴 리스트 영역 */}
        <div className="p-4 sm:p-6 md:w-3/5 flex flex-col justify-center">
            
            {/* 1. 계정 정보 */}
            <div 
              onClick={() => setActiveModal(MODAL.ACCOUNT)}
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
              onClick={handleNotificationNotice}
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
              onClick={() => setActiveModal(MODAL.WITHDRAW)}
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
      </ErrorBoundary>

      {/* =========================================
          [하단 섹션] 내 스크랩 (기존 유지)
         ========================================= */}
      <ErrorBoundary
        variant="section"
        title="저장 프롬프트 섹션을 표시하지 못했습니다."
        description="잠시 후 다시 시도해 주세요."
      >
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8 sm:mb-10">
           <SavedPromptsSection email={userInfo.email} />
      </section>
      </ErrorBoundary>

      <ErrorBoundary
        variant="section"
        title="스크랩 섹션을 표시하지 못했습니다."
        description="잠시 후 다시 시도해 주세요."
      >
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
           <ScrapPage isEmbedded />
      </section>
      </ErrorBoundary>


      {/* =========================================
          [MODAL AREA] - 모달 내용은 기존 코드 유지
         ========================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {activeModal === MODAL.ACCOUNT && '계정 정보 설정'}
                {activeModal === MODAL.WITHDRAW && '회원 탈퇴'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="p-4 sm:p-6 overflow-y-auto">
              
              {/* 1. 계정 정보 */}
              {activeModal === MODAL.ACCOUNT && (
                <div className="space-y-8">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4 text-3xl font-bold shadow-inner">
                      {userInfo.nickname?.charAt(0)}
                    </div>
                    <div className="w-full">
                       <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                       <input 
                          type="text" 
                          value={editNickname} // defaultValue 대신 value 사용
                          onChange={(e) => setEditNickname(e.target.value)} 
                          className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                       <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                       <input 
                          type="email" 
                          value={userInfo.email} 
                          disabled 
                          className="w-full border bg-gray-50 text-gray-500 rounded-lg px-4 py-2"
                        />
                    </div>
                  </div>
                  <div className="border-t pt-6">
                    <h4 className="font-bold mb-4 flex items-center gap-2"><Shield size={18} className="text-green-600"/> 보안 설정</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">비밀번호 변경</span>
                        <button onClick={() => setActiveModal(MODAL.PASSWORD)} className="text-xs border bg-white px-3 py-1 rounded hover:bg-gray-100">변경</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 비밀번호 변경 모달 */}
              {activeModal === MODAL.PASSWORD && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
                    <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-gray-400"><X /></button>
                    <h3 className="text-xl font-bold mb-6">비밀번호 변경</h3>
                    <div className="space-y-4">
                      <input 
                        type="password" placeholder="현재 비밀번호" className="form-input" 
                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      />
                      <input 
                        type="password" placeholder="새 비밀번호" className="form-input" 
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      />
                      <input 
                        type="password" placeholder="새 비밀번호 확인" className="form-input" 
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      />
                      <button 
                        onClick={handleChangePassword}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                      >
                        변경 완료
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. 회원 탈퇴 */}
              {activeModal === MODAL.WITHDRAW && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash size={32} /></div>
                  <h4 className="text-lg font-bold mb-2">정말 탈퇴하시겠습니까?</h4>
                  <p className="text-gray-500 text-sm mb-6">모든 데이터가 삭제되며 복구할 수 없습니다.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={closeModal} className="flex-1 py-3 border rounded-lg hover:bg-gray-50">취소</button>
                      {/* onClick 이벤트 교체 */}
                      <button onClick={handleWithdraw} className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">탈퇴하기</button>
                  </div>
                </div>
              )}
            </div>

            {/* 저장 버튼 (탈퇴 제외) */}
            {activeModal !== MODAL.WITHDRAW && activeModal !== MODAL.PASSWORD && (
              <div className="p-4 border-t bg-gray-50">
                <button 
                  onClick={() => {
                    // [수정됨] profile -> account 로 일치시킴
                    if (activeModal === MODAL.ACCOUNT) { 
                      handleSaveProfile(); 
                    } else {
                      closeModal(); 
                    }
                  }} 
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
                >
                  {/* 텍스트도 account 에 맞게 수정 */}
                  {activeModal === MODAL.ACCOUNT ? '프로필 저장하기' : '저장하기'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPage;
