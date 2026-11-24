import React from 'react';
import { FileText, X } from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations';
import { Language, SupplierOffer, ThemeMode } from '../../types/procurement';
import { getThemeClasses } from '../../utils/themeClasses';

interface PdfPreviewModalProps {
  offer: SupplierOffer | null;
  theme: ThemeMode;
  lang: Language;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  offer,
  theme,
  lang,
  onClose
}) => {
  if (!offer) return null;
  const t = TRANSLATIONS[lang];
  const { bgSurface, bgSubtle, textMuted, divider } = getThemeClasses(theme);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden ${bgSurface}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-4 h-4 text-[#E32236] shrink-0" />
            <span className="font-mono-code text-xs font-semibold truncate">{offer.fileName}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${bgSubtle} hover:border-[#E32236]/50`}
          >
            <X className="w-3.5 h-3.5" />
            <span>{t.closePreview}</span>
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {offer.fileUrl ? (
            <iframe
              src={offer.fileUrl}
              title={offer.fileName}
              className="w-full h-[62vh] rounded-lg border border-black/10 dark:border-white/10 bg-white"
            />
          ) : (
            <div className="max-w-2xl mx-auto bg-white text-[#111827] rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6 flex items-start justify-between border-b border-slate-200">
                <div>
                  <div className="text-xs font-semibold text-[#E32236]">
                    Source Quotation Document
                  </div>
                  <h3 className="text-xl font-bold mt-1">{offer.supplierName}</h3>
                </div>
                <div className="text-end font-mono-code text-xs text-slate-500">
                  <div>{offer.id}</div>
                  <div>{offer.uploadedAt}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 font-mono-code border-b border-slate-200 bg-slate-50">
                <div className="p-4">
                  <div className="text-[11px] text-slate-500">{t.reqId}</div>
                  <div className="font-bold text-sm mt-0.5">{offer.requestId}</div>
                </div>
                <div className="p-4">
                  <div className="text-[11px] text-slate-500">{t.totalPrice}</div>
                  <div className="font-bold text-sm text-[#E32236] mt-0.5 tabular-nums">
                    ${offer.totalPrice.toLocaleString()} {offer.currency}
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[11px] text-slate-500">{t.deliveryDuration}</div>
                  <div className="font-bold text-sm mt-0.5 tabular-nums">
                    {offer.deliveryDays} {t.daysUnit}
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[11px] text-slate-500">{t.warrantyDuration}</div>
                  <div className="font-bold text-sm mt-0.5 tabular-nums">
                    {offer.warrantyMonths} {t.monthsUnit}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-2.5 text-sm">
                <div>
                  <span className="font-semibold text-slate-500">{t.paymentTerms}: </span>
                  <span className="font-mono-code font-bold">
                    {offer.paymentTerms || 'Not specified in source PDF'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">{t.notes}: </span>
                  <span className={textMuted ? 'text-slate-700' : ''}>{offer.notes}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
