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
router.post('/kakao', authController.kakaoLogin);
router.post('/naver', authController.naverLogin);
router.post('/update-preference', authController.updatePreference);

module.exports = router;