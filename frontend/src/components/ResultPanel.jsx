import React from 'react';
import { Copy, Columns, Export, MagicWand, ArrowRight } from '@phosphor-icons/react';

// [중요] 부모에게서 content(생성된 글)를 받아옵니다.
const ResultPanel = ({ content }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
      
      {/* 1. 상단 툴바 */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <select className="text-sm font-bold text-gray-700 border-none bg-transparent focus:ring-0 cursor-pointer">
            <option>V1. AI 생성본</option>
          </select>
          {/* 글이 생성되었을 때만 '저장됨' 뱃지가 뜹니다 */}
          {content && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">
              저장됨
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"><Copy size={20} weight="bold" /></button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"><Columns size={20} weight="bold" /></button>
          <button className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"><Export size={20} weight="bold" /></button>
        </div>
      </div>

      {/* 2. 탭 메뉴 */}
      <div className="flex px-4 border-b border-gray-200 gap-6">
        <button className="py-3 text-sm font-bold text-indigo-600 border-b-2 border-indigo-600">📝 결과물</button>
        <button className="py-3 text-sm font-medium text-gray-500 hover:text-gray-800 transition">#️⃣ 해시태그</button>
        <button className="py-3 text-sm font-medium text-gray-500 hover:text-gray-800 transition">🎨 기획안</button>
      </div>

      {/* 3. 에디터 영역 (여기가 핵심!) */}
      <div 
        className="flex-1 p-6 overflow-y-auto outline-none" 
        contentEditable="true" 
        suppressContentEditableWarning={true}
      >
        {/* 
           [논리 구조]
           content(새 데이터)가 있으면? -> 그걸 보여준다.
           없으면? -> 안내 문구(또는 기존 예시)를 보여준다.
        */}
        {content ? (
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-lg">
            {content}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
             <MagicWand size={48} weight="duotone" className="mb-4 opacity-50"/>
             <p className="text-lg font-medium">왼쪽에서 내용을 입력하고 버튼을 눌러보세요!</p>
             <p className="text-sm">AI가 멋진 문구를 만들어드립니다.</p>
          </div>
        )}
      </div>

      {/* 4. 플로팅 액션 바 */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center gap-2 overflow-x-auto">
        <button className="flex items-center gap-1 bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-indigo-50 transition whitespace-nowrap">
          <MagicWand weight="fill" /> AI 수정:
        </button>
        <button className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-full text-sm hover:bg-gray-100 transition whitespace-nowrap">더 짧게</button>
        <button className="flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-100 transition whitespace-nowrap ml-auto">
          <ArrowRight weight="bold" /> 블로그로 변환
        </button>
      </div>
    </div>
  );
};

export default ResultPanel;