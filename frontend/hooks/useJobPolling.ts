/**
 * Job Polling Hook
 * Polls backend for analysis status updates every 2 seconds
 * Automatically stops polling when analysis completes or fails
 */

import { useCallback, useEffect, useState } from 'react';
import { matchesApi } from '../lib/api';

interface AnalysisStatus {
    job_id?: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'no_job';
    progress: number;
    error?: string;
    updated_at: string;
    started_at?: string;
    completed_at?: string;
    has_results?: boolean;
    analysis_id?: string;
    message?: string;
}

const POLL_INTERVAL = 2000; // 2 seconds

export const useJobPolling = (matchId: string | null, enabled: boolean = true) => {
    const [status, setStatus] = useState<AnalysisStatus | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pollStatus = useCallback(async () => {
        if (!matchId) return;

        try {
            const statusData = await matchesApi.getAnalysisStatus(matchId);
            setStatus(statusData);

            // Stop polling if analysis is complete or failed
            if (['completed', 'failed', 'cancelled'].includes(statusData.status)) {
                setIsPolling(false);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch analysis status');
        }
    }, [matchId]);

    useEffect(() => {
        if (!matchId || !enabled) return;

        setIsPolling(true);
        pollStatus(); // Initial fetch

        const interval = setInterval(pollStatus, POLL_INTERVAL);

        return () => {
            clearInterval(interval);
            setIsPolling(false);
        };
    }, [matchId, enabled, pollStatus]);

    return { status, isPolling, error, refetch: pollStatus };
};
