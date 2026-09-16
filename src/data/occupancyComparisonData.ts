export interface OccupancyComparisonRow {
  groupCode: string; // e.g. "Group A1"
  groupLetter: string; // e.g. "A1"
  titleEn: string; // e.g. "Residential"
  titleMl: string; // e.g. "പാർപ്പിടങ്ങൾ"
  categoryType:
    | "Residential"
    | "Institutional"
    | "Assembly"
    | "Commercial"
    | "Industrial"
    | "Storage"
    | "Hazardous"
    | "Special";
  description: string;
  maxCoverage: {
    catI: string;
    catII: string;
    display: string;
    note?: string;
  };
  fsi: {
    catI: { basic: number; maxWithFee: number; display: string };
    catII: { basic: number; maxWithFee: number; display: string };
    display: string;
    isUnrestricted?: boolean;
  };
  setbacksUpTo10m: {
    front: { avg: string; min: string };
    rear: { avg: string; min: string };
    side: { avg: string; min: string };
    display: string;
    conditions?: string;
  };
  minRoadWidth: {
    range: string;
    details: string;
  };
  carParkingRate: {
    summary: string;
    details: string;
  };
  ctpDtpThreshold: {
    threshold: string;
    details: string;
    isAllMandatory?: boolean;
  };
  badgeColor: {
    bg: string;
    border: string;
    text: string;
    dot: string;
  };
  highlights: string[];
}

export interface StatutoryHighlight {
  ruleNo: string;
  title: string;
  titleMl: string;
  summary: string;
  details: string[];
  badge: string;
  color: string;
}

export const OCCUPANCY_COMPARISON_DATA: OccupancyComparisonRow[] = [
  {
    groupCode: "Group A1",
    groupLetter: "A1",
    titleEn: "Residential",
    titleMl: "പാർപ്പിടങ്ങൾ",
    categoryType: "Residential",
    description: "Single/Multi-family dwellings, residential apartments, and flats.",
    maxCoverage: {
      catI: "65%",
      catII: "60%",
      display: "65% / 60%"
    },
    fsi: {
      catI: { basic: 3.0, maxWithFee: 4.0, display: "3.0 / 4.0" },
      catII: { basic: 2.5, maxWithFee: 2.5, display: "2.5 / 2.5" },
      display: "3.0 / 4.0 (Cat I) | 2.5 / 2.5 (Cat II)"
    },
    setbacksUpTo10m: {
      front: { avg: "3.0m", min: "1.8m" },
      rear: { avg: "1.5m", min: "1.0m" },
      side: { avg: "1.0m", min: "1.0m" },
      display: "3.0m Avg (1.8m Min) / 1.5m Avg (1.0m Min) / 1.0m Avg (1.0m Min)",
      conditions: "For heights up to 10m. Add 0.5m setback per 3m height above 10m."
    },
    minRoadWidth: {
      range: "1.20m to 8.00m",
      details: "1.20m for single dwelling; increases up to 8.00m depending on unit count & total area."
    },
    carParkingRate: {
      summary: "1 slot per 2 units (<=75 sq.m) up to 2 slots per unit (>300 sq.m) + 15% Visitor parking",
      details: "Slab-based: <=75 sq.m (0.5/unit), 76-150 sq.m (1/unit), 151-300 sq.m (1.5/unit), >300 sq.m (2/unit). Mandatory 15% additional visitor parking in apartment complexes."
    },
    ctpDtpThreshold: {
      threshold: ">100 dwelling units",
      details: "Layout approval required from Chief Town Planner (CTP) / District Town Planner (DTP) if exceeding 100 units."
    },
    badgeColor: {
      bg: "bg-emerald-950/80",
      border: "border-emerald-700/80",
      text: "text-emerald-300",
      dot: "bg-emerald-400"
    },
    highlights: [
      "Small plot relaxation under Rule 50 applies (up to 125 sq.m plots with <=200 sq.m area).",
      "Low risk category applies for buildings up to 300 sq.m & 2 floors.",
      "15% mandatory visitor parking for apartment complexes."
    ]
  },
  {
    groupCode: "Group A2",
    groupLetter: "A2",
    titleEn: "Special Residential",
    titleMl: "പ്രത്യേക പാർപ്പിടങ്ങൾ / ലോഡ്ജുകൾ",
    categoryType: "Residential",
    description: "Lodging houses, hotels, hostels, dormitories, boarding houses, old age homes, resorts.",
    maxCoverage: {
      catI: "65%",
      catII: "55%",
      display: "65% / 55%"
    },
    fsi: {
      catI: { basic: 2.5, maxWithFee: 4.0, display: "2.5 / 4.0" },
      catII: { basic: 1.5, maxWithFee: 2.25, display: "1.5 / 2.25" },
      display: "2.5 / 4.0 (Cat I) | 1.5 / 2.25 (Cat II)"
    },
    setbacksUpTo10m: {
      front: { avg: "3.0m", min: "1.8m" },
      rear: { avg: "1.5m", min: "1.0m" },
      side: { avg: "1.0m", min: "1.0m" },
      display: "3.0m Avg (1.8m Min) / 1.5m Avg (1.0m Min) / 1.0m Avg (1.0m Min)",
      conditions: "Side yard minimum 1.0m; increased setbacks for high-density lodges."
    },
    minRoadWidth: {
      range: "2.40m to 8.00m",
      details: "2.40m (up to 300 sq.m) up to 8.00m (>18,000 sq.m built-up area)."
    },
    carParkingRate: {
      summary: "1 slot per 90 sq.m up to 1200 sq.m; 1 per 60 sq.m thereafter",
      details: "1 parking slot for every 90 sq.m up to 1200 sq.m, and 1 slot for every 60 sq.m of floor area exceeding 1200 sq.m."
    },
    ctpDtpThreshold: {
      threshold: ">8,000 sq.m built-up area",
      details: "Town Planner / CTP clearance required when total built-up area exceeds 8,000 sq.m."
    },
    badgeColor: {
      bg: "bg-teal-950/80",
      border: "border-teal-700/80",
      text: "text-teal-300",
      dot: "bg-teal-400"
    },
    highlights: [
      "Rule 42 disabled accessibility facilities mandatory for all A2 buildings.",
      "Fire NOC mandatory if height exceeds 15m or floor area exceeds threshold.",
      "Higher road width requirements above 18,000 sq.m."
    ]
  },
  {
    groupCode: "Group B",
    groupLetter: "B",
    titleEn: "Educational",
    titleMl: "വിദ്യാഭ്യാസ സ്ഥാപനങ്ങൾ",
    categoryType: "Institutional",
    description: "Schools, colleges, higher educational institutions, training centres.",
    maxCoverage: {
      catI: "35% (Schools) / 50% (Colleges)",
      catII: "35% (Schools) / 45% (Colleges)",
      display: "35% / 35% (Schools) | 50% / 45% (Colleges)"
    },
    fsi: {
      catI: { basic: 2.5, maxWithFee: 3.0, display: "2.5 / 3.0" },
      catII: { basic: 1.5, maxWithFee: 1.75, display: "1.5 / 1.75" },
      display: "2.5 / 3.0 (Cat I) | 1.5 / 1.75 (Cat II)"
    },
    setbacksUpTo10m: {
      front: { avg: "5.0m", min: "3.0m" },
      rear: { avg: "2.0m", min: "1.5m" },
      side: { avg: "2.0m", min: "1.5m" },
      display: "5.0m Avg (3.0m Min) / 2.0m Avg (1.5m Min) / 2.0m Avg (1.5m Min)",
      conditions: "Applies to 200–500 sq.m; larger institutions require wider clearances for bus circulation."
    },
    minRoadWidth: {
      range: "1.20m to 7.00m+",
      details: "1.20m (up to 300 sq.m) up to 7.00m+ (>12,000 sq.m)."
    },
    carParkingRate: {
      summary: "1 slot per 300 sq.m (Schools); 1 slot per 120 sq.m (Colleges)",
      details: "Plus mandatory bus parking / school van parking and safe student drop-off zones off-street."
    },
    ctpDtpThreshold: {
      threshold: ">8,000 sq.m built-up area",
      details: "CTP/DTP approval mandated above 8,000 sq.m."
    },
    badgeColor: {
      bg: "bg-blue-950/80",
      border: "border-blue-700/80",
      text: "text-blue-300",
      dot: "bg-blue-400"
    },
    highlights: [
      "Strict playground and open space requirements mandated under KPBR Chapter VII.",
      "Dedicated school bus parking and student drop-off bays required.",
      "Accessible toilets and ramps mandated under Rule 42."
    ]
  },
  {
    groupCode: "Group C",
    groupLetter: "C",
    titleEn: "Medical / Hospital",
    titleMl: "ചികിത്സാ സ്ഥാപനങ്ങൾ / ആശുപത്രികൾ",
    categoryType: "Institutional",
    description: "Hospitals, medical clinics, nursing homes, dispensaries.",
    maxCoverage: {
      catI: "50%",
      catII: "45%",
      display: "50% / 45%"
    },
    fsi: {
      catI: { basic: 2.5, maxWithFee: 3.5, display: "2.5 / 3.5" },
      catII: { basic: 2.5, maxWithFee: 2.5, display: "2.5 / 2.5" },
      display: "2.5 / 3.5 (Cat I) | 2.5 / 2.5 (Cat II)"
    },
    setbacksUpTo10m: {
      front: { avg: "5.0m", min: "3.0m" },
      rear: { avg: "2.0m", min: "1.5m" },
      side: { avg: "2.0m", min: "1.5m" },
      display: "5.0m Avg (3.0m Min) / 2.0m Avg (1.5m Min) / 2.0m Avg (1.5m Min)",
      conditions: "For 200–500 sq.m; ambulance drive-around clearances apply."
    },
    minRoadWidth: {
      range: "1.20m to 7.00m+",
      details: "1.20m (up to 300 sq.m) up to 7.00m+ (>12,000 sq.m). Emergency ambulance access required."
    },
    carParkingRate: {
      summary: "1 slot per 90 sq.m of floor area",
      details: "1 slot per 90 sq.m floor area, plus mandatory ambulance parking bay(s) and emergency patient drop-off porch."
    },
    ctpDtpThreshold: {
      threshold: ">6,000 sq.m built-up area",
      details: "Layout clearance required from DTP/CTP above 6,000 sq.m."
    },
    badgeColor: {
      bg: "bg-rose-950/80",
      border: "border-rose-700/80",
      text: "text-rose-300",
      dot: "bg-rose-400"
    },
    highlights: [
      "Mandatory biomedical waste treatment plant (STP/ETP) space allocation.",
      "Clear fire-tender path minimum 5.0m around hospital blocks.",
      "Stretcher-friendly lifts mandatory if ground + 1 floor or higher."
    ]
  },
  {
    groupCode: "Group D",
    groupLetter: "D",
    titleEn: "Assembly",
    titleMl: "സമ്മേളന ശാലകൾ / കല്യാണമണ്ഡപങ്ങൾ",
    categoryType: "Assembly",
    description: "Kalyanamandapams, auditoriums, community/wedding halls, convention centres.",
    maxCoverage: {
      catI: "40%",
      catII: "35%",
      display: "40% / 35%"
    },
    fsi: {
      catI: { basic: 1.5, maxWithFee: 2.5, display: "1.5 / 2.5" },
      catII: { basic: 0.7, maxWithFee: 1.25, display: "0.7 / 1.25" },
      display: "1.5 / 2.5 (Cat I) | 0.7 / 1.25 (Cat II)"
    },
    setbacksUpTo10m: {
      front: { avg: "6.0m", min: "4.5m" },
      rear: { avg: "2.0m", min: "1.5m" },
      side: { avg: "2.0m", min: "1.5m" },
      display: "6.0m Avg (4.5m Min) / 2.0m Avg (1.5m Min) / 2.0m Avg (1.5m Min)",
      conditions: "For 200–500 sq.m; front yard 6.0m avg ensures safe pedestrian egress."
    },
    minRoadWidth: {
      range: "1.20m to 7.00m+",
      details: "1.20m (up to 300 sq.m) up to 7.00m+ (>12,000 sq.m)."
    },
    carParkingRate: {
      summary: "1 slot per 15 sq.m (Auditoriums/Halls); 1 per 20 sq.m (Others)",
      details: "High-density parking mandate: 1 slot for every 15 sq.m in auditoriums/wedding halls; 1 per 20 sq.m for other assembly spaces."
    },
    ctpDtpThreshold: {
      threshold: ">3,000 sq.m built-up area",
      details: "Strict threshold: CTP/DTP layout approval required above 3,000 sq.m."
    },
    badgeColor: {
      bg: "bg-purple-950/80",
      border: "border-purple-700/80",
      text: "text-purple-300",
      dot: "bg-purple-400"
    },
    highlights: [
      "Highest parking density among all occupancy groups (1 per 15 sq.m).",
      "Multiple emergency exit doors opening outward directly to exterior yards.",
      "Substantial open yards for peak crowd dispersal."
    ]
  },
  {
    groupCode: "Group D1",
    groupLetter: "D1",
    titleEn: "Recreational",
    titleMl: "വിനോദ കേന്ദ്രങ്ങൾ",
    categoryType: "Assembly",
    description: "Cultural/recreational centres, sports complexes, amusement structures, exhibition buildings.",
    maxCoverage: {
      catI: "70%",
      catII: "70%",
      display: "70% / 70%"
    },
    fsi: {
      catI: { basic: 1.5, maxWithFee: 1.5, display: "1.5 / 1.5" },
      catII: { basic: 1.5, maxWithFee: 1.5, display: "1.5 / 1.5" },
      display: "1.5 / 1.5 (Cat I) | 1.5 / 1.5 (Cat II)"
    },
    setbacksUpTo10m: {
      front: { avg: "3.0m", min: "3.0m" },
      rear: { avg: "1.5m", min: "1.5m" },
      side: { avg: "1.5m", min: "1.5m" },
      display: "3.0m / 1.5m / 1.5m (Uniform minimums)",
      conditions: "Uniform minimum setbacks around the structural footprint."
    },
    minRoadWidth: {
      range: "1.20m to 7.00m+",
      details: "1.20m (up to 300 sq.m) up to 7.00m+ (>12,000 sq.m)."
    },
    carParkingRate: {
      summary: "1 slot per 250 sq.m of floor area",
      details: "1 slot for every 250 sq.m of built-up floor area."
    },
    ctpDtpThreshold: {
      threshold: ">3,000 sq.m built-up area",
      details: "CTP/DTP approval mandated above 3,000 sq.m."
    },
    badgeColor: {
      bg: "bg-fuchsia-950/80",
      border: "border-fuchsia-700/80",
      text: "text-fuchsia-300",
      dot: "bg-fuchsia-400"
    },
    highlights: [
      "Higher permissible coverage (up to 70%) to facilitate open sports pavilions.",
      "FSI capped strictly at 1.5 without fee escalation.",
      "Crowd control barriers and emergency lighting required."
    ]
  },
  {
    groupCode: "Group E",
    groupLetter: "E",
    titleEn: "Office",
    titleMl: "ഓഫീസുകൾ / ഐ.ടി പാർക്കുകൾ",
    categoryType: "Commercial",
    description: "Public/private administrative offices, corporate offices, IT/software development centres.",
    maxCoverage: {
      catI: "60%",
      catII: "50%",
      display: "60% / 50%"
    },
    fsi: {
      catI: { basic: 3.0, maxWithFee: 4.0, display: "3.0 / 4.0" },
      catII: { basic: 3.0, maxWithFee: 3.0, display: "3.0 / 3.0" },
      display: "3.0 / 4.0 (Cat I) | 3.0 / 3.0 (Cat II)"
    },
    setbacksUpTo10m: {
      front: { avg: "5.0m", min: "3.0m" },
      rear: { avg: "2.0m", min: "1.5m" },
      side: { avg: "2.0m", min: "1.5m" },
      display: "5.0m Avg (3.0m Min) / 2.0m Avg (1.5m Min) / 2.0m Avg (1.5m Min)",
      conditions: "For 200–500 sq.m floor area."
    },
    minRoadWidth: {
      range: "1.20m to 7.00m+",
      details: "1.20m (up to 300 sq.m) up to 7.00m+ (>12,000 sq.m)."
    },
    carParkingRate: {
      summary: "1 slot per 90 sq.m up to 1170 sq.m; 1 per 60 sq.m thereafter",
      details: "1 slot per 90 sq.m up to 1170 sq.m; 1 per 60 sq.m for remaining area."
    },
    ctpDtpThreshold: {
      threshold: ">6,000 sq.m built-up area",
      details: "Layout approval required from CTP/DTP exceeding 6,000 sq.m."
    },
    badgeColor: {
      bg: "bg-sky-950/80",
      border: "border-sky-700/80",
      text: "text-sky-300",
      dot: "bg-sky-400"
    },
    highlights: [
      "Special FSI incentives available for accredited IT/ITeS parks.",
      "Mandatory differently-abled access under Rule 42.",
      "25% two-wheeler parking addition mandatory under Rule 29(1)."
    ]
  },
  {
    groupCode: "Group F",
    groupLetter: "F",
    titleEn: "Commercial / Mercantile",
    titleMl: "വാണിജ്യ കെട്ടിടങ്ങൾ / കടകൾ",
    categoryType: "Commercial",
    description: "Shops, stores, markets, shopping malls, trade centres exceeding 90 sq.m.",
    maxCoverage: {
      catI: "65%",
      catII: "60%",
      display: "65% / 60%"
    },
    fsi: {
      catI: { basic: 3.0, maxWithFee: 4.0, display: "3.0 / 4.0" },
      catII: { basic: 2.75, maxWithFee: 3.5, display: "2.75 / 3.5" },
      display: "3.0 / 4.0 (Cat I) | 2.75 / 3.5 (Cat II)"
    },
    setbacksUpTo10m: {
      front: { avg: "3.0m", min: "3.0m" },
      rear: { avg: "1.5m", min: "1.5m" },
      side: { avg: "1.0m", min: "1.0m" },
      display: "3.0m / 1.5m / 1.0m (for >200 sq.m built-up)",
      conditions: "For >200 sq.m built-up. Small plot relaxation applies for <=125 sq.m plot."
    },
    minRoadWidth: {
      range: "1.20m to 7.00m+",
      details: "1.20m (up to 300 sq.m) up to 7.00m+ (>12,000 sq.m)."
    },
    carParkingRate: {
      summary: "1 slot per 90 sq.m up to 1170 sq.m; 1 per 60 sq.m thereafter",
      details: "1 slot per 90 sq.m up to 1170 sq.m; 1 slot per 60 sq.m thereafter."
    },
    ctpDtpThreshold: {
      threshold: ">8,000 sq.m built-up area",
      details: "CTP/DTP approval mandated above 8,000 sq.m."
    },
    badgeColor: {
      bg: "bg-amber-950/80",
      border: "border-amber-700/80",
      text: "text-amber-300",
      dot: "bg-amber-400"
    },
    highlights: [
      "Loading/Unloading Space (Table 10A): Exempt up to 700 sq.m; 30 sq.m per 1,000 sq.m thereafter.",
      "Small plot relaxation under Rule 50 applies for <=125 sq.m plot.",
      "Exempt from permit if single room <=15 sq.m in own residential plot under specific conditions."
    ]
  },
  {
    groupCode: "Group G1",
    groupLetter: "G1",
    titleEn: "Industrial I (Light)",
    titleMl: "വ്യവസായം I (ലഘു വ്യവസായം)",
    categoryType: "Industrial",
    description: "Light industrial factories, workshops, non-polluting manufacturing/processing.",
    maxCoverage: {
      catI: "65%",
      catII: "55%",
      display: "65% / 55%"
    },
    fsi: {
      catI: { basic: 3.5, maxWithFee: 3.5, display: "3.5 / 3.5" },
      catII: { basic: 2.75, maxWithFee: 2.75, display: "2.75 / 2.75" },
      display: "3.5 / 3.5 (Cat I) | 2.75 / 2.75 (Cat II)"
    },
    setbacksUpTo10m: {
      front: { avg: "3.0m", min: "3.0m" },
      rear: { avg: "2.0m", min: "2.0m" },
      side: { avg: "2.0m", min: "2.0m" },
      display: "3.0m / 2.0m / 2.0m (up to 200 sq.m) | 3.0m / 3.0m / 3.0m (>200 sq.m)",
      conditions: "3.0m uniform setback on all sides if exceeding 200 sq.m."
    },
    minRoadWidth: {
      range: "3.00m to 8.00m",
      details: "3.00m (up to 300 sq.m) up to 8.00m (>6,000 sq.m)."
    },
    carParkingRate: {
      summary: "1 slot per 240 sq.m of built-up area",
      details: "1 slot per 240 sq.m of built-up area."
    },
    ctpDtpThreshold: {
      threshold: ">3,000 sq.m built-up area",
      details: "Layout approval required from CTP/DTP above 3,000 sq.m."
    },
    badgeColor: {
      bg: "bg-yellow-950/80",
      border: "border-yellow-700/80",
      text: "text-yellow-300",
      dot: "bg-yellow-400"
    },
    highlights: [
      "Loading/Unloading Space (Table 10A): Exempt up to 500 sq.m; 30 sq.m per 800 sq.m thereafter.",
      "Pollution Control Board (PCB) consent to establish mandatory.",
      "Minimum 3.00m access road required even for small units."
    ]
  },
  {
    groupCode: "Group G2",
    groupLetter: "G2",
    titleEn: "Industrial II (Heavy/Special)",
    titleMl: "വ്യവസായം II (വൻകിട/പ്രത്യേക വ്യവസായം)",
    categoryType: "Industrial",
    description: "Special industrial buildings, heavy manufacturing, hazardous/polluting chemical plants.",
    maxCoverage: {
      catI: "65%",
      catII: "50%",
      display: "65% / 50%"
    },
    fsi: {
      catI: { basic: 3.0, maxWithFee: 3.0, display: "3.0 / 3.0" },
      catII: { basic: 2.5, maxWithFee: 2.5, display: "2.5 / 2.5" },
      display: "3.0 / 3.0 (Cat I) | 2.5 / 2.5 (Cat II)"
    },
    setbacksUpTo10m: {
      front: { avg: "5.0m", min: "5.0m" },
      rear: { avg: "5.0m", min: "5.0m" },
      side: { avg: "3.0m", min: "3.0m" },
      display: "5.0m / 5.0m / 3.0m (Uniform minimums)",
      conditions: "Front 5.0m, Rear 5.0m, Sides 3.0m minimums."
    },
    minRoadWidth: {
      range: "3.00m to 8.00m",
      details: "3.00m (up to 300 sq.m) up to 8.00m (>6,000 sq.m)."
    },
    carParkingRate: {
      summary: "1 slot per 240 sq.m of built-up area",
      details: "1 slot per 240 sq.m of built-up area."
    },
    ctpDtpThreshold: {
      threshold: ">3,000 sq.m built-up area",
      details: "Layout approval required from CTP/DTP above 3,000 sq.m."
    },
    badgeColor: {
      bg: "bg-orange-950/80",
      border: "border-orange-700/80",
      text: "text-orange-300",
      dot: "bg-orange-400"
    },
    highlights: [
      "Loading/Unloading Space (Table 10A): Exempt up to 500 sq.m; 30 sq.m per 800 sq.m thereafter.",
      "Green buffer zone clearance required along property boundary.",
      "Factories & Boilers inspectorate clearance mandatory."
    ]
  },
  {
    groupCode: "Group G3",
    groupLetter: "G3",
    titleEn: "Livestock / Farm",
    titleMl: "കന്നുകാലി ഫാമുകൾ / കാർഷിക കെട്ടിടങ്ങൾ",
    categoryType: "Industrial",
    description: "Livestock farms, cattle sheds, poultry farms (>100 sq.m for poultry, >250 sq.m for animals).",
    maxCoverage: {
      catI: "75%",
      catII: "75%",
      display: "75% / 75%"
    },
    fsi: {
      catI: { basic: 0, maxWithFee: 0, display: "Unrestricted" },
      catII: { basic: 0, maxWithFee: 0, display: "Unrestricted" },
      display: "Unrestricted (N/A)",
      isUnrestricted: true
    },
    setbacksUpTo10m: {
      front: { avg: "3.0m", min: "3.0m" },
      rear: { avg: "2.0m", min: "2.0m" },
      side: { avg: "2.0m", min: "2.0m" },
      display: "3.0m / 2.0m / 2.0m (up to 750 sq.m) | 5.0m / 5.0m / 3.0m (>750 sq.m)",
      conditions: "Sanitary distance rules apply from neighbouring water sources and dwellings."
    },
    minRoadWidth: {
      range: "1.20m to 5.00m",
      details: "1.20m to 5.00m depending on farm size."
    },
    carParkingRate: {
      summary: "Exempt / Case-by-case operational space",
      details: "Exempt from standard car parking ratios; operational truck maneuvering space required."
    },
    ctpDtpThreshold: {
      threshold: ">3,000 sq.m built-up area",
      details: "CTP/DTP approval mandated above 3,000 sq.m."
    },
    badgeColor: {
      bg: "bg-lime-950/80",
      border: "border-lime-700/80",
      text: "text-lime-300",
      dot: "bg-lime-400"
    },
    highlights: [
      "Strict distance from residential buildings and wells (Kerala Panchayat Act rules).",
      "FSI unrestricted due to single-level sheds and open agricultural footprint.",
      "Biogas plant or dung pit mandatory."
    ]
  },
  {
    groupCode: "Group H",
    groupLetter: "H",
    titleEn: "Storage",
    titleMl: "സംഭരണശാലകൾ / വെയർഹൗസുകൾ",
    categoryType: "Storage",
    description: "Warehouses, godowns, cold storages, freight depots, transit sheds.",
    maxCoverage: {
      catI: "70%",
      catII: "65%",
      display: "70% / 65%"
    },
    fsi: {
      catI: { basic: 3.0, maxWithFee: 4.0, display: "3.0 / 4.0" },
      catII: { basic: 2.75, maxWithFee: 3.75, display: "2.75 / 3.75" },
      display: "3.0 / 4.0 (Cat I) | 2.75 / 3.75 (Cat II)"
    },
    setbacksUpTo10m: {
      front: { avg: "6.0m", min: "4.5m" },
      rear: { avg: "3.0m", min: "1.5m" },
      side: { avg: "2.0m", min: "1.5m" },
      display: "6.0m Avg (4.5m Min) / 3.0m Avg (1.5m Min) / 2.0m Avg (1.5m Min) (>300 sq.m)",
      conditions: "For buildings >300 sq.m. Front yard 6m avg permits large truck staging."
    },
    minRoadWidth: {
      range: "3.00m to 8.00m",
      details: "3.00m (up to 300 sq.m) up to 8.00m (>6,000 sq.m)."
    },
    carParkingRate: {
      summary: "1 slot per 240 sq.m of built-up area",
      details: "1 slot per 240 sq.m of built-up area."
    },
    ctpDtpThreshold: {
      threshold: ">8,000 sq.m built-up area",
      details: "Layout approval required from CTP/DTP above 8,000 sq.m."
    },
    badgeColor: {
      bg: "bg-indigo-950/80",
      border: "border-indigo-700/80",
      text: "text-indigo-300",
      dot: "bg-indigo-400"
    },
    highlights: [
      "Loading/Unloading Space (Table 10A): Exempt up to 300 sq.m; 30 sq.m per 700 sq.m thereafter.",
      "Heavy vehicle turning radius circle must be demonstrated on site layout.",
      "Fire hydrants and sprinkler system mandatory for large storages."
    ]
  },
  {
    groupCode: "Group I",
    groupLetter: "I",
    titleEn: "Hazardous",
    titleMl: "അപകടകരമായ വസ്തുക്കൾ (ഹസാർഡസ്)",
    categoryType: "Hazardous",
    description: "Storage/processing of highly inflammable, explosive, highly toxic or corrosive chemicals.",
    maxCoverage: {
      catI: "45%",
      catII: "40%",
      display: "45% / 40%"
    },
    fsi: {
      catI: { basic: 2.0, maxWithFee: 2.0, display: "2.0 / 2.0" },
      catII: { basic: 2.0, maxWithFee: 2.0, display: "2.0 / 2.0" },
      display: "2.0 / 2.0 (Cat I) | 2.0 / 2.0 (Cat II)"
    },
    setbacksUpTo10m: {
      front: { avg: "7.5m", min: "7.5m" },
      rear: { avg: "7.5m", min: "7.5m" },
      side: { avg: "7.5m", min: "7.5m" },
      display: "7.5m / 7.5m / 7.5m (All sides strict minimums)",
      conditions: "Strict 7.5m minimum clearance from all boundaries on all four sides."
    },
    minRoadWidth: {
      range: "3.00m to 8.00m",
      details: "3.00m (up to 300 sq.m) up to 8.00m (>6,000 sq.m)."
    },
    carParkingRate: {
      summary: "1 slot per 240 sq.m of built-up area",
      details: "1 slot per 240 sq.m of built-up area."
    },
    ctpDtpThreshold: {
      threshold: ">500 sq.m built-up area",
      details: "Extremely strict: CTP/DTP layout approval required above only 500 sq.m."
    },
    badgeColor: {
      bg: "bg-red-950/80",
      border: "border-red-700/80",
      text: "text-red-300",
      dot: "bg-red-500"
    },
    highlights: [
      "Strict 7.50m peripheral yard setback on all sides.",
      "Clearances required from PESO (Explosives), State Pollution Control Board, and Fire & Rescue.",
      "Blast-proof walls and containment bunds for chemical tanks."
    ]
  },
  {
    groupCode: "Group J",
    groupLetter: "J",
    titleEn: "Multiplex Complex",
    titleMl: "മൾട്ടിപ്ലക്സ് കോംപ്ലക്സ്",
    categoryType: "Special",
    description: "Multiplexes containing multiple cinema halls integrated with commercial spaces.",
    maxCoverage: {
      catI: "65%",
      catII: "60%",
      display: "65% / 60%"
    },
    fsi: {
      catI: { basic: 3.0, maxWithFee: 3.5, display: "3.0 / 3.5" },
      catII: { basic: 2.75, maxWithFee: 3.0, display: "2.75 / 3.0" },
      display: "3.0 / 3.5 (Cat I) | 2.75 / 3.0 (Cat II)"
    },
    setbacksUpTo10m: {
      front: { avg: "10.5m", min: "10.5m" },
      rear: { avg: "5.0m", min: "5.0m" },
      side: { avg: "5.0m", min: "5.0m" },
      display: "10.5m / 5.0m / 5.0m (Strict minimums all around)",
      conditions: "Front 10.5m strict minimum; Sides and Rear 5.0m strict minimum."
    },
    minRoadWidth: {
      range: "5.00m to 12.00m",
      details: "5.00m (up to 300 sq.m) up to 12.00m (>6,000 sq.m)."
    },
    carParkingRate: {
      summary: "1 slot per 60 sq.m of built-up area",
      details: "1 slot per 60 sq.m of built-up area."
    },
    ctpDtpThreshold: {
      threshold: "All buildings under Group J require approval",
      details: "Mandatory CTP clearance for 100% of Group J projects regardless of square metres.",
      isAllMandatory: true
    },
    badgeColor: {
      bg: "bg-pink-950/80",
      border: "border-pink-700/80",
      text: "text-pink-300",
      dot: "bg-pink-400"
    },
    highlights: [
      "100% of Group J buildings require CTP (Chief Town Planner) layout approval.",
      "Front yard strict 10.5m minimum for fire tender staging and crowd egress.",
      "Minimum access road width reaches 12.00m for complexes >6,000 sq.m."
    ]
  }
];

export const STATUTORY_HIGHLIGHTS: StatutoryHighlight[] = [
  {
    ruleNo: "Rule 26(6)",
    title: "Height-Based Setback Increments",
    titleMl: "ഉയരം കൂടിയ കെട്ടിടങ്ങൾക്കുള്ള അധിക സെറ്റ്ബാക്ക്",
    summary:
      "For any building exceeding 10 metres in total height, an additional setback of 0.5 metres (50 cm) must be added to all front, rear, and side yards for every additional 3 metres (or part thereof) above 10 metres.",
    details: [
      "Baseline: Height up to 10m uses standard table setbacks.",
      "Increment: +0.5m setback on Front, Rear, and Both Sides per 3m (or fraction) above 10m.",
      "Example: A 16m building is 6m above 10m (2 increments of 3m), requiring +1.0m added to all yard setbacks.",
      "Crucial for high-rise fire fighting vehicle access and natural light/ventilation plane."
    ],
    badge: "Setback Increments",
    color: "cyan"
  },
  {
    ruleNo: "Table 10A",
    title: "Loading & Unloading Requirements",
    titleMl: "ലോഡിംഗ് & അൺലോഡിംഗ് യാർഡ് മാനദണ്ഡങ്ങൾ",
    summary:
      "Mandatory dedicated off-street vehicular loading/unloading space with minimum dimensions (each bay 30 sq.m) for Commercial, Industrial, and Storage occupancies.",
    details: [
      "Group F (Commercial): Exempt up to 700 sq.m; requires 30 sq.m of loading/unloading space per 1,000 sq.m thereafter.",
      "Group G1 & G2 (Industrial): Exempt up to 500 sq.m; requires 30 sq.m per 800 sq.m thereafter.",
      "Group H (Storage): Exempt up to 300 sq.m; requires 30 sq.m per 700 sq.m thereafter.",
      "Loading bays must not obstruct normal driveway circulation or fire escapes."
    ],
    badge: "Table 10A",
    color: "amber"
  },
  {
    ruleNo: "Rule 29(1)",
    title: "Two-Wheeler Parking Mandate",
    titleMl: "ഇരുചക്ര വാഹന പാർക്കിംഗ് നിബന്ധന",
    summary:
      "Across all occupancy groups requiring car parking, an additional space equivalent to at least 25% of the total mandatory car parking area must be reserved exclusively for two-wheeler parking.",
    details: [
      "Mandatory 25% addition over total car parking area for all parking-mandated groups.",
      "Standard two-wheeler parking bay dimensions: 1.0m x 2.0m.",
      "Cannot be counted toward or subtracted from the mandatory four-wheeler parking slots."
    ],
    badge: "25% Area Rule",
    color: "emerald"
  },
  {
    ruleNo: "Rule 42",
    title: "Differently-Abled Accessibility Provisions",
    titleMl: "ഭിന്നശേഷിക്കാർക്കുള്ള സൗകര്യങ്ങൾ (Accessibility)",
    summary:
      "Special accessibility facilities (ramps with 1:12 gradient, accessible toilets, handrails, tactile paving, and dedicated reserved parking) are mandatory for public, institutional, commercial, and apartment buildings.",
    details: [
      "Mandatory Groups: Groups A2, B, C, D, E, F, G1, G2, J, and Group A1 residential apartment buildings.",
      "Key provisions: Accessible ramp (gradient not steeper than 1:12), handrails on both sides.",
      "At least one accessible toilet cubicle on ground floor (minimum 1.5m x 1.75m with grab bars).",
      "Reserved accessible car parking spaces located within 30m of building main entrance."
    ],
    badge: "Accessibility Rule 42",
    color: "purple"
  },
  {
    ruleNo: "Rule 50",
    title: "Small Plot Special Relaxations",
    titleMl: "ചെറിയ പ്ലോട്ടുകൾക്കുള്ള പ്രത്യേക ഇളവുകൾ",
    summary:
      "For Group A1 (Residential) and Group F (Commercial) on plots up to 125 sq.m with building built-up area up to 200 sq.m, special relaxed setbacks apply and FSI, Coverage, and Parking rules are exempted.",
    details: [
      "Applicable Plot Area: <= 125 sq.m (approx 3.08 cents).",
      "Applicable Maximum Built-up Area: <= 200 sq.m.",
      "Reduced Setbacks: Front yard 1.80m, Rear yard 1.00m, Side yards 0.60m.",
      "Exemptions: Exempted from maximum FSI, maximum Coverage, and off-street car parking provisions."
    ],
    badge: "Rule 50 Relaxations",
    color: "blue"
  }
];
