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
    const keywords = await contentService.getNewsKeywordRankings();
    res.json(keywords);
  } catch (error) {
    res.status(500).json([]);
  }
};