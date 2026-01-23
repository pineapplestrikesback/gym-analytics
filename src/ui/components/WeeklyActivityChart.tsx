/**
 * WeeklyActivityChart Component
 * Displays daily set counts in a bold, gym-inspired bar chart
 */

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { useDailyStats, type DailyActivity } from '../../db/hooks/useDailyStats';
import { useCurrentProfile } from '../context/ProfileContext';

interface WeeklyActivityChartProps {
  profileId?: string;
}

type ViewMode = 'last7days' | 'calendarWeek';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DailyActivity }>;
}

/**
 * Custom Tooltip Component
 */
function CustomTooltip({ active, payload }: CustomTooltipProps): React.ReactElement | null {
  if (!active || !payload || payload.length === 0) return null;

  const dayData = payload[0]?.payload;
  if (!dayData) return null;

  const date = dayData.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="rounded border-2 border-cyan-500/50 bg-zinc-950 px-3 py-2 shadow-xl">
      <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">{date}</p>
      <p className="mt-1 text-lg font-black text-white">
        {dayData.totalSets} <span className="text-sm font-normal text-zinc-400">sets</span>
      </p>
      {dayData.workouts.length > 0 && (
        <p className="mt-1 text-xs text-zinc-400">
          {dayData.workouts.length} workout{dayData.workouts.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

/**
 * Loading Skeleton
 */
function ChartSkeleton(): React.ReactElement {
  return (
    <div className="flex h-64 items-end justify-around gap-2 px-4">
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className="w-full animate-pulse rounded-t bg-zinc-800"
          style={{
            height: `${Math.random() * 60 + 40}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Empty State
 */
function EmptyState(): React.ReactElement {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <div className="mb-2 text-4xl font-black text-zinc-700">0</div>
        <p className="text-sm uppercase tracking-wider text-zinc-600">No activity tracked</p>
      </div>
    </div>
  );
}

/**
 * Day Detail Panel (Placeholder)
 */
interface DayDetailPanelProps {
  day: DailyActivity;
  onClose: () => void;
}

function DayDetailPanel({ day, onClose }: DayDetailPanelProps): React.ReactElement {
  const date = day.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mt-4 animate-slideDown overflow-hidden rounded-lg border-2 border-cyan-500/30 bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 bg-zinc-950 px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">{day.dayLabel}</p>
          <p className="text-sm text-zinc-400">{date}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
          aria-label="Close details"
        >
          Close
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-white">{day.totalSets}</span>
          <span className="text-sm uppercase tracking-wider text-zinc-500">total sets</span>
        </div>

        {day.workouts.length === 0 ? (
          <p className="text-sm text-zinc-600">No workouts recorded</p>
        ) : (
          <div className="space-y-3">
            {day.workouts.map((workout: DailyActivity['workouts'][0]) => (
              <div key={workout.id} className="rounded border border-zinc-800 bg-zinc-950 p-3">
                <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-white">
                  {workout.title}
                </h4>
                <div className="space-y-1">
                  {workout.exercises.map(
                    (exercise: DailyActivity['workouts'][0]['exercises'][0], idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">{exercise.name}</span>
                        <span className="font-bold text-cyan-400">
                          {exercise.sets} set{exercise.sets > 1 ? 's' : ''}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main WeeklyActivityChart Component
 */
export function WeeklyActivityChart({
  profileId: propProfileId,
}: WeeklyActivityChartProps): React.ReactElement {
  const { currentProfile } = useCurrentProfile();
  const profileId = propProfileId ?? currentProfile?.id ?? null;

  const [viewMode, setViewMode] = useState<ViewMode>('last7days');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  const { days, isLoading, error } = useDailyStats(profileId, { mode: viewMode });

  if (isLoading) {
    return (
      <div className="rounded-lg border-2 border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Weekly Activity
          </h3>
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border-2 border-red-900/50 bg-zinc-950 p-4">
        <p className="text-sm text-red-400">Error loading activity data</p>
      </div>
    );
  }

  const hasData = days.some((day: DailyActivity) => day.totalSets > 0);
  const maxSets = Math.max(...days.map((d: DailyActivity) => d.totalSets), 10); // Min domain of 10

  // Prepare data for Recharts
  const chartData = days.map((day: DailyActivity, index: number) => ({
    ...day,
    index,
  }));

  const selectedDay = selectedDayIndex !== null ? days[selectedDayIndex] : null;

  return (
    <div className="rounded-lg border-2 border-zinc-800 bg-zinc-950">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-white">Weekly Activity</h3>

        {/* View Mode Toggle */}
        <div className="flex gap-0 overflow-hidden rounded border border-zinc-700">
          <button
            onClick={() => {
              setViewMode('last7days');
              setSelectedDayIndex(null);
            }}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-all ${
              viewMode === 'last7days'
                ? 'bg-cyan-500 text-zinc-950'
                : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
            }`}
          >
            Last 7
          </button>
          <button
            onClick={() => {
              setViewMode('calendarWeek');
              setSelectedDayIndex(null);
            }}
            className={`border-l border-zinc-700 px-3 py-1 text-xs font-bold uppercase tracking-wider transition-all ${
              viewMode === 'calendarWeek'
                ? 'bg-cyan-500 text-zinc-950'
                : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
            }`}
          >
            This Week
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4 [&_*]:outline-none [&_*:focus]:outline-none [&_*:focus-visible]:outline-none [&_svg]:outline-none">
        {!hasData ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="dayLabel"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: '#71717a',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: '#52525b',
                  fontSize: 10,
                  fontWeight: 600,
                }}
                domain={[0, maxSets]}
                allowDataOverflow={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar
                dataKey="totalSets"
                radius={[4, 4, 0, 0]}
                onClick={(data) => {
                  const payload = data as { index?: number };
                  if (payload.index !== undefined) {
                    setSelectedDayIndex(payload.index === selectedDayIndex ? null : payload.index);
                  }
                }}
                cursor="pointer"
                animationDuration={300}
                animationEasing="ease-out"
              >
                {chartData.map((entry: DailyActivity & { index: number }, index: number) => {
                  const isSelected = selectedDayIndex === index;
                  const hasActivity = entry.totalSets > 0;

                  // Color logic
                  let fillColor = '#27272a'; // zinc-800 for empty
                  if (hasActivity) {
                    fillColor = isSelected ? '#22d3ee' : '#06b6d4'; // cyan-400 selected, cyan-500 default
                  }

                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={fillColor}
                      stroke="none"
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Day Detail Panel */}
      {selectedDay && (
        <div className="border-t border-zinc-800 px-4 pb-4">
          <DayDetailPanel day={selectedDay} onClose={() => setSelectedDayIndex(null)} />
        </div>
      )}
    </div>
  );
}
