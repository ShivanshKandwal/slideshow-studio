import React, { useState } from 'react';
import { FolderUp, Image, Video, Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface MediaDropzoneProps {
  inputFolder: string;
  setInputFolder: (folder: string) => void;
  outputFolder: string;
  setOutputFolder: (folder: string) => void;
  imageCount: number;
  videoCount: number;
  onScanFolder: (path: string) => void;
  onBrowseFolder: () => void;
  isScanning: boolean;
}

export const MediaDropzone: React.FC<MediaDropzoneProps> = ({
  inputFolder,
  setInputFolder,
  outputFolder,
  setOutputFolder,
  imageCount,
  videoCount,
  onScanFolder,
  onBrowseFolder,
  isScanning
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleManualPathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputFolder) {
      onScanFolder(inputFolder);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-crimson-500/10 border border-crimson-500/20 text-crimson-400">
            <FolderUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">Source Folder</h3>
            <p className="text-xs text-neutral-400">Drag & drop your photos and video clips folder</p>
          </div>
        </div>

        {(imageCount > 0 || videoCount > 0) && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-lg bg-surface-subtle border border-white/5 text-neutral-300">
              <Image className="w-3 h-3 text-crimson-400" /> {imageCount} Photos
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-lg bg-surface-subtle border border-white/5 text-neutral-300">
              <Video className="w-3 h-3 text-crimson-400" /> {videoCount} Videos
            </span>
          </div>
        )}
      </div>

      {/* Drag & Drop Visual Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          // Get dropped path if Electron / web
          if (e.dataTransfer.files.length > 0) {
            const firstFile = e.dataTransfer.files[0] as any;
            const fullPath = firstFile.path || firstFile.name;
            setInputFolder(fullPath);
            onScanFolder(fullPath);
          }
        }}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          dragOver
            ? 'border-crimson-500 bg-crimson-950/20 shadow-xl shadow-crimson-500/10 scale-[0.99]'
            : 'border-white/10 hover:border-white/20 bg-surface-subtle/40'
        }`}
      >
        <div 
          onClick={onBrowseFolder}
          className="mx-auto w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center mb-3 shadow-inner border border-white/5 cursor-pointer hover:scale-105 hover:border-crimson-500/40 transition-all"
        >
          <FolderUp className="w-6 h-6 text-crimson-400" />
        </div>
        <div className="text-xs font-semibold text-neutral-200 mb-1">
          Drop your media directory here or click to browse
        </div>
        <p className="text-[11px] text-neutral-500 max-w-sm mx-auto mb-4">
          All images and videos inside will be converted into 3-second segments and sliced into desired video lengths.
        </p>

        {/* Path Input Field & Browse Button */}
        <form onSubmit={handleManualPathSubmit} className="max-w-md mx-auto flex gap-2">
          <input
            type="text"
            value={inputFolder}
            onChange={(e) => setInputFolder(e.target.value)}
            placeholder="e.g. C:\Users\hp\Pictures\Vacation2026"
            className="flex-1 bg-surface-subtle border border-white/10 rounded-xl px-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-500 font-mono focus:outline-none focus:border-crimson-500 transition-colors"
          />
          <button
            type="button"
            onClick={onBrowseFolder}
            className="px-3.5 py-2 rounded-xl bg-surface-subtle hover:bg-neutral-800 border border-white/10 text-xs font-medium text-neutral-300 hover:text-white transition-all hover:border-crimson-500/40"
          >
            Browse
          </button>
          <button
            type="submit"
            disabled={isScanning || !inputFolder}
            className="px-4 py-2 rounded-xl bg-crimson-600 hover:bg-crimson-500 border border-crimson-400/50 text-xs font-semibold text-white transition-all shadow-md shadow-crimson-500/20"
          >
            {isScanning ? 'Scanning...' : 'Scan'}
          </button>
        </form>
      </div>
    </div>
  );
};
