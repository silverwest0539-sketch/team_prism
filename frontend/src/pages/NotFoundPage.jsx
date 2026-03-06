import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <section className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 text-center shadow-sm">
        <div className="overflow-hidden rounded-2xl bg-gray-50 p-3">
          <img
            src="/pickey_404.png"
            alt="PicKey 404 illustration"
            className="w-full rounded-xl object-cover"
          />
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/home"
            className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
          >
            홈으로 이동
          </Link>
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
          >
            이전 페이지
          </button>
        </div>
      </section>
    </div>
  );
};

export default NotFoundPage;
