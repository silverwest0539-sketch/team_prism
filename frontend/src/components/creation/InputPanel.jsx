import React, { useState } from 'react';
import { ArrowsClockwise, MagicWand } from '@phosphor-icons/react';

const InputPanel = ({ onGenerate, isLoading }) => {
  // --- 상태 관리 (State) ---
  const [keyword, setKeyword] = useState("저당 간식"); 
  const [selectedType, setSelectedType] = useState("카드뉴스"); // 기본값 변경
  
  // [수정] 업종과 목적 분리
  const [industry, setIndustry] = useState("카페/디저트"); 
  const [purpose, setPurpose] = useState("공간 활용에 최적화된 실용적인 가구 홍보"); // 기존 context 역할
  
  const [target, setTarget] = useState("2030 직장인, 1인 자취가구");
  
  // [수정] 포함/금지어 -> 기타 요구사항 (자유입력)
  const [otherRequests, setOtherRequests] = useState(""); 

  // 생성하기 버튼 클릭 시 실행
  const handleSubmit = () => {
    const requestData = {
      keyword: keyword,
      type: selectedType,
      industry: industry, // 추가된 업종
      context: purpose,   // 목적 (기존 context 매핑)
      target: target,
      otherRequests: otherRequests // 기타 요구사항
    };
    onGenerate(requestData);
  };

  // [수정 1] 요청하신 3가지 유형으로 정리
  const contentTypes = ['카드뉴스', '포스터', '썸네일'];

  // [수정 2] 업종 목록 단순화
  const industries = [
    '크리에이터/유튜브', '카페/디저트', '맛집/요식업', '뷰티/헤어샵',
    '패션/의류', '헬스/피트니스', '교육/클래스', '화장품/스킨케어',
    '리빙/인테리어', '여행/숙박', '온라인 쇼핑몰', '공구/마켓', '기타'
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 h-full min-h-0 flex flex-col overflow-y-auto">
      
      {/* 주제 키워드 입력창 (유지) */}
      <div className="mb-5 sm:mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
        <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
          <MagicWand weight="fill"/> 주제 키워드 (자동 분석됨)
        </label>
        <input 
          type="text" 
          className="w-full border border-indigo-200 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700" 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="트렌드 키워드 또는 원하는 주제 입력"
        />
        <p className="text-xs text-indigo-500 mt-2">
          * 기본적으로 트렌드 키워드가 입력되지만, 원하는 주제로 변경 가능합니다.
        </p>
      </div>

      {/* 1. 콘텐츠 유형 (수정됨: 3개 항목 1열 배치) */}
      <div className="mb-5 sm:mb-6">
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

      {/* 2. 업종 (분리됨) */}
      <div className="mb-5 sm:mb-6">
        <label className="block text-sm font-bold text-gray-800 mb-2">2. 업종</label>
        <select 
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        >
          {industries.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      {/* 3. 목적 (기존 '3. 핵심 내용' -> '3. 목적'으로 변경) */}
      <div className="mb-5 sm:mb-6">
        <label className="block text-sm font-bold text-gray-800 mb-2">3. 목적</label>
        <textarea 
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" 
          rows="3" 
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="콘텐츠를 만드는 목적이나 핵심 내용을 자유롭게 적어주세요."
        ></textarea>
      </div>

      {/* 하단 옵션 영역 (타겟 + 기타요구사항) */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-5 sm:mb-6">
        {/* 상세 타겟 설정 */}
        <label className="block text-sm font-bold text-gray-700 mb-2">
          상세 타겟 설정 <span className="text-xs font-normal text-gray-500">(선택)</span>
        </label>
        <input 
          type="text" 
          className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4" 
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="예: 2030 직장인, 육아맘 등"
        />
        
        {/* [수정] 포함/금지어 관리 -> 기타 요구사항 (자유입력) */}
        <label className="block text-sm font-bold text-gray-700 mb-2">기타 요구사항</label>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
          rows="2"
          value={otherRequests}
          onChange={(e) => setOtherRequests(e.target.value)}
          placeholder="예: 존댓말 사용, '최고'라는 단어 금지 등 자유롭게 입력"
        />
      </div>

      {/* 하단 버튼 */}
      <button 
        onClick={handleSubmit} 
        disabled={isLoading}
        className={`w-full text-white font-bold py-3.5 sm:py-4 rounded-xl transition flex items-center justify-center gap-2 mt-auto text-base sm:text-lg shadow-md
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