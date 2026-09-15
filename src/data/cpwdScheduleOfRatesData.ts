export interface CPWDMarkupPreset {
  id: string;
  name: string;
  nameMl: string;
  tagline: string;
  description: string;
  contractorProfitPercentage: number; // CPWD: 15% (7.5% profit + 7.5% overheads), KPWD: 10%
  gstPercentage: number; // Statutory 18% on construction works contract
  contingencyPercentage: number; // 3% to 5% for unforeseen site variations
  waterChargesPercentage: number; // 1% as per CPWD DAR (Delhi Analysis of Rates)
  cessPercentage: number; // 1% Labour Welfare BOCW Cess
  costIndexPercentage: number; // Regional Cost Index
  scheduleOfRatesType: "CPWD_DSR_2023" | "KPWD_PRICE_2024" | "CPWD_DSR_2021" | "MARKET_RATE_2025";
}

export const CPWD_MARKUP_PRESETS: CPWDMarkupPreset[] = [
  {
    id: "cpwd_standard_2024",
    name: "CPWD Standard Norms (DSR 2023/24)",
    nameMl: "കേന്ദ്ര പി.ഡബ്ല്യു.ഡി സ്റ്റാൻഡേർഡ് നിരക്കുകൾ",
    tagline: "Official Central PWD Master Rate Analysis",
    description: "Standard CPWD rate analysis: 15% Contractor's Profit & Overheads (CP&OH), 18% GST on Works Contracts, 3% Unforeseen Contingencies, 1% Water Charges, and 1% Labour Welfare Cess.",
    contractorProfitPercentage: 15,
    gstPercentage: 18,
    contingencyPercentage: 3,
    waterChargesPercentage: 1,
    cessPercentage: 1,
    costIndexPercentage: 0,
    scheduleOfRatesType: "CPWD_DSR_2023"
  },
  {
    id: "kerala_pwd_price_2024",
    name: "Kerala PWD PRICE Norms",
    nameMl: "കേരള പി.ഡബ്ല്യു.ഡി പ്രൈസ് മാനദണ്ഡം",
    tagline: "Govt of Kerala LSGD / PWD Standard",
    description: "Kerala PWD PRICE system norm: 10% Contractor Profit, 18% GST, 5% Contingency, 1% Labour Welfare Cess, with regional Kerala Cost Index factor.",
    contractorProfitPercentage: 10,
    gstPercentage: 18,
    contingencyPercentage: 5,
    waterChargesPercentage: 1,
    cessPercentage: 1,
    costIndexPercentage: 32.5,
    scheduleOfRatesType: "KPWD_PRICE_2024"
  },
  {
    id: "private_builder_2024",
    name: "Private Architecture / Builder Norms",
    nameMl: "സ്വകാര്യ ആർക്കിടെക്ചർ നിർമ്മാണ നിരക്ക്",
    tagline: "Residential Architectural Practice",
    description: "Tailored for private architectural contracts and chartered engineer estimates: 12% Project Management & Overhead, 18% GST, and 2.5% Site Contingency.",
    contractorProfitPercentage: 12,
    gstPercentage: 18,
    contingencyPercentage: 2.5,
    waterChargesPercentage: 0.5,
    cessPercentage: 1,
    costIndexPercentage: 0,
    scheduleOfRatesType: "MARKET_RATE_2025"
  },
  {
    id: "direct_materials_labour",
    name: "Direct Net Construction (Zero Markup)",
    nameMl: "നേരിട്ടുള്ള നിർമ്മാണ ചെലവ് (മാർക്ക്-അപ്പ് ഇല്ലാതെ)",
    tagline: "Raw Direct Material & Labour",
    description: "Pure material procurement and labour output rate without overhead markups or statutory taxes (0% Profit, 0% GST, 0% Contingency).",
    contractorProfitPercentage: 0,
    gstPercentage: 0,
    contingencyPercentage: 0,
    waterChargesPercentage: 0,
    cessPercentage: 0,
    costIndexPercentage: 0,
    scheduleOfRatesType: "MARKET_RATE_2025"
  }
];

export interface CPWDScheduleItem {
  id: string;
  dsrCode: string; // e.g. "DSR-2.8.1", "DSR-4.1.3", "DSR-5.1.2", "DSR-11.36"
  chapterNo: number;
  chapterName: string;
  category: string;
  subCategory?: string;
  particulars: string;
  unit: string;
  cpwdBaseRate: number; // Current CPWD DSR Base Rate (INR)
  kpwdPriceRate: number; // Kerala PWD PRICE standard rate with index (INR)
  marketRate: number; // Average market execution rate (INR)
  defaultDimensions?: {
    nos: number;
    length: number;
    breadth: number;
    depth: number;
  };
  subItemsTemplate?: {
    particulars: string;
    nos: number;
    length: number;
    breadth: number;
    depth: number;
    unit: string;
    remarks?: string;
  }[];
}

export const CPWD_DSR_SCHEDULE_OF_RATES: CPWDScheduleItem[] = [
  // ==========================================
  // CHAPTER 1: EARTH WORK & EXCAVATION
  // ==========================================
  {
    id: "dsr_01_01",
    dsrCode: "DSR-2.8.1",
    chapterNo: 1,
    chapterName: "Earth Work",
    category: "Earthwork & Excavation",
    particulars: "Earth work excavation by mechanical means (Hydraulic excavator) / manual means in foundation trenches or drains not exceeding 1.5m in width or 10 sqm on plan, including dressing of sides and ramming of bottoms, lift up to 1.5m, including getting out the excavated soil and disposal of surplus excavated soil as directed, within a lead of 50m in All kinds of soil.",
    unit: "cum",
    cpwdBaseRate: 249.50,
    kpwdPriceRate: 310.00,
    marketRate: 280.00,
    defaultDimensions: { nos: 1, length: 24.5, breadth: 0.9, depth: 0.8 },
    subItemsTemplate: [
      { particulars: "Foundation excavation for Outer Main Walls", nos: 2, length: 24.5, breadth: 0.9, depth: 0.8, unit: "cum", remarks: "Outer perimeter" },
      { particulars: "Foundation excavation for Inner Partition Walls", nos: 3, length: 12.2, breadth: 0.75, depth: 0.8, unit: "cum", remarks: "Cross walls" },
      { particulars: "Portico & Entrance Steps excavation", nos: 1, length: 3.5, breadth: 0.6, depth: 0.35, unit: "cum", remarks: "Entry" }
    ]
  },
  {
    id: "dsr_01_02",
    dsrCode: "DSR-2.25",
    chapterNo: 1,
    chapterName: "Earth Work",
    category: "Earthwork & Excavation",
    particulars: "Filling available excavated earth (excluding rock) in trenches, plinth, sides of foundations etc. in layers not exceeding 20cm in depth, consolidating each deposited layer by ramming and watering, lead up to 50m and lift up to 1.5m.",
    unit: "cum",
    cpwdBaseRate: 185.00,
    kpwdPriceRate: 235.00,
    marketRate: 210.00,
    defaultDimensions: { nos: 1, length: 12.0, breadth: 8.5, depth: 0.45 }
  },
  {
    id: "dsr_01_03",
    dsrCode: "DSR-2.27",
    chapterNo: 1,
    chapterName: "Earth Work",
    category: "Earthwork & Excavation",
    particulars: "Supplying and filling in plinth with quarry dust / river sand under floors including watering, ramming, consolidating and dressing complete.",
    unit: "cum",
    cpwdBaseRate: 1850.00,
    kpwdPriceRate: 2400.00,
    marketRate: 2150.00,
    defaultDimensions: { nos: 1, length: 11.5, breadth: 8.0, depth: 0.15 }
  },

  // ==========================================
  // CHAPTER 2: CONCRETE WORK & BEDDING
  // ==========================================
  {
    id: "dsr_02_01",
    dsrCode: "DSR-4.1.3",
    chapterNo: 2,
    chapterName: "Concrete Work",
    category: "Concrete & Foundation",
    particulars: "Providing and laying in position cement concrete of specified grade excluding the cost of centering and shuttering - All work up to plinth level : 1:4:8 (1 Cement : 4 coarse sand : 8 graded stone aggregate 40mm nominal size).",
    unit: "cum",
    cpwdBaseRate: 6480.00,
    kpwdPriceRate: 7850.00,
    marketRate: 7200.00,
    defaultDimensions: { nos: 1, length: 24.5, breadth: 0.9, depth: 0.1 },
    subItemsTemplate: [
      { particulars: "PCC 1:4:8 Bedding under Outer Long Walls (100mm thk)", nos: 2, length: 24.5, breadth: 0.9, depth: 0.1, unit: "cum", remarks: "100mm Bed" },
      { particulars: "PCC 1:4:8 Bedding under Inner Cross Walls (100mm thk)", nos: 3, length: 12.2, breadth: 0.75, depth: 0.1, unit: "cum", remarks: "100mm Bed" },
      { particulars: "PCC Bedding under steps & ramps", nos: 1, length: 3.5, breadth: 0.6, depth: 0.1, unit: "cum", remarks: "Steps" }
    ]
  },
  {
    id: "dsr_02_02",
    dsrCode: "DSR-4.1.8",
    chapterNo: 2,
    chapterName: "Concrete Work",
    category: "Concrete & Foundation",
    particulars: "Providing and laying in position cement concrete 1:3:6 (1 Cement : 3 coarse sand : 6 graded stone aggregate 20mm nominal size) in foundation bed and floor base under vitrified tiles including compacting and curing.",
    unit: "cum",
    cpwdBaseRate: 7350.00,
    kpwdPriceRate: 8850.00,
    marketRate: 8100.00,
    defaultDimensions: { nos: 1, length: 11.5, breadth: 8.0, depth: 0.1 }
  },
  {
    id: "dsr_02_03",
    dsrCode: "DSR-4.2.1",
    chapterNo: 2,
    chapterName: "Concrete Work",
    category: "Concrete & Foundation",
    particulars: "Providing and laying Damp Proof Course (DPC) 25mm thick with cement concrete 1:2:4 (1 cement : 2 coarse sand : 4 graded stone aggregate 12.5mm nominal size) mixed with approved water proofing compound @ 2% by weight of cement.",
    unit: "sqm",
    cpwdBaseRate: 345.00,
    kpwdPriceRate: 420.00,
    marketRate: 390.00,
    defaultDimensions: { nos: 1, length: 49.0, breadth: 0.23, depth: 1 }
  },

  // ==========================================
  // CHAPTER 3: REINFORCED CEMENT CONCRETE (RCC)
  // ==========================================
  {
    id: "dsr_03_01",
    dsrCode: "DSR-5.1.2",
    chapterNo: 3,
    chapterName: "RCC Work",
    category: "RCC & Structural",
    particulars: "Reinforced cement concrete work in plinth beam / ground beams of design mix M20 (1:1.5:3) using 20mm graded crushed stone aggregate, including centering, shuttering, compaction and curing complete (excluding cost of steel reinforcement).",
    unit: "cum",
    cpwdBaseRate: 11850.00,
    kpwdPriceRate: 14200.00,
    marketRate: 13500.00,
    defaultDimensions: { nos: 1, length: 79.92, breadth: 0.23, depth: 0.3 }
  },
  {
    id: "dsr_03_02",
    dsrCode: "DSR-5.1.3",
    chapterNo: 3,
    chapterName: "RCC Work",
    category: "RCC & Structural",
    particulars: "Reinforced cement concrete work in columns, pillars and piers of design mix M20 (1:1.5:3) using 20mm aggregate, including centering, formwork, compacting with needle vibrator and water curing (excluding steel).",
    unit: "cum",
    cpwdBaseRate: 13950.00,
    kpwdPriceRate: 16800.00,
    marketRate: 15500.00,
    defaultDimensions: { nos: 12, length: 0.23, breadth: 0.3, depth: 3.15 }
  },
  {
    id: "dsr_03_03",
    dsrCode: "DSR-5.2.2",
    chapterNo: 3,
    chapterName: "RCC Work",
    category: "RCC & Structural",
    particulars: "Reinforced cement concrete work in lintels, sunshades (chajjas), beams and cantilevers up to floor level of design mix M20 (1:1.5:3) with 20mm aggregate, including rigid formwork, de-shuttering and curing (excluding steel).",
    unit: "cum",
    cpwdBaseRate: 12650.00,
    kpwdPriceRate: 15400.00,
    marketRate: 14200.00,
    defaultDimensions: { nos: 1, length: 65.5, breadth: 0.23, depth: 0.15 }
  },
  {
    id: "dsr_03_04",
    dsrCode: "DSR-5.3.1",
    chapterNo: 3,
    chapterName: "RCC Work",
    category: "RCC & Structural",
    particulars: "Reinforced cement concrete work in suspended roof slabs and landings (120mm to 150mm thick) of design mix M20 (1:1.5:3) with 20mm aggregate, including centering, steel props formwork, smooth finishing and curing complete (excluding steel).",
    unit: "cum",
    cpwdBaseRate: 12850.00,
    kpwdPriceRate: 15650.00,
    marketRate: 14600.00,
    defaultDimensions: { nos: 1, length: 12.5, breadth: 9.2, depth: 0.12 }
  },
  {
    id: "dsr_03_05",
    dsrCode: "DSR-5.22.6",
    chapterNo: 3,
    chapterName: "RCC Work",
    category: "RCC & Structural",
    particulars: "Steel reinforcement for R.C.C. work including straightening, cutting, bending, placing in position and binding all complete up to plinth and superstructure: Thermo-Mechanically Treated (TMT) bars Fe-500D grade of 8mm, 10mm, 12mm, 16mm diameter.",
    unit: "kg",
    cpwdBaseRate: 92.50,
    kpwdPriceRate: 108.00,
    marketRate: 98.00,
    defaultDimensions: { nos: 1, length: 1, breadth: 1, depth: 1850 }
  },

  // ==========================================
  // CHAPTER 4: BRICKWORK & MASONRY
  // ==========================================
  {
    id: "dsr_04_01",
    dsrCode: "DSR-6.1.1",
    chapterNo: 4,
    chapterName: "Masonry Work",
    category: "Masonry & Walling",
    particulars: "Brick work with common burnt clay F.P.S. (non modular) bricks of class designation 3.5 in foundation and plinth in: Cement mortar 1:6 (1 cement : 6 coarse sand) including scaffolding and curing complete.",
    unit: "cum",
    cpwdBaseRate: 6450.00,
    kpwdPriceRate: 7950.00,
    marketRate: 7400.00,
    defaultDimensions: { nos: 1, length: 49.0, breadth: 0.23, depth: 0.6 }
  },
  {
    id: "dsr_04_02",
    dsrCode: "DSR-6.4.1",
    chapterNo: 4,
    chapterName: "Masonry Work",
    category: "Masonry & Walling",
    particulars: "Random Rubble (RR) masonry with hard stone in foundation and plinth in cement mortar 1:6 (1 cement : 6 coarse sand) including leveling course and curing complete.",
    unit: "cum",
    cpwdBaseRate: 4650.00,
    kpwdPriceRate: 5850.00,
    marketRate: 5200.00,
    defaultDimensions: { nos: 1, length: 49.0, breadth: 0.6, depth: 0.9 },
    subItemsTemplate: [
      { particulars: "RR Masonry 1st Footing in Foundation (0.60m width)", nos: 1, length: 49.0, breadth: 0.6, depth: 0.45, unit: "cum", remarks: "1st Footing" },
      { particulars: "RR Masonry 2nd Footing & Basement level (0.45m width)", nos: 1, length: 49.0, breadth: 0.45, depth: 0.45, unit: "cum", remarks: "Basement" },
      { particulars: "Portico & steps foundation RR masonry", nos: 1, length: 5.5, breadth: 0.45, depth: 0.45, unit: "cum", remarks: "Porch" }
    ]
  },
  {
    id: "dsr_04_03",
    dsrCode: "DSR-6.13",
    chapterNo: 4,
    chapterName: "Masonry Work",
    category: "Masonry & Walling",
    particulars: "Autoclaved Aerated Concrete (AAC) block masonry with AAC blocks (600x200x200mm / 150mm) conforming to IS 2185 (Part 3) in superstructure using thin bed polymer modified block adhesive including jointing and cleaning.",
    unit: "cum",
    cpwdBaseRate: 6150.00,
    kpwdPriceRate: 7400.00,
    marketRate: 6800.00,
    defaultDimensions: { nos: 1, length: 42.0, breadth: 0.2, depth: 3.0 }
  },
  {
    id: "dsr_04_04",
    dsrCode: "DSR-6.22",
    chapterNo: 4,
    chapterName: "Masonry Work",
    category: "Masonry & Walling",
    particulars: "Solid cement concrete block masonry (200mm / 150mm thick) in superstructure above plinth level in cement mortar 1:6 (1 cement : 6 coarse sand) including staging, scaffolding and curing complete.",
    unit: "cum",
    cpwdBaseRate: 5850.00,
    kpwdPriceRate: 7100.00,
    marketRate: 6500.00,
    defaultDimensions: { nos: 1, length: 48.0, breadth: 0.2, depth: 3.0 }
  },

  // ==========================================
  // CHAPTER 5: PLASTERING & POINTING
  // ==========================================
  {
    id: "dsr_05_01",
    dsrCode: "DSR-13.1.1",
    chapterNo: 5,
    chapterName: "Plastering Work",
    category: "Plastering & Pointing",
    particulars: "12mm cement plaster of mix : 1:4 (1 cement : 4 fine sand) on interior walls and soffits of RCC slabs including rounding off corners, scaffolding and 7 days water curing.",
    unit: "sqm",
    cpwdBaseRate: 265.00,
    kpwdPriceRate: 335.00,
    marketRate: 295.00,
    defaultDimensions: { nos: 2, length: 48.0, breadth: 3.0, depth: 1 }
  },
  {
    id: "dsr_05_02",
    dsrCode: "DSR-13.2.1",
    chapterNo: 5,
    chapterName: "Plastering Work",
    category: "Plastering & Pointing",
    particulars: "15mm to 18mm thick external cement plaster in two coats with rough sponge / smooth float finish in cement mortar 1:4 (1 cement : 4 coarse sand) mixed with approved water proofing compound @ 2% by weight of cement including scaffolding.",
    unit: "sqm",
    cpwdBaseRate: 345.00,
    kpwdPriceRate: 430.00,
    marketRate: 385.00,
    defaultDimensions: { nos: 1, length: 49.0, breadth: 3.5, depth: 1 }
  },
  {
    id: "dsr_05_03",
    dsrCode: "DSR-13.16",
    chapterNo: 5,
    chapterName: "Plastering Work",
    category: "Plastering & Pointing",
    particulars: "6mm cement plaster 1:3 (1 cement : 3 fine sand) to ceiling and RCC sunshades including scaffolding and curing complete.",
    unit: "sqm",
    cpwdBaseRate: 215.00,
    kpwdPriceRate: 275.00,
    marketRate: 245.00,
    defaultDimensions: { nos: 1, length: 12.0, breadth: 9.0, depth: 1 }
  },

  // ==========================================
  // CHAPTER 6: FLOORING & TILING
  // ==========================================
  {
    id: "dsr_06_01",
    dsrCode: "DSR-11.36",
    chapterNo: 6,
    chapterName: "Flooring Work",
    category: "Flooring & Tiling",
    particulars: "Providing and laying vitrified floor tiles (800x800mm or 600x600mm) double charged, premium grade with water absorption less than 0.08% in living, dining & bedrooms, laid on 20mm thick cement mortar 1:4 bedding with polymer modified tile adhesive, jointing with matching epoxy grout.",
    unit: "sqm",
    cpwdBaseRate: 1150.00,
    kpwdPriceRate: 1420.00,
    marketRate: 1280.00,
    defaultDimensions: { nos: 1, length: 11.5, breadth: 8.5, depth: 1 }
  },
  {
    id: "dsr_06_02",
    dsrCode: "DSR-11.37",
    chapterNo: 6,
    chapterName: "Flooring Work",
    category: "Flooring & Tiling",
    particulars: "Providing and fixing 1st quality ceramic glazed wall tiles (300x450mm / 300x600mm) in kitchen and toilets up to lintel height (2.10m) over 12mm bed of CM 1:3 with polymer tile adhesive and epoxy grout joints.",
    unit: "sqm",
    cpwdBaseRate: 980.00,
    kpwdPriceRate: 1220.00,
    marketRate: 1100.00,
    defaultDimensions: { nos: 3, length: 7.2, breadth: 2.1, depth: 1 }
  },
  {
    id: "dsr_06_03",
    dsrCode: "DSR-11.23",
    chapterNo: 6,
    chapterName: "Flooring Work",
    category: "Flooring & Tiling",
    particulars: "Providing and fixing 18mm thick mirror polished Jet Black Granite stone slab for kitchen platform counter top, vanity counter and staircase treads with full bull-nosing and chamfered edges laid over CM 1:4 bed.",
    unit: "sqm",
    cpwdBaseRate: 2450.00,
    kpwdPriceRate: 3100.00,
    marketRate: 2850.00,
    defaultDimensions: { nos: 1, length: 4.8, breadth: 0.65, depth: 1 }
  },
  {
    id: "dsr_06_04",
    dsrCode: "DSR-11.41",
    chapterNo: 6,
    chapterName: "Flooring Work",
    category: "Flooring & Tiling",
    particulars: "Providing and laying matte finish anti-skid ceramic floor tiles (300x300mm / 600x600mm) in toilets, utility and open balconies laid on 20mm cement mortar 1:4 bed with matching grout.",
    unit: "sqm",
    cpwdBaseRate: 890.00,
    kpwdPriceRate: 1120.00,
    marketRate: 980.00,
    defaultDimensions: { nos: 3, length: 2.1, breadth: 1.8, depth: 1 }
  },

  // ==========================================
  // CHAPTER 7: WOODWORK, DOORS & WINDOWS
  // ==========================================
  {
    id: "dsr_07_01",
    dsrCode: "DSR-9.1.1",
    chapterNo: 7,
    chapterName: "Wood & Openings",
    category: "Woodwork & Openings",
    particulars: "Providing and fixing 1st class seasoned Teak / Mahogany wood wrought, framed and fixed in position for main entrance door frames (125x75mm section) with holdfasts embedded in cement concrete blocks.",
    unit: "cum",
    cpwdBaseRate: 125000.00,
    kpwdPriceRate: 155000.00,
    marketRate: 142000.00,
    defaultDimensions: { nos: 1, length: 5.4, breadth: 0.125, depth: 0.075 }
  },
  {
    id: "dsr_07_02",
    dsrCode: "DSR-9.21",
    chapterNo: 7,
    chapterName: "Wood & Openings",
    category: "Woodwork & Openings",
    particulars: "Providing and fixing 35mm thick factory made pre-laminated / veneer finished flush door shutters with solid particle core blockboard, including SS heavy duty hinges, mortise lock, handles and tower bolts complete.",
    unit: "sqm",
    cpwdBaseRate: 2850.00,
    kpwdPriceRate: 3550.00,
    marketRate: 3200.00,
    defaultDimensions: { nos: 6, length: 2.1, breadth: 0.9, depth: 1 }
  },
  {
    id: "dsr_07_03",
    dsrCode: "DSR-9.48",
    chapterNo: 7,
    chapterName: "Wood & Openings",
    category: "Woodwork & Openings",
    particulars: "Providing and fixing factory made lead-free multi-chambered UPVC sliding / openable casement windows with galvanized steel reinforcement, 5mm Saint-Gobain clear float glass, SS friction stays, EPDM gaskets, hardware and sealant complete.",
    unit: "sqm",
    cpwdBaseRate: 4650.00,
    kpwdPriceRate: 5750.00,
    marketRate: 5100.00,
    defaultDimensions: { nos: 8, length: 1.5, breadth: 1.2, depth: 1 }
  },

  // ==========================================
  // CHAPTER 8: FINISHING & PAINTING
  // ==========================================
  {
    id: "dsr_08_01",
    dsrCode: "DSR-13.48",
    chapterNo: 8,
    chapterName: "Painting Work",
    category: "Finishing & Painting",
    particulars: "Wall painting with premium acrylic interior luxury emulsion paint of approved brand (Asian Paints Royale / Berger Silk) to give an even shade: Two or more coats applied over two coats of acrylic wall putty and one coat of primer.",
    unit: "sqm",
    cpwdBaseRate: 165.00,
    kpwdPriceRate: 215.00,
    marketRate: 185.00,
    defaultDimensions: { nos: 2, length: 48.0, breadth: 3.0, depth: 1 }
  },
  {
    id: "dsr_08_02",
    dsrCode: "DSR-13.43",
    chapterNo: 8,
    chapterName: "Painting Work",
    category: "Finishing & Painting",
    particulars: "Finishing exterior walls with 100% premium acrylic exterior emulsion paint with silicone & anti-algal protection (Asian Paints Apex Ultima / Dulux Weathershield): Two or more coats applied over one coat of exterior primer.",
    unit: "sqm",
    cpwdBaseRate: 185.00,
    kpwdPriceRate: 235.00,
    marketRate: 205.00,
    defaultDimensions: { nos: 1, length: 49.0, breadth: 3.5, depth: 1 }
  },
  {
    id: "dsr_08_03",
    dsrCode: "DSR-13.61",
    chapterNo: 8,
    chapterName: "Painting Work",
    category: "Finishing & Painting",
    particulars: "Painting with synthetic enamel paint of approved brand and manufacture to give an even shade: Two or more coats on new wood work and steel work over an undercoat of zinc chromate / red oxide primer.",
    unit: "sqm",
    cpwdBaseRate: 145.00,
    kpwdPriceRate: 185.00,
    marketRate: 160.00,
    defaultDimensions: { nos: 1, length: 25.0, breadth: 1.2, depth: 1 }
  },

  // ==========================================
  // CHAPTER 9: ROOFING & WATERPROOFING
  // ==========================================
  {
    id: "dsr_09_01",
    dsrCode: "DSR-12.41",
    chapterNo: 9,
    chapterName: "Roofing & Waterproofing",
    category: "Roofing & Waterproofing",
    particulars: "Providing and applying crystalline integral cementitious waterproofing slurry coat in two coats on RCC roof terrace slab and sunken slabs including cleaning, curing and pond testing for 72 hours.",
    unit: "sqm",
    cpwdBaseRate: 420.00,
    kpwdPriceRate: 520.00,
    marketRate: 460.00,
    defaultDimensions: { nos: 1, length: 12.5, breadth: 9.2, depth: 1 }
  },
  {
    id: "dsr_09_02",
    dsrCode: "DSR-12.52",
    chapterNo: 9,
    chapterName: "Roofing & Waterproofing",
    category: "Roofing & Waterproofing",
    particulars: "Providing and fixing pre-painted Galvalume profile roofing sheets (0.50mm BMT) over MS hollow tubular truss framework including self-drilling EPDM washer screws, ridge capping and flashing complete.",
    unit: "sqm",
    cpwdBaseRate: 1150.00,
    kpwdPriceRate: 1420.00,
    marketRate: 1280.00,
    defaultDimensions: { nos: 1, length: 14.0, breadth: 10.5, depth: 1 }
  },

  // ==========================================
  // CHAPTER 10: PLUMBING & SANITARY
  // ==========================================
  {
    id: "dsr_10_01",
    dsrCode: "DSR-17.1.1",
    chapterNo: 10,
    chapterName: "Plumbing & Sanitary",
    category: "Plumbing & Sanitary",
    particulars: "Providing and fixing wall-hung / floor mounted European Water Closet (EWC) vitreous china white suite with concealed dual flush cistern, soft-close seat cover, jet spray, angle valves and CP connections complete.",
    unit: "nos",
    cpwdBaseRate: 8650.00,
    kpwdPriceRate: 10800.00,
    marketRate: 9500.00,
    defaultDimensions: { nos: 3, length: 1, breadth: 1, depth: 1 }
  },
  {
    id: "dsr_10_02",
    dsrCode: "DSR-18.7.2",
    chapterNo: 10,
    chapterName: "Plumbing & Sanitary",
    category: "Plumbing & Sanitary",
    particulars: "Providing and fixing chlorinated polyvinyl chloride (CPVC) pipe lines SDR 11 for internal water supply with all fittings like tees, bends, unions, brass transition fittings and clamps (20mm / 25mm dia).",
    unit: "metre",
    cpwdBaseRate: 310.00,
    kpwdPriceRate: 385.00,
    marketRate: 345.00,
    defaultDimensions: { nos: 1, length: 65.0, breadth: 1, depth: 1 }
  },
  {
    id: "dsr_10_03",
    dsrCode: "DSR-19.1.3",
    chapterNo: 10,
    chapterName: "Plumbing & Sanitary",
    category: "Plumbing & Sanitary",
    particulars: "Providing and fixing PVC SWR soil & waste drainage pipes (110mm / 75mm dia) conforming to IS:13592 including rubber ring joints, floor traps with SS jali, vent cowl, access doors and brackets complete.",
    unit: "metre",
    cpwdBaseRate: 480.00,
    kpwdPriceRate: 610.00,
    marketRate: 540.00,
    defaultDimensions: { nos: 1, length: 45.0, breadth: 1, depth: 1 }
  },

  // ==========================================
  // CHAPTER 11: ELECTRICAL & CONDUITS
  // ==========================================
  {
    id: "dsr_11_01",
    dsrCode: "ELEC-01",
    chapterNo: 11,
    chapterName: "Electrical",
    category: "Electrical & Conduits",
    particulars: "Wiring for light point / fan point / exhaust fan point / call bell point with 1.5 sq.mm FRLS PVC insulated multi-strand copper conductor single core cable in surface / recessed medium class PVC conduit with modular switch & cover plate.",
    unit: "point",
    cpwdBaseRate: 850.00,
    kpwdPriceRate: 1050.00,
    marketRate: 920.00,
    defaultDimensions: { nos: 45, length: 1, breadth: 1, depth: 1 }
  },
  {
    id: "dsr_11_02",
    dsrCode: "ELEC-02",
    chapterNo: 11,
    chapterName: "Electrical",
    category: "Electrical & Conduits",
    particulars: "Supplying and fixing 8-way / 12-way double door SPN / TPN Distribution Board with 40A / 63A 4-Pole Isolator, 30mA RCCB, and individual 10A/16A/20A Type C Miniature Circuit Breakers (MCB).",
    unit: "set",
    cpwdBaseRate: 9800.00,
    kpwdPriceRate: 12400.00,
    marketRate: 11200.00,
    defaultDimensions: { nos: 1, length: 1, breadth: 1, depth: 1 }
  },

  // ==========================================
  // CHAPTER 12: EXTERNAL WORKS & MISCELLANEOUS
  // ==========================================
  {
    id: "dsr_12_01",
    dsrCode: "DSR-16.1",
    chapterNo: 12,
    chapterName: "External Works",
    category: "Miscellaneous & External",
    particulars: "Providing and laying factory made precast concrete interlocking paver blocks (60mm / 80mm thick) M-30 grade in driveway and courtyard laid over 50mm bed of coarse sand including jointing with fine sand.",
    unit: "sqm",
    cpwdBaseRate: 680.00,
    kpwdPriceRate: 850.00,
    marketRate: 760.00,
    defaultDimensions: { nos: 1, length: 15.0, breadth: 4.5, depth: 1 }
  },
  {
    id: "dsr_12_02",
    dsrCode: "DSR-16.15",
    chapterNo: 12,
    chapterName: "External Works",
    category: "Miscellaneous & External",
    particulars: "Construction of Rainwater Harvesting recharge well / soak pit (1.2m dia x 3.0m depth) with precast RCC rings, 40mm metal filter bed, sand bedding, PVC inlet piping and heavy duty RCC cover slab.",
    unit: "unit",
    cpwdBaseRate: 28500.00,
    kpwdPriceRate: 35000.00,
    marketRate: 32000.00,
    defaultDimensions: { nos: 1, length: 1, breadth: 1, depth: 1 }
  }
];
