# Property Scout

A map-first STR (short-term rental) and HOA scouting tool for real estate investors. Click any parcel, get owner data, zoning analysis, STR eligibility, opportunity scoring, and rent estimates — all in one place.

**Markets:** Sedona AZ · San Diego CA · Nashville TN

---

## What It Does

- **Click a parcel on the map** → instant owner name, mailing address, APN, and assessed value pulled from county GIS
- **STR eligibility verdict** → market-specific zoning rules tell you whether short-term rentals are permitted, restricted, or prohibited at that address
- **HOA layer** → track HOA STR policies per subdivision; badge on every property card shows HOA Yes / HOA No
- **Opportunity score** → weighted 0–100 score based on absentee ownership, zone permissibility, HOA stance, and data coverage
- **Shortlist panel** → save properties with status (New / Researching / Pitched / Pass), notes, and one-click CSV export
- **Pin memory** → searched properties persist per market; star your favorites; recent searches appear in the search dropdown
- **AVM + rent estimate** → on-demand RentCast integration for estimated value and long-term rent (50/month limit tracked in-app)
- **STR comps links** → direct links to Rabbu and Inside Airbnb for each property

---

## Market Coverage

| Market | Parcel Data | Zoning Model | Permit Data |
|---|---|---|---|
| **Sedona, AZ** | Yavapai County GIS → RentCast fallback | HOA-gated overlay zones | — |
| **San Diego, CA** | SANDAG GIS → RentCast fallback | Tier 1 / Tier 2 / Mission Beach | — |
| **Nashville, TN** | Metro Nashville GIS (owner data native) | Permitted-zone model (MUL/ORI/commercial = ✓) | Socrata permit dataset |

---

## Project Structure

```
src/
├── App.jsx                        # Root — map, market switcher, all state
├── components/
│   ├── PropertyCard.jsx           # Main property detail panel
│   ├── AddressSearch.jsx          # Search bar with recents dropdown
│   ├── HoaCapture.jsx             # HOA record entry form
│   ├── HoaList.jsx                # HOA knowledge layer browser
│   ├── ShortlistPanel.jsx         # Shortlist CRUD + CSV export
│   └── UsageTracker.jsx           # RentCast API usage meter
└── lib/
    ├── api/
    │   ├── geocoder.js            # MapTiler address geocoding
    │   └── rentcast.js            # RentCast AVM + rent estimate (fallback)
    ├── markets/
    │   ├── parcelLookup.js        # Geographic router → correct market handler
    │   ├── sedona/
    │   │   └── strRules.js        # Sedona overlay zone STR rules
    │   ├── sandiego/
    │   │   ├── parcelLookup.js    # SANDAG GIS queries
    │   │   └── strRules.js        # SD tier 1/2/Mission Beach rules
    │   └── nashville/
    │       ├── parcelLookup.js    # Metro Nashville ArcGIS (parcels + zoning + CPA)
    │       ├── strRules.js        # Nashville permitted-zone model
    │       └── permitLookup.js    # Socrata STR permit dataset
    ├── scoring/
    │   ├── opportunityScore.js    # Weighted flag engine (0–100)
    │   └── csvExport.js           # 19-column CSV generator
    └── store/
        ├── hoaStore.js            # HOA knowledge layer (localStorage)
        ├── pinStore.js            # Pin memory, stars, recents (localStorage)
        ├── seedHoas.js            # Pre-seeded HOA/CPA records (v4)
        └── shortlistStore.js      # Shortlist CRUD + status tracking
```

---

## Setup

### Prerequisites
- Node.js 18+
- Free [MapTiler](https://cloud.maptiler.com/) API key (basemap tiles)
- Optional: [RentCast](https://www.rentcast.io/) API key (AVM + rent estimates, 50 calls/month free)

### Install & Run

```bash
npm install
cp .env.example .env   # then fill in your keys
npm run dev
```

### Environment Variables

```
VITE_MAPTILER_KEY=your_maptiler_key_here
VITE_RENTCAST_KEY=your_rentcast_key_here   # optional — AVM features disabled without it
```

> ⚠️ `.env` is gitignored. Never commit API keys.

---

## Data Sources

All parcel and zoning data is fetched live from public GIS endpoints — no backend required.

| Source | Used For |
|---|---|
| [Yavapai County GIS](https://gis.yavapai.us/) | Sedona parcel data |
| [SANDAG GIS](https://gis.sandag.org/) | San Diego parcel data |
| [Metro Nashville GIS](https://maps.nashville.gov/) | Nashville parcels, zoning, CPAs |
| [Nashville Open Data](https://data.nashville.gov/) | STR permit records (Socrata) |
| [MapTiler](https://cloud.maptiler.com/) | Basemap tiles |
| [RentCast](https://www.rentcast.io/) | AVM + long-term rent estimates (fallback/optional) |
| [Rabbu](https://www.rabbu.com/) | STR revenue estimates (linked, not fetched) |
| [Inside Airbnb](http://insideairbnb.com/) | Market-level STR comps (linked, not fetched) |

---

## Opportunity Score Weights

Default weights (editable in-app via the score breakdown panel):

| Signal | Weight |
|---|---|
| Absentee owner (mailing ≠ site address) | 30 |
| STR zone permitted | 30 |
| HOA allows STR | 20 |
| Parcel data available | 10 |
| Rent estimate available | 10 |

---

## Tests

```bash
npm test
```

94 tests across 7 suites covering parcel lookup routing, all three STR rule engines, HOA store, opportunity scoring, and CSV export.

---

## Shortlist CSV Columns

`address`, `market`, `county`, `apn`, `owner_name`, `owner_mailing`, `zoning`, `land_use`, `str_eligible`, `hoa_name`, `hoa_str_policy`, `opportunity_score`, `status`, `notes`, `estimated_value`, `rent_estimate`, `assessed_value`, `last_sale_price`, `saved_at`
