import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/apiClient';

const SearchBar = ({ placeholder, value, onChange, onKeyDown, containerClassName = '' }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 입력값이 바뀔 때마다 자동완성 API 호출 (디바운싱 적용)
  useEffect(() => {
    if (!value || value.trim() === '') {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }

    // API 과호출을 막기 위해 0.2초 딜레이 적용
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await apiClient.get('/trends/autocomplete', {
          params: { q: value.trim() }
        });
        setSuggestions(response.data || []);
        setIsDropdownOpen((response.data || []).length > 0);
      } catch (error) {
        console.error("자동완성 로딩 실패:", error);
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [value]);

  // 추천 검색어 클릭 시 즉시 분석 페이지로 이동
  const handleSuggestionClick = (keyword) => {
    setIsDropdownOpen(false);
    
    // 부모 컴포넌트의 검색어 상태 업데이트 (선택사항)
    if (onChange) {
      onChange({ target: { value: keyword } });
    }
    
    navigate(`/analysis?keyword=${encodeURIComponent(keyword)}`);
  };

  return (
    <div className={`relative ${containerClassName}`} ref={dropdownRef}>
      <div className="relative flex items-center w-full">
        <MagnifyingGlass
          size={20}
          weight="bold"
          className="absolute left-4 text-gray-400"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            if (onChange) onChange(e);
            setIsDropdownOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder || '분석하고 싶은 키워드 검색 (예: 봄동)'}
          className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white border border-gray-200 rounded-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
        />
      </div>

      {/* 자동완성 드롭다운 */}
      {isDropdownOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden animate-fade-in">
          {suggestions.map((item, idx) => (
            <li
              key={idx}
              onClick={() => handleSuggestionClick(item)}
              className="px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors flex items-center gap-2 border-b border-gray-50 last:border-none"
            >
              <MagnifyingGlass size={14} className="text-gray-400" />
              {/* 입력한 검색어 부분만 굵고 파랗게 강조 */}
              <span>
                {item.split(new RegExp(`(${value})`, 'gi')).map((part, i) =>
                  part.toLowerCase() === value.toLowerCase() ? (
                    <span key={i} className="font-bold text-indigo-600">{part}</span>
                  ) : (
                    part
                  )
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;