import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';

const FindPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleFindPassword = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/find-password', { email });
      showToast(response.data.message || '임시 비밀번호를 발송했습니다.', { type: 'success' });
      navigate('/login');
    } catch (error) {
      showToast(error.response?.data?.message || '비밀번호 찾기에 실패했습니다.', { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="block mx-auto mb-6 text-3xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          aria-label="홈으로 이동"
        >
          Prism
        </button>

        <div className="card-soft w-full shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6">비밀번호 찾기</h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            가입하신 이메일을 입력하시면 임시 비밀번호를 보내드립니다.
          </p>

          <form onSubmit={handleFindPassword} className="space-y-4">
            <input
              type="email"
              className="form-input"
              placeholder="example@prism.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" disabled={isSubmitting} className="btn-auth-primary">
              {isSubmitting ? '발송 중..' : '임시 비밀번호 발송'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FindPasswordPage;
