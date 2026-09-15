import {
  OccupancyCode,
  TABLE_6_STANDARDS,
  OccupancyFloorAreaItem,
  UnifiedProjectData
} from "./masterCalcTypes";

// =========================================================================
// 1. PLOT COVERAGE & FLOOR SPACE INDEX (FSI) — RULE 27 & TABLE 6
// =========================================================================

export interface FsiCoverageResult {
  achievedFsi: number;
  maxPermissibleFsi: number;
  maxFsiWithFee?: number;
  isFsiPassed: boolean;
  achievedCoveragePct: number;
  maxPermissibleCoveragePct: number;
  isCoveragePassed: boolean;
  isWeightedFsiUsed: boolean;
  weightedFsiPermissible?: number;
  detailedFormulaText: string;
}

export function calculateFsiAndCoverage(
  plotAreaSqM: number,
  groundFloorPlinthSqM: number,
  totalFloorAreaSqM: number,
  occupancy: OccupancyCode,
  category: "Category-I" | "Category-II",
  isMultipleOccupancy: boolean = false,
  occupancyBlocks: OccupancyFloorAreaItem[] = []
): FsiCoverageResult {
  const std = TABLE_6_STANDARDS[occupancy] || TABLE_6_STANDARDS.A1;
  const maxPermissibleCoveragePct = category === "Category-I" ? std.maxCoverageCat1 : std.maxCoverageCat2;
  const basePermissibleFsi = category === "Category-I" ? std.maxFsiCat1 : std.maxFsiCat2;

  const achievedFsi = plotAreaSqM > 0 ? Number((totalFloorAreaSqM / plotAreaSqM).toFixed(3)) : 0;
  const achievedCoveragePct =
    plotAreaSqM > 0 ? Number(((groundFloorPlinthSqM / plotAreaSqM) * 100).toFixed(2)) : 0;

  let maxPermissibleFsi = basePermissibleFsi;
  let isWeightedFsiUsed = false;
  let weightedFsiPermissible: number | undefined;
  let formulaText = `FSI = Total Floor Area (${totalFloorAreaSqM} m²) / Plot Area (${plotAreaSqM} m²) = ${achievedFsi}`;

  if (isMultipleOccupancy && occupancyBlocks.length > 0) {
    const totalMultiArea = occupancyBlocks.reduce((sum, b) => sum + (Number(b.floorAreaSqM) || 0), 0);
    if (totalMultiArea > 0) {
      // Formula: Weighted FSI = sum(f_i * A_i) / A
      const sumWeightedProducts = occupancyBlocks.reduce((sum, b) => {
        const blkStd = TABLE_6_STANDARDS[b.occupancy] || TABLE_6_STANDARDS.A1;
        const blkFsi = category === "Category-I" ? blkStd.maxFsiCat1 : blkStd.maxFsiCat2;
        return sum + blkFsi * (Number(b.floorAreaSqM) || 0);
      }, 0);

      weightedFsiPermissible = Number((sumWeightedProducts / totalMultiArea).toFixed(3));
      maxPermissibleFsi = weightedFsiPermissible;
      isWeightedFsiUsed = true;
      formulaText = `Weighted FSI = ∑(fᵢ × Aᵢ) / A = ${sumWeightedProducts.toFixed(1)} / ${totalMultiArea} = ${weightedFsiPermissible}`;
    }
  }

  const isFsiPassed = achievedFsi <= maxPermissibleFsi;
  const isCoveragePassed = achievedCoveragePct <= maxPermissibleCoveragePct;

  return {
    achievedFsi,
    maxPermissibleFsi,
    maxFsiWithFee: std.maxFsiWithFee,
    isFsiPassed,
    achievedCoveragePct,
    maxPermissibleCoveragePct,
    isCoveragePassed,
    isWeightedFsiUsed,
    weightedFsiPermissible,
    detailedFormulaText: formulaText
  };
}

// =========================================================================
// 2. OCCUPANT LOAD CALCULATIONS — TABLE 13 & TABLE 17
// =========================================================================

export interface OccupantLoadResult {
  occupancy: OccupancyCode;
  totalFloorAreaSqM: number;
  exitOccupantRate: number; // Table 17 (m² / person)
  exitOccupantLoad: number; // Count of persons
  sanitationOccupantRate: number; // Table 13 (m² / person)
  sanitationOccupantLoad: number; // Count of persons
  minExitWidthMetres: number; // Based on Table 17 stair/door capacity
  notes: string;
}

export function calculateOccupantLoad(
  occupancy: OccupancyCode,
  totalFloorAreaSqM: number
): OccupantLoadResult {
  const std = TABLE_6_STANDARDS[occupancy] || TABLE_6_STANDARDS.A1;
  const exitOccupantRate = std.exitOccupantArea; // Table 17
  const sanitationOccupantRate = std.sanitationOccupantArea; // Table 13

  const exitOccupantLoad = exitOccupantRate > 0 ? Math.ceil(totalFloorAreaSqM / exitOccupantRate) : 0;
  const sanitationOccupantLoad =
    sanitationOccupantRate > 0 ? Math.ceil(totalFloorAreaSqM / sanitationOccupantRate) : 0;

  // Table 17 Exit capacity factor: 50 persons per unit exit width of 0.50m (approx 0.01m per person, min 1.0m or 1.2m)
  const minExitWidthMetres =
    exitOccupantLoad > 0 ? Math.max(1.0, Number((exitOccupantLoad * 0.01).toFixed(2))) : 1.0;

  let notes = "";
  if (occupancy === "A1") {
    notes = "Residential (Table 17: 12.5 sq.m/person; Sanitation fitments per dwelling unit)";
  } else if (["A2", "B", "C", "E", "F"].includes(occupancy)) {
    notes = "Commercial/Offices/Educational (Table 17: 4.0 sq.m/person for exits; Table 13: 5.9 sq.m/person for sanitation)";
  } else if (["D", "J"].includes(occupancy)) {
    notes = "Assembly/Multiplex (Table 17: 1.5 sq.m/person; Table 13: 1.8 sq.m/person)";
  } else {
    notes = "Industrial/Storage/Hazardous (Table 17: 10.0 sq.m/person; Table 13: 30.0 sq.m/person)";
  }

  return {
    occupancy,
    totalFloorAreaSqM,
    exitOccupantRate,
    exitOccupantLoad,
    sanitationOccupantRate,
    sanitationOccupantLoad,
    minExitWidthMetres,
    notes
  };
}

// =========================================================================
// 3. OFF-STREET PARKING & LOADING CALCULATIONS — RULE 29 & TABLES 9, 10, 10A
// =========================================================================

export interface ParkingLoadingResult {
  baseCarSlots: number;
  visitorsParkingSlots: number;
  differentlyAbledCarSlots: number;
  totalRequiredCarSlots: number;
  mandatoryCarParkingAreaSqM: number;
  requiredTwoWheelerAreaSqM: number;
  requiredTwoWheelerSlots: number;
  requiredLoadingAreaSqM: number;
  requiredLoadingBays: number;
  carParkingProvided: number;
  twoWheelerParkingProvided: number;
  loadingBaysProvided: number;
  isCarParkingPassed: boolean;
  isTwoWheelerPassed: boolean;
  isOverallParkingPassed: boolean;
  ruleExplanation: string;
}

export function calculateParkingAndLoading(
  totalFloorAreaSqM: number,
  occupancy: OccupancyCode,
  isSingleFamilyResidential: boolean = false,
  isApartmentWithVisitors: boolean = false,
  isEducationalHostelOrOrphanage: boolean = false,
  isGeneralHostel: boolean = false,
  isCollege: boolean = false,
  assemblySqMPerSlot: number = 18,
  carParkingProvided: number = 0,
  twoWheelerParkingProvided: number = 0,
  loadingBaysProvided: number = 0
): ParkingLoadingResult {
  let baseCarSlots = 0;
  let ruleExplanation = "";

  if (occupancy === "A1") {
    if (isSingleFamilyResidential) {
      baseCarSlots = totalFloorAreaSqM > 150 ? Math.ceil(totalFloorAreaSqM / 150) : 1;
      ruleExplanation = "Group A1 Single-family: 1 car space per 150 sq.m (Min. 1 space)";
    } else {
      // Flats & Apartments
      baseCarSlots = Math.max(1, Math.ceil(totalFloorAreaSqM / 150));
      ruleExplanation = "Group A1 Apartments: 1 car space per 150 sq.m floor area";
    }
  } else if (["A2", "E", "F"].includes(occupancy)) {
    // Table 10: 1 per 90 sq.m up to 1170 sq.m, plus 1 per 60 sq.m for excess
    if (totalFloorAreaSqM <= 1170) {
      baseCarSlots = Math.ceil(totalFloorAreaSqM / 90);
    } else {
      const firstTier = Math.ceil(1170 / 90); // 13 slots
      const excessArea = totalFloorAreaSqM - 1170;
      const secondTier = Math.ceil(excessArea / 60);
      baseCarSlots = firstTier + secondTier;
    }
    ruleExplanation = "1 space per 90 sq.m up to 1170 sq.m + 1 space per 60 sq.m for excess area";

    // Concessions for Group A2
    if (occupancy === "A2") {
      if (isEducationalHostelOrOrphanage) {
        baseCarSlots = Math.max(1, Math.ceil(baseCarSlots * 0.25));
        ruleExplanation += " (Concession: 25% of Group A2 parking for Orphanages / Old Age Homes / Seminaries / Campus Hostels)";
      } else if (isGeneralHostel) {
        baseCarSlots = Math.max(1, Math.ceil(baseCarSlots * 0.5));
        ruleExplanation += " (Concession: 50% of Group A2 parking for General Hostels)";
      }
    }
  } else if (occupancy === "B") {
    // Educational
    const rate = isCollege ? 120 : 300;
    baseCarSlots = Math.max(1, Math.ceil(totalFloorAreaSqM / rate));
    ruleExplanation = isCollege
      ? "Group B Colleges: 1 car space per 120 sq.m"
      : "Group B Schools: 1 car space per 300 sq.m";
  } else if (occupancy === "C") {
    // Hospital
    baseCarSlots = Math.max(1, Math.ceil(totalFloorAreaSqM / 90));
    ruleExplanation = "Group C Hospitals: 1 car space per 90 sq.m";
  } else if (["D", "D1", "J"].includes(occupancy)) {
    // Assembly
    const slotRate = Math.max(15, Math.min(20, assemblySqMPerSlot || 18));
    baseCarSlots = Math.max(1, Math.ceil(totalFloorAreaSqM / slotRate));
    ruleExplanation = `Group D Assembly: 1 car space per ${slotRate} sq.m`;
  } else {
    // G1, G2, G3, H, I: 1 per 240 sq.m
    baseCarSlots = Math.max(1, Math.ceil(totalFloorAreaSqM / 240));
    ruleExplanation = "Industrial / Storage: 1 car space per 240 sq.m";
  }

  // Visitors' Parking (15% for Group A1 Apartments)
  let visitorsParkingSlots = 0;
  if (occupancy === "A1" && !isSingleFamilyResidential && isApartmentWithVisitors) {
    visitorsParkingSlots = Math.ceil(baseCarSlots * 0.15);
  }

  // Differently-Abled Parking: 3% of required car spaces (minimum 1 bay, width 3.6m)
  const subtotalCars = baseCarSlots + visitorsParkingSlots;
  const differentlyAbledCarSlots = subtotalCars > 0 ? Math.max(1, Math.ceil(subtotalCars * 0.03)) : 0;

  const totalRequiredCarSlots = subtotalCars + differentlyAbledCarSlots;

  // Car slot = 5.5m * 2.7m = 14.85 sq.m
  const mandatoryCarParkingAreaSqM = Number((totalRequiredCarSlots * 14.85).toFixed(2));

  // Two-Wheeler Requirement: Area equal to 25% of mandatory car parking area
  // 1 Two-wheeler slot = 3 sq.m (min dimension 1.5m)
  const requiredTwoWheelerAreaSqM = Number((mandatoryCarParkingAreaSqM * 0.25).toFixed(2));
  const requiredTwoWheelerSlots = Math.ceil(requiredTwoWheelerAreaSqM / 3.0);

  // Table 10A Loading/Unloading Spaces
  let requiredLoadingAreaSqM = 0;
  let requiredLoadingBays = 0;

  if (occupancy === "F" && totalFloorAreaSqM > 700) {
    const excess = totalFloorAreaSqM - 700;
    requiredLoadingBays = Math.ceil(excess / 1000);
    requiredLoadingAreaSqM = requiredLoadingBays * 30;
  } else if (["G1", "G2"].includes(occupancy) && totalFloorAreaSqM > 500) {
    const excess = totalFloorAreaSqM - 500;
    requiredLoadingBays = Math.ceil(excess / 800);
    requiredLoadingAreaSqM = requiredLoadingBays * 30;
  } else if (occupancy === "H" && totalFloorAreaSqM > 300) {
    const excess = totalFloorAreaSqM - 300;
    requiredLoadingBays = Math.ceil(excess / 700);
    requiredLoadingAreaSqM = requiredLoadingBays * 30;
  }

  const isCarParkingPassed = carParkingProvided >= totalRequiredCarSlots;
  const isTwoWheelerPassed = twoWheelerParkingProvided >= requiredTwoWheelerSlots;
  const isOverallParkingPassed = isCarParkingPassed && isTwoWheelerPassed;

  return {
    baseCarSlots,
    visitorsParkingSlots,
    differentlyAbledCarSlots,
    totalRequiredCarSlots,
    mandatoryCarParkingAreaSqM,
    requiredTwoWheelerAreaSqM,
    requiredTwoWheelerSlots,
    requiredLoadingAreaSqM,
    requiredLoadingBays,
    carParkingProvided,
    twoWheelerParkingProvided,
    loadingBaysProvided,
    isCarParkingPassed,
    isTwoWheelerPassed,
    isOverallParkingPassed,
    ruleExplanation
  };
}

// =========================================================================
// 4. SANITATION FACILITIES & SCALE REDUCTION MATRIX — RULE 34 & TABLE 15A
// =========================================================================

export interface SanitationResult {
  totalFloorAreaSqM: number;
  coveredParkingDeductionSqM: number;
  netSanitationAreaSqM: number;
  isThresholdExempted: boolean; // <= 50 sq.m
  scaleReductionPercentage: number; // Table 15A (100%, 90%, 80%, 70%, 60%, 50%)
  scaleReductionFactor: number;

  // Unscaled Raw Fitments
  rawMaleWc: number;
  rawFemaleWc: number;
  rawMaleUrinals: number;
  rawFemaleSpecialUrinals: number;
  rawWashBasins: number;
  rawBaths: number;
  rawBedPanSinks: number;

  // Final Required Fitments (Scaled per Table 15A)
  finalMaleWc: number;
  finalFemaleWc: number;
  finalTotalWc: number;
  finalMaleUrinals: number;
  finalFemaleSpecialUrinals: number;
  finalWashBasins: number;
  finalBaths: number;
  finalBedPanSinks: number;
  differentlyAbledToiletMandatory: boolean;

  occupancySpecificFormula: string;
}

export function calculateSanitationFacilities(
  totalFloorAreaSqM: number,
  coveredParkingInsideBuildingSqM: number,
  occupancy: OccupancyCode,
  isSingleFamilyResidential: boolean = false,
  hospitalBedsCount: number = 0,
  hospitalType: "IP_WARD" | "OPD" | "ADMIN" = "IP_WARD",
  assemblySubtype: "BUS_TERMINAL" | "AIRPORT_RAILWAY" | "RECREATIONAL_TURF" | "AUDITORIUM" = "BUS_TERMINAL",
  isItPark: boolean = false,
  commercialSmallShop: boolean = false,
  hazardousWorkersCount: number = 0
): SanitationResult {
  // Deduction: Covered parking area provided inside a building is deducted from total floor area
  const coveredParkingDeductionSqM = Math.max(0, coveredParkingInsideBuildingSqM || 0);
  const netSanitationAreaSqM = Math.max(0, totalFloorAreaSqM - coveredParkingDeductionSqM);

  // Threshold: Exceeding 50 sq. metres (except Group A1 single/dual family) must have at least 1 WC
  const isThresholdExempted = isSingleFamilyResidential && occupancy === "A1" && netSanitationAreaSqM <= 50;

  // Table 15A Scale Reduction Matrix for Large Buildings
  let scaleReductionPercentage = 100;
  if (netSanitationAreaSqM <= 2000) {
    scaleReductionPercentage = 100;
  } else if (netSanitationAreaSqM <= 5000) {
    scaleReductionPercentage = 90;
  } else if (netSanitationAreaSqM <= 8000) {
    scaleReductionPercentage = 80;
  } else if (netSanitationAreaSqM <= 12000) {
    scaleReductionPercentage = 70;
  } else if (netSanitationAreaSqM <= 18000) {
    scaleReductionPercentage = 60;
  } else {
    scaleReductionPercentage = 50;
  }
  const scaleReductionFactor = scaleReductionPercentage / 100;

  let rawMaleWc = 0;
  let rawFemaleWc = 0;
  let rawMaleUrinals = 0;
  let rawFemaleSpecialUrinals = 0;
  let rawWashBasins = 0;
  let rawBaths = 0;
  let rawBedPanSinks = 0;
  let formulaStr = "";

  const area = netSanitationAreaSqM;

  if (occupancy === "A1") {
    // Residential standard
    rawMaleWc = 1;
    rawFemaleWc = 1;
    rawMaleUrinals = 0;
    rawFemaleSpecialUrinals = 0;
    rawWashBasins = 1;
    rawBaths = 1;
    formulaStr = "Group A1: 1 WC & 1 Bath per dwelling unit (Minimum threshold met)";
  } else if (occupancy === "A2") {
    // Hotels / Lodges vs Boarding / Hostels
    // Default to Lodging: 1 M-WC / 1200m², 1 F-WC / 1200m², 1 Urinal / 300m², 1 F-Special / 900m², 1 WB / 300m² (M) + 1 / 300m² (F)
    rawMaleWc = Math.max(1, Math.ceil(area / 1200));
    rawFemaleWc = Math.max(1, Math.ceil(area / 1200));
    rawMaleUrinals = Math.max(1, Math.ceil(area / 300));
    rawFemaleSpecialUrinals = Math.ceil(area / 900);
    rawWashBasins = Math.ceil(area / 300) * 2;
    formulaStr = "Group A2 (Hotels/Lodges): 1 WC per 1200 m² (M/F), 1 Urinal per 300 m², 1 Special WC per 900 m², 1 WB per 300 m² (M/F)";
  } else if (occupancy === "B") {
    // Educational: 1 M-WC / 300m², 1 F-WC / 475m², 1 Urinal / 600m², 1 F-Special / 600m², 1 WB / 475m² (M/F)
    rawMaleWc = Math.max(1, Math.ceil(area / 300));
    rawFemaleWc = Math.max(1, Math.ceil(area / 475));
    rawMaleUrinals = Math.max(1, Math.ceil(area / 600));
    rawFemaleSpecialUrinals = Math.ceil(area / 600);
    rawWashBasins = Math.ceil(area / 475) * 2;
    formulaStr = "Group B (Educational): 1 Male WC / 300 m², 1 Female WC / 475 m², 1 Urinal / 600 m², 1 Special Urinal / 600 m², 1 WB / 475 m² (M/F)";
  } else if (occupancy === "C") {
    // Hospital: IP Ward (beds), OPD (area), Admin
    if (hospitalType === "IP_WARD") {
      const beds = Math.max(8, hospitalBedsCount || Math.ceil(area / 20));
      rawMaleWc = Math.max(1, Math.ceil(beds / 8));
      rawFemaleWc = Math.max(1, Math.ceil(beds / 8));
      rawWashBasins = Math.max(1, Math.ceil(beds / 30));
      rawBaths = Math.max(1, Math.ceil(beds / 8));
      rawBedPanSinks = Math.max(1, Math.ceil(beds / 24));
      formulaStr = `Group C (In-Patient Wards): 1 WC per 8 beds (M/F), 1 Bath per 8 beds, 1 Wash Basin per 30 beds (${beds} beds assessed)`;
    } else if (hospitalType === "OPD") {
      rawMaleWc = Math.max(1, Math.ceil(area / 1200));
      rawFemaleWc = Math.max(1, Math.ceil(area / 1200));
      rawMaleUrinals = Math.max(1, Math.ceil(area / 600));
      rawFemaleSpecialUrinals = Math.ceil(area / 600);
      rawWashBasins = Math.ceil(area / 1200) * 2;
      formulaStr = "Group C (OPD): 1 WC per 1200 m² (M/F), 1 Urinal per 600 m², 1 Special Urinal per 600 m², 1 WB per 1200 m² (M/F)";
    } else {
      // Admin
      rawMaleWc = Math.max(1, Math.ceil(area / 300));
      rawFemaleWc = Math.max(1, Math.ceil(area / 175));
      rawMaleUrinals = Math.max(1, Math.ceil(area / 175));
      rawFemaleSpecialUrinals = Math.ceil(area / 175);
      rawWashBasins = Math.ceil(area / 300) * 2;
      rawBaths = 1;
      formulaStr = "Group C (Hospital Admin): 1 Male WC / 300 m², 1 Female WC / 175 m², 1 Urinal / 175 m², 1 WB / 300 m²";
    }
  } else if (occupancy === "D" || occupancy === "J") {
    if (assemblySubtype === "AIRPORT_RAILWAY") {
      const firstTierWc = Math.ceil(Math.min(area, 3600) / 725);
      const excessWc = area > 3600 ? Math.ceil((area - 3600) / 1800) : 0;
      rawMaleWc = firstTierWc + excessWc;
      rawFemaleWc = firstTierWc + excessWc;
      rawMaleUrinals = Math.max(1, Math.ceil(area / 600));
      rawFemaleSpecialUrinals = Math.ceil(area / 1800);
      rawWashBasins = Math.ceil(area / 1800) * 2;
      formulaStr = "Group D (Airports/Railway): 1 WC per 725 m² (1st 3600 m²) + 1 per 1800 m² addl; 1 Urinal / 600 m²; 1 WB / 1800 m²";
    } else if (assemblySubtype === "RECREATIONAL_TURF") {
      rawMaleWc = Math.max(2, Math.ceil((area / 1000) * 2));
      rawFemaleWc = 0; // Common WCs
      rawMaleUrinals = Math.max(1, Math.ceil(area / 500));
      rawFemaleSpecialUrinals = Math.ceil(area / 1000);
      rawWashBasins = Math.ceil(area / 1000) * 2;
      formulaStr = "Group D1 (Turfs/Courts): 2 Common WCs per 1000 m², 1 Urinal / 500 m², 1 WB / 1000 m² (M/F)";
    } else {
      // Bus Terminals & Standard Assembly
      const firstTierWc = Math.ceil(Math.min(area, 3600) / 900);
      const excessWc = area > 3600 ? Math.ceil((area - 3600) / 1800) : 0;
      rawMaleWc = Math.max(1, firstTierWc + excessWc);
      rawFemaleWc = Math.max(1, firstTierWc + excessWc);
      rawMaleUrinals = Math.max(1, Math.ceil(area / 600));
      rawFemaleSpecialUrinals = Math.ceil(area / 1800);
      rawWashBasins = Math.ceil(area / 1800) * 2;
      formulaStr = "Group D (Bus Terminals): 1 WC per 900 m² (1st 3600 m²) + 1 per 1800 m² addl; 1 Urinal / 600 m²; 1 WB / 1800 m²";
    }
  } else if (occupancy === "D1") {
    rawMaleWc = Math.max(2, Math.ceil((area / 1000) * 2));
    rawFemaleWc = 0;
    rawMaleUrinals = Math.max(1, Math.ceil(area / 500));
    rawFemaleSpecialUrinals = Math.ceil(area / 1000);
    rawWashBasins = Math.ceil(area / 1000) * 2;
    formulaStr = "Group D1 (Recreational Turfs): 2 Common WCs per 1000 m², 1 Urinal per 500 m², 1 WB per 1000 m²";
  } else if (occupancy === "E") {
    // Offices: 1 M-WC / 250m², 1 F-WC / 250m², 1 Urinal / 300m², 1 F-Special / 900m², 1 WB / 400m² (M/F)
    const itFactor = isItPark ? 0.75 : 1.0;
    rawMaleWc = Math.max(1, Math.ceil((area / 250) * itFactor));
    rawFemaleWc = Math.max(1, Math.ceil((area / 250) * itFactor));
    rawMaleUrinals = Math.max(1, Math.ceil((area / 300) * itFactor));
    rawFemaleSpecialUrinals = Math.ceil((area / 900) * itFactor);
    rawWashBasins = Math.ceil((area / 400) * itFactor) * 2;
    formulaStr = isItPark
      ? "Group E (IT Park - 75% Scale): 1 WC per 333 m² (M/F), 1 Urinal per 400 m², 1 WB per 533 m² (M/F)"
      : "Group E (Offices): 1 Male WC / 250 m², 1 Female WC / 250 m², 1 Urinal / 300 m², 1 Special Urinal / 900 m², 1 WB / 400 m²";
  } else if (occupancy === "F") {
    if (commercialSmallShop || area <= 100) {
      rawMaleWc = 1;
      rawFemaleWc = 1;
      rawMaleUrinals = 1;
      rawFemaleSpecialUrinals = 0;
      rawWashBasins = 2;
      formulaStr = "Group F (Shop <= 100 sq.m): Minimum 1 Male WC/Urinal & 1 Female WC mandatory";
    } else {
      rawMaleWc = Math.max(1, Math.ceil(area / 300));
      rawFemaleWc = Math.max(1, Math.ceil(area / 300));
      rawMaleUrinals = Math.max(1, Math.ceil(area / 300));
      rawFemaleSpecialUrinals = Math.ceil(area / 900);
      rawWashBasins = Math.ceil(area / 300) * 2;
      formulaStr = "Group F (Commercial > 100 sq.m): 1 Male WC / 300 m², 1 Female WC / 300 m², 1 Urinal / 300 m², 1 Special Urinal / 900 m², 1 WB / 300 m²";
    }
  } else if (["G1", "G2"].includes(occupancy)) {
    rawMaleWc = Math.max(1, Math.ceil(area / 1200));
    rawFemaleWc = Math.max(1, Math.ceil(area / 1200));
    rawMaleUrinals = Math.max(1, Math.ceil(area / 1500));
    rawWashBasins = Math.max(1, Math.ceil(area / 4500));
    formulaStr = "Group G1 & G2 (Industrial): 1 Male WC / 1200 m², 1 Female WC / 1200 m², 1 Urinal / 1500 m², 1 WB / 4500 m²";
  } else if (occupancy === "G3") {
    const minWc = area <= 750 ? 1 : 2;
    rawMaleWc = minWc;
    rawFemaleWc = 0;
    formulaStr = `Group G3 (Livestock Farms): ${area <= 750 ? "Area <= 750 m² (Min. 1 WC)" : "Area > 750 m² (Min. 2 WCs)"}`;
  } else if (occupancy === "H") {
    rawMaleWc = Math.max(1, Math.ceil(area / 2250));
    rawFemaleWc = Math.max(1, Math.ceil(area / 2250));
    rawMaleUrinals = Math.max(1, Math.ceil(area / 6000));
    rawWashBasins = Math.max(1, Math.ceil(area / 6000));
    formulaStr = "Group H (Storage): 1 Male WC / 2250 m², 1 Female WC / 2250 m², 1 Urinal / 6000 m², 1 WB / 6000 m²";
  } else if (occupancy === "I") {
    if (hazardousWorkersCount > 0 && hazardousWorkersCount <= 5) {
      rawMaleWc = 1;
      rawFemaleWc = 0;
      rawMaleUrinals = 1;
      rawWashBasins = 1;
      formulaStr = "Group I (Hazardous <= 5 workers): Minimum 1 WC mandatory";
    } else {
      const firstTier = 1;
      const excess = area > 3000 ? Math.ceil((area - 3000) / 4200) : 0;
      rawMaleWc = firstTier + excess;
      rawFemaleWc = firstTier + excess;
      rawMaleUrinals = Math.max(1, Math.ceil(area / 6000));
      rawWashBasins = Math.max(1, Math.ceil(area / 6000));
      formulaStr = "Group I (Hazardous): 1 WC for 1st 3000 m² + 1 per 4200 m² addl (M/F), 1 Urinal / 6000 m², 1 WB / 6000 m²";
    }
  }

  // Apply Table 15A Scale Reduction Factor to large buildings
  const finalMaleWc = Math.max(1, Math.ceil(rawMaleWc * scaleReductionFactor));
  const finalFemaleWc = rawFemaleWc > 0 ? Math.max(1, Math.ceil(rawFemaleWc * scaleReductionFactor)) : 0;
  const finalTotalWc = finalMaleWc + finalFemaleWc;
  const finalMaleUrinals = Math.ceil(rawMaleUrinals * scaleReductionFactor);
  const finalFemaleSpecialUrinals = Math.ceil(rawFemaleSpecialUrinals * scaleReductionFactor);
  const finalWashBasins = Math.max(1, Math.ceil(rawWashBasins * scaleReductionFactor));
  const finalBaths = Math.ceil(rawBaths * scaleReductionFactor);
  const finalBedPanSinks = rawBedPanSinks;

  return {
    totalFloorAreaSqM,
    coveredParkingDeductionSqM,
    netSanitationAreaSqM,
    isThresholdExempted,
    scaleReductionPercentage,
    scaleReductionFactor,
    rawMaleWc,
    rawFemaleWc,
    rawMaleUrinals,
    rawFemaleSpecialUrinals,
    rawWashBasins,
    rawBaths,
    rawBedPanSinks,
    finalMaleWc,
    finalFemaleWc,
    finalTotalWc,
    finalMaleUrinals,
    finalFemaleSpecialUrinals,
    finalWashBasins,
    finalBaths,
    finalBedPanSinks,
    differentlyAbledToiletMandatory: area > 50 && occupancy !== "A1",
    occupancySpecificFormula: formulaStr
  };
}

// =========================================================================
// 5. ROOFTOP SOLAR ENERGY CAPACITY — RULE 77 & TABLE 19
// =========================================================================

export interface SolarCapacityResult {
  isSolarMandatory: boolean;
  ratePerSqM: number;
  minimumCapacityKw: number;
  approximatePanelAreaSqM: number;
  estimatedDailyUnitsKwh: number;
  explanation: string;
}

export function calculateSolarEnergyCapacity(
  totalBuiltUpAreaSqM: number,
  occupancy: OccupancyCode,
  isSingleFamilyResidential: boolean = false
): SolarCapacityResult {
  // Mandatory for new buildings exceeding 500 sq.m under Groups A1, A2, C, D
  const eligibleOccupancy = ["A1", "A2", "C", "D"].includes(occupancy);
  const isSolarMandatory = eligibleOccupancy && totalBuiltUpAreaSqM > 500;

  let ratePerSqM = 0;
  let explanation = "";

  if (occupancy === "A1") {
    if (isSingleFamilyResidential && totalBuiltUpAreaSqM > 400) {
      ratePerSqM = 0.0023; // Single/Dual unit > 400m²
      explanation = "Group A1 Single/Dual unit > 400 m²: 0.0023 kW per sq.m BUA";
    } else {
      ratePerSqM = 0.0017; // Flats & Apartments
      explanation = "Group A1 Flats / Apartments: 0.0017 kW per sq.m BUA";
    }
  } else if (occupancy === "A2") {
    ratePerSqM = 0.0027;
    explanation = "Group A2 Lodging / Hostels / Hotels: 0.0027 kW per sq.m BUA";
  } else if (occupancy === "C") {
    ratePerSqM = 0.0033;
    explanation = "Group C Hospitals: 0.0033 kW per sq.m BUA";
  } else if (occupancy === "D") {
    ratePerSqM = 0.005;
    explanation = "Group D Assembly / Auditoriums: 0.0050 kW per sq.m BUA";
  } else {
    ratePerSqM = 0;
    explanation = "Rule 77 Table 19 mandatory provisions do not apply to this occupancy group";
  }

  const rawCapacity = isSolarMandatory ? totalBuiltUpAreaSqM * ratePerSqM : 0;
  const minimumCapacityKw = Number(rawCapacity.toFixed(2));
  // Approx 8 sq.m per 1 kW solar PV panel area
  const approximatePanelAreaSqM = Number((minimumCapacityKw * 8.0).toFixed(1));
  // Approx 4 kWh / kWp / day in Kerala
  const estimatedDailyUnitsKwh = Number((minimumCapacityKw * 4.0).toFixed(1));

  return {
    isSolarMandatory,
    ratePerSqM,
    minimumCapacityKw,
    approximatePanelAreaSqM,
    estimatedDailyUnitsKwh,
    explanation
  };
}

// =========================================================================
// 6. RAINWATER HARVESTING (RWH) STORAGE — RULE 76
// =========================================================================

export interface RwhStorageResult {
  isRwhMandatory: boolean;
  rateLitresPerSqM: number;
  coveredGroundAreaSqM: number;
  minimumCapacityLitres: number;
  minimumCapacityM3: number;
  suggestedTankLengthM: number;
  suggestedTankWidthM: number;
  suggestedTankDepthM: number;
  explanation: string;
}

export function calculateRwhStorage(
  totalBuiltUpAreaSqM: number,
  groundCoveredAreaSqM: number,
  occupancy: OccupancyCode
): RwhStorageResult {
  // Mandatory for new buildings exceeding 300 sq.m built-up area (except Group H)
  const isRwhMandatory = totalBuiltUpAreaSqM > 300 && occupancy !== "H";

  // Rate:
  // Groups A1, A2, F, J: 25 Litres per sq.m of Covered Area
  // Groups B, C, D, E, G1, G2: 50 Litres per sq.m of Covered Area
  let rateLitresPerSqM = 25;
  if (["B", "C", "D", "D1", "E", "G1", "G2", "G3", "I"].includes(occupancy)) {
    rateLitresPerSqM = 50;
  }

  const minimumCapacityLitres = isRwhMandatory ? Math.round(groundCoveredAreaSqM * rateLitresPerSqM) : 0;
  const minimumCapacityM3 = Number((minimumCapacityLitres / 1000).toFixed(2));

  // Suggested RCC tank dimensions with standard 1.5m effective depth
  const suggestedTankDepthM = 1.5;
  const suggestedTankLengthM =
    minimumCapacityM3 > 0 ? Number(Math.sqrt(minimumCapacityM3 / suggestedTankDepthM).toFixed(2)) : 0;
  const suggestedTankWidthM = suggestedTankLengthM;

  const explanation = isRwhMandatory
    ? `Mandatory (BUA > 300 m²): ${groundCoveredAreaSqM} m² covered footprint × ${rateLitresPerSqM} L/m² = ${minimumCapacityLitres.toLocaleString("en-IN")} Litres`
    : "Not mandatory under Rule 76 (BUA <= 300 m² or Group H Storage)";

  return {
    isRwhMandatory,
    rateLitresPerSqM,
    coveredGroundAreaSqM: groundCoveredAreaSqM,
    minimumCapacityLitres,
    minimumCapacityM3,
    suggestedTankLengthM,
    suggestedTankWidthM,
    suggestedTankDepthM,
    explanation
  };
}

// =========================================================================
// 7. HEIGHT LIMITATIONS & SETBACK ADDITIONS — RULES 24, 23 & 26
// =========================================================================

export interface HeightSetbackResult {
  abuttingStreetWidthM: number;
  frontYardSetbackM: number;
  buildingHeightM: number;
  maxPermissibleHeightM: number;
  isHeightPermissible: boolean;
  isAbove10Metres: boolean;
  additionalSetbackPerSideM: number;
  setbackRuleExplanation: string;
}

export function calculateHeightAndSetbacks(
  abuttingStreetWidthM: number,
  frontYardSetbackM: number,
  buildingHeightM: number,
  baseSetbackM: number = 3.0
): HeightSetbackResult {
  // Formula: Max Building Height <= (2 * Abutting Street Width) + (2 * Front Yard Setback)
  const maxPermissibleHeightM = Number((2 * abuttingStreetWidthM + 2 * frontYardSetbackM).toFixed(2));
  const isHeightPermissible = buildingHeightM <= maxPermissibleHeightM;

  // Setback Increases for Heights Above 10 metres (Rule 26(2)):
  // Additional Setback = 0.5 metres for every 3.0 metres (or fraction thereof) in height above 10m
  // Up to a maximum total yard requirement of 16 metres.
  const isAbove10Metres = buildingHeightM > 10.0;
  let additionalSetbackPerSideM = 0;

  if (isAbove10Metres) {
    const excessHeight = buildingHeightM - 10.0;
    const blocksOf3m = Math.ceil(excessHeight / 3.0);
    const calculatedAdditional = blocksOf3m * 0.5;
    // Cap so that (baseSetback + additional) <= 16.0m
    additionalSetbackPerSideM = Math.min(Math.max(0, 16.0 - baseSetbackM), calculatedAdditional);
  }

  const setbackRuleExplanation = isAbove10Metres
    ? `Height is ${buildingHeightM}m (>10m). Rule 26(2) requires +0.5m setback for every 3.0m (or fraction) above 10m = +${additionalSetbackPerSideM}m additional setback to each yard (Max total 16m).`
    : "Height is <= 10m. Standard baseline setbacks apply without height additions.";

  return {
    abuttingStreetWidthM,
    frontYardSetbackM,
    buildingHeightM,
    maxPermissibleHeightM,
    isHeightPermissible,
    isAbove10Metres,
    additionalSetbackPerSideM,
    setbackRuleExplanation
  };
}
