import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import { showToast } from '../utils/toast';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeEmailCode = (code) => String(code || '').replace(/\D/g, '').slice(0, 6);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_CODE_REGEX = /^\d{6}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;
const NICKNAME_MAX_LENGTH = 20;
const PASSWORD_MAX_LENGTH = 64;
const EMAIL_SEND_COOLDOWN_SECONDS = 60;

const getSafeErrorMessage = (error, fallbackMessage) => {
  const status = error?.response?.status;
  if (status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  if (status >= 500) return '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  return fallbackMessage;
};

const POLICY_CONTENT = {
  service: {
    title: '서비스 이용약관',
    body: `
제1조 (목적)
본 약관은 Prism 서비스 운영자(이하 "회사")가 제공하는 Prism 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "회원"이란 본 약관에 동의하고 회사와 이용계약을 체결하여 서비스를 이용하는 자를 말합니다.
2. "계정"이란 회원 식별과 서비스 이용을 위하여 회원이 설정한 이메일 및 비밀번호 기반의 로그인 수단을 말합니다.
3. "콘텐츠"란 회원이 서비스 내에서 작성, 업로드, 저장, 전송하는 텍스트, 이미지, 링크, 기타 정보 일체를 말합니다.

제3조 (약관의 게시, 효력 및 개정)
1. 회사는 본 약관의 내용을 회원이 알 수 있도록 회원가입 화면 또는 서비스 내에 게시합니다.
2. 회사는 관련 법령을 위반하지 않는 범위에서 본 약관을 개정할 수 있습니다.
3. 약관이 개정되는 경우 회사는 적용일자 및 개정사유를 명시하여 적용일 7일 전(회원에게 불리한 변경의 경우 30일 전)부터 공지합니다.
4. 회원이 개정약관 시행일까지 명시적으로 거부 의사를 표시하지 않고 서비스를 계속 이용하는 경우, 개정약관에 동의한 것으로 봅니다.

제4조 (약관 외 준칙)
본 약관에서 정하지 아니한 사항은 관련 법령 및 회사가 별도로 정한 운영정책, 공지사항, 안내문 등의 규정을 따릅니다.

제5조 (이용계약의 체결)
1. 이용계약은 회원이 가입 양식에 필요한 정보를 입력하고 본 약관 및 개인정보 처리 관련 사항에 동의한 후 회사가 이를 승낙함으로써 체결됩니다.
2. 회사는 다음 각 호에 해당하는 경우 가입 신청을 승낙하지 않거나 사후에 이용계약을 해지할 수 있습니다.
   - 타인의 정보를 도용하거나 허위 정보를 기재한 경우
   - 만 14세 미만 등 관련 법령상 가입이 제한되는 경우
   - 서비스 운영을 현저히 저해할 우려가 있는 경우
   - 기타 관련 법령 또는 본 약관에 위반되는 경우

제6조 (회원정보의 정확성 및 관리)
1. 회원은 가입 시 사실에 부합하는 정확한 정보를 제공하여야 하며, 정보 변경 시 지체 없이 수정하여야 합니다.
2. 회원은 계정 및 비밀번호를 스스로 관리할 책임이 있으며, 이를 제3자에게 양도·대여·공유할 수 없습니다.
3. 회원의 관리 소홀로 발생한 손해에 대하여 회사는 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.

제7조 (회사의 의무)
1. 회사는 관련 법령 및 본 약관을 준수하며, 안정적으로 서비스를 제공하기 위하여 노력합니다.
2. 회사는 회원으로부터 제기되는 의견이나 불만이 정당하다고 인정되는 경우, 합리적인 기간 내에 이를 처리하도록 노력합니다.
3. 회사는 서비스 개선, 점검, 장애 복구 등을 위하여 필요한 조치를 취할 수 있습니다.

제8조 (회원의 의무)
1. 회원은 관련 법령, 본 약관, 운영정책 및 회사의 안내사항을 준수하여야 합니다.
2. 회원은 서비스 이용 과정에서 회사 또는 제3자의 권리를 침해하지 않아야 하며, 서비스의 정상 운영을 방해해서는 안 됩니다.

제9조 (금지행위)
회원은 다음 각 호의 행위를 하여서는 안 됩니다.
1. 타인의 개인정보, 계정정보 또는 결제정보를 도용하는 행위
2. 허위사실 유포, 명예훼손, 모욕, 협박, 스팸 발송 등 타인에게 피해를 주는 행위
3. 음란물·불법정보 게시, 저작권 침해, 지식재산권 침해 행위
4. 서비스의 보안 취약점을 악용하거나 비정상적인 방법으로 접근하는 행위
5. 매크로, 자동화 도구, 크롤링 등으로 서비스에 과도한 부하를 주는 행위
6. 회사의 사전 승인 없이 영리 목적의 광고·홍보를 게시하는 행위
7. 기타 법령 또는 공서양속에 반하는 행위

제10조 (서비스의 제공, 변경 및 중단)
1. 회사는 연중무휴 1일 24시간 서비스 제공을 원칙으로 하나, 시스템 점검·유지보수·교체, 장애 대응, 통신두절 등의 사유가 있는 경우 서비스 제공을 일시 중단할 수 있습니다.
2. 회사는 서비스 정책, 기술적 필요, 운영상 필요에 따라 서비스의 일부 또는 전부를 변경할 수 있습니다.
3. 회사는 전항에 따른 변경 또는 중단이 있는 경우, 사전에 공지함을 원칙으로 하되 불가피한 경우 사후 공지할 수 있습니다.

제11조 (게시물 및 콘텐츠의 관리)
1. 회원이 서비스에 게시한 콘텐츠의 저작권은 원칙적으로 해당 회원에게 귀속됩니다.
2. 회원은 서비스 운영, 노출, 개선, 백업, 장애 대응을 위하여 필요한 범위 내에서 회사가 콘텐츠를 저장·복제·전송·표시할 수 있는 비독점적 이용권을 회사에 부여합니다.
3. 회사는 다음 각 호에 해당하는 콘텐츠를 사전 통지 없이 삭제, 비공개 처리하거나 노출을 제한할 수 있습니다.
   - 법령, 본 약관, 운영정책에 위반되는 콘텐츠
   - 제3자의 권리를 침해하거나 침해 우려가 있는 콘텐츠
   - 서비스 안정성 및 건전한 이용 환경을 현저히 저해하는 콘텐츠

제12조 (지식재산권)
1. 서비스에 관한 상표, 로고, 디자인, 소프트웨어, 데이터 등 일체의 권리는 회사 또는 정당한 권리자에게 귀속됩니다.
2. 회원은 회사의 사전 서면 동의 없이 서비스를 통해 얻은 정보를 복제, 배포, 전송, 출판, 방송 기타 방법으로 영리 이용할 수 없습니다.

제13조 (이용제한 및 계약해지)
1. 회사는 회원이 본 약관을 위반하는 경우 사안의 중대성에 따라 경고, 일시적 이용제한, 영구 이용제한, 이용계약 해지 등의 조치를 취할 수 있습니다.
2. 회원은 언제든지 탈퇴를 요청할 수 있으며, 회사는 관련 법령 및 내부 정책에 따라 이를 처리합니다.
3. 회사는 관련 법령에 따라 보관이 필요한 정보를 제외하고 회원의 탈퇴 요청 처리 후 지체 없이 관련 정보를 파기 또는 분리 보관합니다.

제14조 (손해배상)
1. 회원이 본 약관 또는 관련 법령을 위반하여 회사 또는 제3자에게 손해를 발생시킨 경우, 해당 회원은 그 손해를 배상할 책임이 있습니다.
2. 회사가 회원에게 손해배상 책임을 부담하는 경우에도 회사의 고의 또는 중대한 과실이 없는 한 특별손해, 간접손해, 결과적 손해에 대하여는 책임을 지지 않습니다.

제15조 (면책)
1. 회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중단, 기타 불가항력으로 인하여 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.
2. 회사는 회원의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.
3. 회사는 회원 간 또는 회원과 제3자 사이에 서비스를 매개로 발생한 분쟁에 개입할 의무가 없으며, 회사의 고의 또는 중대한 과실이 없는 한 이로 인한 손해에 책임을 지지 않습니다.

제16조 (통지)
1. 회사는 회원에게 통지할 사항이 있는 경우 서비스 내 공지, 이메일 등 합리적인 방법으로 통지할 수 있습니다.
2. 불특정 다수 회원에 대한 통지는 서비스 내 공지사항 게시로 갈음할 수 있습니다.

제17조 (준거법 및 관할)
본 약관은 대한민국 법령을 준거법으로 하며, 회사와 회원 간 발생한 분쟁에 관하여는 관련 법령에 따른 관할 법원을 제1심 관할법원으로 합니다.

부칙
본 약관은 2026년 2월 23일부터 시행합니다.
`,
  },
  privacy: {
    title: '개인정보 수집·이용 동의',
    body: `
1. 개인정보 수집·이용 주체
- Prism 서비스 운영자(이하 "회사")

2. 수집하는 개인정보 항목
- 필수 항목: 이메일 주소, 닉네임, 비밀번호(암호화 저장)
- 서비스 이용 과정에서 자동 수집될 수 있는 항목: 접속 로그, 이용기록, 기기/브라우저 정보, IP 주소, 쿠키

3. 개인정보 수집 및 이용 목적
- 회원 식별 및 본인 확인, 회원가입 의사 확인
- 계정 생성 및 로그인 인증, 계정 보안 관리
- 서비스 제공, 기능 개선, 고객 문의/민원 처리
- 부정 이용 방지, 서비스 안정성 확보, 분쟁 대응 및 기록 보존
- 법령 및 약관 위반 행위 조사, 공지사항 전달

4. 개인정보 보유 및 이용 기간
- 회원정보: 회원 탈퇴 시까지 보유하며, 탈퇴 요청 시 지체 없이 파기합니다.
- 단, 관련 법령에 따라 보존이 필요한 경우 해당 법령에서 정한 기간 동안 분리 보관 후 파기합니다.
- 예시(해당 시):
  - 접속기록: 3개월
  - 소비자 불만 또는 분쟁처리 기록: 3년
  - 계약 또는 청약철회 등에 관한 기록: 5년

5. 개인정보 제3자 제공
- 회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
- 다만, 아래의 경우에는 예외로 합니다.
  - 이용자가 사전에 동의한 경우
  - 법령에 특별한 규정이 있거나, 수사기관 등의 적법한 절차에 따른 요청이 있는 경우

6. 개인정보 처리 위탁
- 회사는 원활한 서비스 제공을 위해 필요한 경우 개인정보 처리 업무를 외부 전문업체에 위탁할 수 있습니다.
- 위탁 시 관련 법령에 따라 수탁자, 위탁업무 내용, 보유기간 등을 공개하고 관리·감독합니다.

7. 개인정보의 국외 이전
- 회사는 원칙적으로 개인정보를 국내에서 처리합니다.
- 향후 국외 이전이 필요한 경우 이전 항목, 국가, 일시/방법, 보유기간, 수탁자를 사전에 고지하고 별도 동의를 받습니다.

8. 개인정보 파기 절차 및 방법
- 파기 사유가 발생한 개인정보는 지체 없이 복구·재생이 불가능한 방법으로 파기합니다.
- 전자적 파일은 기술적 방법으로 영구 삭제하며, 종이 문서는 분쇄 또는 소각합니다.

9. 이용자의 권리 및 행사 방법
- 이용자는 언제든지 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지, 동의 철회, 회원 탈퇴를 요청할 수 있습니다.
- 권리 행사는 서비스 내 기능 또는 고객문의 채널을 통해 가능하며, 회사는 관계 법령에 따라 지체 없이 조치합니다.
- 법령에 따라 권리 행사가 제한될 수 있는 경우, 그 사유를 안내합니다.

10. 개인정보 보호를 위한 조치
- 비밀번호 암호화 저장
- 접근권한 최소화 및 권한 관리
- 개인정보 처리시스템 접근 통제 및 로그 관리
- 내부 관리계획 수립 및 임직원 보안 교육

11. 동의 거부 권리 및 불이익
- 이용자는 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다.
- 다만, 필수 항목 동의를 거부하는 경우 회원가입 및 핵심 서비스 이용이 제한될 수 있습니다.

12. 고지 의무
- 본 동의 내용이 변경되는 경우 회사는 서비스 내 공지사항 등을 통해 사전에 안내합니다.

부칙
- 본 동의서는 2026년 2월 23일부터 적용됩니다.
`,
  },
};

const EMPTY_ERRORS = {
  email: '',
  emailAuth: '',
  emailCode: '',
  nickname: '',
  password: '',
  passwordConfirm: '',
  agreements: '',
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
  const [isPasswordConfirmFocused, setIsPasswordConfirmFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreements, setAgreements] = useState({
    service: false,
    privacy: false,
  });
  const [activePolicyType, setActivePolicyType] = useState(null); // 'service' | 'privacy' | null
  const [formErrors, setFormErrors] = useState(EMPTY_ERRORS);

  useEffect(() => {
    if (emailCooldownSeconds <= 0) return undefined;

    const timer = setInterval(() => {
      setEmailCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [emailCooldownSeconds]);

  const isPasswordMismatch =
    form.passwordConfirm.trim().length > 0 && form.password !== form.passwordConfirm;
  const showEmailCodeInput = emailCheckStatus === 'available';
  const showEmailMessage = Boolean(emailMessage) && emailCheckStatus !== 'available';
  const showPasswordFeedback = isPasswordConfirmFocused && isPasswordMismatch;
  const isAllAgreementChecked = agreements.service && agreements.privacy;
  const isEmailCheckButtonDisabled =
    isSubmitting || isSendingEmailCode || emailCooldownSeconds > 0;

  const getEmailCheckButtonLabel = () => {
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

  const toggleAgreement = (key) => {
    const next = !agreements[key];
    const nextAgreements = { ...agreements, [key]: next };
    setAgreements(nextAgreements);

    if (nextAgreements.service && nextAgreements.privacy) {
      clearFieldError('agreements');
    }
  };

  const toggleAllAgreements = () => {
    const next = !isAllAgreementChecked;
    setAgreements({ service: next, privacy: next });
    if (next) clearFieldError('agreements');
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
    } else if (!PASSWORD_REGEX.test(form.password)) {
      nextErrors.password = '비밀번호는 영문/숫자/특수문자를 포함한 8~64자여야 합니다.';
    }

    if (!form.passwordConfirm.trim()) {
      nextErrors.passwordConfirm = '비밀번호 확인을 입력해 주세요.';
    } else if (form.password !== form.passwordConfirm) {
      nextErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }

    if (emailCheckStatus !== 'available') {
      nextErrors.emailAuth = '이메일 인증 과정을 먼저 진행해 주세요.';
    } else if (!EMAIL_CODE_REGEX.test(normalizedEmailCode)) {
      nextErrors.emailCode = '인증번호 6자리를 정확히 입력해 주세요.';
    }

    if (!agreements.service || !agreements.privacy) {
      nextErrors.agreements = '필수 약관에 동의해 주세요.';
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

  const activePolicy = activePolicyType ? POLICY_CONTENT[activePolicyType] : null;
  const handleLogoClick = () => navigate('/home');

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
            className="text-3xl font-bold text-indigo-600 mb-2 cursor-pointer hover:text-indigo-700"
            title="Prism"
            aria-label="Prism 로고"
          >
            Prism
          </h1>
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
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                maxLength={254}
                placeholder="example@prism.com"
                className={inputClass(Boolean(formErrors.email))}
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
              <>
                <input
                  type="text"
                  value={form.emailCode}
                  onChange={updateField('emailCode')}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="인증번호 6자리 입력"
                  className={`form-input border-indigo-300 bg-indigo-50 mt-2 ${
                    formErrors.emailCode ? 'border-red-400 focus:ring-red-200 focus:ring-2' : ''
                  }`}
                />
                {formErrors.emailCode && (
                  <p className="text-sm mt-1 text-red-500">{formErrors.emailCode}</p>
                )}
              </>
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

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <input
                type="checkbox"
                checked={isAllAgreementChecked}
                onChange={toggleAllAgreements}
                className="w-4 h-4 accent-indigo-600"
              />
              약관 전체 동의
            </label>

            <div className="h-px bg-gray-200" />

            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={agreements.service}
                  onChange={() => toggleAgreement('service')}
                  className="w-4 h-4 accent-indigo-600"
                />
                [필수] 서비스 이용약관 동의
              </label>
              <button
                type="button"
                onClick={() => setActivePolicyType('service')}
                className="text-xs font-bold text-indigo-600 hover:underline whitespace-nowrap"
              >
                약관보기
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={agreements.privacy}
                  onChange={() => toggleAgreement('privacy')}
                  className="w-4 h-4 accent-indigo-600"
                />
                [필수] 개인정보 수집·이용 동의
              </label>
              <button
                type="button"
                onClick={() => setActivePolicyType('privacy')}
                className="text-xs font-bold text-indigo-600 hover:underline whitespace-nowrap"
              >
                약관보기
              </button>
            </div>

            {formErrors.agreements && (
              <p className="text-sm mt-1 text-red-500">{formErrors.agreements}</p>
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

      {activePolicy && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">{activePolicy.title}</h3>
              <button
                type="button"
                onClick={() => setActivePolicyType(null)}
                className="text-sm font-bold text-gray-500 hover:text-gray-700"
              >
                닫기
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
                {activePolicy.body.trim()}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignupPage;
