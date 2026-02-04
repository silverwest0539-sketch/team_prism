// src/components/common/SearchBar.jsx
import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ 
  placeholder = "검색어를 입력하세요...",
  value = "",
  onChange,
  onKeyDown,
  className = "w-full py-3 pl-12 pr-4 rounded-full border border-gray-200 focus:outline-none focus:border-blue-500 shadow-sm text-sm"
}) => {
  return (
    <div className="relative w-full max-w-xl mx-auto">
      <input
        type="text"
        placeholder={placeholder}
        className={className}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
      <Search className="absolute left-4 top-3 text-gray-400 w-5 h-5" />
    </div>
  );
};

export default SearchBar;