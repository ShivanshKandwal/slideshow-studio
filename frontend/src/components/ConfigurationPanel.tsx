import React from 'react';
import { 
  Sliders, 
  Clock, 
  Smartphone, 
  Monitor, 
  Film, 
  Lock, 
  Globe, 
  EyeOff,
  Infinity as InfinityIcon,
  CheckCircle2,
  FolderDown
} from 'lucide-react';
import { YoutubeIcon } from './YoutubeIcon';

interface ConfigurationPanelProps {
  // Mode Slider: 'local_mp4' vs 'youtube_upload'
  appMode: 'local_mp4' | 'youtube_upload';
  setAppMode: (mode: 'local_mp4' | 'youtube_upload') => void;
  targetMinutes: number; // 3 to 10 min, or 0 for unlimited
  setTargetMinutes: (val: number) => void;
  aspectRatio: '9:16' | '16:9';
  setAspectRatio: (val: '9:16' | '16:9') => void;
  titleTemplate: string;
  setTitleTemplate: (val: string) => void;
  privacyStatus: 'private' | 'unlisted' | 'public';
  setPrivacyStatus: (val: 'private' | 'unlisted' | 'public') => void;
  totalMediaCount: number;
  youtubeConnected: boolean;
  channelName: string;
  onConnectYoutube: () => void;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  appMode,
  setAppMode,
  targetMinutes,
  setTargetMinutes,
  aspectRatio,
  setAspectRatio,
  titleTemplate,
  setTitleTemplate,
  privacyStatus,
  setPrivacyStatus,
  totalMediaCount,
  youtubeConnected,
  channelName,
  onConnectYoutube
}) => {
  const isUnlimited = targetMinutes === 0;
  const fullVideoSeconds = totalMediaCount * 3;
  const targetSeconds = isUnlimited ? fullVideoSeconds : targetMinutes * 60;
  const itemsPerVideo = isUnlimited 
    ? Math.max(1, totalMediaCount) 
    : Math.max(1, Math.round(targetSeconds / 3));

  const totalFinishedVideos = totalMediaCount > 0 
    ? (isUnlimited ? 1 : Math.ceil(totalMediaCount / itemsPerVideo))
    : 1;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s > 0 ? `${s}s` : ''}`.trim();
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-6">
      
      {/* 1. PRIMARY APP MODE SLIDER TOGGLE */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-400 uppercase tracking-wider font-semibold text-[11px]">
            Action Pipeline
          </span>
          <span className="font-mono text-[11px] text-crimson-400 font-semibold">
            {appMode === 'local_mp4' ? '1. Local MP4 Export' : '2. Connect & Auto-Publish'}
          </span>
        </div>

        {/* Sliding Pill Toggle */}
        <div className="relative p-1 rounded-2xl bg-surface-subtle border border-white/10 grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setAppMode('local_mp4')}
            className={`relative z-10 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-300 ${
              appMode === 'local_mp4'
                ? 'bg-crimson-600 text-white shadow-lg shadow-crimson-500/30 border border-crimson-400/50'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FolderDown className="w-4 h-4" />
            <span>Generate Local MP4</span>
          </button>

          <button
            type="button"
            onClick={() => setAppMode('youtube_upload')}
            className={`relative z-10 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-300 ${
              appMode === 'youtube_upload'
                ? 'bg-gradient-to-r from-red-600 to-crimson-600 text-white shadow-lg shadow-crimson-500/30 border border-crimson-400/50'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <YoutubeIcon className="w-4 h-4 text-white" />
            <span>YouTube Publisher</span>
          </button>
        </div>
      </div>

      {/* 2. DURATION SLIDER (3 to 10 min or Unlimited) */}
      <div className="space-y-4 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-300 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-crimson-400" /> Output Video Duration
          </span>
          <span className="font-mono text-crimson-400 font-bold px-2 py-0.5 rounded-lg bg-crimson-950/40 border border-crimson-500/30">
            {isUnlimited ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <InfinityIcon className="w-3.5 h-3.5" /> Unlimited (1 Full Video)
              </span>
            ) : (
              `${targetMinutes} Minutes (${itemsPerVideo} slides / video)`
            )}
          </span>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTargetMinutes(isUnlimited ? 5 : targetMinutes)}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
              !isUnlimited
                ? 'bg-crimson-600 text-white border-crimson-400/50 shadow-md shadow-crimson-500/20'
                : 'bg-surface-subtle hover:bg-surface-hover text-neutral-400 border-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Custom (3 - 10 Min)
          </button>

          <button
            type="button"
            onClick={() => setTargetMinutes(0)}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
              isUnlimited
                ? 'bg-emerald-600 text-white border-emerald-400/50 shadow-md shadow-emerald-500/20'
                : 'bg-surface-subtle hover:bg-surface-hover text-neutral-400 border-white/5'
            }`}
          >
            <InfinityIcon className="w-4 h-4" /> Unlimited (All Media)
          </button>
        </div>

        {/* Range Slider */}
        {!isUnlimited && (
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-[11px] font-mono text-neutral-400">
              <span>3 Min (60 slides)</span>
              <span className="text-crimson-400 font-bold">{targetMinutes} Minutes ({targetMinutes * 60}s)</span>
              <span>10 Min (200 slides)</span>
            </div>
            <input
              type="range"
              min="3"
              max="10"
              step="1"
              value={targetMinutes}
              onChange={(e) => setTargetMinutes(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-surface-subtle rounded-lg appearance-none cursor-pointer accent-crimson-500"
            />
          </div>
        )}

        {/* Media Calculation summary */}
        <div className="p-3.5 rounded-xl bg-surface-subtle/80 border border-white/5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-neutral-300">
            <span>Input Total ({totalMediaCount} files @ 3s):</span>
            <span className="font-mono text-white font-semibold">
              {fullVideoSeconds} seconds ({formatSeconds(fullVideoSeconds)})
            </span>
          </div>

          <div className="flex items-center justify-between text-neutral-400 pt-1 border-t border-white/5">
            <span>Resulting Output:</span>
            <span className="font-mono text-neutral-200">
              <strong className="text-crimson-400 font-bold text-sm">{totalFinishedVideos}</strong> video{totalFinishedVideos > 1 ? 's' : ''}{' '}
              {isUnlimited ? `(${formatSeconds(fullVideoSeconds)} total)` : `(~${targetMinutes}m each)`}
            </span>
          </div>
        </div>
      </div>

      {/* 3. VIDEO ORIENTATION */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-neutral-300">Format & Orientation</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAspectRatio('9:16')}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              aspectRatio === '9:16'
                ? 'bg-crimson-950/30 border-crimson-500/60 shadow-lg shadow-crimson-500/10'
                : 'bg-surface-subtle hover:bg-surface-hover border-white/5 text-neutral-400'
            }`}
          >
            <Smartphone className={`w-5 h-5 ${aspectRatio === '9:16' ? 'text-crimson-400' : 'text-neutral-500'}`} />
            <div>
              <div className={`text-xs font-semibold ${aspectRatio === '9:16' ? 'text-white' : 'text-neutral-300'}`}>
                9:16 Shorts / Reels
              </div>
              <div className="text-[10px] text-neutral-500">1080 × 1920 Vertical</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setAspectRatio('16:9')}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              aspectRatio === '16:9'
                ? 'bg-crimson-950/30 border-crimson-500/60 shadow-lg shadow-crimson-500/10'
                : 'bg-surface-subtle hover:bg-surface-hover border-white/5 text-neutral-400'
            }`}
          >
            <Monitor className={`w-5 h-5 ${aspectRatio === '16:9' ? 'text-crimson-400' : 'text-neutral-500'}`} />
            <div>
              <div className={`text-xs font-semibold ${aspectRatio === '16:9' ? 'text-white' : 'text-neutral-300'}`}>
                16:9 Landscape
              </div>
              <div className="text-[10px] text-neutral-500">1920 × 1080 YouTube</div>
            </div>
          </button>
        </div>
      </div>

      {/* 4. YOUTUBE SETTINGS (Shown when YouTube Mode is selected) */}
      {appMode === 'youtube_upload' && (
        <div className="space-y-3.5 pt-3 border-t border-white/5 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
              <YoutubeIcon className="w-3.5 h-3.5 text-crimson-500" /> YouTube Channel
            </label>
            <button
              type="button"
              onClick={onConnectYoutube}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all ${
                youtubeConnected
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/20 hover:border-emerald-400'
                  : 'bg-crimson-600 hover:bg-crimson-500 text-white border-crimson-400/50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${youtubeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-white'}`} />
              <span>{youtubeConnected ? `Active: ${channelName}` : 'Connect Channel Now'}</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-neutral-400">Video Title Template</label>
            <input
              type="text"
              value={titleTemplate}
              onChange={(e) => setTitleTemplate(e.target.value)}
              placeholder="e.g. Aesthetic Moments Vol. {index}"
              className="w-full bg-surface-subtle border border-white/10 rounded-xl px-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-crimson-500 font-mono transition-colors"
            />
          </div>

          {/* Privacy Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-neutral-400">Default YouTube Privacy</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'private', label: 'Private', icon: Lock },
                { id: 'unlisted', label: 'Unlisted', icon: EyeOff },
                { id: 'public', label: 'Public', icon: Globe }
              ].map((mode) => {
                const ModeIcon = mode.icon;
                const isSelected = privacyStatus === mode.id;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPrivacyStatus(mode.id as any)}
                    className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-crimson-600 text-white border-crimson-400/50 shadow-md shadow-crimson-500/20'
                        : 'bg-surface-subtle hover:bg-surface-hover text-neutral-400 border-white/5'
                    }`}
                  >
                    <ModeIcon className="w-3 h-3" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Status note when Local MP4 mode is selected */}
      {appMode === 'local_mp4' && (
        <div className="p-3 rounded-xl bg-surface-subtle/50 border border-white/5 text-[11px] text-neutral-400 flex items-center gap-2">
          <FolderDown className="w-4 h-4 text-crimson-400 flex-shrink-0" />
          <span>Videos will be saved directly into your chosen Output Folder without uploading.</span>
        </div>
      )}

    </div>
  );
};
