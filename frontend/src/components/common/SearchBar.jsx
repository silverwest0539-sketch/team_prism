import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/apiClient';

const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SearchBar = ({ placeholder, value, onChange, onKeyDown, containerClassName = '' }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // 키보드로 선택된 항목의 인덱스
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null); // [추가] 입력창 포커스 제어를 위한 ref
  const navigate = useNavigate();
  const normalizedValue = String(value || '');
  const escapedValue = escapeRegExp(normalizedValue);
  const highlightPattern = escapedValue ? new RegExp(`(${escapedValue})`, 'gi') : null;
  const lowerValue = normalizedValue.toLowerCase();

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

  // 입력값이 바뀔 때마다 자동완성 API 호출
  useEffect(() => {
    if (!value || value.trim() === '') {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }

    setSelectedIndex(-1);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await apiClient.get('/trends/autocomplete', {
          params: { q: value.trim() }
        });
        const data = response.data || [];
        setSuggestions(data);
        setIsDropdownOpen(data.length > 0);
      } catch (error) {
        console.error("자동완성 로딩 실패:", error);
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [value]);

  // 추천 검색어 클릭 (또는 엔터 선택) 시 이동
  const handleSuggestionClick = (keyword) => {
    // 1. 드롭다운 닫기 및 인덱스 초기화
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    
    // 2. 페이지 이동
    navigate(`/analysis/${encodeURIComponent(keyword)}`);

    // [핵심 수정] 3. 부모 컴포넌트의 검색어 상태를 '빈 문자열'로 업데이트
    // 기존: onChange({ target: { value: keyword } });  <-- 박제됨
    // 변경: onChange({ target: { value: '' } });       <-- 비워짐
    if (onChange) {
      onChange({ target: { value: '' } });
    }

    // [추가] 4. 입력창 포커스 해제 (커서 깜빡임 제거)
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return;

    if (isDropdownOpen && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        return;
      }

      if (e.key === 'Enter') {
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
          return;
        }
      }

      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        return;
      }
    }

    if (onKeyDown) {
      onKeyDown(e);
    }
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
          ref={inputRef} // [추가] ref 연결
          type="text"
          value={value}
          onChange={(e) => {
            if (onChange) onChange(e);
            setIsDropdownOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || '분석하고 싶은 키워드 검색 (예: 봄동)'}
          className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white border border-gray-200 rounded-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
        />
      </div>

      {/* 자동완성 드롭다운 */}
      {isDropdownOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden animate-fade-in">
          {suggestions.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <li
                key={idx}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => handleSuggestionClick(item)}
                className={`px-4 py-3 text-sm cursor-pointer transition-colors flex items-center gap-2 border-b border-gray-50 last:border-none ${
                  isSelected 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                <MagnifyingGlass size={14} className={isSelected ? "text-indigo-500" : "text-gray-400"} />
                <span>
                  {(highlightPattern ? String(item || '').split(highlightPattern) : [String(item || '')]).map((part, i) =>
                    lowerValue && part.toLowerCase() === lowerValue ? (
                      <span key={i} className="font-bold text-indigo-600">{part}</span>
                    ) : (
                      part
                    )
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
