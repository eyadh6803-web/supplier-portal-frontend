import React, { useEffect, useMemo, useState } from 'react';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  ComparisonPriority,
  Language,
  ScreenId,
  SupplierOffer,
  ThemeMode
} from '../../types/procurement';
import { getThemeClasses } from '../../utils/themeClasses';

interface SupplierComparisonViewProps {
  theme: ThemeMode;
  lang: Language;
  requestId: string;
  offers: SupplierOffer[];
  standalone?: boolean;
  onNavigate?: (screen: ScreenId) => void;
}

export const SupplierComparisonView: React.FC<SupplierComparisonViewProps> = ({
  theme,
  lang,
  requestId,
  offers,
  standalone = false,
  onNavigate
}) => {
  const t = TRANSLATIONS[lang];
  const { isDark, bgSurface, bgSubtle, textMuted, divider } = getThemeClasses(theme);

  const reqOffers = offers.filter((o) => o.requestId === requestId);
  const validPrices = reqOffers.filter((o) => o.reviewed && o.totalPrice > 0).map((o) => o.totalPrice);
  const validDays = reqOffers
    .filter((o) => o.reviewed && o.deliveryDays > 0)
    .map((o) => o.deliveryDays);

  const minPrice = validPrices.length ? Math.min(...validPrices) : null;
  const minDays = validDays.length ? Math.min(...validDays) : null;

  const [priority, setPriority] = useState<ComparisonPriority>('balanced');
  const [selectedOffer, setSelectedOffer] = useState<string | null>(reqOffers[0]?.id || null);

  useEffect(() => {
    setSelectedOffer(reqOffers[0]?.id || null);
  }, [requestId, reqOffers.length]);

  const scoredOffers = useMemo(() => {
    if (!reqOffers.length) return [];
    const prices = reqOffers.map((o) => o.totalPrice || 1);
    const loPrice = Math.min(...prices);
    const hiPrice = Math.max(...prices);

    const days = reqOffers.map((o) => o.deliveryDays || 1);
    const loDays = Math.min(...days);
    const hiDays = Math.max(...days);

    const maxWarranty = Math.max(...reqOffers.map((o) => o.warrantyMonths || 12), 12);

    const rows = reqOffers.map((o) => {
      const priceScore =
        hiPrice === loPrice ? 1 : 1 - ((o.totalPrice || hiPrice) - loPrice) / (hiPrice - loPrice + 1);
      const speedScore =
        hiDays === loDays ? 1 : 1 - ((o.deliveryDays || hiDays) - loDays) / (hiDays - loDays + 1);
      const warrantyScore = (o.warrantyMonths || 12) / maxWarranty;

      let composite = priceScore * 0.45 + speedScore * 0.35 + warrantyScore * 0.2;
      if (priority === 'price') composite = priceScore * 0.75 + speedScore * 0.15 + warrantyScore * 0.1;
      if (priority === 'delivery') composite = speedScore * 0.75 + priceScore * 0.15 + warrantyScore * 0.1;
      if (priority === 'warranty') composite = warrantyScore * 0.7 + priceScore * 0.2 + speedScore * 0.1;

      const pct = Math.round(45 + composite * 53);
      return { offer: o, pct };
    });

    const topPct = Math.max(...rows.map((r) => r.pct));
    return rows.map((r) => ({ ...r, isTop: r.pct === topPct }));
  }, [reqOffers, priority]);

  return (
    <div className="space-y-5">
      {standalone && (
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b ${divider}`}>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.comparisonTitle}</h1>
            <p className={`text-sm mt-1 ${textMuted}`}>{t.comparisonSub}</p>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate(4)}
              className={`px-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${bgSurface} hover:border-[#E32236]/50`}
            >
              {t.backToRequests} · <span className="font-mono-code">{requestId}</span>
            </button>
          )}
        </div>
      )}

      {reqOffers.length === 0 ? (
        <div className={`p-10 rounded-xl border text-center text-sm ${bgSubtle} ${textMuted}`}>
          {t.noOffersYet}
        </div>
      ) : (
        <>
          {/* Weighted Commercial Benchmark Bar Chart */}
          <div className={`rounded-xl border overflow-hidden ${bgSurface}`}>
            <div className={`px-5 py-3.5 border-b ${divider} flex flex-wrap items-center justify-between gap-3 ${bgSubtle}`}>
              <div className={`inline-flex flex-wrap items-center gap-1 p-1 rounded-lg border ${bgSurface}`}>
                {(
                  [
                    { id: 'balanced', label: t.priorityBalanced },
                    { id: 'price', label: t.priorityPrice },
                    { id: 'delivery', label: t.priorityDelivery },
                    { id: 'warranty', label: t.priorityWarranty }
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition whitespace-nowrap shrink-0 cursor-pointer ${
                      priority === p.id
                        ? 'bg-[#E32236] text-white font-semibold'
                        : `${textMuted} hover:text-current`
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <span className={`text-xs font-mono-code ${textMuted}`}>{requestId}</span>
            </div>

            <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-900/[0.06]'}`}>
              {scoredOffers.map(({ offer, pct, isTop }) => {
                const isSelected = selectedOffer === offer.id;
                return (
                  <button
                    key={offer.id}
                    type="button"
                    onClick={() => setSelectedOffer(offer.id)}
                    className={`w-full px-5 py-4 text-start transition cursor-pointer ${
                      isSelected ? 'bg-[#E32236]/[0.05]' : 'hover:bg-black/[0.015] dark:hover:bg-white/[0.015]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-sm font-bold ${isSelected ? 'text-[#E32236]' : ''}`}>
                          {offer.supplierName}
                        </span>
                        <span className={`text-xs font-mono-code ${textMuted}`}>{offer.id}</span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono-code tabular-nums">
                        <span>
                          ${offer.totalPrice.toLocaleString()} {offer.currency}
                        </span>
                        <span className={textMuted}>
                          {offer.deliveryDays} {t.daysUnit}
                        </span>
                        <span
                          className={`font-bold ${
                            isTop ? 'text-emerald-500' : isSelected ? 'text-[#E32236]' : ''
                          }`}
                        >
                          {pct}/100
                        </span>
                      </div>
                    </div>

                    <div className={`w-full h-2 rounded-full overflow-hidden ${bgSubtle}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isSelected ? 'bg-[#E32236]' : isTop ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side-by-Side Matrix Table */}
          <div className={`rounded-xl border overflow-hidden ${bgSurface}`}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-start">
                <thead>
                  <tr className={`border-b ${divider} ${bgSubtle}`}>
                    <th className={`p-4 text-start text-xs font-semibold w-52 ${textMuted}`}>
                      {t.categoryCol}
                    </th>
                    {reqOffers.map((offer) => {
                      const isSelected = selectedOffer === offer.id;
                      return (
                        <th
                          key={offer.id}
                          onClick={() => setSelectedOffer(offer.id)}
                          className={`p-4 text-start min-w-[210px] border-s ${divider} cursor-pointer transition ${
                            isSelected ? 'bg-[#E32236]/[0.06]' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`font-bold text-sm ${isSelected ? 'text-[#E32236]' : ''}`}>
                              {offer.supplierName}
                            </span>
                            {!offer.reviewed && (
                              <span className="text-[11px] font-semibold text-amber-500">
                                {t.notReviewedBadge}
                              </span>
                            )}
                          </div>
                          <div className={`text-xs font-mono-code font-normal mt-0.5 ${textMuted}`}>
                            {offer.id}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDark ? 'divide-white/[0.06]' : 'divide-slate-900/[0.06]'
                  } text-sm`}
                >
                  <tr>
                    <td className="p-4 font-semibold">{t.totalPrice}</td>
                    {reqOffers.map((offer) => {
                      const isCheapest =
                        offer.reviewed && minPrice !== null && offer.totalPrice === minPrice;
                      return (
                        <td
                          key={offer.id}
                          onClick={() => setSelectedOffer(offer.id)}
                          className={`p-4 font-mono-code tabular-nums border-s ${divider} cursor-pointer ${
                            isCheapest ? 'bg-emerald-500/[0.07]' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-base font-bold">
                              {offer.totalPrice
                                ? `$${offer.totalPrice.toLocaleString()} ${offer.currency}`
                                : '—'}
                            </span>
                            {isCheapest && (
                              <span className="text-[11px] font-semibold text-emerald-500">
                                {t.cheapestBadge}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  <tr>
                    <td className="p-4 font-semibold">{t.deliveryDuration}</td>
                    {reqOffers.map((offer) => {
                      const isFastest =
                        offer.reviewed && minDays !== null && offer.deliveryDays === minDays;
                      return (
                        <td
                          key={offer.id}
                          onClick={() => setSelectedOffer(offer.id)}
                          className={`p-4 font-mono-code tabular-nums border-s ${divider} cursor-pointer ${
                            isFastest ? 'bg-sky-500/[0.07]' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">
                              {offer.deliveryDays ? `${offer.deliveryDays} ${t.daysUnit}` : '—'}
                            </span>
                            {isFastest && (
                              <span className="text-[11px] font-semibold text-sky-500">
                                {t.fastestBadge}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  <tr>
                    <td className="p-4 font-semibold">{t.paymentTerms}</td>
                    {reqOffers.map((offer) => (
                      <td
                        key={offer.id}
                        onClick={() => setSelectedOffer(offer.id)}
                        className={`p-4 border-s ${divider} cursor-pointer`}
                      >
                        {offer.paymentTerms && offer.paymentTerms.trim() ? offer.paymentTerms : '—'}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-semibold">{t.warrantyDuration}</td>
                    {reqOffers.map((offer) => (
                      <td
                        key={offer.id}
                        onClick={() => setSelectedOffer(offer.id)}
                        className={`p-4 font-mono-code tabular-nums border-s ${divider} cursor-pointer`}
                      >
                        {offer.warrantyMonths ? `${offer.warrantyMonths} ${t.monthsUnit}` : '—'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
