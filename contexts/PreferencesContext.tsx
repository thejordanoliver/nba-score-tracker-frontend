import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ViewMode = "list" | "grid" | "stacked";

type PreferencesContextType = {
  viewMode: ViewMode;
  toggleViewMode: () => void;
  setViewMode: (mode: ViewMode) => void;
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const VIEW_MODE_KEY = "@view_mode_preference";

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewMode, setViewModeState] = useState<ViewMode>("list");

  // Load persisted viewMode on mount
  useEffect(() => {
    const loadViewMode = async () => {
      try {
        const stored = await AsyncStorage.getItem(VIEW_MODE_KEY);
        if (stored === "list" || stored === "grid" || stored === "stacked") {
          setViewModeState(stored);
        }
      } catch (e) {
        console.warn("Failed to load view mode from storage:", e);
      }
    };
    loadViewMode();
  }, []);

  const persistViewMode = async (mode: ViewMode) => {
    try {
      await AsyncStorage.setItem(VIEW_MODE_KEY, mode);
    } catch (e) {
      console.warn("Failed to save view mode:", e);
    }
  };

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    persistViewMode(mode);
  };

  // Cycle through all 3 modes
  const toggleViewMode = () => {
    const next =
      viewMode === "list"
        ? "grid"
        : viewMode === "grid"
        ? "stacked"
        : "list";
    setViewMode(next);
  };

  return (
    <PreferencesContext.Provider value={{ viewMode, toggleViewMode, setViewMode }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = (): PreferencesContextType => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
};
