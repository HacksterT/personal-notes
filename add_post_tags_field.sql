-- Add post_tags field to content_items table for social media platform tags
-- This field will store platform tags (FB, IG, X, LI, TT, YT) for social-media-posts category
-- Works identically to the existing tags field but separated for platform-specific tags

ALTER TABLE content_items ADD COLUMN post_tags TEXT[];

-- Add comment to document the field purpose
COMMENT ON COLUMN content_items.post_tags IS 'Platform tags for social media posts (FB, IG, X, LI, TT, YT) - stored as text array similar to tags field';

-- Verify the field was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'content_items' 
AND column_name = 'post_tags';