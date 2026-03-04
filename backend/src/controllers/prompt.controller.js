// controllers/prompt.controller.js
const promptService = require('../services/prompt.service');

exports.generatePrompt = async (req, res) => {
  try {
    const { keyword, type, industry, context, target, otherRequests } = req.body;

    if (!keyword) {
      return res.status(400).json({ success: false, error: '키워드를 입력해 주세요.' });
    }

    // 1. 스트리밍을 위한 헤더 설정 (중요)
    // 이 설정이 있어야 브라우저가 타임아웃을 내지 않고 기다립니다.
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 2. DB 데이터 조회 (이 부분은 이전과 동일)
    const keywordId = await promptService.getKeywordId(keyword);
    let trendData = null;

    if (keywordId) {
      const [stats, examples] = await Promise.all([
        promptService.getTrendStats(keywordId),
        promptService.getUsageExamples(keywordId)
      ]);
      trendData = { stats, examples };
    }

    const formData = { keyword, type, industry, context, target, otherRequests };

    // 3. AI 서비스 호출 (스트리밍 방식)
    // 세 번째 인자로 한 글자씩 올 때마다 실행될 콜백 함수를 전달합니다.
    await promptService.createPromptWithAI(formData, trendData, (chunk) => {
      // 클라이언트에게 데이터 전송 (SSE 표준 포맷: data: 내용\n\n)
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    });

    // 4. 생성이 완료되었음을 알림
    // res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();

  } catch (error) {
    console.error('[Prompt Generation Error]:', error);
    
    // 에러 발생 시에도 클라이언트에게 상황을 전달하고 연결 종료
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
    }
    res.write(`data: ${JSON.stringify({ error: '생성 중 오류가 발생했습니다.' })}\n\n`);
    res.end();
  }
};