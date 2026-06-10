import { detectOwnerOccupancy, assessorUrl } from '../lib/markets/parcelLookup';
import { deriveConfidence } from '../lib/store/hoaStore';
import { sedonaStrRule } from '../lib/markets/sedona/strRules';
import { sdStrRule } from '../lib/markets/sandiego/strRules';
import { nashvilleStrRule } from '../lib/markets/nashville/strRules';
import { computeScore } from '../lib/scoring/opportunityScore';
import { isShortlisted } from '../lib/store/shortlistStore';

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

const AIRBNB_LINKS = {
  sedona:    'https://insideairbnb.com/sedona/',
  sandiego:  'https://insideairbnb.com/san-diego/',
  nashville: 'https://insideairbnb.com/nashville/',
};

function rabbuUrl(address) {
  if (!address) return 'https://rabbu.com';
  return `https://rabbu.com/search?address=${encodeURIComponent(address)}`;
}

function fmt$(n) {
  if (n == null) return null;
  return `$${Number(n).toLocaleString()}`;
}

export default function PropertyCard({ feature, parcel, hoa, market, loading, avm, avmLoading, strPermit, onGetAvm, onClose, onAddHoa, onShortlist, onToggleStar, pinId, pinStarred }) {
  if (!feature && !loading) return null;

  const isSd        = market === 'sandiego';
  const isNashville = market === 'nashville';
  const occupancy = parcel ? detectOwnerOccupancy(parcel) : 'unknown';
  const county = parcel?.county ?? 'unknown';
  const countyLabel = county.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const confidence = deriveConfidence(parcel, hoa);
  const confStyle = CONFIDENCE_COLORS[confidence];

  const strRule = isSd        ? sdStrRule({ parcel, hoa })
                : isNashville ? nashvilleStrRule({ parcel, hoa })
                : sedonaStrRule({ hoa });

  const { score, breakdown } = computeScore({ parcel, hoa, strRule, avm, market });
  const shortlisted = pinId ? isShortlisted(pinId) : false;
  const scoreColor = score >= 70 ? { bg: '#d1fae5', text: '#065f46' }
                   : score >= 40 ? { bg: '#fef3c7', text: '#92400e' }
                   : { bg: '#fee2e2', text: '#991b1b' };
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
  if (parcel?.county) flags.push(`🗺 County: ${countyLabel}`);

  return (
    <div style={{
      position: 'absolute', top: 16, right: 16, width: 360,
      background: '#ffffff', borderRadius: 12,
      boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
      overflow: 'hidden', zIndex: 10,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{ background: '#0f172a', padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              Property Card · {isSd ? 'San Diego, CA' : isNashville ? 'Nashville, TN' : 'Sedona, AZ'}
            </div>
            <div style={{ color: '#f8fafc', fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
              {parcel?.siteAddress || feature?.properties?.address || 'Locating…'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
            {/* Opportunity score badge */}
            {!loading && parcel && (
              <div style={{
                background: scoreColor.bg, color: scoreColor.text,
                borderRadius: 6, padding: '3px 9px',
                fontSize: 13, fontWeight: 700, flexShrink: 0,
              }} title="Opportunity score — prioritization aid, not a recommendation">
                {score}/100
              </div>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer', padding: 0 }}>✕</button>
          </div>
        </div>
        {/* Star + Shortlist buttons */}
        {!loading && parcel && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button
              onClick={() => onToggleStar?.()}
              title={pinStarred ? 'Remove star' : 'Star this property'}
              style={{
                padding: '7px 12px', borderRadius: 6, border: 'none',
                background: pinStarred ? '#854d0e' : '#1e293b',
                fontSize: 15, cursor: 'pointer', flexShrink: 0,
              }}
            >
              {pinStarred ? '⭐' : '☆'}
            </button>
            <button
              onClick={() => onShortlist?.({ score })}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 6,
                border: shortlisted ? '1px solid #3b82f6' : '1px solid #334155',
                background: shortlisted ? '#1d4ed8' : '#1e293b',
                color: shortlisted ? '#fff' : '#94a3b8',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {shortlisted ? '✓ On Shortlist' : '+ Add to Shortlist'}
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '12px 16px', maxHeight: '75vh', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '8px 0' }}>
            {/* Section label skeleton */}
            <div className="skeleton" style={{ height: 10, width: 60, marginBottom: 12 }} />
            {/* Owner rows */}
            <div className="skeleton" style={{ height: 13, width: '80%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 13, width: '65%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 13, width: '45%', marginBottom: 20 }} />
            {/* Property section */}
            <div className="skeleton" style={{ height: 10, width: 60, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 13, width: '55%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 13, width: '70%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 13, width: '40%', marginBottom: 20 }} />
            {/* STR section */}
            <div className="skeleton" style={{ height: 10, width: 80, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 32, width: '100%', borderRadius: 6, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 13, width: '90%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 13, width: '75%' }} />
          </div>
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

            {/* HOA quick badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>HOA</span>
              <Badge color={hoa ? STR_POLICY_COLORS.allowed : STR_POLICY_COLORS.prohibited}>
                {hoa ? '✓ Yes' : '✗ No'}
              </Badge>
              {hoa?.name && (
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{hoa.name}</span>
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
            {parcel?.source === 'rentcast' && (
              <div style={{ fontSize: 10, color: '#94a3b8', padding: '3px 0' }}>Source: RentCast</div>
            )}

            {/* HOA & STR */}
            <SectionHeader>
              {isSd ? 'STRO Tier' : isNashville ? 'STR Zone Eligibility' : 'HOA & STR'}
            </SectionHeader>

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
            ) : isNashville ? (
              // Nashville: zone-based eligibility
              <>
                <div style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', fontSize: 12, minWidth: 130, flexShrink: 0 }}>Zone Ruling</span>
                  <Badge color={
                    strRule.eligible === true  ? STR_POLICY_COLORS.allowed :
                    strRule.eligible === false ? STR_POLICY_COLORS.prohibited :
                    STR_POLICY_COLORS.unknown
                  }>
                    {strRule.tierLabel}
                  </Badge>
                </div>
                <Row label="Summary" value={strRule.summary} />
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
                {isSd ? 'SD STRO Info ↗' : isNashville ? 'Nashville STR Permits ↗' : 'Sedona STR Permits ↗'}
              </a>
            </div>

            {/* Nashville: active permit badge */}
            {isNashville && strPermit && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#94a3b8', fontSize: 12, minWidth: 130, flexShrink: 0 }}>Active STR Permit</span>
                <Badge color={strPermit.hasPermit ? STR_POLICY_COLORS.allowed : STR_POLICY_COLORS.prohibited}>
                  {strPermit.hasPermit ? `✓ Yes (${strPermit.activeCount})` : '✗ None on record'}
                </Badge>
              </div>
            )}

            {/* Financial */}
            <SectionHeader>Financial</SectionHeader>
            {parcel?.assessedValue && (
              <Row label="Assessed Value" value={fmt$(parcel.assessedValue)} />
            )}
            {parcel?.lastSalePrice && (
              <Row label="Last Sale" value={`${fmt$(parcel.lastSalePrice)}${parcel.lastSaleDate ? ` (${parcel.lastSaleDate.slice(0,7)})` : ''}`} />
            )}

            {/* AVM / Rent estimate */}
            {avm ? (
              <>
                {avm.estimatedValue && (
                  <Row label="Est. Market Value" value={
                    avm.valueLow && avm.valueHigh
                      ? `${fmt$(avm.estimatedValue)} (${fmt$(avm.valueLow)}–${fmt$(avm.valueHigh)})`
                      : fmt$(avm.estimatedValue)
                  } />
                )}
                {avm.estimatedRent && (
                  <Row label="Est. Monthly Rent" value={
                    avm.rentLow && avm.rentHigh
                      ? `${fmt$(avm.estimatedRent)}/mo (${fmt$(avm.rentLow)}–${fmt$(avm.rentHigh)})`
                      : `${fmt$(avm.estimatedRent)}/mo`
                  } />
                )}
                <div style={{ fontSize: 10, color: '#94a3b8', padding: '3px 0' }}>
                  Source: RentCast AVM — estimate only, not an appraisal
                </div>
              </>
            ) : (
              parcel?.siteAddress && (
                <div style={{ padding: '6px 0' }}>
                  <button
                    onClick={onGetAvm}
                    disabled={avmLoading}
                    style={{
                      padding: '6px 13px', borderRadius: 6,
                      border: '1px solid #e2e8f0',
                      background: avmLoading ? '#f1f5f9' : '#f8fafc',
                      color: '#0f172a', fontSize: 12, fontWeight: 600,
                      cursor: avmLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {avmLoading ? 'Fetching…' : '💰 Get Rent Estimate'}
                  </button>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                    Uses 2 RentCast credits (50/mo limit)
                  </div>
                </div>
              )
            )}

            {/* STR comps */}
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', marginTop: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                STR Comps
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <a
                  href={rabbuUrl(parcel?.siteAddress)}
                  target="_blank" rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 10px', borderRadius: 6,
                    background: '#fff', border: '1px solid #e2e8f0',
                    textDecoration: 'none', color: '#1e293b',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>Rabbu ↗</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>Per-property STR revenue estimate</div>
                  </div>
                  <span style={{ fontSize: 10, background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Free</span>
                </a>
                <a
                  href={AIRBNB_LINKS[market] || 'https://insideairbnb.com'}
                  target="_blank" rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 10px', borderRadius: 6,
                    background: '#fff', border: '1px solid #e2e8f0',
                    textDecoration: 'none', color: '#1e293b',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>Inside Airbnb ↗</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>Market-level occupancy &amp; ADR data</div>
                  </div>
                  <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Historical</span>
                </a>
              </div>
            </div>

            {/* Why it surfaced — score breakdown */}
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Opportunity Score
                </div>
                <div style={{
                  background: scoreColor.bg, color: scoreColor.text,
                  borderRadius: 5, padding: '2px 8px', fontSize: 12, fontWeight: 700,
                }}>
                  {score}/100
                </div>
              </div>
              {breakdown.map(({ flag, fired, label, weight, points }) => (
                <div key={flag} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, lineHeight: 2, color: fired ? '#1e293b' : '#cbd5e1' }}>
                  <span style={{ width: 14, textAlign: 'center' }}>{fired ? '✓' : '○'}</span>
                  <span style={{ flex: 1 }}>{label}</span>
                  <span style={{ fontSize: 11, color: fired ? '#64748b' : '#e2e8f0' }}>+{points}/{weight}</span>
                </div>
              ))}
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
                Prioritization aid only — does not certify eligibility.
              </div>
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
