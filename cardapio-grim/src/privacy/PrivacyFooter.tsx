import { Link } from 'react-router-dom';
import { useCookiePreferences } from './CookiePreferences.tsx';
import { useLegalDocuments } from './LegalDocumentsContext.tsx';

export function PrivacyFooter() {
  const { getDocument } = useLegalDocuments();
  const { openPreferences } = useCookiePreferences();
  const terms = getDocument('terms');
  const privacy = getDocument('privacy');

  return (
    <footer className="relative z-20 border-t border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-700">
      <nav aria-label="Privacidade e documentos" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
        <Link to="/terms" className="font-semibold underline underline-offset-4 hover:text-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100">Termos{terms ? ` — versão ${terms.version}` : ''}</Link>
        <Link to="/privacy" className="font-semibold underline underline-offset-4 hover:text-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100">Política de Privacidade{privacy ? ` — versão ${privacy.version}` : ''}</Link>
        <button type="button" onClick={openPreferences} className="font-semibold underline underline-offset-4 hover:text-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100">Preferências de cookies</button>
      </nav>
    </footer>
  );
}
