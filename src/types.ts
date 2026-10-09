export type PhalamType = "ഉത്തമം" | "മധ്യമം" | "അധമം";

export interface ThachuRow {
  id: number;
  kol: number;
  viral: number;
  chuttuCm: number;
  chuttuMeters: number;
  chuttuFeetInches: string;
  yoni: number;
  yoniName: string;
  vayam: number;
  aayamKol: number;
  aayamViral: number;
  aayamCm: number;
  nakshatram: string;
  nakshatramNazhika: number;
  vayassu: string;
  pakshamTithi: string;
  tithiNazhika: number;
  karanam: string;
  azhcha: string;
  azhchaFullName: string;
  pakshantharaVyayam: number;
  phalam: PhalamType;
  page: number;
}

export interface AttachmentPage {
  pageNumber: number;
  title: string;
  kolRange: string;
  rowCount: number;
  ocrSnippet: string;
}

export type MainSectionType =
  | "home"
  | "construction_works"
  | "estimate"
  | "vasthu"
  | "building_rules"
  | "survey"
  | "civil"
  | "quotation"
  | "ai_agent";

export type BuildingPlanTabType =
  | "building_plan_dashboard"
  | "building_plan_template"
  | "building_plan_multi_arranger"
  | "building_plan_qr_verifier"
  | "building_plan_title_block"
  | "building_plan_north_compass"
  | "building_plan_doors_furniture";

export * from "./types/buildingPlanTemplate";

export type QuotationTabType =
  | "quotation_dashboard"
  | "quotation_create"
  | "quotation_all"
  | "quotation_rates"
  | "quotation_contractors"
  | "quotation_terms";

export type PanchangamTabType =
  | "panchangam_calendar"
  | "panchangam_daily"
  | "panchangam_muhurtham"
  | "panchangam_festivals"
  | "panchangam_choghadiya";

export type AIAgentTabType =
  | "ai_agent_chat"
  | "ai_vastu"
  | "ai_kpbr"
  | "ai_survey"
  | "ai_estimate"
  | "ai_structural"
  | "ai_visual_scanner";

export type HomeTabType = "home_overview" | "all_tools" | "data_storage" | "subscription_requests";
export type AccessLevel = "full" | "preview" | "none";

export interface SubscriptionRequest {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  upiRefId: string;
  amountPaid?: number;
  planName?: string;
  notes?: string;
  requestedAt: string;
  status: SubscriptionStatus;
  validityType: "days" | "date";
  validDays?: number;
  validUntil?: string; // ISO date string (YYYY-MM-DD or ISO)
  approvedAt?: string;
  approvedBy?: string;
  rejectedReason?: string;
  tabPermissions: Record<string, AccessLevel>;
}

export interface SubscriptionUserSession {
  email: string;
  fullName: string;
  phone?: string;
  role: "authorized_user" | "primary_admin";
  subscriptionId?: string;
  validUntil?: string;
  validDays?: number;
  status: SubscriptionStatus;
  tabPermissions: Record<string, AccessLevel>;
  loginTimestamp: number;
}

export type VasthuTabType =
  | "calculator"
  | "agent"
  | "side_finder"
  | "perimeter_vasthu"
  | "table"
  | "room_dimensions"
  | "attachment"
  | "guide";

export type BuildingRulesTabType =
  | "rules_search"
  | "rules_ai_chat"
  | "rules_pdf_viewer"
  | "rules_occupancies"
  | "rules_calculator"
  | "rules_calculators";

export type KsmartTabType =
  | "rules_ksmart"
  | "ksmart_file_tracking"
  | "ksmart_plan_scrutiny"
  | "ksmart_quick_certificates"
  | "ksmart_property_tax";

export type SurveyTabType = "missing_side" | "land_area" | "unit_converters" | "survey_ai_agent";

export type CivilTabType = "brick_masonry" | "concrete_block" | "cement_concrete" | "material_quantity_bbs";

// --- Client Share & Certificates Module Types ---
export interface ClientShareLink {
  id: string; // Unique ID, e.g. "CSL-2026-001"
  token: string; // URL token e.g. "vst-9b8e21a"
  estimateId: string; // Target Estimate ID e.g. "E000003" or "EST-2026-001"
  estimateProjectName: string;
  clientName: string;
  clientPhone?: string;
  houseName?: string;
  location?: string;
  createdAt: string; // ISO date
  expiresAt: string; // ISO date
  durationHours: number; // e.g. 24, 72, 168, 720
  durationLabel: string; // "24 Hours", "3 Days", "7 Days", "30 Days", "Custom"
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  viewsCount: number;
  lastViewedAt?: string;
  allowStageExpenditure: boolean;
  allowWorkItemsBreakdown: boolean;
  allowDownloadPdf: boolean;
  allowEngineerSeal: boolean;
  allowStageCertificate?: boolean;
  allowCompletionCertificate?: boolean;
  progressPercentage?: number; // 0 to 100
  customStageStatus?: string; // e.g. "Ground Floor Lintel Casting in Progress"
  accessPin?: string; // Optional 4-digit PIN
  customNote?: string;
}

export interface CompletedItemRange {
  appendixId: string;
  appendixTitle: string;
  fromSlNo: string | number;
  toSlNo: string | number;
  itemIds: string[];
}

export interface StageCertificateData {
  certificateNo: string;
  issueDate: string;
  inspectionDate: string;
  bankName?: string;
  bankBranch?: string;
  accountOrLoanNo?: string;
  loanAccountNo?: string;
  recipientOrAuthority?: string;
  purpose: string;
  stageName: string;
  selectedItemIds: string[];
  selectedRanges?: CompletedItemRange[];
  completedItemsSummaryText: string;
  itemRangeSummary?: string;
  completedItemsList?: Array<{
    id?: string;
    slNo?: string | number;
    particulars: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
  }>;
  stageExpenditure: number;
  stageValuationAmount?: number;
  stageValuationWords?: string;
  includeContingencyProportion: boolean;
  totalEstimateCost: number;
  remainingBalance: number;
  progressPercentage: number;
  engineerRemarks: string;
  engineerName: string;
  engineerRegNo: string;
  engineerDesignation: string;
  engineerDepartment: string;
  engineerAddress: string;
  engineerPhone?: string;
}

export interface CompletionCertificateData {
  certificateNo: string;
  issueDate: string;
  completionDate: string;
  inspectionDate: string;
  authorityOrBank?: string;
  recipientOrAuthority?: string;
  purpose: string;
  allWorkItemsCompleted: boolean;
  selectedItemIds: string[];
  completedItemsSummaryText: string;
  sanctionedPlinthAreaSqM: number;
  sanctionedPlinthAreaSqFt?: number;
  actualConstructedPlinthAreaSqM: number;
  actualPlinthAreaSqFt?: number;
  buildingPermitNo?: string;
  deviationsObserved: string;
  finalTotalCost: number;
  certificationStatement: string;
  engineerRemarks: string;
  engineerName: string;
  engineerRegNo: string;
  engineerDesignation: string;
  engineerDepartment: string;
  engineerAddress: string;
  engineerPhone?: string;
}

export interface ValuationCertificate {
  id: string; // e.g. "VAL-2026-001"
  certificateNo: string;
  sectionType: "28B" | "28C" | "General";
  
  // Valuer Information
  valuerName: string;
  valuerAddress: string;
  designation: string;
  regNo: string;
  subRegistryOffice: string;
  inspectionDate: string; // YYYY-MM-DD
  
  // Property Owner & Building Details
  ownerName: string;
  ownerAddress: string;
  propertyAddress: string; // Name and Address of the Apartment/Building
  doorNo: string;
  syNo?: string;
  blockNo?: string;
  wardNo?: string;
  villagePanchayat?: string;
  districtPincode?: string;
  yearOfConstruction: number;
  ageOfBuilding: number; // in Years
  
  // Technical Valuation Calculation
  areaSqM: number;
  areaSqFt: number;
  cpwdRatePerSqM: number;
  ratePerSqFtBase: number;
  costIndexName: string;
  costIndex: number;
  ratePerSqFtComputed: number;
  ratePerSqFtAdjusted?: number;
  effectiveRatePerSqFt: number;
  
  // Amounts & Depreciation
  grossStructureValue: number;
  depreciationMethod: "straight_line_1_5" | "custom" | "none";
  depreciationRatePerYear: number; // default 1.5
  depreciationCap: number; // default 75
  totalDepreciationPct: number;
  depreciationAmount: number;
  netStructureValue: number;
  
  // Land / Undivided Share (Optional)
  landAreaCents?: number;
  landFairValuePerCent?: number;
  totalLandValue?: number;
  
  // Grand Totals
  grandTotalValuation: number;
  grandTotalWords: string;
  
  // Description & Certification
  buildingDescription: string;
  place: string;
  certificateDate: string;
  
  // Engineer Seal & Signature
  showSealStamp: boolean;
  engineerSealId?: string;
  engineerPhone?: string;
  engineerEmail?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  status: "DRAFT" | "SUBMITTED" | "FINAL";
}

export type EstimateTabType =
  | "estimate_dashboard"
  | "estimate_sheet"
  | "stage_completion_certificate"
  | "items_of_work"
  | "engineer_seals"
  | "valuation"
  | "estimate_ai_agent";

export type StaffName = "DEEPAK" | "VISHNU" | "DIBIN";

export type ConstructionTabType =
  | "dashboard"
  | "new_construction"
  | "projects"
  | "agreements"
  | "cost_calculator"
  | "payment_stages"
  | "settings"
  | "reports"
  | "search"
  | "construction_dashboard"
  | "construction_new"
  | "construction_projects"
  | "construction_agreements"
  | "construction_cost_calculator"
  | "construction_calculator"
  | "construction_payments"
  | "construction_payment_stages"
  | "construction_settings"
  | "construction_reports"
  | "construction_verify"
  | "construction_search";

export type ConstructionStageMaster = ConstructionStageDefinition;

export type OnlineApplicationsTabType =
  | "online_applications_directory"
  | "online_applications_types";

export type ApplicationFormsTabType =
  | "application_forms_dashboard"
  | "application_forms_fill"
  | "application_forms_builder";

export type TabType =
  | HomeTabType
  | PanchangamTabType
  | AIAgentTabType
  | ConstructionTabType
  | VasthuTabType
  | BuildingRulesTabType
  | KsmartTabType
  | BuildingPlanTabType
  | SurveyTabType
  | CivilTabType
  | EstimateTabType
  | QuotationTabType;

export interface FormFieldDefinition {
  id: string;
  label: string;
  labelEn?: string;
  labelMl?: string;
  key: string;
  type: "text" | "number" | "date" | "checkbox" | "signature" | "textarea" | "select";
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  options?: string[];
  pageNumber: number; // 1-indexed page
  xPercent: number;   // 0 to 100 percentage from left of page
  yPercent: number;   // 0 to 100 percentage from top of page
  widthPercent: number; // 0 to 100 percentage width
  heightPercent?: number; // percentage height (optional, auto or specified)
  fontSizePt?: number; // Font size in points (default: 11)
  alignment?: "left" | "center" | "right"; // Text alignment (default: left)
}

export interface ApplicationFormTemplate {
  id: string;
  name: string;
  nameMl?: string;
  code?: string;
  category: string;
  description?: string;
  pdfFileUrl?: string; // Stored URL or Base64 / data path of source PDF
  pdfUrl?: string;     // Backward compatibility alias
  pdfFileName?: string;
  pdfPageCount?: number;
  fieldSchema?: {
    version: number;
    fields: FormFieldDefinition[];
  };
  fields: FormFieldDefinition[]; // Active fields list
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

export interface FormEntryRecord {
  id: string;
  templateId?: string;  // ID of the template
  formId: string;        // Backward-compatible alias
  formName: string;
  templateName?: string;
  applicantName: string;
  phone?: string;
  email?: string;
  villageOrPanchayat?: string;
  surveyNo?: string;
  status: "Draft" | "Completed" | "Emailed" | "DRAFT" | "COMPLETED" | "SUBMITTED" | "PRINTED" | "MAILED";
  submittedAt: string;
  createdAt?: string;
  updatedAt: string;
  fieldValues?: Record<string, any>;
  values: Record<string, any>;
  lastEmailedTo?: string;
  lastEmailedAt?: string;
  mailedTo?: string[];
  notes?: string;
}

export type QuotationStatus = "draft" | "pending" | "approved" | "expired" | "expiring_soon";

export interface QuotationLineItem {
  id: string;
  service_id?: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  include_material: boolean;
  include_labour: boolean;
  material_rate?: number;
  labour_rate?: number;
  amount: number;
}

export interface QuotationService {
  id: string;
  name: string;
  category?: string;
  unit: string;
  material_rate: number;
  labour_rate: number;
  combined_rate: number;
  last_updated: string;
}

export interface Contractor {
  id: string;
  name: string;
  company_name?: string;
  trade: string;
  phone: string;
  email?: string;
  notes?: string;
  created_at: string;
}

export interface TermsClause {
  id: string;
  order: number;
  title?: string;
  text: string;
  is_default: boolean;
}

export interface QuotationContractorDetails {
  name: string;
  phone?: string;
  trade?: string;
  company?: string;
  email?: string;
  address?: string;
}

export interface CompanyDetails {
  name: string;
  tagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  license_no?: string;
  logo_url?: string;
}

export interface Quotation {
  id: string;
  quotation_no: string;
  status: QuotationStatus;

  // Document Title & Subtitle (fully editable)
  document_title?: string;
  document_subtitle?: string;

  // Optional Company Details
  include_company_details?: boolean;
  company_name?: string;
  company_tagline?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_gstin?: string;

  // Client Details
  client_name: string;
  client_phone: string;
  client_email?: string;
  site_address: string;
  plot_area_sqft?: number | string;

  // Contractor Details (Placed near Client Details)
  contractor_name?: string;
  contractor_phone?: string;
  contractor_trade?: string;
  contractor_company?: string;
  contractor_email?: string;
  contractor_address?: string;

  // Signatory Details
  signatory_name?: string;
  signatory_title?: string;
  signatory_company?: string;

  date_issued: string;
  expiry_date: string;
  line_items: QuotationLineItem[];
  discount_type: "amount" | "percentage";
  discount_value: number;
  discount_amount: number;
  enable_tax: boolean;
  tax_rate: number; // e.g. 18 for 18% GST
  tax_amount: number;
  subtotal: number;
  material_subtotal: number;
  labour_subtotal: number;
  total: number;
  notes: string;
  terms_clause_ids: string[];
  contractor_ids?: string[];
  show_contractors_on_print?: boolean;
  created_at: string;
  updated_at: string;
}

export type ConstructionProjectType = "New Construction" | "Addition" | "Extension" | "Renovation" | "Other";
export type ConstructionRoofingType = "Contemporary" | "Flat Roof" | "Sloped Roof" | "Other";
export type ConstructionFlooringType = "Tile" | "Granite" | "Kavi" | "Advanced / Premium" | "Other";

export interface ClientDetails {
  clientName: string;
  houseName: string;
  address: string;
  mobileNumber: string;
  alternateMobileNumber?: string;
  email?: string;
  panOrIdNumber?: string;
  siteAddress: string;
  localBody: string; // e.g. Keralassery Grama Panchayat
  village: string;
  taluk: string;
  district: string;
  pinCode: string;
}

export interface BuildingLocation {
  fullAddress: string;
  googleMapsUrl?: string;
  latitude?: string;
  longitude?: string;
  siteRemarks?: string;
}

export interface FloorAreaEntry {
  id: string;
  floorName: string; // "Basement", "Ground Floor", "First Floor", "Second Floor", "Roof Terrace / Other"
  existingAreaSqFt?: number;
  proposedAreaSqFt?: number;
  areaSqFt: number;
  ratePerSqFt?: number;
  floorCost?: number;
  remarks?: string;
}

export interface StageChecklistItem {
  id: string;
  title: string;
  titleMl?: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  weight?: number; // percentage or points
}

export interface ConstructionStageDefinition {
  id: string;
  order: number;
  name: string;
  nameMl: string;
  description: string;
  percentage: number; // e.g. 10 for 10%
  defaultPercentage?: number;
  fixedAmount?: number;
  ratePerSqFt?: number;
  calculationMode: "percentage" | "fixed" | "area_rate";
  unit?: string;
  quantity?: number;
  materialSpecification?: string;
  labourIncluded: boolean;
  paymentTrigger?: string;
  displayInAgreement: boolean;
  isActive: boolean;
  defaultChecklist?: string[];
}

export interface PaymentScheduleItem {
  id: string;
  stageId?: string;
  stageName: string;
  stageNameMl?: string;
  percentage: number;
  amount: number;
  status: "PENDING" | "DUE" | "PARTIALLY_PAID" | "PAID";
  dueDate?: string;
  paidAmount: number;
  balance: number;
  paymentDate?: string;
  paidDate?: string;
  paymentRef?: string;
  remarks?: string;
  floorId?: string;
  floorName?: string;
  checklist?: StageChecklistItem[];
  progressPercent?: number;
  isCompleted?: boolean;
  completedDate?: string;
  completedTasksCount?: number;
  totalTasksCount?: number;
}

export interface SanitaryItemSpec {
  id: string;
  name: string;
  nameMl?: string;
  quantity: number;
  unit: string;
  maxAllowedRate: number;
  isIncluded: boolean;
  specification: string;
  remarks?: string;
}

export interface ElectricalPointSpec {
  id: string;
  name: string;
  nameMl?: string;
  pointCount: number;
  unitRate?: number;
  isIncluded: boolean;
  specification: string;
  brand?: string;
  remarks?: string;
}

export interface FlooringAreaSpec {
  id: string;
  areaName: string; // "Sit-out", "Living/Dining", "Kitchen", "Work Area", "Toilet Wall", "Toilet Floor", "Front Steps", "Kitchen Wall Tiles"
  material: string;
  brand: string;
  ratePerSqFt: number;
  areaSqFt: number;
  totalCost: number;
  isIncluded: boolean;
  remarks?: string;
}

export interface CustomSpecItem {
  id: string;
  category: string; // e.g. "Roofing & Insulation", "Waterproofing", "Landscaping", "Security & Automation", "Woodwork"
  title: string;
  titleMl?: string;
  specification: string;
  brand?: string;
  isIncluded: boolean;
  rateOrCost?: number;
  remarks?: string;
}

export interface PaintingSpec {
  interior: { brand: string; coats: number; putty: boolean; primer: boolean; rate?: number; remarks?: string };
  exterior: { brand: string; coats: number; primer: boolean; rate?: number; remarks?: string };
  ceiling: { brand: string; coats: number; rate?: number; remarks?: string };
  woodPolishing: { type: string; coats: number; rate?: number; remarks?: string };
  grills: { paintType: string; coats: number; rate?: number; remarks?: string };
  customItems?: Array<{ id: string; name: string; nameMl?: string; brand: string; coats: number; rate?: number; remarks?: string }>;
}

export interface DoorWindowItemSpec {
  id: string;
  name: string; // "Main Door (Teak)", "Room Doors (Moulded/Wood)", "Bathroom Doors (FRP/PVC)", "Window Frames & Shutters", "MS Grills", "Hardware & Lockset"
  nameMl?: string;
  quantity: number;
  unit: string;
  unitRate: number;
  maxRate?: number;
  isIncluded: boolean;
  specification: string;
  remarks?: string;
}

export interface DetailedWorkSpecifications {
  substructure: {
    siteClearing: string;
    earthExcavation: string;
    soilFilling: string;
    foundation: string;
    foundationMasonry: string;
    basementMasonry: string;
    rccBelt: string;
    cementSpec: string;
    steelSpec: string;
    sandSpec: string;
    additionalNotes?: string;
    customItems?: Array<{ id: string; title: string; titleMl?: string; specification: string; remarks?: string }>;
  };
  superstructure: {
    masonry: string;
    frames: string;
    lintel: string;
    mainRoofSlab: string;
    toiletSlab: string;
    sunshade: string;
    kitchenSlab: string;
    staircase: string;
    plastering: string;
    floorConcrete: string;
    labourSpec: string;
    concreteMaterials: string;
    additionalNotes?: string;
    customItems?: Array<{ id: string; title: string; titleMl?: string; specification: string; remarks?: string }>;
  };
  sanitary: SanitaryItemSpec[];
  electrical: {
    wiring: string;
    cableBrand: string;
    switchBrand: string;
    dbBreakers: string;
    points: ElectricalPointSpec[];
    additionalNotes?: string;
  };
  flooring: FlooringAreaSpec[];
  painting: PaintingSpec;
  doorsWindows: DoorWindowItemSpec[];
  customSpecs?: CustomSpecItem[];
}

export interface GeneralConditionClause {
  id: string;
  clauseNo: number;
  title: string;
  titleMl: string;
  content: string;
  contentMl: string;
  isMandatory: boolean;
  isEnabled: boolean;
  category?: string;
  order?: number;
}

export interface ContractorDetails {
  companyName: string;
  proprietorName: string;
  designation: string;
  address: string;
  phone: string;
  email: string;
  gstNumber?: string;
  licenseNumber?: string;
}

export interface ConstructionExtraWorkItem {
  id: string;
  name: string;
  nameMl?: string;
  description?: string;
  floorOrArea?: string; // e.g. "Front Yard", "Ground Floor", "First Floor Balcony", "Terrace", "Compound"
  category?: "CIVIL" | "INTERIOR" | "ELECTRICAL" | "PLUMBING" | "EXTERIOR" | "OTHER";
  quantity: number;
  unit: string;
  unitRate: number;
  totalAmount: number;
  status?: "PROPOSED" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
  paymentStatus?: "PENDING" | "PARTIALLY_PAID" | "PAID";
  paidAmount?: number;
  balanceAmount?: number;
  isIncluded: boolean;
  remarks?: string;
  addedDate?: string;
  approvedDate?: string;
}

export interface ConstructionAgreement {
  id: string;
  agreementNo: string; // e.g. "CW-2026-00001"
  projectId?: string;
  title: string;
  client: ClientDetails;
  contractor: ContractorDetails;
  location: BuildingLocation;
  projectType: ConstructionProjectType;
  roofingType: ConstructionRoofingType;
  flooringType: ConstructionFlooringType;
  floors: FloorAreaEntry[];
  totalBuiltUpArea: number; // in Sq.Ft
  calculationMode: "SIMPLE" | "DETAILED";
  baseRatePerSqFt: number;
  estimatedConstructionCost: number;
  additionalCosts: number;
  discount: number;
  taxPercent: number;
  taxAmount: number;
  finalContractAmount: number;
  effectiveRatePerSqFt: number;
  amountInWords: string;
  amountInWordsMl?: string;
  paymentSchedule: PaymentScheduleItem[];
  extraWorks?: ConstructionExtraWorkItem[];
  specifications: DetailedWorkSpecifications;
  clauses: GeneralConditionClause[];
  agreementDate: string; // YYYY-MM-DD
  completionPeriodMonths: number;
  completionTargetDate: string;
  place: string;
  witness1?: { name: string; address: string };
  witness2?: { name: string; address: string };
  verificationToken: string; // secure random UUID/token for QR
  qrCodeDataUrl?: string;
  status: "DRAFT" | "GENERATED" | "APPROVED" | "SIGNED" | "ACTIVE" | "COMPLETED" | "ARCHIVED" | "CANCELLED";
  version: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConstructionProject {
  id: string;
  projectNo: string; // e.g. "PRJ-2026-001"
  title: string;
  client: ClientDetails;
  location: BuildingLocation;
  projectType: ConstructionProjectType;
  roofingType: ConstructionRoofingType;
  flooringType: ConstructionFlooringType;
  floors: FloorAreaEntry[];
  totalBuiltUpArea: number;
  baseRatePerSqFt: number;
  finalContractAmount: number;
  effectiveRatePerSqFt: number;
  currentStage: string;
  status: "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "CANCELLED" | "ARCHIVED";
  isArchived?: boolean;
  agreementId?: string;
  totalReceived: number;
  balanceAmount: number;
  progressPercentage: number;
  extraWorks?: ConstructionExtraWorkItem[];
  paymentSchedule?: PaymentScheduleItem[];
  startDate?: string;
  targetCompletionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConstructionAuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entityType: "AGREEMENT" | "PROJECT" | "PAYMENT" | "SETTINGS";
  entityId: string;
  details: string;
}

export interface ConstructionSettings {
  contractor: ContractorDetails;
  stages: ConstructionStageDefinition[];
  defaultRates: {
    baseRatePerSqFt: number;
    flooringRates: Record<string, number>;
    electricalPointRate: number;
    tileRateLimitPerSqFt?: number;
    graniteRateLimitPerSqFt?: number;
  };
  agreementTemplate: {
    defaultCompletionMonths: number;
    place: string;
    clauses: GeneralConditionClause[];
    defaultSpecifications?: DetailedWorkSpecifications;
    numberingPrefix: string;
  };
  printSettings: {
    paperSize: "A4";
    eStampTopMarginMm: number; // default 210mm (~8.3 - 8.5 inches)
    standardTopMarginMm: number; // default 20mm
    leftMarginMm: number; // default 35mm
    rightMarginMm: number; // default 15mm
    bottomMarginMm: number; // default 25mm
  };
}

export interface AgentMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  attachedImage?: string;
  isError?: boolean;
}

export interface FilterState {
  searchTerm: string;
  phalamFilter: "ALL" | PhalamType;
  kolMin: number | null;
  kolMax: number | null;
  nakshatramFilter: string;
  vayassuFilter: string;
  yoniFilter: number | null;
}

// ==========================================
// FILTER & SEARCH DATA STRUCTURES
// ==========================================


