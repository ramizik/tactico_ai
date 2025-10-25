<!-- 2e52c5a9-96e1-4ea8-8164-ff2f7be9e350 371f9ead-5ad0-4aee-8fb6-b8a10b611ddf -->
# Backend Integration Plan

## Phase 1: Backend Cleanup & Simplification

### 1.1 Remove Basketball & Quick Brief Logic from Backend

**File: `backend/main.py`**

- Remove basketball validation in `create_match` endpoint (line 322)
  - Change: `if sport not in ["soccer", "basketball"]` → `if sport != "soccer"`
  - Update error message to "Sport must be 'soccer'"

- Remove quick_brief and full_analysis from `trigger_analysis` endpoint (line 672)
  - Change: `if analysis_type not in ["quick_brief", "full_analysis", "enhanced_analysis"]`
  - To: `if analysis_type != "enhanced_analysis"`
  - Update error message: "Analysis type must be 'enhanced_analysis'"
  - Remove quick_brief video segment logic (lines 694-696)

- Remove legacy thumbnail_url and video_url from match creation (line 314)
  - Remove `thumbnail_url` and `video_url` Form parameters
  - Remove from `match_data` dictionary (lines 332-333)

**File: `backend/job_processor.py`**

- Remove imports for quick_brief analysis (line 14)
  - Remove: `run_quick_brief_from_chunks`
  - Keep only: `run_full_analysis_from_chunks` (will rename to enhanced)

- Update job type handling in `_process_job` (lines 84-150)
  - Remove quick_brief and full_analysis branches
  - Keep only enhanced_analysis logic
  - Rename function call to match enhanced_analysis pattern

**File: `backend/video_processor.py`**

- Verify enhanced analysis functions exist
- Remove any basketball-specific processing logic
- Ensure only soccer analysis is supported

### 1.2 Update Database Schema Enforcement

**File: `migrations/MAIN_SCHEMA.sql`**

- Already correct: sport CHECK constraint only allows 'soccer'
- Already correct: job_type CHECK constraint only allows 'enhanced_analysis'
- Schema is properly configured

## Phase 2: Frontend API Integration Layer

### 2.1 Create API Client Module

**Create: `frontend/lib/api.ts`**

```typescript
// API client for backend integration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// API response types
interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Teams API
export const teamsApi = {
  getAll: async () => {
    const res = await fetch(`${API_BASE_URL}/api/teams`);
    const data = await res.json();
    return data.teams;
  },
  
  getById: async (teamId: string) => {
    const res = await fetch(`${API_BASE_URL}/api/teams/${teamId}`);
    const data = await res.json();
    return data.team;
  }
};

// Players API
export const playersApi = {
  getTeamPlayers: async (teamId: string) => {
    const res = await fetch(`${API_BASE_URL}/api/teams/${teamId}/players`);
    const data = await res.json();
    return data.players;
  },
  
  create: async (teamId: string, playerData: {
    name: string;
    position: string;
    number: number;
    avatar_url?: string;
  }) => {
    const formData = new FormData();
    formData.append('name', playerData.name);
    formData.append('position', playerData.position);
    formData.append('number', playerData.number.toString());
    if (playerData.avatar_url) formData.append('avatar_url', playerData.avatar_url);
    
    const res = await fetch(`${API_BASE_URL}/api/teams/${teamId}/players`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    return data.player;
  }
};

// Matches API
export const matchesApi = {
  getTeamMatches: async (teamId: string, limit = 10) => {
    const res = await fetch(`${API_BASE_URL}/api/teams/${teamId}/matches?limit=${limit}`);
    const data = await res.json();
    return data.matches;
  },
  
  getById: async (matchId: string) => {
    const res = await fetch(`${API_BASE_URL}/api/matches/${matchId}`);
    const data = await res.json();
    return data.match;
  },
  
  create: async (teamId: string, matchData: {
    opponent: string;
    sport: string;
    match_date: string;
  }) => {
    const formData = new FormData();
    formData.append('opponent', matchData.opponent);
    formData.append('sport', 'soccer');
    formData.append('match_date', matchData.match_date);
    
    const res = await fetch(`${API_BASE_URL}/api/teams/${teamId}/matches`, {
      method: 'POST',
      body: formData
    });
    return await res.json();
  },
  
  getAnalysis: async (matchId: string) => {
    const res = await fetch(`${API_BASE_URL}/api/matches/${matchId}/analysis`);
    const data = await res.json();
    return data.analysis;
  },
  
  getJob: async (matchId: string) => {
    const res = await fetch(`${API_BASE_URL}/api/matches/${matchId}/job`);
    const data = await res.json();
    return data.job;
  }
};

// Video Upload API (Chunked)
export const uploadApi = {
  uploadChunk: async (
    file: Blob,
    chunkIndex: number,
    totalChunks: number,
    matchId: string,
    teamId: string
  ) => {
    const formData = new FormData();
    formData.append('file', file, `chunk_${chunkIndex}.part`);
    formData.append('chunk_index', chunkIndex.toString());
    formData.append('total_chunks', totalChunks.toString());
    formData.append('match_id', matchId);
    formData.append('team_id', teamId);
    
    const res = await fetch(`${API_BASE_URL}/api/upload/video-chunk`, {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) throw new Error('Chunk upload failed');
    return await res.json();
  },
  
  getUploadStatus: async (matchId: string) => {
    const res = await fetch(`${API_BASE_URL}/api/matches/${matchId}/upload-status`);
    return await res.json();
  }
};

// Jobs API
export const jobsApi = {
  getStatus: async (jobId: string) => {
    const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`);
    const data = await res.json();
    return data.job;
  }
};
```

### 2.2 Create TypeScript Types

**Create: `frontend/types/api.ts`**

```typescript
// Backend API types matching database schema

export interface Team {
  id: string;
  name: string;
  university: 'UOP' | 'UC_CALIFORNIA';
  sport: 'soccer';
  theme_colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  team_id: string;
  name: string;
  position: string;
  jersey_number: number;
  avatar_url?: string;
  stats: {
    goals: number;
    assists: number;
    shots: number;
    passes: number;
    tackles: number;
    rating: number;
    minutes_played: number;
  };
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  team_id: string;
  opponent: string;
  sport: 'soccer';
  match_date: string;
  venue?: string;
  status: 'new' | 'uploading' | 'processing' | 'analyzed' | 'failed';
  video_chunks_uploaded: number;
  video_chunks_total: number;
  upload_status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  upload_started_at?: string;
  upload_completed_at?: string;
  score_home?: number;
  score_away?: number;
  is_home_game: boolean;
  created_at: string;
  updated_at: string;
  jobs?: Job[];
  analyses?: Analysis[];
}

export interface Job {
  id: string;
  match_id: string;
  job_type: 'enhanced_analysis';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  error_message?: string;
  retry_count: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: string;
  match_id: string;
  analysis_type: 'enhanced_analysis';
  video_duration_seconds?: number;
  summary?: string;
  tactical_insights?: string;
  key_moments?: string;
  coaching_recommendations?: string;
  metrics: Record<string, any>;
  events: any[];
  formation: Record<string, any>;
  heatmap_data: Record<string, any>;
  player_stats: Record<string, any>;
  enhanced_video_path?: string;
  created_at: string;
  updated_at: string;
}
```

### 2.3 Create Session Context

**Create: `frontend/contexts/SessionContext.tsx`**

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { teamsApi } from '../lib/api';
import type { Team } from '../types/api';

interface SessionContextType {
  currentTeam: Team | null;
  setCurrentTeam: (team: Team | null) => void;
  teamId: string | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load team from localStorage on mount
  useEffect(() => {
    const loadTeam = async () => {
      const savedTeamId = localStorage.getItem('tactico_team_id');
      if (savedTeamId) {
        try {
          const team = await teamsApi.getById(savedTeamId);
          setCurrentTeam(team);
        } catch (error) {
          console.error('Failed to load saved team:', error);
          localStorage.removeItem('tactico_team_id');
        }
      }
      setIsLoading(false);
    };
    loadTeam();
  }, []);

  // Save team to localStorage when it changes
  useEffect(() => {
    if (currentTeam) {
      localStorage.setItem('tactico_team_id', currentTeam.id);
    } else {
      localStorage.removeItem('tactico_team_id');
    }
  }, [currentTeam]);

  return (
    <SessionContext.Provider value={{
      currentTeam,
      setCurrentTeam,
      teamId: currentTeam?.id || null,
      isLoading
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
};
```

## Phase 3: Video Upload Implementation

### 3.1 Create Chunked Upload Hook

**Create: `frontend/hooks/useChunkedUpload.ts`**

```typescript
import { useState, useCallback } from 'react';
import { uploadApi } from '../lib/api';

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

interface UploadProgress {
  uploadedChunks: number;
  totalChunks: number;
  percentage: number;
  isUploading: boolean;
  isComplete: boolean;
  error: string | null;
}

export const useChunkedUpload = () => {
  const [progress, setProgress] = useState<UploadProgress>({
    uploadedChunks: 0,
    totalChunks: 0,
    percentage: 0,
    isUploading: false,
    isComplete: false,
    error: null
  });

  const uploadVideo = useCallback(async (
    file: File,
    matchId: string,
    teamId: string
  ) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    setProgress({
      uploadedChunks: 0,
      totalChunks,
      percentage: 0,
      isUploading: true,
      isComplete: false,
      error: null
    });

    try {
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          try {
            await uploadApi.uploadChunk(chunk, chunkIndex, totalChunks, matchId, teamId);
            break;
          } catch (error) {
            retries++;
            if (retries === maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          }
        }

        const uploadedChunks = chunkIndex + 1;
        const percentage = Math.round((uploadedChunks / totalChunks) * 100);
        
        setProgress({
          uploadedChunks,
          totalChunks,
          percentage,
          isUploading: true,
          isComplete: false,
          error: null
        });
      }

      setProgress(prev => ({
        ...prev,
        isUploading: false,
        isComplete: true
      }));

      return true;
    } catch (error) {
      setProgress(prev => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }));
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setProgress({
      uploadedChunks: 0,
      totalChunks: 0,
      percentage: 0,
      isUploading: false,
      isComplete: false,
      error: null
    });
  }, []);

  return { progress, uploadVideo, reset };
};
```

### 3.2 Create Job Polling Hook

**Create: `frontend/hooks/useJobPolling.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { matchesApi } from '../lib/api';
import type { Job } from '../types/api';

const POLL_INTERVAL = 2000; // 2 seconds

export const useJobPolling = (matchId: string | null, enabled: boolean = true) => {
  const [job, setJob] = useState<Job | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollJob = useCallback(async () => {
    if (!matchId) return;
    
    try {
      const jobData = await matchesApi.getJob(matchId);
      setJob(jobData);
      
      // Stop polling if job is complete or failed
      if (jobData && ['completed', 'failed', 'cancelled'].includes(jobData.status)) {
        setIsPolling(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job status');
    }
  }, [matchId]);

  useEffect(() => {
    if (!matchId || !enabled) return;

    setIsPolling(true);
    pollJob(); // Initial fetch

    const interval = setInterval(pollJob, POLL_INTERVAL);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [matchId, enabled, pollJob]);

  return { job, isPolling, error, refetch: pollJob };
};
```

## Phase 4: Update Frontend Components

### 4.1 Update SelectionPage to Load Teams

**File: `frontend/components/SelectionPage.tsx`**

- Add team loading logic after university selection
- Fetch teams from backend using `teamsApi.getAll()`
- Filter teams by selected university
- Save selected team to SessionContext
- Update `handleUniversitySelect` to:

  1. Call `teamsApi.getAll()`
  2. Find team matching university
  3. Call `setCurrentTeam(team)` from SessionContext
  4. Navigate to dashboard

### 4.2 Update AddMatch Component

**File: `frontend/components/AddMatch.tsx`**

- Replace simulated upload with real chunked upload
- Step 1: Create match via `matchesApi.create()`
- Step 2: Use `useChunkedUpload` hook for video upload
- Step 3: Use `useJobPolling` hook to monitor enhanced_analysis job
- Step 4: Show completion with link to analysis results
- Remove references to quick_brief and full_analysis
- Only show single "Enhanced Analysis" progress

Key changes:

```typescript
// In Step 1 - Create Match
const handleCreateMatch = async () => {
  const teamId = useSession().teamId;
  const matchResult = await matchesApi.create(teamId, {
    opponent: matchDetails.opponent,
    sport: 'soccer',
    match_date: matchDetails.date.toISOString()
  });
  setMatchId(matchResult.match_id);
  setCurrentStep(2);
};

// In Step 2 - Upload with real chunks
const { progress, uploadVideo } = useChunkedUpload();

const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file && matchId && teamId) {
    await uploadVideo(file, matchId, teamId);
    setCurrentStep(3);
  }
};

// In Step 3 - Poll job status
const { job } = useJobPolling(matchId, currentStep === 3);
```

### 4.3 Update Dashboard Component

**File: `frontend/components/Dashboard.tsx`**

- Replace mock data with real API calls
- Use `matchesApi.getTeamMatches(teamId)` to load matches
- Display real match data with status from backend
- Show upload progress for matches in 'uploading' status
- Link to analysis for 'analyzed' matches

### 4.4 Update PastGames Component

**File: `frontend/components/PastGames.tsx`**

- Load matches using `matchesApi.getTeamMatches(teamId)`
- Display job status and progress for each match
- Add polling for active jobs using `useJobPolling`
- Show "Analyzing..." status with progress bar
- Enable video playback only for analyzed matches

### 4.5 Update MyTeam Component

**File: `frontend/components/MyTeam.tsx`**

- Load players using `playersApi.getTeamPlayers(teamId)`
- Implement real create player via `playersApi.create()`
- Update stats display to use backend player stats structure
- Map backend stats to frontend display:
  - `stats.goals` → Goals
  - `stats.assists` → Assists  
  - `stats.rating` → Rating

## Phase 5: Environment Configuration

### 5.1 Backend Environment Setup

**Create: `backend/.env`**

```env
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
ANALYSIS_DEVICE=cuda
API_PORT=8000
```

### 5.2 Frontend Environment Setup

**Create: `frontend/.env`**

```env
VITE_API_URL=http://localhost:8000
```

Note: Vite proxy is already configured in `vite.config.ts` (line 66-72)

### 5.3 Update App.tsx with SessionProvider

**File: `frontend/App.tsx`**

- Wrap `ThemeProvider` with `SessionProvider`
- Import and use session context
```typescript
import { SessionProvider } from './contexts/SessionContext';

export default function App() {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SessionProvider>
  );
}
```


## Phase 6: Testing & Validation

### 6.1 Backend Validation

1. Apply database schema: Run `migrations/MAIN_SCHEMA.sql` in Supabase SQL Editor
2. Start backend: `cd backend && uvicorn main:app --reload`
3. Test endpoints: Visit `http://localhost:8000/docs`
4. Verify job processor is running (check console logs)

### 6.2 Frontend Validation

1. Install dependencies: `cd frontend && npm install`
2. Start dev server: `npm run dev`
3. Test flow:

   - Select university → Verify team loaded
   - Create match → Verify match created in DB
   - Upload video → Monitor chunk progress
   - Wait for analysis → Poll job status
   - View results → Display analysis data

### 6.3 Integration Tests

- Upload a small test video (< 50MB)
- Verify chunks upload sequentially
- Confirm enhanced_analysis job triggers automatically
- Check progress updates every 2 seconds
- Validate analysis results display correctly

## Success Criteria

- Backend runs without basketball/quick_brief references
- Frontend successfully creates matches via API
- Chunked upload works with real-time progress
- Job polling updates UI every 2 seconds
- Analysis results display from backend
- Only soccer and enhanced_analysis supported
- No build errors or TypeScript issues

### To-dos

- [ ] Remove basketball and quick_brief/full_analysis from backend (main.py, job_processor.py, video_processor.py)
- [ ] Create frontend/lib/api.ts with all backend API methods
- [ ] Create frontend/types/api.ts with Team, Player, Match, Job, Analysis interfaces
- [ ] Create frontend/contexts/SessionContext.tsx for team management
- [ ] Create frontend/hooks/useChunkedUpload.ts for 10MB chunk uploads with retry
- [ ] Create frontend/hooks/useJobPolling.ts for 2-second job status polling
- [ ] Update SelectionPage.tsx to load teams from backend and save to session
- [ ] Update AddMatch.tsx to use real API for match creation, chunked upload, and job polling
- [ ] Update Dashboard.tsx to load matches from backend API
- [ ] Update PastGames.tsx to display real matches with job status polling
- [ ] Update MyTeam.tsx to use backend API for player CRUD operations
- [ ] Create backend/.env and frontend/.env with proper configuration
- [ ] Wrap App.tsx with SessionProvider for team context
- [ ] Test complete flow: university selection → match creation → video upload → analysis polling → results display