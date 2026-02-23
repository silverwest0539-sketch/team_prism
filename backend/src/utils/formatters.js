// 날짜 변환 유틸리티 (YYYY-MM-DD -> ISO 8601)
exports.toISODate = (dateStr, isEnd = false) => {
  if (!dateStr) return undefined;
  const time = isEnd ? '23:59:59' : '00:00:00';
  return new Date(`${dateStr}T${time}Z`).toISOString();
};

// 워드클라우드용 데이터 추출 유틸리티
exports.extractWordCloudData = (comments, keyword) => {
  if (!comments || comments.length === 0) return [];

  const textList = comments.map(c => (typeof c === 'object' && c.text) ? c.text : c);
  const text = textList.join(' ');
  
  const cleanText = text
    .replace(/\[.*?\]/g, '') 
    .replace(/http\S+/g, '') 
    .replace(/[^\w가-힣\s]/g, '') 
    .replace(/\s+/g, ' '); 

  const words = cleanText.split(' ');
  const frequency = {};

  words.forEach(word => {
    if (word.length > 1 && word !== keyword) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
  });

  return Object.entries(frequency)
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 50);
};