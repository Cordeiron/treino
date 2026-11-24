import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Wind, Zap } from 'lucide-react';
import {
  CameraPreset,
  DriverProfile,
  LiveryMode,
  TireCompound,
} from '../types/racing';
import { F1Canvas } from './F1Canvas';

interface Garage3DViewProps {
  profile: DriverProfile;
  completedSessionsCount: number;
}

export function Garage3DView({
  profile,
  completedSessionsCount,
}: Garage3DViewProps) {
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>(CameraPreset.HERO);
  const [livery, setLivery] = useState<LiveryMode>(LiveryMode.SILVER_ARROW);
  const [tireCompound, setTireCompound] = useState<TireCompound>(
    TireCompound.QUALIFYING_TURQUOISE
  );
  const [drsOpen, setDrsOpen] = useState<boolean>(false);
  const [trackSpeedActive, setTrackSpeedActive] = useState<boolean>(false);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);

  const sceneConfig = useMemo(
    () => ({
      mode: 'garage' as const,
      cameraPreset,
      livery,
      tireCompound,
      drsOpen,
      trackSpeedActive,
      startLightsLit: -1,
    }),
    [cameraPreset, livery, tireCompound, drsOpen, trackSpeedActive]
  );

  const carSpecTier = useMemo(() => {
    if (completedSessionsCount >= 12) return 'Championship Spec · Nível Máximo';
    if (completedSessionsCount >= 5) return 'Pole Position Aero · Q3';
    if (completedSessionsCount >= 1) return 'Grid Oficial · Setup Calibrado';
    return 'Chassi RR-01 · Pronto para Largada';
  }, [completedSessionsCount]);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] min-h-[540px] bg-[#080B0E] overflow-hidden">
      {/* Unobstructed Full-Bleed 3D Viewport */}
      <div className="absolute inset-0">
        <F1Canvas config={sceneConfig} />
      </div>

      {/* Minimal Top-Left Spec Readout (solid rgba surface, no backdrop-filter) */}
      <div
        className="absolute top-4 left-4 z-20 px-4 py-3 rounded border border-[#707982]/35 max-w-xs pointer-events-none"
        style={{ backgroundColor: 'rgba(21, 26, 32, 0.90)' }}
      >
        <p className="font-mono-telemetry text-[11px] tracking-widest text-[#00D2BE] uppercase">
          RR-01 · {profile.name}
        </p>
        <p className="mt-0.5 font-display text-sm font-bold text-white">
          {carSpecTier}
        </p>
        <p className="mt-1 text-xs text-[#C5CBD0]">
          Nauhan: &ldquo;Seu carro evolui junto com seus treinos. Arraste para girar em 360°.&rdquo;
        </p>
      </div>

      {/* Collapsible Bottom Control Dock (<= 15% footprint, solid rgba, no backdrop-filter) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[min(920px,94vw)] flex flex-col items-center">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-t border border-b-0 border-[#707982]/40 text-xs font-mono-telemetry text-[#C5CBD0] hover:text-white cursor-pointer"
          style={{ backgroundColor: 'rgba(21, 26, 32, 0.94)' }}
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-[#00D2BE]" />
              <span>Mostrar Controles 3D</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-[#00D2BE]" />
              <span>Ocultar Controles</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div
            className="w-full rounded-md border border-[#707982]/40 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3"
            style={{ backgroundColor: 'rgba(21, 26, 32, 0.94)' }}
          >
            {/* Camera Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: CameraPreset.HERO, label: 'Geral' },
                { id: CameraPreset.FRONT_WING, label: 'Asa' },
                { id: CameraPreset.COCKPIT, label: 'Cockpit' },
                { id: CameraPreset.SIDEPOD, label: 'Lateral' },
                { id: CameraPreset.OVERHEAD, label: 'Topo' },
              ].map((cam) => (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => setCameraPreset(cam.id)}
                  className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    cameraPreset === cam.id
                      ? 'bg-[#00D2BE] text-[#080B0E] font-semibold'
                      : 'bg-[#080B0E] text-[#C5CBD0] hover:text-white'
                  }`}
                >
                  {cam.label}
                </button>
              ))}
            </div>

            {/* Livery Swatches */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#707982] hidden sm:inline">Pintura</span>
              {[
                { id: LiveryMode.SILVER_ARROW, color: '#C5CBD0', label: 'Silver' },
                { id: LiveryMode.OBSIDIAN_CARBON, color: '#1F262E', label: 'Carbono' },
                { id: LiveryMode.TURQUOISE_EDITION, color: '#00D2BE', label: 'Turquesa' },
              ].map((sw) => (
                <button
                  key={sw.id}
                  type="button"
                  onClick={() => setLivery(sw.id)}
                  title={sw.label}
                  aria-label={`Pintura ${sw.label}`}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                    livery === sw.id ? 'border-white scale-110' : 'border-[#707982]/50'
                  }`}
                  style={{ backgroundColor: sw.color }}
                />
              ))}
            </div>

            {/* Tire Compound */}
            <div className="flex items-center gap-1.5">
              {[
                { id: TireCompound.QUALIFYING_TURQUOISE, label: 'Q-Spec' },
                { id: TireCompound.SOFT, label: 'Soft' },
                { id: TireCompound.MEDIUM, label: 'Med' },
                { id: TireCompound.HARD, label: 'Hard' },
              ].map((tc) => (
                <button
                  key={tc.id}
                  type="button"
                  onClick={() => setTireCompound(tc.id)}
                  className={`px-2 py-1.5 rounded text-[11px] font-mono-telemetry transition-colors cursor-pointer whitespace-nowrap ${
                    tireCompound === tc.id
                      ? 'bg-[#C5CBD0] text-[#080B0E] font-bold'
                      : 'bg-[#080B0E] text-[#707982] hover:text-white'
                  }`}
                >
                  {tc.label}
                </button>
              ))}
            </div>

            {/* DRS & Track Speed Toggles */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDrsOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-telemetry transition-colors cursor-pointer whitespace-nowrap ${
                  drsOpen
                    ? 'bg-[#00D2BE] text-[#080B0E] font-bold'
                    : 'bg-[#080B0E] text-[#C5CBD0] border border-[#707982]/35'
                }`}
              >
                <Wind className="w-3.5 h-3.5" />
                <span>DRS {drsOpen ? 'ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={() => setTrackSpeedActive((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-telemetry transition-colors cursor-pointer whitespace-nowrap ${
                  trackSpeedActive
                    ? 'bg-[#00D2BE] text-[#080B0E] font-bold'
                    : 'bg-[#080B0E] text-[#C5CBD0] border border-[#707982]/35'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{trackSpeedActive ? 'Em Pista' : 'Parado'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
