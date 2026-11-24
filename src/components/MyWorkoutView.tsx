import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  Play,
  PlusCircle,
  Radio,
  RotateCcw,
  Square,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { GOAL_OPTIONS } from '../data/exercisesLibrary';
import { getDailyMuscleTip, MUSCLE_GROUP_LABELS } from '../data/nauhanMessages';
import { DriverProfile, WorkoutDay, WorkoutExercise } from '../types/racing';
import { playPitStopChime, playTeamRadioBeep } from '../utils/audio';
import { ExerciseIllustration } from './ExerciseIllustration';
import { TeamRadioModal } from './TeamRadioModal';

interface MyWorkoutViewProps {
  profile: DriverProfile;
  schedule: WorkoutDay[];
  selectedDayIdx: number;
  onSelectDayIdx: (dayIdx: number) => void;
  completedExerciseIds: Record<string, string[]>;
  completedDayKeys: string[];
  onToggleExercise: (dayKey: string, exerciseId: string, exerciseName: string) => void;
  onToggleDayComplete: (dayKey: string, dayTitle: string) => void;
  onOpenLoadLogger: (day: WorkoutDay) => void;
}

export function getWeekKeyPrefix(): string {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
  return monday.toISOString().slice(0, 10);
}

export function MyWorkoutView({
  profile,
  schedule,
  selectedDayIdx,
  onSelectDayIdx,
  completedExerciseIds,
  completedDayKeys,
  onToggleExercise,
  onToggleDayComplete,
  onOpenLoadLogger,
}: MyWorkoutViewProps) {
  const [expandedCueId, setExpandedCueId] = useState<string | null>(null);
  const [radioModalData, setRadioModalData] = useState<{
    exercise: WorkoutExercise;
    completedCount: number;
    totalCount: number;
  } | null>(null);
  const [showDayCelebration, setShowDayCelebration] = useState(false);

  // Pit Stop Rest Timer
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState<number>(60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerLabel, setTimerLabel] = useState<string>('Pit Stop · Descanso');

  const weekKey = useMemo(() => getWeekKeyPrefix(), []);
  const goalInfo = GOAL_OPTIONS.find((g) => g.id === profile.goal) ?? GOAL_OPTIONS[0];

  const activeDay = schedule[selectedDayIdx] ?? schedule[0];
  const activeDayKey = `${weekKey}_d${activeDay.dayIndex}`;
  const checkedIds = completedExerciseIds[activeDayKey] ?? [];
  const isDayDone = completedDayKeys.includes(activeDayKey);

  const weeklyCompletedCount = schedule.filter(
    (d) => !d.isRestDay && completedDayKeys.includes(`${weekKey}_d${d.dayIndex}`)
  ).length;
  const weeklyTargetCount = schedule.filter((d) => !d.isRestDay).length;
  const isWeekFinished = weeklyTargetCount > 0 && weeklyCompletedCount >= weeklyTargetCount;

  const featuredExerciseTip = useMemo(() => {
    const firstEx = activeDay.exercises[0];
    if (!firstEx) return null;
    const tip = getDailyMuscleTip(firstEx.muscleTipGroup);
    return {
      groupLabel: MUSCLE_GROUP_LABELS[firstEx.muscleTipGroup],
      text: tip.text,
    };
  }, [activeDay]);

  useEffect(() => {
    if (!timerRunning) return;
    if (timerSecondsLeft <= 0) {
      setTimerRunning(false);
      playPitStopChime();
      return;
    }
    const id = window.setTimeout(() => {
      setTimerSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [timerRunning, timerSecondsLeft]);

  const startRestTimer = (seconds: number, label: string) => {
    setTimerTotalSeconds(seconds);
    setTimerSecondsLeft(seconds);
    setTimerLabel(label);
    setTimerRunning(true);
  };

  const formatClock = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleExerciseToggle = (ex: WorkoutExercise, wasChecked: boolean) => {
    onToggleExercise(activeDayKey, ex.id, ex.name);
    if (!wasChecked) {
      const nextCount = checkedIds.length + 1;
      playTeamRadioBeep();
      setRadioModalData({
        exercise: ex,
        completedCount: nextCount,
        totalCount: activeDay.exercises.length,
      });
    }
  };

  const handleFinishDay = () => {
    onToggleDayComplete(activeDayKey, activeDay.title);
    if (!isDayDone) {
      playPitStopChime();
      setShowDayCelebration(true);
    } else {
      setShowDayCelebration(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 pb-24 lg:pb-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#707982]/25">
        <div>
          <p className="text-xs font-mono-telemetry tracking-[0.18em] text-[#00D2BE] uppercase">
            RACE DAY · Piloto {profile.name} · {goalInfo.code} {goalInfo.title} {goalInfo.emoji}
          </p>
          <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-white">
            Meu Treino
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-6 sm:gap-8">
          <div>
            <span className="text-xs text-[#707982]">Race Progress</span>
            <p className="mt-0.5 font-mono-telemetry text-xl font-bold text-white">
              {weeklyCompletedCount}/{weeklyTargetCount}
            </p>
          </div>
          <div>
            <span className="text-xs text-[#707982]">Exercícios Hoje</span>
            <p className="mt-0.5 font-mono-telemetry text-xl font-bold text-[#00D2BE]">
              {checkedIds.length}/{activeDay.exercises.length}
            </p>
          </div>
          <div>
            <span className="text-xs text-[#707982]">Tempo Estimado</span>
            <p className="mt-0.5 font-mono-telemetry text-xl font-bold text-white">
              {activeDay.estimatedMinutes} <span className="text-xs font-normal text-[#C5CBD0]">min</span>
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Checkered Flag Celebration */}
      {isWeekFinished && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 sm:p-6 rounded-md bg-[#151A20] border border-[#00D2BE] shadow-[0_0_24px_rgba(0,210,190,0.16)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded bg-[#00D2BE] text-[#080B0E] flex items-center justify-center shrink-0">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <p className="font-mono-telemetry text-xs tracking-[0.18em] text-[#00D2BE] uppercase">
                CHECKERED FLAG! 🏁 · FINISH LINE
              </p>
              <h2 className="mt-1 font-display text-lg sm:text-xl font-bold text-white">
                Mais uma semana concluída. Você está evoluindo!
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#C5CBD0]">
                Todos os {weeklyTargetCount} treinos planejados da semana foram finalizados. — Nauhan ❤️
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Day Celebration Modal-like Banner when finishing a single workout */}
      <AnimatePresence>
        {showDayCelebration && isDayDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-5 rounded-md bg-[#080B0E] border border-[#00D2BE] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <p className="font-mono-telemetry text-xs text-[#00D2BE] uppercase">
                FINISH LINE · VOLTA CONCLUÍDA 🏁
              </p>
              <p className="mt-1 text-sm sm:text-base font-semibold text-white">
                Treino de {activeDay.dayName} finalizado! Quer registrar suas cargas de hoje?
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {!activeDay.isRestDay && (
                <button
                  type="button"
                  onClick={() => onOpenLoadLogger(activeDay)}
                  className="px-4 py-2 rounded bg-[#00D2BE] text-[#080B0E] font-display text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Registrar Cargas
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowDayCelebration(false)}
                className="px-3 py-2 rounded border border-[#707982]/40 text-xs text-[#C5CBD0] hover:text-white cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7-Day Selector Strip */}
      <div className="grid grid-cols-7 gap-2">
        {schedule.map((day) => {
          const dayKey = `${weekKey}_d${day.dayIndex}`;
          const isSelected = day.dayIndex === selectedDayIdx;
          const done = completedDayKeys.includes(dayKey);
          return (
            <button
              key={day.dayIndex}
              type="button"
              onClick={() => {
                onSelectDayIdx(day.dayIndex);
                setShowDayCelebration(false);
              }}
              className={`p-2.5 sm:p-3.5 rounded-md border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#151A20] border-[#00D2BE]'
                  : 'bg-[#080B0E] border-[#707982]/25 hover:border-[#C5CBD0]/50'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`font-display text-xs sm:text-sm font-bold ${
                    isSelected ? 'text-[#00D2BE]' : 'text-white'
                  }`}
                >
                  {day.shortDay}
                </span>
                {done && <Check className="w-3.5 h-3.5 text-[#00D2BE] shrink-0" />}
              </div>
              <span className="mt-1 font-mono-telemetry text-[11px] text-[#707982] truncate">
                {day.sessionCode}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Cols: Active Day Session */}
        <div className="lg:col-span-8 bg-[#151A20] border border-[#707982]/30 rounded-md overflow-hidden">
          <div className="p-6 border-b border-[#707982]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono-telemetry text-[#00D2BE]">
                <span>{activeDay.dayName}</span>
                <span aria-hidden="true">·</span>
                <span>{activeDay.sessionCode}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#C5CBD0]">{activeDay.estimatedMinutes} min</span>
              </div>
              <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-white">
                {activeDay.title}
              </h2>
              <p className="mt-1 text-sm text-[#C5CBD0]">{activeDay.muscleGroups}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleFinishDay}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                  isDayDone
                    ? 'bg-[#00D2BE] text-[#080B0E]'
                    : 'bg-[#080B0E] border border-[#707982]/40 text-white hover:border-[#00D2BE]'
                }`}
              >
                <Flag className="w-4 h-4" />
                <span>{isDayDone ? 'Treino Finalizado' : 'Finalizar Treino'}</span>
              </button>

              {!activeDay.isRestDay && (
                <button
                  type="button"
                  onClick={() => onOpenLoadLogger(activeDay)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-[#080B0E] border border-[#00D2BE]/50 text-[#00D2BE] hover:bg-[#00D2BE]/10 text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Registrar Cargas</span>
                </button>
              )}
            </div>
          </div>

          {/* Warm-up Strip */}
          <div className="px-6 py-3.5 bg-[#080B0E]/70 border-b border-[#707982]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-mono-telemetry text-[#00D2BE] uppercase mr-2">
                Aquecimento Recomendado:
              </span>
              <span className="text-[#C5CBD0]">{activeDay.warmupNote}</span>
            </div>
          </div>

          {/* Exercise List */}
          <div className="divide-y divide-[#707982]/20">
            {activeDay.exercises.map((ex) => {
              const isChecked = checkedIds.includes(ex.id);
              const isExpanded = expandedCueId === ex.id;
              return (
                <div
                  key={ex.id}
                  className={`p-5 sm:p-6 transition-colors ${
                    isChecked ? 'bg-[#080B0E]/45' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      {/* Always-visible "Como fazer" illustration */}
                      <button
                        type="button"
                        onClick={() => setExpandedCueId(isExpanded ? null : ex.id)}
                        title="Ampliar guia visual de execução"
                        className="w-28 h-20 sm:w-32 sm:h-20 shrink-0 rounded overflow-hidden border border-[#707982]/25 hover:border-[#00D2BE] transition-all cursor-pointer bg-[#080B0E]"
                      >
                        <ExerciseIllustration
                          illustrationKey={ex.illustrationKey}
                          title={ex.name}
                          className="w-full h-full"
                        />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#707982]">
                          <span className="font-mono-telemetry text-[#00D2BE]">
                            {String(ex.orderIndex).padStart(2, '0')}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#C5CBD0]">{ex.mainMuscle}</span>
                          <span aria-hidden="true">·</span>
                          <span>{ex.difficulty}</span>
                        </div>

                        <h3
                          className={`mt-1 text-base sm:text-lg font-semibold ${
                            isChecked ? 'line-through text-[#707982]' : 'text-white'
                          }`}
                        >
                          {ex.name}
                        </h3>

                        <p className="mt-0.5 text-xs text-[#707982]">
                          Equipamento: <span className="text-[#C5CBD0]">{ex.equipment}</span>
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-mono-telemetry text-[#C5CBD0]">
                          <span className="px-2 py-0.5 rounded bg-[#080B0E] border border-[#707982]/30 text-white">
                            {ex.sets} séries × {ex.reps}
                          </span>
                          <button
                            type="button"
                            onClick={() => startRestTimer(ex.restSeconds, ex.name)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#080B0E] border border-[#707982]/30 hover:border-[#00D2BE] text-[#C5CBD0] hover:text-[#00D2BE] cursor-pointer"
                          >
                            <Clock className="w-3 h-3" />
                            <span>Pit Stop: {ex.restSeconds}s</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right actions: MARCAR COMO CONCLUÍDO + Como fazer */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => setExpandedCueId(isExpanded ? null : ex.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          isExpanded
                            ? 'bg-[#C5CBD0] border-[#C5CBD0] text-[#080B0E] font-semibold'
                            : 'bg-[#080B0E] border-[#707982]/35 hover:border-[#C5CBD0] text-[#C5CBD0]'
                        }`}
                      >
                        <span>Como fazer</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExerciseToggle(ex, isChecked)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                          isChecked
                            ? 'bg-[#00D2BE]/20 border border-[#00D2BE] text-[#00D2BE]'
                            : 'bg-[#00D2BE] text-[#080B0E] hover:bg-[#1de6d2]'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>
                          {isChecked ? 'CONCLUÍDO' : 'MARCAR COMO CONCLUÍDO'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Detailed Biomechanics & Execution Guide */}
                  {isExpanded && (
                    <div className="mt-4 p-4 sm:p-5 rounded bg-[#080B0E] border border-[#707982]/25 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                      <ExerciseIllustration
                        illustrationKey={ex.illustrationKey}
                        title={ex.name}
                        className="sm:col-span-5 h-40 w-full"
                      />
                      <div className="sm:col-span-7 space-y-3">
                        <div>
                          <p className="text-xs font-mono-telemetry text-[#00D2BE] uppercase">
                            Como Executar · {ex.mainMuscle}
                          </p>
                          <p className="mt-1 text-xs sm:text-sm text-white leading-relaxed">
                            {ex.instructions}
                          </p>
                        </div>

                        {ex.secondaryMuscles.length > 0 && (
                          <p className="text-xs text-[#707982]">
                            Músculos secundários:{' '}
                            <span className="text-[#C5CBD0]">
                              {ex.secondaryMuscles.join(', ')}
                            </span>
                          </p>
                        )}

                        <div className="p-3 rounded bg-[#151A20] border border-[#707982]/25 flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-[#00D2BE] shrink-0 mt-0.5" />
                          <div className="text-xs text-[#C5CBD0]">
                            <span className="font-semibold text-white">Erro comum a evitar: </span>
                            {ex.commonMistakes}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4 Cols: Dicas do Nauhan + Pit Stop Timer */}
        <div className="lg:col-span-4 space-y-6">
          {/* DICAS DO NAUHAN ❤️ */}
          {featuredExerciseTip && (
            <div className="bg-[#151A20] border border-[#00D2BE]/40 rounded-md p-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-[#080B0E] border border-[#00D2BE]/40 flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4 text-[#00D2BE]" />
                </div>
                <div>
                  <p className="text-xs font-mono-telemetry text-[#00D2BE]">
                    DICAS DO NAUHAN ❤️
                  </p>
                  <p className="text-xs text-[#707982]">
                    Foco em {featuredExerciseTip.groupLabel}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm text-white leading-relaxed">
                &ldquo;{featuredExerciseTip.text}&rdquo;
              </p>
              <p className="mt-2 text-xs text-[#707982]">
                Dica extra: ao clicar em &ldquo;MARCAR COMO CONCLUÍDO&rdquo;, o rádio da equipe abre com o recado do Nauhan para cada exercício.
              </p>
            </div>
          )}

          {/* Pit Stop Rest Stopwatch */}
          <div className="bg-[#151A20] border border-[#707982]/30 rounded-md p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-telemetry tracking-wider text-[#00D2BE] uppercase">
                Pit Stop · Descanso
              </span>
              <span className="text-xs text-[#707982] truncate max-w-[160px]">
                {timerLabel}
              </span>
            </div>

            <div className="mt-4 py-4 px-5 rounded bg-[#080B0E] border border-[#707982]/25 flex items-center justify-between">
              <span className="font-mono-telemetry text-4xl font-bold text-white tracking-tight">
                {formatClock(timerSecondsLeft)}
              </span>

              <div className="flex items-center gap-2">
                {!timerRunning ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (timerSecondsLeft === 0) setTimerSecondsLeft(timerTotalSeconds);
                      setTimerRunning(true);
                    }}
                    aria-label="Iniciar cronômetro"
                    className="p-2.5 rounded bg-[#00D2BE] text-[#080B0E] hover:bg-[#1de6d2] cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTimerRunning(false)}
                    aria-label="Pausar cronômetro"
                    className="p-2.5 rounded bg-[#C5CBD0] text-[#080B0E] cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerSecondsLeft(timerTotalSeconds);
                  }}
                  aria-label="Reiniciar cronômetro"
                  className="p-2.5 rounded bg-[#151A20] border border-[#707982]/40 text-[#C5CBD0] hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {[45, 60, 90, 120].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => startRestTimer(sec, `Descanso ${sec}s`)}
                  className="py-1.5 rounded bg-[#080B0E] border border-[#707982]/30 hover:border-[#00D2BE] font-mono-telemetry text-xs text-[#C5CBD0] hover:text-white cursor-pointer"
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {radioModalData && (
        <TeamRadioModal
          exercise={radioModalData.exercise}
          driverName={profile.name}
          completedCount={radioModalData.completedCount}
          totalCount={radioModalData.totalCount}
          onClose={() => setRadioModalData(null)}
          onStartRestTimer={startRestTimer}
        />
      )}
    </div>
  );
}
