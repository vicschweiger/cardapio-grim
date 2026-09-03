import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCookiePreferences } from './CookiePreferences.tsx';
import { isValidGtmContainerId, shouldLoadNonEssentialTags } from './cookieConsent.ts';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://web-production-6e1d8.up.railway.app/api').replace(/\/$/, '');
const GTM_SCRIPT_ID = 'grim-consented-gtm';

const clearKnownAnalyticsCookies = () => {
  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=', 1)[0]?.trim();
    if (name && (/^_ga/.test(name) || ['_gid', '_gat', '_gcl_au'].includes(name))) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    }
  });
};

declare global {
  interface Window { dataLayer?: unknown[]; }
}

export function GtmConsentLoader() {
  const { company_slug } = useParams<{ company_slug: string }>();
  const { preference } = useCookiePreferences();
  const [containerId, setContainerId] = useState('');

  useEffect(() => {
    if (!company_slug) return;
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/company/get-config/${encodeURIComponent(company_slug)}/`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : {})
      .then((data: { gtm_container_id?: string }) => setContainerId(isValidGtmContainerId(data.gtm_container_id) ? data.gtm_container_id!.trim() : ''))
      .catch(() => undefined);
    return () => controller.abort();
  }, [company_slug]);

  useEffect(() => {
    const existing = document.getElementById(GTM_SCRIPT_ID);
    if (!containerId || !shouldLoadNonEssentialTags(preference)) {
      existing?.remove();
      if (preference) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'grim_consent_revoked', analytics_storage: 'denied', ad_storage: 'denied' });
        clearKnownAnalyticsCookies();
      }
      return;
    }
    if (existing) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.id = GTM_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
    document.head.appendChild(script);
  }, [containerId, preference]);

  return null;
}
