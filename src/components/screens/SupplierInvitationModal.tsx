import React, { useEffect, useState } from 'react';
import { Check, RefreshCw, Send, X } from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations';
import { ProcuraApiService } from '../../services/procuraApi';
import {
  Language,
  PurchaseRequest,
  Supplier,
  ThemeMode
} from '../../types/procurement';
import { getThemeClasses } from '../../utils/themeClasses';

interface SupplierInvitationModalProps {
  isOpen: boolean;
  theme: ThemeMode;
  lang: Language;
  request: PurchaseRequest;
  suppliers: Supplier[];
  onClose: () => void;
  onInvited: (requestId: string, supplierIds: string[]) => void;
  onAddAudit: (
    action: string,
    actionAr: string,
    requestId: string,
    details: string,
    detailsAr: string
  ) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const SupplierInvitationModal: React.FC<SupplierInvitationModalProps> = ({
  isOpen,
  theme,
  lang,
  request,
  suppliers,
  onClose,
  onInvited,
  onAddAudit,
  onToast
}) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const { bgSurface, bgSubtle, textMuted, divider } = getThemeClasses(theme);

  const [selectedIds, setSelectedIds] = useState<string[]>(
    request.invitedSupplierIds?.length ? request.invitedSupplierIds : ['SUP-01', 'SUP-02', 'SUP-03']
  );
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(
        request.invitedSupplierIds?.length
          ? request.invitedSupplierIds
          : suppliers.map((s) => s.id)
      );
      setError('');
    }
  }, [isOpen, request, suppliers]);

  if (!isOpen) return null;

  const toggleSupplier = (id: string) => {
    setError('');
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSendInvitations = async () => {
    if (selectedIds.length === 0) {
      setError(t.selectAtLeastOne);
      return;
    }
    if (sending) return;
    setSending(true);
    try {
      await ProcuraApiService.inviteSuppliers(request.id, selectedIds);
      onInvited(request.id, selectedIds);
      const names = suppliers
        .filter((s) => selectedIds.includes(s.id))
        .map((s) => s.name)
        .join(', ');
      onAddAudit(
        'Invited Suppliers',
        'دعوة موردين',
        request.id,
        `Invited ${selectedIds.length} suppliers: ${names}`,
        `تمت دعوة ${selectedIds.length} موردين لتقديم عروضهم`
      );
      onClose();
      onToast(
        isRtl
          ? `تم إرسال الدعوات إلى ${selectedIds.length} موردين بنجاح`
          : `Dispatched sourcing invitations to ${selectedIds.length} suppliers.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch invitations.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-5 ${bgSurface}`}>
        <div className={`flex items-start justify-between gap-4 border-b ${divider} pb-4`}>
          <div>
            <div className="text-xs font-mono-code font-semibold text-[#E32236] mb-1">
              {request.id}
            </div>
            <h3 className="text-lg font-bold">{t.inviteModalTitle}</h3>
            <p className={`text-xs mt-1 ${textMuted}`}>{t.inviteModalSub}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg border cursor-pointer ${bgSubtle}`}
            aria-label={t.cancel}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {suppliers.map((sup) => {
            const checked = selectedIds.includes(sup.id);
            return (
              <button
                key={sup.id}
                type="button"
                onClick={() => toggleSupplier(sup.id)}
                className={`w-full p-4 rounded-xl border flex items-center justify-between text-start cursor-pointer transition ${
                  checked ? 'border-[#E32236] bg-[#E32236]/[0.06]' : bgSubtle
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                      checked ? 'bg-[#E32236] border-[#E32236] text-white' : divider
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{isRtl ? sup.nameAr : sup.name}</div>
                    <div className={`text-xs ${textMuted}`}>
                      {isRtl ? sup.categoryAr : sup.category}
                    </div>
                  </div>
                </div>
                <span className="font-mono-code text-xs font-semibold text-amber-500">
                  ★ {sup.rating}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-[#E32236]/10 border border-[#E32236]/30 text-[#E32236] text-xs font-medium">
            {error}
          </div>
        )}

        <div className={`flex items-center justify-between pt-3 border-t ${divider}`}>
          <div className="text-xs font-semibold">
            {t.selectedCount}:{' '}
            <span className="text-[#E32236] font-mono-code tabular-nums text-sm">
              {selectedIds.length}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${bgSubtle}`}
            >
              {t.cancel}
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={handleSendInvitations}
              className="px-5 py-2 rounded-lg bg-[#E32236] hover:bg-[#C81B2D] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {sending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{t.sendInvitations}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
