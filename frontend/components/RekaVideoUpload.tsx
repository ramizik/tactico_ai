import { useState, useRef, useEffect } from 'react';
import { Upload, Play, X, FileVideo, Sparkles, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface AudioInfo {
  available: boolean;
  data_base64?: string;
  data_length?: number;
  sample_rate?: number;
  format?: string;
  error?: string;
}

interface AnalysisResult {
  success: boolean;
  result?: any;
  audio?: AudioInfo;
  model?: string;
  timestamp?: string;
  filename?: string;
  prompt?: string;
}

export const RekaVideoUpload = () => {
  const { theme } = useTheme();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('reka-flash');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Audio playback state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  // Enhanced guardrails for AI accuracy
  const systemPrompt = `
    IMPORTANT: You are analyzing a real sports video. Follow these strict guidelines:

    1. ONLY describe what you can CLEARLY see in the video
    2. DO NOT make up team colors - if you can't see the colors clearly, say so
    3. DO NOT guess formations - only describe formations you can clearly observe
    4. DO NOT invent details not visible in the video
    5. If video quality is poor or unclear, be honest about it
    6. Admit when you cannot see something clearly
    7. Use phrases like "I can see..." or "The video shows..." when certain, and "It appears..." when uncertain

    Be helpful, accurate, and honest about what you can and cannot see.
  `;

  // Quick-tap preset prompts
  const presetPrompts = [
    {
      label: 'Formations & Tactics',
      text: 'Analyze the formations and tactical setup of both teams. What strategies are they using?'
    },
    {
      label: 'Key Moments',
      text: 'Identify the key moments in this match including goals, near-misses, and critical plays.'
    },
    {
      label: 'Possession & Style',
      text: 'Analyze the possession patterns and playing style of both teams. Which team is dominating and how?'
    }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        setError('Video file is too large (max 100MB)');
        return;
      }
      setSelectedFile(file);
      setError(null);
      setResult(null);
      
      // Create preview
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError(null);
    setResult(null);
  };

  const handlePresetClick = (prompt: string) => {
    setCustomPrompt(prompt);
  };

  // Setup audio when analysis completes
  useEffect(() => {
    if (result?.audio?.available && result.audio.data_base64) {
      try {
        // Convert base64 to blob URL for audio playback
        const binaryString = atob(result.audio.data_base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Create audio buffer from MP3 data
        const blob = new Blob([bytes], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioReady(true);
        console.log('Audio ready with Fish AI voice');
        
        return () => URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error setting up audio:', err);
        setAudioReady(false);
      }
    } else {
      setAudioReady(false);
      setAudioUrl(null);
    }
  }, [result]);

  const toggleAudioPlayback = () => {
    const audioElement = document.querySelector('audio');
    
    if (!audioElement) {
      console.error('Audio element not found');
      return;
    }
    
    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleAudioError = () => {
    setIsPlaying(false);
    setAudioReady(false);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select a video file');
      return;
    }

    if (!customPrompt.trim()) {
      setError('Please enter a prompt or select a preset');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('prompt', systemPrompt + '\n\nUser request: ' + customPrompt);
      formData.append('model', selectedModel);

      const response = await fetch('http://localhost:8000/api/reka/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze video');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Sparkles className="w-8 h-8" style={{ color: theme.primary }} />
        <h2 className="text-3xl font-bold" style={{ color: theme.primary }}>
          Reka AI Video Analysis
        </h2>
      </div>

      {/* Upload Section */}
      <div
        className="border-4 p-8 rounded-lg"
        style={{ borderColor: theme.accent, backgroundColor: 'white' }}
      >
        <div className="text-center mb-6">
          <FileVideo className="w-16 h-16 mx-auto mb-4" style={{ color: theme.accent }} />
          <h3 className="text-xl font-bold mb-2">Upload Your Match Video</h3>
          <p className="text-gray-600">Select a video file to analyze (max 100MB)</p>
        </div>

        {!selectedFile ? (
          <div className="flex flex-col items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="video-upload"
            />
            <label
              htmlFor="video-upload"
              className="px-8 py-4 border-4 font-bold text-lg transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
              style={{ borderColor: theme.primary, color: theme.primary }}
            >
              <Upload className="w-6 h-6" />
              Choose Video File
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-100 rounded">
              <div className="flex items-center gap-3">
                <FileVideo className="w-8 h-8" style={{ color: theme.primary }} />
                <div>
                  <div className="font-bold">{selectedFile.name}</div>
                  <div className="text-sm text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {preview && (
              <div className="w-full max-w-2xl mx-auto">
                <video
                  src={preview}
                  controls
                  className="w-full rounded border-4"
                  style={{ borderColor: theme.accent }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <label className="text-lg font-bold" style={{ color: theme.secondary }}>
          Select AI Model:
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="reka-flash"
              checked={selectedModel === 'reka-flash'}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-4 h-4"
              style={{ accentColor: theme.primary }}
            />
            <span className="font-bold">Reka Flash</span>
            <span className="text-sm text-gray-600">(Fast, optimized)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="reka-core-20240501"
              checked={selectedModel === 'reka-core-20240501'}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-4 h-4"
              style={{ accentColor: theme.primary }}
            />
            <span className="font-bold">Reka Core</span>
            <span className="text-sm text-gray-600">(Higher quality)</span>
          </label>
        </div>
      </div>

      {/* Quick-Tap Preset Buttons */}
      <div className="space-y-3">
        <label className="text-lg font-bold" style={{ color: theme.secondary }}>
          Analysis Types:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {presetPrompts.map((preset, index) => (
            <button
              key={index}
              onClick={() => handlePresetClick(preset.text)}
              className="px-4 py-3 border-2 font-semibold transition-all hover:scale-105"
              style={{
                borderColor: theme.accent,
                color: theme.primary,
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt */}
      <div className="space-y-2">
        <label className="text-lg font-bold" style={{ color: theme.secondary }}>
          Custom Prompt:
        </label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Enter your custom analysis request or select a preset above..."
          rows={4}
          className="w-full p-4 border-2 border-gray-300 rounded focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Analyze Button */}
      <div className="flex justify-center">
        <button
          onClick={handleAnalyze}
          disabled={!selectedFile || isAnalyzing || !customPrompt.trim()}
          className="px-8 py-4 border-4 font-bold text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ borderColor: theme.primary, color: theme.primary }}
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-t-transparent" style={{ borderColor: theme.primary }} />
              Analyzing...
            </>
          ) : (
            <>
              <Play className="w-6 h-6" />
              Analyze Video
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-100 border-2 border-red-500 rounded flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div className="text-red-700 font-semibold">{error}</div>
        </div>
      )}

      {/* Results Display */}
      {result && result.success && (
        <div
          className="border-4 p-6 rounded-lg space-y-4"
          style={{ borderColor: theme.primary, backgroundColor: 'white' }}
        >
          <h3 className="text-2xl font-bold" style={{ color: theme.primary }}>
            Analysis Results
          </h3>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div><strong>Model:</strong> {result.model}</div>
            <div><strong>File:</strong> {result.filename}</div>
            <div><strong>Time:</strong> {new Date(result.timestamp || '').toLocaleString()}</div>
          </div>

          {/* Audio Player - Using Fish AI TTS */}
          {result.audio?.available && audioReady && audioUrl && (
            <>
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.accent }}>
                      {isPlaying ? (
                        <Volume2 className="h-5 w-5 text-white animate-pulse" />
                      ) : (
                        <Volume2 className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-black text-black">🔊 Listen to AI Summary</p>
                      <p className="text-sm text-gray-600">Your custom Fish AI voice</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleAudioPlayback}
                    className="px-6 py-3 border-4 font-bold transition-all hover:scale-105 flex items-center gap-2"
                    style={{ borderColor: theme.primary, color: theme.primary }}
                  >
                    {isPlaying ? (
                      <>
                        <VolumeX className="h-5 w-5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-5 w-5" />
                        Play Audio
                      </>
                    )}
                  </button>
                </div>
              </div>
              <audio
                src={audioUrl}
                onEnded={handleAudioEnded}
                onError={handleAudioError}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </>
          )}

          {/* Audio Unavailable Message */}
          {result.audio && !result.audio.available && (
            <div className="p-3 bg-gray-100 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                🔊 Audio unavailable: {result.audio.error || "Audio generation skipped"}
              </p>
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded border-2 border-gray-200">
            <div className="whitespace-pre-wrap text-gray-800">
              {typeof result.result === 'string' 
                ? result.result 
                : result.result?.text || JSON.stringify(result.result, null, 2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

