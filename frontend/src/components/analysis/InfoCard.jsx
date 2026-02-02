import React from 'react';

const InfoCard = ({ title, value, icon }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4">
      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-bold">{title}</p>
        <p className="text-lg font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};
export default InfoCard;