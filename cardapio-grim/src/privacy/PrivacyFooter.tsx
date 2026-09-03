import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useCookiePreferences } from './CookiePreferences.tsx';
import { useLegalDocuments } from './LegalDocumentsContext.tsx';
import { legalDocumentHref, normalizeRestaurantToken } from './legalNavigation.ts';

export function PrivacyFooter() {
  const { getDocument } = useLegalDocuments();
  const { openPreferences } = useCookiePreferences();
  const { company_slug } = useParams<{ company_slug?: string }>();
  const [searchParams] = useSearchParams();
  const restaurantToken = normalizeRestaurantToken(company_slug || searchParams.get('restaurant'));
  const terms = getDocument('terms');
  const privacy = getDocument('privacy');
  const linkClass = 'rounded-md font-semibold underline decoration-slate-300 underline-offset-4 transition-colors hover:text-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100';

  return (
    <footer className="menu-footer relative z-20 px-4 py-7 text-center text-sm text-slate-600">
      <nav aria-label="Privacidade e documentos" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
        <Link to={legalDocumentHref('terms', restaurantToken)} className={linkClass}>Termos{terms ? ` — versão ${terms.version}` : ''}</Link>
        <Link to={legalDocumentHref('privacy', restaurantToken)} className={linkClass}>Política de Privacidade{privacy ? ` — versão ${privacy.version}` : ''}</Link>
        <button type="button" onClick={openPreferences} className={linkClass}>Preferências de cookies</button>
      </nav>
    </footer>
  );
}
