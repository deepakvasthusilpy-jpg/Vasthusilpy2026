import {
  PoovMalaBillRow,
  PoovMalaVendorConfig,
  KsebBillRecord,
  HealthInsurancePolicy,
  RdAccount,
  PanchayathBillRecord,
  PersonalVendor,
  PersonalVendorBill,
  StaffSalaryRecord
} from "../types";

// STORAGE KEYS
const STORAGE_KEY_POOV_MALA_ROWS = "vasthusilpy_poov_mala_rows_v2";
const STORAGE_KEY_POOV_MALA_CONFIG = "vasthusilpy_poov_mala_config_v1";
const STORAGE_KEY_KSEB_BILLS = "vasthusilpy_kseb_bills_v1";
const STORAGE_KEY_HEALTH_INSURANCE = "vasthusilpy_health_insurance_v1";
const STORAGE_KEY_RD_ACCOUNTS = "vasthusilpy_rd_accounts_v1";
const STORAGE_KEY_PANCHAYATH_BILLS = "vasthusilpy_panchayath_bills_v1";
const STORAGE_KEY_PERSONAL_VENDORS = "vasthusilpy_personal_vendors_v1";
const STORAGE_KEY_VENDOR_BILLS = "vasthusilpy_personal_vendor_bills_v1";
const STORAGE_KEY_STAFF_SALARY = "vasthusilpy_staff_salary_records_v1";

// 1. DEFAULT POOV MALA ROWS (Empty by default - No demo data)
export const DEFAULT_POOV_MALA_CONFIG: PoovMalaVendorConfig = {
  vendorName: "RANJITH POOV MALA",
  gpayNumber: "9446669832",
  upiId: "9446669832-2@ybl",
  defaultDailyRate: 20,
  address: "Poov Mala, Keralassery, Palakkad, Kerala",
  bankDetails: {
    accountNumber: "67123456789",
    ifscCode: "SBIN0070123",
    bankName: "State Bank of India",
  }
};

// Clean initial state - Zero Demo Data as requested by user
export const DEFAULT_POOV_MALA_ROWS: PoovMalaBillRow[] = [];

// 2. DEFAULT KSEB BILL RECORDS (Empty - Ready for fresh records)
export const DEFAULT_KSEB_BILLS: KsebBillRecord[] = [];

// 3. DEFAULT HEALTH INSURANCE POLICIES (Empty - Ready for fresh records)
export const DEFAULT_HEALTH_INSURANCE: HealthInsurancePolicy[] = [];

// 4. DEFAULT RD ACCOUNTS (Empty - Ready for fresh records)
export const DEFAULT_RD_ACCOUNTS: RdAccount[] = [];

// 5. DEFAULT PANCHAYATH FEES (Empty - Ready for fresh records)
export const DEFAULT_PANCHAYATH_BILLS: PanchayathBillRecord[] = [];

// 6. DEFAULT PERSONAL VENDORS (Empty - Ready for fresh records)
export const DEFAULT_PERSONAL_VENDORS: PersonalVendor[] = [];

// 7. DEFAULT VENDOR BILLS (Empty - Ready for fresh records)
export const DEFAULT_PERSONAL_VENDOR_BILLS: PersonalVendorBill[] = [];

// HELPER: Detailed Date & Sunday Calculation between two dates
export interface DateRangeAnalysis {
  totalDays: number;
  sundays: number;
  workingDays: number;
  sundayDates: string[];
  formattedStartDate: string;
  formattedEndDate: string;
  isValid: boolean;
}

export function parseDateFlexible(str: string): Date | null {
  if (!str) return null;
  const trimmed = str.trim();
  if (trimmed.includes("-")) {
    const parts = trimmed.split("-");
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return isNaN(d.getTime()) ? null : d;
    } else {
      // DD-MM-YYYY
      const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      return isNaN(d.getTime()) ? null : d;
    }
  } else if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    if (parts[2]?.length === 4) {
      // DD/MM/YYYY
      const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      return isNaN(d.getTime()) ? null : d;
    }
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateToDMY(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function countSundaysBetween(startDateStr: string, endDateStr: string): { totalDays: number; sundays: number; workingDays: number; sundayDates: string[] } {
  const analysis = calculatePoovMalaPeriodDays(startDateStr, endDateStr);
  return {
    totalDays: analysis.totalDays,
    sundays: analysis.sundays,
    workingDays: analysis.workingDays,
    sundayDates: analysis.sundayDates
  };
}

export function calculatePoovMalaPeriodDays(startDateStr: string, endDateStr: string): DateRangeAnalysis {
  try {
    const start = parseDateFlexible(startDateStr);
    const end = parseDateFlexible(endDateStr);

    if (!start || !end || end < start) {
      return {
        totalDays: 0,
        sundays: 0,
        workingDays: 0,
        sundayDates: [],
        formattedStartDate: startDateStr,
        formattedEndDate: endDateStr,
        isValid: false
      };
    }

    let totalDays = 0;
    let sundays = 0;
    const sundayDates: string[] = [];
    const cur = new Date(start);

    while (cur <= end) {
      totalDays++;
      if (cur.getDay() === 0) {
        // Sunday
        sundays++;
        sundayDates.push(formatDateToDMY(cur));
      }
      cur.setDate(cur.getDate() + 1);
    }

    return {
      totalDays,
      sundays,
      workingDays: totalDays - sundays,
      sundayDates,
      formattedStartDate: formatDateToDMY(start),
      formattedEndDate: formatDateToDMY(end),
      isValid: true
    };
  } catch {
    return {
      totalDays: 0,
      sundays: 0,
      workingDays: 0,
      sundayDates: [],
      formattedStartDate: startDateStr,
      formattedEndDate: endDateStr,
      isValid: false
    };
  }
}

// ==========================================
// UNIVERSAL WHATSAPP SHARING UTILITY
// ==========================================

export interface WhatsAppShareOptions {
  phone?: string;
  text: string;
}

export function shareViaWhatsApp({ phone, text }: WhatsAppShareOptions): void {
  const encodedText = encodeURIComponent(text);
  let url = `https://api.whatsapp.com/send?text=${encodedText}`;
  
  if (phone) {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) {
      url = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodedText}`;
    } else if (cleanPhone.length >= 11) {
      url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    }
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

// 1. POOV MALA SINGLE ROW WHATSAPP MESSAGE
export function generatePoovMalaWhatsAppMessage(
  row: PoovMalaBillRow,
  vendor: PoovMalaVendorConfig
): string {
  const workingDays = (row.daysExcludeSundays || 0) - (row.otherLeave || 0);
  const due = Math.max(0, row.amount - row.paidAmount);

  return `🌸 *പൂവ് മാല ബിൽ & പേയ്‌മെന്റ് സ്റ്റേറ്റ്‌മെന്റ്* 🌸
*വാസ്തുശില്പി ആർക്കിടെക്ചറൽ & എൻജിനീയറിങ്*
----------------------------------------
👤 *വെണ്ടർ:* ${vendor.vendorName}
📱 *GPay / Phone:* ${vendor.gpayNumber}
🗓️ *കാലാവധി (Period):* ${row.dateFrom} മുതൽ ${row.dateTo} വരെ

📊 *കണക്കുകൂട്ടൽ വിവരങ്ങൾ (Calculation):*
• ഞായറാഴ്ചകൾ ഒഴികെയുള്ള ദിവസങ്ങൾ: ${row.daysExcludeSundays} Days
• മറ്റ് അവധികൾ (Leaves): ${row.otherLeave} Day(s)
${row.remarks ? `• അവധി വിവരണം: ${row.remarks}\n` : ""}${row.leaveDetails ? `• അവധി വിവരങ്ങൾ: ${row.leaveDetails}\n` : ""}• ആകെ പ്രവർത്തന ദിനങ്ങൾ (Net Working Days): *${workingDays} Days*
• പ്രതിദിന നിരക്ക് (Rate per Mala): ₹${row.ratePerDay}/Day
• *ആകെ ബിൽ തുക (Total Bill Amount): ₹${row.amount.toLocaleString("en-IN")}*

💳 *പേയ്‌മെന്റ് വിവരങ്ങൾ (Payment Details):*
• നൽകിയ തുക (Paid Amount): ₹${(row.paidAmount || 0).toLocaleString("en-IN")}${row.paidDate ? ` (തീയതി: ${row.paidDate})` : ""}
• ബാക്കി നൽകാനുള്ളത് (Balance Due): *₹${due.toLocaleString("en-IN")}*
• സ്റ്റാറ്റസ്: *${row.status}*
${row.paymentMode ? `• പേയ്‌മെന്റ് രീതി: ${row.paymentMode}` : ""}
${row.transactionRef ? `• ട്രാൻസാക്ഷൻ റഫറൻസ്: ${row.transactionRef}` : ""}

📲 *GPay / UPI Payment:*
• Payee: ${vendor.vendorName}
• UPI ID / GPay: ${vendor.upiId || vendor.gpayNumber}
----------------------------------------
_Generated via Vasthusilpy Office Accounts Engine_`;
}

// 2. POOV MALA FULL SUMMARY WHATSAPP MESSAGE
export function generatePoovMalaSummaryWhatsAppMessage(
  rows: PoovMalaBillRow[],
  vendor: PoovMalaVendorConfig
): string {
  const totalBill = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalPaid = rows.reduce((s, r) => s + (Number(r.paidAmount) || 0), 0);
  const totalDue = Math.max(0, totalBill - totalPaid);

  let msg = `🌸 *പൂവ് മാല ബിൽ പൂർണ്ണ സ്റ്റേറ്റ്‌മെന്റ്* 🌸
*വാസ്തുശില്പി ആർക്കിടെക്ചറൽ & എൻജിനീയറിങ്*
----------------------------------------
👤 *വെണ്ടർ:* ${vendor.vendorName}
📱 *GPay / Mobile:* ${vendor.gpayNumber}
📊 *ആകെ ബിൽ പീരിയഡുകൾ:* ${rows.length}

📋 *കാലാവധി വിവരങ്ങൾ:*
`;

  rows.forEach((r, idx) => {
    const wd = (r.daysExcludeSundays || 0) - (r.otherLeave || 0);
    msg += `\n${idx + 1}. *${r.dateFrom} - ${r.dateTo}*
   • ദിവസങ്ങൾ: ${wd} Days (Leave: ${r.otherLeave})
   • ബിൽ: ₹${r.amount} | നൽകിയത്: ₹${r.paidAmount} | Status: ${r.status}${r.remarks ? `\n   • കുറിപ്പ്: ${r.remarks}` : ""}`;
  });

  msg += `\n
----------------------------------------
💰 *ആകെ ബിൽ തുക (Total Bill):* ₹${totalBill.toLocaleString("en-IN")}
✅ *ആകെ നൽകിയത് (Total Paid):* ₹${totalPaid.toLocaleString("en-IN")}
⚠️ *ബാക്കി കുടിശ്ശിക (Total Due):* ₹${totalDue.toLocaleString("en-IN")}

📲 *GPay UPI Payment:* ${vendor.gpayNumber} (${vendor.vendorName})
----------------------------------------
_Generated via Vasthusilpy Office Accounts Engine_`;

  return msg;
}

// 3. KSEB WHATSAPP MESSAGE
export function generateKsebWhatsAppMessage(bill: KsebBillRecord): string {
  const due = Math.max(0, bill.totalAmount - bill.paidAmount);

  return `⚡ *KSEB വൈദ്യുതി ബിൽ വിവരങ്ങൾ* ⚡
*വാസ്തുശില്പി ഓഫീസ് അക്കൗണ്ട്സ്*
----------------------------------------
🏢 *കൺസ്യൂമർ പേര്:* ${bill.consumerName}
🔢 *കൺസ്യൂമർ നമ്പർ:* ${bill.consumerNo}
📍 *സെക്ഷൻ:* ${bill.sectionName}
🗓️ *ബിൽ മാസം (Month):* ${bill.billMonth}

📊 *വൈദ്യുതി ഉപയോഗവും തുകയും:*
• ആകെ ഉപയോഗം: *${bill.unitsConsumed} Units (kWh)*
• എനർജി ചാർജ്: ₹${bill.energyCharges}
• ഫിക്സഡ് ചാർജ്: ₹${bill.fixedCharges}
• മീറ്റർ റെന്റ്: ₹${bill.meterRent}
• ഇലക്ട്രിസിറ്റി ഡ്യൂട്ടി (10%): ₹${bill.electricityDuty}
• *ആകെ ബിൽ തുക: ₹${bill.totalAmount.toLocaleString("en-IN")}*

📅 *പ്രധാന തീയതികൾ:*
• ബിൽ തീയതി: ${bill.billDate}
• അടയ്ക്കേണ്ട അവസാന തീയതി (Due Date): *${bill.dueDate}*
${bill.disconnectionDate ? `• വിച്ഛേദന തീയതി (Disconnection): ${bill.disconnectionDate}\n` : ""}
💳 *പേയ്‌മെന്റ് സ്റ്റാറ്റസ്:* *${bill.status}*
${bill.paidAmount > 0 ? `• നൽകിയ തുക: ₹${bill.paidAmount.toLocaleString("en-IN")} (${bill.paidDate || ""})\n` : ""}• ബാക്കി തുക: *₹${due.toLocaleString("en-IN")}*

🌐 *KSEB Quick-Pay Link:*
https://wss.kseb.in/selfservices/quickpay
----------------------------------------
_Generated via Vasthusilpy Office Accounts Engine_`;
}

// 4. HEALTH INSURANCE WHATSAPP MESSAGE
export function generateHealthInsuranceWhatsAppMessage(policy: HealthInsurancePolicy): string {
  return `🛡️ *ആരോഗ്യ ഇൻഷുറൻസ് പോളിസി വിവരങ്ങൾ* 🛡️
*വാസ്തുശില്പി പേഴ്സണൽ അക്കൗണ്ട്സ്*
----------------------------------------
🏥 *ഇൻഷുറർ:* ${policy.insurerName}
📄 *പോളിസി പേര്:* ${policy.policyName}
🔢 *പോളിസി നമ്പർ:* ${policy.policyNumber}
👤 *പോളിസി ഹോൾഡർ:* ${policy.policyHolderName}

👥 *ഇൻഷ്വർ ചെയ്ത കുടുംബാംഗങ്ങൾ:*
${policy.insuredMembers.map((m, i) => `${i + 1}. ${m.name} (${m.relation}, Age: ${m.age})`).join("\n")}

💰 *ഇൻഷുറൻസ് തുക & പ്രീമിയം:*
• സം ഇൻഷ്വേർഡ് (Sum Insured): *₹${policy.sumInsured.toLocaleString("en-IN")}*
${policy.cumulativeBonus ? `• ക്യുമുലേറ്റീവ് ബോണസ് (Bonus): ₹${policy.cumulativeBonus.toLocaleString("en-IN")}\n` : ""}• വാർഷിക പ്രീമിയം: ₹${policy.premiumAmount.toLocaleString("en-IN")} + GST: ₹${policy.gstAmount || 0}
• *ആകെ പ്രീമിയം: ₹${policy.totalPremium.toLocaleString("en-IN")}*

📅 *പോളിസി കാലാവധി & പുതുക്കൽ:*
• തുടക്കം: ${policy.policyStartDate}
• കാലാവധി: ${policy.policyEndDate}
• അടുത്ത പുതുക്കൽ തീയതി (Renewal Date): *${policy.nextRenewalDueDate}*
• സ്റ്റാറ്റസ്: *${policy.status}*

🚨 *ക്യാഷ്‌ലെസ്സ് എമർജൻസി ഹെൽപ്പ്‌ലൈൻ:*
${policy.cashlessHelpline || "1800-425-2255"}
${policy.agentContact ? `• ഏജന്റ് കോൺടാക്ട്: ${policy.agentContact}\n` : ""}----------------------------------------
_Generated via Vasthusilpy Office Accounts Engine_`;
}

// 5. RD ACCOUNT WHATSAPP MESSAGE
export function generateRdAccountWhatsAppMessage(account: RdAccount): string {
  const paidDeposits = account.deposits.filter((d) => d.status === "PAID");
  const totalPaid = paidDeposits.reduce((s, d) => s + d.paidAmount, 0);

  return `🏦 *ആവർത്തന നിക്ഷേപം (RD Account) സ്റ്റേറ്റ്‌മെന്റ്* 🏦
*വാസ്തുശില്പി പേഴ്സണൽ ഫിനാൻസ്*
----------------------------------------
🏛️ *ബാങ്ക് / പോസ്റ്റ് ഓഫീസ്:* ${account.bankOrPostOfficeName}
🔢 *അക്കൗണ്ട് നമ്പർ:* ${account.accountNumber}
👤 *അക്കൗണ്ട് ഉടമ:* ${account.accountHolderName}

💰 *നിക്ഷേപ വിവരങ്ങൾ:*
• പ്രതിമാസ തവണ (Monthly Deposit): *₹${account.monthlyInstallment.toLocaleString("en-IN")}*
• നിക്ഷേപ തീയതി: എല്ലാ മാസവും ${account.dueDayOfMonth}-ാം തീയതി
• കാലാവധി (Tenure): ${account.tenureMonths} Months (${Math.round(account.tenureMonths / 12)} Years)
• പലിശ നിരക്ക് (Interest Rate): ${account.interestRate}% p.a.
• മെച്യൂരിറ്റി തീയതി: ${account.maturityDate}
• *പ്രതീക്ഷിക്കുന്ന മെച്യൂരിറ്റി തുക: ₹${account.expectedMaturityAmount.toLocaleString("en-IN")}*

📊 *നിക്ഷേപ പുരോഗതി:*
• അടച്ചുതീർത്ത മാസങ്ങൾ: *${paidDeposits.length} / ${account.tenureMonths} Months*
• ആകെ നിക്ഷേപിച്ച തുക: *₹${totalPaid.toLocaleString("en-IN")}*
----------------------------------------
_Generated via Vasthusilpy Office Accounts Engine_`;
}

// 6. PANCHAYATH BILL WHATSAPP MESSAGE
export function generatePanchayathWhatsAppMessage(bill: PanchayathBillRecord): string {
  const due = Math.max(0, bill.totalPayable - bill.paidAmount);

  return `🏛️ *പഞ്ചായത്ത് ഫീസ് & നികുതി വിവരങ്ങൾ* 🏛️
*വാസ്തുശില്പി ഓഫീസ് അക്കൗണ്ട്സ്*
----------------------------------------
🏛️ *പഞ്ചായത്ത്:* ${bill.panchayathName}
📍 *വാർഡ് / ഡോർ നമ്പർ:* Ward ${bill.wardNo} / ${bill.doorOrPremiseNo}
📋 *ഇനം:* ${bill.customFeeName || bill.feeType}
🔢 *ലൈസൻസ് / അസസ്സ്മെന്റ് നമ്പർ:* ${bill.assessmentOrLicenceNo}
🗓️ *സാമ്പത്തിക വർഷം (Financial Year):* ${bill.financialYear}

💰 *ഫീസ് വിവരങ്ങൾ:*
• അടിസ്ഥാന തുക: ₹${bill.feeAmount.toLocaleString("en-IN")}
• സർവീസ് സെസ്സ്: ₹${bill.serviceCess || 0}
• ലൈബ്രറി സെസ്സ്: ₹${bill.libraryCess || 0}
• *ആകെ അടയ്ക്കേണ്ട തുക: ₹${bill.totalPayable.toLocaleString("en-IN")}*

📅 *തീയതിയും സ്റ്റാറ്റസും:*
• അവസാന തീയതി (Due Date): ${bill.dueDate}
• സ്റ്റാറ്റസ്: *${bill.status}*
${bill.paidAmount > 0 ? `• അടച്ച തുക: ₹${bill.paidAmount.toLocaleString("en-IN")} (തീയതി: ${bill.paidDate || ""})\n` : ""}• ബാക്കി കുടിശ്ശിക: *₹${due.toLocaleString("en-IN")}*
${bill.challanOrReceiptNo ? `• രസീത് / ചലാൻ നമ്പർ: ${bill.challanOrReceiptNo}\n` : ""}${bill.ksmartRefNo ? `• K-SMART റഫറൻസ്: ${bill.ksmartRefNo}\n` : ""}
🌐 *K-SMART പോർട്ടൽ ലിങ്ക്:*
https://smart.kerala.gov.in
----------------------------------------
_Generated via Vasthusilpy Office Accounts Engine_`;
}

// 7. VENDOR & BILL WHATSAPP MESSAGE
export function generateVendorBillWhatsAppMessage(
  bill: PersonalVendorBill,
  vendor?: PersonalVendor
): string {
  const due = Math.max(0, bill.billAmount - bill.paidAmount);

  return `🧾 *വെണ്ടർ ബിൽ & പേയ്‌മെന്റ് വിവരങ്ങൾ* 🧾
*വാസ്തുശില്പി ഓഫീസ് അക്കൗണ്ട്സ്*
----------------------------------------
👤 *വെണ്ടർ:* ${bill.vendorName}${vendor?.businessOrShopName ? ` (${vendor.businessOrShopName})` : ""}
📱 *മൊബൈൽ / GPay:* ${vendor?.gpayNumber || vendor?.mobileNumber || "N/A"}
📄 *ബിൽ നമ്പർ:* ${bill.billNumber}
🗓️ *ബിൽ തീയതി:* ${bill.billDate} (Due: ${bill.dueDate})
📝 *വിവരണം:* ${bill.serviceOrParticulars}

💰 *ബിൽ തുക & പേയ്‌മെന്റ്:*
• ആകെ ബിൽ തുക: *₹${bill.billAmount.toLocaleString("en-IN")}*
• നൽകിയ തുക: ₹${bill.paidAmount.toLocaleString("en-IN")}${bill.paidDate ? ` (${bill.paidDate})` : ""}
• ബാക്കി നൽകാനുള്ളത്: *₹${due.toLocaleString("en-IN")}*
• സ്റ്റാറ്റസ്: *${bill.status}*
${bill.paymentMode ? `• പേയ്‌മെന്റ് മോഡ്: ${bill.paymentMode}\n` : ""}${bill.transactionReference ? `• UTR / റഫറൻസ്: ${bill.transactionReference}\n` : ""}${bill.notes ? `• കുറിപ്പ്: ${bill.notes}\n` : ""}
📲 *GPay / UPI Payment Details:*
• Payee: ${vendor?.vendorName || bill.vendorName}
• UPI ID: ${vendor?.upiId || vendor?.gpayNumber || "UPI"}
----------------------------------------
_Generated via Vasthusilpy Office Accounts Engine_`;
}

export function generateVendorContactWhatsAppMessage(vendor: PersonalVendor): string {
  return `👤 *വെണ്ടർ കോൺടാക്ട് വിവരങ്ങൾ - VASTHUSILPY* 👤
----------------------------------------
📛 *പേര്:* ${vendor.vendorName}
🏪 *സ്ഥാപനം:* ${vendor.businessOrShopName || vendor.vendorName}
🏷️ *വിഭാഗം:* ${vendor.category}
📱 *മൊബൈൽ:* ${vendor.mobileNumber}
${vendor.alternateMobile ? `📞 *മറ്റ് നമ്പർ:* ${vendor.alternateMobile}\n` : ""}📍 *വിലാസം:* ${vendor.address || "N/A"}
💳 *GPay / UPI:* ${vendor.gpayNumber || vendor.upiId || "N/A"}
${vendor.bankDetails?.accountNumber ? `🏦 *ബാങ്ക്:* ${vendor.bankDetails.bankName || ""} (A/C: ${vendor.bankDetails.accountNumber}, IFSC: ${vendor.bankDetails.ifscCode || ""})\n` : ""}${vendor.notes ? `📝 *കുറിപ്പ്:* ${vendor.notes}\n` : ""}----------------------------------------
_Saved in Vasthusilpy Personal Bills Directory_`;
}

// ==========================================
// CRUD STORAGE UTILITIES
// ==========================================

// Broadcast Event
function notifyStorageUpdate() {
  window.dispatchEvent(new Event("vasthusilpy_storage_update"));
  window.dispatchEvent(new Event("personal_bills_updated"));
}

// 1. POOV MALA
export function loadPoovMalaRows(): PoovMalaBillRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POOV_MALA_ROWS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_POOV_MALA_ROWS, JSON.stringify(DEFAULT_POOV_MALA_ROWS));
      return DEFAULT_POOV_MALA_ROWS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_POOV_MALA_ROWS;
  }
}

export function savePoovMalaRows(rows: PoovMalaBillRow[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_POOV_MALA_ROWS, JSON.stringify(rows));
    notifyStorageUpdate();
  } catch (e) {
    console.error("Failed to save Poov Mala rows", e);
  }
}

export function loadPoovMalaConfig(): PoovMalaVendorConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POOV_MALA_CONFIG);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_POOV_MALA_CONFIG, JSON.stringify(DEFAULT_POOV_MALA_CONFIG));
      return DEFAULT_POOV_MALA_CONFIG;
    }
    const parsed = JSON.parse(raw);
    // Auto-update legacy UPI ID if it was the old default
    if (!parsed.upiId || parsed.upiId === "9446669832@okaxis" || parsed.upiId === "9446669832") {
      parsed.upiId = "9446669832-2@ybl";
      localStorage.setItem(STORAGE_KEY_POOV_MALA_CONFIG, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return DEFAULT_POOV_MALA_CONFIG;
  }
}

export function savePoovMalaConfig(config: PoovMalaVendorConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_POOV_MALA_CONFIG, JSON.stringify(config));
    notifyStorageUpdate();
  } catch (e) {
    console.error("Failed to save Poov Mala config", e);
  }
}

// 2. KSEB BILLS
export function loadKsebBills(): KsebBillRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KSEB_BILLS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_KSEB_BILLS, JSON.stringify(DEFAULT_KSEB_BILLS));
      return DEFAULT_KSEB_BILLS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_KSEB_BILLS;
  }
}

export function saveKsebBills(bills: KsebBillRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_KSEB_BILLS, JSON.stringify(bills));
    notifyStorageUpdate();
  } catch (e) {
    console.error("Failed to save KSEB bills", e);
  }
}

// 3. HEALTH INSURANCE
export function loadHealthInsurancePolicies(): HealthInsurancePolicy[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HEALTH_INSURANCE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_HEALTH_INSURANCE, JSON.stringify(DEFAULT_HEALTH_INSURANCE));
      return DEFAULT_HEALTH_INSURANCE;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_HEALTH_INSURANCE;
  }
}

export function saveHealthInsurancePolicies(policies: HealthInsurancePolicy[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_HEALTH_INSURANCE, JSON.stringify(policies));
    notifyStorageUpdate();
  } catch (e) {
    console.error("Failed to save Health Insurance policies", e);
  }
}

// 4. RD ACCOUNTS
export function loadRdAccounts(): RdAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RD_ACCOUNTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_RD_ACCOUNTS, JSON.stringify(DEFAULT_RD_ACCOUNTS));
      return DEFAULT_RD_ACCOUNTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_RD_ACCOUNTS;
  }
}

export function saveRdAccounts(accounts: RdAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_RD_ACCOUNTS, JSON.stringify(accounts));
    notifyStorageUpdate();
  } catch (e) {
    console.error("Failed to save RD accounts", e);
  }
}

// 5. PANCHAYATH BILLS
export function loadPanchayathBills(): PanchayathBillRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PANCHAYATH_BILLS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PANCHAYATH_BILLS, JSON.stringify(DEFAULT_PANCHAYATH_BILLS));
      return DEFAULT_PANCHAYATH_BILLS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PANCHAYATH_BILLS;
  }
}

export function savePanchayathBills(bills: PanchayathBillRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PANCHAYATH_BILLS, JSON.stringify(bills));
    notifyStorageUpdate();
  } catch (e) {
    console.error("Failed to save Panchayath bills", e);
  }
}

// 6. PERSONAL VENDORS
export function loadPersonalVendors(): PersonalVendor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PERSONAL_VENDORS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PERSONAL_VENDORS, JSON.stringify(DEFAULT_PERSONAL_VENDORS));
      return DEFAULT_PERSONAL_VENDORS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PERSONAL_VENDORS;
  }
}

export function savePersonalVendors(vendors: PersonalVendor[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PERSONAL_VENDORS, JSON.stringify(vendors));
    notifyStorageUpdate();
  } catch (e) {
    console.error("Failed to save personal vendors", e);
  }
}

// 7. VENDOR BILLS
export function loadPersonalVendorBills(): PersonalVendorBill[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VENDOR_BILLS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_VENDOR_BILLS, JSON.stringify(DEFAULT_PERSONAL_VENDOR_BILLS));
      return DEFAULT_PERSONAL_VENDOR_BILLS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PERSONAL_VENDOR_BILLS;
  }
}

export function savePersonalVendorBills(bills: PersonalVendorBill[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_VENDOR_BILLS, JSON.stringify(bills));
    notifyStorageUpdate();
  } catch (e) {
    console.error("Failed to save personal vendor bills", e);
  }
}

// 8. STAFF SALARY & OTHER PAYMENTS
export const DEFAULT_STAFF_SALARY_RECORDS: StaffSalaryRecord[] = [];

export function loadStaffSalaryRecords(): StaffSalaryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STAFF_SALARY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_STAFF_SALARY, JSON.stringify(DEFAULT_STAFF_SALARY_RECORDS));
      return DEFAULT_STAFF_SALARY_RECORDS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_STAFF_SALARY_RECORDS;
  }
}

export function saveStaffSalaryRecords(records: StaffSalaryRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_STAFF_SALARY, JSON.stringify(records));
    notifyStorageUpdate();
  } catch (e) {
    console.error("Failed to save staff salary records", e);
  }
}

// Generate UPI Payment URI
export function generateUpiUri(upiIdOrPhone: string, payeeName: string, amount: number, note: string): string {
  let pa = (upiIdOrPhone || "9446669832-2@ybl").trim();
  if (!pa.includes("@")) {
    if (pa === "9446669832") {
      pa = "9446669832-2@ybl";
    } else {
      pa = `${pa}@okaxis`;
    }
  }
  const pn = encodeURIComponent(payeeName || "RANJITH POOV MALA");
  const am = amount > 0 ? amount.toFixed(2) : "";
  const tn = encodeURIComponent(note || "Poov Mala Bill Payment");
  return am ? `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}` : `upi://pay?pa=${pa}&pn=${pn}&cu=INR&tn=${tn}`;
}

// Generate UPI QR Code URL
export function generateUpiQrUrl(upiIdOrPhone: string, payeeName: string, amount: number, note: string): string {
  const uri = generateUpiUri(upiIdOrPhone, payeeName, amount, note);
  return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(uri)}&margin=12&format=svg`;
}
