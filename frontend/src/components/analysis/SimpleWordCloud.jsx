import React, { useEffect, useMemo, useState } from 'react';

const LIGHT_WORD_CLOUD_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6'];
const DARK_COLOR_BY_RANK = ['#99F6E4', '#93C5FD', '#F9A8D4', '#7DD3FC', '#C4B5FD'];
const DARK_NEUTRAL_PRIMARY = '#E5E7EB';
const DARK_NEUTRAL_SECONDARY = '#CBD5E1';
const DARK_NEUTRAL_TERTIARY = '#94A3B8';

const getIsDarkMode = () => {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('theme-dark');
};

const getDarkWordStyle = (rank) => {
  if (rank === 0) {
    return {
      color: DARK_COLOR_BY_RANK[0],
      opacity: 1,
      textShadow: '0 0 10px rgba(153, 246, 228, 0.18)',
      fontWeight: 700,
    };
  }
  if (rank === 1) {
    return {
      color: DARK_COLOR_BY_RANK[1],
      opacity: 1,
      textShadow: '0 0 8px rgba(147, 197, 253, 0.14)',
      fontWeight: 700,
    };
  }
  if (rank === 2) {
    return {
      color: DARK_COLOR_BY_RANK[2],
      opacity: 0.98,
      textShadow: 'none',
      fontWeight: 650,
    };
  }
  if (rank === 3) {
    return {
      color: DARK_COLOR_BY_RANK[3],
      opacity: 0.97,
      textShadow: 'none',
      fontWeight: 650,
    };
  }
  if (rank === 4) {
    return {
      color: DARK_COLOR_BY_RANK[4],
      opacity: 0.96,
      textShadow: 'none',
      fontWeight: 620,
    };
  }
  if (rank <= 9) {
    return {
      color: DARK_NEUTRAL_SECONDARY,
      opacity: 0.9,
      textShadow: 'none',
      fontWeight: 560,
    };
  }
  return {
    color: rank % 2 === 0 ? DARK_NEUTRAL_PRIMARY : DARK_NEUTRAL_TERTIARY,
    opacity: rank <= 12 ? 0.84 : 0.8,
    textShadow: 'none',
    fontWeight: 520,
  };
};

const SimpleWordCloud = React.memo(({ words }) => {
  const [isDarkMode, setIsDarkMode] = useState(getIsDarkMode);
  const normalizedWords = Array.isArray(words) ? words : [];
  const visibleWords = normalizedWords.slice(0, 15);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const root = document.documentElement;
    const syncTheme = () => setIsDarkMode(root.classList.contains('theme-dark'));
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const rankByIndex = useMemo(() => {
    const indexed = visibleWords.map((word, index) => ({
      index,
      value: Number(word?.value) || 0,
    }));
    indexed.sort((a, b) => b.value - a.value);
    const rankMap = new Map();
    indexed.forEach((item, rank) => {
      rankMap.set(item.index, rank);
    });
    return rankMap;
  }, [visibleWords]);

  const debugRows = useMemo(
    () =>
      visibleWords.map((word, index) => {
        const value = Number(word?.value) || 0;
        const rank = rankByIndex.get(index) ?? index;
        const darkStyle = getDarkWordStyle(rank);
        return {
          keyword: String(word?.text || ''),
          rank: rank + 1,
          value,
          finalColor: isDarkMode ? darkStyle.color : '(light-mode)',
          opacity: isDarkMode ? darkStyle.opacity : '(light-mode)',
          textShadow: isDarkMode ? darkStyle.textShadow : '(light-mode)',
        };
      }),
    [visibleWords, rankByIndex, isDarkMode]
  );

  useEffect(() => {
    if (!import.meta.env.DEV || !isDarkMode || debugRows.length === 0) return;
    console.groupCollapsed('[SimpleWordCloud][Dark] rank/value/finalColor');
    console.table(debugRows);
    console.groupEnd();
  }, [debugRows, isDarkMode]);

  if (visibleWords.length === 0) {
    return <div className="flex justify-center items-center h-full text-gray-400 text-sm">데이터 부족</div>;
  }

  const values = visibleWords.map((word) => Number(word?.value) || 0);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);

  const getFontSize = (value) => {
    if (maxVal === minVal) return 16;
    return 12 + ((value - minVal) / (maxVal - minVal)) * 14;
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center content-center h-full p-4 overflow-hidden">
      {visibleWords.map((word, index) => {
        const value = Number(word?.value) || 0;
        const rank = rankByIndex.get(index) ?? index;
        const darkStyle = getDarkWordStyle(rank);
        const lightColor = LIGHT_WORD_CLOUD_COLORS[index % LIGHT_WORD_CLOUD_COLORS.length];
        return (
          <span
            key={index}
            style={{
              fontSize: `${getFontSize(value)}px`,
              color: isDarkMode ? darkStyle.color : lightColor,
              opacity: isDarkMode ? darkStyle.opacity : 0.8 + (value / (maxVal || 1)) * 0.2,
              fontWeight: isDarkMode ? darkStyle.fontWeight : 700,
              textShadow: isDarkMode ? darkStyle.textShadow : 'none',
            }}
            className={`cursor-default transition-transform duration-200 whitespace-nowrap ${rank < 5 ? 'hover:scale-105' : ''}`}
            title={`${value} 언급량`}
          >
            {word?.text}
          </span>
        );
      })}
    </div>
  );
});

export default SimpleWordCloud;
