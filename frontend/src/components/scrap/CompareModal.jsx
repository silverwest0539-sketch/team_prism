// src/components/scrap/CompareModal.jsx
import React, { useEffect, useState } from 'react';
import { X, ChartLineUp } from '@phosphor-icons/react';
import {
  LineChart, Line, Tooltip, ResponsiveContainer, XAxis, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];

export default function CompareModal({ isOpen, onClose, keywords }) {
  const [compareData, setCompareData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !keywords || keywords.length === 0) return;

    setLoading(true);
    // 각 키워드별 API 호출 후 데이터 합치기
    Promise.all(
      keywords.map(kw =>
        fetch(`http://localhost:5000/api/analysis?keyword=${kw.keyword}&type=${kw.type || 'trend'}`)
          .then(res => res.json())
          .catch(() => ({ found: false }))
      )
    ).then(results => {
      // 날짜별 데이터 병합
      const dateMap = {};
      results.forEach((result, idx) => {
        if (result.found && result.history) {
          result.history.forEach(entry => {
            if (!dateMap[entry.date]) dateMap[entry.date] = { date: entry.date };
            dateMap[entry.date][keywords[idx].keyword] = entry.mentions;
          });
        }
      });

      const merged = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
      setCompareData(merged);
      setLoading(false);
    });
  }, [isOpen, keywords]);

  if (!isOpen || !keywords || keywords.length === 0) return null;

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    return `${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* 헤더 */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex justify-between items-start sm:items-center gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ChartLineUp size={22} className="text-indigo-500" />
              키워드 비교 분석
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              선택된 {keywords.length}개 키워드의 언급량을 비교합니다
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-600"
          >
            <X size={24} weight="bold" />
          </button>
        </div>

        {/* 본문 */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">

          {/* 키워드 칩 */}
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw, idx) => (
              <span
                key={kw.keyword}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold border"
                style={{
                  borderColor: COLORS[idx % COLORS.length],
                  color: COLORS[idx % COLORS.length],
                  backgroundColor: `${COLORS[idx % COLORS.length]}10`
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                {kw.keyword}
              </span>
            ))}
          </div>

          {/* 비교 차트 */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-700 text-sm mb-4">언급량 추이 비교</h3>
            <div className="h-56 sm:h-64 w-full">
              {loading ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  데이터를 비교하는 중...
                </div>
              ) : compareData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={compareData}>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px', border: 'none',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                        fontSize: '12px', padding: '12px'
                      }}
                      labelFormatter={formatDateLabel}
                    />
                    <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fontSize: 11 }} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                    />
                    {keywords.map((kw, idx) => (
                      <Line
                        key={kw.keyword}
                        type="monotone"
                        dataKey={kw.keyword}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: COLORS[idx % COLORS.length], strokeWidth: 2, stroke: '#fff' }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  비교 가능한 데이터가 없습니다
                </div>
              )}
            </div>
          </div>

          {/* 간단 비교 테이블 */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-gray-500 font-bold text-xs">키워드</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-bold text-xs">순위</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-bold text-xs">타입</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-bold text-xs">메모</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw, idx) => (
                  <tr key={kw.keyword} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-bold flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      {kw.keyword}
                    </td>
                    <td className="text-center px-4 py-3 text-gray-600">
                      No.{kw.rank || '?'}
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        kw.type === 'platform'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {kw.type === 'platform' ? '플랫폼' : '트렌드'}
                      </span>
                    </td>
                    <td className="text-center px-4 py-3 text-gray-400 text-xs max-w-[120px] truncate">
                      {kw.memo || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* 하단 */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold transition"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}
