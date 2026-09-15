import { BuildingPlanProject } from "../types/buildingPlanTemplate";
import { VASTHUSILPY_LOGO_DATA_URL, ENGINEER_CONTACT_DETAILS } from "./vasthusilpyLogo";

// Sample SVG Architectural Floor Plans rendered as clean vector drawings
export const SAMPLE_GROUND_FLOOR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" style="background:%23ffffff; font-family:Arial, sans-serif;">
  <rect width="800" height="600" fill="%23ffffff" />

  <!-- Title Watermark -->
  <text x="400" y="35" text-anchor="middle" font-size="16" font-weight="bold" fill="%231e293b" letter-spacing="1">GROUND FLOOR PLAN</text>
  <text x="400" y="55" text-anchor="middle" font-size="11" fill="%2364748b">BUILT-UP AREA: 145.20 SQ.M (1563 SQ.FT) | CEILING HT: 3.10 M</text>

  <!-- Exterior Walls (Thick black) -->
  <rect x="120" y="100" width="560" height="420" fill="none" stroke="%230f172a" stroke-width="8" rx="2" />
  
  <!-- Porch extension -->
  <path d="M 120 400 L 40 400 L 40 520 L 120 520" fill="none" stroke="%230f172a" stroke-width="6" stroke-dasharray="8 4" />
  <text x="80" y="465" text-anchor="middle" font-size="11" font-weight="bold" fill="%230284c7">CAR PORCH</text>
  <text x="80" y="480" text-anchor="middle" font-size="9" fill="%2364748b">3.60 x 5.00 M</text>

  <!-- Sitout -->
  <rect x="120" y="380" width="160" height="140" fill="%23f8fafc" stroke="%230f172a" stroke-width="4" />
  <text x="200" y="445" text-anchor="middle" font-size="12" font-weight="bold" fill="%230f172a">SIT-OUT</text>
  <text x="200" y="462" text-anchor="middle" font-size="10" fill="%2364748b">3.80 x 2.40 M</text>

  <!-- Living Room -->
  <rect x="280" y="300" width="240" height="220" fill="%23ffffff" stroke="%230f172a" stroke-width="4" />
  <text x="400" y="400" text-anchor="middle" font-size="13" font-weight="bold" fill="%230f172a">LIVING ROOM</text>
  <text x="400" y="420" text-anchor="middle" font-size="10" fill="%2364748b">5.20 x 4.50 M</text>
  <!-- Sofa schematic -->
  <rect x="300" y="320" width="80" height="35" rx="4" fill="%23e2e8f0" stroke="%2364748b" stroke-width="1.5" />
  <rect x="300" y="360" width="30" height="50" rx="4" fill="%23e2e8f0" stroke="%2364748b" stroke-width="1.5" />
  <rect x="340" y="365" width="40" height="30" rx="2" fill="%23cbd5e1" stroke="%2394a3b8" stroke-width="1" />

  <!-- Dining Hall -->
  <rect x="280" y="100" width="240" height="200" fill="%23ffffff" stroke="%230f172a" stroke-width="4" />
  <text x="400" y="195" text-anchor="middle" font-size="13" font-weight="bold" fill="%230f172a">DINING HALL</text>
  <text x="400" y="215" text-anchor="middle" font-size="10" fill="%2364748b">5.20 x 3.80 M</text>
  <!-- Dining Table -->
  <rect x="360" y="150" width="80" height="50" rx="6" fill="%23f1f5f9" stroke="%2364748b" stroke-width="1.5" />
  <circle cx="345" cy="175" r="7" fill="%23cbd5e1" />
  <circle cx="455" cy="175" r="7" fill="%23cbd5e1" />
  <circle cx="380" cy="135" r="7" fill="%23cbd5e1" />
  <circle cx="420" cy="135" r="7" fill="%23cbd5e1" />
  <circle cx="380" cy="215" r="7" fill="%23cbd5e1" />
  <circle cx="420" cy="215" r="7" fill="%23cbd5e1" />

  <!-- Master Bedroom + Bath (South-West) -->
  <rect x="120" y="100" width="160" height="200" fill="%23ffffff" stroke="%230f172a" stroke-width="4" />
  <text x="200" y="195" text-anchor="middle" font-size="12" font-weight="bold" fill="%230f172a">BEDROOM 01</text>
  <text x="200" y="215" text-anchor="middle" font-size="10" fill="%2364748b">3.80 x 4.20 M</text>
  <!-- Bed Symbol -->
  <rect x="135" y="115" width="70" height="75" rx="3" fill="%23f8fafc" stroke="%2394a3b8" stroke-width="1.5" />
  <rect x="140" y="120" width="28" height="18" rx="2" fill="%23e2e8f0" />
  <rect x="172" y="120" width="28" height="18" rx="2" fill="%23e2e8f0" />

  <!-- Attached Toilet 01 -->
  <rect x="120" y="300" width="160" height="80" fill="%23f1f5f9" stroke="%230f172a" stroke-width="4" />
  <text x="200" y="340" text-anchor="middle" font-size="11" font-weight="bold" fill="%230f172a">TOILET</text>
  <text x="200" y="355" text-anchor="middle" font-size="9" fill="%2364748b">2.00 x 1.80 M</text>

  <!-- Kitchen (South-East - Agni Corner) -->
  <rect x="520" y="300" width="160" height="220" fill="%23ffffff" stroke="%230f172a" stroke-width="4" />
  <text x="600" y="395" text-anchor="middle" font-size="13" font-weight="bold" fill="%230f172a">KITCHEN</text>
  <text x="600" y="415" text-anchor="middle" font-size="10" fill="%2364748b">3.60 x 4.20 M</text>
  <path d="M 530 310 L 670 310 L 670 420" fill="none" stroke="%23cbd5e1" stroke-width="12" />
  <!-- Stove Icon -->
  <circle cx="640" cy="350" r="8" fill="none" stroke="%23f97316" stroke-width="2" />
  <circle cx="640" cy="380" r="8" fill="none" stroke="%23f97316" stroke-width="2" />

  <!-- Bedroom 02 -->
  <rect x="520" y="100" width="160" height="200" fill="%23ffffff" stroke="%230f172a" stroke-width="4" />
  <text x="600" y="195" text-anchor="middle" font-size="12" font-weight="bold" fill="%230f172a">BEDROOM 02</text>
  <text x="600" y="215" text-anchor="middle" font-size="10" fill="%2364748b">3.60 x 3.80 M</text>
  <rect x="590" y="115" width="75" height="70" rx="3" fill="%23f8fafc" stroke="%2394a3b8" stroke-width="1.5" />

  <!-- Staircase -->
  <g transform="translate(450, 105)">
    <rect x="0" y="0" width="60" height="110" fill="none" stroke="%23475569" stroke-width="2" />
    <line x1="0" y1="15" x2="60" y2="15" stroke="%2394a3b8" stroke-width="1.5" />
    <line x1="0" y1="30" x2="60" y2="30" stroke="%2394a3b8" stroke-width="1.5" />
    <line x1="0" y1="45" x2="60" y2="45" stroke="%2394a3b8" stroke-width="1.5" />
    <line x1="0" y1="60" x2="60" y2="60" stroke="%2394a3b8" stroke-width="1.5" />
    <line x1="0" y1="75" x2="60" y2="75" stroke="%2394a3b8" stroke-width="1.5" />
    <line x1="0" y1="90" x2="60" y2="90" stroke="%2394a3b8" stroke-width="1.5" />
    <path d="M 30 100 L 30 20 L 25 30 M 30 20 L 35 30" stroke="%232563eb" stroke-width="2" fill="none" />
    <text x="30" y="105" text-anchor="middle" font-size="8" font-weight="bold" fill="%232563eb">UP</text>
  </g>

  <!-- Doors and Openings -->
  <!-- Main Door -->
  <path d="M 280 430 A 40 40 0 0 1 320 470" fill="none" stroke="%23b45309" stroke-width="2" stroke-dasharray="3 3" />
  <line x1="280" y1="430" x2="280" y2="470" stroke="%23b45309" stroke-width="3" />
  <text x="300" y="485" font-size="9" font-weight="bold" fill="%23b45309">MD (1.00x2.10)</text>

  <!-- Dimension Lines -->
  <!-- Left overall dimension -->
  <line x1="90" y1="100" x2="90" y2="520" stroke="%23475569" stroke-width="1.5" />
  <line x1="80" y1="100" x2="100" y2="100" stroke="%23475569" stroke-width="1.5" />
  <line x1="80" y1="520" x2="100" y2="520" stroke="%23475569" stroke-width="1.5" />
  <text x="75" y="315" font-size="12" font-weight="bold" fill="%230f172a" transform="rotate(-90 75 315)">12.80 M (42' 0")</text>

  <!-- Bottom overall dimension -->
  <line x1="120" y1="550" x2="680" y2="550" stroke="%23475569" stroke-width="1.5" />
  <line x1="120" y1="540" x2="120" y2="560" stroke="%23475569" stroke-width="1.5" />
  <line x1="680" y1="540" x2="680" y2="560" stroke="%23475569" stroke-width="1.5" />
  <text x="400" y="570" text-anchor="middle" font-size="12" font-weight="bold" fill="%230f172a">16.40 M (53' 9")</text>

  <!-- North Arrow Indicator -->
  <g transform="translate(730, 90)">
    <circle cx="0" cy="0" r="24" fill="%23ffffff" stroke="%230f172a" stroke-width="2" />
    <polygon points="0,-20 8,0 0,6" fill="%23dc2626" />
    <polygon points="0,-20 -8,0 0,6" fill="%230f172a" />
    <text x="0" y="-24" text-anchor="middle" font-size="13" font-weight="black" fill="%23dc2626">N</text>
  </g>
</svg>`;

export const SAMPLE_FIRST_FLOOR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" style="background:%23ffffff; font-family:Arial, sans-serif;">
  <rect width="800" height="600" fill="%23ffffff" />

  <text x="400" y="35" text-anchor="middle" font-size="16" font-weight="bold" fill="%231e293b" letter-spacing="1">FIRST FLOOR PLAN</text>
  <text x="400" y="55" text-anchor="middle" font-size="11" fill="%2364748b">BUILT-UP AREA: 108.50 SQ.M (1168 SQ.FT) | CEILING HT: 3.00 M</text>

  <!-- Exterior Walls -->
  <rect x="160" y="100" width="480" height="380" fill="none" stroke="%230f172a" stroke-width="8" rx="2" />

  <!-- Upper Living -->
  <rect x="280" y="240" width="240" height="240" fill="%23ffffff" stroke="%230f172a" stroke-width="4" />
  <text x="400" y="350" text-anchor="middle" font-size="13" font-weight="bold" fill="%230f172a">UPPER LIVING</text>
  <text x="400" y="370" text-anchor="middle" font-size="10" fill="%2364748b">4.80 x 4.20 M</text>

  <!-- Balcony -->
  <rect x="280" y="480" width="240" height="60" fill="%23f8fafc" stroke="%230f172a" stroke-width="4" stroke-dasharray="6 3" />
  <text x="400" y="515" text-anchor="middle" font-size="11" font-weight="bold" fill="%230284c7">OPEN BALCONY</text>

  <!-- Bedroom 03 -->
  <rect x="160" y="100" width="180" height="220" fill="%23ffffff" stroke="%230f172a" stroke-width="4" />
  <text x="250" y="200" text-anchor="middle" font-size="12" font-weight="bold" fill="%230f172a">BEDROOM 03</text>
  <text x="250" y="220" text-anchor="middle" font-size="10" fill="%2364748b">3.80 x 4.00 M</text>
  <rect x="175" y="115" width="75" height="70" rx="3" fill="%23f8fafc" stroke="%2394a3b8" stroke-width="1.5" />

  <!-- Bedroom 04 -->
  <rect x="460" y="100" width="180" height="220" fill="%23ffffff" stroke="%230f172a" stroke-width="4" />
  <text x="550" y="200" text-anchor="middle" font-size="12" font-weight="bold" fill="%230f172a">BEDROOM 04</text>
  <text x="550" y="220" text-anchor="middle" font-size="10" fill="%2364748b">3.80 x 4.00 M</text>
  <rect x="550" y="115" width="75" height="70" rx="3" fill="%23f8fafc" stroke="%2394a3b8" stroke-width="1.5" />

  <!-- Open Terrace (Cutout) -->
  <rect x="160" y="320" width="120" height="160" fill="%23f1f5f9" stroke="%230f172a" stroke-width="3" stroke-dasharray="5 5" />
  <text x="220" y="400" text-anchor="middle" font-size="11" font-weight="bold" fill="%2364748b">OPEN TERRACE</text>

  <!-- Dimension Lines -->
  <line x1="130" y1="100" x2="130" y2="480" stroke="%23475569" stroke-width="1.5" />
  <line x1="120" y1="100" x2="140" y2="100" stroke="%23475569" stroke-width="1.5" />
  <line x1="120" y1="480" x2="140" y2="480" stroke="%23475569" stroke-width="1.5" />
  <text x="115" y="295" font-size="12" font-weight="bold" fill="%230f172a" transform="rotate(-90 115 295)">11.50 M (37' 8")</text>

  <line x1="160" y1="565" x2="640" y2="565" stroke="%23475569" stroke-width="1.5" />
  <line x1="160" y1="555" x2="160" y2="575" stroke="%23475569" stroke-width="1.5" />
  <line x1="640" y1="555" x2="640" y2="575" stroke="%23475569" stroke-width="1.5" />
  <text x="400" y="585" text-anchor="middle" font-size="12" font-weight="bold" fill="%230f172a">14.40 M (47' 3")</text>

  <!-- North Arrow -->
  <g transform="translate(730, 90)">
    <circle cx="0" cy="0" r="24" fill="%23ffffff" stroke="%230f172a" stroke-width="2" />
    <polygon points="0,-20 8,0 0,6" fill="%23dc2626" />
    <polygon points="0,-20 -8,0 0,6" fill="%230f172a" />
    <text x="0" y="-24" text-anchor="middle" font-size="13" font-weight="black" fill="%23dc2626">N</text>
  </g>
</svg>`;

export const INITIAL_BUILDING_PLAN_PROJECT: BuildingPlanProject = {
  id: "BPP-2026-001",
  projectTitle: "Sri. Ussainar Residence - Architectural Permit Plans",
  createdAt: "2026-09-07",
  updatedAt: "2026-09-07",

  // Layout & Sheet Setup
  sheetOrientation: "landscape",
  paperSize: "A4",
  titleBlockPosition: "right",
  stripWidthMm: 70,
  marginConfig: {
    leftMm: 15,
    rightMm: 10,
    topMm: 10,
    bottomMm: 10,
    presetName: "standard_kerala"
  },

  // 1. Logo Box & Office Branding
  officeName: "VASTHUSILPY KERALASSERY",
  officeAddress: "Main Road, Keralassery, Palakkad - 678641, Kerala",
  officeMobile: "7012383137",
  officeWhatsapp: "+918848241463",
  officeEmail: "deepak.vasthusilpy@gmail.com",
  officeWebsite: "www.vasthusilpy.com",
  logoUrl: VASTHUSILPY_LOGO_DATA_URL,

  // 2. Licensed Professional Block & Engineer Contact
  licenseeName: "DEEPAK .C",
  licenseNumber: "SUPERVISOR-A (Civil) & Vasthu Silpy",
  registrationNumber: "E-2050/08/14087/KKD/318/2018/CA",
  departmentAuthority: "Dept. of Urban Affairs, Govt. of Kerala",
  engineerCallNumber: "7012383137",
  engineerWhatsappNumber: "+918848241463",

  // 3. Project Info
  projectLocation: "Kongad Grama Panchayat, Palakkad District",
  clientName: "Sri. Ussainar & Smt. Khadeeja",
  defaultScale: "1 : 100",
  defaultDate: "07-09-2026",
  defaultRevision: "R0",

  // 4. Area Table Grid
  areaTable: [
    {
      id: "row-1",
      floor: "Ground Floor",
      proposedBuiltUpSqM: 145.2,
      proposedFloorAreaSqM: 132.8,
      existingBuiltUpSqM: 0,
      existingFloorAreaSqM: 0,
      proposedSqM: 145.2,
      proposedSqFt: 1562.92,
      existingSqM: 0,
      existingSqFt: 0,
      builtUpSqM: 145.2,
      builtUpSqFt: 1562.92,
      floorAreaSqM: 132.8,
      floorAreaSqFt: 1429.45
    },
    {
      id: "row-2",
      floor: "First Floor",
      proposedBuiltUpSqM: 108.5,
      proposedFloorAreaSqM: 98.4,
      existingBuiltUpSqM: 0,
      existingFloorAreaSqM: 0,
      proposedSqM: 108.5,
      proposedSqFt: 1167.88,
      existingSqM: 0,
      existingSqFt: 0,
      builtUpSqM: 108.5,
      builtUpSqFt: 1167.88,
      floorAreaSqM: 98.4,
      floorAreaSqFt: 1059.17
    },
    {
      id: "row-3",
      floor: "Stair Room",
      proposedBuiltUpSqM: 18.04,
      proposedFloorAreaSqM: 15.6,
      existingBuiltUpSqM: 0,
      existingFloorAreaSqM: 0,
      proposedSqM: 18.04,
      proposedSqFt: 194.18,
      existingSqM: 0,
      existingSqFt: 0,
      builtUpSqM: 18.04,
      builtUpSqFt: 194.18,
      floorAreaSqM: 15.6,
      floorAreaSqFt: 167.92
    }
  ],
  areaUnit: "both",

  // 5. Vasthu Kol Alavu
  vasthuGrade: "Uttamam",
  vasthuPerimeterKol: "28 Kol 12 Viral",
  vasthuPerimeterMeter: "20.65 m",
  vasthuRemarks: "Ayadi Shadvarga - Dhana Yoni (1) & Subha Nakshatram (Aswathy)",

  // 6. Revision Table Grid
  revisionTable: [
    {
      id: "rev-1",
      rev: "R0",
      date: "01-09-2026",
      description: "Initial Concept Submission",
      preparedBy: "CD",
      checkedBy: "PK"
    },
    {
      id: "rev-2",
      rev: "R1",
      date: "07-09-2026",
      description: "Permit Submission Drawing",
      preparedBy: "CD",
      checkedBy: "DC"
    }
  ],

  // 7. Global North Sign & QR Code Provisions
  defaultNorthRotation: 0,
  enableQrScanning: true,

  // 8. Plan Sheets
  sheets: [
    {
      id: "sheet-1",
      sheetNumber: 1,
      drawingNumber: "DWG-2026/01",
      drawingName: "PROPOSED RESIDENCE - GROUND FLOOR PLAN",
      floorName: "Ground Floor Plan",
      scale: "1 : 100",
      date: "07-09-2026",
      revision: "R1",
      planImageUrl: SAMPLE_GROUND_FLOOR_SVG,
      planFileName: "Ground_Floor_Plan_DWG01.svg",
      zoom: 100,
      panX: 0,
      panY: 0,
      rotation: 0,
      fitMode: "contain",
      northRotation: 0,
      showNorthArrow: true,
      showQrCode: true,
      sheetNotes: "Plinth Area: 145.20 Sq.M. Check all dimensions on site before execution.",
      attachments: [
        {
          id: "att-1-1",
          title: "Ground Floor Plan",
          imageUrl: SAMPLE_GROUND_FLOOR_SVG,
          fileName: "Ground_Floor_Plan_DWG01.svg",
          x: 4,
          y: 6,
          width: 92,
          scale: "1 : 100",
          zoom: 100,
          rotation: 0,
          zIndex: 1
        }
      ]
    },
    {
      id: "sheet-2",
      sheetNumber: 2,
      drawingNumber: "DWG-2026/02",
      drawingName: "PROPOSED RESIDENCE - FIRST FLOOR PLAN",
      floorName: "First Floor Plan",
      scale: "1 : 100",
      date: "07-09-2026",
      revision: "R1",
      planImageUrl: SAMPLE_FIRST_FLOOR_SVG,
      planFileName: "First_Floor_Plan_DWG02.svg",
      zoom: 100,
      panX: 0,
      panY: 0,
      rotation: 0,
      fitMode: "contain",
      northRotation: 0,
      showNorthArrow: true,
      showQrCode: true,
      sheetNotes: "First Floor Plinth Area: 108.50 Sq.M. Balcony and terrace with MS railing.",
      attachments: [
        {
          id: "att-2-1",
          title: "First Floor Plan",
          imageUrl: SAMPLE_FIRST_FLOOR_SVG,
          fileName: "First_Floor_Plan_DWG02.svg",
          x: 4,
          y: 6,
          width: 92,
          scale: "1 : 100",
          zoom: 100,
          rotation: 0,
          zIndex: 1
        }
      ]
    }
  ]
};
