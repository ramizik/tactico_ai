/**
 * Job Polling Hook
 * Polls backend for job status updates every 2 seconds
 * Automatically stops polling when job completes or fails
 */

import { useCallback, useEffect, useState } from 'react';
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
