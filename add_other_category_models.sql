-- Add predefined models for the "Other" category
-- This covers miscellaneous equipment that doesn't fit into specific categories

INSERT INTO equipment_predefined_models (equipment_type_id, brand, model, description, sort_order) VALUES
-- Generic Other Equipment
((SELECT id FROM equipment_types WHERE name = 'other'), 'generic', 'Custom Equipment', 'User-defined custom equipment', 1),
((SELECT id FROM equipment_types WHERE name = 'other'), 'generic', 'Vintage Equipment', 'Antique or vintage equipment', 2),
((SELECT id FROM equipment_types WHERE name = 'other'), 'generic', 'Modified Equipment', 'Custom modified equipment', 3),
((SELECT id FROM equipment_types WHERE name = 'other'), 'generic', 'Prototype Equipment', 'Prototype or experimental equipment', 4),
((SELECT id FROM equipment_types WHERE name = 'other'), 'generic', 'Rare Equipment', 'Rare or hard-to-find equipment', 5),
((SELECT id FROM equipment_types WHERE name = 'other'), 'generic', 'Specialty Equipment', 'Specialized or niche equipment', 6),
((SELECT id FROM equipment_types WHERE name = 'other'), 'generic', 'DIY Equipment', 'Do-it-yourself or homemade equipment', 7),
((SELECT id FROM equipment_types WHERE name = 'other'), 'generic', 'Repaired Equipment', 'Previously repaired equipment', 8),
((SELECT id FROM equipment_types WHERE name = 'other'), 'generic', 'Upgraded Equipment', 'Equipment with custom upgrades', 9),
((SELECT id FROM equipment_types WHERE name = 'other'), 'generic', 'Limited Edition', 'Limited edition or special release equipment', 10);

-- Add generic brand to equipment_brands if not exists
INSERT INTO equipment_brands (name, display_name, sort_order) VALUES
('generic', 'Generic', 100)
ON CONFLICT (name) DO NOTHING;
