import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  Upload
} from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations';
import { ProcuraApiService } from '../../services/procuraApi';
import {
  Language,
  PurchaseRequest,
  ScreenId,
  SupplierOffer,
  ThemeMode,
  User
} from '../../types/procurement';
import { getThemeClasses } from '../../utils/themeClasses';

interface SupplierUploadScreenProps {
  theme: ThemeMode;
  lang: Language;
  currentUser: User;
  requests: PurchaseRequest[];
  selectedRequestId: string;
  offers: SupplierOffer[];
  onOfferUploaded: (offer: SupplierOffer, requestId: string) => void;
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

export const SupplierUploadScreen: React.FC<SupplierUploadScreenProps> = ({
  theme,
  lang,
  currentUser,
  requests,
  selectedRequestId,
  offers,
  onOfferUploaded,
  onAddAudit,
  onToast,
  onNavigate
}) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const { isDark, bgSurface, bgSubtle, textMuted, divider } = getThemeClasses(theme);

  const supplierId = currentUser.supplierId || 'SUP-01';
  const invitedReqs = requests.filter((r) => r.invitedSupplierIds?.includes(supplierId));
  const req =
    invitedReqs.find((r) => r.id === selectedRequestId) || invitedReqs[0] || requests[0];
  const existingOffer = req
    ? offers.find((o) => o.requestId === req.id && o.supplierId === supplierId)
    : undefined;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>(
    existingOffer ? 'success' : 'idle'
  );
  const [progress, setProgress] = useState(existingOffer ? 100 : 0);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!req) {
    return null;
  }

  const handleFileChosen = (file?: File) => {
    if (!file) return;
    setErrorMsg('');
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadState('error');
      setErrorMsg(t.uploadErrorPdfOnly);
      return;
    }
    setSelectedFile(file);
    setUploadState('idle');
    setProgress(0);
  };

  const startUpload = async () => {
    if (ProcuraApiService.isLive()) {
      if (!selectedFile) {
        setUploadState('error');
        setErrorMsg(t.uploadErrorPdfOnly);
        return;
      }
      setUploadState('uploading');
      setProgress(35);
      setErrorMsg('');
      try {
        const uploadedOffer = await ProcuraApiService.uploadQuotationPdf(
          req.id,
          supplierId,
          selectedFile
        );
        setProgress(100);
        setUploadState('success');
        if (uploadedOffer) {
          onOfferUploaded(uploadedOffer, req.id);
        }
        onAddAudit(
          'Uploaded Quotation',
          'رفع عرض سعر',
          req.id,
          `${currentUser.companyName || currentUser.name} uploaded ${selectedFile.name}`,
          `تم رفع الملف ${selectedFile.name}`
        );
        onToast(t.uploadSuccessMsg);
      } catch (err) {
        setUploadState('error');
        setErrorMsg(err instanceof Error ? err.message : t.uploadErrorGeneric);
      }
      return;
    }

    const fileNameToUse = selectedFile ? selectedFile.name : `TechSupply_Quote_${req.id}.pdf`;
    setUploadState('uploading');
    setProgress(15);
    setErrorMsg('');

    let p = 15;
    const timer = window.setInterval(() => {
      p += 25;
      setProgress(Math.min(p, 95));
      if (p >= 95) {
        window.clearInterval(timer);
        setProgress(100);
        setUploadState('success');
        const newOffer: SupplierOffer = {
          id: `OFF-${Math.floor(300 + Math.random() * 600)}`,
          requestId: req.id,
          supplierId,
          supplierName: currentUser.companyName || 'TechSupply Ltd.',
          fileName: fileNameToUse,
          uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          extractionStatus: 'Completed',
          reviewed: false,
          totalPrice: 31500,
          currency: 'USD',
          deliveryDays: 10,
          paymentTerms: 'Net 30',
          warrantyMonths: 24,
          notes: 'Uploaded via PROCURA Supplier Portal.'
        };
        onOfferUploaded(newOffer, req.id);
        onAddAudit(
          'Uploaded Quotation',
          'رفع عرض سعر',
          req.id,
          `TechSupply Ltd. uploaded ${fileNameToUse}`,
          `قامت شركة تك سبلاي برفع الملف ${fileNameToUse}`
        );
        onToast(t.uploadSuccessMsg);
      }
    }, 220);
  };

  return (
    <div className="space-y-6">
      <div className={`pb-5 border-b ${divider}`}>
        <button
          type="button"
          onClick={() => onNavigate(7)}
          className={`text-xs font-medium flex items-center gap-1.5 mb-2 ${textMuted} hover:text-[#E32236] cursor-pointer`}
        >
          {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
          <span>{t.navSupplierRequests}</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t.uploadQuotationTitle}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={`lg:col-span-5 rounded-xl border overflow-hidden ${bgSurface}`}>
          <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-900/[0.06]'}`}>
            <div className="p-6 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono-code font-bold text-[#E32236]">{req.id}</span>
                <span className={`font-mono-code tabular-nums ${textMuted}`}>
                  {t.deadlineCol}: {req.deliveryDate}
                </span>
              </div>
              <h2 className="text-lg font-bold">{isRtl ? req.titleAr : req.title}</h2>
              <p className={`text-sm leading-relaxed ${textMuted}`}>
                {isRtl ? req.descriptionAr : req.description}
              </p>
            </div>

            <div className="grid grid-cols-2 divide-x dark:divide-white/[0.06] divide-slate-900/[0.06]">
              <div className="p-5">
                <div className={`text-xs font-medium ${textMuted}`}>{t.quantity}</div>
                <div className="font-mono-code tabular-nums font-bold text-base mt-1">
                  {req.quantity} {t.units}
                </div>
              </div>
              <div className="p-5">
                <div className={`text-xs font-medium ${textMuted}`}>{t.deliveryDateLabel}</div>
                <div className="font-mono-code tabular-nums font-bold text-sm mt-1">
                  {req.deliveryDate}
                </div>
              </div>
            </div>

            <div className={`p-5 text-xs flex items-center gap-2.5 ${bgSubtle} ${textMuted}`}>
              <Lock className="w-4 h-4 text-[#E32236] shrink-0" />
              <span>{t.budgetConfidentialNote}</span>
            </div>
          </div>
        </div>

        <div className={`lg:col-span-7 p-6 rounded-xl border space-y-5 ${bgSurface}`}>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) handleFileChosen(e.dataTransfer.files[0]);
            }}
            className={`p-10 rounded-xl border border-dashed text-center transition ${
              uploadState === 'error'
                ? 'border-[#E32236] bg-[#E32236]/5'
                : `${divider} hover:border-[#E32236]`
            }`}
          >
            <Upload className="w-9 h-9 text-[#E32236] mx-auto mb-3" />
            <p className="font-bold text-base">{t.uploadAreaTitle}</p>
            <p className={`text-xs mt-1 mb-5 ${textMuted}`}>{t.uploadAreaSub}</p>

            {selectedFile && (
              <p className="text-xs font-mono-code font-bold text-[#E32236] mb-4">
                {selectedFile.name}
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => handleFileChosen(e.target.files?.[0])}
              className="hidden"
            />

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`px-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${bgSubtle} hover:border-[#E32236]/50`}
              >
                {t.browseFiles}
              </button>
              <button
                type="button"
                onClick={startUpload}
                disabled={uploadState === 'uploading'}
                className="px-5 py-2 rounded-lg bg-[#E32236] hover:bg-[#C81B2D] text-white text-xs font-semibold disabled:opacity-60 cursor-pointer"
              >
                {t.uploadQuotationBtn}
              </button>
            </div>
          </div>

          {uploadState === 'uploading' && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span>{t.uploadingText}</span>
                <span className="font-mono-code tabular-nums">{progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[#E32236] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {uploadState === 'error' && (
            <div className="p-3.5 rounded-lg bg-[#E32236]/10 border border-[#E32236]/30 text-[#E32236] text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={startUpload}
                className="px-3 py-1 rounded bg-[#E32236] text-white font-semibold shrink-0 cursor-pointer"
              >
                {t.retry}
              </button>
            </div>
          )}

          {uploadState === 'success' && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t.uploadSuccessMsg}</span>
              </div>
              <span className="font-mono-code font-semibold truncate">
                {selectedFile?.name || existingOffer?.fileName || `TechSupply_Quote_${req.id}.pdf`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
