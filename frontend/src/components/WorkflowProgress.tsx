import React from 'react';
import { 
  Scan, 
  Scissors, 
  Layers, 
  Music, 
  Film, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  Loader2 
} from 'lucide-react';

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'scan', label: 'Media Scan', description: 'Folder indexing & item analysis', icon: Scan },
  { id: 'normalize', label: '3s Slicing', description: 'Fitting images & 3s video cuts', icon: Scissors },
  { id: 'chunk', label: 'Batch Chunking', description: 'Grouping into target durations', icon: Layers },
  { id: 'audio', label: 'Calm Audio Mix', description: 'Looping & ducking soundtrack', icon: Music },
  { id: 'encode', label: 'FFmpeg Encode', description: 'Hardware-accelerated MP4 export', icon: Film },
  { id: 'upload', label: 'YouTube Upload', description: 'Resumable channel auto-upload', icon: UploadCloud }
];

interface WorkflowProgressProps {
  currentStepIndex: number; // 0 to 5
  isProcessing: boolean;
  overallProgress: number; // 0 to 100
  currentStepTitle?: string;
  logs: string[];
  onReset?: () => void;
}

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  currentStepIndex,
  isProcessing,
  overallProgress,
  currentStepTitle,
  logs,
  onReset
}) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 relative overflow-hidden">
      {/* Ambient Crimson Top Glow */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-crimson-500/60 to-transparent" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-crimson-500 animate-ping' : 'bg-emerald-500'}`} />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
              Pipeline Workflow
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            {isProcessing ? (currentStepTitle || 'Processing tasks...') : 'Ready to start batch generation'}
          </p>
        </div>

        {/* Global Progress Metric & Reset Button */}
        <div className="flex items-center gap-3">
          <div className="w-36 sm:w-48 bg-neutral-900 rounded-full h-2.5 p-0.5 border border-white/5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-crimson-600 to-crimson-400 h-full rounded-full transition-all duration-300 ease-out shadow-sm shadow-crimson-500/50"
              style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
            />
          </div>
          <span className="font-mono text-xs font-bold text-crimson-400 min-w-[3rem] text-right">
            {overallProgress.toFixed(0)}%
          </span>
          {onReset && (
            <button
              onClick={onReset}
              className="px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-neutral-800 border border-white/10 text-[11px] font-mono text-neutral-400 hover:text-white transition-all ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Step Nodes Flowchart */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {WORKFLOW_STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isDone = isProcessing ? idx < currentStepIndex : false;
          const isCurrent = isProcessing && idx === currentStepIndex;

          return (
            <div
              key={step.id}
              className={`relative rounded-xl p-3.5 transition-all duration-300 border ${
                isCurrent
                  ? 'bg-crimson-950/40 border-crimson-500/60 shadow-lg shadow-crimson-500/10'
                  : isDone
                  ? 'bg-surface-subtle/80 border-emerald-500/30'
                  : 'bg-surface-subtle/40 border-white/5 opacity-65'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div 
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isCurrent
                      ? 'bg-crimson-600 text-white'
                      : isDone
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <StepIcon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="font-mono text-[10px] text-neutral-400">0{idx + 1}</span>
              </div>

              <div className="text-xs font-semibold text-neutral-200 truncate">{step.label}</div>
              <div className="text-[10px] text-neutral-400 truncate mt-0.5">{step.description}</div>
            </div>
          );
        })}
      </div>

      {/* Mini Console Logs output */}
      {logs.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-neutral-400">
          <span className="truncate max-w-xl text-neutral-300">
            <span className="text-crimson-400">log&gt;</span> {logs[logs.length - 1]}
          </span>
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
            {logs.length} events
          </span>
        </div>
      )}
    </div>
  );
};
