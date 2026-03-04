// routes/promptRoutes.js
const express = require('express');
const router = express.Router();
const promptController = require('../controllers/prompt.controller');

// POST /api/generate 
router.post('/generate', promptController.generatePrompt);

module.exports = router;