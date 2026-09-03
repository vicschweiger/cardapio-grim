export const COOKIE_PREFERENCE_STORAGE_KEY = 'grim_cookie_preferences';
export const COOKIE_PREFERENCE_SCHEMA_VERSION = 1;
export const COOKIE_PREFERENCE_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export type CookieChoice = 'accept' | 'reject' | 'customize';

export interface CookieCategories {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

export interface CookiePreference {
  version: number;
  policyVersion: string;
  choice: CookieChoice;
  categories: CookieCategories;
  savedAt: string;
  expiresAt: string;
}

export const categoriesForChoice = (
  choice: CookieChoice,
  custom: Pick<CookieCategories, 'analytics' | 'marketing'> = { analytics: false, marketing: false },
): CookieCategories => {
  if (choice === 'accept') return { necessary: true, analytics: true, marketing: true };
  if (choice === 'reject') return { necessary: true, analytics: false, marketing: false };
  return { necessary: true, analytics: Boolean(custom.analytics), marketing: Boolean(custom.marketing) };
};

export const createCookiePreference = (
  choice: CookieChoice,
  policyVersion: string,
  now = new Date(),
  custom?: Pick<CookieCategories, 'analytics' | 'marketing'>,
): CookiePreference => ({
  version: COOKIE_PREFERENCE_SCHEMA_VERSION,
  policyVersion,
  choice,
  categories: categoriesForChoice(choice, custom),
  savedAt: now.toISOString(),
  expiresAt: new Date(now.getTime() + COOKIE_PREFERENCE_MAX_AGE_MS).toISOString(),
});

export const parseCookiePreference = (
  raw: string | null,
  policyVersion: string,
  now = new Date(),
): CookiePreference | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookiePreference>;
    if (
      parsed.version !== COOKIE_PREFERENCE_SCHEMA_VERSION
      || parsed.policyVersion !== policyVersion
      || !['accept', 'reject', 'customize'].includes(parsed.choice ?? '')
      || !parsed.categories
      || parsed.categories.necessary !== true
      || typeof parsed.categories.analytics !== 'boolean'
      || typeof parsed.categories.marketing !== 'boolean'
      || typeof parsed.savedAt !== 'string'
      || typeof parsed.expiresAt !== 'string'
    ) return null;
    const savedAt = new Date(parsed.savedAt);
    const expiresAt = new Date(parsed.expiresAt);
    if (
      Number.isNaN(savedAt.getTime())
      || Number.isNaN(expiresAt.getTime())
      || expiresAt <= now
      || expiresAt.getTime() - savedAt.getTime() > COOKIE_PREFERENCE_MAX_AGE_MS
    ) return null;
    return parsed as CookiePreference;
  } catch {
    return null;
  }
};

export const shouldLoadNonEssentialTags = (preference: CookiePreference | null) => (
  preference?.categories.analytics === true
);

export const isValidGtmContainerId = (value: string | null | undefined) => (
  /^GTM-[A-Z0-9]+$/i.test(String(value ?? '').trim())
);
