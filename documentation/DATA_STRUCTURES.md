# TacticoAI Data Structures & API Documentation

This document outlines all data structures, API endpoints, and data exchange patterns identified from the frontend application.

## Application Overview

TacticoAI is a sports tactical analysis platform with the following main flows:
- **University & Sport Selection** → **Dashboard** → **Match Management** → **AI Analysis** → **Team Management**

## Core Data Models

### 1. User & Team Context

```typescript
// University and Sport Selection
type University = 'UOP' | 'UC_CALIFORNIA' | null;
type Sport = 'FOOTBALL' | null;

// Theme Configuration
interface Theme {
  primary: string;      // University primary color
  secondary: string;    // University secondary color
  accent: string;       // Sport-specific accent color
  gradientFrom: string; // Background gradient start
  gradientTo: string;   // Background gradient end
}
```

### 2. Match Data Structures

```typescript
// Match Information
interface Match {
  id: number;
  date: string;           // Format: 'Oct 15, 2025'
  team1: string;          // Home team name
  team2: string;          // Away team name
  score: string;          // Format: '3-2'
  thumbnail: string;       // Match thumbnail URL
  videoUrl?: string;      // Video file URL
  status: 'completed' | 'pending' | 'analyzing';
}

// Match Creation Request
interface MatchDetails {
  opponent: string;        // Opponent team name
  date: Date;             // Match date
  sport: 'FOOTBALL';      // Always Football
}

// Upload Status Tracking
interface UploadStatus {
  fileName: string;
  progress: number;        // 0-100
  speed: string;          // e.g., '50 MB/s'
  eta: string;            // e.g., '0:10'
}

// Analysis Progress Tracking
interface AnalysisStatus {
  quickBrief: 'queued' | 'running' | 'completed' | 'failed';
  quickBriefProgress: number;    // 0-100
  fullAnalysis: 'queued' | 'running' | 'completed' | 'failed';
  fullAnalysisProgress: number;  // 0-100
  overallProgress: number;       // 0-100
}
```

### 3. Player & Team Management

```typescript
// Player Information
interface Player {
  id: number;
  name: string;
  position: string;       // Football positions (Goalkeeper, Defender, Midfielder, Forward)
  number: number;         // Jersey number
  stats: {
    goals: number;
    assists: number;
    rating: number;       // Performance rating
  };
  avatar: string;         // Profile image URL
}

// Team Statistics
interface TeamStats {
  leaguePosition: number;
  averageRating: number;
  activePlayers: number;
  winRate: number;
  offenseRating: number;
  defenseRating: number;
}
```

### 4. AI Chat System

```typescript
// Chat Messages
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

// Chat Session
interface ChatSession {
  sessionId: string;
  matchInfo?: string;     // Context about current match
  messages: Message[];
}
```

## API Endpoints & Data Flows

### 1. University & Sport Selection

**Data Flow:** User selects university and sport → Theme updates → Navigation to dashboard

**No API calls required** - handled by React Context state management.

### 2. Dashboard Data

**Required API Endpoints:**

```typescript
// GET /api/dashboard
interface DashboardData {
  recentMatches: Match[];
  teamStats: TeamStats;
  performanceMetrics: {
    winRate: number;
    offense: number;
    defense: number;
  };
}
```

**Data Exchange:**
- **Request:** `GET /api/dashboard?teamId={teamId}`
- **Response:** Dashboard data with recent matches and team statistics
- **Frequency:** On page load, refresh on navigation

### 3. Match Management

#### 3.1 Past Games

**Required API Endpoints:**

```typescript
// GET /api/matches
interface MatchesResponse {
  matches: Match[];
  totalCount: number;
  hasMore: boolean;
}

// GET /api/matches/{matchId}/video
interface VideoResponse {
  videoUrl: string;
  thumbnail: string;
  duration: number;
}
```

**Data Exchange:**
- **Request:** `GET /api/matches?teamId={teamId}&limit=10&offset=0`
- **Response:** List of past matches with metadata
- **Video Loading:** `GET /api/matches/{matchId}/video` for video playback

#### 3.2 Add New Match

**Required API Endpoints:**

```typescript
// POST /api/matches
interface CreateMatchRequest {
  teamId: string;
  opponent: string;
  date: string;           // ISO date string
  sport: 'FOOTBALL';
}

interface CreateMatchResponse {
  matchId: string;
  uploadUrl: string;      // Pre-signed upload URL
  jobId: string;          // Analysis job ID
}

// POST /api/upload/video
interface VideoUploadRequest {
  matchId: string;
  file: File;
}

// GET /api/jobs/{jobId}
interface JobStatusResponse {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: {
    quickBrief: number;
    fullAnalysis: number;
    overall: number;
  };
  results?: {
    quickBrief: string;
    fullAnalysis: object;
  };
}
```

**Data Exchange Flow:**
1. **Create Match:** `POST /api/matches` → Returns matchId and upload URL
2. **Upload Video:** `POST /api/upload/video` → Upload to Supabase Storage
3. **Start Analysis:** `POST /api/matches/{matchId}/analyze` → Start AI processing
4. **Poll Status:** `GET /api/jobs/{jobId}` → Monitor analysis progress
5. **Get Results:** `GET /api/matches/{matchId}/analysis` → Retrieve analysis results

### 4. Team Management

**Required API Endpoints:**

```typescript
// GET /api/teams/{teamId}/players
interface PlayersResponse {
  players: Player[];
  totalCount: number;
}

// POST /api/teams/{teamId}/players
interface AddPlayerRequest {
  name: string;
  position: string;
  number: number;
  goals: number;
  assists: number;
  rating: number;
  avatar?: string;        // Optional image URL
}

// DELETE /api/teams/{teamId}/players/{playerId}
interface DeletePlayerResponse {
  success: boolean;
  message: string;
}

// PUT /api/teams/{teamId}/players/{playerId}
interface UpdatePlayerRequest {
  name?: string;
  position?: string;
  number?: number;
  stats?: {
    goals?: number;
    assists?: number;
    rating?: number;
  };
  avatar?: string;
}
```

**Data Exchange:**
- **Load Players:** `GET /api/teams/{teamId}/players`
- **Add Player:** `POST /api/teams/{teamId}/players` with player data
- **Remove Player:** `DELETE /api/teams/{teamId}/players/{playerId}`
- **Update Player:** `PUT /api/teams/{teamId}/players/{playerId}`

### 5. AI Chat System

**Required API Endpoints:**

```typescript
// POST /api/chat/send
interface SendMessageRequest {
  message: string;
  sessionId: string;
  matchInfo?: string;     // Context about current match
}

interface SendMessageResponse {
  messageId: string;
  response: string;
  timestamp: string;
}

// GET /api/chat/history/{sessionId}
interface ChatHistoryResponse {
  sessionId: string;
  messages: Message[];
  matchContext?: string;
}

// WebSocket: /ws/chat/{sessionId}
interface WebSocketMessage {
  type: 'message' | 'typing' | 'error';
  data: {
    message?: string;
    isTyping?: boolean;
    error?: string;
  };
}
```

**Data Exchange:**
- **Send Message:** `POST /api/chat/send` with message and session context
- **Real-time Updates:** WebSocket connection for streaming responses
- **Chat History:** `GET /api/chat/history/{sessionId}` for session persistence

## Database Schema Requirements

### Core Tables

```sql
-- Users and Teams
users (id, email, university, created_at)
teams (id, name, university, sport, created_at)
team_members (id, team_id, user_id, role, joined_at)

-- Matches
matches (id, team_id, opponent, date, sport, status, created_at)
match_videos (id, match_id, file_url, thumbnail_url, duration, uploaded_at)
match_analysis (id, match_id, job_id, quick_brief, full_analysis, status, created_at)

-- Players
players (id, team_id, name, position, number, goals, assists, rating, avatar_url, created_at)

-- Chat
chat_sessions (id, team_id, match_id, created_at)
chat_messages (id, session_id, sender, message, timestamp)
```

### Storage Requirements

- **Video Files:** Supabase Storage for match videos
- **Player Avatars:** Supabase Storage for profile images
- **Analysis Results:** JSON storage for AI analysis data
- **Chat History:** Relational storage for chat persistence

## Authentication & Authorization

```typescript
// User Authentication
interface AuthUser {
  id: string;
  email: string;
  university: University;
  teamId?: string;
  role: 'coach' | 'player' | 'admin';
}

// API Request Headers
interface ApiHeaders {
  'Authorization': string;    // Bearer token
  'Content-Type': 'application/json';
  'X-Team-ID'?: string;       // Current team context
}
```

## Error Handling & Status Codes

```typescript
// Standard API Response Format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// Common Error Codes
enum ErrorCodes {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  RATE_LIMITED = 'RATE_LIMITED'
}
```

## Real-time Features

### WebSocket Connections

1. **Chat System:** `/ws/chat/{sessionId}` - Real-time chat messages
2. **Analysis Progress:** `/ws/analysis/{jobId}` - Live analysis updates
3. **Team Updates:** `/ws/team/{teamId}` - Player roster changes

### Polling Endpoints

1. **Analysis Status:** `GET /api/jobs/{jobId}` - Check analysis progress
2. **Upload Status:** `GET /api/upload/{uploadId}/status` - Monitor file uploads

## Performance Considerations

### Caching Strategy

- **Dashboard Data:** Cache for 5 minutes
- **Match Lists:** Cache for 1 hour
- **Player Data:** Cache for 30 minutes
- **Analysis Results:** Cache indefinitely

### File Upload Limits

- **Video Files:** Max 1GB, MP4/AVI/MOV formats
- **Image Files:** Max 10MB, JPG/PNG formats
- **Upload Timeout:** 30 minutes for large files

### Rate Limiting

- **API Calls:** 100 requests/minute per user
- **File Uploads:** 5 uploads/hour per team
- **Chat Messages:** 50 messages/minute per session

This documentation provides a comprehensive overview of all data structures and API requirements identified from the frontend application, ready for backend implementation.
