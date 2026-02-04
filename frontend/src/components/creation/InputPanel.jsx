import React, { useState } from 'react';
import { ArrowsClockwise, X, MagicWand } from '@phosphor-icons/react';

const InputPanel = ({ onGenerate, isLoading }) => {
  // --- 상태 관리 (State) ---
  // [수정 1] 키워드도 상태로 관리 (기본값: 분석된 트렌드 키워드)
  const [keyword, setKeyword] = useState("저당 간식"); 
  const [selectedType, setSelectedType] = useState("인스타 피드");
  const [context, setContext] = useState("공간 활용에 최적화된 실용적인 가구"); // 사용자가 입력하기 편하게 예시 변경
  const [target, setTarget] = useState("2030 직장인, 1인 자취가구");

  // 생성하기 버튼 클릭 시 실행
  const handleSubmit = () => {
    const requestData = {
      keyword: keyword,   // [수정 2] 사용자가 입력한 키워드를 전송
      type: selectedType,
      tone: "친근한",
      context: context,
      target: target
    };
    onGenerate(requestData);
  };

  const contentTypes = ['인스타 피드', '릴스 대본', '블로그', '포스터', '카드뉴스', '문자'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-full flex flex-col overflow-y-auto">
      
      {/* [수정 3] 주제 키워드 입력창 추가 (최상단) */}
      <div className="mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
        <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
          <MagicWand weight="fill"/> 주제 키워드 (자동 분석됨)
        </label>
        <input 
          type="text" 
          className="w-full border border-indigo-200 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700" 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)} // 사용자가 수정 가능하도록 설정
          placeholder="트렌드 키워드 또는 원하는 주제 입력"
        />
        <p className="text-xs text-indigo-500 mt-2">
          * 기본적으로 트렌드 키워드가 입력되지만, 원하는 주제로 변경 가능합니다.
        </p>
      </div>

      {/* 1. 콘텐츠 유형 */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-800 mb-2">1. 콘텐츠 유형</label>
        <div className="grid grid-cols-3 gap-2">
          {contentTypes.map((item) => (
            <div 
              key={item} 
              onClick={() => setSelectedType(item)}
              className={`border rounded-lg p-3 text-center cursor-pointer transition font-medium text-sm
                ${selectedType === item 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' 
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300' 
                }`}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* 2. 업종 및 목적 */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-800 mb-2">2. 업종 및 목적</label>
        <select className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option>카페/디저트 (시즌 한정 신메뉴 홍보)</option>
          <option>맛집/요식업 (웨이팅 맛집/방문 후기)</option>
          <option>뷰티/헤어샵 (시술 비포&애프터 강조)</option>
          <option>패션/의류 (신상 룩북/데일리룩 코디)</option>
          <option>헬스/피트니스 (바디프로필반/PT 할인 이벤트)</option>
          <option>교육/클래스 (원데이 클래스 수강생 모집)</option>
          <option>화장품/스킨케어 (성분 분석/트러블 케어 효과)</option>
          <option>리빙/인테리어 (자취방 꾸미기 꿀템 추천)</option>
          <option>여행/숙박 (감성 숙소/펜션 예약 안내)</option>
          <option>온라인 쇼핑몰 (리뷰 이벤트)</option>
          <option>병원/의료 (진료 안내)</option>
          <option>공구/마켓 (최저가 공동구매 오픈 알림)</option>
        </select>
      </div>

      {/* 3. 핵심 내용 */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-800 mb-2">3. 핵심 내용</label>
        <textarea 
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" 
          rows="3" 
          value={context}
          onChange={(e) => setContext(e.target.value)}
        ></textarea>
      </div>

      {/* 고급 설정 */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          상세 타겟 설정 <span className="text-xs font-normal text-gray-500">(선택)</span>
        </label>
        <input 
          type="text" 
          className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4" 
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        
        <label className="block text-sm font-bold text-gray-700 mb-2">포함/금지어 관리</label>
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 bg-white border border-gray-300 px-3 py-1.5 rounded-full text-sm text-gray-700">
            #존댓말 <X weight="bold" className="cursor-pointer hover:text-red-500" />
          </span>
          <span className="flex items-center gap-1 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full text-sm text-red-700 font-medium">
            ⛔ '최고' 금지 <X weight="bold" className="cursor-pointer hover:text-red-900" />
          </span>
          <span className="flex items-center gap-1 border border-dashed border-gray-400 text-gray-500 px-3 py-1.5 rounded-full text-sm cursor-pointer hover:bg-gray-100">
            + 추가
          </span>
        </div>
      </div>

      {/* 하단 버튼 */}
      <button 
        onClick={handleSubmit} 
        disabled={isLoading}
        className={`w-full text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 mt-auto text-lg shadow-md
          ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
      >
        {isLoading ? (
          "✨ 열심히 쓰는 중..."
        ) : (
          <>
            <ArrowsClockwise weight="bold" className="text-xl" /> 
            수정사항 반영하여 다시 생성
          </>
        )}
      </button>
    </div>
  ); 
};

export default InputPanel;