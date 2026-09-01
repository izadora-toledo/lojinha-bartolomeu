const prodBase = 'https://api.superfrete.com/api/v0';
const sandboxBase = 'https://sandbox.superfrete.com/api/v0';

function sfBase() {
  return process.env.SUPERFRETE_ENV === 'production' ? prodBase : sandboxBase;
}

function cleanCep(value = '') {
  return String(value).replace(/\D/g, '');
}

function validCep(value) {
  const cleaned = cleanCep(value);
  return /^\d{8}$/.test(cleaned) && cleaned !== '00000000';
}

function positiveNumber(value, fallback, label) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${label} inválido.`);
  return parsed;
}

export function buildSuperFretePayload({ destinationPostalCode, insuranceValueReais, items, services = '1,2' }) {
  if (!validCep(process.env.ORIGIN_POSTAL_CODE)) throw new Error('CEP de origem não configurado ou inválido.');
  if (!validCep(destinationPostalCode)) throw new Error('CEP de destino inválido.');
  if (!Array.isArray(items) || items.length === 0) throw new Error('Itens de frete ausentes.');

  const weight = positiveNumber(process.env.PACKAGE_WEIGHT_KG, 0.6, 'Peso por unidade');
  const height = positiveNumber(process.env.PACKAGE_HEIGHT_CM, 15, 'Altura por unidade');
  const width = positiveNumber(process.env.PACKAGE_WIDTH_CM, 15, 'Largura por unidade');
  const length = positiveNumber(process.env.PACKAGE_LENGTH_CM, 15, 'Comprimento por unidade');
  const insurance = Number(insuranceValueReais);
  if (!Number.isFinite(insurance) || insurance < 0) throw new Error('Valor declarado inválido.');

  return {
    from: { postal_code: cleanCep(process.env.ORIGIN_POSTAL_CODE) },
    to: { postal_code: cleanCep(destinationPostalCode) },
    services,
    options: {
      own_hand: false,
      receipt: false,
      insurance_value: Number(insurance.toFixed(2)),
      use_insurance_value: true
    },
    products: items.map(item => ({
      quantity: Number(item.quantity),
      weight,
      height,
      width,
      length
    }))
  };
}

export async function quoteSuperFrete({ destinationPostalCode, insuranceValueReais, items, services = '1,2' }) {
  if (!process.env.SUPERFRETE_TOKEN) throw new Error('SUPERFRETE_TOKEN não configurado.');
  const payload = buildSuperFretePayload({ destinationPostalCode, insuranceValueReais, items, services });

  const response = await fetch(`${sfBase()}/calculator`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SUPERFRETE_TOKEN}`,
      'User-Agent': process.env.SUPERFRETE_USER_AGENT || 'LojinhaBartolomeu/1.0 (contato@exemplo.com)',
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.message || body?.error || `Falha SuperFrete (${response.status})`);
  return body;
}

export function normalizeShippingOptions(body) {
  const list = Array.isArray(body) ? body : (body?.data || body?.services || []);
  return list
    .filter(item => !item.error)
    .map(item => ({
      id: String(item.id ?? item.service ?? item.service_id ?? ''),
      name: item.name || item.service_name || item.company?.name || 'Frete',
      price: Number(item.custom_price ?? item.price ?? 0),
      deliveryTime: Number(item.custom_delivery_time ?? item.delivery_time ?? 0),
      raw: item
    }))
    .filter(item => item.price > 0);
}

function baseUrl() {
  const raw = process.env.PUBLIC_BASE_URL?.trim();
  if (!raw) throw new Error('PUBLIC_BASE_URL não configurada.');

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('PUBLIC_BASE_URL inválida.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('PUBLIC_BASE_URL inválida.');
  return raw.replace(/\/$/, '');
}

export function buildInfinitePayPayload({ order, items, shippingCents, customer, address }) {
  if (!process.env.INFINITEPAY_HANDLE) throw new Error('INFINITEPAY_HANDLE não configurado.');
  const base = baseUrl();

  return {
    handle: process.env.INFINITEPAY_HANDLE,
    redirect_url: `${base}/obrigado.html`,
    webhook_url: `${base}/api/webhooks/infinitepay`,
    order_nsu: order.id,
    items: [
      ...items.map(item => ({ quantity: item.quantity, price: item.priceCents, description: item.name })),
      { quantity: 1, price: shippingCents, description: `Frete ${order.shipping.name}` }
    ],
    customer: {
      name: customer.name,
      email: customer.email,
      phone_number: customer.phone
    },
    address: {
      cep: cleanCep(address.cep),
      street: address.street,
      neighborhood: address.neighborhood,
      number: address.number,
      complement: address.complement || ''
    }
  };
}

export async function createInfinitePayCheckout(args) {
  const payload = buildInfinitePayPayload(args);
  const response = await fetch('https://api.checkout.infinitepay.io/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.url) throw new Error(body?.message || `Falha InfinitePay (${response.status})`);
  return body;
}

export async function checkInfinitePayPayment({ orderNsu, transactionNsu, slug }) {
  if (!process.env.INFINITEPAY_HANDLE) throw new Error('INFINITEPAY_HANDLE não configurado.');
  const response = await fetch('https://api.checkout.infinitepay.io/payment_check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      handle: process.env.INFINITEPAY_HANDLE,
      order_nsu: orderNsu,
      transaction_nsu: transactionNsu,
      slug
    })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Falha ao confirmar pagamento (${response.status})`);
  return body;
}
