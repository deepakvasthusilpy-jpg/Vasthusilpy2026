export interface OccupancyGroup {
  id: string;
  code: string;
  nameMl: string;
  nameEn: string;
  descriptionMl: string;
  descriptionEn: string;
  minRoadWidthMeters: number;
  maxFSI: number;
  maxCoverage: string;
  parkingRuleMl: string;
  parkingRuleEn: string;
  setbackSummaryMl: string;
  setbackSummaryEn: string;
  examples: string[];
  isLowRiskThresholdMl?: string;
  badgeColor: string;
}

export interface BuildingRuleItem {
  ruleNumber: string;
  ruleNumberInts?: number[];
  titleMl: string;
  titleEn: string;
  category:
    | "General"
    | "Permits"
    | "Setbacks & Height"
    | "Parking"
    | "Sanitation & Fire"
    | "Low Risk"
    | "CRZ & Wetlands"
    | "2026 Amendments"
    | "Safety & Services"
    | "Regularisation"
    | "Appeals & Penalties";
  summaryMl: string;
  summaryEn: string;
  keyPointsMl: string[];
  keyPointsEn: string[];
  keywords?: string[];
  chapter?: string;
  tables?: string[];
}

export const OCCUPANCY_GROUPS: OccupancyGroup[] = [
  {
    id: "A1",
    code: "Group A1",
    nameMl: "പാർപ്പിടങ്ങൾ (Residential - Dwellings)",
    nameEn: "Residential - Dwellings & Apartments",
    descriptionMl: "ഒറ്റ/ഇരട്ട കുടുംബ വാസഗൃഹങ്ങൾ, അപ്പാർട്ട്മെന്റുകൾ, ഫ്ലാറ്റുകൾ എന്നിവ ഉൾപ്പെടുന്നു.",
    descriptionEn: "Single/dual family residential houses, apartments, and flats.",
    minRoadWidthMeters: 1.2,
    maxFSI: 2.5,
    maxCoverage: "65%",
    parkingRuleMl: "ഫ്ലാറ്റുകളിൽ ഒരോ 75 ച.മീ അനുബന്ധ വിസ്തീർണ്ണത്തിനും അല്ലെങ്കിൽ ഓരോ വാസഗൃഹത്തിനും നിശ്ചിത കാർ പാർക്കിംഗ് സ്ഥലം (പട്ടിക 9, 10).",
    parkingRuleEn: "1 car parking per residential unit or per specified built-up area slab (Table 9 & 10).",
    setbackSummaryMl: "മുന്നിൽ 2m (6 മീറ്ററിൽ താഴെയുള്ള അനോട്ടിഫൈഡ് റോഡിൽ), വശങ്ങളിൽ 1m മുതൽ 1.5m വരെ, പിന്നിൽ 1m മുതൽ 1.5m വരെ.",
    setbackSummaryEn: "Front: 2m (for unnotified roads < 6m), Sides: 1m to 1.5m, Rear: 1m to 1.5m.",
    examples: ["സ്വകാര്യ വീടുകൾ (Single Houses)", "വില്ലകൾ (Villas)", "അപ്പാർട്ട്മെന്റുകൾ (Apartments)", "ഫ്ലാറ്റുകൾ (Flats)"],
    isLowRiskThresholdMl: "തറ വിസ്തീർണ്ണം 300 ച.മീറ്ററിൽ താഴെയും 2 നിലയിൽ താഴെയും ഉള്ളവ ലോ റിസ്ക് വിഭാഗത്തിലാണ്.",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
  },
  {
    id: "A2",
    code: "Group A2",
    nameMl: "പ്രത്യേക പാർപ്പിടങ്ങൾ (Lodging Houses & Special Residential)",
    nameEn: "Special Residential & Lodging",
    descriptionMl: "ലോഡ്ജുകൾ, റൂമിംഗ് ഹൗസുകൾ, ഹോസ്റ്റലുകൾ, വൃദ്ധസദനങ്ങൾ, റിസോർട്ടുകൾ, ഡോർമിറ്ററികൾ.",
    descriptionEn: "Lodging/rooming houses, hostels, old age homes, retirement homes, resorts, dormitories.",
    minRoadWidthMeters: 2.4,
    maxFSI: 2.25,
    maxCoverage: "55%",
    parkingRuleMl: "ഓരോ 120 ച.മീ തറ വിസ്തീർണ്ണത്തിനും 1 പാർക്കിംഗ്.",
    parkingRuleEn: "1 car parking per 120 sq.m built-up floor area.",
    setbackSummaryMl: "മുന്നിൽ 3m, വശങ്ങളിൽ 1.5m, പിന്നിൽ 2m.",
    setbackSummaryEn: "Front: 3m, Sides: 1.5m, Rear: 2m.",
    examples: ["ഹോസ്റ്റലുകൾ (Hostels)", "ലോഡ്ജുകൾ (Lodges)", "വൃദ്ധസദനങ്ങൾ (Retirement Homes)", "റിസോർട്ടുകൾ (Resorts)"],
    isLowRiskThresholdMl: "തറ വിസ്തീർണ്ണം 200 ച.മീറ്ററിൽ താഴെ ഉള്ളവ കെട്ടിട പെർമിറ്റ് ഇളവുള്ളവയാണ്.",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30"
  },
  {
    id: "B",
    code: "Group B",
    nameMl: "വിദ്യാഭ്യാസ സ്ഥാപനങ്ങൾ (Educational Buildings)",
    nameEn: "Educational Buildings",
    descriptionMl: "സ്കൂളുകൾ, കോളേജുകൾ, ഡേ-കെയറുകൾ, ഗവേഷണ സ്ഥാപനങ്ങൾ, പരിശീലന കേന്ദ്രങ്ങൾ.",
    descriptionEn: "Schools, colleges, day-cares, research institutes, and training centers.",
    minRoadWidthMeters: 3.0,
    maxFSI: 1.75,
    maxCoverage: "50%",
    parkingRuleMl: "ഓരോ 150 ച.മീ തറ വിസ്തീർണ്ണത്തിനും 1 പാർക്കിംഗ് സ്ഥലം.",
    parkingRuleEn: "1 car parking space per 150 sq.m built-up floor area.",
    setbackSummaryMl: "മുന്നിൽ 6m, വശങ്ങളിൽ 3m, പിന്നിൽ 3m. സ്കൂൾ ബസ് പാർക്കിംഗിന് പ്രത്യേക സൗകര്യം വേണം.",
    setbackSummaryEn: "Front: 6m, Sides: 3m, Rear: 3m. School bus parking space required.",
    examples: ["ഹൈസ്കൂളുകൾ (Schools)", "കോളേജുകൾ (Colleges)", "ട്യൂഷൻ സെന്ററുകൾ (Training Institutes)", "ഡേ കെയറുകൾ (Crèches)"],
    isLowRiskThresholdMl: "200 ച.മീറ്ററിൽ കുറഞ്ഞ വിദ്യാഭ്യാസ കെട്ടിടങ്ങൾ.",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30"
  },
  {
    id: "C",
    code: "Group C",
    nameMl: "ചികിത്സാ സ്ഥാപനങ്ങൾ / ആശുപത്രികൾ (Medical & Institutional)",
    nameEn: "Medical & Health Care Institutional",
    descriptionMl: "ആശുപത്രികൾ, ക്ലിനിക്കുകൾ, സാനിറ്റോറിയങ്ങൾ, നഴ്സിംഗ് ഹോമുകൾ, പുനരധിവാസ കേന്ദ്രങ്ങൾ.",
    descriptionEn: "Hospitals, clinics, sanatoriums, nursing homes, rehabilitation centers.",
    minRoadWidthMeters: 3.6,
    maxFSI: 2.5,
    maxCoverage: "50%",
    parkingRuleMl: "ഓരോ 90 ച.മീ തറ വിസ്തീർണ്ണത്തിനും 1 പാർക്കിംഗ്. ആംബുലൻസ് പാർക്കിംഗ് നിർബന്ധം.",
    parkingRuleEn: "1 car parking per 90 sq.m floor area. Mandatory ambulance parking space.",
    setbackSummaryMl: "മുന്നിൽ 6m, വശങ്ങളിൽ 3m, പിന്നിൽ 3m. ഫയർ എൻജിൻ സർക്കുലേഷന് വഴി വേണം.",
    setbackSummaryEn: "Front: 6m, Sides: 3m, Rear: 3m. Must accommodate fire tender movement.",
    examples: ["ആശുപത്രികൾ (Hospitals)", "ക്ലിനിക്കുകൾ (Clinics)", "ലാബുകൾ (Labs)", "നഴ്സിംഗ് ഹോമുകൾ (Nursing Homes)"],
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30"
  },
  {
    id: "D",
    code: "Group D",
    nameMl: "സമ്മേളന കെട്ടിടങ്ങൾ (Assembly Buildings)",
    nameEn: "Assembly Buildings",
    descriptionMl: "കല്യാണ മണ്ഡപങ്ങൾ, സിനിമാ തിയേറ്ററുകൾ, ഓഡിറ്റോറിയങ്ങൾ, ആരാധനാലയങ്ങൾ, ഹാളുകൾ.",
    descriptionEn: "Marriage halls, auditoriums, cinema theaters, places of worship, exhibition halls.",
    minRoadWidthMeters: 5.0,
    maxFSI: 1.25,
    maxCoverage: "40%",
    parkingRuleMl: "ഓരോ 15 ച.മീ തറ വിസ്തീർണ്ണത്തിനും അല്ലെങ്കിൽ സീറ്റിംഗ് ശേഷിക്കനുസരിച്ച് പാർക്കിംഗ്.",
    parkingRuleEn: "1 car space per 15 sq.m floor area or according to seat capacity ratios.",
    setbackSummaryMl: "മുന്നിൽ 6m, വശങ്ങളിൽ 3m മുതൽ 4.5m വരെ, പിന്നിൽ 3m.",
    setbackSummaryEn: "Front: 6m, Sides: 3m to 4.5m, Rear: 3m.",
    examples: ["ഓഡിറ്റോറിയം (Auditoriums)", "കല്യാണ മണ്ഡപം (Marriage Halls)", "ആരാധനാലയങ്ങൾ (Places of Worship)", "തിയേറ്ററുകൾ (Theaters)"],
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30"
  },
  {
    id: "D1",
    code: "Group D1",
    nameMl: "വിനോദപരമായ നിർമ്മിതികൾ (Recreational Constructions)",
    nameEn: "Recreational Constructions",
    descriptionMl: "കായിക കേന്ദ്രങ്ങൾ, നീന്തൽക്കുളങ്ങൾ, വാച്ച് ടവറുകൾ, അമ്യൂസ്മെന്റ് പാർക്കുകൾ.",
    descriptionEn: "Sports complexes, swimming pools, viewing towers, theme & amusement parks.",
    minRoadWidthMeters: 3.6,
    maxFSI: 1.5,
    maxCoverage: "70%",
    parkingRuleMl: "സന്ദർശകരുടെ എണ്ണത്തിനും ഏരിയയ്ക്കും അനുസരിച്ച് പ്രത്യേക പാർക്കിംഗ് ലേഔട്ട്.",
    parkingRuleEn: "Special parking layout based on visitor density and floor area.",
    setbackSummaryMl: "മുന്നിൽ 3m, വശങ്ങളിൽ 1.5m, പിന്നിൽ 1.5m.",
    setbackSummaryEn: "Front: 3m, Sides: 1.5m, Rear: 1.5m.",
    examples: ["സ്പോർട്സ് ക്ലബ് (Sports Clubs)", "നീന്തൽക്കുളം (Swimming Pools)", "തീം പാർക്ക് (Amusement Parks)"],
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
  },
  {
    id: "E",
    code: "Group E",
    nameMl: "ഓഫീസ് കെട്ടിടങ്ങൾ (Office Buildings)",
    nameEn: "Business & Office Buildings",
    descriptionMl: "ഗവണ്മെന്റ്/സ്വകാര്യ ഓഫീസുകൾ, ബാങ്കുകൾ, ഐ.ടി സ്ഥാപനങ്ങൾ, പ്രൊഫഷണൽ ഓഫീസുകൾ.",
    descriptionEn: "Government/private offices, banks, IT establishments, professional consulting suites.",
    minRoadWidthMeters: 3.0,
    maxFSI: 3.0,
    maxCoverage: "60%",
    parkingRuleMl: "ഓരോ 90 ച.മീ തറ വിസ്തീർണ്ണത്തിനും 1 കാർ പാർക്കിംഗ്.",
    parkingRuleEn: "1 car space per 90 sq.m floor area.",
    setbackSummaryMl: "മുന്നിൽ 3m, വശങ്ങളിൽ 1.5m മുതൽ 3m വരെ, പിന്നിൽ 2m.",
    setbackSummaryEn: "Front: 3m, Sides: 1.5m to 3m, Rear: 2m.",
    examples: ["ബാങ്കുകൾ (Banks)", "ഐ.ടി പാർക്കുകൾ (IT Parks)", "ഗവണ്മെന്റ് ഓഫീസുകൾ (Govt Offices)", "കോർപ്പറേറ്റ് ഓഫീസുകൾ (Corporate Offices)"],
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
  },
  {
    id: "F",
    code: "Group F",
    nameMl: "വാണിജ്യ കെട്ടിടങ്ങൾ (Commercial / Mercantile Buildings)",
    nameEn: "Mercantile & Commercial",
    descriptionMl: "കടകൾ, സൂപ്പർമാർക്കറ്റുകൾ, ഷോപ്പിംഗ് മാളുകൾ, ഷോറൂമുകൾ, വാണിജ്യ സമുച്ചയങ്ങൾ.",
    descriptionEn: "Shops, stores, supermarkets, shopping malls, showrooms, commercial complexes.",
    minRoadWidthMeters: 3.0,
    maxFSI: 2.75,
    maxCoverage: "65%",
    parkingRuleMl: "ഓരോ 60 ച.മീ തറ വിസ്തീർണ്ണത്തിനും 1 പാർക്കിംഗ് സ്പേസ്.",
    parkingRuleEn: "1 car space per 60 sq.m floor area.",
    setbackSummaryMl: "മുന്നിൽ 3m, വശങ്ങളിൽ 1.5m മുതൽ 3m വരെ, പിന്നിൽ 2m. 250 ച.മീറ്ററിൽ കൂടുതൽ വിസ്തീർണ്ണത്തിന് 3m റോഡ് നിർബന്ധം.",
    setbackSummaryEn: "Front: 3m, Sides: 1.5m to 3m, Rear: 2m. Min 3m road width if area > 250 sq.m.",
    examples: ["സൂപ്പർമാർക്കറ്റുകൾ (Supermarkets)", "ഷോപ്പിംഗ് മാളുകൾ (Shopping Malls)", "റീട്ടെയിൽ കടകൾ (Retail Shops)", "ഷോറൂമുകൾ (Showrooms)"],
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30"
  },
  {
    id: "G1",
    code: "Group G1",
    nameMl: "വ്യവസായം - I (Industrial - Low & Medium Hazard)",
    nameEn: "Industrial - Low & Medium Hazard",
    descriptionMl: "അപകടസാധ്യത കുറഞ്ഞ വ്യവസായങ്ങൾ, വർക്ക്‌ഷോപ്പുകൾ, അസംബ്ലി യൂണിറ്റുകൾ, ബേക്കറികൾ.",
    descriptionEn: "Low to medium hazard factories, workshops, assembly plants, bakeries, light engineering.",
    minRoadWidthMeters: 3.0,
    maxFSI: 2.75,
    maxCoverage: "65%",
    parkingRuleMl: "ഓരോ 240 ച.മീ തറ വിസ്തീർണ്ണത്തിനും 1 കാർ പാർക്കിംഗ് + ലോഡിംഗ്/അൺലോഡിംഗ് ബേ.",
    parkingRuleEn: "1 car space per 240 sq.m floor area + loading/unloading bay.",
    setbackSummaryMl: "മുന്നിൽ 3m മുതൽ 6m വരെ, വശങ്ങളിൽ 3m, പിന്നിൽ 3m.",
    setbackSummaryEn: "Front: 3m to 6m, Sides: 3m, Rear: 3m.",
    examples: ["ബേക്കറി പ്രൊഡക്ഷൻ (Bakeries)", "പ്രിന്റിംഗ് പ്രസ്സ് (Printing Presses)", "വർക്ക്‌ഷോപ്പുകൾ (Workshops)"],
    badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/30"
  },
  {
    id: "G2",
    code: "Group G2",
    nameMl: "വ്യവസായം - II (Industrial - High Hazard)",
    nameEn: "Industrial - High Hazard",
    descriptionMl: "അപകടകരമായ രാസവസ്തുക്കൾ, സ്ഫോടകവസ്തുക്കൾ, പെട്രോളിയം ഉൽപ്പന്നങ്ങൾ കൈകാര്യം ചെയ്യുന്ന ഫാക്ടറികൾ.",
    descriptionEn: "High hazard manufacturing, chemical processing, petroleum, combustible materials handling.",
    minRoadWidthMeters: 5.0,
    maxFSI: 2.5,
    maxCoverage: "50%",
    parkingRuleMl: "ഓരോ 240 ച.മീറ്ററിനും 1 പാർക്കിംഗ് + ട്രക്ക് ലോഡിംഗ് ബേ.",
    parkingRuleEn: "1 car space per 240 sq.m + heavy truck loading/unloading bay.",
    setbackSummaryMl: "ചുറ്റും കുറഞ്ഞത് 6 മീറ്റർ ഫയർ ടെൻഡർ സർക്കുലേഷൻ ഇളവ് ഇല്ലാതെ നൽകണം.",
    setbackSummaryEn: "Minimum 6m all-round clear open space for fire tenders.",
    examples: ["കെമിക്കൽ പ്ലാന്റുകൾ (Chemical Plants)", "ഗ്യാസ് ബോട്ട്‌ലിങ് പ്ലാന്റുകൾ (LPG Bottling)", "ഡൈയിങ് മില്ലുകൾ (Dyeing Units)"],
    badgeColor: "bg-red-500/20 text-red-300 border-red-500/30"
  },
  {
    id: "G3",
    code: "Group G3",
    nameMl: "ലൈവ്‌സ്റ്റോക്ക് & ഫാം (Livestock / Poultry Buildings)",
    nameEn: "Livestock & Poultry Buildings",
    descriptionMl: "കന്നുകാലി ഫാമുകൾ, കോഴി ഫാമുകൾ, ഡെയറി ഫാമുകൾ, അനിമൽ ഷെഡ്ഡുകൾ.",
    descriptionEn: "Cattle sheds, poultry farms, piggeries, goat farms, and agricultural animal shelters.",
    minRoadWidthMeters: 1.8,
    maxFSI: 1.5,
    maxCoverage: "70%",
    parkingRuleMl: "ഫാം ആവശ്യങ്ങൾക്കുള്ള ഡ്രൈവ്‌വേയും വാഹന പാർക്കിംഗും.",
    parkingRuleEn: "Sufficient driveway and farm service vehicle parking.",
    setbackSummaryMl: "കെട്ടിടത്തിന് ചുറ്റും 1.5 മീറ്റർ തുറസ്സായ സ്ഥലം വേണം. മാലിന്യ സംസ്‌കരണ സംവിധാനം നിർബന്ധം.",
    setbackSummaryEn: "Minimum 1.5m clear open space around structure. Biogas/waste treatment required.",
    examples: ["ഡെയറി ഫാം (Dairy Farms)", "പോൾട്രി ഫാം (Poultry Farms)", "ആട്ടുഫാം (Goat Farms)"],
    isLowRiskThresholdMl: "250 ച.മീറ്ററിൽ കുറഞ്ഞ കന്നുകാലി ഫാമുകൾക്കും 100 ച.മീറ്ററിൽ കുറഞ്ഞ കോഴി ഫാമുകൾക്കും പെർമിറ്റ് ഇളവുണ്ട് (റൂൾ 8 xiv).",
    badgeColor: "bg-lime-500/20 text-lime-300 border-lime-500/30"
  },
  {
    id: "H",
    code: "Group H",
    nameMl: "സംഭരണശാലകൾ (Storage Buildings)",
    nameEn: "Storage & Warehouses",
    descriptionMl: "ഗോഡൗണുകൾ, വെയർഹൗസുകൾ, കോൾഡ് സ്റ്റോറേജുകൾ, ചരക്ക് സൂക്ഷിപ്പ് കേന്ദ്രങ്ങൾ.",
    descriptionEn: "Godowns, warehouses, cold storages, freight depots, transit sheds.",
    minRoadWidthMeters: 3.6,
    maxFSI: 2.75,
    maxCoverage: "60%",
    parkingRuleMl: "ഓരോ 240 ച.മീറ്ററിനും 1 പാർക്കിംഗ് + ഹെവി വെഹിക്കിൾ ലോഡിംഗ് ബേ.",
    parkingRuleEn: "1 car space per 240 sq.m + heavy loading bay.",
    setbackSummaryMl: "മുന്നിൽ 6m, വശങ്ങളിൽ 3m, പിന്നിൽ 3m.",
    setbackSummaryEn: "Front: 6m, Sides: 3m, Rear: 3m.",
    examples: ["ഗോഡൗണുകൾ (Godowns)", "വെയർഹൗസ് (Warehouses)", "കോൾഡ് സ്റ്റോറേജ് (Cold Storages)"],
    badgeColor: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
  },
  {
    id: "I",
    code: "Group I",
    nameMl: "അപായകരമായവ (Hazardous Buildings)",
    nameEn: "Hazardous Buildings",
    descriptionMl: "തീപിടിക്കുന്നതോ സ്ഫോടന സാധ്യതയുള്ളതോ ആയ വിഷവസ്തുക്കൾ സംഭരിക്കുന്ന കേന്ദ്രങ്ങൾ.",
    descriptionEn: "Highly combustible, explosive, toxic, or highly flammable processing & storage.",
    minRoadWidthMeters: 7.0,
    maxFSI: 2.0,
    maxCoverage: "45%",
    parkingRuleMl: "പ്രത്യേകം നിശ്ചയിക്കുന്ന സുരക്ഷാ സജ്ജീകരണങ്ങളോടെയുള്ള പാർക്കിംഗ്.",
    parkingRuleEn: "Custom security & safety compliant parking facilities.",
    setbackSummaryMl: "ചുറ്റും കുറഞ്ഞത് 7.5 മീറ്റർ മുതൽ 10 മീറ്റർ വരെ ക്ലിയർ സെറ്റ്ബാക്ക് വേണം. ഫയർ NOC നിർബന്ധം.",
    setbackSummaryEn: "Min 7.5m to 10m clear open space around perimeter. Mandatory Fire NOC.",
    examples: ["പെട്രോൾ പമ്പ് (Fuel Stations)", "സ്ഫോടകവസ്തു ഗോഡൗൺ (Explosive Depots)", "കെമിക്കൽ സ്റ്റോറേജ് (Chemical Stores)"],
    badgeColor: "bg-rose-600/20 text-rose-400 border-rose-600/30"
  },
  {
    id: "J",
    code: "Group J",
    nameMl: "മൾട്ടിപ്ലക്സ് സമുച്ചയം (Multiplex Complexes)",
    nameEn: "Multiplex Complexes",
    descriptionMl: "ഒന്നിലധികം സിനിമാ തിയേറ്ററുകൾ, ഷോപ്പിംഗ് മാൾ, ഫുഡ് കോർട്ട് എന്നിവ സംയോജിച്ച കെട്ടിടങ്ങൾ.",
    descriptionEn: "Integrated multiplex screen theaters, shopping malls, video games, food courts.",
    minRoadWidthMeters: 7.0,
    maxFSI: 3.0,
    maxCoverage: "50%",
    parkingRuleMl: "ഓരോ 60 ച.മീറ്ററിനും 1 കാർ പാർക്കിംഗ് + തിയേറ്റർ സീറ്റിംഗ് അനുപാതം.",
    parkingRuleEn: "1 car space per 60 sq.m floor area plus cinema seating ratio requirements.",
    setbackSummaryMl: "മുന്നിൽ 7.5m, വശങ്ങളിൽ 5m, പിന്നിൽ 5m. അഗ്നിശമന സേനാ അനുമതി നിർബന്ധം.",
    setbackSummaryEn: "Front: 7.5m, Sides: 5m, Rear: 5m. Mandatory Fire NOC.",
    examples: ["സിനിമാ മൾട്ടിപ്ലക്സ് (Multiplex Theaters)", "ഷോപ്പിംഗ് എൻ്റർടെയിൻമെന്റ് മാളുകൾ (Entertainment Malls)"],
    badgeColor: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30"
  }
];

export const BUILDING_RULES_LIST: BuildingRuleItem[] = [
  // 2026 GAZETTE AMENDMENT SPECIAL HIGHLIGHT
  {
    ruleNumber: "S.R.O. 682/2026 (2026 Gazette Amendment)",
    titleMl: "2026 ലെ പുതിയ കെട്ടിട നിർമ്മാണ ചട്ട ഭേദഗതികൾ",
    titleEn: "Kerala Panchayat Building (Amendment) Rules, 2026",
    category: "2026 Amendments",
    summaryMl: "2026 ഓഗസ്റ്റ് 2 ലെ സർക്കാരുമായി ബന്ധപ്പെട്ട തദ്ദേശ സ്വയംഭരണ വകുപ്പ് വിജ്ഞാപന പ്രകാരം പ്രാബല്യത്തിൽ വന്ന ഭേദഗതികൾ.",
    summaryEn: "Key amendments gazetted under G.O.(P) No.36/2026/LSGD amending KPBR 2019.",
    keyPointsMl: [
      "റൂൾ 26(4) ഭേദഗതി: 6 മീറ്ററിൽ താഴെ വീതിയുള്ള അനോട്ടിഫൈഡ് റോഡിനോട് ചേർന്നുള്ള പ്ലോട്ടുകളിലെ ഒറ്റക്കുടുംബ വാസഗൃഹങ്ങൾക്ക് (Single Family Residential) മുൻമുറ്റം (Front Yard) 2 മീറ്ററിൽ കുറയാൻ പാടില്ല (പഴയത് 3m ആയിരുന്നത് 2m ആയി കുറച്ചു).",
      "റൂൾ 26(4) രണ്ടാം വ്യവസ്ഥ: കെട്ടിടത്തിന്റെ തുറസ്സുകളില്ലാത്ത (No opening / blank wall) ഏതെങ്കിലും ഒരു വശത്തെ മുറ്റം 50 സെന്റീമീറ്റർ വരെയായി കുറയ്ക്കാവുന്നതാണ്.",
      "റൂൾ 33 ഭേദഗതി: എയർ കണ്ടീഷൻ ചെയ്ത മുറികളുടെ (Air Conditioned Rooms) കുറഞ്ഞ ഉയരം 2.4 മീറ്ററിൽ കുറയാൻ പാടില്ല."
    ],
    keyPointsEn: [
      "Rule 26(4) Proviso: Single family residential buildings on unnotified roads of width less than 6 meters require a minimum front yard of 2 meters.",
      "Rule 26(4) Proviso: Any one yard other than the front yard can be reduced up to 50 centimeters if there is no opening on that side.",
      "Rule 33 Proviso: For air conditioned rooms, the minimum ceiling height shall not be less than 2.4 metres."
    ]
  },

  // CHAPTER I: RULES 1 TO 3
  {
    ruleNumber: "Rules 1 - 3",
    titleMl: "ലഘുനാമവും പ്രാരംഭവും നഗരസഭാ/പഞ്ചായത്ത് ബാധകതയും (Chapter I)",
    titleEn: "Short Title, Commencement, Definitions & Applicability (Rules 1-3)",
    category: "General",
    summaryMl: "ചട്ടങ്ങളുടെ പേര്, പ്രാരംഭ തീയതി, ബാധകമാകുന്ന ഭൂപ്രദേശങ്ങൾ, ബാധകതയുടെ അതിരുകൾ.",
    summaryEn: "Short title, extent, date of commencement, and scope of application across Panchayats.",
    keyPointsMl: [
      "റൂൾ 1: ഈ ചട്ടങ്ങൾ '2019-ലെ കേരള പഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ' (KPBR 2019) എന്ന് അറിയപ്പെടുന്നു.",
      "റൂൾ 2: 100-ലധികം സാങ്കേതിക പദങ്ങളുടെ ഔദ്യോഗിക നിർവ്വചനങ്ങൾ (Built-up Area, FSI, Ground Level, Low Risk Buildings, Occupancy, Setback, Height).",
      "റൂൾ 3: പുതിയ നിർമ്മാണങ്ങൾ, നിലവിലുള്ള കെട്ടിടങ്ങളിലെ കൂട്ടിച്ചേർക്കലുകൾ, പുനർനിർമ്മാണം, ഉപയോഗഗണം മാറ്റൽ എന്നിവയ്ക്ക് ബാധകം."
    ],
    keyPointsEn: [
      "Rule 1: Known as Kerala Panchayat Building Rules 2019 (KPBR 2019).",
      "Rule 2: Comprehensive legal definitions for all technical terms.",
      "Rule 3: Applies to all new constructions, alterations, additions, and change of occupancy."
    ]
  },

  // CHAPTER II: RULES 4 TO 15
  {
    ruleNumber: "Rule 4",
    titleMl: "പഞ്ചായത്തുകളുടെ വർഗ്ഗീകരണം (Category I & Category II)",
    titleEn: "Categorization of Village Panchayats (Rule 4)",
    category: "General",
    summaryMl: "ഗ്രാമപഞ്ചായത്തുകളെ വികസന സാന്ദ്രതയ്ക്കനുസരിച്ച് Category-I, Category-II എന്നിങ്ങനെ തിരിക്കൽ.",
    summaryEn: "Classification of Panchayats into Category I (Urban/Dense) and Category II (Rural/Standard).",
    keyPointsMl: [
      "Category-I: നഗരവൽക്കരണ സാധ്യതയും വികസനവും കൂടുതൽ ഉള്ള ഗ്രാമപഞ്ചായത്തുകൾ.",
      "Category-II: മറ്റ് സാധാരണ ഗ്രാമപഞ്ചായത്തുകൾ (ഇവിടെ നിർമ്മാണ നിരക്കുകളും ഫീസുകളും ഇളവുകളും വ്യത്യസ്തമാണ്)."
    ],
    keyPointsEn: [
      "Category-I Village Panchayats: Urbanized or high-density growth zones.",
      "Category-II Village Panchayats: Standard rural panchayats with separate fee slabs."
    ]
  },
  {
    ruleNumber: "Rule 5",
    titleMl: "കെട്ടിട നിർമ്മാണാനുമതിയും അപേക്ഷാ സമർപ്പണവും (Building Permit Application)",
    titleEn: "Application for Development & Building Permit (Rule 5)",
    category: "Permits",
    summaryMl: "അനുമതിക്കുള്ള ഓൺലൈൻ/ഓഫ്‌ലൈൻ അപേക്ഷ, ആവശ്യമായ പ്ലാനുകൾ, പകർപ്പുകൾ.",
    summaryEn: "Procedures for submitting building permit applications with drawings, ownership documents, and fees.",
    keyPointsMl: [
      "അപേക്ഷാ ഫോറം: Form A1 (പൊതു അപേക്ഷ), Form A1A (Low Risk കെട്ടിടങ്ങളുടെ സ്വയം സാക്ഷ്യപത്രം).",
      "ആവശ്യമായ പ്ലാനുകൾ: സൈറ്റ് പ്ലാൻ (1:400/1:800), സർവീസ് പ്ലാൻ, കീ മാപ്പ്, എലവേഷൻ & സെക്ഷൻ (1:100).",
      "ഭൂമിയുടെ ആധാരം, ഉടമസ്ഥാവകാശ സാക്ഷ്യപത്രം, കരമടച്ച രസീത് എന്നിവ ഹാജരാക്കണം.",
      "ഓൺലൈൻ e-filing സംവിധാനം വഴി സെക്രട്ടറിക്ക് അപേക്ഷ നൽകാം."
    ],
    keyPointsEn: [
      "Forms: A1 for general buildings, A1A for self-certification of Low Risk buildings.",
      "Plans required: Site plan, service plan, key map, floor plans, sections, and elevations.",
      "Must attach title deed, possession certificate, and tax receipt."
    ]
  },
  {
    ruleNumber: "Rules 6 & 7",
    titleMl: "പ്ലാനുകളിലെ വിവരങ്ങളും സർക്കാരിന്റെ പ്രത്യേക ഇളവുകളും (Rule 6-7)",
    titleEn: "Details in Plans & Govt Operational Constructions (Rules 6-7)",
    category: "Permits",
    summaryMl: "പ്ലാനുകളിൽ അടങ്ങിയിരിക്കേണ്ട കാര്യങ്ങളും സർക്കാർ ഓപ്പറേഷനൽ നിർമ്മാണങ്ങളുടെ ഇളവുകളും.",
    summaryEn: "Mandatory details in engineering drawings and exemptions for defense/Govt operational structures.",
    keyPointsMl: [
      "റൂൾ 6: പ്ലാനിൽ പ്ലോട്ട് അതിരുകൾ, റോഡ് വീതി, വടക്ക് ദിശ, സർവേ നമ്പർ, ഡ്രെയിനേജ്, സാനിറ്ററി വെന്റിലേഷൻ എന്നിവ വ്യക്തമാക്കണം.",
      "റൂൾ 7: റെയിൽവേ, ദേശീയപാത, തുറമുഖം, എയർപോർട്ട്, പ്രതിരോധ സ്ഥാപനങ്ങൾ എന്നിവയുടെ ഓപ്പറേഷനൽ നിർമ്മാണങ്ങൾക്ക് ചില ചട്ടങ്ങളിൽ ഇളവുണ്ട്."
    ],
    keyPointsEn: [
      "Rule 6: Mandatory details on drawings including boundary lines, north point, road width, and drainage.",
      "Rule 7: Operational constructions of Railways, National Highways, Airports, and Defense are exempted from certain permit formalities."
    ]
  },
  {
    ruleNumber: "Rule 8",
    titleMl: "പെർമിറ്റ് ആവശ്യമില്ലാത്ത പണികൾ (Exempted Minor Works)",
    titleEn: "Works Exempted from Building Permit (Rule 8)",
    category: "Permits",
    summaryMl: "പഞ്ചായത്തിൽ പ്രത്യേക കെട്ടിട പെർമിറ്റ് ഇല്ലാതെ ചെയ്യവുന്ന അറ്റകുറ്റപ്പണികളും ചെറിയ നിർമ്മാണങ്ങളും.",
    summaryEn: "Minor structural, repair, and agricultural works requiring no formal permit.",
    keyPointsMl: [
      "മതിൽ നിർമ്മാണം, ജനൽ/വാതിൽ മാറ്റൽ (ചുമരിന്റെ അളവും സ്ഥാനവും മാറ്റാതെ).",
      "തേപ്പ്, പെയിന്റിംഗ്, വെള്ളപ്പണി, തറയോട് പാകൽ.",
      "ഗാർഡൻ, ലാൻഡ്സ്കേപ്പിംഗ്, ചെറിയ ഷെഡ്ഡുകൾ.",
      "250 ച.മീറ്ററിൽ കുറഞ്ഞ കന്നുകാലി ഫാമുകളും 100 ച.മീറ്ററിൽ കുറഞ്ഞ കോഴി ഫാമുകളും (1.5m സെറ്റ്ബാക്ക് പാലിക്കണം)."
    ],
    keyPointsEn: [
      "Boundary walls, changing doors/windows without altering wall openings.",
      "Plastering, painting, tiling, minor roof repairs.",
      "Livestock sheds < 250 sq.m / poultry < 100 sq.m maintaining 1.5m clear open space."
    ]
  },
  {
    ruleNumber: "Rules 9 - 11",
    titleMl: "സൈറ്റ് പരിശോധനയും അപേക്ഷ നിരസിക്കലും (Site Inspection & Refusal)",
    titleEn: "Site Inspection, Verification & Grounds for Refusal (Rules 9-11)",
    category: "Permits",
    summaryMl: "സെക്രട്ടറിയുടെ സൈറ്റ് പരിശോധന, പ്ലിന്ത് ലെവൽ പരിശോധന, അപേക്ഷ നിരസിക്കാനുള്ള കാരണങ്ങൾ.",
    summaryEn: "Inspection by authority, plinth level checks, and conditions leading to application refusal.",
    keyPointsMl: [
      "റൂൾ 9: അപേക്ഷ ലഭിച്ചാൽ പ്ലോട്ടും രേഖകളും സെക്രട്ടറി നേരിട്ടോ നിയോഗിക്കപ്പെട്ട ഉദ്യോഗസ്ഥനോ പരിശോധിക്കണം.",
      "റൂൾ 10: 1.5 മീറ്ററിൽ കൂടുതൽ ആഴമുള്ള മണ്ണ് ഖനനത്തിന് പ്രത്യേക സുരക്ഷാ മുൻകരുതലുകൾ വേണം.",
      "റൂൾ 11: വ്യാജ രേഖകൾ, മാസ്റ്റർ പ്ലാൻ ലംഘനം, മാസ്റ്റർ പ്ലാൻ റോഡ് വികസന തടസ്സം എന്നിവ ഉണ്ടായാൽ അപേക്ഷ നിരസിക്കാം."
    ],
    keyPointsEn: [
      "Rule 9: Physical site verification by Secretary or authorized officer.",
      "Rule 10: Special safety measures for deep excavation (> 1.5m).",
      "Rule 11: Grounds for rejection including false documents or Master Plan violations."
    ]
  },
  {
    ruleNumber: "Rules 12 - 15",
    titleMl: "പെർമിറ്റ് അനുവദിക്കൽ, കാലാവധിയും പുതുക്കലും (Grant, Validity & Renewal)",
    titleEn: "Issue of Permit, Validity Period & Renewal (Rules 12-15)",
    category: "Permits",
    summaryMl: "പെർമിറ്റ് അനുവദിക്കാനുള്ള സമയപരിധി, പ്രാബല്യ കാലാവധി, പുതുക്കൽ വ്യവസ്ഥകൾ.",
    summaryEn: "Time limit for permit approval, 5-year initial validity, and extension/renewal terms.",
    keyPointsMl: [
      "റൂൾ 12/14: അപേക്ഷ ലഭിച്ച് 15 ദിവസത്തിനകം സെക്രട്ടറി തീരുമാനം അറിയിക്കണം.",
      "റൂൾ 15: പെർമിറ്റ് കാലാവധി 5 വർഷമാണ്. 5 വർഷം കൂടി വീതം രണ്ട് തവണ പുതുക്കാം (പരമാവധി 15 വർഷം).",
      "കാലാവധി കഴിഞ്ഞ പെർമിറ്റുകൾ അപേക്ഷ നൽകി ഫീസ് അടച്ച് പുതുക്കാവുന്നതാണ്."
    ],
    keyPointsEn: [
      "Rule 12/14: Decision within 15 days of complete application.",
      "Rule 15: Permit valid for 5 years, renewable up to a maximum total of 15 years."
    ]
  },
  {
    ruleNumber: "Rules 16 - 19",
    titleMl: "ഉടമസ്ഥന്റെയും ലൈസൻസിയുടെയും ചുമതലകൾ (Duties of Owner & Architect)",
    titleEn: "Responsibilities of Owner & Registered Institution (Rules 16-19)",
    category: "Permits",
    summaryMl: "നിർമ്മാണ വേളയിൽ ഉടമയും എഞ്ചിനീയറും പാലിക്കേണ്ട നിയമപരമായ ഉത്തരവാദിത്തങ്ങൾ.",
    summaryEn: "Legal obligations of property owner, architect, engineer, and supervisor during construction.",
    keyPointsMl: [
      "റൂൾ 17: നിർമ്മാണ വേളയിൽ സൈറ്റിൽ പെർമിറ്റിന്റെയും പ്ലാനിന്റെയും പകർപ്പ് സൂക്ഷിക്കണം.",
      "റൂൾ 18: ലൈസൻസ്ഡ് ആർക്കിടെക്റ്റ്/എഞ്ചിനീയർ പ്ലാൻ പ്രകാരമാണ് നിർമ്മാണം എന്ന് ഉറപ്പുവരുത്തണം.",
      "റൂൾ 19: പ്ലോട്ട് കൈമാറ്റം ചെയ്താൽ 60 ദിവസത്തിനകം പഞ്ചായത്തിനെ രേഖാമൂലം അറിയിക്കണം."
    ],
    keyPointsEn: [
      "Rule 17: Approved plan & permit copy must be available on construction site.",
      "Rule 18: Registered technical person must supervise and certify compliance.",
      "Rule 19: Intimation to Panchayat within 60 days in case of plot ownership transfer."
    ]
  },

  // CHAPTER III: RULES 20 TO 24
  {
    ruleNumber: "Rules 20 & 21",
    titleMl: "പൂർത്തീകരണ സർട്ടിഫിക്കറ്റും ഒക്യുപ്പൻസി സർട്ടിഫിക്കറ്റും (Completion & Occupancy)",
    titleEn: "Completion Certificate & Occupancy Certificate (Rules 20-21)",
    category: "Permits",
    summaryMl: "കെട്ടിട നിർമ്മാണം പൂർത്തിയാകുമ്പോൾ സമർപ്പിക്കേണ്ട റിപ്പോർട്ടും ഒക്യുപ്പൻസി നടപടികളും.",
    summaryEn: "Procedures for submitting completion certificate and receiving Occupancy Certificate.",
    keyPointsMl: [
      "റൂൾ 20: നിർമ്മാണം പൂർത്തിയായാൽ 15 ദിവസത്തിനകം ലൈസൻസി സാക്ഷ്യപ്പെടുത്തിയ പൂർത്തീകരണ റിപ്പോർട്ട് (Completion Certificate) സമർപ്പിക്കണം.",
      "സെക്രട്ടറി പരിശോധിച്ചു തൃപ്തികരമെങ്കിൽ ഒക്യുപ്പൻസി സർട്ടിഫിക്കറ്റ് (Occupancy Certificate) നൽകും.",
      "റൂൾ 21: ഒക്യുപ്പൻസി സർട്ടിഫിക്കറ്റ് ലഭിച്ചതിന് ശേഷം 2 വർഷത്തിന് ശേഷം പോസ്റ്റ് ഒക്യുപ്പൻസി ഓഡിറ്റ് നടത്താം."
    ],
    keyPointsEn: [
      "Rule 20: Completion certificate to be submitted upon finishing construction.",
      "Secretary issues Occupancy Certificate within 15 days if compliant.",
      "Rule 21: Post Occupancy Audit can be conducted after 2 years."
    ]
  },
  {
    ruleNumber: "Rules 22 - 24",
    titleMl: "പ്ലോട്ട് ആവശ്യകതകളും വിദ്യുച്ഛക്തി ലൈനുകളിൽ നിന്നുള്ള അകലവും (Plot Standards & Electric Line Setback)",
    titleEn: "General Plot Requirements & Overhead Electric Line Clearances (Rules 22-24)",
    category: "Setbacks & Height",
    summaryMl: "പ്ലോട്ടിന്റെ അനുയോജ്യതയും ഇലക്ട്രിക് ലൈനുകളിൽ നിന്ന് പാലിക്കേണ്ട സുരക്ഷിത അകലവും.",
    summaryEn: "Plot suitability, drainage requirements, and mandatory clearance distances from high/low voltage power lines.",
    keyPointsMl: [
      "റൂൾ 22: വെള്ളപ്പൊക്ക ഭീഷണിയുള്ളതോ മാലിന്യക്കൂമ്പാരമായിരുന്നതോ ആയ സ്ഥലങ്ങളിൽ പ്രത്യേക സുരക്ഷാ മുൻകരുതലുകൾ ഇല്ലാതെ പണിയരുത്.",
      "റൂൾ 22(5) പട്ടിക 2 (ഇലക്ട്രിക് ലൈൻ അകലം):",
      " - Low/Medium Voltage (11,000V വരെ): ലംബ അകലം 2.4m, തിരശ്ചീന അകലം 1.2m.",
      " - High Voltage (11,000V മുതൽ 33,000V വരെ): ലംബ അകലം 3.7m, തിരശ്ചീന അകലം 2.0m.",
      " - 33,000V ന് മുകളിൽ: ഓരോ അധിക 33,000V നും 0.3m അധിക അകലം ആവശ്യമാണ്.",
      "റൂൾ 23: പൊതു റോഡുകളോട് ചേർന്നുള്ള നിർമ്മാണങ്ങൾക്ക് റോഡ് വീതി അനുസരിച്ചുള്ള സെറ്റ്ബാക്കുകൾ പാലിക്കണം."
    ],
    keyPointsEn: [
      "Rule 22: Unsuitable plots (flood-prone, reclaimed refuse) require engineer safety certification.",
      "Rule 22 Table 2: Electric line clearance - Up to 11kV: 2.4m vertical, 1.2m horizontal. 11kV-33kV: 3.7m vertical, 2.0m horizontal.",
      "Rule 23: Mandatory setback from public roads depending on road hierarchy."
    ]
  },

  // CHAPTER IV: RULES 25 TO 31 (OCCUPANCIES, SETBACKS, FSI & PARKING)
  {
    ruleNumber: "Rule 25",
    titleMl: "കെട്ടിട ഉപയോഗ ഗണങ്ങളുടെ വർഗ്ഗീകരണം (Occupancy Classification)",
    titleEn: "Classification of Occupancies Group A1 to J (Rule 25)",
    category: "General",
    summaryMl: "കെട്ടിടങ്ങളെ ആവശ്യങ്ങൾക്കനുസരിച്ച് 14 പ്രത്യേക ഗ്രൂപ്പുകളായി തിരിക്കൽ.",
    summaryEn: "Detailed categorization of all buildings into Occupancy Groups A1 through J.",
    keyPointsMl: [
      "Group A1 (പാർപ്പിടങ്ങൾ), Group A2 (ലോഡ്ജുകൾ/ഹോസ്റ്റലുകൾ), Group B (വിദ്യാഭ്യാസം), Group C (ആശുപത്രികൾ), Group D (സമ്മേളനം), Group D1 (വിനോദം), Group E (ഓഫീസ്), Group F (വാണിജ്യം), Group G1/G2 (വ്യവസായം), Group G3 (ഫാം), Group H (സംഭരണം), Group I (അപായകരം), Group J (മൾട്ടിപ്ലക്സ്).",
      "ഓരോ ഗ്രൂപ്പിനും വെവ്വേറെ റോഡ് വീതി, FSI, പാർക്കിംഗ് ചട്ടങ്ങളുണ്ട്."
    ],
    keyPointsEn: [
      "Categorizes buildings from Group A1 (Residential) to Group J (Multiplex).",
      "Governs road width, maximum FAR/FSI, coverage, and parking calculations."
    ]
  },
  {
    ruleNumber: "Rule 26 & Table 4",
    titleMl: "സെറ്റ്ബാക്കുകളും മുറ്റങ്ങളുടെ അളവുകളും (Minimum Yards & Setbacks)",
    titleEn: "Minimum Yards & Setback Distance Requirements (Rule 26 & Table 4)",
    category: "Setbacks & Height",
    summaryMl: "കെട്ടിടങ്ങൾക്ക് മുന്നിലും വശങ്ങളിലും പുറകിലും വിടേണ്ട ഏറ്റവും കുറഞ്ഞ ദൂരം.",
    summaryEn: "Detailed yard requirements for all building categories as specified in Table 4.",
    keyPointsMl: [
      "ദേശീയപാത/സംസ്ഥാനപാത/ജില്ലാ റോഡുകൾക്ക് അഭിമുഖമായി ഉള്ള പ്ലോട്ടുകളിൽ റോഡ് അതിർത്തിയിൽ നിന്ന് 3 മീറ്റർ സെറ്റ്ബാക്ക് വേണം.",
      "2026 ഗസറ്റ് ഭേദഗതി: 6m ൽ താഴെ വീതിയുള്ള അനോട്ടിഫൈഡ് റോഡിൽ ഒറ്റക്കുടുംബ വീടുകൾക്ക് മുൻമുറ്റം 2 മീറ്റർ മതിയാകും.",
      "2026 ഭേദഗതി: വശത്തെ ചുമരിൽ വാതിൽ/ജനൽ ഇല്ലാത്തപക്ഷം (Blank Wall) ഏതെങ്കിലും ഒരു മുറ്റം 50cm വരെയായി കുറയ്ക്കാം.",
      "റസിഡൻഷ്യൽ സാധാരണ വീടുകൾക്ക്: മുന്നിൽ 2m-3m, ഒരു വശത്ത് 1m, മറു വശത്ത് 1.5m, പിന്നിൽ 1m-1.5m."
    ],
    keyPointsEn: [
      "National / State Highways: Mandatory 3m front yard from road boundary.",
      "2026 Amendment: Front yard reduced to 2m for single family homes on roads < 6m width.",
      "2026 Amendment: Side yard reducible to 50cm for blank walls without openings."
    ]
  },
  {
    ruleNumber: "Rule 27 & Table 6",
    titleMl: "തറ സ്ഥല സൂചികയും പരമാവധി വിസ്തീർണ്ണവും (F.S.I. / Coverage Limits)",
    titleEn: "Floor Space Index (FSI) & Plot Coverage Limits (Rule 27 & Table 6)",
    category: "Setbacks & Height",
    summaryMl: "പ്ലോട്ടിന്റെ വിസ്തീർണ്ണത്തിന് ആനുപാതികമായി പണിയാവുന്ന പരമാവധി തറ വിസ്തീർണ്ണം.",
    summaryEn: "Maximum permissible FSI/FAR and plot coverage for each occupancy type.",
    keyPointsMl: [
      "FSI = ആകെ നിർമ്മിത വിസ്തീർണ്ണം / പ്ലോട്ട് വിസ്തീർണ്ണം.",
      "Group A1 റസിഡൻഷ്യൽ: പരമാവധി FSI 2.5, കവേറേജ് 65%.",
      "Group E ഓഫീസ്: പരമാവധി FSI 3.0, കവേറേജ് 60%.",
      "Group F വാണിജ്യം: പരമാവധി FSI 2.75, കവേറേജ് 65%.",
      "കൂടുതൽ FSI ആവശ്യമെങ്കിൽ ഫീസ് അടച്ച് അധിക FSI ഉപയോഗിക്കാം (ടേബിൾ 6 പ്രകാരം)."
    ],
    keyPointsEn: [
      "FSI Formula = Total Built-up Area / Plot Area.",
      "Group A1 Residential: Max FSI 2.5, Max Coverage 65%.",
      "Group E Office: Max FSI 3.0, Max Coverage 60%."
    ]
  },
  {
    ruleNumber: "Rule 28 & Tables 7, 8, 8A",
    titleMl: "റോഡ് വീതിയും പ്രവേശന മാർഗ്ഗവും (Access Road Widths)",
    titleEn: "Access Road Widths & Street Limits (Rule 28 & Tables 7, 8, 8A)",
    category: "General",
    summaryMl: "വ്യത്യസ്ത വലുപ്പത്തിലുള്ള കെട്ടിടങ്ങളിലേക്ക് ആവശ്യമായ റോഡിന്റെ കുറഞ്ഞ വീതി.",
    summaryEn: "Mandatory street width for different floor area slabs across occupancy groups.",
    keyPointsMl: [
      "Group A1 വാസഗൃഹം (Single House): 1.2 മീറ്റർ വഴി (വാഹന പ്രവേശനത്തിന് 2.4m).",
      "Group A1 അപ്പാർട്ട്മെന്റ് / ഫ്ലാറ്റ് (> 300 sq.m): കുറഞ്ഞത് 3.0 മീറ്റർ റോഡ് വീതി.",
      "വാണിജ്യ/സമ്മേളന കെട്ടിടങ്ങൾക്ക്: 3.0m മുതൽ 7.0m വരെ റോഡ് വീതി നിർബന്ധം."
    ],
    keyPointsEn: [
      "Single family house: Minimum 1.2m pathway (2.4m for car access).",
      "Group A1 Apartments > 300 sq.m: Minimum 3.0m road width.",
      "Commercial & Assembly buildings: 3.0m to 7.0m access road width."
    ]
  },
  {
    ruleNumber: "Rule 29 & Tables 9, 10",
    titleMl: "പാർക്കിംഗ് ക്രമീകരണങ്ങൾ (Off-Street Vehicle Parking)",
    titleEn: "Vehicle Parking Requirements & Bay Dimensions (Rule 29 & Tables 9, 10)",
    category: "Parking",
    summaryMl: "കെട്ടിടങ്ങൾക്കായി നൽകേണ്ട കാർ, ബൈക്ക്, ഭിന്നശേഷി പാർക്കിംഗ് മാനദണ്ഡങ്ങൾ.",
    summaryEn: "Car parking standards, twowheeler space, and accessibility parking slots.",
    keyPointsMl: [
      "ഒരു കാർ പാർക്കിംഗ് സ്പേസ്: 5.5m x 2.7m (കുറഞ്ഞത് 15 ച.മീ).",
      "ഇരുചക്ര വാഹനം: ആവശ്യമായ കാർ പാർക്കിംഗിന്റെ 25% ബൈക്ക് പാർക്കിംഗ് സ്ഥലം വേണം.",
      "ഭിന്നശേഷിക്കാർക്ക്: ആകെ പാർക്കിംഗിന്റെ 3% കുറയാതെ ഭിന്നശേഷി സൗഹൃദ പാർക്കിംഗ് വേണം.",
      "ഇലക്ട്രിക് വാഹനങ്ങൾക്ക് (EV Charging): പ്രത്യേക ചാർജിംഗ് പോയിന്റുകൾ നൽകണം."
    ],
    keyPointsEn: [
      "1 car parking bay = 5.5m x 2.7m (15 sq.m).",
      "Two-wheelers = 25% of required car parking slots.",
      "3% of parking reserved for differently-abled near main entrance.",
      "EV Charging provisions for new commercial and apartment buildings."
    ]
  },

  // CHAPTER V: RULES 32 TO 48 (BUILDING PARTS, HEIGHT, SANITATION, FIRE, ACCESSIBILITY)
  {
    ruleNumber: "Rules 32 - 34",
    titleMl: "മുറികളുടെ അളവുകളും ഉയരവും ശുചിത്വവും (Room Sizes, Height & Sanitation)",
    titleEn: "Mezzanine, Room Heights & Sanitation Facilities (Rules 32-34)",
    category: "Sanitation & Fire",
    summaryMl: "മുറികളുടെ കുറഞ്ഞ ഉയരം, മെസനൈൻ നിലകൾ, ടോയ്‌ലറ്റുകളുടെ അനുപാതം.",
    summaryEn: "Room height rules, mezzanine floor regulations, and minimum toilet count tables.",
    keyPointsMl: [
      "റൂൾ 32: മെസനൈൻ നില പ്രധാന നിലയുടെ 1/3 ഭാഗത്തിൽ കൂടരുത്. ഉയരം കുറഞ്ഞത് 2.2m.",
      "റൂൾ 33: വാസയോഗ്യമായ മുറികളുടെ ഉയരം കുറഞ്ഞത് 2.75 മീറ്റർ. (2026 ഭേദഗതി പ്രകാരം എയർകണ്ടീഷൻ ചെയ്ത മുറികൾക്ക് 2.4 മീറ്റർ മതി).",
      "റൂൾ 34 & പട്ടിക 13-15: ആളുകളുടെ എണ്ണത്തിനനുസരിച്ച് വാട്ടർ ക്ലോസറ്റ് (WC), യൂറിനൽ, വാഷ് ബേസിൻ എന്നിവ നൽകണം."
    ],
    keyPointsEn: [
      "Rule 32: Mezzanine floor area max 1/3rd of main floor, min clear height 2.2m.",
      "Rule 33: Minimum room ceiling height 2.75m. 2026 Amendment: 2.4m for air-conditioned rooms.",
      "Rule 34: Sanitation fittings ratio as per Tables 13, 14, and 15."
    ]
  },
  {
    ruleNumber: "Rules 35 - 37",
    titleMl: "കോണിപ്പടികളും എമർജൻസി എക്സിറ്റുകളും (Staircases & Emergency Exits)",
    titleEn: "Staircases, Escalators & Emergency Exits (Rules 35-37)",
    category: "Sanitation & Fire",
    summaryMl: "സ്റ്റെയർകേസിന്റെ കുറഞ്ഞ വീതി, പടിയുടെ അളവ്, ഫയർ എസ്‌കേപ്പ് കോണിപ്പടികൾ.",
    summaryEn: "Staircase widths, tread/riser ratios, handrail heights, and fire escape staircases.",
    keyPointsMl: [
      "റൂൾ 35: കോണിപ്പടിയുടെ കുറഞ്ഞ വീതി 1.2m (സാധാരണ വീടുകളിൽ 1.0m മതി). പടിയുടെ വീതി (Tread) മിനിമം 30cm, ഉയരം (Riser) പരമാവധി 15cm.",
      "കൈവരി (Handrail) ഉയരം: കുറഞ്ഞത് 90 സെന്റീമീറ്റർ.",
      "റൂൾ 36: എമർജൻസി എക്സിറ്റുകളിലേക്ക് തടസ്സമില്ലാത്ത വഴികൾ ഉണ്ടാവണം.",
      "റൂൾ 37: 2 നിലയിൽ കൂടുതലുള്ള പൊതു കെട്ടിടങ്ങൾക്ക് അടിയന്തിര രക്ഷാമാർഗ്ഗം (Fire Escape Staircase) നിർബന്ധമാണ്."
    ],
    keyPointsEn: [
      "Rule 35: Staircase width min 1.2m (1.0m for single houses), Tread min 30cm, Riser max 15cm.",
      "Handrail height min 90cm.",
      "Rule 37: External fire escape staircase required for multi-storey public buildings."
    ]
  },
  {
    ruleNumber: "Rules 38 - 41",
    titleMl: "ഇ ഇടനാഴികളും ലിഫ്റ്റുകളും വെളിച്ചവും വായുസഞ്ചാരവും (Corridors, Lifts, Light & Ventilation)",
    titleEn: "Passages, Lifts, Lighting & Ventilation (Rules 38-41)",
    category: "Safety & Services",
    summaryMl: "ഇടനാഴികളുടെ വീതി, ലിഫ്റ്റുകളുടെ എണ്ണം, ജാലകങ്ങളുടെ വിസ്തീർണ്ണം.",
    summaryEn: "Corridor width standards, lift installation requirements, and window area rules.",
    keyPointsMl: [
      "റൂൾ 38: ഇടനാഴികളുടെ കുറഞ്ഞ വീതി 1.2 മീറ്റർ (ആശുപത്രികളിൽ 2.0 മീറ്റർ).",
      "റൂൾ 39: പരാപെറ്റ് മതിൽ / ഗ്രില്ലുകളുടെ ഉയരം കുറഞ്ഞത് 1.0 മീറ്റർ.",
      "റൂൾ 40: 4 നിലയിൽ കൂടുതലുള്ള എല്ലാ കെട്ടിടങ്ങളിലും ലിഫ്റ്റ് (Lift) നിർബന്ധമാണ്. ആശുപത്രികളിൽ സ്ട്രെച്ചർ ലിഫ്റ്റ് വേണം.",
      "റൂൾ 41: ഓരോ മുറിയിലും തറ വിസ്തീർണ്ണത്തിന്റെ കുറഞ്ഞത് 1/10 ഭാഗം ജനൽ/വെന്റിലേഷൻ വിസ്തീർണ്ണം ഉണ്ടാവണം."
    ],
    keyPointsEn: [
      "Rule 38: Passage width min 1.2m (2.0m for hospitals).",
      "Rule 40: Lifts mandatory for buildings with more than 4 floors.",
      "Rule 41: Window/ventilation area must be at least 10% of floor area."
    ]
  },
  {
    ruleNumber: "Rule 42",
    titleMl: "ഭിന്നശേഷിക്കാർക്കും വയോജനങ്ങൾക്കുമുള്ള സൗകര്യങ്ങൾ (Accessibility for Differently Abled)",
    titleEn: "Accessibility Provisions for Differently Abled & Elderly (Rule 42)",
    category: "Safety & Services",
    summaryMl: "പൊതു കെട്ടിടങ്ങളിൽ ഭിന്നശേഷിക്കാർക്കായി നൽകേണ്ട നിർബന്ധിത സൗകര്യങ്ങൾ.",
    summaryEn: "Mandatory ramps, accessible toilets, tactile flooring, and handrails in public buildings.",
    keyPointsMl: [
      "അക്സസിബിൾ റാംപ് (Ramp): കുറഞ്ഞ വീതി 1.2 മീറ്റർ, ചരിവ് (Slope) പരമാവധി 1:12.",
      "പ്രത്യേക ടോയ്‌ലറ്റ് (Disabled Toilet): കുറഞ്ഞ അളവ് 1.50m x 1.75m, ഗ്രാബ് ബാറുകൾ (Grab bars) സഹിതം.",
      "ടാക്റ്റൈൽ ടൈലുകൾ (Tactile Tiles): കാഴ്ച പരിമിതിയുള്ളവർക്ക് ദിശാബോധം നൽകുന്ന ടൈലുകൾ പ്രവേശന കവാടങ്ങളിൽ സ്ഥാപിക്കണം."
    ],
    keyPointsEn: [
      "Ramp slope max 1:12 with non-slippery surface and handrails.",
      "Disabled toilet size min 1.50m x 1.75m with grab bars.",
      "Tactile guiding tiles at entrances and staircases for visually impaired."
    ]
  },

  // CHAPTER VI TO XI: SPECIAL PROVISIONS, CRZ, HAZARDOUS, TEMPORARY
  {
    ruleNumber: "Rules 43 - 48",
    titleMl: "അപ്പാർട്ട്മെന്റുകൾ, വ്യവസായങ്ങൾ, പെട്രോൾ പമ്പുകൾ എന്നിവയിലെ പ്രത്യേക നിയമങ്ങൾ (Rules 43-48)",
    titleEn: "Special Provisions for Apartments, Malls, Petrol Pumps & Farms (Rules 43-48)",
    category: "Safety & Services",
    summaryMl: "അപ്പാർട്ട്മെന്റുകൾ, വ്യവസായശാലകൾ, പെട്രോൾ പമ്പുകൾ എന്നിവയിലെ പ്രത്യേക നിബന്ധനകൾ.",
    summaryEn: "Specific regulations for residential apartments, industrial units, fuel stations, and farms.",
    keyPointsMl: [
      "റൂൾ 43: ഫ്ലാറ്റുകളിൽ അസോസിയേഷൻ ഹാൾ, വിനോദ മുറി, പ്ലേ ഏരിയ എന്നിവ നൽകണം.",
      "റൂൾ 45-46: വ്യവസായ കെട്ടിടങ്ങളിൽ തൊഴിലാളികളുടെ സുരക്ഷയ്ക്ക് ഫയർ അലാറം, എക്സിറ്റ് വാതിലുകൾ എന്നിവ നൽകണം.",
      "റൂൾ 47: പെട്രോൾ പമ്പുകൾക്ക് (Fuel Stations) റോഡ് അതിർത്തിയിൽ നിന്ന് കുറഞ്ഞത് 7.5 മീറ്റർ കാണതടസ്സമില്ലാത്ത സ്ഥലം വേണം."
    ],
    keyPointsEn: [
      "Rule 43: Recreation space & community hall requirements for multi-family flats.",
      "Rule 47: Fuel filling stations require 7.5m setback and safety clearances."
    ]
  },
  {
    ruleNumber: "Rules 49 & 50",
    titleMl: "ചെറിയ പ്ലോട്ടുകളിലെ നിർമ്മാണവും ഗോത്രവർഗ്ഗ കോളനികളും (Small Plots & Tribal Housing)",
    titleEn: "Special Rules for Small Plots & Tribal Settlements (Rules 49-50)",
    category: "Low Risk",
    summaryMl: "125 ച.മീറ്ററിൽ താഴെയുള്ള ചെറിയ പ്ലോട്ടുകളിലെ കെട്ടിട നിർമ്മാണ ഇളവുകൾ.",
    summaryEn: "Relaxed setback and coverage norms for small plots up to 125 sq.m and tribal housing schemes.",
    keyPointsMl: [
      "റൂൾ 50: 125 ച.മീറ്റർ വരെയുള്ള ചെറിയ പ്ലോട്ടുകളിൽ ഒറ്റ കുടുംബ വീടിന് വശങ്ങളിൽ 60cm വരെയും പിന്നിൽ 1m വരെയും കുറഞ്ഞ സെറ്റ്ബാക്ക് അനുവദിക്കും.",
      "നിലകളുടെ എണ്ണം പരമാവധി 2 നിലകളിൽ (ഉയരം 10 മീറ്റർ) പരിമിതപ്പെടുത്തണം.",
      "ഗോത്രവർഗ്ഗ കോളനികളിലും സർക്കാരിന്റെ ലൈഫ് (LIFE) മിഷൻ പദ്ധതികളിലും പ്രത്യേക നിർമ്മാണ ഇളവുകളുണ്ട്."
    ],
    keyPointsEn: [
      "Rule 50: Small plots up to 125 sq.m get relaxed side setbacks down to 60cm and rear 1m.",
      "Height limited to 2 storeys (max 10 metres).",
      "Special relaxed provisions for Govt LIFE Mission housing and tribal settlements."
    ]
  },

  // CHAPTER XII TO XVIII: WELLS, RAINWATER, SOLAR, TELECOM, WASTE
  {
    ruleNumber: "Rules 75 & 76",
    titleMl: "കിണറുകളും മഴവെള്ള സംഭരണവും (Wells & Rainwater Harvesting)",
    titleEn: "Wells, Borewells & Rainwater Harvesting (Rules 75-76)",
    category: "Safety & Services",
    summaryMl: "കിണറുകൾ തമ്മിലുള്ള അകലവും മഴവെള്ള സംഭരണ സംവിധാനങ്ങളുടെ നിബന്ധനകളും.",
    summaryEn: "Minimum distance from septic tanks to wells and mandatory rainwater harvesting rules.",
    keyPointsMl: [
      "റൂൾ 75: കിണറിൽ നിന്ന് സെപ്റ്റിക് ടാങ്ക് / ലീച്ച് പിറ്റിലേക്ക് കുറഞ്ഞത് 7.5 മീറ്റർ (കുഴൽക്കിണറുകൾക്ക് 7.5m) അകലം വേണം.",
      "കിണറ്റിന്റെ സംരക്ഷണ മതിൽ ഉയരം കുറഞ്ഞത് 1.0 മീറ്റർ വേണം.",
      "റൂൾ 76: തറ വിസ്തീർണ്ണം 100 ച.മീറ്ററിൽ കൂടുതലുള്ള എല്ലാ പുതിയ കെട്ടിടങ്ങളിലും മഴവെള്ള സംഭരണി (Rainwater Harvesting Tank) അല്ലെങ്കിൽ റീചാർജ് പിറ്റ് നിർബന്ധമാണ്."
    ],
    keyPointsEn: [
      "Rule 75: Minimum 7.5m separation distance between well/borewell and septic tank/leach pit.",
      "Well parapet wall height min 1.0m.",
      "Rule 76: Rainwater harvesting system mandatory for all new buildings > 100 sq.m built-up area."
    ]
  },
  {
    ruleNumber: "Rules 77 - 79A",
    titleMl: "സൗരോർജ്ജ പ്ലാന്റുകളും സോളാർ വാട്ടർ ഹീറ്ററും മാലിന്യ സംസ്കരണവും (Solar & Waste Management)",
    titleEn: "Solar Energy, Waste Management & Telecom Towers (Rules 77-79A)",
    category: "Safety & Services",
    summaryMl: "കെട്ടിടങ്ങളിൽ സോലാർ പാനലുകൾ, മാലിന്യ സംസ്കരണ സംവിധാനങ്ങൾ, ടെലികോം ടവറുകൾ.",
    summaryEn: "Mandatory solar installations, sewage treatment plants (STP), and telecommunication tower rules.",
    keyPointsMl: [
      "റൂൾ 77: 500 ച.മീറ്ററിന് മുകളിലുള്ള കെട്ടിടങ്ങളിൽ സോലാർ പവർ സിസ്റ്റം (Solar Rooftop) നിർബന്ധമാണ്.",
      "റൂൾ 79: 100 ച.മീറ്ററിൽ കൂടുതലുള്ള കെട്ടിടങ്ങളിൽ ഉറവിട മാലിന്യ സംസ്‌കരണ സംവിധാനം (Biogas / Composting) വേണം.",
      "റൂൾ 79A: 2000 ച.മീറ്ററിൽ കൂടുതലുള്ള വലിയ സമുച്ചയങ്ങൾക്ക് എസ്ടിപി (Sewage Treatment Plant - STP) നിർബന്ധമാണ്."
    ],
    keyPointsEn: [
      "Rule 77: Mandatory solar energy installation for buildings > 500 sq.m.",
      "Rule 79: Solid waste management provisions required for all buildings > 100 sq.m.",
      "Rule 79A: On-site Sewage Treatment Plant (STP) required for large complexes > 2000 sq.m."
    ]
  },

  // CHAPTER XIX TO XXIII: REGULARISATION, APPEALS, PENALTIES & REGISTRATION
  {
    ruleNumber: "Rules 89 - 96",
    titleMl: "അനധികൃത നിർമ്മാണ ക്രമവൽക്കരണം (Unauthorised Construction Regularisation)",
    titleEn: "Regularisation of Unauthorised Construction (Rules 89-96)",
    category: "Regularisation",
    summaryMl: "ചട്ടലംഘനം നടത്തി നിർമ്മിച്ച കെട്ടിടങ്ങൾ പിഴയടച്ച് ക്രമവൽക്കരിക്കുന്നതിനുള്ള നിയമങ്ങൾ.",
    summaryEn: "Procedures and fees for regularising deviation or unauthorized building constructions.",
    keyPointsMl: [
      "2019 നവംബർ 7-ന് മുമ്പ് നിർമ്മിച്ച അനധികൃത കെട്ടിടങ്ങൾ 2024 ക്രമവൽക്കരണ ചട്ടങ്ങൾ (Form I-A) പ്രകാരം അപേക്ഷിക്കാം.",
      "അപകടസാധ്യതയില്ലാത്തതും റോഡ് വികസനത്തെ ബാധിക്കാത്തതുമായ നിർമ്മാണങ്ങൾ കോമ്പൗണ്ടിംഗ് ഫീസ് അടച്ച് ക്രമവൽക്കരിക്കാം.",
      "പഞ്ചായത്ത് സെക്രട്ടറി അപേക്ഷ പരിശോധിച്ച് ക്ലിയറൻസ് നൽകും."
    ],
    keyPointsEn: [
      "Unauthorised constructions completed prior to Nov 7, 2019 can apply under Regularisation Rules 2024.",
      "Compounding fees calculated based on nature of deviation and built-up area slab."
    ]
  },
  {
    ruleNumber: "Rules 97 - 102",
    titleMl: "എഞ്ചിനീയർമാരുടെയും ആർക്കിടെക്റ്റുകളുടെയും രജിസ്ട്രേഷൻ (Registration of Technical Personnel)",
    titleEn: "Registration & Qualifications of Architects & Engineers (Rules 97-102)",
    category: "General",
    summaryMl: "ആർക്കിടെക്റ്റുകൾ, എഞ്ചിനീയർമാർ, സൂപ്പർവൈസർമാർ എന്നിവരുടെ യോഗ്യതകളും പ്ലാൻ വരയ്ക്കാനുള്ള അധികാര പരിധികളും.",
    summaryEn: "Licensing categories, qualifications, and plan signing powers of architects, engineers, and supervisors.",
    keyPointsMl: [
      "Architect: Council of Architecture രജിസ്ട്രേഷൻ ഉള്ളവർക്ക് ഏത് വിസ്തീർണ്ണമുള്ള കെട്ടിടത്തിന്റെയും പ്ലാൻ വരയ്ക്കാം.",
      "Engineer A: Corporate Member of Institution of Engineers / B.Tech Civil - 2 ഹെക്ടർ വരെയുള്ള വികസന പ്ലാനുകൾ നൽകാം.",
      "Engineer B / Supervisor Senior: 1000 ച.മീറ്റർ വരെയുള്ള 4 നില കെട്ടിടങ്ങളുടെ പ്ലാനുകൾ ഒപ്പിടാം.",
      "Supervisor A: 750 ച.മീറ്റർ വരെയുള്ള 3 നില കെട്ടിടങ്ങൾക്ക് അർഹതയുണ്ട്.",
      "Supervisor B: 300 ച.മീറ്റർ വരെയുള്ള 2 നില കെട്ടിടങ്ങൾക്ക് (ഉയരം 7.5m) അർഹതയുണ്ട്."
    ],
    keyPointsEn: [
      "Architect: Unlimited built-up area and storey height.",
      "Engineer A: Up to 2 hectares development area and all building types.",
      "Supervisor Senior / Engineer B: Up to 1000 sq.m area, max 4 storeys (14.5m height).",
      "Supervisor A: Up to 750 sq.m area, max 3 storeys (11m height).",
      "Supervisor B: Up to 300 sq.m area, max 2 storeys (7.5m height)."
    ]
  },
  {
    ruleNumber: "Rules 103 - 109",
    ruleNumberInts: [103, 104, 105, 106, 107, 108, 109],
    titleMl: "പരാതികൾ, അപ്പീലുകൾ, പിഴകളും സർക്കാരിന്റെ അധികാരങ്ങളും (Rules 103-109)",
    titleEn: "Appeals, Revisions, Penalties & Clarification Powers (Rules 103-109)",
    category: "Appeals & Penalties",
    chapter: "Chapter XXII - XXIII",
    summaryMl: "സെക്രട്ടറിയുടെ ഉത്തരവുകൾക്കെതിരെയുള്ള അപ്പീൽ, തദ്ദേശ സ്വയംഭരണ ട്രിബ്യൂണൽ, പിഴ വ്യവസ്ഥകൾ.",
    summaryEn: "Appeals process before LSGD Tribunal, penalty for offences, and Government clarification powers.",
    keywords: ["appeal", "lsgd tribunal", "penalty", "stop memo", "demolition", "government clarification", "30 days", "അപ്പീൽ", "ട്രിബ്യൂണൽ", "പിഴ"],
    keyPointsMl: [
      "റൂൾ 104: തദ്ദേശ സ്വയംഭരണ സ്ഥാപനങ്ങളുടെ ഉത്തരവുകളിൽ പരാതിയുള്ളവർക്ക് 30 ദിവസത്തിനകം തദ്ദേശ സ്വയംഭരണ ട്രിബ്യൂണലിൽ അപ്പീൽ നൽകാം.",
      "റൂൾ 107: ചട്ടലംഘനം നടത്തുന്നവർക്കെതിരെ പിഴ ചുമത്താനും നിർമ്മാണം പൊളിച്ചുനീക്കാനും നോട്ടീസ് നൽകാം.",
      "റൂൾ 109: ചട്ടങ്ങളിലെ സംശയങ്ങൾക്ക് സർക്കാരിന്റെ ആധികാരിക വിശദീകരണം (Government Clarification) അന്തിമമായിരിക്കും."
    ],
    keyPointsEn: [
      "Rule 104: Appeal can be filed before the Tribunal for Local Self Government Institutions within 30 days.",
      "Rule 107: Penalties and stop-memo/demolition notices for willful violations.",
      "Rule 109: Government clarifications on any rule ambiguities remain final and binding."
    ]
  }
];

export function extractNumbers(text: string): number[] {
  const matches = text.match(/\d+/g);
  return matches ? matches.map((m) => parseInt(m, 10)) : [];
}

export function searchBuildingRules(
  query: string,
  category: string = "ALL"
): BuildingRuleItem[] {
  const cleanQuery = query.trim().toLowerCase();

  return BUILDING_RULES_LIST.filter((item) => {
    // 1. Category check
    if (category !== "ALL" && item.category !== category) {
      return false;
    }

    if (!cleanQuery) return true;

    // 2. Exact Rule Number or SRO check
    const queryNumbers = extractNumbers(cleanQuery);
    const itemNumbers = [
      ...(item.ruleNumberInts || []),
      ...extractNumbers(item.ruleNumber)
    ];

    const hasNumericMatch = queryNumbers.length > 0 && queryNumbers.some((num) =>
      itemNumbers.includes(num)
    );

    // 3. Multi-word token search
    const tokens = cleanQuery.split(/\s+/).filter(Boolean);

    // Aggregated searchable text
    const searchableText = [
      item.ruleNumber,
      item.titleMl,
      item.titleEn,
      item.summaryMl,
      item.summaryEn,
      item.category,
      item.chapter || "",
      ...(item.tables || []),
      ...(item.keywords || []),
      ...(item.keyPointsMl || []),
      ...(item.keyPointsEn || [])
    ]
      .join(" ")
      .toLowerCase();

    const allTokensMatch = tokens.every((token) => {
      // If token is purely numeric, check numeric match or substring
      if (/^\d+$/.test(token)) {
        const num = parseInt(token, 10);
        return itemNumbers.includes(num) || searchableText.includes(token);
      }
      return searchableText.includes(token);
    });

    return allTokensMatch || (queryNumbers.length > 0 && hasNumericMatch && tokens.length <= 2);
  });
}
