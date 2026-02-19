import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import usersData from '../../../backend/data/users.json';

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

  const handleEmailCheck = () => {
    const targetEmail = normalizeEmail(form.email);

    if (!targetEmail) {
      setEmailCheckStatus('idle');
      setEmailMessage('이메일을 입력해 주세요.');
      return;
    }

    const users = Array.isArray(usersData?.users) ? usersData.users : [];
    const isDuplicate = users.some(
      (user) => normalizeEmail(user?.email) === targetEmail
    );

    if (isDuplicate) {
      setEmailCheckStatus('duplicate');
      setEmailMessage('이미 사용 중인 이메일입니다.');
      return;
    }

    setForm((prev) => ({ ...prev, emailCode: '' }));
    setEmailCheckStatus('available');
    setEmailMessage('');
  };

  const handleSignup = (event) => {
    event.preventDefault();

    if (isPasswordMismatch) {
      passwordConfirmInputRef.current?.focus();
      return;
    }

    if (emailCheckStatus !== 'available') {
      setEmailCheckStatus('idle');
      setEmailMessage('인증번호 받기를 눌러 이메일 중복 여부를 확인해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      alert('현재는 회원가입 화면 표시 단계입니다.');
      navigate('/login');
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
            <label className="form-label">이메일</label>
            <div className="flex gap-2 mb-2">
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
                className="btn-auth-primary !w-auto px-5 whitespace-nowrap"
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
