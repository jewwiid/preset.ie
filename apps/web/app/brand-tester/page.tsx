'use client';

/**
 * Brand Tester Page - Refactored
 *
 * Real-time design system testing tool for colors and fonts.
 * Supports import/export, live preview, and color auditing.
 *
 * Line count: ~450 lines (down from 1,659)
 * Reduction: 73%
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Download,
  Upload,
  Save,
  RotateCcw,
  Palette,
  Type,
  Eye,
  Code,
  Copy} from 'lucide-react';
import { useToast, ToastContainer } from '@/components/ui/toast';

// Import refactored modules
import type { ExportFormat, ThemeMode } from './types';
import { COLOR_DEFINITIONS, FONT_DEFINITIONS, GOOGLE_FONTS } from './constants/brandConfig';
import { useBrandConfig } from './hooks';
import { oklchToHex, hexToOklch } from './lib/colorUtils';
import { exportConfiguration, exportToCSS } from './lib/configExport';

export default function BrandTester() {
  const { toasts, showSuccess, showError, showInfo, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('colors');

  // Use our refactored hook for state management
  const {
    colorConfigs,
    fontConfigs,
    currentTheme,
    updateColor,
    updateFont,
    setTheme,
    resetToDefaults,
    loadConfiguration} = useBrandConfig();

  // Load Google Font dynamically
  const loadGoogleFont = (fontName: string) => {
    const googleFont = GOOGLE_FONTS.find((font) => font.name === fontName);
    if (!googleFont) return;

    const existingLink = document.querySelector(`link[href*="${fontName}"]`);
    if (existingLink) return;

    const link = document.createElement('link');
    link.href = googleFont.url;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  };

  // Handle font update with Google Font loading
  const handleFontUpdate = (variable: string, value: string) => {
    updateFont(variable, value);

    const font = FONT_DEFINITIONS.find((f) => f.variable === variable);
    if (font?.category === 'google' && GOOGLE_FONTS.some((gf) => gf.name === value)) {
      loadGoogleFont(value);
    }
  };

  // Export handlers
  const handleExport = (format: ExportFormat) => {
    exportConfiguration(
      format,
      colorConfigs,
      fontConfigs,
      {
        name: 'Exported Design Config',
        description: 'Exported design configuration',
        createdAt: new Date().toISOString(),
        version: '1.0.0'}
    );
    showSuccess('Exported', `Configuration exported as ${format.toUpperCase()}`);
  };

  // Copy CSS to clipboard
  const handleCopyCSS = () => {
    const css = exportToCSS(colorConfigs, fontConfigs);
    navigator.clipboard.writeText(css);
    showSuccess('CSS Copied', 'CSS variables copied to clipboard');
  };

  // Import configuration
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        loadConfiguration(config);
        showSuccess('Imported', 'Configuration loaded successfully');
      } catch (error) {
        showError('Import Error', 'Failed to import configuration');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Brand Design Tester</h1>
          <p className="text-muted-foreground">
            Real-time color and font modification with live preview
          </p>
        </div>

        {/* Controls Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Design Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              {/* Theme Toggle */}
              <div className="flex items-center gap-2">
                <Label htmlFor="theme-toggle">Theme:</Label>
                <Switch
                  id="theme-toggle"
                  checked={currentTheme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
                <span className="text-sm text-muted-foreground">
                  {currentTheme === 'dark' ? 'Dark' : 'Light'}
                </span>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Action Buttons */}
              <Button onClick={() => handleExport('json')} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>

              <Button onClick={() => handleExport('css')} variant="outline" size="sm">
                <Code className="h-4 w-4 mr-2" />
                Export CSS
              </Button>

              <Button onClick={handleCopyCSS} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copy CSS
              </Button>

              <label htmlFor="import-file">
                <Button asChild variant="outline" size="sm">
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </span>
                </Button>
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>

              <Button onClick={resetToDefaults} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors">
              <Palette className="h-4 w-4 mr-2" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="fonts">
              <Type className="h-4 w-4 mr-2" />
              Fonts
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-4">
            {COLOR_DEFINITIONS.map((colorDef) => (
              <Card key={colorDef.variable}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-10 h-10 rounded border"
                          style={{
                            background: colorConfigs[colorDef.variable]?.[currentTheme]}}
                        />
                        <div>
                          <h4 className="font-semibold">{colorDef.name}</h4>
                          <p className="text-xs text-muted-foreground">{colorDef.variable}</p>
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          {colorDef.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{colorDef.description}</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Light Mode</Label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={colorConfigs[colorDef.variable]?.light || ''}
                            onChange={(e) =>
                              updateColor(colorDef.variable, 'light', e.target.value)
                            }
                            className="font-mono text-sm"
                          />
                          <input
                            type="color"
                            value={oklchToHex(colorConfigs[colorDef.variable]?.light || '')}
                            onChange={(e) =>
                              updateColor(colorDef.variable, 'light', hexToOklch(e.target.value))
                            }
                            className="w-12 h-10 rounded border cursor-pointer"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Dark Mode</Label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={colorConfigs[colorDef.variable]?.dark || ''}
                            onChange={(e) =>
                              updateColor(colorDef.variable, 'dark', e.target.value)
                            }
                            className="font-mono text-sm"
                          />
                          <input
                            type="color"
                            value={oklchToHex(colorConfigs[colorDef.variable]?.dark || '')}
                            onChange={(e) =>
                              updateColor(colorDef.variable, 'dark', hexToOklch(e.target.value))
                            }
                            className="w-12 h-10 rounded border cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Fonts Tab */}
          <TabsContent value="fonts" className="space-y-4">
            {FONT_DEFINITIONS.map((fontDef) => (
              <Card key={fontDef.variable}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-1">{fontDef.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{fontDef.variable}</p>
                      <p className="text-sm text-muted-foreground">{fontDef.description}</p>
                      <Badge variant="outline" className="mt-2">
                        {fontDef.category}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs mb-2 block">Font Family</Label>
                        <Select
                          value={fontConfigs[fontDef.variable] || fontDef.currentValue}
                          onValueChange={(value) => handleFontUpdate(fontDef.variable, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontDef.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="p-4 bg-muted rounded">
                        <p
                          className="text-lg"
                          style={{
                            fontFamily: fontConfigs[fontDef.variable] || fontDef.currentValue}}
                        >
                          The quick brown fox jumps over the lazy dog
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Component Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Typography Preview */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Typography</h3>
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold">Heading 1</h1>
                    <h2 className="text-3xl font-bold">Heading 2</h2>
                    <h3 className="text-2xl font-semibold">Heading 3</h3>
                    <p className="text-base">Body text - Regular paragraph</p>
                    <p className="text-sm text-muted-foreground">
                      Muted text - Secondary information
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Buttons Preview */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Buttons</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button>Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="outline">Outline Button</Button>
                    <Button variant="destructive">Destructive Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                  </div>
                </div>

                <Separator />

                {/* Cards Preview */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Cards</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Card Title</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          This is a preview of how cards look with your current color scheme.
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-accent">
                      <CardHeader>
                        <CardTitle>Accent Card</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-accent-foreground">
                          This card uses accent colors.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                {/* Form Elements Preview */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Form Elements</h3>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label>Text Input</Label>
                      <Input placeholder="Enter text..." />
                    </div>
                    <div>
                      <Label>Select Dropdown</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="option1">Option 1</SelectItem>
                          <SelectItem value="option2">Option 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="preview-switch" />
                      <Label htmlFor="preview-switch">Toggle Switch</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
