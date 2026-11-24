import { useEffect } from 'react';
import { Clock, Radio, X } from 'lucide-react';
import { getNauhanExerciseCompletionRadio } from '../engine/workoutPlanner';
import { WorkoutExercise } from '../types/racing';
import { ExerciseIllustration } from './ExerciseIllustration';

interface TeamRadioModalProps {
  exercise: WorkoutExercise;
  driverName: string;
  completedCount: number;
  totalCount: number;
  onClose: () => void;
  onStartRestTimer: (seconds: number, label: string) => void;
}

export function TeamRadioModal({
  exercise,
  driverName,
  completedCount,
  totalCount,
  onClose,
  onStartRestTimer,
}: TeamRadioModalProps) {
  const radio = getNauhanExerciseCompletionRadio(
    exercise,
    driverName,
    completedCount,
    totalCount
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const progressPct = Math.round((completedCount / Math.max(1, totalCount)) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#080B0E]/85"
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-radio-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-md bg-[#151A20] border border-[#00D2BE] shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top F1 Team Radio Transmission Header */}
        <div className="bg-[#080B0E] px-6 py-4 border-b border-[#00D2BE]/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#151A20] border border-[#00D2BE]/50 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 text-[#00D2BE]" />
            </div>
            <div>
              <p className="font-mono-telemetry text-[11px] tracking-[0.2em] text-[#00D2BE] uppercase">
                RÁDIO DA EQUIPE · DICAS DO NAUHAN ❤️
              </p>
              <p className="text-xs text-[#C5CBD0]">
                Transmissão direta para {driverName} · {radio.groupLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar rádio"
            className="p-1.5 rounded text-[#707982] hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Waveform Strip */}
        <div className="px-6 pt-5 flex items-center justify-between gap-4">
          <span className="font-mono-telemetry text-xs text-[#00D2BE] uppercase">
            {radio.tag}
          </span>

          <div className="flex items-end gap-1 h-4" aria-hidden="true">
            {[10, 16, 8, 14, 12, 16, 9, 13].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-[#00D2BE] rounded-sm"
                style={{ height: `${h}px`, opacity: i % 2 === 0 ? 0.95 : 0.55 }}
              />
            ))}
          </div>
        </div>

        {/* Main Message */}
        <div className="p-6 space-y-5">
          <div>
            <h2
              id="team-radio-title"
              className="font-display text-xl sm:text-2xl font-bold text-white leading-snug"
            >
              {radio.headline}
            </h2>

            <p className="mt-3 text-base text-[#C5CBD0] leading-relaxed">
              &ldquo;{radio.message}&rdquo;
            </p>
            <p className="mt-2 font-mono-telemetry text-xs text-[#00D2BE]">
              — Nauhan ❤️
            </p>
          </div>

          {/* Exercise Completed Reference + Progress Bar */}
          <div className="p-4 rounded bg-[#080B0E] border border-[#707982]/25 flex items-center gap-4">
            <ExerciseIllustration
              illustrationKey={exercise.illustrationKey}
              title={exercise.name}
              className="w-24 h-14 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#707982] truncate">{exercise.mainMuscle}</p>
              <p className="text-sm font-semibold text-white truncate">{exercise.name}</p>
              <div className="mt-2 h-1.5 w-full rounded bg-[#151A20] overflow-hidden">
                <div
                  className="h-full bg-[#00D2BE] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            {completedCount < totalCount && (
              <button
                type="button"
                onClick={() => {
                  onStartRestTimer(exercise.restSeconds, exercise.name);
                  onClose();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded bg-[#080B0E] border border-[#00D2BE]/50 text-[#00D2BE] hover:bg-[#00D2BE]/10 text-xs font-display font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap"
              >
                <Clock className="w-4 h-4" />
                <span>Pit Stop ({exercise.restSeconds}s)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center px-5 py-3 rounded bg-[#00D2BE] text-[#080B0E] hover:bg-[#1de6d2] text-xs font-display font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap"
            >
              {completedCount >= totalCount ? 'Fechar & Comemorar 🏁' : 'Continuar Treino'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
