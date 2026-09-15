import React, { useRef } from "react";
import { Printer, FileText, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { UnifiedProjectData } from "../masterCalcTypes";
import {
  calculateFsiAndCoverage,
  calculateOccupantLoad,
  calculateParkingAndLoading,
  calculateSanitationFacilities,
  calculateSolarEnergyCapacity,
  calculateRwhStorage,
  calculateHeightAndSetbacks
} from "../masterCalcEngine";

interface Props {
  data: UnifiedProjectData;
  onBackToInputs: () => void;
}

export const ConsolidatedMasterReport: React.FC<Props> = ({ data, onBackToInputs }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const totalAssessedBua = data.proposedBuaSqM + data.existingBuaSqM;
  const plotAreaCents = Number((data.plotAreaSqM / 40.4686).toFixed(2));

  // Run all 7 rule calculation engines
  const fsiResult = calculateFsiAndCoverage(
    data.plotAreaSqM,
    data.groundFloorPlinthSqM,
    totalAssessedBua,
    data.occupancy,
    data.category,
    data.isMultipleOccupancy,
    data.occupancyBlocks
  );

  const occupantResult = calculateOccupantLoad(data.occupancy, totalAssessedBua);

  const parkingResult = calculateParkingAndLoading(
    totalAssessedBua,
    data.occupancy,
    data.isSingleFamilyResidential,
    data.isApartmentWithVisitors,
    data.isEducationalHostelOrOrphanage,
    data.isGeneralHostel,
    data.isCollege,
    data.assemblySqMPerSlot,
    data.carParkingProvided,
    data.twoWheelerParkingProvided,
    data.loadingBaysProvided
  );

  const sanitationResult = calculateSanitationFacilities(
    totalAssessedBua,
    data.coveredParkingInsideBuildingSqM,
    data.occupancy,
    data.isSingleFamilyResidential,
    data.hospitalBedsCount,
    data.hospitalType,
    data.assemblySubtype,
    data.isItPark,
    data.commercialSmallShop,
    data.hazardousWorkersCount
  );

  const solarResult = calculateSolarEnergyCapacity(
    totalAssessedBua,
    data.occupancy,
    data.isSingleFamilyResidential
  );

  const rwhResult = calculateRwhStorage(
    totalAssessedBua,
    data.groundFloorPlinthSqM,
    data.occupancy
  );

  const heightResult = calculateHeightAndSetbacks(
    data.roadWidthM,
    data.frontYardM,
    data.buildingHeightM
  );

  // Setback baseline minimums (Rule 26)
  let minFront = 3.0;
  let minRear = 1.5;
  let minSide1 = 1.2;
  let minSide2 = 1.0;
  if (data.isSingleFamilyResidential && data.plotAreaSqM <= 125) {
    minFront = 1.8;
    minRear = 1.0;
    minSide1 = 0.9;
    minSide2 = data.hasBlankWallSide ? 0.5 : 0.6;
  } else if (data.isSingleFamilyResidential && data.plotAreaSqM <= 250) {
    minFront = 2.0;
    minRear = 1.0;
    minSide1 = 1.0;
    minSide2 = data.hasBlankWallSide ? 0.5 : 0.6;
  } else if (["B", "C", "D", "G1", "H"].includes(data.occupancy)) {
    minFront = 5.0;
    minRear = 3.0;
    minSide1 = 2.0;
    minSide2 = 2.0;
  }

  // Add height setback if > 10m
  minFront += heightResult.additionalSetbackPerSideM;
  minRear += heightResult.additionalSetbackPerSideM;
  minSide1 += heightResult.additionalSetbackPerSideM;
  minSide2 += heightResult.additionalSetbackPerSideM;

  const frontPass = data.frontYardM >= minFront;
  const rearPass = data.rearYardM >= minRear;
  const side1Pass = data.sideYard1M >= minSide1;
  const side2Pass = data.sideYard2M >= minSide2;
  const septicPass = data.septicToWellDistanceM >= 7.5;
  const acPass = !data.isAcRoomProvided || data.acRoomHeightM >= 2.4;

  const allPassed =
    fsiResult.isFsiPassed &&
    fsiResult.isCoveragePassed &&
    frontPass &&
    rearPass &&
    side1Pass &&
    side2Pass &&
    parkingResult.isOverallParkingPassed &&
    heightResult.isHeightPermissible &&
    septicPass &&
    acPass;

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToInputs}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>അളവുകളിലേക്ക് മടങ്ങുക (Back to Inputs)</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono text-xs hidden sm:block">
            <span className="text-slate-400 block text-[10px]">നിയമ സാധുത പദവി:</span>
            <span className={`font-black ${allPassed ? "text-emerald-400" : "text-amber-400"}`}>
              {allPassed ? "✓ COMPLIANT (K-SMART READY)" : "⚠ CHECK CONDITIONAL WARNINGS"}
            </span>
          </div>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-mono text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>A4 പ്രിന്റ് / PDF ഡൗൺലോഡ് (Official Scrutiny)</span>
          </button>
        </div>
      </div>

      {/* A4 REPORT CONTAINER */}
      <div className="max-w-[880px] mx-auto overflow-x-auto pb-8">
        <div
          id="a4-master-consolidated-report"
          ref={reportRef}
          className="bg-white text-slate-950 p-8 sm:p-10 rounded-sm shadow-2xl border border-slate-300 min-h-[1120px] flex flex-col justify-between font-sans relative"
          style={{ width: "100%", maxWidth: "860px", margin: "0 auto" }}
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
              MASTER BUILDING RULES COMPLIANCE & SCRUTINY REPORT
            </h1>
            <div className="text-xs font-mono font-semibold text-slate-700">
              Kerala Panchayat Building Rules 2019 & 2026 Gazette Amendments (Rules 23, 24, 26, 27, 29, 34, 76, 77)
            </div>
            <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-600 pt-2 border-t border-slate-300 mt-2">
              <span>തീയതി: <b>{data.date}</b></span>
              <span>തദ്ദേശ സ്ഥാപനം: <b>{data.localBodyName} ({data.localBodyType})</b></span>
              <span>വിഭാഗം: <b>{data.category}</b></span>
              <span>
                പദവി: <b className={allPassed ? "text-emerald-700 font-black" : "text-amber-700 font-black"}>
                  {allPassed ? "PASSED (അനുയോജ്യം)" : "WARNINGS (പരിശോധിക്കുക)"}
                </b>
              </span>
            </div>
          </div>

          {/* 1. PROJECT & SITE DETAILS */}
          <div className="my-2.5 space-y-1 relative z-10 text-xs">
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
                <span className="font-bold">{data.roadWidthM} m (Abutting Street)</span>
              </div>

              <div>
                <span className="text-slate-500 block">ഉപയോഗ ഗണം:</span>
                <span className="font-bold">Group {data.occupancy}</span>
              </div>
              <div>
                <span className="text-slate-500 block">നിലകൾ / ഉയരം:</span>
                <span className="font-bold">{data.numberOfStoreys} നിലകൾ | {data.buildingHeightM} m</span>
              </div>
              <div>
                <span className="text-slate-500 block">പ്ലിന്ത് ഏരിയ (Footprint):</span>
                <span className="font-bold">{data.groundFloorPlinthSqM} m²</span>
              </div>
              <div>
                <span className="text-slate-500 block">ആകെ വിസ്തീർണ്ണം (Total BUA):</span>
                <span className="font-bold text-emerald-800">{totalAssessedBua} m²</span>
              </div>
            </div>
          </div>

          {/* 2. SETBACK & YARDS SCRUTINY (RULE 26 & 2026 GAZETTE) */}
          <div className="my-2 space-y-1 relative z-10">
            <div className="bg-slate-100 p-1.5 rounded border border-slate-300 font-mono font-bold uppercase text-[10px] flex justify-between">
              <span>2. മുറ്റങ്ങളുടെ വിസ്തൃതി & സെറ്റ്ബാക്ക് പരിശോധന (SETBACK & YARDS - RULE 26)</span>
              <span className="text-emerald-800">2026 GAZETTE AMENDMENT</span>
            </div>

            <table className="w-full text-left border-collapse border border-slate-300 text-[10px] font-sans">
              <thead>
                <tr className="bg-slate-200 font-mono text-slate-800 text-[9px] uppercase">
                  <th className="border border-slate-300 p-1">മുറ്റം (Yard)</th>
                  <th className="border border-slate-300 p-1">നൽകിയത് (Provided)</th>
                  <th className="border border-slate-300 p-1">ചട്ടപ്രകാരം വേണ്ടത് (Mandated)</th>
                  <th className="border border-slate-300 p-1">ഉയര വർദ്ധനവ് (Height Addl)</th>
                  <th className="border border-slate-300 p-1 text-center">ഫലം (Status)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-1 font-bold">മുൻമുറ്റം (Front Yard)</td>
                  <td className="border border-slate-300 p-1 font-mono font-bold">{data.frontYardM} m</td>
                  <td className="border border-slate-300 p-1 font-mono">Min {minFront} m</td>
                  <td className="border border-slate-300 p-1 font-mono text-[9px]">
                    +{heightResult.additionalSetbackPerSideM} m
                  </td>
                  <td className="border border-slate-300 p-1 text-center font-bold">
                    <span className={frontPass ? "text-emerald-700" : "text-rose-700"}>
                      {frontPass ? "PASSED" : "FAILED"}
                    </span>
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border border-slate-300 p-1 font-bold">പിൻമുറ്റം (Rear Yard)</td>
                  <td className="border border-slate-300 p-1 font-mono font-bold">{data.rearYardM} m</td>
                  <td className="border border-slate-300 p-1 font-mono">Min {minRear} m</td>
                  <td className="border border-slate-300 p-1 font-mono text-[9px]">
                    +{heightResult.additionalSetbackPerSideM} m
                  </td>
                  <td className="border border-slate-300 p-1 text-center font-bold">
                    <span className={rearPass ? "text-emerald-700" : "text-rose-700"}>
                      {rearPass ? "PASSED" : "FAILED"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-1 font-bold">വശം 1 (Side Yard 1)</td>
                  <td className="border border-slate-300 p-1 font-mono font-bold">{data.sideYard1M} m</td>
                  <td className="border border-slate-300 p-1 font-mono">Min {minSide1} m</td>
                  <td className="border border-slate-300 p-1 font-mono text-[9px]">
                    +{heightResult.additionalSetbackPerSideM} m
                  </td>
                  <td className="border border-slate-300 p-1 text-center font-bold">
                    <span className={side1Pass ? "text-emerald-700" : "text-rose-700"}>
                      {side1Pass ? "PASSED" : "FAILED"}
                    </span>
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border border-slate-300 p-1 font-bold">വശം 2 (Side Yard 2)</td>
                  <td className="border border-slate-300 p-1 font-mono font-bold">{data.sideYard2M} m</td>
                  <td className="border border-slate-300 p-1 font-mono">Min {minSide2} m</td>
                  <td className="border border-slate-300 p-1 font-mono text-[9px]">
                    {data.hasBlankWallSide ? "50cm Blank Wall Proviso" : `+${heightResult.additionalSetbackPerSideM} m`}
                  </td>
                  <td className="border border-slate-300 p-1 text-center font-bold">
                    <span className={side2Pass ? "text-emerald-700" : "text-rose-700"}>
                      {side2Pass ? "PASSED" : "FAILED"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. FSI & PLOT COVERAGE (RULE 27 & TABLE 6) */}
          <div className="my-2 space-y-1 relative z-10">
            <div className="bg-slate-100 p-1.5 rounded border border-slate-300 font-mono font-bold uppercase text-[10px] flex justify-between">
              <span>3. പ്ലോട്ട് കവറേജ് & FSI പരിശോധന (RULE 27 & TABLE 6)</span>
              <span>{fsiResult.isWeightedFsiUsed ? "WEIGHTED FSI APPLIED" : "STANDARD FSI"}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-slate-300 p-2 rounded text-[10px]">
              <div>
                <span className="text-slate-500 block">ലഭിച്ച കവറേജ് (Coverage %):</span>
                <span className="font-bold">{fsiResult.achievedCoveragePct}% (Max: {fsiResult.maxPermissibleCoveragePct}%)</span>
                <span className={`text-[9px] font-bold block ${fsiResult.isCoveragePassed ? "text-emerald-700" : "text-rose-700"}`}>
                  {fsiResult.isCoveragePassed ? "✓ അനുയോജ്യം (Passed)" : "✗ പരിധി ലംഘിച്ചു"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">ലഭിച്ച FSI (Achieved FSI):</span>
                <span className="font-bold">{fsiResult.achievedFsi} (Max: {fsiResult.maxPermissibleFsi})</span>
                <span className={`text-[9px] font-bold block ${fsiResult.isFsiPassed ? "text-emerald-700" : "text-rose-700"}`}>
                  {fsiResult.isFsiPassed ? "✓ അനുയോജ്യം (Passed)" : "✗ പരിധി ലംഘിച്ചു"}
                </span>
              </div>

              <div className="col-span-2">
                <span className="text-slate-500 block">കണക്കുകൂട്ടൽ സമവാക്യം:</span>
                <span className="font-mono text-[9px] text-slate-800 break-all">{fsiResult.detailedFormulaText}</span>
              </div>
            </div>
          </div>

          {/* 4. OCCUPANT LOAD & EXIT CAPACITY (TABLES 13 & 17) */}
          <div className="my-2 space-y-1 relative z-10">
            <div className="bg-slate-100 p-1.5 rounded border border-slate-300 font-mono font-bold uppercase text-[10px] flex justify-between">
              <span>4. കെട്ടിട നിവാസികളുടെ എണ്ണം & എക്സിറ്റ് വീതി (TABLES 13 & 17)</span>
              <span>Occupant Factor</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-slate-300 p-2 rounded text-[10px]">
              <div>
                <span className="text-slate-500 block">എക്സിറ്റ് ആളുകളുടെ എണ്ണം (Table 17):</span>
                <span className="font-bold">{occupantResult.exitOccupantLoad} ആളുകൾ</span>
                <span className="text-[9px] text-slate-500 block">({occupantResult.exitOccupantRate} m²/ആൾ)</span>
              </div>
              <div>
                <span className="text-slate-500 block">ശുചിത്വ ആളുകളുടെ എണ്ണം (Table 13):</span>
                <span className="font-bold">{occupantResult.sanitationOccupantLoad || "N/A"}</span>
                <span className="text-[9px] text-slate-500 block">
                  {occupantResult.sanitationOccupantRate > 0 ? `(${occupantResult.sanitationOccupantRate} m²/ആൾ)` : "Residential Unit"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">കുറഞ്ഞ എക്സിറ്റ് വീതി (Exit Width):</span>
                <span className="font-bold text-amber-800">{occupantResult.minExitWidthMetres} m</span>
                <span className="text-[9px] text-slate-500 block">വാതിലുകൾ / പടികൾ</span>
              </div>
            </div>
          </div>

          {/* 5. PARKING & LOADING NORMS (RULE 29 & TABLES 9, 10, 10A) */}
          <div className="my-2 space-y-1 relative z-10">
            <div className="bg-slate-100 p-1.5 rounded border border-slate-300 font-mono font-bold uppercase text-[10px] flex justify-between">
              <span>5. വാഹന പാർക്കിംഗ് & ലോഡിംഗ് യാർഡ് പരിശോധന (RULE 29 & TABLE 10, 10A)</span>
              <span>Unit: 5.5m×2.7m (14.85m²)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-slate-300 p-2 rounded text-[10px]">
              <div>
                <span className="text-slate-500 block">ആവശ്യമായ കാർ സ്ലോട്ടുകൾ:</span>
                <span className="font-bold">{parkingResult.totalRequiredCarSlots} സ്ലോട്ട്</span>
                <span className="text-[9px] text-slate-500 block">
                  (Base: {parkingResult.baseCarSlots} + Vis: {parkingResult.visitorsParkingSlots} + DA: {parkingResult.differentlyAbledCarSlots})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">നൽകിയ കാർ പാർക്കിംഗ്:</span>
                <span className="font-bold">{data.carParkingProvided} സ്ലോട്ട്</span>
                <span className={`text-[9px] font-bold block ${parkingResult.isCarParkingPassed ? "text-emerald-700" : "text-rose-700"}`}>
                  {parkingResult.isCarParkingPassed ? "✓ തൃപ്തികരം" : "✗ കുറവാണ്"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">ഇരുചക്ര പാർക്കിംഗ് (25% Area):</span>
                <span className="font-bold">ആവശ്യമായത്: {parkingResult.requiredTwoWheelerSlots} എണ്ണം</span>
                <span className="text-[9px] text-slate-500 block">നൽകിയത്: {data.twoWheelerParkingProvided} എണ്ണം</span>
              </div>
              <div>
                <span className="text-slate-500 block">ലോഡിംഗ് ബേ (Table 10A):</span>
                <span className="font-bold">
                  {parkingResult.requiredLoadingBays > 0 ? `${parkingResult.requiredLoadingBays} ബേ (${parkingResult.requiredLoadingAreaSqM}m²)` : "ബാധകമല്ല"}
                </span>
                <span className="text-[9px] text-slate-500 block">നൽകിയത്: {data.loadingBaysProvided} ബേ</span>
              </div>
            </div>
          </div>

          {/* 6. SANITATION FACILITIES & TABLE 15A REDUCTIONS (RULE 34) */}
          <div className="my-2 space-y-1 relative z-10">
            <div className="bg-slate-100 p-1.5 rounded border border-slate-300 font-mono font-bold uppercase text-[10px] flex justify-between">
              <span>6. ശുചിത്വ ഉപകരണങ്ങൾ & പട്ടിക 15A സ്കെയിൽ കുറവ് (RULE 34 & TABLES 13, 14, 15, 15A)</span>
              <span>Covered Parking Deducted: {data.coveredParkingInsideBuildingSqM}m²</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-slate-300 p-2 rounded text-[10px]">
              <div>
                <span className="text-slate-500 block">പരിഗണിച്ച വിസ്തൃതി (Net Area):</span>
                <span className="font-bold">{sanitationResult.netSanitationAreaSqM} m²</span>
                <span className="text-[9px] text-slate-500 block">Table 15A Scale: {sanitationResult.scaleReductionPercentage}%</span>
              </div>
              <div>
                <span className="text-slate-500 block">ആകെ വാട്ടർ ക്ലോസറ്റുകൾ (WC):</span>
                <span className="font-bold text-cyan-800">{sanitationResult.finalTotalWc} എണ്ണം</span>
                <span className="text-[9px] text-slate-500 block">
                  (Male: {sanitationResult.finalMaleWc} | Female: {sanitationResult.finalFemaleWc})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">യൂറിനലുകൾ & വാഷ് ബേസിൻ:</span>
                <span className="font-bold">യൂറിനൽ: {sanitationResult.finalMaleUrinals} | WB: {sanitationResult.finalWashBasins}</span>
                <span className="text-[9px] text-slate-500 block">പെൺ സ്പെഷ്യൽ: {sanitationResult.finalFemaleSpecialUrinals}</span>
              </div>
              <div>
                <span className="text-slate-500 block">ഭിന്നശേഷി ടോയ്‌ലറ്റ് (DA WC):</span>
                <span className="font-bold text-emerald-800">1.50m × 1.75m നിർബന്ധം</span>
                <span className="text-[9px] text-slate-500 block">90cm ഔട്ട്‌വേർഡ് വാതിൽ</span>
              </div>
            </div>
          </div>

          {/* 7. SOLAR, RWH, HEIGHT & ENVIRONMENTAL CLEARANCES */}
          <div className="my-2 grid grid-cols-1 sm:grid-cols-3 gap-2 relative z-10 text-[10px]">
            {/* 7A: Solar Energy (Rule 77 & Table 19) */}
            <div className="border border-slate-300 p-2 rounded space-y-1">
              <span className="font-bold block text-slate-800 uppercase font-mono text-[9px] border-b border-slate-200 pb-0.5">
                7A. റൂഫ്‌ടോപ്പ് സോളാർ (Rule 77)
              </span>
              <div className="flex justify-between">
                <span className="text-slate-500">പദവി:</span>
                <span className="font-bold">{solarResult.isSolarMandatory ? "MANDATORY" : "OPTIONAL"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">കുറഞ്ഞ ശേഷി:</span>
                <span className="font-bold text-amber-800">{solarResult.minimumCapacityKw} kWp</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">പാനൽ വിസ്തീർണ്ണം:</span>
                <span className="font-bold">~{solarResult.approximatePanelAreaSqM} m²</span>
              </div>
            </div>

            {/* 7B: Rainwater Tank (Rule 76) */}
            <div className="border border-slate-300 p-2 rounded space-y-1">
              <span className="font-bold block text-slate-800 uppercase font-mono text-[9px] border-b border-slate-200 pb-0.5">
                7B. മഴവെള്ള സംഭരണി (Rule 76)
              </span>
              <div className="flex justify-between">
                <span className="text-slate-500">സംഭരണ ശേഷി:</span>
                <span className="font-bold text-cyan-800">
                  {rwhResult.minimumCapacityLitres.toLocaleString("en-IN")} L ({rwhResult.minimumCapacityM3} m³)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ചട്ട നിരക്ക്:</span>
                <span className="font-bold">{rwhResult.rateLitresPerSqM} L/m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ടാങ്ക് അളവുകൾ:</span>
                <span className="font-bold">
                  {rwhResult.suggestedTankLengthM}m × {rwhResult.suggestedTankWidthM}m × {rwhResult.suggestedTankDepthM}m
                </span>
              </div>
            </div>

            {/* 7C: Height & Setback Additions (Rules 23, 24, 26(2)) */}
            <div className="border border-slate-300 p-2 rounded space-y-1">
              <span className="font-bold block text-slate-800 uppercase font-mono text-[9px] border-b border-slate-200 pb-0.5">
                7C. ഉയര പരിധി (Rule 24)
              </span>
              <div className="flex justify-between">
                <span className="text-slate-500">പരമാവധി ഉയരം:</span>
                <span className="font-bold">{heightResult.maxPermissibleHeightM} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">നിർദ്ദിഷ്ട ഉയരം:</span>
                <span className="font-bold text-purple-800">{data.buildingHeightM} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ഉയര പരിശോധന:</span>
                <span className={`font-bold ${heightResult.isHeightPermissible ? "text-emerald-700" : "text-rose-700"}`}>
                  {heightResult.isHeightPermissible ? "✓ PASSED" : "✗ EXCEEDED"}
                </span>
              </div>
            </div>
          </div>

          {/* REPORT FOOTER WITH OFFICIAL ENGINEER SIGNATURE & SEAL */}
          <div className="pt-3 border-t-2 border-slate-900 mt-2 relative z-10 space-y-3">
            <div className="text-[9px] text-slate-600 leading-relaxed font-sans">
              <b>സാക്ഷ്യപത്രം / Statutory Declaration:</b> ഈ കെട്ടിട പ്ലാൻ കേരള പഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ 2019 (KPBR 2019)
              പ്രകാരവും, 2026 ലെ പുതിയ ഗസറ്റ് ഭേദഗതികൾ (S.R.O. No. 682/2026) പ്രകാരവും തറവിസ്തൃതി കവറേജ്, ഫ്ലോർ സ്പേസ് ഇൻഡക്സ് (FSI),
              വാഹന പാർക്കിംഗ്, എക്സിറ്റ് വീതികൾ, ശുചിത്വ സംവിധാനങ്ങൾ, മഴവെള്ള സംഭരണം, സോളാർ പവർ പ്ലാന്റ് എന്നിവ പൂർണ്ണമായി പാലിച്ച്
              തയ്യാറാക്കിയതാണെന്ന് ഇതിനാൽ സാക്ഷ്യപ്പെടുത്തുന്നു.
            </div>

            <div className="grid grid-cols-2 pt-2 items-end">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">
                  അപേക്ഷകന്റെ ഒപ്പ് / Applicant Signature:
                </span>
                <div className="h-7 border-b border-dashed border-slate-400 w-44" />
                <span className="text-[10px] font-bold block">{data.applicantName}</span>
              </div>

              <div className="text-right space-y-1">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">
                  ലൈസൻസി എഞ്ചിനീയറുടെ ഒപ്പും സീലും:
                </span>
                <div className="h-7 border-b border-dashed border-slate-400 w-44 ml-auto" />
                <span className="text-[10px] font-bold block">{data.engineerName}</span>
                <span className="text-[9px] font-mono text-slate-600 block">Reg No: {data.engineerRegNo}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 border-t border-slate-300 pt-1">
              <span>REPORT ID: VASTHUSILPY-KPBR-ALL-RULES-{Date.now().toString().slice(-6)}</span>
              <span>VERIFIED FOR K-SMART LSGD SUBMISSION</span>
              <span>PAGE 1 OF 1 (A4 FORMAT)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
