import { PlanSymbolCategory } from "../../../types/buildingPlanTemplate";

export interface SymbolCatalogItem {
  type: string;
  name: string;
  nameMl: string;
  category: PlanSymbolCategory;
  defaultWidth: number; // percentage of canvas width (e.g. 7%)
  defaultHeight: number; // percentage
  defaultLabel?: string;
  description: string;
  realDimensions: string;
}

export const SYMBOL_CATALOG: SymbolCatalogItem[] = [
  // -------------------------------------------------------------
  // DOORS
  // -------------------------------------------------------------
  {
    type: "door_single",
    name: "Room Single Door (90cm)",
    nameMl: "മുറി വാതിൽ (90 cm)",
    category: "door",
    defaultWidth: 8,
    defaultHeight: 8,
    defaultLabel: "D1",
    description: "Standard 90cm room door with 90° swing clearance arc. Direction and swing flip customizable.",
    realDimensions: "900 mm × 2100 mm"
  },
  {
    type: "door_single",
    name: "Toilet Door (80cm)",
    nameMl: "ടോയ്‌ലറ്റ് വാതിൽ (80 cm)",
    category: "door",
    defaultWidth: 7,
    defaultHeight: 7,
    defaultLabel: "D2",
    description: "Compact 80cm bathroom / utility door with inward swing arc.",
    realDimensions: "800 mm × 2100 mm"
  },
  {
    type: "door_double",
    name: "Main Double Door",
    nameMl: "പ്രധാന ഇരട്ട വാതിൽ",
    category: "door",
    defaultWidth: 12,
    defaultHeight: 7,
    defaultLabel: "MD",
    description: "Entrance double door meeting at center with dual outward or inward swing arcs.",
    realDimensions: "1500 mm × 2100 mm"
  },
  {
    type: "door_sliding",
    name: "Sliding Glass Door",
    nameMl: "സ്ലൈഡിങ് ഗ്ലാസ് വാതിൽ",
    category: "door",
    defaultWidth: 12,
    defaultHeight: 5,
    defaultLabel: "SD",
    description: "2-track sliding door for patio, balcony, or veranda access.",
    realDimensions: "1800 mm × 2100 mm"
  },

  // -------------------------------------------------------------
  // BEDS
  // -------------------------------------------------------------
  {
    type: "bed_single",
    name: "Single Bed",
    nameMl: "സിംഗിൾ കട്ടിൽ",
    category: "furniture",
    defaultWidth: 8,
    defaultHeight: 12,
    defaultLabel: "Bed",
    description: "Single bed with pillow and mattress lines.",
    realDimensions: "900 mm × 2000 mm"
  },
  {
    type: "bed_double",
    name: "Double Bed (Queen)",
    nameMl: "ഡബിൾ കട്ടിൽ (ക്വീൻ)",
    category: "furniture",
    defaultWidth: 12,
    defaultHeight: 13,
    defaultLabel: "Bed",
    description: "Queen size double bed with dual pillows.",
    realDimensions: "1500 mm × 2000 mm"
  },
  {
    type: "bed_king",
    name: "King Bed + Side Tables",
    nameMl: "കിംഗ് ബെഡ് + സൈഡ് ടേബിൾ",
    category: "furniture",
    defaultWidth: 15,
    defaultHeight: 14,
    defaultLabel: "King Bed",
    description: "Master bedroom king size bed with built-in bedside nightstands.",
    realDimensions: "1800 mm × 2000 mm"
  },

  // -------------------------------------------------------------
  // CHAIRS & SOFAS
  // -------------------------------------------------------------
  {
    type: "chair",
    name: "Study / Dining Chair",
    nameMl: "കസേര",
    category: "furniture",
    defaultWidth: 5,
    defaultHeight: 5,
    defaultLabel: "",
    description: "Ergonomic 2D top view chair with curved backrest.",
    realDimensions: "500 mm × 500 mm"
  },
  {
    type: "sofa_1seater",
    name: "1-Seater Armchair",
    nameMl: "സിംഗിൾ സോഫ",
    category: "furniture",
    defaultWidth: 7,
    defaultHeight: 7,
    defaultLabel: "",
    description: "Living room single armchair with padded arms and backrest.",
    realDimensions: "800 mm × 800 mm"
  },
  {
    type: "sofa_2seater",
    name: "2-Seater Sofa (Loveseat)",
    nameMl: "2-സീറ്റർ സോഫ",
    category: "furniture",
    defaultWidth: 12,
    defaultHeight: 7,
    defaultLabel: "Sofa",
    description: "Two-passenger living sofa with dual seat cushions.",
    realDimensions: "1500 mm × 850 mm"
  },
  {
    type: "sofa_3seater",
    name: "3-Seater Sofa",
    nameMl: "3-സീറ്റർ സോഫ",
    category: "furniture",
    defaultWidth: 16,
    defaultHeight: 7,
    defaultLabel: "Sofa",
    description: "Full three-passenger living room couch.",
    realDimensions: "2100 mm × 850 mm"
  },
  {
    type: "sofa_l_shape",
    name: "L-Shape Corner Sectional",
    nameMl: "L-ഷേപ്പ് കോർണർ സോഫ",
    category: "furniture",
    defaultWidth: 16,
    defaultHeight: 15,
    defaultLabel: "Sofa",
    description: "Modern corner L-shaped sectional with lounge chaise.",
    realDimensions: "2400 mm × 2000 mm"
  },

  // -------------------------------------------------------------
  // DINING TABLES
  // -------------------------------------------------------------
  {
    type: "dining_4seater",
    name: "4-Seater Dining Set",
    nameMl: "4-സീറ്റർ ഡൈനിംഗ് ടേബിൾ",
    category: "furniture",
    defaultWidth: 10,
    defaultHeight: 8,
    defaultLabel: "Dining",
    description: "Compact 4-person rectangular dining table with chairs.",
    realDimensions: "1200 mm × 800 mm"
  },
  {
    type: "dining_6seater",
    name: "6-Seater Dining Set",
    nameMl: "6-സീറ്റർ ഡൈനിംഗ് ടേബിൾ",
    category: "furniture",
    defaultWidth: 14,
    defaultHeight: 9,
    defaultLabel: "Dining",
    description: "Family 6-person rectangular dining set with 6 chairs.",
    realDimensions: "1800 mm × 900 mm"
  },

  // -------------------------------------------------------------
  // KITCHEN
  // -------------------------------------------------------------
  {
    type: "kitchen_sink_single",
    name: "Kitchen Sink (Single + Drainboard)",
    nameMl: "കിച്ചൻ സിങ്ക്",
    category: "kitchen",
    defaultWidth: 9,
    defaultHeight: 5,
    defaultLabel: "Sink",
    description: "Stainless steel single basin sink with sloped drying board and faucet.",
    realDimensions: "1000 mm × 500 mm"
  },
  {
    type: "kitchen_sink_double",
    name: "Kitchen Sink (Double Bowl)",
    nameMl: "ഡബിൾ കിച്ചൻ സിങ്ക്",
    category: "kitchen",
    defaultWidth: 10,
    defaultHeight: 5,
    defaultLabel: "Sink",
    description: "Dual basin stainless steel wash sink.",
    realDimensions: "1200 mm × 500 mm"
  },
  {
    type: "kitchen_slab_straight",
    name: "Kitchen Slab Counter (Straight)",
    nameMl: "കിച്ചൻ കൗണ്ടർ സ്ലാബ്",
    category: "kitchen",
    defaultWidth: 16,
    defaultHeight: 5,
    defaultLabel: "Counter",
    description: "600mm deep granite counter slab with integrated cooktop stove area.",
    realDimensions: "2400 mm × 600 mm"
  },
  {
    type: "kitchen_slab_l",
    name: "Kitchen Slab Counter (L-Shape)",
    nameMl: "L-ഷേപ്പ് കിച്ചൻ സ്ലാബ്",
    category: "kitchen",
    defaultWidth: 15,
    defaultHeight: 14,
    defaultLabel: "Counter",
    description: "Corner L-shaped kitchen granite platform with cooktop and sink prep area.",
    realDimensions: "2400 mm × 2100 mm"
  },
  {
    type: "kitchen_gas_stove",
    name: "Gas Stove / Hob (4-Burner)",
    nameMl: "ഗ്യാസ് സ്റ്റൗവ് (4 ബർണർ)",
    category: "kitchen",
    defaultWidth: 7,
    defaultHeight: 5,
    defaultLabel: "Stove",
    description: "4-burner glass top cooking range with control knobs.",
    realDimensions: "750 mm × 500 mm"
  },

  // -------------------------------------------------------------
  // SANITARY
  // -------------------------------------------------------------
  {
    type: "toilet_commode",
    name: "Toilet Commode (EWC)",
    nameMl: "യൂറോപ്യൻ ക്ലോസറ്റ് (EWC)",
    category: "sanitary",
    defaultWidth: 5,
    defaultHeight: 6,
    defaultLabel: "WC",
    description: "Wall-hung or floor-mounted European water closet with dual-flush tank.",
    realDimensions: "400 mm × 650 mm"
  },
  {
    type: "wash_basin",
    name: "Wash Basin",
    nameMl: "വാഷ് ബേസിൻ",
    category: "sanitary",
    defaultWidth: 5,
    defaultHeight: 5,
    defaultLabel: "WB",
    description: "Ceramic oval hand wash basin with tap hole and drain.",
    realDimensions: "550 mm × 450 mm"
  }
];
