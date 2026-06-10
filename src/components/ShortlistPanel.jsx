import { useState } from 'react';
import {
  listShortlist, updateShortlistEntry, removeShortlistEntry,
  STATUS_OPTIONS, statusStyle,
} from '../lib/shortlistStore';
import { downloadCsv } from '../lib/csvExport';

const MARKETS = { sedona: 'Sedona', sandiego: 'San Diego', nashville: 'Nashville' };

export default function ShortlistPanel({ onClose, onFlyTo }) {
  const [entries, setEntries] = useState(() => listShortlist());
  const [editingNotes, setEditingNotes] = useState(null); // entry id
  const [notesDraft, setNotesDraft] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMarket, setFilterMarket] = useState('all');

  function refresh() { setEntries(listShortlist()); }

  function handleStatus(id, status) {
    updateShortlistEntry(id, { status });
    refresh();
  }

  function handleSaveNotes(id) {
    updateShortlistEntry(id, { notes: notesDraft });
    setEditingNotes(null);
    refresh();
  }

  function handleRemove(id) {
    removeShortlistEntry(id);
    refresh();
  }

  function handleExport() {
    const toExport = filtered.length > 0 ? filtered : entries;
    downloadCsv(toExport, `property-scout-shortlist-${new Date().toISOString().slice(0,10)}.csv`);
  }

  const filtered = entries.filter((e) => {
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (filterMarket !== 'all' && e.market !== filterMarket) return false;
    return true;
  });

  const passCount = entries.filter((e) => e.status === 'pass').length;
  const activeCount = entries.length - passCount;

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0,
      width: 400, background: '#ffffff',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.13)',
      zIndex: 12, display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{ background: '#0f172a', padding: '16px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
              Shortlist
            </div>
            <div style={{ color: '#f8fafc', fontSize: 15, fontWeight: 600 }}>
              {activeCount} Active · {passCount} Passed
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleExport}
              disabled={entries.length === 0}
              style={{
                padding: '6px 12px', borderRadius: 6, border: 'none',
                background: entries.length > 0 ? '#3b82f6' : '#334155',
                color: '#fff', fontSize: 12, fontWeight: 600,
                cursor: entries.length > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              ↓ CSV
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ fontSize: 11, padding: '4px 8px', borderRadius: 5, border: '1px solid #334155', background: '#1e293b', color: '#cbd5e1', flex: 1 }}
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={filterMarket}
            onChange={(e) => setFilterMarket(e.target.value)}
            style={{ fontSize: 11, padding: '4px 8px', borderRadius: 5, border: '1px solid #334155', background: '#1e293b', color: '#cbd5e1', flex: 1 }}
          >
            <option value="all">All Markets</option>
            {Object.entries(MARKETS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 48 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            No properties shortlisted yet.<br />
            Open a property card and hit<br />"+ Add to Shortlist."
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 48 }}>
            No properties match this filter.
          </div>
        ) : (
          filtered.map((entry) => {
            const ss = statusStyle(entry.status);
            const isEditingThis = editingNotes === entry.id;
            return (
              <div key={entry.id} style={{
                border: '1px solid #e2e8f0', borderRadius: 10,
                padding: '12px 14px', marginBottom: 10, background: '#fafafa',
              }}>
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>
                      {entry.address}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      {MARKETS[entry.market] || entry.market}
                      {entry.parcel?.county && ` · ${entry.parcel.county.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')} Co.`}
                    </div>
                  </div>
                  {/* Score badge */}
                  {entry.score > 0 && (
                    <div style={{
                      background: entry.score >= 70 ? '#d1fae5' : entry.score >= 40 ? '#fef3c7' : '#fee2e2',
                      color: entry.score >= 70 ? '#065f46' : entry.score >= 40 ? '#92400e' : '#991b1b',
                      borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700,
                      marginLeft: 8, flexShrink: 0,
                    }}>
                      {entry.score}/100
                    </div>
                  )}
                </div>

                {/* Owner + HOA quick facts */}
                {entry.parcel?.ownerName && (
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>
                    👤 {entry.parcel.ownerName}
                  </div>
                )}
                {entry.hoa?.name && (
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>
                    🏘 {entry.hoa.name} — {entry.hoa.strPolicy || 'unknown'}
                  </div>
                )}

                {/* Status picker */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8, marginBottom: 6 }}>
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => handleStatus(entry.id, s.value)}
                      style={{
                        padding: '3px 9px', borderRadius: 5, border: 'none', fontSize: 11,
                        fontWeight: 600, cursor: 'pointer',
                        background: entry.status === s.value ? s.color : '#f1f5f9',
                        color: entry.status === s.value ? '#ffffff' : '#64748b',
                        transition: 'all 0.1s',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Notes */}
                {isEditingThis ? (
                  <div style={{ marginTop: 6 }}>
                    <textarea
                      autoFocus
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        fontSize: 12, padding: '6px 8px', borderRadius: 5,
                        border: '1px solid #cbd5e1', resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button onClick={() => handleSaveNotes(entry.id)}
                        style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#0f172a', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>
                        Save
                      </button>
                      <button onClick={() => setEditingNotes(null)}
                        style={{ fontSize: 11, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => { setEditingNotes(entry.id); setNotesDraft(entry.notes || ''); }}
                    style={{
                      fontSize: 12, color: entry.notes ? '#475569' : '#94a3b8',
                      padding: '4px 0', cursor: 'text', minHeight: 18,
                    }}
                  >
                    {entry.notes || '+ Add notes…'}
                  </div>
                )}

                {/* Actions row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <div style={{ fontSize: 10, color: '#cbd5e1' }}>
                    Saved {new Date(entry.savedAt).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {onFlyTo && (
                      <button onClick={() => onFlyTo(entry)}
                        style={{ fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        📍 Map
                      </button>
                    )}
                    <button onClick={() => handleRemove(entry.id)}
                      style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 20px', borderTop: '1px solid #f1f5f9', fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
        {filtered.length} of {entries.length} shown · CSV exports current filter
      </div>
    </div>
  );
}
