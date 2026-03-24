import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import BrandLogo from '../components/common/BrandLogo';
import { showToast } from '../utils/toast';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeEmailCode = (code) => String(code || '').replace(/\D/g, '').slice(0, 6);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_CODE_REGEX = /^\d{6}$/;
const NICKNAME_MAX_LENGTH = 20;
const PASSWORD_MAX_LENGTH = 64;
const EMAIL_SEND_COOLDOWN_SECONDS = 30;
const AUTH_TIMER_SECONDS = 180;

const getSafeErrorMessage = (error, fallbackMessage) => {
  const serverMessage = String(error?.response?.data?.message || error?.response?.data?.error || '').trim();
  if (serverMessage) return serverMessage;

  const status = error?.response?.status;
  if (status === 409) return '이미 가입된 이메일입니다. 로그인하거나 다른 이메일을 사용해 주세요.';
  if (status === 400) return '입력 정보를 확인해 주세요.';
  if (status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  if (status >= 500) return '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  if (!error?.response) return '네트워크 연결을 확인해 주세요.';
  return fallbackMessage;
};

const EMPTY_ERRORS = {
  email: '',
  emailAuth: '',
  emailCode: '',
  nickname: '',
  password: '',
  passwordConfirm: '',
};

const SignupPage = () => {
  const navigate = useNavigate();
  const passwordConfirmInputRef = useRef(null);

  const [form, setForm] = useState({
    nickname: '',
    email: '',
    emailCode: '',
    password: '',
    passwordConfirm: '',
  });
  const [emailCheckStatus, setEmailCheckStatus] = useState('idle'); // idle | available
  const [emailMessage, setEmailMessage] = useState('');
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [emailCooldownSeconds, setEmailCooldownSeconds] = useState(0);
  const [authTimer, setAuthTimer] = useState(0);
  const [isPasswordConfirmFocused, setIsPasswordConfirmFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState(EMPTY_ERRORS);

  useEffect(() => {
    if (emailCooldownSeconds <= 0) return undefined;

    const timer = setInterval(() => {
      setEmailCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [emailCooldownSeconds]);

  useEffect(() => {
    // 인증 완료 상태이거나 타이머가 0이면 중지
    if (authTimer <= 0 || emailCheckStatus === 'verified') return undefined;

    const timer = setInterval(() => {
      setAuthTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setFieldError('emailCode', '인증 시간이 만료되었습니다. 인증번호를 다시 받아주세요.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [authTimer, emailCheckStatus]);

  // 초를 MM:SS 형식으로 변환하는 함수
  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isPasswordMismatch =
    form.passwordConfirm.trim().length > 0 && form.password !== form.passwordConfirm;
  const showEmailCodeInput = emailCheckStatus === 'available' || emailCheckStatus === 'verified';
  const showEmailMessage = Boolean(emailMessage) && emailCheckStatus !== 'idle';
  const showPasswordFeedback = isPasswordConfirmFocused && isPasswordMismatch;
  const isEmailCheckButtonDisabled =
    isSubmitting || isSendingEmailCode || emailCooldownSeconds > 0 || emailCheckStatus === 'verified';

  const getEmailCheckButtonLabel = () => {
    if (emailCheckStatus === 'verified') return '메일 확인 완료';
    if (isSendingEmailCode) return '전송 중...';
    if (emailCooldownSeconds > 0) return `${emailCooldownSeconds}초 후 재시도`;
    if (emailCheckStatus === 'available') return '인증번호 재전송';
    return '인증번호 받기';
  };

  const emailCheckButtonLabel = getEmailCheckButtonLabel();

  const inputClass = (hasError) =>
    `form-input ${hasError ? 'border-red-400 focus:ring-red-200 focus:ring-2' : ''}`;

  const setFieldError = (key, value) => {
    setFormErrors((prev) => ({ ...prev, [key]: value }));
  };

  const clearFieldError = (key) => {
    setFormErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const updateField = (field) => (event) => {
    const { value } = event.target;
    let nextValue = value;

    if (field === 'emailCode') {
      nextValue = normalizeEmailCode(value);
    } else if (field === 'nickname') {
      nextValue = value.slice(0, NICKNAME_MAX_LENGTH);
    } else if (field === 'password' || field === 'passwordConfirm') {
      nextValue = value.slice(0, PASSWORD_MAX_LENGTH);
    }

    setForm((prev) => {
      const next = { ...prev, [field]: nextValue };
      if (field === 'email') next.emailCode = '';
      return next;
    });

    if (field === 'email') {
      setEmailCheckStatus('idle');
      setEmailMessage('');
      setEmailCooldownSeconds(0);
      setAuthTimer(0);
      clearFieldError('email');
      clearFieldError('emailAuth');
      clearFieldError('emailCode');
    } else {
      clearFieldError(field);
    }

    if (field === 'password') {
      clearFieldError('passwordConfirm');
    }
  };

  const handleEmailCheck = async () => {
    if (isSendingEmailCode || emailCooldownSeconds > 0) return;

    const targetEmail = normalizeEmail(form.email);

    if (!targetEmail) {
      setEmailCheckStatus('idle');
      setEmailMessage('');
      setFieldError('email', '이메일을 입력해 주세요.');
      return;
    }

    if (!EMAIL_REGEX.test(targetEmail)) {
      setEmailCheckStatus('idle');
      setEmailMessage('');
      setFieldError('email', '올바른 이메일 형식이 아닙니다.');
      return;
    }

    clearFieldError('email');
    clearFieldError('emailAuth');
    setIsSendingEmailCode(true);

    try {
      const response = await apiClient.post('/auth/send-code', {
        email: targetEmail,
      });

      if (response.data.success) {
        setForm((prev) => ({ ...prev, email: targetEmail, emailCode: '' }));
        setEmailCheckStatus('available');
        setEmailMessage('');
        clearFieldError('emailCode');
        setEmailCooldownSeconds(EMAIL_SEND_COOLDOWN_SECONDS);
        setAuthTimer(AUTH_TIMER_SECONDS);
      } else {
        setEmailCheckStatus('idle');
        setEmailMessage('인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } catch (error) {
      setEmailCheckStatus('idle');
      setEmailMessage(
        getSafeErrorMessage(error, '입력한 정보로는 인증번호를 발송할 수 없습니다.'),
      );
    } finally {
      setIsSendingEmailCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!EMAIL_CODE_REGEX.test(form.emailCode)) {
      setFieldError('emailCode', '인증번호 6자리를 정확히 입력해 주세요.');
      return;
    }

    try {
      const response = await apiClient.post('/auth/verify-code', {
        email: normalizeEmail(form.email),
        code: normalizeEmailCode(form.emailCode),
      });

      if (response.data.success) {
        setEmailCheckStatus('verified'); // 인증 완료 상태로 변경
        setAuthTimer(0);
        setEmailCooldownSeconds(0);
        clearFieldError('emailCode');
        clearFieldError('emailAuth');
        showToast('이메일 인증이 완료되었습니다.', { type: 'success' });
      }
    } catch (error) {
      setFieldError('emailCode', '인증번호가 일치하지 않거나 만료되었습니다.');
    }
  };

  const validateBeforeSubmit = () => {
    const nextErrors = { ...EMPTY_ERRORS };
    const normalizedEmail = normalizeEmail(form.email);
    const normalizedEmailCode = normalizeEmailCode(form.emailCode);

    if (!normalizedEmail) {
      nextErrors.email = '이메일을 입력해 주세요.';
    } else if (!EMAIL_REGEX.test(normalizedEmail)) {
      nextErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    if (!form.nickname.trim()) {
      nextErrors.nickname = '닉네임을 입력해 주세요.';
    }

    if (!form.password.trim()) {
      nextErrors.password = '비밀번호를 입력해 주세요.';
    } else if (form.password.length < 8) {
      nextErrors.password = '비밀번호는 8자 이상이어야 합니다.';
    }

    if (!form.passwordConfirm.trim()) {
      nextErrors.passwordConfirm = '비밀번호 확인을 입력해 주세요.';
    } else if (form.password !== form.passwordConfirm) {
      nextErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }

    if (emailCheckStatus === 'idle') {
      nextErrors.emailAuth = '이메일 인증 과정을 먼저 진행해 주세요.';
    } 
    // 인증번호는 받았으나 확인 버튼을 누르지 않은 상태 (available)
    else if (emailCheckStatus === 'available') {
      nextErrors.emailAuth = '이메일 인증 확인을 먼저 완료해 주세요.';
      if (!EMAIL_CODE_REGEX.test(normalizedEmailCode)) {
        nextErrors.emailCode = '인증번호 6자리를 정확히 입력해 주세요.';
      }
    }

    if (emailCheckStatus !== 'verified') {
      nextErrors.emailAuth = '이메일 인증 확인을 먼저 완료해 주세요.';
    }

    setFormErrors(nextErrors);
    return Object.values(nextErrors).every((value) => value === '');
  };

  const handleSignup = async (event) => {
    event.preventDefault();

    if (!validateBeforeSubmit()) {
      if (!form.passwordConfirm.trim() || form.password !== form.passwordConfirm) {
        passwordConfirmInputRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/auth/signup', {
        email: normalizeEmail(form.email),
        nickname: form.nickname.trim(),
        password: form.password,
        code: normalizeEmailCode(form.emailCode),
      });

      if (response.data.success) {
        showToast('회원가입이 완료되었습니다.', { type: 'success' });
        navigate('/login');
      }
    } catch (error) {
      const status = error?.response?.status;

      if ([400, 401, 422].includes(status)) {
        setFieldError('emailAuth', '인증번호가 올바르지 않거나 만료되었습니다.');
      } else {
        showToast(getSafeErrorMessage(error, '회원가입에 실패했습니다.'), { type: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoClick = () => navigate('/');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card-soft w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <h1
            role="button"
            tabIndex={0}
            onClick={handleLogoClick}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleLogoClick();
              }
            }}
            className="mb-2 cursor-pointer"
            title="PicKey"
            aria-label="PicKey 로고"
          >
            <BrandLogo
              imageHeightClass="h-9"
              imageClassName="mx-auto block"
              textClassName="text-3xl font-bold text-indigo-600 hover:text-indigo-700"
            />
          </h1>
          <p className="text-gray-600 font-medium">지금 시작, PicKey와 함께하세요</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="form-label">이메일</label>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <input
                type="email"
                value={form.email}
                onChange={updateField('email')}
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                maxLength={254}
                placeholder="example@pickey.com"
                readOnly={emailCheckStatus === 'verified'}
                className={`${inputClass(Boolean(formErrors.email))} w-full ${
                  emailCheckStatus === 'verified' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
              />
              <button
                type="button"
                onClick={handleEmailCheck}
                disabled={isEmailCheckButtonDisabled}
                className="btn-auth-primary !w-full sm:!w-auto px-5 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {emailCheckButtonLabel}
              </button>
            </div>

            {formErrors.email && <p className="text-sm mt-1 text-red-500">{formErrors.email}</p>}
            {!formErrors.email && showEmailMessage && (
              <p className="text-sm mt-1 text-red-500">{emailMessage}</p>
            )}
            {formErrors.emailAuth && <p className="text-sm mt-1 text-red-500">{formErrors.emailAuth}</p>}

            {showEmailCodeInput && (
              <div className="mt-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={form.emailCode}
                      onChange={updateField('emailCode')}
                      readOnly={emailCheckStatus === 'verified'}
                      maxLength={6}
                      placeholder="인증번호 6자리 입력"
                      // 🔥 인증 완료 시 입력창 회색 처리 및 타이머 공간(pr-14) 확보
                      className={`form-input w-full border-indigo-300 ${
                        emailCheckStatus === 'verified' 
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' 
                          : 'bg-indigo-50 pr-14'
                      } ${formErrors.emailCode ? 'border-red-400 focus:ring-red-200 focus:ring-2' : ''}`}
                    />
                    {/* 🔥 3분 타이머 표시 (우측 안쪽에 배치) */}
                    {emailCheckStatus === 'available' && authTimer > 0 && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-red-500">
                        {formatTimer(authTimer)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    // 시간이 만료(authTimer === 0)되었거나 이미 완료되었을 땐 버튼 비활성화
                    disabled={emailCheckStatus === 'verified' || form.emailCode.length !== 6 || (emailCheckStatus === 'available' && authTimer === 0)}
                    className={`btn-auth-primary !w-full sm:!w-auto px-5 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${
                      emailCheckStatus === 'verified' ? '!bg-green-600' : ''
                    }`}
                  >
                    {emailCheckStatus === 'verified' ? '인증 완료' : '인증 확인'}
                  </button>
                </div>
                {formErrors.emailCode && (
                  <p className="text-sm mt-1 text-red-500">{formErrors.emailCode}</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="form-label">닉네임</label>
            <input
              type="text"
              value={form.nickname}
              onChange={updateField('nickname')}
              autoComplete="nickname"
              maxLength={NICKNAME_MAX_LENGTH}
              placeholder="사용할 닉네임"
              className={inputClass(Boolean(formErrors.nickname))}
            />
            {formErrors.nickname && <p className="text-sm mt-1 text-red-500">{formErrors.nickname}</p>}
          </div>

          <div>
            <label className="form-label">비밀번호</label>
            <input
              type="password"
              value={form.password}
              onChange={updateField('password')}
              autoComplete="new-password"
              minLength={8}
              maxLength={PASSWORD_MAX_LENGTH}
              placeholder="8자 이상 입력해 주세요"
              className={inputClass(Boolean(formErrors.password))}
            />
            {formErrors.password && <p className="text-sm mt-1 text-red-500">{formErrors.password}</p>}
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
              autoComplete="new-password"
              minLength={8}
              maxLength={PASSWORD_MAX_LENGTH}
              placeholder="비밀번호를 다시 입력해 주세요"
              className={inputClass(Boolean(formErrors.passwordConfirm || showPasswordFeedback))}
            />
            {(formErrors.passwordConfirm || showPasswordFeedback) && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.passwordConfirm || '비밀번호가 일치하지 않습니다.'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-auth-primary text-lg mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '가입 중..' : '회원가입 완료'}
          </button>
        </form>

        <div className="text-center mt-6">
          <span className="text-gray-500 text-sm">이미 계정이 있으신가요? </span>
          <Link to="/login" className="text-indigo-600 font-bold text-sm hover:underline ml-1">
            로그인
          </Link>
        </div>
      </div>

    </div>
  );
};

export default SignupPage;
