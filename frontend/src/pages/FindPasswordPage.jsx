import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FindPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleFindPassword = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 백엔드에 임시 비밀번호 발송 요청
      const response = await axios.post('http://localhost:5000/api/auth/find-password', { email });
      alert(response.data.message);
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.message || '비밀번호 찾기 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card-soft w-full max-w-md shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">비밀번호 찾기</h2>
        <p className="text-sm text-gray-600 mb-6 text-center">가입하신 이메일을 입력하시면 임시 비밀번호를 보내드립니다.</p>
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
            {isSubmitting ? '발송 중...' : '임시 비밀번호 발송'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FindPasswordPage;