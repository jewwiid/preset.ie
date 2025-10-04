-- Add missing categories from homepage to predefined_roles table
-- These categories appear on the homepage but weren't in the database

INSERT INTO predefined_roles (name, category, description, sort_order, is_active) VALUES
-- Additional creative roles from homepage
('Freelancer', 'creative', 'Independent creative professional', 42, true),
('Creative Director', 'creative', 'Oversees creative strategy and vision', 43, true),
('Content Creator', 'marketing', 'Creates digital content for brands', 44, true),
('Agency', 'business', 'Creative agency or studio', 45, true),
('Entrepreneur', 'business', 'Business owner and innovator', 46, true),
('Influencer', 'marketing', 'Social media influencer and content creator', 47, true),
('Marketing Team', 'marketing', 'Marketing professionals and teams', 48, true),
('Studio', 'business', 'Creative studio or production house', 49, true),
('Artist', 'creative', 'Visual artist and creative professional', 50, true),
('Contractor', 'business', 'Independent contractor and freelancer', 51, true),
('Actor', 'creative', 'Professional actor and performer', 52, true),
('Musician', 'creative', 'Music professional and performer', 53, true),

-- Additional business/marketing roles
('Stylist', 'creative', 'General styling and fashion professional', 54, true)

ON CONFLICT (name) DO NOTHING;

-- Update existing roles to ensure they're active
UPDATE predefined_roles 
SET is_active = true 
WHERE name IN (
  'Photographer', 'Videographer', 'Director', 'Cinematographer', 'Model', 
  'Actor/Actress', 'Makeup Artist', 'Hair Stylist', 'Wardrobe Stylist', 
  'Fashion Stylist', 'Producer', 'Editor', 'Art Director', 'Writer',
  'Social Media Manager', 'Brand Manager'
);
