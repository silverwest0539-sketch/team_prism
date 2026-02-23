const express = require('express');
const router = express.Router();
const scrapController = require('../controllers/scrap.controller');

router.get('/', scrapController.getScraps);
router.post('/', scrapController.addScrap);
router.delete('/', scrapController.deleteScrap);
router.get('/check', scrapController.checkScrap);

module.exports = router;