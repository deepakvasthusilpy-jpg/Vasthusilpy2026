import React, { createContext, useContext, useState, useEffect } from "react";

export type ViewMode = "desktop" | "mobile";
export type PhonePreset = "390" | "414" | "430" | "fluid";

export interface PhonePresetInfo {
  id: PhonePreset;
  name: string;
  width: number | string;
  description: string;
}

export const PHONE_PRESETS: PhonePresetInfo[] = [
  { id: "390", name: "iPhone 15/16", width: 390, description: "390 × 844 px" },
  { id: "414", name: "Plus / Max", width: 414, description: "414 × 896 px" },
  { id: "430", name: "Pro Max", width: 430, description: "430 × 932 px" },
  { id: "fluid", name: "Fluid Mobile", width: "100%", description: "Fluid width" }
];

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  isMobileView: boolean;
  isDesktopView: boolean;
  phonePreset: PhonePreset;
  setPhonePreset: (preset: PhonePreset) => void;
  windowWidth: number;
  isSimulatedMobileOnDesktop: boolean;
  isForcedDesktopOnMobile: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

const STORAGE_KEY = "vasthusilpy_view_mode";
const PRESET_STORAGE_KEY = "vasthusilpy_phone_preset";

export const ViewModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ViewMode;
      if (saved === "desktop" || saved === "mobile") {
        return saved;
      }
    } catch {
      // Ignore
    }
    return "desktop";
  });

  const [phonePreset, setPhonePresetState] = useState<PhonePreset>(() => {
    try {
      const saved = localStorage.getItem(PRESET_STORAGE_KEY) as PhonePreset;
      if (saved === "390" || saved === "414" || saved === "430" || saved === "fluid") {
        return saved;
      }
    } catch {
      // Ignore
    }
    return "390";
  });

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore
    }
  };

  const toggleViewMode = () => {
    setViewModeState((prev) => {
      const next = prev === "desktop" ? "mobile" : "desktop";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const setPhonePreset = (preset: PhonePreset) => {
    setPhonePresetState(preset);
    try {
      localStorage.setItem(PRESET_STORAGE_KEY, preset);
    } catch {
      // Ignore
    }
  };

  const isMobileView = viewMode === "mobile";
  const isDesktopView = viewMode === "desktop";
  const isSimulatedMobileOnDesktop = isMobileView && windowWidth >= 768;
  const isForcedDesktopOnMobile = isDesktopView && windowWidth < 768;

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        setViewMode,
        toggleViewMode,
        isMobileView,
        isDesktopView,
        phonePreset,
        setPhonePreset,
        windowWidth,
        isSimulatedMobileOnDesktop,
        isForcedDesktopOnMobile
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = (): ViewModeContextType => {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
};
