/**
 * Brand Tester Module - useBrandConfig Hook
 *
 * Manages color and font configuration state
 */

import { useState, useEffect, useCallback } from 'react';
import type { ColorState, FontState, ThemeMode, DesignConfig } from '../types';
import { COLOR_DEFINITIONS, FONT_DEFINITIONS } from '../constants/brandConfig';

interface UseBrandConfigReturn {
  // State
  colorConfigs: ColorState;
  fontConfigs: FontState;
  currentTheme: ThemeMode;

  // Actions
  updateColor: (variable: string, mode: ThemeMode, value: string) => void;
  updateFont: (variable: string, value: string) => void;
  setTheme: (theme: ThemeMode) => void;
  resetToDefaults: () => void;
  loadConfiguration: (config: DesignConfig) => void;

  // Apply to DOM
  applyToDom: () => void;
}

export function useBrandConfig(): UseBrandConfigReturn {
  const [colorConfigs, setColorConfigs] = useState<ColorState>({});
  const [fontConfigs, setFontConfigs] = useState<FontState>({});
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('light');

  // Initialize configurations from defaults
  useEffect(() => {
    const initialColors: ColorState = {};
    const initialFonts: FontState = {};

    COLOR_DEFINITIONS.forEach((color) => {
      initialColors[color.variable] = {
        light: color.lightValue,
        dark: color.darkValue,
      };
    });

    FONT_DEFINITIONS.forEach((font) => {
      initialFonts[font.variable] = font.currentValue;
    });

    setColorConfigs(initialColors);
    setFontConfigs(initialFonts);
  }, []);

  // Update a color value
  const updateColor = useCallback(
    (variable: string, mode: ThemeMode, value: string) => {
      setColorConfigs((prev) => ({
        ...prev,
        [variable]: {
          ...prev[variable],
          [mode]: value,
        },
      }));
    },
    []
  );

  // Update a font value
  const updateFont = useCallback((variable: string, value: string) => {
    setFontConfigs((prev) => ({
      ...prev,
      [variable]: value,
    }));
  }, []);

  // Set theme mode
  const setTheme = useCallback((theme: ThemeMode) => {
    setCurrentTheme(theme);
  }, []);

  // Reset to default values
  const resetToDefaults = useCallback(() => {
    const initialColors: ColorState = {};
    const initialFonts: FontState = {};

    COLOR_DEFINITIONS.forEach((color) => {
      initialColors[color.variable] = {
        light: color.lightValue,
        dark: color.darkValue,
      };
    });

    FONT_DEFINITIONS.forEach((font) => {
      initialFonts[font.variable] = font.currentValue;
    });

    setColorConfigs(initialColors);
    setFontConfigs(initialFonts);
  }, []);

  // Load configuration from imported data
  const loadConfiguration = useCallback((config: DesignConfig) => {
    if (config.colors) {
      setColorConfigs(config.colors);
    }
    if (config.fonts) {
      setFontConfigs(config.fonts);
    }
  }, []);

  // Apply configuration to DOM
  const applyToDom = useCallback(() => {
    const root = document.documentElement;

    // Apply colors based on current theme
    Object.entries(colorConfigs).forEach(([variable, values]) => {
      root.style.setProperty(variable, values[currentTheme]);
    });

    // Apply fonts
    Object.entries(fontConfigs).forEach(([variable, value]) => {
      root.style.setProperty(variable, value);
    });
  }, [colorConfigs, fontConfigs, currentTheme]);

  // Auto-apply to DOM when config changes
  useEffect(() => {
    applyToDom();
  }, [applyToDom]);

  return {
    colorConfigs,
    fontConfigs,
    currentTheme,
    updateColor,
    updateFont,
    setTheme,
    resetToDefaults,
    loadConfiguration,
    applyToDom,
  };
}
