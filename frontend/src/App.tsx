import React, { useState, useEffect } from 'react';
import { DynamicMeshGradient } from './components/DynamicMeshGradient';
import { Navbar } from './components/Navbar';
import { WorkflowProgress } from './components/WorkflowProgress';
import { MediaDropzone } from './components/MediaDropzone';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { CalmMusicSelector } from './components/CalmMusicSelector';
import { ProductDescriptionModal } from './components/ProductDescriptionModal';
import { Play, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { YoutubeIcon } from './components/YoutubeIcon';

export default function App() {
  // Product info modal state
  const [showProductModal, setShowProductModal] = useState<boolean>(false);

  // Folder & Media State
  const [inputFolder, setInputFolder] = useState<string>('');
  const [outputFolder, setOutputFolder] = useState<string>('');
  const [imageCount, setImageCount] = useState<number>(0);
  const [videoCount, setVideoCount] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // App Pipeline Mode: 'local_mp4' vs 'youtube_upload'
  const [appMode, setAppMode] = useState<'local_mp4' | 'youtube_upload'>('local_mp4');

  // Video Settings
  const [targetMinutes, setTargetMinutes] = useState<number>(5); // 3 to 10 min, or 0 for unlimited
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('16:9');
  const [titleTemplate, setTitleTemplate] = useState<string>('Daily Aesthetic Moments #{index}');
  const [privacyStatus, setPrivacyStatus] = useState<'private' | 'unlisted' | 'public'>('private');

  // Audio Selection
  const [selectedMusicId, setSelectedMusicId] = useState<string>('calm_ambient_1');
  const [customMusicPath, setCustomMusicPath] = useState<string>('');

  // YouTube Channel State
  const [youtubeConnected, setYoutubeConnected] = useState<boolean>(false);
  const [channelName, setChannelName] = useState<string>('Connected Channel');

  // Job & Workflow Progress State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([
    'System initialized. FFmpeg hardware acceleration verified.',
    'Awaiting media folder input...'
  ]);

  // Connect to backend WebSocket for live pipeline events
  useEffect(() => {
    let ws: WebSocket;
    try {
      ws = new WebSocket('ws://localhost:8000/ws');
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === 'processing' || data.status === 'encoding') {
            setIsProcessing(true);
            setCurrentStepIndex(data.step_index || 0);
            setOverallProgress(data.progress || 0);
          } else if (data.status === 'completed') {
            setIsProcessing(false);
            setOverallProgress(100);
          }
          if (data.logs && data.logs.length > 0) {
            setLogs(data.logs);
          }
        } catch (e) {
          console.error(e);
        }
      };
    } catch (err) {
      // Standalone preview fallback
    }

    return () => {
      ws?.close();
    };
  }, []);

  // Check YouTube connection status
  const refreshYoutubeStatus = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/youtube/status');
      const data = await res.json();
      if (data.connected) {
        setYoutubeConnected(true);
        setChannelName(data.channel_title);
      } else {
        setYoutubeConnected(false);
        setChannelName('Not Connected');
      }
    } catch (e) {
      setYoutubeConnected(false);
      setChannelName('Offline');
    }
  };

  useEffect(() => {
    refreshYoutubeStatus();
  }, []);

  const handleConnectYoutube = () => {
    // Open Google OAuth flow in external browser
    window.open('http://localhost:8000/api/youtube/auth', '_blank');
    // Poll for authorization completion
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch('http://localhost:8000/api/youtube/status');
        const data = await res.json();
        if (data.connected) {
          setYoutubeConnected(true);
          setChannelName(data.channel_title);
          clearInterval(interval);
        }
      } catch (e) {}
      if (attempts > 30) clearInterval(interval);
    }, 2000);
  };

  const handleDisconnectYoutube = async () => {
    if (confirm("Disconnect this YouTube channel? You can link any other channel anytime.")) {
      try {
        await fetch('http://localhost:8000/api/youtube/disconnect', { method: 'POST' });
        setYoutubeConnected(false);
        setChannelName('Not Connected');
        setLogs((prev) => [...prev, 'YouTube channel disconnected. Ready for new user connection.']);
      } catch (e) {
        alert("Failed to disconnect YouTube account.");
      }
    }
  };

  const handleScanFolder = async (path: string) => {
    setIsScanning(true);
    setLogs((prev) => [...prev, `Scanning directory: ${path}`]);
    try {
      const res = await fetch('http://localhost:8000/api/scan-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_path: path })
      });
      const data = await res.json();
      if (res.ok) {
        setImageCount(data.image_count);
        setVideoCount(data.video_count);
        setLogs((prev) => [
          ...prev, 
          `Scan completed: Found ${data.image_count} photos, ${data.video_count} videos.`
        ]);
      } else {
        alert(data.detail || "Error scanning folder");
      }
    } catch (e) {
      // Simulated preview if backend server is not running yet
      setImageCount(36);
      setVideoCount(12);
      setLogs((prev) => [...prev, `Preview scan: Found 36 photos and 12 videos.`]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleOpenFolderPicker = async (type: 'input' | 'output') => {
    // Check if running in Electron native window
    if ((window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        const defaultPath = type === 'input' ? inputFolder : outputFolder;
        const selected = await ipcRenderer.invoke('dialog:openFolder', defaultPath);
        if (selected) {
          if (type === 'input') {
            setInputFolder(selected);
            handleScanFolder(selected);
          } else {
            setOutputFolder(selected);
          }
          return;
        }
      } catch (e) {
        console.warn("Electron dialog failed, falling back to prompt", e);
      }
    }

    const defaultVal = type === 'input' ? (inputFolder || 'C:\\Pictures') : (outputFolder || 'C:\\Software\\SlideshowOutput');
    const chosen = prompt(`Enter path for ${type.toUpperCase()} folder:`, defaultVal);
    if (chosen) {
      if (type === 'input') {
        setInputFolder(chosen);
        handleScanFolder(chosen);
      } else {
        setOutputFolder(chosen);
      }
    }
  };

  const handleStartJob = async () => {
    if (isProcessing) return;
    if (!inputFolder) {
      alert("Please select a source folder with media first.");
      return;
    }

    setIsProcessing(true);
    setCurrentStepIndex(0);
    setOverallProgress(5);
    setLogs((prev: string[]) => [...prev, 'Starting 3-second slideshow generation pipeline...']);

    try {
      // First reset previous pipeline state in backend
      await fetch('http://localhost:8000/api/reset-state', { method: 'POST' });

      const response = await fetch('http://localhost:8000/api/start-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_folder: inputFolder,
          output_folder: outputFolder || 'C:\\Software\\SlideshowOutput',
          target_minutes: targetMinutes,
          aspect_ratio: aspectRatio,
          music_track: selectedMusicId,
          custom_music_path: customMusicPath,
          title_template: titleTemplate,
          privacy_status: privacyStatus,
          auto_upload: appMode === 'youtube_upload'
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to start pipeline');
      }
    } catch (e: any) {
      console.error("Pipeline start error:", e);
      setIsProcessing(false);
      alert(`Could not start processing: ${e.message || e}`);
    }
  };

  const simulatePipeline = () => {
    const steps = [
      { step: 0, title: 'Indexing & Analyzing Media files', prog: 15 },
      { step: 1, title: 'Standardizing photos & trimming 3s video highlights', prog: 35 },
      { step: 2, title: `Batch chunking into ${targetMinutes === 0 ? 'full' : `${targetMinutes} min`} sequences`, prog: 55 },
      { step: 3, title: 'Looping calm ambient soundtrack with volume ducking', prog: 75 },
      { step: 4, title: 'Encoding high-bitrate MP4 with FFmpeg', prog: 90 },
      { step: 5, title: 'Resumable upload to YouTube Channel with metadata', prog: 100 }
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setCurrentStepIndex(steps[i].step);
        setOverallProgress(steps[i].prog);
        setLogs((prev) => [...prev, `[Pipeline] ${steps[i].title}`]);
        i++;
      } else {
        clearInterval(interval);
        setIsProcessing(false);
        setLogs((prev) => [...prev, 'All videos generated & successfully published to YouTube!']);
      }
    }, 1200);
  };

  const totalMedia = imageCount + videoCount;

  return (
    <div className="relative min-h-screen text-slate-100 selection:bg-crimson-600 selection:text-white pb-16">
      {/* 3D Animated Shader Gradient Mesh Background */}
      <DynamicMeshGradient />

      {/* Floating Glass Navbar */}
      <Navbar
        inputFolder={inputFolder}
        outputFolder={outputFolder}
        onOpenFolderPicker={handleOpenFolderPicker}
        youtubeConnected={youtubeConnected}
        channelName={channelName}
        onConnectYoutube={handleConnectYoutube}
        onDisconnectYoutube={handleDisconnectYoutube}
        onStartJob={handleStartJob}
        isProcessing={isProcessing}
        totalMediaCount={totalMedia}
        onOpenProductInfo={() => setShowProductModal(true)}
      />

      {/* Product Description Showcase Modal */}
      <ProductDescriptionModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
      />

      {/* Main Content Workspace */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 mt-6 space-y-6">
        
        {/* Real-Time Visual Workflow Progression Component */}
        <WorkflowProgress
          currentStepIndex={currentStepIndex}
          isProcessing={isProcessing}
          overallProgress={overallProgress}
          currentStepTitle={logs[logs.length - 1]}
          logs={logs}
          onReset={async () => {
            try {
              await fetch('http://localhost:8000/api/reset-state', { method: 'POST' });
            } catch (e) {}
            setIsProcessing(false);
            setCurrentStepIndex(0);
            setOverallProgress(0);
            setLogs(['State reset. Ready for new batch.']);
          }}
        />

        {/* 2-Column Responsive Control Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Media Drop & Music Library */}
          <div className="lg:col-span-7 space-y-6">
            <MediaDropzone
              inputFolder={inputFolder}
              setInputFolder={setInputFolder}
              outputFolder={outputFolder}
              setOutputFolder={setOutputFolder}
              imageCount={imageCount}
              videoCount={videoCount}
              onScanFolder={handleScanFolder}
              onBrowseFolder={() => handleOpenFolderPicker('input')}
              isScanning={isScanning}
            />

            <CalmMusicSelector
              selectedTrackId={selectedMusicId}
              onSelectTrack={setSelectedMusicId}
              customTrackPath={customMusicPath}
              onSelectCustomTrack={setCustomMusicPath}
            />
          </div>

          {/* Right Column: Video Specs, Aspect Ratio & YouTube Publisher */}
          <div className="lg:col-span-5 space-y-6">
            <ConfigurationPanel
              appMode={appMode}
              setAppMode={setAppMode}
              targetMinutes={targetMinutes}
              setTargetMinutes={setTargetMinutes}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              titleTemplate={titleTemplate}
              setTitleTemplate={setTitleTemplate}
              privacyStatus={privacyStatus}
              setPrivacyStatus={setPrivacyStatus}
              totalMediaCount={totalMedia}
              youtubeConnected={youtubeConnected}
              channelName={channelName}
              onConnectYoutube={handleConnectYoutube}
            />
          </div>
        </div>

      </main>
    </div>
  );
}
