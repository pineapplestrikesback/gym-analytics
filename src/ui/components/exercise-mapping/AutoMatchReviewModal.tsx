/**
 * Auto Match Review Modal Component
 * Shows AI-suggested exercise mappings with confidence scores for user review
 */

import { useState } from 'react';
import { useCreateExerciseMapping } from '@db/hooks/useExerciseMappings';
import { ExerciseSearchModal } from './ExerciseSearchModal';
import type { AutoMatchSuggestion } from '@core/exercise-auto-match';
import type { UnmappedExercise } from '@db/schema';

interface AutoMatchReviewModalProps {
  profileId: string;
  suggestions: AutoMatchSuggestion[];
  unmappedExercises: UnmappedExercise[]; // To open ExerciseSearchModal for editing
  onClose: () => void;
}

export function AutoMatchReviewModal({
  profileId,
  suggestions,
  unmappedExercises,
  onClose,
}: AutoMatchReviewModalProps): React.ReactElement {
  const [remainingSuggestions, setRemainingSuggestions] = useState(suggestions);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingSuggestion, setEditingSuggestion] = useState<AutoMatchSuggestion | null>(null);
  const { createMapping, isCreating } = useCreateExerciseMapping();

  // Handle accepting a single suggestion
  const handleAcceptSuggestion = async (suggestion: AutoMatchSuggestion): Promise<void> => {
    setProcessingId(suggestion.unmappedNormalizedName);
    try {
      await createMapping({
        profileId,
        originalPattern: suggestion.unmappedNormalizedName,
        canonicalExerciseId: suggestion.suggestedCanonicalId,
        customMuscleValues: null,
        isIgnored: false,
      });

      // Remove from remaining suggestions
      setRemainingSuggestions((prev) =>
        prev.filter((s) => s.unmappedNormalizedName !== suggestion.unmappedNormalizedName)
      );
    } catch (error) {
      console.error('Failed to accept suggestion:', error);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle skipping a suggestion
  const handleSkipSuggestion = (suggestion: AutoMatchSuggestion): void => {
    setRemainingSuggestions((prev) =>
      prev.filter((s) => s.unmappedNormalizedName !== suggestion.unmappedNormalizedName)
    );
  };

  // Handle editing a suggestion
  const handleEditSuggestion = (suggestion: AutoMatchSuggestion): void => {
    setEditingSuggestion(suggestion);
  };

  // Handle accepting all suggestions
  const handleAcceptAll = async (): Promise<void> => {
    for (const suggestion of remainingSuggestions) {
      setProcessingId(suggestion.unmappedNormalizedName);
      try {
        await createMapping({
          profileId,
          originalPattern: suggestion.unmappedNormalizedName,
          canonicalExerciseId: suggestion.suggestedCanonicalId,
          customMuscleValues: null,
          isIgnored: false,
        });
      } catch (error) {
        console.error('Failed to accept suggestion:', error);
      }
    }
    setProcessingId(null);
    onClose();
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Find unmapped exercise for editing
  const getUnmappedExerciseForSuggestion = (
    suggestion: AutoMatchSuggestion
  ): UnmappedExercise | null => {
    return (
      unmappedExercises.find(
        (ex) => ex.normalizedName === suggestion.unmappedNormalizedName
      ) ?? null
    );
  };

  // If editing, show the ExerciseSearchModal with values pre-filled from the suggested exercise
  if (editingSuggestion) {
    const unmappedExercise = getUnmappedExerciseForSuggestion(editingSuggestion);
    if (unmappedExercise) {
      return (
        <ExerciseSearchModal
          profileId={profileId}
          unmappedExercise={unmappedExercise}
          prefillFromExercise={editingSuggestion.suggestedCanonicalName}
          onClose={() => {
            setEditingSuggestion(null);
            onClose(); // Close auto-match modal too
          }}
        />
      );
    }
  }

  // Success state when all suggestions reviewed
  if (remainingSuggestions.length === 0) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
        onClick={handleBackdropClick}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes successPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
        `}</style>

        <div className="flex max-h-[90vh] w-full max-w-2xl flex-col border-2 border-cyan-500 bg-zinc-900 p-12 text-center shadow-[0_0_60px_rgba(6,182,212,0.3)]">
          <div className="mx-auto mb-6 h-24 w-24 rounded-full border-2 border-cyan-500 bg-cyan-500/10 p-6 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
            <svg
              className="h-full w-full text-cyan-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
              style={{ animation: 'successPulse 2s ease-in-out infinite' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mb-3 font-mono text-3xl font-black uppercase tracking-tight text-white">
            All Reviewed
          </h3>
          <p className="mb-8 font-mono text-sm text-zinc-500">
            All suggestions have been processed.
          </p>
          <button
            onClick={onClose}
            className="mx-auto border-2 border-cyan-500 bg-cyan-500 px-8 py-4 font-mono text-sm font-bold uppercase tracking-wider text-zinc-900 transition-all hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
      onClick={handleBackdropClick}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes confidencePulse {
          0%, 100% { box-shadow: 0 0 0 rgba(6,182,212,0.4); }
          50% { box-shadow: 0 0 15px rgba(6,182,212,0.6); }
        }
        .modal-content {
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      <div className="modal-content flex max-h-[90vh] w-full max-w-3xl flex-col border-2 border-cyan-500 bg-zinc-900 shadow-[0_0_60px_rgba(6,182,212,0.3)]">
        {/* Modal Header */}
        <div className="border-b-2 border-cyan-500 bg-gradient-to-r from-zinc-800 via-zinc-850 to-zinc-800 p-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <div className="font-mono text-xs uppercase tracking-widest text-cyan-500">
              Auto-Match Review
            </div>
          </div>
          <h2 className="mb-2 font-mono text-2xl font-black text-white">
            {remainingSuggestions.length} {remainingSuggestions.length === 1 ? 'Match' : 'Matches'}{' '}
            Found
          </h2>
          <p className="font-mono text-sm text-zinc-500">
            Review and confirm AI-suggested exercise mappings below
          </p>
        </div>

        {/* Suggestions List */}
        <div className="flex-1 overflow-y-auto bg-zinc-950 p-4">
          <div className="space-y-3">
            {remainingSuggestions.map((suggestion, index) => {
              const confidencePercent = Math.round(suggestion.confidence * 100);
              const isProcessing = processingId === suggestion.unmappedNormalizedName;

              // Confidence color based on score
              const confidenceColor =
                confidencePercent >= 90
                  ? 'text-green-500 border-green-500'
                  : confidencePercent >= 75
                  ? 'text-cyan-500 border-cyan-500'
                  : 'text-amber-500 border-amber-500';

              return (
                <div
                  key={suggestion.unmappedNormalizedName}
                  className="relative overflow-hidden border-2 border-zinc-700 bg-zinc-900 p-5 transition-all hover:border-zinc-600"
                  style={{
                    animation: 'slideInRight 0.4s ease-out',
                    animationDelay: `${index * 0.05}s`,
                    animationFillMode: 'backwards',
                    opacity: isProcessing ? 0.5 : 1,
                    pointerEvents: isProcessing ? 'none' : 'auto',
                  }}
                >
                  {/* Processing overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/80">
                      <div className="relative h-8 w-8">
                        <div className="absolute inset-0 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Exercise Names */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
                        <div className="flex-1">
                          <div className="mb-1 font-mono text-xs uppercase tracking-wider text-zinc-600">
                            Original Exercise
                          </div>
                          <div className="font-mono text-base font-bold text-white">
                            {suggestion.unmappedExerciseName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pl-4">
                        <svg
                          className="h-5 w-5 text-cyan-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                        <div className="flex-1">
                          <div className="mb-1 font-mono text-xs uppercase tracking-wider text-cyan-600">
                            Suggested Match
                          </div>
                          <div className="font-mono text-base font-bold text-cyan-400">
                            {suggestion.suggestedCanonicalName}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Confidence & Reason */}
                    <div className="flex flex-wrap items-center gap-4 border-t border-zinc-800 pt-4">
                      {/* Confidence Badge */}
                      <div
                        className={`rounded border-2 ${confidenceColor} bg-opacity-10 px-4 py-2 transition-all`}
                        style={{ animation: 'confidencePulse 2s ease-in-out infinite' }}
                      >
                        <div className="text-center">
                          <div className={`font-mono text-xl font-black ${confidenceColor.split(' ')[0]}`}>
                            {confidencePercent}%
                          </div>
                          <div className="font-mono text-[10px] uppercase tracking-wider opacity-60">
                            Confidence
                          </div>
                        </div>
                      </div>

                      {/* Match Reason */}
                      <div className="flex-1 font-mono text-xs text-zinc-500">
                        <span className="text-zinc-600">Reason: </span>
                        {suggestion.matchReason}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => void handleAcceptSuggestion(suggestion)}
                        disabled={isCreating}
                        className="border-2 border-cyan-500 bg-cyan-500 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 transition-all hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleSkipSuggestion(suggestion)}
                        className="border-2 border-zinc-700 bg-zinc-800 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500 transition-all hover:border-zinc-600 hover:bg-zinc-700 hover:text-white"
                      >
                        Skip
                      </button>
                      <button
                        onClick={() => handleEditSuggestion(suggestion)}
                        className="border-2 border-zinc-700 bg-zinc-800 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-amber-500 transition-all hover:border-amber-500 hover:bg-zinc-700 hover:text-amber-400"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="grid grid-cols-2 gap-0 border-t-2 border-zinc-700">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="border-r-2 border-zinc-700 bg-zinc-800 px-4 py-4 font-mono text-sm font-bold uppercase tracking-wider text-zinc-500 transition-all hover:bg-zinc-700 hover:text-white disabled:opacity-50"
          >
            Close
          </button>
          <button
            onClick={() => void handleAcceptAll()}
            disabled={isCreating || remainingSuggestions.length === 0}
            className="bg-cyan-500 px-4 py-4 font-mono text-sm font-bold uppercase tracking-wider text-zinc-900 transition-all hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] disabled:opacity-50"
          >
            {isCreating ? 'Processing...' : `Accept All (${remainingSuggestions.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
