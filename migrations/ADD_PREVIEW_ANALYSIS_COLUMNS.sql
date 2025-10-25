-- Migration: Add preview analysis columns to matches table
-- Date: 2025-01-25
-- Description: Add columns to track preview and full analysis paths separately

-- Add preview analysis tracking columns
ALTER TABLE matches
ADD COLUMN preview_analysis_path TEXT,
ADD COLUMN preview_analysis_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN full_analysis_path TEXT,
ADD COLUMN full_analysis_completed_at TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN matches.preview_analysis_path IS 'Path to preview analysis CSV file (generated from first chunk)';
COMMENT ON COLUMN matches.preview_analysis_completed_at IS 'Timestamp when preview analysis completed';
COMMENT ON COLUMN matches.full_analysis_path IS 'Path to full analysis CSV file (generated from complete video)';
COMMENT ON COLUMN matches.full_analysis_completed_at IS 'Timestamp when full analysis completed';

-- Create index for faster queries on analysis completion
CREATE INDEX idx_matches_preview_analysis_completed ON matches(preview_analysis_completed_at);
CREATE INDEX idx_matches_full_analysis_completed ON matches(full_analysis_completed_at);
