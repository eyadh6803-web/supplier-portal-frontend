import React from 'react';
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  Language,
  PurchaseRequest,
  ScreenId,
  SupplierOffer,
  ThemeMode,
  User
} from '../../types/procurement';
import { getThemeClasses } from '../../utils/themeClasses';

interface SupplierRequestsScreenProps {
  theme: ThemeMode;
  lang: Language;
  currentUser: User;
  requests: PurchaseRequest[];
  offers: SupplierOffer[];
  onSelectRequest: (requestId: string) => void;
  onNavigate: (screen: ScreenId) => void;
}

export const SupplierRequestsScreen: React.FC<SupplierRequestsScreenProps> = ({
  theme,
  lang,
  currentUser,
  requests,
  offers,
  onSelectRequest,
  onNavigate
}) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const { isDark, bgSurface, bgSubtle, textMuted, divider } = getThemeClasses(theme);

  const supplierId = currentUser.supplierId || 'SUP-01';
  const invitedReqs = requests.filter((r) => r.invitedSupplierIds?.includes(supplierId));

  return (
    <div className="space-y-6">
      <div className={`pb-5 border-b ${divider}`}>
        <div className="text-xs font-semibold text-[#E32236] mb-1">
          {isRtl
            ? currentUser.companyNameAr || 'شركة تك سبلاي المحدودة'
            : currentUser.companyName || 'TechSupply Ltd.'}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.supplierPortalTitle}</h1>
        <p className={`text-sm mt-1 ${textMuted}`}>{t.supplierPortalSub}</p>
      </div>

      {invitedReqs.length === 0 ? (
        <div className={`p-14 rounded-xl border text-center ${bgSurface}`}>
          <Building2 className={`w-9 h-9 mx-auto mb-3 ${textMuted}`} />
          <p className="font-semibold text-sm">{t.noSupplierRequests}</p>
        </div>
      ) : (
        <div className={`rounded-xl border overflow-hidden ${bgSurface}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className={`border-b ${divider} text-xs font-semibold ${bgSubtle} ${textMuted}`}>
                  <th className="py-3 px-5 text-start">{t.reqTitle}</th>
                  <th className="py-3 px-4 text-end">{t.quantity}</th>
                  <th className="py-3 px-4 text-end">{t.deadlineCol}</th>
                  <th className="py-3 px-4 text-start">{t.myOfferStatus}</th>
                  <th className="py-3 px-4 text-end"></th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDark ? 'divide-white/[0.06]' : 'divide-slate-900/[0.06]'
                } text-sm`}
              >
                {invitedReqs.map((req) => {
                  const hasSubmitted = offers.some(
                    (o) => o.requestId === req.id && o.supplierId === supplierId
                  );
                  return (
                    <tr
                      key={req.id}
                      onClick={() => {
                        onSelectRequest(req.id);
                        onNavigate(8);
                      }}
                      className="cursor-pointer transition hover:bg-[#E32236]/[0.04]"
                    >
                      <td className="py-4 px-5">
                        <div className="font-semibold">{isRtl ? req.titleAr : req.title}</div>
                        <div className="font-mono-code text-xs font-semibold text-[#E32236] mt-0.5">
                          {req.id}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-end font-mono-code tabular-nums font-medium whitespace-nowrap">
                        {req.quantity} {t.units}
                      </td>
                      <td className="py-4 px-4 text-end font-mono-code tabular-nums text-xs whitespace-nowrap">
                        {req.deliveryDate}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                            hasSubmitted
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-sm ${
                              hasSubmitted ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          <span>{hasSubmitted ? t.offerSubmitted : t.offerNotSubmitted}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-end whitespace-nowrap">
                        <span className="text-xs font-semibold text-[#E32236] inline-flex items-center gap-1">
                          <span>{t.uploadQuotationBtn}</span>
                          {isRtl ? (
                            <ChevronLeft className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
