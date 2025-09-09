-- Create enhancement_tasks table for tracking NanoBanana tasks
CREATE TABLE IF NOT EXISTS enhancement_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    credits_consumed INTEGER DEFAULT 1,
    provider TEXT DEFAULT 'nanobanana',
    enhancement_type TEXT,
    input_image_url TEXT,
    output_image_url TEXT,
    prompt TEXT,
    error_message TEXT,
    metadata JSONB,
    
    -- Refund tracking columns
    refund_status TEXT DEFAULT 'none' CHECK (refund_status IN ('none', 'pending', 'completed', 'failed')),
    refund_credits INTEGER DEFAULT 0,
    refund_reason TEXT,
    refunded_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhancement_tasks_user_id ON enhancement_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_tasks_task_id ON enhancement_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_enhancement_tasks_status ON enhancement_tasks(status);
CREATE INDEX IF NOT EXISTS idx_enhancement_tasks_created_at ON enhancement_tasks(created_at DESC);

-- Enable RLS
ALTER TABLE enhancement_tasks ENABLE ROW LEVEL SECURITY;

-- Users can read their own tasks
CREATE POLICY "Users can read own tasks" ON enhancement_tasks
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can create their own tasks
CREATE POLICY "Users can create own tasks" ON enhancement_tasks
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- System can update any task (via service role)
CREATE POLICY "System can update tasks" ON enhancement_tasks
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Admin can read all tasks
CREATE POLICY "Admin can read all tasks" ON enhancement_tasks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users_profile
            WHERE user_id = auth.uid()
            AND 'ADMIN' = ANY(role_flags)
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT ON enhancement_tasks TO authenticated;
GRANT ALL ON enhancement_tasks TO service_role;