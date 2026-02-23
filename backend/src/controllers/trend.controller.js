const trendService = require('../services/trend.service');

exports.getRisingTrends = (req, res) => {
  try {
    const trends = trendService.getRisingTrends();
    res.json(trends);
  } catch (error) {
    console.error("❌ /api/trends/rising 에러:", error);
    res.json([]);
  }
};

exports.getPlatformTrends = (req, res) => {
  try {
    const { platform } = req.query;
    const trends = trendService.getPlatformTrends(platform);
    res.json(trends);
  } catch (error) {
    console.error("❌ /api/trends/platform 에러:", error);
    res.json([]);
  }
};

exports.getAllTrends = (req, res) => {
  try {
    const { keyword, date } = req.query;
    const trends = trendService.getAllTrends(keyword, date);
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