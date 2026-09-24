export type InspectionQuestionType = "yes_no" | "yes_no_na" | "descriptive" | "select" | "number";

export interface InspectionQuestion {
  id: string;
  question: string;
  questionMl?: string;
  type: InspectionQuestionType;
  category: "site_conditions" | "boundaries_access" | "statutory_compliance" | "construction_stage" | "utilities_services" | "custom";
  required?: boolean;
  options?: string[]; // For select type
  helpText?: string;
}

export interface InspectionAnswer {
  questionId: string;
  questionText: string;
  answer: string | boolean | number;
  notes?: string;
}

export interface InspectionMedia {
  id: string;
  type: "photo" | "video";
  url: string; // Base64 data URL or remote cloud URL
  name: string;
  caption?: string;
  size?: number;
  timestamp: string;
}

export interface InspectionGPS {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  mapUrl: string;
  addressSnippet?: string;
  fetchedAt: string;
}

export type InspectionStatus = "draft" | "submitted" | "under_review" | "approved" | "action_required" | "rejected";

export interface SiteInspection {
  id: string;
  inspectionNumber: string; // e.g., "SI-2026-001"
  templateId?: string;
  templateName?: string;
  ownerName: string;
  mobileNumber: string;
  place: string;
  district?: string;
  panchayathMunicipality?: string;
  purpose?: string;
  surveyNumber?: string;
  inspectorName?: string;
  inspectorPhone?: string;
  dateTime: string; // Read-only timestamp generated on open
  submittedAt?: string;
  gps?: InspectionGPS;
  answers: InspectionAnswer[];
  media: InspectionMedia[];
  overallRemarks?: string;
  recommendation?: "proceed" | "clarification_needed" | "reject" | "resurvey";
  status: InspectionStatus;
  emailSentTo?: string;
  whatsAppNotifiedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionTemplate {
  id: string;
  name: string;
  nameMl?: string;
  description: string;
  icon?: string;
  questions: InspectionQuestion[];
  isDefault?: boolean;
}
