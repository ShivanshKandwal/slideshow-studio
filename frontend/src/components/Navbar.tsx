import React from 'react';
import { 
  Folder, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Play, 
  Settings2,
  HardDrive,
  LogOut,
  Info
} from 'lucide-react';
import { YoutubeIcon } from './YoutubeIcon';

interface NavbarProps {
  inputFolder: string;
  outputFolder: string;
  onOpenFolderPicker: (type: 'input' | 'output') => void;
  youtubeConnected: boolean;
  channelName: string;
  channelAvatar?: string;
  onConnectYoutube: () => void;
  onDisconnectYoutube?: () => void;
  onStartJob: () => void;
  isProcessing: boolean;
  totalMediaCount: number;
  onOpenProductInfo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  inputFolder,
  outputFolder,
  onOpenFolderPicker,
  youtubeConnected,
  channelName,
  channelAvatar,
  onConnectYoutube,
  onDisconnectYoutube,
  onStartJob,
  isProcessing,
  totalMediaCount,
  onOpenProductInfo
}) => {
  return (
    <header className="sticky top-4 z-40 px-6 py-2">
      <nav className="glass-nav rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4 border border-white/10 shadow-2xl backdrop-blur-xl">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenProductInfo}
            title="View ChronoStudio Product Features & Details"
            className="h-10 w-10 rounded-xl bg-gradient-to-tr from-crimson-700 to-crimson-500 flex items-center justify-center shadow-lg shadow-crimson-500/30 border border-crimson-400/40 hover:scale-105 active:scale-95 transition-transform cursor-pointer group"
          >
            <Sparkles className="w-5 h-5 text-white animate-pulse-slow group-hover:rotate-12 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">CHRONO<span className="text-crimson-500 font-black">STUDIO</span></span>
              <button 
                onClick={onOpenProductInfo}
                className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-crimson-500/10 hover:bg-crimson-500/20 text-crimson-400 border border-crimson-500/20 font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>v1.0 Pro</span>
                <Info className="w-3 h-3 text-crimson-400" />
              </button>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">3s Smart Slideshow & YouTube Auto-Publisher</p>
          </div>
        </div>

        {/* Center Quick Folder Info Badges */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Source Input Folder Pill */}
          <button 
            onClick={() => onOpenFolderPicker('input')}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-white/5 hover:border-crimson-500/40 transition-all text-xs group"
          >
            <Folder className="w-3.5 h-3.5 text-crimson-400 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <span className="text-neutral-400 block text-[10px] leading-tight">SOURCE FOLDER</span>
              <span className="text-neutral-200 font-mono font-medium truncate max-w-[160px] block">
                {inputFolder ? inputFolder.split(/[\\/]/).pop() : 'Select Input...'}
              </span>
            </div>
            {totalMediaCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-crimson-500/20 text-crimson-300 font-mono text-[10px] font-bold">
                {totalMediaCount}
              </span>
            )}
          </button>

          {/* Output Destination Folder Pill */}
          <button 
            onClick={() => onOpenFolderPicker('output')}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-white/5 hover:border-white/20 transition-all text-xs group"
          >
            <HardDrive className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
            <div className="text-left">
              <span className="text-neutral-400 block text-[10px] leading-tight">OUTPUT PATH</span>
              <span className="text-neutral-300 font-mono truncate max-w-[150px] block">
                {outputFolder ? outputFolder.split(/[\\/]/).pop() : 'Auto (output/)'}
              </span>
            </div>
          </button>
        </div>

        {/* Right Section: YouTube Account Pill & Action Button */}
        <div className="flex items-center gap-3">
          {/* Overhauled YouTube Connection Pill */}
          <div className="flex items-center">
            <button
              onClick={onConnectYoutube}
              title={youtubeConnected ? `Connected Channel: ${channelName}. Click to re-authenticate.` : 'Click to connect your YouTube channel'}
              className={`flex items-center gap-2.5 px-3.5 py-1.5 text-xs font-medium border transition-all ${
                youtubeConnected 
                  ? 'rounded-l-xl bg-emerald-950/40 border-emerald-500/40 text-emerald-200 hover:border-emerald-500/80 hover:bg-emerald-900/40 shadow-sm shadow-emerald-500/10' 
                  : 'rounded-xl bg-surface-subtle hover:bg-surface-hover border-white/10 text-neutral-300 hover:border-crimson-500/40'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <YoutubeIcon className={`w-4 h-4 ${youtubeConnected ? 'text-emerald-400' : 'text-crimson-500'}`} />
                <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${youtubeConnected ? 'bg-emerald-500 ring-2 ring-background animate-pulse' : 'bg-neutral-600'}`} />
              </div>
              <div className="text-left flex flex-col">
                <span className="text-[9px] font-mono leading-none tracking-wider uppercase text-neutral-400">
                  {youtubeConnected ? 'ACTIVE • CONNECTED' : 'YOUTUBE'}
                </span>
                <span className="font-mono text-xs font-semibold truncate max-w-[130px]">
                  {youtubeConnected ? channelName : 'Connect Channel'}
                </span>
              </div>
            </button>
            {youtubeConnected && onDisconnectYoutube && (
              <button
                onClick={onDisconnectYoutube}
                title="Disconnect channel / Switch account"
                className="px-2.5 py-2.5 bg-emerald-950/40 border-y border-r border-emerald-500/40 rounded-r-xl text-emerald-400 hover:bg-red-950/50 hover:text-red-300 hover:border-red-500/40 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Main Action: Generate & Publish */}
          <button
            onClick={onStartJob}
            disabled={isProcessing || !inputFolder}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-xs transition-all shadow-lg ${
              isProcessing
                ? 'bg-neutral-800 text-neutral-400 cursor-not-allowed border border-white/5'
                : !inputFolder
                ? 'bg-neutral-800/80 text-neutral-400 cursor-not-allowed border border-white/5'
                : 'bg-gradient-to-r from-crimson-600 to-crimson-500 hover:from-crimson-500 hover:to-crimson-400 text-white crimson-glow border border-crimson-400/50 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Generate & Upload</span>
              </>
            )}
          </button>
        </div>

      </nav>
    </header>
  );
};
