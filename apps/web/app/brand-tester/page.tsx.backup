'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Download, Upload, Save, RotateCcw, Palette, Type, Eye, Code } from 'lucide-react';
import { useToast, ToastContainer } from '@/components/ui/toast';
import { colorAuditor, ColorIssue, AuditResult } from '@/lib/utils/color-audit';

// Color configuration interface
interface ColorConfig {
  name: string;
  variable: string;
  lightValue: string;
  darkValue: string;
  description: string;
  category: 'primary' | 'background' | 'text' | 'semantic' | 'border' | 'chart' | 'button' | 'form' | 'navigation' | 'feedback' | 'interactive';
}

// Font configuration interface
interface FontConfig {
  name: string;
  variable: string;
  currentValue: string;
  options: string[];
  description: string;
  category: 'brand' | 'system' | 'google';
  googleFontUrl?: string;
}

// Design configuration interface
interface DesignConfig {
  colors: Record<string, { light: string; dark: string }>;
  fonts: Record<string, string>;
  metadata: {
    name: string;
    description: string;
    createdAt: string;
    version: string;
  };
}

// Color definitions
const COLOR_DEFINITIONS: ColorConfig[] = [
  // Primary Colors
  {
    name: 'Primary',
    variable: '--primary',
    lightValue: 'oklch(0.5563 0.1055 174.3329)',
    darkValue: 'oklch(0.5563 0.1055 174.3329)',
    description: 'Main brand color - used for buttons, links, and accents',
    category: 'primary'
  },
  {
    name: 'Primary Foreground',
    variable: '--primary-foreground',
    lightValue: 'oklch(1.0000 0 0)',
    darkValue: 'oklch(1.0000 0 0)',
    description: 'Text color on primary backgrounds',
    category: 'primary'
  },
  
  // Background Colors
  {
    name: 'Background',
    variable: '--background',
    lightValue: 'oklch(1.0000 0 0)',
    darkValue: 'oklch(0.1448 0 0)',
    description: 'Main page background color',
    category: 'background'
  },
  {
    name: 'Card',
    variable: '--card',
    lightValue: 'oklch(0.9900 0.0030 174.3329)',
    darkValue: 'oklch(0.2103 0.0059 285.8852)',
    description: 'Card and component backgrounds',
    category: 'background'
  },
  {
    name: 'Card Foreground',
    variable: '--card-foreground',
    lightValue: 'oklch(0.1448 0 0)',
    darkValue: 'oklch(0.9851 0 0)',
    description: 'Text color on card backgrounds',
    category: 'background'
  },
  {
    name: 'Muted',
    variable: '--muted',
    lightValue: 'oklch(0.9800 0.0035 174.3329)',
    darkValue: 'oklch(0.2739 0.0055 286.0326)',
    description: 'Muted backgrounds for inputs and secondary areas',
    category: 'background'
  },
  {
    name: 'Accent',
    variable: '--accent',
    lightValue: 'oklch(0.9750 0.0050 174.3329)',
    darkValue: 'oklch(0.2739 0.0055 286.0326)',
    description: 'Accent backgrounds for hover states',
    category: 'background'
  },
  {
    name: 'Accent Foreground',
    variable: '--accent-foreground',
    lightValue: 'oklch(0.1448 0 0)',
    darkValue: 'oklch(0.9851 0 0)',
    description: 'Text color on accent backgrounds',
    category: 'background'
  },
  
  // Text Colors
  {
    name: 'Foreground',
    variable: '--foreground',
    lightValue: 'oklch(0.1448 0 0)',
    darkValue: 'oklch(0.9851 0 0)',
    description: 'Primary text color',
    category: 'text'
  },
  {
    name: 'Muted Foreground',
    variable: '--muted-foreground',
    lightValue: 'oklch(0.5544 0.0407 257.4166)',
    darkValue: 'oklch(0.7118 0.0129 286.0665)',
    description: 'Secondary text color',
    category: 'text'
  },
  
  // Button Colors
  {
    name: 'Secondary',
    variable: '--secondary',
    lightValue: 'oklch(0.9750 0.0050 174.3329)',
    darkValue: 'oklch(0.2739 0.0055 286.0326)',
    description: 'Secondary button background color',
    category: 'button'
  },
  {
    name: 'Secondary Foreground',
    variable: '--secondary-foreground',
    lightValue: 'oklch(0.1448 0 0)',
    darkValue: 'oklch(0.9851 0 0)',
    description: 'Text color on secondary buttons',
    category: 'button'
  },
  
  // Semantic Colors
  {
    name: 'Destructive',
    variable: '--destructive',
    lightValue: 'oklch(0.6368 0.2078 25.3313)',
    darkValue: 'oklch(0.3958 0.1331 25.7230)',
    description: 'Error and destructive action colors',
    category: 'semantic'
  },
  {
    name: 'Destructive Foreground',
    variable: '--destructive-foreground',
    lightValue: 'oklch(1.0000 0 0)',
    darkValue: 'oklch(0.9851 0 0)',
    description: 'Text color on destructive backgrounds',
    category: 'semantic'
  },
  
  // Form Colors
  {
    name: 'Input',
    variable: '--input',
    lightValue: 'oklch(0.9288 0.0126 255.5078)',
    darkValue: 'oklch(0.2739 0.0055 286.0326)',
    description: 'Input field border color',
    category: 'form'
  },
  
  // Border Colors
  {
    name: 'Border',
    variable: '--border',
    lightValue: 'oklch(0.9288 0.0126 255.5078)',
    darkValue: 'oklch(0.2739 0.0055 286.0326)',
    description: 'Border and divider colors',
    category: 'border'
  },
  {
    name: 'Ring',
    variable: '--ring',
    lightValue: 'oklch(0.6665 0.2081 16.4383)',
    darkValue: 'oklch(0.6665 0.2081 16.4383)',
    description: 'Focus ring color',
    category: 'border'
  },
  
  // Popover Colors
  {
    name: 'Popover',
    variable: '--popover',
    lightValue: 'oklch(0.9850 0.0040 174.3329)',
    darkValue: 'oklch(0.2739 0.0055 286.0326)',
    description: 'Popover and dropdown backgrounds',
    category: 'navigation'
  },
  {
    name: 'Popover Foreground',
    variable: '--popover-foreground',
    lightValue: 'oklch(0.1448 0 0)',
    darkValue: 'oklch(0.9851 0 0)',
    description: 'Text color in popovers',
    category: 'navigation'
  }
];

// Popular Google Fonts for easy selection
const GOOGLE_FONTS = [
  { name: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
  { name: 'Roboto', url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap' },
  { name: 'Open Sans', url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap' },
  { name: 'Lato', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap' },
  { name: 'Montserrat', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap' },
  { name: 'Poppins', url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap' },
  { name: 'Source Sans Pro', url: 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap' },
  { name: 'Nunito', url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap' },
  { name: 'Playfair Display', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap' },
  { name: 'Merriweather', url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap' }
];

// Font definitions with brand font detection
const FONT_DEFINITIONS: FontConfig[] = [
  {
    name: 'Bloc W01 Regular',
    variable: '--font-bloc',
    currentValue: 'Bloc W01 Regular',
    options: ['Bloc W01 Regular', 'serif'],
    description: 'Brand font - used for headings and brand elements',
    category: 'brand'
  },
  {
    name: 'Sans Serif',
    variable: '--font-sans',
    currentValue: 'Inter',
    options: ['Inter', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro', 'Nunito'],
    description: 'Main sans-serif font family',
    category: 'google'
  },
  {
    name: 'Heading',
    variable: '--font-heading',
    currentValue: 'Inter',
    options: ['Inter', 'Montserrat', 'Poppins', 'Playfair Display', 'Merriweather'],
    description: 'Font for headings and titles',
    category: 'google'
  },
  {
    name: 'Monospace',
    variable: '--font-mono',
    currentValue: 'monospace',
    options: ['monospace', 'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Consolas', 'Courier New'],
    description: 'Monospace font for code',
    category: 'system'
  }
];

// Utility functions for color conversion
const oklchToHex = (oklch: string): string => {
  try {
    // Extract OKLCH values from string like "oklch(0.5 0.1 200)"
    const match = oklch.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/);
    if (!match) return '#000000';
    
    const [, l, c, h] = match;
    const lightness = parseFloat(l);
    const chroma = parseFloat(c);
    const hue = parseFloat(h);
    
    // Convert OKLCH to RGB (simplified conversion)
    // This is a basic approximation - for production use, consider a proper color library
    const lrgb = lightness;
    const crgb = chroma * Math.cos(hue * Math.PI / 180);
    const brgb = chroma * Math.sin(hue * Math.PI / 180);
    
    const r = Math.round(Math.max(0, Math.min(255, (lrgb + crgb) * 255)));
    const g = Math.round(Math.max(0, Math.min(255, (lrgb - crgb/2 - brgb/2) * 255)));
    const b = Math.round(Math.max(0, Math.min(255, (lrgb - crgb/2 + brgb/2) * 255)));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch {
    return '#000000';
  }
};

const hexToOklch = (hex: string): string => {
  try {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex to RGB
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // Convert RGB to OKLCH (simplified conversion)
    // This is a basic approximation - for production use, consider a proper color library
    const lightness = (r + g + b) / 3;
    const chroma = Math.sqrt((r - lightness) ** 2 + (g - lightness) ** 2 + (b - lightness) ** 2);
    const hue = Math.atan2(b - g, r - lightness) * 180 / Math.PI;
    
    return `oklch(${lightness.toFixed(4)} ${chroma.toFixed(4)} ${hue.toFixed(1)})`;
  } catch {
    return 'oklch(0.5 0.1 200)';
  }
};

export default function BrandTester() {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [colorConfigs, setColorConfigs] = useState<Record<string, { light: string; dark: string }>>({});
  const [fontConfigs, setFontConfigs] = useState<Record<string, string>>({});
  const [savedConfigs, setSavedConfigs] = useState<DesignConfig[]>([]);
  const [activeTab, setActiveTab] = useState('colors');
  const [previewMode, setPreviewMode] = useState<'live' | 'isolated'>('live');
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<ColorIssue | null>(null);
  const [fixResult, setFixResult] = useState<{ fixed: number; failed: number; details: string[] } | null>(null);
  const { toasts, showSuccess, showError, showInfo, removeToast } = useToast();

  // Initialize configurations
  useEffect(() => {
    const initialColors: Record<string, { light: string; dark: string }> = {};
    const initialFonts: Record<string, string> = {};

    COLOR_DEFINITIONS.forEach(color => {
      initialColors[color.variable] = {
        light: color.lightValue,
        dark: color.darkValue
      };
    });

    FONT_DEFINITIONS.forEach(font => {
      initialFonts[font.variable] = font.currentValue;
    });

    setColorConfigs(initialColors);
    setFontConfigs(initialFonts);
  }, []);

  // Apply color changes to CSS variables
  const applyColorChanges = useCallback(() => {
    const root = document.documentElement;
    
    Object.entries(colorConfigs).forEach(([variable, values]) => {
      if (currentTheme === 'light') {
        root.style.setProperty(variable, values.light);
      } else {
        root.style.setProperty(variable, values.dark);
      }
    });
  }, [colorConfigs, currentTheme]);

  // Apply font changes to CSS variables
  const applyFontChanges = useCallback(() => {
    const root = document.documentElement;
    
    Object.entries(fontConfigs).forEach(([variable, value]) => {
      root.style.setProperty(variable, value);
    });
  }, [fontConfigs]);

  // Apply changes when configurations change
  useEffect(() => {
    applyColorChanges();
    applyFontChanges();
  }, [applyColorChanges, applyFontChanges]);

  // Update color configuration
  const updateColor = (variable: string, value: string, mode: 'light' | 'dark') => {
    setColorConfigs(prev => ({
      ...prev,
      [variable]: {
        ...prev[variable],
        [mode]: value
      }
    }));
  };

  // Load Google Font
  const loadGoogleFont = (fontName: string) => {
    const googleFont = GOOGLE_FONTS.find(font => font.name === fontName);
    if (!googleFont) return;

    // Check if font is already loaded
    const existingLink = document.querySelector(`link[href*="${fontName}"]`);
    if (existingLink) return;

    // Create link element
    const link = document.createElement('link');
    link.href = googleFont.url;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  };

  // Update font configuration
  const updateFont = (variable: string, value: string) => {
    setFontConfigs(prev => ({
      ...prev,
      [variable]: value
    }));

    // Load Google Font if it's a Google Font
    const font = FONT_DEFINITIONS.find(f => f.variable === variable);
    if (font?.category === 'google' && GOOGLE_FONTS.some(gf => gf.name === value)) {
      loadGoogleFont(value);
    }
  };

  // Save current configuration
  const saveConfiguration = () => {
    const config: DesignConfig = {
      colors: colorConfigs,
      fonts: fontConfigs,
      metadata: {
        name: `Design Config ${savedConfigs.length + 1}`,
        description: 'Custom design configuration',
        createdAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    setSavedConfigs(prev => [...prev, config]);
    showSuccess('Configuration Saved', 'Your design configuration has been saved successfully.');
  };

  // Load configuration
  const loadConfiguration = (config: DesignConfig) => {
    setColorConfigs(config.colors);
    setFontConfigs(config.fonts);
    showSuccess('Configuration Loaded', 'Design configuration has been loaded successfully.');
  };

  // Reset to defaults
  const resetToDefaults = () => {
    const defaultColors: Record<string, { light: string; dark: string }> = {};
    const defaultFonts: Record<string, string> = {};

    COLOR_DEFINITIONS.forEach(color => {
      defaultColors[color.variable] = {
        light: color.lightValue,
        dark: color.darkValue
      };
    });

    FONT_DEFINITIONS.forEach(font => {
      defaultFonts[font.variable] = font.currentValue;
    });

    setColorConfigs(defaultColors);
    setFontConfigs(defaultFonts);
    
    showInfo('Reset to Defaults', 'All configurations have been reset to default values.');
  };

  // Export configuration
  const exportConfiguration = () => {
    const config: DesignConfig = {
      colors: colorConfigs,
      fonts: fontConfigs,
      metadata: {
        name: 'Exported Design Config',
        description: 'Exported design configuration',
        createdAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design-config.json';
    a.click();
    URL.revokeObjectURL(url);

    showSuccess('Configuration Exported', 'Design configuration has been exported successfully.');
  };

  // Import configuration
  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config: DesignConfig = JSON.parse(e.target?.result as string);
        loadConfiguration(config);
      } catch (error) {
        showError('Import Error', 'Failed to import configuration. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  // Generate CSS output
  const generateCSS = () => {
    let css = ':root {\n';
    
    // Add color variables
    Object.entries(colorConfigs).forEach(([variable, values]) => {
      css += `  ${variable}: ${values.light};\n`;
    });
    
    // Add font variables (excluding custom fonts)
    Object.entries(fontConfigs).forEach(([variable, value]) => {
      if (value && !variable.includes('-custom')) {
        css += `  ${variable}: ${value};\n`;
      }
    });
    
    css += '}\n\n.dark {\n';
    
    Object.entries(colorConfigs).forEach(([variable, values]) => {
      css += `  ${variable}: ${values.dark};\n`;
    });
    
    css += '}\n\n';
    
    // Add custom font styles
    Object.entries(fontConfigs).forEach(([variable, value]) => {
      if (value && variable.includes('-custom')) {
        const baseVariable = variable.replace('-custom', '');
        css += `${baseVariable} {\n  font-family: ${value};\n}\n\n`;
      }
    });
    
    return css;
  };

  // Copy CSS to clipboard
  const copyCSSToClipboard = () => {
    const css = generateCSS();
    navigator.clipboard.writeText(css);
    showSuccess('CSS Copied', 'CSS variables have been copied to clipboard.');
  };

  // Run color audit
  const runColorAudit = async () => {
    setIsScanning(true);
    try {
      const filePaths = await colorAuditor.getFilePaths();
      const result = await colorAuditor.scanFiles(filePaths);
      setAuditResult(result);
      
      if (result.issuesFound === 0) {
        showSuccess('Audit Complete', 'No color issues found! Your codebase is theme-compliant.');
      } else {
        showInfo('Audit Complete', `Found ${result.issuesFound} color issues across ${result.filesWithIssues.length} files.`);
      }
    } catch (error) {
      showError('Audit Failed', 'Failed to run color audit. Please try again.');
      console.error('Audit error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  // Clear audit results
  const clearAuditResults = () => {
    setAuditResult(null);
    setSelectedIssue(null);
    setFixResult(null);
  };

  // Auto-fix detected issues
  const autoFixIssues = async () => {
    if (!auditResult || auditResult.issues.length === 0) {
      showError('No Issues', 'No issues found to fix.');
      return;
    }

    setIsFixing(true);
    try {
      const result = await colorAuditor.autoFixIssues(auditResult.issues);
      setFixResult(result);
      
      if (result.fixed > 0) {
        showSuccess('Auto-Fix Complete', `Successfully fixed ${result.fixed} issues. ${result.failed} failed.`);
      } else {
        showInfo('No Fixes Applied', 'No automatic fixes were available for the detected issues.');
      }
    } catch (error) {
      showError('Auto-Fix Failed', 'Failed to apply automatic fixes. Please try again.');
      console.error('Auto-fix error:', error);
    } finally {
      setIsFixing(false);
    }
  };

  // Rescan after fixes
  const rescanAfterFix = async () => {
    if (fixResult && fixResult.fixed > 0) {
      await runColorAudit();
      setFixResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Brand Design Tester</h1>
          <p className="text-muted-foreground">
            Real-time color and font modification with live preview and save functionality
          </p>
        </div>

        {/* Theme Toggle and Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Design Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="theme-toggle">Theme:</Label>
                  <Switch
                    id="theme-toggle"
                    checked={currentTheme === 'dark'}
                    onCheckedChange={(checked) => setCurrentTheme(checked ? 'dark' : 'light')}
                  />
                  <span className="text-sm text-muted-foreground">
                    {currentTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="preview-mode">Preview:</Label>
                  <Select value={previewMode} onValueChange={(value: 'live' | 'isolated') => setPreviewMode(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="isolated">Isolated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={saveConfiguration} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={resetToDefaults} variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={exportConfiguration} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="import-config">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </label>
                </Button>
                <input
                  id="import-config"
                  type="file"
                  accept=".json"
                  onChange={importConfiguration}
                  className="hidden"
                />
              </div>
            </div>

            {/* Saved Configurations */}
            {savedConfigs.length > 0 && (
              <div className="mb-4">
                <Label className="text-sm font-medium">Saved Configurations:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {savedConfigs.map((config, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => loadConfiguration(config)}
                    >
                      {config.metadata.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Design Controls */}
          <div className="lg:col-span-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="colors" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Colors
                </TabsTrigger>
                <TabsTrigger value="components" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Components
                </TabsTrigger>
                <TabsTrigger value="audit" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Audit
                </TabsTrigger>
                <TabsTrigger value="fonts" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Fonts
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Advanced
                </TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Color Configuration</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Click on any color block to edit. Colors automatically sync between light and dark modes.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Simplified Color Blocks */}
                    {['primary', 'background', 'text', 'button', 'semantic', 'form', 'border', 'navigation'].map(category => (
                      <div key={category} className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground capitalize">{category} Colors</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {COLOR_DEFINITIONS.filter(color => color.category === category).map((color) => (
                            <div 
                              key={color.variable} 
                              className="group cursor-pointer"
                              onClick={() => {
                                // Open color picker for this color
                                const colorInput = document.createElement('input');
                                colorInput.type = 'color';
                                colorInput.value = oklchToHex(
                                  currentTheme === 'light' 
                                    ? colorConfigs[color.variable]?.light || color.lightValue
                                    : colorConfigs[color.variable]?.dark || color.darkValue
                                );
                                colorInput.onchange = (e) => {
                                  const hexColor = (e.target as HTMLInputElement).value;
                                  const oklchColor = hexToOklch(hexColor);
                                  updateColor(color.variable, oklchColor, currentTheme);
                                };
                                colorInput.click();
                              }}
                            >
                              <div className="space-y-2">
                                {/* Color Block */}
                                <div 
                                  className="w-full h-16 rounded-lg border-2 border-border group-hover:border-primary transition-colors shadow-sm"
                                  style={{ 
                                    backgroundColor: currentTheme === 'light' 
                                      ? colorConfigs[color.variable]?.light || color.lightValue
                                      : colorConfigs[color.variable]?.dark || color.darkValue
                                  }}
                                />
                                
                                {/* Color Info */}
                                <div className="space-y-1">
                                  <div className="text-sm font-medium text-foreground">{color.name}</div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {currentTheme === 'light' 
                                      ? colorConfigs[color.variable]?.light || color.lightValue
                                      : colorConfigs[color.variable]?.dark || color.darkValue
                                    }
                                  </div>
                                </div>
                                
                                {/* Click Hint */}
                                <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                  Click to edit
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {/* Quick Actions */}
                    <div className="pt-4 border-t border-border">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Sync all colors between light and dark modes
                            Object.keys(colorConfigs).forEach(variable => {
                              const lightValue = colorConfigs[variable]?.light;
                              if (lightValue) {
                                updateColor(variable, lightValue, 'dark');
                              }
                            });
                            showInfo('Colors Synced', 'All colors have been synced between light and dark modes.');
                          }}
                        >
                          Sync Light → Dark
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Reset all colors to defaults
                            const defaultColors: Record<string, { light: string; dark: string }> = {};
                            COLOR_DEFINITIONS.forEach(color => {
                              defaultColors[color.variable] = {
                                light: color.lightValue,
                                dark: color.darkValue
                              };
                            });
                            setColorConfigs(defaultColors);
                            showInfo('Colors Reset', 'All colors have been reset to default values.');
                          }}
                        >
                          Reset to Defaults
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="components" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Shadcn Component Colors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Button Variants */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Button Variants</h4>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Button>Primary</Button>
                          <Button variant="secondary">Secondary</Button>
                          <Button variant="destructive">Destructive</Button>
                          <Button variant="outline">Outline</Button>
                          <Button variant="ghost">Ghost</Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Modify --primary, --secondary, --destructive colors to change button appearances
                        </p>
                      </div>
                    </div>

                    {/* Form Elements */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Form Elements</h4>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Input placeholder="Input field" />
                          <textarea 
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                            placeholder="Textarea"
                            rows={3}
                          />
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded border-border" />
                            <Label>Checkbox</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="radio" name="radio" className="border-border" />
                            <Label>Radio Button</Label>
                          </div>
                          <div className="space-y-2">
                            <Label>Slider</Label>
                            <Slider value={[50]} onValueChange={() => {}} max={100} step={1} />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch />
                            <Label>Switch</Label>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Modify --input, --border, --ring colors for form styling
                        </p>
                      </div>
                    </div>

                    {/* Navigation Elements */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Navigation Elements</h4>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge>Default</Badge>
                          <Badge variant="secondary">Secondary</Badge>
                          <Badge variant="destructive">Destructive</Badge>
                          <Badge variant="outline">Outline</Badge>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">Nav Item</Button>
                          <Button variant="ghost" size="sm">Active</Button>
                          <Button variant="ghost" size="sm">Nav Item</Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Modify --popover, --popover-foreground for dropdowns and menus
                        </p>
                      </div>
                    </div>

                    {/* Interactive States */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Interactive States</h4>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Button className="hover:bg-primary/90">Hover State</Button>
                          <Button className="active:bg-primary/80">Active State</Button>
                          <Button className="focus:ring-2 focus:ring-ring">Focus State</Button>
                          <Button disabled>Disabled State</Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Modify --accent, --ring colors for hover and focus states
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audit" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Color Audit Scanner</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Scan your codebase for hardcoded colors and theme compliance issues
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Audit Controls */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button 
                          onClick={runColorAudit} 
                          disabled={isScanning}
                          className="flex-1"
                        >
                          {isScanning ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Scanning...
                            </>
                          ) : (
                            <>
                              <Code className="h-4 w-4 mr-2" />
                              Run Color Audit
                            </>
                          )}
                        </Button>
                        {auditResult && (
                          <Button variant="outline" onClick={clearAuditResults}>
                            Clear Results
                          </Button>
                        )}
                      </div>
                      
                      {/* Auto-Fix Controls */}
                      {auditResult && auditResult.issuesFound > 0 && (
                        <div className="flex gap-2">
                          <Button 
                            onClick={autoFixIssues} 
                            disabled={isFixing}
                            variant="secondary"
                            className="flex-1"
                          >
                            {isFixing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Fixing Issues...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Auto-Fix Issues ({auditResult.issuesFound})
                              </>
                            )}
                          </Button>
                          {fixResult && fixResult.fixed > 0 && (
                            <Button 
                              onClick={rescanAfterFix}
                              variant="outline"
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Rescan
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Audit Results */}
                    {auditResult && (
                      <div className="space-y-4">
                        {/* Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 border border-border rounded-lg">
                            <div className="text-2xl font-bold text-foreground">{auditResult.totalFiles}</div>
                            <div className="text-xs text-muted-foreground">Files Scanned</div>
                          </div>
                          <div className="text-center p-3 border border-border rounded-lg">
                            <div className="text-2xl font-bold text-destructive">{auditResult.issuesFound}</div>
                            <div className="text-xs text-muted-foreground">Issues Found</div>
                          </div>
                          <div className="text-center p-3 border border-border rounded-lg">
                            <div className="text-2xl font-bold text-primary">{auditResult.filesWithIssues.length}</div>
                            <div className="text-xs text-muted-foreground">Files with Issues</div>
                          </div>
                          <div className="text-center p-3 border border-border rounded-lg">
                            <div className="text-2xl font-bold text-muted-foreground">{auditResult.scanTime}ms</div>
                            <div className="text-xs text-muted-foreground">Scan Time</div>
                          </div>
                        </div>

                        {/* Issues by Type */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Issues by Type</h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(auditResult.issuesByType).map(([type, count]) => (
                              <Badge key={type} variant="outline" className="text-xs">
                                {type}: {count}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Issues List */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Issues Found</h4>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {auditResult.issues.map((issue, index) => (
                              <div 
                                key={index}
                                className="p-3 border border-border rounded-lg cursor-pointer hover:bg-accent"
                                onClick={() => setSelectedIssue(issue)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge 
                                        variant={issue.severity === 'error' ? 'destructive' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {issue.severity}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {issue.type}
                                      </Badge>
                                    </div>
                                    <p className="text-sm font-medium">{issue.message}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {issue.file}:{issue.line}:{issue.column}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Suggestion: {issue.suggestion}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fix Results */}
                    {fixResult && (
                      <div className="space-y-4">
                        <div className="p-4 border border-border rounded-lg bg-card">
                          <h4 className="text-sm font-semibold mb-3">Auto-Fix Results</h4>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center p-3 border border-border rounded-lg">
                              <div className="text-2xl font-bold text-primary">{fixResult.fixed}</div>
                              <div className="text-xs text-muted-foreground">Issues Fixed</div>
                            </div>
                            <div className="text-center p-3 border border-border rounded-lg">
                              <div className="text-2xl font-bold text-destructive">{fixResult.failed}</div>
                              <div className="text-xs text-muted-foreground">Issues Failed</div>
                            </div>
                          </div>

                          {fixResult.details.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium mb-2">Fix Details</h5>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {fixResult.details.map((detail, index) => (
                                  <div key={index} className="text-xs text-muted-foreground p-2 bg-muted rounded">
                                    {detail}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* No Results State */}
                    {!auditResult && !isScanning && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Click "Run Color Audit" to scan your codebase for color issues</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Issue Details Modal */}
                {selectedIssue && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Issue Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">File</Label>
                          <p className="text-sm text-muted-foreground">{selectedIssue.file}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Location</Label>
                          <p className="text-sm text-muted-foreground">
                            Line {selectedIssue.line}, Column {selectedIssue.column}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Type</Label>
                          <Badge variant="outline">{selectedIssue.type}</Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Severity</Label>
                          <Badge 
                            variant={selectedIssue.severity === 'error' ? 'destructive' : 'secondary'}
                          >
                            {selectedIssue.severity}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Issue</Label>
                        <p className="text-sm text-muted-foreground">{selectedIssue.message}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Original Code</Label>
                        <div className="bg-muted p-2 rounded text-sm font-mono">
                          {selectedIssue.originalText}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Suggested Fix</Label>
                        <div className="bg-muted p-2 rounded text-sm font-mono">
                          {selectedIssue.suggestedText}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(selectedIssue.suggestedText)}
                        >
                          Copy Suggestion
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedIssue(null)}
                        >
                          Close
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="fonts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Font Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                      Configure your brand fonts with live preview. Google Fonts are automatically loaded.
                    </p>
                    
                    {/* Brand Font Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <h4 className="text-sm font-semibold text-foreground">Brand Font</h4>
                      </div>
                      {FONT_DEFINITIONS.filter(font => font.category === 'brand').map((font) => (
                        <div key={font.variable} className="space-y-3 p-4 border border-primary/20 rounded-lg bg-primary/5">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">{font.name}</Label>
                            <p className="text-xs text-muted-foreground">{font.description}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Select
                              value={fontConfigs[font.variable] || font.currentValue}
                              onValueChange={(value) => updateFont(font.variable, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select font" />
                              </SelectTrigger>
                              <SelectContent>
                                {font.options.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {/* Custom font input */}
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Custom Font Family</Label>
                              <Input
                                placeholder="Enter custom font family (e.g., 'Custom Font, serif')"
                                value={fontConfigs[`${font.variable}-custom`] || ''}
                                onChange={(e) => updateFont(`${font.variable}-custom`, e.target.value)}
                                className="text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Google Fonts Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="text-sm font-semibold text-foreground">Google Fonts</h4>
                      </div>
                      {FONT_DEFINITIONS.filter(font => font.category === 'google').map((font) => (
                        <div key={font.variable} className="space-y-3 p-4 border border-border rounded-lg">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">{font.name}</Label>
                            <p className="text-xs text-muted-foreground">{font.description}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Select
                              value={fontConfigs[font.variable] || font.currentValue}
                              onValueChange={(value) => updateFont(font.variable, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select Google Font" />
                              </SelectTrigger>
                              <SelectContent>
                                {font.options.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    <div className="flex items-center gap-2">
                                      <span>{option}</span>
                                      {GOOGLE_FONTS.some(gf => gf.name === option) && (
                                        <span className="text-xs text-blue-500">Google</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {/* Custom font input */}
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Custom Font Family</Label>
                              <Input
                                placeholder="Enter custom font family (e.g., 'Custom Font, sans-serif')"
                                value={fontConfigs[`${font.variable}-custom`] || ''}
                                onChange={(e) => updateFont(`${font.variable}-custom`, e.target.value)}
                                className="text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* System Fonts Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        <h4 className="text-sm font-semibold text-foreground">System Fonts</h4>
                      </div>
                      {FONT_DEFINITIONS.filter(font => font.category === 'system').map((font) => (
                        <div key={font.variable} className="space-y-3 p-4 border border-border rounded-lg">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">{font.name}</Label>
                            <p className="text-xs text-muted-foreground">{font.description}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Select
                              value={fontConfigs[font.variable] || font.currentValue}
                              onValueChange={(value) => updateFont(font.variable, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select font" />
                              </SelectTrigger>
                              <SelectContent>
                                {font.options.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {/* Custom font input */}
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Custom Font Family</Label>
                              <Input
                                placeholder="Enter custom font family (e.g., 'Custom Font, monospace')"
                                value={fontConfigs[`${font.variable}-custom`] || ''}
                                onChange={(e) => updateFont(`${font.variable}-custom`, e.target.value)}
                                className="text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Custom Color Examples */}
                    <div className="mt-6 p-4 border border-border rounded-lg bg-card">
                      <h4 className="text-sm font-semibold mb-3">Custom Color Examples</h4>
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          Use the color pickers next to each color input to select custom colors visually.
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <strong>Text Colors:</strong>
                            <ul className="list-disc list-inside ml-2 mt-1">
                              <li>Primary text: --foreground</li>
                              <li>Secondary text: --muted-foreground</li>
                              <li>Primary brand text: --primary</li>
                              <li>Error text: --destructive</li>
                            </ul>
                          </div>
                          <div>
                            <strong>Background Colors:</strong>
                            <ul className="list-disc list-inside ml-2 mt-1">
                              <li>Page background: --background</li>
                              <li>Card background: --card</li>
                              <li>Muted background: --muted</li>
                              <li>Primary background: --primary</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Font Preview */}
                    <div className="mt-6 p-4 border border-border rounded-lg bg-card">
                      <h4 className="text-sm font-semibold mb-3">Live Font Preview</h4>
                      <p className="text-xs text-muted-foreground mb-4">
                        See how your fonts look in different contexts
                      </p>
                      
                      <div className="space-y-4">
                        {/* Brand Font Preview */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Brand Font Preview</Label>
                          <div 
                            className="text-3xl font-bold text-primary"
                            style={{ 
                              fontFamily: fontConfigs['--font-bloc-custom'] || 
                              fontConfigs['--font-bloc'] || 
                              'Bloc W01 Regular, serif' 
                            }}
                          >
                            Preset Brand
                          </div>
                          <div 
                            className="text-lg"
                            style={{ 
                              fontFamily: fontConfigs['--font-bloc-custom'] || 
                              fontConfigs['--font-bloc'] || 
                              'Bloc W01 Regular, serif' 
                            }}
                          >
                            The quick brown fox jumps over the lazy dog
                          </div>
                        </div>
                        
                        {/* Heading Preview */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Heading Preview</Label>
                          <div 
                            className="text-2xl font-bold"
                            style={{ 
                              fontFamily: fontConfigs['--font-heading-custom'] || 
                              fontConfigs['--font-heading'] || 
                              'Inter, sans-serif' 
                            }}
                          >
                            Main Heading
                          </div>
                          <div 
                            className="text-lg font-semibold"
                            style={{ 
                              fontFamily: fontConfigs['--font-heading-custom'] || 
                              fontConfigs['--font-heading'] || 
                              'Inter, sans-serif' 
                            }}
                          >
                            Subheading Text
                          </div>
                        </div>
                        
                        {/* Body Text Preview */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Body Text Preview</Label>
                          <div 
                            className="text-base leading-relaxed"
                            style={{ 
                              fontFamily: fontConfigs['--font-sans-custom'] || 
                              fontConfigs['--font-sans'] || 
                              'Inter, sans-serif' 
                            }}
                          >
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                          </div>
                        </div>
                        
                        {/* Code Preview */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Code Preview</Label>
                          <div 
                            className="text-sm font-mono bg-muted p-3 rounded border"
                            style={{ 
                              fontFamily: fontConfigs['--font-mono-custom'] || 
                              fontConfigs['--font-mono'] || 
                              'monospace' 
                            }}
                          >
                            <div>const greeting = &quot;Hello, World!&quot;;</div>
                            <div>function updateFont(variable: string) {'{'}</div>
                            <div>  return fontConfigs[variable];</div>
                            <div>{'}'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Advanced Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* CSS Output */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Generated CSS</Label>
                        <Button variant="outline" size="sm" onClick={copyCSSToClipboard}>
                          Copy CSS
                        </Button>
                      </div>
                      <div className="bg-muted p-3 rounded-md">
                        <pre className="text-xs overflow-x-auto">
                          <code>{generateCSS()}</code>
                        </pre>
                      </div>
                    </div>

                    {/* Configuration Management */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Configuration Management</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={exportConfiguration}>
                            <Download className="h-4 w-4 mr-2" />
                            Export Config
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => document.getElementById('import-config')?.click()}>
                            <Upload className="h-4 w-4 mr-2" />
                            Import Config
                          </Button>
                          <input
                            id="import-config"
                            type="file"
                            accept=".json"
                            onChange={importConfiguration}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Saved Configurations */}
                    {savedConfigs.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Saved Configurations</Label>
                        <div className="space-y-2">
                          {savedConfigs.map((config, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border border-border rounded">
                              <div>
                                <p className="text-sm font-medium">{config.metadata.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(config.metadata.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => loadConfiguration(config)}>
                                Load
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reset Options */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Reset Options</Label>
                      <Button variant="destructive" size="sm" onClick={resetToDefaults}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset to Defaults
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Color Swatches */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Color Swatches</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div 
                          className="w-16 h-16 rounded-lg border-2 border-border mx-auto mb-2"
                          style={{ backgroundColor: `var(--primary)` }}
                        />
                        <p className="text-sm font-medium">Primary</p>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-16 h-16 rounded-lg border-2 border-border mx-auto mb-2"
                          style={{ backgroundColor: `var(--background)` }}
                        />
                        <p className="text-sm font-medium">Background</p>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-16 h-16 rounded-lg border-2 border-border mx-auto mb-2"
                          style={{ backgroundColor: `var(--card)` }}
                        />
                        <p className="text-sm font-medium">Card</p>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-16 h-16 rounded-lg border-2 border-border mx-auto mb-2"
                          style={{ backgroundColor: `var(--destructive)` }}
                        />
                        <p className="text-sm font-medium">Destructive</p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Elements */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Interactive Elements</h3>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Button>Primary Button</Button>
                        <Button variant="secondary">Secondary Button</Button>
                        <Button variant="destructive">Destructive Button</Button>
                        <Button variant="outline">Outline Button</Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge>Default Badge</Badge>
                        <Badge variant="secondary">Secondary Badge</Badge>
                        <Badge variant="destructive">Destructive Badge</Badge>
                        <Badge variant="outline">Outline Badge</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <Input placeholder="Enter text..." />
                        <Input placeholder="Enter email..." type="email" />
                      </div>
                    </div>
                  </div>

                  {/* Typography */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Typography</h3>
                    <div className="space-y-2">
                      <h1 className="text-4xl font-bold">Heading 1</h1>
                      <h2 className="text-3xl font-bold">Heading 2</h2>
                      <h3 className="text-2xl font-bold">Heading 3</h3>
                      <h4 className="text-xl font-bold">Heading 4</h4>
                      <p className="text-base">Body text with regular weight</p>
                      <p className="text-sm text-muted-foreground">Small muted text</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
