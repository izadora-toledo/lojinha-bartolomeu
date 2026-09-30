const cartButton = document.querySelector('.cart-button');
const money = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const cart = JSON.parse(localStorage.getItem('barto-cart') || '{}');
let catalog = [];
const veil = document.createElement('div'); veil.className = 'veil';
const drawer = document.createElement('aside');
drawer.className = 'drawer'; drawer.setAttribute('aria-label', 'Seu carrinho');
drawer.innerHTML = '<header><h2>Seu carrinho</h2><button type="button" aria-label="Fechar carrinho">×</button></header><div id="sharedCartItems"></div><div class="totalLine grand"><span>Total dos produtos</span><b id="sharedCartTotal">R$ 0,00</b></div><a class="pay" href="/#canecas">Continuar para a loja</a>';
document.body.append(veil, drawer);
function items() { return Object.entries(cart).filter(([, quantity]) => quantity > 0); }
function persist() { localStorage.setItem('barto-cart', JSON.stringify(cart)); }
function close() { drawer.classList.remove('on'); veil.classList.remove('on'); }
function render() {
  const list = items();
  document.querySelector('#sharedCartItems').innerHTML = list.length ? list.map(([id, quantity]) => {
    const product = catalog.find(entry => entry.id === id);
    return `<div class="cartItem"><div><b>${product?.name || 'Caneca Bartolomeu'}</b><div>${product ? money(product.priceCents) : ''}</div></div><div class="qty"><button data-minus="${id}" aria-label="Diminuir quantidade">−</button><b>${quantity}</b><button data-plus="${id}" aria-label="Aumentar quantidade">+</button></div></div>`;
  }).join('') : '<p>Seu carrinho está vazio 🐾</p>';
  document.querySelector('#sharedCartTotal').textContent = money(list.reduce((total, [id, quantity]) => total + (catalog.find(product => product.id === id)?.priceCents || 0) * quantity, 0));
  document.querySelectorAll('[data-minus]').forEach(button => button.onclick = () => { if (--cart[button.dataset.minus] <= 0) delete cart[button.dataset.minus]; persist(); render(); });
  document.querySelectorAll('[data-plus]').forEach(button => button.onclick = () => { cart[button.dataset.plus] = (cart[button.dataset.plus] || 0) + 1; persist(); render(); });
}
cartButton?.addEventListener('click', async event => { event.preventDefault(); drawer.classList.add('on'); veil.classList.add('on'); if (!catalog.length) catalog = await fetch('/api/catalog').then(response => response.json()).catch(() => []); render(); });
drawer.querySelector('button').onclick = close; veil.onclick = close;
