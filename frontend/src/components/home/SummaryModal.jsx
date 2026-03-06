// src/components/home/SummaryModal.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ArrowRight,
  ChatCircle,
  ChartLineUp,
  Smiley,
  Star,
  LockKey // [추가] 인물 부정댓글 잠금용 아이콘
} from '@phosphor-icons/react';
import { LineChart, Line, Tooltip, ResponsiveContainer, XAxis } from 'recharts';
import apiClient from '../../utils/apiClient';
import { getStoredUser } from '../../utils/authStorage';
import { showToast } from '../../utils/toast';
import {
  hasAccountLocalScrap,
  upsertAccountLocalScrap,
  removeAccountLocalScrap,
} from '../../utils/accountScrapFallback';

export default function SummaryModal({ isOpen, onClose, data, onScrapChange }) {
  const navigate = useNavigate();
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // [추가] 부정 댓글 블러 해제 상태
  const [isNegativeRevealed, setIsNegativeRevealed] = useState(false);

  useEffect(() => {
    if (!isOpen || !data?.keyword) {
      setDetailData(null);
      return;
    }

    setLoading(true);
    setIsNegativeRevealed(false); // 모달이 열릴 때마다 블러 상태 초기화

    const savedUser = getStoredUser();
    const targetKeyword = String(data?.keyword || '').trim();

    if (savedUser?.email) {
      const localScrapped = hasAccountLocalScrap(savedUser.email, targetKeyword);
      setIsBookmarked(localScrapped);

      apiClient
        .get('/scraps/check', {
          params: {
            email: savedUser.email,
            keyword: targetKeyword,
          },
        })
        .then((res) => setIsBookmarked(Boolean(res.data?.isBookmarked) || localScrapped))
        .catch(() => setIsBookmarked(localScrapped));
    } else {
      setIsBookmarked(false);
    }

    // API 호출 로직 (유지)
    apiClient
      .get('/analysis', {
        params: {
          keyword: data.keyword,
          type: data.type || 'trend',
        },
      })
      .then((res) => {
        const result = res.data;
        if (result?.found) {
          setDetailData(result);
          return;
        }
        setDetailData(null);
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
    const targetKeyword = String(data?.keyword || '').trim();

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

    if (!targetKeyword) return;

    try {
      if (isBookmarked) {
        try {
          await apiClient.delete('/scraps', {
            params: {
              email: savedUser.email,
              keyword: targetKeyword,
            },
          });
        } catch {
          // Keep going to clear account-local fallback entry.
        }
        removeAccountLocalScrap(savedUser.email, targetKeyword);
        setIsBookmarked(false);
      } else {
        try {
          await apiClient.post('/scraps', {
            email: savedUser.email,
            keyword: targetKeyword,
          });
          removeAccountLocalScrap(savedUser.email, targetKeyword);
        } catch {
          upsertAccountLocalScrap(savedUser.email, targetKeyword);
        }
        setIsBookmarked(true);
      }
      onScrapChange?.();
    } catch {
      showToast('스크랩 처리 중 오류가 발생했습니다.', { type: 'error' });
    }
  };

  const posScore = Number(detailData?.positive_score) || 0;
  const neuScore = Number(detailData?.neutral_score) || 0;
  const negScore = Number(detailData?.negative_score) || 0;

  const maxScore = Math.max(posScore, neuScore, negScore);
  
  let topSentiment = 'none'; 
  if (maxScore > 0) {
    if (maxScore === posScore) topSentiment = 'positive';
    else if (maxScore === negScore) topSentiment = 'negative';
    else topSentiment = 'neutral';
  } else if (detailData) {
    topSentiment = 'neutral'; 
  }

  // [추가] 인물 판별 및 미리보기 댓글(최대 2개) 설정 로직
  const isPersonKeyword = detailData?.is_person === 1;
  const allComments = detailData?.comments || [];
  const nonNegativeComments = allComments.filter(c => c.sentiment !== 'negative');
  const negativeComments = allComments.filter(c => c.sentiment === 'negative');
  const previewComments = [...nonNegativeComments, ...negativeComments].slice(0, 2);
  const hasNegativePreview = previewComments.some(c => c.sentiment === 'negative');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex justify-between items-start sm:items-center gap-3 bg-white sticky top-0 z-10">
          <div className="min-w-0">
            <span className="text-xl sm:text-2xl font-bold text-gray-900 break-all">{data?.keyword}</span>
            {isPersonKeyword && (
                <span className="bg-indigo-100 text-indigo-700 text-sm font-bold px-2.5 py-1 rounded-full align-middle ml-1">
                  인물
                </span>
              )}
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
          
          {/* 여론 신호등 */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-700 text-sm flex items-center gap-1 mb-3">
              <Smiley size={18} className="text-gray-500" /> 여론 신호등
            </h3>
            <div className="flex gap-2">
              <div className={`flex-1 bg-white border p-3 rounded-xl flex flex-col items-center justify-center transition-all ${
                topSentiment === 'positive'
                  ? 'border-green-100 shadow-sm ring-2 ring-green-500 ring-offset-2'
                  : 'border-gray-100 opacity-50 grayscale'
              }`}>
                <div className={`w-3 h-3 rounded-full mb-2 ${topSentiment === 'positive' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-400'}`}></div>
                <span className={`text-xs font-bold ${topSentiment === 'positive' ? 'text-green-700' : 'text-gray-600'}`}>긍정적</span>
              </div>

              <div className={`flex-1 bg-white border p-3 rounded-xl flex flex-col items-center justify-center transition-all ${
                topSentiment === 'neutral'
                  ? 'border-yellow-100 shadow-sm ring-2 ring-yellow-500 ring-offset-2'
                  : 'border-gray-100 opacity-50 grayscale'
              }`}>
                <div className={`w-3 h-3 rounded-full mb-2 ${topSentiment === 'neutral' ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'bg-gray-400'}`}></div>
                <span className={`text-xs font-bold ${topSentiment === 'neutral' ? 'text-yellow-700' : 'text-gray-600'}`}>중립</span>
              </div>

              <div className={`flex-1 bg-white border p-3 rounded-xl flex flex-col items-center justify-center transition-all ${
                topSentiment === 'negative'
                  ? 'border-red-100 shadow-sm ring-2 ring-red-500 ring-offset-2'
                  : 'border-gray-100 opacity-50 grayscale'
              }`}>
                <div className={`w-3 h-3 rounded-full mb-2 ${topSentiment === 'negative' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-gray-400'}`}></div>
                <span className={`text-xs font-bold ${topSentiment === 'negative' ? 'text-red-700' : 'text-gray-600'}`}>부정적</span>
              </div>
            </div>
          </div>

          {/* 최근 3일 언급량 추이 */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
              <ChartLineUp size={18} className="text-indigo-500" /> 최근 3일 언급량 추이
            </h3>
            <div className="h-40 w-full bg-white border border-gray-100 rounded-2xl p-2 shadow-sm relative overflow-hidden">
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-10 flex flex-col items-center justify-center animate-fade-in rounded-2xl">
                  <div className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                  <span className="text-indigo-600 font-bold animate-pulse text-sm">분석중...</span>
                </div>
              )}
              {detailData?.history ? (
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
              ) : !loading && (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">차트 데이터 없음</div>
              )}
            </div>
          </div>

          {/* 실제 반응 미리보기 */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                <ChatCircle size={18} className="text-blue-500" /> 실제 반응 미리보기
              </h3>
              
              {/* [추가] 인물이 아니면서 부정 댓글이 포함된 경우에만 동의 버튼 표시 */}
              {hasNegativePreview && !isPersonKeyword && (
                <button
                  onClick={() => setIsNegativeRevealed(!isNegativeRevealed)}
                  className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all border ${
                    isNegativeRevealed 
                      ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                      : 'bg-white text-gray-500 border-gray-300 hover:border-red-400 hover:text-red-500 shadow-sm'
                  }`}
                >
                  {isNegativeRevealed ? '부정 반응 가리기' : '부정 반응 보기 동의'}
                </button>
              )}
            </div>

            <div className="space-y-3 relative min-h-[100px]">
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-10 flex flex-col items-center justify-center animate-fade-in rounded-xl">
                  <div className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                  <span className="text-indigo-600 font-bold animate-pulse text-sm">분석중...</span>
                </div>
              )}

              {previewComments.length > 0 ? (
                previewComments.map((comment, idx) => {
                  const isNegative = comment.sentiment === 'negative';

                  // 케이스 1: 인물에 대한 부정 댓글 (아예 차단 및 안내)
                  if (isNegative && isPersonKeyword) {
                    return (
                      <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center gap-2">
                        <LockKey size={20} className="text-gray-400" weight="fill" />
                        <p className="text-[11px] text-gray-500">사이트 정책상 인물에 대한 부정 댓글은 공개되지 않습니다.</p>
                      </div>
                    );
                  }

                  // 케이스 2: 일반적인 경우 (동의 전 부정 댓글은 블러 처리)
                  const isBlurred = isNegative && !isNegativeRevealed;

                  return (
                    <div
                      key={idx}
                      className="relative bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 overflow-hidden"
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
                        {isNegative && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 rounded">부정적</span>}
                      </div>

                      <p className={`text-sm text-gray-600 line-clamp-2 transition-all duration-300 ${isBlurred ? 'blur-sm select-none opacity-40' : ''}`}>
                        "{comment.text}"
                      </p>

                      {/* 미동의 부정 댓글 오버레이 안내 */}
                      {isBlurred && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
                          <span className="text-[10px] font-bold text-gray-500 bg-white/95 px-2.5 py-1 rounded-md shadow-sm border border-gray-200">
                            상단의 동의 버튼을 눌러 확인하세요
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : !loading && (
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
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition"
          >
            상세 분석 리포트 보러가기 <ArrowRight weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
