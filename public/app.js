import { HOME_CONTENT, createProductCardMarkup, renderList } from './home-data.js';

const money = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const cart = JSON.parse(localStorage.getItem('barto-cart') || '{}');
let catalog = [], shippingOptions = [], selectedShipping = null;
const $ = selector => document.querySelector(selector);
const drawer = $('#drawer');
let accountMode = 'register';
const accountMessage = text => { $('#accountMessage').textContent = text || ''; };
async function loadAccount() {
  const response = await fetch('/api/auth/me');
  if (!response.ok) return;
  const { customer } = await response.json();
  document.querySelectorAll('.orders-link').forEach(link => { link.href = '/meus-pedidos.html'; });
  $('#accountBox').hidden = true; $('#deliveryForm').hidden = false;
  $('#email').value = customer.email; $('#name').value = customer.name || ''; $('#phone').value = customer.phone || '';
}
$('#hidePassword').onchange = event => { $('#accountPassword').type = event.target.checked ? 'password' : 'text'; };
$('#accountMode').onclick = () => { accountMode = accountMode === 'register' ? 'login' : 'register'; $('#accountSubmit').textContent = accountMode === 'register' ? 'Criar conta e continuar' : 'Entrar e continuar'; $('#accountMode').textContent = accountMode === 'register' ? 'Já tenho uma conta' : 'Quero criar uma conta'; accountMessage(''); };
$('#accountSubmit').onclick = async () => {
  const button = $('#accountSubmit'); button.disabled = true; accountMessage('');
  try {
    const response = await fetch(`/api/auth/${accountMode}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:$('#accountEmail').value.trim(), password:$('#accountPassword').value }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Não foi possível acessar sua conta.');
    $('#accountBox').hidden = true; $('#deliveryForm').hidden = false; $('#email').value = data.customer.email;
  } catch (error) { accountMessage(error.message); } finally { button.disabled = false; }
};
const veil = $('#veil');

function persist() { localStorage.setItem('barto-cart', JSON.stringify(cart)); }
function cartArray() { return Object.entries(cart).filter(([, quantity]) => quantity > 0).map(([id, quantity]) => ({ id, quantity })); }
function subtotal() { return cartArray().reduce((sum, item) => { const product = catalog.find(entry => entry.id === item.id); return sum + (product?.priceCents || 0) * item.quantity; }, 0); }
function renderCount() { $('#count').textContent = cartArray().reduce((sum, item) => sum + item.quantity, 0); }
function open() { drawer.classList.add('on'); veil.classList.add('on'); }
function close() { drawer.classList.remove('on'); veil.classList.remove('on'); }

function addProduct(productId) {
  cart[productId] = (cart[productId] || 0) + 1;
  persist();
  renderCart();
  open();
}

async function loadCatalog() {
  catalog = await fetch('/api/catalog').then(response => response.json());
  $('#products').innerHTML = catalog.length
    ? catalog.map(createProductCardMarkup).join('')
    : '<p class="empty-state">As canecas voltam para a vitrine em breve. ♡</p>';
  document.querySelectorAll('.add').forEach(button => { button.onclick = () => addProduct(button.dataset.id); });
  renderCount();
}

$('#cartOpen').onclick = open;
loadAccount();
$('#cartClose').onclick = close;
veil.onclick = close;
$('#menuToggle').onclick = () => {
  const nav = $('.site-header nav');
  const isOpen = nav.classList.toggle('on');
  $('#menuToggle').setAttribute('aria-expanded', String(isOpen));
};

function renderCart() {
  const items = cartArray();
  $('#cartItems').innerHTML = items.length ? items.map(item => {
    const product = catalog.find(entry => entry.id === item.id);
    return `<div class="cartItem"><div><b>${product?.name || item.id}</b><div>${product ? money(product.priceCents) : ''}</div></div><div class="qty"><button data-minus="${item.id}" aria-label="Diminuir quantidade">−</button><b>${item.quantity}</b><button data-plus="${item.id}" aria-label="Aumentar quantidade">+</button></div></div>`;
  }).join('') : '<p>Seu carrinho está vazio 🐾</p>';
  document.querySelectorAll('[data-minus]').forEach(button => { button.onclick = () => { cart[button.dataset.minus]--; if (cart[button.dataset.minus] <= 0) delete cart[button.dataset.minus]; persist(); selectedShipping = null; renderCart(); }; });
  document.querySelectorAll('[data-plus]').forEach(button => { button.onclick = () => { cart[button.dataset.plus]++; persist(); selectedShipping = null; renderCart(); }; });
  $('#subtotal').textContent = money(subtotal());
  $('#shipPrice').textContent = selectedShipping ? `R$ ${selectedShipping.price.toFixed(2).replace('.', ',')}` : '—';
  const shipping = selectedShipping ? Math.round(selectedShipping.price * 100) : 0;
  $('#grand').textContent = money(subtotal() + shipping);
  renderCount();
}

$('#cep').oninput = event => {
  const value = event.target.value.replace(/\D/g, '').slice(0, 8);
  event.target.value = value.length > 5 ? `${value.slice(0, 5)}-${value.slice(5)}` : value;
};

$('#quote').onclick = async () => {
  const destinationPostalCode = $('#cep').value;
  $('#shipping').innerHTML = '<p>Consultando…</p>';
  selectedShipping = null;
  renderCart();
  try {
    const response = await fetch('/api/shipping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart: cartArray(), destinationPostalCode }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    shippingOptions = data.options || [];
    if (!shippingOptions.length) throw new Error('Nenhuma modalidade disponível para este CEP.');
    $('#shipping').innerHTML = shippingOptions.map(option => `<div class="shippingOption" data-ship="${option.id}"><div><b>${option.name}</b><small>Estimativa total: ${option.estimatedMinDays}–${option.estimatedMaxDays} dias úteis</small></div><b>R$ ${option.price.toFixed(2).replace('.', ',')}</b></div>`).join('');
    document.querySelectorAll('[data-ship]').forEach(element => { element.onclick = () => { selectedShipping = shippingOptions.find(option => String(option.id) === element.dataset.ship); document.querySelectorAll('.shippingOption').forEach(option => option.classList.remove('on')); element.classList.add('on'); renderCart(); }; });
  } catch (error) { $('#shipping').innerHTML = `<div class="error">${error.message}</div>`; }
};

$('#checkout').onclick = async () => {
  if (!cartArray().length) return msg('Adicione pelo menos uma caneca.');
  if (!selectedShipping) return msg('Calcule e escolha o frete.');
  const body = { cart: cartArray(), selectedShippingId: selectedShipping.id, customer: { name: $('#name').value.trim(), email: $('#email').value.trim(), phone: $('#phone').value.trim(), cpf: $('#cpf').value.trim() }, address: { cep: $('#cep').value, street: $('#street').value.trim(), number: $('#number').value.trim(), complement: $('#complement').value.trim(), neighborhood: $('#neighborhood').value.trim(), city: $('#city').value.trim(), state: $('#state').value.trim().toUpperCase() } };
  $('#checkout').disabled = true;
  $('#checkout').textContent = 'Preparando pagamento…';
  try {
    const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    location.href = data.checkoutUrl;
  } catch (error) { msg(error.message); $('#checkout').disabled = false; $('#checkout').textContent = 'Ir para o pagamento'; }
};

function msg(text) { $('#message').innerHTML = `<div class="error">${text}</div>`; }

function renderHomeContent() {
  $('#benefitItems').innerHTML = renderList(HOME_CONTENT.benefits, item => `<article class="benefit"><i class="fa-solid ${item.icon}" aria-hidden="true"></i><div><b>${item.title}</b><small>${item.text}</small></div></article>`);
  $('#steps').innerHTML = renderList(HOME_CONTENT.steps, item => `<article class="step"><span class="step__number">${item.number}</span><i class="step__icon fa-solid ${item.icon}" aria-hidden="true"></i><h3>${item.title}</h3><p>${item.text}</p></article>`);
  $('#testimonials').innerHTML = renderList(HOME_CONTENT.testimonials, item => `<article class="testimonial"><div class="testimonial__avatar" aria-hidden="true">${item.initials}</div><div><span class="stars" aria-label="5 de 5 estrelas"><i class="fa-solid fa-star" aria-hidden="true"></i><i class="fa-solid fa-star" aria-hidden="true"></i><i class="fa-solid fa-star" aria-hidden="true"></i><i class="fa-solid fa-star" aria-hidden="true"></i><i class="fa-solid fa-star" aria-hidden="true"></i></span><p>“${item.quote}”</p><b>${item.name}</b><small>Compra verificada</small></div></article>`);
  $('#finalBenefits').innerHTML = renderList(HOME_CONTENT.finalBenefits, item => `<li><i class="fa-solid ${item.icon}" aria-hidden="true"></i>${item.text}</li>`);
}

renderHomeContent();
await loadCatalog();
renderCart();
