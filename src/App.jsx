import { useState, useRef } from "react";

// ============================================================
// 🔑 STRIPE CONFIGURATION — PASTE YOUR KEYS HERE
// ============================================================
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_KEY; // Your Stripe publishable key
const STRIPE_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID;          // Your Stripe Price ID (monthly sub)
// ============================================================

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["Create & preview invoices", "Unlimited line items", "Tax calculations"],
    locked: ["Download PDF", "Save invoice history", "Custom branding"],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$7",
    period: "/ month",
    features: ["Everything in Free", "Download & print PDF", "Save invoice history", "Custom branding", "Priority support"],
    locked: [],
    highlight: true,
  },
];

const initialItems = [{ id: 1, description: "", qty: 1, rate: 0 }];
const formatCurrency = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function InvoiceGenerator() {
  const [from, setFrom] = useState({ name: "", email: "", address: "" });
  const [to, setTo] = useState({ name: "", email: "", address: "" });
  const [invoice, setInvoice] = useState({ number: "INV-001", date: new Date().toISOString().split("T")[0], due: "" });
  const [items, setItems] = useState(initialItems);
  const [notes, setNotes] = useState("");
  const [tax, setTax] = useState(0);
  const [preview, setPreview] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState("");

  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const taxAmount = subtotal * (tax / 100);
  const total = subtotal + taxAmount;

  const addItem = () => setItems([...items, { id: Date.now(), description: "", qty: 1, rate: 0 }]);
  const updateItem = (id, field, value) => setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  const removeItem = (id) => setItems(items.filter((i) => i.id !== id));

  const handleDownload = () => { isPro ? window.print() : setShowPaywall(true); };

const handleStripeCheckout = async () => {
  setStripeLoading(true);
  setStripeError("");
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: from.email || '' }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    window.location.href = data.url;
  } catch (err) {
    setStripeError(err.message || "Something went wrong. Please try again.");
  }
  setStripeLoading(false);
};

  return (
    <div style={{ fontFamily: "sans-serif", minHeight: "100vh", background: "#f5f0eb" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .app { font-family: 'DM Sans', sans-serif; }
        .hdr { background: #1a1a2e; color: #e8d5b0; padding: 18px 40px; display: flex; justify-content: space-between; align-items: center; }
        .hdr h1 { font-family: 'Playfair Display', serif; font-size: 1.5rem; letter-spacing: 0.05em; }
        .hdr-sub { font-size: 0.75rem; opacity: 0.6; margin-top: 2px; letter-spacing: 0.1em; text-transform: uppercase; }
        .pro-pill { background: #c9a84c; color: #1a1a2e; font-size: 0.7rem; font-weight: 700; padding: 5px 13px; border-radius: 2px; letter-spacing: 0.1em; text-transform: uppercase; }
        .upgrade-btn { background: transparent; border: 1.5px solid rgba(232,213,176,0.5); color: #e8d5b0; font-size: 0.78rem; font-weight: 500; padding: 7px 16px; border-radius: 4px; cursor: pointer; letter-spacing: 0.05em; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .upgrade-btn:hover { background: #e8d5b0; color: #1a1a2e; }
        .main { max-width: 960px; margin: 0 auto; padding: 32px 24px; }
        .tabs { display: flex; margin-bottom: 28px; border: 1.5px solid #1a1a2e; width: fit-content; border-radius: 4px; overflow: hidden; }
        .tab { padding: 9px 24px; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 500; cursor: pointer; background: transparent; border: none; color: #1a1a2e; letter-spacing: 0.05em; transition: all 0.2s; }
        .tab.active { background: #1a1a2e; color: #e8d5b0; }
        .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .card { background: white; border: 1.5px solid #e0d8cc; border-radius: 6px; padding: 24px; }
        .ct { font-family: 'Playfair Display', serif; font-size: 1rem; color: #1a1a2e; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid #e0d8cc; display: flex; align-items: center; gap: 8px; }
        .dot { width: 8px; height: 8px; background: #c9a84c; border-radius: 50%; display: inline-block; flex-shrink: 0; }
        label { display: block; font-size: 0.72rem; font-weight: 500; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; margin-top: 12px; }
        label:first-of-type { margin-top: 0; }
        input, textarea { width: 100%; border: 1.5px solid #e0d8cc; border-radius: 4px; padding: 8px 11px; font-family: 'DM Sans', sans-serif; font-size: 0.88rem; color: #1a1a2e; background: #fafaf8; transition: border 0.2s; outline: none; }
        input:focus, textarea:focus { border-color: #c9a84c; background: white; }
        textarea { resize: vertical; min-height: 60px; }
        .ic { background: white; border: 1.5px solid #e0d8cc; border-radius: 6px; padding: 24px; margin-bottom: 20px; }
        .ih { display: grid; grid-template-columns: 1fr 80px 100px 36px; gap: 10px; padding-bottom: 8px; border-bottom: 1px solid #e0d8cc; margin-bottom: 10px; }
        .ih span { font-size: 0.7rem; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.08em; }
        .ir { display: grid; grid-template-columns: 1fr 80px 100px 36px; gap: 10px; margin-bottom: 8px; align-items: center; }
        .ir input { margin: 0; }
        .rm { background: none; border: 1.5px solid #e0d8cc; color: #aaa; border-radius: 4px; width: 32px; height: 32px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .rm:hover { border-color: #e05252; color: #e05252; }
        .add-btn { background: none; border: 1.5px dashed #c9a84c; color: #c9a84c; border-radius: 4px; padding: 8px 18px; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 500; cursor: pointer; margin-top: 10px; transition: all 0.2s; }
        .add-btn:hover { background: #c9a84c; color: white; }
        .br { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
        .tl { background: white; border: 1.5px solid #e0d8cc; border-radius: 6px; padding: 24px; }
        .tline { display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem; color: #555; margin-bottom: 10px; gap: 8px; }
        .tline.grand { font-family: 'Playfair Display', serif; font-size: 1.15rem; color: #1a1a2e; border-top: 1.5px solid #e0d8cc; padding-top: 12px; margin-top: 4px; }
        .ab { display: flex; gap: 12px; justify-content: flex-end; }
        .btn-o { background: white; border: 1.5px solid #1a1a2e; color: #1a1a2e; padding: 11px 26px; border-radius: 4px; font-family: 'DM Sans', sans-serif; font-size: 0.88rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .btn-o:hover { background: #1a1a2e; color: #e8d5b0; }
        .btn-p { background: #1a1a2e; border: 1.5px solid #1a1a2e; color: #e8d5b0; padding: 11px 26px; border-radius: 4px; font-family: 'DM Sans', sans-serif; font-size: 0.88rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .btn-p:hover { background: #c9a84c; border-color: #c9a84c; color: #1a1a2e; }

        /* PAYWALL */
        .mbg { position: fixed; inset: 0; background: rgba(26,26,46,0.78); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px); }
        .modal { background: white; border-radius: 10px; max-width: 700px; width: 100%; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.4); animation: mIn 0.25s ease; }
        @keyframes mIn { from { opacity:0; transform:scale(0.96) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .mh { background: #1a1a2e; padding: 28px 32px; color: #e8d5b0; text-align: center; position: relative; }
        .mh h2 { font-family: 'Playfair Display', serif; font-size: 1.6rem; margin-bottom: 6px; }
        .mh p { font-size: 0.85rem; opacity: 0.7; }
        .close-x { position: absolute; top: 14px; right: 18px; background: none; border: none; color: #e8d5b0; font-size: 1.5rem; cursor: pointer; opacity: 0.5; transition: opacity 0.2s; }
        .close-x:hover { opacity: 1; }
        .mb { padding: 28px 32px; }
        .pg { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .pc { border: 1.5px solid #e0d8cc; border-radius: 8px; padding: 22px; position: relative; }
        .pc.hl { border-color: #c9a84c; background: #fffef9; }
        .ptag { position: absolute; top: -11px; left: 50%; transform: translateX(-50%); background: #c9a84c; color: #1a1a2e; font-size: 0.65rem; font-weight: 700; padding: 3px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; }
        .pn { font-family: 'Playfair Display', serif; font-size: 1rem; color: #1a1a2e; margin-bottom: 4px; }
        .pp { font-family: 'Playfair Display', serif; font-size: 2rem; color: #1a1a2e; }
        .pp span { font-size: 0.85rem; color: #888; font-family: 'DM Sans', sans-serif; }
        .pf { margin-top: 14px; list-style: none; }
        .pf li { font-size: 0.82rem; color: #555; padding: 4px 0; display: flex; align-items: center; gap: 7px; }
        .pf li.lk { color: #bbb; }
        .ck { color: #2ecc71; font-weight: 700; }
        .cx { color: #ddd; }
        .sbtn { width: 100%; background: #635bff; border: none; color: white; padding: 14px; border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: background 0.2s; margin-bottom: 10px; }
        .sbtn:hover { background: #4f46e5; }
        .sbtn:disabled { opacity: 0.6; cursor: not-allowed; }
        .err { background: #fff0f0; border: 1px solid #fcc; color: #c00; padding: 10px 14px; border-radius: 4px; font-size: 0.82rem; margin-bottom: 12px; }
        .mft { text-align: center; font-size: 0.75rem; color: #aaa; padding-bottom: 8px; line-height: 1.7; }
        .mft a { color: #c9a84c; text-decoration: none; cursor: pointer; }

        /* INVOICE PREVIEW */
        .pvo { position: fixed; inset: 0; background: rgba(26,26,46,0.7); z-index: 100; display: flex; align-items: flex-start; justify-content: center; padding: 40px 20px; overflow-y: auto; }
        .pvs { background: white; width: 100%; max-width: 720px; border-radius: 6px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .pvt { background: #1a1a2e; display: flex; gap: 10px; justify-content: flex-end; padding: 12px 20px; }
        .ip { padding: 48px 52px; }
        .itop { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .ilogo { font-family: 'Playfair Display', serif; font-size: 1.8rem; color: #1a1a2e; }
        .ilogo em { color: #c9a84c; font-style: normal; }
        .imeta { text-align: right; }
        .imeta h2 { font-family: 'Playfair Display', serif; font-size: 2rem; color: #1a1a2e; letter-spacing: 0.05em; }
        .imeta p { font-size: 0.82rem; color: #888; margin-top: 4px; }
        .iparties { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 36px; }
        .ipl { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #c9a84c; margin-bottom: 6px; }
        .ipn { font-family: 'Playfair Display', serif; font-size: 1rem; color: #1a1a2e; margin-bottom: 4px; }
        .ipd { font-size: 0.82rem; color: #666; line-height: 1.5; }
        .itable { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
        .itable th { text-align: left; font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #888; padding: 0 0 10px; border-bottom: 1.5px solid #1a1a2e; }
        .itable th:last-child, .itable td:last-child { text-align: right; }
        .itable td { padding: 12px 0; border-bottom: 1px solid #f0ece6; font-size: 0.88rem; color: #333; vertical-align: top; }
        .itotals { margin-left: auto; width: 260px; }
        .itl { display: flex; justify-content: space-between; font-size: 0.85rem; color: #666; padding: 5px 0; }
        .itl.grand { border-top: 1.5px solid #1a1a2e; margin-top: 6px; padding-top: 10px; font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #1a1a2e; font-weight: 600; }
        .inotes { margin-top: 36px; padding-top: 20px; border-top: 1px solid #e0d8cc; font-size: 0.82rem; color: #888; line-height: 1.6; }
        .inotes strong { color: #1a1a2e; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px; }
        .ifooter { margin-top: 40px; text-align: center; font-size: 0.72rem; color: #bbb; }
        .stripe-bar { height: 5px; background: linear-gradient(90deg, #1a1a2e 60%, #c9a84c 100%); }

        @media print {
          .pvt, .hdr, .main, .mbg { display: none !important; }
          .pvo { position: static; background: none; padding: 0; }
          .pvs { box-shadow: none; border-radius: 0; }
        }
      `}</style>

      <div className="app">
        {/* HEADER */}
        <div className="hdr">
          <div>
            <h1>InvoiceForge</h1>
            <div className="hdr-sub">Professional Invoice Generator</div>
          </div>
          {isPro
            ? <span className="pro-pill">⚡ Pro Active</span>
            : <button className="upgrade-btn" onClick={() => setShowPaywall(true)}>Upgrade to Pro →</button>
          }
        </div>

        <div className="main">
          <div className="tabs">
            <button className={`tab ${!preview ? "active" : ""}`} onClick={() => setPreview(false)}>✏️ Edit Invoice</button>
            <button className={`tab ${preview ? "active" : ""}`} onClick={() => setPreview(true)}>👁 Preview</button>
          </div>

          {!preview && <>
            <div className="g2">
              <div className="card">
                <div className="ct"><span className="dot"></span> From (Your Details)</div>
                <label>Your Name / Business</label>
                <input value={from.name} onChange={e => setFrom({...from, name: e.target.value})} placeholder="Acme Studio" />
                <label>Email</label>
                <input value={from.email} onChange={e => setFrom({...from, email: e.target.value})} placeholder="hello@acmestudio.com" />
                <label>Address</label>
                <textarea value={from.address} onChange={e => setFrom({...from, address: e.target.value})} placeholder="123 Main St, New York, NY 10001" />
              </div>
              <div className="card">
                <div className="ct"><span className="dot"></span> Bill To (Client)</div>
                <label>Client Name / Business</label>
                <input value={to.name} onChange={e => setTo({...to, name: e.target.value})} placeholder="Client Corp" />
                <label>Email</label>
                <input value={to.email} onChange={e => setTo({...to, email: e.target.value})} placeholder="accounts@clientcorp.com" />
                <label>Address</label>
                <textarea value={to.address} onChange={e => setTo({...to, address: e.target.value})} placeholder="456 Business Ave, Los Angeles, CA 90001" />
              </div>
            </div>

            <div className="card" style={{marginBottom:20}}>
              <div className="ct"><span className="dot"></span> Invoice Details</div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16}}>
                <div><label>Invoice #</label><input value={invoice.number} onChange={e => setInvoice({...invoice, number: e.target.value})} /></div>
                <div><label>Issue Date</label><input type="date" value={invoice.date} onChange={e => setInvoice({...invoice, date: e.target.value})} /></div>
                <div><label>Due Date</label><input type="date" value={invoice.due} onChange={e => setInvoice({...invoice, due: e.target.value})} /></div>
              </div>
            </div>

            <div className="ic">
              <div className="ct"><span className="dot"></span> Line Items</div>
              <div className="ih"><span>Description</span><span>Qty</span><span>Rate (USD)</span><span></span></div>
              {items.map(item => (
                <div className="ir" key={item.id}>
                  <input value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} placeholder="Service or product" />
                  <input type="number" min="1" value={item.qty} onChange={e => updateItem(item.id, "qty", parseFloat(e.target.value)||0)} />
                  <input type="number" min="0" step="0.01" value={item.rate} onChange={e => updateItem(item.id, "rate", parseFloat(e.target.value)||0)} />
                  <button className="rm" onClick={() => removeItem(item.id)}>×</button>
                </div>
              ))}
              <button className="add-btn" onClick={addItem}>+ Add Line Item</button>
            </div>

            <div className="br">
              <div className="card">
                <div className="ct"><span className="dot"></span> Notes</div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment terms, bank details, thank-you message..." style={{minHeight:80}} />
              </div>
              <div className="tl">
                <div className="ct"><span className="dot"></span> Summary</div>
                <div className="tline"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="tline">
                  <span>Tax (%)</span>
                  <input type="number" min="0" max="100" value={tax} onChange={e => setTax(parseFloat(e.target.value)||0)} style={{width:70, textAlign:"right"}} />
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="tline grand"><span>Total Due</span><span>{formatCurrency(total)}</span></div>
              </div>
            </div>

            <div className="ab">
              <button className="btn-o" onClick={() => setPreview(true)}>Preview Invoice</button>
              <button className="btn-p" onClick={handleDownload}>
                {!isPro && <span>🔒</span>} Download PDF {!isPro && "— Pro"}
              </button>
            </div>
          </>}
        </div>

        {/* INVOICE PREVIEW */}
        {preview && (
          <div className="pvo">
            <div className="pvs">
              <div className="pvt">
                <button className="btn-o" style={{color:"#e8d5b0", borderColor:"rgba(232,213,176,0.35)"}} onClick={() => setPreview(false)}>← Edit</button>
                <button className="btn-p" onClick={handleDownload}>{!isPro && <span>🔒</span>} Download PDF {!isPro && "— Pro"}</button>
              </div>
              <div className="stripe-bar"></div>
              <div className="ip">
                <div className="itop">
                  <div className="ilogo">{from.name || "Your Business"}<em>.</em></div>
                  <div className="imeta">
                    <h2>INVOICE</h2>
                    <p>#{invoice.number}</p>
                    <p style={{marginTop:8}}>Issued: {invoice.date}</p>
                    {invoice.due && <p>Due: {invoice.due}</p>}
                  </div>
                </div>
                <div className="iparties">
                  <div>
                    <div className="ipl">From</div>
                    <div className="ipn">{from.name || "—"}</div>
                    <div className="ipd">{from.email}</div>
                    <div className="ipd" style={{whiteSpace:"pre-line"}}>{from.address}</div>
                  </div>
                  <div>
                    <div className="ipl">Bill To</div>
                    <div className="ipn">{to.name || "—"}</div>
                    <div className="ipd">{to.email}</div>
                    <div className="ipd" style={{whiteSpace:"pre-line"}}>{to.address}</div>
                  </div>
                </div>
                <table className="itable">
                  <thead><tr>
                    <th>Description</th>
                    <th style={{textAlign:"right"}}>Qty</th>
                    <th style={{textAlign:"right"}}>Rate</th>
                    <th style={{textAlign:"right"}}>Amount</th>
                  </tr></thead>
                  <tbody>
                    {items.filter(i => i.description || i.rate).map(item => (
                      <tr key={item.id}>
                        <td>{item.description || "—"}</td>
                        <td style={{textAlign:"right"}}>{item.qty}</td>
                        <td style={{textAlign:"right"}}>{formatCurrency(item.rate)}</td>
                        <td style={{textAlign:"right"}}>{formatCurrency(item.qty * item.rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="itotals">
                  <div className="itl"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  {tax > 0 && <div className="itl"><span>Tax ({tax}%)</span><span>{formatCurrency(taxAmount)}</span></div>}
                  <div className="itl grand"><span>Total Due</span><span>{formatCurrency(total)}</span></div>
                </div>
                {notes && <div className="inotes"><strong>Notes</strong>{notes}</div>}
                <div className="ifooter">Thank you for your business.</div>
              </div>
              <div className="stripe-bar"></div>
            </div>
          </div>
        )}

        {/* PAYWALL MODAL */}
        {showPaywall && (
          <div className="mbg" onClick={e => { if (e.target.className === "mbg") setShowPaywall(false); }}>
            <div className="modal">
              <div className="mh">
                <button className="close-x" onClick={() => setShowPaywall(false)}>×</button>
                <h2>Unlock PDF Downloads</h2>
                <p>Upgrade to Pro and get paid faster with professional invoices</p>
              </div>
              <div className="mb">
                <div className="pg">
                  {PLANS.map(plan => (
                    <div className={`pc ${plan.highlight ? "hl" : ""}`} key={plan.id}>
                      {plan.highlight && <div className="ptag">⭐ Most Popular</div>}
                      <div className="pn">{plan.name}</div>
                      <div className="pp">{plan.price}<span> {plan.period}</span></div>
                      <ul className="pf">
                        {plan.features.map(f => <li key={f}><span className="ck">✓</span>{f}</li>)}
                        {plan.locked.map(f => <li key={f} className="lk"><span className="cx">✕</span>{f}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
                {stripeError && <div className="err">⚠️ {stripeError}</div>}
                <button className="sbtn" onClick={handleStripeCheckout} disabled={stripeLoading}>
                  {stripeLoading ? "Redirecting to Stripe…" : "⚡ Start Pro — $7/month · Powered by Stripe"}
                </button>
                <div className="mft">
                  🔒 Secure checkout · Cancel anytime · 7-day free trial<br/>
                  Already subscribed? <a onClick={() => { setIsPro(true); setShowPaywall(false); }}>Restore access</a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
