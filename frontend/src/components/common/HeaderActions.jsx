// src/components/common/HeaderActions.jsx
import React from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeaderActions = ({ 
  showNotificationText = false,
  notificationText = "Cont...",
  profileLink = "/mypage"
}) => {
  return (
    <div className="flex items-center gap-4">
      {showNotificationText && (
        <span className="text-gray-400 text-sm">{notificationText}</span>
      )}
      
      <button className="relative">
        <Bell className="w-5 h-5 text-red-500 cursor-pointer" />
        {/* 알림 뱃지 */}
        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
      </button>
      
      <Link to={profileLink}>
        <div className="w-8 h-8 rounded-full bg-gray-300 hover:ring-2 hover:ring-blue-500 transition cursor-pointer"></div>
      </Link>
    </div>
  );
};

export default HeaderActions;