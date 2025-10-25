-- Dual Analysis System Schema Updates
-- Adds support for preview and full analysis tracking

-- Add analysis scope to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS analysis_scope VARCHAR(20) DEFAULT 'full';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS video_segment_start INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS video_segment_end INTEGER;

-- Add scope to analyses table
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS analysis_scope VARCHAR(20) DEFAULT 'full';

-- Add scope to tracked_positions
ALTER TABLE tracked_positions ADD COLUMN IF NOT EXISTS analysis_scope VARCHAR(20) DEFAULT 'full';

-- Fix analyses table constraint to support dual analysis (preview + full per match)
ALTER TABLE analyses DROP CONSTRAINT IF EXISTS unique_match_analysis;
ALTER TABLE analyses ADD CONSTRAINT unique_match_analysis_scope UNIQUE (match_id, analysis_scope);

-- Create indexes for faster scope queries
CREATE INDEX IF NOT EXISTS idx_jobs_scope ON jobs(match_id, analysis_scope);
CREATE INDEX IF NOT EXISTS idx_analyses_scope ON analyses(match_id, analysis_scope);

-- Add comments for documentation
COMMENT ON COLUMN jobs.analysis_scope IS 'Scope of analysis: preview (first 5 min) or full (complete video)';
COMMENT ON COLUMN jobs.video_segment_start IS 'Starting chunk index for analysis segment';
COMMENT ON COLUMN jobs.video_segment_end IS 'Ending chunk index for analysis segment';
