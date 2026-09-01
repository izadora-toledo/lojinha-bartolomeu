import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { CATALOG, priceCart } from './catalog.js';
import { createOrderId, saveOrder, getOrder } from './store.js';
import { quoteSuperFrete, normalizeShippingOptions, createInfinitePayCheckout, checkInfinitePayPayment } from './integrations.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.resolve('public'), { extensions:['html'] }));

const cep = v => /^\d{8}$/.test(String(v || '').replace(/\D/g,''));
const requiredAddress = a => a && cep(a.cep) && a.street && a.number && a.neighborhood && a.city && a.state;

app.get('/api/catalog', (_req,res) => res.json(Object.values(CATALOG)));

app.post('/api/shipping', async (req,res) => {
  try {
    const { cart, destinationPostalCode } = req.body;
    if (!cep(destinationPostalCode)) return res.status(400).json({ error:'CEP inválido.' });
    const priced = priceCart(cart);
    const sf = await quoteSuperFrete({
      destinationPostalCode,
      insuranceValueReais: priced.subtotalCents / 100,
      items: priced.items,
      services: '1,2'
    });
    const minProd = Number(process.env.PRODUCTION_DAYS_MIN || 2);
    const maxProd = Number(process.env.PRODUCTION_DAYS_MAX || 4);
    const options = normalizeShippingOptions(sf).map(o => ({
      id:o.id, name:o.name, price:o.price,
      carrierDays:o.deliveryTime,
      estimatedMinDays:o.deliveryTime + minProd,
      estimatedMaxDays:o.deliveryTime + maxProd
    }));
    res.json({ options, insuranceIncluded:true, insuredValue:priced.subtotalCents/100 });
  } catch (e) { res.status(502).json({ error:e.message }); }
});

app.post('/api/checkout', async (req,res) => {
  try {
    const { cart, selectedShippingId, customer, address } = req.body;
    if (!customer?.name || !customer?.email || !customer?.phone) return res.status(400).json({error:'Dados do comprador incompletos.'});
    if (!requiredAddress(address)) return res.status(400).json({error:'Endereço incompleto.'});
    const priced = priceCart(cart);

    // Recalcula o frete no servidor: o preço enviado pelo navegador nunca é confiado.
    const sf = await quoteSuperFrete({
      destinationPostalCode: address.cep,
      insuranceValueReais: priced.subtotalCents/100,
      items: priced.items,
      services:'1,2'
    });
    const options = normalizeShippingOptions(sf);
    const shipping = options.find(o => String(o.id) === String(selectedShippingId));
    if (!shipping) return res.status(400).json({error:'Modalidade de frete inválida ou indisponível.'});
    const shippingCents = Math.round(shipping.price * 100);

    const order = {
      id:createOrderId(), status:'awaiting_payment', createdAt:new Date().toISOString(),
      items: priced.items.map(({id,name,priceCents,quantity,lineTotalCents}) => ({id,name,priceCents,quantity,lineTotalCents})),
      subtotalCents:priced.subtotalCents,
      shipping:{ id:shipping.id, name:shipping.name, priceCents:shippingCents, carrierDays:shipping.deliveryTime, insuredValueCents:priced.subtotalCents },
      totalCents:priced.subtotalCents + shippingCents,
      customer, address
    };
    await saveOrder(order);
    const checkout = await createInfinitePayCheckout({ order, items:priced.items, shippingCents, customer, address });
    order.checkoutUrl = checkout.url;
    await saveOrder(order);
    res.json({ orderId:order.id, checkoutUrl:checkout.url });
  } catch(e) { res.status(502).json({error:e.message}); }
});

app.get('/api/payment-status', async (req,res) => {
  try {
    const { order_nsu, transaction_nsu, slug } = req.query;
    const order = await getOrder(order_nsu);
    if (!order) return res.status(404).json({error:'Pedido não encontrado.'});
    if (!transaction_nsu || !slug) return res.json({ orderId:order.id, status:order.status });
    const check = await checkInfinitePayPayment({orderNsu:order.id, transactionNsu:transaction_nsu, slug});
    if (check.paid && Number(check.amount) === order.totalCents) {
      order.status='paid'; order.payment={...check, transactionNsu:transaction_nsu, slug, checkedAt:new Date().toISOString()}; await saveOrder(order);
    }
    res.json({orderId:order.id,status:order.status,paid:order.status==='paid',receiptUrl:order.payment?.receipt_url});
  } catch(e) { res.status(502).json({error:e.message}); }
});

app.post('/api/webhooks/infinitepay', async (req,res) => {
  // A documentação pública não descreve assinatura de webhook; por segurança, confirmamos o pagamento novamente via payment_check.
  try {
    const b=req.body || {}; const order=await getOrder(b.order_nsu);
    if(!order) return res.status(400).json({success:false,message:'Pedido não encontrado'});
    const check=await checkInfinitePayPayment({orderNsu:order.id,transactionNsu:b.transaction_nsu,slug:b.invoice_slug});
    if(!check.paid || Number(check.amount)!==order.totalCents) return res.status(400).json({success:false,message:'Pagamento não confirmado'});
    order.status='paid'; order.payment={...check, transactionNsu:b.transaction_nsu, slug:b.invoice_slug, receipt_url:b.receipt_url, checkedAt:new Date().toISOString()};
    await saveOrder(order); res.status(200).json({success:true,message:null});
  } catch(e){ res.status(400).json({success:false,message:e.message}); }
});

app.get('/health', (_req,res)=>res.json({ok:true}));

const port=Number(process.env.PORT||3000);
app.listen(port,()=>console.log(`Lojinha do Bartolomeu em http://localhost:${port}`));
