// src/pages/MyPage.jsx
import React from 'react';
import { User, Bell, Shield, Trash } from 'lucide-react';

const MyPage = () => {
  return (
    <div className="page pb-20"> {/* 하단 여유 공간 추가 */}
      
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <p className="text-gray-500 text-sm mt-1">계정 정보와 보안 설정을 관리하세요.</p>
      </div>

      {/* 메인 그리드 컨테이너 (3열 구조) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* =========================================
            [상단 Row] 프로필(1/3) + 보안설정(2/3)
            h-full을 적용하여 서로 높이를 맞춤
           ========================================= */}
        
        {/* 1. 왼쪽: 프로필 카드 */}
        <div className="md:col-span-1">
          <div className="card-soft h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4 text-3xl font-bold shadow-sm">
               M
            </div>
            <h2 className="text-xl font-bold text-gray-900">마케터님</h2>
            <p className="text-gray-500 text-sm mb-8">marketer@trendguard.ai</p>
            
            <button className="w-full py-2.5 px-4 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition text-gray-700">
              프로필 편집
            </button>
          </div>
        </div>

        {/* 2. 오른쪽: 보안 설정 (높이를 왼쪽과 맞추기 위해 h-full 사용) */}
        <div className="md:col-span-2">
          <div className="card-soft h-full flex flex-col">
             <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                    <Shield className="text-green-600" size={20}/> 
                    보안 설정
                </h3>
             </div>
             
             {/* 내용을 중앙 정렬하거나 균등 배치하기 위해 flex-1 적용 */}
             <div className="p-6 flex-1 flex flex-col justify-center space-y-6">
                <div className="flex justify-between items-center">
                   <div>
                      <p className="font-medium text-gray-900">비밀번호 변경</p>
                      <p className="text-xs text-gray-400 mt-1">마지막 변경일: 3개월 전</p>
                   </div>
                   <button className="text-sm px-4 py-2 border rounded hover:bg-gray-50 transition">변경</button>
                </div>
                
                <div className="flex justify-between items-center">
                   <div>
                      <p className="font-medium text-gray-900">2단계 인증</p>
                      <p className="text-xs text-gray-400 mt-1">로그인 시 추가 인증을 요구하여 계정을 보호합니다.</p>
                   </div>
                   <div className="w-11 h-6 bg-gray-200 rounded-full relative cursor-pointer hover:bg-gray-300 transition">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
                   </div>
                </div>
             </div>
          </div>
        </div>


        {/* =========================================
            [하단 Row] 일반 설정 (전체 너비 사용)
            grid-cols-3 레이아웃에서 각각 1칸씩 차지하게 하여
            상단 영역 전체 너비와 1:1로 매칭
           ========================================= */}
        
        {/* 섹션 타이틀 (전체 너비 차지) */}
        <div className="md:col-span-3 mt-4">
           <h3 className="text-lg font-bold text-gray-900">일반 설정</h3>
        </div>

        {/* 3. 계정 정보 */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition cursor-pointer group h-full flex flex-col justify-between min-h-[160px]">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
              <User size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-lg">계정 정보</h4>
              <p className="text-sm text-gray-500 mt-1">이름, 이메일 관리</p>
            </div>
          </div>
        </div>

        {/* 4. 알림 설정 */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition cursor-pointer group h-full flex flex-col justify-between min-h-[160px]">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 mb-4 group-hover:bg-orange-500 group-hover:text-white transition">
              <Bell size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-lg">알림 설정</h4>
              <p className="text-sm text-gray-500 mt-1">수신 및 푸시 설정</p>
            </div>
          </div>
        </div>

        {/* 5. 회원 탈퇴 */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-md transition cursor-pointer group h-full flex flex-col justify-between min-h-[160px]">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 mb-4 group-hover:bg-red-500 group-hover:text-white transition">
              <Trash size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-lg">회원 탈퇴</h4>
              <p className="text-sm text-gray-500 mt-1">계정 삭제 및 데이터 파기</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MyPage;