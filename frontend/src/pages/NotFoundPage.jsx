import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const TITLE = '404';
const HEADING = '페이지를 찾을 수 없습니다';
const DESCRIPTION =
  '요청하신 주소가 잘못되었거나 이동 또는 삭제된 페이지입니다.';
const HOME_LABEL = '홈으로 이동';
const BACK_LABEL = '이전 페이지';

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
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm">
        <p className="text-5xl font-bold text-gray-900">{TITLE}</p>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">{HEADING}</h1>
        <p className="mt-3 text-sm leading-6 text-gray-500">{DESCRIPTION}</p>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/home"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            {HOME_LABEL}
          </Link>
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            {BACK_LABEL}
          </button>
        </div>
      </section>
    </div>
  );
};

export default NotFoundPage;
