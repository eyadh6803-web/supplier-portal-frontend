import React, { useState } from 'react';
import { Check, CheckCircle2, X } from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations';
import { ProcuraApiService } from '../../services/procuraApi';
import {
  Language,
  PurchaseRequest,
  RequestStatus,
  ScreenId,
  SupplierOffer,
  ThemeMode
} from '../../types/procurement';
import { getThemeClasses } from '../../utils/themeClasses';
import { StatusBadge } from '../common/StatusBadge';

interface ApprovalsScreenProps {
  theme: ThemeMode;
  lang: Language;
  requests: PurchaseRequest[];
  offers: SupplierOffer[];
  onUpdateStatus: (requestId: string, nextStatus: RequestStatus, updatedReq?: PurchaseRequest) => void;
  onSelectRequest: (requestId: string) => void;
  onAddAudit: (
    action: string,
    actionAr: string,
    requestId: string,
    details: string,
    detailsAr: string
  ) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
  onNavigate: (screen: ScreenId) => void;
}

export const ApprovalsScreen: React.FC<ApprovalsScreenProps> = ({
  theme,
  lang,
  requests,
  offers,
  onUpdateStatus,
  onSelectRequest,
  onAddAudit,
  onToast,
  onNavigate
}) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const { isDark, bgSurface, bgSubtle, textMuted, divider } = getThemeClasses(theme);

  const pendingReqs = requests.filter((r) => r.status === 'PendingApproval');
  const [confirmTarget, setConfirmTarget] = useState<PurchaseRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PurchaseRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(false);

  const executeApprove = async (req: PurchaseRequest) => {
    if (busy) return;
    setBusy(true);
    try {
      const updated = await ProcuraApiService.updateRequestStatus(req.id, 'Approved');
      onUpdateStatus(req.id, 'Approved', updated || undefined);
      onAddAudit(
        'Approved Request',
        'اعتماد طلب الشراء',
        req.id,
        `Executive approval granted for ${req.id}`,
        `تمت الموافقة التنفيذية على الطلب ${req.id}`
      );
      setConfirmTarget(null);
      onToast(isRtl ? 'تم اعتماد طلب الشراء بنجاح' : `Request ${req.id} approved.`);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Approval request failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const executeReject = async (req: PurchaseRequest) => {
    if (!rejectReason.trim() || busy) return;
    setBusy(true);
    try {
      const updated = await ProcuraApiService.updateRequestStatus(
        req.id,
        'Rejected',
        rejectReason.trim()
      );
      onUpdateStatus(req.id, 'Rejected', updated || undefined);
      onAddAudit(
        'Rejected Request',
        'رفض طلب الشراء',
        req.id,
        `Rejected ${req.id} — Reason: ${rejectReason}`,
        `تم رفض الطلب ${req.id} — السبب: ${rejectReason}`
      );
      setRejectTarget(null);
      setRejectReason('');
      onToast(isRtl ? 'تم رفض الطلب وتسجيل السبب' : `Request ${req.id} rejected.`);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Rejection failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`pb-5 border-b ${divider}`}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.approvalsTitle}</h1>
        <p className={`text-sm mt-1 ${textMuted}`}>{t.approvalsSub}</p>
      </div>

      {pendingReqs.length === 0 ? (
        <div className={`p-14 rounded-xl border text-center ${bgSurface}`}>
          <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto mb-3" />
          <p className="font-semibold text-sm">{t.noPendingApprovals}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingReqs.map((req) => {
            const reqOffers = offers.filter((o) => o.requestId === req.id);
            const bestOffer = reqOffers.length
              ? [...reqOffers].sort((a, b) => a.totalPrice - b.totalPrice)[0]
              : null;

            return (
              <div key={req.id} className={`rounded-xl border overflow-hidden ${bgSurface}`}>
                <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      <span className="font-mono-code font-bold text-[#E32236]">{req.id}</span>
                      <StatusBadge status={req.status} lang={lang} />
                      <span className={`font-mono-code tabular-nums ${textMuted}`}>
                        {t.submissionDate}: {req.createdDate}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold">{isRtl ? req.titleAr : req.title}</h2>
                    <p className={`text-xs leading-relaxed ${textMuted}`}>
                      {isRtl ? req.descriptionAr : req.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectRequest(req.id);
                        onNavigate(4);
                      }}
                      className={`px-3.5 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${bgSubtle} hover:border-[#E32236]/50`}
                    >
                      {t.viewDetails}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmTarget(req)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{t.approve}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectTarget(req)}
                      className="px-4 py-2 rounded-lg bg-[#E32236] hover:bg-[#C81B2D] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{t.reject}</span>
                    </button>
                  </div>
                </div>

                {/* Hairline Metrics Strip */}
                <div
                  className={`border-t ${divider} grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x ${
                    isDark ? 'divide-white/[0.06]' : 'divide-slate-900/[0.06]'
                  } ${bgSubtle}`}
                >
                  <div className="px-6 py-3.5">
                    <div className={`text-xs font-medium ${textMuted}`}>{t.estBudget}</div>
                    <div className="font-mono-code tabular-nums font-bold text-sm mt-0.5">
                      ${req.estimatedBudget.toLocaleString()}
                    </div>
                  </div>
                  <div className="px-6 py-3.5">
                    <div className={`text-xs font-medium ${textMuted}`}>{t.recommendedOffer}</div>
                    <div className="font-semibold text-sm text-emerald-500 mt-0.5">
                      {bestOffer ? bestOffer.supplierName : '—'}
                    </div>
                  </div>
                  <div className="px-6 py-3.5">
                    <div className={`text-xs font-medium ${textMuted}`}>{t.recommendedPrice}</div>
                    <div className="font-mono-code tabular-nums font-bold text-sm text-[#E32236] mt-0.5">
                      {bestOffer ? `$${bestOffer.totalPrice.toLocaleString()}` : '—'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-4 ${bgSurface}`}>
            <h3 className="text-lg font-bold">{t.confirmApprovalTitle}</h3>
            <p className={`text-sm ${textMuted}`}>{t.confirmApprovalMsg}</p>
            <div className={`p-3 rounded-lg border text-xs font-mono-code ${bgSubtle}`}>
              {confirmTarget.id} · {isRtl ? confirmTarget.titleAr : confirmTarget.title}
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                className={`px-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${bgSubtle}`}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => executeApprove(confirmTarget)}
                className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {t.approve}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-4 ${bgSurface}`}>
            <h3 className="text-lg font-bold text-[#E32236]">{t.rejectModalTitle}</h3>
            <div>
              <label className="block text-xs font-semibold mb-1.5">{t.rejectReasonLabel} *</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t.rejectReasonPlaceholder}
                className={`w-full px-3.5 py-2 rounded-lg border text-sm outline-none focus:border-[#E32236] ${bgSubtle}`}
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason('');
                }}
                className={`px-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${bgSubtle}`}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim() || busy}
                onClick={() => executeReject(rejectTarget)}
                className="px-5 py-2 rounded-lg bg-[#E32236] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {t.reject}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
