import React from 'react';

const WORD_CLOUD_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6'];

const SimpleWordCloud = React.memo(({ words }) => {
  const normalizedWords = Array.isArray(words) ? words : [];

  if (normalizedWords.length === 0) {
    return <div className="flex justify-center items-center h-full text-gray-400 text-sm">데이터 부족</div>;
  }

  const values = normalizedWords.map((word) => word.value);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);

  const getFontSize = (value) => {
    if (maxVal === minVal) return 16;
    return 12 + ((value - minVal) / (maxVal - minVal)) * 14;
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center content-center h-full p-4 overflow-hidden">
      {normalizedWords.slice(0, 15).map((word, index) => (
        <span
          key={index}
          style={{
            fontSize: `${getFontSize(word.value)}px`,
            color: WORD_CLOUD_COLORS[index % WORD_CLOUD_COLORS.length],
            opacity: 0.8 + (word.value / maxVal) * 0.2,
          }}
          className="font-bold cursor-default hover:scale-110 transition-transform duration-200 whitespace-nowrap"
          title={`${word.value}회 언급`}
        >
          {word.text}
        </span>
      ))}
    </div>
  );
});

export default SimpleWordCloud;
