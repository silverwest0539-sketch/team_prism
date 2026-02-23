const summaryService = require('../services/summary.service');

exports.getSummary = async (req, res) => {
  const { keyword, startDate, endDate } = req.query;
  
  if (!keyword) {
    return res.status(400).json({ error: 'Keyword required' });
  }

  try {
    const result = await summaryService.generateSummary(keyword, startDate, endDate);
    
    if (result.status === 429) {
      return res.status(429).json({ summary: result.summary });
    }
    
    res.json({ summary: result.summary });
  } catch (error) {
    res.json({ summary: "현재 AI 분석 서비스를 이용할 수 없습니다." });
  }
};