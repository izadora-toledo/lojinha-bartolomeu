const prodBase = 'https://api.superfrete.com/api/v0';
const sandboxBase = 'https://sandbox.superfrete.com/api/v0';

function sfBase() { return process.env.SUPERFRETE_ENV === 'production' ? prodBase : sandboxBase; }
function cleanCep(v='') { return String(v).replace(/\D/g, ''); }

export async function quoteSuperFrete({ destinationPostalCode, insuranceValueReais, services='1,2' }) {
  if (!process.env.SUPERFRETE_TOKEN) throw new Error('SUPERFRETE_TOKEN não configurado.');
  const payload = {
    from: { postal_code: cleanCep(process.env.ORIGIN_POSTAL_CODE) },
    to: { postal_code: cleanCep(destinationPostalCode) },
    services,
    options: {
      own_hand: false,
      receipt: false,
      insurance_value: Number(insuranceValueReais.toFixed(2)),
      use_insurance_value: true
    },
    package: {
      weight: Number(process.env.PACKAGE_WEIGHT_KG || 0.6),
      height: Number(process.env.PACKAGE_HEIGHT_CM || 15),
      width: Number(process.env.PACKAGE_WIDTH_CM || 15),
      length: Number(process.env.PACKAGE_LENGTH_CM || 15)
    }
  };
  const r = await fetch(`${sfBase()}/calculator`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPERFRETE_TOKEN}`,
      'User-Agent': process.env.SUPERFRETE_USER_AGENT || 'LojinhaBartolomeu/1.0 (contato@exemplo.com)',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.message || body?.error || `Falha SuperFrete (${r.status})`);
  return body;
}

export function normalizeShippingOptions(body) {
  const list = Array.isArray(body) ? body : (body?.data || body?.services || []);
  return list
    .filter(x => !x.error)
    .map(x => ({
      id: String(x.id ?? x.service ?? x.service_id ?? ''),
      name: x.name || x.service_name || x.company?.name || 'Frete',
      price: Number(x.custom_price ?? x.price ?? 0),
      deliveryTime: Number(x.custom_delivery_time ?? x.delivery_time ?? 0),
      raw: x
    }))
    .filter(x => x.price > 0);
}

export async function createInfinitePayCheckout({ order, items, shippingCents, customer, address }) {
  if (!process.env.INFINITEPAY_HANDLE) throw new Error('INFINITEPAY_HANDLE não configurado.');
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/$/, '');
  const payload = {
    handle: process.env.INFINITEPAY_HANDLE,
    redirect_url: `${base}/obrigado.html`,
    webhook_url: `${base}/api/webhooks/infinitepay`,
    order_nsu: order.id,
    items: [
      ...items.map(i => ({ quantity: i.quantity, price: i.priceCents, description: i.name })),
      { quantity: 1, price: shippingCents, description: `Frete ${order.shipping.name}` }
    ],
    customer: {
      name: customer.name,
      email: customer.email,
      phone_number: customer.phone
    },
    address: {
      cep: String(address.cep).replace(/\D/g,''),
      street: address.street,
      neighborhood: address.neighborhood,
      number: address.number,
      complement: address.complement || ''
    }
  };
  const r = await fetch('https://api.checkout.infinitepay.io/links', {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok || !body.url) throw new Error(body?.message || `Falha InfinitePay (${r.status})`);
  return body;
}

export async function checkInfinitePayPayment({ orderNsu, transactionNsu, slug }) {
  const r = await fetch('https://api.checkout.infinitepay.io/payment_check', {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
      handle: process.env.INFINITEPAY_HANDLE,
      order_nsu: orderNsu,
      transaction_nsu: transactionNsu,
      slug
    })
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Falha ao confirmar pagamento (${r.status})`);
  return body;
}
