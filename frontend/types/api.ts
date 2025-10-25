/**
 * Backend API Types
 * TypeScript interfaces matching the database schema and API responses
 */

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
