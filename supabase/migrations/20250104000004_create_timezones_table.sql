-- Create timezones table for dynamic timezone options
CREATE TABLE timezones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    value VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    utc_offset VARCHAR(10) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE timezones IS 'Available timezone options for user profiles';
COMMENT ON COLUMN timezones.value IS 'Timezone identifier (e.g., UTC, EST, PST)';
COMMENT ON COLUMN timezones.label IS 'Display label for the timezone';
COMMENT ON COLUMN timezones.utc_offset IS 'UTC offset (e.g., +00:00, -05:00)';
COMMENT ON COLUMN timezones.description IS 'Optional description of the timezone';
COMMENT ON COLUMN timezones.sort_order IS 'Order for display purposes';
COMMENT ON COLUMN timezones.is_active IS 'Whether this timezone is available for selection';

-- Add indexes
CREATE INDEX idx_timezones_sort_order ON timezones(sort_order);
CREATE INDEX idx_timezones_is_active ON timezones(is_active);

-- Enable RLS
ALTER TABLE timezones ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can read timezones" ON timezones
    FOR SELECT USING (is_active = true);

-- Insert common timezones
INSERT INTO timezones (value, label, utc_offset, description, sort_order) VALUES
('UTC', 'UTC (Coordinated Universal Time)', '+00:00', 'Greenwich Mean Time', 1),
('EST', 'EST (Eastern Standard Time)', '-05:00', 'US Eastern Time', 2),
('EDT', 'EDT (Eastern Daylight Time)', '-04:00', 'US Eastern Time (Daylight)', 3),
('PST', 'PST (Pacific Standard Time)', '-08:00', 'US Pacific Time', 4),
('PDT', 'PDT (Pacific Daylight Time)', '-07:00', 'US Pacific Time (Daylight)', 5),
('CST', 'CST (Central Standard Time)', '-06:00', 'US Central Time', 6),
('CDT', 'CDT (Central Daylight Time)', '-05:00', 'US Central Time (Daylight)', 7),
('MST', 'MST (Mountain Standard Time)', '-07:00', 'US Mountain Time', 8),
('MDT', 'MDT (Mountain Daylight Time)', '-06:00', 'US Mountain Time (Daylight)', 9),
('GMT', 'GMT (Greenwich Mean Time)', '+00:00', 'Greenwich Mean Time', 10),
('CET', 'CET (Central European Time)', '+01:00', 'Central European Time', 11),
('CEST', 'CEST (Central European Summer Time)', '+02:00', 'Central European Summer Time', 12),
('JST', 'JST (Japan Standard Time)', '+09:00', 'Japan Standard Time', 13),
('AEST', 'AEST (Australian Eastern Standard Time)', '+10:00', 'Australian Eastern Time', 14),
('AEDT', 'AEDT (Australian Eastern Daylight Time)', '+11:00', 'Australian Eastern Time (Daylight)', 15),
('IST', 'IST (India Standard Time)', '+05:30', 'India Standard Time', 16),
('CST_CHINA', 'CST (China Standard Time)', '+08:00', 'China Standard Time', 17),
('KST', 'KST (Korea Standard Time)', '+09:00', 'Korea Standard Time', 18),
('MSK', 'MSK (Moscow Time)', '+03:00', 'Moscow Time', 19),
('BRT', 'BRT (Brasilia Time)', '-03:00', 'Brasilia Time', 20),
('ART', 'ART (Argentina Time)', '-03:00', 'Argentina Time', 21),
('WAT', 'WAT (West Africa Time)', '+01:00', 'West Africa Time', 22),
('EAT', 'EAT (East Africa Time)', '+03:00', 'East Africa Time', 23),
('SAST', 'SAST (South Africa Standard Time)', '+02:00', 'South Africa Standard Time', 24),
('NZST', 'NZST (New Zealand Standard Time)', '+12:00', 'New Zealand Standard Time', 25),
('NZDT', 'NZDT (New Zealand Daylight Time)', '+13:00', 'New Zealand Daylight Time', 26);
