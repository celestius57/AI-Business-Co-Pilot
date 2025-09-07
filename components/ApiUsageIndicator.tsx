import React from 'react';

interface ApiUsageIndicatorProps {
  currentUsage: number;
  limit: number;
}

export const ApiUsageIndicator: React.FC<ApiUsageIndicatorProps> = ({ currentUsage, limit }) => {
  const requestsLeft = Math.max(0, limit - currentUsage);
  const percentageLeft = limit > 0 ? (requestsLeft / limit) * 100 : 0;
  
  const getColor = () => {
    if (percentageLeft <= 10) return 'bg-red-500';
    if (percentageLeft <= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="font-medium text-slate-400">Requests Left Today</span>
        <span className="font-bold text-white">{requestsLeft} / {limit}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div 
          className={`${getColor()} h-1.5 rounded-full transition-all duration-500`}
          style={{ width: `${percentageLeft}%` }}
        ></div>
      </div>
    </div>
  );
};
