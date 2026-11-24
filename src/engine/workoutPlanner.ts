import { EXERCISES_LIBRARY, LibraryExercise } from '../data/exercisesLibrary';
import { getDailyMuscleTip, MUSCLE_GROUP_LABELS } from '../data/nauhanMessages';
import {
  CalculatedMetrics,
  DriverProfile,
  ExperienceLevel,
  FitnessGoal,
  FocusRegion,
  LoggedSession,
  MuscleTipGroup,
  WorkoutDay,
  WorkoutExercise,
} from '../types/racing';

export function calculateDriverMetrics(profile: DriverProfile): CalculatedMetrics {
  const heightM = profile.heightCm / 100;
  const bmi = Number((profile.currentWeightKg / (heightM * heightM)).toFixed(1));

  let bmiClassification = 'Faixa Saudável';
  if (bmi < 18.5) bmiClassification = 'Abaixo do padrão';
  else if (bmi < 25) bmiClassification = 'Faixa Ideal';
  else if (bmi < 30) bmiClassification = 'Sobrepeso Leve';
  else bmiClassification = 'Ajuste Metabólico';

  // Mifflin-St Jeor (female baseline)
  const bmrKcal = Math.round(
    10 * profile.currentWeightKg + 6.25 * profile.heightCm - 5 * profile.age - 161
  );

  const activityMap: Record<number, number> = {
    2: 1.36,
    3: 1.42,
    4: 1.5,
    5: 1.58,
    6: 1.65,
  };
  const multiplier = activityMap[profile.daysPerWeek] ?? 1.5;
  const tdeeKcal = Math.round(bmrKcal * multiplier);

  let calorieDelta = 0;
  let proteinFactor = 1.9;
  switch (profile.goal) {
    case FitnessGoal.EMAGRECER:
      calorieDelta = -320;
      proteinFactor = 2.0;
      break;
    case FitnessGoal.MANTER:
      calorieDelta = 0;
      proteinFactor = 1.8;
      break;
    case FitnessGoal.MASSA_MUSCULAR:
      calorieDelta = 220;
      proteinFactor = 2.0;
      break;
    case FitnessGoal.FICAR_GOSTOSA:
      calorieDelta =
        profile.targetWeightKg && profile.targetWeightKg < profile.currentWeightKg - 1
          ? -180
          : 140;
      proteinFactor = 2.0;
      break;
  }

  const targetCalories = Math.max(1350, tdeeKcal + calorieDelta);
  const proteinGrams = Math.round(profile.currentWeightKg * proteinFactor);
  const fatsGrams = Math.round((targetCalories * 0.27) / 9);
  const remainingCals = Math.max(200, targetCalories - proteinGrams * 4 - fatsGrams * 9);
  const carbsGrams = Math.round(remainingCals / 4);
  const waterLiters = Number((profile.currentWeightKg * 0.04).toFixed(1));

  return {
    bmi,
    bmiClassification,
    bmrKcal,
    tdeeKcal,
    targetCalories,
    proteinGrams,
    carbsGrams,
    fatsGrams,
    waterLiters,
  };
}

const WEEK_DAYS = [
  { dayName: 'Segunda-feira', shortDay: 'SEG' },
  { dayName: 'Terça-feira', shortDay: 'TER' },
  { dayName: 'Quarta-feira', shortDay: 'QUA' },
  { dayName: 'Quinta-feira', shortDay: 'QUI' },
  { dayName: 'Sexta-feira', shortDay: 'SEX' },
  { dayName: 'Sábado', shortDay: 'SÁB' },
  { dayName: 'Domingo', shortDay: 'DOM' },
];

const REGION_TO_TIP_GROUPS: Record<FocusRegion, MuscleTipGroup[]> = {
  gluteos: ['gluteos'],
  pernas: ['pernas', 'quadriceps', 'posterior_coxa', 'panturrilhas'],
  quadriceps: ['quadriceps', 'pernas'],
  posterior_coxa: ['posterior_coxa', 'gluteos'],
  costas: ['costas'],
  bracos: ['bracos'],
  ombros: ['ombros'],
  abdomen: ['abdomen'],
  corpo_inteiro: ['gluteos', 'quadriceps', 'costas', 'ombros', 'abdomen'],
};

function isExerciseAllowed(ex: LibraryExercise, profile: DriverProfile): boolean {
  const restrictionText = [
    profile.dislikedExercises,
    profile.injuries,
    profile.physicalLimitations,
    profile.avoidExercises,
  ]
    .join(' ')
    .toLowerCase()
    .trim();

  if (
    (profile.experience === ExperienceLevel.NUNCA_TREINEI ||
      profile.age >= 55) &&
    ex.difficulty === 'Avançado'
  ) {
    return false;
  }

  if (!restrictionText) return true;

  const exNameLower = ex.name.toLowerCase();
  // Check if user typed part of exercise name or any contraindication tag
  for (const kw of ex.contraindicationKeywords) {
    if (kw && restrictionText.includes(kw.toLowerCase())) {
      return false;
    }
  }
  const tokens = restrictionText
    .split(/[,;\n]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4);

  for (const tok of tokens) {
    if (exNameLower.includes(tok)) return false;
  }

  return true;
}

function selectExercisesForGroups(
  targetGroups: MuscleTipGroup[],
  profile: DriverProfile,
  maxExercises: number
): WorkoutExercise[] {
  const safeLibrary = EXERCISES_LIBRARY.filter((ex) => isExerciseAllowed(ex, profile));
  const pool = safeLibrary.length >= 3 ? safeLibrary : EXERCISES_LIBRARY;

  const preferredGroups = new Set<MuscleTipGroup>();
  profile.focusRegions.forEach((r) => {
    REGION_TO_TIP_GROUPS[r]?.forEach((g) => preferredGroups.add(g));
  });

  // Sort candidates prioritizing day targetGroups + user's focusRegions, without duplicates
  const picked: LibraryExercise[] = [];
  const usedKeys = new Set<string>();

  for (const grp of targetGroups) {
    const matches = pool.filter(
      (ex) => ex.muscleTipGroup === grp && !usedKeys.has(ex.key)
    );
    // Prioritize compound/multi-joint first, then preferred regions
    matches.sort((a, b) => {
      const aPref = preferredGroups.has(a.muscleTipGroup) ? 0 : 1;
      const bPref = preferredGroups.has(b.muscleTipGroup) ? 0 : 1;
      return aPref - bPref;
    });
    for (const m of matches) {
      if (picked.length < maxExercises && !usedKeys.has(m.key)) {
        picked.push(m);
        usedKeys.add(m.key);
      }
      if (picked.filter((p) => p.muscleTipGroup === grp).length >= 2) break;
    }
  }

  // Fill remaining slots from targetGroups or safe general exercises
  if (picked.length < maxExercises) {
    const extras = pool.filter(
      (ex) => !usedKeys.has(ex.key) && targetGroups.includes(ex.muscleTipGroup)
    );
    for (const ex of extras) {
      if (picked.length >= maxExercises) break;
      picked.push(ex);
      usedKeys.add(ex.key);
    }
  }

  // Fallback fill if user excluded many exercises
  if (picked.length < Math.min(3, maxExercises)) {
    for (const ex of pool) {
      if (picked.length >= maxExercises) break;
      if (!usedKeys.has(ex.key)) {
        picked.push(ex);
        usedKeys.add(ex.key);
      }
    }
  }

  // Volume rules by experience + age recovery
  const setDelta =
    profile.experience === ExperienceLevel.NUNCA_TREINEI
      ? -1
      : profile.experience === ExperienceLevel.INICIANTE
        ? -1
        : profile.experience === ExperienceLevel.EXPERIENTE
          ? 1
          : 0;

  const restDelta =
    profile.experience === ExperienceLevel.NUNCA_TREINEI ||
    profile.experience === ExperienceLevel.INICIANTE
      ? 15
      : 0;

  return picked.slice(0, maxExercises).map((tpl, idx) => ({
    id: `${tpl.key}-${idx}`,
    orderIndex: idx + 1,
    illustrationKey: tpl.illustrationKey,
    muscleTipGroup: tpl.muscleTipGroup,
    name: tpl.name,
    mainMuscle: tpl.mainMuscle,
    secondaryMuscles: tpl.secondaryMuscles,
    equipment: tpl.equipment,
    difficulty: tpl.difficulty,
    sets: Math.max(
      2,
      Math.min(5, tpl.baseSets + (idx < 2 ? setDelta : 0))
    ),
    reps: tpl.repsByGoal[profile.goal],
    restSeconds: tpl.restByGoal[profile.goal] + restDelta,
    instructions: tpl.instructions,
    commonMistakes: tpl.commonMistakes,
  }));
}

interface DayBlueprint {
  title: string;
  muscleGroups: string;
  groups: MuscleTipGroup[];
  warmup: string;
}

function getSplitBlueprints(profile: DriverProfile): {
  activeDays: number[];
  sessions: DayBlueprint[];
} {
  const prefersUpper =
    profile.focusRegions.includes('costas') ||
    profile.focusRegions.includes('ombros') ||
    profile.focusRegions.includes('bracos');

  if (profile.daysPerWeek === 2) {
    return {
      activeDays: [0, 3], // Seg e Qui — recuperação ampla
      sessions: [
        {
          title: 'Full Body A — Glúteos, Pernas & Costas',
          muscleGroups: 'Glúteos, Quadríceps, Costas e Abdômen',
          groups: ['gluteos', 'quadriceps', 'costas', 'abdomen'],
          warmup: '6 min de esteira ou bike leve + mobilidade de quadril 90/90 antes de começar.',
        },
        {
          title: 'Full Body B — Posterior, Ombros & Braços',
          muscleGroups: 'Posterior de Coxa, Glúteos, Ombros e Braços',
          groups: ['posterior_coxa', 'gluteos', 'ombros', 'bracos', 'abdomen'],
          warmup: '5 min de caminhada inclinada + rotação de ombros com elástico ou halter leve.',
        },
      ],
    };
  }

  if (profile.daysPerWeek === 3) {
    return {
      activeDays: [0, 2, 4], // Seg, Qua, Sex
      sessions: [
        {
          title: 'Inferiores Completos — Quadríceps & Glúteos',
          muscleGroups: 'Quadríceps, Glúteos e Panturrilhas',
          groups: ['quadriceps', 'gluteos', 'pernas', 'panturrilhas'],
          warmup: '6 min de bike leve + 2 séries leves de aquecimento no primeiro exercício.',
        },
        {
          title: 'Superiores Completos & Abdômen',
          muscleGroups: 'Costas, Ombros, Braços, Peito e Abdômen',
          groups: ['costas', 'ombros', 'peito', 'bracos', 'abdomen'],
          warmup: '5 min de mobilidade torácica + aquecimento articular de ombros.',
        },
        {
          title: 'Inferiores & Complementares',
          muscleGroups: 'Posterior de Coxa, Glúteos e Core',
          groups: ['posterior_coxa', 'gluteos', 'pernas', 'abdomen'],
          warmup: '6 min de caminhada leve + mobilidade 90/90 de quadril.',
        },
      ],
    };
  }

  if (profile.daysPerWeek === 4) {
    return {
      activeDays: [0, 1, 3, 4], // Seg, Ter, Qui, Sex
      sessions: [
        {
          title: 'Quadríceps e Glúteos',
          muscleGroups: 'Quadríceps, Glúteos e Panturrilhas',
          groups: ['quadriceps', 'gluteos', 'panturrilhas'],
          warmup: '6 min de aquecimento cardiovascular + mobilidade de tornozelo e quadril.',
        },
        {
          title: prefersUpper ? 'Costas, Ombros & Peito' : 'Superiores Completos',
          muscleGroups: 'Costas, Ombros, Peito e Braços',
          groups: ['costas', 'ombros', 'peito', 'bracos'],
          warmup: '5 min de rotação torácica + séries de reconhecimento leves.',
        },
        {
          title: 'Posterior de Coxa e Glúteos',
          muscleGroups: 'Posterior de Coxa, Glúteos e Pernas',
          groups: ['posterior_coxa', 'gluteos', 'pernas'],
          warmup: '6 min de esteira leve + alongamento dinâmico de posteriores.',
        },
        {
          title: 'Superiores & Abdômen',
          muscleGroups: 'Costas, Braços, Ombros e Abdômen',
          groups: ['costas', 'ombros', 'bracos', 'abdomen'],
          warmup: '5 min de aquecimento geral + ativação de core.',
        },
      ],
    };
  }

  if (profile.daysPerWeek === 5) {
    return {
      activeDays: [0, 1, 2, 3, 4], // Seg a Sex
      sessions: [
        {
          title: 'Quadríceps & Panturrilhas',
          muscleGroups: 'Quadríceps, Pernas e Panturrilhas',
          groups: ['quadriceps', 'pernas', 'panturrilhas'],
          warmup: '7 min de bike ergométrica + agachamento livre sem peso para soltar o quadril.',
        },
        {
          title: 'Costas, Ombros e Braços',
          muscleGroups: 'Costas, Ombros e Braços',
          groups: ['costas', 'ombros', 'bracos'],
          warmup: '5 min de mobilidade torácica e escápulas.',
        },
        {
          title: 'Posterior de Coxa e Glúteos',
          muscleGroups: 'Posterior de Coxa e Glúteos',
          groups: ['posterior_coxa', 'gluteos'],
          warmup: '6 min de caminhada inclinada + ativação de glúteo médio.',
        },
        {
          title: 'Superiores (Peito, Costas) & Abdômen',
          muscleGroups: 'Peito, Costas, Braços e Abdômen',
          groups: ['peito', 'costas', 'bracos', 'abdomen'],
          warmup: '5 min de mobilidade de ombros + 1 série leve no supino.',
        },
        {
          title: 'Inferiores Complementares & Conditioning',
          muscleGroups: 'Glúteos, Pernas e Abdômen',
          groups: ['gluteos', 'pernas', 'abdomen'],
          warmup: '6 min de aquecimento leve + mobilidade 90/90.',
        },
      ],
    };
  }

  // 6 dias (Seg a Sáb com recuperação alternada entre grupos)
  return {
    activeDays: [0, 1, 2, 3, 4, 5],
    sessions: [
      {
        title: 'Quadríceps & Core',
        muscleGroups: 'Quadríceps, Panturrilhas e Abdômen',
        groups: ['quadriceps', 'panturrilhas', 'abdomen'],
        warmup: '6 min de bike + mobilidade de quadril e tornozelo.',
      },
      {
        title: 'Costas & Bíceps',
        muscleGroups: 'Costas e Braços',
        groups: ['costas', 'bracos'],
        warmup: '5 min de rotação torácica + puxada leve de aquecimento.',
      },
      {
        title: 'Glúteos & Posterior de Coxa',
        muscleGroups: 'Glúteos e Posterior de Coxa',
        groups: ['gluteos', 'posterior_coxa'],
        warmup: '6 min de esteira leve + ativação de glúteos.',
      },
      {
        title: 'Ombros, Peito & Tríceps',
        muscleGroups: 'Ombros, Peito e Braços',
        groups: ['ombros', 'peito', 'bracos'],
        warmup: '5 min de aquecimento de manguito e ombros.',
      },
      {
        title: 'Pernas Completo & Conditioning',
        muscleGroups: 'Pernas, Glúteos e Panturrilhas',
        groups: ['pernas', 'gluteos', 'panturrilhas'],
        warmup: '6 min de aquecimento cardiovascular progressivo.',
      },
      {
        title: 'Superiores Leve, Abdômen & Mobilidade',
        muscleGroups: 'Costas, Abdômen e Mobilidade',
        groups: ['costas', 'abdomen', 'gluteos'],
        warmup: '5 min de respiração e alongamento dinâmico.',
      },
    ],
  };
}

export function generateWeeklySchedule(profile: DriverProfile): WorkoutDay[] {
  const maxByMinutes: Record<30 | 45 | 60 | 90, number> = {
    30: 3,
    45: 4,
    60: 5,
    90: 6,
  };
  const maxExercises = maxByMinutes[profile.sessionMinutes] ?? 5;
  const { activeDays, sessions } = getSplitBlueprints(profile);

  const sessionCodes = ['FP1', 'FP2', 'Q1', 'Q2', 'SPRINT', 'RACE DAY'];
  let cursor = 0;

  return WEEK_DAYS.map((wd, dayIndex) => {
    const isTraining = activeDays.includes(dayIndex);
    if (!isTraining) {
      return {
        dayIndex,
        dayName: wd.dayName,
        shortDay: wd.shortDay,
        sessionCode: 'PIT STOP',
        title: 'Recuperação Muscular & Mobilidade Leve',
        muscleGroups: 'Recuperação ativa, hidratação e sono',
        isRestDay: true,
        estimatedMinutes: 20,
        warmupNote: 'Respiração tranquila, caminhada leve e zero cobrança de carga.',
        exercises: selectExercisesForGroups(['gluteos', 'costas', 'abdomen'], profile, 3),
      };
    }

    const bp = sessions[cursor % sessions.length];
    const code = sessionCodes[cursor % sessionCodes.length];
    cursor += 1;

    return {
      dayIndex,
      dayName: wd.dayName,
      shortDay: wd.shortDay,
      sessionCode: code,
      title: bp.title,
      muscleGroups: bp.muscleGroups,
      isRestDay: false,
      estimatedMinutes: profile.sessionMinutes,
      warmupNote: bp.warmup,
      exercises: selectExercisesForGroups(bp.groups, profile, maxExercises),
    };
  });
}

export function getNauhanExerciseCompletionRadio(
  exercise: WorkoutExercise,
  driverName: string,
  completedCount: number,
  totalCount: number,
  dateStr: string = new Date().toISOString().slice(0, 10)
): {
  tag: string;
  headline: string;
  message: string;
  groupLabel: string;
} {
  const name = driverName.trim() || 'Rebeca';
  const groupTip = getDailyMuscleTip(exercise.muscleTipGroup, dateStr);
  const groupLabel = MUSCLE_GROUP_LABELS[exercise.muscleTipGroup];

  if (completedCount >= totalCount) {
    return {
      tag: 'CHECKERED FLAG · TREINO CONCLUÍDO',
      headline: `Você fechou todos os ${totalCount} exercícios de hoje, ${name}!`,
      message: `${groupTip.text} E o melhor: treino 100% encerrado! Agora descansa e aproveita o resto do dia porque você mandou bem demais.`,
      groupLabel,
    };
  }

  if (completedCount === 1) {
    return {
      tag: `SETOR 1 CONCLUÍDO · 1/${totalCount}`,
      headline: `Largada perfeita em ${exercise.name}`,
      message: `${groupTip.text} Continua nesse ritmo, ${name}!`,
      groupLabel,
    };
  }

  return {
    tag: `DICA DO NAUHAN · ${completedCount}/${totalCount} CONCLUÍDOS`,
    headline: `${exercise.name} concluído`,
    message: groupTip.text,
    groupLabel,
  };
}

export function getNauhanEvolutionDebrief(
  profile: DriverProfile,
  sessions: LoggedSession[],
  completedDaysCount: number
): { headline: string; body: string } {
  const name = profile.name.trim() || 'Rebeca';
  const totalPrs = sessions.reduce((acc, s) => acc + s.newPrExercises.length, 0);
  const totalVolume = sessions.reduce((acc, s) => acc + s.totalVolumeKg, 0);

  if (sessions.length === 0 && completedDaysCount === 0) {
    return {
      headline: 'Aguardando os primeiros dados de pista',
      body: `${name}, assim que você marcar os exercícios no Meu Treino ou registrar suas cargas, sua evolução aparece aqui. Vai no seu ritmo e cuida bem de você.`,
    };
  }

  if (totalPrs >= 2) {
    return {
      headline: `${totalPrs} Best Laps registradas na temporada`,
      body: `Já são ${totalVolume.toLocaleString('pt-BR')} kg movimentados e ${totalPrs} recordes pessoais batidos. Você evoluindo com consistência desse jeito é bom demais de acompanhar, ${name}.`,
    };
  }

  return {
    headline: `Consistência em construção (${sessions.length + completedDaysCount} registros)`,
    body: `Cada treino fechado é uma volta limpa cuidando da sua saúde e da sua força. Continua firme que a evolução vem naturalmente — e eu sigo na primeira fila torcendo por você.`,
  };
}
