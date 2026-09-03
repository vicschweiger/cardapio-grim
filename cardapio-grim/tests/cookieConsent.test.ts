import assert from 'node:assert/strict';
import test from 'node:test';
import {
  COOKIE_PREFERENCE_MAX_AGE_MS,
  categoriesForChoice,
  createCookiePreference,
  parseCookiePreference,
  shouldLoadNonEssentialTags,
} from '../src/privacy/cookieConsent.ts';

const NOW = new Date('2026-09-03T12:00:00.000Z');

test('Rejeitar mantém somente cookies estritamente necessários', () => {
  const preference = createCookiePreference('reject', '1.0', NOW);
  assert.deepEqual(preference.categories, { necessary: true, analytics: false, marketing: false });
  assert.equal(shouldLoadNonEssentialTags(preference), false);
});

test('Aceitar libera tags analíticas e marketing', () => {
  const preference = createCookiePreference('accept', '1.0', NOW);
  assert.deepEqual(preference.categories, { necessary: true, analytics: true, marketing: true });
  assert.equal(shouldLoadNonEssentialTags(preference), true);
});

test('Personalizar respeita cada categoria sem desativar os necessários', () => {
  assert.deepEqual(categoriesForChoice('customize', { analytics: true, marketing: false }), {
    necessary: true,
    analytics: true,
    marketing: false,
  });
  assert.equal(shouldLoadNonEssentialTags(createCookiePreference(
    'customize', '1.0', NOW, { analytics: false, marketing: true },
  )), false);
});

test('nenhuma tag não essencial é liberada antes de uma escolha válida', () => {
  assert.equal(shouldLoadNonEssentialTags(null), false);
  assert.equal(parseCookiePreference('{inválido', '1.0', NOW), null);
});

test('preferência registra versão, data e expira em no máximo seis meses', () => {
  const preference = createCookiePreference('reject', '2.0', NOW);
  assert.equal(preference.policyVersion, '2.0');
  assert.equal(preference.savedAt, NOW.toISOString());
  assert.equal(new Date(preference.expiresAt).getTime() - NOW.getTime(), COOKIE_PREFERENCE_MAX_AGE_MS);
  assert.deepEqual(parseCookiePreference(JSON.stringify(preference), '2.0', NOW), preference);
  assert.equal(parseCookiePreference(JSON.stringify(preference), '2.0', new Date(preference.expiresAt)), null);
});

test('nova versão da política exige nova escolha', () => {
  const preference = createCookiePreference('accept', '1.0', NOW);
  assert.equal(parseCookiePreference(JSON.stringify(preference), '2.0', NOW), null);
});
