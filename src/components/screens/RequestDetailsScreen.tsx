import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Layers,
  Send,
  Sparkles,
  Trash2,
  Users,
  XCircle
} from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations';
import { ProcuraApiService } from '../../services/procuraApi';
import {
  AuditLogEntry,
  Language,
  PurchaseRequest,
  RequestStatus,
  ScreenId,
  SupplierOffer,
  ThemeMode,
  User
} from '../../types/procurement';
import { getThemeClasses } from '../../utils/themeClasses';
import { StatusBadge } from '../common/StatusBadge';
import { SupplierComparisonView } from './SupplierComparisonView';

interface RequestDetailsScreenProps {
  theme: ThemeMode;
  lang: Language;
  currentUser: User;
  request: PurchaseRequest;
  offers: SupplierOffer[];
  auditLog: AuditLogEntry[];
  onUpdateStatus: (requestId: string, nextStatus: RequestStatus, updatedReq?: PurchaseRequest) => void;
  onDeleteRequest: (requestId: string) => void;
  onSelectOffer: (offerId: string) => void;
  onOpenInviteModal: () => void;
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

const STAGE_META: Record<
  RequestStatus,
  { ownerEn: string; ownerAr: string; noteEn: string; noteAr: string }
> = {
  Draft: {
    ownerEn: 'Requester',
    ownerAr: 'مقدّم الطلب',
    noteEn: 'Specifications drafted internally prior to formal sourcing submission.',
    noteAr: 'إعداد المواصفات والميزانية التقديرية قبل الإرسال لقسم المشتريات.'
  },
  Submitted: {
    ownerEn: 'Procurement Officer',
    ownerAr: 'مسؤول المشتريات',
    noteEn: 'Validated requisition queued for vendor RFQ invitation.',
    noteAr: 'طلب معتمد وجاهز لدعوة الموردين المؤهلين لتقديم العروض.'
  },
  OffersReceived: {
    ownerEn: 'Invited Vendors',
    ownerAr: 'الموردون المدعوون',
    noteEn: 'Supplier PDF quotations uploaded and parsed for commercial verification.',
    noteAr: 'استلام عروض الأسعار بصيغة PDF وتجهيزها للمراجعة الذكية.'
  },
  Compared: {
    ownerEn: 'Procurement Officer',
    ownerAr: 'مسؤول المشتريات',
    noteEn: 'Verified vendor bids benchmarked across cost, lead time, and warranty.',
    noteAr: 'اعتماد مراجعة العروض وإجراء المقارنة التجارية الشاملة.'
  },
  PendingApproval: {
    ownerEn: 'Executive Approver',
    ownerAr: 'المدير المعتمد',
    noteEn: 'Recommended award routed for final capital authorization.',
    noteAr: 'رفع التوصية والترسية للموافقة التنفيذية واعتماد الميزانية.'
  },
  Approved: {
    ownerEn: 'Executive Governance',
    ownerAr: 'الإدارة التنفيذية',
    noteEn: 'Capital commitment formally approved and recorded in audit ledger.',
    noteAr: 'تمت الموافقة النهائية على الطلب وتوثيق قرار الترسية.'
  },
  Rejected: {
    ownerEn: 'Executive Governance',
    ownerAr: 'الإدارة التنفيذية',
    noteEn: 'Requisition declined with mandatory audit justification.',
    noteAr: 'تم رفض الطلب مع توثيق السبب في سجل التدقيق.'
  }
};

export const RequestDetailsScreen: React.FC<RequestDetailsScreenProps> = ({
  theme,
  lang,
  currentUser,
  request,
  offers,
  auditLog,
  onUpdateStatus,
  onDeleteRequest,
  onSelectOffer,
  onOpenInviteModal,
  onAddAudit,
  onToast,
  onNavigate
}) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const { isDark, bgSurface, bgSubtle, textMuted, divider } = getThemeClasses(theme);

  const reqOffers = offers.filter((o) => o.requestId === request.id);
  const reqAudit = auditLog.filter((a) => a.requestId === request.id).slice(0, 10);

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [busy, setBusy] = useState(false);

  const stages: RequestStatus[] = [
    'Draft',
    'Submitted',
    'OffersReceived',
    'Compared',
    'PendingApproval',
    request.status === 'Rejected' ? 'Rejected' : 'Approved'
  ];
  const currentStageIdx = Math.max(0, stages.indexOf(request.status));
  const [selectedStageIdx, setSelectedStageIdx] = useState(currentStageIdx);

  useEffect(() => {
    setSelectedStageIdx(currentStageIdx);
  }, [currentStageIdx, request.id]);

  const handleStatusChange = async (
    nextStatus: RequestStatus,
    logAction: string,
    logActionAr: string,
    logDetails: string,
    logDetailsAr: string,
    reason = ''
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      const updated = await ProcuraApiService.updateRequestStatus(request.id, nextStatus, reason);
      onUpdateStatus(request.id, nextStatus, updated || undefined);
      onAddAudit(logAction, logActionAr, request.id, logDetails, logDetailsAr);
      onToast(isRtl ? logActionAr : logAction);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Status update failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await ProcuraApiService.deleteRequest(request.id);
      onDeleteRequest(request.id);
      onAddAudit(
        'Deleted Draft',
        'حذف مسودة',
        request.id,
        `Deleted draft ${request.id}`,
        `تم حذف المسودة ${request.id}`
      );
      onNavigate(2);
      onToast(isRtl ? 'تم حذف المسودة' : 'Draft deleted.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Delete draft failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const inspectedStatus = stages[selectedStageIdx] || request.status;
  const inspectedMeta = STAGE_META[inspectedStatus];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b ${divider}`}>
        <div>
          <button
            type="button"
            onClick={() => onNavigate(2)}
            className={`text-xs font-medium flex items-center gap-1.5 mb-2 ${textMuted} hover:text-[#E32236] transition-colors cursor-pointer`}
          >
            {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{t.backToRequests}</span>
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono-code text-base font-bold text-[#E32236]">
              {request.id}
            </span>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              {isRtl ? request.titleAr : request.title}
            </h1>
            <StatusBadge status={request.status} lang={lang} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {currentUser.role === 'requester' && request.status === 'Draft' && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  handleStatusChange(
                    'Submitted',
                    'Submitted Request',
                    'إرسال طلب شراء',
                    'Status changed from Draft -> Submitted',
                    'تغيير الحالة من مسودة -> تم الإرسال'
                  )
                }
                className="px-4 py-2 rounded-lg bg-[#E32236] hover:bg-[#C81B2D] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t.submitRequest}</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleDeleteDraft}
                className="px-4 py-2 rounded-lg border border-[#E32236]/40 text-[#E32236] hover:bg-[#E32236]/10 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.deleteDraft}</span>
              </button>
            </>
          )}

          {currentUser.role === 'officer' && (
            <>
              {(request.status === 'Submitted' || request.status === 'OffersReceived') && (
                <button
                  type="button"
                  onClick={onOpenInviteModal}
                  className={`px-4 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${bgSurface} hover:border-[#E32236]/50 cursor-pointer`}
                >
                  <Users className="w-3.5 h-3.5 text-[#E32236]" />
                  <span>{t.inviteSuppliers}</span>
                </button>
              )}
              {reqOffers.length > 0 && (
                <button
                  type="button"
                  onClick={() => onNavigate(11)}
                  className={`px-4 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${bgSurface} hover:border-[#E32236]/50 cursor-pointer`}
                >
                  <Layers className="w-3.5 h-3.5 text-[#E32236]" />
                  <span>{t.openComparison}</span>
                </button>
              )}
              {(request.status === 'OffersReceived' || request.status === 'Compared') &&
                reqOffers.length > 0 && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      handleStatusChange(
                        'PendingApproval',
                        'Sent for Approval',
                        'إرسال للاعتماد',
                        `Status changed from ${request.status} -> Pending Approval`,
                        'تم إرسال الطلب إلى المدير للاعتماد'
                      )
                    }
                    className="px-4 py-2 rounded-lg bg-[#E32236] hover:bg-[#C81B2D] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t.sendForApproval}</span>
                  </button>
                )}
            </>
          )}

          {currentUser.role === 'manager' && request.status === 'PendingApproval' && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  handleStatusChange(
                    'Approved',
                    'Approved Request',
                    'اعتماد الطلب',
                    'Status changed from Pending Approval -> Approved',
                    'تمت الموافقة الرسمية على الطلب'
                  )
                }
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.approveRequest}</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowRejectBox(!showRejectBox)}
                className="px-4 py-2 rounded-lg bg-[#E32236] hover:bg-[#C81B2D] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{t.rejectRequest}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {showRejectBox && (
        <div className={`p-5 rounded-xl border border-[#E32236]/60 space-y-3 ${bgSurface}`}>
          <label className="block text-xs font-semibold text-[#E32236]">
            {t.rejectReasonLabel}
          </label>
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t.rejectReasonPlaceholder}
            className={`w-full px-3.5 py-2 rounded-lg border text-sm outline-none focus:border-[#E32236] ${bgSubtle}`}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowRejectBox(false)}
              className="px-3 py-1.5 text-xs font-medium cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              disabled={!rejectReason.trim() || busy}
              onClick={async () => {
                if (!rejectReason.trim()) return;
                await handleStatusChange(
                  'Rejected',
                  'Rejected Request',
                  'رفض الطلب',
                  `Rejected: ${rejectReason}`,
                  `مرفوض: ${rejectReason}`,
                  rejectReason.trim()
                );
                setShowRejectBox(false);
                setRejectReason('');
              }}
              className="px-4 py-1.5 rounded-lg bg-[#E32236] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              {t.rejectRequest}
            </button>
          </div>
        </div>
      )}

      {/* Precision Milestone Stepper */}
      <div className={`rounded-xl border overflow-hidden ${bgSurface}`}>
        <div className={`px-6 py-4 border-b ${divider} flex items-center justify-between`}>
          <h2 className="text-sm font-bold">{t.workflowTimeline}</h2>
          <span className={`text-xs font-mono-code tabular-nums ${textMuted}`}>
            {currentStageIdx + 1} / {stages.length}
          </span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stages.map((st, idx) => {
              const isCompleted = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              const isInspected = idx === selectedStageIdx;
              const isRejectedStage = st === 'Rejected' && isCurrent;

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStageIdx(idx)}
                  className={`relative p-3.5 rounded-lg border text-start transition cursor-pointer ${
                    isInspected
                      ? 'border-[#E32236] bg-[#E32236]/[0.06]'
                      : isCompleted || isCurrent
                      ? `${bgSubtle} hover:border-[#E32236]/40`
                      : `${bgSubtle} opacity-55 hover:opacity-90`
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`w-6 h-6 rounded-md text-[11px] font-mono-code font-bold flex items-center justify-center ${
                        isRejectedStage
                          ? 'bg-[#E32236] text-white'
                          : isCurrent
                          ? 'bg-[#E32236] text-white'
                          : isCompleted
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : `${bgSurface} border ${divider} ${textMuted}`
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </span>
                    <span className={`text-[11px] font-medium truncate ${textMuted}`}>
                      {isRtl ? STAGE_META[st].ownerAr : STAGE_META[st].ownerEn}
                    </span>
                  </div>
                  <div className="text-xs font-bold truncate">
                    {t[`status_${st}` as keyof typeof t]}
                  </div>
                </button>
              );
            })}
          </div>

          <div
            className={`mt-4 pt-4 border-t ${divider} flex flex-wrap items-center justify-between gap-2 text-xs`}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#E32236]">
                {t[`status_${inspectedStatus}` as keyof typeof t]}
              </span>
              <span aria-hidden="true" className={textMuted}>
                ·
              </span>
              <span className={textMuted}>
                {isRtl ? inspectedMeta.noteAr : inspectedMeta.noteEn}
              </span>
            </div>
            <span className={`font-medium ${textMuted}`}>
              {isRtl ? inspectedMeta.ownerAr : inspectedMeta.ownerEn}
            </span>
          </div>
        </div>
      </div>

      {/* Specifications & Supplier Quotations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-5 rounded-xl border overflow-hidden ${bgSurface}`}>
          <div className={`px-6 py-4 border-b ${divider}`}>
            <h2 className="text-sm font-bold">{t.reqInfoSection}</h2>
          </div>

          <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-900/[0.06]'}`}>
            <div className="p-6">
              <p className={`text-sm leading-relaxed ${textMuted}`}>
                {isRtl ? request.descriptionAr : request.description}
              </p>
            </div>

            <div className="grid grid-cols-2 divide-x dark:divide-white/[0.06] divide-slate-900/[0.06]">
              <div className="p-5">
                <div className={`text-xs font-medium ${textMuted}`}>{t.quantity}</div>
                <div className="font-mono-code tabular-nums font-bold text-base mt-1">
                  {request.quantity} {t.units}
                </div>
              </div>
              <div className="p-5">
                <div className={`text-xs font-medium ${textMuted}`}>{t.estBudget}</div>
                <div className="font-mono-code tabular-nums font-bold text-base text-[#E32236] mt-1">
                  ${request.estimatedBudget.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x dark:divide-white/[0.06] divide-slate-900/[0.06]">
              <div className="p-5">
                <div className={`text-xs font-medium ${textMuted}`}>{t.requesterLabel}</div>
                <div className="font-semibold text-sm mt-1">
                  {isRtl ? request.requesterNameAr : request.requesterName}
                </div>
              </div>
              <div className="p-5">
                <div className={`text-xs font-medium ${textMuted}`}>{t.deliveryDateLabel}</div>
                <div className="font-mono-code tabular-nums font-semibold text-sm mt-1">
                  {request.deliveryDate || '—'}
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className={`text-xs font-medium ${textMuted}`}>{t.reasonLabel}</div>
              <p className="text-sm font-medium mt-1">
                {isRtl ? request.reasonAr : request.reason}
              </p>
            </div>
          </div>
        </div>

        <div className={`lg:col-span-7 rounded-xl border overflow-hidden flex flex-col ${bgSurface}`}>
          <div className={`px-6 py-4 border-b ${divider} flex items-center justify-between`}>
            <h2 className="text-sm font-bold">
              {t.supplierOffersSection} ({reqOffers.length})
            </h2>
          </div>

          {reqOffers.length === 0 ? (
            <div className={`p-12 text-center text-sm ${textMuted} my-auto`}>{t.noOffersYet}</div>
          ) : (
            <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-900/[0.06]'}`}>
              {reqOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-sm">{offer.supplierName}</span>
                      <span
                        className={`text-xs font-semibold ${
                          offer.reviewed ? 'text-emerald-500' : 'text-amber-500'
                        }`}
                      >
                        · {offer.reviewed ? t.offerStatus_Reviewed : t.offerStatus_NotReviewed}
                      </span>
                    </div>
                    <div
                      className={`text-xs font-mono-code mt-1.5 flex items-center gap-1.5 truncate ${textMuted}`}
                    >
                      <FileText className="w-3.5 h-3.5 text-[#E32236] shrink-0" />
                      <span className="truncate">{offer.fileName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-end font-mono-code tabular-nums">
                      <div className="font-bold text-sm">
                        ${offer.totalPrice.toLocaleString()} {offer.currency}
                      </div>
                      <div className={`text-xs ${textMuted}`}>
                        {offer.deliveryDays} {t.daysUnit}
                      </div>
                    </div>
                    {(currentUser.role === 'officer' || currentUser.role === 'manager') && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectOffer(offer.id);
                          onNavigate(10);
                        }}
                        className="px-3.5 py-2 rounded-lg bg-[#E32236] hover:bg-[#C81B2D] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t.reviewWithAi}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Commercial Comparison */}
      <div className={`rounded-xl border overflow-hidden ${bgSurface}`}>
        <div className={`px-6 py-4 border-b ${divider}`}>
          <h2 className="text-sm font-bold">{t.comparisonTitle}</h2>
        </div>
        <div className="p-6">
          <SupplierComparisonView
            theme={theme}
            lang={lang}
            requestId={request.id}
            offers={offers}
            standalone={false}
          />
        </div>
      </div>

      {/* Activity */}
      <div className={`rounded-xl border overflow-hidden ${bgSurface}`}>
        <div className={`px-6 py-4 border-b ${divider}`}>
          <h2 className="text-sm font-bold">{t.recentAuditActivity}</h2>
        </div>
        <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-900/[0.06]'}`}>
          {reqAudit.map((entry) => (
            <div
              key={entry.id}
              className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono-code tabular-nums text-[#E32236] font-semibold">
                  {entry.timestamp}
                </span>
                <span aria-hidden="true" className={textMuted}>
                  ·
                </span>
                <span className="font-semibold">{isRtl ? entry.userAr : entry.user}</span>
                <span aria-hidden="true" className={textMuted}>
                  ·
                </span>
                <span className="font-medium">{isRtl ? entry.actionAr : entry.action}</span>
              </div>
              <span className={textMuted}>{isRtl ? entry.detailsAr : entry.details}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
