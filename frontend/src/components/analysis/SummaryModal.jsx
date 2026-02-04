import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, ArrowRight, CaretRight, 
  TrendUp, ChatCircle, ChartLineUp,
  Smiley, SmileySad, SmileyMeh // 감정 표현용 아이콘
} from '@phosphor-icons/react';
import { 
  LineChart, Line, Tooltip, ResponsiveContainer, XAxis 
} from 'recharts';

export default function SummaryModal({ isOpen, onClose, data }) { // data는 HomePage에서 넘겨준 기본 정보 (keyword, rank 등)
  const navigate = useNavigate();
  const [detailData, setDetailData] = useState(null); // 차트와 댓글을 위한 상세 데이터
  const [loading, setLoading] = useState(false);

  // 모달이 열리면 해당 키워드의 '상세 데이터'를 서버에서 가져옴 (차트, 댓글용)
  useEffect(() => {
    if (isOpen && data?.keyword) {
      setLoading(true);
      fetch(`http://localhost:5000/api/analysis?keyword=${data.keyword}`)
        .then(res => res.json())
        .then(result => {
          if (result.found) {
            setDetailData(result);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("모달 데이터 로딩 실패:", err);
          setLoading(false);
        });
    } else {
      setDetailData(null); // 모달 닫히면 초기화
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  // 상세 페이지 이동 핸들러
  const handleDetailMove = () => {
    onClose();
    // 쿼리 스트링을 포함하여 이동 -> AnalysisPage에서 자동으로 검색 실행됨
    navigate(`/analysis?keyword=${data.keyword}`);
  };

  // 날짜 포맷팅 (YYYYMMDD -> MM.DD)
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    return `${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* 1. 헤더 영역 */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
             <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full mb-1 inline-block">
               No.{data?.rank || '-'} 급상승 키워드
             </span>
             <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
               {data?.keyword}
             </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-600">
            <X size={24} weight="bold"/>
          </button>
        </div>

        {/* 2. 스크롤 가능한 본문 영역 */}
        <div className="overflow-y-auto p-6 space-y-6">
          
          {/* (1) 긍부정 신호등 (기능 미구현 - 더미 UI 유지) */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
             <div className="flex justify-between items-center mb-3">
               <h3 className="font-bold text-gray-700 text-sm flex items-center gap-1">
                 <Smiley size={18} className="text-gray-500"/> 여론 신호등
               </h3>
             </div>
             <div className="flex gap-2">
                {/* 긍정 (활성화 예시) */}
                <div className="flex-1 bg-white border border-green-100 p-3 rounded-xl flex flex-col items-center justify-center shadow-sm opacity-100 ring-2 ring-green-500 ring-offset-2">
                   <div className="w-3 h-3 rounded-full bg-green-500 mb-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                   <span className="text-xs font-bold text-green-700">긍정적</span>
                   <span className="text-[10px] text-gray-400">65%</span>
                </div>
                {/* 중립 */}
                <div className="flex-1 bg-white border border-gray-100 p-3 rounded-xl flex flex-col items-center justify-center opacity-50 grayscale">
                   <div className="w-3 h-3 rounded-full bg-gray-400 mb-2"></div>
                   <span className="text-xs font-bold text-gray-600">중립</span>
                </div>
                {/* 부정 */}
                <div className="flex-1 bg-white border border-gray-100 p-3 rounded-xl flex flex-col items-center justify-center opacity-50 grayscale">
                   <div className="w-3 h-3 rounded-full bg-red-400 mb-2"></div>
                   <span className="text-xs font-bold text-gray-600">부정적</span>
                </div>
             </div>
          </div>

          {/* (2) 언급량 추이 (차트 연동) */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
              <ChartLineUp size={18} className="text-indigo-500"/> 최근 3일 언급량 추이
            </h3>
            <div className="h-40 w-full bg-white border border-gray-100 rounded-2xl p-2 shadow-sm">
              {loading ? (
                 <div className="h-full flex items-center justify-center text-xs text-gray-400">데이터 로딩 중...</div>
              ) : detailData?.history ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={detailData.history}>
                    <Tooltip 
                      contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 10px rgba(0,0,0,0.1)', fontSize:'12px', padding:'8px'}}
                      labelStyle={{color:'#999', marginBottom:'4px'}}
                    />
                    <XAxis dataKey="date" tickFormatter={formatDateLabel} hide />
                    <Line 
                      type="monotone" 
                      dataKey="mentions" 
                      stroke="#6366f1" 
                      strokeWidth={3} 
                      dot={{r:3, fill:'#6366f1', strokeWidth:2, stroke:'#fff'}} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">차트 데이터 없음</div>
              )}
            </div>
          </div>

          {/* (3) AI 요약 (더미 데이터) */}
          <div>
             <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
              <TrendUp size={18} className="text-orange-500"/> AI 트렌드 요약
            </h3>
            <div className="bg-orange-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed border border-orange-100">
               <span className="font-bold text-orange-700 mr-1">💡 Insight:</span>
               현재 해당 키워드는 소셜 미디어와 커뮤니티에서 동시에 급상승하고 있습니다. 
               주로 2030 세대의 관심도가 높으며, 긍정적인 바이럴이 확산되는 추세입니다. 
               (이 내용은 현재 더미 데이터입니다.)
            </div>
          </div>

          {/* (4) 실제 언급 사례 (데이터 연동) */}
          <div>
             <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
              <ChatCircle size={18} className="text-blue-500"/> 실제 반응 미리보기
            </h3>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4 text-xs text-gray-400">반응 불러오는 중...</div>
              ) : detailData?.comments && detailData.comments.length > 0 ? (
                detailData.comments.slice(0, 2).map((comment, idx) => ( // 상위 2개만 노출
                  <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2">
                     <div className="flex items-center gap-2">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          comment.source.includes('youtube') 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-green-100 text-green-600'
                       }`}>
                         {comment.source}
                       </span>
                     </div>
                     <p className="text-sm text-gray-600 line-clamp-2">
                       "{comment.text}"
                     </p>
                  </div>
                ))
              ) : (
                 <div className="text-center py-4 text-xs text-gray-400">관련 반응 데이터가 없습니다.</div>
              )}
            </div>
          </div>

        </div>

        {/* 3. 하단 버튼 (고정) */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button 
            onClick={handleDetailMove}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-200"
          >
            상세 분석 리포트 보러가기 <ArrowRight weight="bold"/>
          </button>
        </div>

      </div>
    </div>
  );
}