-- Enable RLS on all tables
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE moodboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE showcases ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users Profile Policies
CREATE POLICY "Users can view all profiles" ON users_profile
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users_profile
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON users_profile
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Gigs Policies
CREATE POLICY "Anyone can view published gigs" ON gigs
    FOR SELECT USING (status = 'PUBLISHED' OR owner_user_id = (
        SELECT id FROM users_profile WHERE user_id = auth.uid()
    ));

CREATE POLICY "Contributors can create gigs" ON gigs
    FOR INSERT WITH CHECK (
        owner_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND 'CONTRIBUTOR' = ANY(role_flags)
        )
    );

CREATE POLICY "Gig owners can update own gigs" ON gigs
    FOR UPDATE USING (
        owner_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

CREATE POLICY "Gig owners can delete own gigs" ON gigs
    FOR DELETE USING (
        owner_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

-- Applications Policies
CREATE POLICY "Gig owners can view applications to their gigs" ON applications
    FOR SELECT USING (
        gig_id IN (
            SELECT id FROM gigs 
            WHERE owner_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        )
        OR applicant_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

CREATE POLICY "Talent can apply to gigs" ON applications
    FOR INSERT WITH CHECK (
        applicant_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND 'TALENT' = ANY(role_flags)
        )
    );

CREATE POLICY "Applicants can update own applications" ON applications
    FOR UPDATE USING (
        applicant_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

CREATE POLICY "Gig owners can update applications to their gigs" ON applications
    FOR UPDATE USING (
        gig_id IN (
            SELECT id FROM gigs 
            WHERE owner_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        )
    );

-- Media Policies
CREATE POLICY "Users can view own media" ON media
    FOR SELECT USING (
        owner_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        OR visibility = 'PUBLIC'
    );

CREATE POLICY "Users can upload own media" ON media
    FOR INSERT WITH CHECK (
        owner_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own media" ON media
    FOR UPDATE USING (
        owner_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete own media" ON media
    FOR DELETE USING (
        owner_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

-- Moodboards Policies
CREATE POLICY "Anyone can view moodboards for published gigs" ON moodboards
    FOR SELECT USING (
        gig_id IN (SELECT id FROM gigs WHERE status = 'PUBLISHED')
        OR owner_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

CREATE POLICY "Gig owners can create moodboards" ON moodboards
    FOR INSERT WITH CHECK (
        owner_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        AND gig_id IN (
            SELECT id FROM gigs 
            WHERE owner_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Moodboard owners can update own moodboards" ON moodboards
    FOR UPDATE USING (
        owner_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

CREATE POLICY "Moodboard owners can delete own moodboards" ON moodboards
    FOR DELETE USING (
        owner_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

-- Showcases Policies
CREATE POLICY "Anyone can view public showcases" ON showcases
    FOR SELECT USING (
        visibility = 'PUBLIC'
        OR creator_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        OR talent_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

CREATE POLICY "Participants can create showcases" ON showcases
    FOR INSERT WITH CHECK (
        creator_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        OR talent_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

CREATE POLICY "Participants can update showcases" ON showcases
    FOR UPDATE USING (
        creator_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        OR talent_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

-- Messages Policies
CREATE POLICY "Users can view messages in their gigs" ON messages
    FOR SELECT USING (
        from_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        OR to_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        from_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

-- Reviews Policies
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Participants can create reviews" ON reviews
    FOR INSERT WITH CHECK (
        reviewer_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
        AND gig_id IN (
            SELECT id FROM gigs WHERE status = 'COMPLETED'
        )
    );

-- Reports Policies
CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (
        reporter_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view own reports" ON reports
    FOR SELECT USING (
        reporter_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can view all reports" ON reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() 
            AND 'ADMIN' = ANY(role_flags)
        )
    );

-- Subscriptions Policies
CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING (
        user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    );

CREATE POLICY "System can manage subscriptions" ON subscriptions
    FOR ALL USING (
        auth.uid() = (SELECT user_id FROM users_profile WHERE id = user_id)
    );