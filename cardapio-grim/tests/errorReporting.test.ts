import assert from 'node:assert/strict';
import test from 'node:test';
import { restaurantTokenFromPath, shouldReportCatalogResponse } from '../src/services/errorReporting.ts';

const API = 'https://web-production-6e1d8.up.railway.app/api';

test('identifica a empresa pela rota do cardápio', () => {
  assert.equal(restaurantTokenFromPath('/LOJA01/checkout'), 'LOJA01');
  assert.equal(restaurantTokenFromPath('/privacy'), '');
  assert.equal(restaurantTokenFromPath('/privacy', '?restaurant=LOJA01'), 'LOJA01');
  assert.equal(restaurantTokenFromPath('/terms', '?restaurant=../segredo'), '');
});

test('captura erros da API e não recursa na rota de telemetria', () => {
  assert.equal(shouldReportCatalogResponse(`${API}/orders/LOJA01/`, 422), true);
  assert.equal(shouldReportCatalogResponse(`${API}/system/log-error/`, 500), false);
  assert.equal(shouldReportCatalogResponse('https://viacep.com.br/ws/', 500), false);
});
