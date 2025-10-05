-- Create working_time_preferences table for dynamic options
CREATE TABLE working_time_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    value VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    start_time TIME,
    end_time TIME,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE working_time_preferences IS 'Predefined working time preference options';
COMMENT ON COLUMN working_time_preferences.value IS 'Unique identifier for the preference';
COMMENT ON COLUMN working_time_preferences.label IS 'Display label for the preference';
COMMENT ON COLUMN working_time_preferences.start_time IS 'Default start time for this preference (optional)';
COMMENT ON COLUMN working_time_preferences.end_time IS 'Default end time for this preference (optional)';
COMMENT ON COLUMN working_time_preferences.description IS 'Optional description of the preference';
COMMENT ON COLUMN working_time_preferences.sort_order IS 'Order for display purposes';
COMMENT ON COLUMN working_time_preferences.is_active IS 'Whether this preference is available for selection';

-- Add indexes
CREATE INDEX idx_working_time_preferences_sort_order ON working_time_preferences(sort_order);
CREATE INDEX idx_working_time_preferences_is_active ON working_time_preferences(is_active);

-- Enable RLS
ALTER TABLE working_time_preferences ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can read working time preferences" ON working_time_preferences
    FOR SELECT USING (is_active = true);

-- Insert default working time preferences
INSERT INTO working_time_preferences (value, label, start_time, end_time, description, sort_order) VALUES
('flexible', 'Flexible - Any time', NULL, NULL, 'Available at any time', 1),
('standard_business_hours', 'Standard Business Hours', '09:00', '17:00', 'Monday to Friday, 9am to 5pm', 2),
('mornings_only', 'Mornings Only', '06:00', '12:00', 'Early morning to noon', 3),
('evenings_only', 'Evenings Only', '18:00', '23:00', 'Evening hours after 6pm', 4),
('weekends_only', 'Weekends Only', NULL, NULL, 'Saturday and Sunday only', 5),
('overnight_only', 'Overnight Only', '22:00', '06:00', 'Late night to early morning', 6),
('custom', 'Custom Hours', NULL, NULL, 'Specify your own start and end times', 7);
