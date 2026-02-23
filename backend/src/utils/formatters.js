const { spawnSync } = require('child_process');
const path = require('path');

// 날짜 변환 유틸리티
exports.toISODate = (dateStr, isEnd = false) => {
  if (!dateStr) return undefined;
  const time = isEnd ? '23:59:59' : '00:00:00';
  return new Date(`${dateStr}T${time}Z`).toISOString();
};

// 워드클라우드용 데이터 추출 유틸리티 (Python 연동)
exports.extractWordCloudData = (comments, keyword) => {
  if (!comments || comments.length === 0) return [];

  // 1. 순수 텍스트 배열만 추출 (URL, 대괄호 태그 제거)
  const textList = comments
    .map(c => (typeof c === 'object' && c.text) ? c.text : c)
    .filter(c => typeof c === 'string' && c.trim() !== '')
    .map(c => c.replace(/\[.*?\]/g, '').replace(/http\S+/g, '').trim());

  if (textList.length === 0) return [];

  // 2. 파이썬 스크립트 경로 지정
  const pythonScriptPath = path.join(__dirname, 'noun_extractor.py');
  
  try {
    // 3. spawnSync를 사용하여 파이썬 스크립트 실행 및 데이터 전달
    // 윈도우 환경에 따라 'python' 대신 'python3'를 써야 할 수도 있습니다.
    const result = spawnSync('python', [pythonScriptPath], {
      input: JSON.stringify(textList), // 댓글 데이터를 JSON 문자열로 전달
      encoding: 'utf-8'
    });

    if (result.error) {
      console.error('파이썬 실행 에러 (경로 또는 명령어 확인):', result.error);
      return [];
    }

    const output = result.stdout.trim();
    if (!output) return [];

    // 파이썬이 돌려준 명사 리스트 파싱
    const validNouns = JSON.parse(output);

    // 4. 빈도수 집계
    const frequency = {};
    validNouns.forEach(word => {
      // 검색 키워드 자체는 워드클라우드에서 제외
      if (word !== keyword) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    // 5. 정렬 및 상위 50개 반환
    return Object.entries(frequency)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 50);

  } catch (error) {
    console.error('NLP 파이썬 연동 중 심각한 에러 발생:', error);
    return [];
  }
};