// src/pages/MyPage.jsx
import React, { useState, useEffect } from 'react';
import { ChevronRight, X, Shield, Trash } from 'lucide-react';
import apiClient from '../utils/apiClient';
import { getStoredUser } from '../utils/authStorage';
import { useLocation, useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';
// 스크랩 페이지 컴포넌트 불러오기
import ScrapPage from '../components/mypage/ScrapPage';

const MyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);
  const [userInfo, setUserInfo] = useState({ nickname: '', email: '' });
  const [editNickname, setEditNickname] = useState('');
  
  // 비밀번호 상태
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setUserInfo(user);
      setEditNickname(user.nickname);
    }
  }, []);

  useEffect(() => {
    const modal = new URLSearchParams(location.search).get('modal');
    if (modal === 'notification') {
      showToast('알림 기능은 현재 미구현 상태입니다.', { type: 'info' });
      navigate('/mypage', { replace: true });
    }
  }, [location.search, navigate]);

  const closeModal = () => {
    setActiveModal(null);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleNotificationNotice = () => {
    showToast('알림 기능은 현재 미구현 상태입니다.', { type: 'info' });
  };

  // 닉네임 수정 함수
  const handleSaveProfile = async () => {
    try {
      const response = await apiClient.post('/auth/update-profile', {
        email: userInfo.email,
        newNickname: editNickname
      });

      if (response.data.success) {
        // 1. 로컬 상태 업데이트
        const updatedUser = { ...userInfo, nickname: editNickname };
        setUserInfo(updatedUser);
        
        // 2. localStorage 업데이트 (사이드바 등 반영 위함)
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        showToast(response.data.message || '프로필이 저장되었습니다.', { type: 'success' });
        closeModal();
        window.location.reload(); // 전체 UI 동기화를 위해 새로고침 권장
      }
    } catch (error) {
      showToast('이름 수정 중 오류가 발생했습니다.', { type: 'error' });
    }
  };

  // 비밀번호 변경 함수
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('새 비밀번호 확인이 일치하지 않습니다.', { type: 'warning' });
      return;
    }
    try {
      await apiClient.post('/auth/change-password', {
        email: userInfo.email,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      showToast('비밀번호가 변경되었습니다.', { type: 'success' });
      setActiveModal(null);
    } catch (error) {
      showToast(error.response?.data?.message || '비밀번호 변경에 실패했습니다.', { type: 'error' });
    }
  };

  const handleWithdraw = async () => {
    try {
      const response = await apiClient.delete('/auth/withdraw', {
        data: { email: userInfo.email } // DELETE 요청 본문
      });

      if (response.data.success) {
        showToast(response.data.message || '회원 탈퇴가 완료되었습니다.', { type: 'success' });
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login'; // 데이터 파기 후 로그인 페이지로 강제 이동
      }
    } catch (error) {
      showToast(error.response?.data?.message || '회원 탈퇴 중 오류가 발생했습니다.', {
        type: 'error',
      });
    }
  };

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {activeModal === 'account' && '계정 정보 설정'}
                {activeModal === 'withdraw' && '회원 탈퇴'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="p-4 sm:p-6 overflow-y-auto">
              
              {/* 1. 계정 정보 */}
              {activeModal === 'account' && (
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
                        <button onClick={() => setActiveModal('password')} className="text-xs border bg-white px-3 py-1 rounded hover:bg-gray-100">변경</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 비밀번호 변경 모달 */}
              {activeModal === 'password' && (
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
              {activeModal === 'withdraw' && (
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
            {activeModal !== 'withdraw' && activeModal !== 'password' && (
              <div className="p-4 border-t bg-gray-50">
                <button 
                  onClick={() => {
                    // [수정됨] profile -> account 로 일치시킴
                    if (activeModal === 'account') { 
                      handleSaveProfile(); 
                    } else {
                      closeModal(); 
                    }
                  }} 
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  {/* 텍스트도 account 에 맞게 수정 */}
                  {activeModal === 'account' ? '프로필 저장하기' : '저장하기'}
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
