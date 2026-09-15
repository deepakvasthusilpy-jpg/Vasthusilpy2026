// Detailed knowledge dataset from the authentic book "വാസ്തു ശാസ്ത്രം" (കർമ്മേൽ ബുക്സ് / Carmel Books)

export interface VastuChapterInfo {
  id: string;
  title: string;
  titleEn: string;
  page: number;
  summary: string;
  keyPoints: string[];
}

export interface ManayadiRow {
  feet: number;
  phalam: string;
  phalamEn: string;
  status: "ഉത്തമം" | "മധ്യമം" | "അധമം";
}

export const MANAYADI_FEET_DATA: ManayadiRow[] = [
  { feet: 6, phalam: "നല്പത്", phalamEn: "Auspicious / Prosperity", status: "ഉത്തമം" },
  { feet: 7, phalam: "ദാരിദ്ര്യം", phalamEn: "Poverty / Loss", status: "അധമം" },
  { feet: 8, phalam: "ആധി / ശക്തി", phalamEn: "Anxiety or Power", status: "മധ്യമം" },
  { feet: 9, phalam: "മോശം", phalamEn: "Bad / Inauspicious", status: "അധമം" },
  { feet: 10, phalam: "നല്ല ആഹാരം ലഭ്യം", phalamEn: "Abundance of Food & Health", status: "ഉത്തമം" },
  { feet: 11, phalam: "സത്സന്താനങ്ങൾ, സമ്പത്ത്", phalamEn: "Good Progeny & Wealth", status: "ഉത്തമം" },
  { feet: 12, phalam: "ദാരിദ്ര്യം", phalamEn: "Poverty", status: "അധമം" },
  { feet: 13, phalam: "ശത്രുത്വം, രോഗം", phalamEn: "Enmity & Disease", status: "അധമം" },
  { feet: 14, phalam: "ശത്രുത, ധനനഷ്ടം", phalamEn: "Enmity & Financial Loss", status: "അധമം" },
  { feet: 15, phalam: "ദുഷ്കീർത്തി", phalamEn: "Infamy & Bad Name", status: "അധമം" },
  { feet: 16, phalam: "സമ്പത്ത്", phalamEn: "Wealth & Fortune", status: "ഉത്തമം" },
  { feet: 17, phalam: "രാജയോഗം", phalamEn: "Royal Fortune & Fame", status: "ഉത്തമം" },
  { feet: 18, phalam: "നഷ്ടം", phalamEn: "Loss & Setbacks", status: "അധമം" },
  { feet: 19, phalam: "സ്ത്രീകളും കുട്ടികളും കഷ്ടപ്പെടും", phalamEn: "Trouble for Women & Children", status: "അധമം" },
  { feet: 20, phalam: "സന്തോഷവും സമ്പത്തും", phalamEn: "Happiness & Wealth", status: "ഉത്തമം" },
  { feet: 21, phalam: "വസിക്കുന്നവർക്ക് ഉയർച്ച", phalamEn: "Growth & Progress for Inhabitants", status: "ഉത്തമം" },
  { feet: 22, phalam: "ശത്രുക്കളെ കീഴ്പ്പെടുത്തും", phalamEn: "Victory over Enemies", status: "ഉത്തമം" },
  { feet: 23, phalam: "രോഗം", phalamEn: "Illness & Diseases", status: "അധമം" },
  { feet: 24, phalam: "കുടുംബനാഥയുടെ ജീവന് ഭീഷണി", phalamEn: "Danger to House Lady's Life", status: "അധമം" },
  { feet: 25, phalam: "നല്ല ഫലം", phalamEn: "Good Outcome", status: "ഉത്തമം" },
  { feet: 26, phalam: "മാലാഖാ തുല്യ ജീവിതം", phalamEn: "Heavenly Peaceful Life", status: "ഉത്തമം" },
  { feet: 27, phalam: "സമ്പത്ത് വർദ്ധിക്കും", phalamEn: "Increasing Wealth", status: "ഉത്തമം" },
  { feet: 28, phalam: "സൗഭാഗ്യം", phalamEn: "Good Fortune & Luck", status: "ഉത്തമം" },
  { feet: 29, phalam: "ബന്ധുജന സൗഹൃദം", phalamEn: "Cordial Family & Friends Relations", status: "ഉത്തമം" },
  { feet: 30, phalam: "ലക്ഷ്മീദേവി അനുഗ്രഹിക്കും", phalamEn: "Blessings of Goddess Lakshmi", status: "ഉത്തമം" },
  { feet: 31, phalam: "നല്ല ഫലം", phalamEn: "Good Results", status: "ഉത്തമം" },
  { feet: 32, phalam: "നഷ്ടപ്പെട്ട പ്രതാപം വീണ്ടെടുക്കും", phalamEn: "Regain Lost Glory & Status", status: "ഉത്തമം" },
  { feet: 33, phalam: "സൗഭാഗ്യം", phalamEn: "Auspicious Fortune", status: "ഉത്തമം" },
  { feet: 34, phalam: "ഉടമ നഷ്ടപ്പെടും", phalamEn: "Loss of Ownership", status: "അധമം" },
  { feet: 35, phalam: "നല്ല ജോലി", phalamEn: "Good Employment / Career", status: "ഉത്തമം" },
  { feet: 36, phalam: "രാജയോഗം", phalamEn: "Royal Fortune & High Status", status: "ഉത്തമം" },
  { feet: 37, phalam: "സന്തോഷം, സമ്പത്ത്", phalamEn: "Happiness & Wealth", status: "ഉത്തമം" },
  { feet: 38, phalam: "പരാജയം", phalamEn: "Failure", status: "അധമം" },
  { feet: 39, phalam: "വിജയം", phalamEn: "Victory & Triumph", status: "ഉത്തമം" },
  { feet: 40, phalam: "ശത്രുക്കൾ മൂലം നഷ്ടം", phalamEn: "Loss Caused by Enemies", status: "അധമം" },
  { feet: 41, phalam: "സ്വത്തു വർദ്ധിക്കും", phalamEn: "Asset Growth", status: "ഉത്തമം" },
  { feet: 42, phalam: "ലക്ഷ്മീദേവി വസിക്കും", phalamEn: "Abode of Goddess Lakshmi", status: "ഉത്തമം" },
  { feet: 43, phalam: "ദോഷഫലം", phalamEn: "Harmful Result", status: "അധമം" },
  { feet: 44, phalam: "കണ്ണിനു ദോഷം", phalamEn: "Eye / Health Troubles", status: "അധമം" },
  { feet: 45, phalam: "സന്താന സൗഭാഗ്യം", phalamEn: "Blessings of Children", status: "ഉത്തമം" },
  { feet: 46, phalam: "വീട് വിൽക്കപ്പെടും", phalamEn: "Forced Sale of House", status: "അധമം" },
  { feet: 47, phalam: "ദാരിദ്ര്യം", phalamEn: "Poverty", status: "അധമം" },
  { feet: 48, phalam: "തീ പിടിക്കാൻ സാധ്യത", phalamEn: "Fire Hazard Risk", status: "അധമം" },
  { feet: 49, phalam: "ദുഷ്ടശക്തികളുടെ ഉപദ്രവം", phalamEn: "Trouble from Negative Forces", status: "അധമം" },
  { feet: 50, phalam: "നല്ലഫലം", phalamEn: "Good Outcome", status: "ഉത്തമം" },
  { feet: 51, phalam: "സ്വത്ത് നഷ്ടം", phalamEn: "Property Loss", status: "അധമം" },
  { feet: 52, phalam: "സമ്പത്ത് വർദ്ധിക്കും", phalamEn: "Increase in Wealth", status: "ഉത്തമം" },
  { feet: 53, phalam: "ദുരിതം", phalamEn: "Distress & Hardships", status: "അധമം" },
  { feet: 54, phalam: "വസ്തുവകകൾ നഷ്ടപ്പെടും", phalamEn: "Loss of Real Estate Assets", status: "അധമം" },
  { feet: 55, phalam: "ധനനഷ്ടം, ബന്ധുക്കൾ ശത്രുക്കളാവും", phalamEn: "Money Loss, Relatives Turn Enemies", status: "അധമം" },
  { feet: 56, phalam: "സൗഭാഗ്യം", phalamEn: "Auspicious Fortune", status: "ഉത്തമം" },
  { feet: 57, phalam: "ഭാര്യയ്ക്കും കുട്ടികൾക്കും അസുഖം", phalamEn: "Illness to Wife and Children", status: "അധമം" },
  { feet: 58, phalam: "സ്വത്ത് നാശം, രോഗം, ജയിൽവാസം", phalamEn: "Asset Destruction, Sickness, Jail", status: "അധമം" },
  { feet: 59, phalam: "ധനനഷ്ടം, ദാരിദ്ര്യം, ദുരിതം", phalamEn: "Financial Loss, Poverty, Hardship", status: "അധമം" },
  { feet: 60, phalam: "ദൈവാനുഗ്രഹം, സൗഭാഗ്യം, ഉയർച്ച", phalamEn: "Divine Grace, Good Luck, Prosperity", status: "ഉത്തമം" },
  { feet: 64, phalam: "ആദരണങ്ങൾ ലഭിക്കും, ലക്ഷ്മീ കടാക്ഷം", phalamEn: "High Honors & Goddess Lakshmi Grace", status: "ഉത്തമം" },
  { feet: 71, phalam: "രാജയോഗം, ലോകപ്രശസ്തി", phalamEn: "Royal Fortune & World Renown", status: "ഉത്തമം" },
  { feet: 72, phalam: "ധനലാഭം, പ്രശസ്തി", phalamEn: "Financial Profit & Fame", status: "ഉത്തമം" },
  { feet: 80, phalam: "ദൈവാനുഗ്രഹം, ധനാഗമം", phalamEn: "Divine Grace & Inflow of Wealth", status: "ഉത്തമം" },
  { feet: 90, phalam: "ആരോഗ്യം, സമ്പത്ത്", phalamEn: "Health & Wealth", status: "ഉത്തമം" },
  { feet: 95, phalam: "രാജയോഗം, ധനലാഭം", phalamEn: "Royal Status & Financial Gain", status: "ഉത്തമം" },
  { feet: 100, phalam: "ദൈവാനുഗ്രഹം, സ്വത്ത് വർദ്ധിക്കും", phalamEn: "Divine Grace, Great Wealth Expansion", status: "ഉത്തമം" },
  { feet: 110, phalam: "സമ്പത്ത്, പ്രശസ്തി", phalamEn: "Wealth & Fame", status: "ഉത്തമം" },
  { feet: 113, phalam: "സൗഭാഗ്യം, അന്തസ്സ്, ആസ്തി നേട്ടം", phalamEn: "Fortune, Dignity & High Assets", status: "ഉത്തമം" },
  { feet: 117, phalam: "ജീവിത വിജയം, ധനലാഭം", phalamEn: "Life Victory & Prosperity", status: "ഉത്തമം" },
  { feet: 121, phalam: "സൗഭാഗ്യം, സാമ്പത്തികനേട്ടം", phalamEn: "Ultimate Fortune & Financial Boom", status: "ഉത്തമം" }
];

export const VASTHU_BOOK_TOPICS: VastuChapterInfo[] = [
  {
    id: "proverbs",
    title: "വാസ്തുസംബന്ധമായ ചൊല്ലുകൾ (Traditional Vastu Maxims)",
    titleEn: "Traditional Vastu Proverbs & Maxims",
    page: 6,
    summary: "അഗ്നിദേവനെ അവഗണിക്കാതിരിക്കുക, ചുറ്റും റോഡുകളുള്ള ഭൂമി, തെക്കുപടിഞ്ഞാറെ മുറി കന്നിമൂല വിധികൾ.",
    keyPoints: [
      "അഗ്നിദേവനെ അവഗണിക്കരുത്: ജീവിതത്തിനാവശ്യമായ ഊർജ്ജം നഷ്ടപ്പെടും.",
      "നാലുവശത്തും റോഡുകളുള്ള വീടോ വസ്തുവോ അന്തേവാസികൾക്ക് സൗഭാഗ്യങ്ങൾ നൽകും.",
      "പെൺകുട്ടികൾ വടക്കുപടിഞ്ഞാറെ മുറിയിൽ കിടന്നുറങ്ങിയാൽ സമയത്ത് വിവാഹം നടക്കും.",
      "തെക്കുപടിഞ്ഞാറെ മുറിയിൽ തെക്കോട്ടു തലവെച്ചു മാത്രം കിടക്കുക.",
      "വീടിന്റെ ഹൃദയം വാസ്തുശാസ്ത്രവും ജ്യോതിഷവും ആണ്.",
      "പ്രധാന കവാടം മറ്റു വാതിലുകളേക്കാൾ വലുതായിരിക്കണം.",
      "അതിഥികളെയും ബന്ധുക്കളെയും വടക്കുപടിഞ്ഞാറുള്ള മുറിയിൽ താമസിപ്പിക്കുക.",
      "പഠിക്കുമ്പോഴും പഠനകാര്യങ്ങൾ ചർച്ചചെയ്യുമ്പോഴും കിഴക്കോട്ട് നോക്കി ഇരിക്കണം."
    ]
  },
  {
    id: "stuti",
    title: "വാസ്തു ഭഗവത് സ്തുതി (Vastu Bhagavat Stuti)",
    titleEn: "Vastu Bhagavat Stuti Mantras",
    page: 7,
    summary: "വാസ്തുദേവനെ സ്തുതിക്കുന്ന പരമ്പരാഗത സ്തോത്രങ്ങൾ.",
    keyPoints: [
      "ഓം വാസ്തുദേവാം മഹാകായം പഞ്ചഭൂത അഷ്ടദിശം ലോക രൂപീനാം ലോകം സാങ്കരദിനാം...",
      "അഷ്ടദിശകളിൽ വാസ്തുദേവന്റെ സർവ്വകാര്യകാരിത്വം അനുഗ്രഹത്തിനായി പ്രാർത്ഥിക്കുന്നു."
    ]
  },
  {
    id: "muhurtham",
    title: "വാസ്തു മുഹൂർത്തം (Vastu Muhurtham Timings across Months)",
    titleEn: "Auspicious Vastu Muhurtham Timings",
    page: 7,
    summary: "വാസ്തുപുരുഷൻ നിദ്ര വിട്ടുണരുന്ന 8 ശുഭ മാസങ്ങളും നാഴികകളും (മിഥുനം, കന്നി, ധനു, മീനം ഒഴികെ).",
    keyPoints: [
      "മേടം 10-ാം തീയതി: 5 നാഴിക",
      "ഇടവം 21-ാം തീയതി: 8 നാഴിക",
      "കർക്കിടകം 11-ാം തീയതി: 2 നാഴിക",
      "ചിങ്ങം 6-ാം തീയതി: 21 നാഴിക",
      "തുലാം 11-ാം തീയതി: 2 നാഴിക",
      "വൃശ്ചികം 8-ാം തീയതി: 10 നാഴിക",
      "മകരം 12-ാം തീയതി: 8 നാഴിക",
      "കുംഭം 20-ാം തീയതി: 8 നാഴിക",
      "ഉണർന്നു കഴിഞ്ഞുള്ള 3/4 നാഴിക വീതം: ദന്തശുദ്ധി, സ്നാനം, പൂജ, ആഹാരം, താമ്പൂല ചർവ്വണ എന്നീ അഞ്ചു കൃത്യങ്ങൾ. ആഹാരസമയവും താമ്പൂല ചർവ്വണ സമയവും അത്യുത്തമം."
    ]
  },
  {
    id: "purusha_viswakarma",
    title: "വാസ്തുപുരുഷൻ & വിശ്വകർമ്മാവ് (Vastu Purusha & Viswakarma)",
    titleEn: "Vastu Purusha Orientation & Viswakarma Divine Architect",
    page: 8,
    summary: "വാസ്തുപുരുഷന്റെ കിടപ്പും വിശ്വകർമ്മാവിന്റെ പഞ്ചശിരസ്സുകളും ആയുധങ്ങളും.",
    keyPoints: [
      "വാസ്തുപുരുഷന്റെ ശിരസ്സ് വടക്കുകിഴക്ക് (ഈശാനകോൺ), പാദങ്ങൾ തെക്കുപടിഞ്ഞാറ് (കന്നികോൺ), കൈകൾ തെക്കുകിഴക്കും വടക്കുപടിഞ്ഞാറും.",
      "വിശ്വകർമ്മാവ്: 5 ശിരസ്സുകൾ (കിഴക്ക്, പടിഞ്ഞാറ്, തെക്ക്, വടക്ക്, വടക്കുകിഴക്ക്), 15 കണ്ണുകൾ, 10 കരങ്ങൾ (രുദ്രാക്ഷം, സർപ്പം, മാൻ, തൃശൂലം, ചെണ്ട, വീണ, വില്ല്, ശംഖ്, ചക്രം മുതലായവ)."
    ]
  },
  {
    id: "land_shapes",
    title: "ഭൂമിയുടെ ആകൃതിയും ഫലങ്ങളും (Land Shapes & Outcomes)",
    titleEn: "Effects of Land Geometry & Plot Shapes",
    page: 9,
    summary: "12 പ്ലോട്ട് ആകൃതികളും വാസ്തു ഫലങ്ങളും.",
    keyPoints: [
      "സമം = സൗഭാഗ്യം (Prosperity)",
      "ചതുരശ്രം = മഹാധനം (Great Wealth)",
      "വൃത്തം = വിത്തം (Money)",
      "ഭദ്രപീഠം = വിത്തം (Prosperity)",
      "കൂടം = ധനം (Wealth)",
      "ത്രികോണം = പുത്രനാശം (Harm to children - Avoid)",
      "വിശറി = ധർമ്മനാശം (Loss of righteousness)",
      "സർപ്പാകൃതി = ഭയം (Fear & Anxiety)",
      "പരശു = ആത്മഹത്യ (Destruction)",
      "മനോരമ = പുത്രലാഭം (Blessing of children)",
      "ഗർത്താവസ്ഥ = നിഷ്ഫലത്വം (No outcome/loss)",
      "വൃകം = അജ്ഞത (Ignorance)"
    ]
  },
  {
    id: "land_slopes",
    title: "ഭൂമിയുടെ ചരിവുകൾ & 8 വീഥികൾ (Land Slopes & 8 Veethis)",
    titleEn: "8 Plot Slopes & Veethis (Go-veethi, Dhanya-veethi etc.)",
    page: 27,
    summary: "ഭൂമിയുടെ ചരിവും വാസ്തുവിലെ 8 വീഥികളുടെ ഫലങ്ങളും.",
    keyPoints: [
      "1. ഗോവീഥി (പടിഞ്ഞാറ് ഉയർന്ന് കിഴക്ക് താഴ്ന്നത്): 500 വർഷക്കാലം അഭിവൃദ്ധി (Prosperity for 500 years).",
      "2. അഗ്നിവീഥി (തെക്കുകിഴക്ക് താഴ്ന്ന് വടക്കുപടിഞ്ഞാറ് ഉയർന്നത്): 12 വർഷം മാത്രം ഐശ്വര്യം.",
      "3. ജലവീഥി (കിഴക്ക് ഉയർന്ന് പടിഞ്ഞാറ് താഴ്ന്നത്): 10 വർഷം മാത്രം, ശേഷം ദാരിദ്ര്യം.",
      "4. ഭൂതവീഥി (തെക്കുപടിഞ്ഞാറ് താഴ്ന്ന് വടക്കുകിഴക്ക് ഉയർന്നത്): 6 വർഷം മാത്രം സുഖം.",
      "5. കാലവീഥി (വടക്ക് ഉയർന്ന് തെക്ക് താഴ്ന്നത്): 3 വർഷം മാത്രം സുഖം, ശേഷം അപമൃത്യു.",
      "6. സർപ്പവീഥി (വടക്കുപടിഞ്ഞാറ് താഴ്ന്ന് തെക്കുകിഴക്ക് ഉയർന്നത്): സന്താനനാശം.",
      "7. ഗജവീഥി (തെക്ക് ഉയർന്ന് വടക്ക് താഴ്ന്നത്): 100 വർഷത്തേക്ക് അഭിവൃദ്ധി.",
      "8. ധാന്യവീഥി (തെക്കുപടിഞ്ഞാറ് ഉയർന്ന് വടക്കുകിഴക്ക് താഴ്ന്നത്): 1000 വർഷത്തേക്ക് അത്യുന്നതമായ അഭിവൃദ്ധിയും സർവ്വ ഐശ്വര്യവും!"
    ]
  },
  {
    id: "well_location",
    title: "കിണർ & കുളം സ്ഥാനങ്ങൾ (Well & Water Reservoir Locations)",
    titleEn: "Well Placement in Directions & 12 Rasis",
    page: 15,
    summary: "കിണർ കുഴിക്കേണ്ട ഉത്തമ ദിശകളും 12 രാശികളിലെ ഫലങ്ങളും.",
    keyPoints: [
      "ഉത്തമ ദിശകൾ: വടക്കുകിഴക്ക് (ഈശാനകോൺ), കിഴക്ക്, വടക്ക്.",
      "വർജ്ജിക്കേണ്ട ദിശകൾ: തെക്കുകിഴക്ക് (അഗ്നികോൺ - കടബാധ്യത & രോഗം), തെക്ക് (അപമൃത്യു), തെക്കുപടിഞ്ഞാറ് (ദുരന്തം), പടിഞ്ഞാറ് (ദാരിദ്ര്യം), വടക്കുപടിഞ്ഞാറ് (ചെലവ് & ശത്രുത).",
      "12 രാശികളിൽ കിണറിന്റെ ഫലം: മീനം = ഐശ്വര്യം, മേടം = ഐശ്വര്യം, ഇടവം = ധനലാഭം, മിഥുനം = പുത്രനാശം, കർക്കിടകം = സ്ത്രീനാശം, ചിങ്ങം = വിഷപീഡ, കന്നി = കുട്ടികൾക്ക് അസുഖം, തുലാം = ഐശ്വര്യം, വൃശ്ചികം = സ്ത്രീനാശം, ധനു = സ്ത്രീനാശം, മകരം = സമ്പത്ത്, കുംഭം = ആരോഗ്യം."
    ]
  },
  {
    id: "doors_navagraha",
    title: "പ്രധാന വാതിലും 9 നവഗ്രഹ സ്ഥാനങ്ങളും (Main Door 9 Navagraha Divisions)",
    titleEn: "Main Door Placement across 9 Wall Divisions",
    page: 21,
    summary: "മതിലിനെയോ ഭിത്തിയെയോ 9 സമഭാഗങ്ങളാക്കി കട്ടള ഉറപ്പിക്കുന്ന വിധം.",
    keyPoints: [
      "കിഴക്കോട്ട് ദർശനമുള്ള വീട്: വടക്കുനിന്ന് തെക്കോട്ട് 9 പാദങ്ങളാക്കുക (1 സൂര്യൻ, 2 ചന്ദ്രൻ, 3 ചൊവ്വ, 4 ബുധൻ, 5 വ്യാഴം, 6 ശുക്രൻ, 7 ശനി, 8 രാഹു, 9 കേതു).",
      "ഉത്തമ സ്ഥാനങ്ങൾ: 4 ബുധൻ, 5 വ്യാഴം, 6 ശുക്രൻ സ്ഥാനങ്ങളിൽ കട്ടിള ഉറപ്പിക്കുക.",
      "തെക്ക് ദർശനം: കിഴക്കുനിന്ന് പടിഞ്ഞാറോട്ട് 9 പാദങ്ങൾ.",
      "പടിഞ്ഞാറ് ദർശനം: തെക്കുനിന്ന് വടക്കോട്ട് 9 പാദങ്ങൾ.",
      "വടക്ക് ദർശനം: പടിഞ്ഞാറുനിന്ന് കിഴക്കോട്ട് 9 പാദങ്ങൾ."
    ]
  },
  {
    id: "rooms_layout",
    title: "മുറികളുടെ വാസ്തു സ്ഥാനങ്ങൾ (Room Layouts & Internal Vastu)",
    titleEn: "Optimal Room Positions (Pooja, Kitchen, Bedroom, Stairs)",
    page: 25,
    summary: "പൂജാമുറി, അടുക്കള, മാസ്റ്റർ ബെഡ്‌റൂം, ലിവിങ്, ശുചിമുറി വാസ്തു വിധികൾ.",
    keyPoints: [
      "പൂജാമുറി: വടക്കുകിഴക്ക് (ഈശാനകോൺ), കിഴക്ക് അല്ലെങ്കിൽ വടക്ക്. തെക്കുഭാഗത്ത് പാടില്ല. വിഗ്രഹങ്ങൾ പടിഞ്ഞാറോ കിഴക്കോ ദർശനമായി വെക്കുക.",
      "അടുക്കള: തെക്കുകിഴക്ക് (അഗ്നികോൺ). പാചകം ചെയ്യുന്നയാൾ കിഴക്കോട്ട് നോക്കണം. ഇതര സ്ഥാനം വടക്കുകിഴക്ക്.",
      "മാസ്റ്റർ ബെഡ്‌റൂം: തെക്കുപടിഞ്ഞാറ് (കന്നിമൂല). ഉറങ്ങുമ്പോൾ കിഴക്കോട്ടോ തെക്കോട്ടോ തലവെക്കുക (വടക്കോട്ട് തലവെക്കരുത്).",
      "കുട്ടികളുടെ മുറി / ഗസ്റ്റ് റൂം: വടക്കുപടിഞ്ഞാറ് (വായുകോൺ) അല്ലെങ്കിൽ പടിഞ്ഞാറ്.",
      "ലിവിങ് / സ്വീകരണമുറി: വടക്ക് അല്ലെങ്കിൽ വടക്കുകിഴക്ക്.",
      "പണപ്പെട്ടി / സേഫ്: തെക്കുപടിഞ്ഞാറോ പടിഞ്ഞാറോ മുറിയിൽ വടക്കോട്ടോ കിഴക്കോട്ടോ തുറക്കുന്ന രീതിയിൽ.",
      "സെപ്റ്റിക് ടാങ്ക്: വടക്കുപടിഞ്ഞാറ് (വായുകോൺ) അല്ലെങ്കിൽ വടക്ക്. കന്നിമൂല, അഗ്നിമൂല, ഈശാനമൂലകളിൽ ഒരിക്കലും പാടില്ല."
    ]
  },
  {
    id: "manayadi_table",
    title: "മനയടി ശാസ്ത്രം (Manayadi Shastram 6 to 121 Feet Table)",
    titleEn: "Room Dimensions in Feet & Effects",
    page: 38,
    summary: "മുറികളുടെ നീളവും വീതിയും അടി കണക്കിൽ നോക്കുമ്പോഴുള്ള സമഗ്ര ഫലങ്ങൾ.",
    keyPoints: [
      "ഉത്തമമായ പ്രധാന അളവുകൾ: 10, 11, 16, 17, 20, 21, 22, 26, 27, 28, 30, 32, 33, 35, 36, 37, 39, 41, 42, 45, 52, 56, 60, 64, 71, 72, 80, 90, 95, 100, 110, 113, 117, 121 അടി.",
      "വർജ്ജിക്കേണ്ട അളവുകൾ: 7, 9, 12, 13, 14, 15, 18, 19, 23, 24, 34, 38, 40, 43, 44, 46, 47, 48, 49, 51, 53, 54, 55, 57, 58, 59 അടി."
    ]
  },
  {
    id: "vastu_shayana",
    title: "വാസ്തുപുരുഷ ശയനം (Vastu Purusha Sleeping Orientation)",
    titleEn: "Quarterly Alignment of Vastu Purusha Head, Feet & Sight",
    page: 50,
    summary: "മലയാള മാസങ്ങളനുസരിച്ച് വാസ്തുപുരുഷന്റെ കിടപ്പും ദൃഷ്ടിയും.",
    keyPoints: [
      "കന്നി, തുലാം, വൃശ്ചികം (Sep, Oct, Nov): ശിരസ്സ് കിഴക്ക് (East), കാൽ പടിഞ്ഞാറ് (West), ദൃഷ്ടി തെക്ക് (South).",
      "ധനു, മകരം, കുംഭം (Dec, Jan, Feb): ശിരസ്സ് തെക്ക് (South), കാൽ വടക്ക് (North), ദൃഷ്ടി പടിഞ്ഞാറ് (West).",
      "മീനം, മേടം, ഇടവം (Mar, Apr, May): ശിരസ്സ് പടിഞ്ഞാറ് (West), കാൽ കിഴക്ക് (East), ദൃഷ്ടി വടക്ക് (North).",
      "മിഥുനം, കർക്കിടകം, ചിങ്ങം (Jun, Jul, Aug): ശിരസ്സ് വടക്ക് (North), കാൽ തെക്ക് (South), ദൃഷ്ടി കിഴക്ക് (East)."
    ]
  },
  {
    id: "marma_panchashiras",
    title: "മർമ്മദോഷശാന്തി & പഞ്ചശിരസ്ഥാപനം (Pancha Shiras Sthapanam)",
    titleEn: "Neutralizing Marma Dosha using 5 Sacred Animal Heads",
    page: 49,
    summary: "മർമ്മസ്ഥാനത്ത് സ്തംഭമോ ഭിത്തിയോ വന്നാൽ പരിഹാരമായി പഞ്ചശിരസ്ഥാപനം നടത്തുന്നു.",
    keyPoints: [
      "5 മൃഗങ്ങളുടെ സ്വർണ്ണ / പഞ്ചലോഹ ശിരസ്സുകൾ: പോത്ത് (Buffalo), സിംഹം (Lion), ആന (Elephant), ആമ (Tortoise), പന്നി (Boar).",
      "വാസ്തുപൂജ കഴിഞ്ഞ് പ്രധാന കവാടത്തിന്റെ വലത്തെ കാലിനടിയിൽ സ്ഥാപിക്കുന്നു."
    ]
  },
  {
    id: "vastu_bali_grihapravesham",
    title: "വാസ്തുബലി & ഗൃഹപ്രവേശം (Vastu Bali & Housewarming Rituals)",
    titleEn: "Vastu Bali Puja Materials & Grihapravesham Rules",
    page: 35,
    summary: "വാസ്തുബലിക്ക് ആവശ്യമായ പൂജാ സാധനങ്ങളും ഗൃഹപ്രവേശന വിധികൾ.",
    keyPoints: [
      "സാധനങ്ങൾ: ഇണവസ്ത്രം-2, വിതാനപ്പട്ട്-5, നിലവിളക്ക്-5, ഉണക്കലരി, അക്ഷതം, ശർക്കര, നാളികേരം, നെയ്യ്, പൂജാപാത്രങ്ങൾ (കിണ്ടി-2, ശംഖ്, ദൂപപാത്രം, ചന്ദനക്കിണ്ണം), കർപ്പൂരം, ചന്ദനം, അഷ്ടഗന്ധം, പാൽപ്പായസം, പഞ്ചഗവ്യം.",
      "ഗൃഹപ്രവേശം: കോണമാസങ്ങളായ മിഥുനം, കന്നി, ധനു, മീനം ഒഴിവാക്കുക.",
      "പ്രവേശിക്കുമ്പോൾ പുരുഷന്മാർ വലതുകാലും സ്ത്രീകൾ ഇടതുകാലും മുൻവെച്ചു പ്രവേശിക്കുക. അടുപ്പുകൂട്ടി പാലുകാച്ചുക."
    ]
  }
];
