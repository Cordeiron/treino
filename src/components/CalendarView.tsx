import { useMemo } from 'react';
import { ArrowRight, Check, Flag } from 'lucide-react';
import { DriverProfile, WorkoutDay } from '../types/racing';
import { getWeekKeyPrefix } from './MyWorkoutView';

interface CalendarViewProps {
  profile: DriverProfile;
  schedule: WorkoutDay[];
  todayDayIndex: number;
  completedDayKeys: string[];
  completedExerciseIdsByDay: Record<string, string[]>;
  onOpenWorkoutDay: (dayIdx: number) => void;
}

export function CalendarView({
  profile,
  schedule,
  todayDayIndex,
  completedDayKeys,
  completedExerciseIdsByDay,
  onOpenWorkoutDay,
}: CalendarViewProps) {
  const weekKey = useMemo(() => getWeekKeyPrefix(), []);
  const weeklyTargetCount = schedule.filter((d) => !d.isRestDay).length;
  const weeklyCompletedCount = schedule.filter(
    (d) => !d.isRestDay && completedDayKeys.includes(`${weekKey}_d${d.dayIndex}`)
  ).length;
  const isWeekFinished =
    weeklyTargetCount > 0 && weeklyCompletedCount >= weeklyTargetCount;
  const progressPct = Math.round(
    (weeklyCompletedCount / Math.max(1, weeklyTargetCount)) * 100
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 pb-24 lg:pb-10 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#707982]/25">
        <div>
          <p className="font-mono-telemetry text-xs tracking-[0.18em] text-[#00D2BE] uppercase">
            GRID DE LARGADA · SEMANA {weekKey}
          </p>
          <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-white">
            Calendário Semanal de Corrida
          </h1>
          <p className="mt-1 text-sm text-[#C5CBD0]">
            Divisão planejada para {profile.daysPerWeek} dias por semana · {profile.sessionMinutes} minutos por sessão.
          </p>
        </div>

        <div className="w-full lg:w-72 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono-telemetry">
            <span className="text-[#707982]">FINISH LINE</span>
            <span className="text-[#00D2BE]">
              {weeklyCompletedCount}/{weeklyTargetCount} ({progressPct}%)
            </span>
          </div>
          <div className="h-2 w-full rounded bg-[#151A20] overflow-hidden">
            <div
              className="h-full bg-[#00D2BE] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {isWeekFinished && (
        <div className="p-6 rounded-md bg-[#151A20] border border-[#00D2BE] flex items-center gap-4">
          <div className="w-11 h-11 rounded bg-[#00D2BE] text-[#080B0E] flex items-center justify-center shrink-0">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <p className="font-mono-telemetry text-xs text-[#00D2BE] uppercase">
              CHECKERED FLAG! 🏁
            </p>
            <p className="mt-1 text-base font-bold text-white">
              Mais uma semana concluída. Você está evoluindo!
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {schedule.map((day) => {
          const dayKey = `${weekKey}_d${day.dayIndex}`;
          const isDone = completedDayKeys.includes(dayKey);
          const isToday = day.dayIndex === todayDayIndex;
          const completedCount = (completedExerciseIdsByDay[dayKey] ?? []).length;

          return (
            <div
              key={day.dayIndex}
              className={`rounded-md border p-5 flex flex-col justify-between transition-colors ${
                isDone
                  ? 'bg-[#151A20] border-[#00D2BE]'
                  : isToday
                    ? 'bg-[#151A20] border-[#00D2BE]/60'
                    : 'bg-[#151A20] border-[#707982]/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-telemetry text-xs text-[#00D2BE] uppercase">
                    {day.dayName} · {day.sessionCode}
                  </span>
                  {isDone ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#00D2BE] text-[#080B0E] font-mono-telemetry text-[10px] font-bold uppercase">
                      <Check className="w-3 h-3" />
                      Feito
                    </span>
                  ) : isToday ? (
                    <span className="px-2 py-0.5 rounded bg-[#080B0E] border border-[#00D2BE]/50 font-mono-telemetry text-[10px] text-[#00D2BE] uppercase">
                      Hoje
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-2 font-display text-lg font-bold text-white">
                  {day.title}
                </h2>
                <p className="mt-1 text-xs text-[#C5CBD0]">{day.muscleGroups}</p>

                <ul className="mt-4 space-y-1.5 text-xs text-[#707982]">
                  {day.exercises.map((ex) => (
                    <li key={ex.id} className="truncate">
                      <span className="font-mono-telemetry text-[#C5CBD0] mr-1.5">
                        {String(ex.orderIndex).padStart(2, '0')}
                      </span>
                      {ex.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 pt-4 border-t border-[#707982]/20 flex items-center justify-between">
                <span className="font-mono-telemetry text-xs text-[#707982]">
                  {completedCount}/{day.exercises.length} exercícios · {day.estimatedMinutes} min
                </span>

                <button
                  type="button"
                  onClick={() => onOpenWorkoutDay(day.dayIndex)}
                  className="inline-flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-[#00D2BE] hover:text-white cursor-pointer"
                >
                  <span>{day.isRestDay ? 'Ver Pit Stop' : 'Abrir Treino'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
