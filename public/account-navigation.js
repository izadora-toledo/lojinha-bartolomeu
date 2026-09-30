const navLinks = '<a href="/sobre.html">Sobre nós</a><a href="/#canecas">Produtos</a><a href="/#como-funciona">Como funciona</a><a href="/#depoimentos">Feedbacks</a><a href="/trocas.html">Troca e Devoluções</a>';
const brand = '<a class="brand" href="/" aria-label="O Gato Bartolomeu, início"><img class="brand__avatar" src="/assets/avatar.png" alt=""><span><b>O Gato Bartolomeu</b><small>OS MELHORES MIMOS VOCÊ ENCONTRA AQUI MEO</small></span></a>';
let header = document.querySelector('.site-header');
if (!header) { header = document.createElement('header'); header.className = 'site-header'; document.body.prepend(header); }
header.innerHTML = `${brand}<nav aria-label="Navegação principal">${navLinks}</nav><div class="header-actions"><a id="ordersNav" class="orders-link" href="/entrar.html">Meus pedidos</a><a class="cart-button" href="/#canecas" aria-label="Ver produtos"><i class="fa-solid fa-cart-shopping" aria-hidden="true"></i></a></div>`;
let footer = document.querySelector('footer');
if (!footer) { footer = document.createElement('footer'); document.body.append(footer); }
footer.className = '';
footer.innerHTML = `<div>${brand.replace('class="brand"', 'class="brand brand--footer"')}<p>Canecas para dias mais gostosos, com café, gatos e uma dose de confusão.</p></div><div class="footer-links"><a href="/sobre.html">Sobre nós</a><a href="/#canecas">Produtos</a><a href="/trocas.html">Troca e Devoluções</a><a href="/privacidade.html">Política de Privacidade</a><a href="/#depoimentos">Contato</a></div><small>© 2026 Bartolomeu. Feito com carinho para cat lovers.</small>`;

fetch('/api/auth/me').then(response => {
  if (response.ok) document.querySelector('#ordersNav')?.setAttribute('href', '/meus-pedidos.html');
}).catch(() => {});
import('./full-cart.js');

