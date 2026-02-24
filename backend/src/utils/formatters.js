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
    if (!comments || comments.length === 0) return resolve([]);

    const textList = comments
      .map(c => (typeof c === 'object' && c.text) ? c.text : c)
      .filter(c => typeof c === 'string' && c.trim() !== '')
      .map(c => c.replace(/\[.*?\]/g, '').replace(/http\S+/g, '').trim());

    if (textList.length === 0) return resolve([]);

    const pythonScriptPath = path.join(__dirname, 'noun_extractor.py');
    const pyProcess = spawn('python', [pythonScriptPath]);
    
    let output = '';
    let errorOutput = '';

    pyProcess.stdout.on('data', (data) => { output += data.toString(); });
    pyProcess.stderr.on('data', (data) => { errorOutput += data.toString(); });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('파이썬 실행 에러:', errorOutput);
        return resolve([]);
      }
      try {
        const validNouns = JSON.parse(output.trim());
        const frequency = {};
        validNouns.forEach(word => {
          if (word !== keyword) frequency[word] = (frequency[word] || 0) + 1;
        });

        const result = Object.entries(frequency)
          .map(([text, value]) => ({ text, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 50);
        resolve(result);
      } catch (error) {
        console.error('워드클라우드 파싱 에러:', error);
        resolve([]);
      }
    });

    // 파이썬으로 데이터 전송
    pyProcess.stdin.write(JSON.stringify(textList));
    pyProcess.stdin.end();
  });
};