import { useState } from 'react';
import { listHoas, deleteHoa } from '../lib/hoaStore';

const POLICY_STYLES = {
  allowed:    { bg: '#d1fae5', text: '#065f46', label: '✓ Allowed' },
  prohibited: { bg: '#fee2e2', text: '#991b1b', label: '✗ Prohibited' },
  unknown:    { bg: '#f1f5f9', text: '#64748b', label: '? Unknown' },
};

const CONF_STYLES = {
  high:   { color: '#065f46' },
  medium: { color: '#92400e' },
  low:    { color: '#991b1b' },
};

export default function HoaList({ onClose, onEdit }) {
  const [records, setRecords] = useState(() => listHoas());

  function handleDelete(name) {
    deleteHoa(name);
    setRecords(listHoas());
  }

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0,
      width: 380, background: '#ffffff',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
      zIndex: 12, display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{ background: '#0f172a', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
            HOA Knowledge Layer
          </div>
          <div style={{ color: '#f8fafc', fontSize: 15, fontWeight: 600 }}>
            {records.length} Record{records.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer' }}>✕</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {records.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏘</div>
            No HOA records yet.<br />
            Click a property pin and use<br />"+ Add HOA Record" to start building the layer.
          </div>
        ) : (
          records.map((hoa) => {
            const policy = POLICY_STYLES[hoa.strPolicy] || POLICY_STYLES.unknown;
            const conf = CONF_STYLES[hoa.confidence] || CONF_STYLES.low;
            return (
              <div key={hoa.key} style={{
                border: '1px solid #e2e8f0', borderRadius: 10,
                padding: '14px 16px', marginBottom: 10,
                background: '#fafafa',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', lineHeight: 1.3, flex: 1 }}>
                    {hoa.name}
                  </div>
                  <span style={{
                    background: policy.bg, color: policy.text,
                    padding: '2px 8px', borderRadius: 4,
                    fontSize: 11, fontWeight: 600, marginLeft: 8, flexShrink: 0,
                  }}>
                    {policy.label}
                  </span>
                </div>

                {hoa.strPolicyNotes && (
                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 6 }}>{hoa.strPolicyNotes}</div>
                )}

                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>Source:</span> {hoa.source || '—'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                  <span style={{ fontSize: 11, color: conf.color, fontWeight: 600 }}>
                    {(hoa.confidence || 'low').charAt(0).toUpperCase() + (hoa.confidence || 'low').slice(1)} confidence
                  </span>
                  {hoa.lastVerified && (
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Verified {hoa.lastVerified}</span>
                  )}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => onEdit?.(hoa)}
                      style={{ fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(hoa.name)}
                      style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {hoa.updatedAt && (
                  <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 6 }}>
                    Updated {new Date(hoa.updatedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
        Records persist in your browser. Export to CSV coming in Phase 3.
      </div>
    </div>
  );
}
