import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { GOAL_OPTIONS } from '../data/exercisesLibrary';
import {
  DriverProfile,
  ExperienceLevel,
  FitnessGoal,
  FocusRegion,
} from '../types/racing';

interface QuestionnaireWizardProps {
  goal: FitnessGoal;
  initialProfile: DriverProfile | null;
  defaultName?: string;
  onBackToGoals: () => void;
  onComplete: (profile: DriverProfile) => void;
}

const EXPERIENCE_OPTIONS: Array<{ id: ExperienceLevel; label: string; sub: string }> = [
  { id: ExperienceLevel.NUNCA_TREINEI, label: 'Nunca treinei.', sub: 'Primeira vez na musculação, foco em aprender movimentos.' },
  { id: ExperienceLevel.INICIANTE, label: 'Sou iniciante.', sub: 'Treinei pouco ou estou retomando a rotina.' },
  { id: ExperienceLevel.INTERMEDIARIO, label: 'Já treino há algum tempo.', sub: 'Conheço os exercícios principais e treino com regularidade.' },
  { id: ExperienceLevel.EXPERIENTE, label: 'Sou experiente.', sub: 'Domino a técnica e busco progressão estruturada.' },
];

const FOCUS_REGION_OPTIONS: Array<{ id: FocusRegion; label: string }> = [
  { id: 'gluteos', label: 'Glúteos' },
  { id: 'pernas', label: 'Pernas' },
  { id: 'quadriceps', label: 'Quadríceps' },
  { id: 'posterior_coxa', label: 'Posterior de coxa' },
  { id: 'costas', label: 'Costas' },
  { id: 'bracos', label: 'Braços' },
  { id: 'ombros', label: 'Ombros' },
  { id: 'abdomen', label: 'Abdômen' },
  { id: 'corpo_inteiro', label: 'Corpo inteiro' },
];

export function QuestionnaireWizard({
  goal,
  initialProfile,
  defaultName = 'Rebeca',
  onBackToGoals,
  onComplete,
}: QuestionnaireWizardProps) {
  const [step, setStep] = useState<number>(1);

  // Etapa 1 — Informações físicas
  const [name, setName] = useState(initialProfile?.name ?? defaultName);
  const [age, setAge] = useState<string>(String(initialProfile?.age ?? 24));
  const [heightCm, setHeightCm] = useState<string>(String(initialProfile?.heightCm ?? 165));
  const [currentWeightKg, setCurrentWeightKg] = useState<string>(
    String(initialProfile?.currentWeightKg ?? 60)
  );
  const [targetWeightKg, setTargetWeightKg] = useState<string>(
    initialProfile?.targetWeightKg ? String(initialProfile.targetWeightKg) : ''
  );

  // Etapa 2 — Experiência
  const [experience, setExperience] = useState<ExperienceLevel>(
    initialProfile?.experience ?? ExperienceLevel.INTERMEDIARIO
  );

  // Etapa 3 — Disponibilidade
  const [daysPerWeek, setDaysPerWeek] = useState<2 | 3 | 4 | 5 | 6>(
    initialProfile?.daysPerWeek ?? 4
  );
  const [sessionMinutes, setSessionMinutes] = useState<30 | 45 | 60 | 90>(
    initialProfile?.sessionMinutes ?? 60
  );

  // Etapa 4 — Preferências
  const [focusRegions, setFocusRegions] = useState<FocusRegion[]>(
    initialProfile?.focusRegions?.length
      ? initialProfile.focusRegions
      : ['gluteos', 'pernas']
  );
  const [dislikedExercises, setDislikedExercises] = useState<string>(
    initialProfile?.dislikedExercises ?? ''
  );

  // Etapa 5 — Segurança (todas opcionais)
  const [injuries, setInjuries] = useState<string>(initialProfile?.injuries ?? '');
  const [physicalLimitations, setPhysicalLimitations] = useState<string>(
    initialProfile?.physicalLimitations ?? ''
  );
  const [avoidExercises, setAvoidExercises] = useState<string>(
    initialProfile?.avoidExercises ?? ''
  );
  const [professionalGuidance, setProfessionalGuidance] = useState<string>(
    initialProfile?.professionalGuidance ?? ''
  );

  const [stepError, setStepError] = useState<string | null>(null);

  const goalInfo = GOAL_OPTIONS.find((g) => g.id === goal) ?? GOAL_OPTIONS[0];
  const progressPct = Math.round((step / 5) * 100);

  const toggleFocusRegion = (region: FocusRegion) => {
    setFocusRegions((prev) => {
      if (prev.includes(region)) {
        return prev.length > 1 ? prev.filter((r) => r !== region) : prev;
      }
      return [...prev, region];
    });
  };

  const handleNext = () => {
    setStepError(null);
    if (step === 1) {
      const parsedAge = Number(age);
      const parsedHeight = Number(heightCm);
      const parsedWeight = Number(currentWeightKg);
      if (!name.trim()) {
        setStepError('Informe seu nome para continuar.');
        return;
      }
      if (!parsedAge || parsedAge < 14 || parsedAge > 95) {
        setStepError('Informe uma idade válida (entre 14 e 95 anos).');
        return;
      }
      if (!parsedHeight || parsedHeight < 120 || parsedHeight > 225) {
        setStepError('Informe sua altura em centímetros (ex: 165).');
        return;
      }
      if (!parsedWeight || parsedWeight < 32 || parsedWeight > 220) {
        setStepError('Informe seu peso atual em kg (ex: 60).');
        return;
      }
    }

    if (step < 5) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const parsedTarget = targetWeightKg.trim() ? Number(targetWeightKg) : undefined;
    const profile: DriverProfile = {
      name: name.trim() || 'Rebeca',
      age: Number(age),
      heightCm: Number(heightCm),
      currentWeightKg: Number(currentWeightKg),
      targetWeightKg: parsedTarget && parsedTarget > 30 ? parsedTarget : undefined,
      goal,
      experience,
      daysPerWeek,
      sessionMinutes,
      focusRegions,
      dislikedExercises: dislikedExercises.trim(),
      injuries: injuries.trim(),
      physicalLimitations: physicalLimitations.trim(),
      avoidExercises: avoidExercises.trim(),
      professionalGuidance: professionalGuidance.trim(),
      createdAt: initialProfile?.createdAt ?? new Date().toISOString(),
    };
    onComplete(profile);
  };

  const handlePrev = () => {
    setStepError(null);
    if (step === 1) {
      onBackToGoals();
    } else {
      setStep((s) => s - 1);
    }
  };

  return (
    <section className="min-h-screen bg-[#080B0E] telemetry-grid-bg text-white flex flex-col">
      <div className="w-full max-w-3xl mx-auto px-6 py-8 sm:py-12 flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#707982]/25">
          <button
            type="button"
            onClick={handlePrev}
            className="inline-flex items-center gap-2 text-sm text-[#C5CBD0] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#00D2BE]" />
            <span>{step === 1 ? 'Trocar Objetivo' : 'Etapa Anterior'}</span>
          </button>

          <span className="font-mono-telemetry text-xs text-[#00D2BE]">
            Etapa 0{step} de 05 · {goalInfo.title} {goalInfo.emoji}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-[#707982] mb-2">
            <span>Perfil da Piloto</span>
            <span className="font-mono-telemetry text-[#C5CBD0]">{progressPct}%</span>
          </div>
          <div className="h-2 w-full rounded bg-[#151A20] overflow-hidden">
            <div
              className="h-full bg-[#00D2BE] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="mt-8 bg-[#151A20] border border-[#707982]/30 rounded-md p-6 sm:p-8 flex-1 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {step === 1 && (
                <>
                  <div>
                    <p className="text-xs font-mono-telemetry text-[#00D2BE] uppercase">
                      Etapa 1 — Informações Físicas
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold text-white">
                      Seus dados atuais
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="q-name" className="block text-xs text-[#C5CBD0] mb-1.5">
                        Nome
                      </label>
                      <input
                        id="q-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm focus:border-[#00D2BE] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="q-age" className="block text-xs text-[#C5CBD0] mb-1.5">
                        Idade
                      </label>
                      <input
                        id="q-age"
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm font-mono-telemetry focus:border-[#00D2BE] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="q-height" className="block text-xs text-[#C5CBD0] mb-1.5">
                        Altura (cm)
                      </label>
                      <input
                        id="q-height"
                        type="number"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        placeholder="Ex: 165"
                        className="w-full px-3.5 py-2.5 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm font-mono-telemetry focus:border-[#00D2BE] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="q-weight" className="block text-xs text-[#C5CBD0] mb-1.5">
                        Peso atual (kg)
                      </label>
                      <input
                        id="q-weight"
                        type="number"
                        step="0.1"
                        value={currentWeightKg}
                        onChange={(e) => setCurrentWeightKg(e.target.value)}
                        placeholder="Ex: 60"
                        className="w-full px-3.5 py-2.5 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm font-mono-telemetry focus:border-[#00D2BE] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="q-target" className="block text-xs text-[#C5CBD0] mb-1.5">
                        Peso desejado em kg (opcional)
                      </label>
                      <input
                        id="q-target"
                        type="number"
                        step="0.1"
                        value={targetWeightKg}
                        onChange={(e) => setTargetWeightKg(e.target.value)}
                        placeholder="Opcional"
                        className="w-full px-3.5 py-2.5 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm font-mono-telemetry focus:border-[#00D2BE] focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <p className="text-xs font-mono-telemetry text-[#00D2BE] uppercase">
                      Etapa 2 — Experiência
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold text-white">
                      Qual é seu nível na academia?
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {EXPERIENCE_OPTIONS.map((opt) => {
                      const active = experience === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setExperience(opt.id)}
                          className={`w-full text-left p-4 rounded border transition-colors cursor-pointer flex items-center justify-between gap-4 ${
                            active
                              ? 'bg-[#080B0E] border-[#00D2BE]'
                              : 'bg-[#080B0E]/60 border-[#707982]/30 hover:border-[#C5CBD0]'
                          }`}
                        >
                          <div>
                            <p className="text-sm sm:text-base font-semibold text-white">
                              {opt.label}
                            </p>
                            <p className="mt-0.5 text-xs text-[#707982]">{opt.sub}</p>
                          </div>
                          {active && (
                            <span className="w-6 h-6 rounded-full bg-[#00D2BE] text-[#080B0E] flex items-center justify-center shrink-0">
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div>
                    <p className="text-xs font-mono-telemetry text-[#00D2BE] uppercase">
                      Etapa 3 — Disponibilidade
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold text-white">
                      Sua rotina semanal de treinos
                    </h2>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white mb-3">
                      Quantos dias por semana consegue treinar?
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {([2, 3, 4, 5, 6] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDaysPerWeek(d)}
                          className={`py-3 rounded text-sm font-mono-telemetry font-semibold border transition-colors cursor-pointer ${
                            daysPerWeek === d
                              ? 'bg-[#00D2BE] text-[#080B0E] border-[#00D2BE]'
                              : 'bg-[#080B0E] text-[#C5CBD0] border-[#707982]/35 hover:border-[#C5CBD0]'
                          }`}
                        >
                          {d} dias
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white mb-3">
                      Quanto tempo possui por treino?
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {([30, 45, 60, 90] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setSessionMinutes(m)}
                          className={`py-3 rounded text-sm font-mono-telemetry font-semibold border transition-colors cursor-pointer ${
                            sessionMinutes === m
                              ? 'bg-[#00D2BE] text-[#080B0E] border-[#00D2BE]'
                              : 'bg-[#080B0E] text-[#C5CBD0] border-[#707982]/35 hover:border-[#C5CBD0]'
                          }`}
                        >
                          {m} minutos
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <div>
                    <p className="text-xs font-mono-telemetry text-[#00D2BE] uppercase">
                      Etapa 4 — Preferências
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold text-white">
                      Quais regiões deseja desenvolver mais?
                    </h2>
                    <p className="mt-1 text-xs text-[#707982]">
                      Você pode selecionar mais de uma opção.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {FOCUS_REGION_OPTIONS.map((reg) => {
                      const active = focusRegions.includes(reg.id);
                      return (
                        <button
                          key={reg.id}
                          type="button"
                          onClick={() => toggleFocusRegion(reg.id)}
                          className={`py-3 px-3.5 rounded text-sm font-medium border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                            active
                              ? 'bg-[#00D2BE] text-[#080B0E] border-[#00D2BE] font-semibold'
                              : 'bg-[#080B0E] text-[#C5CBD0] border-[#707982]/35 hover:border-[#C5CBD0]'
                          }`}
                        >
                          <span>{reg.label}</span>
                          {active && <Check className="w-4 h-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label htmlFor="q-dislike" className="block text-xs text-[#C5CBD0] mb-1.5">
                      Existe algum exercício de que não gosta? (opcional)
                    </label>
                    <input
                      id="q-dislike"
                      type="text"
                      value={dislikedExercises}
                      onChange={(e) => setDislikedExercises(e.target.value)}
                      placeholder="Ex: Afundo, Esteira, Stiff... (separados por vírgula)"
                      className="w-full px-3.5 py-2.5 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm focus:border-[#00D2BE] focus:outline-none"
                    />
                  </div>
                </>
              )}

              {step === 5 && (
                <>
                  <div>
                    <p className="text-xs font-mono-telemetry text-[#00D2BE] uppercase">
                      Etapa 5 — Segurança (Campos Opcionais)
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold text-white">
                      Cuidados e adaptações individuais
                    </h2>
                    <p className="mt-1 text-xs text-[#707982]">
                      Se não houver nenhuma restrição, pode deixar em branco e finalizar normalmente.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="q-injuries" className="block text-xs text-[#C5CBD0] mb-1.5">
                        Possui alguma lesão? (opcional)
                      </label>
                      <input
                        id="q-injuries"
                        type="text"
                        value={injuries}
                        onChange={(e) => setInjuries(e.target.value)}
                        placeholder="Ex: Joelho esquerdo, lombar, ombro..."
                        className="w-full px-3.5 py-2.5 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm focus:border-[#00D2BE] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="q-limits" className="block text-xs text-[#C5CBD0] mb-1.5">
                        Possui alguma limitação física? (opcional)
                      </label>
                      <input
                        id="q-limits"
                        type="text"
                        value={physicalLimitations}
                        onChange={(e) => setPhysicalLimitations(e.target.value)}
                        placeholder="Ex: Evitar impacto, pouca mobilidade de tornozelo..."
                        className="w-full px-3.5 py-2.5 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm focus:border-[#00D2BE] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="q-avoid" className="block text-xs text-[#C5CBD0] mb-1.5">
                        Existe algum exercício que precisa evitar? (opcional)
                      </label>
                      <input
                        id="q-avoid"
                        type="text"
                        value={avoidExercises}
                        onChange={(e) => setAvoidExercises(e.target.value)}
                        placeholder="Ex: Agachamento livre, corrida..."
                        className="w-full px-3.5 py-2.5 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm focus:border-[#00D2BE] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="q-guidance" className="block text-xs text-[#C5CBD0] mb-1.5">
                        Existe alguma orientação profissional que deve ser respeitada? (opcional)
                      </label>
                      <textarea
                        id="q-guidance"
                        rows={2}
                        value={professionalGuidance}
                        onChange={(e) => setProfessionalGuidance(e.target.value)}
                        placeholder="Ex: Fortalecer glúteo médio, manter carga moderada..."
                        className="w-full px-3.5 py-2.5 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm focus:border-[#00D2BE] focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {stepError && (
            <p className="mt-4 text-xs sm:text-sm text-red-400">{stepError}</p>
          )}

          {/* Bottom Step Actions */}
          <div className="mt-8 pt-5 border-t border-[#707982]/20 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrev}
              className="px-5 py-3 rounded bg-[#080B0E] border border-[#707982]/40 text-xs sm:text-sm font-medium text-[#C5CBD0] hover:text-white cursor-pointer"
            >
              Voltar
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[#00D2BE] text-[#080B0E] font-display font-bold text-xs sm:text-sm tracking-[0.08em] uppercase hover:bg-[#1de6d2] cursor-pointer"
            >
              <span>{step < 5 ? 'Próxima Etapa' : 'Montar Meu Cronograma'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
