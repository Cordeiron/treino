import { useMemo } from 'react';
import {
  ArrowRight,
  Calendar,
  Check,
  Flag,
  Heart,
  Radio,
  Trophy,
} from 'lucide-react';
import { GOAL_OPTIONS } from '../data/exercisesLibrary';
import {
  DAILY_CHECKIN_OPTIONS,
  getDailyMuscleTip,
  getDailyNauhanMessage,
  MUSCLE_GROUP_LABELS,
} from '../data/nauhanMessages';
import {
  DailyCheckinEntry,
  DailyMoodId,
  DriverProfile,
  LoggedSession,
  MuscleTipGroup,
  NavSection,
  WorkoutDay,
} from '../types/racing';
import { getWeekKeyPrefix } from './MyWorkoutView';

interface CockpitDashboardProps {
  profile: DriverProfile;
  schedule: WorkoutDay[];
  todayDayIndex: number;
  completedExerciseIdsByDay: Record<string, string[]>;
  completedDayKeys: string[];
  loggedSessions: LoggedSession[];
  todayCheckin: DailyCheckinEntry | null;
  onSaveCheckin: (mood: DailyMoodId) => void;
  onOpenWorkoutDay: (dayIdx: number) => void;
  onNavigate: (section: NavSection) => void;
}

export function CockpitDashboard({
  profile,
  schedule,
  todayDayIndex,
  completedExerciseIdsByDay,
  completedDayKeys,
  loggedSessions,
  todayCheckin,
  onSaveCheckin,
  onOpenWorkoutDay,
  onNavigate,
}: CockpitDashboardProps) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const weekKey = useMemo(() => getWeekKeyPrefix(), []);
  const goalInfo = GOAL_OPTIONS.find((g) => g.id === profile.goal) ?? GOAL_OPTIONS[0];
  const dailyMessage = useMemo(() => getDailyNauhanMessage(todayStr), [todayStr]);

  const todayWorkout = schedule[todayDayIndex] ?? schedule[0];
  const nextWorkout = useMemo(() => {
    for (let offset = 1; offset <= 7; offset++) {
      const idx = (todayDayIndex + offset) % 7;
      const candidate = schedule[idx];
      if (candidate && !candidate.isRestDay) {
        return candidate;
      }
    }
    return schedule[0];
  }, [schedule, todayDayIndex]);

  const weeklyTargetCount = schedule.filter((d) => !d.isRestDay).length;
  const weeklyCompletedCount = schedule.filter(
    (d) => !d.isRestDay && completedDayKeys.includes(`${weekKey}_d${d.dayIndex}`)
  ).length;
  const weekProgressPct = Math.round(
    (weeklyCompletedCount / Math.max(1, weeklyTargetCount)) * 100
  );
  const isWeekFinished =
    weeklyTargetCount > 0 && weeklyCompletedCount >= weeklyTargetCount;

  const totalExercisesDone = useMemo(() => {
    return Object.values(completedExerciseIdsByDay).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
  }, [completedExerciseIdsByDay]);

  const bestLapMaxKg = useMemo(() => {
    let maxKg = 0;
    loggedSessions.forEach((s) => {
      s.sets.forEach((st) => {
        if (st.weightKg > maxKg) maxKg = st.weightKg;
      });
    });
    return maxKg;
  }, [loggedSessions]);

  const featuredMuscleGroup: MuscleTipGroup =
    todayWorkout?.exercises[0]?.muscleTipGroup ?? 'gluteos';
  const featuredMuscleTip = useMemo(
    () => getDailyMuscleTip(featuredMuscleGroup, todayStr),
    [featuredMuscleGroup, todayStr]
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 pb-24 lg:pb-10 space-y-8">
      {/* Top Cockpit Identity & Telemetry Strip */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#707982]/25">
        <div>
          <p className="font-mono-telemetry text-xs tracking-[0.2em] text-[#00D2BE] uppercase">
            COCKPIT DA PILOTO · TEMPORADA EXCLUSIVA
          </p>
          <h1 className="mt-1.5 font-display text-2xl sm:text-4xl font-bold text-white">
            Olá, {profile.name}
          </h1>
          <p className="mt-1 text-sm text-[#C5CBD0]">
            Objetivo atual:{' '}
            <span className="text-white font-semibold">
              {goalInfo.code} — {goalInfo.title} {goalInfo.emoji}
            </span>
          </p>
        </div>

        {/* Unboxed Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <span className="text-xs text-[#707982]">Treinos Concluídos</span>
            <p className="mt-0.5 font-mono-telemetry text-xl font-bold text-white">
              {completedDayKeys.length + loggedSessions.length}
            </p>
          </div>
          <div>
            <span className="text-xs text-[#707982]">Exercícios Feitos</span>
            <p className="mt-0.5 font-mono-telemetry text-xl font-bold text-[#00D2BE]">
              {totalExercisesDone}
            </p>
          </div>
          <div>
            <span className="text-xs text-[#707982]">Frequência</span>
            <p className="mt-0.5 font-mono-telemetry text-xl font-bold text-white">
              {profile.daysPerWeek}x{' '}
              <span className="text-xs font-normal text-[#C5CBD0]">/sem</span>
            </p>
          </div>
          <div>
            <span className="text-xs text-[#707982]">BEST LAP</span>
            <p className="mt-0.5 font-mono-telemetry text-xl font-bold text-white">
              {bestLapMaxKg > 0 ? `${bestLapMaxKg} kg` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Checkered Flag Celebration */}
      {isWeekFinished && (
        <div className="p-6 rounded-md bg-[#151A20] border border-[#00D2BE] shadow-[0_0_24px_rgba(0,210,190,0.16)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded bg-[#00D2BE] text-[#080B0E] flex items-center justify-center shrink-0">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <p className="font-mono-telemetry text-xs tracking-[0.18em] text-[#00D2BE] uppercase">
                CHECKERED FLAG! 🏁
              </p>
              <h2 className="mt-1 font-display text-lg sm:text-xl font-bold text-white">
                Mais uma semana concluída. Você está evoluindo!
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(NavSection.MINHA_EVOLUCAO)}
            className="px-4 py-2.5 rounded bg-[#00D2BE] text-[#080B0E] font-display text-xs font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap"
          >
            Ver Minha Evolução
          </button>
        </div>
      )}

      {/* Row 1: RACE DAY (Today) + UMA MENSAGEM DO NAUHAN ❤️ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* RACE DAY Card */}
        <div className="lg:col-span-7 bg-[#151A20] border border-[#707982]/30 rounded-md p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono-telemetry text-xs tracking-[0.18em] text-[#00D2BE] uppercase">
                RACE DAY · {todayWorkout.dayName} ({todayWorkout.sessionCode})
              </span>
              <span className="font-mono-telemetry text-xs text-[#C5CBD0]">
                {todayWorkout.estimatedMinutes} min
              </span>
            </div>

            <h2 className="mt-2 font-display text-xl sm:text-2xl font-bold text-white">
              {todayWorkout.title}
            </h2>
            <p className="mt-1 text-sm text-[#C5CBD0]">{todayWorkout.muscleGroups}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {todayWorkout.exercises.slice(0, 4).map((ex) => (
                <span
                  key={ex.id}
                  className="px-2.5 py-1 rounded bg-[#080B0E] border border-[#707982]/25 text-xs text-[#C5CBD0]"
                >
                  {ex.name}
                </span>
              ))}
              {todayWorkout.exercises.length > 4 && (
                <span className="px-2.5 py-1 rounded bg-[#080B0E] text-xs text-[#707982]">
                  +{todayWorkout.exercises.length - 4} exercícios
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[#707982]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-[#707982]">
              Próximo treino:{' '}
              <span className="text-[#C5CBD0] font-medium">
                {nextWorkout.dayName} — {nextWorkout.title}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onOpenWorkoutDay(todayWorkout.dayIndex)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded bg-[#00D2BE] text-[#080B0E] font-display text-xs font-bold uppercase tracking-wider hover:bg-[#1de6d2] cursor-pointer whitespace-nowrap"
            >
              <span>Abrir Treino de Hoje</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* UMA MENSAGEM DO NAUHAN ❤️ */}
        <div className="lg:col-span-5 bg-[#151A20] border border-[#00D2BE]/45 rounded-md p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-[#00D2BE]" />
                <span className="font-mono-telemetry text-xs tracking-[0.16em] text-[#00D2BE] uppercase">
                  UMA MENSAGEM DO NAUHAN ❤️
                </span>
              </div>
              <span className="font-mono-telemetry text-[11px] text-[#707982]">
                Recado do Dia
              </span>
            </div>

            <blockquote className="mt-5 text-base sm:text-lg font-medium text-white leading-relaxed">
              &ldquo;{dailyMessage.text}&rdquo;
            </blockquote>
            <p className="mt-3 font-mono-telemetry text-xs text-[#00D2BE]">
              — Nauhan ❤️
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#707982]/20 flex items-center justify-between">
            <span className="text-xs text-[#707982]">
              Novo recado todos os dias
            </span>
            <button
              type="button"
              onClick={() => onNavigate(NavSection.RECADOS_NAUHAN)}
              className="text-xs font-display font-bold uppercase tracking-wider text-[#00D2BE] hover:text-white cursor-pointer"
            >
              Ver Dicas por Músculo →
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: GRID DE LARGADA & RACE PROGRESS + DICAS DO NAUHAN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRID DE LARGADA + RACE PROGRESS */}
        <div className="lg:col-span-7 bg-[#151A20] border border-[#707982]/30 rounded-md p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono-telemetry text-xs text-[#00D2BE] uppercase">
                GRID DE LARGADA · SEMANA ATUAL
              </p>
              <h2 className="mt-1 font-display text-lg font-bold text-white">
                Progresso da Semana ({weeklyCompletedCount}/{weeklyTargetCount} treinos)
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigate(NavSection.CALENDARIO)}
              className="inline-flex items-center gap-1.5 text-xs text-[#C5CBD0] hover:text-[#00D2BE] cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendário</span>
            </button>
          </div>

          {/* RACE PROGRESS Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-mono-telemetry text-[#707982]">RACE PROGRESS</span>
              <span className="font-mono-telemetry text-[#00D2BE] font-semibold">
                {weekProgressPct}%
              </span>
            </div>
            <div className="h-2 w-full rounded bg-[#080B0E] overflow-hidden">
              <div
                className="h-full bg-[#00D2BE] transition-all duration-300"
                style={{ width: `${weekProgressPct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {schedule.map((day) => {
              const dayKey = `${weekKey}_d${day.dayIndex}`;
              const done = completedDayKeys.includes(dayKey);
              const isToday = day.dayIndex === todayDayIndex;
              return (
                <button
                  key={day.dayIndex}
                  type="button"
                  onClick={() => onOpenWorkoutDay(day.dayIndex)}
                  className={`p-2.5 rounded border text-center transition-colors cursor-pointer ${
                    done
                      ? 'bg-[#00D2BE]/15 border-[#00D2BE]'
                      : isToday
                        ? 'bg-[#080B0E] border-[#00D2BE]/60'
                        : 'bg-[#080B0E] border-[#707982]/25 hover:border-[#C5CBD0]/50'
                  }`}
                >
                  <p className="font-display text-xs font-bold text-white">{day.shortDay}</p>
                  <p className="mt-1 font-mono-telemetry text-[10px] text-[#707982] truncate">
                    {day.isRestDay ? 'PIT' : day.sessionCode}
                  </p>
                  <div className="mt-1.5 h-4 flex items-center justify-center">
                    {done ? (
                      <Check className="w-3.5 h-3.5 text-[#00D2BE]" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#707982]/40" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* DICAS DO NAUHAN ❤️ Highlight */}
        <div className="lg:col-span-5 bg-[#151A20] border border-[#707982]/30 rounded-md p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-[#00D2BE]" />
              <span className="font-mono-telemetry text-xs text-[#00D2BE] uppercase">
                DICAS DO NAUHAN ❤️ · {MUSCLE_GROUP_LABELS[featuredMuscleGroup]}
              </span>
            </div>
            <p className="mt-4 text-sm sm:text-base text-white leading-relaxed">
              &ldquo;{featuredMuscleTip.text}&rdquo;
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#707982]/20 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onNavigate(NavSection.MINHA_EVOLUCAO)}
              className="inline-flex items-center gap-1.5 text-xs text-[#C5CBD0] hover:text-white cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-[#00D2BE]" />
              <span>Registrar Cargas</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate(NavSection.RECADOS_NAUHAN)}
              className="text-xs font-medium text-[#00D2BE] hover:text-white cursor-pointer"
            >
              Todos os 10 grupos →
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Check-in Diário — COMO ESTÁ A NOSSA PILOTA HOJE? */}
      <div className="bg-[#151A20] border border-[#707982]/30 rounded-md p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="font-mono-telemetry text-xs tracking-[0.18em] text-[#00D2BE] uppercase">
              CHECK-IN DIÁRIO
            </p>
            <h2 className="mt-1 font-display text-lg sm:text-xl font-bold text-white">
              COMO ESTÁ A NOSSA PILOTA HOJE?
            </h2>
          </div>
          {todayCheckin && (
            <span className="font-mono-telemetry text-xs text-[#00D2BE]">
              {todayCheckin.energyLabel}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {DAILY_CHECKIN_OPTIONS.map((opt) => {
            const active = todayCheckin?.mood === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSaveCheckin(opt.id)}
                className={`p-3.5 rounded text-left text-xs sm:text-sm font-medium border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                  active
                    ? 'bg-[#00D2BE] border-[#00D2BE] text-[#080B0E] font-bold'
                    : 'bg-[#080B0E] border-[#707982]/35 text-[#C5CBD0] hover:border-[#00D2BE] hover:text-white'
                }`}
              >
                <span>{opt.label}</span>
                {active && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>

        {todayCheckin && (
          <div className="p-4 rounded bg-[#080B0E] border border-[#00D2BE]/45 flex items-start gap-3">
            <Radio className="w-4 h-4 text-[#00D2BE] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-mono-telemetry text-[#00D2BE] uppercase">
                Resposta do Nauhan para você hoje
              </p>
              <p className="mt-1 text-sm text-white leading-relaxed">
                &ldquo;{todayCheckin.nauhanReply}&rdquo;
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
