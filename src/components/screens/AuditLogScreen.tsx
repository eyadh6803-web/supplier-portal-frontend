import React, { useMemo, useState } from 'react';
import { TRANSLATIONS } from '../../i18n/translations';
import { AuditLogEntry, Language, ThemeMode } from '../../types/procurement';
import { getThemeClasses } from '../../utils/themeClasses';

interface AuditLogScreenProps {
  theme: ThemeMode;
  lang: Language;
  auditLog: AuditLogEntry[];
}

export const AuditLogScreen: React.FC<AuditLogScreenProps> = ({ theme, lang, auditLog }) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const { isDark, bgSurface, bgSubtle, textMuted, divider } = getThemeClasses(theme);

  const [userFilter, setUserFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [reqFilter, setReqFilter] = useState('ALL');

  const uniqueUsers = useMemo(() => [...new Set(auditLog.map((a) => a.user))], [auditLog]);
  const uniqueActions = useMemo(() => [...new Set(auditLog.map((a) => a.action))], [auditLog]);
  const uniqueReqs = useMemo(() => [...new Set(auditLog.map((a) => a.requestId))], [auditLog]);

  const filteredLogs = useMemo(() => {
    return auditLog.filter((item) => {
      if (userFilter !== 'ALL' && item.user !== userFilter) return false;
      if (actionFilter !== 'ALL' && item.action !== actionFilter) return false;
      if (reqFilter !== 'ALL' && item.requestId !== reqFilter) return false;
      return true;
    });
  }, [auditLog, userFilter, actionFilter, reqFilter]);

  return (
    <div className="space-y-6">
      <div className={`pb-5 border-b ${divider}`}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.auditLogTitle}</h1>
        <p className={`text-sm mt-1 ${textMuted}`}>{t.auditLogSub}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className={`px-3.5 py-2.5 rounded-lg border text-xs font-semibold outline-none focus:border-[#E32236] ${bgSurface}`}
        >
          <option value="ALL">{t.allUsers}</option>
          {uniqueUsers.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className={`px-3.5 py-2.5 rounded-lg border text-xs font-semibold outline-none focus:border-[#E32236] ${bgSurface}`}
        >
          <option value="ALL">{t.allActions}</option>
          {uniqueActions.map((ac) => (
            <option key={ac} value={ac}>
              {ac}
            </option>
          ))}
        </select>

        <select
          value={reqFilter}
          onChange={(e) => setReqFilter(e.target.value)}
          className={`px-3.5 py-2.5 rounded-lg border text-xs font-semibold outline-none focus:border-[#E32236] ${bgSurface}`}
        >
          <option value="ALL">{t.allRequestsFilter}</option>
          {uniqueReqs.map((rq) => (
            <option key={rq} value={rq}>
              {rq}
            </option>
          ))}
        </select>
      </div>

      <div className={`rounded-xl border overflow-hidden ${bgSurface}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className={`border-b ${divider} text-xs font-semibold ${bgSubtle} ${textMuted}`}>
                <th className="py-3 px-5 text-start">{t.timestamp}</th>
                <th className="py-3 px-4 text-start">{t.userCol}</th>
                <th className="py-3 px-4 text-start">{t.actionCol}</th>
                <th className="py-3 px-4 text-start">{t.reqId}</th>
                <th className="py-3 px-4 text-start">{t.detailsCol}</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDark ? 'divide-white/[0.06]' : 'divide-slate-900/[0.06]'
              } text-xs`}
            >
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-black/[0.015] dark:hover:bg-white/[0.015]">
                  <td className="py-3.5 px-5 font-mono-code tabular-nums text-[#E32236] font-semibold whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-semibold whitespace-nowrap">
                    {isRtl ? log.userAr : log.user}
                  </td>
                  <td className="py-3.5 px-4 font-medium whitespace-nowrap">
                    {isRtl ? log.actionAr : log.action}
                  </td>
                  <td className="py-3.5 px-4 font-mono-code font-bold whitespace-nowrap">
                    {log.requestId}
                  </td>
                  <td className={`py-3.5 px-4 ${textMuted}`}>
                    {isRtl ? log.detailsAr : log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
