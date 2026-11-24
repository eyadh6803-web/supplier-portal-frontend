import React from 'react';
import { ThemeMode } from '../../types/procurement';

interface ProcuraLogoProps {
  theme: ThemeMode;
  size?: 'sm' | 'md' | 'lg';
}

export const ProcuraLogo: React.FC<ProcuraLogoProps> = ({ theme, size = 'md' }) => {
  const isDark = theme === 'dark';
  const dim = size === 'sm' ? 24 : size === 'lg' ? 32 : 28;

  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width={dim} height={dim} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M6 6H24C30.6274 6 36 11.3726 36 18C36 24.6274 30.6274 30 24 30H15V36H6V6Z"
          fill="#E32236"
        />
        <path
          d="M15 14H23.5C25.7091 14 27.5 15.7909 27.5 18C27.5 20.2091 25.7091 22 23.5 22H15V14Z"
          fill={isDark ? '#0A0C10' : '#FFFFFF'}
        />
        <path d="M6 24L15 30V36H6V24Z" fill="#9E1422" />
      </svg>
      <span
        className={`font-extrabold tracking-[0.16em] leading-none whitespace-nowrap shrink-0 ${
          size === 'lg' ? 'text-xl' : 'text-base'
        } ${isDark ? 'text-[#F1F3F7]' : 'text-[#111827]'}`}
      >
        PROCURA
      </span>
    </div>
  );
};
