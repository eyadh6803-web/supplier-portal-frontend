import React from 'react';
import { TRANSLATIONS } from '../../i18n/translations';
import { Language, RequestStatus } from '../../types/procurement';

interface StatusBadgeProps {
  status: RequestStatus;
  lang: Language;
}

const STATUS_STYLES: Record<RequestStatus, { text: string; dot: string; bg: string }> = {
  Draft: {
    text: 'text-slate-500 dark:text-slate-400',
    dot: 'bg-slate-400',
    bg: 'bg-slate-500/[0.08]'
  },
  Submitted: {
    text: 'text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-500',
    bg: 'bg-sky-500/[0.1]'
  },
  OffersReceived: {
    text: 'text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-500',
    bg: 'bg-indigo-500/[0.1]'
  },
  Compared: {
    text: 'text-violet-600 dark:text-violet-400',
    dot: 'bg-violet-500',
    bg: 'bg-violet-500/[0.1]'
  },
  PendingApproval: {
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    bg: 'bg-amber-500/[0.1]'
  },
  Approved: {
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-500/[0.1]'
  },
  Rejected: {
    text: 'text-[#E32236]',
    dot: 'bg-[#E32236]',
    bg: 'bg-[#E32236]/[0.1]'
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, lang }) => {
  const t = TRANSLATIONS[lang];
  const labelKey = `status_${status}` as keyof typeof t;
  const style = STATUS_STYLES[status] || STATUS_STYLES.Draft;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-sm ${style.dot}`} aria-hidden="true" />
      <span>{t[labelKey] || status}</span>
    </span>
  );
};
