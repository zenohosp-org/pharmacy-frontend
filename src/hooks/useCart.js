import { useState } from 'react';

// Cart state for dispensing/billing flows.
// `lineRate(item)` resolves the per-unit price — flat selling price by default,
// strip-aware for counter sale.
export default function useCart(lineRate = (i) => i.batch?.sellingPrice ?? 0) {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => setCart(prev => [...prev, { ...item, id: Math.random() }]);
  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const updateItem = (updated) => setCart(prev => prev.map(i => (i.id === updated.id ? updated : i)));
  const clearCart = () => setCart([]);

  const totals = cart.reduce((acc, item) => {
    const sp = lineRate(item);
    const sub = (item.qty || 0) * sp;
    const gst = (sub * (item.gstRate || 0)) / 100;
    const disc = parseFloat(item.discount) || 0;
    acc.subtotal += sub;
    acc.gst += gst;
    acc.discount += disc;
    acc.total += sub + gst - disc;
    return acc;
  }, { subtotal: 0, gst: 0, discount: 0, total: 0 });

  const requiresDoctor = cart.some(i => ['H1', 'X'].includes(i.schedule));

  return { cart, setCart, addToCart, removeItem, updateItem, clearCart, totals, requiresDoctor };
}
