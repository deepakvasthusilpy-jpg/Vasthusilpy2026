import { StageCertificateData, CompletionCertificateData, CompletedItemRange } from "../types";
import { getDemoEstimateEST2026003 } from "./demoEstimateData";

export interface EstimateItem {
  id: string;
  slNo?: string;
  particulars: string;
  nos: number;
  length: number;
  breadth: number;
  depth: number;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  remarks?: string;
  isHeader?: boolean;
  isDeduction?: boolean;
  isSubtotal?: boolean;
  isSubItem?: boolean;
  parentItemId?: string;
  isManualQty?: boolean;
}

export interface MergedCellRange {
  id: string;
  startRow: number; // 0-indexed item index in appendix
  endRow: number;   // 0-indexed item index in appendix
  startCol: number; // 0-indexed column index (0 to 9)
  endCol: number;   // 0-indexed column index (0 to 9)
  mergedValue?: string; // Optional custom merged text
}

export interface EstimateAppendix {
  id: string;
  title: string;
  subtitle: string;
  items: EstimateItem[];
  totalAmount: number;
  mergedRanges?: MergedCellRange[];
}

export interface EstimateBlock {
  id: string;
  blockTitle: string;
  appendices: EstimateAppendix[];
  totalAmount: number;
}

export interface EstimateProject {
  id: string; // e.g. "EST-001"
  clientName: string;
  clientPhone: string;
  houseName: string;
  postOffice: string;
  panchayatVillage: string;
  districtPincode: string;
  syNo: string;
  blockNo: string;
  wardNo: string;
  buildingType: string;
  plinthAreaSqFt: number;
  plinthAreaSqM: number;
  preparedBy: string;
  regNo: string;
  showEngineerDetails?: boolean;
  estimationDate: string;
  headlineNarrative: string;
  blocks?: EstimateBlock[];
  appendices?: EstimateAppendix[];
  
  // CPWD Schedule of Rates & Markups
  scheduleOfRatesType?: "CPWD_DSR_2023" | "KPWD_PRICE_2024" | "CPWD_DSR_2021" | "MARKET_RATE_2025";
  hasMarkups?: boolean; // When false, statutory markups & taxes are deleted from the estimate
  includeMarkupsInGrandTotal?: boolean;
  hasUnforeseen?: boolean; // When false, unforeseen expenses are deleted
  totalAmount: number; // Base Civil Structures Total (Direct Cost)
  contractorProfitPercentage?: number; // CPWD: 15% (7.5% profit + 7.5% overhead), KPWD: 10%
  contractorProfitAmount?: number;
  gstPercentage?: number; // 18% Works Contract GST
  gstAmount?: number;
  contingencyPercentage?: number; // 3% - 5% Contingency
  contingencyAmount?: number;
  waterChargesPercentage?: number; // 1% Water & Sanitation Charges
  waterChargesAmount?: number;
  cessPercentage?: number; // 1% Labour Welfare BOCW Cess
  cessAmount?: number;
  costIndexPercentage?: number; // Regional Cost Index
  costIndexAmount?: number;
  totalMarkupsAmount?: number;

  unforeseenDescription?: string;
  unforeseenQty?: string;
  unforeseenAmount?: number;
  grandTotal: number;
  status: "Active" | "Pending" | "Delivered";
  verificationHash: string;
  stageExpenditure: number;
  stageCompletedText: string;
  stageDate: string;
  hasStageCertificate?: boolean;
  hasCompletionCertificate?: boolean;
  stageCertificate?: StageCertificateData;
  completionCertificate?: CompletionCertificateData;
}

export function numberToIndianWords(num: number): string {
  if (!num || isNaN(num)) return "Zero Rupees Only";
  const rounded = Math.round(Math.abs(num));
  if (rounded === 0) return "Zero Rupees Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function formatHundreds(n: number): string {
    let str = "";
    if (n > 99) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n > 0) {
      if (str !== "") str += "and ";
      if (n < 20) {
        str += a[n] + " ";
      } else {
        str += b[Math.floor(n / 10)] + " ";
        if (n % 10 > 0) str += a[n % 10] + " ";
      }
    }
    return str.trim();
  }

  let crore = Math.floor(rounded / 10000000);
  let lakh = Math.floor((rounded % 10000000) / 100000);
  let thousand = Math.floor((rounded % 100000) / 1000);
  let remaining = rounded % 1000;

  let res = "";
  if (crore > 0) res += formatHundreds(crore) + " Crore ";
  if (lakh > 0) res += formatHundreds(lakh) + " Lakh ";
  if (thousand > 0) res += formatHundreds(thousand) + " Thousand ";
  if (remaining > 0) res += formatHundreds(remaining);

  return "Rupees " + res.trim() + " Only";
}

export function generateDefaultStageCertificate(proj: EstimateProject): StageCertificateData {
  const norm = normalizeProjectBlocks(proj);
  const allItems: EstimateItem[] = [];
  norm.appendices.forEach(app => {
    app.items.forEach(it => {
      if (!it.isHeader && !it.isSubtotal) allItems.push(it);
    });
  });

  let defaultSelectedIds: string[] = [];
  if (norm.appendices.length > 0) {
    const firstApp = norm.appendices[0];
    defaultSelectedIds = firstApp.items.filter(i => !i.isHeader && !i.isSubtotal).map(i => i.id);
  }

  const calc = calculateStageValuationFromItemIds(proj, defaultSelectedIds, true);

  return {
    certificateNo: `SC-${proj.id || "EST"}-${new Date().getFullYear()}-01`,
    issueDate: proj.stageDate || new Date().toISOString().split("T")[0],
    inspectionDate: proj.stageDate || new Date().toISOString().split("T")[0],
    recipientOrAuthority: "To Whomsoever It May Concern",
    purpose: "Construction Stage Progress Certification",
    stageName: "Ground Floor Roof Slab Cast & Masonry Stage",
    selectedItemIds: defaultSelectedIds,
    completedItemsSummaryText: proj.stageCompletedText || calc.autoSummaryText,
    stageExpenditure: proj.stageExpenditure || calc.stageValuation,
    includeContingencyProportion: true,
    totalEstimateCost: proj.grandTotal || calc.itemsTotal,
    remainingBalance: Math.max(0, (proj.grandTotal || 0) - (proj.stageExpenditure || calc.stageValuation)),
    progressPercentage: proj.grandTotal > 0 ? Math.round(((proj.stageExpenditure || calc.stageValuation) / proj.grandTotal) * 100) : 0,
    engineerRemarks: "Construction works executed with approved quality materials in strict accordance with the approved plan and building rules.",
    engineerName: proj.preparedBy || "DIBIN D",
    engineerRegNo: proj.regNo || "LSGB/JDPKD/3361/2025-F5/SB",
    engineerDesignation: "Civil Engineer & Registered Supervising Engineer",
    engineerDepartment: "Local Self Government Dept / Urban Affairs, Govt of Kerala",
    engineerAddress: "Vasthusilpy Engineering Consultants, Keralassery, Palakkad - 678641",
    engineerPhone: "+91 94478 90123"
  };
}

export function generateDefaultCompletionCertificate(proj: EstimateProject): CompletionCertificateData {
  const norm = normalizeProjectBlocks(proj);
  const allItemIds: string[] = [];
  norm.appendices.forEach(app => {
    app.items.forEach(it => {
      if (!it.isHeader && !it.isSubtotal) allItemIds.push(it.id);
    });
  });

  return {
    certificateNo: `CC-${proj.id || "EST"}-${new Date().getFullYear()}-01`,
    issueDate: new Date().toISOString().split("T")[0],
    completionDate: new Date().toISOString().split("T")[0],
    inspectionDate: new Date().toISOString().split("T")[0],
    recipientOrAuthority: "The Secretary / Competent Authority",
    authorityOrBank: "The Secretary / Competent Authority",
    purpose: "Building Occupancy & Completion Certificate",
    allWorkItemsCompleted: true,
    selectedItemIds: allItemIds,
    completedItemsSummaryText: "Entire Construction (Items 100% Executed as per Plan)",
    sanctionedPlinthAreaSqM: proj.plinthAreaSqM || 0,
    actualConstructedPlinthAreaSqM: proj.plinthAreaSqM || 0,
    deviationsObserved: "No unauthorized deviations observed. Safe for human occupancy as per statutory specifications.",
    finalTotalCost: proj.grandTotal || 0,
    certificationStatement: `This is to certify that the proposed ${proj.buildingType || "Residential Building"} owned by ${proj.clientName || "Client"} situated in RSy No: ${proj.syNo || ""}, Block No: ${proj.blockNo || ""}, Ward No: ${proj.wardNo || ""} at ${proj.panchayatVillage || ""} has been completed under my direct engineering supervision in accordance with the sanctioned drawings and statutory safety requirements.`,
    engineerRemarks: "All structural and architectural components completed in sound condition. Building is fit for immediate occupation.",
    engineerName: proj.preparedBy || "DIBIN D",
    engineerRegNo: proj.regNo || "LSGB/JDPKD/3361/2025-F5/SB",
    engineerDesignation: "Chartered & Supervising Civil Engineer",
    engineerDepartment: "Local Self Government Dept, Govt of Kerala",
    engineerAddress: "Vasthusilpy Engineering Consultants, Keralassery, Palakkad - 678641",
    engineerPhone: "+91 94478 90123"
  };
}

export function calculateStageValuationFromItemIds(
  proj: EstimateProject,
  selectedItemIds: string[],
  includeContingency = true
): {
  stageValuation: number;
  itemsTotal: number;
  contingencyTotal: number;
  progressPct: number;
  balanceRemaining: number;
  autoSummaryText: string;
} {
  const norm = normalizeProjectBlocks(proj);
  const selectedSet = new Set(selectedItemIds);
  let itemsTotal = 0;
  const summaryParts: string[] = [];

  norm.appendices.forEach((app) => {
    const validItems = app.items.filter((it) => !it.isHeader && !it.isSubtotal);
    const checkedInThisApp = validItems.filter((it) => selectedSet.has(it.id));

    if (checkedInThisApp.length > 0) {
      const appSum = checkedInThisApp.reduce((acc, it) => acc + (it.amount || 0), 0);
      itemsTotal += appSum;

      const slNos = checkedInThisApp.map((it) => it.slNo).filter(Boolean);
      const appTitleShort = app.title.replace(/^APPENDIX\s+[A-Z]\s+/i, "").trim() || app.title;

      if (slNos.length === validItems.length && validItems.length > 0) {
        summaryParts.push(`${appTitleShort} (All Items 1 to ${validItems.length})`);
      } else if (slNos.length > 0) {
        const firstSl = slNos[0];
        const lastSl = slNos[slNos.length - 1];
        if (slNos.length === 1) {
          summaryParts.push(`${appTitleShort} Item No. ${firstSl}`);
        } else {
          summaryParts.push(`${appTitleShort} Item No. ${firstSl} to ${lastSl} (${slNos.length} items)`);
        }
      }
    }
  });

  let contingencyTotal = 0;
  const totalBaseItemsCost = norm.appendices.reduce(
    (sum, app) => sum + (app.totalAmount || 0),
    0
  );

  if (includeContingency && proj.unforeseenAmount && totalBaseItemsCost > 0) {
    const ratio = Math.min(1, itemsTotal / totalBaseItemsCost);
    contingencyTotal = Math.round(proj.unforeseenAmount * ratio);
  }

  const stageValuation = Math.round(itemsTotal + contingencyTotal);
  const progressPct = proj.grandTotal > 0 ? Math.min(100, Math.round((stageValuation / proj.grandTotal) * 100)) : 0;
  const balanceRemaining = Math.max(0, (proj.grandTotal || 0) - stageValuation);

  const autoSummaryText =
    summaryParts.length > 0
      ? summaryParts.join(" and ") + " completed as per Plan & Estimate on site."
      : "Site civil work progress inspected as per Schedule.";

  return {
    stageValuation,
    itemsTotal,
    contingencyTotal,
    progressPct,
    balanceRemaining,
    autoSummaryText
  };
}

export function stripEr(name?: string): string {
  if (!name) return "";
  return name.replace(/^Er\.?\s*/i, "").trim();
}

export function generateAutoHeadlineNarrative(proj: Partial<EstimateProject>): string {
  const building = proj.buildingType || "Residential Building";
  const village = proj.panchayatVillage || "";
  const sy = proj.syNo || "";
  const block = proj.blockNo || "";
  const ward = proj.wardNo || "";
  const client = proj.clientName || "";
  const house = proj.houseName || "";
  const po = proj.postOffice || "";
  const dist = proj.districtPincode || "";
  const sqft = proj.plinthAreaSqFt || 0;
  const sqm = proj.plinthAreaSqM || 0;

  if (!client && !sy) {
    return `Building Estimation of quantity of proposed ${building}`;
  }

  return `Building Estimation of quantity of the proposed ${building}${village ? ` at ${village}` : ""}${sy ? ` in RSy No: ${sy}` : ""}${block ? `, BLOCK No: ${block}` : ""}${ward ? `, WARD NO: ${ward}` : ""}${client ? ` OWNED BY ${client}` : ""}${house ? `, ${house}` : ""}${po ? `, ${po}` : ""}${dist ? `, ${dist}` : ""} (Total Plinth Area: ${sqft} Sq.Ft / ${sqm} Sq.M).`;
}

export function isMainItemWithSubItems(items: EstimateItem[], index: number): boolean {
  if (!items || index < 0 || index >= items.length) return false;
  if (items[index].isSubItem) return false;
  return index + 1 < items.length && Boolean(items[index + 1].isSubItem);
}

export function recalculateAppendixItems(items: EstimateItem[]): EstimateItem[] {
  if (!items || items.length === 0) return [];

  const result: EstimateItem[] = [];
  let currentMainIdx = -1;
  let subItemsForCurrentMain: EstimateItem[] = [];

  const finalizeCurrentMain = () => {
    if (currentMainIdx >= 0) {
      const mainItem = result[currentMainIdx];
      if (subItemsForCurrentMain.length > 0) {
        const sumSubQty = subItemsForCurrentMain.reduce(
          (sum, s) => sum + (Number(s.quantity) || 0),
          0
        );
        const roundedQty = Number(sumSubQty.toFixed(4));
        const mainRate = Number(mainItem.rate) || 0;
        const mainAmount = Math.round(roundedQty * mainRate);
        const mainUnit = mainItem.unit || subItemsForCurrentMain[0]?.unit || "cum";

        result[currentMainIdx] = {
          ...mainItem,
          nos: 0,
          length: 0,
          breadth: 0,
          depth: 0,
          quantity: roundedQty,
          unit: mainUnit,
          rate: mainRate,
          amount: mainAmount
        };
      }
    }
  };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const isDeduct = Boolean(
      item.isDeduction ||
      (typeof item.nos === "number" && item.nos < 0) ||
      (typeof item.quantity === "number" && item.quantity < 0) ||
      (typeof item.particulars === "string" && /^\s*(-|deduct|subtraction|less)\b/i.test(item.particulars))
    );

    if (item.isSubItem) {
      const rawNos = Number(item.nos) || 0;
      const l = Math.abs(Number(item.length) || 0);
      const b = Math.abs(Number(item.breadth) || 0);
      const d = Math.abs(Number(item.depth) || 0);

      const isNegative = isDeduct || rawNos < 0;
      const nosMag = Math.abs(rawNos);
      const effectiveNosMag = nosMag > 0 ? nosMag : (l > 0 || b > 0 || d > 0 ? 1 : 0);
      const sign = isNegative ? -1 : 1;

      let q = Number(item.quantity) || 0;
      if (!item.isManualQty) {
        let mag = 0;
        if (l > 0 && b > 0 && d > 0) {
          mag = effectiveNosMag * l * b * d;
        } else if (l > 0 && b > 0) {
          mag = effectiveNosMag * l * b;
        } else if (l > 0) {
          mag = effectiveNosMag * l;
        } else if (effectiveNosMag > 0) {
          mag = effectiveNosMag;
        }
        q = Number((sign * mag).toFixed(4));
      } else {
        if (isNegative && q > 0) {
          q = -q;
        } else if (!isNegative && q < 0) {
          q = Math.abs(q);
        }
      }

      const processedSub: EstimateItem = {
        ...item,
        isDeduction: isNegative,
        nos: rawNos !== 0 ? (isNegative ? -nosMag : nosMag) : 0,
        length: l,
        breadth: b,
        depth: d,
        quantity: q,
        rate: 0,
        amount: 0
      };
      subItemsForCurrentMain.push(processedSub);
      result.push(processedSub);
    } else {
      finalizeCurrentMain();
      currentMainIdx = result.length;
      subItemsForCurrentMain = [];

      const rawNos = Number(item.nos) || 0;
      const l = Math.abs(Number(item.length) || 0);
      const b = Math.abs(Number(item.breadth) || 0);
      const d = Math.abs(Number(item.depth) || 0);

      const isNegative = isDeduct || rawNos < 0;
      const nosMag = Math.abs(rawNos);
      const effectiveNosMag = nosMag > 0 ? nosMag : (l > 0 || b > 0 || d > 0 ? 1 : 0);
      const sign = isNegative ? -1 : 1;

      let q = Number(item.quantity) || 0;
      if (!item.isManualQty) {
        let mag = 0;
        if (l > 0 && b > 0 && d > 0) {
          mag = effectiveNosMag * l * b * d;
        } else if (l > 0 && b > 0) {
          mag = effectiveNosMag * l * b;
        } else if (l > 0) {
          mag = effectiveNosMag * l;
        } else if (effectiveNosMag > 0) {
          mag = effectiveNosMag;
        }
        q = Number((sign * mag).toFixed(4));
      } else {
        if (isNegative && q > 0) {
          q = -q;
        } else if (!isNegative && q < 0) {
          q = Math.abs(q);
        }
      }
      const r = Number(item.rate) || 0;
      const amt = Math.round(q * r);

      result.push({
        ...item,
        isDeduction: isNegative,
        nos: rawNos !== 0 ? (isNegative ? -nosMag : nosMag) : 0,
        length: l,
        breadth: b,
        depth: d,
        quantity: q,
        rate: r,
        amount: amt
      });
    }
  }

  finalizeCurrentMain();

  return result;
}

export function createNewBlankEstimateProject(
  id = "EST-001",
  clientName = "",
  plinthAreaSqFt = 0
): EstimateProject {
  const todayStr = new Date().toISOString().split("T")[0];
  const plinthAreaSqM = plinthAreaSqFt > 0 ? Number((plinthAreaSqFt * 0.092903).toFixed(2)) : 0;
  return {
    id,
    clientName,
    clientPhone: "",
    houseName: "Residence",
    postOffice: "Keralassery P.O.",
    panchayatVillage: "Keralassery",
    districtPincode: "Palakkad",
    syNo: "100/1",
    blockNo: "1",
    wardNo: "I",
    buildingType: "Residential Building",
    plinthAreaSqFt,
    plinthAreaSqM,
    preparedBy: "DIBIN D",
    regNo: "LSGB/JDPKD/3361/2025-F5/SB",
    estimationDate: todayStr,
    headlineNarrative: "",
    status: "Active",
    verificationHash: `EST-${Date.now().toString(36).toUpperCase()}`,
    stageExpenditure: 0,
    stageCompletedText: "",
    stageDate: todayStr,
    totalAmount: 0,
    scheduleOfRatesType: "CPWD_DSR_2023",
    includeMarkupsInGrandTotal: true,
    contractorProfitPercentage: 15, // 15% CPWD Standard Profit & Overheads
    contractorProfitAmount: 0,
    gstPercentage: 18, // 18% Works Contract GST
    gstAmount: 0,
    contingencyPercentage: 3, // 3% CPWD Standard Contingency
    contingencyAmount: 0,
    waterChargesPercentage: 1, // 1% Water & Sanitation Charges
    waterChargesAmount: 0,
    cessPercentage: 1, // 1% Labour Welfare BOCW Cess
    cessAmount: 0,
    costIndexPercentage: 0,
    costIndexAmount: 0,
    totalMarkupsAmount: 0,
    unforeseenDescription: "Unforeseen Expenses & Contingencies (CPWD Provision)",
    unforeseenQty: "3%",
    unforeseenAmount: 0,
    grandTotal: 0,
    blocks: [
      {
        id: "block_1",
        blockTitle: "BLOCK 1: MAIN RESIDENTIAL BUILDING",
        appendices: [
          {
            id: "app_1",
            title: "APPENDIX A GROUND FLOOR",
            subtitle: "Ground Floor Detailed Quantity Estimate",
            totalAmount: 0,
            items: []
          }
        ],
        totalAmount: 0
      }
    ],
    appendices: [
      {
        id: "app_1",
        title: "APPENDIX A GROUND FLOOR",
        subtitle: "Ground Floor Detailed Quantity Estimate",
        totalAmount: 0,
        items: []
      }
    ]
  };
}

export function normalizeProjectBlocks(project?: EstimateProject): EstimateProject {
  if (!project) {
    return createNewBlankEstimateProject();
  }

  let blocks = project.blocks ? [...project.blocks] : [];

  if (blocks.length === 0) {
    blocks = [
      {
        id: "block_1",
        blockTitle: "BLOCK 1: MAIN RESIDENTIAL BUILDING",
        appendices: project.appendices && project.appendices.length > 0 ? project.appendices : [],
        totalAmount: project.appendices ? project.appendices.reduce((acc, a) => acc + (a.totalAmount || 0), 0) : 0
      }
    ];
  }

  let blocksTotal = 0;
  const calculatedBlocks = blocks.map((blk) => {
    const recalculatedApps = (blk.appendices || []).map((app) => {
      const processedItems = recalculateAppendixItems(app.items || []);
      const itemsTotal = processedItems
        .filter((item) => !item.isSubItem)
        .reduce((acc, item) => acc + (item.amount || 0), 0);

      return {
        ...app,
        items: processedItems,
        totalAmount: itemsTotal
      };
    });
    const blkTotal = recalculatedApps.reduce((acc, app) => acc + app.totalAmount, 0);
    blocksTotal += blkTotal;
    return {
      ...blk,
      appendices: recalculatedApps,
      totalAmount: blkTotal
    };
  });

  const allAppendices = calculatedBlocks.flatMap((b) => b.appendices);
  const baseDirectCost = blocksTotal;

  // CPWD Schedule of Rates & Markups Norms
  const scheduleOfRatesType = project.scheduleOfRatesType || "CPWD_DSR_2023";
  const hasMarkups = project.hasMarkups !== undefined
    ? project.hasMarkups
    : (project.includeMarkupsInGrandTotal !== undefined ? project.includeMarkupsInGrandTotal : true);
  const includeMarkupsInGrandTotal = project.includeMarkupsInGrandTotal !== undefined
    ? project.includeMarkupsInGrandTotal
    : hasMarkups;
  const hasUnforeseen = project.hasUnforeseen !== undefined
    ? project.hasUnforeseen
    : (project.unforeseenAmount !== undefined ? (project.unforeseenAmount > 0 || (project.contingencyPercentage ?? 3) > 0) : true);

  // If percentage is undefined or null (e.g. legacy stored project), provide default CPWD rates only if markups are enabled
  const contractorProfitPercentage = project.contractorProfitPercentage !== undefined
    ? project.contractorProfitPercentage
    : (hasMarkups ? 15 : 0);
  const gstPercentage = project.gstPercentage !== undefined
    ? project.gstPercentage
    : (hasMarkups ? 18 : 0);
  const contingencyPercentage = project.contingencyPercentage !== undefined
    ? project.contingencyPercentage
    : (hasMarkups ? 3 : 0);
  const waterChargesPercentage = project.waterChargesPercentage !== undefined
    ? project.waterChargesPercentage
    : (hasMarkups ? 1 : 0);
  const cessPercentage = project.cessPercentage !== undefined
    ? project.cessPercentage
    : (hasMarkups ? 1 : 0);
  const costIndexPercentage = project.costIndexPercentage !== undefined
    ? project.costIndexPercentage
    : 0;

  // Calculate live monetary amounts for each markup element
  const contractorProfitAmount = hasMarkups ? Math.round((baseDirectCost * contractorProfitPercentage) / 100) : 0;
  const waterChargesAmount = hasMarkups ? Math.round((baseDirectCost * waterChargesPercentage) / 100) : 0;
  const costIndexAmount = hasMarkups ? Math.round((baseDirectCost * costIndexPercentage) / 100) : 0;
  const cessAmount = hasMarkups ? Math.round((baseDirectCost * cessPercentage) / 100) : 0;

  let contingencyAmount = 0;
  if (hasMarkups && contingencyPercentage > 0) {
    contingencyAmount = Math.round((baseDirectCost * contingencyPercentage) / 100);
  } else if (hasUnforeseen && project.unforeseenAmount !== undefined) {
    contingencyAmount = project.unforeseenAmount;
  } else {
    contingencyAmount = 0;
  }

  // Base for GST (Civil Direct + CP&OH + Water + Cost Index)
  const baseForGst = baseDirectCost + contractorProfitAmount + waterChargesAmount + costIndexAmount;
  const gstAmount = hasMarkups ? Math.round((baseForGst * gstPercentage) / 100) : 0;

  const totalMarkupsAmount = hasMarkups
    ? (contractorProfitAmount + waterChargesAmount + costIndexAmount + gstAmount + (contingencyPercentage > 0 ? contingencyAmount : 0) + cessAmount)
    : 0;

  const directUnforeseen = (hasUnforeseen && !hasMarkups) ? (project.unforeseenAmount || 0) : 0;

  // Grand Total Calculation
  const grandTotal = (hasMarkups && includeMarkupsInGrandTotal)
    ? (baseDirectCost + totalMarkupsAmount + (hasUnforeseen && contingencyPercentage === 0 ? (project.unforeseenAmount || 0) : 0))
    : (baseDirectCost + (hasUnforeseen ? (contingencyAmount || directUnforeseen) : 0));

  // Check whether 100% of stage works are completed before enabling completion certificate
  const isAllStageWorksDone = isProject100PercentStageCompletedDirect({
    ...project,
    blocks: calculatedBlocks,
    appendices: allAppendices,
    grandTotal
  });

  return {
    ...project,
    blocks: calculatedBlocks,
    appendices: allAppendices,
    totalAmount: baseDirectCost,
    scheduleOfRatesType,
    hasMarkups,
    includeMarkupsInGrandTotal,
    hasUnforeseen,
    contractorProfitPercentage,
    contractorProfitAmount,
    gstPercentage,
    gstAmount,
    contingencyPercentage,
    contingencyAmount,
    waterChargesPercentage,
    waterChargesAmount,
    cessPercentage,
    cessAmount,
    costIndexPercentage,
    costIndexAmount,
    totalMarkupsAmount,
    unforeseenDescription: project.unforeseenDescription || "Unforeseen Expenses & Contingencies (CPWD Provision)",
    unforeseenQty: project.unforeseenQty || (contingencyPercentage > 0 ? `${contingencyPercentage}%` : "LSM"),
    unforeseenAmount: hasUnforeseen ? (contingencyAmount || directUnforeseen) : 0,
    grandTotal: grandTotal,
    hasStageCertificate: project.hasStageCertificate !== undefined ? project.hasStageCertificate : true,
    hasCompletionCertificate: isAllStageWorksDone && (project.hasCompletionCertificate !== false)
  };
}

/**
 * Completely removes/deletes all CPWD/PWD Markups & Taxes from the estimate.
 * The Grand Total becomes purely the base direct civil works cost.
 */
export function deleteProjectMarkups(project: EstimateProject): EstimateProject {
  const updated: EstimateProject = {
    ...project,
    hasMarkups: false,
    includeMarkupsInGrandTotal: false,
    contractorProfitPercentage: 0,
    contractorProfitAmount: 0,
    gstPercentage: 0,
    gstAmount: 0,
    contingencyPercentage: 0,
    contingencyAmount: 0,
    waterChargesPercentage: 0,
    waterChargesAmount: 0,
    cessPercentage: 0,
    cessAmount: 0,
    costIndexPercentage: 0,
    costIndexAmount: 0,
    totalMarkupsAmount: 0,
    unforeseenAmount: 0,
    hasUnforeseen: false
  };
  return normalizeProjectBlocks(updated);
}

/**
 * Restores official CPWD standard markups (15% CP&OH, 18% GST, 3% Contingency, 1% Water, 1% Cess).
 */
export function restoreCPWDMarkups(project: EstimateProject): EstimateProject {
  const updated: EstimateProject = {
    ...project,
    hasMarkups: true,
    includeMarkupsInGrandTotal: true,
    hasUnforeseen: true,
    scheduleOfRatesType: "CPWD_DSR_2023",
    contractorProfitPercentage: 15,
    gstPercentage: 18,
    contingencyPercentage: 3,
    waterChargesPercentage: 1,
    cessPercentage: 1,
    costIndexPercentage: 0
  };
  return normalizeProjectBlocks(updated);
}

/**
 * Deletes a single specific markup from the estimate.
 */
export function deleteIndividualMarkup(
  project: EstimateProject,
  markupKey: "contractorProfit" | "gst" | "contingency" | "water" | "cess" | "costIndex" | "unforeseen"
): EstimateProject {
  const updated: EstimateProject = { ...project };

  switch (markupKey) {
    case "contractorProfit":
      updated.contractorProfitPercentage = 0;
      updated.contractorProfitAmount = 0;
      break;
    case "gst":
      updated.gstPercentage = 0;
      updated.gstAmount = 0;
      break;
    case "contingency":
      updated.contingencyPercentage = 0;
      updated.contingencyAmount = 0;
      break;
    case "water":
      updated.waterChargesPercentage = 0;
      updated.waterChargesAmount = 0;
      break;
    case "cess":
      updated.cessPercentage = 0;
      updated.cessAmount = 0;
      break;
    case "costIndex":
      updated.costIndexPercentage = 0;
      updated.costIndexAmount = 0;
      break;
    case "unforeseen":
      updated.hasUnforeseen = false;
      updated.unforeseenAmount = 0;
      break;
  }

  return normalizeProjectBlocks(updated);
}

/**
 * Direct check for stage completion without calling normalizeProjectBlocks recursively.
 */
function isProject100PercentStageCompletedDirect(project: EstimateProject | null | undefined): boolean {
  if (!project) return false;
  
  const allItems: EstimateItem[] = [];
  (project.appendices || []).forEach((app) => {
    (app.items || []).forEach((it) => {
      if (!it.isHeader && !it.isSubtotal) {
        allItems.push(it);
      }
    });
  });

  const totalItemCount = allItems.length;
  const selectedIds = project.stageCertificate?.selectedItemIds || [];
  const selectedCount = selectedIds.length;
  const progressPct = project.stageCertificate?.progressPercentage ?? 
    (project.grandTotal > 0 && project.stageExpenditure > 0 ? Math.round((project.stageExpenditure / project.grandTotal) * 100) : 0);

  if (totalItemCount > 0) {
    if (selectedCount >= totalItemCount) {
      const selectedSet = new Set(selectedIds);
      const allSelected = allItems.every((it) => selectedSet.has(it.id));
      if (allSelected) return true;
    }
    if (progressPct >= 100 && selectedCount >= totalItemCount) {
      return true;
    }
    return false;
  }

  return progressPct >= 100 || (project.stageExpenditure > 0 && project.grandTotal > 0 && project.stageExpenditure >= project.grandTotal);
}

/**
 * Checks whether 100% of works under the stage certificate have been completed for an EstimateProject.
 * Under Kerala LSGD statutory rules, a completion certificate CANNOT be created, saved,
 * viewed in client view, or scanned via estimate QR code until this returns true.
 */
export function isProject100PercentStageCompleted(project: EstimateProject | null | undefined): boolean {
  if (!project) return false;
  return isProject100PercentStageCompletedDirect(project);
}

export const INITIAL_PRESETS_ENGINEERS = [
  {
    id: "blank_engineer",
    fullName: "",
    designation: "",
    regNo: "",
    department: "",
    houseAddress: "",
    districtPincode: "",
    email: "",
    phones: "",
    colorScheme: "slate"
  },
  {
    id: "pradeep",
    fullName: "Pradeep ck",
    designation: "Licenced Building Engineer –A",
    regNo: "E-2050/08/12212/KKD/197/2018/EA",
    department: "Department of Urban Affairs, Govt. of Kerala",
    houseAddress: "Kanjirani (H), Parakkad, Kalladikode",
    districtPincode: "678596",
    email: "",
    phones: "",
    colorScheme: "slate"
  },
  {
    id: "dibin",
    fullName: "DIBIN D",
    designation: "SUPERVISOR-B",
    regNo: "LSGB/JDPKD/3361/2025-F5/SB",
    department: "Local Self Government Dept",
    houseAddress: "Deepak House, Keralassery (P.O)",
    districtPincode: "Palakkad, Pin-678641",
    email: "dibindeepak1@gmail.com",
    phones: "9567627277, 7012383137",
    colorScheme: "emerald"
  },
  {
    id: "deepak",
    fullName: "DEEPAK .C",
    designation: "Licensed Building SUPERVISOR-A",
    regNo: "E-2050/08/14087/KKD/318/2018/CA",
    department: "Dept of Urban Affairs, Govt of Kerala",
    houseAddress: "Deepak House, Keralassery P.O",
    districtPincode: "Palakkad -678 641",
    email: "dibindeepak1@gmail.com",
    phones: "7012383137, 9747995961",
    colorScheme: "blue"
  }
];

import {
  filterOutDeletedRecords,
  isRecordDeleted,
  recordGlobalDeletion,
  getGlobalDeletedIds
} from "../utils/deletionRegistry";

export const DEFAULT_ESTIMATE_PROJECT: EstimateProject = getDemoEstimateEST2026003();

export const INITIAL_ESTIMATES_LIST: EstimateProject[] = [];

export const LOCAL_STORAGE_ESTIMATES_KEY = "vasthusilpy_estimates";

/**
 * Loads saved estimate projects from localStorage, respecting deleted items.
 * Once deleted, no demo data will ever be resurrected.
 */
export function loadSavedEstimates(): EstimateProject[] {
  try {
    const deletedIds = getGlobalDeletedIds();
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_ESTIMATES_KEY) : null;
    const isInitialized = typeof localStorage !== "undefined" ? localStorage.getItem("vasthusilpy_estimates_initialized_v2") : null;

    let list: EstimateProject[] = [];

    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        list = filterOutDeletedRecords(parsed)
          .filter((p: EstimateProject) => !deletedIds.includes(p.id) && !isRecordDeleted(p.id))
          .map((p) => {
            const norm = normalizeProjectBlocks(p);
            const c = (norm.clientName || "").toLowerCase();
            if ((c.includes("dasan") && c.includes("preetha")) || c === "1. dasan 2. preetha (copy)" || c === "1. dasan 2. preetha" || c.startsWith("1. dasan")) {
              norm.clientName = "Client 1";
              if (norm.headlineNarrative) {
                norm.headlineNarrative = norm.headlineNarrative
                  .replace(/1\.\s*DASAN\s*2\.\s*PREETHA(\s*\(Copy\))?/gi, "Client 1")
                  .replace(/DASAN(\s*(&|and)?\s*PREETHA)?/gi, "Client 1");
              }
              if (norm.completionCertificate?.certificationStatement) {
                norm.completionCertificate.certificationStatement = norm.completionCertificate.certificationStatement
                  .replace(/1\.\s*DASAN\s*2\.\s*PREETHA(\s*\(Copy\))?/gi, "Client 1")
                  .replace(/DASAN(\s*(&|and)?\s*PREETHA)?/gi, "Client 1");
              }
            }
            return norm;
          });
      }
    }

    if (!isInitialized) {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("vasthusilpy_estimates_initialized_v2", "true");
        localStorage.setItem(LOCAL_STORAGE_ESTIMATES_KEY, JSON.stringify(list));
      }
      return list;
    }

    return list;
  } catch (e) {
    console.warn("Could not load estimates from localStorage:", e);
  }
  return [];
}

/**
 * Persists estimate projects list to localStorage.
 */
export function saveEstimates(projects: EstimateProject[]): void {
  try {
    const deletedIds = getGlobalDeletedIds();
    const filtered = filterOutDeletedRecords(projects).filter((p) => !deletedIds.includes(p.id) && !isRecordDeleted(p.id));

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_ESTIMATES_KEY, JSON.stringify(filtered));
      localStorage.setItem("vasthusilpy_estimates_initialized_v2", "true");
      window.dispatchEvent(new Event("vasthusilpy_storage_update"));
    }
  } catch (e) {
    console.error("Failed to save estimates to localStorage:", e);
  }
}

/**
 * Generates a guaranteed unique and non-colliding Estimate Number / ID.
 */
export function generateUniqueEstimateNumber(
  existingProjects: EstimateProject[],
  sourceId?: string
): string {
  const existingIds = new Set(existingProjects.map((p) => (p.id || "").trim().toUpperCase()));
  const currentYear = new Date().getFullYear();

  if (sourceId && /^E\d+$/i.test(sourceId.trim())) {
    let maxNum = 0;
    existingProjects.forEach((p) => {
      const match = p.id.match(/^E(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    let nextNum = maxNum + 1;
    let candidate = `E${String(nextNum).padStart(6, "0")}`;
    while (existingIds.has(candidate.toUpperCase())) {
      nextNum++;
      candidate = `E${String(nextNum).padStart(6, "0")}`;
    }
    return candidate;
  }

  let maxSeq = 0;
  existingProjects.forEach((p) => {
    const estMatch = p.id.match(/EST-(\d{4})-(\d+)/i);
    if (estMatch) {
      const seq = parseInt(estMatch[2], 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    } else {
      const numMatch = p.id.match(/\d+/g);
      if (numMatch) {
        const lastNum = parseInt(numMatch[numMatch.length - 1], 10);
        if (!isNaN(lastNum) && lastNum > maxSeq) maxSeq = lastNum;
      }
    }
  });

  let nextSeq = Math.max(maxSeq + 1, existingProjects.length + 1);
  let candidate = `EST-${currentYear}-${String(nextSeq).padStart(3, "0")}`;
  while (existingIds.has(candidate.toUpperCase())) {
    nextSeq++;
    candidate = `EST-${currentYear}-${String(nextSeq).padStart(3, "0")}`;
  }
  return candidate;
}

/**
 * Deep clones an EstimateProject with completely new block/appendix/item IDs,
 * new verification hash, new estimation date, and specified new ID.
 */
export function deepCloneEstimateProject(
  source: EstimateProject,
  newId: string,
  customClientName?: string
): EstimateProject {
  const norm = normalizeProjectBlocks(source);
  const now = Date.now();
  const todayStr = new Date().toISOString().split("T")[0];

  const clonedBlocks = (norm.blocks || []).map((block, bIdx) => ({
    ...block,
    id: `block_${now}_${bIdx}_${Math.random().toString(36).substring(2, 7)}`,
    appendices: (block.appendices || []).map((app, aIdx) => ({
      ...app,
      id: `app_${now}_${bIdx}_${aIdx}_${Math.random().toString(36).substring(2, 7)}`,
      items: (app.items || []).map((item, iIdx) => ({
        ...item,
        id: `item_${now}_${bIdx}_${aIdx}_${iIdx}_${Math.random().toString(36).substring(2, 7)}`
      }))
    }))
  }));

  const clonedAppendices = (norm.appendices || []).map((app, aIdx) => ({
    ...app,
    id: `app_${now}_${aIdx}_${Math.random().toString(36).substring(2, 7)}`,
    items: (app.items || []).map((item, iIdx) => ({
      ...item,
      id: `item_${now}_${aIdx}_${iIdx}_${Math.random().toString(36).substring(2, 7)}`
    }))
  }));

  const clientName =
    customClientName ||
    (norm.clientName.includes("(Copy)")
      ? norm.clientName
      : `${norm.clientName} (Copy)`);

  return {
    ...JSON.parse(JSON.stringify(norm)),
    id: newId,
    clientName,
    estimationDate: todayStr,
    verificationHash: `VER-${newId.replace(/[^a-zA-Z0-9]/g, "")}-${Date.now().toString(36).toUpperCase()}`,
    status: "Active",
    blocks: clonedBlocks,
    appendices: clonedAppendices,
    stageExpenditure: 0,
    stageDate: todayStr
  };
}
