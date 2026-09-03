import type { LegalDocumentType } from './LegalDocumentsContext.tsx';

const SAFE_RESTAURANT_TOKEN = /^[a-z0-9_-]{1,100}$/i;

export const normalizeRestaurantToken = (value: string | null | undefined) => {
  const token = String(value ?? '').trim();
  return SAFE_RESTAURANT_TOKEN.test(token) ? token : '';
};

export const restaurantPath = (restaurantToken: string | null | undefined) => {
  const token = normalizeRestaurantToken(restaurantToken);
  return token ? `/${encodeURIComponent(token)}` : '/';
};

export const legalDocumentHref = (
  type: LegalDocumentType,
  restaurantToken: string | null | undefined,
) => {
  const token = normalizeRestaurantToken(restaurantToken);
  return token ? `/${type}?restaurant=${encodeURIComponent(token)}` : `/${type}`;
};
