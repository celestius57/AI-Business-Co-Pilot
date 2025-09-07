
import React from 'react';

interface MoraleIndicatorProps {
  morale: number;
}

export const MoraleIndicator: React.FC<MoraleIndicatorProps> = ({ morale }) => {
  const getMoraleColor = () => {
    if (morale > 70) return 'bg-green-500';
    if (morale > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const colorClass = getMoraleColor();

  return (
    <div title={`Morale: ${morale}/100`} className="w-full bg-slate-700 rounded-full h-1.5">
      <div
        className={`${colorClass} h-1.5 rounded-full transition-all duration-500`}
        style={{ width: `${morale}%` }}
      ></div>
    </div>
  );
};
