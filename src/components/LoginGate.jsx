import { useState } from 'react';

const PASSWORD = import.meta.env.VITE_APP_PASSWORD;

export default function LoginGate({ children }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('ps_auth') === 'ok');
  const [input, setInput]   = useState('');
  const [error, setError]   = useState(false);
  const [shake, setShake]   = useState(false);

  if (authed) return children;

  function handleSubmit(e) {
    e.preventDefault();
    if (input === PASSWORD) {
      sessionStorage.setItem('ps_auth', 'ok');
      setAuthed(true);
    } else {
      setError(true);
      setShake(true);
      setInput('');
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        width: 360,
        background: '#ffffff',
        borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        animation: shake ? 'shake 0.4s ease' : 'none',
      }}>
        {/* Header */}
        <div style={{
          background: '#0f172a',
          padding: '32px 32px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏠</div>
          <div style={{ color: '#f8fafc', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Property Scout
          </div>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
            Sedona · San Diego · Nashville
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '28px 32px 32px' }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Password
            </label>
            <input
              type="password"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(false); }}
              autoFocus
              placeholder="Enter password"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 14px',
                borderRadius: 8,
                border: error ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                fontSize: 14,
                outline: 'none',
                background: error ? '#fff5f5' : '#f8fafc',
                color: '#0f172a',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            />
            {error && (
              <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6, fontWeight: 500 }}>
                Incorrect password — try again.
              </div>
            )}
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 8,
              border: 'none',
              background: '#0f172a',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.01em',
            }}
          >
            Sign In →
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
