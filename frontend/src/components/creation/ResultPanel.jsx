import React from 'react';
import { MagicWand } from '@phosphor-icons/react';

// [중요] 부모에게서 content(생성된 글)를 받아옵니다.
const ResultPanel = ({ content }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
      
      {/* 1. 상단 툴바 (우측 아이콘 및 키워드 뱃지 삭제됨) */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-gray-700">
            V1. AI 생성본
          </span>
          {/* 생성된 경우 심플한 점 표시 정도만 남김 (선택사항) */}
          {content && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
        </div>
        {/* 우측 버튼 그룹(복사, 컬럼, 내보내기) 삭제됨 */}
      </div>

      {/* [삭제됨] 2. 탭 메뉴 (결과물, 해시태그, 기획안) */}

      {/* 3. 에디터 영역 */}
      <div 
        className="flex-1 p-4 sm:p-6 overflow-y-auto outline-none" 
        // 필요하다면 수정 가능하게 유지, 원치 않으면 contentEditable 제거 가능
        contentEditable="true" 
        suppressContentEditableWarning={true}
      >
        {content ? (
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base sm:text-lg">
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

      {/* [삭제됨] 4. 하단 플로팅 액션 바 (AI 수정, 더 짧게, 블로그 변환) */}
      
    </div>
  );
};

export default ResultPanel;