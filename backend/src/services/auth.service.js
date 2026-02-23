const db = require('../database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// 이메일 발송 설정
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 이메일 인증번호 임시 저장소 (메모리 방식)
const emailAuthCache = {};

exports.sendAuthCode = async (email) => {
  // 1. 가입 이력 확인
  const [rows] = await db.execute('SELECT user_email FROM USERS WHERE user_email = ?', [email]);
  if (rows.length > 0) {
    throw new Error("ALREADY_EXISTS"); // 컨트롤러에서 에러를 구분하기 위해 던짐
  }

  // 2. 난수 생성 및 메일 발송
  const authCode = Math.floor(100000 + Math.random() * 900000).toString();
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: '[Prism] 회원가입 인증번호입니다.',
    html: `<h2>요청하신 인증번호는 <strong>${authCode}</strong> 입니다.</h2><p>3분 안에 입력해 주세요.</p>`
  });

  // 3. 캐시 저장
  emailAuthCache[email] = {
    code: authCode,
    expiresAt: Date.now() + 3 * 60 * 1000
  };
};

exports.signup = async (email, nickname, password, code) => {
  const cached = emailAuthCache[email];
  
  if (!cached || cached.code !== code) throw new Error("INVALID_CODE");
  if (Date.now() > cached.expiresAt) {
    delete emailAuthCache[email];
    throw new Error("EXPIRED_CODE");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const query = `INSERT INTO USERS (user_email, nickname, password) VALUES (?, ?, ?)`;
  await db.execute(query, [email, nickname, hashedPassword]);
  
  delete emailAuthCache[email];
};

exports.login = async (email, password) => {
  const [rows] = await db.execute('SELECT * FROM USERS WHERE user_email = ?', [email]);
  if (rows.length === 0) throw new Error("INVALID_CREDENTIALS");

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) throw new Error("INVALID_CREDENTIALS");

  // JWT 발급
  const token = jwt.sign(
    { email: user.user_email, nickname: user.nickname },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  return { token, user: { email: user.user_email, nickname: user.nickname } };
};

exports.findPassword = async (email) => {
  const [rows] = await db.execute('SELECT * FROM USERS WHERE user_email = ?', [email]);
  if (rows.length === 0) throw new Error("NOT_FOUND");

  const tempPassword = crypto.randomBytes(4).toString('hex');
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  await db.execute('UPDATE USERS SET password = ? WHERE user_email = ?', [hashedPassword, email]);

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: '[Prism] 임시 비밀번호 안내입니다.',
    html: `
      <h3>요청하신 임시 비밀번호가 발급되었습니다.</h3>
      <p>임시 비밀번호: <strong>${tempPassword}</strong></p>
      <p>로그인 후 반드시 마이페이지에서 비밀번호를 변경해 주세요.</p>
    `
  });
};

exports.updateProfile = async (email, newNickname) => {
  await db.execute('UPDATE USERS SET nickname = ? WHERE user_email = ?', [newNickname, email]);
};

exports.changePassword = async (email, currentPassword, newPassword) => {
  const [rows] = await db.execute('SELECT * FROM USERS WHERE user_email = ?', [email]);
  if (rows.length === 0) throw new Error("NOT_FOUND");

  const user = rows[0];
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new Error("INVALID_PASSWORD");

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.execute('UPDATE USERS SET password = ? WHERE user_email = ?', [hashedPassword, email]);
};

exports.withdraw = async (email) => {
  // 스크랩 데이터 선 삭제 후 유저 삭제
  await db.execute('DELETE FROM USER_KEYWORD_SCRAP WHERE user_email = ?', [email]);
  const [result] = await db.execute('DELETE FROM USERS WHERE user_email = ?', [email]);
  
  if (result.affectedRows === 0) throw new Error("NOT_FOUND");
};