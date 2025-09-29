-- Add contact sharing system to users_profile table
-- This migration adds email field and privacy settings for contact information

-- Add email field to users_profile table
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS phone_public BOOLEAN DEFAULT false;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS email_public BOOLEAN DEFAULT false;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_profile_email ON users_profile(email);
CREATE INDEX IF NOT EXISTS idx_users_profile_phone_public ON users_profile(phone_public);
CREATE INDEX IF NOT EXISTS idx_users_profile_email_public ON users_profile(email_public);

-- Add constraints (drop first if exists to avoid errors)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_email_format') THEN
        ALTER TABLE users_profile DROP CONSTRAINT valid_email_format;
    END IF;
END $$;

ALTER TABLE users_profile ADD CONSTRAINT valid_email_format 
  CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Create contact_sharing table to track when contact details are shared
CREATE TABLE IF NOT EXISTS contact_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL, -- listing_id, rental_order_id, or sale_order_id
  conversation_type TEXT CHECK (conversation_type IN ('listing', 'rental_order', 'sale_order')) NOT NULL,
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  sharer_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  contact_type TEXT CHECK (contact_type IN ('phone', 'email')) NOT NULL,
  contact_value TEXT NOT NULL,
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure users can't share with themselves
  CONSTRAINT different_users CHECK (sharer_id != recipient_id)
);

-- Create indexes for contact_sharing
CREATE INDEX IF NOT EXISTS idx_contact_sharing_conversation ON contact_sharing(conversation_id, conversation_type);
CREATE INDEX IF NOT EXISTS idx_contact_sharing_offer ON contact_sharing(offer_id);
CREATE INDEX IF NOT EXISTS idx_contact_sharing_sharer ON contact_sharing(sharer_id);
CREATE INDEX IF NOT EXISTS idx_contact_sharing_recipient ON contact_sharing(recipient_id);
CREATE INDEX IF NOT EXISTS idx_contact_sharing_shared_at ON contact_sharing(shared_at);

-- Enable RLS on contact_sharing
ALTER TABLE contact_sharing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_sharing
CREATE POLICY "Users can view contact sharing they are involved in" ON contact_sharing
  FOR SELECT USING (
    auth.uid()::text = sharer_id::text OR 
    auth.uid()::text = recipient_id::text
  );

CREATE POLICY "Users can create contact sharing" ON contact_sharing
  FOR INSERT WITH CHECK (
    auth.uid()::text = sharer_id::text
  );

-- Add comments
COMMENT ON TABLE contact_sharing IS 'Tracks when users share contact details in conversations';
COMMENT ON COLUMN users_profile.email IS 'User email address for contact sharing';
COMMENT ON COLUMN users_profile.phone_public IS 'Whether phone number can be shared with other users';
COMMENT ON COLUMN users_profile.email_public IS 'Whether email can be shared with other users';
COMMENT ON COLUMN contact_sharing.conversation_type IS 'Type of conversation where contact was shared';
COMMENT ON COLUMN contact_sharing.contact_type IS 'Type of contact information shared (phone/email)';
COMMENT ON COLUMN contact_sharing.contact_value IS 'The actual contact information shared';

-- Create function to share contact details
CREATE OR REPLACE FUNCTION share_contact_details(
  p_conversation_id UUID,
  p_conversation_type TEXT,
  p_offer_id UUID,
  p_sharer_id UUID,
  p_recipient_id UUID,
  p_contact_type TEXT,
  p_contact_value TEXT
) RETURNS UUID AS $$
DECLARE
  sharing_id UUID;
BEGIN
  -- Insert contact sharing record
  INSERT INTO contact_sharing (
    conversation_id,
    conversation_type,
    offer_id,
    sharer_id,
    recipient_id,
    contact_type,
    contact_value
  ) VALUES (
    p_conversation_id,
    p_conversation_type,
    p_offer_id,
    p_sharer_id,
    p_recipient_id,
    p_contact_type,
    p_contact_value
  ) RETURNING id INTO sharing_id;
  
  RETURN sharing_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get shared contact details for a conversation
CREATE OR REPLACE FUNCTION get_shared_contacts(
  p_conversation_id UUID,
  p_conversation_type TEXT,
  p_user_id UUID
) RETURNS TABLE (
  contact_type TEXT,
  contact_value TEXT,
  sharer_name TEXT,
  sharer_handle TEXT,
  shared_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.contact_type,
    cs.contact_value,
    up.display_name,
    up.handle,
    cs.shared_at
  FROM contact_sharing cs
  JOIN users_profile up ON cs.sharer_id = up.id
  WHERE cs.conversation_id = p_conversation_id
    AND cs.conversation_type = p_conversation_type
    AND cs.recipient_id = p_user_id
  ORDER BY cs.shared_at DESC;
END;
$$ LANGUAGE plpgsql;
