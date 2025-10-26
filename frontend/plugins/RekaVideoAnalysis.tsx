import { Upload, Loader2, X, FileText, Volume2, VolumeX } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';

interface RekaVideoAnalysisProps {
  onClose: () => void;
}

export const RekaVideoAnalysis = ({ onClose }: RekaVideoAnalysisProps) => {
  const { theme } = useTheme();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setAnalysisResult(null);
      // Create a preview URL for the video
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create and speak the text
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;
    
    // Try to use a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Natural') ||
      voice.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    // Stop Web Speech API if active
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    // Stop Fish Audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      // Use Fish Audio if available, otherwise Web Speech
      if (audioUrl && audioRef.current) {
        audioRef.current.play().catch(err => {
          console.error('Audio playback failed:', err);
        });
      } else if (analysisResult) {
        speakText(analysisResult);
      }
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setUploadProgress('Uploading video...');

    try {
      // Step 1: Upload video
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const uploadResponse = await fetch('http://localhost:8000/api/reka/upload-demo', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();
      const videoId = uploadData.video_id;
      setUploadedVideoId(videoId);
      
      // Step 2: Wait for indexing and analyze
      setUploadProgress('Processing video... This may take 30-60 seconds...');
      
      // Wait a bit for initial processing
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      setUploadProgress('Analyzing video content...');
      
      const analyzeResponse = await fetch('http://localhost:8000/api/reka/analyze-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          video_id: videoId,
          prompt: `Provide a football commentary for this video. Commentate as if you are a live football broadcaster. Describe the action, the plays, the tactics, player movements, and the overall flow of the game. Be enthusiastic and engaging like a professional football commentator.`
        }),
      });

      if (!analyzeResponse.ok) {
        throw new Error('Analysis failed');
      }

      const analyzeData = await analyzeResponse.json();
      setAnalysisResult(analyzeData.analysis);
      setUploadProgress('');
      
      console.log('Analysis data received:', {
        has_analysis: !!analyzeData.analysis,
        has_audio_url: !!analyzeData.audio_url,
        audio_url: analyzeData.audio_url
      });
      
      // Auto-play video and speech when analysis is ready
      if (analyzeData.analysis && videoUrl) {
        // Trigger video playback and speech
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch(err => {
              console.error('Video autoplay failed:', err);
            });
          }
          
          // Prefer Fish Audio if available, otherwise use Web Speech API
          if (analyzeData.audio_url) {
            // Set audio URL and wait for it to load before playing
            setAudioUrl(analyzeData.audio_url);
            console.log('Fish Audio URL set:', analyzeData.audio_url);
            
            // Use a longer timeout to ensure audio element is loaded
            setTimeout(() => {
              const audioEl = audioRef.current;
              if (audioEl) {
                console.log('Playing Fish Audio...');
                audioEl.load(); // Reload the audio element
                audioEl.play().catch(err => {
                  console.error('Fish Audio playback failed:', err);
                  console.log('Falling back to Web Speech API');
                  // Fallback to Web Speech API
                  speakText(analyzeData.analysis);
                });
              } else {
                console.log('Audio element not found, falling back to Web Speech');
                speakText(analyzeData.analysis);
              }
            }, 500); // Increased timeout
          } else {
            console.log('No Fish Audio URL, using Web Speech API');
            // Fallback to Web Speech API
            speakText(analyzeData.analysis);
          }
        }, 500); // Small delay to ensure video element is rendered
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process video');
      setUploadProgress('');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden" style={{ borderColor: theme.primary }}>
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>
              Reka AI Video Analysis Demo
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {!analysisResult ? (
              <div className="space-y-4">
                <div className="text-gray-600 mb-4">
                  Upload a sports video and get comprehensive AI-powered analysis instantly.
                </div>
                
                {!selectedFile ? (
                  <label className="block">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isProcessing}
                    />
                    <div
                      className="border-4 border-dashed p-16 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderColor: theme.accent }}
                    >
                      <Upload className="w-16 h-16 mb-4" style={{ color: theme.primary }} />
                      <div className="font-bold text-xl mb-2">
                        Click to upload sports video
                      </div>
                      <div className="text-gray-500">MP4, MOV, AVI formats supported</div>
                      <div className="text-sm text-gray-400 mt-2">Maximum file size: 100MB</div>
                    </div>
                  </label>
                ) : (
                  <div className="space-y-4">
                    <div className="border-4 p-4" style={{ borderColor: theme.accent }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{selectedFile.name}</div>
                          <div className="text-sm text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                        {!isProcessing && (
                          <button
                            onClick={() => {
                              setSelectedFile(null);
                              setUploadedVideoId(null);
                              setAnalysisResult(null);
                              if (videoUrl) {
                                URL.revokeObjectURL(videoUrl);
                                setVideoUrl(null);
                              }
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handleUploadAndAnalyze}
                      disabled={isProcessing}
                      className="w-full py-6 text-lg font-bold"
                      style={{
                        backgroundColor: theme.primary,
                        color: 'white',
                      }}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {uploadProgress || 'Processing...'}
                        </>
                      ) : (
                        'Upload & Analyze Video'
                      )}
                    </Button>
                  </div>
                )}

                {isProcessing && (
                  <div className="mt-4">
                    <div className="bg-blue-50 border-2 border-blue-300 text-blue-700 p-4 rounded">
                      <div className="font-semibold mb-2">Processing Steps:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Uploading video to Reka AI</li>
                        <li>Indexing video content (30-60 seconds)</li>
                        <li>Analyzing gameplay and tactics</li>
                        <li>Generating comprehensive report</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5" style={{ color: theme.primary }} />
                    Football Commentary
                  </h3>
                  <Button
                    onClick={() => {
                      setAnalysisResult(null);
                      setSelectedFile(null);
                      setUploadedVideoId(null);
                      setError(null);
                      if (videoUrl) {
                        URL.revokeObjectURL(videoUrl);
                        setVideoUrl(null);
                      }
                    }}
                    variant="outline"
                  >
                    Analyze Another Video
                  </Button>
                </div>
                
                {/* Video Player */}
                {videoUrl && (
                  <div className="mb-6">
                    <video
                      ref={videoRef}
                      controls
                      className="w-full rounded-lg"
                      style={{ maxHeight: '400px' }}
                    >
                      <source src={videoUrl} type={selectedFile?.type} />
                      Your browser does not support the video tag.
                    </video>
                    
                    {/* Hidden audio element for Fish Audio TTS */}
                    {audioUrl && (
                      <audio
                        ref={audioRef}
                        src={`http://localhost:8000${audioUrl}`}
                        onPlay={() => setIsSpeaking(true)}
                        onPause={() => setIsSpeaking(false)}
                        onEnded={() => setIsSpeaking(false)}
                        onError={(e) => {
                          console.error('Fish Audio playback error:', e);
                          console.error('Audio element error details:', {
                            src: audioRef.current?.src,
                            error: audioRef.current?.error,
                            networkState: audioRef.current?.networkState,
                            readyState: audioRef.current?.readyState
                          });
                        }}
                        onLoadedData={() => {
                          console.log('Fish Audio loaded successfully');
                        }}
                        onLoadStart={() => {
                          console.log('Fish Audio starting to load...', `http://localhost:8000${audioUrl}`);
                        }}
                        onCanPlay={() => {
                          console.log('Fish Audio can play');
                        }}
                        onLoadedMetadata={() => {
                          console.log('Fish Audio metadata loaded');
                        }}
                      />
                    )}
                  </div>
                )}
                
                {/* Commentary Text */}
                <div
                  className="border-4 p-6 bg-gray-50 rounded-lg"
                  style={{ borderColor: theme.accent }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-lg" style={{ color: theme.primary }}>
                      Live Commentary
                    </h4>
                    {analysisResult && (
                      <button
                        onClick={toggleSpeaking}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
                        style={{
                          backgroundColor: isSpeaking ? theme.primary : 'white',
                          color: isSpeaking ? 'white' : theme.primary,
                          border: `2px solid ${theme.primary}`
                        }}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-4 h-4" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4" />
                            {audioUrl ? 'Play Commentary' : 'Play Audio'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-medium max-h-[400px] overflow-y-auto">
                    {analysisResult}
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-500 text-red-700 p-4 rounded mt-4">
                <div className="font-semibold mb-1">Error</div>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
