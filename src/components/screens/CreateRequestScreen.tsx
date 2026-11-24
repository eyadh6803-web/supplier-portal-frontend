import React, { useState } from 'react';
import { RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations';
import { ProcuraApiService } from '../../services/procuraApi';
import {
  Language,
  PurchaseRequest,
  ScreenId,
  ThemeMode,
  User
} from '../../types/procurement';
import { getThemeClasses } from '../../utils/themeClasses';

interface CreateRequestScreenProps {
  theme: ThemeMode;
  lang: Language;
  currentUser: User;
  onCreated: (newRequest: PurchaseRequest) => void;
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

export const CreateRequestScreen: React.FC<CreateRequestScreenProps> = ({
  theme,
  lang,
  currentUser,
  onCreated,
  onAddAudit,
  onToast,
  onNavigate
}) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const { isDark, bgSurface, bgSubtle, textMuted, divider } = getThemeClasses(theme);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [budget, setBudget] = useState('');
  const [reason, setReason] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    quantity?: string;
    budget?: string;
    reason?: string;
  }>({});

  const validateForm = () => {
    const errs: typeof errors = {};
    if (!title.trim()) errs.title = t.requiredField;
    if (!quantity || Number(quantity) <= 0) errs.quantity = t.mustBePositive;
    if (!budget || Number(budget) <= 0) errs.budget = t.mustBePositive;
    if (!reason.trim()) errs.reason = t.requiredField;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async (targetStatus: 'Draft' | 'Submitted') => {
    if (!validateForm() || submitting) return;
    setSubmitting(true);

    try {
      const apiCreated = await ProcuraApiService.createRequest({
        title: title.trim(),
        titleAr: title.trim(),
        description: description.trim() || 'Standard enterprise procurement specification.',
        descriptionAr: description.trim() || 'مواصفات شراء مؤسسية قياسية.',
        quantity: Number(quantity),
        estimatedBudget: Number(budget),
        reason: reason.trim(),
        reasonAr: reason.trim(),
        deliveryDate: deliveryDate || '2026-12-30',
        status: targetStatus
      });

      const newReq: PurchaseRequest = apiCreated || {
        id: `PR-${Math.floor(1051 + Math.random() * 899)}`,
        title: title.trim(),
        titleAr: title.trim(),
        description: description.trim() || 'Standard enterprise procurement specification.',
        descriptionAr: description.trim() || 'مواصفات شراء مؤسسية قياسية.',
        quantity: Number(quantity),
        estimatedBudget: Number(budget),
        reason: reason.trim(),
        reasonAr: reason.trim(),
        deliveryDate: deliveryDate || '2026-12-30',
        requesterId: currentUser.id,
        requesterName: currentUser.name,
        requesterNameAr: currentUser.nameAr,
        status: targetStatus,
        createdDate: new Date().toISOString().split('T')[0],
        invitedSupplierIds: []
      };

      onCreated(newReq);
      onAddAudit(
        targetStatus === 'Draft' ? 'Saved Request Draft' : 'Created & Submitted Request',
        targetStatus === 'Draft' ? 'حفظ مسودة طلب' : 'إنشاء وإرسال طلب شراء',
        newReq.id,
        `${newReq.title} (${newReq.quantity} units, $${newReq.estimatedBudget.toLocaleString()})`,
        `${newReq.titleAr} (${newReq.quantity} وحدة، $${newReq.estimatedBudget.toLocaleString()})`
      );
      onNavigate(4);
      onToast(
        targetStatus === 'Draft'
          ? isRtl
            ? 'تم حفظ الطلب كمسودة'
            : 'Purchase request saved as Draft.'
          : isRtl
          ? 'تم إرسال طلب الشراء بنجاح'
          : 'Purchase request submitted to Procurement.'
      );
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : 'Failed to create purchase request.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`flex items-center justify-between gap-4 pb-5 border-b ${divider}`}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.createReqTitle}</h1>
          <p className={`text-sm mt-1 ${textMuted}`}>{t.createReqSub}</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate(2)}
          className={`px-3.5 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${bgSurface} hover:border-[#E32236]/50`}
        >
          {t.cancel}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={`lg:col-span-8 p-6 lg:p-7 rounded-xl border space-y-5 ${bgSurface}`}>
          <div>
            <label className="block text-xs font-semibold mb-1.5">
              {t.fieldTitle} <span className="text-[#E32236]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.fieldTitlePlaceholder}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none focus:border-[#E32236] ${bgSubtle}`}
            />
            {errors.title && <p className="text-xs text-[#E32236] mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">{t.fieldDesc}</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.fieldDescPlaceholder}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none focus:border-[#E32236] ${bgSubtle}`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5">
                {t.fieldQty} <span className="text-[#E32236]">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="10"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-mono-code tabular-nums outline-none focus:border-[#E32236] ${bgSubtle}`}
              />
              {errors.quantity && <p className="text-xs text-[#E32236] mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">
                {t.fieldBudget} <span className="text-[#E32236]">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="15000"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-mono-code tabular-nums outline-none focus:border-[#E32236] ${bgSubtle}`}
              />
              {errors.budget && <p className="text-xs text-[#E32236] mt-1">{errors.budget}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">{t.fieldDeliveryDate}</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-mono-code tabular-nums outline-none focus:border-[#E32236] ${bgSubtle}`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">
              {t.fieldReason} <span className="text-[#E32236]">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t.fieldReasonPlaceholder}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none focus:border-[#E32236] ${bgSubtle}`}
            />
            {errors.reason && <p className="text-xs text-[#E32236] mt-1">{errors.reason}</p>}
          </div>

          <div className={`pt-4 border-t ${divider} flex flex-wrap items-center justify-end gap-3`}>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleCreate('Draft')}
              className={`px-4 py-2 rounded-lg border text-xs font-semibold transition disabled:opacity-60 cursor-pointer ${bgSubtle} hover:border-[#E32236]/50`}
            >
              {t.saveDraft}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleCreate('Submitted')}
              className="px-5 py-2 rounded-lg bg-[#E32236] hover:bg-[#C81B2D] text-white text-xs font-semibold transition flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{t.submitRequest}</span>
            </button>
          </div>
        </div>

        {/* Clean Single-Elevation Summary */}
        <div className={`lg:col-span-4 rounded-xl border overflow-hidden ${bgSurface}`}>
          <div className={`px-6 py-4 border-b ${divider}`}>
            <h2 className="text-sm font-bold">
              {isRtl ? 'ملخص طلب الشراء' : 'Requisition Summary'}
            </h2>
          </div>

          <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-900/[0.06]'}`}>
            <div className="p-5">
              <div className={`text-xs font-medium ${textMuted}`}>{t.reqTitle}</div>
              <div className="font-semibold text-sm mt-1">{title || '—'}</div>
            </div>

            <div className="grid grid-cols-2 divide-x dark:divide-white/[0.06] divide-slate-900/[0.06]">
              <div className="p-5">
                <div className={`text-xs font-medium ${textMuted}`}>{t.quantity}</div>
                <div className="font-mono-code tabular-nums font-bold text-base mt-1">
                  {quantity || '0'} {t.units}
                </div>
              </div>
              <div className="p-5">
                <div className={`text-xs font-medium ${textMuted}`}>{t.estBudget}</div>
                <div className="font-mono-code tabular-nums font-bold text-base text-[#E32236] mt-1">
                  ${Number(budget || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className={`text-xs font-medium ${textMuted}`}>{t.requesterLabel}</div>
              <div className="font-semibold text-sm mt-1">
                {isRtl ? currentUser.nameAr : currentUser.name}
              </div>
            </div>

            <div className={`p-5 text-xs leading-relaxed flex items-start gap-3 ${bgSubtle} ${textMuted}`}>
              <ShieldCheck className="w-4 h-4 text-[#E32236] shrink-0 mt-0.5" />
              <span>
                {isRtl
                  ? 'يتم تسجيل الطلب في سجل التدقيق وإحالته تلقائياً إلى قسم المشتريات فور الإرسال.'
                  : 'Submitting this requisition logs an audit event and routes specifications to Strategic Procurement.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
