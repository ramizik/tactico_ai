import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

interface AnalysisJobStatus {
    job_id: string;
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

interface AnalysisProgressProps {
    matchId: string;
    onComplete?: () => void;
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
    matchId,
    onComplete,
}) => {
    const [status, setStatus] = useState<AnalysisJobStatus | null>(null);
    const [isPolling, setIsPolling] = useState(true);

    useEffect(() => {
        if (!matchId || !isPolling) return;

        const fetchStatus = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/matches/${matchId}/analysis-status`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch analysis status');
                }

                const data: AnalysisJobStatus = await response.json();
                setStatus(data);

                // Trigger callback when analysis completes
                if (data.status === 'completed' && onComplete) {
                    onComplete();
                }

                // Stop polling if analysis is complete or failed
                if (['completed', 'failed', 'cancelled'].includes(data.status)) {
                    setIsPolling(false);
                }
            } catch (error) {
                console.error('Error fetching analysis status:', error);
            }
        };

        // Initial fetch
        fetchStatus();

        // Set up polling interval
        const interval = setInterval(fetchStatus, 2000); // Poll every 2 seconds

        return () => clearInterval(interval);
    }, [matchId, isPolling, onComplete]);

    const getStatusIcon = () => {
        if (!status) {
            return <Clock className="h-5 w-5 text-gray-400" />;
        }

        switch (status.status) {
            case 'completed':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'running':
            case 'queued':
                return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
            case 'failed':
            case 'cancelled':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            case 'no_job':
                return <Clock className="h-5 w-5 text-gray-400" />;
            default:
                return <Clock className="h-5 w-5 text-gray-400" />;
        }
    };

    const getStatusText = () => {
        if (!status) return 'Checking status...';

        switch (status.status) {
            case 'no_job':
                return status.message || 'No analysis job found';
            case 'queued':
                return 'Queued for processing...';
            case 'running':
                return `Processing... ${status.progress}%`;
            case 'completed':
                return 'Analysis completed';
            case 'failed':
                return `Failed: ${status.error || 'Unknown error'}`;
            case 'cancelled':
                return 'Analysis cancelled';
            default:
                return 'Unknown status';
        }
    };

    const getProgressValue = () => {
        if (!status) return 0;
        return status.status === 'no_job' ? 0 : status.progress;
    };

    return (
        <div className="space-y-4">
            {/* Analysis Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {getStatusIcon()}
                        Video Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Progress value={getProgressValue()} className="h-2" />
                    <p className="text-sm text-gray-600">
                        {getStatusText()}
                    </p>
                    {status?.status === 'running' && (
                        <p className="text-xs text-gray-500">
                            Comprehensive analysis with player tracking, team assignment, and tactical insights
                        </p>
                    )}
                    {status?.status === 'no_job' && (
                        <p className="text-xs text-gray-500">
                            Upload your video to start analysis
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Info Message */}
            {status?.status === 'running' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        💡 You can navigate away from this page. Analysis will continue in the background,
                        and you can return anytime to check progress.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AnalysisProgress;
