export enum FitnessGoal {
  EMAGRECER = 'emagrecer',
  MANTER = 'manter',
  MASSA_MUSCULAR = 'massa_muscular',
  FICAR_GOSTOSA = 'ficar_gostosa',
}

export enum ExperienceLevel {
  NUNCA_TREINEI = 'nunca_treinei',
  INICIANTE = 'iniciante',
  INTERMEDIARIO = 'intermediario',
  EXPERIENTE = 'experiente',
}

export type FocusRegion =
  | 'gluteos'
  | 'pernas'
  | 'quadriceps'
  | 'posterior_coxa'
  | 'costas'
  | 'bracos'
  | 'ombros'
  | 'abdomen'
  | 'corpo_inteiro';

export type MuscleTipGroup =
  | 'costas'
  | 'bracos'
  | 'gluteos'
  | 'pernas'
  | 'abdomen'
  | 'ombros'
  | 'quadriceps'
  | 'posterior_coxa'
  | 'panturrilhas'
  | 'peito';

export enum AppStage {
  STARTING_GRID = 'starting_grid',
  AUTH = 'auth',
  GOAL_SELECTION = 'goal_selection',
  QUESTIONNAIRE = 'questionnaire',
  DASHBOARD = 'dashboard',
}

export enum NavSection {
  INICIO = 'inicio',
  MEU_TREINO = 'meu_treino',
  CALENDARIO = 'calendario',
  MINHA_EVOLUCAO = 'minha_evolucao',
  RECADOS_NAUHAN = 'recados_nauhan',
  MEU_PERFIL = 'meu_perfil',
  GARAGEM_3D = 'garagem_3d',
}

export enum CameraPreset {
  HERO = 'hero',
  FRONT_WING = 'front_wing',
  COCKPIT = 'cockpit',
  SIDEPOD = 'sidepod',
  OVERHEAD = 'overhead',
}

export enum LiveryMode {
  SILVER_ARROW = 'silver_arrow',
  OBSIDIAN_CARBON = 'obsidian_carbon',
  TURQUOISE_EDITION = 'turquoise_edition',
}

export enum TireCompound {
  QUALIFYING_TURQUOISE = 'qualifying_turquoise',
  SOFT = 'soft',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export type ExerciseIllustrationKey =
  | 'hip_thrust'
  | 'bulgarian_squat'
  | 'stiff_rdl'
  | 'abductor_machine'
  | 'cable_kickback'
  | 'barbell_squat'
  | 'leg_press'
  | 'leg_extension'
  | 'leg_curl'
  | 'calf_raise'
  | 'lat_pulldown'
  | 'seated_row'
  | 'shoulder_press'
  | 'lateral_raise'
  | 'face_pull'
  | 'incline_bench'
  | 'triceps_rope'
  | 'biceps_curl'
  | 'plank'
  | 'hiit_cardio'
  | 'kettlebell_swing'
  | 'walking_lunge'
  | 'leg_raise_abs'
  | 'hip_90_90'
  | 'thoracic_rotation'
  | 'dead_bug';

export interface GoalOption {
  id: FitnessGoal;
  code: string;
  title: string;
  emoji: string;
  description: string;
  nauhanComment: string;
  imageUrl: string;
}

export interface DriverProfile {
  name: string;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg?: number;
  goal: FitnessGoal;
  experience: ExperienceLevel;
  daysPerWeek: 2 | 3 | 4 | 5 | 6;
  sessionMinutes: 30 | 45 | 60 | 90;
  focusRegions: FocusRegion[];
  dislikedExercises: string;
  injuries: string;
  physicalLimitations: string;
  avoidExercises: string;
  professionalGuidance: string;
  createdAt: string;
}

export interface CalculatedMetrics {
  bmi: number;
  bmiClassification: string;
  bmrKcal: number;
  tdeeKcal: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  waterLiters: number;
}

export interface WorkoutExercise {
  id: string;
  orderIndex: number;
  illustrationKey: ExerciseIllustrationKey;
  muscleTipGroup: MuscleTipGroup;
  name: string;
  mainMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  sets: number;
  reps: string;
  restSeconds: number;
  instructions: string;
  commonMistakes: string;
}

export interface WorkoutDay {
  dayIndex: number; // 0 = Segunda .. 6 = Domingo
  dayName: string;
  shortDay: string;
  sessionCode: string; // GRID / RACE DAY / PIT STOP
  title: string;
  muscleGroups: string;
  isRestDay: boolean;
  estimatedMinutes: number;
  warmupNote: string;
  exercises: WorkoutExercise[];
}

export interface LoggedExerciseSet {
  exerciseName: string;
  weightKg: number;
  reps: number;
  setsCompleted: number;
}

export interface LoggedSession {
  id: string;
  date: string;
  dayTitle: string;
  durationMinutes: number;
  rpe: number;
  notes: string;
  sets: LoggedExerciseSet[];
  totalVolumeKg: number;
  newPrExercises: string[];
}

export interface BodyCheckpoint {
  id: string;
  date: string;
  weightKg: number;
  waistCm?: number;
  hipCm?: number;
  thighCm?: number;
  armCm?: number;
  photoDataUrl?: string;
  note?: string;
}

export type DailyMoodId =
  | 'maravilhosa'
  | 'cansada'
  | 'sem_motivacao'
  | 'cheia_energia'
  | 'preciso_descansar';

export interface DailyCheckinEntry {
  date: string; // YYYY-MM-DD
  mood: DailyMoodId;
  energyLabel: string;
  nauhanReply: string;
  notes?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface UserAppData {
  profile: DriverProfile | null;
  completedExerciseIdsByDay: Record<string, string[]>; // key: "weekKey_d0"
  completedDayKeys: string[]; // key: "weekKey_d0"
  loggedSessions: LoggedSession[];
  checkpoints: BodyCheckpoint[];
  checkinsByDate: Record<string, DailyCheckinEntry>;
}
