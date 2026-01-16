/**
 * Debug Page
 * Shows raw workout data and volume calculation details
 */

import { useState } from 'react';
import { useCurrentProfile } from '../context/ProfileContext';
import { useWorkouts } from '@db/hooks/useWorkouts';
import { calculateMuscleVolume } from '@core/volume-calculator';
import type { ExerciseMapping } from '@core/taxonomy';

// Load exercise mappings from config
import exerciseListJson from '../../../config/exercise_list_complete.json';

/**
 * Build exercise mappings from the config JSON
 */
function buildExerciseMappings(): Map<string, ExerciseMapping> {
  const mappings = new Map<string, ExerciseMapping>();

  for (const [exerciseName, muscleData] of Object.entries(exerciseListJson)) {
    if (exerciseName === '_comment') continue;

    const normalizedId = exerciseName.toLowerCase().replace(/\s+/g, '-');
    mappings.set(normalizedId, muscleData as ExerciseMapping);
  }

  return mappings;
}

const EXERCISE_MAPPINGS = buildExerciseMappings();

export function Debug(): React.ReactElement {
  const { currentProfile, isLoading: profileLoading } = useCurrentProfile();
  const [daysBack, setDaysBack] = useState(7);
  const { workouts, isLoading: workoutsLoading } = useWorkouts(currentProfile?.id ?? null, daysBack);

  if (profileLoading || workoutsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-300 border-t-white" />
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="rounded-lg bg-primary-700 p-8 text-center">
        <h2 className="mb-2 text-xl font-semibold text-white">No Profile Selected</h2>
      </div>
    );
  }

  // Flatten all sets
  const allSets = workouts.flatMap((w) => w.sets);

  // Group by exercise
  const exerciseStats: Record<string, { count: number; mapped: boolean; originalNames: Set<string> }> = {};
  for (const set of allSets) {
    if (set.setType === 'warmup') continue;

    if (!exerciseStats[set.exerciseId]) {
      exerciseStats[set.exerciseId] = { count: 0, mapped: false, originalNames: new Set() };
    }
    const stat = exerciseStats[set.exerciseId];
    if (stat) {
      stat.count++;
      stat.mapped = EXERCISE_MAPPINGS.has(set.exerciseId);
      stat.originalNames.add(set.originalName);
    }
  }

  // Calculate volumes
  const volumeMap = calculateMuscleVolume(allSets, EXERCISE_MAPPINGS);

  // Available mappings
  const availableMappings = Array.from(EXERCISE_MAPPINGS.keys()).sort();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Debug: Volume Calculations</h2>

      {/* Controls */}
      <div className="rounded-lg bg-primary-700 p-4">
        <label className="text-primary-200">Days back: </label>
        <select
          value={daysBack}
          onChange={(e) => setDaysBack(Number(e.target.value))}
          className="rounded bg-primary-800 px-2 py-1 text-white"
        >
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      {/* Summary */}
      <section className="rounded-lg bg-primary-700 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-primary-200">
          <div>Workouts loaded: <span className="text-white">{workouts.length}</span></div>
          <div>Total sets (non-warmup): <span className="text-white">{allSets.filter(s => s.setType !== 'warmup').length}</span></div>
          <div>Unique exercises: <span className="text-white">{Object.keys(exerciseStats).length}</span></div>
          <div>Mapped exercises: <span className="text-white">{Object.values(exerciseStats).filter(e => e.mapped).length}</span></div>
          <div>Unmapped exercises: <span className="text-red-400">{Object.values(exerciseStats).filter(e => !e.mapped).length}</span></div>
        </div>
      </section>

      {/* Exercise Mapping Status */}
      <section className="rounded-lg bg-primary-700 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Exercise Mapping Status</h3>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-primary-700">
              <tr className="text-left text-primary-300">
                <th className="pb-2">Exercise ID</th>
                <th className="pb-2">Original Name(s)</th>
                <th className="pb-2">Sets</th>
                <th className="pb-2">Mapped?</th>
              </tr>
            </thead>
            <tbody className="text-primary-200">
              {Object.entries(exerciseStats)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([exerciseId, stats]) => (
                  <tr key={exerciseId} className={stats.mapped ? '' : 'bg-red-900/30'}>
                    <td className="py-1 font-mono text-xs">{exerciseId}</td>
                    <td className="py-1 text-xs">{Array.from(stats.originalNames).join(', ')}</td>
                    <td className="py-1">{stats.count}</td>
                    <td className="py-1">{stats.mapped ? '✓' : '✗'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Volume Results */}
      <section className="rounded-lg bg-primary-700 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Calculated Volumes (ScientificMuscle)</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(volumeMap)
            .sort((a, b) => b[1] - a[1])
            .map(([muscle, volume]) => (
              <div key={muscle} className="flex justify-between text-primary-200">
                <span>{muscle}:</span>
                <span className="text-white">{volume.toFixed(2)}</span>
              </div>
            ))}
        </div>
        {Object.keys(volumeMap).length === 0 && (
          <p className="text-red-400">No volume calculated - likely all exercises are unmapped!</p>
        )}
      </section>

      {/* Available Mappings */}
      <section className="rounded-lg bg-primary-700 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Available Exercise Mappings</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          {availableMappings.map((id) => (
            <span key={id} className="rounded bg-primary-600 px-2 py-1 font-mono text-primary-200">
              {id}
            </span>
          ))}
        </div>
      </section>

      {/* Raw Workout Data */}
      <section className="rounded-lg bg-primary-700 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Raw Workouts (first 3)</h3>
        <pre className="max-h-96 overflow-auto rounded bg-primary-800 p-4 text-xs text-primary-200">
          {JSON.stringify(workouts.slice(0, 3), null, 2)}
        </pre>
      </section>
    </div>
  );
}
