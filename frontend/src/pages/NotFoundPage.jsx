import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <section className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 text-center">
        <p className="text-indigo-600 text-sm font-semibold tracking-wide">ERROR 404</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mt-4 text-gray-600 leading-relaxed">
          요청하신 경로가 잘못되었거나 이동되었습니다.
          <br />
          아래 버튼을 통해 홈으로 이동하거나 이전 페이지로 돌아가세요.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/home"
            className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
          >
            홈으로 이동
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
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
