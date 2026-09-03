import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Cookie, Settings2, X } from 'lucide-react';
import { useLegalDocuments } from './LegalDocumentsContext.tsx';
import {
  COOKIE_PREFERENCE_STORAGE_KEY,
  createCookiePreference,
  parseCookiePreference,
  type CookieChoice,
  type CookiePreference,
} from './cookieConsent.ts';

interface CookiePreferencesContextValue {
  preference: CookiePreference | null;
  choose: (choice: CookieChoice, custom?: { analytics: boolean; marketing: boolean }) => void;
  openPreferences: () => void;
}

const CookiePreferencesContext = createContext<CookiePreferencesContextValue | null>(null);
const choiceButtonClass = 'rounded-xl border border-slate-400 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200';

export function CookiePreferencesProvider({ children }: { children: ReactNode }) {
  const { getDocument, loading: legalLoading } = useLegalDocuments();
  const policyVersion = getDocument('privacy')?.version ?? 'unavailable';
  const [preference, setPreference] = useState<CookiePreference | null>(null);
  const [ready, setReady] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (legalLoading) return;
    const stored = parseCookiePreference(localStorage.getItem(COOKIE_PREFERENCE_STORAGE_KEY), policyVersion);
    setPreference(stored);
    setAnalytics(stored?.categories.analytics ?? false);
    setMarketing(stored?.categories.marketing ?? false);
    setReady(true);
  }, [legalLoading, policyVersion]);

  useEffect(() => {
    if (!customizing) return;
    dialogRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCustomizing(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [customizing]);

  const choose = useCallback((choice: CookieChoice, custom?: { analytics: boolean; marketing: boolean }) => {
    const next = createCookiePreference(choice, policyVersion, new Date(), custom);
    localStorage.setItem(COOKIE_PREFERENCE_STORAGE_KEY, JSON.stringify(next));
    setPreference(next);
    setAnalytics(next.categories.analytics);
    setMarketing(next.categories.marketing);
    setCustomizing(false);
  }, [policyVersion]);

  const openPreferences = useCallback(() => {
    setAnalytics(preference?.categories.analytics ?? false);
    setMarketing(preference?.categories.marketing ?? false);
    setCustomizing(true);
  }, [preference]);

  const value = useMemo(() => ({ preference, choose, openPreferences }), [choose, openPreferences, preference]);

  return (
    <CookiePreferencesContext.Provider value={value}>
      {children}
      {ready && !preference && !customizing && (
        <section role="dialog" aria-label="Preferências de cookies" aria-describedby="cookie-summary" className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-4xl rounded-2xl border border-slate-300 bg-white p-5 text-slate-900 shadow-2xl sm:inset-x-6 sm:p-6">
          <div className="flex items-start gap-3"><Cookie className="mt-0.5 h-6 w-6 shrink-0 text-teal-700" aria-hidden="true" /><div><h2 className="font-black">Sua privacidade, sua escolha</h2><p id="cookie-summary" className="mt-1 text-sm leading-6 text-slate-600">Usamos armazenamento estritamente necessário para o cardápio e o pedido. Tags analíticas e de marketing só carregam se você permitir.</p></div></div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => choose('reject')} className={choiceButtonClass}>Rejeitar</button>
            <button type="button" onClick={openPreferences} className={`${choiceButtonClass} inline-flex items-center justify-center gap-2`}><Settings2 className="h-4 w-4" aria-hidden="true" /> Personalizar</button>
            <button type="button" onClick={() => choose('accept')} className={choiceButtonClass}>Aceitar</button>
          </div>
        </section>
      )}

      {ready && customizing && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4">
          <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title" className="w-full max-w-lg rounded-2xl bg-white p-6 text-slate-900 shadow-2xl focus:outline-none">
            <div className="flex items-start justify-between gap-4"><div><h2 id="cookie-settings-title" className="text-xl font-black">Personalizar cookies</h2><p className="mt-1 text-sm text-slate-600">Ative somente as categorias que desejar.</p></div><button type="button" onClick={() => setCustomizing(false)} aria-label="Fechar preferências" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200"><X className="h-5 w-5" aria-hidden="true" /></button></div>
            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-bold">Estritamente necessários</p><p className="mt-1 text-xs leading-5 text-slate-600">Mantêm carrinho, entrega, segurança e sua preferência.</p></div><span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">Sempre ativos</span></div></div>
              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 p-4"><span><span className="block font-bold">Análise de uso</span><span className="mt-1 block text-xs leading-5 text-slate-600">Ajuda a entender o uso do cardápio por meio do Google Tag Manager.</span></span><input type="checkbox" checked={analytics} onChange={event => setAnalytics(event.target.checked)} className="mt-1 h-5 w-5 accent-teal-700 focus:ring-4 focus:ring-teal-100" /></label>
              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 p-4"><span><span className="block font-bold">Marketing</span><span className="mt-1 block text-xs leading-5 text-slate-600">Permite mensuração e campanhas não essenciais.</span></span><input type="checkbox" checked={marketing} onChange={event => setMarketing(event.target.checked)} className="mt-1 h-5 w-5 accent-teal-700 focus:ring-4 focus:ring-teal-100" /></label>
            </div>
            <button type="button" onClick={() => choose('customize', { analytics, marketing })} className="mt-6 w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-200">Salvar preferências</button>
          </section>
        </div>
      )}
    </CookiePreferencesContext.Provider>
  );
}

export function useCookiePreferences() {
  const context = useContext(CookiePreferencesContext);
  if (!context) throw new Error('useCookiePreferences deve ser usado dentro de CookiePreferencesProvider.');
  return context;
}
