import React, { useState, useMemo } from "react";
import {
  VASTHU_ROOM_INNER_MEASUREMENTS,
  ROOM_CATEGORIES,
  RoomDimensionRecord,
  THE_8_YONIS_LIST
} from "../../data/vasthuRoomDimensionsData";
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  Info,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
  Maximize2,
  Ruler,
  HelpCircle,
  ShieldCheck,
  RotateCw,
  Printer
} from "lucide-react";

export const VasthuRoomInnerMeasurementsTab: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedYoniFilter, setSelectedYoniFilter] = useState<number | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Custom Interactive Room Dimension Calculator State
  const [calcRoomType, setCalcRoomType] = useState<string>("Living Room / Hall");
  const [calcLengthFt, setCalcLengthFt] = useState<number>(14);
  const [calcLengthIn, setCalcLengthIn] = useState<number>(0);
  const [calcWidthFt, setCalcWidthFt] = useState<number>(12);
  const [calcWidthIn, setCalcWidthIn] = useState<number>(0);

  // Filtered room records
  const filteredRooms = useMemo(() => {
    return VASTHU_ROOM_INNER_MEASUREMENTS.filter((room) => {
      // Category filter
      if (selectedCategory !== "ALL" && room.roomCategory !== selectedCategory) {
        return false;
      }
      // Yoni filter
      if (selectedYoniFilter !== "ALL" && room.yoni !== selectedYoniFilter) {
        return false;
      }
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches =
          room.roomType.toLowerCase().includes(term) ||
          room.roomTypeMl.toLowerCase().includes(term) ||
          room.dimensionLabel.toLowerCase().includes(term) ||
          room.cornerName.toLowerCase().includes(term) ||
          room.kolViral.toLowerCase().includes(term) ||
          room.effectMl.toLowerCase().includes(term) ||
          room.recommendedDirectionMl.toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [selectedCategory, selectedYoniFilter, searchTerm]);

  // Live calculation of custom room dimensions
  const customCalcResult = useMemo(() => {
    const totalLengthInches = Math.max(1, calcLengthFt * 12 + calcLengthIn);
    const totalWidthInches = Math.max(1, calcWidthFt * 12 + calcWidthIn);

    const lengthCm = totalLengthInches * 2.54;
    const widthCm = totalWidthInches * 2.54;

    // Inner perimeter: 2 * (L + W)
    const chuttuCm = Math.round(2 * (lengthCm + widthCm));
    const chuttuFeet = (chuttuCm / 30.48).toFixed(2);

    // Kol & Viral: 1 Kol = 72 cm, 1 Viral = 3 cm (24 Viral = 1 Kol)
    const totalVirals = Math.round(chuttuCm / 3);
    const kol = Math.floor(totalVirals / 24);
    const viral = totalVirals % 24;

    // Area
    const areaSqFt = ((totalLengthInches * totalWidthInches) / 144).toFixed(1);
    const areaSqM = ((lengthCm * widthCm) / 10000).toFixed(2);

    // Ayadi Shadvarga calculations
    // Yoni = (ChuttuCm * 3) % 8 (remainder 0 -> 8)
    const yoniIndex = (chuttuCm * 3) % 8 || 8;
    const yoniDetail = THE_8_YONIS_LIST.find((y) => y.number === yoniIndex) || THE_8_YONIS_LIST[0];

    // Aayam = (ChuttuCm * 8) % 12 (remainder 0 -> 12)
    const aayam = (chuttuCm * 8) % 12 || 12;

    // Vyayam = (ChuttuCm * 3) % 14 (remainder 0 -> 14)
    const vyayam = (chuttuCm * 3) % 14 || 14;

    // Nakshatram = (ChuttuCm * 8) % 27 (remainder 0 -> 27)
    const nakshatraIndex = (chuttuCm * 8) % 27 || 27;
    const NAKSHATRAS = [
      "അശ്വതി", "ഭരണി", "കാർത്തിക", "രോഹിണി", "മകിരം", "തിരുവാതിര", "പുണർതം", "പൂയം", "ആയില്യം",
      "മകം", "പൂരം", "ഉത്രം", "അത്തം", "ചിത്തിര", "ചോതി", "വിശാഖം", "അനിഴം", "തൃക്കേട്ട",
      "മൂലം", "പൂരാടം", "ഉത്രാടം", "തിരുവോണം", "അവിട്ടം", "ചതയം", "പൂരുരുട്ടാതി", "ഉത്രട്ടാതി", "രേവതി"
    ];
    const nakshatraName = NAKSHATRAS[nakshatraIndex - 1] || "അശ്വതി";

    // Vayassu
    const vayassu = aayam > vyayam ? "ബാല്യം (ഉത്തമം)" : "വാർദ്ധക്യം (മധ്യമം)";

    // Overall Phalam
    const isUtthamam = yoniDetail.isDwellingAuspicious && aayam > vyayam;
    const status: "ഉത്തമം" | "മധ്യമം" | "അധമം" = isUtthamam
      ? "ഉത്തമം"
      : yoniDetail.isDwellingAuspicious || aayam >= vyayam
      ? "മധ്യമം"
      : "അധമം";

    return {
      chuttuCm,
      chuttuFeet,
      kol,
      viral,
      areaSqFt,
      areaSqM,
      yoniIndex,
      yoniDetail,
      aayam,
      vyayam,
      nakshatraName,
      nakshatraIndex,
      vayassu,
      status,
      lengthCm: Math.round(lengthCm),
      widthCm: Math.round(widthCm)
    };
  }, [calcLengthFt, calcLengthIn, calcWidthFt, calcWidthIn]);

  const handleApplyDimensionToCalc = (room: RoomDimensionRecord) => {
    setCalcRoomType(room.roomType);
    setCalcLengthFt(room.lengthFt);
    setCalcLengthIn(room.lengthIn);
    setCalcWidthFt(room.widthFt);
    setCalcWidthIn(room.widthIn);

    const calcEl = document.getElementById("room-custom-calculator-anchor");
    if (calcEl) {
      calcEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>വാസ്തു ശാസ്ത്ര പ്രകാരമുള്ള മുറികളുടെ ആന്തര അളവുകൾ</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Vasthu Inner Room Measurements & Directional Alignment
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Authentic internal room dimensions (അകത്തെ അളവുകൾ), inner perimeter (അകച്ചുറ്റ്), and directional placements based on{" "}
              <span className="text-cyan-300 font-semibold">മനുഷ്യാലയ ചന്ദ്രിക (Manushyalaya Chandrika)</span> and{" "}
              <span className="text-cyan-300 font-semibold">തച്ചുശാസ്ത്രം (Thachu Shastra)</span>. Ensure your Living Hall, Master Bedroom,
              Kitchen, Pooja, Dining, and Bedrooms radiate harmony, health, and prosperity.
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-mono border border-slate-700 transition cursor-pointer shrink-0"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Print Vastu Catalog</span>
          </button>
        </div>
      </div>

      {/* Interactive Custom Room Dimension Calculator */}
      <div
        id="room-custom-calculator-anchor"
        className="bg-slate-900/90 rounded-2xl border border-cyan-500/30 p-5 shadow-2xl backdrop-blur-sm relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>തത്സമയ റൂം അളവ് വാസ്തു പരിശോധന (Live Room Vastu Auditor)</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-400/30">
                  Instant Ayadi Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Enter your desired room length & width to compute inner perimeter (അകച്ചുറ്റ്), Ayadi Yoni, and Vastu compatibility.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4">
          {/* Inputs */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">മുറിയുടെ ഇനം (Room Type)</label>
              <select
                value={calcRoomType}
                onChange={(e) => setCalcRoomType(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl font-sans text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="Living Room / Hall">Living Room / Hall (സ്വീകരണമുറി)</option>
                <option value="Master Bedroom">Master Bedroom (കന്നിമൂല പ്രധാന കിടപ്പുമുറി)</option>
                <option value="Children's Bedroom">Children's Bedroom (കുട്ടികളുടെ മുറി)</option>
                <option value="Guest Bedroom">Guest Bedroom (അതിഥി മുറി)</option>
                <option value="Kitchen">Kitchen / Cooking (അടുക്കള / ആഗ്നേയം)</option>
                <option value="Pooja Room">Pooja Sanctuary (പൂജാമുറി / ഈശാനകോൺ)</option>
                <option value="Dining Hall">Dining Hall (ഊണുമുറി / പടിഞ്ഞാറ്)</option>
                <option value="Study Room">Study / Home Office (പഠനമുറി / വടക്ക്)</option>
                <option value="Sitout / Verandah">Sitout / Verandah (പൂമുഖം / സിറ്റൗട്ട്)</option>
                <option value="Work Area / Store">Work Area / Store (വർക്ക് ഏരിയ)</option>
                <option value="Toilet / Bathroom">Toilet / Bath (ശുചിമുറി / വായുകോൺ)</option>
                <option value="Staircase">Staircase (കോണിപ്പടി / തെക്ക്-പടിഞ്ഞാറ്)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Length */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-mono text-cyan-400 font-bold block">നീളം (Length)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Feet (അടി)</label>
                    <input
                      type="number"
                      min={4}
                      max={50}
                      value={calcLengthFt}
                      onChange={(e) => setCalcLengthFt(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white text-center focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Inches (ഇഞ്ച്)</label>
                    <input
                      type="number"
                      min={0}
                      max={11}
                      value={calcLengthIn}
                      onChange={(e) => setCalcLengthIn(Math.max(0, Math.min(11, parseInt(e.target.value) || 0)))}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white text-center focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 text-center">
                  ≈ {customCalcResult.lengthCm} cm
                </div>
              </div>

              {/* Width */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-mono text-cyan-400 font-bold block">വീതി (Width)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Feet (അടി)</label>
                    <input
                      type="number"
                      min={3}
                      max={50}
                      value={calcWidthFt}
                      onChange={(e) => setCalcWidthFt(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white text-center focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Inches (ഇഞ്ച്)</label>
                    <input
                      type="number"
                      min={0}
                      max={11}
                      value={calcWidthIn}
                      onChange={(e) => setCalcWidthIn(Math.max(0, Math.min(11, parseInt(e.target.value) || 0)))}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white text-center focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 text-center">
                  ≈ {customCalcResult.widthCm} cm
                </div>
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-7 bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">പരിശോധിച്ച അളവ്:</span>
                <span className="text-sm font-bold text-white font-mono">
                  {calcLengthFt}&apos; {calcLengthIn}&quot; × {calcWidthFt}&apos; {calcWidthIn}&quot;
                </span>
                <span className="text-xs text-cyan-400 font-mono">
                  ({customCalcResult.areaSqFt} Sq.Ft / {customCalcResult.areaSqM} m²)
                </span>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
                  customCalcResult.status === "ഉത്തമം"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : customCalcResult.status === "മധ്യമം"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                }`}
              >
                {customCalcResult.status === "ഉത്തമം" ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                <span>ഫലം: {customCalcResult.status}</span>
              </span>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">അകച്ചുറ്റ് (Inner Perimeter)</span>
                <span className="text-sm font-bold text-cyan-300 block">{customCalcResult.chuttuCm} cm</span>
                <span className="text-[10px] text-slate-500">
                  {customCalcResult.kol} കോൽ {customCalcResult.viral} വിരൽ
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">യോനി (Yoni Index)</span>
                <span className="text-sm font-bold text-white block">
                  {customCalcResult.yoniDetail.nameMl} ({customCalcResult.yoniIndex})
                </span>
                <span className="text-[10px] text-cyan-400">{customCalcResult.yoniDetail.directionMl}</span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">ആയം / വ്യയം (Gain/Loss)</span>
                <span className="text-sm font-bold text-white block">
                  ആയം {customCalcResult.aayam} : വ്യയം {customCalcResult.vyayam}
                </span>
                <span className="text-[10px] text-emerald-400">
                  {customCalcResult.aayam > customCalcResult.vyayam ? "✓ ആയം കൂടുതൽ" : "⚠ വ്യയം കൂടുതൽ"}
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">നക്ഷത്രം & പ്രായം</span>
                <span className="text-sm font-bold text-white block">{customCalcResult.nakshatraName}</span>
                <span className="text-[10px] text-slate-400">{customCalcResult.vayassu}</span>
              </div>
            </div>

            {/* Yoni Phalam & Note */}
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 flex items-start gap-2.5 text-xs">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-white font-semibold">
                  യോനി ഗുണഫലം: {customCalcResult.yoniDetail.phalamMl}
                </div>
                <div className="text-slate-400 text-[11px] leading-relaxed">
                  {customCalcResult.yoniDetail.isDwellingAuspicious ? (
                    <span className="text-emerald-300">
                      ✓ ഈ യോനി ഗൃഹനിർമ്മാണത്തിനും മുറികൾക്കും അത്യുത്തമമായ ചതുർയോനികളിൽ (1, 3, 5, 7) ഒന്നാണ്.
                    </span>
                  ) : (
                    <span className="text-amber-300">
                      ⚠ ഈ യോനി സമസംഖ്യാ യോനിയാണ് ({customCalcResult.yoniIndex}). പാർപ്പിട മുറികൾക്ക് 1 (ധ്വജം), 3 (സിംഹം), 5 (വൃഷഭം), 7 (ഗജം) എന്നിവയാണ് ശാസ്ത്രീയമായി നിർദ്ദേശിക്കുന്നത്.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories & 8 Yoni Filter Bars */}
      <div className="space-y-4">
        {/* Room Categories Carousel */}
        <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono text-slate-400">
            <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              മുറികളുടെ വിഭാഗങ്ങൾ (Filter by Room Type)
            </span>
            <span>ലഭ്യമായ ആകെ റെക്കോർഡുകൾ: {filteredRooms.length}</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {ROOM_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer border ${
                  selectedCategory === cat.id
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md"
                    : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {cat.nameMl}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter & Search Bar */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-cyan-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by dimension, room name, corner..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Yoni Filter Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <span className="text-xs font-mono text-slate-400 whitespace-nowrap">യോനി ഫിൽറ്റർ:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedYoniFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer border ${
                  selectedYoniFilter === "ALL"
                    ? "bg-cyan-500 text-slate-950 border-cyan-400"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                }`}
              >
                All
              </button>
              {[1, 3, 5, 7].map((yNum) => {
                const yInfo = THE_8_YONIS_LIST.find((y) => y.number === yNum);
                return (
                  <button
                    key={yNum}
                    onClick={() => setSelectedYoniFilter(yNum)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer border whitespace-nowrap ${
                      selectedYoniFilter === yNum
                        ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    {yInfo?.nameMl} ({yNum})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Room Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.length === 0 ? (
          <div className="col-span-full bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center text-slate-400 font-mono text-xs">
            No matching room measurements found for your selected filters.
          </div>
        ) : (
          filteredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3.5 hover:border-cyan-500/40 transition shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Top Badge & Room Title */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                      {room.cornerName}
                    </span>
                    <h4 className="text-base font-bold text-white leading-snug">{room.roomTypeMl}</h4>
                    <span className="text-xs text-slate-400 font-sans">{room.roomType}</span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {room.phalam}
                  </span>
                </div>

                {/* Primary Dimension Callout */}
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black font-mono text-cyan-300">{room.dimensionLabel}</span>
                    <span className="text-xs font-mono text-slate-300">{room.areaSqFt} Sq.Ft</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{room.dimensionCm}</span>
                    <span>{room.areaSqM} m²</span>
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400/80 pt-1 border-t border-slate-800/60">
                    {room.kolViral}
                  </div>
                </div>

                {/* Metrics: Chuttu, Yoni & Direction */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/60">
                    <span className="text-[9px] text-slate-500 block uppercase">അകച്ചുറ്റ് (Inner Perimeter)</span>
                    <span className="text-slate-200 font-bold">{room.innerChuttuCm} cm</span>
                    <span className="text-[9px] text-slate-400 block">{room.innerChuttuKolViral}</span>
                  </div>

                  <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/60">
                    <span className="text-[9px] text-slate-500 block uppercase">യോനി (Ayadi Yoni)</span>
                    <span className="text-slate-200 font-bold">{room.yoniName}</span>
                    <span className="text-[9px] text-emerald-400 block">യോനി {room.yoni}</span>
                  </div>
                </div>

                {/* Recommended Placement */}
                <div className="text-xs bg-slate-950/40 p-2 rounded-lg border border-slate-800/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-[11px]">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ഉത്തമ സ്ഥാനം: {room.recommendedDirectionMl}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{room.effectMl}</p>
                </div>

                {/* Key Vasthu Guidelines */}
                <div className="space-y-1 text-[11px] text-slate-400 pt-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                    പ്രധാന വാസ്തു വിധികൾ:
                  </span>
                  <ul className="space-y-1">
                    {room.vasthuRules.slice(0, 2).map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 mt-0.5">•</span>
                        <span className="leading-snug">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action: Try in Live Calculator */}
              <button
                onClick={() => handleApplyDimensionToCalc(room)}
                className="w-full mt-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white rounded-xl text-xs font-mono font-semibold transition border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>പരിശോധന ടൂളിൽ തുറക്കുക</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* 8 Yonis Directional Architectural Reference Guide */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
          <Compass className="w-5 h-5 text-cyan-400" />
          <span>വാസ്തു പുരുഷ മണ്ഡലത്തിലെ 8 യോനികളുടെ സ്ഥാനവും ഫലവും (The 8 Yonis in Vasthu Shastra)</span>
        </h3>
        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          തച്ചുശാസ്ത്ര വിധിപ്രകാരം ചുറ്റളവിനെ 3 കൊണ്ടു ഗുണിച്ച് 8 കൊണ്ടു ഹരിച്ചാൽ കിട്ടുന്ന ശിഷ്ടമാണ് യോനി. ഇതിൽ ഒറ്റസംഖ്യകളായ 1 (ധ്വജം), 3 (സിംഹം), 5 (വൃഷഭം), 7 (ഗജം) എന്നിവയാണ് പാർപ്പിട നിർമ്മാണത്തിന് ഏറ്റവും ഉത്തമമായ ചതുർയോനികൾ.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          {THE_8_YONIS_LIST.map((yoni) => (
            <div
              key={yoni.number}
              className={`p-3 rounded-xl border ${
                yoni.isDwellingAuspicious
                  ? "bg-emerald-950/30 border-emerald-800/80 text-emerald-200"
                  : "bg-slate-950 border-slate-800 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800">
                <span className="font-bold text-white">
                  {yoni.number}. {yoni.nameMl}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    yoni.nature === "ഉത്തമം"
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-rose-500/30 text-rose-300"
                  }`}
                >
                  {yoni.nature}
                </span>
              </div>
              <div className="text-[11px] text-cyan-300">{yoni.directionMl} ({yoni.direction})</div>
              <div className="text-[10px] text-slate-400 mt-1 leading-snug">{yoni.phalamMl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
