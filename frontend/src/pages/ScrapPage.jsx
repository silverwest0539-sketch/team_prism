// 즐겨찾기 페이지
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash, ArrowRight, BookmarkSimple } from '@phosphor-icons/react';
import { getScraps, removeScrap } from '../utils/storage';
import { formatDate } from '../utils/formatters';

const ScrapPage = () => {
    const navigate = useNavigate();
    const [scraps, setScraps] = useState([]);

    // 페이지 로드 시 데이터 불러오기
    useEffect(() => {
        setScraps(getScraps());
    }, []);

    // 삭제 핸들러
    const handleDelete = (e, keyword) => {
        e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
        if (window.confirm(`'${keyword}' 스크랩을 삭제하시겠습니까?`)) {
            removeScrap(keyword);
            setScraps(getScraps()); // 목록 갱신
        }
    };

    return (
        <div className="page">
            <div className="mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BookmarkSimple className="text-blue-600" size={32} weight="fill" />
                    내 스크랩
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    관심 있게 본 트렌드 키워드를 모아두었습니다.
                </p>
            </div>

            {scraps.length === 0 ? (
                // 데이터가 없을 때 (Empty State)
                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
                    <BookmarkSimple size={48} className="mb-4 opacity-50" />
                    <p className="font-medium">아직 스크랩한 키워드가 없습니다.</p>
                    <button
                        onClick={() => navigate('/home')}
                        className="mt-4 text-blue-600 hover:underline text-sm font-bold"
                    >
                        트렌드 둘러보러 가기
                    </button>
                </div>
            ) : (
                // 데이터가 있을 때 (Grid Layout)
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scraps.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(`/analysis?keyword=${item.keyword}`)}
                            className="card-soft group cursor-pointer hover:shadow-md transition-all border border-gray-100 hover:border-blue-200"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                        No.{item.rank || '?'}
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors">
                                        {item.keyword}
                                    </h3>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, item.keyword)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                                    title="삭제"
                                >
                                    <Trash size={18} />
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">
                                {item.desc}
                            </p>

                            <div className="flex justify-between items-center text-xs text-gray-400 pt-4 border-t border-gray-50">
                                <span>{item.savedAt ? formatDate(item.savedAt) : '날짜 정보 없음'} 저장됨</span>
                                <span className="flex items-center gap-1 text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                    분석 보기 <ArrowRight />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ScrapPage;