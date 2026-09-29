import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "tech_startup";

export interface ThemeOption {
  id: Theme;
  name: string;
  nameMl: string;
  category: "dark";
  colorScheme: "dark";
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
    id: "tech_startup",
    name: "Futuristic Tech Theme",
    nameMl: "ഫ്യൂച്ചറിസ്റ്റിക് ടെക് തീം",
    category: "dark",
    colorScheme: "dark",
    primaryColor: "#00f2fe",
    accentColor: "#4facfe",
    bgPreview: "#030712",
    cardPreview: "#090e17",
    borderPreview: "#00f2fe66",
    textPreview: "#e0f2fe",
    tagline: "Futuristic Cyber Obsidian & Glowing Holographic Cyan",
    description: "Cutting-edge futuristic tech aesthetic featuring sleek obsidian surfaces (#030712), glowing neon cyan rings (#00f2fe), and high-tech visual dynamism.",
    iconName: "Zap"
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

export const VALID_THEMES: Theme[] = ["tech_startup"];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme] = useState<Theme>("tech_startup");
  const isSystemTheme = false;

  // Apply Futuristic Tech Theme classes to document root
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove obsolete legacy theme classes
    root.classList.remove("corporate", "theme-corporate", "dark", "theme-dark", "ai_platform", "theme-ai_platform", "baroque", "theme-baroque", "anthropomorphic", "theme-anthropomorphic", "light", "neoclassical", "ethereal");
    
    // Apply pure Futuristic Tech Theme
    root.classList.add("tech_startup");
    root.classList.add("theme-tech_startup");
    root.classList.add("dark");
    root.style.colorScheme = "dark";
    try {
      localStorage.setItem("vasthusilpy_theme", "tech_startup");
    } catch {}
  }, []);

  const toggleTheme = () => {};
  const cycleNextTheme = () => {};
  const setTheme = () => {};

  const currentThemeMeta = THEME_OPTIONS[0];

  return (
    <ThemeContext.Provider
      value={{
        theme: "tech_startup",
        currentThemeMeta,
        themesList: THEME_OPTIONS,
        toggleTheme,
        setTheme,
        cycleNextTheme,
        isSystemTheme: false
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
