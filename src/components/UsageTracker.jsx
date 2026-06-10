import { useState, useEffect } from 'react';
import { getUsageStats } from '../lib/api/rentcast';

const LIMIT = 50;

function formatResetDate(isoDate) {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function UsageTracker() {
  const [expanded, setExpanded] = useState(false);
  const [stats, setStats] = useState(() => getUsageStats());

  // Auto-refresh when localStorage changes (RentCast fires from parcelLookup)
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'property-scout:rentcast-usage') {
        setStats(getUsageStats());
      }
    }
    window.addEventListener('storage', onStorage);
    // Also poll every 2s to catch same-tab updates (storage events only fire cross-tab)
    const interval = setInterval(() => setStats(getUsageStats()), 2000);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, []);

  function handleToggle() {
    setStats(getUsageStats());
    setExpanded((v) => !v);
  }

  const { count, resetDate, lastCall } = stats;
  const remaining = Math.max(0, LIMIT - count);
  const pct = Math.min(1, count / LIMIT);

  const barColor =
    pct >= 0.9 ? '#ef4444' :
    pct >= 0.6 ? '#f59e0b' :
    '#22c55e';

  const statusLabel =
    remaining === 0 ? 'Limit reached' :
    remaining <= 10 ? `${remaining} left` :
    `${count}/${LIMIT}`;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        right: 56,
        zIndex: 10,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Collapsed chip */}
      <button
        onClick={handleToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(15,23,42,0.85)',
          border: 'none',
          borderRadius: 8,
          padding: '6px 12px',
          cursor: 'pointer',
          backdropFilter: 'blur(4px)',
          color: '#94a3b8',
          fontSize: 11,
          fontWeight: 500,
        }}
      >
        <span style={{ color: '#64748b', fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          RentCast
        </span>

        {/* Mini progress bar */}
        <div style={{ width: 48, height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${pct * 100}%`, height: '100%', background: barColor, borderRadius: 2, transition: 'width 0.3s' }} />
        </div>

        <span style={{ color: barColor, fontWeight: 700 }}>{statusLabel}</span>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div style={{
          position: 'absolute',
          bottom: 36,
          right: 0,
          width: 220,
          background: '#0f172a',
          borderRadius: 10,
          padding: 14,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            RentCast API Usage
          </div>

          {/* Big progress bar */}
          <div style={{ height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${pct * 100}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width 0.4s' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{count} used</span>
            <span style={{ fontSize: 13, color: '#64748b' }}>{LIMIT - count} remaining</span>
          </div>

          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <Row label="Monthly limit" value={`${LIMIT} calls`} />
            <Row label="Resets" value={formatResetDate(resetDate)} highlight />
            {lastCall && (
              <Row label="Last call" value={new Date(lastCall).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} />
            )}
          </div>

          {remaining === 0 && (
            <div style={{ marginTop: 10, background: '#fee2e2', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#991b1b', fontWeight: 600 }}>
              Limit reached — resets {formatResetDate(resetDate)}
            </div>
          )}
          {remaining > 0 && remaining <= 10 && (
            <div style={{ marginTop: 10, background: '#fef3c7', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#92400e', fontWeight: 600 }}>
              ⚠ Only {remaining} calls left this month
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: 11, color: highlight ? '#22c55e' : '#94a3b8', fontWeight: highlight ? 700 : 400 }}>{value}</span>
    </div>
  );
}
