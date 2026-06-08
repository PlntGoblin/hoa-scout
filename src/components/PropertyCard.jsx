import { detectOwnerOccupancy, assessorUrl } from '../lib/parcelLookup';
import { deriveConfidence } from '../lib/hoaStore';
import { sedonaStrRule } from '../lib/strRules';
import { sdStrRule } from '../lib/sdStrRules';

const CONFIDENCE_COLORS = {
  high:   { bg: '#d1fae5', text: '#065f46', label: 'High' },
  medium: { bg: '#fef3c7', text: '#92400e', label: 'Medium' },
  low:    { bg: '#fee2e2', text: '#991b1b', label: 'Low' },
};

const STR_POLICY_COLORS = {
  allowed:    { bg: '#d1fae5', text: '#065f46' },
  prohibited: { bg: '#fee2e2', text: '#991b1b' },
  unknown:    { bg: '#f1f5f9', text: '#64748b' },
};

function Badge({ color, children }) {
  return (
    <span style={{
      background: color.bg, color: color.text,
      padding: '2px 8px', borderRadius: 4,
      fontSize: 12, fontWeight: 600, display: 'inline-block',
    }}>
      {children}
    </span>
  );
}

function Row({ label, value, mono }) {
  if (value == null || value === '') return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#94a3b8', fontSize: 12, minWidth: 130, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 500, fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
    </div>
  );
}

export default function PropertyCard({ feature, parcel, hoa, market, loading, onClose, onAddHoa }) {
  if (!feature && !loading) return null;

  const isSd = market === 'sandiego';
  const occupancy = parcel ? detectOwnerOccupancy(parcel) : 'unknown';
  const county = parcel?.county ?? 'unknown';
  const countyLabel = county.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const confidence = deriveConfidence(parcel, hoa);
  const confStyle = CONFIDENCE_COLORS[confidence];

  const strRule = isSd ? sdStrRule({ parcel, hoa }) : sedonaStrRule({ hoa });
  const strPolicyKey = hoa?.strPolicy ?? 'unknown';
  const strColor = STR_POLICY_COLORS[strPolicyKey] || STR_POLICY_COLORS.unknown;

  const occupancyLabel =
    occupancy === 'absentee'      ? '⚠ Likely Absentee' :
    occupancy === 'owner-occupied' ? '✓ Likely Owner-Occupied' : 'Unknown';

  // Build "why surfaced" flags
  const flags = [];
  if (occupancy === 'absentee') flags.push('⚠ Likely absentee owner');
  if (hoa?.strPolicy === 'allowed') flags.push('✓ HOA permits STR');
  if (hoa?.strPolicy === 'prohibited') flags.push('✗ HOA prohibits STR');
  if (parcel) flags.push('📍 Parcel data matched');
  if (parcel?.county) flags.push(`🗺 County: ${parcel.county}`);

  return (
    <div style={{
      position: 'absolute', top: 16, right: 16, width: 360,
      background: '#ffffff', borderRadius: 12,
      boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
      overflow: 'hidden', zIndex: 10,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{ background: '#0f172a', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Property Card · {isSd ? 'San Diego, CA' : 'Sedona, AZ'}
          </div>
          <div style={{ color: '#f8fafc', fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
            {parcel?.siteAddress || feature?.properties?.address || 'Locating…'}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer', padding: 0, marginLeft: 8 }}>✕</button>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 16px', maxHeight: '75vh', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ color: '#64748b', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>Looking up parcel data…</div>
        ) : (
          <>
            {/* Confidence row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Confidence</span>
              <Badge color={confStyle}>{confStyle.label}</Badge>
              {parcel && (
                <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>
                  {countyLabel} Co.
                </span>
              )}
            </div>

            {/* Owner */}
            <SectionHeader>Owner</SectionHeader>
            <Row label="Name" value={parcel?.ownerName || 'Unavailable'} />
            <Row label="Mailing Address" value={parcel?.ownerMailingAddress || 'Unavailable'} />
            <Row label="Occupancy" value={occupancyLabel} />

            {/* Property */}
            <SectionHeader>Property</SectionHeader>
            <div style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: 12, minWidth: 130, flexShrink: 0 }}>APN</span>
              <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 500, fontFamily: 'monospace', flex: 1 }}>
                {parcel?.apn || '—'}
              </span>
              {assessorUrl(parcel?.county, parcel?.apn) && (
                <a
                  href={assessorUrl(parcel?.county, parcel?.apn)}
                  target="_blank"
                  rel="noreferrer"
                  title="View public record on county assessor website"
                  style={{
                    fontSize: 11, color: '#3b82f6', fontWeight: 600,
                    textDecoration: 'none', whiteSpace: 'nowrap',
                    background: '#eff6ff', padding: '2px 7px', borderRadius: 4,
                  }}
                >
                  🏛 Public Record ↗
                </a>
              )}
            </div>
            <Row label="Subdivision" value={parcel?.subdivision} />
            <Row label="Zoning" value={parcel?.zoning} />
            <Row label="Acres" value={parcel?.acres != null ? `${Number(parcel.acres).toFixed(2)} ac` : null} />
            <Row label="County" value={county !== 'unknown' ? `${countyLabel} County` : null} />
            {parcel?.bedrooms && <Row label="Beds / Baths" value={`${parcel.bedrooms} bd / ${parcel.bathrooms ?? '?'} ba`} />}
            {parcel?.squareFootage && <Row label="Sq Ft" value={parcel.squareFootage.toLocaleString()} />}
            {parcel?.yearBuilt && <Row label="Year Built" value={parcel.yearBuilt} />}
            {parcel?.assessedValue && <Row label="Assessed Value" value={`$${parcel.assessedValue.toLocaleString()}`} />}
            {parcel?.lastSalePrice && <Row label="Last Sale" value={`$${parcel.lastSalePrice.toLocaleString()}${parcel.lastSaleDate ? ` (${parcel.lastSaleDate.slice(0,7)})` : ''}`} />}
            {parcel?.source === 'rentcast' && (
              <div style={{ fontSize: 10, color: '#94a3b8', padding: '3px 0' }}>Source: RentCast</div>
            )}

            {/* HOA & STR */}
            <SectionHeader>{isSd ? 'STRO Tier' : 'HOA & STR'}</SectionHeader>

            {isSd ? (
              // San Diego: show STRO tier analysis
              <>
                {strRule.tier && (
                  <div style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8', fontSize: 12, minWidth: 130, flexShrink: 0 }}>License Tier</span>
                    <Badge color={strRule.cap ? STR_POLICY_COLORS.unknown : STR_POLICY_COLORS.allowed}>
                      {strRule.tierLabel}
                    </Badge>
                  </div>
                )}
                <Row label="Summary" value={strRule.summary} />
                {strRule.capNote && <Row label="⚠ Cap Status" value={strRule.capNote} />}
                {strRule.hoaNote && <Row label="HOA Note" value={strRule.hoaNote} />}
                <Row label="Permit Note" value={strRule.permitNote} />
              </>
            ) : (
              // Sedona: HOA knowledge layer
              <>
                {hoa ? (
                  <>
                    <Row label="HOA" value={hoa.name} />
                    <div style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#94a3b8', fontSize: 12, minWidth: 130, flexShrink: 0 }}>STR Policy</span>
                      <Badge color={strColor}>
                        {strPolicyKey === 'allowed' ? '✓ Allowed' : strPolicyKey === 'prohibited' ? '✗ Prohibited' : '? Unknown'}
                      </Badge>
                    </div>
                    {hoa.strPolicyNotes && <Row label="Notes" value={hoa.strPolicyNotes} />}
                    <Row label="Source" value={hoa.source} />
                    <Row label="Last Verified" value={hoa.lastVerified} />
                  </>
                ) : (
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                      {parcel?.subdivision
                        ? `"${parcel.subdivision}" not yet in HOA layer.`
                        : 'HOA membership unknown — no subdivision data.'}
                    </div>
                    <button
                      onClick={() => onAddHoa?.(parcel?.subdivision || '')}
                      style={{
                        padding: '7px 14px', borderRadius: 6, border: '1px solid #e2e8f0',
                        background: '#f8fafc', color: '#0f172a', fontSize: 12,
                        fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      + Add HOA Record
                    </button>
                  </div>
                )}
                <Row label="STR Summary" value={strRule.summary} />
                <Row label="Permit Warning" value={strRule.permitWarning} />
              </>
            )}

            {/* Official link */}
            <div style={{ padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>Official Source </span>
              <a href={strRule.officialLink} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: '#3b82f6' }}>
                {isSd ? 'SD STRO Info ↗' : 'Sedona STR Permits ↗'}
              </a>
            </div>

            {/* Why it surfaced */}
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Why It Surfaced
              </div>
              {flags.length ? (
                flags.map((f, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#475569', lineHeight: 1.8 }}>{f}</div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: '#94a3b8' }}>No signals — confidence is Low.</div>
              )}
            </div>

            {/* Disclaimer */}
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, lineHeight: 1.5 }}>
              Informational only. HOA STR rules must be verified against CC&Rs. Sedona city permits are non-transferable on sale.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: '#64748b',
      letterSpacing: '0.06em', textTransform: 'uppercase',
      margin: '14px 0 6px',
    }}>
      {children}
    </div>
  );
}
