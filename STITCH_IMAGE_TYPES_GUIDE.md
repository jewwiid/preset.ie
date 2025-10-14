# Stitch Image Types - Comprehensive Guide

## Overview
This guide covers all available image types for the Stitch functionality, organized by persona and use case. Each type is designed to serve specific professional needs and creative workflows.

## Categories & Personas

### 🎨 Fashion & Apparel Designers
**Primary Use Cases:** Clothing design, outfit planning, fashion visualization, personal styling

| Type | Description | Use Cases | Examples |
|------|-------------|-----------|----------|
| `model` | Human models for trying on clothes, testing outfits, or showcasing products | Fashion designers, clothing brands, personal styling, outfit visualization | Professional models, diverse body types, different poses, various demographics |
| `garment` | Clothing items, accessories, shoes, bags, jewelry | Fashion design, outfit planning, style testing, product visualization | Dresses, shirts, pants, shoes, bags, jewelry, accessories |
| `fabric` | Textile patterns, materials, textures for clothing | Fabric selection, pattern testing, material visualization | Cotton, silk, denim, leather, patterns, textures, colors |
| `outfit` | Complete outfit combinations, styled looks | Outfit planning, style inspiration, fashion coordination | Complete ensembles, coordinated looks, seasonal outfits |

### 🏭 Product Designers
**Primary Use Cases:** Product design, branding, marketing materials, e-commerce

| Type | Description | Use Cases | Examples |
|------|-------------|-----------|----------|
| `product` | Physical products, gadgets, tools, consumer goods | Product design, marketing, e-commerce, brand visualization | Electronics, furniture, tools, household items, gadgets |
| `logo` | Brand logos, text, graphics, watermarks | Brand placement, logo testing, marketing materials, brand integration | Company logos, text overlays, graphic elements, brand marks |
| `packaging` | Product packaging, boxes, labels, containers | Packaging design, product presentation, retail visualization | Boxes, labels, bags, containers, product packaging |
| `brand_element` | Brand colors, patterns, visual identity elements | Brand consistency, visual identity, marketing materials | Brand colors, patterns, textures, visual elements |

### 🚗 Automotive Enthusiasts
**Primary Use Cases:** Vehicle customization, automotive marketing, transportation design

| Type | Description | Use Cases | Examples |
|------|-------------|-----------|----------|
| `vehicle` | Cars, motorcycles, trucks, boats, aircraft | Automotive customization, vehicle marketing, transportation design | Cars, motorcycles, trucks, boats, planes, bicycles |
| `rims_wheels` | Car rims, wheels, tires, automotive accessories | Vehicle customization, automotive styling, wheel selection | Alloy rims, steel wheels, custom wheels, tire combinations |
| `paint_color` | Vehicle paint colors, finishes, wraps | Vehicle customization, color selection, automotive styling | Metallic paints, matte finishes, custom colors, vinyl wraps |
| `interior` | Car interiors, seats, dashboards, automotive interiors | Interior customization, automotive design, comfort visualization | Leather seats, dashboard designs, interior colors, accessories |

### 🏠 Interior Designers
**Primary Use Cases:** Interior design, space planning, home staging, furniture placement

| Type | Description | Use Cases | Examples |
|------|-------------|-----------|----------|
| `furniture` | Chairs, tables, sofas, beds, storage units | Interior design, furniture placement, room planning, home staging | Sofas, chairs, tables, beds, cabinets, storage, decor |
| `room` | Interior spaces, rooms, architectural environments | Interior design, space planning, room visualization, home staging | Living rooms, bedrooms, kitchens, offices, commercial spaces |
| `lighting` | Lamps, fixtures, natural light, ambient lighting | Lighting design, ambiance creation, mood setting, illumination | Table lamps, chandeliers, natural light, LED fixtures, ambiance |
| `wall_finish` | Paint colors, wallpapers, textures, wall treatments | Wall design, color schemes, texture selection, interior finishes | Paint colors, wallpapers, textures, wood panels, stone finishes |

### 💄 Beauty & Cosmetics Professionals
**Primary Use Cases:** Makeup application, skincare visualization, beauty product testing

| Type | Description | Use Cases | Examples |
|------|-------------|-----------|----------|
| `face` | Human faces for makeup, skincare, beauty product testing | Makeup application, skincare visualization, beauty product testing | Different face shapes, skin tones, ages, facial features |
| `makeup` | Cosmetics, beauty products, makeup items | Makeup application, beauty product testing, cosmetic visualization | Foundation, lipstick, eyeshadow, mascara, beauty tools |
| `hair` | Hair styles, colors, textures, hair products | Hair styling, color changes, hair product visualization | Hair colors, styles, textures, hair care products |
| `skincare` | Skincare products, treatments, beauty routines | Skincare visualization, product testing, beauty routine planning | Creams, serums, treatments, skincare tools, beauty routines |

### 🏗️ Architecture & Construction
**Primary Use Cases:** Architectural visualization, construction planning, building design

| Type | Description | Use Cases | Examples |
|------|-------------|-----------|----------|
| `building` | Structures, architecture, construction elements | Architectural visualization, construction planning, building design | Houses, buildings, structures, architectural elements |
| `material` | Construction materials, finishes, textures | Material selection, construction visualization, design planning | Wood, stone, metal, glass, concrete, building materials |
| `landscape` | Outdoor spaces, gardens, natural environments | Landscape design, outdoor planning, environmental integration | Gardens, parks, outdoor spaces, natural landscapes |
| `fixture` | Hardware, fixtures, architectural details | Hardware selection, fixture placement, architectural details | Doors, windows, hardware, fixtures, architectural elements |

### 📢 Marketing & Advertising
**Primary Use Cases:** Lifestyle marketing, brand positioning, social media content

| Type | Description | Use Cases | Examples |
|------|-------------|-----------|----------|
| `lifestyle` | Lifestyle scenes, environments, social situations | Lifestyle marketing, brand positioning, social media content | Lifestyle scenes, social situations, aspirational environments |
| `scene` | Environmental backgrounds, settings, contexts | Scene setting, environmental context, mood creation | Beaches, cities, nature, indoor scenes, outdoor environments |
| `prop` | Props, accessories, supporting elements | Prop placement, scene enhancement, visual storytelling | Decorative items, props, accessories, supporting elements |
| `text_overlay` | Text, captions, headlines, messaging | Text placement, messaging, captions, headlines | Headlines, captions, text overlays, messaging, call-to-actions |

### 🏘️ Real Estate
**Primary Use Cases:** Property visualization, real estate marketing, property staging

| Type | Description | Use Cases | Examples |
|------|-------------|-----------|----------|
| `property` | Real estate, buildings, properties | Property visualization, real estate marketing, property staging | Houses, apartments, commercial properties, real estate |
| `staging` | Furniture staging, property presentation | Property staging, home presentation, real estate marketing | Staged furniture, property presentation, home staging |
| `renovation` | Before/after, renovation elements, improvements | Renovation visualization, improvement planning, before/after | Renovation elements, improvements, before/after comparisons |

### 🎨 General Purpose
**Primary Use Cases:** Texture application, color coordination, pattern design, visual effects

| Type | Description | Use Cases | Examples |
|------|-------------|-----------|----------|
| `texture` | Surface textures, patterns, materials | Texture application, material visualization, surface design | Wood grain, fabric textures, metal finishes, surface patterns |
| `color` | Color swatches, color schemes, color combinations | Color selection, color scheme planning, color coordination | Color palettes, color swatches, color combinations, color schemes |
| `pattern` | Decorative patterns, designs, motifs | Pattern application, design elements, decorative motifs | Geometric patterns, floral designs, abstract patterns, motifs |
| `effect` | Visual effects, filters, enhancements | Effect application, visual enhancement, artistic effects | Lighting effects, filters, visual enhancements, artistic effects |

## Usage Examples

### Fashion Designer Workflow
```
1. Upload a model image (type: model)
2. Upload clothing items (type: garment)
3. Use prompt: "Put the @garment on the @model in a professional setting"
4. Generate multiple variations with different poses and backgrounds
```

### Product Designer Workflow
```
1. Upload product image (type: product)
2. Upload logo (type: logo)
3. Use prompt: "Place the @logo on the @product in a modern lifestyle setting"
4. Generate variations with different logo placements and sizes
```

### Automotive Enthusiast Workflow
```
1. Upload car image (type: vehicle)
2. Upload rims (type: rims_wheels)
3. Use prompt: "Install the @rims_wheels on the @vehicle with a matte black finish"
4. Generate variations with different angles and lighting
```

### Interior Designer Workflow
```
1. Upload room image (type: room)
2. Upload furniture (type: furniture)
3. Use prompt: "Place the @furniture in the @room with warm lighting"
4. Generate variations with different furniture arrangements
```

## Best Practices

1. **Use Specific Types**: Choose the most specific type that matches your use case
2. **Combine Types**: Mix different types for complex scenarios (e.g., model + garment + scene)
3. **Clear Prompts**: Use descriptive prompts that reference the types with @mentions
4. **Quality Images**: Use high-quality, well-lit images for best results
5. **Consistent Lighting**: Match lighting conditions between different image types when possible

## Technical Notes

- All types support the @mention system in prompts
- Types are organized by category for easy filtering
- Each type includes use cases and examples for guidance
- The system supports custom types for specialized needs
- Types can be extended or modified as needed

## Future Enhancements

- AI-powered type suggestions based on uploaded images
- Category-based filtering in the UI
- Type-specific prompt templates
- Integration with industry-specific workflows
- Advanced type combinations and relationships
