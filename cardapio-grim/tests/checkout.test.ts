import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizePublicPaymentMethods } from '../src/api/checkout.ts';

test('converte apenas os indicadores públicos para a configuração do checkout', () => {
  const config = normalizePublicPaymentMethods({
    pix_enabled: true,
    mercadopago_enabled: true,
    mercadopago_pix_enabled: true,
    mercadopago_card_enabled: false,
    money_enabled: false,
    card_enabled: true,
  });

  assert.deepEqual(config, {
    pix: { enabled: true, key: '', key_type: '', receiver_name: '' },
    mercadopago: {
      enabled: true,
      connected: true,
      pix_enabled: true,
      card_enabled: false,
    },
    money: { enabled: false },
    card_on_delivery: { enabled: true },
  });
  assert.equal(JSON.stringify(config).includes('access_token'), false);
});
