// src/components/home/SummaryModal.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ArrowRight,
  TrendUp,
  ChatCircle,
  ChartLineUp,
  Smiley,
  Star,
} from '@phosphor-icons/react';
import { LineChart, Line, Tooltip, ResponsiveContainer, XAxis } from 'recharts';
import apiClient, { toApiUrl } from '../../utils/apiClient';
import { getStoredUser } from '../../utils/authStorage';
import { showToast } from '../../utils/toast';

export default function SummaryModal({ isOpen, onClose, data, onScrapChange }) {
  const navigate = useNavigate();
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (!isOpen || !data?.keyword) {
      setDetailData(null);
      return;
    }

    setLoading(true);

    const savedUser = getStoredUser();

    if (savedUser?.email) {
      apiClient
        .get('/scraps/check', {
          params: {
            email: savedUser.email,
            keyword: data.keyword,
          },
        })
        .then((res) => setIsBookmarked(Boolean(res.data?.isBookmarked)))
        .catch(() => setIsBookmarked(false));
    } else {
      setIsBookmarked(false);
    }

    const params = new URLSearchParams({
      keyword: data.keyword,
      type: data.type || 'trend',
    });

    fetch(toApiUrl(`/analysis?${params.toString()}`))
      .then((res) => res.json())
      .then((result) => {
        if (result.found) {
          setDetailData(result);
        }
      })
      .catch((err) => {
        console.error('모달 데이터 로딩 실패:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, data]);

  if (!isOpen) return null;

  const handleDetailMove = () => {
    if (!data?.keyword) return;
    onClose();
    navigate(`/analysis?keyword=${encodeURIComponent(data.keyword)}`);
  };

  const handleCreationMove = () => {
    if (!data?.keyword) return;
    onClose();
    navigate(`/creation?keyword=${encodeURIComponent(data.keyword)}`);
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    return `${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
  };

  const toggleBookmark = async () => {
    const savedUser = getStoredUser();

    if (!savedUser?.email) {
      if (
        window.confirm(
          '관심 키워드 저장(스크랩) 기능은 로그인이 필요합니다.\n로그인 페이지로 이동하시겠습니까?'
        )
      ) {
        onClose();
        navigate('/login');
      }
      return;
    }

    try {
      if (isBookmarked) {
        await apiClient.delete('/scraps', {
          params: {
            email: savedUser.email,
            keyword: data.keyword,
          },
        });
        setIsBookmarked(false);
      } else {
        await apiClient.post('/scraps', {
          email: savedUser.email,
          keyword: data.keyword,
        });
        setIsBookmarked(true);
      }
      onScrapChange?.();
    } catch (error) {
      showToast('스크랩 처리 중 오류가 발생했습니다.', { type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex justify-between items-start sm:items-center gap-3 bg-white sticky top-0 z-10">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-all">{data?.keyword}</h2>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleBookmark}
              className={`p-2 rounded-full transition-all duration-200 group ${
                isBookmarked
                  ? 'bg-yellow-50 text-yellow-500 hover:bg-yellow-100'
                  : 'bg-transparent text-gray-300 hover:bg-gray-100 hover:text-yellow-400'
              }`}
              title="관심 키워드 저장"
            >
              <Star
                size={24}
                weight={isBookmarked ? 'fill' : 'bold'}
                className={`transition-transform duration-200 ${
                  isBookmarked ? 'scale-110' : 'group-hover:scale-110'
                }`}
              />
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-600"
              title="닫기"
            >
              <X size={24} weight="bold" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-700 text-sm flex items-center gap-1 mb-3">
              <Smiley size={18} className="text-gray-500" /> 여론 신호등
            </h3>
            <div className="flex gap-2">
              <div className="flex-1 bg-white border border-green-100 p-3 rounded-xl flex flex-col items-center justify-center shadow-sm ring-2 ring-green-500 ring-offset-2">
                <div className="w-3 h-3 rounded-full bg-green-500 mb-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                <span className="text-xs font-bold text-green-700">긍정적</span>
                <span className="text-[10px] text-gray-400">65%</span>
              </div>
              <div className="flex-1 bg-white border border-gray-100 p-3 rounded-xl flex flex-col items-center justify-center opacity-50 grayscale">
                <div className="w-3 h-3 rounded-full bg-gray-400 mb-2"></div>
                <span className="text-xs font-bold text-gray-600">중립</span>
              </div>
              <div className="flex-1 bg-white border border-gray-100 p-3 rounded-xl flex flex-col items-center justify-center opacity-50 grayscale">
                <div className="w-3 h-3 rounded-full bg-red-400 mb-2"></div>
                <span className="text-xs font-bold text-gray-600">부정적</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
              <ChartLineUp size={18} className="text-indigo-500" /> 최근 3일 언급량 추이
            </h3>
            <div className="h-40 w-full bg-white border border-gray-100 rounded-2xl p-2 shadow-sm">
              {loading ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">데이터 로딩 중...</div>
              ) : detailData?.history ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={detailData.history.slice(-3)}>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                        padding: '8px',
                      }}
                      labelStyle={{ color: '#999', marginBottom: '4px' }}
                    />
                    <XAxis dataKey="date" tickFormatter={formatDateLabel} hide />
                    <Line
                      type="monotone"
                      dataKey="mentions"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">차트 데이터 없음</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
              <ChatCircle size={18} className="text-blue-500" /> 실제 반응 미리보기
            </h3>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4 text-xs text-gray-400">반응 불러오는 중...</div>
              ) : detailData?.comments && detailData.comments.length > 0 ? (
                detailData.comments.slice(0, 2).map((comment, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          comment.source.includes('youtube')
                            ? 'bg-red-100 text-red-600'
                            : 'bg-green-100 text-green-600'
                        }`}
                      >
                        {comment.source}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">"{comment.text}"</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-gray-400">관련 반응 데이터가 없습니다.</div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleCreationMove}
            className="w-full py-3.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl font-bold transition"
          >
            콘텐츠 생성으로 이동
          </button>
          <button
            onClick={handleDetailMove}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-200"
          >
            상세 분석 리포트 보러가기 <ArrowRight weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
