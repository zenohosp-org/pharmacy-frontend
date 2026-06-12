import Card from '../ui/Card';
import UomToggle from './UomToggle';
import { fmt } from '../../utils/format';
import { lineRate } from '../../utils/counterSale';

// Counter-sale line items: a "pending" row (drug just picked) followed by the
// confirmed cart rows, each with GST/qty steppers, discount and per-line total.
export default function LineItemsTable({ pending, cart, onPendingChange, onClearPending, onCartItemChange, onRemove }) {
  let pendingTotal = 0;
  if (pending) {
    const sp = lineRate(pending);
    const sub = (pending.qty || 0) * sp;
    const gst = (sub * (pending.gstRate || 0)) / 100;
    const disc = parseFloat(pending.discount) || 0;
    pendingTotal = sub + gst - disc;
  }

  return (
    <Card padded={false} title="Line Items" className="section-gap">
      <div className="card-body">
        {/* Column Headers */}
        <div className="cs-li-head">
          <div className="cs-li-col">Product</div>
          <div className="cs-li-col">GST %</div>
          <div className="cs-li-col">Qty</div>
          <div className="cs-li-col">Price (₹)</div>
          <div className="cs-li-col">Disc (₹)</div>
          <div className="cs-li-col">Total (₹)</div>
          <div />
        </div>

        {/* Pending Row */}
        {pending && (
          <div className="cs-li-row cs-li-row--pending">
            <div className="cs-product">
              <input type="text" value={pending.drugName || ''} readOnly className="cs-product-input" />
              {pending.batch && (
                <button onClick={onClearPending} className="cs-product-clear">×</button>
              )}
              <UomToggle item={pending} onChange={onPendingChange} />
            </div>

            <div className="cs-stepper">
              <button className="cs-stepper-btn" onClick={() => onPendingChange({ ...pending, gstRate: Math.max(0, (pending.gstRate || 0) - 0.5) })}>−</button>
              <input type="number" value={pending.gstRate} onChange={(e) => onPendingChange({ ...pending, gstRate: parseFloat(e.target.value) || 0 })} className="cs-stepper-input" />
              <button className="cs-stepper-btn" onClick={() => onPendingChange({ ...pending, gstRate: (pending.gstRate || 0) + 0.5 })}>+</button>
            </div>

            <div className="cs-stepper">
              <button className="cs-stepper-btn" onClick={() => onPendingChange({ ...pending, qty: Math.max(0, (pending.qty || 0) - 1) })}>−</button>
              <input type="number" value={pending.qty} onChange={(e) => onPendingChange({ ...pending, qty: parseFloat(e.target.value) || 0 })} className="cs-stepper-input" />
              <button className="cs-stepper-btn" onClick={() => onPendingChange({ ...pending, qty: (pending.qty || 0) + 1 })}>+</button>
            </div>

            <div className="cs-price">₹{fmt(lineRate(pending))}</div>

            <div className="cs-num-box">
              <input type="number" value={pending.discount} onChange={(e) => onPendingChange({ ...pending, discount: parseFloat(e.target.value) || 0 })} className="cs-num-input" />
            </div>

            <div className="cs-total">₹{fmt(pendingTotal)}</div>

            <button onClick={onClearPending} className="cs-remove-btn">×</button>
          </div>
        )}

        {/* Cart Rows */}
        {cart.map(item => {
          const sp = lineRate(item);
          const sub = (item.qty || 0) * sp;
          const gst = (sub * (item.gstRate || 0)) / 100;
          const disc = parseFloat(item.discount) || 0;
          const tot = sub + gst - disc;

          return (
            <div key={item.id} className="cs-li-row">
              <div className="cs-cart-name">
                {item.drugName}
                <UomToggle item={item} onChange={onCartItemChange} />
              </div>
              <div className="cs-stepper">
                <button className="cs-stepper-btn" onClick={() => onCartItemChange({ ...item, gstRate: Math.max(0, (item.gstRate || 0) - 0.5) })}>−</button>
                <input type="number" value={item.gstRate} onChange={(e) => onCartItemChange({ ...item, gstRate: parseFloat(e.target.value) || 0 })} className="cs-stepper-input" />
                <button className="cs-stepper-btn" onClick={() => onCartItemChange({ ...item, gstRate: (item.gstRate || 0) + 0.5 })}>+</button>
              </div>
              <div className="cs-stepper">
                <button className="cs-stepper-btn" onClick={() => onCartItemChange({ ...item, qty: Math.max(0, (item.qty || 0) - 1) })}>−</button>
                <input type="number" value={item.qty} onChange={(e) => onCartItemChange({ ...item, qty: parseFloat(e.target.value) || 0 })} className="cs-stepper-input" />
                <button className="cs-stepper-btn" onClick={() => onCartItemChange({ ...item, qty: (item.qty || 0) + 1 })}>+</button>
              </div>
              <div className="cs-price">₹{fmt(sp)}</div>
              <div className="cs-num-box">
                <input type="number" value={item.discount} onChange={(e) => onCartItemChange({ ...item, discount: parseFloat(e.target.value) || 0 })} className="cs-num-input" />
              </div>
              <div className="cs-total">₹{fmt(tot)}</div>
              <button onClick={() => onRemove(item.id)} className="cs-remove-btn">×</button>
            </div>
          );
        })}

        {!pending && (
          <div className="cs-li-empty">Search above to add more drugs</div>
        )}
      </div>
    </Card>
  );
}
