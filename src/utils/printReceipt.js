import { fmt } from './format';
import { lineRate } from './counterSale';

// Opens a print window with a thermal-style GST receipt for a completed sale.
export function printReceipt(sale, paymentMode) {
  const win = window.open('', '', 'width=520,height=800');
  win.document.write(`<html><head><title>${sale.billNumber}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Courier New',monospace;font-size:12px;padding:16px;max-width:380px;margin:auto}
    h2{text-align:center;font-size:16px;letter-spacing:2px;margin-bottom:4px}
    .sub{text-align:center;color:#666;margin-bottom:12px;font-size:11px}
    .row{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px dashed #ddd}
    .row:last-child{border:none}
    table{width:100%;border-collapse:collapse;margin:10px 0}
    th{border-bottom:1px solid #000;padding:4px;font-size:11px;text-align:left}
    td{padding:4px;font-size:11px;border-bottom:1px dashed #eee}
    .tot{font-weight:700;border-top:2px solid #000;padding-top:6px;margin-top:4px}
    .grand{font-size:14px;font-weight:900}
    @media print{body{padding:0}}
  </style></head><body>
  <h2>ZENOPHARMACY</h2>
  <div class="sub">GST Invoice</div>
  <div class="row"><span>Bill #</span><strong>${sale.billNumber}</strong></div>
  <div class="row"><span>Date</span><span>${sale.timestamp}</span></div>
  <div class="row"><span>Payment</span><span>${paymentMode}</span></div>
  ${sale.patientPhone !== 'Walk-in' ? `<div class="row"><span>Phone</span><span>${sale.patientPhone}</span></div>` : ''}
  ${sale.doctorName !== '—' ? `<div class="row"><span>Doctor</span><span>${sale.doctorName}</span></div>` : ''}
  <table>
    <thead><tr><th>Drug</th><th>Qty</th><th>Rate</th><th>Amt</th></tr></thead>
    <tbody>
      ${sale.items.map(i => {
        const sp = lineRate(i) || i.rate || 0;
        const uomLabel = (i.uom || 'UNIT') === 'STRIP' ? 'strip' : 'unit';
        return `<tr>
          <td>${i.drugName}<br/><small style="color:#888">${i.batch?.batchNumber ?? ''}</small></td>
          <td>${i.qty} ${uomLabel}</td><td>₹${fmt(sp)}</td>
          <td>₹${fmt(i.qty * sp)}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
  <div class="row tot"><span>Subtotal</span><span>₹${fmt(sale.subtotal)}</span></div>
  <div class="row tot"><span>GST</span><span>₹${fmt(sale.gst)}</span></div>
  ${sale.discount > 0 ? `<div class="row tot"><span>Discount</span><span>-₹${fmt(sale.discount)}</span></div>` : ''}
  <div class="row tot grand"><span>TOTAL</span><span>₹${fmt(sale.total)}</span></div>
  <p style="text-align:center;margin-top:14px;font-size:10px;color:#888">Thank you · Printed ${new Date().toLocaleString()}</p>
  </body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); win.close(); }, 250);
}
