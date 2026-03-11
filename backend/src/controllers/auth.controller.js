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
    if (error.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(409).json({ 
        success: false, 
        message: "이미 해당 이메일로 가입된 계정이 있습니다. 이메일로 로그인 후 마이페이지에서 소셜 연동을 진행해주세요." 
      });
    }
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
    if (error.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(409).json({ 
        success: false, 
        message: "이미 해당 이메일로 가입된 계정이 있습니다. 이메일로 로그인 후 마이페이지에서 소셜 연동을 진행해주세요." 
      });
    }
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

exports.linkKakao = async (req, res) => {
  const { email, code } = req.body; 

  if (!email || !code) {
    return res.status(400).json({ success: false, message: "이메일과 인가 코드가 필요합니다." });
  }

  try {
    const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID,
        client_secret: process.env.KAKAO_CLIENT_SECRET,
        redirect_uri: process.env.KAKAO_REDIRECT_URI, // 카카오 디벨로퍼스에 등록된 redirect URI
        code: code,
      },
      headers: { 'Content-type': 'application/x-www-form-urlencoded;charset=utf-8' }
    });

    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${tokenResponse.data.access_token}`,
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    });

    const kakaoUser = userResponse.data;
    const userInfo = { sns_id: String(kakaoUser.id) };

    // 작성하신 연동 서비스 호출
    await authService.linkSocialAccount(email, userInfo, 'kakao');
    const [dbUser] = await require('../database').execute('SELECT * FROM USERS WHERE user_email = ?', [email]);
    const user = dbUser[0];

    res.json({ 
      success: true, 
      message: "카카오 계정이 성공적으로 연동되었습니다.",
      user: { // 프론트엔드 MyPage.jsx의 필드명에 맞춤
        email: user.user_email,
        nickname: user.nickname,
        provider: user.provider,
        hasPassword: !!user.password,
        kakaoId: user.kakao_id,
        naverId: user.naver_id,
        preferredCommunity: user.preferred_community,
        preferredNews: user.preferred_newscategory
      }
    });

  } catch (error) {
    console.error('Kakao link error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: '카카오 연동에 실패했습니다.' });
  }
};

exports.linkNaver = async (req, res) => {
  // 프론트엔드에서 현재 로그인된 유저의 이메일과 네이버 인가 코드, state 값을 함께 보냅니다.
  const { email, code, state } = req.body; 

  if (!email || !code || !state) {
    return res.status(400).json({ success: false, message: "이메일, 인가 코드, 상태(state) 값이 모두 필요합니다." });
  }

  try {
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
    // 연동이 목적이므로 고유 식별자(id)만 추출합니다.
    const userInfo = { sns_id: String(naverUser.id) };

    // 3. 서비스 로직 호출하여 데이터베이스에 연동(통합) 반영
    await authService.linkSocialAccount(email, userInfo, 'naver');
    
    const [dbUser] = await require('../database').execute('SELECT * FROM USERS WHERE user_email = ?', [email]);
    const user = dbUser[0];

    res.json({ 
      success: true, 
      message: "네이버 계정이 성공적으로 연동되었습니다.",
      user: { // 프론트엔드 MyPage.jsx의 필드명에 맞춤
        email: user.user_email,
        nickname: user.nickname,
        provider: user.provider,
        hasPassword: !!user.password,
        kakaoId: user.kakao_id,
        naverId: user.naver_id,
        preferredCommunity: user.preferred_community,
        preferredNews: user.preferred_newscategory
      }
    });
  } catch (error) {
    console.error('Naver link error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: '네이버 연동에 실패했습니다.' });
  }
};

exports.unlinkSocial = async (req, res) => {
  // 프론트엔드에서 연동 해제할 소셜 종류(provider)와 이메일을 보냅니다.
  const { email, provider } = req.body; 

  if (!email || !provider) {
    return res.status(400).json({ success: false, message: "이메일과 연동 해제할 소셜 정보가 필요합니다." });
  }

  try {
    await authService.unlinkSocialAccount(email, provider);
    
    const providerName = provider === 'kakao' ? '카카오' : '네이버';
    res.json({ success: true, message: `${providerName} 계정 연동이 해제되었습니다.` });

  } catch (error) {
    // 💡 서비스에서 던진 안전장치 에러 처리
    if (error.message === "CANNOT_UNLINK_ONLY_METHOD") {
      return res.status(400).json({ 
        success: false, 
        message: "유일한 로그인 수단은 해제할 수 없습니다. 먼저 비밀번호를 설정하거나 다른 소셜 계정을 연동해 주세요." 
      });
    }

    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ success: false, message: "유저 정보를 찾을 수 없습니다." });
    }

    console.error('Unlink error:', error);
    res.status(500).json({ success: false, message: "연동 해제 중 오류가 발생했습니다." });
  }
};

// 정보 수정 제보 처리
exports.submitReport = async (req, res) => {
  const { keyword, content, userEmail } = req.body;

  if (!content) {
    return res.status(400).json({ success: false, message: "제보 내용이 필요합니다." });
  }

  try {
    // auth.service의 sendReportEmail 함수 호출
    await authService.sendReportEmail(keyword, content, userEmail);
    res.json({ success: true, message: "제보가 성공적으로 접수되었습니다." });
  } catch (error) {
    console.error("제보 메일 전송 에러:", error);
    res.status(500).json({ success: false, message: "제보 메일 발송 중 서버 에러가 발생했습니다." });
  }
};