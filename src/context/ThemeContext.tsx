import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme =
  | "dark"
  | "light"
  | "neoclassical"
  | "baroque"
  | "ethereal"
  | "anthropomorphic"
  | "ai_platform";

export interface ThemeOption {
  id: Theme;
  name: string;
  nameMl: string;
  category: "dark" | "light" | "artistic";
  colorScheme: "dark" | "light";
  primaryColor: string;
  accentColor: string;
  bgPreview: string;
  cardPreview: string;
  borderPreview: string;
  textPreview: string;
  tagline: string;
  description: string;
  iconName: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "dark",
    name: "Twilight Glass Aurora",
    nameMl: "ട്വൈലൈറ്റ് ഗ്ലാസ് അറോറ",
    category: "dark",
    colorScheme: "dark",
    primaryColor: "#e0aaff",
    accentColor: "#f43f5e",
    bgPreview: "#0e021a",
    cardPreview: "#240638",
    borderPreview: "#590d45",
    textPreview: "#fdf4ff",
    tagline: "Celestial Twilight Glass & Aurora Purple",
    description: "Frosted translucent glass panels, glowing starlight, and rich sunset twilight gradient aesthetics.",
    iconName: "Moon"
  },
  {
    id: "ethereal",
    name: "Ethereal Aurora Mist",
    nameMl: "ഇതീറിയൽ അറോറ",
    category: "dark",
    colorScheme: "dark",
    primaryColor: "#60a5fa",
    accentColor: "#a78bfa",
    bgPreview: "#070c1e",
    cardPreview: "#0e1635",
    borderPreview: "#263673",
    textPreview: "#f0f4ff",
    tagline: "Celestial Twilight Mist, Starlight & Aurora Cyan",
    description: "Weightless architectural dreamscape with iridescent sapphire mist, crystal frost, and glowing aurora tones.",
    iconName: "Sparkles"
  },
  {
    id: "light",
    name: "Architectural Clean Light",
    nameMl: "ക്ലീൻ ആർക്കിടെക്ചറൽ ലൈറ്റ്",
    category: "light",
    colorScheme: "light",
    primaryColor: "#2563eb",
    accentColor: "#059669",
    bgPreview: "#f8fafc",
    cardPreview: "#ffffff",
    borderPreview: "#cbd5e1",
    textPreview: "#0f172a",
    tagline: "Crisp White Canvas & Slate Ink",
    description: "Clean, professional daylight aesthetic with crisp contrast and slate borders.",
    iconName: "Sun"
  },
  {
    id: "neoclassical",
    name: "Neoclassical Marble",
    nameMl: "നിയോക്ലാസിക്കൽ മാർബിൾ",
    category: "light",
    colorScheme: "light",
    primaryColor: "#926c2e",
    accentColor: "#b8860b",
    bgPreview: "#f6f4ee",
    cardPreview: "#fdfcf9",
    borderPreview: "#dcd4c3",
    textPreview: "#29241b",
    tagline: "Palladian Travertine, Ivory & Antique Bronze",
    description: "Inspired by classical Greek & Roman orders, parian marble, and noble architectural symmetry.",
    iconName: "Columns"
  },
  {
    id: "baroque",
    name: "Baroque Grandeur",
    nameMl: "ബറോക്ക് റോയൽ",
    category: "dark",
    colorScheme: "dark",
    primaryColor: "#d4af37",
    accentColor: "#e5c053",
    bgPreview: "#160c14",
    cardPreview: "#241421",
    borderPreview: "#4e253e",
    textPreview: "#fbf5ea",
    tagline: "Imperial Velvet Obsidian, Burgundy & Gilded Brass",
    description: "Dramatic chiaroscuro and opulent European palace architecture with gilded trim and jewel-toned elegance.",
    iconName: "Crown"
  },
  {
    id: "anthropomorphic",
    name: "Anthropomorphic Terra",
    nameMl: "ആന്ത്രോപോമോർഫിക് ടെറ",
    category: "dark",
    colorScheme: "dark",
    primaryColor: "#e07a5f",
    accentColor: "#d48b55",
    bgPreview: "#18110d",
    cardPreview: "#241b16",
    borderPreview: "#523c31",
    textPreview: "#fdf6ee",
    tagline: "Human-Scale Terracotta, Earth Clay & Teak Timber",
    description: "Humanistic biophilic architecture inspired by baked terracotta, Kerala clay tiles, warm cedar, and organic earth.",
    iconName: "Trees"
  },
  {
    id: "ai_platform",
    name: "Modern High-Tech AI",
    nameMl: "മോഡേൺ ഹൈ-ടെക് AI",
    category: "dark",
    colorScheme: "dark",
    primaryColor: "#00E5FF",
    accentColor: "#00E5FF",
    bgPreview: "#121212",
    cardPreview: "#1a1a1a",
    borderPreview: "#00E5FF4d",
    textPreview: "#ffffff",
    tagline: "Deep Charcoal #121212 & Glowing Cyan #00E5FF",
    description: "Sleek dark mode theme with a deep charcoal background (#121212), glowing cyan/electric blue accents (#00E5FF), and clean, authoritative typography.",
    iconName: "Cpu"
  }
];

export interface ThemeContextType {
  theme: Theme;
  currentThemeMeta: ThemeOption;
  themesList: ThemeOption[];
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  cycleNextTheme: () => void;
  isSystemTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const VALID_THEMES: Theme[] = ["dark", "light", "neoclassical", "baroque", "ethereal", "anthropomorphic", "ai_platform"];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // 1. Check local storage
    const savedTheme = localStorage.getItem("vasthusilpy_theme") as Theme | null;
    if (savedTheme && VALID_THEMES.includes(savedTheme)) {
      return savedTheme;
    }
    // 2. Fallback to system preference
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  const [isSystemTheme, setIsSystemTheme] = useState<boolean>(() => {
    return !localStorage.getItem("vasthusilpy_theme");
  });

  // Apply theme classes to document root
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all previous theme classes
    VALID_THEMES.forEach((t) => root.classList.remove(t));
    
    // Add current theme class
    root.classList.add(theme);

    // Also maintain .light or .dark helper for standard utility cascades
    if (theme === "light" || theme === "neoclassical") {
      root.classList.add("light");
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    }
  }, [theme]);

  // Listen for system preference changes if user hasn't set an explicit preference
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("vasthusilpy_theme")) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    // Quick toggle between primary dark and light
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  const cycleNextTheme = () => {
    const currentIndex = VALID_THEMES.indexOf(theme);
    const nextIndex = (currentIndex + 1) % VALID_THEMES.length;
    setTheme(VALID_THEMES[nextIndex]);
  };

  const setTheme = (newTheme: Theme) => {
    if (VALID_THEMES.includes(newTheme)) {
      setThemeState(newTheme);
      setIsSystemTheme(false);
      localStorage.setItem("vasthusilpy_theme", newTheme);
    }
  };

  const currentThemeMeta = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        currentThemeMeta,
        themesList: THEME_OPTIONS,
        toggleTheme,
        setTheme,
        cycleNextTheme,
        isSystemTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
