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

exports.getPreferences = async (email) => {
  const [rows] = await db.execute(
    'SELECT preferred_community, preferred_newscategory FROM USERS WHERE user_email = ?', 
    [email]
  );
  if (rows.length === 0) throw new Error("NOT_FOUND");
  
  return {
    preferredCommunity: rows[0].preferred_community,
    preferredNews: rows[0].preferred_newscategory
  };
};

exports.updatePreference = async (email, preferredCommunity, preferredNewsCategory) => {
  const updates = [];
  const values = [];

  // preferredCommunity 값이 넘어왔을 때만 업데이트 항목에 추가
  if (preferredCommunity !== undefined) {
    updates.push('preferred_community = ?');
    values.push(preferredCommunity);
  }

  // preferredNewsCategory 값이 넘어왔을 때만 업데이트 항목에 추가
  if (preferredNewsCategory !== undefined) {
    updates.push('preferred_newscategory = ?');
    values.push(preferredNewsCategory);
  }

  // 둘 다 안 넘어왔으면 쿼리를 실행하지 않고 종료
  if (updates.length === 0) return;

  // 동적으로 쿼리문 조립 (예: UPDATE USERS SET preferred_community = ? WHERE user_email = ?)
  const query = `UPDATE USERS SET ${updates.join(', ')} WHERE user_email = ?`;
  values.push(email);

  await db.execute(query, values);
};

exports.login = async (email, password) => {
  const [rows] = await db.execute('SELECT * FROM USERS WHERE user_email = ?', [email]);
  if (rows.length === 0) throw new Error("INVALID_CREDENTIALS");

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) throw new Error("INVALID_CREDENTIALS");

  // JWT 발급
  const token = jwt.sign(
    { email: user.user_email, nickname: user.nickname, provider: user.provider },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  return { token, user: { email: user.user_email, nickname: user.nickname, provider: user.provider, preferredCommunity: user.preferred_community, preferredNews: user.preferred_newscategory } };
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

exports.socialLogin = async (userInfo, provider) => {
  const { sns_id, email, nickname } = userInfo;

  // 1. 요청된 소셜 타입에 따라 컬럼명(kakao_id 또는 naver_id) 지정
  const idColumn = provider === 'kakao' ? 'kakao_id' : 'naver_id';

  // 2. 동적 컬럼명으로 유저 검색
  const [rows] = await db.execute(
    `SELECT * FROM USERS WHERE ${idColumn} = ?`, 
    [sns_id]
  );
  
  let user = rows[0];

  // 3. 신규 유저라면 자동 회원가입 진행
  if (!user) {
    // 소셜에서 이메일을 줬다면 기존 로컬 가입 여부 확인
    if (email) {
      const [existingEmail] = await db.execute('SELECT * FROM USERS WHERE user_email = ?', [email]);
      if (existingEmail.length > 0) {
        throw new Error("EMAIL_ALREADY_EXISTS"); // 컨트롤러에서 409 에러로 처리
      }
    }

    const finalEmail = email || `${provider}_${sns_id}@prism.local`;
    const finalNickname = nickname || `prism_${Math.floor(1000 + Math.random() * 9000)}`;

    // 삽입 시에도 동적 컬럼 적용 (provider는 가입 출처 기록용으로 남김)
    const query = `INSERT INTO USERS (user_email, nickname, provider, ${idColumn}) VALUES (?, ?, ?, ?)`;
    await db.execute(query, [finalEmail, finalNickname, provider, sns_id]);
    
    const [newRows] = await db.execute(`SELECT * FROM USERS WHERE ${idColumn} = ?`, [sns_id]);
    user = newRows[0];
  }

  // 4. JWT 토큰 발급
  const token = jwt.sign(
    { email: user.user_email, nickname: user.nickname, provider: user.provider },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  return { 
    token, 
    user: { 
      email: user.user_email, 
      nickname: user.nickname, 
      provider: user.provider, 
      preferredCommunity: user.preferred_community, 
      preferredNews: user.preferred_newscategory,
      hasPassword: !!user.password,      
      kakaoId: user.kakao_id, 
      naverId: user.naver_id 
    } 
  };
};

exports.linkSocialAccount = async (email, userInfo, provider) => {
  const { sns_id } = userInfo;
  const idColumn = provider === 'kakao' ? 'kakao_id' : 'naver_id';
  const conn = await db.getConnection(); 

  try {
    await conn.beginTransaction();

    // 1. 해당 소셜 ID가 이미 다른 계정으로 존재하는지 확인
    const [existing] = await conn.execute(`SELECT user_email FROM USERS WHERE ${idColumn} = ?`, [sns_id]);

    if (existing.length > 0) {
      const oldEmail = existing[0].user_email;

      // 2. 다른 이메일(껍데기 계정)이라면 데이터 통합(Merge) 후 기존 계정 삭제
      if (oldEmail !== email) {
        // [키워드 스크랩 이전]
        await conn.execute('UPDATE IGNORE USER_KEYWORD_SCRAP SET user_email = ? WHERE user_email = ?', [email, oldEmail]);
        
        // [프롬프트 생성 기록 이전]
        await conn.execute('UPDATE IGNORE MARKETING_OUTPUT SET user_email = ? WHERE user_email = ?', [email, oldEmail]);

        // 기존 껍데기 소셜 계정 삭제
        await conn.execute('DELETE FROM USERS WHERE user_email = ?', [oldEmail]);
      }
    }

    // 3. 현재 접속 중인 계정에 소셜 ID 연동 (기존 provider 출처는 덮어쓰지 않음)
    await conn.execute(`UPDATE USERS SET ${idColumn} = ? WHERE user_email = ?`, [sns_id, email]);

    await conn.commit(); 
  } catch (error) {
    await conn.rollback(); 
    throw error; 
  } finally {
    conn.release(); 
  }
};

exports.unlinkSocialAccount = async (email, provider) => {
  const idColumn = provider === 'kakao' ? 'kakao_id' : 'naver_id';

  // 1. 유저 정보 조회
  const [rows] = await db.execute('SELECT * FROM USERS WHERE user_email = ?', [email]);
  if (rows.length === 0) throw new Error("NOT_FOUND");

  const user = rows[0];

  // 2. 안전 장치: 비밀번호도 없고, 다른 소셜 연동도 없는데 현재 소셜을 끊으려고 하는지 검사
  const hasPassword = user.password !== null && user.password !== '';
  // 해제하려는 provider 말고, 다른 provider에 ID가 존재하는지 확인
  const hasOtherSocial = (provider === 'kakao' && user.naver_id) || (provider === 'naver' && user.kakao_id);

  if (!hasPassword && !hasOtherSocial) {
    // 유일한 로그인 수단을 끊으려고 하므로 차단!
    throw new Error("CANNOT_UNLINK_ONLY_METHOD"); 
  }

  // 3. 안전하다면 해당 소셜 ID를 NULL로 업데이트하여 연동 해제
  await db.execute(`UPDATE USERS SET ${idColumn} = NULL WHERE user_email = ?`, [email]);
};