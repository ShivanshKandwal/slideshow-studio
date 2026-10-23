import React from 'react';
import { 
  Sparkles, 
  Film, 
  VolumeX, 
  Clock, 
  ShieldCheck, 
  Layers, 
  FolderCheck, 
  Sliders, 
  X, 
  PlaySquare, 
  CheckCircle2, 
  Share2,
  Tv
} from 'lucide-react';
import { YoutubeIcon } from './YoutubeIcon';

interface ProductDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDescriptionModal: React.FC<ProductDescriptionModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-panel rounded-3xl border border-white/10 p-6 sm:p-10 text-slate-100 shadow-2xl">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Section */}
        <div className="space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-crimson-500/10 border border-crimson-500/30 text-crimson-400 text-xs font-mono font-medium">
            <Sparkles className="w-3.5 h-3.5 animate-pulse-slow" />
            <span>ChronoStudio v1.0 • Desktop Professional Suite</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Automated 3-Second Slideshows & <span className="text-transparent bg-clip-text bg-gradient-to-r from-crimson-500 to-rose-400">YouTube Auto-Publisher</span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-2xl">
            ChronoStudio transforms raw photo albums and video clip folders into high-definition, rhythmically paced 3-second slideshow productions. Packaged with zero-copyright ambient soundtracks and direct multi-user YouTube publishing.
          </p>
        </div>

        {/* Core Value Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          
          <div className="p-5 rounded-2xl bg-surface-subtle border border-white/5 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-crimson-500/10 border border-crimson-500/20 flex items-center justify-center text-crimson-400">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm">Strict 3.0s Rhythm Slicing</h3>
            <p className="text-xs text-neutral-400 leading-normal">
              Every photo and video slice is normalized to 3.0 seconds with smart blurred backdrop padding, eliminating black bars across any aspect ratio.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface-subtle border border-white/5 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm">100% No-Copyright Audio</h3>
            <p className="text-xs text-neutral-400 leading-normal">
              Procedurally synthesized ambient soundscapes without samples or Content ID fingerprints, plus a Silent MP4 option for 100% clean uploads.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface-subtle border border-white/5 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <YoutubeIcon className="w-5 h-5 text-crimson-400" />
            </div>
            <h3 className="font-semibold text-white text-sm">Direct YouTube Channel Sync</h3>
            <p className="text-xs text-neutral-400 leading-normal">
              Authenticate any personal YouTube channel with one click. Queue and publish videos directly with privacy and metadata controls.
            </p>
          </div>

        </div>

        {/* Feature Highlights Table/List */}
        <div className="space-y-4 mb-8">
          <h2 className="text-sm font-mono uppercase tracking-wider text-neutral-400">Key Production Features</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-subtle/60 border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-crimson-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-white block">Default 16:9 Landscape & 9:16 Shorts</span>
                <span className="text-neutral-400">Optimized for horizontal desktop monitors, TVs, and vertical mobile formats.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-subtle/60 border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-crimson-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-white block">Flexible Target Video Duration</span>
                <span className="text-neutral-400">Choose 3 to 10 minute automated batch cuts, or Unlimited to stitch all media into 1 master video.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-subtle/60 border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-crimson-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-white block">Multi-User Windows Profile Isolation</span>
                <span className="text-neutral-400">Personal OAuth credentials securely stored in %APPDATA% with one-click disconnect.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-subtle/60 border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-crimson-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-white block">Resumable 4MB Chunk Uploads</span>
                <span className="text-neutral-400">Network fault-tolerant YouTube upload queue with real-time per-slide progress feedback.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-neutral-400">Built for content creators, photographers & archivists.</span>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-crimson-600 hover:bg-crimson-500 text-white font-medium text-xs transition-all shadow-lg crimson-glow"
          >
            Got it, Let's Create
          </button>
        </div>

      </div>
    </div>
  );
};
