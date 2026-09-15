import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "ml";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    system_title: "VASTHUSILPY TECHNICAL SYSTEM",
    subtitle: "KPBR 2019/2026 • SURVEY & VASTU",
    header_heading: "VASTHUSILPY - KERALASSERY",
    dark_view: "DARK VIEW",
    light_view: "LIGHT VIEW",
    desktop_view: "DESKTOP VIEW",
    mobile_view: "MOBILE VIEW",
    switch_view: "SWITCH VIEW",
    manage_users: "MANAGE USERS",
    all_projects: "ALL PROJECTS",
    projects: "PROJECTS",
    invoices: "INVOICES & BILLS",
    land_survey: "LAND SURVEY",
    progress: "PROGRESS",
    ready_to_submit: "READY TO SUBMIT",
    completed: "COMPLETED",
    add_project: "NEW PROJECT",
    add_invoice: "CREATE INVOICE",
    notifications: "NOTIFICATIONS",
    mark_all_read: "Mark all read",
    clear_all: "Clear all",
    no_notifications: "No new notifications",
    authorized: "AUTHORIZED",
    primary_admin: "PRIMARY ADMIN",
    language_label: "English",
    // Office & CRM Tabs
    tab_projects: "Projects Pipeline",
    tab_tasks: "Tasks & Sub-tasks",
    tab_activity: "Activity History",
    tab_important_sites: "Important Sites & Vault",
    tab_invoices: "Invoices & Payments",
    tab_products: "Products & Services",
    tab_customers: "Customers",
    tab_reports: "Reports & Analytics",
    tab_client_view: "Client View",
    // Subtabs & Section Names
    office_dashboard: "CRM",
    kpbr_calculator: "KPBR Calculator",
    building_rules: "Building Rules",
    rate_estimator: "Estimater",
    vastu_shastra: "Vastu Shastra",
    utilities: "Utilities",
    survey_land: "Survey & Land Area",
    civil_eng: "Civil Engineering",
    // Products & Services
    add_product_service: "Add Product / Service",
    product_service_catalog: "Products & Services Catalog",
    product_name: "Item / Service Name",
    category: "Category",
    unit: "Unit",
    rate_inr: "Rate (₹)",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    // Customers
    customer_directory: "Customer Directory",
    add_customer: "Add New Customer",
    customer_name: "Customer Name",
    phone: "Phone",
    email: "Email",
    address: "Address / Panchayat",
    gst_number: "GST No",
    total_projects: "Total Projects",
    total_billed: "Total Billed",
    // Reports
    sales_transactions_report: "Sales & Transactions Report",
    export_pdf: "Export to PDF",
    share_email: "Share via Email",
    total_revenue: "Total Revenue Billed",
    total_collected: "Total Paid / Collected",
    balance_outstanding: "Outstanding Balance",
    total_invoices: "Total Invoices Created",
    paid_invoices: "Fully Paid Invoices",
    unpaid_invoices: "Unpaid / Pending Invoices",
    top_services: "Top Selling Services",
  },
  ml: {
    system_title: "വാസ്തുശില്പി ടെക്നിക്കൽ സിസ്റ്റം",
    subtitle: "കെ.പി.ബി.ആർ 2019/2026 • സർവേ & വാസ്തു",
    header_heading: "വാസ്തുശില്പി - കേരളശ്ശേരി",
    dark_view: "ഡാർക്ക് വ്യൂ",
    light_view: "ലൈറ്റ് വ്യൂ",
    desktop_view: "ഡെസ്ക്ടോപ്പ്",
    mobile_view: "മൊബൈൽ",
    switch_view: "വ്യൂ മാറ്റുക",
    manage_users: "ഉപയോക്താക്കൾ",
    all_projects: "എല്ലാ പ്രോജക്റ്റുകളും",
    projects: "പ്രോജക്റ്റുകൾ",
    invoices: "ഇൻവോയ്സുകളും ബില്ലുകളും",
    land_survey: "ലാൻഡ് സർവേ",
    progress: "പുരോഗതിയിൽ",
    ready_to_submit: "സമർപ്പിക്കാൻ തയ്യാർ",
    completed: "പൂർത്തിയായി",
    add_project: "പുതിയ പ്രോജക്റ്റ്",
    add_invoice: "ഇൻവോയ്സ് ഉണ്ടാക്കുക",
    notifications: "അറിയിപ്പുകൾ",
    mark_all_read: "എല്ലാം വായിച്ചതായി അടയാളപ്പെടുത്തുക",
    clear_all: "എല്ലാം മായ്‌ക്കുക",
    no_notifications: "അറിയിപ്പുകളൊന്നുമില്ല",
    authorized: "അംഗീകൃത ഉപയോക്താവ്",
    primary_admin: "പ്രധാന അഡ്മിൻ",
    language_label: "മലയാളം",
    // Office & CRM Tabs
    tab_projects: "പ്രോജക്ട്സ് പൈപ്പ്ലൈൻ",
    tab_tasks: "ടാസ്കുകൾ & ഉപടാസ്കുകൾ",
    tab_activity: "ആക്ടിവിറ്റി ഹിസ്റ്ററി",
    tab_important_sites: "ഇംപോർട്ടന്റ് സൈറ്റുകൾ & വോൾട്ട്",
    tab_invoices: "ഇൻവോയ്‌സുകൾ & പേയ്‌മെന്റ്",
    tab_products: "ഉൽപ്പന്നങ്ങളും സേവനങ്ങളും",
    tab_customers: "കസ്റ്റമർ ഡാറ്റ",
    tab_reports: "സെയിൽസ് റിപ്പോർട്ടുകൾ",
    tab_client_view: "ക്ലൈൻ്റ് വ്യൂ",
    // Subtabs & Section Names
    office_dashboard: "CRM",
    kpbr_calculator: "കെ.പി.ബി.ആർ കാൽക്കുലേറ്റർ",
    building_rules: "കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ",
    rate_estimator: "എസ്റ്റിമേറ്റർ",
    vastu_shastra: "വാസ്തു ശാസ്ത്രം",
    utilities: "യൂട്ടിലിറ്റികൾ",
    survey_land: "സർവ്വേ & ലാൻഡ് ഏരിയ",
    civil_eng: "സിവിൽ എഞ്ചിനീയറിംഗ്",
    // Products & Services
    add_product_service: "പുതിയ ഐറ്റം / സേവനം ചേർക്കുക",
    product_service_catalog: "ഉൽപ്പന്നങ്ങളും സേവനങ്ങളുടേയും പട്ടിക",
    product_name: "ഐറ്റം / സർവീസ് പേര്",
    category: "വിഭാഗം",
    unit: "യൂണിറ്റ്",
    rate_inr: "നിരക്ക് (₹)",
    actions: "നടപടികൾ",
    edit: "എഡിറ്റ് ചെയ്യുക",
    delete: "ഡിലീറ്റ് ചെയ്യുക",
    save: "സേവ് ചെയ്യുക",
    cancel: "ക്യാൻസൽ",
    // Customers
    customer_directory: "കസ്റ്റമർ ഡയറക്ടറി",
    add_customer: "പുതിയ കസ്റ്റമറെ ചേർക്കുക",
    customer_name: "കസ്റ്റമർ പേര്",
    phone: "ഫോൺ നമ്പർ",
    email: "ഇമെയിൽ",
    address: "വിലാസം / പഞ്ചായത്ത്",
    gst_number: "ജി.എസ്.ടി നമ്പർ",
    total_projects: "ആകെ പ്രോജക്റ്റുകൾ",
    total_billed: "ആകെ തുക",
    // Reports
    sales_transactions_report: "സെയിൽസ് & ഇടപാടുകളുടെ റിപ്പോർട്ട്",
    export_pdf: "പി.ഡി.എഫ് ഡൗൺലോഡ് (PDF)",
    share_email: "ഇമെയിൽ വഴി അയക്കുക",
    total_revenue: "ആകെ ഇൻവോയ്സ് തുക",
    total_collected: "ലഭിച്ച തുക",
    balance_outstanding: "ബാക്കി ലഭിക്കാനുള്ള തുക",
    total_invoices: "ആകെ ഇൻവോയ്സുകൾ",
    paid_invoices: "പൂർണ്ണമായി അടച്ചവ",
    unpaid_invoices: "ബാക്കിയുള്ളവ",
    top_services: "കൂടുതൽ വിറ്റഴിക്കപ്പെടുന്ന സേവനങ്ങൾ",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("vasthusilpy_app_lang");
    return (saved === "ml" || saved === "en") ? saved : "en";
  });

  useEffect(() => {
    localStorage.setItem("vasthusilpy_app_lang", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === "en" ? "ml" : "en"));
  };

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] || fallback || translations["en"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
