/**
 * API Client for TacticoAI Backend Integration
 * Provides typed methods for all backend REST endpoints
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

// Teams API
export const teamsApi = {
    getAll: async () => {
        const res = await fetch(`${API_BASE_URL}/api/teams`);
        if (!res.ok) throw new Error('Failed to fetch teams');
        const data = await res.json();
        return data.teams;
    },

    getById: async (teamId: string) => {
        const res = await fetch(`${API_BASE_URL}/api/teams/${teamId}`);
        if (!res.ok) throw new Error('Failed to fetch team');
        const data = await res.json();
        return data.team;
    }
};

// Players API
export const playersApi = {
    getTeamPlayers: async (teamId: string) => {
        const res = await fetch(`${API_BASE_URL}/api/teams/${teamId}/players`);
        if (!res.ok) throw new Error('Failed to fetch players');
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

        if (!res.ok) throw new Error('Failed to create player');
        const data = await res.json();
        return data.player;
    }
};

// Matches API
export const matchesApi = {
    getTeamMatches: async (teamId: string, limit = 10) => {
        const res = await fetch(`${API_BASE_URL}/api/teams/${teamId}/matches?limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch matches');
        const data = await res.json();
        return data.matches;
    },

    getById: async (matchId: string) => {
        const res = await fetch(`${API_BASE_URL}/api/matches/${matchId}`);
        if (!res.ok) throw new Error('Failed to fetch match');
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

        if (!res.ok) throw new Error('Failed to create match');
        return await res.json();
    },

    getAnalysis: async (matchId: string) => {
        const res = await fetch(`${API_BASE_URL}/api/matches/${matchId}/analysis`);
        if (!res.ok) throw new Error('Failed to fetch analysis');
        const data = await res.json();
        return data.analysis;
    },

    getAnalysisStatus: async (matchId: string) => {
        const res = await fetch(`${API_BASE_URL}/api/matches/${matchId}/analysis-status`);
        if (!res.ok) throw new Error('Failed to fetch analysis status');
        return await res.json();
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
        if (!res.ok) throw new Error('Failed to fetch upload status');
        return await res.json();
    }
};

// Jobs API
export const jobsApi = {
    getStatus: async (jobId: string) => {
        const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`);
        if (!res.ok) throw new Error('Failed to fetch job status');
        const data = await res.json();
        return data.job;
    }
};
