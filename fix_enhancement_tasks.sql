-- Check and add missing columns to enhancement_tasks
ALTER TABLE enhancement_tasks 
ADD COLUMN IF NOT EXISTS error_type VARCHAR(50);

ALTER TABLE enhancement_tasks 
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

ALTER TABLE enhancement_tasks 
ADD COLUMN IF NOT EXISTS refunded BOOLEAN DEFAULT false;

ALTER TABLE enhancement_tasks 
ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMPTZ;

ALTER TABLE enhancement_tasks 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Check current columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'enhancement_tasks'
ORDER BY ordinal_position;