import React, { useEffect, useMemo, useState } from 'react';
import { ArrowsClockwise, MagicWand } from '@phosphor-icons/react';

const DEFAULT_KEYWORD = '저당 간식';

const InputPanel = ({ onGenerate, isLoading, initialKeyword = '' }) => {
  const normalizedInitialKeyword = useMemo(() => initialKeyword.trim(), [initialKeyword]);

  const [keyword, setKeyword] = useState(normalizedInitialKeyword || DEFAULT_KEYWORD);
  const [selectedType, setSelectedType] = useState('카드뉴스');

  // main 기준 구조 유지: 업종/목적 분리
  const [industry, setIndustry] = useState('카페/디저트');
  const [purpose, setPurpose] = useState('공간 활용에 최적화된 실용적인 가구 홍보');

  const [target, setTarget] = useState('2030 직장인, 1인 자취가구');
  const [otherRequests, setOtherRequests] = useState('');

  // 모달에서 전달받은 키워드가 있으면 자동 반영
  useEffect(() => {
    if (!normalizedInitialKeyword) return;
    setKeyword(normalizedInitialKeyword);
  }, [normalizedInitialKeyword]);

  const handleSubmit = () => {
    const finalKeyword = keyword.trim();
    if (!finalKeyword) {
      alert('주제 키워드를 입력해 주세요.');
      return;
    }

    onGenerate({
      keyword: finalKeyword,
      type: selectedType,
      industry,
      context: purpose,
      target,
      otherRequests,
    });
  };

  const contentTypes = ['카드뉴스', '포스터', '썸네일'];

  const industries = [
    '크리에이터/유튜브',
    '카페/디저트',
    '맛집/요식업',
    '뷰티/헤어샵',
    '패션/의류',
    '헬스/피트니스',
    '교육/클래스',
    '화장품/스킨케어',
    '리빙/인테리어',
    '여행/숙박',
    '온라인 쇼핑몰',
    '공구/마켓',
    '기타',
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 h-full min-h-0 flex flex-col overflow-y-auto">
      <div className="mb-5 sm:mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
        <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
          <MagicWand weight="fill" /> 주제 키워드 (자동 분석됨)
        </label>
        <input
          type="text"
          className="w-full border border-indigo-200 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="트렌드 키워드 또는 원하는 주제 입력"
        />
        <p className="text-xs text-indigo-500 mt-2">
          기본적으로 트렌드 키워드가 입력되지만, 원하는 주제로 변경 가능합니다.
        </p>
      </div>

      <div className="mb-5 sm:mb-6">
        <label className="block text-sm font-bold text-gray-800 mb-2">1. 콘텐츠 유형</label>
        <div className="grid grid-cols-3 gap-2">
          {contentTypes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSelectedType(item)}
              className={`border rounded-lg p-3 text-center transition font-medium text-sm ${
                selectedType === item
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 sm:mb-6">
        <label className="block text-sm font-bold text-gray-800 mb-2">2. 업종</label>
        <select
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        >
          {industries.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-5 sm:mb-6">
        <label className="block text-sm font-bold text-gray-800 mb-2">3. 목적</label>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          rows={3}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="콘텐츠를 만드는 목적이나 핵심 내용을 자유롭게 적어주세요."
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-5 sm:mb-6">
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

        <label className="block text-sm font-bold text-gray-700 mb-2">기타 요구사항</label>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
          rows={2}
          value={otherRequests}
          onChange={(e) => setOtherRequests(e.target.value)}
          placeholder="예: 존댓말 사용, '최고'라는 단어 금지 등 자유롭게 입력"
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className={`w-full text-white font-bold py-3.5 sm:py-4 rounded-xl transition flex items-center justify-center gap-2 mt-auto text-base sm:text-lg shadow-md ${
          isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isLoading ? (
          '✨ 열심히 쓰는 중...'
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