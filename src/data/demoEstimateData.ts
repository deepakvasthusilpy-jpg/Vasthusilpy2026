import { EstimateProject, normalizeProjectBlocks } from "./estimateData";

export const RAW_DEMO_ESTIMATE_EST_2026_003: EstimateProject = {
  id: "EST-2026-003",
  clientName: "Sri. K. Ramesh & Smt. Geetha Ramesh",
  clientPhone: "+91 98471 23987",
  houseName: "Rohini Nilayam",
  postOffice: "Keralassery P.O.",
  panchayatVillage: "Keralassery Grama Panchayath",
  districtPincode: "Palakkad - 678641",
  syNo: "142/3B",
  blockNo: "12",
  wardNo: "05",
  buildingType: "Proposed Two Storeyed Residential Building",
  plinthAreaSqFt: 1850,
  plinthAreaSqM: 171.87,
  preparedBy: "DEEPAK .C",
  regNo: "E-2050/08/14087/KKD/318/2018/CA",
  showEngineerDetails: true,
  estimationDate: "2026-03-15",
  headlineNarrative:
    "Building Estimation of quantity of the proposed Two Storeyed Residential Building at Keralassery Grama Panchayath in RSy No: 142/3B, BLOCK No: 12, WARD NO: 05 OWNED BY Sri. K. Ramesh & Smt. Geetha Ramesh, Rohini Nilayam, Keralassery P.O., Palakkad - 678641 (Total Plinth Area: 1850 Sq.Ft / 171.87 Sq.M).",
  status: "Active",
  verificationHash: "VER-EST2026003-DEMO-KERALA",
  stageExpenditure: 1450000,
  stageCompletedText: "Ground Floor Roof Slab & First Floor Superstructure Masonry in Progress",
  stageDate: "2026-04-10",
  totalAmount: 0,
  scheduleOfRatesType: "CPWD_DSR_2023",
  hasMarkups: true,
  includeMarkupsInGrandTotal: true,
  hasUnforeseen: true,
  contractorProfitPercentage: 15,
  contractorProfitAmount: 0,
  gstPercentage: 18,
  gstAmount: 0,
  contingencyPercentage: 3,
  contingencyAmount: 0,
  waterChargesPercentage: 1,
  waterChargesAmount: 0,
  cessPercentage: 1,
  cessAmount: 0,
  costIndexPercentage: 0,
  costIndexAmount: 0,
  totalMarkupsAmount: 0,
  unforeseenDescription: "Unforeseen Expenses & Site Development Contingencies",
  unforeseenQty: "3%",
  unforeseenAmount: 0,
  grandTotal: 0,
  blocks: [
    {
      id: "block_1",
      blockTitle: "BLOCK 1: MAIN RESIDENTIAL BUILDING",
      totalAmount: 0,
      appendices: [
        {
          id: "app_1",
          title: "APPENDIX A GROUND FLOOR CIVIL STRUCTURE",
          subtitle: "Ground Floor Detailed Quantity Estimate (Plinth Area: 1,050 Sq.Ft)",
          totalAmount: 0,
          items: [
            // Item 1: Earthwork
            {
              id: "item_001_main",
              slNo: "1",
              particulars:
                "Earth work excavation in ordinary soil for foundation trenches up to 1.5m depth including dressing of sides, ramming of bottom, lift up to 1.5m and lead up to 50m with all labour and tools.",
              isSubItem: false,
              nos: 0,
              length: 0,
              breadth: 0,
              depth: 0,
              quantity: 0,
              unit: "cum",
              rate: 285,
              amount: 0,
              remarks: "Foundation trenches"
            },
            {
              id: "item_001_sub1",
              particulars: "Main Long walls foundation excavation (Front & Rear)",
              isSubItem: true,
              nos: 2,
              length: 18.6,
              breadth: 0.9,
              depth: 0.8,
              quantity: 26.784,
              unit: "cum",
              rate: 0,
              amount: 0,
              remarks: "Long walls"
            },
            {
              id: "item_001_sub2",
              particulars: "Short cross walls foundation excavation",
              isSubItem: true,
              nos: 4,
              length: 6.2,
              breadth: 0.9,
              depth: 0.8,
              quantity: 17.856,
              unit: "cum",
              rate: 0,
              amount: 0,
              remarks: "Cross walls"
            },
            {
              id: "item_001_sub3",
              particulars: "Sitout & car porch column footings excavation",
              isSubItem: true,
              nos: 4,
              length: 1.2,
              breadth: 1.2,
              depth: 1.0,
              quantity: 5.76,
              unit: "cum",
              rate: 0,
              amount: 0,
              remarks: "Footings"
            },

            // Item 2: PCC 1:4:8
            {
              id: "item_002_main",
              slNo: "2",
              particulars:
                "Providing and laying in position cement concrete 1:4:8 (1 cement : 4 coarse sand : 8 graded stone aggregate 40mm nominal size) in foundation bed including consolidation, curing and levelling complete.",
              isSubItem: false,
              nos: 0,
              length: 0,
              breadth: 0,
              depth: 0,
              quantity: 0,
              unit: "cum",
              rate: 5850,
              amount: 0,
              remarks: "PCC bed"
            },
            {
              id: "item_002_sub1",
              particulars: "Foundation bed under long walls",
              isSubItem: true,
              nos: 2,
              length: 18.6,
              breadth: 0.9,
              depth: 0.15,
              quantity: 5.022,
              unit: "cum",
              rate: 0,
              amount: 0,
              remarks: "Long walls bed"
            },
            {
              id: "item_002_sub2",
              particulars: "Foundation bed under cross walls",
              isSubItem: true,
              nos: 4,
              length: 6.2,
              breadth: 0.9,
              depth: 0.15,
              quantity: 3.348,
              unit: "cum",
              rate: 0,
              amount: 0,
              remarks: "Cross walls bed"
            },
            {
              id: "item_002_sub3",
              particulars: "Column footings PCC bed",
              isSubItem: true,
              nos: 4,
              length: 1.2,
              breadth: 1.2,
              depth: 0.15,
              quantity: 0.864,
              unit: "cum",
              rate: 0,
              amount: 0,
              remarks: "Column bed"
            },

            // Item 3: RR Masonry
            {
              id: "item_003_main",
              slNo: "3",
              particulars:
                "Random Rubble (RR) masonry with hard stone in cement mortar 1:6 (1 cement : 6 coarse sand) in foundation and basement including scaffolding, watering and curing complete.",
              isSubItem: false,
              nos: 0,
              length: 0,
              breadth: 0,
              depth: 0,
              quantity: 0,
              unit: "cum",
              rate: 4650,
              amount: 0,
              remarks: "RR foundation & basement"
            },
            {
              id: "item_003_sub1",
              particulars: "Foundation 1st footing under long walls",
              isSubItem: true,
              nos: 2,
              length: 18.6,
              breadth: 0.6,
              depth: 0.45,
              quantity: 10.044,
              unit: "cum",
              rate: 0,
              amount: 0
            },
            {
              id: "item_003_sub2",
              particulars: "Foundation 1st footing under cross walls",
              isSubItem: true,
              nos: 4,
              length: 6.5,
              breadth: 0.6,
              depth: 0.45,
              quantity: 7.02,
              unit: "cum",
              rate: 0,
              amount: 0
            },
            {
              id: "item_003_sub3",
              particulars: "Basement wall above ground under long walls",
              isSubItem: true,
              nos: 2,
              length: 18.6,
              breadth: 0.45,
              depth: 0.6,
              quantity: 10.044,
              unit: "cum",
              rate: 0,
              amount: 0
            },
            {
              id: "item_003_sub4",
              particulars: "Basement wall above ground under cross walls",
              isSubItem: true,
              nos: 4,
              length: 6.65,
              breadth: 0.45,
              depth: 0.6,
              quantity: 7.182,
              unit: "cum",
              rate: 0,
              amount: 0
            },

            // Item 4: DPC
            {
              id: "item_004_main",
              slNo: "4",
              particulars:
                "Providing and laying Damp Proof Course (DPC) 25mm thick with cement mortar 1:3 (1 cement : 3 coarse sand) mixed with standard water proofing compound as per manufacturer specifications.",
              isSubItem: false,
              nos: 0,
              length: 0,
              breadth: 0,
              depth: 0,
              quantity: 0,
              unit: "sqm",
              rate: 320,
              amount: 0,
              remarks: "DPC 25mm"
            },
            {
              id: "item_004_sub1",
              particulars: "Over main external basement walls",
              isSubItem: true,
              nos: 2,
              length: 18.6,
              breadth: 0.45,
              depth: 0,
              quantity: 16.74,
              unit: "sqm",
              rate: 0,
              amount: 0
            },
            {
              id: "item_004_sub2",
              particulars: "Over internal cross basement walls",
              isSubItem: true,
              nos: 4,
              length: 6.65,
              breadth: 0.45,
              depth: 0,
              quantity: 11.97,
              unit: "sqm",
              rate: 0,
              amount: 0
            },

            // Item 5: Block/Brick Masonry
            {
              id: "item_005_main",
              slNo: "5",
              particulars:
                "Solid cement concrete block / First class burnt clay brick masonry in cement mortar 1:6 (1 cement : 6 coarse sand) in ground floor superstructure including raking of joints, curing and scaffolding complete.",
              isSubItem: false,
              nos: 0,
              length: 0,
              breadth: 0,
              depth: 0,
              quantity: 0,
              unit: "cum",
              rate: 6450,
              amount: 0,
              remarks: "GF Superstructure Masonry"
            },
            {
              id: "item_005_sub1",
              particulars: "Main external long walls",
              isSubItem: true,
              nos: 2,
              length: 18.6,
              breadth: 0.2,
              depth: 3.05,
              quantity: 22.692,
              unit: "cum",
              rate: 0,
              amount: 0
            },
            {
              id: "item_005_sub2",
              particulars: "Internal cross partition walls",
              isSubItem: true,
              nos: 4,
              length: 6.8,
              breadth: 0.2,
              depth: 3.05,
              quantity: 16.592,
              unit: "cum",
              rate: 0,
              amount: 0
            },
            {
              id: "item_005_sub3",
              particulars: "Sitout square columns",
              isSubItem: true,
              nos: 4,
              length: 0.4,
              breadth: 0.4,
              depth: 3.05,
              quantity: 1.952,
              unit: "cum",
              rate: 0,
              amount: 0
            },
            {
              id: "item_005_sub4",
              particulars: "Deduct Main Entrance Door (D1) opening",
              isSubItem: true,
              isDeduction: true,
              nos: -1,
              length: 1.2,
              breadth: 0.2,
              depth: 2.1,
              quantity: -0.504,
              unit: "cum",
              rate: 0,
              amount: 0,
              remarks: "Door D1 deduction"
            },
            {
              id: "item_005_sub5",
              particulars: "Deduct Internal Doors (D2) openings",
              isSubItem: true,
              isDeduction: true,
              nos: -5,
              length: 0.9,
              breadth: 0.2,
              depth: 2.1,
              quantity: -1.89,
              unit: "cum",
              rate: 0,
              amount: 0,
              remarks: "Doors D2 deduction"
            },
            {
              id: "item_005_sub6",
              particulars: "Deduct Window (W1) openings",
              isSubItem: true,
              isDeduction: true,
              nos: -6,
              length: 1.5,
              breadth: 0.2,
              depth: 1.35,
              quantity: -2.43,
              unit: "cum",
              rate: 0,
              amount: 0,
              remarks: "Windows W1 deduction"
            },

            // Item 6: RCC Structure
            {
              id: "item_006_main",
              slNo: "6",
              particulars:
                "Reinforced Cement Concrete (RCC) 1:1.5:3 (1 cement : 1.5 coarse sand : 3 graded stone aggregate 20mm nominal size) in plinth beam, lintels, chajjas, columns, and 120mm thick roof slab including centering, shuttering, steel reinforcement and curing complete.",
              isSubItem: false,
              nos: 0,
              length: 0,
              breadth: 0,
              depth: 0,
              quantity: 0,
              unit: "cum",
              rate: 11200,
              amount: 0,
              remarks: "RCC GF Beams & Slab"
            },
            {
              id: "item_006_sub1",
              particulars: "Plinth beam (200x250mm) along all walls",
              isSubItem: true,
              nos: 1,
              length: 64.0,
              breadth: 0.2,
              depth: 0.25,
              quantity: 3.2,
              unit: "cum",
              rate: 0,
              amount: 0
            },
            {
              id: "item_006_sub2",
              particulars: "Continuous lintel beam & sunshade chajjas",
              isSubItem: true,
              nos: 1,
              length: 52.0,
              breadth: 0.2,
              depth: 0.15,
              quantity: 1.56,
              unit: "cum",
              rate: 0,
              amount: 0
            },
            {
              id: "item_006_sub3",
              particulars: "Ground floor roof slab (120mm thickness)",
              isSubItem: true,
              nos: 1,
              length: 13.5,
              breadth: 8.2,
              depth: 0.12,
              quantity: 13.284,
              unit: "cum",
              rate: 0,
              amount: 0
            },

            // Item 7: Plastering Interior
            {
              id: "item_007_main",
              slNo: "7",
              particulars:
                "Plastering 12mm thick with cement mortar 1:4 (1 cement : 4 fine sand) to ceiling and interior wall surfaces with smooth trowelled finish including curing and scaffolding complete.",
              isSubItem: false,
              nos: 0,
              length: 0,
              breadth: 0,
              depth: 0,
              quantity: 0,
              unit: "sqm",
              rate: 265,
              amount: 0,
              remarks: "Internal Plastering"
            },
            {
              id: "item_007_sub1",
              particulars: "Ceiling surface plastering",
              isSubItem: true,
              nos: 1,
              length: 13.5,
              breadth: 8.2,
              depth: 0,
              quantity: 110.7,
              unit: "sqm",
              rate: 0,
              amount: 0
            },
            {
              id: "item_007_sub2",
              particulars: "Internal wall surfaces (both sides)",
              isSubItem: true,
              nos: 2,
              length: 64.0,
              breadth: 3.05,
              depth: 0,
              quantity: 390.4,
              unit: "sqm",
              rate: 0,
              amount: 0
            },
            {
              id: "item_007_sub3",
              particulars: "Deduct door and window openings",
              isSubItem: true,
              isDeduction: true,
              nos: -6,
              length: 1.5,
              breadth: 1.35,
              depth: 0,
              quantity: -12.15,
              unit: "sqm",
              rate: 0,
              amount: 0
            },

            // Item 8: External Plastering
            {
              id: "item_008_main",
              slNo: "8",
              particulars:
                "External plastering 15mm thick in two coats with cement mortar 1:4 with approved water proofing compound including sponge finish, curing and staging.",
              isSubItem: false,
              nos: 0,
              length: 0,
              breadth: 0,
              depth: 0,
              quantity: 0,
              unit: "sqm",
              rate: 315,
              amount: 0,
              remarks: "External Plastering"
            },
            {
              id: "item_008_sub1",
              particulars: "External four exterior wall faces",
              isSubItem: true,
              nos: 1,
              length: 51.0,
              breadth: 3.35,
              depth: 0,
              quantity: 170.85,
              unit: "sqm",
              rate: 0,
              amount: 0
            },

            // Item 9: Flooring
            {
              id: "item_009_main",
              slNo: "9",
              particulars:
                "Vitrified tile flooring (600x600mm) premium grade laid on 20mm thick cement mortar bed 1:4 with polymer modified tile adhesive, joint pointing with matching epoxy grout complete.",
              isSubItem: false,
              nos: 0,
              length: 0,
              breadth: 0,
              depth: 0,
              quantity: 0,
              unit: "sqm",
              rate: 1250,
              amount: 0,
              remarks: "Vitrified Tile Flooring"
            },
            {
              id: "item_009_sub1",
              particulars: "Living, Dining, Kitchen & Bedrooms flooring",
              isSubItem: true,
              nos: 1,
              length: 12.2,
              breadth: 7.4,
              depth: 0,
              quantity: 90.28,
              unit: "sqm",
              rate: 0,
              amount: 0
            },
            {
              id: "item_009_sub2",
              particulars: "Toilet & Wash area anti-skid ceramic tile flooring",
              isSubItem: true,
              nos: 2,
              length: 2.1,
              breadth: 1.8,
              depth: 0,
              quantity: 7.56,
              unit: "sqm",
              rate: 0,
              amount: 0
            },

            // Item 10: Painting
            {
              id: "item_010_main",
              slNo: "10",
              particulars:
                "Wall painting with two coats of premium interior acrylic emulsion paint of approved brand and manufacture over a coat of primer including putty smoothing complete.",
              isSubItem: false,
              nos: 1,
              length: 0,
              breadth: 0,
              depth: 0,
              quantity: 485.0,
              unit: "sqm",
              rate: 145,
              amount: 70325,
              remarks: "Interior Emulsion Painting"
            }
          ]
        },
        {
          id: "app_2",
          title: "APPENDIX B FIRST FLOOR CIVIL STRUCTURE",
          subtitle: "First Floor Detailed Quantity Estimate (Plinth Area: 800 Sq.Ft)",
          totalAmount: 0,
          items: [
            // FF Item 1: Masonry
            {
              id: "item_101_main",
              slNo: "1",
              particulars:
                "Solid cement concrete block / burnt clay brick masonry in cement mortar 1:6 in first floor superstructure including staging, curing and scaffolding complete.",
              isSubItem: false,
              nos: 0,
              length: 0,
              breadth: 0,
              depth: 0,
              quantity: 0,
              unit: "cum",
              rate: 6450,
              amount: 0,
              remarks: "FF Superstructure Masonry"
            },
            {
              id: "item_101_sub1",
              particulars: "First floor exterior perimeter walls",
              isSubItem: true,
              nos: 2,
              length: 14.2,
              breadth: 0.2,
              depth: 3.05,
              quantity: 17.324,
              unit: "cum",
              rate: 0,
              amount: 0
            },
            {
              id: "item_101_sub2",
              particulars: "First floor interior cross partition walls",
              isSubItem: true,
              nos: 3,
              length: 5.8,
              breadth: 0.2,
              depth: 3.05,
              quantity: 10.614,
              unit: "cum",
              rate: 0,
              amount: 0
            },
            {
              id: "item_101_sub3",
              particulars: "Deduct First Floor doors & windows openings",
              isSubItem: true,
              isDeduction: true,
              nos: -6,
              length: 1.2,
              breadth: 0.2,
              depth: 1.8,
              quantity: -2.592,
              unit: "cum",
              rate: 0,
              amount: 0
            },

            // FF Item 2: RCC Structure
            {
              id: "item_102_main",
              slNo: "2",
              particulars:
                "Reinforced Cement Concrete (RCC) 1:1.5:3 in first floor roof slab (120mm), lintels, sunshades, and parapet coping beam including shuttering, steel reinforcement and curing complete.",
              isSubItem: false,
              nos: 0,
              length: 0,
              breadth: 0,
              depth: 0,
              quantity: 0,
              unit: "cum",
              rate: 11200,
              amount: 0,
              remarks: "RCC FF Slab & Beams"
            },
            {
              id: "item_102_sub1",
              particulars: "First floor roof slab (120mm thickness)",
              isSubItem: true,
              nos: 1,
              length: 11.2,
              breadth: 7.2,
              depth: 0.12,
              quantity: 9.6768,
              unit: "cum",
              rate: 0,
              amount: 0
            },
            {
              id: "item_102_sub2",
              particulars: "First floor lintel beam & sunshades",
              isSubItem: true,
              nos: 1,
              length: 38.0,
              breadth: 0.2,
              depth: 0.15,
              quantity: 1.14,
              unit: "cum",
              rate: 0,
              amount: 0
            },
            {
              id: "item_102_sub3",
              particulars: "Parapet wall top concrete coping band",
              isSubItem: true,
              nos: 1,
              length: 42.0,
              breadth: 0.15,
              depth: 0.075,
              quantity: 0.4725,
              unit: "cum",
              rate: 0,
              amount: 0
            },

            // FF Item 3: Plastering
            {
              id: "item_103_main",
              slNo: "3",
              particulars:
                "Plastering 12mm thick with cement mortar 1:4 on first floor interior walls and ceiling with neat finish including curing and scaffolding complete.",
              isSubItem: false,
              nos: 0,
              length: 0,
              breadth: 0,
              depth: 0,
              quantity: 0,
              unit: "sqm",
              rate: 265,
              amount: 0,
              remarks: "FF Interior Plastering"
            },
            {
              id: "item_103_sub1",
              particulars: "First floor ceiling plastering",
              isSubItem: true,
              nos: 1,
              length: 11.2,
              breadth: 7.2,
              depth: 0,
              quantity: 80.64,
              unit: "sqm",
              rate: 0,
              amount: 0
            },
            {
              id: "item_103_sub2",
              particulars: "First floor interior wall plastering",
              isSubItem: true,
              nos: 1,
              length: 72.0,
              breadth: 3.05,
              depth: 0,
              quantity: 219.6,
              unit: "sqm",
              rate: 0,
              amount: 0
            },

            // FF Item 4: Flooring
            {
              id: "item_104_main",
              slNo: "4",
              particulars:
                "Vitrified tile flooring (600x600mm) in first floor upper living lounge, bedrooms and balcony including skirting complete.",
              isSubItem: false,
              nos: 0,
              length: 0,
              breadth: 0,
              depth: 0,
              quantity: 0,
              unit: "sqm",
              rate: 1250,
              amount: 0,
              remarks: "FF Tile Flooring"
            },
            {
              id: "item_104_sub1",
              particulars: "First floor bedrooms and upper living lounge",
              isSubItem: true,
              nos: 1,
              length: 10.5,
              breadth: 6.8,
              depth: 0,
              quantity: 71.4,
              unit: "sqm",
              rate: 0,
              amount: 0
            },
            {
              id: "item_104_sub2",
              particulars: "First floor front open balcony anti-skid tiles",
              isSubItem: true,
              nos: 1,
              length: 4.2,
              breadth: 1.8,
              depth: 0,
              quantity: 7.56,
              unit: "sqm",
              rate: 0,
              amount: 0
            },

            // FF Item 5: Waterproofing
            {
              id: "item_105_main",
              slNo: "5",
              particulars:
                "Waterproofing treatment over flat open terrace roof slab with elastomeric polymer modified coating, fiber mesh reinforcement and protective screed mortar.",
              isSubItem: false,
              nos: 1,
              length: 0,
              breadth: 0,
              depth: 0,
              quantity: 85.0,
              unit: "sqm",
              rate: 480,
              amount: 40800,
              remarks: "Terrace Waterproofing"
            },

            // FF Item 6: Painting
            {
              id: "item_106_main",
              slNo: "6",
              particulars:
                "Painting with two coats of premium acrylic emulsion paint over primer coat on first floor interior walls and ceiling.",
              isSubItem: false,
              nos: 1,
              length: 0,
              breadth: 0,
              depth: 0,
              quantity: 360.0,
              unit: "sqm",
              rate: 145,
              amount: 52200,
              remarks: "FF Acrylic Emulsion"
            }
          ]
        }
      ]
    }
  ]
};

/**
 * Normalized demo estimate EST-2026-003 with mathematically accurate calculations,
 * CPWD rates, 15% CP&OH, 18% Works GST, and 3% Contingency.
 */
let cachedDemoEstimate: EstimateProject | null = null;
export function getDemoEstimateEST2026003(): EstimateProject {
  if (!cachedDemoEstimate) {
    cachedDemoEstimate = normalizeProjectBlocks(RAW_DEMO_ESTIMATE_EST_2026_003);
  }
  return cachedDemoEstimate;
}

export const DEMO_ESTIMATE_EST_2026_003: EstimateProject = normalizeProjectBlocks(RAW_DEMO_ESTIMATE_EST_2026_003);
