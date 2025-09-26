-- Remove equipment types that should NOT be available for rental
-- Keep: Backdrop, Prop, Reflector, Diffuser, Drone
-- Remove: Vehicle, Software

-- Remove vehicle equipment type and its models
DELETE FROM equipment_predefined_models 
WHERE equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'vehicle');

DELETE FROM equipment_types 
WHERE name = 'vehicle';

-- Remove software equipment type and its models  
DELETE FROM equipment_predefined_models 
WHERE equipment_type_id = (SELECT id FROM equipment_types WHERE name = 'software');

DELETE FROM equipment_types 
WHERE name = 'software';

-- Remove vehicle-related brands that are no longer needed
DELETE FROM equipment_brands 
WHERE name IN ('rental', 'hertz', 'avis', 'enterprise', 'budget', 'national');

-- Remove software-related brands that are no longer needed
DELETE FROM equipment_brands 
WHERE name IN ('adobe', 'final_cut', 'premiere', 'photoshop', 'lightroom', 'davinci', 'after_effects');
