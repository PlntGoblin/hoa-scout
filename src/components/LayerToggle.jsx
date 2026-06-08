export default function LayerToggle({ layers, onToggle }) {
  return (
    <div style={{
      position: 'absolute', top: 72, left: 16, zIndex: 10,
      background: '#ffffff', borderRadius: 10,
      boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {layers.map((layer, i) => (
        <button
          key={layer.id}
          onClick={() => onToggle(layer.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '9px 14px',
            background: 'none', border: 'none',
            borderBottom: i < layers.length - 1 ? '1px solid #f1f5f9' : 'none',
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          <span style={{
            width: 14, height: 14, borderRadius: 3, flexShrink: 0,
            background: layer.color,
            opacity: layer.visible ? 1 : 0.3,
            border: `2px solid ${layer.color}`,
          }} />
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: layer.visible ? '#1e293b' : '#94a3b8',
          }}>
            {layer.label}
          </span>
        </button>
      ))}
    </div>
  );
}
