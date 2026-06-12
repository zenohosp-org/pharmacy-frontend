import Card from '../ui/Card';
import { fmt } from '../../utils/format';

// Editable list of drugs queued for a ward issue.
export default function CartList({ cart, onItemChange, onRemove }) {
  if (!cart.length) return null;
  return (
    <Card padded={false} title={`Items (${cart.length})`}>
      <div className="card-body">
        {cart.map(item => {
          const sp = item.batch?.sellingPrice ?? 0;
          const sub = item.qty * sp;
          const gst = (sub * item.gstRate) / 100;
          const disc = item.discount || 0;
          return (
            <div key={item.id} className="dp-cart-row">
              <div>
                <div className="dp-cart-name">{item.drugName}</div>
                <div className="dp-cart-meta">
                  {item.batch?.batchNumber} · ₹{fmt(sp)}/unit
                  {(item.schedule === 'H1' || item.schedule === 'X') && (
                    <span className="dp-sched-warn">⚠ {item.schedule}</span>
                  )}
                </div>
              </div>
              <input type="number" min="1" value={item.qty}
                onChange={e => onItemChange({ ...item, qty: parseFloat(e.target.value) || 0 })}
                className="form-input dp-input dp-input-center" />
              <div className="dp-cart-gst">{item.gstRate}% GST</div>
              <div className="dp-cart-amount">₹{fmt(sub + gst - disc)}</div>
              <button onClick={() => onRemove(item.id)} className="dp-remove">×</button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
