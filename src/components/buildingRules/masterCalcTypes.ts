export type OccupancyCode =
  | "A1"
  | "A2"
  | "B"
  | "C"
  | "D"
  | "D1"
  | "E"
  | "F"
  | "G1"
  | "G2"
  | "G3"
  | "H"
  | "I"
  | "J";

export interface OccupancyRuleStandard {
  code: OccupancyCode;
  name: string;
  nameMl: string;
  maxCoverageCat1: number; // Table 6
  maxCoverageCat2: number; // Table 6
  maxFsiCat1: number; // Table 6 basic / with fee
  maxFsiCat2: number;
  maxFsiWithFee?: number;
  minRoadWidth: number;
  permitFeeRate: number; // ₹ / m²
  rwhRatePerSqM: number; // Rule 76 (25 or 50)
  exitOccupantArea: number; // Table 17 (m² / person)
  sanitationOccupantArea: number; // Table 13 (m² / person)
  solarRatePerSqM?: number; // Table 19 (kW / m²)
}

export const TABLE_6_STANDARDS: Record<OccupancyCode, OccupancyRuleStandard> = {
  A1: {
    code: "A1",
    name: "A1 - Residential (Single/Dual/Flats)",
    nameMl: "റെസിഡൻഷ്യൽ (താമസ കെട്ടിടം)",
    maxCoverageCat1: 65,
    maxCoverageCat2: 60,
    maxFsiCat1: 2.5,
    maxFsiCat2: 2.5,
    minRoadWidth: 3.0,
    permitFeeRate: 25,
    rwhRatePerSqM: 25,
    exitOccupantArea: 12.5,
    sanitationOccupantArea: 0, // N/A
    solarRatePerSqM: 0.0017 // 0.0023 if single > 400m², 0.0017 flats
  },
  A2: {
    code: "A2",
    name: "A2 - Special Residential / Lodges / Hostels",
    nameMl: "സ്പെഷ്യൽ റെസിഡൻഷ്യൽ / ലോഡ്ജ് / ഹോസ്റ്റൽ",
    maxCoverageCat1: 65,
    maxCoverageCat2: 55,
    maxFsiCat1: 2.25,
    maxFsiCat2: 1.5,
    maxFsiWithFee: 2.25,
    minRoadWidth: 3.6,
    permitFeeRate: 35,
    rwhRatePerSqM: 25,
    exitOccupantArea: 4.0,
    sanitationOccupantArea: 5.9,
    solarRatePerSqM: 0.0027
  },
  B: {
    code: "B",
    name: "B - Educational Buildings",
    nameMl: "വിദ്യാഭ്യാസ സ്ഥാപനങ്ങൾ (സ്കൂൾ / കോളേജ്)",
    maxCoverageCat1: 60,
    maxCoverageCat2: 60,
    maxFsiCat1: 2.5,
    maxFsiCat2: 2.0,
    minRoadWidth: 6.0,
    permitFeeRate: 30,
    rwhRatePerSqM: 50,
    exitOccupantArea: 4.0,
    sanitationOccupantArea: 5.9
  },
  C: {
    code: "C",
    name: "C - Medical & Hospitals",
    nameMl: "ആശുപത്രികൾ / ചികിത്സാ കേന്ദ്രങ്ങൾ",
    maxCoverageCat1: 60,
    maxCoverageCat2: 60,
    maxFsiCat1: 2.5,
    maxFsiCat2: 2.0,
    minRoadWidth: 6.0,
    permitFeeRate: 40,
    rwhRatePerSqM: 50,
    exitOccupantArea: 4.0,
    sanitationOccupantArea: 5.9,
    solarRatePerSqM: 0.0033
  },
  D: {
    code: "D",
    name: "D - Assembly (Auditoriums / Terminals)",
    nameMl: "പൊതുസമ്മേളന ശാലകൾ / ടെർമിനലുകൾ",
    maxCoverageCat1: 50,
    maxCoverageCat2: 50,
    maxFsiCat1: 1.5,
    maxFsiCat2: 1.5,
    minRoadWidth: 7.0,
    permitFeeRate: 45,
    rwhRatePerSqM: 50,
    exitOccupantArea: 1.5,
    sanitationOccupantArea: 1.8,
    solarRatePerSqM: 0.005
  },
  D1: {
    code: "D1",
    name: "D1 - Recreational Turfs & Sports Courts",
    nameMl: "ടർഫുകൾ / സ്പോർട്സ് കോർട്ടുകൾ",
    maxCoverageCat1: 50,
    maxCoverageCat2: 50,
    maxFsiCat1: 1.5,
    maxFsiCat2: 1.5,
    minRoadWidth: 6.0,
    permitFeeRate: 35,
    rwhRatePerSqM: 50,
    exitOccupantArea: 1.5,
    sanitationOccupantArea: 1.8
  },
  E: {
    code: "E",
    name: "E - Offices & Professional IT",
    nameMl: "ഓഫീസുകൾ / ഐ.ടി സമുച്ചയം",
    maxCoverageCat1: 65,
    maxCoverageCat2: 65,
    maxFsiCat1: 2.5,
    maxFsiCat2: 2.0,
    minRoadWidth: 5.0,
    permitFeeRate: 50,
    rwhRatePerSqM: 50,
    exitOccupantArea: 4.0,
    sanitationOccupantArea: 5.9
  },
  F: {
    code: "F",
    name: "F - Commercial & Mercantile Shops",
    nameMl: "വാണിജ്യ വ്യാപാര സ്ഥാപനങ്ങൾ / കടകൾ",
    maxCoverageCat1: 65,
    maxCoverageCat2: 60,
    maxFsiCat1: 3.5,
    maxFsiCat2: 2.75,
    maxFsiWithFee: 3.5,
    minRoadWidth: 5.0,
    permitFeeRate: 60,
    rwhRatePerSqM: 25,
    exitOccupantArea: 4.0,
    sanitationOccupantArea: 5.9
  },
  G1: {
    code: "G1",
    name: "G1 - Industrial (Non-hazardous)",
    nameMl: "വ്യവസായ ശാലകൾ (ഇൻഡസ്ട്രിയൽ-1)",
    maxCoverageCat1: 65,
    maxCoverageCat2: 55,
    maxFsiCat1: 2.75,
    maxFsiCat2: 2.75,
    minRoadWidth: 7.0,
    permitFeeRate: 50,
    rwhRatePerSqM: 50,
    exitOccupantArea: 10.0,
    sanitationOccupantArea: 30.0
  },
  G2: {
    code: "G2",
    name: "G2 - Small Industrial & Workplaces",
    nameMl: "ചെറുകിട വ്യവസായം / വർക്ക്ഷോപ്പുകൾ",
    maxCoverageCat1: 65,
    maxCoverageCat2: 55,
    maxFsiCat1: 2.5,
    maxFsiCat2: 2.0,
    minRoadWidth: 5.0,
    permitFeeRate: 45,
    rwhRatePerSqM: 50,
    exitOccupantArea: 10.0,
    sanitationOccupantArea: 30.0
  },
  G3: {
    code: "G3",
    name: "G3 - Livestock & Poultry Farms",
    nameMl: "കന്നുകാലി / പൗൾട്രി ഫാമുകൾ",
    maxCoverageCat1: 65,
    maxCoverageCat2: 55,
    maxFsiCat1: 2.0,
    maxFsiCat2: 1.5,
    minRoadWidth: 4.0,
    permitFeeRate: 25,
    rwhRatePerSqM: 50,
    exitOccupantArea: 10.0,
    sanitationOccupantArea: 30.0
  },
  H: {
    code: "H",
    name: "H - Storage & Warehouses",
    nameMl: "ഗോഡൗണുകൾ / സംഭരണ ശാലകൾ",
    maxCoverageCat1: 65,
    maxCoverageCat2: 60,
    maxFsiCat1: 2.0,
    maxFsiCat2: 1.5,
    minRoadWidth: 7.0,
    permitFeeRate: 40,
    rwhRatePerSqM: 50,
    exitOccupantArea: 10.0,
    sanitationOccupantArea: 30.0
  },
  I: {
    code: "I",
    name: "I - Hazardous Buildings",
    nameMl: "അപകടസാധ്യതയുള്ള കെട്ടിടങ്ങൾ (Hazardous)",
    maxCoverageCat1: 40,
    maxCoverageCat2: 40,
    maxFsiCat1: 1.0,
    maxFsiCat2: 1.0,
    minRoadWidth: 9.0,
    permitFeeRate: 80,
    rwhRatePerSqM: 50,
    exitOccupantArea: 10.0,
    sanitationOccupantArea: 30.0
  },
  J: {
    code: "J",
    name: "J - Multiplex & Shopping Malls",
    nameMl: "മൾട്ടിപ്ലക്സ് & ഷോപ്പിംഗ് മാളുകൾ",
    maxCoverageCat1: 65,
    maxCoverageCat2: 60,
    maxFsiCat1: 3.0,
    maxFsiCat2: 2.5,
    minRoadWidth: 10.0,
    permitFeeRate: 100,
    rwhRatePerSqM: 25,
    exitOccupantArea: 1.5,
    sanitationOccupantArea: 1.8
  }
};

// Multiple Occupancy Block Entry
export interface OccupancyFloorAreaItem {
  id: string;
  occupancy: OccupancyCode;
  label: string;
  floorAreaSqM: number;
}

// Master Project Data Model
export interface UnifiedProjectData {
  projectName: string;
  applicantName: string;
  surveyNo: string;
  resurveyNo: string;
  localBodyName: string;
  localBodyType: "Panchayat" | "Municipality" | "Corporation";
  category: "Category-I" | "Category-II";
  engineerName: string;
  engineerRegNo: string;
  date: string;

  // Plot Parameters
  plotAreaSqM: number;
  roadWidthM: number;
  isNotifiedRoad: boolean;
  isSingleFamilyResidential: boolean;

  // Building General Parameters
  occupancy: OccupancyCode;
  numberOfStoreys: number;
  buildingHeightM: number;
  proposedBuaSqM: number;
  existingBuaSqM: number;
  groundFloorPlinthSqM: number;
  coveredParkingInsideBuildingSqM: number; // Deductible for sanitation!

  // Multi-occupancy breakdown for Weighted FSI
  isMultipleOccupancy: boolean;
  occupancyBlocks: OccupancyFloorAreaItem[];

  // Proposed Setbacks
  frontYardM: number;
  rearYardM: number;
  sideYard1M: number;
  sideYard2M: number;
  hasBlankWallSide: boolean;

  // Parking & Loading specifics
  isEducationalHostelOrOrphanage: boolean; // 25% concession
  isGeneralHostel: boolean; // 50% concession
  isApartmentWithVisitors: boolean; // 15% addl visitors parking
  isCollege: boolean; // Group B (1 per 120m²) vs School (1 per 300m²)
  assemblySqMPerSlot: number; // Group D (15 to 20 sq.m)
  carParkingProvided: number;
  twoWheelerParkingProvided: number;
  loadingBaysProvided: number;

  // Sanitation specific parameters
  hospitalBedsCount: number; // Group C IP wards
  hospitalType: "IP_WARD" | "OPD" | "ADMIN";
  assemblySubtype: "BUS_TERMINAL" | "AIRPORT_RAILWAY" | "RECREATIONAL_TURF" | "AUDITORIUM";
  isItPark: boolean; // Group E 75% sanitation fitments
  commercialSmallShop: boolean; // Group F <= 100 sq.m
  hazardousWorkersCount: number; // Group I

  // Environmental & Renewable Amenities
  hasWellOnPlot: boolean;
  septicToWellDistanceM: number;
  roofHarvestingAreaSqM: number;
  isAcRoomProvided: boolean;
  acRoomHeightM: number;
  occupantCount: number;
  malePercentage: number;
}
