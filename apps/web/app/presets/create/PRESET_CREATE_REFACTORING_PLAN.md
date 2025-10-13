# Preset Create Page Refactoring Plan

## Current State
- **File**: `app/presets/create/page.tsx`
- **Line Count**: 1,498 lines
- **State Complexity**: 11 useState/useEffect calls
- **Status**: 🟡 HIGH PRIORITY - Needs refactoring
- **Impact**: High (core creator feature + marketplace integration)

## Problems Identified
1. **Complex Form Management**: Multiple form sections with interdependent fields
2. **Dual Mode**: Creation + Marketplace listing in one component
3. **Validation Logic**: Scattered throughout component
4. **Preview System**: Complex preview rendering inline
5. **AI Integration**: Prompt enhancement logic mixed in
6. **Image Upload**: Multiple upload contexts (preset images, examples)
7. **State Synchronization**: Form data, preview data, marketplace data

## Proposed Structure

```
app/presets/create/
├── page.tsx (main orchestrator, ~200 lines)
│
├── types.ts (~80 lines)
│   - PresetData interface
│   - FormSection types
│   - ValidationRules
│   - MarketplaceData
│
├── hooks/
│   ├── usePresetForm.ts (~180 lines)
│   │   - Form state management
│   │   - Field updates
│   │   - Form validation
│   │
│   ├── usePresetValidation.ts (~150 lines)
│   │   - Validation rules
│   │   - Error handling
│   │   - Real-time validation
│   │
│   ├── usePresetSave.ts (~120 lines)
│   │   - Save preset to database
│   │   - Draft management
│   │   - Auto-save functionality
│   │
│   ├── usePresetPreview.ts (~100 lines)
│   │   - Generate preview
│   │   - Preview state
│   │   - Test generation
│   │
│   ├── usePromptEnhancement.ts (~130 lines)
│   │   - AI prompt enhancement
│   │   - Template parsing
│   │   - Dynamic field substitution
│   │
│   ├── useMarketplaceSetup.ts (~100 lines)
│   │   - Marketplace-specific fields
│   │   - Pricing logic
│   │   - Publishing rules
│   │
│   └── useImageUpload.ts (~80 lines)
│       - Handle image uploads
│       - Thumbnail generation
│       - Preview images
│
├── components/
│   ├── PresetFormWizard.tsx (~150 lines)
│   │   - Multi-step wizard wrapper
│   │   - Progress indicator
│   │   - Navigation controls
│   │
│   ├── BasicInfoStep.tsx (~200 lines)
│   │   - Name, description, category
│   │   - Tags and metadata
│   │   - Visibility settings
│   │
│   ├── PromptEditorStep.tsx (~250 lines)
│   │   - Prompt template editor
│   │   - Dynamic fields
│   │   - Variable placeholders
│   │   - AI enhancement button
│   │
│   ├── StyleSettingsStep.tsx (~200 lines)
│   │   - Style selection
│   │   - Resolution/aspect ratio
│   │   - Intensity controls
│   │   - Consistency level
│   │
│   ├── TechnicalSettingsStep.tsx (~150 lines)
│   │   - Model version
│   │   - Generation mode
│   │   - Advanced settings
│   │   - Seedream config
│   │
│   ├── MarketplaceStep.tsx (~180 lines)
│   │   - Marketplace toggle
│   │   - Pricing input
│   │   - Marketing description
│   │   - Preview images
│   │
│   ├── PreviewPanel.tsx (~200 lines)
│   │   - Live preview
│   │   - Test generation
│   │   - Results display
│   │
│   ├── PromptVariableSelector.tsx (~100 lines)
│   │   - Variable picker
│   │   - Insert helpers
│   │   - Documentation
│   │
│   ├── CategorySelector.tsx (~80 lines)
│   │   - Category grid
│   │   - Icon display
│   │   - Description tooltips
│   │
│   ├── TagInput.tsx (~80 lines)
│   │   - Tag input field
│   │   - Suggestions
│   │   - Tag chips
│   │
│   └── ValidationErrors.tsx (~60 lines)
│       - Error display
│       - Field highlighting
│       - Error summary
│
├── lib/
│   ├── presetValidation.ts (~120 lines)
│   │   - Validation schemas
│   │   - Validation functions
│   │   - Error messages
│   │
│   ├── presetHelpers.ts (~100 lines)
│   │   - Data transformations
│   │   - Default values
│   │   - Format conversions
│   │
│   ├── promptParser.ts (~100 lines)
│   │   - Parse prompt templates
│   │   - Extract variables
│   │   - Substitute values
│   │
│   └── marketplaceHelpers.ts (~80 lines)
│       - Pricing calculations
│       - Publication checks
│       - Marketplace formatting
│
└── constants/
    ├── presetCategories.ts (~60 lines)
    │   - Category definitions
    │   - Icons and labels
    │
    ├── styleOptions.ts (~80 lines)
    │   - Style presets
    │   - Resolution options
    │   - Aspect ratios
    │
    └── promptTemplates.ts (~100 lines)
        - Template examples
        - Variable documentation
        - Default templates
```

## Files to Create

### Phase 1: Extract Types and Constants

#### 1. `presets/create/types.ts`
**Lines**: ~80
**Exports**: TypeScript interfaces
```typescript
- PresetData
- StyleSettings
- TechnicalSettings
- AIMetadata
- MarketplaceData
- FormValidationErrors
```

#### 2. `presets/create/constants/presetCategories.ts`
**Lines**: ~60
**Exports**: Category definitions

#### 3. `presets/create/constants/styleOptions.ts`
**Lines**: ~80
**Exports**: Style configuration options

#### 4. `presets/create/constants/promptTemplates.ts`
**Lines**: ~100
**Exports**: Prompt template library

### Phase 2: Extract Business Logic

#### 5. `presets/create/lib/presetValidation.ts`
**Lines**: ~120
**Exports**: Validation utilities
```typescript
{
  validateBasicInfo: (data: BasicInfo) => ValidationResult
  validatePromptTemplate: (template: string) => ValidationResult
  validateStyleSettings: (settings: StyleSettings) => ValidationResult
  validateMarketplaceData: (data: MarketplaceData) => ValidationResult
  validateFullPreset: (preset: PresetData) => ValidationResult
}
```

#### 6. `presets/create/lib/presetHelpers.ts`
**Lines**: ~100
**Exports**: Helper functions
```typescript
{
  getDefaultPresetData: () => PresetData
  formatPresetForSave: (data: PresetData) => DBPreset
  parsePresetFromDB: (db: DBPreset) => PresetData
  generatePresetSlug: (name: string) => string
}
```

#### 7. `presets/create/lib/promptParser.ts`
**Lines**: ~100
**Exports**: Prompt template parsing
```typescript
{
  parseTemplate: (template: string) => ParsedTemplate
  extractVariables: (template: string) => string[]
  substituteVariables: (template: string, values: Record<string, string>) => string
  validateTemplate: (template: string) => { valid: boolean, errors: string[] }
}
```

#### 8. `presets/create/lib/marketplaceHelpers.ts`
**Lines**: ~80
**Exports**: Marketplace utilities
```typescript
{
  calculateMinimumPrice: (tier: Tier) => number
  canPublishToMarketplace: (preset: PresetData, user: User) => boolean
  formatMarketplaceListing: (preset: PresetData) => MarketplaceListing
}
```

### Phase 3: Extract Hooks

#### 9. `presets/create/hooks/usePresetForm.ts`
**Lines**: ~180
**Purpose**: Form state management
**Returns**:
```typescript
{
  formData: PresetData
  updateField: (field: string, value: any) => void
  updateSection: (section: string, data: Partial<any>) => void
  resetForm: () => void
  isDirty: boolean
  currentStep: number
  setCurrentStep: (step: number) => void
}
```

#### 10. `presets/create/hooks/usePresetValidation.ts`
**Lines**: ~150
**Purpose**: Real-time validation
**Returns**:
```typescript
{
  errors: ValidationErrors
  warnings: ValidationWarnings
  validateField: (field: string, value: any) => void
  validateStep: (step: number) => boolean
  isValid: boolean
  canProceed: (step: number) => boolean
}
```

#### 11. `presets/create/hooks/usePresetSave.ts`
**Lines**: ~120
**Purpose**: Save and publish functionality
**Returns**:
```typescript
{
  saving: boolean
  savePreset: () => Promise<string>
  saveDraft: () => Promise<void>
  publishPreset: () => Promise<void>
  autoSaveEnabled: boolean
  lastSaved: Date | null
}
```

#### 12. `presets/create/hooks/usePresetPreview.ts`
**Lines**: ~100
**Purpose**: Preview generation
**Returns**:
```typescript
{
  generating: boolean
  previewImages: string[]
  generatePreview: (preset: PresetData) => Promise<void>
  clearPreview: () => void
}
```

#### 13. `presets/create/hooks/usePromptEnhancement.ts`
**Lines**: ~130
**Purpose**: AI prompt enhancement
**Returns**:
```typescript
{
  enhancing: boolean
  enhancePrompt: (prompt: string) => Promise<string>
  suggestions: string[]
  applyEnhancement: (enhanced: string) => void
}
```

#### 14. `presets/create/hooks/useMarketplaceSetup.ts`
**Lines**: ~100
**Purpose**: Marketplace configuration
**Returns**:
```typescript
{
  isForSale: boolean
  setIsForSale: (value: boolean) => void
  price: number
  setPrice: (value: number) => void
  minimumPrice: number
  marketplaceData: MarketplaceData
  updateMarketplaceData: (data: Partial<MarketplaceData>) => void
  canPublish: boolean
}
```

#### 15. `presets/create/hooks/useImageUpload.ts`
**Lines**: ~80
**Purpose**: Image upload handling
**Returns**:
```typescript
{
  uploading: boolean
  uploadImage: (file: File, type: 'thumbnail' | 'example') => Promise<string>
  removeImage: (url: string) => void
  images: { thumbnails: string[], examples: string[] }
}
```

### Phase 4: Extract UI Components

#### 16. `presets/create/components/PresetFormWizard.tsx`
**Lines**: ~150
**Props**: `{ currentStep, totalSteps, onStepChange, canProceed }`

#### 17. `presets/create/components/BasicInfoStep.tsx`
**Lines**: ~200
**Props**: `{ data, onChange, errors }`

#### 18. `presets/create/components/PromptEditorStep.tsx`
**Lines**: ~250
**Props**: `{ prompt, onChange, onEnhance, variables, errors }`

#### 19. `presets/create/components/StyleSettingsStep.tsx`
**Lines**: ~200
**Props**: `{ settings, onChange, errors }`

#### 20. `presets/create/components/TechnicalSettingsStep.tsx`
**Lines**: ~150
**Props**: `{ settings, onChange, errors }`

#### 21. `presets/create/components/MarketplaceStep.tsx`
**Lines**: ~180
**Props**: `{ data, onChange, canPublish, minimumPrice, errors }`

#### 22. `presets/create/components/PreviewPanel.tsx`
**Lines**: ~200
**Props**: `{ preset, onGenerate, generating, images }`

#### 23. `presets/create/components/PromptVariableSelector.tsx`
**Lines**: ~100
**Props**: `{ onSelect, availableVariables }`

#### 24. `presets/create/components/CategorySelector.tsx`
**Lines**: ~80
**Props**: `{ selected, onSelect, categories }`

#### 25. `presets/create/components/TagInput.tsx`
**Lines**: ~80
**Props**: `{ tags, onChange, suggestions }`

#### 26. `presets/create/components/ValidationErrors.tsx`
**Lines**: ~60
**Props**: `{ errors, warnings }`

### Phase 5: Refactor Main Page

#### 27. `presets/create/page.tsx`
**Lines**: ~200 (from 1,498!)
**Purpose**: Main orchestrator with wizard flow

## Migration Strategy

### Phase 1: Extract Types and Constants (2 hours)
1. ✅ Create `types.ts`
2. ✅ Create category, style, template constants
3. ✅ Verify type definitions

### Phase 2: Extract Business Logic (4 hours)
1. Create validation utilities
2. Create helper functions
3. Create prompt parser
4. Create marketplace helpers
5. Unit test all functions

### Phase 3: Extract Hooks (6-7 hours)
1. Create form management hook
2. Create validation hook
3. Create save/publish hook
4. Create preview hook
5. Create enhancement hook
6. Create marketplace hook
7. Create upload hook
8. Test each hook

### Phase 4: Extract UI Components (8-10 hours)
1. Create wizard wrapper
2. Create step components
3. Create preview panel
4. Create helper components (selectors, inputs)
5. Test components

### Phase 5: Refactor Main Page (2-3 hours)
1. Update page to use hooks and components
2. Remove old code
3. Integration testing

### Phase 6: Testing & Polish (2-3 hours)
1. Full workflow testing
2. Validation testing
3. Save/publish testing
4. Documentation

## Benefits

1. **Form Management**: Clean separation of form logic
2. **Validation**: Centralized, testable validation
3. **Wizard Flow**: Reusable wizard component
4. **Marketplace**: Clear separation of marketplace features
5. **Maintainability**: Each step is independent
6. **Type Safety**: Better TypeScript coverage
7. **Readability**: 200 lines vs 1,498 lines

## Testing Checklist

After refactoring, ensure:
- [ ] All form steps work
- [ ] Field validation works in real-time
- [ ] Step-by-step validation works
- [ ] Can't proceed with invalid data
- [ ] Save draft functionality works
- [ ] Publish preset works
- [ ] Auto-save works
- [ ] Prompt enhancement works
- [ ] Preview generation works
- [ ] Image upload works
- [ ] Marketplace toggle works
- [ ] Pricing validation works
- [ ] Category selection works
- [ ] Tag input works
- [ ] Form persistence works (refresh recovery)
- [ ] Error handling works
- [ ] Responsive design works

## Timeline Estimate

- Phase 1 (Types/Constants): 2 hours
- Phase 2 (Logic): 4 hours
- Phase 3 (Hooks): 6-7 hours
- Phase 4 (Components): 8-10 hours
- Phase 5 (Main): 2-3 hours
- Phase 6 (Testing): 2-3 hours

**Total**: 24-29 hours

## Risk Assessment

**MEDIUM RISK**: Important creator feature, but well-scoped

**Mitigation**:
1. Feature branch
2. Step-by-step migration
3. Extensive form testing
4. Draft save recovery
5. Form state persistence

## Success Metrics

- ✅ 87% file size reduction
- ✅ State hooks from 11 to <7
- ✅ All functionality preserved
- ✅ Form validation improved
- ✅ Test coverage >75%

## Notes

- Maintain existing AI enhancement integration
- Keep marketplace pricing logic intact
- Preserve draft auto-save
- Add form persistence for browser refresh
- Consider extracting wizard for reuse elsewhere
