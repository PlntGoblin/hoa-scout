import { useState } from 'react';
import { upsertHoa } from '../lib/hoaStore';

const POLICY_OPTIONS = [
  { value: 'allowed', label: '✓ Allowed', color: '#065f46' },
  { value: 'prohibited', label: '✗ Prohibited', color: '#991b1b' },
  { value: 'unknown', label: '? Unknown', color: '#92400e' },
];

const CONFIDENCE_OPTIONS = [
  { value: 'high', label: 'High — verified source' },
  { value: 'medium', label: 'Medium — inferred / partial' },
  { value: 'low', label: 'Low — unverified' },
];

export default function HoaCapture({ prefillName = '', initialRecord = null, onSaved, onClose }) {
  const [form, setForm] = useState(() => initialRecord ? {
    name: initialRecord.name,
    strPolicy: initialRecord.strPolicy || 'unknown',
    strPolicyNotes: initialRecord.strPolicyNotes || '',
    source: initialRecord.source || '',
    confidence: initialRecord.confidence || 'high',
    lastVerified: initialRecord.lastVerified || new Date().toISOString().slice(0, 7),
  } : {
    name: prefillName,
    strPolicy: 'unknown',
    strPolicyNotes: '',
    source: '',
    confidence: 'high',
    lastVerified: new Date().toISOString().slice(0, 7),
  });
  const [saved, setSaved] = useState(false);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const record = upsertHoa(form);
    setSaved(true);
    setTimeout(() => {
      onSaved?.(record);
      onClose?.();
    }, 800);
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 420,
        background: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
        zIndex: 20,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ background: '#0f172a', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
            HOA Knowledge Layer
          </div>
          <div style={{ color: '#f8fafc', fontSize: 15, fontWeight: 600 }}>Add / Edit HOA Record</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer' }}>✕</button>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 20 }}>
        {/* HOA Name */}
        <label style={labelStyle}>HOA / Subdivision Name</label>
        <input
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Ridgeview Subdivision"
          required
          style={inputStyle}
        />

        {/* STR Policy */}
        <label style={labelStyle}>STR Policy</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {POLICY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('strPolicy', opt.value)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 6,
                border: `2px solid ${form.strPolicy === opt.value ? opt.color : '#e2e8f0'}`,
                background: form.strPolicy === opt.value ? `${opt.color}18` : '#f8fafc',
                color: form.strPolicy === opt.value ? opt.color : '#64748b',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Policy Notes */}
        <label style={labelStyle}>Policy Notes (optional)</label>
        <input
          value={form.strPolicyNotes}
          onChange={(e) => set('strPolicyNotes', e.target.value)}
          placeholder="e.g. Rentals < 30 days permitted per §4.2"
          style={inputStyle}
        />

        {/* Source */}
        <label style={labelStyle}>Source <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          value={form.source}
          onChange={(e) => set('source', e.target.value)}
          placeholder="e.g. CC&R Amendment 2023, §4.2 / Board minutes / Mgmt co."
          required
          style={inputStyle}
        />

        {/* Confidence */}
        <label style={labelStyle}>Confidence</label>
        <select
          value={form.confidence}
          onChange={(e) => set('confidence', e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          {CONFIDENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Last Verified */}
        <label style={labelStyle}>Last Verified (YYYY-MM)</label>
        <input
          type="month"
          value={form.lastVerified}
          onChange={(e) => set('lastVerified', e.target.value)}
          style={inputStyle}
        />

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            marginTop: 4,
            background: saved ? '#065f46' : '#0f172a',
            color: '#ffffff',
            borderRadius: 8,
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.3s',
          }}
        >
          {saved ? '✓ Saved to HOA Layer' : 'Save HOA Record'}
        </button>
      </form>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#64748b',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 6,
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 6,
  border: '1px solid #e2e8f0',
  fontSize: 13,
  marginBottom: 14,
  outline: 'none',
  background: '#f8fafc',
  boxSizing: 'border-box',
};
