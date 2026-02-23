const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');

router.get('/contents/rising', contentController.getRisingContents);
router.get('/videos', contentController.getVideos);
router.get('/community/posts', contentController.getCommunityPosts);
router.get('/news', contentController.getNews);

module.exports = router;