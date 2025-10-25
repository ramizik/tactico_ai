/**
 * AddMatch - 4-Step User Flow Component
 * Handles the complete flow for adding a new match with video upload and analysis tracking.
 *
 * Steps:
 * 1. Details - Enter match information (opponent, date) - Sport is always Football
 * 2. Upload - Upload video file with progress tracking
 * 3. Analysis - Monitor AI analysis progress (quick brief + full analysis)
 * 4. Complete - Success screen with actions
 *
 * BACKEND_HOOK:
 * - Step 1: POST /api/matches { teamId, opponent, date, sport: 'Football' }
 * - Step 2: Upload to Supabase Storage, POST video reference
 * - Step 3: Poll GET /api/jobs/:jobId for analysis status
 * - Step 4: Redirect to match detail or dashboard
 */

import { AlertCircle, ArrowLeft, Calendar as CalendarIcon, Check, CheckCircle2, Clock, Loader2, Upload as UploadIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Progress } from './ui/progress';

interface AddMatchProps {
  onBack: () => void;
  onComplete: () => void;
  backButtonText?: string;
}

type Step = 1 | 2 | 3 | 4;

interface MatchDetails {
  opponent: string;
  date: Date | null;
}

interface UploadStatus {
  fileName: string;
  progress: number;
  speed: string;
  eta: string;
}

interface AnalysisStatus {
  quickBrief: 'queued' | 'running' | 'completed' | 'failed';
  quickBriefProgress: number;
  fullAnalysis: 'queued' | 'running' | 'completed' | 'failed';
  fullAnalysisProgress: number;
  overallProgress: number;
}

export const AddMatch = ({ onBack, onComplete, backButtonText = 'Back to Dashboard' }: AddMatchProps) => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [matchDetails, setMatchDetails] = useState<MatchDetails>({
    opponent: '',
    date: null,
  });
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>({
    quickBrief: 'queued',
    quickBriefProgress: 0,
    fullAnalysis: 'queued',
    fullAnalysisProgress: 0,
    overallProgress: 0,
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Success/Progress color (bright green)
  const successColor = '#22c55e';

  // Step 2: Simulate upload progress
  useEffect(() => {
    if (uploadStatus && uploadStatus.progress < 100) {
      const timer = setTimeout(() => {
        const newProgress = Math.min(uploadStatus.progress + 10, 100);
        const eta = Math.max(0, Math.floor((100 - newProgress) / 10));
        setUploadStatus({
          ...uploadStatus,
          progress: newProgress,
          eta: `0:${eta.toString().padStart(2, '0')}`,
        });

        // When upload completes, move to analysis
        if (newProgress === 100) {
          setTimeout(() => {
            setCurrentStep(3);
          }, 500);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [uploadStatus]);

  // Step 3: Simulate analysis progress
  useEffect(() => {
    if (currentStep === 3) {
      // Start quick brief analysis
      const quickBriefTimer = setTimeout(() => {
        setAnalysisStatus((prev) => ({ ...prev, quickBrief: 'running' }));
      }, 1000);

      // Simulate quick brief progress
      const progressTimer = setInterval(() => {
        setAnalysisStatus((prev) => {
          if (prev.quickBrief === 'running' && prev.quickBriefProgress < 100) {
            const newProgress = Math.min(prev.quickBriefProgress + 5, 100);
            return {
              ...prev,
              quickBriefProgress: newProgress,
              overallProgress: Math.floor(newProgress / 2),
            };
          }
          if (prev.quickBriefProgress === 100 && prev.quickBrief === 'running') {
            return {
              ...prev,
              quickBrief: 'completed',
              fullAnalysis: 'running',
            };
          }
          if (prev.fullAnalysis === 'running' && prev.fullAnalysisProgress < 100) {
            const newProgress = Math.min(prev.fullAnalysisProgress + 3, 100);
            return {
              ...prev,
              fullAnalysisProgress: newProgress,
              overallProgress: Math.floor(50 + newProgress / 2),
            };
          }
          if (prev.fullAnalysisProgress === 100 && prev.fullAnalysis === 'running') {
            setTimeout(() => setCurrentStep(4), 1000);
            return {
              ...prev,
              fullAnalysis: 'completed',
              overallProgress: 100,
            };
          }
          return prev;
        });
      }, 300);

      return () => {
        clearTimeout(quickBriefTimer);
        clearInterval(progressTimer);
      };
    }
  }, [currentStep]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // BACKEND_HOOK: Upload to Supabase Storage
      setUploadStatus({
        fileName: file.name,
        progress: 0,
        speed: '50 MB/s',
        eta: '0:10',
      });
    }
  };

  const handleCreateMatch = () => {
    // BACKEND_HOOK: POST /api/matches { teamId, opponent, date, sport: 'Football' }
    setCurrentStep(2);
  };

  const getStatusBadge = (status: 'queued' | 'running' | 'completed' | 'failed', progress?: number) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-sm" style={{ color: successColor }}>
            <CheckCircle2 className="w-4 h-4" />
            <span style={{ fontWeight: 700 }}>COMPLETED</span>
          </div>
        );
      case 'running':
        return (
          <div className="flex items-center gap-2 text-sm" style={{ color: theme.primary }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span style={{ fontWeight: 700 }}>RUNNING {progress}%</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span style={{ fontWeight: 700 }}>FAILED</span>
          </div>
        );
      case 'queued':
      default:
        return (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span style={{ fontWeight: 700 }}>QUEUED</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen px-6 md:px-12 pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-8 transition-colors hover:opacity-80"
          style={{ fontWeight: 700, color: '#ffffff' }}
        >
          <ArrowLeft className="w-5 h-5" />
          {backButtonText}
        </button>

        {/* Step Navigation */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Details' },
              { num: 2, label: 'Upload' },
              { num: 3, label: 'Analysis' },
              { num: 4, label: 'Complete' },
            ].map((step, index) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  {/* Circle */}
                  <div
                    className="w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all mb-2"
                    style={{
                      borderColor: currentStep >= step.num ? successColor : '#d1d5db',
                      backgroundColor: currentStep >= step.num ? successColor : 'white',
                      color: currentStep >= step.num ? 'white' : '#6b7280',
                      fontWeight: 900,
                      fontSize: '1.125rem',
                    }}
                  >
                    {currentStep > step.num ? <Check className="w-6 h-6" /> : step.num}
                  </div>
                  {/* Label */}
                  <div
                    style={{
                      fontWeight: currentStep === step.num ? 800 : 600,
                      color: currentStep >= step.num ? '#111827' : '#ffffff',
                    }}
                  >
                    {step.label}
                  </div>
                </div>
                {/* Connector Line */}
                {index < 3 && (
                  <div
                    className="h-1 flex-1 mx-2 -mt-8"
                    style={{
                      backgroundColor: currentStep > step.num ? successColor : '#d1d5db',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <div className="bg-white border-4 p-8" style={{ borderColor: theme.accent }}>
            <h2
              className="mb-3"
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: theme.secondary,
              }}
            >
              Match Details
            </h2>
            <p className="mb-8" style={{ color: '#6b7280' }}>Enter the match details to get started.</p>

            <div className="space-y-6">
              {/* Opponent Team */}
              <div>
                <Label htmlFor="opponent" style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  Opponent Team
                </Label>
                <Input
                  id="opponent"
                  placeholder="e.g., Stanford Cardinals"
                  value={matchDetails.opponent}
                  onChange={(e) => setMatchDetails({ ...matchDetails, opponent: e.target.value })}
                  className="mt-2 border-2"
                  style={{ borderColor: theme.accent }}
                />
              </div>

              {/* Match Date */}
              <div>
                <Label style={{ fontWeight: 700, fontSize: '0.875rem' }}>Match Date</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="w-full mt-2 flex items-center justify-start gap-2 border-2 bg-white px-4 py-2 rounded-md transition-colors hover:bg-gray-50"
                      style={{ borderColor: theme.accent, fontWeight: 600 }}
                    >
                      <CalendarIcon className="w-4 h-4" style={{ color: matchDetails.date ? 'inherit' : '#9ca3af' }} />
                      <span style={{ color: matchDetails.date ? 'inherit' : '#9ca3af' }}>
                        {matchDetails.date
                          ? matchDetails.date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                          : 'Select a date'}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={matchDetails.date || undefined}
                      onSelect={(date: Date | undefined) => {
                        setMatchDetails({ ...matchDetails, date: date || null });
                        setCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button
              onClick={handleCreateMatch}
              disabled={!matchDetails.opponent || !matchDetails.date}
              className="w-full mt-8 py-6 text-white border-4 transition-all hover:scale-105"
              style={{
                backgroundColor: theme.primary,
                borderColor: theme.secondary,
                fontWeight: 800,
                fontSize: '1.125rem',
              }}
            >
              Create Match & Continue
            </Button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white border-4 p-8" style={{ borderColor: theme.accent }}>
            <h2
              className="mb-3"
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: theme.secondary,
              }}
            >
              Upload Video
            </h2>
            <p className="mb-8" style={{ color: '#6b7280' }}>
              Upload your match video for analysis. The system will automatically analyze the first 3 minutes for a
              quick brief, then process the full video.
            </p>

            {!uploadStatus ? (
              <label className="block">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="video-upload-input"
                />
                <div
                  className="border-4 border-dashed p-16 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: theme.accent }}
                >
                  <UploadIcon className="w-16 h-16 mb-4" style={{ color: theme.primary }} />
                  <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                    Select Video File
                  </div>
                  <div style={{ color: '#6b7280' }}>Max file size: 1 GB</div>
                </div>
              </label>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ fontWeight: 700 }}>{uploadStatus.fileName}</span>
                    <span style={{ color: '#6b7280' }}>
                      {uploadStatus.speed} • ETA {uploadStatus.eta}
                    </span>
                  </div>
                  <Progress value={uploadStatus.progress} className="h-4" style={{ backgroundColor: '#e5e7eb' }}>
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${uploadStatus.progress}%`,
                        backgroundColor: successColor,
                      }}
                    />
                  </Progress>
                  <div className="text-right mt-2" style={{ fontWeight: 700, color: successColor }}>
                    {uploadStatus.progress}%
                  </div>
                </div>

                {uploadStatus.progress > 0 && (
                  <div
                    className="p-4 border-l-4 bg-green-50"
                    style={{ borderColor: successColor }}
                  >
                    <div className="flex items-center gap-2" style={{ color: successColor, fontWeight: 700 }}>
                      <CheckCircle2 className="w-5 h-5" />
                      Quick Brief Analysis Started
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="bg-white border-4 p-8" style={{ borderColor: theme.accent }}>
            <h2
              className="mb-3"
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: theme.secondary,
              }}
            >
              Analysis in Progress
            </h2>
            <p className="mb-8" style={{ color: '#6b7280' }}>
              Our AI is analyzing your match video. This may take a few minutes.
            </p>

            {/* Overall Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke={successColor}
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - analysisStatus.overallProgress / 100)}`}
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: theme.secondary }}>
                      {analysisStatus.overallProgress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Process Cards */}
            <div className="space-y-4">
              {/* Quick Brief Analysis */}
              <div
                className="border-4 p-6"
                style={{ borderColor: analysisStatus.quickBrief === 'completed' ? successColor : theme.accent }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span style={{ fontWeight: 800, fontSize: '1.125rem' }}>Quick Brief Analysis</span>
                  {getStatusBadge(analysisStatus.quickBrief, analysisStatus.quickBriefProgress)}
                </div>
                {analysisStatus.quickBrief === 'running' && (
                  <Progress value={analysisStatus.quickBriefProgress} className="h-3">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${analysisStatus.quickBriefProgress}%`,
                        backgroundColor: successColor,
                      }}
                    />
                  </Progress>
                )}
              </div>

              {/* Full Analysis */}
              <div
                className="border-4 p-6"
                style={{ borderColor: analysisStatus.fullAnalysis === 'completed' ? successColor : theme.accent }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span style={{ fontWeight: 800, fontSize: '1.125rem' }}>Full Analysis</span>
                  {getStatusBadge(analysisStatus.fullAnalysis, analysisStatus.fullAnalysisProgress)}
                </div>
                {analysisStatus.fullAnalysis === 'running' && (
                  <Progress value={analysisStatus.fullAnalysisProgress} className="h-3">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${analysisStatus.fullAnalysisProgress}%`,
                        backgroundColor: successColor,
                      }}
                    />
                  </Progress>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="bg-white border-4 p-12 text-center" style={{ borderColor: theme.accent }}>
            <div
              className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ backgroundColor: successColor }}
            >
              <Check className="w-12 h-12 text-white" />
            </div>

            <h2
              className="mb-4"
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: theme.secondary,
              }}
            >
              Analysis Complete
            </h2>

            <p className="mb-8" style={{ fontSize: '1.125rem', color: '#ffffff' }}>
              Your match has been successfully analyzed.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={onComplete}
                className="px-8 py-6 text-white border-4 transition-all hover:scale-105"
                style={{
                  backgroundColor: theme.primary,
                  borderColor: theme.secondary,
                  fontWeight: 800,
                  fontSize: '1.125rem',
                }}
              >
                View Results
              </Button>
              <Button
                onClick={() => {
                  setCurrentStep(1);
                  setMatchDetails({ opponent: '', date: null });
                  setUploadStatus(null);
                  setAnalysisStatus({
                    quickBrief: 'queued',
                    quickBriefProgress: 0,
                    fullAnalysis: 'queued',
                    fullAnalysisProgress: 0,
                    overallProgress: 0,
                  });
                }}
                variant="outline"
                className="px-8 py-6 border-4 transition-all hover:scale-105"
                style={{
                  borderColor: theme.accent,
                  fontWeight: 800,
                  fontSize: '1.125rem',
                }}
              >
                Add Another Match
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
