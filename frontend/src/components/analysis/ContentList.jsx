import React from 'react';

const ContentList = () => {
  // 화면 확인용 더미 데이터
  const contents = [1, 2, 3];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">원본 콘텐츠</h3>
        <button className="text-xs text-gray-500 border px-2 py-1 rounded">더 보기</button>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-4">
        <span className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full">전체</span>
        <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">글/댓글</span>
        <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">영상</span>
      </div>

      {/* 콘텐츠 카드 리스트 */}
      <div className="grid grid-cols-3 gap-4">
        {contents.map((item) => (
          <div key={item} className="border rounded-lg overflow-hidden">
            <div className="h-24 bg-gray-200"></div> {/* 썸네일 영역 */}
            <div className="p-3">
              <p className="font-bold text-sm mb-1">원본 콘텐츠 {item}</p>
              <p className="text-xs text-gray-400">조회 32만 • 2일 전</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentList;