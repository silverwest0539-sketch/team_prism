const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/send-code', authController.sendCode);
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/find-password', authController.findPassword);
router.post('/update-profile', authController.updateProfile);
router.post('/change-password', authController.changePassword);
router.delete('/withdraw', authController.withdraw);

module.exports = router;