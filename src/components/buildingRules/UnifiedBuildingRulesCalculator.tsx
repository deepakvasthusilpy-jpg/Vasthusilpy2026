import React, { useState, useMemo, useRef } from "react";
import {
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Printer,
  Download,
  Sparkles,
  Layers,
  Car,
  Droplets,
  Ruler,
  Building,
  HelpCircle,
  RotateCcw,
  Check,
  ChevronRight,
  TrendingUp,
  MapPin,
  User,
  Info,
  Bath,
  Users,
  Award,
  Zap,
  Bookmark,
  Sun,
  Truck,
  Sliders
} from "lucide-react";
import { triggerPrint } from "../../utils/printHelper";
import {
  UnifiedProjectData,
  OccupancyCode,
  TABLE_6_STANDARDS
} from "./masterCalcTypes";
import { FsiCoverageCalculator } from "./calculators/FsiCoverageCalculator";
import { OccupantLoadCalculator } from "./calculators/OccupantLoadCalculator";
import { ParkingLoadingCalculator } from "./calculators/ParkingLoadingCalculator";
import { SanitationCalculator } from "./calculators/SanitationCalculator";
import { SolarCapacityCalculator } from "./calculators/SolarCapacityCalculator";
import { RwhStorageCalculator } from "./calculators/RwhStorageCalculator";
import { HeightSetbackCalculator } from "./calculators/HeightSetbackCalculator";
import { ConsolidatedMasterReport } from "./calculators/ConsolidatedMasterReport";

export type { OccupancyCode };
export type ProjectData = UnifiedProjectData;

export type CalcActiveTab =
  | "ALL_IN_ONE"
  | "FSI_COVERAGE"
  | "OCCUPANT_LOAD"
  | "PARKING_LOADING"
  | "SANITATION"
  | "SOLAR_CAPACITY"
  | "RWH_STORAGE"
  | "HEIGHT_SETBACK"
  | "CONSOLIDATED_REPORT";


export const OCCUPANCY_INFO: Record<
  OccupancyCode,
  {
    name: string;
    ratePerSqM: number;
    maxFsiCat1: number;
    maxFsiCat2: number;
    maxCoverage: number;
    minRoadWidth: number;
    parkingAreaPerSlot: number;
    rwhRatePerSqM: number;
  }
> = {
  A1: {
    name: "A1 - Residential (Single/Multi-family)",
    ratePerSqM: 25,
    maxFsiCat1: 2.5,
    maxFsiCat2: 2.0,
    maxCoverage: 65,
    minRoadWidth: 3.0,
    parkingAreaPerSlot: 150,
    rwhRatePerSqM: 25
  },
  A2: {
    name: "A2 - Special Residential (Lodges/Hostels)",
    ratePerSqM: 35,
    maxFsiCat1: 2.2,
    maxFsiCat2: 2.0,
    maxCoverage: 65,
    minRoadWidth: 3.6,
    parkingAreaPerSlot: 120,
    rwhRatePerSqM: 25
  },
  B: {
    name: "B - Educational Institutions",
    ratePerSqM: 30,
    maxFsiCat1: 2.5,
    maxFsiCat2: 2.0,
    maxCoverage: 60,
    minRoadWidth: 6.0,
    parkingAreaPerSlot: 150,
    rwhRatePerSqM: 50
  },
  C: {
    name: "C - Medical & Hospitals",
    ratePerSqM: 40,
    maxFsiCat1: 2.5,
    maxFsiCat2: 2.0,
    maxCoverage: 60,
    minRoadWidth: 6.0,
    parkingAreaPerSlot: 90,
    rwhRatePerSqM: 50
  },
  D: {
    name: "D - Assembly Halls & Auditoriums",
    ratePerSqM: 45,
    maxFsiCat1: 1.5,
    maxFsiCat2: 1.5,
    maxCoverage: 50,
    minRoadWidth: 7.0,
    parkingAreaPerSlot: 15,
    rwhRatePerSqM: 50
  },
  D1: {
    name: "D1 - Religious & Worship Buildings",
    ratePerSqM: 30,
    maxFsiCat1: 1.5,
    maxFsiCat2: 1.5,
    maxCoverage: 50,
    minRoadWidth: 6.0,
    parkingAreaPerSlot: 20,
    rwhRatePerSqM: 50
  },
  E: {
    name: "E - Office & Professional Buildings",
    ratePerSqM: 50,
    maxFsiCat1: 2.5,
    maxFsiCat2: 2.0,
    maxCoverage: 65,
    minRoadWidth: 5.0,
    parkingAreaPerSlot: 90,
    rwhRatePerSqM: 50
  },
  F: {
    name: "F - Commercial & Mercantile Shops",
    ratePerSqM: 60,
    maxFsiCat1: 2.5,
    maxFsiCat2: 2.0,
    maxCoverage: 65,
    minRoadWidth: 5.0,
    parkingAreaPerSlot: 60,
    rwhRatePerSqM: 25
  },
  G1: {
    name: "G1 - Industrial / Factory (Non-hazardous)",
    ratePerSqM: 50,
    maxFsiCat1: 2.0,
    maxFsiCat2: 1.5,
    maxCoverage: 60,
    minRoadWidth: 7.0,
    parkingAreaPerSlot: 240,
    rwhRatePerSqM: 50
  },
  G2: {
    name: "G2 - Small Industrial & Workplaces",
    ratePerSqM: 45,
    maxFsiCat1: 2.0,
    maxFsiCat2: 1.5,
    maxCoverage: 60,
    minRoadWidth: 5.0,
    parkingAreaPerSlot: 200,
    rwhRatePerSqM: 50
  },
  G3: {
    name: "G3 - Information Technology / IT Parks",
    ratePerSqM: 50,
    maxFsiCat1: 3.25,
    maxFsiCat2: 3.0,
    maxCoverage: 60,
    minRoadWidth: 7.0,
    parkingAreaPerSlot: 60,
    rwhRatePerSqM: 50
  },
  H: {
    name: "H - Storage & Warehouses",
    ratePerSqM: 40,
    maxFsiCat1: 1.8,
    maxFsiCat2: 1.5,
    maxCoverage: 60,
    minRoadWidth: 7.0,
    parkingAreaPerSlot: 240,
    rwhRatePerSqM: 50
  },
  I: {
    name: "I - Hazardous Buildings",
    ratePerSqM: 80,
    maxFsiCat1: 1.0,
    maxFsiCat2: 1.0,
    maxCoverage: 40,
    minRoadWidth: 9.0,
    parkingAreaPerSlot: 240,
    rwhRatePerSqM: 50
  },
  J: {
    name: "J - Multiplex & Shopping Malls",
    ratePerSqM: 100,
    maxFsiCat1: 3.0,
    maxFsiCat2: 2.5,
    maxCoverage: 65,
    minRoadWidth: 10.0,
    parkingAreaPerSlot: 60,
    rwhRatePerSqM: 25
  }
};

const DEFAULT_PROJECT_DATA: ProjectData = {
  projectName: "PROPOSED RESIDENTIAL BUILDING",
  applicantName: "SRI. SHAJI KUMAR & SMT. PRIYA SHAJI",
  surveyNo: "142/3-A",
  resurveyNo: "45/2",
  localBodyName: "Kizhakkambalam Grama Panchayat",
  localBodyType: "Panchayat",
  category: "Category-II",
  engineerName: "Er. Deepak Architect & Associates",
  engineerRegNo: "LSGD/ENG/2024/A-4892",
  date: new Date().toISOString().split("T")[0],

  plotAreaSqM: 280,
  roadWidthM: 4.5,
  isNotifiedRoad: false,
  isSingleFamilyResidential: true,

  occupancy: "A1",
  numberOfStoreys: 2,
  buildingHeightM: 7.2,
  proposedBuaSqM: 185,
  existingBuaSqM: 0,
  groundFloorPlinthSqM: 105,
  coveredParkingInsideBuildingSqM: 20,

  isMultipleOccupancy: false,
  occupancyBlocks: [],

  frontYardM: 2.2,
  rearYardM: 1.6,
  sideYard1M: 1.25,
  sideYard2M: 1.0,
  hasBlankWallSide: false,

  isEducationalHostelOrOrphanage: false,
  isGeneralHostel: false,
  isApartmentWithVisitors: true,
  isCollege: false,
  assemblySqMPerSlot: 18,
  carParkingProvided: 1,
  twoWheelerParkingProvided: 2,
  loadingBaysProvided: 0,

  hospitalBedsCount: 0,
  hospitalType: "IP_WARD",
  assemblySubtype: "BUS_TERMINAL",
  isItPark: false,
  commercialSmallShop: false,
  hazardousWorkersCount: 0,

  hasWellOnPlot: true,
  septicToWellDistanceM: 8.0,
  roofHarvestingAreaSqM: 110,
  isAcRoomProvided: true,
  acRoomHeightM: 2.45,
  occupantCount: 5,
  malePercentage: 50
};

export const UnifiedBuildingRulesCalculator: React.FC = () => {
  const [data, setData] = useState<ProjectData>(DEFAULT_PROJECT_DATA);
  const [activeTab, setActiveTab] = useState<CalcActiveTab>("ALL_IN_ONE");
  const [activeViewTab, setActiveViewTab] = useState<"INPUTS" | "REPORT_PREVIEW">("INPUTS");
  const [savedNotification, setSavedNotification] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleChange = <K extends keyof ProjectData>(field: K, value: ProjectData[K]) => {
    setData((prev) => {
      const updated = { ...prev, [field]: value };
      // Smart Auto-adjustments for minimum inputs
      if (field === "proposedBuaSqM") {
        const bua = Number(value) || 0;
        // Auto estimate ground floor plinth (approx 55% if 2 floors, 100% if 1 floor)
        if (updated.numberOfStoreys <= 1) {
          updated.groundFloorPlinthSqM = bua;
          updated.roofHarvestingAreaSqM = bua;
        } else {
          updated.groundFloorPlinthSqM = Math.round(bua * 0.58);
          updated.roofHarvestingAreaSqM = Math.round(bua * 0.58);
        }
        // Auto estimate occupants if residential vs commercial
        if (updated.occupancy === "A1") {
          updated.occupantCount = Math.max(4, Math.round(bua / 40));
        } else if (["E", "F"].includes(updated.occupancy)) {
          updated.occupantCount = Math.max(5, Math.round(bua / 10));
        }
      }
      return updated;
    });
  };

  // Quick Presets
  const applyPreset = (preset: "RESIDENTIAL_SMALL" | "RESIDENTIAL_VILLA" | "COMMERCIAL_SHOP" | "OFFICE_BUILDING") => {
    if (preset === "RESIDENTIAL_SMALL") {
      setData((prev) => ({
        ...prev,
        projectName: "SMALL SINGLE FAMILY RESIDENCE (<80m² EXEMPTED)",
        occupancy: "A1",
        plotAreaSqM: 120,
        roadWidthM: 3.5,
        isNotifiedRoad: false,
        isSingleFamilyResidential: true,
        numberOfStoreys: 1,
        buildingHeightM: 3.6,
        proposedBuaSqM: 75,
        existingBuaSqM: 0,
        groundFloorPlinthSqM: 75,
        roofHarvestingAreaSqM: 75,
        frontYardM: 2.0,
        rearYardM: 1.5,
        sideYard1M: 1.2,
        sideYard2M: 1.0,
        hasBlankWallSide: false,
        occupantCount: 4,
        carParkingProvided: 1,
        twoWheelerParkingProvided: 1
      }));
    } else if (preset === "RESIDENTIAL_VILLA") {
      setData((prev) => ({
        ...prev,
        projectName: "TWO STOREY CONTEMPORARY VILLA",
        occupancy: "A1",
        plotAreaSqM: 320,
        roadWidthM: 4.5,
        isNotifiedRoad: false,
        isSingleFamilyResidential: true,
        numberOfStoreys: 2,
        buildingHeightM: 7.2,
        proposedBuaSqM: 210,
        existingBuaSqM: 0,
        groundFloorPlinthSqM: 115,
        roofHarvestingAreaSqM: 125,
        frontYardM: 2.5,
        rearYardM: 1.8,
        sideYard1M: 1.3,
        sideYard2M: 1.1,
        hasBlankWallSide: false,
        occupantCount: 6,
        carParkingProvided: 2,
        twoWheelerParkingProvided: 2
      }));
    } else if (preset === "COMMERCIAL_SHOP") {
      setData((prev) => ({
        ...prev,
        projectName: "COMMERCIAL RETAIL & MERCANTILE BUILDING",
        occupancy: "F",
        plotAreaSqM: 450,
        roadWidthM: 6.0,
        isNotifiedRoad: true,
        isSingleFamilyResidential: false,
        numberOfStoreys: 2,
        buildingHeightM: 8.0,
        proposedBuaSqM: 280,
        existingBuaSqM: 0,
        groundFloorPlinthSqM: 140,
        roofHarvestingAreaSqM: 150,
        frontYardM: 3.5,
        rearYardM: 2.0,
        sideYard1M: 1.5,
        sideYard2M: 1.5,
        hasBlankWallSide: false,
        occupantCount: 25,
        carParkingProvided: 5,
        twoWheelerParkingProvided: 10
      }));
    } else if (preset === "OFFICE_BUILDING") {
      setData((prev) => ({
        ...prev,
        projectName: "PROFESSIONAL OFFICE COMPLEX",
        occupancy: "E",
        plotAreaSqM: 600,
        roadWidthM: 7.0,
        isNotifiedRoad: true,
        isSingleFamilyResidential: false,
        numberOfStoreys: 3,
        buildingHeightM: 10.5,
        proposedBuaSqM: 450,
        existingBuaSqM: 0,
        groundFloorPlinthSqM: 160,
        roofHarvestingAreaSqM: 170,
        frontYardM: 4.0,
        rearYardM: 2.2,
        sideYard1M: 1.8,
        sideYard2M: 1.8,
        hasBlankWallSide: false,
        occupantCount: 45,
        carParkingProvided: 6,
        twoWheelerParkingProvided: 12
      }));
    }
  };

  // Convert Plot Area to Cents
  const plotAreaCents = useMemo(() => {
    return (data.plotAreaSqM / 40.4686).toFixed(2);
  }, [data.plotAreaSqM]);

  // Total Assessed Area
  const totalAssessedBua = useMemo(() => {
    return Number(data.proposedBuaSqM) + Number(data.existingBuaSqM);
  }, [data.proposedBuaSqM, data.existingBuaSqM]);

  // Master Scrutiny & Calculations Engine
  const analysis = useMemo(() => {
    const occInfo = OCCUPANCY_INFO[data.occupancy] || OCCUPANCY_INFO.A1;

    // -------------------------------------------------------------
    // 1. SETBACK & YARDS ANALYSIS (Rule 26 & 2026 Gazette SRO 682/2026)
    // -------------------------------------------------------------
    let minFrontYardReq = 3.0;
    let frontYardRuleRef = "Rule 26 Table 4";

    // 2026 Gazette Amendment:
    // Single family residential on unnotified road < 6m width -> front yard min 2.0m!
    if (data.occupancy === "A1" && data.isSingleFamilyResidential && !data.isNotifiedRoad && data.roadWidthM < 6.0) {
      minFrontYardReq = 2.0;
      frontYardRuleRef = "Rule 26(4) 1st Proviso (2026 Gazette SRO 682/2026)";
    } else if (["B", "C", "D", "H", "J"].includes(data.occupancy)) {
      minFrontYardReq = 6.0;
      frontYardRuleRef = "Rule 26 Table 4 (Special Occupancies min 6.0m)";
    } else if (data.buildingHeightM > 10) {
      minFrontYardReq = 4.0;
      frontYardRuleRef = "Rule 26(2) Height > 10m Additional Setback";
    }

    let minRearYardReq = data.category === "Category-I" ? 2.0 : 1.5;
    if (["B", "C", "D", "H"].includes(data.occupancy)) {
      minRearYardReq = 3.0;
    }
    if (data.buildingHeightM > 10) {
      minRearYardReq = Math.max(minRearYardReq, 2.0 + (data.buildingHeightM - 10) * 0.2);
    }

    let minSideYard1Req = 1.2;
    let minSideYard2Req = 1.0;
    let sideYardRuleRef = "Rule 26 Table 4";

    if (["B", "C", "D", "H"].includes(data.occupancy)) {
      minSideYard1Req = 3.0;
      minSideYard2Req = 3.0;
    } else if (["E", "F"].includes(data.occupancy)) {
      minSideYard1Req = 1.5;
      minSideYard2Req = 1.5;
    }

    // 2026 Gazette Amendment Proviso: Blank wall reduction to 50cm (0.50m)
    if (data.hasBlankWallSide && data.occupancy === "A1") {
      minSideYard2Req = 0.50;
      sideYardRuleRef = "Rule 26(4) 2nd Proviso (Blank Wall 50cm, 2026 Gazette)";
    }

    const frontYardPass = data.frontYardM >= minFrontYardReq;
    const rearYardPass = data.rearYardM >= minRearYardReq;
    const side1Pass = data.sideYard1M >= minSideYard1Req;
    const side2Pass = data.sideYard2M >= minSideYard2Req;
    const roadWidthPass = data.roadWidthM >= occInfo.minRoadWidth;

    // -------------------------------------------------------------
    // 2. FSI & GROUND COVERAGE (Rule 27 & Tables 2/3)
    // -------------------------------------------------------------
    const maxPermissibleFsi = data.category === "Category-I" ? occInfo.maxFsiCat1 : occInfo.maxFsiCat2;
    const maxPermissibleCoveragePct = occInfo.maxCoverage;

    const achievedFsi = data.plotAreaSqM > 0 ? Number((totalAssessedBua / data.plotAreaSqM).toFixed(3)) : 0;
    const achievedCoveragePct =
      data.plotAreaSqM > 0 ? Number(((data.groundFloorPlinthSqM / data.plotAreaSqM) * 100).toFixed(2)) : 0;

    const fsiPass = achievedFsi <= maxPermissibleFsi;
    const coveragePass = achievedCoveragePct <= maxPermissibleCoveragePct;

    // Low Risk Building Scrutiny (Rule 5 & 20)
    const isLowRiskBuilding =
      totalAssessedBua <= 300 && data.buildingHeightM <= 10 && data.numberOfStoreys <= 2 && data.occupancy === "A1";

    // -------------------------------------------------------------
    // 3. PARKING NORMS (Rule 29 & Table 10)
    // -------------------------------------------------------------
    let baseCarSlots = 0;
    if (data.occupancy === "A1") {
      baseCarSlots = totalAssessedBua > 150 ? Math.ceil(totalAssessedBua / 150) : 1;
    } else {
      baseCarSlots = Math.max(1, Math.ceil(totalAssessedBua / occInfo.parkingAreaPerSlot));
    }

    // Visitor Parking (15% for multi-family, commercial, assembly, or offices)
    const visitorParking = !data.isSingleFamilyResidential || data.occupancy !== "A1" ? Math.ceil(baseCarSlots * 0.15) : 0;

    // Differently Abled Reserved (3% of total car slots, min 1 if parking > 0)
    const subtotalCars = baseCarSlots + visitorParking;
    const reservedDisabledCars = subtotalCars > 0 ? Math.max(1, Math.ceil(subtotalCars * 0.03)) : 0;

    const totalReqCarSlots = subtotalCars + reservedDisabledCars;

    // Two-Wheeler Provision (25% of total car parking area)
    // Car slot = 5.5m * 2.7m = 14.85 m², 2W slot = 2m * 1m = 2 m²
    const reqTwoWheelerSlots = Math.ceil((totalReqCarSlots * 14.85 * 0.25) / 2);

    const carParkingPass = data.carParkingProvided >= totalReqCarSlots;
    const twoWheelerPass = data.twoWheelerParkingProvided >= reqTwoWheelerSlots;
    const parkingPass = carParkingPass && twoWheelerPass;

    // -------------------------------------------------------------
    // 4. PERMIT & GOVERNMENT APPLICATION FEE (KBR § 9(4) & § 10)
    // -------------------------------------------------------------
    // Rule: If total area (Existing + Proposed) is less than 80 sqm, Permit Fee & Application Fee are BOTH 0 (100% EXEMPTED)
    const isExemptedUnder80Sqm = totalAssessedBua < 80;

    let applicationFee = 0;
    let applicationSlabText = "";

    if (isExemptedUnder80Sqm) {
      applicationFee = 0;
      applicationSlabText = "Exempted / സൗജന്യം (< 80m² Total Area, KBR § 9(4))";
    } else if (totalAssessedBua > 300) {
      applicationFee = 1000;
      applicationSlabText = "Above 300 m² (₹1,000)";
    } else if (totalAssessedBua > 100) {
      applicationFee = 500;
      applicationSlabText = "100 m² to 300 m² (₹500)";
    } else {
      applicationFee = 300;
      applicationSlabText = "80 m² to 100 m² (₹300)";
    }

    const permitFeeRate = occInfo.ratePerSqM;
    // Permit fee is assessed ONLY on proposed area
    const permitFee = isExemptedUnder80Sqm ? 0 : Math.round(Number(data.proposedBuaSqM) * permitFeeRate);
    const totalGovernmentFee = applicationFee + permitFee;

    // -------------------------------------------------------------
    // 5. RAINWATER HARVESTING (RWH) TANK SIZING (Rule 76 & Rule 3(iv))
    // -------------------------------------------------------------
    // Mandatory for any building with covered/built-up area >= 100 sq.m
    const isRwhMandatory = totalAssessedBua >= 100;
    const rwhRate = occInfo.rwhRatePerSqM; // 25 or 50 L/m²
    const minRwhCapacityLitres = isRwhMandatory ? Math.round(data.roofHarvestingAreaSqM * rwhRate) : 0;
    const minRwhCapacityM3 = Number((minRwhCapacityLitres / 1000).toFixed(2));

    // Suggested RCC tank dimensions (Standard depth = 1.5m)
    const suggestedTankLengthM = minRwhCapacityM3 > 0 ? Number(Math.sqrt(minRwhCapacityM3 / 1.5).toFixed(2)) : 0;
    const suggestedTankWidthM = suggestedTankLengthM;
    const suggestedTankDepthM = 1.5;

    // -------------------------------------------------------------
    // 6. SANITARY & PLUMBING FIXTURES (Rule 74 & Table 12)
    // -------------------------------------------------------------
    const maleCount = Math.round((data.occupantCount * data.malePercentage) / 100);
    const femaleCount = data.occupantCount - maleCount;

    let reqMaleWc = 0;
    let reqFemaleWc = 0;
    let reqUrinals = 0;
    let reqWashBasins = 0;
    let reqDrinkingPoints = 0;

    if (["E", "F"].includes(data.occupancy)) {
      // Commercial / Offices
      reqMaleWc = maleCount > 0 ? Math.ceil(1 + (maleCount > 25 ? (maleCount - 25) / 50 : 0)) : 0;
      reqFemaleWc = femaleCount > 0 ? Math.ceil(1 + (femaleCount > 15 ? (femaleCount - 15) / 25 : 0)) : 0;
      reqUrinals = maleCount > 0 ? Math.ceil(maleCount / 50) : 0;
      reqWashBasins = Math.ceil(data.occupantCount / 25);
      reqDrinkingPoints = Math.ceil(data.occupantCount / 100);
    } else if (data.occupancy === "B") {
      // Educational
      reqMaleWc = maleCount > 0 ? Math.ceil(maleCount / 40) : 0;
      reqFemaleWc = femaleCount > 0 ? Math.ceil(femaleCount / 25) : 0;
      reqUrinals = maleCount > 0 ? Math.ceil(maleCount / 20) : 0;
      reqWashBasins = Math.ceil(data.occupantCount / 25);
      reqDrinkingPoints = Math.ceil(data.occupantCount / 50);
    } else if (data.occupancy === "D") {
      // Assembly
      reqMaleWc = maleCount > 0 ? Math.ceil(maleCount / 100) : 0;
      reqFemaleWc = femaleCount > 0 ? Math.ceil(femaleCount / 50) : 0;
      reqUrinals = maleCount > 0 ? Math.ceil(maleCount / 50) : 0;
      reqWashBasins = Math.ceil(data.occupantCount / 100);
      reqDrinkingPoints = Math.ceil(data.occupantCount / 200);
    } else if (data.occupancy === "C") {
      // Hospital
      reqMaleWc = maleCount > 0 ? Math.ceil(maleCount / 25) : 0;
      reqFemaleWc = femaleCount > 0 ? Math.ceil(femaleCount / 25) : 0;
      reqUrinals = maleCount > 0 ? Math.ceil(maleCount / 50) : 0;
      reqWashBasins = Math.ceil(data.occupantCount / 20);
      reqDrinkingPoints = Math.ceil(data.occupantCount / 100);
    } else {
      // Residential A1
      reqMaleWc = Math.max(1, Math.ceil(maleCount / 25));
      reqFemaleWc = Math.max(1, Math.ceil(femaleCount / 20));
      reqUrinals = Math.ceil(maleCount / 50);
      reqWashBasins = Math.max(1, Math.ceil(data.occupantCount / 25));
      reqDrinkingPoints = 1;
    }

    const totalWaterClosets = reqMaleWc + reqFemaleWc;

    // -------------------------------------------------------------
    // 7. ENVIRONMENTAL CLEARANCES & ROOM HEIGHT (Rule 75 & Rule 33)
    // -------------------------------------------------------------
    const minWellSepticDistM = 7.50;
    const septicClearancePass = !data.hasWellOnPlot || data.septicToWellDistanceM >= minWellSepticDistM;

    const minAcHeightM = 2.40;
    const minStandardHeightM = 2.75;
    const acHeightPass = !data.isAcRoomProvided || data.acRoomHeightM >= minAcHeightM;

    // -------------------------------------------------------------
    // OVERALL COMPLIANCE SCORING
    // -------------------------------------------------------------
    const rulesList = [
      { name: "Front Yard Setback", pass: frontYardPass, weight: 15 },
      { name: "Rear Yard Setback", pass: rearYardPass, weight: 12 },
      { name: "Side Yard 1 Setback", pass: side1Pass, weight: 10 },
      { name: "Side Yard 2 Setback", pass: side2Pass, weight: 10 },
      { name: "Road Width & Access", pass: roadWidthPass, weight: 10 },
      { name: "FSI (Floor Space Index)", pass: fsiPass, weight: 15 },
      { name: "Ground Coverage %", pass: coveragePass, weight: 10 },
      { name: "Mandatory Parking Bay Norms", pass: parkingPass, weight: 8 },
      { name: "Sanitation Well Clearance (7.5m)", pass: septicClearancePass, weight: 5 },
      { name: "AC Room Clear Height (2.40m)", pass: acHeightPass, weight: 5 }
    ];

    const score = rulesList.reduce((acc, r) => (r.pass ? acc + r.weight : acc), 0);
    const allPassed = rulesList.every((r) => r.pass);

    return {
      occInfo,
      minFrontYardReq,
      frontYardRuleRef,
      minRearYardReq,
      minSideYard1Req,
      minSideYard2Req,
      sideYardRuleRef,
      frontYardPass,
      rearYardPass,
      side1Pass,
      side2Pass,
      roadWidthPass,
      maxPermissibleFsi,
      achievedFsi,
      fsiPass,
      maxPermissibleCoveragePct,
      achievedCoveragePct,
      coveragePass,
      isLowRiskBuilding,
      baseCarSlots,
      visitorParking,
      reservedDisabledCars,
      totalReqCarSlots,
      reqTwoWheelerSlots,
      carParkingPass,
      twoWheelerPass,
      parkingPass,
      isExemptedUnder80Sqm,
      applicationFee,
      applicationSlabText,
      permitFeeRate,
      permitFee,
      totalGovernmentFee,
      isRwhMandatory,
      rwhRate,
      minRwhCapacityLitres,
      minRwhCapacityM3,
      suggestedTankLengthM,
      suggestedTankWidthM,
      suggestedTankDepthM,
      maleCount,
      femaleCount,
      reqMaleWc,
      reqFemaleWc,
      totalWaterClosets,
      reqUrinals,
      reqWashBasins,
      reqDrinkingPoints,
      minWellSepticDistM,
      septicClearancePass,
      minAcHeightM,
      minStandardHeightM,
      acHeightPass,
      score,
      allPassed,
      rulesList
    };
  }, [data, totalAssessedBua]);

  const handlePrintReport = () => {
    triggerPrint(`KPBR_Consolidated_Report_${data.projectName.replace(/\s+/g, "_")}`, "a4-unified-report-page");
  };

  const handleResetData = () => {
    setData(DEFAULT_PROJECT_DATA);
    setSavedNotification("Calculator parameters reset to default values.");
    setTimeout(() => setSavedNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* HEADER MASTER BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden bg-blueprint-grid">
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800 uppercase">
                KPBR 2019 & 2026 GAZETTE MASTER CALCULATOR
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800">
                ALL CALCULATORS COMBINED • SINGLE REPORT
              </span>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-2.5 py-0.5 rounded border border-amber-800">
                OFFICIAL A4 PRINT & PDF
              </span>
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5 font-sans">
              <Calculator className="w-7 h-7 text-emerald-400" />
              <span>ഏകീകൃത കെട്ടിട നിർമ്മാണ ചട്ട കാൽക്കുലേറ്റർ (Building Rules Master Calculator)</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 font-medium max-w-3xl leading-relaxed">
              കുറഞ്ഞ വിവരങ്ങൾ നൽകി സെറ്റ്ബാക്ക്, FSI, കവറേജ്, പാർക്കിംഗ്, പെർമിറ്റ് ഫീസ്, മഴവെള്ള സംഭരണി, ശുചിത്വ സംവിധാനങ്ങൾ എന്നിവയെല്ലാം ഒരൊറ്റ കാൽക്കുലേറ്ററിൽ കണക്കുകൂട്ടി സമഗ്ര A4 റിപ്പോർട്ട് ലഭ്യമാക്കുക.
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 font-mono text-xs shrink-0">
            <button
              onClick={() => setActiveViewTab("INPUTS")}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeViewTab === "INPUTS"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>ഡാറ്റ നൽകുക (Inputs)</span>
            </button>
            <button
              onClick={() => setActiveViewTab("REPORT_PREVIEW")}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeViewTab === "REPORT_PREVIEW"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>A4 സമഗ്ര റിപ്പോർട്ട് (Detailed Report)</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar for Minimum Effort Entry */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-300">ദ്രുത പ്രീസെറ്റുകൾ (Quick 1-Click Presets):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyPreset("RESIDENTIAL_SMALL")}
              className="bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-slate-800 hover:border-emerald-500/50 px-3 py-1.5 rounded-lg transition cursor-pointer text-[11px]"
            >
              ചെറിയ വീട് (&lt;80m² സൗജന്യം)
            </button>
            <button
              onClick={() => applyPreset("RESIDENTIAL_VILLA")}
              className="bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/50 px-3 py-1.5 rounded-lg transition cursor-pointer text-[11px]"
            >
              റെസിഡൻഷ്യൽ വില്ല (210m²)
            </button>
            <button
              onClick={() => applyPreset("COMMERCIAL_SHOP")}
              className="bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-amber-500/50 px-3 py-1.5 rounded-lg transition cursor-pointer text-[11px]"
            >
              ഷോപ്പിംഗ് / കൊമേഴ്സ്യൽ (280m²)
            </button>
            <button
              onClick={() => applyPreset("OFFICE_BUILDING")}
              className="bg-slate-950 hover:bg-slate-800 text-purple-300 border border-slate-800 hover:border-purple-500/50 px-3 py-1.5 rounded-lg transition cursor-pointer text-[11px]"
            >
              ഓഫീസ് കോംപ്ലക്സ് (450m²)
            </button>
          </div>
        </div>
      </div>

      {savedNotification && (
        <div className="bg-emerald-950 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-mono flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{savedNotification}</span>
        </div>
      )}

      {/* MASTER RULE SELECTOR TABS (KPBR 2019 / 2026 RULES 23, 24, 26, 27, 29, 34, 76, 77) */}
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl shadow-lg">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-mono text-xs">
          <button
            onClick={() => {
              setActiveTab("ALL_IN_ONE");
              setActiveViewTab("INPUTS");
            }}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ALL_IN_ONE" && activeViewTab === "INPUTS"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>മാസ്റ്റർ പ്ലോട്ട് (Master Suite)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("FSI_COVERAGE");
              setActiveViewTab("INPUTS");
            }}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "FSI_COVERAGE" && activeViewTab === "INPUTS"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>1. കവറേജ് & FSI (Rule 27 / Table 6)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("OCCUPANT_LOAD");
              setActiveViewTab("INPUTS");
            }}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "OCCUPANT_LOAD" && activeViewTab === "INPUTS"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. ആളുകളുടെ എണ്ണം (Tables 13 & 17)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("PARKING_LOADING");
              setActiveViewTab("INPUTS");
            }}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "PARKING_LOADING" && activeViewTab === "INPUTS"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>3. പാർക്കിംഗ് & ലോഡിംഗ് (Rule 29)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("SANITATION");
              setActiveViewTab("INPUTS");
            }}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "SANITATION" && activeViewTab === "INPUTS"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>4. ശുചിത്വം & 15A Matrix (Rule 34)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("SOLAR_CAPACITY");
              setActiveViewTab("INPUTS");
            }}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "SOLAR_CAPACITY" && activeViewTab === "INPUTS"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>5. സൗരോർജ്ജ പ്ലാന്റ് (Rule 77)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("RWH_STORAGE");
              setActiveViewTab("INPUTS");
            }}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "RWH_STORAGE" && activeViewTab === "INPUTS"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>6. മഴവെള്ള സംഭരണി (Rule 76)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("HEIGHT_SETBACK");
              setActiveViewTab("INPUTS");
            }}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "HEIGHT_SETBACK" && activeViewTab === "INPUTS"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>7. ഉയര പരിധി & സെറ്റ്ബാക്ക് (Rule 24)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("CONSOLIDATED_REPORT");
              setActiveViewTab("REPORT_PREVIEW");
            }}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "CONSOLIDATED_REPORT" || activeViewTab === "REPORT_PREVIEW"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>A4 സമഗ്ര റിപ്പോർട്ട് (Detailed Report)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: COMPACT INPUTS & REALTIME COMPLIANCE GAUGES */}
      {/* ========================================================================= */}
      {activeTab === "ALL_IN_ONE" && activeViewTab === "INPUTS" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 7 COLS: COMPACT INTEGRATED FORM INPUTS */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. PROJECT & SITE DETAILS */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white font-sans uppercase flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>1. പ്രോജക്ട് & പ്ലോട്ട് അടിസ്ഥാന വിവരങ്ങൾ (Project & Plot)</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Essential Data</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">പ്രോജക്ടിന്റെ പേര് / Title</label>
                  <input
                    type="text"
                    value={data.projectName}
                    onChange={(e) => handleChange("projectName", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">ഉടമസ്ഥന്റെ പേര് / Owner</label>
                  <input
                    type="text"
                    value={data.applicantName}
                    onChange={(e) => handleChange("applicantName", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">തദ്ദേശ സ്വയംഭരണ സ്ഥാപനം (LSGD)</label>
                  <input
                    type="text"
                    value={data.localBodyName}
                    onChange={(e) => handleChange("localBodyName", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">പഞ്ചായത്ത് തരം / Category</label>
                  <select
                    value={data.category}
                    onChange={(e) => handleChange("category", e.target.value as "Category-I" | "Category-II")}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium outline-none"
                  >
                    <option value="Category-II">Category-II (Standard Village Panchayat)</option>
                    <option value="Category-I">Category-I (Urbanized / Special Panchayat)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">പ്ലോട്ട് വിസ്തീർണ്ണം (Plot Area)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      value={data.plotAreaSqM}
                      onChange={(e) => handleChange("plotAreaSqM", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                    <span className="absolute right-3 top-2 text-[11px] font-mono text-slate-400">m²</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 mt-1 block">≈ {plotAreaCents} സെന്റ് (Cents)</span>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">റോഡ് വീതി (Road Width)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={data.roadWidthM}
                      onChange={(e) => handleChange("roadWidthM", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                    <span className="absolute right-3 top-2 text-[11px] font-mono text-slate-400">m</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                    ആവശ്യമായ കുറഞ്ഞ വീതി: {analysis.occInfo.minRoadWidth}m
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-4 border-t border-slate-800/80 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={data.isSingleFamilyResidential}
                    onChange={(e) => handleChange("isSingleFamilyResidential", e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>ഏക കുടുംബ വീട് (Single-Family Residential)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={data.isNotifiedRoad}
                    onChange={(e) => handleChange("isNotifiedRoad", e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>വിജ്ഞാപനം ചെയ്ത പ്രധാന റോഡ് (Notified Road)</span>
                </label>
              </div>
            </div>

            {/* 2. BUILDING DIMENSIONS & OCCUPANCY */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white font-sans uppercase flex items-center gap-2">
                  <Building className="w-4 h-4 text-cyan-400" />
                  <span>2. കെട്ടിട ഉപയോഗ വിഭാഗവും വിസ്തൃതിയും (Building & Area)</span>
                </h3>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">BUA & Storeys</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">
                    കെട്ടിട ഉപയോഗ വിഭാഗം (Occupancy Classification)
                  </label>
                  <select
                    value={data.occupancy}
                    onChange={(e) => handleChange("occupancy", e.target.value as OccupancyCode)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium outline-none"
                  >
                    {Object.entries(OCCUPANCY_INFO).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.name} (Max FSI: {info.maxFsiCat2} | Coverage: {info.maxCoverage}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">നിർദ്ദിഷ്ട വിസ്തീർണ്ണം (Proposed BUA)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      value={data.proposedBuaSqM}
                      onChange={(e) => handleChange("proposedBuaSqM", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                    <span className="absolute right-3 top-2 text-[11px] font-mono text-slate-400">m²</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                    പെർമിറ്റ് ഫീസ് നിരക്ക്: ₹{analysis.permitFeeRate}/m²
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">നിലവിലുള്ള വിസ്തീർണ്ണം (Existing BUA)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={data.existingBuaSqM}
                      onChange={(e) => handleChange("existingBuaSqM", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                    <span className="absolute right-3 top-2 text-[11px] font-mono text-slate-400">m²</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                    ആകെ വിസ്തീർണ്ണം: {totalAssessedBua} m²
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">ഗ്രൗണ്ട് ഫ്ലോർ പ്ലിന്ത് ഏരിയ (Plinth Area)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      value={data.groundFloorPlinthSqM}
                      onChange={(e) => handleChange("groundFloorPlinthSqM", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                    <span className="absolute right-3 top-2 text-[11px] font-mono text-slate-400">m²</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                    കവറേജ്: {analysis.achievedCoveragePct}% / Max {analysis.maxPermissibleCoveragePct}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-mono text-[11px] mb-1">നിലകൾ (Storeys)</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={data.numberOfStoreys}
                      onChange={(e) => handleChange("numberOfStoreys", parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-mono text-[11px] mb-1">ഉയരം (Height)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="2"
                        value={data.buildingHeightM}
                        onChange={(e) => handleChange("buildingHeightM", parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                      />
                      <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500">m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. PROPOSED SETBACKS ON SITE */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white font-sans uppercase flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-emerald-400" />
                  <span>3. നിർദ്ദിഷ്ട മുറ്റങ്ങളുടെ അളവുകൾ (Site Setbacks)</span>
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">Rule 26 & 2026 Gazette</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans">
                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">മുൻമുറ്റം (Front Yard)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      value={data.frontYardM}
                      onChange={(e) => handleChange("frontYardM", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500">m</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                    Min: {analysis.minFrontYardReq}m
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">പിൻമുറ്റം (Rear Yard)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      value={data.rearYardM}
                      onChange={(e) => handleChange("rearYardM", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500">m</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                    Min: {analysis.minRearYardReq}m
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">വശം 1 (Side Yard 1)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      value={data.sideYard1M}
                      onChange={(e) => handleChange("sideYard1M", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500">m</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                    Min: {analysis.minSideYard1Req}m
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">വശം 2 (Side Yard 2)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      value={data.sideYard2M}
                      onChange={(e) => handleChange("sideYard2M", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500">m</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                    Min: {analysis.minSideYard2Req}m
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-300">
                  <input
                    type="checkbox"
                    checked={data.hasBlankWallSide}
                    onChange={(e) => handleChange("hasBlankWallSide", e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span>
                    ഒരു വശത്ത് വാതിലുകളോ ജനലുകളോ ഇല്ലാത്ത തരിശു ചുമര് (Blank Wall 50cm Proviso, 2026 Gazette)
                  </span>
                </label>
              </div>
            </div>

            {/* 4. ENVIRONMENTAL, PARKING & SANITARY */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white font-sans uppercase flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <span>4. പാർക്കിംഗ്, മഴവെള്ളം & ശുചിത്വ വിവരങ്ങൾ (Amenities & Hygiene)</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Rules 29, 74, 75, 76</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans">
                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">കാർ പാർക്കിംഗ് നൽകിയത്</label>
                  <input
                    type="number"
                    min="0"
                    value={data.carParkingProvided}
                    onChange={(e) => handleChange("carParkingProvided", parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                    ആവശ്യമായത്: {analysis.totalReqCarSlots} സ്ലോട്ട്
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">ഇരുചക്ര പാർക്കിംഗ് നൽകിയത്</label>
                  <input
                    type="number"
                    min="0"
                    value={data.twoWheelerParkingProvided}
                    onChange={(e) => handleChange("twoWheelerParkingProvided", parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                    ആവശ്യമായത്: {analysis.reqTwoWheelerSlots} എണ്ണം
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">മേൽക്കൂര വിസ്തീർണ്ണം (RWH Area)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={data.roofHarvestingAreaSqM}
                      onChange={(e) => handleChange("roofHarvestingAreaSqM", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500">m²</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 mt-0.5 block">
                    ടാങ്ക് വ്യാപ്തി: {analysis.minRwhCapacityLitres} L
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">കിണറുമായുള്ള അകലം (Well Dist)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={data.septicToWellDistanceM}
                      onChange={(e) => handleChange("septicToWellDistanceM", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500">m</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">Min: 7.50m (Rule 75)</span>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">AC മുറിയുടെ ക്ലിയർ ഉയരം</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      value={data.acRoomHeightM}
                      onChange={(e) => handleChange("acRoomHeightM", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500">m</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">2026 Proviso: Min 2.40m</span>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">ആളുകളുടെ എണ്ണം (Occupants)</label>
                  <input
                    type="number"
                    min="1"
                    value={data.occupantCount}
                    onChange={(e) => handleChange("occupantCount", parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                    WC ആവശ്യമായത്: {analysis.totalWaterClosets} എണ്ണം
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <button
                  onClick={handleResetData}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 px-3.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ഡീഫോൾട്ട് റീസെറ്റ് ചെയ്യുക</span>
                </button>

                <button
                  onClick={() => setActiveViewTab("REPORT_PREVIEW")}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2 px-4 rounded-xl font-mono text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>A4 റിപ്പോർട്ട് തുറക്കുക & പ്രിന്റ് ചെയ്യുക</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: REAL-TIME COMPLIANCE GAUGES & VISUAL GRAPHICS */}
          <div className="lg:col-span-5 space-y-6">
            {/* OVERALL COMPLIANCE SCORE CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
                  നിയമ അനുസരണ സ്കോർ (COMPLIANCE SCORE)
                </span>
                <span
                  className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full border ${
                    analysis.allPassed
                      ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                      : "bg-amber-950 text-amber-300 border-amber-800"
                  }`}
                >
                  {analysis.allPassed ? "PASSED (അനുയോജ്യം)" : "WARNINGS FOUND"}
                </span>
              </div>

              {/* Big Score Dial */}
              <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={analysis.allPassed ? "text-emerald-400" : "text-amber-400"}
                      strokeDasharray={`${analysis.score}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-xl font-black font-mono text-white">{analysis.score}%</span>
                </div>

                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-black text-white font-sans">
                    {analysis.allPassed ? "കെ-സ്മാർട്ട് ഫയലിംഗിന് അനുയോജ്യം" : "ചട്ട നിബന്ധനകൾ പുനഃപരിശോധിക്കുക"}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    {analysis.allPassed
                      ? "എല്ലാ സെറ്റ്ബാക്കുകളും, FSI, കവറേജ്, പാർക്കിംഗ്, ഫീസ്, മഴവെള്ള സംഭരണി എന്നിവ KPBR 2019 & 2026 ഗസറ്റ് ഭേദഗതി അനുസരിച്ച് കൃത്യമാണ്."
                      : "ചുവപ്പ് അല്ലെങ്കിൽ മഞ്ഞ അടയാളപ്പെടുത്തിയ അളവുകൾ ചട്ടങ്ങൾക്കനുസൃതമായി മാറ്റുക."}
                  </p>
                </div>
              </div>

              {/* 2D SETBACK BLUEPRINT DIAGRAM */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase block">
                  പ്ലോട്ട് & സെറ്റ്ബാക്ക് വിഷ്വൽ മാപ്പ് (2D Layout Blueprint)
                </span>

                <div className="border-2 border-dashed border-slate-700 bg-slate-900/80 rounded-xl p-4 relative font-mono text-[11px] text-center space-y-3">
                  {/* Road Top */}
                  <div className="bg-slate-800 text-slate-300 py-1.5 rounded font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1">
                    <span>ROAD WIDTH: {data.roadWidthM}m</span>
                    {data.roadWidthM < 6.0 && <span className="text-amber-400">(&lt;6m 2026 Proviso)</span>}
                  </div>

                  {/* Front Yard Metric */}
                  <div
                    className={`p-1.5 rounded font-bold ${
                      analysis.frontYardPass
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : "bg-rose-950 text-rose-300 border border-rose-800"
                    }`}
                  >
                    FRONT YARD: {data.frontYardM}m (Min: {analysis.minFrontYardReq}m) {analysis.frontYardPass ? "✓" : "✗"}
                  </div>

                  {/* Middle: Side 1 - Building - Side 2 */}
                  <div className="grid grid-cols-5 gap-2 items-center text-[10px]">
                    <div
                      className={`p-2 rounded font-bold ${
                        analysis.side1Pass
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-rose-950 text-rose-300 border border-rose-800"
                      }`}
                    >
                      SIDE 1<br />
                      {data.sideYard1M}m
                    </div>

                    <div className="col-span-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-3 text-white font-sans text-xs">
                      <span className="font-black block uppercase text-emerald-300">PROPOSED BUILDING</span>
                      <span className="text-[10px] font-mono text-slate-300">
                        {data.groundFloorPlinthSqM}m² ({data.numberOfStoreys} Storey)
                      </span>
                    </div>

                    <div
                      className={`p-2 rounded font-bold ${
                        analysis.side2Pass
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-rose-950 text-rose-300 border border-rose-800"
                      }`}
                    >
                      SIDE 2<br />
                      {data.sideYard2M}m
                    </div>
                  </div>

                  {/* Rear Yard Metric */}
                  <div
                    className={`p-1.5 rounded font-bold ${
                      analysis.rearYardPass
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : "bg-rose-950 text-rose-300 border border-rose-800"
                    }`}
                  >
                    REAR YARD: {data.rearYardM}m (Min: {analysis.minRearYardReq}m) {analysis.rearYardPass ? "✓" : "✗"}
                  </div>
                </div>
              </div>

              {/* FSI & COVERAGE PROGRESS METERS */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs">
                {/* Coverage % Meter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">തറ വിസ്തൃതി കവറേജ് (Coverage %):</span>
                    <span className="font-bold text-white">
                      {analysis.achievedCoveragePct}% / Max {analysis.maxPermissibleCoveragePct}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${analysis.coveragePass ? "bg-emerald-400" : "bg-rose-500"}`}
                      style={{
                        width: `${Math.min(100, (analysis.achievedCoveragePct / analysis.maxPermissibleCoveragePct) * 100)}%`
                      }}
                    />
                  </div>
                </div>

                {/* FSI Meter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">ഫ്ലോർ സ്പേസ് ഇൻഡക്സ് (FSI Achieved):</span>
                    <span className="font-bold text-white">
                      {analysis.achievedFsi} / Max {analysis.maxPermissibleFsi}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${analysis.fsiPass ? "bg-cyan-400" : "bg-rose-500"}`}
                      style={{ width: `${Math.min(100, (analysis.achievedFsi / analysis.maxPermissibleFsi) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* FINANCIAL & PARKING SUMMARY CARDS */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">LSGD പെർമിറ്റ് ഫീസ്:</span>
                  <span className="text-base font-black text-amber-400">
                    {analysis.isExemptedUnder80Sqm ? "₹0 (EXEMPT)" : `₹${analysis.totalGovernmentFee.toLocaleString("en-IN")}`}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {analysis.isExemptedUnder80Sqm ? "<80m² Fee Exemption" : `Rate: ₹${analysis.permitFeeRate}/m²`}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">മഴവെള്ള സംഭരണി:</span>
                  <span className="text-base font-black text-cyan-400">
                    {analysis.isRwhMandatory ? `${analysis.minRwhCapacityLitres} L` : "Not Mandatory"}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {analysis.isRwhMandatory ? `${analysis.minRwhCapacityM3} m³ Tank` : "BUA < 100m²"}
                  </span>
                </div>
              </div>

              {/* View Full Report Button */}
              <button
                onClick={() => setActiveViewTab("REPORT_PREVIEW")}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-mono text-xs font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>പൂർണ്ണ A4 റിപ്പോർട്ട് കാണുക & പ്രിന്റ് ചെയ്യുക</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-CALCULATORS FOR INDIVIDUAL KPBR RULES */}
      {/* ========================================================================= */}
      {activeTab === "FSI_COVERAGE" && activeViewTab === "INPUTS" && (
        <FsiCoverageCalculator
          plotAreaSqM={data.plotAreaSqM}
          onPlotAreaChange={(v) => handleChange("plotAreaSqM", v)}
          groundFloorPlinthSqM={data.groundFloorPlinthSqM}
          onGroundFloorPlinthChange={(v) => handleChange("groundFloorPlinthSqM", v)}
          totalFloorAreaSqM={totalAssessedBua}
          onTotalFloorAreaChange={(v) => handleChange("proposedBuaSqM", v)}
          occupancy={data.occupancy}
          onOccupancyChange={(v) => handleChange("occupancy", v)}
          category={data.category}
          onCategoryChange={(v) => handleChange("category", v)}
          isMultipleOccupancy={data.isMultipleOccupancy}
          onIsMultipleOccupancyChange={(v) => handleChange("isMultipleOccupancy", v)}
          occupancyBlocks={data.occupancyBlocks}
          onOccupancyBlocksChange={(v) => handleChange("occupancyBlocks", v)}
        />
      )}

      {activeTab === "OCCUPANT_LOAD" && activeViewTab === "INPUTS" && (
        <OccupantLoadCalculator
          occupancy={data.occupancy}
          onOccupancyChange={(v) => handleChange("occupancy", v)}
          totalFloorAreaSqM={totalAssessedBua}
          onTotalFloorAreaChange={(v) => handleChange("proposedBuaSqM", v)}
        />
      )}

      {activeTab === "PARKING_LOADING" && activeViewTab === "INPUTS" && (
        <ParkingLoadingCalculator
          occupancy={data.occupancy}
          onOccupancyChange={(v) => handleChange("occupancy", v)}
          totalFloorAreaSqM={totalAssessedBua}
          onTotalFloorAreaChange={(v) => handleChange("proposedBuaSqM", v)}
        />
      )}

      {activeTab === "SANITATION" && activeViewTab === "INPUTS" && (
        <SanitationCalculator
          occupancy={data.occupancy}
          onOccupancyChange={(v) => handleChange("occupancy", v)}
          totalFloorAreaSqM={totalAssessedBua}
          onTotalFloorAreaChange={(v) => handleChange("proposedBuaSqM", v)}
        />
      )}

      {activeTab === "SOLAR_CAPACITY" && activeViewTab === "INPUTS" && (
        <SolarCapacityCalculator
          occupancy={data.occupancy}
          onOccupancyChange={(v) => handleChange("occupancy", v)}
          totalFloorAreaSqM={totalAssessedBua}
          onTotalFloorAreaChange={(v) => handleChange("proposedBuaSqM", v)}
        />
      )}

      {activeTab === "RWH_STORAGE" && activeViewTab === "INPUTS" && (
        <RwhStorageCalculator
          occupancy={data.occupancy}
          onOccupancyChange={(v) => handleChange("occupancy", v)}
          totalFloorAreaSqM={totalAssessedBua}
          onTotalFloorAreaChange={(v) => handleChange("proposedBuaSqM", v)}
          groundCoveredAreaSqM={data.groundFloorPlinthSqM}
          onGroundCoveredAreaChange={(v) => handleChange("groundFloorPlinthSqM", v)}
        />
      )}

      {activeTab === "HEIGHT_SETBACK" && activeViewTab === "INPUTS" && (
        <HeightSetbackCalculator
          roadWidthM={data.roadWidthM}
          onRoadWidthChange={(v) => handleChange("roadWidthM", v)}
          frontYardM={data.frontYardM}
          onFrontYardChange={(v) => handleChange("frontYardM", v)}
          buildingHeightM={data.buildingHeightM}
          onBuildingHeightChange={(v) => handleChange("buildingHeightM", v)}
        />
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: SINGLE CONSOLIDATED DETAILED REPORT (PRINT & PDF READY) */}
      {/* ========================================================================= */}
      {(activeTab === "CONSOLIDATED_REPORT" || activeViewTab === "REPORT_PREVIEW") && (
        <ConsolidatedMasterReport
          data={data}
          onBackToInputs={() => {
            setActiveTab("ALL_IN_ONE");
            setActiveViewTab("INPUTS");
          }}
        />
      )}

      {false && activeViewTab === "REPORT_PREVIEW" && (
        <div className="space-y-4">
          {/* Action Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>ഏകീകൃത സമഗ്ര റിപ്പോർട്ട് (Consolidated Master Scrutiny Report)</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveViewTab("INPUTS")}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-mono text-xs font-bold cursor-pointer"
              >
                അളവുകൾ തിരുത്തുക (Edit Data)
              </button>

              <button
                onClick={handlePrintReport}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-mono text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>A4 പ്രിന്റ് / PDF ഡൗൺലോഡ്</span>
              </button>
            </div>
          </div>

          {/* EXACT A4 REPORT CONTAINER */}
          <div className="max-w-[860px] mx-auto overflow-x-auto pb-6">
            <div
              id="a4-unified-report-page"
              ref={reportRef}
              className="bg-white text-slate-950 p-8 sm:p-10 rounded-sm shadow-2xl border border-slate-300 min-h-[1120px] flex flex-col justify-between font-sans relative"
              style={{ width: "100%", maxWidth: "840px", margin: "0 auto" }}
            >
              {/* Document Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none rotate-[-30deg]">
                <span className="text-7xl font-black font-mono tracking-widest text-slate-900">
                  KPBR 2019 / 2026 AUDIT
                </span>
              </div>

              {/* REPORT TOP HEADER */}
              <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1 relative z-10">
                <div className="text-[10px] font-mono tracking-widest font-bold text-slate-700 uppercase">
                  LOCAL SELF GOVERNMENT DEPARTMENT • GOVERNMENT OF KERALA
                </div>
                <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900">
                  UNIFIED BUILDING RULES CALCULATION & SCRUTINY REPORT
                </h1>
                <div className="text-xs font-mono font-semibold text-slate-700">
                  Kerala Panchayat Building Rules (KPBR 2019) & 2026 Gazette Amendment (S.R.O. No. 682/2026)
                </div>
                <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-600 pt-2 border-t border-slate-300 mt-2">
                  <span>തീയതി: <b>{data.date}</b></span>
                  <span>തദ്ദേശ സ്ഥാപനം: <b>{data.localBodyName}</b></span>
                  <span>വിഭാഗം: <b>{data.category}</b></span>
                  <span>
                    സ്കോർ: <b className={analysis.allPassed ? "text-emerald-700" : "text-amber-700"}>{analysis.score}% ({analysis.allPassed ? "PASS" : "WARN"})</b>
                  </span>
                </div>
              </div>

              {/* 1. PROJECT & SITE DETAILS */}
              <div className="my-3 space-y-1.5 relative z-10 text-xs">
                <div className="bg-slate-100 p-1.5 rounded border border-slate-300 font-mono font-bold uppercase text-[10px] flex justify-between">
                  <span>1. പ്രോജക്ട് & പ്ലോട്ട് അടിസ്ഥാന വിവരങ്ങൾ (PROJECT & SITE PROFILE)</span>
                  <span>Sy No: {data.surveyNo} | Re-Sy: {data.resurveyNo}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-slate-300 p-2.5 rounded text-[10px]">
                  <div>
                    <span className="text-slate-500 block">അപേക്ഷകൻ:</span>
                    <span className="font-bold">{data.applicantName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">പ്രോജക്ട്:</span>
                    <span className="font-bold">{data.projectName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">പ്ലോട്ട് വിസ്തീർണ്ണം:</span>
                    <span className="font-bold">{data.plotAreaSqM} m² ({plotAreaCents} Cents)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">റോഡ് വീതി:</span>
                    <span className="font-bold">{data.roadWidthM}m (Min: {analysis.occInfo.minRoadWidth}m)</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">ഉപയോഗ ഗണം (Occupancy):</span>
                    <span className="font-bold">{analysis.occInfo.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">നിലകൾ / ഉയരം:</span>
                    <span className="font-bold">{data.numberOfStoreys} Floors | {data.buildingHeightM}m</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">നിർദ്ദിഷ്ട വിസ്തീർണ്ണം (Proposed):</span>
                    <span className="font-bold text-emerald-800">{data.proposedBuaSqM} m²</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ആകെ വിസ്തീർണ്ണം (Total BUA):</span>
                    <span className="font-bold">{totalAssessedBua} m²</span>
                  </div>
                </div>
              </div>

              {/* 2. DETAILED SETBACK & OPEN SPACES REPORT */}
              <div className="my-2 space-y-1.5 relative z-10">
                <div className="bg-slate-100 p-1.5 rounded border border-slate-300 font-mono font-bold uppercase text-[10px] flex justify-between">
                  <span>2. മുറ്റങ്ങളുടെ വിസ്തൃതി & സെറ്റ്ബാക്ക് പരിശോധന (SETBACK & YARDS SCRUTINY - RULE 26)</span>
                  <span className="text-emerald-800">2026 GAZETTE COMPLIANT</span>
                </div>

                <table className="w-full text-left border-collapse border border-slate-300 text-[10px] font-sans">
                  <thead>
                    <tr className="bg-slate-200 font-mono text-slate-800 text-[9px] uppercase">
                      <th className="border border-slate-300 p-1.5">മുറ്റം (Yard)</th>
                      <th className="border border-slate-300 p-1.5">നിർദ്ദിഷ്ട അളവ് (Proposed)</th>
                      <th className="border border-slate-300 p-1.5">ചട്ടപ്രകാരമുള്ള അളവ് (Mandated)</th>
                      <th className="border border-slate-300 p-1.5">ബാധകമായ ചട്ടം / ഭേദഗതി (Rule Clause)</th>
                      <th className="border border-slate-300 p-1.5 text-center">ഫലം (Status)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-1.5 font-bold">മുൻമുറ്റം (Front Yard)</td>
                      <td className="border border-slate-300 p-1.5 font-mono font-bold">{data.frontYardM} m</td>
                      <td className="border border-slate-300 p-1.5 font-mono">Min {analysis.minFrontYardReq} m</td>
                      <td className="border border-slate-300 p-1.5 font-mono text-[9px]">{analysis.frontYardRuleRef}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">
                        <span className={analysis.frontYardPass ? "text-emerald-700" : "text-rose-700"}>
                          {analysis.frontYardPass ? "PASSED (തൃപ്തികരം)" : "FAILED (പോരാ)"}
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="border border-slate-300 p-1.5 font-bold">പിൻമുറ്റം (Rear Yard)</td>
                      <td className="border border-slate-300 p-1.5 font-mono font-bold">{data.rearYardM} m</td>
                      <td className="border border-slate-300 p-1.5 font-mono">Min {analysis.minRearYardReq} m</td>
                      <td className="border border-slate-300 p-1.5 font-mono text-[9px]">Rule 26 Table 4 ({data.category})</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">
                        <span className={analysis.rearYardPass ? "text-emerald-700" : "text-rose-700"}>
                          {analysis.rearYardPass ? "PASSED (തൃപ്തികരം)" : "FAILED (പോരാ)"}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-1.5 font-bold">വശം 1 (Side Yard 1)</td>
                      <td className="border border-slate-300 p-1.5 font-mono font-bold">{data.sideYard1M} m</td>
                      <td className="border border-slate-300 p-1.5 font-mono">Min {analysis.minSideYard1Req} m</td>
                      <td className="border border-slate-300 p-1.5 font-mono text-[9px]">Rule 26 Table 4</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">
                        <span className={analysis.side1Pass ? "text-emerald-700" : "text-rose-700"}>
                          {analysis.side1Pass ? "PASSED (തൃപ്തികരം)" : "FAILED (പോരാ)"}
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="border border-slate-300 p-1.5 font-bold">വശം 2 (Side Yard 2)</td>
                      <td className="border border-slate-300 p-1.5 font-mono font-bold">{data.sideYard2M} m</td>
                      <td className="border border-slate-300 p-1.5 font-mono">Min {analysis.minSideYard2Req} m</td>
                      <td className="border border-slate-300 p-1.5 font-mono text-[9px]">{analysis.sideYardRuleRef}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">
                        <span className={analysis.side2Pass ? "text-emerald-700" : "text-rose-700"}>
                          {analysis.side2Pass ? "PASSED (തൃപ്തികരം)" : "FAILED (പോരാ)"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 3. DETAILED FSI & GROUND COVERAGE REPORT */}
              <div className="my-2 space-y-1.5 relative z-10">
                <div className="bg-slate-100 p-1.5 rounded border border-slate-300 font-mono font-bold uppercase text-[10px] flex justify-between">
                  <span>3. FSI & തറ വിസ്തൃതി കവറേജ് പരിശോധന (FSI & COVERAGE - RULE 27)</span>
                  <span>Rule 27 Tables 2 & 3</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-slate-300 p-2 rounded text-[10px]">
                  <div>
                    <span className="text-slate-500 block">പ്ലിന്ത് ഏരിയ (Ground Floor):</span>
                    <span className="font-bold">{data.groundFloorPlinthSqM} m²</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">കവറേജ് (Coverage %):</span>
                    <span className="font-bold">{analysis.achievedCoveragePct}% (Max: {analysis.maxPermissibleCoveragePct}%)</span>
                    <span className={`text-[9px] font-bold block ${analysis.coveragePass ? "text-emerald-700" : "text-rose-700"}`}>
                      {analysis.coveragePass ? "✓ അനുയോജ്യം (Passed)" : "✗ പരിധി ലംഘിച്ചു"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ലഭിച്ച FSI (Achieved FSI):</span>
                    <span className="font-bold">{analysis.achievedFsi} (Max: {analysis.maxPermissibleFsi})</span>
                    <span className={`text-[9px] font-bold block ${analysis.fsiPass ? "text-emerald-700" : "text-rose-700"}`}>
                      {analysis.fsiPass ? "✓ അനുയോജ്യം (Passed)" : "✗ പരിധി ലംഘിച്ചു"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ലോ റിസ്ക് കെട്ടിട പദവി:</span>
                    <span className="font-bold">{analysis.isLowRiskBuilding ? "YES (Rule 5 Eligible)" : "NO (Standard)"}</span>
                    <span className="text-[9px] text-slate-500 block">
                      {analysis.isLowRiskBuilding ? "തൽക്ഷണ പെർമിറ്റ് അനുയോജ്യം" : "വിശദ പരിശോധന"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. DETAILED PARKING NORMS REPORT */}
              <div className="my-2 space-y-1.5 relative z-10">
                <div className="bg-slate-100 p-1.5 rounded border border-slate-300 font-mono font-bold uppercase text-[10px] flex justify-between">
                  <span>4. നിർബന്ധിത പാർക്കിംഗ് പരിശോധന (MANDATORY PARKING - RULE 29 & TABLE 10)</span>
                  <span>Rule 29 Table 10</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-slate-300 p-2 rounded text-[10px]">
                  <div>
                    <span className="text-slate-500 block">ആവശ്യമായ കാർ സ്ലോട്ടുകൾ:</span>
                    <span className="font-bold">{analysis.totalReqCarSlots} സ്ലോട്ട്</span>
                    <span className="text-[9px] text-slate-500 block">
                      (Base: {analysis.baseCarSlots} + Vis: {analysis.visitorParking} + DA: {analysis.reservedDisabledCars})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">നൽകിയിട്ടുള്ള കാർ പാർക്കിംഗ്:</span>
                    <span className="font-bold">{data.carParkingProvided} സ്ലോട്ട്</span>
                    <span className={`text-[9px] font-bold block ${analysis.carParkingPass ? "text-emerald-700" : "text-rose-700"}`}>
                      {analysis.carParkingPass ? "✓ തൃപ്തികരം (Passed)" : "✗ കുറവാണ് (Deficit)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ഇരുചക്ര പാർക്കിംഗ് (25% Area):</span>
                    <span className="font-bold">ആവശ്യമായത്: {analysis.reqTwoWheelerSlots} എണ്ണം</span>
                    <span className="text-[9px] text-slate-500 block">നൽകിയത്: {data.twoWheelerParkingProvided} എണ്ണം</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ഭിന്നശേഷി പാർക്കിംഗ് (3%):</span>
                    <span className="font-bold">{analysis.reservedDisabledCars} സ്ലോട്ട് റിസർവ്ഡ്</span>
                    <span className="text-[9px] text-slate-500 block">പ്രവേശന കവാടത്തിന് സമീപം</span>
                  </div>
                </div>
              </div>

              {/* 5. DETAILED PERMIT & APPLICATION FEE REPORT */}
              <div className="my-2 space-y-1.5 relative z-10">
                <div className="bg-slate-100 p-1.5 rounded border border-slate-300 font-mono font-bold uppercase text-[10px] flex justify-between">
                  <span>5. പെർമിറ്റ് & അപേക്ഷാ ഫീസ് നിർണ്ണയം (PERMIT & APPLICATION FEE - KBR § 9(4) & § 10)</span>
                  <span>KBR Schedule of Fees</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-slate-300 p-2 rounded text-[10px]">
                  <div>
                    <span className="text-slate-500 block">ഫീസ് നിശ്ചയിച്ച തറവിസ്തൃതി:</span>
                    <span className="font-bold">{data.proposedBuaSqM} m² (Proposed)</span>
                    <span className="text-[9px] text-slate-500 block">Total: {totalAssessedBua} m²</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">അപേക്ഷാ ഫീസ് (Application Fee):</span>
                    <span className="font-bold">₹{analysis.applicationFee}</span>
                    <span className="text-[9px] text-slate-500 block">{analysis.applicationSlabText}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">പെർമിറ്റ് ഫീസ് (Permit Fee):</span>
                    <span className="font-bold">₹{analysis.permitFee}</span>
                    <span className="text-[9px] text-slate-500 block">₹{analysis.permitFeeRate}/m² × {data.proposedBuaSqM}m²</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ആകെ ഒടുക്കേണ്ട തുക (Total Payable):</span>
                    <span className="font-black text-xs text-amber-800">₹{analysis.totalGovernmentFee.toLocaleString("en-IN")}</span>
                    <span className="text-[9px] text-slate-500 block">
                      {analysis.isExemptedUnder80Sqm ? "100% ഫീസ് ഇളവ് ബാധകം" : "തദ്ദേശ സ്ഥാപന ട്രഷറി"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 6. RAINWATER HARVESTING & SANITARY FIXTURES SCHEDULE */}
              <div className="my-2 grid grid-cols-1 sm:grid-cols-2 gap-2 relative z-10">
                {/* 6A: Rainwater Tank */}
                <div className="space-y-1.5">
                  <div className="bg-slate-100 p-1.5 rounded border border-slate-300 font-mono font-bold uppercase text-[10px] flex justify-between">
                    <span>6A. മഴവെള്ള സംഭരണി (RWH TANK - RULE 76)</span>
                  </div>
                  <div className="border border-slate-300 p-2 rounded text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">മാനദണ്ഡം (Rule 76):</span>
                      <span className="font-bold">{analysis.rwhRate} Litres per m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ആവശ്യമായ സംഭരണശേഷി:</span>
                      <span className="font-bold text-cyan-800">
                        {analysis.minRwhCapacityLitres} L ({analysis.minRwhCapacityM3} m³)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">നിർദ്ദിഷ്ട RCC ടാങ്ക് അളവുകൾ:</span>
                      <span className="font-bold">
                        {analysis.suggestedTankLengthM}m × {analysis.suggestedTankWidthM}m × {analysis.suggestedTankDepthM}m
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6B: Sanitary Fixtures */}
                <div className="space-y-1.5">
                  <div className="bg-slate-100 p-1.5 rounded border border-slate-300 font-mono font-bold uppercase text-[10px] flex justify-between">
                    <span>6B. ശുചിത്വ ഉപകരണങ്ങൾ (SANITARY - RULE 74)</span>
                  </div>
                  <div className="border border-slate-300 p-2 rounded text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">ആളുകളുടെ എണ്ണം (Estimated):</span>
                      <span className="font-bold">
                        {data.occupantCount} Persons (M: {analysis.maleCount} / F: {analysis.femaleCount})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ആവശ്യമായ ക്ലോസറ്റുകൾ (WC):</span>
                      <span className="font-bold">
                        {analysis.totalWaterClosets} Nos (Male: {analysis.reqMaleWc} | Female: {analysis.reqFemaleWc})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">യൂറിനലുകൾ & വാഷ് ബേസിൻ:</span>
                      <span className="font-bold">
                        യൂറിനൽ: {analysis.reqUrinals} | വാഷ് ബേസിൻ: {analysis.reqWashBasins}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. ENVIRONMENTAL CLEARANCE & ROOM HEIGHTS */}
              <div className="my-2 space-y-1.5 relative z-10">
                <div className="bg-slate-100 p-1.5 rounded border border-slate-300 font-mono font-bold uppercase text-[10px] flex justify-between">
                  <span>7. പാരിസ്ഥിതിക ദൂരപരിധി & മുറികളുടെ ഉയരം (HYGIENE & ROOM HEIGHT - RULES 33 & 75)</span>
                </div>

                <div className="grid grid-cols-2 gap-2 border border-slate-300 p-2 rounded text-[10px]">
                  <div>
                    <span className="text-slate-500 block">കിണർ - സെപ്റ്റിക് ടാങ്ക് ദൂരപരിധി (Rule 75):</span>
                    <span className="font-bold">നിർദ്ദിഷ്ടം: {data.septicToWellDistanceM}m (കുറഞ്ഞ പരിധി: 7.50m)</span>
                    <span className={`text-[9px] font-bold block ${analysis.septicClearancePass ? "text-emerald-700" : "text-rose-700"}`}>
                      {analysis.septicClearancePass ? "✓ പാരിസ്ഥിതിക അകലം തൃപ്തികരം" : "✗ 7.5 മീറ്റർ അകലമില്ല"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">എയർകണ്ടീഷൻഡ് മുറികളുടെ ഉയരം (Rule 33 & 2026 Gazette):</span>
                    <span className="font-bold">നിർദ്ദിഷ്ടം: {data.acRoomHeightM}m (കുറഞ്ഞ പരിധി: 2.40m)</span>
                    <span className={`text-[9px] font-bold block ${analysis.acHeightPass ? "text-emerald-700" : "text-rose-700"}`}>
                      {analysis.acHeightPass ? "✓ 2026 ഭേദഗതി പ്രകാരം തൃപ്തികരം" : "✗ 2.4 മീറ്ററിൽ താഴെ"}
                    </span>
                  </div>
                </div>
              </div>

              {/* REPORT FOOTER WITH OFFICIAL ENGINEER SIGNATURE & SEAL */}
              <div className="pt-4 border-t-2 border-slate-900 mt-4 relative z-10 space-y-4">
                <div className="text-[9px] text-slate-600 leading-relaxed font-sans">
                  <b>സാക്ഷ്യപത്രം / Statutory Declaration:</b> ഈ കെട്ടിട പ്ലാൻ കേരള പഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ 2019 (KPBR 2019) പ്രകാരവും, 2026 ലെ പുതിയ ഗസറ്റ് ഭേദഗതികൾ (S.R.O. No. 682/2026) പ്രകാരവും തയ്യാറാക്കിയതും, സുരക്ഷ, അഗ്നിശമനം, പാർക്കിംഗ്, മഴവെള്ള സംഭരണം എന്നിവയിലെ എല്ലാ നിബന്ധനകളും പൂർണ്ണമായി പാലിക്കുന്നതുമാണെന്ന് സാക്ഷ്യപ്പെടുത്തുന്നു.
                </div>

                <div className="grid grid-cols-2 pt-3 items-end">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase">അപേക്ഷകന്റെ ഒപ്പ് / Signature of Applicant:</span>
                    <div className="h-8 border-b border-dashed border-slate-400 w-44" />
                    <span className="text-[10px] font-bold block">{data.applicantName}</span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase">ലൈസൻസി എഞ്ചിനീയറുടെ ഒപ്പും സീലും:</span>
                    <div className="h-8 border-b border-dashed border-slate-400 w-44 ml-auto" />
                    <span className="text-[10px] font-bold block">{data.engineerName}</span>
                    <span className="text-[9px] font-mono text-slate-600 block">Reg No: {data.engineerRegNo}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 border-t border-slate-300 pt-1.5">
                  <span>REPORT ID: VASTHUSILPY-KPBR-CONSOLIDATED-{Date.now().toString().slice(-6)}</span>
                  <span>VERIFIED FOR K-SMART LSGD SUBMISSION</span>
                  <span>PAGE 1 OF 1 (A4 FORMAT)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
