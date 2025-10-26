/**
 * AddMatch - 4-Step User Flow Component
 * Handles the complete flow for adding a new match with video upload and analysis tracking.
 *
 * Steps:
 * 1. Details - Enter match information (opponent, date) - Sport is always Football
 * 2. Upload - Upload video file with chunked upload (10MB chunks)
 * 3. Analysis - Monitor AI enhanced analysis progress
 * 4. Complete - Success screen with actions
 *
 * BACKEND INTEGRATION:
 * - Step 1: POST /api/teams/{teamId}/matches - Create match record
 * - Step 2: POST /api/upload/video-chunk (chunked upload) - Upload video in 10MB chunks
 * - Step 3: Poll GET /api/matches/{matchId}/job - Monitor enhanced_analysis job status
 * - Step 4: Redirect to match detail or dashboard
 */

import { AlertCircle, ArrowLeft, Calendar as CalendarIcon, Check, CheckCircle2, Clock, Loader2, Upload as UploadIcon } from 'lucide-react';
import { useState } from 'react';
import { useSession } from '../contexts/SessionContext';
import { useTheme } from '../contexts/ThemeContext';
import { useChunkedUpload } from '../hooks/useChunkedUpload';
import { useJobPolling } from '../hooks/useJobPolling';
import { matchesApi } from '../lib/api';
import AnalysisProgress from './AnalysisProgress';
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

export const AddMatch = ({ onBack, onComplete, backButtonText = 'Back to Dashboard' }: AddMatchProps) => {
  const { theme } = useTheme();
  const { teamId } = useSession();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [matchDetails, setMatchDetails] = useState<MatchDetails>({
    opponent: '',
    date: null,
  });
  const [matchId, setMatchId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Chunked upload hook
  const { progress: uploadProgress, uploadVideo, reset: resetUpload } = useChunkedUpload();

  // Job polling hook (only enabled in step 3)
  const { job } = useJobPolling(matchId, currentStep === 3);

  // Success/Progress color (bright green)
  const successColor = '#22c55e';

  // Step 1: Create match in backend
  const handleCreateMatch = async () => {
    if (!teamId) {
      setError('No team selected. Please go back and select a university.');
      return;
    }

    if (!matchDetails.opponent || !matchDetails.date) {
      setError('Please fill in all match details.');
      return;
    }

    try {
      setError(null);
      const matchResult = await matchesApi.create(teamId, {
        opponent: matchDetails.opponent,
        sport: 'soccer',
        match_date: matchDetails.date.toISOString()
      });

      setMatchId(matchResult.match_id);
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create match');
    }
  };

  // Step 2: Handle file selection and upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    if (matchId && teamId) {
      const success = await uploadVideo(file, matchId, teamId);
      if (success) {
        // Upload complete, move to analysis step
        setTimeout(() => {
          setCurrentStep(3);
        }, 500);
      }
    }
  };

  // Step 3: Monitor job progress - handled by AnalysisProgress component
  // When analysis completes, move to step 4
  const handleAnalysisComplete = () => {
    if (currentStep === 3) {
      setTimeout(() => {
        setCurrentStep(4);
      }, 1000);
    }
  };

  const getStatusBadge = (status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled', progress?: number) => {
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

            {error && (
              <div className="mb-6 p-4 border-l-4 bg-red-50 border-red-500">
                <div className="flex items-center gap-2 text-red-600" style={{ fontWeight: 700 }}>
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              </div>
            )}

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
              Upload your match video for AI analysis. Video will be uploaded in 10MB chunks.
            </p>

            {!uploadProgress.isUploading && !uploadProgress.isComplete ? (
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
                  <div style={{ color: '#6b7280' }}>Supported formats: MP4, MOV, AVI</div>
                </div>
              </label>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ fontWeight: 700 }}>{selectedFile?.name || 'Uploading...'}</span>
                    <span style={{ color: '#6b7280' }}>
                      Chunk {uploadProgress.uploadedChunks} / {uploadProgress.totalChunks}
                    </span>
                  </div>
                  <Progress value={uploadProgress.percentage} className="h-4" style={{ backgroundColor: '#e5e7eb' }}>
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${uploadProgress.percentage}%`,
                        backgroundColor: successColor,
                      }}
                    />
                  </Progress>
                  <div className="text-right mt-2" style={{ fontWeight: 700, color: successColor }}>
                    {uploadProgress.percentage}%
                  </div>
                </div>

                {uploadProgress.error && (
                  <div className="p-4 border-l-4 bg-red-50 border-red-500">
                    <div className="flex items-center gap-2 text-red-600" style={{ fontWeight: 700 }}>
                      <AlertCircle className="w-5 h-5" />
                      Upload failed: {uploadProgress.error}
                    </div>
                  </div>
                )}

                {uploadProgress.isComplete && (
                  <div
                    className="p-4 border-l-4 bg-green-50"
                    style={{ borderColor: successColor }}
                  >
                    <div className="flex items-center gap-2" style={{ color: successColor, fontWeight: 700 }}>
                      <CheckCircle2 className="w-5 h-5" />
                      Upload complete! Starting enhanced analysis...
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
              Our AI is performing comprehensive video analysis with player tracking, team assignment, and tactical insights.
            </p>

            {matchId && (
              <AnalysisProgress
                matchId={matchId}
                onComplete={handleAnalysisComplete}
              />
            )}

            {!matchId && (
              <div className="p-8 text-center text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Initializing analysis...</p>
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className="bg-white border-4 p-8" style={{ borderColor: theme.accent }}>
            <div className="max-w-6xl mx-auto">
              {/* Success Header */}
              <div className="text-center mb-8">
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

                <p className="mb-4" style={{ fontSize: '1.125rem', color: theme.secondary }}>
                  Your match has been successfully analyzed with AI-powered player tracking.
                </p>
              </div>

              {/* Video Player Section */}
              {matchId && (
                <div className="mb-8">
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-xl font-bold mb-4" style={{ color: theme.secondary }}>
                      Processed Match Video
                    </h3>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                      <video
                        controls
                        className="w-full h-full"
                        preload="metadata"
                        style={{ maxHeight: '600px' }}
                      >
                        <source
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/matches/${matchId}/processed-video`}
                          type="video/mp4"
                        />
                        <source
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/matches/${matchId}/processed-video`}
                          type="video/webm"
                        />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>

                  {/* Analysis Features Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: `${theme.primary}15` }}>
                      <div className="text-2xl mb-2">🎯</div>
                      <h4 className="font-bold mb-1" style={{ color: theme.primary }}>Player Tracking</h4>
                      <p className="text-sm" style={{ color: theme.secondary }}>Real-time position tracking</p>
                    </div>
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: `${theme.primary}15` }}>
                      <div className="text-2xl mb-2">👥</div>
                      <h4 className="font-bold mb-1" style={{ color: theme.primary }}>Team Assignment</h4>
                      <p className="text-sm" style={{ color: theme.secondary }}>Automatic team detection</p>
                    </div>
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: `${theme.primary}15` }}>
                      <div className="text-2xl mb-2">⚽</div>
                      <h4 className="font-bold mb-1" style={{ color: theme.primary }}>Ball Possession</h4>
                      <p className="text-sm" style={{ color: theme.secondary }}>Ownership tracking</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
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
                  Back to Dashboard
                </Button>
                <Button
                  onClick={() => {
                    setCurrentStep(1);
                    setMatchDetails({ opponent: '', date: null });
                    setMatchId(null);
                    setSelectedFile(null);
                    setError(null);
                    resetUpload();
                  }}
                  variant="outline"
                  className="px-8 py-6 border-4 transition-all hover:scale-105"
                  style={{
                    borderColor: theme.accent,
                    fontWeight: 800,
                    fontSize: '1.125rem',
                  }}
                >
                  Analyze Another Match
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
