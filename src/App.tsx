import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  FileText,
  Globe,
  History,
  Layers,
  LogOut,
  Moon,
  Plus,
  Sparkles,
  Sun
} from 'lucide-react';
import { ProcuraLogo } from './components/common/ProcuraLogo';
import { AiExtractionScreen } from './components/screens/AiExtractionScreen';
import { ApprovalsScreen } from './components/screens/ApprovalsScreen';
import { AuditLogScreen } from './components/screens/AuditLogScreen';
import { CreateRequestScreen } from './components/screens/CreateRequestScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { RequestDetailsScreen } from './components/screens/RequestDetailsScreen';
import { RequestsListScreen } from './components/screens/RequestsListScreen';
import { SupplierComparisonView } from './components/screens/SupplierComparisonView';
import { SupplierInvitationModal } from './components/screens/SupplierInvitationModal';
import { SupplierRequestsScreen } from './components/screens/SupplierRequestsScreen';
import { SupplierUploadScreen } from './components/screens/SupplierUploadScreen';
import {
  INITIAL_AUDIT_LOG,
  INITIAL_OFFERS,
  INITIAL_REQUESTS,
  REGISTERED_SUPPLIERS
} from './data/mockData';
import { TRANSLATIONS } from './i18n/translations';
import { ProcuraApiService } from './services/procuraApi';
import {
  AuditLogEntry,
  Language,
  PurchaseRequest,
  RequestStatus,
  ScreenId,
  Supplier,
  SupplierOffer,
  ThemeMode,
  ToastMessage,
  User
} from './types/procurement';
import { getThemeClasses } from './utils/themeClasses';

function loadStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => loadStored('procura_theme', 'dark'));
  const [lang, setLang] = useState<Language>(() => loadStored('procura_lang', 'en'));
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadStored('procura_user', null));
  const [activeScreen, setActiveScreen] = useState<ScreenId>(() => loadStored('procura_screen', 1));
  const [selectedRequestId, setSelectedRequestId] = useState<string>(() =>
    loadStored('procura_req_id', 'PR-1048')
  );
  const [selectedOfferId, setSelectedOfferId] = useState<string>(() =>
    loadStored('procura_offer_id', 'OFF-204')
  );

  const [requests, setRequests] = useState<PurchaseRequest[]>(() =>
    ProcuraApiService.isLive() ? [] : loadStored('procura_requests', INITIAL_REQUESTS)
  );
  const [offers, setOffers] = useState<SupplierOffer[]>(() =>
    ProcuraApiService.isLive() ? [] : loadStored('procura_offers', INITIAL_OFFERS)
  );
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(() =>
    ProcuraApiService.isLive() ? [] : loadStored('procura_audit', INITIAL_AUDIT_LOG)
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>(REGISTERED_SUPPLIERS);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    localStorage.setItem('procura_theme', JSON.stringify(theme));
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('procura_lang', JSON.stringify(lang));
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('procura_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('procura_screen', JSON.stringify(activeScreen));
  }, [activeScreen]);

  useEffect(() => {
    localStorage.setItem('procura_req_id', JSON.stringify(selectedRequestId));
  }, [selectedRequestId]);

  useEffect(() => {
    localStorage.setItem('procura_offer_id', JSON.stringify(selectedOfferId));
  }, [selectedOfferId]);

  useEffect(() => {
    if (!ProcuraApiService.isLive()) {
      localStorage.setItem('procura_requests', JSON.stringify(requests));
      localStorage.setItem('procura_offers', JSON.stringify(offers));
      localStorage.setItem('procura_audit', JSON.stringify(auditLog));
    }
  }, [requests, offers, auditLog]);

  const hydrateFromBackend = useCallback(async () => {
    if (!ProcuraApiService.isLive()) return;
    setIsLoadingData(true);
    setLoadError(null);
    try {
      const [sessionUser, liveReqs, liveOffers, liveLogs, liveSuppliers] = await Promise.all([
        ProcuraApiService.getCurrentSession().catch(() => null),
        ProcuraApiService.fetchRequests(),
        ProcuraApiService.fetchQuotations(),
        ProcuraApiService.fetchAuditLogs(),
        ProcuraApiService.fetchSuppliers()
      ]);

      if (sessionUser) setCurrentUser(sessionUser);
      if (Array.isArray(liveReqs)) setRequests(liveReqs);
      if (Array.isArray(liveOffers)) setOffers(liveOffers);
      if (Array.isArray(liveLogs)) setAuditLog(liveLogs);
      if (Array.isArray(liveSuppliers)) setSuppliers(liveSuppliers);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to sync with PROCURA backend.');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    hydrateFromBackend();
  }, [hydrateFromBackend]);

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const { isDark, bgMain, bgSurface, bgSubtle, textMuted, divider } = getThemeClasses(theme);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const addAuditEntry = useCallback(
    (action: string, actionAr: string, requestId: string, details: string, detailsAr: string) => {
      const actor = currentUser ? currentUser.name : 'System';
      const actorAr = currentUser ? currentUser.nameAr : 'النظام';
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const entry: AuditLogEntry = {
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: now,
        user: actor,
        userAr: actorAr,
        action,
        actionAr,
        requestId,
        details,
        detailsAr
      };
      setAuditLog((prev) => [entry, ...prev]);
    },
    [currentUser]
  );

  const handleAuthenticated = (user: User, targetScreen?: ScreenId) => {
    setCurrentUser(user);
    if (targetScreen) {
      setActiveScreen(targetScreen);
    } else if (user.role === 'requester' || user.role === 'officer') {
      setActiveScreen(2);
    } else if (user.role === 'manager') {
      setActiveScreen(5);
    } else {
      setActiveScreen(7);
    }
    if (ProcuraApiService.isLive()) {
      hydrateFromBackend();
    }
  };

  const handleSignOut = async () => {
    await ProcuraApiService.logout();
    setCurrentUser(null);
    setActiveScreen(1);
  };

  const currentRequest = useMemo(
    () => requests.find((r) => r.id === selectedRequestId) || requests[0] || INITIAL_REQUESTS[0],
    [requests, selectedRequestId]
  );

  const handleUpdateRequestStatus = (
    requestId: string,
    nextStatus: RequestStatus,
    updatedReq?: PurchaseRequest
  ) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? updatedReq || { ...r, status: nextStatus } : r))
    );
  };

  const handleOfferUploaded = (newOffer: SupplierOffer, requestId: string) => {
    setOffers((prev) => {
      const filtered = prev.filter(
        (o) => !(o.requestId === requestId && o.supplierId === newOffer.supplierId)
      );
      return [...filtered, newOffer];
    });
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId && r.status === 'Submitted' ? { ...r, status: 'OffersReceived' } : r
      )
    );
  };

  const breadcrumbLabel = useMemo(() => {
    switch (activeScreen) {
      case 2:
        return t.navRequests;
      case 3:
        return t.navCreateRequest;
      case 4:
        return `${t.navRequests} / ${currentRequest.id}`;
      case 5:
        return t.navApprovals;
      case 6:
        return t.navAuditLog;
      case 7:
        return t.navSupplierRequests;
      case 8:
        return `${t.navSupplierRequests} / ${currentRequest.id}`;
      case 10:
        return t.navAiReview;
      case 11:
        return t.navComparison;
      default:
        return 'Workspace';
    }
  }, [activeScreen, currentRequest.id, t]);

  const renderAppShell = () => {
    if (!currentUser) return null;
    const role = currentUser.role;

    const navItems: Array<{
      id: ScreenId;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }> = [
      ...(role !== 'supplier' ? [{ id: 2 as ScreenId, label: t.navRequests, icon: FileText }] : []),
      ...(role === 'requester'
        ? [{ id: 3 as ScreenId, label: t.navCreateRequest, icon: Plus }]
        : []),
      ...(role === 'manager'
        ? [{ id: 5 as ScreenId, label: t.navApprovals, icon: CheckCircle2 }]
        : []),
      ...(role === 'officer' || role === 'manager'
        ? [
            { id: 10 as ScreenId, label: t.navAiReview, icon: Sparkles },
            { id: 11 as ScreenId, label: t.navComparison, icon: Layers },
            { id: 6 as ScreenId, label: t.navAuditLog, icon: History }
          ]
        : []),
      ...(role === 'supplier'
        ? [{ id: 7 as ScreenId, label: t.navSupplierRequests, icon: Building2 }]
        : [])
    ];

    return (
      <div className={`min-h-screen flex flex-col lg:flex-row ${bgMain}`}>
        {/* Sidebar */}
        <aside
          className={`w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-e flex flex-col justify-between p-4 lg:p-5 ${bgSurface}`}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => setActiveScreen(role === 'supplier' ? 7 : 2)}
                className="cursor-pointer text-start"
              >
                <ProcuraLogo theme={theme} size="md" />
              </button>
            </div>

            <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveScreen(item.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      active
                        ? 'bg-[#E32236] text-white'
                        : `${textMuted} hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-current`
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className={`hidden lg:block space-y-3 pt-4 border-t ${divider}`}>
            <div className="px-1">
              <div className="text-xs font-bold truncate">
                {isRtl
                  ? currentUser.companyNameAr || currentUser.nameAr
                  : currentUser.companyName || currentUser.name}
              </div>
              <div className={`text-xs mt-0.5 ${textMuted}`}>
                {t[`role_${role}` as keyof typeof t]}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className={`w-full py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${bgSubtle} hover:border-[#E32236]/50 hover:text-[#E32236]`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.logOut}</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace Column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Persistent Top Utility Bar (All Viewports) */}
          <header className={`h-14 border-b px-5 sm:px-8 flex items-center justify-between gap-4 shrink-0 ${bgSurface}`}>
            <div className="flex items-center gap-2 text-xs font-medium min-w-0">
              <span className={textMuted}>PROCURA</span>
              <span aria-hidden="true" className={textMuted}>
                /
              </span>
              <span className="font-semibold truncate">{breadcrumbLabel}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${bgSubtle} hover:border-[#E32236]/50`}
              >
                <Globe className="w-3.5 h-3.5 text-[#E32236]" />
                <span>{lang === 'en' ? 'العربية' : 'English'}</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className={`p-1.5 rounded-lg border cursor-pointer ${bgSubtle} hover:border-[#E32236]/50`}
                aria-label="Toggle Theme"
              >
                {isDark ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                )}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className={`lg:hidden px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${bgSubtle} hover:border-[#E32236]/50`}
                aria-label={t.logOut}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-[1360px] mx-auto w-full">
            {activeScreen === 2 && (
              <RequestsListScreen
                theme={theme}
                lang={lang}
                currentUser={currentUser}
                requests={requests}
                isLoadingData={isLoadingData}
                loadError={loadError}
                onRetryLoad={hydrateFromBackend}
                onSelectRequest={setSelectedRequestId}
                onNavigate={setActiveScreen}
              />
            )}
            {activeScreen === 3 && (
              <CreateRequestScreen
                theme={theme}
                lang={lang}
                currentUser={currentUser}
                onCreated={(newReq) => {
                  setRequests((prev) => [newReq, ...prev]);
                  setSelectedRequestId(newReq.id);
                }}
                onAddAudit={addAuditEntry}
                onToast={showToast}
                onNavigate={setActiveScreen}
              />
            )}
            {activeScreen === 4 && (
              <RequestDetailsScreen
                theme={theme}
                lang={lang}
                currentUser={currentUser}
                request={currentRequest}
                offers={offers}
                auditLog={auditLog}
                onUpdateStatus={handleUpdateRequestStatus}
                onDeleteRequest={(id) => setRequests((prev) => prev.filter((r) => r.id !== id))}
                onSelectOffer={setSelectedOfferId}
                onOpenInviteModal={() => setIsInviteModalOpen(true)}
                onAddAudit={addAuditEntry}
                onToast={showToast}
                onNavigate={setActiveScreen}
              />
            )}
            {activeScreen === 5 && (
              <ApprovalsScreen
                theme={theme}
                lang={lang}
                requests={requests}
                offers={offers}
                onUpdateStatus={handleUpdateRequestStatus}
                onSelectRequest={setSelectedRequestId}
                onAddAudit={addAuditEntry}
                onToast={showToast}
                onNavigate={setActiveScreen}
              />
            )}
            {activeScreen === 6 && (
              <AuditLogScreen theme={theme} lang={lang} auditLog={auditLog} />
            )}
            {activeScreen === 7 && (
              <SupplierRequestsScreen
                theme={theme}
                lang={lang}
                currentUser={currentUser}
                requests={requests}
                offers={offers}
                onSelectRequest={setSelectedRequestId}
                onNavigate={setActiveScreen}
              />
            )}
            {activeScreen === 8 && (
              <SupplierUploadScreen
                theme={theme}
                lang={lang}
                currentUser={currentUser}
                requests={requests}
                selectedRequestId={selectedRequestId}
                offers={offers}
                onOfferUploaded={handleOfferUploaded}
                onAddAudit={addAuditEntry}
                onToast={showToast}
                onNavigate={setActiveScreen}
              />
            )}
            {activeScreen === 10 && (
              <AiExtractionScreen
                theme={theme}
                lang={lang}
                offers={offers}
                selectedOfferId={selectedOfferId}
                onSelectOffer={setSelectedOfferId}
                onOfferVerified={(updatedOffer) =>
                  setOffers((prev) =>
                    prev.map((o) => (o.id === updatedOffer.id ? updatedOffer : o))
                  )
                }
                onSelectRequest={setSelectedRequestId}
                onAddAudit={addAuditEntry}
                onToast={showToast}
                onNavigate={setActiveScreen}
              />
            )}
            {activeScreen === 11 && (
              <SupplierComparisonView
                theme={theme}
                lang={lang}
                requestId={currentRequest.id}
                offers={offers}
                standalone={true}
                onNavigate={setActiveScreen}
              />
            )}
          </main>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`${
        lang === 'ar' ? 'font-ar' : 'font-en'
      } min-h-screen antialiased selection:bg-[#E32236] selection:text-white`}
    >
      {activeScreen === 1 || !currentUser ? (
        <LoginScreen
          theme={theme}
          lang={lang}
          onToggleTheme={() => setTheme(isDark ? 'light' : 'dark')}
          onToggleLang={() => setLang(lang === 'en' ? 'ar' : 'en')}
          onAuthenticated={handleAuthenticated}
        />
      ) : (
        renderAppShell()
      )}

      <SupplierInvitationModal
        isOpen={isInviteModalOpen}
        theme={theme}
        lang={lang}
        request={currentRequest}
        suppliers={suppliers}
        onClose={() => setIsInviteModalOpen(false)}
        onInvited={(reqId, supplierIds) =>
          setRequests((prev) =>
            prev.map((r) => (r.id === reqId ? { ...r, invitedSupplierIds: supplierIds } : r))
          )
        }
        onAddAudit={addAuditEntry}
        onToast={showToast}
      />

      {toast && (
        <div
          className={`fixed bottom-5 ${
            isRtl ? 'left-5' : 'right-5'
          } z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 ${
            toast.type === 'error'
              ? 'bg-[#E32236] text-white border-[#E32236]'
              : 'bg-[#11141B] text-white border-emerald-500/40'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
