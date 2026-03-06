const axios = require('axios');
const authService = require('../services/auth.service');

exports.sendCode = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "이메일이 필요합니다." });

  try {
    await authService.sendAuthCode(email);
    res.json({ success: true, message: "인증번호가 발송되었습니다." });
  } catch (error) {
    if (error.message === "ALREADY_EXISTS") {
      return res.status(409).json({ success: false, message: "이미 사용 중인 이메일입니다." });
    }
    console.error("인증번호 발송 에러:", error);
    res.status(500).json({ success: false, message: "서버 에러가 발생했습니다." });
  }
};

exports.signup = async (req, res) => {
  const { email, nickname, password, code } = req.body;
  try {
    await authService.signup(email, nickname, password, code);
    res.status(201).json({ success: true, message: "회원가입 성공" });
  } catch (error) {
    if (error.message === "INVALID_CODE") return res.status(400).json({ success: false, message: "인증번호가 일치하지 않습니다." });
    if (error.message === "EXPIRED_CODE") return res.status(400).json({ success: false, message: "인증번호가 만료되었습니다. 다시 요청해주세요." });
    console.error(error);
    res.status(500).json({ success: false, message: "서버 에러" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await authService.login(email, password);
    res.json({ success: true, ...result }); // token, user 포함
  } catch (error) {
    if (error.message === "INVALID_CREDENTIALS") return res.status(401).json({ success: false, message: "정보가 틀렸습니다." });
    res.status(500).json({ success: false, message: "서버 에러" });
  }
};

exports.findPassword = async (req, res) => {
  const { email } = req.body;
  try {
    await authService.findPassword(email);
    res.json({ success: true, message: "임시 비밀번호가 메일로 발송되었습니다." });
  } catch (error) {
    if (error.message === "NOT_FOUND") return res.status(404).json({ success: false, message: "가입되지 않은 이메일입니다." });
    console.error("비밀번호 찾기 에러:", error);
    res.status(500).json({ success: false, message: "서버 에러가 발생했습니다." });
  }
};

exports.updateProfile = async (req, res) => {
  const { email, newNickname } = req.body;
  try {
    await authService.updateProfile(email, newNickname);
    res.json({ success: true, message: "이름이 성공적으로 변경되었습니다.", nickname: newNickname });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

exports.changePassword = async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  try {
    await authService.changePassword(email, currentPassword, newPassword);
    res.json({ success: true, message: "비밀번호가 성공적으로 변경되었습니다." });
  } catch (error) {
    if (error.message === "NOT_FOUND") return res.status(404).json({ success: false, message: "유저를 찾을 수 없습니다." });
    if (error.message === "INVALID_PASSWORD") return res.status(401).json({ success: false, message: "현재 비밀번호가 일치하지 않습니다." });
    console.error(error);
    res.status(500).json({ success: false, message: "서버 오류 발생" });
  }
};

exports.withdraw = async (req, res) => {
  const { email } = req.body;
  try {
    await authService.withdraw(email);
    res.json({ success: true, message: "회원 탈퇴가 완료되었습니다." });
  } catch (error) {
    if (error.message === "NOT_FOUND") return res.status(404).json({ success: false, message: "유저를 찾을 수 없습니다." });
    console.error("회원 탈퇴 에러:", error);
    res.status(500).json({ success: false, message: "회원 탈퇴 처리 중 오류 발생" });
  }
};

exports.kakaoLogin = async (req, res) => {
  try {
    const { code } = req.body;

    // 1. 카카오 서버로 Access Token 요청
    const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID,
        client_secret: process.env.KAKAO_CLIENT_SECRET,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
        code: code,
      },
      headers: { 'Content-type': 'application/x-www-form-urlencoded;charset=utf-8' }
    });

    // 2. Access Token으로 카카오 유저 정보 요청
    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${tokenResponse.data.access_token}`,
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    });

    const kakaoUser = userResponse.data;
    const userInfo = {
      sns_id: String(kakaoUser.id),
      email: kakaoUser.kakao_account?.email,
      nickname: kakaoUser.properties?.nickname,
    };

    const result = await authService.socialLogin(userInfo, 'kakao');
    res.json({ success: true, ...result });

  } catch (error) {
    console.error('Kakao login error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: '카카오 로그인에 실패했습니다.' });
  }
};

exports.naverLogin = async (req, res) => {
  try {
    const { code, state } = req.body;

    // 1. 네이버 서버로 Access Token 요청
    const tokenResponse = await axios.get('https://nid.naver.com/oauth2.0/token', {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID,
        client_secret: process.env.NAVER_CLIENT_SECRET,
        code: code,
        state: state
      }
    });

    // 2. Access Token으로 네이버 유저 정보 요청
    const userResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
    });

    const naverUser = userResponse.data.response;
    const userInfo = {
      sns_id: String(naverUser.id),
      email: naverUser.email,
      nickname: naverUser.nickname || naverUser.name,
    };

    const result = await authService.socialLogin(userInfo, 'naver');
    res.json({ success: true, ...result });

  } catch (error) {
    console.error('Naver login error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: '네이버 로그인에 실패했습니다.' });
  }
};

exports.updatePreference = async (req, res) => {
  // req.body에서 preferredNews도 함께 받습니다 (HomePage.jsx에서 이렇게 보내고 있음)
  const { email, preferredCommunity, preferredNews } = req.body; 
  try {
    await authService.updatePreference(email, preferredCommunity, preferredNews);
    res.json({ 
      success: true, 
      message: "선호 설정이 저장되었습니다.", 
      preferredCommunity,
      preferredNews 
    });
  } catch (error) {
    console.error("선호 설정 저장 오류:", error);
    res.status(500).json({ success: false, message: "서버 오류 발생" });
  }
};

exports.getPreferences = async (req, res) => {
  const { email } = req.query; // GET 요청이므로 query에서 받습니다.
  if (!email) return res.status(400).json({ success: false, message: "이메일이 필요합니다." });

  try {
    const prefs = await authService.getPreferences(email);
    res.json({ success: true, ...prefs });
  } catch (error) {
    console.error("취향 조회 에러:", error);
    res.status(500).json({ success: false, message: "서버 에러가 발생했습니다." });
  }
};