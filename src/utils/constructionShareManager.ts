import { ConstructionAgreement, ConstructionProject, ConstructionSettings } from "../types";
import { formatIndianCurrency } from "./constructionStorageManager";

/**
 * Share Agreement Details directly on WhatsApp with pre-formatted Malayalam text
 */
export const shareAgreementOnWhatsApp = (agreement: ConstructionAgreement, customPhone?: string) => {
  const phone = (customPhone || agreement.client.mobileNumber || "").replace(/[^0-9]/g, "");
  const formattedPhone = phone.length === 10 ? `91${phone}` : phone;

  const lines = [
    `🏛️ *വാസ്തുശിൽപി എൻജിനീയറിംഗ് സ്റ്റുഡിയോ*`,
    `*കെട്ടിട നിർമ്മാണ കരാർ ഉടമ്പടി വിവരങ്ങൾ*`,
    `-----------------------------------------`,
    `📋 *കരാർ നമ്പർ (Agreement No):* ${agreement.agreementNo}`,
    `📅 *തീയതി (Date):* ${agreement.agreementDate}`,
    `👤 *ഉപഭോക്താവ് (Client):* ${agreement.client.clientName}`,
    `🏠 *വീട്ടുപേര് & സ്ഥലം:* ${agreement.client.houseName}, ${agreement.client.localBody}, ${agreement.client.district}`,
    `📞 *ഫോൺ നമ്പർ:* ${agreement.client.mobileNumber}`,
    `📐 *ആകെ വിസ്തീർണ്ണം:* ${agreement.totalBuiltUpArea.toLocaleString()} Sq.Ft`,
    `🏗️ *പ്രോജക്ട് തരം:* ${agreement.projectType} (${agreement.roofingType})`,
    `💰 *ആകെ കരാർ തുക:* ${formatIndianCurrency(agreement.finalContractAmount)}`,
    `💵 *സ്ക്വയർ ഫീറ്റ് നിരക്ക്:* ${formatIndianCurrency(agreement.baseRatePerSqFt, false)} / Sq.Ft`,
    `⏳ *പൂർത്തീകരണ കാലാവധി:* ${agreement.completionPeriodMonths} മാസങ്ങൾ (${agreement.completionTargetDate || "നിശ്ചിത തീയതി"})`,
    `🔒 *ഡിജിറ്റൽ വെരിഫിക്കേഷൻ ടോക്കൺ:* ${agreement.verificationToken}`,
    `-----------------------------------------`,
    `📌 *നിർമ്മാണ ഘട്ടങ്ങൾ:* ${agreement.paymentSchedule.length} ഘട്ടങ്ങളിലായി പെയ്‌മെന്റ് ഷെഡ്യൂൾ ക്രമീകരിച്ചിരിക്കുന്നു.`,
    ...(agreement.extraWorks && agreement.extraWorks.length > 0
      ? [`🔨 *അധിക ജോലികൾ:* ${agreement.extraWorks.length} ഇനങ്ങൾ ഉൾപ്പെടുത്തിയിട്ടുണ്ട്.`]
      : []),
    `\n📄 *ഡിജിറ്റൽ ഇ-സ്റ്റാമ്പ് കരാർ വെരിഫൈ ചെയ്യുന്നതിനും ഡൗൺലോഡ് ചെയ്യുന്നതിനും ബന്ധപ്പെടുക.*`,
    `\n🏢 *${agreement.contractor.companyName}*`,
    `📞 ഫോൺ: ${agreement.contractor.phone} | ✉️ ${agreement.contractor.email}`
  ];

  const message = lines.join("\n");
  const encoded = encodeURIComponent(message);
  const url = formattedPhone
    ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;

  window.open(url, "_blank");
};

/**
 * Share Project Progress and Accounts on WhatsApp
 */
export const shareProjectOnWhatsApp = (project: ConstructionProject, customPhone?: string) => {
  const phone = (customPhone || project.client.mobileNumber || "").replace(/[^0-9]/g, "");
  const formattedPhone = phone.length === 10 ? `91${phone}` : phone;

  const lines = [
    `🏗️ *വാസ്തുശിൽപി പ്രോജക്ട് സ്റ്റാറ്റസ് & അക്കൗണ്ട്സ്*`,
    `*പ്രോജക്ട് നമ്പർ:* ${project.projectNo}`,
    `-----------------------------------------`,
    `👤 *ക്ലയന്റ്:* ${project.client.clientName}`,
    `📍 *സ്ഥലം:* ${project.client.localBody}, ${project.client.district}`,
    `📐 *വിസ്തീർണ്ണം:* ${project.totalBuiltUpArea.toLocaleString()} Sq.Ft`,
    `🏁 *നിലവിലെ നിർമ്മാണ ഘട്ടം:* ${project.currentStage}`,
    `📊 *സ്റ്റാറ്റസ്:* ${project.status}`,
    `-----------------------------------------`,
    `💰 *ആകെ കരാർ തുക:* ${formatIndianCurrency(project.finalContractAmount)}`,
    `💵 *ലഭിച്ച തുക (Received):* ${formatIndianCurrency(project.totalReceived || 0)}`,
    `⚠️ *ബാക്കി തുക (Balance):* ${formatIndianCurrency(project.balanceAmount || 0)}`,
    `-----------------------------------------`,
    `✨ *Vasthusilpy Construction Engineering Suite*`
  ];

  const message = lines.join("\n");
  const encoded = encodeURIComponent(message);
  const url = formattedPhone
    ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;

  window.open(url, "_blank");
};

/**
 * Share Financial Report on WhatsApp
 */
export const shareFinancialReportOnWhatsApp = (
  projects: ConstructionProject[],
  settings: ConstructionSettings
) => {
  const totalContract = projects.reduce((s, p) => s + (p.finalContractAmount || 0), 0);
  const totalReceived = projects.reduce((s, p) => s + (p.totalReceived || 0), 0);
  const totalBalance = projects.reduce((s, p) => s + (p.balanceAmount || 0), 0);
  const totalArea = projects.reduce((s, p) => s + (p.totalBuiltUpArea || 0), 0);

  const lines = [
    `📊 *${settings.contractor.companyName} - നിർമ്മാണ ധനകാര്യ റിപ്പോർട്ട്*`,
    `തീയതി: ${new Date().toLocaleDateString("en-IN")}`,
    `-----------------------------------------`,
    `🏢 *ആകെ പ്രോജക്ടുകൾ:* ${projects.length}`,
    `📐 *ആകെ വിസ്തീർണ്ണം:* ${totalArea.toLocaleString()} Sq.Ft`,
    `💰 *ആകെ കരാർ മൂല്യം:* ${formatIndianCurrency(totalContract)}`,
    `💵 *ആകെ ലഭിച്ച തുക:* ${formatIndianCurrency(totalReceived)}`,
    `⏳ *ബാക്കി ലഭിക്കാനുള്ള തുക:* ${formatIndianCurrency(totalBalance)}`,
    `-----------------------------------------`,
    `✨ *Vasthusilpy Engineering Studio*`
  ];

  const message = lines.join("\n");
  const encoded = encodeURIComponent(message);
  window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
};
