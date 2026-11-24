import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Camera,
  Check,
  Plus,
  Radio,
  Trash2,
  X,
} from 'lucide-react';
import { getNauhanEvolutionDebrief } from '../engine/workoutPlanner';
import {
  BodyCheckpoint,
  DriverProfile,
  LoggedExerciseSet,
  LoggedSession,
  WorkoutDay,
} from '../types/racing';

interface EvolutionViewProps {
  profile: DriverProfile;
  schedule: WorkoutDay[];
  preselectedDay: WorkoutDay | null;
  initialSubTab?: 'diario' | 'cargas';
  sessions: LoggedSession[];
  checkpoints: BodyCheckpoint[];
  completedDaysCount: number;
  onAddCheckpoint: (cp: BodyCheckpoint) => void;
  onDeleteCheckpoint: (id: string) => void;
  onSaveSession: (session: LoggedSession) => void;
  onDeleteSession: (id: string) => void;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

function isSafeImageDataUrl(url?: string): boolean {
  if (!url) return false;
  return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(url);
}

function compressImageFileToJpegDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selecione apenas arquivos de imagem válidos (JPG, PNG ou WebP).'));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error('A imagem deve ter no máximo 10 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 720;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem neste navegador.'));
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.78);
        if (!isSafeImageDataUrl(jpegDataUrl)) {
          reject(new Error('Formato de imagem inválido.'));
          return;
        }
        resolve(jpegDataUrl);
      };
      img.onerror = () => reject(new Error('Não foi possível carregar a imagem selecionada.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo selecionado.'));
    reader.readAsDataURL(file);
  });
}

export function EvolutionView({
  profile,
  schedule,
  preselectedDay,
  initialSubTab = 'diario',
  sessions,
  checkpoints,
  completedDaysCount,
  onAddCheckpoint,
  onDeleteCheckpoint,
  onSaveSession,
  onDeleteSession,
}: EvolutionViewProps) {
  const [subTab, setSubTab] = useState<'diario' | 'cargas'>(initialSubTab);

  // Checkpoint form state
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [weightKg, setWeightKg] = useState<string>(
    String(checkpoints[checkpoints.length - 1]?.weightKg ?? profile.currentWeightKg)
  );
  const [waistCm, setWaistCm] = useState<string>('');
  const [hipCm, setHipCm] = useState<string>('');
  const [thighCm, setThighCm] = useState<string>('');
  const [armCm, setArmCm] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoPreviewModal, setPhotoPreviewModal] = useState<string | null>(null);

  // Load logger state
  const trainingDays = useMemo(() => schedule.filter((d) => !d.isRestDay), [schedule]);
  const initialDay =
    preselectedDay && !preselectedDay.isRestDay ? preselectedDay : trainingDays[0];

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    initialDay?.dayIndex ?? 0
  );
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [durationMinutes, setDurationMinutes] = useState<number>(profile.sessionMinutes);
  const [rpe, setRpe] = useState<number>(8);
  const [logNotes, setLogNotes] = useState<string>('');
  const [sets, setSets] = useState<LoggedExerciseSet[]>(() =>
    (initialDay?.exercises ?? []).map((ex) => ({
      exerciseName: ex.name,
      weightKg: 20,
      reps: 12,
      setsCompleted: ex.sets,
    }))
  );
  const [lastSavedPrs, setLastSavedPrs] = useState<string[] | null>(null);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    if (preselectedDay && !preselectedDay.isRestDay) {
      setSelectedDayIndex(preselectedDay.dayIndex);
      setSets(
        preselectedDay.exercises.map((ex) => ({
          exerciseName: ex.name,
          weightKg: 20,
          reps: 12,
          setsCompleted: ex.sets,
        }))
      );
      setSubTab('cargas');
    }
  }, [preselectedDay]);

  const debrief = useMemo(
    () => getNauhanEvolutionDebrief(profile, sessions, completedDaysCount),
    [profile, sessions, completedDaysCount]
  );

  // Best weights per exercise (BEST LAP)
  const personalRecords = useMemo(() => {
    const map: Record<string, { name: string; weightKg: number; date: string }> = {};
    sessions.forEach((s) => {
      s.sets.forEach((st) => {
        const k = st.exerciseName.trim().toLowerCase();
        if (!map[k] || st.weightKg > map[k].weightKg) {
          map[k] = { name: st.exerciseName, weightKg: st.weightKg, date: s.date };
        }
      });
    });
    return Object.values(map).sort((a, b) => b.weightKg - a.weightKg);
  }, [sessions]);

  const historicalBestByExercise = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      s.sets.forEach((st) => {
        const key = st.exerciseName.trim().toLowerCase();
        if (!map[key] || st.weightKg > map[key]) {
          map[key] = st.weightKg;
        }
      });
    });
    return map;
  }, [sessions]);

  const totalVolume = useMemo(
    () => sessions.reduce((acc, s) => acc + s.totalVolumeKg, 0),
    [sessions]
  );

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFileToJpegDataUrl(file);
      setPhotoDataUrl(dataUrl);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Erro ao carregar foto.');
    }
  };

  const handleAddCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedWeight = Number(weightKg);
    if (!parsedWeight || parsedWeight < 30 || parsedWeight > 250) return;

    const id = crypto.randomUUID ? crypto.randomUUID() : `cp-${Date.now()}`;
    onAddCheckpoint({
      id,
      date,
      weightKg: parsedWeight,
      waistCm: waistCm ? Number(waistCm) : undefined,
      hipCm: hipCm ? Number(hipCm) : undefined,
      thighCm: thighCm ? Number(thighCm) : undefined,
      armCm: armCm ? Number(armCm) : undefined,
      photoDataUrl: isSafeImageDataUrl(photoDataUrl) ? photoDataUrl : undefined,
      note: note.trim() || undefined,
    });
    setNote('');
    setWaistCm('');
    setHipCm('');
    setThighCm('');
    setArmCm('');
    setPhotoDataUrl(undefined);
  };

  // SVG Weight Trend Geometry (targetWeightKg optional)
  const weightChartData = useMemo(() => {
    const pts =
      checkpoints.length > 0
        ? checkpoints
        : [
            {
              id: 'baseline',
              date: profile.createdAt.slice(0, 10),
              weightKg: profile.currentWeightKg,
            },
          ];

    const weights = pts.map((p) => p.weightKg);
    if (profile.targetWeightKg !== undefined) {
      weights.push(profile.targetWeightKg);
    }
    const minW = Math.floor(Math.min(...weights) - 2);
    const maxW = Math.ceil(Math.max(...weights) + 2);
    const span = Math.max(1, maxW - minW);

    const w = 520;
    const h = 180;
    const padX = 28;
    const padY = 20;

    const coords = pts.map((p, idx) => {
      const x =
        pts.length === 1
          ? w / 2
          : padX + (idx / (pts.length - 1)) * (w - padX * 2);
      const y = h - padY - ((p.weightKg - minW) / span) * (h - padY * 2);
      return { x, y, weight: p.weightKg, date: p.date };
    });

    const targetY =
      profile.targetWeightKg !== undefined
        ? h - padY - ((profile.targetWeightKg - minW) / span) * (h - padY * 2)
        : null;

    return { coords, targetY, w, h };
  }, [checkpoints, profile.createdAt, profile.currentWeightKg, profile.targetWeightKg]);

  const volumeChartData = useMemo(() => {
    const ordered = [...sessions].reverse().slice(-8);
    const maxVol = Math.max(1000, ...ordered.map((s) => s.totalVolumeKg));
    return { ordered, maxVol };
  }, [sessions]);

  const latestWeight =
    checkpoints.length > 0
      ? checkpoints[checkpoints.length - 1].weightKg
      : profile.currentWeightKg;

  // Load Logger Handlers
  const handleLoadDayTemplate = (dayIdx: number) => {
    setSelectedDayIndex(dayIdx);
    const found = schedule.find((d) => d.dayIndex === dayIdx);
    if (found) {
      setSets(
        found.exercises.map((ex) => {
          const histBest = historicalBestByExercise[ex.name.trim().toLowerCase()];
          return {
            exerciseName: ex.name,
            weightKg: histBest ?? 20,
            reps: 12,
            setsCompleted: ex.sets,
          };
        })
      );
    }
  };

  const handleUpdateSet = (
    idx: number,
    field: keyof LoggedExerciseSet,
    value: string | number
  ) => {
    setSets((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const handleAddRow = () => {
    setSets((prev) => [
      ...prev,
      { exerciseName: 'Novo Exercício', weightKg: 15, reps: 12, setsCompleted: 3 },
    ]);
  };

  const handleRemoveRow = (idx: number) => {
    setSets((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveLoadSession = (e: React.FormEvent) => {
    e.preventDefault();
    const validSets = sets.filter(
      (s) => s.exerciseName.trim().length > 0 && s.setsCompleted > 0
    );
    if (validSets.length === 0) return;

    const totalVolumeKg = validSets.reduce(
      (sum, s) => sum + s.weightKg * s.reps * s.setsCompleted,
      0
    );

    const newPrExercises: string[] = [];
    validSets.forEach((s) => {
      const prevMax = historicalBestByExercise[s.exerciseName.trim().toLowerCase()];
      if (prevMax !== undefined && s.weightKg > prevMax) {
        newPrExercises.push(s.exerciseName);
      }
    });

    const dayObj = schedule.find((d) => d.dayIndex === selectedDayIndex);
    const id = crypto.randomUUID ? crypto.randomUUID() : `sess-${Date.now()}`;
    const newSession: LoggedSession = {
      id,
      date: logDate,
      dayTitle: dayObj?.title ?? 'Treino Personalizado',
      durationMinutes,
      rpe,
      notes: logNotes.trim(),
      sets: validSets,
      totalVolumeKg: Math.round(totalVolumeKg),
      newPrExercises,
    };

    onSaveSession(newSession);
    setLastSavedPrs(newPrExercises);
    setLogNotes('');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 pb-24 lg:pb-10 space-y-8">
      {/* Header & Telemetry Summary */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#707982]/25">
        <div>
          <p className="text-xs font-mono-telemetry tracking-[0.18em] text-[#00D2BE] uppercase">
            SEASON HISTORY · DIÁRIO DE EVOLUÇÃO
          </p>
          <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-white">
            Minha Evolução & Cargas
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <span className="text-xs text-[#707982]">Peso Atual</span>
            <p className="mt-0.5 font-mono-telemetry text-xl font-bold text-white">
              {latestWeight.toFixed(1)}{' '}
              <span className="text-xs font-normal text-[#C5CBD0]">kg</span>
            </p>
          </div>
          <div>
            <span className="text-xs text-[#707982]">Peso Alvo</span>
            <p className="mt-0.5 font-mono-telemetry text-xl font-bold text-[#00D2BE]">
              {profile.targetWeightKg !== undefined
                ? `${profile.targetWeightKg.toFixed(1)} kg`
                : 'Livre'}
            </p>
          </div>
          <div>
            <span className="text-xs text-[#707982]">Sessões</span>
            <p className="mt-0.5 font-mono-telemetry text-xl font-bold text-white">
              {sessions.length + completedDaysCount}
            </p>
          </div>
          <div>
            <span className="text-xs text-[#707982]">Volume Total</span>
            <p className="mt-0.5 font-mono-telemetry text-xl font-bold text-white">
              {totalVolume.toLocaleString('pt-BR')}{' '}
              <span className="text-xs font-normal text-[#C5CBD0]">kg</span>
            </p>
          </div>
        </div>
      </div>

      {/* Nauhan Debrief Banner */}
      <div className="bg-[#151A20] border border-[#00D2BE]/40 rounded-md p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded bg-[#080B0E] border border-[#00D2BE]/40 flex items-center justify-center shrink-0">
          <Radio className="w-5 h-5 text-[#00D2BE]" />
        </div>
        <div>
          <p className="text-xs font-mono-telemetry text-[#00D2BE] uppercase">
            Debrief do Nauhan · {debrief.headline}
          </p>
          <p className="mt-1.5 text-sm text-[#C5CBD0] leading-relaxed">
            &ldquo;{debrief.body}&rdquo;
          </p>
        </div>
      </div>

      {/* Sub-navigation Switch */}
      <div className="inline-flex p-1 rounded bg-[#151A20] border border-[#707982]/30">
        <button
          type="button"
          onClick={() => setSubTab('diario')}
          className={`px-4 py-2 rounded text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
            subTab === 'diario'
              ? 'bg-[#00D2BE] text-[#080B0E] font-bold'
              : 'text-[#C5CBD0] hover:text-white'
          }`}
        >
          Medidas, Peso & Fotos
        </button>
        <button
          type="button"
          onClick={() => setSubTab('cargas')}
          className={`px-4 py-2 rounded text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
            subTab === 'cargas'
              ? 'bg-[#00D2BE] text-[#080B0E] font-bold'
              : 'text-[#C5CBD0] hover:text-white'
          }`}
        >
          Cargas & BEST LAP
        </button>
      </div>

      {subTab === 'diario' ? (
        <>
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#151A20] border border-[#707982]/30 rounded-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">
                    Curva de Peso Corporal
                  </h2>
                  <p className="text-xs text-[#707982]">
                    {profile.targetWeightKg !== undefined
                      ? `Linha tracejada indica sua referência (${profile.targetWeightKg} kg)`
                      : 'Acompanhamento contínuo sem pressão de prazo'}
                  </p>
                </div>
                <span className="font-mono-telemetry text-xs text-[#00D2BE]">kg</span>
              </div>

              <svg
                viewBox={`0 0 ${weightChartData.w} ${weightChartData.h}`}
                className="w-full h-48 overflow-visible"
                role="img"
                aria-label="Gráfico de evolução de peso"
              >
                {weightChartData.targetY !== null && profile.targetWeightKg !== undefined && (
                  <>
                    <line
                      x1={20}
                      x2={weightChartData.w - 20}
                      y1={weightChartData.targetY}
                      y2={weightChartData.targetY}
                      stroke="#00D2BE"
                      strokeOpacity={0.35}
                      strokeDasharray="5 5"
                    />
                    <text
                      x={weightChartData.w - 22}
                      y={weightChartData.targetY - 6}
                      fill="#00D2BE"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="JetBrains Mono"
                    >
                      Alvo {profile.targetWeightKg}kg
                    </text>
                  </>
                )}

                {weightChartData.coords.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#00D2BE"
                    strokeWidth={2.5}
                    points={weightChartData.coords.map((c) => `${c.x},${c.y}`).join(' ')}
                  />
                )}

                {weightChartData.coords.map((c, idx) => (
                  <g key={idx}>
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={4.5}
                      fill="#080B0E"
                      stroke="#00D2BE"
                      strokeWidth={2.5}
                    />
                    <text
                      x={c.x}
                      y={c.y - 10}
                      fill="#FFFFFF"
                      fontSize="11"
                      textAnchor="middle"
                      fontFamily="JetBrains Mono"
                    >
                      {c.weight.toFixed(1)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div className="bg-[#151A20] border border-[#707982]/30 rounded-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">
                    Volume por Sessão Registrada
                  </h2>
                  <p className="text-xs text-[#707982]">
                    Soma de carga × séries × repetições
                  </p>
                </div>
                <span className="font-mono-telemetry text-xs text-[#C5CBD0]">
                  Últimas 8 voltas
                </span>
              </div>

              {volumeChartData.ordered.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-center">
                  <p className="text-xs text-[#707982] max-w-xs">
                    Registre suas cargas na aba &ldquo;Cargas & BEST LAP&rdquo; para acompanhar o volume subindo aqui.
                  </p>
                </div>
              ) : (
                <div className="h-48 flex items-end gap-3 pt-6">
                  {volumeChartData.ordered.map((s) => {
                    const pct = Math.max(
                      12,
                      Math.round((s.totalVolumeKg / volumeChartData.maxVol) * 100)
                    );
                    return (
                      <div
                        key={s.id}
                        className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                      >
                        <span className="font-mono-telemetry text-[10px] text-[#C5CBD0]">
                          {(s.totalVolumeKg / 1000).toFixed(1)}t
                        </span>
                        <div
                          className="w-full max-w-[44px] rounded-t bg-[#00D2BE] transition-all"
                          style={{ height: `${pct}%` }}
                        />
                        <span className="font-mono-telemetry text-[10px] text-[#707982]">
                          {s.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Checkpoint Form + History */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <form
              onSubmit={handleAddCheckpoint}
              className="lg:col-span-5 bg-[#151A20] border border-[#707982]/30 rounded-md p-6 space-y-4"
            >
              <h2 className="font-display text-lg font-bold text-white">
                Novo Registro no Diário
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cp-date" className="block text-xs text-[#C5CBD0] mb-1">
                    Data
                  </label>
                  <input
                    id="cp-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm font-mono-telemetry focus:border-[#00D2BE] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="cp-weight" className="block text-xs text-[#C5CBD0] mb-1">
                    Peso (kg)
                  </label>
                  <input
                    id="cp-weight"
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm font-mono-telemetry focus:border-[#00D2BE] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="cp-waist" className="block text-xs text-[#C5CBD0] mb-1">
                    Cintura (cm · opcional)
                  </label>
                  <input
                    id="cp-waist"
                    type="number"
                    step="0.5"
                    value={waistCm}
                    onChange={(e) => setWaistCm(e.target.value)}
                    placeholder="Ex: 68"
                    className="w-full px-3 py-2 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm font-mono-telemetry focus:border-[#00D2BE] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="cp-hip" className="block text-xs text-[#C5CBD0] mb-1">
                    Quadril (cm · opcional)
                  </label>
                  <input
                    id="cp-hip"
                    type="number"
                    step="0.5"
                    value={hipCm}
                    onChange={(e) => setHipCm(e.target.value)}
                    placeholder="Ex: 98"
                    className="w-full px-3 py-2 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm font-mono-telemetry focus:border-[#00D2BE] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="cp-thigh" className="block text-xs text-[#C5CBD0] mb-1">
                    Coxa (cm · opcional)
                  </label>
                  <input
                    id="cp-thigh"
                    type="number"
                    step="0.5"
                    value={thighCm}
                    onChange={(e) => setThighCm(e.target.value)}
                    placeholder="Ex: 56"
                    className="w-full px-3 py-2 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm font-mono-telemetry focus:border-[#00D2BE] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="cp-arm" className="block text-xs text-[#C5CBD0] mb-1">
                    Braço (cm · opcional)
                  </label>
                  <input
                    id="cp-arm"
                    type="number"
                    step="0.5"
                    value={armCm}
                    onChange={(e) => setArmCm(e.target.value)}
                    placeholder="Ex: 27"
                    className="w-full px-3 py-2 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm font-mono-telemetry focus:border-[#00D2BE] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cp-note" className="block text-xs text-[#C5CBD0] mb-1">
                  Observações (opcional)
                </label>
                <input
                  id="cp-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex: Me sentindo mais forte e com mais disposição"
                  className="w-full px-3 py-2 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm focus:border-[#00D2BE] focus:outline-none"
                />
              </div>

              {/* Optional Photo Upload */}
              <div>
                <span className="block text-xs text-[#C5CBD0] mb-1.5">
                  Foto de acompanhamento (opcional)
                </span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded bg-[#080B0E] border border-[#707982]/40 hover:border-[#00D2BE] text-xs text-[#C5CBD0] hover:text-white cursor-pointer">
                    <Camera className="w-4 h-4 text-[#00D2BE]" />
                    <span>{photoDataUrl ? 'Trocar foto' : 'Anexar foto'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoSelect}
                      className="sr-only"
                    />
                  </label>
                  {photoDataUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoDataUrl(undefined)}
                      className="text-xs text-[#707982] hover:text-red-400 cursor-pointer"
                    >
                      Remover foto
                    </button>
                  )}
                </div>
                {photoError && (
                  <p className="mt-1.5 text-xs text-red-400">{photoError}</p>
                )}
                {photoDataUrl && isSafeImageDataUrl(photoDataUrl) && (
                  <img
                    src={photoDataUrl}
                    alt="Prévia do registro"
                    className="mt-3 w-28 h-28 object-cover rounded border border-[#00D2BE]/50"
                  />
                )}
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded bg-[#00D2BE] text-[#080B0E] font-display font-bold text-xs tracking-[0.1em] uppercase hover:bg-[#1de6d2] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Salvar no Diário</span>
              </button>
            </form>

            {/* Checkpoint & Photos History */}
            <div className="lg:col-span-7 bg-[#151A20] border border-[#707982]/30 rounded-md p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#707982]/25">
                <h2 className="font-display text-lg font-bold text-white">
                  Histórico de Medidas & Fotos
                </h2>
                <span className="font-mono-telemetry text-xs text-[#00D2BE]">
                  {checkpoints.length} registros
                </span>
              </div>

              {checkpoints.length === 0 ? (
                <p className="py-10 text-center text-sm text-[#707982]">
                  Nenhum registro ainda. Adicione seu primeiro registro ao lado.
                </p>
              ) : (
                <div className="mt-4 space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {[...checkpoints].reverse().map((cp) => (
                    <div
                      key={cp.id}
                      className="p-4 rounded bg-[#080B0E] border border-[#707982]/25 flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        {isSafeImageDataUrl(cp.photoDataUrl) && (
                          <button
                            type="button"
                            onClick={() => setPhotoPreviewModal(cp.photoDataUrl!)}
                            className="w-16 h-16 rounded overflow-hidden border border-[#707982]/40 hover:border-[#00D2BE] shrink-0 cursor-pointer"
                          >
                            <img
                              src={cp.photoDataUrl}
                              alt={`Registro de ${cp.date}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono-telemetry">
                            <span className="text-[#00D2BE]">{cp.date}</span>
                            <span className="text-[#707982]">·</span>
                            <span className="text-white font-bold">{cp.weightKg} kg</span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-[#C5CBD0]">
                            {cp.waistCm !== undefined && <span>Cintura: {cp.waistCm}cm</span>}
                            {cp.hipCm !== undefined && <span>Quadril: {cp.hipCm}cm</span>}
                            {cp.thighCm !== undefined && <span>Coxa: {cp.thighCm}cm</span>}
                            {cp.armCm !== undefined && <span>Braço: {cp.armCm}cm</span>}
                          </div>
                          {cp.note && (
                            <p className="mt-1.5 text-xs text-[#707982] italic">
                              &ldquo;{cp.note}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteCheckpoint(cp.id)}
                        aria-label="Excluir registro"
                        className="p-1 text-[#707982] hover:text-red-400 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* TAB 2: CARGAS & BEST LAP */
        <div className="space-y-6">
          {lastSavedPrs !== null && (
            <div className="p-5 rounded-md bg-[#151A20] border border-[#00D2BE] flex items-start gap-4">
              <div className="w-10 h-10 rounded bg-[#080B0E] border border-[#00D2BE]/40 flex items-center justify-center shrink-0">
                {lastSavedPrs.length > 0 ? (
                  <Award className="w-5 h-5 text-[#00D2BE]" />
                ) : (
                  <Radio className="w-5 h-5 text-[#00D2BE]" />
                )}
              </div>
              <div>
                <p className="text-xs font-mono-telemetry text-[#00D2BE] uppercase">
                  {lastSavedPrs.length > 0
                    ? `BEST LAP DETECTADA · ${lastSavedPrs.length} Recorde(s)`
                    : 'Treino Registrado na Telemetria'}
                </p>
                <p className="mt-1 text-sm text-white leading-relaxed">
                  {lastSavedPrs.length > 0
                    ? `Nauhan: "Simplesmente absurda, ${profile.name}! Você bateu recorde pessoal em ${lastSavedPrs.join(', ')}. Desse jeito eu vou ter que aplaudir de pé toda vez que você sair da academia."`
                    : `Nauhan: "Mais um treino fechado com disciplina, ${profile.name}. É exatamente essa constância que transforma o resultado final."`}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <form
              onSubmit={handleSaveLoadSession}
              className="lg:col-span-7 bg-[#151A20] border border-[#707982]/30 rounded-md p-6 space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="log-day" className="block text-xs text-[#C5CBD0] mb-1.5">
                    Sessão do Cronograma
                  </label>
                  <select
                    id="log-day"
                    value={selectedDayIndex}
                    onChange={(e) => handleLoadDayTemplate(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm focus:border-[#00D2BE] focus:outline-none"
                  >
                    {trainingDays.map((d) => (
                      <option key={d.dayIndex} value={d.dayIndex}>
                        {d.shortDay} · {d.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="log-date" className="block text-xs text-[#C5CBD0] mb-1.5">
                    Data
                  </label>
                  <input
                    id="log-date"
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm font-mono-telemetry focus:border-[#00D2BE] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-telemetry text-[#00D2BE] uppercase">
                    Exercícios & Cargas Utilizadas
                  </span>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#00D2BE] hover:text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar exercício</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {sets.map((row, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-[#080B0E] p-3 rounded border border-[#707982]/25"
                    >
                      <div className="col-span-12 sm:col-span-5">
                        <input
                          type="text"
                          value={row.exerciseName}
                          onChange={(e) =>
                            handleUpdateSet(idx, 'exerciseName', e.target.value)
                          }
                          placeholder="Nome do exercício"
                          className="w-full bg-transparent text-sm text-white focus:outline-none"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] text-[#707982]">Carga (kg)</label>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={row.weightKg}
                          onChange={(e) =>
                            handleUpdateSet(idx, 'weightKg', Number(e.target.value))
                          }
                          className="w-full bg-transparent font-mono-telemetry text-sm text-[#00D2BE] focus:outline-none"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <label className="block text-[10px] text-[#707982]">Séries</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={row.setsCompleted}
                          onChange={(e) =>
                            handleUpdateSet(idx, 'setsCompleted', Number(e.target.value))
                          }
                          className="w-full bg-transparent font-mono-telemetry text-sm text-white focus:outline-none"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <label className="block text-[10px] text-[#707982]">Reps</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={row.reps}
                          onChange={(e) =>
                            handleUpdateSet(idx, 'reps', Number(e.target.value))
                          }
                          className="w-full bg-transparent font-mono-telemetry text-sm text-white focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          aria-label="Remover exercício"
                          className="p-1.5 text-[#707982] hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="log-dur" className="block text-xs text-[#C5CBD0] mb-1.5">
                    Duração (minutos)
                  </label>
                  <input
                    id="log-dur"
                    type="number"
                    min={10}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm font-mono-telemetry focus:border-[#00D2BE] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="log-rpe" className="block text-xs text-[#C5CBD0] mb-1.5">
                    Esforço Percebido (RPE {rpe}/10)
                  </label>
                  <input
                    id="log-rpe"
                    type="range"
                    min={5}
                    max={10}
                    step={0.5}
                    value={rpe}
                    onChange={(e) => setRpe(Number(e.target.value))}
                    className="w-full accent-[#00D2BE] mt-2"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="log-notes" className="block text-xs text-[#C5CBD0] mb-1.5">
                  Observações da Sessão
                </label>
                <textarea
                  id="log-notes"
                  rows={2}
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="Ex: Aumentei carga no hip thrust e me senti muito bem..."
                  className="w-full px-3.5 py-2.5 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm focus:border-[#00D2BE] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded bg-[#00D2BE] text-[#080B0E] font-display font-bold text-sm tracking-[0.1em] uppercase hover:bg-[#1de6d2] transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Registrar Cargas & Treino</span>
              </button>
            </form>

            {/* Right 5 Cols: BEST LAP Table + Session History */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#151A20] border border-[#707982]/30 rounded-md p-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#707982]/25">
                  <h2 className="font-display text-lg font-bold text-white">
                    BEST LAP · Recordes de Carga
                  </h2>
                  <span className="font-mono-telemetry text-xs text-[#00D2BE]">
                    {personalRecords.length} exercícios
                  </span>
                </div>

                {personalRecords.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#707982]">
                    Salve uma sessão ao lado para registrar suas maiores cargas.
                  </p>
                ) : (
                  <div className="mt-2 overflow-x-auto max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#707982]/25 text-xs text-[#707982]">
                          <th className="py-2.5 font-medium">Exercício</th>
                          <th className="py-2.5 font-medium text-right">Melhor Carga</th>
                          <th className="py-2.5 font-medium text-right">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#707982]/15 text-xs sm:text-sm">
                        {personalRecords.map((pr) => (
                          <tr key={pr.name}>
                            <td className="py-2.5 text-white font-medium">{pr.name}</td>
                            <td className="py-2.5 text-right font-mono-telemetry text-[#00D2BE] font-semibold">
                              {pr.weightKg} kg
                            </td>
                            <td className="py-2.5 text-right font-mono-telemetry text-xs text-[#707982]">
                              {pr.date}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-[#151A20] border border-[#707982]/30 rounded-md p-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#707982]/25">
                  <h2 className="font-display text-lg font-bold text-white">
                    Histórico de Treinos
                  </h2>
                  <span className="font-mono-telemetry text-xs text-[#707982]">
                    {sessions.length} voltas
                  </span>
                </div>

                {sessions.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#707982]">
                    Nenhuma sessão registrada ainda.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        className="p-3.5 rounded bg-[#080B0E] border border-[#707982]/25 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 text-xs font-mono-telemetry text-[#00D2BE]">
                              <span>{s.date}</span>
                              <span>·</span>
                              <span>{s.durationMinutes} min</span>
                              <span>·</span>
                              <span>RPE {s.rpe}</span>
                            </div>
                            <h3 className="mt-0.5 text-sm font-semibold text-white">
                              {s.dayTitle}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteSession(s.id)}
                            aria-label="Excluir treino"
                            className="p-1 text-[#707982] hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-xs text-[#C5CBD0]">
                          <span>{s.sets.length} exercícios</span>
                          <span className="font-mono-telemetry text-white">
                            {s.totalVolumeKg.toLocaleString('pt-BR')} kg
                          </span>
                        </div>
                        {s.newPrExercises.length > 0 && (
                          <p className="text-xs text-[#00D2BE]">
                            BEST LAP: {s.newPrExercises.join(', ')}
                          </p>
                        )}
                        {s.notes && (
                          <p className="text-xs text-[#707982] italic">&ldquo;{s.notes}&rdquo;</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Photo Preview */}
      {photoPreviewModal && isSafeImageDataUrl(photoPreviewModal) && (
        <div
          className="fixed inset-0 z-50 bg-[#080B0E]/90 flex items-center justify-center p-4"
          onClick={() => setPhotoPreviewModal(null)}
        >
          <div className="relative max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPhotoPreviewModal(null)}
              aria-label="Fechar foto"
              className="absolute -top-10 right-0 text-white hover:text-[#00D2BE] cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={photoPreviewModal}
              alt="Foto de acompanhamento"
              className="w-full max-h-[80vh] object-contain rounded-md border border-[#00D2BE]/40"
            />
          </div>
        </div>
      )}
    </div>
  );
}
