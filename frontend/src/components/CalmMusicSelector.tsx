import React, { useState } from 'react';
import { Music, Play, Pause, Sparkles, Check, Upload, VolumeX } from 'lucide-react';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  filename: string;
}

const DEFAULT_CALM_TRACKS: MusicTrack[] = [
  {
    id: 'calm_ambient_1',
    title: 'Serene Sanctuary (216Hz Soundscape)',
    artist: 'Antigravity Acoustic Labs (100% Original No Copyright)',
    duration: '3:00',
    filename: 'calm_ambient_1.mp3'
  },
  {
    id: 'calm_lofi_1',
    title: 'Midnight Rain Pulse (330Hz Warm Drone)',
    artist: 'Antigravity Acoustic Labs (100% Original No Copyright)',
    duration: '3:00',
    filename: 'calm_lofi_1.mp3'
  },
  {
    id: 'calm_piano_1',
    title: 'Ethereal Zen Drift (432Hz Meditation)',
    artist: 'Antigravity Acoustic Labs (100% Original No Copyright)',
    duration: '2:00',
    filename: 'calm_piano_1.mp3'
  }
];

interface CalmMusicSelectorProps {
  selectedTrackId: string;
  onSelectTrack: (trackId: string) => void;
  customTrackPath: string;
  onSelectCustomTrack: (path: string) => void;
}

export const CalmMusicSelector: React.FC<CalmMusicSelectorProps> = ({
  selectedTrackId,
  onSelectTrack,
  customTrackPath,
  onSelectCustomTrack
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const togglePreview = (track: MusicTrack) => {
    if (playingId === track.id) {
      audioElement?.pause();
      setPlayingId(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      // Streamed directly from local backend static audio
      const audioUrl = `http://localhost:8000/static/audio/${track.filename}`;
      const audio = new Audio(audioUrl);
      audio.volume = 0.55;
      audio.play().catch((err) => {
        console.warn("Could not play audio preview:", err);
      });
      audio.onended = () => setPlayingId(null);
      setAudioElement(audio);
      setPlayingId(track.id);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-crimson-500/10 border border-crimson-500/20 text-crimson-400">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">Calm Soundtrack (Auto-Looping)</h3>
            <p className="text-xs text-neutral-400">Song automatically loops seamlessly over entire video duration</p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Auto-Looped
        </span>
      </div>

      {/* Preset Tracks List */}
      <div className="space-y-2.5 mb-4">
        {/* Option 0: No Audio / Silent Video */}
        <div
          onClick={() => {
            if (audioElement) audioElement.pause();
            setPlayingId(null);
            onSelectCustomTrack('');
            onSelectTrack('no_audio');
          }}
          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
            selectedTrackId === 'no_audio' && !customTrackPath
              ? 'bg-crimson-950/30 border-crimson-500/50 shadow-md shadow-crimson-500/10'
              : 'bg-surface-subtle hover:bg-surface-hover border-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-800 text-neutral-400">
              <VolumeX className="w-4 h-4 text-neutral-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-200">No Audio (Completely Silent MP4)</div>
              <div className="text-[11px] text-neutral-500">Zero copyright risk • Add music later in YouTube Studio/Editor</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedTrackId === 'no_audio' && !customTrackPath ? (
              <div className="w-5 h-5 rounded-full bg-crimson-600 flex items-center justify-center text-white">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border border-neutral-700" />
            )}
          </div>
        </div>

        {DEFAULT_CALM_TRACKS.map((track) => {
          const isSelected = selectedTrackId === track.id && !customTrackPath;
          const isPlaying = playingId === track.id;

          return (
            <div
              key={track.id}
              onClick={() => {
                onSelectCustomTrack('');
                onSelectTrack(track.id);
              }}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-crimson-950/30 border-crimson-500/50 shadow-md shadow-crimson-500/10'
                  : 'bg-surface-subtle hover:bg-surface-hover border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePreview(track);
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform hover:scale-105 ${
                    isPlaying 
                      ? 'bg-crimson-600 text-white shadow-lg shadow-crimson-500/40' 
                      : 'bg-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>
                <div>
                  <div className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
                    {track.title}
                    {isPlaying && (
                      <span className="flex gap-0.5 items-end h-3">
                        <span className="w-0.5 h-full bg-crimson-500 animate-pulse" />
                        <span className="w-0.5 h-2 bg-crimson-400 animate-pulse delay-75" />
                        <span className="w-0.5 h-2.5 bg-crimson-500 animate-pulse delay-150" />
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-400">{track.artist} • {track.duration}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-crimson-600 flex items-center justify-center text-white">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-neutral-700" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Audio Upload / Drop Row */}
      <div 
        onClick={async () => {
          if ((window as any).require) {
            try {
              const { ipcRenderer } = (window as any).require('electron');
              const selected = await ipcRenderer.invoke('dialog:openAudioFile');
              if (selected) {
                onSelectCustomTrack(selected);
                return;
              }
            } catch (e) {}
          }
          const path = prompt("Enter full path to custom MP3/WAV file:", customTrackPath || "C:\\Music\\my_track.mp3");
          if (path) onSelectCustomTrack(path);
        }}
        className={`p-3 rounded-xl border border-dashed cursor-pointer transition-all flex items-center justify-between ${
          customTrackPath 
            ? 'border-crimson-500/60 bg-crimson-950/20' 
            : 'border-white/10 hover:border-white/20 bg-surface-subtle/50'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Upload className="w-4 h-4 text-neutral-400" />
          <div>
            <div className="text-xs font-medium text-neutral-200">
              {customTrackPath ? `Custom: ${customTrackPath.split(/[\\/]/).pop()}` : 'Use Custom Local Audio File'}
            </div>
            <div className="text-[10px] text-neutral-500">Auto-loops and crossfades to full video length</div>
          </div>
        </div>
        <span className="text-[11px] font-mono text-crimson-400 hover:underline">
          {customTrackPath ? 'Change' : 'Browse'}
        </span>
      </div>
    </div>
  );
};
