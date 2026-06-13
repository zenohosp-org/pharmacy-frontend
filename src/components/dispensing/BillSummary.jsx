import Card from '../ui/Card';
import Button from '../ui/Button';
import { fmt } from '../../utils/format';

// Right column of counter sale: totals, payment mode, conditional doctor field,
// patient phone and the complete/clear actions.
export default function BillSummary({
  totals,
  paymentMode,
  onPaymentMode,
  requiresDoctor,
  doctorName,
  onDoctorName,
  patientPhone,
  onPatientPhone,
  loading,
  cartLength,
  onCheckout,
  onClear,
}) {
  return (
    <Card padded={false} title="Bill Summary" className="cs-summary">
      <div className="card-body">
        <div className="cs-totals">
          {[
            ['Subtotal', totals.subtotal],
            ['GST', totals.gst],
            totals.discount > 0 ? ['Discount', -totals.discount] : null,
          ].filter(Boolean).map(([label, val]) => (
            <div key={label} className="cs-totals-row">
              <span className="cs-totals-label">{label}</span>
              <strong>{val < 0 ? '-' : ''}₹{fmt(Math.abs(val))}</strong>
            </div>
          ))}
          <div className="cs-totals-grand">
            <span>Total</span>
            <span className="cs-totals-grand-value">₹{fmt(totals.total)}</span>
          </div>
        </div>

        {/* payment mode */}
        <div className="form-group cs-field">
          <label className="form-label">Payment mode</label>
          <div className="cs-pay">
            {['CASH', 'CARD', 'UPI'].map(m => (
              <button key={m} onClick={() => onPaymentMode(m)} className={`cs-pay-btn ${paymentMode === m ? 'cs-pay-btn--active' : ''}`}>
                {m === 'CASH' ? '💵' : m === 'CARD' ? '💳' : '📱'} {m}
              </button>
            ))}
          </div>
        </div>

        {/* doctor name — only when H1/X in cart */}
        {requiresDoctor && (
          <div className="cs-doctor">
            <label className="cs-doctor-label">⚠ Doctor name <span className="text-error">*</span></label>
            <input type="text" placeholder="Prescribing doctor" value={doctorName} onChange={e => onDoctorName(e.target.value)} className="form-input" />
            <div className="cs-doctor-hint">Required for Schedule H1/X</div>
          </div>
        )}

        {/* patient phone */}
        <div className="form-group cs-field">
          <label className="form-label">Patient phone (optional)</label>
          <input type="tel" placeholder="Mobile number" value={patientPhone} onChange={e => onPatientPhone(e.target.value)} className="form-input" />
        </div>

        <Button
          variant="success"
          block
          onClick={onCheckout}
          disabled={loading || !cartLength || (requiresDoctor && !doctorName.trim())}
          className="section-gap cs-checkout"
        >
          {loading ? 'Processing…' : `✓ Complete Sale  ₹${fmt(totals.total)}`}
        </Button>

        <Button variant="secondary" block onClick={onClear}>
          Clear cart
        </Button>
      </div>
    </Card>
  );
}
