const { spawn } = require('child_process');
const path = require('path');

exports.toISODate = (dateStr, isEnd = false) => {
  if (!dateStr) return undefined;
  const time = isEnd ? '23:59:59' : '00:00:00';
  return new Date(`${dateStr}T${time}Z`).toISOString();
};

// 동기식(spawnSync)에서 비동기(Promise + spawn)로 변경
exports.extractWordCloudData = (comments, keyword) => {
  return new Promise((resolve) => {
    if (!comments || comments.length === 0) return resolve({ all: [] });

    // 1. 단순 텍스트 배열 대신, 텍스트와 플랫폼 정보(source)를 함께 매핑
    const payload = comments
      .filter(c => c && c.text && typeof c.text === 'string' && c.text.trim() !== '')
      .map(c => ({
         text: c.text.replace(/\[.*?\]/g, '').replace(/http\S+/g, '').trim(),
         // ✨ 변경점: 플랫폼 이름을 무조건 소문자로 통일하여 파이썬으로 전달
         platform: (c.source || 'unknown').toLowerCase() 
      }));

    if (payload.length === 0) return resolve({ all: [] });

    const pythonScriptPath = path.join(__dirname, 'noun_extractor.py');
    const pyProcess = spawn('python', [pythonScriptPath]);
    
    let output = '';
    let errorOutput = '';

    pyProcess.stdout.on('data', (data) => { output += data.toString(); });
    pyProcess.stderr.on('data', (data) => { errorOutput += data.toString(); });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('파이썬 실행 에러:', errorOutput);
        return resolve({ all: [] });
      }
      try {
        // 2. 파이썬에서 [{ word: '...', platform: '...' }] 형태로 반환한 데이터 파싱
        const extractedData = JSON.parse(output.trim());
        
        // 3. 플랫폼별로 빈도수를 담을 객체 초기화
        const freqByPlatform = { all: {} };
        
        extractedData.forEach(({ word, platform }) => {
          if (word !== keyword) {
            // 전체(all) 누적 카운트
            freqByPlatform.all[word] = (freqByPlatform.all[word] || 0) + 1;
            
            // 특정 플랫폼별 누적 카운트
            if (!freqByPlatform[platform]) {
              freqByPlatform[platform] = {};
            }
            freqByPlatform[platform][word] = (freqByPlatform[platform][word] || 0) + 1;
          }
        });

        // 4. 리액트에서 그리기 좋은 { text, value } 형태로 변환 후 내림차순 정렬
        const result = {};
        for (const [plat, freqMap] of Object.entries(freqByPlatform)) {
          result[plat] = Object.entries(freqMap)
            .map(([text, value]) => ({ text, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 50); // 상위 50개 제한
        }

        // { all: [...], youtube: [...], fmkorea: [...] } 객체 반환
        resolve(result); 
      } catch (error) {
        console.error('워드클라우드 파싱 에러:', error);
        resolve({ all: [] });
      }
    });

    // 변경된 payload(JSON 객체 배열) 전송
    pyProcess.stdin.write(JSON.stringify(payload));
    pyProcess.stdin.end();
  });
};