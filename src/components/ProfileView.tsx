import { useMemo } from 'react';
import { Car, Edit3, LogOut, ShieldCheck, User } from 'lucide-react';
import { GOAL_OPTIONS } from '../data/exercisesLibrary';
import { calculateDriverMetrics } from '../engine/workoutPlanner';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  AuthUser,
  DriverProfile,
  ExperienceLevel,
  FocusRegion,
} from '../types/racing';

interface ProfileViewProps {
  authUser: AuthUser;
  profile: DriverProfile;
  onEditGoalAndQuestionnaire: () => void;
  onOpenGarage3D: () => void;
  onSignOut: () => void;
}

const EXP_LABELS: Record<ExperienceLevel, string> = {
  [ExperienceLevel.NUNCA_TREINEI]: 'Nunca treinei',
  [ExperienceLevel.INICIANTE]: 'Iniciante',
  [ExperienceLevel.INTERMEDIARIO]: 'Já treino há algum tempo',
  [ExperienceLevel.EXPERIENTE]: 'Experiente',
};

const REGION_LABELS: Record<FocusRegion, string> = {
  gluteos: 'Glúteos',
  pernas: 'Pernas',
  quadriceps: 'Quadríceps',
  posterior_coxa: 'Posterior de coxa',
  costas: 'Costas',
  bracos: 'Braços',
  ombros: 'Ombros',
  abdomen: 'Abdômen',
  corpo_inteiro: 'Corpo inteiro',
};

export function ProfileView({
  authUser,
  profile,
  onEditGoalAndQuestionnaire,
  onOpenGarage3D,
  onSignOut,
}: ProfileViewProps) {
  const goalInfo = GOAL_OPTIONS.find((g) => g.id === profile.goal) ?? GOAL_OPTIONS[0];
  const metrics = useMemo(() => calculateDriverMetrics(profile), [profile]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 pb-24 lg:pb-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#707982]/25">
        <div>
          <p className="font-mono-telemetry text-xs tracking-[0.18em] text-[#00D2BE] uppercase">
            FICHA DA PILOTO · CONFIGURAÇÕES
          </p>
          <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-white">
            Meu Perfil
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onEditGoalAndQuestionnaire}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-[#00D2BE] text-[#080B0E] font-display text-xs font-bold uppercase tracking-wider hover:bg-[#1de6d2] cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Atualizar Meta / Questionário</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-[#151A20] border border-[#707982]/40 hover:border-red-400 text-xs font-medium text-[#C5CBD0] hover:text-white cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>

      {/* Driver Physical & Training Profile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#151A20] border border-[#707982]/30 rounded-md p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#080B0E] border border-[#00D2BE]/40 flex items-center justify-center">
              <User className="w-5 h-5 text-[#00D2BE]" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                {profile.name}
              </h2>
              <p className="text-xs text-[#707982]">{authUser.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#707982]/20 text-sm">
            <div>
              <span className="text-xs text-[#707982]">Objetivo</span>
              <p className="font-semibold text-white">
                {goalInfo.code} — {goalInfo.title} {goalInfo.emoji}
              </p>
            </div>
            <div>
              <span className="text-xs text-[#707982]">Experiência</span>
              <p className="font-semibold text-white">
                {EXP_LABELS[profile.experience]}
              </p>
            </div>
            <div>
              <span className="text-xs text-[#707982]">Idade / Altura</span>
              <p className="font-mono-telemetry text-white">
                {profile.age} anos · {profile.heightCm} cm
              </p>
            </div>
            <div>
              <span className="text-xs text-[#707982]">Peso Atual / Alvo</span>
              <p className="font-mono-telemetry text-white">
                {profile.currentWeightKg} kg
                {profile.targetWeightKg !== undefined
                  ? ` → ${profile.targetWeightKg} kg`
                  : ''}
              </p>
            </div>
            <div>
              <span className="text-xs text-[#707982]">Rotina</span>
              <p className="font-mono-telemetry text-[#00D2BE]">
                {profile.daysPerWeek} dias/sem · {profile.sessionMinutes} min
              </p>
            </div>
            <div>
              <span className="text-xs text-[#707982]">IMC de Referência</span>
              <p className="font-mono-telemetry text-white">
                {metrics.bmi} ({metrics.bmiClassification})
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#707982]/20">
            <span className="text-xs text-[#707982]">Regiões de Foco</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.focusRegions.map((reg) => (
                <span
                  key={reg}
                  className="px-2.5 py-1 rounded bg-[#080B0E] border border-[#00D2BE]/40 text-xs text-[#00D2BE]"
                >
                  {REGION_LABELS[reg]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Nutrition Reference + Safety Notes + Garage 3D */}
        <div className="space-y-6">
          <div className="bg-[#151A20] border border-[#707982]/30 rounded-md p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-white">
              Referência Diária de Suporte
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-xs text-[#707982]">Calorias</span>
                <p className="font-mono-telemetry text-lg font-bold text-white">
                  {metrics.targetCalories}
                </p>
              </div>
              <div>
                <span className="text-xs text-[#707982]">Proteína</span>
                <p className="font-mono-telemetry text-lg font-bold text-[#00D2BE]">
                  {metrics.proteinGrams}g
                </p>
              </div>
              <div>
                <span className="text-xs text-[#707982]">Carboidrato</span>
                <p className="font-mono-telemetry text-lg font-bold text-white">
                  {metrics.carbsGrams}g
                </p>
              </div>
              <div>
                <span className="text-xs text-[#707982]">Água</span>
                <p className="font-mono-telemetry text-lg font-bold text-white">
                  {metrics.waterLiters}L
                </p>
              </div>
            </div>
            <p className="text-xs text-[#707982]">
              Valores de referência calculados automaticamente para apoiar energia e recuperação sem promessas de prazo.
            </p>
          </div>

          <div className="bg-[#151A20] border border-[#707982]/30 rounded-md p-6 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00D2BE]" />
              <h2 className="font-display text-base font-bold text-white">
                Segurança & Adaptações
              </h2>
            </div>
            <div className="text-xs text-[#C5CBD0] space-y-1.5">
              <p>
                <span className="text-[#707982]">Exercícios que não gosta: </span>
                {profile.dislikedExercises || 'Nenhum informado'}
              </p>
              <p>
                <span className="text-[#707982]">Lesões: </span>
                {profile.injuries || 'Nenhuma informada'}
              </p>
              <p>
                <span className="text-[#707982]">Limitações: </span>
                {profile.physicalLimitations || 'Nenhuma informada'}
              </p>
              <p>
                <span className="text-[#707982]">Evitar: </span>
                {profile.avoidExercises || 'Nenhum informado'}
              </p>
              {profile.professionalGuidance && (
                <p>
                  <span className="text-[#707982]">Orientação profissional: </span>
                  {profile.professionalGuidance}
                </p>
              )}
            </div>
          </div>

          <div className="bg-[#151A20] border border-[#707982]/30 rounded-md p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono-telemetry text-[#00D2BE] uppercase">
                SHOWROOM 3D · RR-01
              </p>
              <p className="mt-1 text-xs text-[#C5CBD0]">
                {isSupabaseConfigured
                  ? 'Dados sincronizados via Supabase Auth & PostgreSQL.'
                  : 'Sessão protegida localmente no navegador (pronta para Supabase).'}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenGarage3D}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-[#080B0E] border border-[#00D2BE]/50 text-[#00D2BE] hover:bg-[#00D2BE]/10 text-xs font-display font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap"
            >
              <Car className="w-4 h-4" />
              <span>Garagem 3D</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
