// routes/promptRoutes.js
const express = require('express');
const router = express.Router();
const promptController = require('../controllers/prompt.controller');

// POST /api/generate 
router.post('/generate', promptController.generatePrompt);
router.post('/save', promptController.savePrompt); // 저장
router.get('/list', promptController.getPrompts); // 조회
router.delete('/:id', promptController.deletePrompt); // 삭제

module.exports = router;