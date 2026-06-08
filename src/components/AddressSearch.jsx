import { useState } from 'react';
import { geocodeAddress } from '../lib/geocoder';

export default function AddressSearch({ onResult, market }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    const result = await geocodeAddress(query.trim());
    setLoading(false);
    if (!result) {
      const hint = market === 'sandiego' ? '"San Diego, CA"' : '"Sedona, AZ"';
      setError(`Address not found. Try adding ${hint} to your query.`);
      return;
    }
    onResult(result);
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
        width: 320,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={market === 'sandiego' ? 'Enter a San Diego address…' : 'Enter a Sedona address…'}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            fontSize: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            outline: 'none',
            background: '#ffffff',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#0f172a',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {loading ? '…' : 'Search'}
        </button>
      </form>
      {error && (
        <div
          style={{
            marginTop: 8,
            background: '#fee2e2',
            color: '#991b1b',
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
