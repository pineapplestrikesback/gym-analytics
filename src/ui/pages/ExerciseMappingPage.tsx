/**
 * Exercise Mapping Page
 * Interface for mapping unmapped exercises to canonical exercises
 */

import { useState } from 'react';
import { useCurrentProfile } from '../context/ProfileContext';
import { UnmappedExerciseList } from '../components/exercise-mapping/UnmappedExerciseList';
import { ExistingMappingsList } from '../components/exercise-mapping/ExistingMappingsList';

type TabView = 'unmapped' | 'mappings';

export function ExerciseMappingPage(): React.ReactElement {
  const { currentProfile, isLoading } = useCurrentProfile();
  const [activeTab, setActiveTab] = useState<TabView>('unmapped');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          <div
            className="absolute inset-0 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent opacity-30"
            style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
          />
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div
        className="relative overflow-hidden rounded border-2 border-zinc-700 bg-gradient-to-br from-zinc-900 to-zinc-950 p-10 text-center"
        style={{ animation: 'fadeIn 0.4s ease-out' }}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(113,113,122,0.05),transparent_50%)]" />
        <div className="relative">
          <h2 className="mb-3 font-mono text-2xl font-black uppercase tracking-tight text-white">
            No Profile Selected
          </h2>
          <p className="font-mono text-sm text-zinc-500">
            Create or select a profile to manage exercise mappings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* Page Header */}
      <div
        className="relative border-b-2 border-cyan-500 pb-6"
        style={{ animation: 'slideDown 0.4s ease-out' }}
      >
        <div className="absolute bottom-0 left-0 h-0.5 w-32 bg-gradient-to-r from-cyan-400 to-transparent" />
        <h1 className="font-mono text-4xl font-black uppercase tracking-tighter text-white">
          Exercise Mapping
        </h1>
        <p className="mt-3 font-mono text-sm text-zinc-500">
          Map your workout exercises to canonical muscle groups
        </p>
      </div>

      {/* Tab Navigation */}
      <div
        className="flex gap-0 overflow-hidden border-2 border-zinc-700"
        style={{ animation: 'fadeIn 0.5s ease-out' }}
      >
        <button
          onClick={() => setActiveTab('unmapped')}
          className={`group relative flex-1 overflow-hidden border-r-2 border-zinc-700 px-8 py-5 font-mono text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'unmapped'
              ? 'bg-cyan-500 text-zinc-900 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
              : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          {activeTab !== 'unmapped' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          )}
          <span className="relative flex items-center justify-center gap-2">
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${
                activeTab === 'unmapped' ? 'scale-110' : 'group-hover:scale-110'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Unmapped
          </span>
        </button>
        <button
          onClick={() => setActiveTab('mappings')}
          className={`group relative flex-1 overflow-hidden px-8 py-5 font-mono text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'mappings'
              ? 'bg-cyan-500 text-zinc-900 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
              : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          {activeTab !== 'mappings' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          )}
          <span className="relative flex items-center justify-center gap-2">
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${
                activeTab === 'mappings' ? 'scale-110' : 'group-hover:scale-110'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            My Mappings
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]" style={{ animation: 'fadeIn 0.6s ease-out' }}>
        {activeTab === 'unmapped' && <UnmappedExerciseList profileId={currentProfile.id} />}
        {activeTab === 'mappings' && <ExistingMappingsList profileId={currentProfile.id} />}
      </div>
    </div>
  );
}
