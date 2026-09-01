import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSuperFretePayload,
  buildInfinitePayPayload,
  normalizeShippingOptions
} from '../server/integrations.js';

const withEnv = (values, fn) => {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    process.env[key] = value;
  }
  try { return fn(); }
  finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

test('SuperFrete usa 600 g por unidade e seguro obrigatório no subtotal', () => {
  withEnv({
    ORIGIN_POSTAL_CODE: '30140071',
    PACKAGE_WEIGHT_KG: '0.6',
    PACKAGE_HEIGHT_CM: '15',
    PACKAGE_WIDTH_CM: '15',
    PACKAGE_LENGTH_CM: '15'
  }, () => {
    const payload = buildSuperFretePayload({
      destinationPostalCode: '01310100',
      insuranceValueReais: 99.8,
      services: '1,2',
      items: [{ id: 'cafe-caos', quantity: 2 }]
    });

    assert.equal(payload.from.postal_code, '30140071');
    assert.equal(payload.to.postal_code, '01310100');
    assert.equal(payload.services, '1,2');
    assert.equal(payload.options.insurance_value, 99.8);
    assert.equal(payload.options.use_insurance_value, true);
    assert.equal(payload.products.length, 1);
    assert.equal(payload.products[0].quantity, 2);
    assert.equal(payload.products[0].weight, 0.6);
    assert.equal(payload.products[0].height, 15);
  });
});

test('SuperFrete rejeita CEP de origem não configurado', () => {
  withEnv({ ORIGIN_POSTAL_CODE: '00000000' }, () => {
    assert.throws(() => buildSuperFretePayload({
      destinationPostalCode: '01310100',
      insuranceValueReais: 49.9,
      items: [{ id: 'cafe-caos', quantity: 1 }]
    }), /CEP de origem/);
  });
});

test('InfinitePay recebe produtos e frete em centavos com URLs públicas', () => {
  withEnv({
    INFINITEPAY_HANDLE: 'bartolomeu',
    PUBLIC_BASE_URL: 'https://lojinhadobartolomeu.com.br/'
  }, () => {
    const payload = buildInfinitePayPayload({
      order: { id: 'BARTO-123', shipping: { name: 'PAC' } },
      items: [{ name: 'Caneca Café & Caos', quantity: 2, priceCents: 4990 }],
      shippingCents: 2390,
      customer: { name: 'Cliente', email: 'cliente@example.com', phone: '+5531999999999' },
      address: { cep: '30140-071', street: 'Rua A', neighborhood: 'Centro', number: '10', complement: '' }
    });

    assert.equal(payload.handle, 'bartolomeu');
    assert.equal(payload.order_nsu, 'BARTO-123');
    assert.equal(payload.redirect_url, 'https://lojinhadobartolomeu.com.br/obrigado.html');
    assert.equal(payload.webhook_url, 'https://lojinhadobartolomeu.com.br/api/webhooks/infinitepay');
    assert.deepEqual(payload.items.at(-1), { quantity: 1, price: 2390, description: 'Frete PAC' });
    assert.equal(payload.address.cep, '30140071');
  });
});

test('normalização ignora serviço com erro ou preço zerado', () => {
  const result = normalizeShippingOptions([
    { id: 1, name: 'PAC', price: '20.50', delivery_time: 7 },
    { id: 2, name: 'SEDEX', price: '0', delivery_time: 2 },
    { id: 17, name: 'Mini', error: 'indisponível', price: '10.00' }
  ]);

  assert.deepEqual(result, [{
    id: '1',
    name: 'PAC',
    price: 20.5,
    deliveryTime: 7,
    raw: { id: 1, name: 'PAC', price: '20.50', delivery_time: 7 }
  }]);
});
