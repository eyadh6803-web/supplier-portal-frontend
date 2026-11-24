import React, { useCallback, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Globe,
  Moon,
  RefreshCw,
  Sun,
  UserPlus,
  X
} from 'lucide-react';
import { DEFAULT_PORTAL_PROFILES } from '../../data/mockData';
import { TRANSLATIONS } from '../../i18n/translations';
import { ProcuraApiService } from '../../services/procuraApi';
import { Language, ScreenId, ThemeMode, User, UserRole } from '../../types/procurement';
import { getThemeClasses } from '../../utils/themeClasses';
import { ProcuraLogo } from '../common/ProcuraLogo';
import { LoginRoleCardsScene, PortalCardSpec } from '../three/LoginRoleCardsScene';

interface LoginScreenProps {
  theme: ThemeMode;
  lang: Language;
  onToggleTheme: () => void;
  onToggleLang: () => void;
  onAuthenticated: (user: User, targetScreen?: ScreenId) => void;
}

const PORTALS: PortalCardSpec[] = [
  {
    role: 'requester',
    index: '01',
    deptEn: 'Operations & Requisitioning',
    deptAr: 'العمليات وطلبات الشراء'
  },
  {
    role: 'officer',
    index: '02',
    deptEn: 'Strategic Sourcing',
    deptAr: 'المشتريات الاستراتيجية'
  },
  {
    role: 'manager',
    index: '03',
    deptEn: 'Executive Governance',
    deptAr: 'الاعتماد والحوكمة'
  },
  {
    role: 'supplier',
    index: '04',
    deptEn: 'External Vendor Network',
    deptAr: 'شبكة الموردين المعتمدين'
  }
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  theme,
  lang,
  onToggleTheme,
  onToggleLang,
  onAuthenticated
}) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const { isDark, bgMain, bgSurface, bgSubtle, textMuted, divider } = getThemeClasses(theme);

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectPortal = useCallback((role: UserRole) => {
    setSelectedRole(role);
    setIsDrawerOpen(true);
    setAuthError('');
    setErrors({});
    window.setTimeout(() => {
      emailInputRef.current?.focus();
    }, 260);
  }, []);

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedRole(null);
    setAuthError('');
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const errs: { name?: string; email?: string; password?: string } = {};
    if (isRegisterMode && !fullName.trim()) errs.name = t.requiredField;
    if (!email.trim()) errs.email = t.requiredField;
    if (!password.trim()) errs.password = t.requiredField;
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const activeRole = selectedRole || 'requester';
    const currentPortal = PORTALS.find((p) => p.role === activeRole) || PORTALS[0];

    setLoading(true);
    try {
      if (isRegisterMode) {
        const res = await ProcuraApiService.register({
          name: fullName.trim(),
          nameAr: fullName.trim(),
          email: email.trim(),
          password,
          role: activeRole,
          department: currentPortal.deptEn,
          departmentAr: currentPortal.deptAr
        });
        setLoading(false);
        if (res?.user) {
          onAuthenticated(res.user);
        } else {
          setAuthError(isRtl ? 'تعذر إنشاء الحساب، تأكد من البيانات' : 'Registration failed.');
        }
        return;
      }

      const res = await ProcuraApiService.login(email, password);
      setLoading(false);
      if (res?.user) {
        onAuthenticated(res.user);
      } else if (!ProcuraApiService.isLive() && email.includes('@')) {
        const profileTemplate =
          DEFAULT_PORTAL_PROFILES.find((u) => u.role === activeRole) ||
          DEFAULT_PORTAL_PROFILES[0];
        const rawHandle = email.trim().split('@')[0] || profileTemplate.name;
        const derivedName = rawHandle
          .split(/[._-]+/)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
        onAuthenticated({
          ...profileTemplate,
          name: derivedName || profileTemplate.name,
          email: email.trim()
        });
      } else {
        setAuthError(t.invalidCreds);
      }
    } catch (err) {
      setLoading(false);
      setAuthError(err instanceof Error ? err.message : t.invalidCreds);
    }
  };

  const activePortalRole: UserRole = selectedRole || 'requester';
  const stageShellBg = isDark ? 'bg-[#090B10] text-[#F2F3F5]' : bgMain;
  const headerControlBg = isDark
    ? 'bg-[#191C24] border-white/[0.1] text-[#F2F3F5]'
    : bgSurface;
  const drawerSurface = isDark
    ? 'bg-[#191C24] border-white/[0.12] text-[#F2F3F5] ring-1 ring-inset ring-white/[0.04]'
    : `${bgSurface} border-slate-900/[0.1]`;
  const drawerSubtle = isDark ? 'bg-[#0C0F16] border-white/[0.1]' : bgSubtle;

  return (
    <div className={`min-h-screen relative overflow-hidden flex ${stageShellBg}`}>
      {/* Clean Obsidian Command Center Stage (#090B10) with restrained crimson focal depth */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse 56% 52% at 45% 56%, rgba(227, 34, 54, 0.08) 0%, rgba(9, 11, 16, 0.94) 52%, #090B10 85%)'
              : 'radial-gradient(ellipse 60% 54% at 45% 56%, rgba(227, 34, 54, 0.05) 0%, rgba(226, 232, 240, 0.25) 45%, rgba(246, 247, 249, 0) 80%)'
          }}
        />
      </div>

      {/* Main 3D Access Cards Stage */}
      <div
        className={`relative z-10 flex-1 flex flex-col justify-between transition-all duration-500 ease-out ${
          isDrawerOpen ? (isRtl ? 'lg:pl-[440px]' : 'lg:pr-[440px]') : ''
        }`}
      >
        {/* Clean 3-Zone Top Header */}
        <header className={`border-b ${divider}`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
            <ProcuraLogo theme={theme} size="md" />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onToggleLang}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 cursor-pointer ${headerControlBg} hover:border-[#E32236]/60`}
              >
                <Globe className="w-3.5 h-3.5 text-[#E32236]" />
                <span>{lang === 'en' ? 'العربية' : 'English'}</span>
              </button>
              <button
                type="button"
                onClick={onToggleTheme}
                className={`p-2 rounded-lg border transition shrink-0 cursor-pointer ${headerControlBg} hover:border-[#E32236]/60`}
                aria-label="Toggle Theme"
              >
                {isDark ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                )}
              </button>
              {!isDrawerOpen && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(true);
                      handleSelectPortal('requester');
                    }}
                    className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${headerControlBg} hover:border-[#E32236]/60`}
                  >
                    {isRtl ? 'حساب جديد' : 'Register'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(false);
                      handleSelectPortal('requester');
                    }}
                    className="px-4 py-1.5 rounded-lg bg-[#E32236] hover:bg-[#C81B2D] text-white text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {t.signIn}
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Editorial Headline + Interactive 3D Portal Cards */}
        <main className="flex-1 flex flex-col justify-center py-6 lg:py-8">
          <div className="max-w-7xl w-full mx-auto px-6 lg:px-8 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-[#E32236]">
                {t.brandSubtitle}
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-[1.12] text-balance max-w-2xl">
                {t.loginHeroTitle}
              </h1>
              <p className={`text-sm leading-relaxed max-w-xl ${textMuted}`}>{t.loginHeroSub}</p>
            </div>

            <div className="relative">
              <LoginRoleCardsScene
                theme={theme}
                lang={lang}
                portals={PORTALS}
                selectedRole={selectedRole}
                onSelectRole={handleSelectPortal}
                liveEmail={email}
                livePassword={password}
                showPwd={showPwd}
              />
            </div>
          </div>
        </main>

        {/* Quiet Footer */}
        <footer className={`border-t ${divider}`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className={textMuted}>© 2026 PROCURA Enterprise Sourcing</span>
            <span className={textMuted}>
              {isRtl ? 'اختر بوابة الوصول للمتابعة' : 'Select a portal pass to sign in'}
            </span>
          </div>
        </footer>
      </div>

      {/* Slide-Out Sign-In / Register Drawer */}
      <aside
        className={`fixed top-0 bottom-0 ${
          isRtl ? 'left-0 border-r' : 'right-0 border-l'
        } z-30 w-full sm:w-[440px] p-6 sm:p-9 shadow-2xl flex flex-col justify-between transition-transform duration-500 ease-out ${drawerSurface} ${
          isDrawerOpen
            ? 'translate-x-0 pointer-events-auto'
            : isRtl
            ? '-translate-x-full pointer-events-none'
            : 'translate-x-full pointer-events-none'
        }`}
        aria-hidden={!isDrawerOpen}
      >
        <div className="overflow-y-auto">
          <div className={`flex items-center justify-between pb-5 mb-5 border-b ${divider}`}>
            <div className="flex items-center gap-2 text-xs font-medium min-w-0">
              <span className={textMuted}>{t.portalLabel}</span>
              <span aria-hidden="true" className={textMuted}>
                ·
              </span>
              <span className="text-[#E32236] font-semibold truncate">
                {t[`role_${activePortalRole}` as keyof typeof t]}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCloseDrawer}
              className={`p-2 rounded-lg border transition shrink-0 cursor-pointer ${drawerSubtle} hover:border-[#E32236]/50 hover:text-[#E32236]`}
              aria-label={t.cancel}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Auth Mode Toggle (Sign In / Register) */}
          <div className={`grid grid-cols-2 gap-1 p-1 rounded-lg border mb-5 ${drawerSubtle}`}>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setAuthError('');
                setErrors({});
              }}
              className={`py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                !isRegisterMode
                  ? `${isDark ? 'bg-[#191C24] text-[#F2F3F5]' : bgSurface} shadow-xs text-[#E32236]`
                  : textMuted
              }`}
            >
              {t.signIn}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setAuthError('');
                setErrors({});
              }}
              className={`py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                isRegisterMode
                  ? `${isDark ? 'bg-[#191C24] text-[#F2F3F5]' : bgSurface} shadow-xs text-[#E32236]`
                  : textMuted
              }`}
            >
              {isRtl ? 'إنشاء حساب' : 'Register'}
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight">
              {isRegisterMode ? (isRtl ? 'إنشاء حساب جديد' : 'Create Account') : t.welcomeBack}
            </h2>
            <p className={`text-xs mt-1.5 leading-relaxed ${textMuted}`}>
              {isRegisterMode
                ? isRtl
                  ? 'اختر البوابة وسجّل بياناتك للوصول للنظام.'
                  : 'Select your role portal and enter your details to register.'
                : t.signInSub}
            </p>
          </div>

          {/* Synchronized Portal Selector */}
          <div
            className={`grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-lg border mb-5 ${drawerSubtle}`}
          >
            {PORTALS.map((portal) => {
              const active = activePortalRole === portal.role;
              return (
                <button
                  key={portal.role}
                  type="button"
                  onClick={() => handleSelectPortal(portal.role)}
                  className={`px-2 py-1.5 rounded-md text-[11px] font-medium transition truncate cursor-pointer ${
                    active
                      ? `${isDark ? 'bg-[#191C24] text-[#F2F3F5]' : bgSurface} shadow-xs font-semibold text-[#E32236]`
                      : `${textMuted} hover:text-current`
                  }`}
                >
                  {t[`role_${portal.role}` as keyof typeof t]}
                </button>
              );
            })}
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-lg bg-[#E32236]/10 border border-[#E32236]/30 text-[#E32236] text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {isRtl ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={fullName}
                  placeholder={isRtl ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition focus:border-[#E32236] ${drawerSubtle}`}
                />
                {errors.name && <p className="text-xs text-[#E32236] mt-1">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1.5">{t.email}</label>
              <input
                ref={emailInputRef}
                type="email"
                value={email}
                placeholder={t.emailPlaceholder}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition focus:border-[#E32236] ${drawerSubtle}`}
              />
              {errors.email && <p className="text-xs text-[#E32236] mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">{t.password}</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  placeholder={t.passwordPlaceholder}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition focus:border-[#E32236] ${drawerSubtle}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className={`absolute top-1/2 -translate-y-1/2 ${
                    isRtl ? 'left-3' : 'right-3'
                  } ${textMuted} hover:text-[#E32236] cursor-pointer`}
                  aria-label="Toggle password visibility"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[#E32236] mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#E32236] hover:bg-[#C81B2D] text-white font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>
                    {isRegisterMode
                      ? isRtl
                        ? 'جاري التسجيل...'
                        : 'Creating Account...'
                      : t.signingIn}
                  </span>
                </>
              ) : isRegisterMode ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{isRtl ? 'إنشاء حساب' : 'Create Account'}</span>
                </>
              ) : (
                <>
                  <span>{t.signIn}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>
          </form>
        </div>

        <div className={`pt-5 border-t ${divider} text-xs ${textMuted}`}>
          {isRtl
            ? 'جلسة محمية بنظام الصلاحيات المؤسسية.'
            : 'Protected by enterprise role-based access control.'}
        </div>
      </aside>
    </div>
  );
};
