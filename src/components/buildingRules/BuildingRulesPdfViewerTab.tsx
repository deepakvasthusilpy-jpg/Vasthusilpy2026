import React, { useState, useMemo, useEffect } from "react";
import {
  BookOpen,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  ExternalLink,
  ShieldCheck,
  Bot,
  Upload,
  Bookmark,
  Layers,
  Eye,
  FolderOpen,
  Sun,
  Moon,
  Book,
  Plus,
  Trash2,
  StickyNote,
  X,
  Sparkles,
  Link as LinkIcon,
  Check,
  AlertCircle,
  Globe
} from "lucide-react";

export interface PdfNote {
  id: string;
  pageNumber: number;
  text: string;
  createdAt: string;
  author?: string;
}

export interface PdfBookmark {
  id: string;
  pageNumber: number;
  title: string;
  createdAt: string;
}

export interface PdfDocumentMeta {
  id: string;
  title: string;
  titleMl: string;
  subtitle: string;
  category: "KPBR 2026 Amendment" | "KPBR 2019/2026 Book Edition" | "Amendments" | "KSMART" | "Custom";
  totalPages: number;
  fileSize: string;
  publishedDate: string;
  isOfficialGazette: boolean;
  description: string;
  pdfFileUrl?: string; // Blob or Data URL or direct PDF URL
  driveUrl?: string; // Google Drive share/view URL
  notebookMlUrl?: string; // NotebookML URL
  notes?: PdfNote[];
  bookmarks?: PdfBookmark[];
  pages: { pageNumber: number; title: string; contentMl: string; contentEn: string }[];
  chapters: { title: string; page: number; summary: string }[];
}

// Helper to format Google Drive & Google Cloud URLs into embeddable /preview links
export const formatDrivePreviewUrl = (url?: string): string => {
  if (!url) return "";
  if (url.includes("drive.google.com")) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }
  if (url.includes("docs.google.com/document/d/")) {
    const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://docs.google.com/document/d/${match[1]}/preview`;
    }
  }
  return url;
};

// Default Official Gazette Document (SRO No. 682/2026)
const GAZETTE_2026_DOC: PdfDocumentMeta = {
  id: "sro-682-2026-gazette",
  title: "G.O.(P) No.36/2026/LSGD - S.R.O. No. 682/2026",
  titleMl: "കേരള ഗസറ്റ് അസാധാരണം - കേരള പഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ (ഭേദഗതി) ചട്ടങ്ങൾ 2026",
  subtitle: "Official Gazette Extraordinary No. 2219 • Dated 04th August 2026",
  category: "KPBR 2026 Amendment",
  totalPages: 2,
  fileSize: "1.8 MB",
  publishedDate: "04 August 2026",
  isOfficialGazette: true,
  description: "2026 ആഗസ്റ്റ് 04 തീയതിയിലെ ഒഫീഷ്യൽ ഗസറ്റ് നോട്ടിഫിക്കേഷൻ (S.R.O. No. 682/2026). സിംഗിൾ ഫാമിലി റെസിഡൻഷ്യൽ കെട്ടിടങ്ങളുടെ ഫ്രണ്ട് യാർഡ് സെറ്റ്ബാക്ക്, എയർ കണ്ടീഷൻഡ് മുറികളുടെ ഉയരം എന്നിവയിലെ ഭേദഗതികൾ.",
  notes: [
    {
      id: "note-1",
      pageNumber: 2,
      text: "Rule 26 Front setback reduced to 2.0m for single family residential plots abutting unnotified road <6m.",
      createdAt: "2026-08-05",
      author: "DEEPAK"
    }
  ],
  bookmarks: [
    {
      id: "bm-1",
      pageNumber: 2,
      title: "Rule 26 & Rule 33 Amendments",
      createdAt: "2026-08-05"
    }
  ],
  chapters: [
    { title: "Page 1: Government Notification & SRO No. 682/2026", page: 1, summary: "Kerala Gazette Extraordinary Cover & Preamble under Kerala Panchayat Raj Act 1994" },
    { title: "Page 2: Rule 26 & Rule 33 Amendments (Front Yard & AC Height)", page: 2, summary: "Single family plots on roads <6m front yard reduced to 2m; Air conditioned rooms clear height 2.4m minimum" }
  ],
  pages: [
    {
      pageNumber: 1,
      title: "Government of Kerala - Notification GO(P) No. 36/2026/LSGD",
      contentMl: `കേരള ഗസറ്റ് അസാധാരണം
EXTRAORDINARY - PUBLISHED BY AUTHORITY
Regn. No. KERBIL/2012/45073 dated 05-09-2012
തിരുവനന്തപുരം, ചൊവ്വ | 2026 ആഗസ്റ്റ് 04 (1948 ശ്രാവണം 13) | നമ്പർ 2219

GOVERNMENT OF KERALA
Local Self Government (RD) Department
NOTIFICATION
G.O. (P) No. 36/2026/LSGD Dated, Thiruvananthapuram, 2nd August, 2026
S.R.O. No. 682/2026

In exercise of the powers conferred by sections 235A, 235B, 235F, 235P, 235W read with section 254 of the Kerala Panchayat Raj Act, 1994 (13 of 1994), the Government of Kerala hereby make the following rules further to amend the Kerala Panchayat Building Rules, 2019...`,
      contentEn: `KERALA GAZETTE EXTRAORDINARY
G.O. (P) No. 36/2026/LSGD Dated 02 August 2026 / Published 04 August 2026. S.R.O. No. 682/2026.
Issued under Kerala Panchayat Raj Act 1994 to amend KPBR 2019.`
    },
    {
      pageNumber: 2,
      title: "Kerala Panchayat Building (Amendment) Rules, 2026 - Rules 1 & 2",
      contentMl: `RULES
1. Short title and commencement.— (1) These Rules may be called the Kerala Panchayat Building (Amendment) Rules, 2026.
(2) They shall come into force at once.

2. Amendment of the Rules.— In the Kerala Panchayat Building Rules, 2019,—
(1) In rule 26, in sub-rule (4), after the note, the following shall be inserted as first proviso and second proviso, namely:—
"Provided further that for single family residential buildings in plots abutting unnotified road with width less than 6 meters, the front yard shall not be less than 2 meters"
"Provided also that any one yard other than front yard of a building referred in column (2) and (3) in Table 4 can be reduced upto 50 centimeters if there is no opening on that side".

(2) In rule 33, the following proviso shall be inserted, namely:—
"Provided that in the case of air conditioned rooms it shall not be less than 2.4 metres".

By order of the Governor,
Tinku Biswal,
Principal Secretary to Government.`,
      contentEn: `Rule 26 Amendment:
- Front yard for single family residential building abutting unnotified road (<6m width): Minimum 2.0 meters.
- Side/Rear yard (one yard other than front yard): Can be reduced to 50 cm if no opening on that side.

Rule 33 Amendment:
- Air conditioned rooms clear height requirement: Minimum 2.4 metres.`
    }
  ]
};

// Default Bilingual Book Edition (KPBR 2019/2026 - 446 Pages)
const BOOK_2026_DOC: PdfDocumentMeta = {
  id: "kpbr-2026-bilingual-book",
  title: "Kerala Panchayat Building Rules, 2019 (2026 Bilingual Book Edition)",
  titleMl: "കേരള പഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ, 2019 (മലയാളം & ഇംഗ്ലീഷ് ബഹുഭാഷാ പതിപ്പ് - 2026 Edition)",
  subtitle: "Complete Law Book Edition • As amended by SRO No. 1241/2025 & SRO 682/2026",
  category: "KPBR 2019/2026 Book Edition",
  totalPages: 446,
  fileSize: "48.5 MB",
  publishedDate: "2026 Law Edition",
  isOfficialGazette: false,
  description: "തദ്ദേശ സ്വയംഭരണ വകുപ്പ് പുറപ്പെടുവിച്ച കേരള പഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ ചട്ടങ്ങളുടെയും ഭേദഗതികളുടെയും സമ്പൂർണ്ണ നിയമ പുസ്തകം. വിജ്ഞാപനങ്ങൾ, അധ്യായങ്ങൾ 1-23, ഫോമുകൾ, ചട്ടങ്ങൾ, സി.ആർ.സെഡ് മാനദണ്ഡങ്ങൾ എന്നിവ അടങ്ങിയിരിക്കുന്നു.",
  driveUrl: "https://drive.google.com/file/d/1A2B3C4D5E6F_KPBR_Book/preview",
  notes: [
    {
      id: "note-book-1",
      pageNumber: 83,
      text: "Chapter 3 Rule 25 Setback matrix: Check Table 4 for plot area & road width clearances.",
      createdAt: "2026-08-01",
      author: "VISHNU"
    }
  ],
  bookmarks: [
    { id: "bm-b1", pageNumber: 1, title: "Cover Page & Table of Contents", createdAt: "2026-08-01" },
    { id: "bm-b2", pageNumber: 83, title: "Chapter 3: Setbacks & Coverage", createdAt: "2026-08-01" },
    { id: "bm-b3", pageNumber: 243, title: "Chapter 5: Parking Standards", createdAt: "2026-08-01" }
  ],
  chapters: [
    { title: "അധ്യായം 1: നിർവ്വചനങ്ങൾ (Rules 1 - 3)", page: 1, summary: "ചുരുക്കപ്പേര്, വ്യാപ്തി, റൂൾ 2 ആധാര നിർവ്വചനങ്ങൾ (Plinth, FAR, Setback, Low-Risk)" },
    { title: "അധ്യായം 2: പ്ലാനുകളും അപേക്ഷകളും (Rules 4 - 15)", page: 29, summary: "ഡ്രോയിംഗുകൾ, അനുമതി പത്രം, കെ-സ്മാർട്ട് സ്വയം സാക്ഷ്യപ്പെടുത്തൽ (Self-Certification)" },
    { title: "അധ്യായം 3: കെട്ടിട നിബന്ധനകൾ & സെറ്റ്ബാക്കുകൾ (Rules 16 - 28)", page: 83, summary: "റോഡ് വീതി, തറ വിസ്തീർണ്ണ സൂചിക (FAR), ഉയരം, ഫ്രണ്ട്/സൈഡ്/റിയർ സെറ്റ്ബാക്കുകൾ" },
    { title: "അധ്യായം 4: ഉപയോഗ ഗണങ്ങൾ A1 മുതൽ J വരെ (Rules 29 - 35)", page: 173, summary: "പാർപ്പിടം, കമേഴ്സ്യൽ, അസംബ്ലി, ഇൻഡസ്ട്രിയൽ ഓഫീസ് ഗണങ്ങൾ" },
    { title: "അധ്യായം 5: പാർക്കിംഗ് & സാനിറ്റേഷൻ (Rules 36 - 42)", page: 243, summary: "വാഹന പാർക്കിംഗ് വിസ്തീർണ്ണം, സെപ്റ്റിക് ടാങ്ക് ദൂരം, ശുചിമുറി കണക്കുകൾ" },
    { title: "അധ്യായം 6: ഫയർ & എമർജൻസി എക്സിറ്റുകൾ (Rules 43 - 52)", page: 287, summary: "ഫയർ എൻജിൻ വഴി, കോണിപ്പടികൾ, സ്റ്റെയർകേസ് സാങ്ഷൻ" },
    { title: "അനുബന്ധങ്ങൾ & ഫോമുകൾ (Appendices A1 - H3)", page: 422, summary: "അപേക്ഷാ ഫോമുകൾ, എഞ്ചിനീയർ യോഗ്യതകൾ, ഫീസ് വിവര പട്ടികകൾ (Schedule I-III)" },
    { title: "CRZ വിജ്ഞാപനങ്ങൾ & നെൽവയൽ സംരക്ഷണ നിയമം 2008", page: 440, summary: "കോസ്റ്റൽ റെഗുലേഷൻ സോൺ ചട്ടങ്ങളും നെൽവയൽ ക്രമവൽക്കരണ സർക്കുലറുകളും" }
  ],
  pages: Array.from({ length: 446 }, (_, i) => {
    const pageNum = i + 1;
    if (pageNum === 1) {
      return {
        pageNumber: 1,
        title: "Cover Page - Kerala Panchayat Building Rules, 2019 (2026 Edition)",
        contentMl: `കേരള പഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ, 2019
KERALA PANCHAYAT BUILDING RULES, 2019
(Malayalam & English Version - Bilingual Edition)
As amended by SRO No. 1241/2025 dt. 29-10-2025 & SRO No. 682/2026 dt. 04-08-2026

Along with:
• NOTIFICATION OF CATEGORY-I & II VILLAGE PANCHAYATS
• കേരള പഞ്ചായത്ത് രാജ് കെട്ടിട (അനധികൃത നിർമ്മാണങ്ങളുടെ ക്രമവൽക്കരണം) ചട്ടങ്ങൾ, 2024
• COASTAL REGULATION ZONE NOTIFICATION, 2019
• കേരള നെൽവയൽ - തണ്ണീർത്തട സംരക്ഷണ നിയമവും ചട്ടങ്ങളും
• IMPORTANT GOVT. ORDERS AND CIRCULARS

2026 Edition • VASTHUSILPY DIGITAL LAW LIBRARY`,
        contentEn: `KERALA PANCHAYAT BUILDING RULES, 2019 (Bilingual Edition - 2026 Law Book Edition). Amending SRO 1241/2025 & SRO 682/2026.`
      };
    } else if (pageNum === 2) {
      return {
        pageNumber: 2,
        title: "S.R.O. No. 829/2019 Notification & Chapter 1 Definitions",
        contentMl: `കേരള പഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ, 2019*
S.R.O. No. 829/2019.— 1994-ലെ കേരള പഞ്ചായത്ത് രാജ് നിയമം (1994-ലെ 13), 235A, 235B, 235F, 235P, 235W എന്നീ വകുപ്പുകളോട് 254-ാം വകുപ്പ് കൂട്ടി വായിച്ച പ്രകാരം നൽകപ്പെട്ട അധികാരങ്ങൾ വിനിയോഗിച്ചുകൊണ്ടും...

അധ്യായം 1
നിർവ്വചനങ്ങൾ

1. ചുരുക്കപ്പേരും, വ്യാപ്തിയും, പ്രാരംഭവും.— (1) ഈ ചട്ടങ്ങൾക്ക് 2019-ലെ കേരള പഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ എന്ന് പേര് പറയാം.
(2) ഇവ സംസ്ഥാനത്തെ എല്ലാ ഗ്രാമപഞ്ചായത്തിനും കീഴിലുള്ള പ്രദേശങ്ങൾക്കും ബാധകമായിരിക്കും.
(3) ഇവ ഉടൻ പ്രാബല്യത്തിൽ വരുന്നതാണ്.

2. നിർവ്വചനങ്ങൾ.— (1) ഈ ചട്ടങ്ങളിൽ, സന്ദർഭം മറ്റു വിധത്തിൽ ആവശ്യപ്പെടാത്ത പക്ഷം,—
(a) 'പ്രവേശനമാർഗ്ഗം' എന്നാൽ ഒരു പുരയിടത്തിലേക്കോ അല്ലെങ്കിൽ കെട്ടിടത്തിലേക്കോ ഉള്ള വ്യക്തമായ മാർഗ്ഗം എന്നർത്ഥമാകുന്നു.
(b) 'അനുബന്ധ കെട്ടിടം' എന്നാൽ ഒരു പുരയിടത്തിലുള്ള പ്രധാന കെട്ടിടത്തിൽ നിന്നും വേർപെട്ട് നിൽക്കുന്നതും, ഒന്നോ അതിലധികമോ അനുബന്ധ ഉപയോഗങ്ങൾക്കായുള്ള കെട്ടിടം എന്നർത്ഥമാകുന്നു.`,
        contentEn: `Chapter 1 - Preliminary & Definitions (Rules 1-2). Short title, extent and commencement. Rule 2 definitions of Access, Accessory Building, etc.`
      };
    } else if (pageNum === 83) {
      return {
        pageNumber: 83,
        title: "Chapter 3: Building Requirements & Setbacks (Rules 16-28)",
        contentMl: `അധ്യായം 3 - കെട്ടിട നിബന്ധനകൾ & സെറ്റ്ബാക്കുകൾ
റൂൾ 25: സെറ്റ്ബാക്കുകളും തറ വിസ്തീർണ്ണ സൂചികയും (FAR)

1. ഫ്രണ്ട് യാർഡ് സെറ്റ്ബാക്ക്: കെട്ടിടത്തിന്റെ കൈവശ ഗണവും റോഡ് വീതിയും അനുസരിച്ച് പട്ടിക 4 (Table 4) ൽ നൽകിയിരിക്കുന്ന മാനദണ്ഡങ്ങൾ പാലിച്ചിരിക്കണം.
2. പാർശ്വഭാഗ സെറ്റ്ബാക്ക് (Side Yard): കുറഞ്ഞത് 1.0 മീറ്റർ മുതൽ 1.5 മീറ്റർ വരെ (പ്ലോട്ടിന്റെ ആകെ വിസ്തീർണ്ണവും കൈവശ ഗണവും അനുസരിച്ച്).
3. പിൻഭാഗ സെറ്റ്ബാക്ക് (Rear Yard): കുറഞ്ഞത് 1.0 മീറ്റർ മുതൽ 2.0 മീറ്റർ വരെ.
4. പ്ലോട്ട് അതിർത്തിയിൽ നിന്നും തുറസ്സില്ലാത്ത ഭിത്തികൾക്ക് 50 സെന്റിമീറ്റർ വരെ ഇളവ് അനുവദനീയം.`,
        contentEn: `Rule 25 Setbacks & Floor Area Ratio (FAR). Table 4 Road width vs Front yard setbacks. Side yard minimum 1.0m to 1.5m; Rear yard minimum 1.0m to 2.0m.`
      };
    } else {
      return {
        pageNumber: pageNum,
        title: `KPBR 2019/2026 Bilingual Book - Page ${pageNum}`,
        contentMl: `കേരള പഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ 2019 (2026 പതിപ്പ്) - പേജ് ${pageNum}
നിർദ്ദിഷ്ട കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ, സെറ്റ്ബാക്ക് വിസ്തീർണ്ണങ്ങൾ, എഫ്.എ.ആർ ഇൻഡക്സ്, കെ-സ്മാർട്ട് ഓൺലൈൻ പെർമിറ്റ് മാനദണ്ഡങ്ങൾ എന്നിവ വിശദമായി വിവരിക്കുന്നു.
(Full text available in search, table index, and embedded PDF frame).`,
        contentEn: `Kerala Panchayat Building Rules 2019/2026 Edition - Page ${pageNum}. Detailed rules, setbacks, coverage, FAR, and KSMART self-certification workflow.`
      };
    }
  })
};

const LOCAL_STORAGE_KEY = "kpbr_pdf_documents_store_v2";

interface BuildingRulesPdfViewerTabProps {
  onAskAIAboutRule?: (ruleText: string) => void;
}

export const BuildingRulesPdfViewerTab: React.FC<BuildingRulesPdfViewerTabProps> = ({
  onAskAIAboutRule
}) => {
  // Load documents from localStorage or fallback to defaults
  const [documents, setDocuments] = useState<PdfDocumentMeta[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: PdfDocumentMeta[] = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.warn("Failed to read saved PDF docs", err);
    }
    return [GAZETTE_2026_DOC, BOOK_2026_DOC];
  });

  const [selectedDocId, setSelectedDocId] = useState<string>(GAZETTE_2026_DOC.id);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"A4_VIEW" | "BOOK" | "SINGLE" | "EMBEDDED">("A4_VIEW");
  const [themeMode, setThemeMode] = useState<"DARK" | "SEPIA" | "LIGHT">("DARK");
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Upload & Links Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newTitleMl, setNewTitleMl] = useState<string>("");
  const [newCategory, setNewCategory] = useState<PdfDocumentMeta["category"]>("Custom");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newDriveUrl, setNewDriveUrl] = useState<string>("");
  const [newNotebookMlUrl, setNewNotebookMlUrl] = useState<string>("");
  const [newInitialNote, setNewInitialNote] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Notes & Bookmarks State for Active Document
  const [activeTabPanel, setActiveTabPanel] = useState<"DOCS" | "NOTES" | "BOOKMARKS">("DOCS");
  const [newNoteText, setNewNoteText] = useState<string>("");

  // Persist documents to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(documents));
    } catch (err) {
      console.warn("Failed to persist PDF docs", err);
    }
  }, [documents]);

  const activeDoc = useMemo(() => {
    return documents.find((d) => d.id === selectedDocId) || documents[0];
  }, [documents, selectedDocId]);

  // Current page content retrieval
  const getPageData = (pageNo: number) => {
    const found = activeDoc.pages.find((p) => p.pageNumber === pageNo);
    if (found) return found;
    return {
      pageNumber: pageNo,
      title: `${activeDoc.title} - Page ${pageNo}`,
      contentMl: `കേരള പഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ - പേജ് ${pageNo} ലെ വിവരങ്ങൾ. സെറ്റ്ബാക്ക്, ഫ്ലോർ ഏരിയ റേഷ്യോ (FAR), പാർക്കിംഗ് വിവരങ്ങൾ.`,
      contentEn: `Kerala Panchayat Building Rules Document - Page ${pageNo} Legal Content & Provisions.`
    };
  };

  // Add Bookmark
  const handleAddBookmark = (pageNo: number) => {
    const existing = activeDoc.bookmarks || [];
    if (existing.some((b) => b.pageNumber === pageNo)) return;

    const newBm: PdfBookmark = {
      id: `bm-${Date.now()}`,
      pageNumber: pageNo,
      title: `Page ${pageNo}: ${getPageData(pageNo).title.substring(0, 32)}...`,
      createdAt: new Date().toISOString().split("T")[0]
    };

    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === activeDoc.id
          ? { ...doc, bookmarks: [...(doc.bookmarks || []), newBm] }
          : doc
      )
    );
  };

  // Delete Bookmark
  const handleDeleteBookmark = (bmId: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === activeDoc.id
          ? { ...doc, bookmarks: (doc.bookmarks || []).filter((b) => b.id !== bmId) }
          : doc
      )
    );
  };

  // Add Note
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;

    const newNote: PdfNote = {
      id: `note-${Date.now()}`,
      pageNumber: currentPage,
      text: newNoteText.trim(),
      createdAt: new Date().toISOString().split("T")[0],
      author: "USER"
    };

    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === activeDoc.id
          ? { ...doc, notes: [...(doc.notes || []), newNote] }
          : doc
      )
    );

    setNewNoteText("");
  };

  // Delete Note
  const handleDeleteNote = (noteId: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === activeDoc.id
          ? { ...doc, notes: (doc.notes || []).filter((n) => n.id !== noteId) }
          : doc
      )
    );
  };

  // Handle New PDF Upload / Link Submission
  const handleSaveNewPdf = () => {
    if (!newTitle.trim() && !uploadedFile) {
      alert("ദയവായി ഒരു പി.ഡി.എഫ് ഫയൽ അപ്ലോഡ് ചെയ്യുകയോ പേര് നൽകുകയോ ചെയ്യുക.");
      return;
    }

    let fileDataUrl = "";
    if (uploadedFile) {
      fileDataUrl = URL.createObjectURL(uploadedFile);
    }

    const docId = `pdf-${Date.now()}`;
    const docTitle = newTitle.trim() || uploadedFile?.name.replace(".pdf", "") || "Untitled Document";
    const docTitleMl = newTitleMl.trim() || `പി.ഡി.എഫ് രേഖ: ${docTitle}`;

    const createdDoc: PdfDocumentMeta = {
      id: docId,
      title: docTitle,
      titleMl: docTitleMl,
      subtitle: uploadedFile
        ? `Uploaded Local PDF • ${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB`
        : newDriveUrl
        ? "Google Drive Linked PDF"
        : "NotebookML Reference Doc",
      category: newCategory,
      totalPages: 10,
      fileSize: uploadedFile ? `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB` : "External Link",
      publishedDate: new Date().toLocaleDateString("en-IN"),
      isOfficialGazette: false,
      description: newDescription.trim() || "നിങ്ങൾ അപ്ലോഡ് ചെയ്ത / ലിങ്ക് ചെയ്ത കെട്ടിട നിർമ്മാണ ചട്ടങ്ങളുടെ വിജ്ഞാപന രേഖ.",
      pdfFileUrl: fileDataUrl,
      driveUrl: newDriveUrl.trim() ? formatDrivePreviewUrl(newDriveUrl.trim()) : undefined,
      notebookMlUrl: newNotebookMlUrl.trim() || undefined,
      notes: newInitialNote.trim()
        ? [
            {
              id: `note-init-${Date.now()}`,
              pageNumber: 1,
              text: newInitialNote.trim(),
              createdAt: new Date().toISOString().split("T")[0],
              author: "USER"
            }
          ]
        : [],
      bookmarks: [{ id: `bm-init-${Date.now()}`, pageNumber: 1, title: "Page 1 - Cover", createdAt: "Today" }],
      chapters: [
        { title: "Page 1: Document Overview", page: 1, summary: "Main Document Content & Embedded Viewer" }
      ],
      pages: Array.from({ length: 10 }, (_, idx) => ({
        pageNumber: idx + 1,
        title: `${docTitle} - Page ${idx + 1}`,
        contentMl: `അപ്ലോഡ് ചെയ്ത രേഖ: ${docTitleMl} (പേജ് ${idx + 1}). ഈ പേജിൽ നോട്ടുകളും ബുക്ക്മാർക്കുകളും ചേർക്കാവുന്നതാണ്.`,
        contentEn: `Document ${docTitle} Page ${idx + 1}. Review full visual pages in Embedded PDF Viewer.`
      }))
    };

    setDocuments((prev) => [createdDoc, ...prev]);
    setSelectedDocId(createdDoc.id);
    setCurrentPage(1);

    // If drive URL or local PDF file uploaded, auto switch to EMBEDDED view for preview
    if (createdDoc.driveUrl || createdDoc.pdfFileUrl) {
      setViewMode("EMBEDDED");
    }

    // Reset Form
    setNewTitle("");
    setNewTitleMl("");
    setNewDescription("");
    setNewDriveUrl("");
    setNewNotebookMlUrl("");
    setNewInitialNote("");
    setUploadedFile(null);
    setIsAddModalOpen(false);

    alert(`"${docTitle}" വിജയകരമായി ലിങ്ക് ചെയ്തു / അപ്ലോഡ് ചെയ്തു!`);
  };

  // Filtered search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return activeDoc.pages.filter(
      (p) =>
        p.contentMl.toLowerCase().includes(q) ||
        p.contentEn.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q)
    );
  }, [searchQuery, activeDoc]);

  // Book Spread Pages
  const leftPageNo = currentPage;
  const rightPageNo = currentPage + 1 <= activeDoc.totalPages ? currentPage + 1 : null;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden bg-blueprint-grid">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800 uppercase flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                KPBR 2026 OFFICIAL BOOK & PDF LIBRARY
              </span>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-2.5 py-1 rounded-full border border-amber-800 font-bold">
                DRIVE / NOTEBOOKML / LOCAL PDF HUB
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-3">
              <Book className="w-7 h-7 text-emerald-400" />
              <span>കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ (KPBR 2019/2026 PDF VIEWER)</span>
            </h2>

            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              KPBR 2019/2026 ഗസറ്റ് വിജ്ഞാപനങ്ങളും, പൂർണ്ണ പുസ്തകങ്ങളും, ഗൂഗിൾ ഡ്രൈവ് / NotebookML ലിങ്കുകളും, സ്വന്തം പി.ഡി.എഫ് ഫയലുകളും അപ്ലോഡ് ചെയ്ത് വായിക്കാം. നോട്ടുകളും ബുക്ക്മാർക്കുകളും സൂക്ഷിക്കാം.
            </p>
          </div>

          {/* Upload & Add Link Header Button */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 px-5 py-3 rounded-2xl font-mono text-xs font-black shadow-lg shadow-emerald-500/20 transition-all cursor-pointer ring-1 ring-emerald-300"
            >
              <Upload className="w-4 h-4" />
              <span>PDF / DRIVE / NOTEBOOKML ചേർക്കുക</span>
            </button>

            {onAskAIAboutRule && (
              <button
                onClick={() => onAskAIAboutRule(`Explain Rule 26 & 33 in ${activeDoc.title}`)}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800 px-4 py-3 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer"
              >
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>AI യോട് ചോദിക്കുക</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Documents Selector, Chapters & Notes (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-xl">
            {/* Navigation Tab Buttons for Left Drawer */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 font-mono text-xs">
              <button
                onClick={() => setActiveTabPanel("DOCS")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  activeTabPanel === "DOCS" ? "bg-emerald-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                PDFs ({documents.length})
              </button>
              <button
                onClick={() => setActiveTabPanel("NOTES")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  activeTabPanel === "NOTES" ? "bg-emerald-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                നോട്ടുകൾ ({activeDoc.notes?.length || 0})
              </button>
              <button
                onClick={() => setActiveTabPanel("BOOKMARKS")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  activeTabPanel === "BOOKMARKS" ? "bg-emerald-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                ബുക്ക്മാർക്ക് ({activeDoc.bookmarks?.length || 0})
              </button>
            </div>

            {/* PANEL 1: Documents Switcher */}
            {activeTabPanel === "DOCS" && (
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-emerald-400" />
                    <span>ചട്ടങ്ങൾ & ഫയലുകൾ</span>
                  </span>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="text-emerald-400 hover:text-emerald-300 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>പുതിയത്</span>
                  </button>
                </h3>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                  {documents.map((doc) => {
                    const isSelected = doc.id === activeDoc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          setSelectedDocId(doc.id);
                          setCurrentPage(1);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                          isSelected
                            ? "bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500/40 shadow-lg"
                            : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                              doc.category === "KPBR 2026 Amendment"
                                ? "bg-amber-950 text-amber-300 border-amber-800"
                                : doc.category === "KPBR 2019/2026 Book Edition"
                                ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                : "bg-cyan-950 text-cyan-300 border-cyan-800"
                            }`}
                          >
                            {doc.category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{doc.totalPages} Pages</span>
                        </div>

                        <h4 className="text-xs font-bold text-white font-sans line-clamp-2">
                          {doc.titleMl}
                        </h4>

                        <p className="text-[11px] font-mono text-slate-400 line-clamp-1">{doc.title}</p>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                          <span>{doc.publishedDate}</span>
                          <div className="flex items-center gap-2">
                            {doc.driveUrl && <span className="text-cyan-400">Drive</span>}
                            {doc.notebookMlUrl && <span className="text-purple-400">NotebookML</span>}
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              വായിക്കുക
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Page Search Input */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="ചട്ടങ്ങളിലും പേജുകളിലും തിരയുക..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {searchResults.length > 0 && (
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold block">
                        {searchResults.length} പേജുകളിൽ കണ്ടെത്തി:
                      </span>
                      {searchResults.map((res) => (
                        <button
                          key={res.pageNumber}
                          onClick={() => {
                            setCurrentPage(res.pageNumber % 2 === 0 ? res.pageNumber - 1 : res.pageNumber);
                          }}
                          className="w-full text-left p-1.5 hover:bg-slate-800 rounded text-[11px] font-mono text-slate-300 flex items-center justify-between cursor-pointer"
                        >
                          <span className="truncate">{res.title}</span>
                          <span className="text-emerald-400 font-bold">P.{res.pageNumber}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chapters Drawer */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ചാപ്റ്ററുകൾ & ഇൻഡക്സ് (CHAPTERS)</span>
                  </h4>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {activeDoc.chapters.map((ch, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const p = ch.page;
                          setCurrentPage(p % 2 === 0 && p > 1 ? p - 1 : p);
                        }}
                        className="w-full text-left p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/50 transition-all space-y-1 group cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-white font-sans group-hover:text-emerald-300">
                          <span className="line-clamp-1">{ch.title}</span>
                          <span className="text-[10px] font-mono text-emerald-400 ml-1">P.{ch.page}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 font-sans">{ch.summary}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PANEL 2: Document Notes Attachment */}
            {activeTabPanel === "NOTES" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-emerald-400" />
                    <span>{activeDoc.titleMl.substring(0, 24)}... ലെ നോട്ടുകൾ</span>
                  </h3>
                </div>

                {/* Add New Note Box */}
                <div className="space-y-2 bg-slate-900 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>പേജ് {currentPage} ൽ നോട്ട് ചേർക്കുക:</span>
                    <span className="text-emerald-400 font-bold">P.{currentPage}</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="കെട്ടിട നിർമ്മാണ ചട്ടത്തിലെ നിരീക്ഷണങ്ങൾ, സൈറ്റ് ക്ലിയറൻസ് നോട്ടുകൾ എന്നിവ എഴുതുക..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleAddNote}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 py-2 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>നോട്ട് സേവ് ചെയ്യുക</span>
                  </button>
                </div>

                {/* Saved Notes List */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                  {!activeDoc.notes || activeDoc.notes.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs font-mono">
                      ഈ ഫയലിൽ നോട്ടുകൾ ഒന്നും ചേർത്തിട്ടില്ല.
                    </div>
                  ) : (
                    activeDoc.notes.map((nt) => (
                      <div
                        key={nt.id}
                        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-1.5 relative group"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span className="text-emerald-400 font-bold bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                            PAGE {nt.pageNumber}
                          </span>
                          <span>{nt.createdAt}</span>
                        </div>
                        <p className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                          {nt.text}
                        </p>
                        <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500">
                          <span>By: {nt.author || "USER"}</span>
                          <button
                            onClick={() => handleDeleteNote(nt.id)}
                            className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Delete Note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PANEL 3: Bookmarks */}
            {activeTabPanel === "BOOKMARKS" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-amber-400" />
                    <span>സേവ് ചെയ്ത ബുക്ക്മാർക്കുകൾ</span>
                  </h3>
                  <button
                    onClick={() => handleAddBookmark(currentPage)}
                    className="text-amber-400 hover:text-amber-300 text-[10px] font-mono flex items-center gap-1 cursor-pointer bg-amber-950 border border-amber-800 px-2 py-1 rounded"
                  >
                    <Bookmark className="w-3 h-3 fill-current" />
                    <span>P.{currentPage} ബുക്ക്മാർക്ക് ചെയ്യുക</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                  {!activeDoc.bookmarks || activeDoc.bookmarks.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs font-mono">
                      ബുക്ക്മാർക്കുകൾ ഒന്നും സേവ് ചെയ്തിട്ടില്ല.
                    </div>
                  ) : (
                    activeDoc.bookmarks.map((bm) => (
                      <div
                        key={bm.id}
                        className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-3 flex items-center justify-between gap-3 group transition-all"
                      >
                        <button
                          onClick={() => {
                            setCurrentPage(bm.pageNumber % 2 === 0 && bm.pageNumber > 1 ? bm.pageNumber - 1 : bm.pageNumber);
                          }}
                          className="text-left flex-1 space-y-0.5 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="text-amber-400 font-bold">PAGE {bm.pageNumber}</span>
                            <span className="text-slate-500">• {bm.createdAt}</span>
                          </div>
                          <div className="text-xs text-slate-200 font-bold line-clamp-1">{bm.title}</div>
                        </button>

                        <button
                          onClick={() => handleDeleteBookmark(bm.id)}
                          className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                          title="Remove Bookmark"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Reader Canvas & PDF Frame (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            {/* Toolbar Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
              {/* View Mode Selector */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono text-xs">
                <button
                  onClick={() => setViewMode("A4_VIEW")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    viewMode === "A4_VIEW" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                  title="A4 Size Document Page View"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>A4 പേജ് (A4 Size)</span>
                </button>

                <button
                  onClick={() => setViewMode("BOOK")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    viewMode === "BOOK" ? "bg-emerald-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                  title="2-Page Book Spread View"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Book Spread</span>
                </button>

                <button
                  onClick={() => setViewMode("SINGLE")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    viewMode === "SINGLE" ? "bg-emerald-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                  title="Single Page Reader View"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Single Page</span>
                </button>

                <button
                  onClick={() => setViewMode("EMBEDDED")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    viewMode === "EMBEDDED" ? "bg-cyan-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                  title="Google Cloud / PDF Embed Frame"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Cloud / Embed</span>
                </button>
              </div>

              {/* Theme & Page Navigation Controls */}
              {viewMode !== "EMBEDDED" && (
                <>
                  {/* Theme Selector */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setThemeMode("DARK")}
                      className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        themeMode === "DARK" ? "bg-slate-800 text-emerald-400 font-bold" : "text-slate-400 hover:text-white"
                      }`}
                      title="Dark Mode"
                    >
                      <Moon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setThemeMode("SEPIA")}
                      className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        themeMode === "SEPIA" ? "bg-amber-900/60 text-amber-300 font-bold" : "text-slate-400 hover:text-white"
                      }`}
                      title="Sepia Mode"
                    >
                      <Book className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setThemeMode("LIGHT")}
                      className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        themeMode === "LIGHT" ? "bg-slate-200 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                      }`}
                      title="Light Mode"
                    >
                      <Sun className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Page Jumper */}
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, viewMode === "BOOK" ? p - 2 : p - 1))}
                      disabled={currentPage <= 1}
                      className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <span>P.{currentPage}</span>
                      {viewMode === "BOOK" && rightPageNo && <span>-{rightPageNo}</span>}
                      <span className="text-slate-500 font-normal">/ {activeDoc.totalPages}</span>
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(activeDoc.totalPages, viewMode === "BOOK" ? p + 2 : p + 1)
                        )
                      }
                      disabled={currentPage >= activeDoc.totalPages}
                      className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Zoom & Bookmark Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
                      className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-mono text-slate-400 px-1">{zoomLevel}%</span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
                      className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleAddBookmark(currentPage)}
                      className="p-1.5 rounded-lg border bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-400 cursor-pointer"
                      title="Bookmark Page"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}

              {/* Download & External Links Actions */}
              <div className="flex items-center gap-2">
                {activeDoc.pdfFileUrl ? (
                  <a
                    href={activeDoc.pdfFileUrl}
                    download={`${activeDoc.title.replace(/\s+/g, "_")}.pdf`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-mono font-bold transition-all cursor-pointer"
                    title="Download PDF File"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ഡൗൺലോഡ് (Download)</span>
                  </a>
                ) : activeDoc.driveUrl ? (
                  <a
                    href={activeDoc.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-mono font-bold transition-all cursor-pointer"
                    title="Open Google Drive Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Drive ൽ കാണുക</span>
                  </a>
                ) : null}

                {activeDoc.notebookMlUrl && (
                  <a
                    href={activeDoc.notebookMlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-300 text-xs font-mono font-bold transition-all cursor-pointer"
                    title="Open NotebookML"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>NotebookML</span>
                  </a>
                )}
              </div>
            </div>

            {/* CANVAS DISPLAY CONTENT AREA */}
            {viewMode === "EMBEDDED" ? (
              /* EMBEDDED PDF IFRAME / VIEWER */
              <div className="min-h-[620px] bg-slate-900 border border-slate-800 rounded-3xl p-3 flex flex-col space-y-3">
                <div className="flex items-center justify-between font-mono text-xs text-slate-400 px-2 pt-1">
                  <span className="font-bold text-cyan-400 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>{activeDoc.titleMl}</span>
                  </span>
                  <span>{activeDoc.subtitle}</span>
                </div>

                {activeDoc.pdfFileUrl || activeDoc.driveUrl ? (
                  <iframe
                    src={activeDoc.pdfFileUrl || formatDrivePreviewUrl(activeDoc.driveUrl)}
                    className="w-full h-[620px] rounded-2xl border border-slate-800 bg-slate-950"
                    title={activeDoc.title}
                  />
                ) : (
                  <div className="h-[580px] rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
                    <div className="space-y-2 max-w-md">
                      <h3 className="text-base font-bold text-slate-200">
                        പി.ഡി.എഫ് എംബഡ് ഫയൽ ലഭ്യമല്ല (PDF File / Drive Link Pending)
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        ഈ ഫയലിന് ഗൂഗിൾ ഡ്രൈവ് ലിങ്കോ ബിനറി പി.ഡി.എഫ് ഫയലോ ചേർത്തിട്ടില്ല. Book View ൽ പേജുകൾ വായിക്കാം, അല്ലെങ്കിൽ മുകളിലെ ബട്ടൺ വഴി സ്വന്തം PDF ഫയൽ / Drive ലിങ്ക് അപ്ലോഡ് ചെയ്യാം.
                      </p>
                    </div>

                    <button
                      onClick={() => setViewMode("BOOK")}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Book View ലേക്ക് മാറുക
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* BOOK / SINGLE PAGE READING CANVAS */
              <div
                className={`min-h-[620px] p-6 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                  themeMode === "DARK"
                    ? "bg-slate-900 border-slate-800 text-slate-100"
                    : themeMode === "SEPIA"
                    ? "bg-[#fbf0d9] border-[#e2d2aa] text-[#423119]"
                    : "bg-white border-slate-300 text-slate-900 shadow-inner"
                }`}
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "top center"
                }}
              >
                {/* Header Title Bar of Book */}
                <div className="flex items-center justify-between border-b pb-3 opacity-75 font-mono text-xs">
                  <span className="font-bold uppercase line-clamp-1">{activeDoc.titleMl}</span>
                  <span className="shrink-0">{activeDoc.category}</span>
                </div>

                {/* BOOK SPREAD / SINGLE PAGE / A4 VIEW */}
                {viewMode === "A4_VIEW" ? (
                  /* A4 SIZE DOCUMENT PAGE VIEW */
                  <div className="my-4 max-w-[820px] mx-auto w-full space-y-4">
                    {/* A4 Sheet Container */}
                    <div
                      id="a4-document-page"
                      className="bg-white text-slate-900 shadow-2xl p-8 sm:p-12 border border-slate-300 rounded-sm min-h-[1050px] flex flex-col justify-between relative overflow-hidden"
                    >
                      {/* Watermark */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] select-none rotate-[-35deg]">
                        <span className="text-6xl font-black font-mono tracking-widest text-slate-900">
                          KPBR 2026 OFFICIAL
                        </span>
                      </div>

                      {/* A4 Header */}
                      <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1 relative z-10">
                        <div className="text-[11px] font-mono tracking-widest font-bold text-slate-700 uppercase">
                          GOVERNMENT OF KERALA • LOCAL SELF GOVERNMENT DEPARTMENT
                        </div>
                        <h2 className="text-xl font-black font-sans uppercase tracking-tight text-slate-900">
                          {activeDoc.titleMl}
                        </h2>
                        <div className="text-xs font-mono text-slate-600 font-semibold">
                          {activeDoc.subtitle || activeDoc.title}
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                          <span>തീയതി: {activeDoc.publishedDate}</span>
                          <span className="font-bold text-slate-800">വിഭാഗം: {activeDoc.category}</span>
                          <span>പേജ് {currentPage} / {activeDoc.totalPages}</span>
                        </div>
                      </div>

                      {/* A4 Document Body */}
                      {(() => {
                        const pageData = getPageData(currentPage);
                        return (
                          <div className="my-6 space-y-5 flex-1 relative z-10">
                            {/* Page Header / Sub-title */}
                            <div className="bg-slate-100 p-3 rounded border border-slate-300">
                              <h3 className="text-sm font-black font-sans text-slate-900">
                                {pageData.title}
                              </h3>
                            </div>

                            {/* Malayalam Gazette / Rule Clause Text */}
                            <div className="text-xs sm:text-sm font-sans leading-relaxed text-slate-800 whitespace-pre-wrap space-y-3">
                              {pageData.contentMl}
                            </div>

                            {/* English Gazette Summary & Provisos */}
                            {pageData.contentEn && (
                              <div className="mt-4 p-4 rounded bg-slate-50 border-l-4 border-emerald-600 text-xs font-mono text-slate-700 space-y-1">
                                <span className="font-bold block uppercase text-emerald-800">
                                  English Text & Legal Provisions:
                                </span>
                                <p className="leading-relaxed whitespace-pre-wrap">{pageData.contentEn}</p>
                              </div>
                            )}

                            {/* If doc has a cloud/drive URL, show quick action to load cloud frame */}
                            {(activeDoc.pdfFileUrl || activeDoc.driveUrl) && (
                              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded text-xs flex items-center justify-between">
                                <span className="text-cyan-900 font-sans">
                                  ഈ രേഖയുടെ യഥാർത്ഥ Google Cloud / PDF ഫയൽ ലഭ്യമാണ്.
                                </span>
                                <button
                                  onClick={() => setViewMode("EMBEDDED")}
                                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-mono font-bold text-xs cursor-pointer"
                                >
                                  Cloud PDF ഫ്രെയിമിൽ കാണുക
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* A4 Footer */}
                      <div className="border-t border-slate-300 pt-3 flex items-center justify-between text-[11px] font-mono text-slate-500 relative z-10">
                        <span>KPBR 2019 / 2026 GAZETTE EDITION</span>
                        <span className="font-bold text-slate-800">
                          PAGE {currentPage} OF {activeDoc.totalPages}
                        </span>
                        <span>OFFICIAL RECORD</span>
                      </div>
                    </div>
                  </div>
                ) : viewMode === "BOOK" ? (
                  /* TWO PAGE BOOK SPREAD */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 relative">
                    {/* Spine Center Shadow */}
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-500/30 to-transparent -translate-x-1/2" />

                    {/* LEFT PAGE */}
                    {(() => {
                      const leftData = getPageData(leftPageNo);
                      return (
                        <div className="p-5 rounded-2xl border bg-slate-950/20 backdrop-blur-sm space-y-4 shadow-sm relative">
                          <div className="flex items-center justify-between text-[11px] font-mono border-b pb-2 opacity-80">
                            <span className="font-bold text-emerald-400">PAGE {leftPageNo}</span>
                            <span>LEFT PAGE</span>
                          </div>

                          <h4 className="text-sm font-bold font-sans line-clamp-2 leading-snug">
                            {leftData.title}
                          </h4>

                          <div className="text-xs space-y-3 font-sans leading-relaxed whitespace-pre-wrap font-normal max-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
                            {leftData.contentMl}
                          </div>

                          {leftData.contentEn && (
                            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-[11px] font-mono text-emerald-300 space-y-1">
                              <span className="font-bold block uppercase">English Summary:</span>
                              <p>{leftData.contentEn}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* RIGHT PAGE */}
                    {rightPageNo ? (
                      (() => {
                        const rightData = getPageData(rightPageNo);
                        return (
                          <div className="p-5 rounded-2xl border bg-slate-950/20 backdrop-blur-sm space-y-4 shadow-sm relative">
                            <div className="flex items-center justify-between text-[11px] font-mono border-b pb-2 opacity-80">
                              <span className="font-bold text-emerald-400">PAGE {rightPageNo}</span>
                              <span>RIGHT PAGE</span>
                            </div>

                            <h4 className="text-sm font-bold font-sans line-clamp-2 leading-snug">
                              {rightData.title}
                            </h4>

                            <div className="text-xs space-y-3 font-sans leading-relaxed whitespace-pre-wrap font-normal max-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
                              {rightData.contentMl}
                            </div>

                            {rightData.contentEn && (
                              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-[11px] font-mono text-emerald-300 space-y-1">
                                <span className="font-bold block uppercase">English Summary:</span>
                                <p>{rightData.contentEn}</p>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="p-8 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center opacity-40 font-mono text-xs">
                        <BookOpen className="w-10 h-10 mb-2" />
                        <span>END OF DOCUMENT</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* SINGLE PAGE READER VIEW */
                  <div className="my-4 max-w-3xl mx-auto w-full p-6 rounded-2xl border bg-slate-950/20 space-y-4">
                    {(() => {
                      const data = getPageData(currentPage);
                      return (
                        <>
                          <div className="flex items-center justify-between text-xs font-mono border-b pb-2">
                            <span className="font-bold text-emerald-400">PAGE {currentPage} OF {activeDoc.totalPages}</span>
                            <span>{activeDoc.title}</span>
                          </div>

                          <h3 className="text-base font-bold font-sans">{data.title}</h3>

                          <div className="text-xs space-y-3 font-sans leading-relaxed whitespace-pre-wrap max-h-[480px] overflow-y-auto pr-2 scrollbar-thin">
                            {data.contentMl}
                          </div>

                          {data.contentEn && (
                            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs font-mono text-emerald-300 space-y-1">
                              <span className="font-bold block uppercase">English Translation & Notes:</span>
                              <p>{data.contentEn}</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Bottom Footer Page Navigation Bar */}
                <div className="flex items-center justify-between pt-4 border-t opacity-80 font-mono text-xs">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, viewMode === "BOOK" ? p - 2 : p - 1))}
                    disabled={currentPage <= 1}
                    className="flex items-center gap-1 hover:underline disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>ഇടത്തോട്ട് (Prev)</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-400">
                      {activeDoc.title} • {activeDoc.publishedDate}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(activeDoc.totalPages, viewMode === "BOOK" ? p + 2 : p + 1)
                      )
                    }
                    disabled={currentPage >= activeDoc.totalPages}
                    className="flex items-center gap-1 hover:underline disabled:opacity-30 cursor-pointer"
                  >
                    <span>വലത്തോട്ട് (Next)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Verification Footer Note */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs text-slate-300 leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5 font-sans">
                  കേരള ഗസറ്റ് സ്ഥിരീകരണം & ഡിജിറ്റൽ ബാക്കപ്പ് (Gazette & Digital Library):
                </span>
                <span>
                  കേരള പഞ്ചായത്ത് കെത്തിട നിർമ്മാണ ചട്ടങ്ങൾ, 2026 ആഗസ്റ്റ് 04 ഗസറ്റ് തിരുത്തലുകൾ, സ്വന്തം Google Drive / NotebookML ലിങ്കുകൾ എന്നിവ ഈ സെക്ഷനിൽ ഭദ്രമായി സൂക്ഷിക്കാം.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UPLOAD & ADD LINK MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative overflow-y-auto max-h-[90vh] scrollbar-thin">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase">
                <Upload className="w-5 h-5" />
                <span>PDF അപ്ലോഡ് / DRIVE & NOTEBOOKML ലിങ്ക് ചേർക്കുക</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 font-sans text-xs">
              {/* Option 1: File Upload */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <label className="font-mono text-slate-300 font-bold block uppercase flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>1. സ്വന്തം local PDF ഫയൽ അപ്ലോഡ് ചെയ്യുക (Local File):</span>
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 file:bg-emerald-600 file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-mono file:font-bold file:text-slate-950 cursor-pointer"
                />
                {uploadedFile && (
                  <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ഫയൽ തെരഞ്ഞെടുത്തു: {uploadedFile.name} ({(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>

              {/* Option 2: Google Drive Link */}
              <div className="space-y-2">
                <label className="font-mono text-slate-300 font-bold block uppercase flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-cyan-400" />
                  <span>2. Google Drive preview / share ലിങ്ക് ചേർക്കുക:</span>
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/1A2B3C.../view?usp=sharing"
                  value={newDriveUrl}
                  onChange={(e) => setNewDriveUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 font-mono block">
                  * ഗൂഗിൾ ഡ്രൈവ് ലിങ്ക് ചേർத்தால், വെബ്സൈറ്റിനുള്ളിൽ തന്നെ Embed Iframe ആയി നേരിട്ട് കാണാം.
                </span>
              </div>

              {/* Option 3: NotebookML Link */}
              <div className="space-y-2">
                <label className="font-mono text-slate-300 font-bold block uppercase flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>3. NotebookML ലിങ്ക് ചേർക്കുക:</span>
                </label>
                <input
                  type="url"
                  placeholder="https://notebooklm.google.com/notebook/..."
                  value={newNotebookMlUrl}
                  onChange={(e) => setNewNotebookMlUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              {/* Title Malayalam */}
              <div className="space-y-1">
                <label className="font-mono text-slate-300 font-bold block">
                  ഫയൽ പേര് (മലയാളത്തിൽ - Title Malayalam):
                </label>
                <input
                  type="text"
                  placeholder="ഉദാഹരണത്തിന്: കെട്ടിട നിർമ്മാണ ഭേദഗതി ചട്ടങ്ങൾ 2026"
                  value={newTitleMl}
                  onChange={(e) => setNewTitleMl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Title English & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-slate-300 font-bold block">Document Title (English):</label>
                  <input
                    type="text"
                    placeholder="e.g. KPBR 2026 Special Gazette Amendment"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-slate-300 font-bold block">വിഭാഗം (Category):</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as PdfDocumentMeta["category"])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="KPBR 2026 Amendment">KPBR 2026 Amendment</option>
                    <option value="KPBR 2019/2026 Book Edition">KPBR 2019/2026 Book Edition</option>
                    <option value="Amendments">Amendments & Gazette</option>
                    <option value="KSMART">KSMART Circulars</option>
                    <option value="Custom">Custom User File</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-mono text-slate-300 font-bold block">രേഖയുടെ വിവരണം (Description):</label>
                <textarea
                  rows={2}
                  placeholder="രേഖയിലെ പ്രധാന ഉള്ളടക്കം, സന്ദർഭങ്ങൾ എഴുതുക..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Initial Note */}
              <div className="space-y-1">
                <label className="font-mono text-slate-300 font-bold block">പ്രാഥമിക നോട്ട് / ഓർമ്മക്കുറിപ്പ് (Note):</label>
                <input
                  type="text"
                  placeholder="റൂൾ 26 ഇളവുകൾ പരിശോധിക്കുക..."
                  value={newInitialNote}
                  onChange={(e) => setNewInitialNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 font-mono text-xs">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer font-bold transition-colors"
              >
                ക്യാൻസൽ (Cancel)
              </button>

              <button
                onClick={handleSaveNewPdf}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl cursor-pointer shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ഫയൽ സേവ് ചെയ്യുക</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
