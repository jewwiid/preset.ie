-- Add missing EU and UK Letter Sizes to predefined_clothing_sizes table
-- This completes the clothing sizes data that was missing from enhance_measurements_and_sizes.sql

-- Insert predefined clothing sizes for EU Letter Sizes
INSERT INTO predefined_clothing_sizes (size_system_id, size_value, size_label, sort_order) VALUES
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Letter Sizes'), 'XXS', 'Extra Extra Small', 1),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Letter Sizes'), 'XS', 'Extra Small', 2),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Letter Sizes'), 'S', 'Small', 3),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Letter Sizes'), 'M', 'Medium', 4),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Letter Sizes'), 'L', 'Large', 5),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Letter Sizes'), 'XL', 'Extra Large', 6),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Letter Sizes'), 'XXL', 'Extra Extra Large', 7),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Letter Sizes'), 'XXXL', 'Triple Extra Large', 8)
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- Insert predefined clothing sizes for UK Letter Sizes
INSERT INTO predefined_clothing_sizes (size_system_id, size_value, size_label, sort_order) VALUES
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Letter Sizes'), 'XXS', 'Extra Extra Small', 1),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Letter Sizes'), 'XS', 'Extra Small', 2),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Letter Sizes'), 'S', 'Small', 3),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Letter Sizes'), 'M', 'Medium', 4),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Letter Sizes'), 'L', 'Large', 5),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Letter Sizes'), 'XL', 'Extra Large', 6),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Letter Sizes'), 'XXL', 'Extra Extra Large', 7),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Letter Sizes'), 'XXXL', 'Triple Extra Large', 8)
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- Insert predefined clothing sizes for EU Number Sizes
INSERT INTO predefined_clothing_sizes (size_system_id, size_value, size_label, sort_order) VALUES
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Number Sizes'), '32', 'Size 32', 1),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Number Sizes'), '34', 'Size 34', 2),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Number Sizes'), '36', 'Size 36', 3),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Number Sizes'), '38', 'Size 38', 4),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Number Sizes'), '40', 'Size 40', 5),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Number Sizes'), '42', 'Size 42', 6),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Number Sizes'), '44', 'Size 44', 7),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Number Sizes'), '46', 'Size 46', 8),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Number Sizes'), '48', 'Size 48', 9),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Number Sizes'), '50', 'Size 50', 10),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'EU Number Sizes'), '52', 'Size 52', 11)
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- Insert predefined clothing sizes for UK Number Sizes
INSERT INTO predefined_clothing_sizes (size_system_id, size_value, size_label, sort_order) VALUES
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Number Sizes'), '4', 'Size 4', 1),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Number Sizes'), '6', 'Size 6', 2),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Number Sizes'), '8', 'Size 8', 3),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Number Sizes'), '10', 'Size 10', 4),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Number Sizes'), '12', 'Size 12', 5),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Number Sizes'), '14', 'Size 14', 6),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Number Sizes'), '16', 'Size 16', 7),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Number Sizes'), '18', 'Size 18', 8),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Number Sizes'), '20', 'Size 20', 9),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Number Sizes'), '22', 'Size 22', 10),
((SELECT id FROM predefined_clothing_size_systems WHERE system_name = 'UK Number Sizes'), '24', 'Size 24', 11)
ON CONFLICT (size_system_id, size_value) DO NOTHING;

-- Verify the data was inserted
SELECT 
  pcs.system_name,
  COUNT(pc.size_value) as size_count
FROM predefined_clothing_size_systems pcs
LEFT JOIN predefined_clothing_sizes pc ON pcs.id = pc.size_system_id
WHERE pcs.is_active = true
GROUP BY pcs.id, pcs.system_name
ORDER BY pcs.sort_order;
