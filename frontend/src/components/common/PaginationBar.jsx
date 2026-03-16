import React, { useMemo } from 'react';
import { DOTS, getPaginationItems } from '../../utils/analysisPagination';

const PaginationBar = ({
  currentPage = 1,
  totalPages = 1,
  pageStartIndex = 0,
  itemsPerPage = 0,
  totalItems = 0,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const paginationItems = useMemo(
    () => getPaginationItems(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const safeStart = totalItems > 0 ? pageStartIndex + 1 : 0;
  const safeEnd = totalItems > 0 ? Math.min(pageStartIndex + itemsPerPage, totalItems) : 0;
  const handleChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange?.(page);
  };

  return (
    <div className={`mt-6 ${className}`}>
      <div className="mx-auto w-fit flex flex-col items-center gap-3">
        <p className="min-w-[96px] text-center text-xs text-gray-500 tabular-nums whitespace-nowrap">
          {`${safeStart}-${safeEnd} / ${totalItems}`}
        </p>

        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => handleChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-12 px-2 py-1.5 rounded-md text-xs font-semibold text-gray-500 border border-gray-200 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500"
            aria-label="이전 페이지"
          >
            이전
          </button>

          {paginationItems.map((page, index) => (
            page === DOTS ? (
              <span key={`${page}-${index}`} className="px-1 text-gray-400 text-xs">
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => handleChange(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  currentPage === page
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-indigo-600'
                }`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            )
          ))}

          <button
            type="button"
            onClick={() => handleChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-12 px-2 py-1.5 rounded-md text-xs font-semibold text-gray-500 border border-gray-200 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500"
            aria-label="다음 페이지"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaginationBar;
