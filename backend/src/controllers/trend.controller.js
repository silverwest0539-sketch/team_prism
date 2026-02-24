const trendService = require('../services/trend.service');

exports.getRisingTrends = async (req, res) => {
  try {
    const trends = await trendService.getRisingTrends();
    res.json(trends);
  } catch (error) {
    console.error("❌ /api/trends/rising 에러:", error);
    res.json([]);
  }
};

exports.getPlatformTrends = async (req, res) => {
  try {
    const { platform } = req.query;
    const trends = await trendService.getPlatformTrends(platform);
    res.json(trends);
  } catch (error) {
    console.error("❌ /api/trends/platform 에러:", error);
    res.json([]);
  }
};

exports.getAllTrends = async (req, res) => {
  try {
    const { keyword, date } = req.query;
    const trends = await trendService.getAllTrends(keyword, date);
    res.json(trends);
  } catch (error) {
    console.error("❌ /api/trends 에러:", error);
    res.json([]);
  }
};

exports.getAnalysis = async (req, res) => {
  const { keyword, startDate, endDate } = req.query;
  if (!keyword) return res.status(400).json({ error: 'Keyword required' });

  try {
    const analysisData = await trendService.getAnalysis(keyword, startDate, endDate);
    res.json(analysisData);
  } catch (error) {
    console.error("❌ /api/analysis 에러:", error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getAutocomplete = async (req, res) => {
  try {
    const { q } = req.query;
    // trendService의 getAutocomplete 호출 (trendService가 상단에 require 되어 있어야 함)
    const keywords = await trendService.getAutocomplete(q);
    res.json(keywords);
  } catch (error) {
    console.error("❌ /api/trends/autocomplete 에러:", error);
    res.status(500).json({ error: '자동완성 조회 실패' });
  }
};