import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  RefreshCw,
  RotateCcw
} from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations';
import { ProcuraApiService } from '../../services/procuraApi';
import {
  ExtractionStatus,
  Language,
  ScreenId,
  SupplierOffer,
  ThemeMode
} from '../../types/procurement';
import { getThemeClasses } from '../../utils/themeClasses';
import { PdfPreviewModal } from '../common/PdfPreviewModal';

type DocumentFieldKey =
  | 'supplierName'
  | 'totalPrice'
  | 'deliveryDays'
  | 'warrantyMonths'
  | 'paymentTerms';

interface AiExtractionScreenProps {
  theme: ThemeMode;
  lang: Language;
  offers: SupplierOffer[];
  selectedOfferId: string;
  onSelectOffer: (offerId: string) => void;
  onOfferVerified: (updatedOffer: SupplierOffer) => void;
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

export const AiExtractionScreen: React.FC<AiExtractionScreenProps> = ({
  theme,
  lang,
  offers,
  selectedOfferId,
  onSelectOffer,
  onOfferVerified,
  onSelectRequest,
  onAddAudit,
  onToast,
  onNavigate
}) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const { isDark, bgSurface, bgSubtle, textMuted, divider } = getThemeClasses(theme);

  const offer = offers.find((o) => o.id === selectedOfferId) || offers[0];
  const [aiStatus, setAiStatus] = useState<ExtractionStatus>(
    offer?.extractionStatus || 'Completed'
  );
  const [activeField, setActiveField] = useState<DocumentFieldKey | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<{
    supplierName: string;
    totalPrice: string | number;
    currency: string;
    deliveryDays: string | number;
    paymentTerms: string;
    warrantyMonths: string | number;
    notes: string;
  }>({
    supplierName: offer?.supplierName || '',
    totalPrice: offer?.totalPrice ?? '',
    currency: offer?.currency || 'USD',
    deliveryDays: offer?.deliveryDays ?? '',
    paymentTerms: offer?.paymentTerms || '',
    warrantyMonths: offer?.warrantyMonths ?? '',
    notes: offer?.notes || ''
  });

  useEffect(() => {
    if (!offer) return;
    setForm({
      supplierName: offer.supplierName || '',
      totalPrice: offer.totalPrice ?? '',
      currency: offer.currency || 'USD',
      deliveryDays: offer.deliveryDays ?? '',
      paymentTerms: offer.paymentTerms || '',
      warrantyMonths: offer.warrantyMonths ?? '',
      notes: offer.notes || ''
    });
    setAiStatus(offer.extractionStatus || 'Completed');
  }, [offer]);

  if (!offer) {
    return (
      <div className={`p-14 rounded-xl border text-center ${bgSurface}`}>
        <p className="font-semibold text-sm">{t.noOffersYet}</p>
      </div>
    );
  }

  const handleRetryAi = async () => {
    setAiStatus('Processing');
    if (ProcuraApiService.isLive()) {
      try {
        const retried = await ProcuraApiService.retryAiExtraction(offer.id);
        if (retried) {
          onOfferVerified(retried);
          setAiStatus(retried.extractionStatus);
        } else {
          setAiStatus('Completed');
        }
      } catch (err) {
        setAiStatus('Failed');
        onToast(err instanceof Error ? err.message : 'AI extraction retry failed.', 'error');
      }
      return;
    }

    window.setTimeout(() => {
      setAiStatus('Completed');
    }, 1000);
  };

  const handleSaveApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        supplierName: form.supplierName,
        totalPrice: Number(form.totalPrice) || 0,
        currency: form.currency,
        deliveryDays: Number(form.deliveryDays) || 0,
        paymentTerms: form.paymentTerms,
        warrantyMonths: Number(form.warrantyMonths) || 0,
        notes: form.notes
      };

      const apiVerified = await ProcuraApiService.verifyAiExtraction(offer.id, payload);
      const updatedOffer: SupplierOffer = apiVerified || {
        ...offer,
        ...payload,
        extractionStatus: 'Completed',
        reviewed: true
      };

      onOfferVerified(updatedOffer);
      onAddAudit(
        'Verified AI Extraction',
        'اعتماد استخراج البيانات',
        offer.requestId,
        `Verified offer ${offer.id} (${form.supplierName}): $${Number(
          form.totalPrice
        ).toLocaleString()}, ${form.deliveryDays}d, Terms: ${form.paymentTerms || 'N/A'}`,
        `تم اعتماد بيانات العرض ${offer.id} (${form.supplierName})`
      );
      onSelectRequest(offer.requestId);
      onNavigate(4);
      onToast(
        isRtl
          ? 'تم حفظ واعتماد البيانات المستخرجة بنجاح'
          : 'Extraction verified and saved to comparison matrix.'
      );
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to save verification.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const highlightClass = (key: DocumentFieldKey, isMissing = false) => {
    if (activeField === key) {
      return 'border-[#E32236] bg-[#E32236]/[0.06] ring-1 ring-[#E32236]/40';
    }
    if (isMissing) {
      return 'border-amber-500/60 bg-amber-500/[0.06]';
    }
    return isDark ? 'border-white/[0.08] bg-[#0F1218]' : 'border-slate-200 bg-slate-50/70';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b ${divider}`}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.aiReviewTitle}</h1>
          <p className={`text-sm mt-1 ${textMuted}`}>{t.aiReviewSub}</p>
        </div>

        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className={`px-4 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${bgSurface} hover:border-[#E32236]/50`}
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#E32236]" />
          <span>{t.openQuotationPdf}</span>
        </button>
      </div>

      {/* Record Selector Strip */}
      <div className="flex flex-wrap items-center gap-2">
        {offers.slice(0, 6).map((o) => {
          const active = o.id === offer.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onSelectOffer(o.id)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                active
                  ? 'border-[#E32236] bg-[#E32236]/10 text-[#E32236] font-semibold'
                  : `${bgSurface} ${textMuted} hover:border-[#E32236]/40`
              }`}
            >
              <span className="font-mono-code font-semibold">{o.id}</span>
              <span aria-hidden="true">·</span>
              <span>{o.supplierName}</span>
            </button>
          );
        })}
      </div>

      {/* Split Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Authentic Interactive Quotation Sheet Preview */}
        <div className={`lg:col-span-5 rounded-xl border overflow-hidden ${bgSurface}`}>
          <div className={`px-5 py-3.5 border-b ${divider} flex items-center justify-between gap-2 ${bgSubtle}`}>
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-[#E32236] shrink-0" />
              <span className="font-mono-code text-xs font-semibold truncate">{offer.fileName}</span>
            </div>
            <span
              className={`text-xs font-semibold shrink-0 ${
                aiStatus === 'Completed'
                  ? 'text-emerald-500'
                  : aiStatus === 'Processing'
                  ? 'text-amber-500'
                  : 'text-[#E32236]'
              }`}
            >
              {t[`status_${aiStatus}` as keyof typeof t]}
            </span>
          </div>

          <div className="p-5 space-y-3">
            {/* Document Letterhead */}
            <div className={`pb-3 border-b ${divider} flex items-start justify-between gap-3`}>
              <div>
                <div className={`text-[11px] font-medium ${textMuted}`}>
                  {isRtl ? 'مستند عرض السعر المستخرج' : 'Commercial Quotation Sheet'}
                </div>
                <div className="text-sm font-bold mt-0.5">{offer.requestId}</div>
              </div>
              <div className={`text-end font-mono-code text-[11px] ${textMuted}`}>
                <div>{offer.id}</div>
                <div>{offer.uploadedAt}</div>
              </div>
            </div>

            {/* Interactive Highlight Regions */}
            <div
              onClick={() => setActiveField('supplierName')}
              className={`p-3 rounded-lg border transition cursor-pointer ${highlightClass('supplierName')}`}
            >
              <div className={`text-[11px] font-medium ${textMuted}`}>{t.supplierName}</div>
              <div className="text-sm font-bold mt-0.5">{form.supplierName || '—'}</div>
            </div>

            <div
              onClick={() => setActiveField('totalPrice')}
              className={`p-3 rounded-lg border transition cursor-pointer ${highlightClass(
                'totalPrice',
                !form.totalPrice
              )}`}
            >
              <div className={`text-[11px] font-medium ${textMuted}`}>{t.totalPrice}</div>
              <div className="text-lg font-bold font-mono-code tabular-nums text-[#E32236] mt-0.5">
                {form.totalPrice
                  ? `$${Number(form.totalPrice).toLocaleString()} ${form.currency}`
                  : '—'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setActiveField('deliveryDays')}
                className={`p-3 rounded-lg border transition cursor-pointer ${highlightClass(
                  'deliveryDays',
                  !form.deliveryDays
                )}`}
              >
                <div className={`text-[11px] font-medium ${textMuted}`}>{t.deliveryDuration}</div>
                <div className="text-sm font-bold font-mono-code tabular-nums mt-0.5">
                  {form.deliveryDays ? `${form.deliveryDays} ${t.daysUnit}` : '—'}
                </div>
              </div>

              <div
                onClick={() => setActiveField('warrantyMonths')}
                className={`p-3 rounded-lg border transition cursor-pointer ${highlightClass('warrantyMonths')}`}
              >
                <div className={`text-[11px] font-medium ${textMuted}`}>{t.warrantyDuration}</div>
                <div className="text-sm font-bold font-mono-code tabular-nums mt-0.5">
                  {form.warrantyMonths ? `${form.warrantyMonths} ${t.monthsUnit}` : '—'}
                </div>
              </div>
            </div>

            <div
              onClick={() => setActiveField('paymentTerms')}
              className={`p-3 rounded-lg border transition cursor-pointer ${highlightClass(
                'paymentTerms',
                !form.paymentTerms.trim()
              )}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-medium ${textMuted}`}>{t.paymentTerms}</span>
                {!form.paymentTerms.trim() && (
                  <span className="text-[11px] font-semibold text-amber-500">
                    {isRtl ? 'مفقود' : 'Missing'}
                  </span>
                )}
              </div>
              <div className="text-sm font-semibold font-mono-code mt-0.5">
                {form.paymentTerms.trim() || (isRtl ? 'غير محدد في المستند' : 'Not detected')}
              </div>
            </div>

            <p className={`text-[11px] pt-2 ${textMuted}`}>{t.hoverFieldHint}</p>
          </div>
        </div>

        {/* Right: Verification Form */}
        <div className={`lg:col-span-7 p-6 lg:p-7 rounded-xl border ${bgSurface}`}>
          {aiStatus === 'Processing' ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#E32236] animate-spin mx-auto" />
              <h3 className="font-bold text-base">
                {isRtl
                  ? 'جارٍ تحليل بنود عرض السعر...'
                  : 'Parsing Quotation Line Items & Commercial Terms...'}
              </h3>
              <p className={`text-xs ${textMuted}`}>
                {isRtl
                  ? 'يتم استخراج الأسعار وشروط الدفع والضمان تلقائياً'
                  : 'Extracting pricing totals, currency, lead times, and payment clauses'}
              </p>
            </div>
          ) : aiStatus === 'Failed' ? (
            <div className="py-16 text-center space-y-4">
              <AlertTriangle className="w-9 h-9 text-[#E32236] mx-auto" />
              <h3 className="font-bold text-base text-[#E32236]">
                {isRtl ? 'فشل استخراج البيانات من المستند' : 'Document Extraction Interrupted'}
              </h3>
              <p className={`text-xs max-w-md mx-auto ${textMuted}`}>
                {isRtl
                  ? 'تعذر قراءة بعض الجداول في ملف PDF. يمكنك إعادة تشغيل الاستخراج.'
                  : 'Unable to parse commercial table layer from PDF. Re-run extraction to recover.'}
              </p>
              <button
                type="button"
                onClick={handleRetryAi}
                className="px-5 py-2.5 rounded-lg bg-[#E32236] hover:bg-[#C81B2D] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.retryExtraction}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveApprove} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onMouseEnter={() => setActiveField('supplierName')}
                  onFocus={() => setActiveField('supplierName')}
                >
                  <label className="block text-xs font-semibold mb-1.5">{t.supplierName}</label>
                  <input
                    type="text"
                    value={form.supplierName}
                    onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none focus:border-[#E32236] ${bgSubtle}`}
                  />
                </div>

                <div
                  onMouseEnter={() => setActiveField('totalPrice')}
                  onFocus={() => setActiveField('totalPrice')}
                  className="grid grid-cols-3 gap-2"
                >
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold mb-1.5">{t.totalPrice}</label>
                    <input
                      type="number"
                      value={form.totalPrice}
                      onChange={(e) => setForm({ ...form, totalPrice: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-mono-code tabular-nums outline-none focus:border-[#E32236] ${
                        !form.totalPrice ? 'border-amber-500 bg-amber-500/10' : bgSubtle
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">{t.currency}</label>
                    <input
                      type="text"
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-mono-code outline-none focus:border-[#E32236] ${bgSubtle}`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onMouseEnter={() => setActiveField('deliveryDays')}
                  onFocus={() => setActiveField('deliveryDays')}
                >
                  <label className="block text-xs font-semibold mb-1.5">
                    {t.deliveryDuration}
                  </label>
                  <input
                    type="number"
                    value={form.deliveryDays}
                    onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-mono-code tabular-nums outline-none focus:border-[#E32236] ${
                      !form.deliveryDays ? 'border-amber-500 bg-amber-500/10' : bgSubtle
                    }`}
                  />
                </div>

                <div
                  onMouseEnter={() => setActiveField('warrantyMonths')}
                  onFocus={() => setActiveField('warrantyMonths')}
                >
                  <label className="block text-xs font-semibold mb-1.5">
                    {t.warrantyDuration}
                  </label>
                  <input
                    type="number"
                    value={form.warrantyMonths}
                    onChange={(e) => setForm({ ...form, warrantyMonths: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-mono-code tabular-nums outline-none focus:border-[#E32236] ${bgSubtle}`}
                  />
                </div>
              </div>

              <div
                onMouseEnter={() => setActiveField('paymentTerms')}
                onFocus={() => setActiveField('paymentTerms')}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold">{t.paymentTerms}</label>
                  {!form.paymentTerms.trim() && (
                    <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{t.missingFieldWarn}</span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={form.paymentTerms}
                  onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                  placeholder="e.g., Net 30"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition ${
                    !form.paymentTerms.trim()
                      ? 'border-amber-500 bg-amber-500/10 focus:border-amber-500'
                      : `${bgSubtle} focus:border-[#E32236]`
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">{t.notes}</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none focus:border-[#E32236] ${bgSubtle}`}
                />
              </div>

              <div className={`pt-4 border-t ${divider} flex justify-end gap-3`}>
                <button
                  type="button"
                  onClick={() => onNavigate(4)}
                  className={`px-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${bgSubtle}`}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#E32236] hover:bg-[#C81B2D] text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{t.saveAndApprove}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <PdfPreviewModal
        offer={previewOpen ? offer : null}
        theme={theme}
        lang={lang}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
};
