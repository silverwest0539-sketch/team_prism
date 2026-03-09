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
import BasePreferenceModal from '../components/common/BasePreferenceModal';

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
  UPDATE_PREFERENCE: '/auth/update-preference',
  LINK_KAKAO: '/auth/link/kakao',
  LINK_NAVER: '/auth/link/naver'
});

const STORAGE_KEY = Object.freeze({
  USER: 'user',
  TOKEN: 'token',
});

const TOAST_MESSAGE = Object.freeze({
  NOTIFICATION_UNAVAILABLE: '알림 설정은 아직 지원하지 않습니다.',
  PROFILE_UPDATE_SUCCESS: '프로필이 저장되었습니다.',
  PROFILE_UPDATE_ERROR: '이름 수정 중 오류가 발생했습니다.',
  PASSWORD_MISMATCH: '새 비밀번호 확인이 일치하지 않습니다.',
  PASSWORD_CHANGE_SUCCESS: '비밀번호가 변경되었습니다.',
  PASSWORD_CHANGE_ERROR: '비밀번호 변경에 실패했습니다.',
  WITHDRAW_SUCCESS: '회원 탈퇴가 완료되었습니다.',
  WITHDRAW_ERROR: '회원 탈퇴 중 오류가 발생했습니다.',
  COMMUNITY_UPDATE_SUCCESS: '선호 플랫폼이 변경되었습니다.', 
  COMMUNITY_UPDATE_ERROR: '선호 플랫폼 변경 중 오류가 발생했습니다.',
});

// [수정 완료] 선호 플랫폼 목록에 '유튜브' 추가
const COMMUNITY_OPTIONS = [
  { label: '유튜브', value: 'youtube' },
  { label: '더쿠', value: 'theqoo' },
  { label: '디시인사이드', value: 'dcinside' },
  { label: '루리웹', value: 'ruliweb' },
  { label: '네이트판', value: 'natepan' },
  { label: 'FM코리아', value: 'fmkorea' },
];

const NEWS_OPTIONS = [
  { label: '대한민국', value: 'korea' },
  { label: '세계', value: 'world' },
  { label: '비즈니스', value: 'business' },
  { label: '과학/기술', value: 'tech' },
  { label: '엔터테인먼트', value: 'entertainment' },
  { label: '스포츠', value: 'sports' },
];

const MyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const hasShownAuthToastRef = useRef(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [userInfo, setUserInfo] = useState(() => storedUser || { nickname: '', email: '' });
  const [editNickname, setEditNickname] = useState(() => storedUser?.nickname || '');
  const [prefModalType, setPrefModalType] = useState(null);

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
      return;
    }
  }, [location.search, navigate]);


  const closeModal = () => {
    setActiveModal(null);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  // ==========================================
  // [추가된 부분] SNS 연동 여부 확인 및 핸들러
  // ==========================================
  
  // provider는 가입 출처로 유지되므로, 현재 연동 상태는 소셜 ID 존재 여부로만 판단한다.
  const isKakaoLinked = !!userInfo?.kakaoId;
  const isNaverLinked = !!userInfo?.naverId;

  // 카카오 버튼 클릭 핸들러
  const handleKakaoToggle = async () => {
    if (isKakaoLinked) {
      // 💡 [추가] 유일한 로그인 수단인지 확인 (비밀번호 없고 다른 소셜도 없을 때)
      const isOnlyMethod = !userInfo.hasPassword && !userInfo.naverId;
      if (isOnlyMethod) {
        alert('유일한 로그인 수단은 해제할 수 없습니다. 탈퇴를 원하시면 회원탈퇴를 이용해주세요.');
        return;
      }

      if (window.confirm('카카오 계정 연동을 해제하시겠습니까?')) {
        try {
          // ✅ 백엔드 연동 해제 API 호출
          await apiClient.post('/auth/unlink', { email: userInfo.email, provider: 'kakao' });
          showToast('카카오 연동이 해제되었습니다.', { type: 'success' });
          
          const updatedUser = { ...userInfo, kakaoId: null };
          setUserInfo(updatedUser);
          localStorage.setItem(STORAGE_KEY.USER, JSON.stringify(updatedUser));
        } catch {
          showToast('연동 해제에 실패했습니다.', { type: 'error' });
        }
      }
    } else {
      // 연동 안 되어 있을 때 -> 카카오 인증 페이지로 이동 (이동 후 위 Callback 컴포넌트가 실행됨)
      const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
      const REDIRECT_URI = `${window.location.origin}/oauth/callback/kakao`;
      window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
    }
  };

  // 네이버 버튼 클릭 핸들러
  const handleNaverToggle = async () => {
    if (isNaverLinked) {
      const isOnlyMethod = !userInfo.hasPassword && !userInfo.kakaoId;
      if (isOnlyMethod) {
        alert('유일한 로그인 수단은 해제할 수 없습니다. 탈퇴를 원하시면 회원탈퇴를 이용해주세요.');
        return;
      }
      // 연동되어 있을 때 -> 해제 안내창
      if (window.confirm('네이버 계정 연동을 해제하시겠습니까?')) {
        try {
          await apiClient.post('/auth/unlink', { email: userInfo.email, provider: 'naver' });
          showToast('네이버 연동이 해제되었습니다.', { type: 'success' });
          const updatedUser = { ...userInfo, naverId: null };
          setUserInfo(updatedUser);
          localStorage.setItem(STORAGE_KEY.USER, JSON.stringify(updatedUser));
        } catch {
          showToast('연동 해제에 실패했습니다.', { type: 'error' });
        }
      }
    } else {
      // 연동 안 되어 있을 때 -> 네이버 인증 페이지로 이동
      const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID;
      const REDIRECT_URI = `${window.location.origin}/oauth/callback/naver`;
      const state = Math.random().toString(36).substring(3, 14);
      window.location.href = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${state}`;
    }
  };
  // ==========================================


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

  // 취향 설정 저장 (기존)
  const handlePreferenceSubmit = async (value) => {
    if (value === 'skip') {
      setPrefModalType(null);
      return;
    }

    try {
      const payload = { email: userInfo.email };
      if (prefModalType === 'community') payload.preferredCommunity = value;
      if (prefModalType === 'news') payload.preferredNews = value;

      const response = await apiClient.post(API_ENDPOINT.UPDATE_PREFERENCE, payload);

      if (response.data.success) {
        const updatedUser = { ...userInfo };
        if (prefModalType === 'community') updatedUser.preferredCommunity = value;
        if (prefModalType === 'news') updatedUser.preferredNews = value;

        setUserInfo(updatedUser);
        localStorage.setItem(STORAGE_KEY.USER, JSON.stringify(updatedUser));
        
        showToast('설정이 성공적으로 변경되었습니다.', { type: 'success' });
        setPrefModalType(null);
      }
    } catch {
      showToast(TOAST_MESSAGE.COMMUNITY_UPDATE_ERROR, { type: 'error' });
    }
  };

  // ★★★ [추가 완료] DB의 값을 비워주고 모달을 닫는 '초기화' 함수 ★★★
  const handlePreferenceReset = async () => {
    try {
      const payload = { email: userInfo.email };
      // 초기화하므로 빈 문자열 전송
      if (prefModalType === 'community') payload.preferredCommunity = '';
      if (prefModalType === 'news') payload.preferredNews = '';

      const response = await apiClient.post(API_ENDPOINT.UPDATE_PREFERENCE, payload);

      if (response.data.success) {
        const updatedUser = { ...userInfo };
        if (prefModalType === 'community') updatedUser.preferredCommunity = '';
        if (prefModalType === 'news') updatedUser.preferredNews = '';

        setUserInfo(updatedUser);
        localStorage.setItem(STORAGE_KEY.USER, JSON.stringify(updatedUser));
        
        // 토스트 띄우고 창 닫기
        showToast('설정이 초기화되었습니다.', { type: 'success' });
        setPrefModalType(null);
      }
    } catch {
      showToast('초기화 중 오류가 발생했습니다.', { type: 'error' });
    }
  };

  if (!authChecked) {
    return null;
  }

  return (
    <div className="page pb-20">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">마이페이지</h1>
        <p className="text-gray-500 text-sm mt-2">
          계정 설정을 관리하고 스크랩한 콘텐츠를 확인하세요.
        </p>
      </div>

      <ErrorBoundary
        variant="section"
        title="계정 설정 섹션을 표시하지 못했습니다."
        description="잠시 후 다시 시도해 주세요."
      >
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row mb-8 sm:mb-10 min-h-[240px]">
          <div className="p-5 sm:p-8 md:w-2/5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">프로필</h2>
            <p className="text-sm text-gray-500 leading-relaxed break-keep">
              개인정보 및 보안 설정, 선호 플랫폼/뉴스 및<br className="hidden md:block" />
              회원 탈퇴를 관리할 수 있습니다.
            </p>
          </div>

          <div className="p-4 sm:p-6 md:w-3/5 flex flex-col justify-center">
            <div
              onClick={() => setActiveModal(MODAL.ACCOUNT)}
              className="group flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition">계정 정보</h3>
                <p className="text-xs text-gray-400 mt-1">프로필 편집, 비밀번호 변경, SNS 연동</p>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-600 transition" />
            </div>

            <div 
              onClick={() => setPrefModalType('community')}
              className="group flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition">선호 플랫폼 설정</h3>
                <p className="text-xs text-gray-400 mt-1">대시보드에서 우선 표시할 플랫폼 설정</p>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-600 transition" />
            </div>

            <div 
              onClick={() => setPrefModalType('news')}
              className="group flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition">선호 뉴스 카테고리 설정</h3>
                <p className="text-xs text-gray-400 mt-1">대시보드에서 우선 표시할 뉴스 분야 설정</p>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-600 transition" />
            </div>

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

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
        <ErrorBoundary
          variant="section"
          title="스크랩 섹션을 표시하지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
        >
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden xl:col-span-6">
            <ScrapPage isEmbedded />
          </section>
        </ErrorBoundary>

        <ErrorBoundary
          variant="section"
          title="저장 프롬프트 섹션을 표시하지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
        >
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden xl:col-span-6">
            <SavedPromptsSection email={userInfo.email} />
          </section>
        </ErrorBoundary>
      </div>


      {/* =========================================
          [MODAL AREA] 
         ========================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {activeModal === MODAL.ACCOUNT && '계정 정보 설정'}
                {activeModal === MODAL.WITHDRAW && '회원 탈퇴'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto">
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
                          value={editNickname} 
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
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <Shield size={18} className="text-green-600"/> 보안 설정
                    </h4>
                    
                    {/* ========================================== */}
                    {/* [추가된 부분] 카카오, 네이버 연동 버튼 영역 */}
                    {/* ========================================== */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button
                        type="button"
                        onClick={handleKakaoToggle}
                        className={`py-3 rounded-lg text-sm font-bold transition-all flex justify-center items-center ${
                          isKakaoLinked
                            ? 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                            : 'bg-[#FEE500] text-[#000000] hover:brightness-95'
                        }`}
                      >
                        {isKakaoLinked ? '카카오 연동 해제' : '카카오 연동하기'}
                      </button>

                      <button
                        type="button"
                        onClick={handleNaverToggle}
                        className={`py-3 rounded-lg text-sm font-bold transition-all flex justify-center items-center ${
                          isNaverLinked
                            ? 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                            : 'bg-[#03C75A] text-white hover:brightness-95'
                        }`}
                      >
                        {isNaverLinked ? '네이버 연동 해제' : '네이버 연동하기'}
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">비밀번호 변경</span>
                        <button onClick={() => setActiveModal(MODAL.PASSWORD)} className="text-xs border bg-white px-3 py-1 rounded hover:bg-gray-100">변경</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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

              {activeModal === MODAL.WITHDRAW && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash size={32} /></div>
                  <h4 className="text-lg font-bold mb-2">정말 탈퇴하시겠습니까?</h4>
                  <p className="text-gray-500 text-sm mb-6">모든 데이터가 삭제되며 복구할 수 없습니다.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={closeModal} className="flex-1 py-3 border rounded-lg hover:bg-gray-50">취소</button>
                      <button onClick={handleWithdraw} className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">탈퇴하기</button>
                  </div>
                </div>
              )}
            </div>

            {activeModal !== MODAL.WITHDRAW && activeModal !== MODAL.PASSWORD && (
              <div className="p-4 border-t bg-gray-50">
                <button
                  onClick={() => {
                    if (activeModal === MODAL.ACCOUNT) {
                      handleSaveProfile();
                    } else {
                      closeModal();
                    }
                  }}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
                >
                  {activeModal === MODAL.ACCOUNT ? '프로필 저장하기' : '저장하기'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* [수정 완료] 취향 설정 모달 렌더링 영역에 onReset 연결 완료 */}
      {prefModalType === 'community' && (
        <BasePreferenceModal 
          isOpen={true}
          title="선호 플랫폼 설정"
          subtitle="대시보드에서 우선 표시할 플랫폼을 선택해주세요."
          options={COMMUNITY_OPTIONS}
          submitText="변경하기"
          onSubmit={handlePreferenceSubmit}
          onReset={handlePreferenceReset} // ★ 클릭 시 DB 초기화 후 닫힘!
          onClose={() => setPrefModalType(null)} 
        />
      )}

      {prefModalType === 'news' && (
        <BasePreferenceModal 
          isOpen={true}
          title="선호 뉴스 카테고리 설정"
          subtitle="대시보드에서 우선 표시할 뉴스 분야를 선택해주세요."
          options={NEWS_OPTIONS}
          submitText="변경하기"
          onSubmit={handlePreferenceSubmit}
          onReset={handlePreferenceReset} // ★ 클릭 시 DB 초기화 후 닫힘!
          onClose={() => setPrefModalType(null)}
        />
      )}
    </div>
  );
};

export default MyPage;
