import { useState, useEffect, useCallback } from 'react';

// Design configuration interfaces
export interface ColorConfig {
  light: string;
  dark: string;
}

export interface DesignConfig {
  colors: Record<string, ColorConfig>;
  fonts: Record<string, string>;
  metadata: {
    name: string;
    description: string;
    createdAt: string;
    version: string;
  };
}

export interface DesignConfigHook {
  config: DesignConfig | null;
  isLoading: boolean;
  error: string | null;
  updateColor: (variable: string, value: string, mode: 'light' | 'dark') => void;
  updateFont: (variable: string, value: string) => void;
  saveConfig: (config: DesignConfig) => Promise<void>;
  loadConfig: (config: DesignConfig) => void;
  resetToDefaults: () => void;
  exportConfig: () => void;
  importConfig: (file: File) => Promise<void>;
}

// Default design configuration
const DEFAULT_CONFIG: DesignConfig = {
  colors: {
    '--primary': {
      light: 'oklch(0.5563 0.1055 174.3329)',
      dark: 'oklch(0.5563 0.1055 174.3329)'
    },
    '--primary-foreground': {
      light: 'oklch(1.0000 0 0)',
      dark: 'oklch(1.0000 0 0)'
    },
    '--background': {
      light: 'oklch(1.0000 0 0)',
      dark: 'oklch(0.1448 0 0)'
    },
    '--foreground': {
      light: 'oklch(0.1448 0 0)',
      dark: 'oklch(0.9851 0 0)'
    },
    '--card': {
      light: 'oklch(0.9900 0.0030 174.3329)',
      dark: 'oklch(0.2103 0.0059 285.8852)'
    },
    '--muted': {
      light: 'oklch(0.9800 0.0035 174.3329)',
      dark: 'oklch(0.2739 0.0055 286.0326)'
    },
    '--muted-foreground': {
      light: 'oklch(0.5544 0.0407 257.4166)',
      dark: 'oklch(0.7118 0.0129 286.0665)'
    },
    '--destructive': {
      light: 'oklch(0.6368 0.2078 25.3313)',
      dark: 'oklch(0.3958 0.1331 25.7230)'
    },
    '--destructive-foreground': {
      light: 'oklch(1.0000 0 0)',
      dark: 'oklch(0.9851 0 0)'
    },
    '--border': {
      light: 'oklch(0.9288 0.0126 255.5078)',
      dark: 'oklch(0.2739 0.0055 286.0326)'
    },
    '--ring': {
      light: 'oklch(0.6665 0.2081 16.4383)',
      dark: 'oklch(0.6665 0.2081 16.4383)'
    }
  },
  fonts: {
    '--font-sans': 'Inter',
    '--font-serif': 'serif',
    '--font-mono': 'monospace'
  },
  metadata: {
    name: 'Default Configuration',
    description: 'Default design configuration',
    createdAt: new Date().toISOString(),
    version: '1.0.0'
  }
};

// Storage key for design configurations
const STORAGE_KEY = 'design-configurations';
const CURRENT_CONFIG_KEY = 'current-design-config';

/**
 * Hook for managing design configurations
 */
export function useDesignConfig(): DesignConfigHook {
  const [config, setConfig] = useState<DesignConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load configuration from localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(CURRENT_CONFIG_KEY);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        applyConfigToDOM(parsedConfig);
      } else {
        setConfig(DEFAULT_CONFIG);
        applyConfigToDOM(DEFAULT_CONFIG);
      }
    } catch (err) {
      setError('Failed to load design configuration');
      setConfig(DEFAULT_CONFIG);
      applyConfigToDOM(DEFAULT_CONFIG);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply configuration to DOM
  const applyConfigToDOM = useCallback((config: DesignConfig) => {
    const root = document.documentElement;
    
    // Apply color variables
    Object.entries(config.colors).forEach(([variable, values]) => {
      const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      root.style.setProperty(variable, values[currentTheme]);
    });
    
    // Apply font variables
    Object.entries(config.fonts).forEach(([variable, value]) => {
      root.style.setProperty(variable, value);
    });
  }, []);

  // Update color configuration
  const updateColor = useCallback((variable: string, value: string, mode: 'light' | 'dark') => {
    setConfig(prev => {
      if (!prev) return prev;
      
      const newConfig = {
        ...prev,
        colors: {
          ...prev.colors,
          [variable]: {
            ...prev.colors[variable],
            [mode]: value
          }
        }
      };
      
      // Apply to DOM immediately
      const root = document.documentElement;
      const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      if (currentTheme === mode) {
        root.style.setProperty(variable, value);
      }
      
      // Save to localStorage
      localStorage.setItem(CURRENT_CONFIG_KEY, JSON.stringify(newConfig));
      
      return newConfig;
    });
  }, []);

  // Update font configuration
  const updateFont = useCallback((variable: string, value: string) => {
    setConfig(prev => {
      if (!prev) return prev;
      
      const newConfig = {
        ...prev,
        fonts: {
          ...prev.fonts,
          [variable]: value
        }
      };
      
      // Apply to DOM immediately
      const root = document.documentElement;
      root.style.setProperty(variable, value);
      
      // Save to localStorage
      localStorage.setItem(CURRENT_CONFIG_KEY, JSON.stringify(newConfig));
      
      return newConfig;
    });
  }, []);

  // Save configuration
  const saveConfig = useCallback(async (configToSave: DesignConfig) => {
    try {
      setIsLoading(true);
      
      // Save to localStorage
      localStorage.setItem(CURRENT_CONFIG_KEY, JSON.stringify(configToSave));
      
      // Save to saved configurations list
      const savedConfigs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      savedConfigs.push(configToSave);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedConfigs));
      
      setConfig(configToSave);
      applyConfigToDOM(configToSave);
      
      setError(null);
    } catch (err) {
      setError('Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
  }, [applyConfigToDOM]);

  // Load configuration
  const loadConfig = useCallback((configToLoad: DesignConfig) => {
    setConfig(configToLoad);
    applyConfigToDOM(configToLoad);
    localStorage.setItem(CURRENT_CONFIG_KEY, JSON.stringify(configToLoad));
  }, [applyConfigToDOM]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    applyConfigToDOM(DEFAULT_CONFIG);
    localStorage.setItem(CURRENT_CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
  }, [applyConfigToDOM]);

  // Export configuration
  const exportConfig = useCallback(() => {
    if (!config) return;
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `design-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config]);

  // Import configuration
  const importConfig = useCallback(async (file: File) => {
    try {
      setIsLoading(true);
      
      const text = await file.text();
      const importedConfig = JSON.parse(text);
      
      // Validate configuration structure
      if (!importedConfig.colors || !importedConfig.fonts) {
        throw new Error('Invalid configuration format');
      }
      
      setConfig(importedConfig);
      applyConfigToDOM(importedConfig);
      localStorage.setItem(CURRENT_CONFIG_KEY, JSON.stringify(importedConfig));
      
      setError(null);
    } catch (err) {
      setError('Failed to import configuration');
    } finally {
      setIsLoading(false);
    }
  }, [applyConfigToDOM]);

  return {
    config,
    isLoading,
    error,
    updateColor,
    updateFont,
    saveConfig,
    loadConfig,
    resetToDefaults,
    exportConfig,
    importConfig
  };
}

/**
 * Hook for getting saved configurations
 */
export function useSavedConfigurations() {
  const [savedConfigs, setSavedConfigs] = useState<DesignConfig[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSavedConfigs(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load saved configurations:', err);
    }
  }, []);

  const addSavedConfig = useCallback((config: DesignConfig) => {
    const newConfigs = [...savedConfigs, config];
    setSavedConfigs(newConfigs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfigs));
  }, [savedConfigs]);

  const removeSavedConfig = useCallback((index: number) => {
    const newConfigs = savedConfigs.filter((_, i) => i !== index);
    setSavedConfigs(newConfigs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfigs));
  }, [savedConfigs]);

  return {
    savedConfigs,
    addSavedConfig,
    removeSavedConfig
  };
}

/**
 * Utility function to generate CSS from configuration
 */
export function generateCSSFromConfig(config: DesignConfig): string {
  let css = ':root {\n';
  
  // Add color variables
  Object.entries(config.colors).forEach(([variable, values]) => {
    css += `  ${variable}: ${values.light};\n`;
  });
  
  // Add font variables
  Object.entries(config.fonts).forEach(([variable, value]) => {
    css += `  ${variable}: ${value};\n`;
  });
  
  css += '}\n\n.dark {\n';
  
  // Add dark mode color variables
  Object.entries(config.colors).forEach(([variable, values]) => {
    css += `  ${variable}: ${values.dark};\n`;
  });
  
  css += '}\n';
  
  return css;
}

/**
 * Utility function to apply configuration to DOM
 */
export function applyConfigToDOM(config: DesignConfig) {
  const root = document.documentElement;
  
  // Apply color variables
  Object.entries(config.colors).forEach(([variable, values]) => {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    root.style.setProperty(variable, values[currentTheme]);
  });
  
  // Apply font variables
  Object.entries(config.fonts).forEach(([variable, value]) => {
    root.style.setProperty(variable, value);
  });
}
