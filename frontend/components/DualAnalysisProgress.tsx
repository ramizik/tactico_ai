import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

interface AnalysisJobStatus {
    job_id: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    error?: string;
    updated_at: string;
    started_at?: string;
    completed_at?: string;
    has_results?: boolean;
    analysis_id?: string;
}

interface AnalysisStatusResponse {
    preview: AnalysisJobStatus | null;
    full: AnalysisJobStatus | null;
}

interface DualAnalysisProgressProps {
    matchId: string;
    onPreviewComplete?: () => void;
    onFullComplete?: () => void;
}

const DualAnalysisProgress: React.FC<DualAnalysisProgressProps> = ({
    matchId,
    onPreviewComplete,
    onFullComplete,
}) => {
    const [status, setStatus] = useState<AnalysisStatusResponse>({
        preview: null,
        full: null,
    });
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

                const data: AnalysisStatusResponse = await response.json();
                setStatus(data);

                // Trigger callbacks when analyses complete
                if (data.preview?.status === 'completed' && onPreviewComplete) {
                    onPreviewComplete();
                }
                if (data.full?.status === 'completed' && onFullComplete) {
                    onFullComplete();
                }

                // Stop polling if both are completed or failed
                if (
                    data.preview?.status &&
                    ['completed', 'failed', 'cancelled'].includes(data.preview.status) &&
                    data.full?.status &&
                    ['completed', 'failed', 'cancelled'].includes(data.full.status)
                ) {
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
    }, [matchId, isPolling, onPreviewComplete, onFullComplete]);

    const getStatusIcon = (jobStatus: AnalysisJobStatus | null) => {
        if (!jobStatus) {
            return <Clock className="h-5 w-5 text-gray-400" />;
        }

        switch (jobStatus.status) {
            case 'completed':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'running':
            case 'queued':
                return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
            case 'failed':
            case 'cancelled':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Clock className="h-5 w-5 text-gray-400" />;
        }
    };

    const getStatusText = (jobStatus: AnalysisJobStatus | null) => {
        if (!jobStatus) return 'Not started';

        switch (jobStatus.status) {
            case 'queued':
                return 'Queued for processing...';
            case 'running':
                return `Processing... ${jobStatus.progress}%`;
            case 'completed':
                return 'Completed';
            case 'failed':
                return `Failed: ${jobStatus.error || 'Unknown error'}`;
            case 'cancelled':
                return 'Cancelled';
            default:
                return 'Unknown status';
        }
    };

    return (
        <div className="space-y-4">
            {/* Preview Analysis Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            {getStatusIcon(status.preview)}
                            Quick Preview (5 minutes)
                        </span>
                        {status.preview?.status === 'completed' && (
                            <Button
                                size="sm"
                                onClick={() => {
                                    // Navigate to preview results
                                    window.location.href = `/matches/${matchId}/preview-analysis`;
                                }}
                            >
                                View Preview Results
                            </Button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Progress value={status.preview?.progress || 0} className="h-2" />
                    <p className="text-sm text-gray-600">
                        {getStatusText(status.preview)}
                    </p>
                    {status.preview?.status === 'running' && (
                        <p className="text-xs text-gray-500">
                            Get quick tactical insights in 1-2 minutes
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Full Analysis Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            {getStatusIcon(status.full)}
                            Full Analysis (90 minutes)
                        </span>
                        {status.full?.status === 'completed' && (
                            <Button
                                size="sm"
                                onClick={() => {
                                    // Navigate to full results
                                    window.location.href = `/matches/${matchId}/analysis`;
                                }}
                            >
                                View Full Results
                            </Button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Progress value={status.full?.progress || 0} className="h-2" />
                    <p className="text-sm text-gray-600">{getStatusText(status.full)}</p>
                    {status.full?.status === 'running' && (
                        <p className="text-xs text-gray-500">
                            Complete analysis with detailed player tracking (15-30 minutes)
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Info Message */}
            {(status.preview?.status === 'running' || status.full?.status === 'running') && (
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

export default DualAnalysisProgress;
