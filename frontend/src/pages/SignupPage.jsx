import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import usersData from '../../../backend/data/users.json';
import axios from 'axios';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const SignupPage = () => {
  const navigate = useNavigate();
  const passwordConfirmInputRef = useRef(null);

  const [form, setForm] = useState({
    nickname: '',
    email: '',
    emailCode: '',
    password: '',
    passwordConfirm: ''
  });

  const [emailCheckStatus, setEmailCheckStatus] = useState('idle'); // idle(초기) | duplicate(중복) | available(사용 가능)
  const [emailMessage, setEmailMessage] = useState('');
  const [isPasswordConfirmFocused, setIsPasswordConfirmFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPasswordMismatch =
    form.passwordConfirm.trim().length > 0 && form.password !== form.passwordConfirm;

  const showEmailCodeInput = emailCheckStatus === 'available';
  const showEmailMessage = Boolean(emailMessage) && emailCheckStatus !== 'available';
  const showPasswordFeedback = isPasswordConfirmFocused && isPasswordMismatch;

  const updateField = (field) => (event) => {
    const { value } = event.target;

    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'email') {
        next.emailCode = '';
      }

      return next;
    });

    if (field === 'email') {
      setEmailCheckStatus('idle');
      setEmailMessage('');
    }
  };

  const handleEmailCheck = async () => {
    const targetEmail = normalizeEmail(form.email);

    if (!targetEmail) {
      setEmailCheckStatus('idle');
      setEmailMessage('이메일을 입력해 주세요.');
      return;
    }

    try {
        // 기존 JSON 파일 비교 대신, 실제 백엔드로 메일 발송 및 중복 체크 요청
        const response = await axios.post('http://localhost:5000/api/auth/send-code', { email: targetEmail });
        
        // 요청이 성공했다면 (DB에 중복 이메일이 없음)
        if (response.data.success) {
          setForm((prev) => ({ ...prev, emailCode: '' }));
          setEmailCheckStatus('available'); // 인증번호 입력창 활성화
          setEmailMessage('메일로 인증번호가 발송되었습니다. (3분 유효)');
        }
      } catch (error) {
        // 에러 발생 시 처리
        if (error.response && error.response.status === 409) {
          // 서버에서 409 상태 코드를 보낸 경우 (중복 이메일)
          setEmailCheckStatus('duplicate');
          setEmailMessage('이미 사용 중인 이메일입니다.'); // 기존 UI/UX 그대로 유지
        } else {
          // 기타 에러 (메일 발송 실패, 서버 에러 등)
          setEmailCheckStatus('idle');
          setEmailMessage(error.response?.data?.message || '인증번호 발송에 실패했습니다.');
        }
      }
    };

  const handleSignup = async (event) => {
  event.preventDefault();
  if (isPasswordMismatch) return passwordConfirmInputRef.current?.focus();
  if (emailCheckStatus !== 'available' || !form.emailCode) {
    return alert('이메일 인증을 완료해 주세요.');
  }

  setIsSubmitting(true);
  try {
    // 회원가입 요청 시 입력한 인증번호(code)도 함께 전송
    const response = await axios.post('http://localhost:5000/api/auth/signup', {
      email: form.email,
      nickname: form.nickname,
      password: form.password,
      code: form.emailCode // 추가됨
    });

    if (response.data.success) {
      alert('회원가입이 완료되었습니다!');
      navigate('/login');
    }
  } catch (error) {
    alert(error.response?.data?.message || '회원가입 실패');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card-soft w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">Prism</h1>
          <p className="text-gray-600 font-medium">지금 시작, Prism과 함께하세요</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="form-label">이메일</label>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <input
                type="email"
                value={form.email}
                onChange={updateField('email')}
                placeholder="example@prism.com"
                className="form-input"
                required
              />
              <button
                type="button"
                onClick={handleEmailCheck}
                className="btn-auth-primary !w-full sm:!w-auto px-5 whitespace-nowrap"
              >
                {emailCheckStatus === 'available'
                  ? '인증번호 재전송'
                  : '인증번호 받기'}
              </button>
            </div>

            {showEmailMessage && (
              <p className="text-sm mt-1 text-red-500">{emailMessage}</p>
            )}

            {showEmailCodeInput && (
              <input
                type="text"
                value={form.emailCode}
                onChange={updateField('emailCode')}
                placeholder="인증번호 6자리 입력"
                className="form-input border-indigo-300 bg-indigo-50 mt-2"
              />
            )}
          </div>
          
          <div>
            <label className="form-label">닉네임</label>
            <input
              type="text"
              value={form.nickname}
              onChange={updateField('nickname')}
              placeholder="사용할 닉네임"
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="form-label">비밀번호</label>
            <input
              type="password"
              value={form.password}
              onChange={updateField('password')}
              placeholder="8자 이상 입력해 주세요"
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="form-label">비밀번호 확인</label>
            <input
              ref={passwordConfirmInputRef}
              type="password"
              value={form.passwordConfirm}
              onChange={updateField('passwordConfirm')}
              onFocus={() => setIsPasswordConfirmFocused(true)}
              onBlur={() => setIsPasswordConfirmFocused(false)}
              placeholder="비밀번호를 다시 입력해 주세요"
              className="form-input"
              required
            />
            {showPasswordFeedback && (
              <p className="text-sm text-red-500 mt-1">
                비밀번호가 일치하지 않습니다.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-auth-primary text-lg mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '가입 중...' : '회원가입 완료'}
          </button>
        </form>

        <div className="text-center mt-6">
          <span className="text-gray-500 text-sm">이미 계정이 있으신가요? </span>
          <Link
            to="/login"
            className="text-indigo-600 font-bold text-sm hover:underline ml-1"
          >
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
