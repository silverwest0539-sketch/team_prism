const contentService = require('../services/content.service');

exports.getRisingContents = (req, res) => {
  try {
    const { platform } = req.query;
    const contents = contentService.getRisingContents(platform);
    res.json(contents);
  } catch (error) {
    console.error("❌ /api/contents/rising 에러:", error);
    res.json([]);
  }
};

exports.getVideos = async (req, res) => {
  try {
    const { category } = req.query;
    const videos = await contentService.getVideos(category);
    res.json(videos);
  } catch (error) {
    res.status(500).json([]);
  }
};

exports.getCommunityPosts = (req, res) => {
  try {
    const { platform } = req.query;
    const posts = contentService.getCommunityPosts(platform);
    res.json(posts);
  } catch (error) {
    console.error("❌ /api/community/posts 에러:", error);
    res.json([]);
  }
};

exports.getNews = async (req, res) => {
  try {
    const { keyword, startDate, endDate } = req.query;
    const news = await contentService.getNews(keyword, startDate, endDate);
    res.json(news);
  } catch (error) {
    res.status(500).json([]);
  }
};

exports.getNewsByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    const news = await contentService.getNewsByCategory(category);
    res.json(news);
  } catch (error) {
    console.error("❌ /api/news/category 에러:", error);
    res.status(500).json([]);
  }
};

exports.getNewsKeywords = async (req, res) => {
  try {
    // 1. 프론트엔드에서 보낸 category 값을 쿼리에서 추출
    const { category } = req.query; 
    
    // 2. 서비스 함수에 category 파라미터 전달
    const keywords = await contentService.getNewsKeywordRankings(category);
    res.json(keywords);
  } catch (error) {
    console.error("❌ /api/news/keywords 에러:", error); // 에러 로깅 추가 추천
    res.status(500).json([]);
  }
};