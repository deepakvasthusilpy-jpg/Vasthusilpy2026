// Traditional Thachu Shastra & Manushyalaya Chandrika Canonical Inner Room Dimensions Dataset
// (വാസ്തു ശാസ്ത്ര പ്രകാരമുള്ള മുറികളുടെ ആന്തര അളവുകൾ - Vasthu Inner Measurements of Rooms)

export interface YoniDetail {
  number: number;
  name: string;
  nameMl: string;
  direction: string;
  directionMl: string;
  element: string;
  deity: string;
  nature: "ഉത്തമം" | "മധ്യമം" | "അധമം";
  phalam: string;
  phalamMl: string;
  isDwellingAuspicious: boolean;
}

export const THE_8_YONIS_LIST: YoniDetail[] = [
  {
    number: 1,
    name: "Dhwajam",
    nameMl: "ധ്വജം",
    direction: "East",
    directionMl: "കിഴക്ക്",
    element: "Fire / Sun",
    deity: "ഇന്ദ്രൻ / സൂര്യൻ",
    nature: "ഉത്തമം",
    phalam: "Wealth, prosperity, lineage growth & general success",
    phalamMl: "ധനം, സമൃദ്ധി, വംശവർദ്ധനവ്, സർവ്വകാര്യ വിജയം",
    isDwellingAuspicious: true,
  },
  {
    number: 2,
    name: "Dhoomam",
    nameMl: "ധൂമം",
    direction: "South-East",
    directionMl: "തെക്ക്-കിഴക്ക് (ആഗ്നേയം)",
    element: "Smoke / Agni",
    deity: "അഗ്നി",
    nature: "അധമം",
    phalam: "Grief, sorrow, discord & fire hazard risk",
    phalamMl: "ശോകം, ദുഃഖം, കലഹം, മാനസിക അശാന്തി",
    isDwellingAuspicious: false,
  },
  {
    number: 3,
    name: "Simham",
    nameMl: "സിംഹം",
    direction: "South",
    directionMl: "തെക്ക്",
    element: "Earth / Mars",
    deity: "യമൻ / മംഗളൻ",
    nature: "ഉത്തമം",
    phalam: "Victory, valor, authority & dominance over obstacles",
    phalamMl: "വിജയം, പ്രതാപം, ശത്രുജയം, ഉന്നത അധികാരം",
    isDwellingAuspicious: true,
  },
  {
    number: 4,
    name: "Shwanam (Sunaka)",
    nameMl: "ശ്വാനം (നായ)",
    direction: "South-West",
    directionMl: "തെക്ക്-പടിഞ്ഞാറ് (നൈരൃതി)",
    element: "Air / Rahu",
    deity: "നിര്യതി",
    nature: "അധമം",
    phalam: "Poverty, disease, restlessness & family disputes",
    phalamMl: "ദാരിദ്ര്യം, രോഗം, അലച്ചിൽ, കുടുംബ അസ്വാരസ്യം",
    isDwellingAuspicious: false,
  },
  {
    number: 5,
    name: "Vrishabham",
    nameMl: "വൃഷഭം",
    direction: "West",
    directionMl: "പടിഞ്ഞാറ്",
    element: "Water / Venus",
    deity: "വരുണൻ / ശുക്രൻ",
    nature: "ഉത്തമം",
    phalam: "Material comfort, cattle/agriculture wealth & peaceful life",
    phalamMl: "ഐശ്വര്യം, കന്നുകാലി സമ്പത്ത്, ഗൃഹസൗഖ്യം",
    isDwellingAuspicious: true,
  },
  {
    number: 6,
    name: "Kharam (Gardabha)",
    nameMl: "ഖരം (കഴുത)",
    direction: "North-West",
    directionMl: "വടക്ക്-പടിഞ്ഞാറ് (വായുകോൺ)",
    element: "Wind / Moon",
    deity: "വായു",
    nature: "അധമം",
    phalam: "Loss of assets, melancholy, fatigue & grief",
    phalamMl: "നാശം, വ്യസനം, ധനനഷ്ടം, മനക്ലേശം",
    isDwellingAuspicious: false,
  },
  {
    number: 7,
    name: "Gajam (Athak)",
    nameMl: "ഗജം (ആന)",
    direction: "North",
    directionMl: "വടക്ക്",
    element: "Space / Mercury",
    deity: "കുബേരൻ / ബുധൻ",
    nature: "ഉത്തമം",
    phalam: "Royal fortune, grace of Goddess Lakshmi & monetary growth",
    phalamMl: "രാജയോഗം, ലക്ഷ്മീ കടാക്ഷം, സർവ്വ സുഖസൗഭാഗ്യങ്ങൾ",
    isDwellingAuspicious: true,
  },
  {
    number: 8,
    name: "Vayasam (Kaka)",
    nameMl: "വായസം (കാക്ക)",
    direction: "North-East",
    directionMl: "വടക്ക്-കിഴക്ക് (ഈശാനകോൺ)",
    element: "Ether / Ketu",
    deity: "ഈശാനൻ",
    nature: "അധമം",
    phalam: "Destruction, untimely death, scarcity & ruin",
    phalamMl: "മരണം, അപമൃത്യു, കുലക്ഷയം, മഹാദുരിതം",
    isDwellingAuspicious: false,
  },
];

export interface RoomDimensionRecord {
  id: string;
  roomType: string;
  roomTypeMl: string;
  roomCategory:
    | "hall"
    | "master_bedroom"
    | "bedroom"
    | "kitchen"
    | "pooja"
    | "dining"
    | "study"
    | "sitout"
    | "store_workarea"
    | "toilet"
    | "staircase";
  lengthFt: number;
  lengthIn: number;
  widthFt: number;
  widthIn: number;
  dimensionLabel: string; // e.g. "16' 0\" × 14' 0\""
  dimensionCm: string; // e.g. "488 cm × 427 cm"
  kolViral: string; // e.g. "6 Kol 18 Viral × 5 Kol 22 Viral"
  areaSqFt: number;
  areaSqM: number;
  innerChuttuCm: number;
  innerChuttuKolViral: string;
  yoni: number;
  yoniName: string;
  phalam: "ഉത്തമം" | "മധ്യമം" | "അധമം";
  effectMl: string;
  effectEn: string;
  recommendedDirection: string;
  recommendedDirectionMl: string;
  cornerName: string; // e.g. "കന്നിമൂല", "ഈശാനകോൺ", "അഗ്നികോൺ", "വായുകോൺ"
  energyNote: string;
  vasthuRules: string[];
}

export const VASTHU_ROOM_INNER_MEASUREMENTS: RoomDimensionRecord[] = [
  // ===================== LIVING ROOM / HALL =====================
  {
    id: "hall-1",
    roomType: "Living Room / Hall",
    roomTypeMl: "ലിവിങ് ഹാൾ / പൂമുഖം",
    roomCategory: "hall",
    lengthFt: 16,
    lengthIn: 0,
    widthFt: 14,
    widthIn: 0,
    dimensionLabel: "16' 0\" × 14' 0\"",
    dimensionCm: "488 cm × 427 cm",
    kolViral: "6 കോൽ 18 വിരൽ × 5 കോൽ 22 വിരൽ",
    areaSqFt: 224,
    areaSqM: 20.8,
    innerChuttuCm: 1830,
    innerChuttuKolViral: "25 കോൽ 10 വിരൽ",
    yoni: 1,
    yoniName: "ധ്വജം (1 - കിഴക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "ധനവർദ്ധനവ്, അതിഥി സൽക്കാര പ്രീതി, കുടുംബത്തിൽ ഐശ്വര്യവും സന്തോഷവും.",
    effectEn: "Increase in wealth, hospitality blessings, familial harmony.",
    recommendedDirection: "North / East / North-East",
    recommendedDirectionMl: "വടക്ക് / കിഴക്ക് / ഈശാനകോൺ",
    cornerName: "ഈശാന / ഇന്ദ്ര പദം",
    energyNote: "പ്രാണവായു സഞ്ചാരവും സൂര്യപ്രകാശവും തടസ്സമില്ലാതെ ലഭിക്കുന്ന സ്ഥാനം.",
    vasthuRules: [
      "പ്രധാന വാതിൽ കിഴക്കോട്ടോ വടക്കോട്ടോ തുറക്കുന്ന രീതിയിൽ നൽകുക.",
      "ഹാളിന്റെ മധ്യഭാഗം (ബ്രഹ്മസൂത്രം) കനത്ത തൂണുകളോ തടസ്സങ്ങളോ ഇല്ലാതെ ഒഴിച്ചിടുക.",
      "സോഫയും ഇരിപ്പിടങ്ങളും തെക്കോട്ടോ പടിഞ്ഞാറോട്ടോ അഭിമുഖമായി വെച്ച് ഇരിക്കുന്നവർ കിഴക്കോട്ടോ വടക്കോട്ടോ നോക്കി ഇരിക്കുക.",
      "ടെലിവിഷൻ, ഇലക്ട്രോണിക് ഉപകരണങ്ങൾ തെക്കുകിഴക്കേ (ആഗ്നേയ) മൂലയിൽ സ്ഥാപിക്കുക."
    ]
  },
  {
    id: "hall-2",
    roomType: "Drawing Hall / Living",
    roomTypeMl: "സ്വീകരണമുറി (മീഡിയം)",
    roomCategory: "hall",
    lengthFt: 15,
    lengthIn: 0,
    widthFt: 12,
    widthIn: 0,
    dimensionLabel: "15' 0\" × 12' 0\"",
    dimensionCm: "457 cm × 366 cm",
    kolViral: "6 കോൽ 8 വിരൽ × 5 കോൽ 2 വിരൽ",
    areaSqFt: 180,
    areaSqM: 16.7,
    innerChuttuCm: 1646,
    innerChuttuKolViral: "22 കോൽ 21 വിരൽ",
    yoni: 1,
    yoniName: "ധ്വജം (1 - കിഴക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "പ്രതാപവും കീർത്തിയും, സമാധാനപരമായ കുടുംബജീവിതം.",
    effectEn: "Fame and high social standing, peaceful home atmosphere.",
    recommendedDirection: "North / East",
    recommendedDirectionMl: "വടക്ക് / കിഴക്ക്",
    cornerName: "കുബേര / വരുണ പദം",
    energyNote: "പോസിറ്റീവ് എനർജി വർദ്ധിപ്പിക്കുന്ന സമതുലിതമായ അനുപാതം.",
    vasthuRules: [
      "വടക്ക്, കിഴക്ക് ഭിത്തികളിൽ വലിയ ജനലുകൾ നൽകി വെളിച്ചം ഉറപ്പാക്കുക.",
      "ചുവരുകളിൽ ഇളം നിറങ്ങൾ (വെള്ള, ക്രീം, ഇളം നീല) മാത്രം ഉപയോഗിക്കുക."
    ]
  },
  {
    id: "hall-3",
    roomType: "Grand Living Hall",
    roomTypeMl: "വിശാലമായ സ്വീകരണമുറി",
    roomCategory: "hall",
    lengthFt: 18,
    lengthIn: 0,
    widthFt: 14,
    widthIn: 0,
    dimensionLabel: "18' 0\" × 14' 0\"",
    dimensionCm: "549 cm × 427 cm",
    kolViral: "7 കോൽ 15 വിരൽ × 5 കോൽ 22 വിരൽ",
    areaSqFt: 252,
    areaSqM: 23.4,
    innerChuttuCm: 1952,
    innerChuttuKolViral: "27 കോൽ 2 വിരൽ",
    yoni: 3,
    yoniName: "സിംഹം (3 - തെക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "നേതൃത്വഗുണം, അധികാര പ്രാപ്തി, തടസ്സങ്ങളില്ലാത്ത പുരോഗതി.",
    effectEn: "Leadership skills, executive authority, unimpeded growth.",
    recommendedDirection: "East / North-East",
    recommendedDirectionMl: "കിഴക്ക് / ഈശാനകോൺ",
    cornerName: "ഇന്ദ്ര പദം",
    energyNote: "സിംഹയോനി അന്തസ്സിനും നേതൃത്വപാടവത്തിനും അത്യുത്തമമാണ്.",
    vasthuRules: [
      "ഹാളിന്റെ വടക്കുകിഴക്ക് ഭാഗത്ത് ഭാരമേറിയ ഫർണിച്ചറുകൾ വെക്കരുത്.",
      "പ്രവേശന കവാടത്തിന് നേരെ കണ്ണാടി വെക്കാതിരിക്കുക."
    ]
  },
  {
    id: "hall-4",
    roomType: "Compact Hall / Foyer Living",
    roomTypeMl: "ചെറിയ സ്വീകരണമുറി",
    roomCategory: "hall",
    lengthFt: 14,
    lengthIn: 0,
    widthFt: 12,
    widthIn: 0,
    dimensionLabel: "14' 0\" × 12' 0\"",
    dimensionCm: "427 cm × 366 cm",
    kolViral: "5 കോൽ 22 വിരൽ × 5 കോൽ 2 വിരൽ",
    areaSqFt: 168,
    areaSqM: 15.6,
    innerChuttuCm: 1586,
    innerChuttuKolViral: "22 കോൽ 0 വിരൽ",
    yoni: 7,
    yoniName: "ഗജം (7 - വടക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "സാമ്പത്തിക അഭിവൃദ്ധി, കുബേര പ്രീതി, ധനാഗമം.",
    effectEn: "Monetary blessings of Kubera, continuous financial inflow.",
    recommendedDirection: "North / North-East",
    recommendedDirectionMl: "വടക്ക് / ഈശാനകോൺ",
    cornerName: "കുബേര പദം",
    energyNote: "ഗജയോനി ലക്ഷ്മീ കൃപയും ധനസഞ്ചയവും നൽകുന്നു.",
    vasthuRules: [
      "ഹാളിന്റെ വടക്കേ ഭിത്തിയിൽ ധനലക്ഷ്മി ചിത്രമോ ശുഭ ചിഹ്നങ്ങളോ തൂക്കുക.",
      "ഷൂ റാക്കുകൾ പ്രധാന വാതിലിന്റെ തൊട്ടുമുന്നിൽ വെക്കരുത്."
    ]
  },

  // ===================== MASTER BEDROOM =====================
  {
    id: "mbr-1",
    roomType: "Master Bedroom",
    roomTypeMl: "പ്രധാന ശയനമുറി (കന്നിമൂല)",
    roomCategory: "master_bedroom",
    lengthFt: 14,
    lengthIn: 0,
    widthFt: 13,
    widthIn: 0,
    dimensionLabel: "14' 0\" × 13' 0\"",
    dimensionCm: "427 cm × 396 cm",
    kolViral: "5 കോൽ 22 വിരൽ × 5 കോൽ 12 വിരൽ",
    areaSqFt: 182,
    areaSqM: 16.9,
    innerChuttuCm: 1646,
    innerChuttuKolViral: "22 കോൽ 21 വിരൽ",
    yoni: 1,
    yoniName: "ധ്വജം (1 - കിഴക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "ദാമ്പത്യ ഐക്യം, ദീർഘായുസ്സ്, കുടുംബനാഥന് ശാന്തമായ മനസ്സ്.",
    effectEn: "Marital harmony, longevity, emotional stability for head of family.",
    recommendedDirection: "South-West (Kannimoola)",
    recommendedDirectionMl: "തെക്ക്-പടിഞ്ഞാറ് (കന്നിമൂല)",
    cornerName: "നൈരൃതി കോൺ",
    energyNote: "ഭൂമി തത്ത്വം (Earth element) നൽകുന്ന അചഞ്ചലമായ സ്ഥിരത.",
    vasthuRules: [
      "ഉറങ്ങുമ്പോൾ തെക്കോട്ടോ (അത്യുത്തമം) കിഴക്കോട്ടോ തലവെച്ച് ഉറങ്ങുക. വടക്കോട്ട് ഒരിക്കലും തലവെക്കരുത്.",
      "പണപ്പെട്ടി, വാഡ്രോബ്, ലോക്കർ എന്നിവ തെക്കുപടിഞ്ഞാറെ ഭിത്തിയിൽ വടക്കോട്ടോ കിഴക്കോട്ടോ തുറക്കുന്ന രീതിയിൽ വെക്കുക.",
      "കട്ടിലിന് നേരെ കണ്ണാടി വരാത്ത രീതിയിൽ ഡ്രസ്സിങ് ടേബിൾ ക്രമീകരിക്കുക.",
      "മുറിയുടെ തറനിരപ്പ് മറ്റ് മുറികളേക്കാൾ അല്പം ഉയർന്നതോ സമനിരപ്പിലോ ആയിരിക്കണം."
    ]
  },
  {
    id: "mbr-2",
    roomType: "Master Bedroom (Spacious)",
    roomTypeMl: "വിശാലമായ മാസ്റ്റർ ബെഡ്‌റൂം",
    roomCategory: "master_bedroom",
    lengthFt: 15,
    lengthIn: 0,
    widthFt: 13,
    widthIn: 0,
    dimensionLabel: "15' 0\" × 13' 0\"",
    dimensionCm: "457 cm × 396 cm",
    kolViral: "6 കോൽ 8 വിരൽ × 5 കോൽ 12 വിരൽ",
    areaSqFt: 195,
    areaSqM: 18.1,
    innerChuttuCm: 1707,
    innerChuttuKolViral: "23 കോൽ 17 വിരൽ",
    yoni: 3,
    yoniName: "സിംഹം (3 - തെക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "ഗൃഹനാഥന്റെ അധികാരം, മാനസിക സ്ഥൈര്യം, ആരോഗ്യ വർദ്ധനവ്.",
    effectEn: "Authority, mental firmness, health vigor for house owner.",
    recommendedDirection: "South-West / South",
    recommendedDirectionMl: "തെക്ക്-പടിഞ്ഞാറ് / തെക്ക്",
    cornerName: "നൈരൃതി / യമ പദം",
    energyNote: "സിംഹയോനി കന്നിമൂലയിൽ ഗൃഹനാഥന് ആജ്ഞാശക്തി നൽകുന്നു.",
    vasthuRules: [
      "കട്ടിൽ മുറിയുടെ മധ്യത്തിലോ തെക്കുപടിഞ്ഞാറോ ഇടുക; വടക്കുകിഴക്ക് മൂല ഒഴിഞ്ഞിരിക്കണം.",
      "അറ്റാച്ച്ഡ് ബാത്ത്റൂം മുറിയുടെ വടക്കുപടിഞ്ഞാറെ ഭാഗത്ത് ക്രമീകരിക്കുക."
    ]
  },
  {
    id: "mbr-3",
    roomType: "Master Bedroom (Standard)",
    roomTypeMl: "മാസ്റ്റർ ബെഡ്‌റൂം (സ്റ്റാൻഡേർഡ്)",
    roomCategory: "master_bedroom",
    lengthFt: 14,
    lengthIn: 0,
    widthFt: 12,
    widthIn: 0,
    dimensionLabel: "14' 0\" × 12' 0\"",
    dimensionCm: "427 cm × 366 cm",
    kolViral: "5 കോൽ 22 വിരൽ × 5 കോൽ 2 വിരൽ",
    areaSqFt: 168,
    areaSqM: 15.6,
    innerChuttuCm: 1586,
    innerChuttuKolViral: "22 കോൽ 0 വിരൽ",
    yoni: 7,
    yoniName: "ഗജം (7 - വടക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "ധനഭദ്രത, സ്വത്തുരേഖ സംരക്ഷണം, മാനസിക സമാധാനം.",
    effectEn: "Financial security, sound sleep, property protection.",
    recommendedDirection: "South-West",
    recommendedDirectionMl: "തെക്ക്-പടിഞ്ഞാറ് (കന്നിമൂല)",
    cornerName: "നൈരൃതി പദം",
    energyNote: "ഗജയോനി നൽകുന്ന സമ്പൽസമൃദ്ധിയും ഗൃഹഭദ്രതയും.",
    vasthuRules: [
      "കിടക്കയുടെ മുകളിൽ വലിയ കോൺക്രീറ്റ് ബീമുകൾ വരാതെ ശ്രദ്ധിക്കുക.",
      "കന്നിമൂല ഭാഗത്ത് ജനലുകളുടെ വലിപ്പം കുറച്ച് നൽകുന്നത് പോസിറ്റീവ് എനർജി തങ്ങിനിൽക്കാൻ സഹായിക്കും."
    ]
  },
  {
    id: "mbr-4",
    roomType: "Master Bedroom (Compact)",
    roomTypeMl: "മാസ്റ്റർ ബെഡ്‌റൂം (കോംപാക്റ്റ്)",
    roomCategory: "master_bedroom",
    lengthFt: 12,
    lengthIn: 0,
    widthFt: 11,
    widthIn: 0,
    dimensionLabel: "12' 0\" × 11' 0\"",
    dimensionCm: "366 cm × 335 cm",
    kolViral: "5 കോൽ 2 വിരൽ × 4 കോൽ 16 വിരൽ",
    areaSqFt: 132,
    areaSqM: 12.3,
    innerChuttuCm: 1402,
    innerChuttuKolViral: "19 കോൽ 11 വിരൽ",
    yoni: 5,
    yoniName: "വൃഷഭം (5 - പടിഞ്ഞാറ്)",
    phalam: "ഉത്തമം",
    effectMl: "സുഖകരമായ ഉറക്കം, ആരോഗ്യം, ദാമ്പത്യ സൗഖ്യം.",
    effectEn: "Comfortable deep sleep, health rejuvenation, contentment.",
    recommendedDirection: "South-West / West",
    recommendedDirectionMl: "തെക്ക്-പടിഞ്ഞാറ് / പടിഞ്ഞാറ്",
    cornerName: "നൈരൃതി / വരുണ കോൺ",
    energyNote: "വൃഷഭയോനി ഭൗതിക സുഖവും സൗഖ്യവും പ്രധാനം ചെയ്യുന്നു.",
    vasthuRules: [
      "ലൈറ്റ് കളർ കർട്ടനുകളും പെയിന്റും ഉപയോഗിക്കുക.",
      "എയർകണ്ടീഷണർ വടക്കോ പടിഞ്ഞാറോ ഭിത്തിയിൽ നൽകുക."
    ]
  },

  // ===================== KITCHEN / COOKING =====================
  {
    id: "kitch-1",
    roomType: "Kitchen / Cooking Hearth",
    roomTypeMl: "അടുക്കള (ആഗ്നേയം - തെക്കുകിഴക്ക്)",
    roomCategory: "kitchen",
    lengthFt: 12,
    lengthIn: 0,
    widthFt: 10,
    widthIn: 0,
    dimensionLabel: "12' 0\" × 10' 0\"",
    dimensionCm: "366 cm × 305 cm",
    kolViral: "5 കോൽ 2 വിരൽ × 4 കോൽ 6 വിരൽ",
    areaSqFt: 120,
    areaSqM: 11.1,
    innerChuttuCm: 1342,
    innerChuttuKolViral: "18 കോൽ 15 വിരൽ",
    yoni: 3,
    yoniName: "സിംഹം (3 - തെക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "അന്നസമൃദ്ധി, വിശപ്പും ദഹനവും കൃത്യമാകുന്നു, അഗ്നിദേവന്റെ അനുഗ്രഹം.",
    effectEn: "Abundance of food, balanced digestive health, blessings of Lord Agni.",
    recommendedDirection: "South-East (Agni Kon)",
    recommendedDirectionMl: "തെക്ക്-കിഴക്ക് (അഗ്നികോൺ)",
    cornerName: "ആഗ്നേയ കോൺ",
    energyNote: "അഗ്നി തത്ത്വത്തിന്റെ സ്രോതസ്സ്; പ്രഭാത സൂര്യകിരണങ്ങൾ ഭക്ഷണത്തിൽ വീഴുന്നു.",
    vasthuRules: [
      "അടുപ്പ് (Gas Stove) കിഴക്കേ ഭിത്തിയിൽ സ്ഥാപിക്കുക; പാചകം ചെയ്യുന്നയാൾ കിഴക്കോട്ട് നോക്കി നിൽക്കണം.",
      "സിങ്ക് / വാട്ടർ ടാപ്പ് അടുക്കളയുടെ വടക്കുകിഴക്കേ മൂലയിൽ നൽകുക (തീയും വെള്ളവും തമ്മിൽ 2 അടി എങ്കിലും അകലം പാലിക്കുക).",
      "ഫ്രിഡ്ജ് തെക്കുപടിഞ്ഞാറോ പടിഞ്ഞാറോ ഭാഗത്ത് വെക്കുക.",
      "അടുക്കള പൂജാമുറിയുടെ മുകളിലോ ടോയ്‌ലറ്റിന് താഴെയോ വരാൻ പാടില്ല."
    ]
  },
  {
    id: "kitch-2",
    roomType: "Kitchen (Spacious)",
    roomTypeMl: "വിശാലമായ അടുക്കള",
    roomCategory: "kitchen",
    lengthFt: 13,
    lengthIn: 0,
    widthFt: 10,
    widthIn: 6,
    dimensionLabel: "13' 0\" × 10' 6\"",
    dimensionCm: "396 cm × 320 cm",
    kolViral: "5 കോൽ 12 വിരൽ × 4 കോൽ 11 വിരൽ",
    areaSqFt: 136.5,
    areaSqM: 12.7,
    innerChuttuCm: 1433,
    innerChuttuKolViral: "19 കോൽ 22 വിരൽ",
    yoni: 5,
    yoniName: "വൃഷഭം (5 - പടിഞ്ഞാറ്)",
    phalam: "ഉത്തമം",
    effectMl: "രോഗമില്ലായ്മ, ലക്ഷ്മീ സാന്നിധ്യം, ഭക്ഷണത്തിൽ രുചിവർദ്ധനവ്.",
    effectEn: "Freedom from illnesses, presence of Lakshmi, culinary delight.",
    recommendedDirection: "South-East / North-West",
    recommendedDirectionMl: "തെക്ക്-കിഴക്ക് / വടക്ക്-പടിഞ്ഞാറ്",
    cornerName: "ആഗ്നേയം / വായുകോൺ",
    energyNote: "വൃഷഭയോനി സുഭിക്ഷമായ ധാന്യസമൃദ്ധി പ്രദാനം ചെയ്യുന്നു.",
    vasthuRules: [
      "പാചകപ്പുക പുറത്തുപോകാൻ കിഴക്ക് ഭാഗത്ത് ചിമ്മിനി നൽകുക.",
      "ധാന്യങ്ങളും പലവ്യഞ്ജനങ്ങളും തെക്ക് അല്ലെങ്കിൽ പടിഞ്ഞാറെ ഷെൽഫുകളിൽ സൂക്ഷിക്കുക."
    ]
  },
  {
    id: "kitch-3",
    roomType: "Kitchen (Compact)",
    roomTypeMl: "ചെറിയ അടുക്കള",
    roomCategory: "kitchen",
    lengthFt: 11,
    lengthIn: 0,
    widthFt: 9,
    widthIn: 0,
    dimensionLabel: "11' 0\" × 9' 0\"",
    dimensionCm: "335 cm × 274 cm",
    kolViral: "4 കോൽ 16 വിരൽ × 3 കോൽ 19 വിരൽ",
    areaSqFt: 99,
    areaSqM: 9.2,
    innerChuttuCm: 1219,
    innerChuttuKolViral: "16 കോൽ 22 വിരൽ",
    yoni: 1,
    yoniName: "ധ്വജം (1 - കിഴക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "അഗ്നിപ്രീതി, കുടുംബാംഗങ്ങൾക്ക് ഉന്മേഷം, ആഹാരപുഷ്ടി.",
    effectEn: "Vitality for family members, nourishment, kitchen prosperity.",
    recommendedDirection: "South-East (Agni)",
    recommendedDirectionMl: "തെക്ക്-കിഴക്ക് (അഗ്നികോൺ)",
    cornerName: "ആഗ്നേയ പദം",
    energyNote: "ധ്വജയോനി ധനാഗമത്തിനും പോഷകഗുണ വർദ്ധനവിനും ഉത്തമമാണ്.",
    vasthuRules: [
      "കറുത്ത നിറത്തിലുള്ള കിച്ചൻ കൗണ്ടർടോപ്പുകൾ ഒഴിവാക്കുക; പച്ച, ബ്രൗൺ, അല്ലെങ്കിൽ ഇളം ഗ്രാനൈറ്റ് ഉത്തമം.",
      "വേസ്റ്റ് ബിൻ വടക്കുപടിഞ്ഞാറെ മൂലയിൽ വെക്കുക."
    ]
  },

  // ===================== SECOND BEDROOM / CHILDREN =====================
  {
    id: "bed-1",
    roomType: "Children's / Study Bedroom",
    roomTypeMl: "കുട്ടികളുടെ കിടപ്പുമുറി / വിദ്യാരംഗം",
    roomCategory: "bedroom",
    lengthFt: 12,
    lengthIn: 0,
    widthFt: 11,
    widthIn: 0,
    dimensionLabel: "12' 0\" × 11' 0\"",
    dimensionCm: "366 cm × 335 cm",
    kolViral: "5 കോൽ 2 വിരൽ × 4 കോൽ 16 വിരൽ",
    areaSqFt: 132,
    areaSqM: 12.3,
    innerChuttuCm: 1402,
    innerChuttuKolViral: "19 കോൽ 11 വിരൽ",
    yoni: 5,
    yoniName: "വൃഷഭം (5 - പടിഞ്ഞാറ്)",
    phalam: "ഉത്തമം",
    effectMl: "കുട്ടികളിൽ പഠന ഏകാഗ്രത, പരീക്ഷാ വിജയം, സ്വഭാവഗുണം.",
    effectEn: "High academic concentration, exam success, virtuous habits.",
    recommendedDirection: "North-West / West",
    recommendedDirectionMl: "വടക്ക്-പടിഞ്ഞാറ് (വായുകോൺ) / പടിഞ്ഞാറ്",
    cornerName: "വായുകോൺ / വരുണ പദം",
    energyNote: "വായു തത്ത്വം ഉത്സാഹവും ഭാവനാശേഷിയും സൃഷ്ടിക്കുന്നു.",
    vasthuRules: [
      "പഠനമേശ കിഴക്കോട്ടോ വടക്കോട്ടോ അഭിമുഖമായി നൽകുക.",
      "പുസ്തക ഷെൽഫ് വടക്ക് അല്ലെങ്കിൽ കിഴക്ക് ഭിത്തിയിൽ നൽകുക.",
      "കുട്ടികൾ ഉറങ്ങുമ്പോൾ കിഴക്കോട്ടോ തെക്കോട്ടോ തലവെക്കുക."
    ]
  },
  {
    id: "bed-2",
    roomType: "Guest Bedroom",
    roomTypeMl: "അതിഥി ശയനമുറി",
    roomCategory: "bedroom",
    lengthFt: 12,
    lengthIn: 0,
    widthFt: 10,
    widthIn: 0,
    dimensionLabel: "12' 0\" × 10' 0\"",
    dimensionCm: "366 cm × 305 cm",
    kolViral: "5 കോൽ 2 വിരൽ × 4 കോൽ 6 വിരൽ",
    areaSqFt: 120,
    areaSqM: 11.1,
    innerChuttuCm: 1342,
    innerChuttuKolViral: "18 കോൽ 15 വിരൽ",
    yoni: 3,
    yoniName: "സിംഹം (3 - തെക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "അതിഥികൾക്ക് സുഖവാസം, ആതിഥ്യ മര്യാദ, മാന്യമായ പെരുമാറ്റം.",
    effectEn: "Comfortable guest stay, hospitable relations, high regard.",
    recommendedDirection: "North-West (Vayu Kon)",
    recommendedDirectionMl: "വടക്ക്-പടിഞ്ഞാറ് (വായുകോൺ)",
    cornerName: "വായുകോൺ",
    energyNote: "വായുകോൺ അതിഥികൾക്ക് അമിത താമസമില്ലാതെ സുഖവാസം ഉറപ്പാക്കുന്നു.",
    vasthuRules: [
      "അതിഥി മുറി കന്നിമൂലയിൽ പണിയരുത് (കന്നിമൂല ഗൃഹനാഥന് മാത്രം).",
      "കിടക്ക പടിഞ്ഞാറോ തെക്കോ ഭിത്തിയിൽ ഇടുക."
    ]
  },
  {
    id: "bed-3",
    roomType: "Parents / Senior Bedroom",
    roomTypeMl: "മാതാപിതാക്കളുടെ മുറി",
    roomCategory: "bedroom",
    lengthFt: 13,
    lengthIn: 0,
    widthFt: 11,
    widthIn: 0,
    dimensionLabel: "13' 0\" × 11' 0\"",
    dimensionCm: "396 cm × 335 cm",
    kolViral: "5 കോൽ 12 വിരൽ × 4 കോൽ 16 വിരൽ",
    areaSqFt: 143,
    areaSqM: 13.3,
    innerChuttuCm: 1463,
    innerChuttuKolViral: "20 കോൽ 8 വിരൽ",
    yoni: 1,
    yoniName: "ധ്വജം (1 - കിഴക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "ആയുരാരോഗ്യം, വാർദ്ധക്യ സമാധാനം, ആത്മീയ ചിന്തകൾ.",
    effectEn: "Sound health, peaceful old age, spiritual tranquility.",
    recommendedDirection: "South / West",
    recommendedDirectionMl: "തെക്ക് / പടിഞ്ഞാറ്",
    cornerName: "യമ / വരുണ പദം",
    energyNote: "ധ്വജയോനി മുതിർന്നവർക്ക് ആയുസ്സും ശാരീരിക സുഖവും നൽകുന്നു.",
    vasthuRules: [
      "തറനിരപ്പിൽ നിന്ന് ഉയരമുള്ള പടികൾ ഒഴിവാക്കുക; വെളിച്ചവും വായുസഞ്ചാരവും കൂട്ടുക.",
      "പ്രഭാത സൂര്യപ്രകാശം ലഭിക്കുന്ന വലിയ കിഴക്കൻ ജനൽ നൽകുക."
    ]
  },

  // ===================== POOJA ROOM =====================
  {
    id: "pooja-1",
    roomType: "Pooja Room (Standard)",
    roomTypeMl: "പൂജാമുറി / പ്രാർത്ഥനാ മുറി",
    roomCategory: "pooja",
    lengthFt: 7,
    lengthIn: 0,
    widthFt: 6,
    widthIn: 0,
    dimensionLabel: "7' 0\" × 6' 0\"",
    dimensionCm: "213 cm × 183 cm",
    kolViral: "2 കോൽ 23 വിരൽ × 2 കോൽ 13 വിരൽ",
    areaSqFt: 42,
    areaSqM: 3.9,
    innerChuttuCm: 793,
    innerChuttuKolViral: "11 കോൽ 0 വിരൽ",
    yoni: 7,
    yoniName: "ഗജം (7 - വടക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "ആത്മീയ ശാന്തി, കുബേര പ്രീതി, സർവ്വ ഐശ്വര്യ സിദ്ധി, കുടുംബ സംരക്ഷണം.",
    effectEn: "Spiritual serenity, grace of Ishana & Kubera, supreme auspiciousness.",
    recommendedDirection: "North-East (Ishana Kon)",
    recommendedDirectionMl: "വടക്ക്-കിഴക്ക് (ഈശാനകോൺ)",
    cornerName: "ഈശാന കോൺ",
    energyNote: "ദൈവീക ഊർജ്ജത്തിന്റെ ഉത്ഭവസ്ഥാനം; കോസ്മിക് തരംഗങ്ങളുടെ പ്രവാഹം.",
    vasthuRules: [
      "വിഗ്രഹങ്ങൾ / ഫോട്ടോകൾ പടിഞ്ഞാറോ കിഴക്കോ അഭിമുഖമായി വെക്കുക; പ്രാർത്ഥിക്കുന്നയാൾ കിഴക്കോട്ടോ വടക്കോട്ടോ നോക്കണം.",
      "പൂജാമുറി ടോയ്‌ലറ്റിനോട് ചേർന്നോ, കോണിപ്പടിയുടെ അടിയിലോ പണിയാൻ പാടില്ല.",
      "നിലവിളക്ക് കിഴക്ക്-പടിഞ്ഞാറ് ദിശയിൽ തിരി തെളിക്കുക.",
      "വെളുപ്പ്, ഇളം മഞ്ഞ, ക്രീം മാർബിൾ എന്നിവ പൂജാമുറിക്ക് അത്യുത്തമം."
    ]
  },
  {
    id: "pooja-2",
    roomType: "Pooja Room (Compact)",
    roomTypeMl: "പൂജാമുറി (ചെറുത്)",
    roomCategory: "pooja",
    lengthFt: 6,
    lengthIn: 0,
    widthFt: 5,
    widthIn: 0,
    dimensionLabel: "6' 0\" × 5' 0\"",
    dimensionCm: "183 cm × 152 cm",
    kolViral: "2 കോൽ 13 വിരൽ × 2 കോൽ 3 വിരൽ",
    areaSqFt: 30,
    areaSqM: 2.8,
    innerChuttuCm: 671,
    innerChuttuKolViral: "9 കോൽ 8 വിരൽ",
    yoni: 1,
    yoniName: "ധ്വജം (1 - കിഴക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "ദൈവാനുഗ്രഹം, മനശാന്തി, ശുഭകാര്യ സിദ്ധി.",
    effectEn: "Divine blessings, mental peace, auspicious fulfillment.",
    recommendedDirection: "North-East / East",
    recommendedDirectionMl: "വടക്ക്-കിഴക്ക് / കിഴക്ക്",
    cornerName: "ഈശാന / ഇന്ദ്ര പദം",
    energyNote: "ധ്വജയോനി പ്രാർത്ഥനാ മുറിയിൽ ശുദ്ധമായ ചൈതന്യം നൽകുന്നു.",
    vasthuRules: [
      "ഇരുമ്പ് അലമാരകളോ ഭാരമേറിയ വസ്തുക്കളോ പൂജാമുറിയിൽ സൂക്ഷിക്കരുത്.",
      "പൂജാമുറിയുടെ കതകുകൾ ഇരട്ടപ്പാളിയായി (Double shutter) നൽകുന്നത് ശ്രേഷ്ഠമാണ്."
    ]
  },
  {
    id: "pooja-3",
    roomType: "Square Pooja Sanctuary",
    roomTypeMl: "സമചതുര പൂജാമുറി",
    roomCategory: "pooja",
    lengthFt: 5,
    lengthIn: 0,
    widthFt: 5,
    widthIn: 0,
    dimensionLabel: "5' 0\" × 5' 0\"",
    dimensionCm: "152 cm × 152 cm",
    kolViral: "2 കോൽ 3 വിരൽ × 2 കോൽ 3 വിരൽ",
    areaSqFt: 25,
    areaSqM: 2.3,
    innerChuttuCm: 610,
    innerChuttuKolViral: "8 കോൽ 11 വിരൽ",
    yoni: 5,
    yoniName: "വൃഷഭം (5 - പടിഞ്ഞാറ്)",
    phalam: "ഉത്തമം",
    effectMl: "ഗൃഹത്തിൽ ദേവീ സാന്നിധ്യം, സർവ്വ വിഘ്ന നിവാരണം.",
    effectEn: "Goddess presence, removal of all family impediments.",
    recommendedDirection: "North-East (Ishana)",
    recommendedDirectionMl: "വടക്ക്-കിഴക്ക് (ഈശാനകോൺ)",
    cornerName: "ഈശാന പദം",
    energyNote: "സമചതുരം പൂജാസ്ഥാനത്തിന് പവിത്രമായ സമഗ്രത നൽകുന്നു.",
    vasthuRules: [
      "പൂജാ സാമഗ്രികൾ സൂക്ഷിക്കുന്ന പെട്ടി തെക്ക് അല്ലെങ്കിൽ പടിഞ്ഞാറെ ഭിത്തിയിൽ നൽകുക.",
      "പൂജാമുറിയുടെ തറയിൽ വെള്ള മാർബിളോ തടിയോ ഉത്തമം."
    ]
  },

  // ===================== DINING HALL =====================
  {
    id: "din-1",
    roomType: "Dining Hall",
    roomTypeMl: "ഊണുമുറി / ഭക്ഷണശാല",
    roomCategory: "dining",
    lengthFt: 14,
    lengthIn: 0,
    widthFt: 11,
    widthIn: 0,
    dimensionLabel: "14' 0\" × 11' 0\"",
    dimensionCm: "427 cm × 335 cm",
    kolViral: "5 കോൽ 22 വിരൽ × 4 കോൽ 16 വിരൽ",
    areaSqFt: 154,
    areaSqM: 14.3,
    innerChuttuCm: 1524,
    innerChuttuKolViral: "21 കോൽ 4 വിരൽ",
    yoni: 7,
    yoniName: "ഗജം (7 - വടക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "കുടുംബാംഗങ്ങളുടെ ഒത്തൊരുമ, ആഹാരതൃപ്തി, സാമ്പത്തിക ലാഭം.",
    effectEn: "Family cohesion, digestive contentment, monetary saving.",
    recommendedDirection: "West / East (Near Kitchen)",
    recommendedDirectionMl: "പടിഞ്ഞാറ് / കിഴക്ക് (അടുക്കളയോട് ചേർന്ന്)",
    cornerName: "വരുണ പദം",
    energyNote: "പടിഞ്ഞാറെ വരുണപദം ഭക്ഷണത്തിലെ പോഷകങ്ങൾ ശരീരത്തിൽ ശരിയായി ആഗിരണം ചെയ്യാൻ സഹായിക്കുന്നു.",
    vasthuRules: [
      "ഡൈനിങ് ടേബിളിന്റെ തലയ്ക്കൽ ഗൃഹനാഥൻ കിഴക്കോട്ടോ വടക്കോട്ടോ നോക്കി ഇരിക്കുക.",
      "വാഷ് ബേസിൻ വടക്ക് അല്ലെങ്കിൽ കിഴക്ക് ഭിത്തിയിൽ സ്ഥാപിക്കുക.",
      "ഡൈനിങ് റൂമിൽ തെക്കേ ഭിത്തിയിൽ വലിയ കണ്ണാടി തൂക്കുന്നത് സമൃദ്ധി ഇരട്ടിയാക്കും."
    ]
  },
  {
    id: "din-2",
    roomType: "Dining Hall (Compact)",
    roomTypeMl: "ചെറിയ ഊണുമുറി",
    roomCategory: "dining",
    lengthFt: 12,
    lengthIn: 0,
    widthFt: 10,
    widthIn: 0,
    dimensionLabel: "12' 0\" × 10' 0\"",
    dimensionCm: "366 cm × 305 cm",
    kolViral: "5 കോൽ 2 വിരൽ × 4 കോൽ 6 വിരൽ",
    areaSqFt: 120,
    areaSqM: 11.1,
    innerChuttuCm: 1342,
    innerChuttuKolViral: "18 കോൽ 15 വിരൽ",
    yoni: 3,
    yoniName: "സിംഹം (3 - തെക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "സുഖകരമായ ഒത്തുകൂടൽ, അതിഥികൾക്ക് സംതൃപ്തി.",
    effectEn: "Delightful get-togethers, guest satisfaction.",
    recommendedDirection: "West",
    recommendedDirectionMl: "പടിഞ്ഞാറ്",
    cornerName: "വരുണ കോൺ",
    energyNote: "സിംഹയോനി ശക്തിയും സംതൃപ്തിയും നൽകുന്നു.",
    vasthuRules: [
      "ടോയ്‌ലറ്റിന്റെ വാതിൽ ഡൈനിങ് ടേബിളിലേക്ക് നേരിട്ട് തുറക്കാതിരിക്കാൻ ശ്രദ്ധിക്കുക.",
      "വൃത്താകൃതിയേക്കാൾ ചതുരമോ ദീർഘചതുരമോ ആയ ടേബിൾ തിരഞ്ഞെടുക്കുക."
    ]
  },

  // ===================== STUDY ROOM / OFFICE =====================
  {
    id: "study-1",
    roomType: "Study / Home Office",
    roomTypeMl: "പഠനമുറി / ഓഫീസ് റൂം",
    roomCategory: "study",
    lengthFt: 11,
    lengthIn: 0,
    widthFt: 10,
    widthIn: 0,
    dimensionLabel: "11' 0\" × 10' 0\"",
    dimensionCm: "335 cm × 305 cm",
    kolViral: "4 കോൽ 16 വിരൽ × 4 കോൽ 6 വിരൽ",
    areaSqFt: 110,
    areaSqM: 10.2,
    innerChuttuCm: 1280,
    innerChuttuKolViral: "17 കോൽ 19 വിരൽ",
    yoni: 7,
    yoniName: "ഗജം (7 - വടക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "ബുദ്ധിശക്തി, ഗ്രാഹ്യശേഷി, പ്രൊഫഷണൽ വിജയം, കരിയർ മുന്നേറ്റം.",
    effectEn: "Intellectual sharpness, career breakthroughs, academic honors.",
    recommendedDirection: "North / North-East / East",
    recommendedDirectionMl: "വടക്ക് / ഈശാനകോൺ / കിഴക്ക്",
    cornerName: "ബുധ / സരസ്വതീ പദം",
    energyNote: "ബുധന്റെ അനുഗ്രഹം വിദ്യയിലും വ്യാപാരത്തിലും ഉയർന്ന ജയം നൽകുന്നു.",
    vasthuRules: [
      "പഠനമേശയിൽ ഇരിക്കുമ്പോൾ കിഴക്കോട്ടോ വടക്കോട്ടോ അഭിമുഖമായി ഇരിക്കുക.",
      "പിന്നിൽ ഉറപ്പുള്ള ഭിത്തി വരുന്ന വിധത്തിൽ കസേര ഇടുക (ഡോറിന് പുറം തിരിഞ്ഞ് ഇരിക്കരുത്).",
      "കംപ്യൂട്ടറും ലാപ്‌ടോപ്പും മേശയുടെ തെക്കുകിഴക്കേ ഭാഗത്ത് വെക്കുക."
    ]
  },

  // ===================== SITOUT / VERANDAH =====================
  {
    id: "sit-1",
    roomType: "Sitout / Front Verandah",
    roomTypeMl: "സിറ്റൗട്ട് / പൂമുഖം",
    roomCategory: "sitout",
    lengthFt: 14,
    lengthIn: 0,
    widthFt: 8,
    widthIn: 0,
    dimensionLabel: "14' 0\" × 8' 0\"",
    dimensionCm: "427 cm × 244 cm",
    kolViral: "5 കോൽ 22 വിരൽ × 3 കോൽ 9 വിരൽ",
    areaSqFt: 112,
    areaSqM: 10.4,
    innerChuttuCm: 1342,
    innerChuttuKolViral: "18 കോൽ 15 വിരൽ",
    yoni: 3,
    yoniName: "സിംഹം (3 - തെക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "പ്രൗഢിയുള്ള ആഗമനമുഖം, ആദരവ്, മാന്യത.",
    effectEn: "Dignified entrance, respect, social standing.",
    recommendedDirection: "East / North",
    recommendedDirectionMl: "കിഴക്ക് / വടക്ക്",
    cornerName: "ഇന്ദ്ര / കുബേര മുഖം",
    energyNote: "വീട്ടിലേക്ക് ശുഭവായു പ്രവേശിക്കുന്ന ആദ്യ കവാടം.",
    vasthuRules: [
      "സിറ്റൗട്ടിലെ പടികൾ ഒറ്റസംഖ്യയിൽ (3, 5, 7) നൽകുക.",
      "വടക്ക്, കിഴക്ക് ഭാഗങ്ങളിൽ ചെടികൾ വെക്കാവുന്നതാണ്; എന്നാൽ വൻ മരങ്ങൾ പ്രവേശന കവാടത്തിന് തടസ്സമാകരുത്."
    ]
  },

  // ===================== WORK AREA / STORE =====================
  {
    id: "store-1",
    roomType: "Work Area / Store Room",
    roomTypeMl: "വർക്ക് ഏരിയ / കലവറ",
    roomCategory: "store_workarea",
    lengthFt: 10,
    lengthIn: 0,
    widthFt: 7,
    widthIn: 0,
    dimensionLabel: "10' 0\" × 7' 0\"",
    dimensionCm: "305 cm × 213 cm",
    kolViral: "4 കോൽ 6 വിരൽ × 2 കോൽ 23 വിരൽ",
    areaSqFt: 70,
    areaSqM: 6.5,
    innerChuttuCm: 1036,
    innerChuttuKolViral: "14 കോൽ 9 വിരൽ",
    yoni: 3,
    yoniName: "സിംഹം (3 - തെക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "ധാന്യങ്ങൾ കേടുവരാതെ സൂക്ഷിക്കാം, പണിക്കാർക്ക് സൗകര്യം.",
    effectEn: "Safe grain storage, efficient utility workflow.",
    recommendedDirection: "South / West (Adjacent to kitchen)",
    recommendedDirectionMl: "തെക്ക് / പടിഞ്ഞാറ് (അടുക്കളയോട് ചേർന്ന്)",
    cornerName: "യമ / വരുണ കോൺ",
    energyNote: "ഭാരമേറിയ സംഭരണത്തിന് തെക്കും പടിഞ്ഞാറും ഉത്തമം.",
    vasthuRules: [
      "കനത്ത ചാക്കുകളും സിലിണ്ടറുകളും തെക്കുപടിഞ്ഞാറെ മൂലയിൽ വെക്കുക.",
      "വാഷിങ് മെഷീൻ വടക്കുപടിഞ്ഞാറോ തെക്കുകിഴക്കോ സ്ഥാപിക്കുക."
    ]
  },

  // ===================== TOILET / BATHROOM =====================
  {
    id: "toilet-1",
    roomType: "Attached Toilet / Bathroom",
    roomTypeMl: "ശുചിമുറി / അറ്റാച്ച്ഡ് ബാത്ത്റൂം",
    roomCategory: "toilet",
    lengthFt: 8,
    lengthIn: 0,
    widthFt: 5,
    widthIn: 0,
    dimensionLabel: "8' 0\" × 5' 0\"",
    dimensionCm: "244 cm × 152 cm",
    kolViral: "3 കോൽ 9 വിരൽ × 2 കോൽ 3 വിരൽ",
    areaSqFt: 40,
    areaSqM: 3.7,
    innerChuttuCm: 793,
    innerChuttuKolViral: "11 കോൽ 0 വിരൽ",
    yoni: 7,
    yoniName: "ഗജം (7 - വടക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "ശുചിത്വം, വായുസഞ്ചാരം, നെഗറ്റീവ് ഊർജ്ജ നിവാരണം.",
    effectEn: "Hygienic ventilation, expelling of stagnant energy.",
    recommendedDirection: "North-West (Vayu Kon) / West",
    recommendedDirectionMl: "വടക്ക്-പടിഞ്ഞാറ് (വായുകോൺ) / പടിഞ്ഞാറ്",
    cornerName: "വായുകോൺ",
    energyNote: "വായു തത്ത്വം മാലിന്യങ്ങളെയും ദുർഗന്ധത്തെയും എളുപ്പം നിർവീര്യമാക്കുന്നു.",
    vasthuRules: [
      "ക്ലോസറ്റ് (Commode) വടക്കോട്ടോ തെക്കോട്ടോ നോക്കി ഇരിക്കുന്ന രീതിയിൽ സ്ഥാപിക്കുക; കിഴക്കോട്ടോ പടിഞ്ഞാറോട്ടോ അഭിമുഖമാക്കരുത്.",
      "ടോയ്‌ലറ്റ് ഈശാനകോണിലും (വടക്കുകിഴക്ക്), കന്നിമൂലയിലും (തെക്കുപടിഞ്ഞാറ്) ഒരിക്കലും നിർമ്മിക്കരുത്.",
      "ടോയ്‌ലറ്റിന്റെ തറനിരപ്പ് ബെഡ്‌റൂമിനേക്കാൾ ഒരല്പം താഴ്ന്നിരിക്കണം."
    ]
  },

  // ===================== STAIRCASE =====================
  {
    id: "stair-1",
    roomType: "Internal Staircase",
    roomTypeMl: "കോണിപ്പടി (സ്റ്റെയർകേസ്)",
    roomCategory: "staircase",
    lengthFt: 14,
    lengthIn: 0,
    widthFt: 7,
    widthIn: 0,
    dimensionLabel: "14' 0\" × 7' 0\"",
    dimensionCm: "427 cm × 213 cm",
    kolViral: "5 കോൽ 22 വിരൽ × 2 കോൽ 23 വിരൽ",
    areaSqFt: 98,
    areaSqM: 9.1,
    innerChuttuCm: 1280,
    innerChuttuKolViral: "17 കോൽ 19 വിരൽ",
    yoni: 7,
    yoniName: "ഗജം (7 - വടക്ക്)",
    phalam: "ഉത്തമം",
    effectMl: "സുഗമമായ കയറ്റിറക്കം, കുടുംബത്തിൽ സ്ഥിരതയും ഉയർച്ചയും.",
    effectEn: "Smooth ascent, family stability and progressive upward movement.",
    recommendedDirection: "South / West / South-West",
    recommendedDirectionMl: "തെക്ക് / പടിഞ്ഞാറ് / തെക്ക്-പടിഞ്ഞാറ്",
    cornerName: "യമ / വരുണ / നൈരൃതി പദം",
    energyNote: "കോണിപ്പടിയുടെ ഭാരം തെക്ക് അല്ലെങ്കിൽ പടിഞ്ഞാറ് ദിശയ്ക്ക് കരുത്തു പകരുന്നു.",
    vasthuRules: [
      "പടികൾ എപ്പോഴും ഘടികാരദിശയിൽ (Clockwise / പ്രദക്ഷിണം: കിഴക്കുനിന്ന് തെക്കോട്ട്, തെക്കുനിന്ന് പടിഞ്ഞാറോട്ട്) തിരിയണം.",
      "പടികളുടെ എണ്ണം ഒറ്റസംഖ്യയായിരിക്കണം (15, 17, 19, 21, 23 പടികൾ).",
      "കോണിപ്പടിയുടെ അടിയിൽ പൂജാമുറിയോ, അടുക്കളയോ, കിടക്കയോ വെക്കരുത്."
    ]
  }
];

export interface RoomCategoryFilter {
  id: string;
  nameEn: string;
  nameMl: string;
  iconName: string;
}

export const ROOM_CATEGORIES: RoomCategoryFilter[] = [
  { id: "ALL", nameEn: "All Rooms", nameMl: "എല്ലാ മുറികളും", iconName: "LayoutGrid" },
  { id: "hall", nameEn: "Living / Hall", nameMl: "ലിവിങ് / ഹാൾ", iconName: "Sofa" },
  { id: "master_bedroom", nameEn: "Master Bedroom", nameMl: "മാസ്റ്റർ ബെഡ്‌റൂം", iconName: "BedDouble" },
  { id: "bedroom", nameEn: "Bedrooms", nameMl: "കിടപ്പുമുറികൾ", iconName: "Bed" },
  { id: "kitchen", nameEn: "Kitchen", nameMl: "അടുക്കള", iconName: "Flame" },
  { id: "pooja", nameEn: "Pooja Room", nameMl: "പൂജാമുറി", iconName: "Sparkles" },
  { id: "dining", nameEn: "Dining Hall", nameMl: "ഊണുമുറി", iconName: "Utensils" },
  { id: "study", nameEn: "Study / Office", nameMl: "പഠനമുറി / ഓഫീസ്", iconName: "BookOpen" },
  { id: "sitout", nameEn: "Sitout / Verandah", nameMl: "സിറ്റൗട്ട് / പൂമുഖം", iconName: "Home" },
  { id: "store_workarea", nameEn: "Work Area / Store", nameMl: "വർക്ക് ഏരിയ / കലവറ", iconName: "Package" },
  { id: "toilet", nameEn: "Toilet / Bath", nameMl: "ശുചിമുറി / ബാത്ത്റൂം", iconName: "Bath" },
  { id: "staircase", nameEn: "Staircase", nameMl: "കോണിപ്പടി", iconName: "Layers" }
];
