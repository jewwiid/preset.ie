    -- Languages System Migration
    -- Creates a comprehensive languages system with predefined options and custom language support

    -- Step 1: Create languages_master table for predefined languages
    CREATE TABLE IF NOT EXISTS languages_master (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        native_name VARCHAR(100), -- Native name of the language (e.g., "Español" for Spanish)
        iso_code VARCHAR(10), -- ISO 639-1 or 639-3 language code
        region VARCHAR(50), -- Geographic region where language is primarily spoken
        is_popular BOOLEAN DEFAULT FALSE, -- Mark commonly spoken languages
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Step 2: Create user_languages table for user language selections
    CREATE TABLE IF NOT EXISTS user_languages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
        language_id UUID REFERENCES languages_master(id) ON DELETE SET NULL,
        custom_language_name VARCHAR(100), -- For custom languages not in master list
        proficiency_level VARCHAR(20) DEFAULT 'intermediate' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'native')),
        is_primary BOOLEAN DEFAULT FALSE, -- Mark user's primary language
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        -- Ensure either language_id or custom_language_name is provided
        CONSTRAINT valid_language_reference CHECK (
            (language_id IS NOT NULL AND custom_language_name IS NULL) OR
            (language_id IS NULL AND custom_language_name IS NOT NULL)
        ),
        
        -- Ensure only one primary language per user
        CONSTRAINT unique_primary_language UNIQUE (profile_id, is_primary) DEFERRABLE INITIALLY DEFERRED
    );

    -- Step 3: Insert comprehensive list of languages
    INSERT INTO languages_master (name, native_name, iso_code, region, is_popular, sort_order) VALUES
    -- Most popular languages globally
    ('English', 'English', 'en', 'Global', TRUE, 1),
    ('Mandarin Chinese', '中文', 'zh', 'China', TRUE, 2),
    ('Spanish', 'Español', 'es', 'Spain/Latin America', TRUE, 3),
    ('Hindi', 'हिन्दी', 'hi', 'India', TRUE, 4),
    ('Arabic', 'العربية', 'ar', 'Middle East/North Africa', TRUE, 5),
    ('Portuguese', 'Português', 'pt', 'Brazil/Portugal', TRUE, 6),
    ('Bengali', 'বাংলা', 'bn', 'Bangladesh/India', TRUE, 7),
    ('Russian', 'Русский', 'ru', 'Russia/Eastern Europe', TRUE, 8),
    ('Japanese', '日本語', 'ja', 'Japan', TRUE, 9),
    ('Punjabi', 'ਪੰਜਾਬੀ', 'pa', 'Pakistan/India', TRUE, 10),

    -- European languages
    ('French', 'Français', 'fr', 'France/West Africa', TRUE, 11),
    ('German', 'Deutsch', 'de', 'Germany/Austria', TRUE, 12),
    ('Italian', 'Italiano', 'it', 'Italy', TRUE, 13),
    ('Dutch', 'Nederlands', 'nl', 'Netherlands', TRUE, 14),
    ('Swedish', 'Svenska', 'sv', 'Sweden', TRUE, 15),
    ('Norwegian', 'Norsk', 'no', 'Norway', TRUE, 16),
    ('Danish', 'Dansk', 'da', 'Denmark', TRUE, 17),
    ('Finnish', 'Suomi', 'fi', 'Finland', TRUE, 18),
    ('Polish', 'Polski', 'pl', 'Poland', TRUE, 19),
    ('Czech', 'Čeština', 'cs', 'Czech Republic', TRUE, 20),
    ('Hungarian', 'Magyar', 'hu', 'Hungary', TRUE, 21),
    ('Romanian', 'Română', 'ro', 'Romania', TRUE, 22),
    ('Greek', 'Ελληνικά', 'el', 'Greece', TRUE, 23),
    ('Turkish', 'Türkçe', 'tr', 'Turkey', TRUE, 24),
    ('Ukrainian', 'Українська', 'uk', 'Ukraine', TRUE, 25),
    ('Bulgarian', 'Български', 'bg', 'Bulgaria', TRUE, 26),
    ('Croatian', 'Hrvatski', 'hr', 'Croatia', TRUE, 27),
    ('Serbian', 'Српски', 'sr', 'Serbia', TRUE, 28),
    ('Slovak', 'Slovenčina', 'sk', 'Slovakia', TRUE, 29),
    ('Slovenian', 'Slovenščina', 'sl', 'Slovenia', TRUE, 30),

    -- Asian languages
    ('Korean', '한국어', 'ko', 'South Korea', TRUE, 31),
    ('Vietnamese', 'Tiếng Việt', 'vi', 'Vietnam', TRUE, 32),
    ('Thai', 'ไทย', 'th', 'Thailand', TRUE, 33),
    ('Indonesian', 'Bahasa Indonesia', 'id', 'Indonesia', TRUE, 34),
    ('Malay', 'Bahasa Melayu', 'ms', 'Malaysia', TRUE, 35),
    ('Tagalog', 'Tagalog', 'tl', 'Philippines', TRUE, 36),
    ('Burmese', 'မြန်မာ', 'my', 'Myanmar', TRUE, 37),
    ('Khmer', 'ខ្មែរ', 'km', 'Cambodia', TRUE, 38),
    ('Lao', 'ລາວ', 'lo', 'Laos', TRUE, 39),
    ('Tamil', 'தமிழ்', 'ta', 'India/Sri Lanka', TRUE, 40),
    ('Telugu', 'తెలుగు', 'te', 'India', TRUE, 41),
    ('Marathi', 'मराठी', 'mr', 'India', TRUE, 42),
    ('Gujarati', 'ગુજરાતી', 'gu', 'India', TRUE, 43),
    ('Kannada', 'ಕನ್ನಡ', 'kn', 'India', TRUE, 44),
    ('Malayalam', 'മലയാളം', 'ml', 'India', TRUE, 45),
    ('Odia', 'ଓଡ଼ିଆ', 'or', 'India', TRUE, 46),
    ('Assamese', 'অসমীয়া', 'as', 'India', TRUE, 47),
    ('Nepali', 'नेपाली', 'ne', 'Nepal', TRUE, 48),
    ('Sinhala', 'සිංහල', 'si', 'Sri Lanka', TRUE, 49),
    ('Urdu', 'اردو', 'ur', 'Pakistan/India', TRUE, 50),

    -- African languages
    ('Swahili', 'Kiswahili', 'sw', 'East Africa', TRUE, 51),
    ('Amharic', 'አማርኛ', 'am', 'Ethiopia', TRUE, 52),
    ('Hausa', 'Hausa', 'ha', 'West Africa', TRUE, 53),
    ('Yoruba', 'Yorùbá', 'yo', 'Nigeria', TRUE, 54),
    ('Igbo', 'Igbo', 'ig', 'Nigeria', TRUE, 55),
    ('Zulu', 'isiZulu', 'zu', 'South Africa', TRUE, 56),
    ('Xhosa', 'isiXhosa', 'xh', 'South Africa', TRUE, 57),
    ('Afrikaans', 'Afrikaans', 'af', 'South Africa', TRUE, 58),
    ('Somali', 'Soomaali', 'so', 'Somalia', TRUE, 59),
    ('Oromo', 'Afaan Oromoo', 'om', 'Ethiopia', TRUE, 60),

    -- American languages
    ('Quechua', 'Runa Simi', 'qu', 'Andes', FALSE, 61),
    ('Guarani', 'Avañe''ẽ', 'gn', 'Paraguay', FALSE, 62),
    ('Nahuatl', 'Nāhuatl', 'nah', 'Mexico', FALSE, 63),
    ('Aymara', 'Aymar aru', 'ay', 'Bolivia/Peru', FALSE, 64),

    -- Other languages
    ('Hebrew', 'עברית', 'he', 'Israel', TRUE, 65),
    ('Persian', 'فارسی', 'fa', 'Iran', TRUE, 66),
    ('Kurdish', 'Kurdî', 'ku', 'Kurdistan', FALSE, 67),
    ('Armenian', 'Հայերեն', 'hy', 'Armenia', FALSE, 68),
    ('Georgian', 'ქართული', 'ka', 'Georgia', FALSE, 69),
    ('Albanian', 'Shqip', 'sq', 'Albania', FALSE, 70),
    ('Maltese', 'Malti', 'mt', 'Malta', FALSE, 71),
    ('Icelandic', 'Íslenska', 'is', 'Iceland', FALSE, 72),
    ('Irish', 'Gaeilge', 'ga', 'Ireland', FALSE, 73),
    ('Welsh', 'Cymraeg', 'cy', 'Wales', FALSE, 74),
    ('Scottish Gaelic', 'Gàidhlig', 'gd', 'Scotland', FALSE, 75),
    ('Basque', 'Euskera', 'eu', 'Spain/France', FALSE, 76),
    ('Catalan', 'Català', 'ca', 'Spain', FALSE, 77),
    ('Galician', 'Galego', 'gl', 'Spain', FALSE, 78),

    -- Sign languages
    ('American Sign Language', 'ASL', 'ase', 'United States', TRUE, 79),
    ('British Sign Language', 'BSL', 'bfi', 'United Kingdom', FALSE, 80),
    ('French Sign Language', 'LSF', 'fsl', 'France', FALSE, 81),
    ('German Sign Language', 'DGS', 'gsg', 'Germany', FALSE, 82),
    ('Japanese Sign Language', 'JSL', 'jsl', 'Japan', FALSE, 83),

    -- Constructed languages
    ('Esperanto', 'Esperanto', 'eo', 'International', FALSE, 84),
    ('Klingon', 'tlhIngan Hol', 'tlh', 'Fictional', FALSE, 85),
    ('Dothraki', 'Dothraki', 'mis', 'Fictional', FALSE, 86),
    ('Valyrian', 'Valyrian', 'mis', 'Fictional', FALSE, 87)

    ON CONFLICT (name) DO NOTHING;

    -- Step 4: Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_languages_master_name ON languages_master(name);
    CREATE INDEX IF NOT EXISTS idx_languages_master_iso_code ON languages_master(iso_code) WHERE iso_code IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_languages_master_popular ON languages_master(is_popular) WHERE is_popular = TRUE;
    CREATE INDEX IF NOT EXISTS idx_languages_master_sort_order ON languages_master(sort_order);
    CREATE INDEX IF NOT EXISTS idx_languages_master_active ON languages_master(is_active) WHERE is_active = TRUE;

    CREATE INDEX IF NOT EXISTS idx_user_languages_profile_id ON user_languages(profile_id);
    CREATE INDEX IF NOT EXISTS idx_user_languages_language_id ON user_languages(language_id) WHERE language_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_user_languages_custom_name ON user_languages(custom_language_name) WHERE custom_language_name IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_user_languages_proficiency ON user_languages(proficiency_level);
    CREATE INDEX IF NOT EXISTS idx_user_languages_primary ON user_languages(profile_id, is_primary) WHERE is_primary = TRUE;

    -- Step 5: Create functions for language management
    CREATE OR REPLACE FUNCTION get_user_languages(p_profile_id UUID)
    RETURNS TABLE (
        language_id UUID,
        language_name VARCHAR(100),
        native_name VARCHAR(100),
        custom_language_name VARCHAR(100),
        proficiency_level VARCHAR(20),
        is_primary BOOLEAN
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            ul.language_id,
            lm.name,
            lm.native_name,
            ul.custom_language_name,
            ul.proficiency_level,
            ul.is_primary
        FROM user_languages ul
        LEFT JOIN languages_master lm ON ul.language_id = lm.id
        WHERE ul.profile_id = p_profile_id
        ORDER BY ul.is_primary DESC, ul.created_at ASC;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION add_user_language(
        p_profile_id UUID,
        p_language_id UUID DEFAULT NULL,
        p_custom_language_name VARCHAR(100) DEFAULT NULL,
        p_proficiency_level VARCHAR(20) DEFAULT 'intermediate',
        p_is_primary BOOLEAN DEFAULT FALSE
    )
    RETURNS UUID AS $$
    DECLARE
        v_language_id UUID;
    BEGIN
        -- Validate input
        IF p_language_id IS NULL AND p_custom_language_name IS NULL THEN
            RAISE EXCEPTION 'Either language_id or custom_language_name must be provided';
        END IF;
        
        IF p_language_id IS NOT NULL AND p_custom_language_name IS NOT NULL THEN
            RAISE EXCEPTION 'Cannot provide both language_id and custom_language_name';
        END IF;
        
        -- If setting as primary, unset other primary languages
        IF p_is_primary THEN
            UPDATE user_languages 
            SET is_primary = FALSE 
            WHERE profile_id = p_profile_id;
        END IF;
        
        -- Insert new language
        INSERT INTO user_languages (
            profile_id,
            language_id,
            custom_language_name,
            proficiency_level,
            is_primary
        ) VALUES (
            p_profile_id,
            p_language_id,
            p_custom_language_name,
            p_proficiency_level,
            p_is_primary
        ) RETURNING id INTO v_language_id;
        
        RETURN v_language_id;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION remove_user_language(p_user_language_id UUID)
    RETURNS BOOLEAN AS $$
    DECLARE
        v_profile_id UUID;
        v_was_primary BOOLEAN;
    BEGIN
        -- Get profile_id and primary status before deletion
        SELECT profile_id, is_primary INTO v_profile_id, v_was_primary
        FROM user_languages
        WHERE id = p_user_language_id;
        
        IF v_profile_id IS NULL THEN
            RETURN FALSE;
        END IF;
        
        -- Delete the language
        DELETE FROM user_languages WHERE id = p_user_language_id;
        
        -- If it was primary, set another language as primary (if any exist)
        IF v_was_primary THEN
            UPDATE user_languages 
            SET is_primary = TRUE 
            WHERE id = (
                SELECT id FROM user_languages 
                WHERE profile_id = v_profile_id 
                AND id != p_user_language_id
                ORDER BY created_at ASC
                LIMIT 1
            );
        END IF;
        
        RETURN TRUE;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION search_languages(p_search_term VARCHAR(100))
    RETURNS TABLE (
        id UUID,
        name VARCHAR(100),
        native_name VARCHAR(100),
        iso_code VARCHAR(10),
        region VARCHAR(50),
        is_popular BOOLEAN
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            lm.id,
            lm.name,
            lm.native_name,
            lm.iso_code,
            lm.region,
            lm.is_popular
        FROM languages_master lm
        WHERE lm.is_active = TRUE
        AND (
            LOWER(lm.name) LIKE LOWER('%' || p_search_term || '%') OR
            LOWER(lm.native_name) LIKE LOWER('%' || p_search_term || '%') OR
            LOWER(lm.iso_code) LIKE LOWER('%' || p_search_term || '%')
        )
        ORDER BY lm.is_popular DESC, lm.sort_order ASC
        LIMIT 20;
    END;
    $$ LANGUAGE plpgsql;

    -- Step 6: Create view for easy language lookups
    CREATE OR REPLACE VIEW user_languages_view AS
    SELECT 
        ul.id,
        ul.profile_id,
        ul.language_id,
        lm.name as language_name,
        lm.native_name,
        lm.iso_code,
        ul.custom_language_name,
        ul.proficiency_level,
        ul.is_primary,
        ul.created_at,
        ul.updated_at
    FROM user_languages ul
    LEFT JOIN languages_master lm ON ul.language_id = lm.id;

    -- Step 7: Enable RLS
    ALTER TABLE languages_master ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_languages ENABLE ROW LEVEL SECURITY;

    -- RLS Policies for languages_master (public read access)
    CREATE POLICY "Anyone can view languages" ON languages_master
        FOR SELECT USING (is_active = TRUE);

    -- RLS Policies for user_languages
    CREATE POLICY "Users can view their own languages" ON user_languages
        FOR SELECT USING (
            profile_id IN (
                SELECT id FROM users_profile WHERE user_id = auth.uid()
            )
        );

    CREATE POLICY "Users can manage their own languages" ON user_languages
        FOR ALL USING (
            profile_id IN (
                SELECT id FROM users_profile WHERE user_id = auth.uid()
            )
        );

    -- Step 8: Create triggers for updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER update_languages_master_updated_at
        BEFORE UPDATE ON languages_master
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_user_languages_updated_at
        BEFORE UPDATE ON user_languages
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    -- Step 9: Grant permissions
    GRANT SELECT ON languages_master TO authenticated;
    GRANT ALL ON user_languages TO authenticated;
    GRANT EXECUTE ON FUNCTION get_user_languages TO authenticated;
    GRANT EXECUTE ON FUNCTION add_user_language TO authenticated;
    GRANT EXECUTE ON FUNCTION remove_user_language TO authenticated;
    GRANT EXECUTE ON FUNCTION search_languages TO authenticated;
    GRANT SELECT ON user_languages_view TO authenticated;

    -- Step 10: Add helpful comments
    COMMENT ON TABLE languages_master IS 'Master list of predefined languages with metadata';
    COMMENT ON TABLE user_languages IS 'User language selections with proficiency levels and custom language support';
    COMMENT ON COLUMN languages_master.native_name IS 'Native name of the language in its own script';
    COMMENT ON COLUMN languages_master.iso_code IS 'ISO 639-1 or 639-3 language code';
    COMMENT ON COLUMN languages_master.is_popular IS 'Mark commonly spoken languages for priority display';
    COMMENT ON COLUMN user_languages.custom_language_name IS 'Custom language name when not found in master list';
    COMMENT ON COLUMN user_languages.proficiency_level IS 'User proficiency level in this language';
    COMMENT ON COLUMN user_languages.is_primary IS 'Mark user primary language (only one allowed per user)';

    -- Step 11: Success message
    DO $$
    BEGIN
        RAISE NOTICE 'Languages system created successfully!';
        RAISE NOTICE 'Added 87 predefined languages including popular, regional, and sign languages';
        RAISE NOTICE 'Created user_languages table with custom language support';
        RAISE NOTICE 'Added functions for language management and search';
        RAISE NOTICE 'Enabled RLS policies for data security';
    END $$;
