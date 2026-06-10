import { useState, useRef, useEffect } from 'react';
import { geocodeAddress } from '../lib/api/geocoder';
import { getRecents, removeRecent } from '../lib/store/pinStore';

const PLACEHOLDERS = {
  sedona:    'Enter a Sedona address…',
  sandiego:  'Enter a San Diego address…',
  nashville: 'Enter a Nashville address…',
};

const HINTS = {
  sedona:    '"Sedona, AZ"',
  sandiego:  '"San Diego, CA"',
  nashville: '"Nashville, TN"',
};

export default function AddressSearch({ onResult, market }) {
  const [query, setQuery]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [showRecents, setShowRecents] = useState(false);
  const [recents, setRecents]   = useState(() => getRecents());
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowRecents(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleSearch(e) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setShowRecents(false);
    const result = await geocodeAddress(q);
    setLoading(false);
    if (!result) {
      setError(`Address not found. Try adding ${HINTS[market] || ''} to your query.`);
      return;
    }
    onResult(result);
    setQuery('');
  }

  async function handleRecentClick(recent) {
    setShowRecents(false);
    setQuery(recent.display);
    // Re-geocode to get fresh coords, or use stored ones directly
    if (recent.lng != null && recent.lat != null) {
      onResult({ lng: recent.lng, lat: recent.lat, display: recent.display });
      setQuery('');
    } else {
      setQuery(recent.display);
    }
  }

  function handleRemoveRecent(e, display) {
    e.stopPropagation();
    removeRecent(display);
    setRecents(getRecents());
  }

  const filteredRecents = query.trim()
    ? recents.filter((r) => r.display.toLowerCase().includes(query.toLowerCase()))
    : recents;

  const showDropdown = showRecents && filteredRecents.length > 0;

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute', top: 16, left: 16, zIndex: 10, width: 320,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setError(null); }}
            onFocus={() => setShowRecents(true)}
            placeholder={PLACEHOLDERS[market] || 'Enter an address…'}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 14px', borderRadius: 8,
              border: showDropdown ? '1px solid #3b82f6' : '1px solid #e2e8f0',
              borderBottomLeftRadius: showDropdown ? 0 : 8,
              borderBottomRightRadius: showDropdown ? 0 : 8,
              fontSize: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              outline: 'none', background: '#ffffff',
              transition: 'border-color 0.15s',
            }}
          />

          {/* Recents dropdown */}
          {showDropdown && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: '#ffffff',
              border: '1px solid #3b82f6', borderTop: 'none',
              borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
              boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
              overflow: 'hidden', zIndex: 20,
            }}>
              <div style={{ padding: '6px 12px 4px', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Recent
              </div>
              {filteredRecents.map((r) => (
                <div
                  key={r.display}
                  onClick={() => handleRecentClick(r)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', cursor: 'pointer',
                    borderTop: '1px solid #f1f5f9',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 13, flexShrink: 0 }}>
                    {r.starred ? '⭐' : '🕐'}
                  </span>
                  <span style={{ fontSize: 12, color: '#1e293b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.display}
                  </span>
                  {r.market && r.market !== market && (
                    <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>
                      {r.market === 'sandiego' ? 'SD' : r.market === 'nashville' ? 'NSH' : 'SED'}
                    </span>
                  )}
                  <button
                    onClick={(e) => handleRemoveRecent(e, r.display)}
                    style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: 14, cursor: 'pointer', padding: '0 0 0 4px', lineHeight: 1, flexShrink: 0 }}
                    title="Remove from history"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 16px', borderRadius: 8, border: 'none',
            background: '#0f172a', color: '#ffffff',
            fontSize: 14, fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            flexShrink: 0,
          }}
        >
          {loading ? '…' : 'Search'}
        </button>
      </form>

      {error && (
        <div style={{
          marginTop: 8, background: '#fee2e2', color: '#991b1b',
          borderRadius: 6, padding: '8px 12px', fontSize: 12,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
