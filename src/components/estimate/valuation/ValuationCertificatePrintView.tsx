import React from "react";
import { ValuationCertificate } from "../../../types";

interface ValuationCertificatePrintViewProps {
  certificate: ValuationCertificate;
  fontScale?: "normal" | "compact" | "large";
  isCleanPrint?: boolean;
}

export const ValuationCertificatePrintView: React.FC<ValuationCertificatePrintViewProps> = ({
  certificate,
  fontScale = "normal",
  isCleanPrint = false
}) => {
  const formatDate = (dStr?: string) => {
    if (!dStr) return "";
    try {
      const parts = dStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dStr;
    } catch {
      return dStr;
    }
  };

  const scaleClasses = {
    compact: "text-[12px]",
    normal: "text-[13px] sm:text-[13.5px]",
    large: "text-[14.5px]"
  }[fontScale];

  const sectionLabel =
    certificate.sectionType === "28B"
      ? "[Under Section 28B of the Kerala Stamp Act, 1959]"
      : certificate.sectionType === "General"
      ? "[for Property Fair Value & Stamp Duty Assessment]"
      : "[Under Section 28C of the Kerala Stamp Act, 1959]";

  // Format owner and building address lines
  const ownerAndBuildingLines = React.useMemo(() => {
    const lines: string[] = [];
    if (certificate.ownerName) {
      lines.push(certificate.ownerName.trim());
    }
    const rawAddr = certificate.propertyAddress || certificate.ownerAddress || "";
    if (rawAddr) {
      // Split by newline if present
      const splitLines = rawAddr.split(/\n+/).map((l) => l.trim()).filter(Boolean);
      if (splitLines.length > 1) {
        splitLines.forEach((l) => {
          if (!lines.includes(l)) lines.push(l);
        });
      } else {
        // Split by comma if present
        const commaLines = rawAddr.split(/,\s*/).map((l) => l.trim()).filter(Boolean);
        if (commaLines.length > 1) {
          commaLines.forEach((l) => {
            if (!lines.includes(l)) lines.push(l);
          });
        } else {
          if (!lines.includes(rawAddr.trim())) lines.push(rawAddr.trim());
        }
      }
    }
    return lines.length > 0 ? lines : ["Ussainar", "Nellikkunnu", "Mucheeri po, Kongad"];
  }, [certificate.ownerName, certificate.propertyAddress, certificate.ownerAddress]);

  // Format building number
  const buildingNumberText = React.useMemo(() => {
    if (certificate.doorNo) {
      if (
        certificate.villagePanchayat &&
        !certificate.doorNo.includes("(") &&
        !certificate.doorNo.includes(certificate.villagePanchayat)
      ) {
        return `${certificate.doorNo}(${certificate.villagePanchayat})`;
      }
      return certificate.doorNo;
    }
    return certificate.villagePanchayat || "9/703(Kongad Grama Panchayth)";
  }, [certificate.doorNo, certificate.villagePanchayat]);

  // Format cost index lines
  const costIndexFormattedLines = React.useMemo(() => {
    const rawName = certificate.costIndexName || "";
    if (rawName.includes("DPAR") || rawName.includes("\n")) {
      return rawName.split(/[\n/]+/).map((l) => l.trim()).filter(Boolean);
    }
    // Calculate numeric cost index display
    const ciNum =
      certificate.costIndex > 10
        ? Math.round(certificate.costIndex)
        : Math.round(certificate.costIndex * 100);
    const locMatch = rawName.match(/^([a-zA-Z\s]+)/);
    const location = locMatch ? locMatch[1].replace(/cost index/i, "").trim() : "Palakkad";
    return [
      "DPAR",
      "2025 /",
      "Cost",
      `Index ${ciNum || 136}`,
      "For",
      location || "Palakkad"
    ];
  }, [certificate.costIndexName, certificate.costIndex]);

  // Base rate calculation
  const cpwdRate = certificate.cpwdRatePerSqM || 20750;
  const ratePerSqFtBase =
    certificate.ratePerSqFtBase || Math.round((cpwdRate / 10.7639) * 100) / 100;
  const ratePerSqFtBaseDisplay = Number(ratePerSqFtBase).toFixed(2);

  // Rate after applying cost index & depreciation
  const rateBeforeDepr =
    certificate.effectiveRatePerSqFt ||
    certificate.ratePerSqFtAdjusted ||
    Math.round(ratePerSqFtBase * (certificate.costIndex > 10 ? certificate.costIndex / 100 : certificate.costIndex || 1.36) * 100) / 100;
  const rateBeforeDeprDisplay = Number(rateBeforeDepr).toFixed(2);

  const finalValuation =
    certificate.grandTotalValuation ||
    certificate.netStructureValue ||
    certificate.grossStructureValue ||
    5200000;

  const areaSqFt = certificate.areaSqFt || 2925;
  const rateAfterDepr = areaSqFt > 0 ? (finalValuation / areaSqFt).toFixed(2) : "1777.77";

  const hasDepreciation =
    (certificate.ageOfBuilding && certificate.ageOfBuilding > 0) ||
    certificate.totalDepreciationPct > 0 ||
    certificate.depreciationAmount > 0;

  // Bullet points under Note
  const bulletPoints = React.useMemo(() => {
    const points: string[] = [];
    const age = certificate.ageOfBuilding !== undefined ? certificate.ageOfBuilding : 3;
    if (age > 0) {
      points.push(`The building is ${age} year old and the value furnished above is depreciated value.`);
    }

    const desc = certificate.buildingDescription || "";
    const rawLines = desc
      .split(/[\n;]+/)
      .map((l) => l.replace(/^[➢\->*\d.)\s]+/, "").trim())
      .filter(Boolean);

    // If custom non-default lines are present in description
    if (rawLines.length > 1 && !desc.includes("RCC framed structure with solid block")) {
      rawLines.forEach((l) => {
        if (!points.includes(l)) points.push(l);
      });
    } else {
      // Standard official valuation checklist as shown in attachment
      const defaults = [
        "RCC roof building",
        "Difference in main door",
        "Difference in windows",
        "Difference in electrical work",
        "Difference in plumbing work",
        "Difference in floor"
      ];
      defaults.forEach((d) => {
        if (!points.includes(d)) points.push(d);
      });
    }
    return points;
  }, [certificate.ageOfBuilding, certificate.buildingDescription]);

  // Determine official Valuer stamp details
  const valuerNameRaw = certificate.valuerName || "Pradeep ck";
  const isPradeep =
    valuerNameRaw.toLowerCase().includes("pradeep") ||
    (certificate.engineerSealId && certificate.engineerSealId === "pradeep");

  const isDeepak =
    valuerNameRaw.toLowerCase().includes("deepak") ||
    (certificate.engineerSealId && certificate.engineerSealId === "deepak");

  const isDibin =
    valuerNameRaw.toLowerCase().includes("dibin") ||
    (certificate.engineerSealId && certificate.engineerSealId === "dibin");

  const sealValuerName = isPradeep
    ? "PRADEEP C.K"
    : isDeepak
    ? "DEEPAK .C"
    : isDibin
    ? "DIBIN D"
    : valuerNameRaw.toUpperCase();

  const sealQualifications = isPradeep
    ? "ME in Structural Engineering"
    : isDeepak
    ? "B.Tech in Civil Engineering"
    : isDibin
    ? "Civil Engineer"
    : "";

  const sealDesignation = isPradeep
    ? "Registered Engineer-A"
    : isDeepak
    ? "Licensed Building SUPERVISOR-A"
    : isDibin
    ? "SUPERVISOR-B"
    : certificate.designation || "Registered Engineer-A";

  const sealRegNo = isPradeep
    ? "E-2050/08/12212/KKD/197/2018/EA"
    : isDeepak
    ? "E-2050/08/14087/KKD/318/2018/CA"
    : isDibin
    ? "LSGB/JDPKD/3361/2025-F5/SB"
    : certificate.regNo || "E-2050/08/12212/KKD/197/2018/EA";

  const sealDepartment = "Department of Urban Affairs";
  const sealState = "Govt. of Kerala";

  return (
    <div
      id="valuation-cert-printable"
      className={`bg-white text-black w-full max-w-[210mm] mx-auto p-8 sm:p-12 md:p-14 shadow-2xl rounded-none border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full select-text ${scaleClasses}`}
      style={{
        minHeight: "297mm",
        boxSizing: "border-box",
        backgroundColor: "#ffffff",
        fontFamily: "'Times New Roman', Times, 'Nimbus Roman No9 L', Georgia, serif"
      }}
    >
      {/* =========================================================================
          1. TITLE & SUBTITLE (EXACTLY MATCHING ATTACHMENT)
         ========================================================================= */}
      <div className="text-center mb-6 sm:mb-7">
        <h1 className="text-[17px] sm:text-[18.5px] font-bold text-black font-serif leading-tight tracking-normal">
          Valuation Certificate Submitted before the Sub Registrar
        </h1>
        <div className="text-[13px] sm:text-[14px] italic font-serif text-black mt-1 font-normal">
          {sectionLabel}
        </div>
      </div>

      {/* =========================================================================
          2. PARTICULARS SECTION (7 ROWS WITH PRECISELY ALIGNED COLONS)
         ========================================================================= */}
      <div className="space-y-2 mb-4 font-serif text-black leading-snug">
        {/* Row 1: Name and address of the Valuer */}
        <div className="flex items-start text-[13px] sm:text-[13.5px]">
          <div className="w-[220px] sm:w-[245px] shrink-0 font-bold">
            Name and address of the Valuer
          </div>
          <div className="w-5 shrink-0 font-normal">:</div>
          <div className="flex-1 font-medium leading-snug">
            <div>{certificate.valuerName || "Pradeep ck"}</div>
            <div>
              {certificate.valuerAddress || "Kanjirani (H), Parakkad, Kalladikode -678596"}
            </div>
          </div>
        </div>

        {/* Row 2: Designation */}
        <div className="flex items-start text-[13px] sm:text-[13.5px]">
          <div className="w-[220px] sm:w-[245px] shrink-0 font-bold">
            Designation
          </div>
          <div className="w-5 shrink-0 font-normal">:</div>
          <div className="flex-1 font-medium">
            {certificate.designation || "Licenced Building Engineer –A"}
          </div>
        </div>

        {/* Row 3: Registration Number */}
        <div className="flex items-start text-[13px] sm:text-[13.5px]">
          <div className="w-[220px] sm:w-[245px] shrink-0 font-bold">
            Registration Number
          </div>
          <div className="w-5 shrink-0 font-normal">:</div>
          <div className="flex-1 font-medium">
            {certificate.regNo || "E-2050/08/12212/KKD/197/2018/EA"}
          </div>
        </div>

        {/* Row 4: Sub Registry Office */}
        <div className="flex items-start text-[13px] sm:text-[13.5px]">
          <div className="w-[220px] sm:w-[245px] shrink-0 font-bold">
            Sub Registry Office
          </div>
          <div className="w-5 shrink-0 font-normal">:</div>
          <div className="flex-1 font-medium">
            {certificate.subRegistryOffice || "Kadambazhipuram"}
          </div>
        </div>

        {/* Row 5: Date of Inspection */}
        <div className="flex items-start text-[13px] sm:text-[13.5px]">
          <div className="w-[220px] sm:w-[245px] shrink-0 font-bold">
            Date of Inspection
          </div>
          <div className="w-5 shrink-0 font-normal">:</div>
          <div className="flex-1 font-medium">
            {formatDate(certificate.inspectionDate) || "02-09-2026"}
          </div>
        </div>

        {/* Row 6: Name and Address of the building */}
        <div className="flex items-start text-[13px] sm:text-[13.5px]">
          <div className="w-[220px] sm:w-[245px] shrink-0 font-bold">
            Name and Address of the building
          </div>
          <div className="w-5 shrink-0 font-normal">:</div>
          <div className="flex-1 font-medium leading-snug space-y-0.5">
            {ownerAndBuildingLines.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </div>
        </div>

        {/* Row 7: Building number */}
        <div className="flex items-start text-[13px] sm:text-[13.5px]">
          <div className="w-[220px] sm:w-[245px] shrink-0 font-bold">
            Building number
          </div>
          <div className="w-5 shrink-0 font-normal">:</div>
          <div className="flex-1 font-medium">
            {buildingNumberText}
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. 6-COLUMN VALUATION TABLE (EXACT APPENDIX FORMAT FROM ATTACHMENT)
         ========================================================================= */}
      <div className="my-3 overflow-x-auto">
        <table className="w-full border-collapse border border-black text-black font-serif bg-white">
          <thead>
            <tr className="text-black font-bold text-[11px] sm:text-[11.5px] leading-tight">
              {/* Col 1 */}
              <th className="border border-black p-1.5 sm:p-2 text-left font-bold align-top w-[15%]">
                <div>Rate Per Sq. M</div>
                <div>as per CPWD</div>
                <div>Rates</div>
                <div>(2025)</div>
              </th>

              {/* Col 2 */}
              <th className="border border-black p-1.5 sm:p-2 text-left font-bold align-top w-[9%]">
                <div>Rate Per</div>
                <div>Sq. Ft</div>
              </th>

              {/* Col 3 */}
              <th className="border border-black p-1.5 sm:p-2 text-left font-bold align-top w-[14%]">
                <div>Name of</div>
                <div>relevant</div>
                <div>Cost</div>
                <div>Index</div>
                <div>applied</div>
                <div>(Name /</div>
                <div>Cost</div>
                <div>Index)</div>
              </th>

              {/* Col 4 */}
              <th className="border border-black p-1.5 sm:p-2 text-left font-bold align-top w-[18%]">
                <div>Rate per Sq. Ft</div>
                <div>after applying</div>
                <div>Cost Index</div>
              </th>

              {/* Col 5 */}
              <th className="border border-black p-1.5 sm:p-2 text-left font-bold align-top w-[17%]">
                <div>Area of the</div>
                <div>Building (in Sq.</div>
                <div>Ft)</div>
              </th>

              {/* Col 6 */}
              <th className="border border-black p-1.5 sm:p-2 text-left font-bold align-top w-[27%]">
                <div>Total Value ( in</div>
                <div>Rupees) Rounded</div>
                <div>Figure</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-[12px] sm:text-[12.5px] font-medium leading-snug align-top">
              {/* Col 1 */}
              <td className="border border-black p-2 align-top font-medium">
                Rs {cpwdRate}
              </td>

              {/* Col 2 */}
              <td className="border border-black p-2 align-top font-medium">
                <div>Rs</div>
                <div>{ratePerSqFtBaseDisplay}</div>
              </td>

              {/* Col 3 */}
              <td className="border border-black p-2 align-top leading-tight font-medium">
                {costIndexFormattedLines.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </td>

              {/* Col 4 */}
              <td className="border border-black p-2 align-top leading-tight font-medium">
                <div>Rs {rateBeforeDeprDisplay}</div>
                {hasDepreciation && (
                  <div className="mt-1">
                    <div>(Rate after</div>
                    <div>applying</div>
                    <div>Depreciation)</div>
                    <div className="mt-0.5 pl-2">Rs.{rateAfterDepr}</div>
                  </div>
                )}
              </td>

              {/* Col 5 */}
              <td className="border border-black p-2 align-top font-medium">
                {areaSqFt} Sq Ft
              </td>

              {/* Col 6 */}
              <td className="border border-black p-2 align-top font-bold">
                Rs {Number(finalValuation).toLocaleString("en-IN")}/-
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          4. NOTE & ARROWHEAD BULLET POINTS (EXACTLY AS PER ATTACHMENT)
         ========================================================================= */}
      <div className="text-[12px] sm:text-[12.5px] font-serif text-black mt-2 mb-2 leading-snug">
        <div className="font-bold">
          *Note- The rate calculated as per CPWD rate and depreciation is taken as per the age of  building, present condition and other aspects.
        </div>

        {/* Indented bullet points with arrowhead symbol */}
        <div className="pl-6 sm:pl-9 space-y-0.5 my-1.5">
          {bulletPoints.map((bp, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[13px] leading-tight font-bold shrink-0 select-none">
                ➢
              </span>
              <span>{bp}</span>
            </div>
          ))}
        </div>

        {/* Certification sentence */}
        <div className="font-bold mt-2.5 mb-4">
          I hereby certify that the information furnished above is true to the best of my knowledge.
        </div>
      </div>

      {/* =========================================================================
          5. PLACE, DATE & OFFICIAL SIGNATURE / STAMP BLOCK
         ========================================================================= */}
      <div className="flex justify-between items-end mt-4 pt-1 font-serif text-black">
        {/* Left: Place & Date */}
        <div className="space-y-1 text-[13px] sm:text-[13.5px] font-bold">
          <div className="flex items-center">
            <span className="w-14">Place</span>
            <span className="mr-2">:</span>
            <span className="font-normal font-serif">
              {certificate.place || "Kalladikode"}
            </span>
          </div>
          <div className="flex items-center">
            <span className="w-14">Date</span>
            <span className="mr-2">:</span>
            <span className="font-normal font-serif">
              {formatDate(certificate.certificateDate) || "02-09-2026"}
            </span>
          </div>
        </div>

        {/* Right: Signature & Stamp (Matching attachment's exact authentic seal) */}
        <div className="relative text-center select-none pr-1">
          <div className="relative flex flex-col items-center">
            {/* Guide label underneath signature */}
            <div className="text-[11px] font-serif text-slate-500 italic -mb-2">
              Signature with seal
            </div>

            {/* Handwritten Signature graphic */}
            <div className="relative -mt-2 -mb-2.5 z-10">
              <svg
                viewBox="0 0 160 50"
                className="w-36 h-12 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 14 34 C 20 12, 28 8, 33 16 C 38 24, 30 40, 26 42 C 24 43, 30 30, 36 22 C 42 14, 48 30, 52 26 C 56 22, 60 28, 65 24 C 70 20, 75 28, 80 23 C 85 18, 92 26, 98 18 C 105 10, 114 12, 108 26 C 100 44, 88 46, 142 38"
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Authentic Kerala Registered Engineer Rubber Stamp */}
            <div className="relative border-r-2 border-slate-900 pr-2.5 pl-3 py-0.5 text-center text-slate-900 leading-[1.25] font-sans">
              <div className="font-black text-[13px] tracking-wide uppercase">
                {sealValuerName}
              </div>
              {sealQualifications && (
                <div className="font-bold text-[10.5px]">
                  {sealQualifications}
                </div>
              )}
              <div className="font-bold text-[11px]">
                {sealDesignation}
              </div>
              <div className="font-bold text-[10px] tracking-tight">
                Reg. No: {sealRegNo}
              </div>
              <div className="font-bold text-[10.5px]">
                {sealDepartment}
              </div>
              <div className="font-bold text-[10.5px]">
                {sealState}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
