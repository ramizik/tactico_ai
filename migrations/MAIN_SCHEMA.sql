-- =====================================================
-- TacticoAI Database Schema - MINIMAL VERSION
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TEAMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  university TEXT NOT NULL CHECK (university IN ('UOP', 'UC_CALIFORNIA')),
  sport TEXT NOT NULL DEFAULT 'soccer' CHECK (sport = 'soccer'),
  theme_colors JSONB DEFAULT '{
    "primary": "#1295D8",
    "secondary": "#FFB511",
    "accent": "#22c55e"
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_university ON teams(university);

-- =====================================================
-- PLAYERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  jersey_number INTEGER NOT NULL CHECK (jersey_number > 0 AND jersey_number <= 99),
  avatar_url TEXT,
  stats JSONB DEFAULT '{
    "goals": 0,
    "assists": 0,
    "shots": 0,
    "passes": 0,
    "tackles": 0,
    "rating": 0.0,
    "minutes_played": 0
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_jersey_number ON players(team_id, jersey_number);

-- =====================================================
-- MATCHES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  opponent TEXT NOT NULL,
  sport TEXT NOT NULL DEFAULT 'soccer' CHECK (sport = 'soccer'),
  match_date DATE NOT NULL,
  venue TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'uploading', 'processing', 'analyzed', 'failed')),
  video_chunks_uploaded INTEGER DEFAULT 0,
  video_chunks_total INTEGER DEFAULT 0,
  upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploading', 'uploaded', 'failed')),
  upload_started_at TIMESTAMP WITH TIME ZONE,
  upload_completed_at TIMESTAMP WITH TIME ZONE,
  score_home INTEGER,
  score_away INTEGER,
  is_home_game BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_team_id ON matches(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date DESC);
CREATE INDEX IF NOT EXISTS idx_matches_upload_status ON matches(upload_status);

-- =====================================================
-- JOBS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL DEFAULT 'enhanced_analysis' CHECK (job_type = 'enhanced_analysis'),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_match_id ON jobs(match_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- =====================================================
-- ANALYSES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL DEFAULT 'enhanced_analysis',
  video_duration_seconds FLOAT,
  summary TEXT,
  tactical_insights TEXT,
  key_moments TEXT,
  coaching_recommendations TEXT,
  metrics JSONB DEFAULT '{}'::jsonb,
  events JSONB DEFAULT '[]'::jsonb,
  formation JSONB DEFAULT '{}'::jsonb,
  heatmap_data JSONB DEFAULT '{}'::jsonb,
  player_stats JSONB DEFAULT '{}'::jsonb,
  enhanced_video_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_match_analysis UNIQUE (match_id)
);

CREATE INDEX IF NOT EXISTS idx_analyses_match_id ON analyses(match_id);

-- =====================================================
-- TRACKED_POSITIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS tracked_positions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  frame_number INTEGER NOT NULL,
  timestamp_seconds FLOAT NOT NULL,
  tracked_objects JSONB NOT NULL DEFAULT '[]'::jsonb,
  ball_position JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracked_positions_match_id ON tracked_positions(match_id);
CREATE INDEX IF NOT EXISTS idx_tracked_positions_frame ON tracked_positions(match_id, frame_number);
CREATE INDEX IF NOT EXISTS idx_tracked_positions_timestamp ON tracked_positions(match_id, timestamp_seconds);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_positions ENABLE ROW LEVEL SECURITY;

-- Public read, service role write (demo-friendly)
CREATE POLICY "Public read access" ON teams FOR SELECT USING (true);
CREATE POLICY "Service role write" ON teams FOR ALL USING (true);

CREATE POLICY "Public read access" ON players FOR SELECT USING (true);
CREATE POLICY "Service role write" ON players FOR ALL USING (true);

CREATE POLICY "Public read access" ON matches FOR SELECT USING (true);
CREATE POLICY "Service role write" ON matches FOR ALL USING (true);

CREATE POLICY "Public read access" ON jobs FOR SELECT USING (true);
CREATE POLICY "Service role write" ON jobs FOR ALL USING (true);

CREATE POLICY "Public read access" ON analyses FOR SELECT USING (true);
CREATE POLICY "Service role write" ON analyses FOR ALL USING (true);

CREATE POLICY "Public read access" ON tracked_positions FOR SELECT USING (true);
CREATE POLICY "Service role write" ON tracked_positions FOR ALL USING (true);

-- =====================================================
-- AUTO-UPDATE TIMESTAMPS (ESSENTIAL)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

