// src/utils/formatters.js

/**
 * 조회수를 한국어 형식으로 포맷 (만회, 천회)
 */
export const formatViews = (views) => {
  if (!views) return '0회';
  const num = parseInt(views, 10);
  if (num >= 10000) return (num / 10000).toFixed(1) + '만회';
  if (num >= 1000) return (num / 1000).toFixed(1) + '천회';
  return num + '회';
};

/**
 * 날짜를 "N일 전" 형식으로 포맷
 */
export const formatDate = (dateString) => {
  const published = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - published);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return `${diffDays}일 전`;
};

/**
 * YYYYMMDD → MM.DD 형식으로 변환
 */
export const formatDateLabel = (dateStr) => {
  if (!dateStr) return '';
  return `${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
};

/**
 * YYYYMMDD → YYYY-MM-DD 형식으로 변환 (input[type="date"]용)
 */
export const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
};