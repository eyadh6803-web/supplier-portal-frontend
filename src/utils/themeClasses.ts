import { ThemeMode } from '../types/procurement';

export interface ThemeClasses {
  isDark: boolean;
  bgMain: string;
  bgSurface: string;
  bgSubtle: string;
  textMuted: string;
  divider: string;
}

export function getThemeClasses(theme: ThemeMode): ThemeClasses {
  const isDark = theme === 'dark';
  return {
    isDark,
    bgMain: isDark ? 'bg-[#0A0C10] text-[#F1F3F7]' : 'bg-[#F6F7F9] text-[#111827]',
    bgSurface: isDark
      ? 'bg-[#11141B] border-white/[0.08]'
      : 'bg-[#FFFFFF] border-slate-900/[0.08]',
    bgSubtle: isDark
      ? 'bg-[#171B24] border-white/[0.07]'
      : 'bg-[#F2F4F7] border-slate-900/[0.07]',
    textMuted: isDark ? 'text-[#8E96A4]' : 'text-[#5A6270]',
    divider: isDark ? 'border-white/[0.08]' : 'border-slate-900/[0.08]'
  };
}
