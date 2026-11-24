import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { CameraPreset, LiveryMode, TireCompound } from '../types/racing';
import { F1Canvas } from './F1Canvas';
import { playLightsOutTone, playStartLightTone } from '../utils/audio';

interface StartingGridProps {
  hasSavedProfile: boolean;
  onStartJourney: () => void;
  onResumeDashboard: () => void;
}

export function StartingGrid({
  hasSavedProfile,
  onStartJourney,
  onResumeDashboard,
}: StartingGridProps) {
  const [launching, setLaunching] = useState(false);
  const [lightsLit, setLightsLit] = useState<number>(0);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  const sceneConfig = useMemo(
    () => ({
      mode: 'starting_grid' as const,
      cameraPreset: CameraPreset.HERO,
      livery: LiveryMode.SILVER_ARROW,
      tireCompound: TireCompound.QUALIFYING_TURQUOISE,
      drsOpen: lightsLit === -1,
      trackSpeedActive: lightsLit === -1,
      startLightsLit: lightsLit,
    }),
    [lightsLit]
  );

  const handleStartClick = () => {
    if (launching) return;
    setLaunching(true);
    setLightsLit(1);
    playStartLightTone(1);

    const timers: number[] = [];
    for (let step = 2; step <= 5; step++) {
      timers.push(
        window.setTimeout(() => {
          setLightsLit(step);
          playStartLightTone(step);
        }, (step - 1) * 260)
      );
    }

    timers.push(
      window.setTimeout(() => {
        setLightsLit(-1);
        playLightsOutTone();
      }, 1450)
    );

    timers.push(
      window.setTimeout(() => {
        onStartJourney();
      }, 2050)
    );

    timersRef.current = timers;
  };

  return (
    <section className="relative w-full min-h-screen overflow-x-hidden bg-[#080B0E] flex flex-col justify-between">
      {/* Full-bleed 3D Starting Grid Scene */}
      <div className="pointer-events-none sm:pointer-events-auto absolute inset-0 z-0">
        <F1Canvas config={sceneConfig} />
      </div>

      {/* Measured gradient scrim for crisp WCAG AA contrast without backdrop-blur */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[#080B0E]/92 via-[#080B0E]/68 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 z-10 bg-gradient-to-t from-[#080B0E] via-[#080B0E]/75 to-transparent"
      />

      {/* Top minimal gantry strip */}
      <header className="relative z-20 flex items-center justify-between px-6 sm:px-10 pt-6">
        <div className="flex items-center gap-3">
          <span className="h-5 w-1 bg-[#00D2BE]" aria-hidden="true" />
          <span className="font-display text-sm tracking-[0.22em] font-semibold text-[#C5CBD0] uppercase whitespace-nowrap">
            REBECA RACING · P1
          </span>
        </div>

        {/* 5-Light F1 Start Gantry Indicator */}
        <div
          aria-label="Semáforo de largada"
          className="flex items-center gap-2 px-3 py-2 rounded bg-[#151A20]/90 border border-[#707982]/30"
        >
          {[1, 2, 3, 4, 5].map((idx) => {
            const isRed = lightsLit >= idx;
            const isOut = lightsLit === -1;
            return (
              <span
                key={idx}
                className={`w-3 h-3 rounded-full transition-colors duration-150 ${
                  isOut
                    ? 'bg-[#00D2BE]'
                    : isRed
                      ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.85)]'
                      : 'bg-[#080B0E] border border-[#707982]/50'
                }`}
              />
            );
          })}
        </div>
      </header>

      {/* Main Hero Copy */}
      <main className="relative z-20 w-full max-w-6xl mx-auto px-6 sm:px-10 py-12 my-auto">
        <div className="max-w-2xl">
          <p className="text-xs sm:text-sm font-mono-telemetry tracking-[0.22em] text-[#00D2BE] uppercase">
            Grid de Largada · Temporada Exclusiva
          </p>

          <h1
            className="mt-3 font-display font-bold tracking-tight text-white uppercase leading-[1.02]"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.75rem)', textWrap: 'balance' }}
          >
            REBECA RACING
          </h1>

          <p className="mt-3 font-display text-lg sm:text-2xl font-semibold tracking-[0.14em] text-[#C5CBD0] uppercase">
            THE PERFECT SHAPE. THE PERFECT RACE.
          </p>

          <div className="mt-6 h-px w-24 bg-[#00D2BE]" aria-hidden="true" />

          <p className="mt-6 text-base sm:text-xl text-white font-medium leading-relaxed">
            &ldquo;Uma jornada de força, evolução e performance.&rdquo;
          </p>

          <p className="mt-2 text-sm sm:text-base text-[#C5CBD0] leading-relaxed">
            Rebeca, sua próxima evolução começa aqui.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleStartClick}
              disabled={launching}
              className="inline-flex items-center justify-center gap-3 px-7 py-4 rounded bg-[#00D2BE] text-[#080B0E] font-display font-bold text-sm sm:text-base tracking-[0.12em] uppercase transition-colors duration-150 hover:bg-[#1de6d2] active:opacity-90 disabled:opacity-80 cursor-pointer touch-manipulation whitespace-nowrap shrink-0"
            >
              <span>
                {lightsLit === -1
                  ? 'LIGHTS OUT — VAMOS!'
                  : launching
                    ? 'AQUECENDO MOTORES...'
                    : 'START YOUR JOURNEY'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {hasSavedProfile && !launching && (
              <button
                type="button"
                onClick={onResumeDashboard}
                className="inline-flex items-center gap-2 px-5 py-4 rounded bg-[#151A20]/95 border border-[#707982]/40 text-[#C5CBD0] hover:text-white hover:border-[#00D2BE] font-medium text-sm transition-colors cursor-pointer touch-manipulation whitespace-nowrap shrink-0"
              >
                <span>Abrir meu painel atual</span>
                <ChevronRight className="w-4 h-4 text-[#00D2BE]" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Subtle footer instruction */}
      <footer className="relative z-20 px-6 sm:px-10 pb-6 flex items-center justify-between text-xs text-[#707982]">
        <span>Arraste para inspecionar o RR-01 em 3D</span>
        <span className="font-mono-telemetry">TELEMETRIA DEDICADA · REBECA</span>
      </footer>
    </section>
  );
}
