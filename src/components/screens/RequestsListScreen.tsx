import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Search
} from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  Language,
  PurchaseRequest,
  RequestStatus,
  ScreenId,
  ThemeMode,
  User
} from '../../types/procurement';
import { getThemeClasses } from '../../utils/themeClasses';
import { StatusBadge } from '../common/StatusBadge';

interface RequestsListScreenProps {
  theme: ThemeMode;
  lang: Language;
  currentUser: User;
  requests: PurchaseRequest[];
  isLoadingData: boolean;
  loadError: string | null;
  onRetryLoad: () => void;
  onSelectRequest: (requestId: string) => void;
  onNavigate: (screen: ScreenId) => void;
}

const QUICK_FILTERS: Array<'ALL' | RequestStatus> = [
  'ALL',
  'Submitted',
  'Compared',
  'PendingApproval',
  'Approved',
  'Draft'
];

export const RequestsListScreen: React.FC<RequestsListScreenProps> = ({
  theme,
  lang,
  currentUser,
  requests,
  isLoadingData,
  loadError,
  onRetryLoad,
  onSelectRequest,
  onNavigate
}) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const { isDark, bgSurface, bgSubtle, textMuted, divider } = getThemeClasses(theme);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | RequestStatus>('ALL');

  const roleScopedRequests = useMemo(() => {
    if (currentUser.role === 'requester') {
      return requests.filter((r) => r.requesterId === currentUser.id);
    }
    return requests;
  }, [requests, currentUser]);

  const kpis = useMemo(() => {
    const total = roleScopedRequests.length;
    const pipeline = roleScopedRequests
      .filter((r) => r.status !== 'Rejected')
      .reduce((acc, r) => acc + (r.estimatedBudget || 0), 0);
    const pending = roleScopedRequests.filter((r) => r.status === 'PendingApproval').length;
    const approvedSpend = roleScopedRequests
      .filter((r) => r.status === 'Approved')
      .reduce((acc, r) => acc + (r.estimatedBudget || 0), 0);
    return { total, pipeline, pending, approvedSpend };
  }, [roleScopedRequests]);

  const visibleRequests = useMemo(() => {
    let list = roleScopedRequests;
    if (statusFilter !== 'ALL') {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.titleAr.includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.requesterName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [roleScopedRequests, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b ${divider}`}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.requestsTitle}</h1>
          <p className={`text-sm mt-1 ${textMuted}`}>{t.requestsSubtitle}</p>
        </div>

        {currentUser.role === 'requester' && (
          <button
            type="button"
            onClick={() => onNavigate(3)}
            className="px-4 py-2.5 rounded-lg bg-[#E32236] hover:bg-[#C81B2D] text-white text-xs font-semibold flex items-center gap-2 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newRequest}</span>
          </button>
        )}
      </div>

      {/* Unified 4-Metric Executive Strip */}
      <div
        className={`rounded-xl border grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 sm:divide-x ${
          isDark ? 'divide-white/[0.08]' : 'divide-slate-900/[0.08]'
        } ${bgSurface}`}
      >
        <div className="p-4 sm:p-5">
          <div className={`text-xs font-medium ${textMuted}`}>{t.kpiTotalReqs}</div>
          <div className="text-2xl font-bold font-mono-code tabular-nums mt-1">{kpis.total}</div>
        </div>
        <div className="p-4 sm:p-5">
          <div className={`text-xs font-medium ${textMuted}`}>{t.kpiPipelineValue}</div>
          <div className="text-2xl font-bold font-mono-code tabular-nums mt-1">
            ${kpis.pipeline.toLocaleString()}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className={`text-xs font-medium ${textMuted}`}>{t.kpiPendingApproval}</div>
          <div className="text-2xl font-bold font-mono-code tabular-nums text-amber-500 mt-1">
            {kpis.pending}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className={`text-xs font-medium ${textMuted}`}>{t.kpiApprovedSpend}</div>
          <div className="text-2xl font-bold font-mono-code tabular-nums text-emerald-500 mt-1">
            ${kpis.approvedSpend.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search & Segmented Status Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className={`inline-flex flex-wrap items-center gap-1 p-1 rounded-lg border ${bgSubtle}`}>
          {QUICK_FILTERS.map((st) => {
            const active = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? `${bgSurface} shadow-xs font-semibold`
                    : `${textMuted} hover:text-current`
                }`}
              >
                {st === 'ALL' ? t.allStatuses : t[`status_${st}` as keyof typeof t]}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-80 shrink-0">
          <Search
            className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 ${
              isRtl ? 'right-3.5' : 'left-3.5'
            } ${textMuted}`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full ${
              isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'
            } py-2 rounded-lg border text-sm outline-none transition focus:border-[#E32236] ${bgSurface}`}
          />
        </div>
      </div>

      {/* Table / States */}
      {isLoadingData ? (
        <div className={`rounded-xl border divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-900/[0.06]'} ${bgSurface}`}>
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="p-4 flex items-center justify-between gap-4 animate-pulse">
              <div className="space-y-2 flex-1">
                <div className={`h-4 w-64 rounded ${bgSubtle}`} />
                <div className={`h-3 w-40 rounded ${bgSubtle}`} />
              </div>
              <div className={`h-6 w-24 rounded ${bgSubtle}`} />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className={`rounded-xl border p-12 text-center ${bgSurface}`}>
          <AlertTriangle className="w-8 h-8 text-[#E32236] mx-auto mb-3" />
          <p className="text-sm font-semibold mb-4">{loadError || t.errorLoading}</p>
          <button
            type="button"
            onClick={onRetryLoad}
            className="px-4 py-2 rounded-lg bg-[#E32236] hover:bg-[#C81B2D] text-white text-xs font-semibold cursor-pointer"
          >
            {t.retry}
          </button>
        </div>
      ) : visibleRequests.length === 0 ? (
        <div className={`rounded-xl border p-14 text-center ${bgSurface}`}>
          <FileText className={`w-9 h-9 mx-auto mb-3 ${textMuted}`} />
          <p className="text-sm font-semibold">{t.noRequests}</p>
          {currentUser.role === 'requester' && (
            <button
              type="button"
              onClick={() => onNavigate(3)}
              className="mt-4 px-4 py-2 rounded-lg bg-[#E32236] hover:bg-[#C81B2D] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.newRequest}</span>
            </button>
          )}
        </div>
      ) : (
        <div className={`rounded-xl border overflow-hidden ${bgSurface}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className={`border-b ${divider} text-xs font-semibold ${bgSubtle} ${textMuted}`}>
                  <th className="py-3 px-5 text-start">{t.reqTitle}</th>
                  <th className="py-3 px-4 text-end">{t.quantity}</th>
                  <th className="py-3 px-4 text-end">{t.estBudget}</th>
                  <th className="py-3 px-4 text-start">{t.status}</th>
                  <th className="py-3 px-4 text-end">{t.createdDate}</th>
                  <th className="py-3 px-4 text-end w-10"></th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDark ? 'divide-white/[0.06]' : 'divide-slate-900/[0.06]'
                } text-sm`}
              >
                {visibleRequests.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => {
                      onSelectRequest(req.id);
                      onNavigate(4);
                    }}
                    className="cursor-pointer transition-colors hover:bg-[#E32236]/[0.04] group"
                  >
                    <td className="py-3.5 px-5">
                      <div className="font-semibold group-hover:text-[#E32236] transition-colors">
                        {isRtl ? req.titleAr : req.title}
                      </div>
                      <div className={`text-xs mt-0.5 flex items-center gap-1.5 ${textMuted}`}>
                        <span className="font-mono-code font-medium text-[#E32236]">{req.id}</span>
                        <span aria-hidden="true">·</span>
                        <span>{isRtl ? req.requesterNameAr : req.requesterName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-end font-mono-code tabular-nums font-medium whitespace-nowrap">
                      {req.quantity}{' '}
                      <span className={`text-xs font-normal ${textMuted}`}>{t.units}</span>
                    </td>
                    <td className="py-3.5 px-4 text-end font-mono-code tabular-nums font-semibold whitespace-nowrap">
                      ${req.estimatedBudget.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={req.status} lang={lang} />
                    </td>
                    <td className={`py-3.5 px-4 text-end font-mono-code tabular-nums text-xs whitespace-nowrap ${textMuted}`}>
                      {req.createdDate}
                    </td>
                    <td className="py-3.5 px-4 text-end">
                      {isRtl ? (
                        <ChevronLeft className={`w-4 h-4 inline ${textMuted} group-hover:text-[#E32236]`} />
                      ) : (
                        <ChevronRight className={`w-4 h-4 inline ${textMuted} group-hover:text-[#E32236]`} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
