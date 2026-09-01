const money = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const cart = JSON.parse(localStorage.getItem('barto-cart') || '{}');
let catalog = [];
let shippingOptions = [];
let selectedShipping = null;
const $ = selector => document.querySelector(selector);
const drawer = $('#drawer');
const veil = $('#veil');
const checkoutButton = $('#checkout');

function persist() { localStorage.setItem('barto-cart', JSON.stringify(cart)); }
function cartArray() { return Object.entries(cart).filter(([, quantity]) => quantity > 0).map(([id, quantity]) => ({ id, quantity })); }
function subtotal() { return cartArray().reduce((sum, item) => { const product = catalog.find(entry => entry.id === item.id); return sum + (product?.priceCents || 0) * item.quantity; }, 0); }
function renderCount() { $('#count').textContent = cartArray().reduce((sum, item) => sum + item.quantity, 0); }
function open() { drawer.classList.add('on'); veil.classList.add('on'); }
function close() { drawer.classList.remove('on'); veil.classList.remove('on'); }
function resetShipping(reason = '') {
  shippingOptions = [];
  selectedShipping = null;
  $('#shipping').innerHTML = reason ? '<div class="hint">Recalcule o frete antes de continuar.</div>' : '';
  renderTotals();
}
function renderTotals() {
  $('#subtotal').textContent = money(subtotal());
  $('#shipPrice').textContent = selectedShipping ? money(Math.round(selectedShipping.price * 100)) : '—';
  const shippingCents = selectedShipping ? Math.round(selectedShipping.price * 100) : 0;
  $('#grand').textContent = money(subtotal() + shippingCents);
  checkoutButton.disabled = !cartArray().length || !selectedShipping;
  renderCount();
}

async function loadCatalog() {
  const response = await fetch('/api/catalog');
  if (!response.ok) throw new Error('Não foi possível carregar as canecas.');
  catalog = await response.json();
  $('#products').innerHTML = catalog.map(product => `<article class="card"><div class="cardMedia"><img src="${product.image}" alt="${product.name}"><span class="tag">325 ML</span></div><div class="cardBody"><small>CANECAS DO BARTÔ</small><h3>${product.name}</h3><p>${product.description}</p><div class="cardBottom"><b>${money(product.priceCents)}</b><button class="add" data-id="${product.id}" aria-label="Adicionar ${product.name} ao carrinho">+</button></div></div></article>`).join('');
  document.querySelectorAll('.add').forEach(button => button.onclick = () => {
    cart[button.dataset.id] = (cart[button.dataset.id] || 0) + 1;
    persist();
    resetShipping('carrinho alterado');
    renderCart();
    open();
  });
  renderCount();
}

$('#cartOpen').onclick = open;
$('#cartClose').onclick = close;
veil.onclick = close;

function renderCart() {
  const items = cartArray();
  $('#cartItems').innerHTML = items.length ? items.map(item => {
    const product = catalog.find(entry => entry.id === item.id);
    return `<div class="cartItem"><div><b>${product?.name || item.id}</b><div>${product ? money(product.priceCents) : ''}</div></div><div class="qty"><button data-minus="${item.id}" aria-label="Diminuir quantidade">−</button><b>${item.quantity}</b><button data-plus="${item.id}" aria-label="Aumentar quantidade">+</button></div></div>`;
  }).join('') : '<p>Seu carrinho está vazio 🐾</p>';

  document.querySelectorAll('[data-minus]').forEach(button => button.onclick = () => {
    cart[button.dataset.minus]--;
    if (cart[button.dataset.minus] <= 0) delete cart[button.dataset.minus];
    persist();
    resetShipping('carrinho alterado');
    renderCart();
  });
  document.querySelectorAll('[data-plus]').forEach(button => button.onclick = () => {
    cart[button.dataset.plus]++;
    persist();
    resetShipping('carrinho alterado');
    renderCart();
  });
  renderTotals();
}

$('#cep').oninput = event => {
  let value = event.target.value.replace(/\D/g, '').slice(0, 8);
  event.target.value = value.length > 5 ? `${value.slice(0, 5)}-${value.slice(5)}` : value;
  resetShipping('cep alterado');
};

$('#quote').onclick = async () => {
  if (!cartArray().length) return msg('Adicione pelo menos uma caneca antes de calcular o frete.');
  const destinationPostalCode = $('#cep').value;
  $('#shipping').innerHTML = '<p>Consultando PAC e SEDEX…</p>';
  selectedShipping = null;
  renderTotals();
  try {
    const response = await fetch('/api/shipping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart: cartArray(), destinationPostalCode }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    shippingOptions = data.options || [];
    if (!shippingOptions.length) throw new Error('Nenhuma modalidade disponível para este CEP.');
    $('#shipping').innerHTML = shippingOptions.map(option => `<button type="button" class="shippingOption" data-ship="${option.id}"><span><b>${option.name}</b><small>Estimativa total: ${option.estimatedMinDays}–${option.estimatedMaxDays} dias úteis</small></span><b>${money(Math.round(option.price * 100))}</b></button>`).join('');
    document.querySelectorAll('[data-ship]').forEach(element => element.onclick = () => {
      selectedShipping = shippingOptions.find(option => String(option.id) === element.dataset.ship);
      document.querySelectorAll('.shippingOption').forEach(node => node.classList.remove('on'));
      element.classList.add('on');
      renderTotals();
    });
  } catch (error) {
    $('#shipping').innerHTML = `<div class="error">${error.message}</div>`;
    renderTotals();
  }
};

$('#checkout').onclick = async () => {
  if (!cartArray().length) return msg('Adicione pelo menos uma caneca.');
  if (!selectedShipping) return msg('Calcule e escolha o frete.');
  const body = {
    cart: cartArray(),
    selectedShippingId: selectedShipping.id,
    customer: { name: $('#name').value.trim(), email: $('#email').value.trim(), phone: $('#phone').value.trim() },
    address: { cep: $('#cep').value, street: $('#street').value.trim(), number: $('#number').value.trim(), complement: $('#complement').value.trim(), neighborhood: $('#neighborhood').value.trim(), city: $('#city').value.trim(), state: $('#state').value.trim().toUpperCase() }
  };
  checkoutButton.disabled = true;
  checkoutButton.textContent = 'Preparando pagamento…';
  try {
    const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    location.href = data.checkoutUrl;
  } catch (error) {
    msg(error.message);
    checkoutButton.textContent = 'Ir para o pagamento';
    renderTotals();
  }
};

function msg(text) { $('#message').innerHTML = `<div class="error">${text}</div>`; }

try {
  await loadCatalog();
  renderCart();
} catch (error) {
  $('#products').innerHTML = `<div class="error">${error.message}</div>`;
}
