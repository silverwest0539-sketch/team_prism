// src/pages/MyPage.jsx
import React from 'react';
import { User, CreditCard, Bell, LogOut, Shield } from 'lucide-react';

const MyPage = () => {
  return (
    <div className="page">
      
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <p className="text-gray-500 text-sm mt-1">계정 정보와 구독 상태를 관리하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 왼쪽: 프로필 카드 */}
        <div className="md:col-span-1 space-y-6">
          <div className="card-soft flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4 text-3xl font-bold">
               M
            </div>
            <h2 className="text-xl font-bold">마케터님</h2>
            <p className="text-gray-500 text-sm mb-4">marketer@trendguard.ai</p>
            
            <button className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              프로필 편집
            </button>
          </div>

          {/* 메뉴 리스트 */}
          <div className="card-soft overflow-hidden p-0">
             <div className="p-4 border-b border-gray-100 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
                <User size={18} className="text-gray-500" />
                <span className="text-sm font-medium">계정 정보</span>
             </div>
             <div className="p-4 border-b border-gray-100 flex items-center gap-3 cursor-pointer hover:bg-gray-50 bg-blue-50 text-blue-600">
                <CreditCard size={18} />
                <span className="text-sm font-medium">결제 및 구독</span>
             </div>
             <div className="p-4 border-b border-gray-100 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
                <Bell size={18} className="text-gray-500" />
                <span className="text-sm font-medium">알림 설정</span>
             </div>
             <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 text-red-500">
                <LogOut size={18} />
                <span className="text-sm font-medium">로그아웃</span>
             </div>
          </div>
        </div>

        {/* 오른쪽: 상세 설정 */}
        <div className="md:col-span-2 space-y-6">
          
          {/* 구독 상태 카드 */}
          <div className="card-soft">
             <h3 className="section-title-lg card-header">
                <CreditCard className="text-blue-500" size={20}/> 구독 멤버십
             </h3>
             <div className="bg-gray-50 rounded-xl p-5 flex justify-between items-center mb-4">
                <div>
                   <p className="text-sm text-gray-500">현재 이용중인 플랜</p>
                   <p className="text-xl font-bold text-gray-900 mt-1">Pro Plan</p>
                </div>
                <button className="btn btn-primary">
                   플랜 업그레이드
                </button>
             </div>
             
             {/* 사용량 게이지 바 */}
             <div className="space-y-4">
                <div>
                   <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-600">AI 분석 크레딧</span>
                      <span className="font-bold text-blue-600">850 / 1,000</span>
                   </div>
                   <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                   </div>
                </div>
             </div>
          </div>

          {/* 보안 설정 카드 */}
          <div className="card-soft">
             <h3 className="section-title-lg card-header">
                <Shield className="text-green-500" size={20}/> 보안 설정
             </h3>
             
             <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                   <div>
                      <p className="font-medium text-sm">비밀번호 변경</p>
                      <p className="text-xs text-gray-400">마지막 변경일: 3개월 전</p>
                   </div>
                   <button className="text-sm text-gray-500 underline hover:text-gray-800">변경</button>
                </div>
                <div className="flex justify-between items-center py-2">
                   <div>
                      <p className="font-medium text-sm">2단계 인증</p>
                      <p className="text-xs text-gray-400">계정을 더 안전하게 보호하세요.</p>
                   </div>
                   {/* 토글 스위치 */}
                   <div className="w-10 h-5 bg-gray-300 rounded-full relative cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MyPage;