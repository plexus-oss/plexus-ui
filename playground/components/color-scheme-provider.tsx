"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const colorSchemes = {
  green: "#44FF07",
  blue: "#3700FF",
  violet: "#FB13F3",
  cyan: "#00D4FF",
  orange: "#FF6B35",
  yellow: "#bdf92e",
} as const;

export type ColorSchemeName = keyof typeof colorSchemes;

interface ColorSchemeContextValue {
  colorScheme: ColorSchemeName;
  setColorScheme: (scheme: ColorSchemeName) => void;
  color: string;
}

const ColorSchemeContext = createContext<ColorSchemeContextValue | undefined>(undefined);

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>("green");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("color-scheme") as ColorSchemeName;
    if (saved && colorSchemes[saved]) {
      setColorScheme(saved);
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem("color-scheme", colorScheme);
  }, [colorScheme]);

  const color = colorSchemes[colorScheme];

  return (
    <ColorSchemeContext.Provider value={{ colorScheme, setColorScheme, color }}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorScheme() {
  const context = useContext(ColorSchemeContext);
  if (!context) {
    throw new Error("useColorScheme must be used within ColorSchemeProvider");
  }
  return context;
}

/**
 * Get multiple colors for multi-series charts
 * Returns an array of colors starting from the current color scheme
 * and cycling through the rest of the palette
 */
export function useMultiColors(count: number = 3): string[] {
  const { colorScheme } = useColorScheme();
  const colorKeys = Object.keys(colorSchemes) as ColorSchemeName[];

  // Find the index of the current color scheme
  const startIndex = colorKeys.indexOf(colorScheme);

  // Create an array starting from current color and cycling through others
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const colorKey = colorKeys[(startIndex + i) % colorKeys.length];
    colors.push(colorSchemes[colorKey]);
  }

  return colors;
}
