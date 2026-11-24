import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import {
  AuthUser,
  BodyCheckpoint,
  DailyCheckinEntry,
  DriverProfile,
  LoggedSession,
  UserAppData,
  WorkoutDay,
} from '../types/racing';

const IDB_NAME = 'rebeca_racing_idb';
const IDB_VERSION = 1;
const STORE_USERS = 'users';
const STORE_DATA = 'user_data';
const SESSION_KEY = 'rr_active_session_user';

const EMPTY_USER_DATA: UserAppData = {
  profile: null,
  completedExerciseIdsByDay: {},
  completedDayKeys: [],
  loggedSessions: [],
  checkpoints: [],
  checkinsByDate: {},
};

interface StoredUserRecord {
  id: string;
  email: string;
  name: string;
  saltHex: string;
  passwordHashHex: string;
  createdAt: string;
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_USERS)) {
        const usersStore = db.createObjectStore(STORE_USERS, { keyPath: 'email' });
        usersStore.createIndex('id', 'id', { unique: true });
      }
      if (!db.objectStoreNames.contains(STORE_DATA)) {
        db.createObjectStore(STORE_DATA, { keyPath: 'userId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPassword(password: string, saltHex?: string): Promise<{ saltHex: string; hashHex: string }> {
  const saltBytes = saltHex
    ? new Uint8Array(saltHex.match(/.{1,2}/g)!.map((h) => parseInt(h, 16)))
    : crypto.getRandomValues(new Uint8Array(16));

  const enc = new TextEncoder();
  const keyMat = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMat,
    256
  );
  return {
    saltHex: toHex(saltBytes),
    hashHex: toHex(derived),
  };
}

async function idbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut<T>(storeName: string, value: T): Promise<void> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getCurrentSessionUser(): Promise<AuthUser | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) return null;
    const u = data.session.user;
    return {
      id: u.id,
      email: u.email ?? '',
      name: (u.user_metadata?.name as string | undefined) ?? undefined,
    };
  }

  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<{ user: AuthUser | null; error: string | null; info?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim() || 'Rebeca';

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { user: null, error: 'Informe um e-mail válido.' };
  }
  if (password.length < 6) {
    return { user: null, error: 'A senha precisa ter pelo menos 6 caracteres.' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { name: cleanName } },
    });
    if (error) return { user: null, error: error.message };
    if (!data.user) {
      return {
        user: null,
        error: null,
        info: 'Cadastro criado! Verifique seu e-mail para confirmar a conta.',
      };
    }
    return {
      user: { id: data.user.id, email: data.user.email ?? cleanEmail, name: cleanName },
      error: null,
    };
  }

  const existing = await idbGet<StoredUserRecord>(STORE_USERS, cleanEmail);
  if (existing) {
    return { user: null, error: 'Já existe uma conta cadastrada com este e-mail.' };
  }

  const { saltHex, hashHex } = await hashPassword(password);
  const newId = crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`;
  const record: StoredUserRecord = {
    id: newId,
    email: cleanEmail,
    name: cleanName,
    saltHex,
    passwordHashHex: hashHex,
    createdAt: new Date().toISOString(),
  };
  await idbPut(STORE_USERS, record);
  await idbPut(STORE_DATA, { userId: newId, ...EMPTY_USER_DATA });

  const authUser: AuthUser = { id: newId, email: cleanEmail, name: cleanName };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
  return { user: authUser, error: null };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) {
    return { user: null, error: 'Preencha e-mail e senha.' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error) return { user: null, error: 'E-mail ou senha inválidos.' };
    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? cleanEmail,
        name: (data.user.user_metadata?.name as string | undefined) ?? undefined,
      },
      error: null,
    };
  }

  const record = await idbGet<StoredUserRecord>(STORE_USERS, cleanEmail);
  if (!record) {
    return { user: null, error: 'Conta não encontrada. Crie seu cadastro abaixo.' };
  }
  const { hashHex } = await hashPassword(password, record.saltHex);
  if (hashHex !== record.passwordHashHex) {
    return { user: null, error: 'Senha incorreta. Tente novamente.' };
  }

  const authUser: AuthUser = { id: record.id, email: record.email, name: record.name };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
  return { user: authUser, error: null };
}

export async function requestPasswordReset(
  email: string
): Promise<{ ok: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, message: 'Informe um e-mail válido para recuperação.' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin,
    });
    if (error) return { ok: false, message: error.message };
    return {
      ok: true,
      message: 'Link de redefinição enviado para o seu e-mail via Supabase Auth.',
    };
  }

  const record = await idbGet<StoredUserRecord>(STORE_USERS, cleanEmail);
  if (!record) {
    return {
      ok: false,
      message: 'Nenhuma conta encontrada para esse e-mail neste navegador.',
    };
  }
  return {
    ok: true,
    message:
      'No ambiente conectado ao Supabase, você receberá o link oficial de redefinição por e-mail. Enquanto estiver no preview local, você pode criar uma nova conta ou entrar com sua senha atual.',
  };
}

export async function signOutUser(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  sessionStorage.removeItem(SESSION_KEY);
}

export async function loadUserAppData(userId: string): Promise<UserAppData> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const [profileRes, completionsRes, progressRes, checkinsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('exercise_completions').select('*').eq('user_id', userId),
      supabase
        .from('progress_history')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_date', { ascending: false }),
      supabase.from('daily_checkins').select('*').eq('user_id', userId),
    ]);

    let profile: DriverProfile | null = null;
    if (profileRes.data) {
      const p = profileRes.data;
      profile = {
        name: p.name,
        age: p.age,
        heightCm: p.height_cm,
        currentWeightKg: Number(p.current_weight_kg),
        targetWeightKg: p.target_weight_kg ? Number(p.target_weight_kg) : undefined,
        goal: p.goal,
        experience: p.experience,
        daysPerWeek: p.days_per_week,
        sessionMinutes: p.session_minutes,
        focusRegions: p.focus_regions ?? [],
        dislikedExercises: p.disliked_exercises ?? '',
        injuries: p.injuries ?? '',
        physicalLimitations: p.physical_limitations ?? '',
        avoidExercises: p.avoid_exercises ?? '',
        professionalGuidance: p.professional_guidance ?? '',
        createdAt: p.created_at,
      };
    }

    const completedExerciseIdsByDay: Record<string, string[]> = {};
    const completedDayKeysSet = new Set<string>();
    (completionsRes.data ?? []).forEach((row) => {
      const dayKey = `${row.week_key}_d${row.day_index}`;
      if (row.exercise_id === '__DAY_DONE__') {
        completedDayKeysSet.add(dayKey);
      } else {
        if (!completedExerciseIdsByDay[dayKey]) completedExerciseIdsByDay[dayKey] = [];
        completedExerciseIdsByDay[dayKey].push(row.exercise_id);
      }
    });

    const loggedSessions: LoggedSession[] = [];
    const checkpoints: BodyCheckpoint[] = [];
    (progressRes.data ?? []).forEach((row) => {
      if (row.entry_type === 'session') {
        loggedSessions.push({
          id: row.id,
          date: row.recorded_date,
          dayTitle: row.session_title ?? 'Treino',
          durationMinutes: row.duration_minutes ?? 60,
          rpe: Number(row.rpe ?? 8),
          notes: row.notes ?? '',
          sets: Array.isArray(row.sets_payload) ? row.sets_payload : [],
          totalVolumeKg: row.total_volume_kg ?? 0,
          newPrExercises: row.pr_exercises ?? [],
        });
      } else {
        checkpoints.push({
          id: row.id,
          date: row.recorded_date,
          weightKg: Number(row.weight_kg ?? 0),
          waistCm: row.waist_cm ? Number(row.waist_cm) : undefined,
          hipCm: row.hip_cm ? Number(row.hip_cm) : undefined,
          thighCm: row.thigh_cm ? Number(row.thigh_cm) : undefined,
          armCm: row.arm_cm ? Number(row.arm_cm) : undefined,
          photoDataUrl: row.photo_url ?? undefined,
          note: row.notes ?? undefined,
        });
      }
    });

    const checkinsByDate: Record<string, DailyCheckinEntry> = {};
    (checkinsRes.data ?? []).forEach((row) => {
      checkinsByDate[row.checkin_date] = {
        date: row.checkin_date,
        mood: row.mood,
        energyLabel: row.energy_label,
        nauhanReply: row.nauhan_reply,
        notes: row.notes ?? '',
      };
    });

    return {
      profile,
      completedExerciseIdsByDay,
      completedDayKeys: Array.from(completedDayKeysSet),
      loggedSessions,
      checkpoints: checkpoints.sort((a, b) => a.date.localeCompare(b.date)),
      checkinsByDate,
    };
  }

  const stored = await idbGet<UserAppData & { userId: string }>(STORE_DATA, userId);
  if (!stored) return { ...EMPTY_USER_DATA };
  return {
    profile: stored.profile ?? null,
    completedExerciseIdsByDay: stored.completedExerciseIdsByDay ?? {},
    completedDayKeys: stored.completedDayKeys ?? [],
    loggedSessions: stored.loggedSessions ?? [],
    checkpoints: stored.checkpoints ?? [],
    checkinsByDate: stored.checkinsByDate ?? {},
  };
}

export async function saveUserProfileAndPlan(
  userId: string,
  profile: DriverProfile,
  schedule: WorkoutDay[],
  currentData: UserAppData
): Promise<UserAppData> {
  const nextData: UserAppData = {
    ...currentData,
    profile,
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('profiles').upsert(
      {
        user_id: userId,
        name: profile.name,
        age: profile.age,
        height_cm: profile.heightCm,
        current_weight_kg: profile.currentWeightKg,
        target_weight_kg: profile.targetWeightKg ?? null,
        goal: profile.goal,
        experience: profile.experience,
        days_per_week: profile.daysPerWeek,
        session_minutes: profile.sessionMinutes,
        focus_regions: profile.focusRegions,
        disliked_exercises: profile.dislikedExercises,
        injuries: profile.injuries,
        physical_limitations: profile.physicalLimitations,
        avoid_exercises: profile.avoidExercises,
        professional_guidance: profile.professionalGuidance,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    // Archive older plans and persist active plan + days + exercises
    await supabase
      .from('workout_plans')
      .update({ status: 'archived' })
      .eq('user_id', userId)
      .eq('status', 'active');

    const { data: planRow } = await supabase
      .from('workout_plans')
      .insert({ user_id: userId, goal: profile.goal, status: 'active' })
      .select('id')
      .single();

    if (planRow?.id) {
      for (const day of schedule) {
        const { data: dayRow } = await supabase
          .from('workout_days')
          .insert({
            plan_id: planRow.id,
            user_id: userId,
            day_index: day.dayIndex,
            day_name: day.dayName,
            session_code: day.sessionCode,
            title: day.title,
            muscle_groups: day.muscleGroups,
            is_rest_day: day.isRestDay,
            warmup_note: day.warmupNote,
          })
          .select('id')
          .single();

        if (dayRow?.id && day.exercises.length > 0) {
          await supabase.from('exercises').insert(
            day.exercises.map((ex) => ({
              workout_day_id: dayRow.id,
              user_id: userId,
              order_index: ex.orderIndex,
              illustration_key: ex.illustrationKey,
              name: ex.name,
              main_muscle: ex.mainMuscle,
              secondary_muscles: ex.secondaryMuscles,
              equipment: ex.equipment,
              difficulty: ex.difficulty,
              sets: ex.sets,
              reps: ex.reps,
              rest_seconds: ex.restSeconds,
              instructions: ex.instructions,
              common_mistakes: ex.commonMistakes,
            }))
          );
        }
      }
    }
    return nextData;
  }

  await idbPut(STORE_DATA, { userId, ...nextData });
  return nextData;
}

export async function persistFullUserData(
  userId: string,
  data: UserAppData
): Promise<void> {
  if (!isSupabaseConfigured) {
    await idbPut(STORE_DATA, { userId, ...data });
  }
}

export async function syncExerciseCompletion(
  userId: string,
  weekKey: string,
  dayIndex: number,
  exerciseId: string,
  exerciseName: string,
  completed: boolean
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  if (completed) {
    await supabase.from('exercise_completions').upsert(
      {
        user_id: userId,
        week_key: weekKey,
        day_index: dayIndex,
        exercise_id: exerciseId,
        exercise_name: exerciseName,
        completed_date: new Date().toISOString().slice(0, 10),
      },
      { onConflict: 'user_id,week_key,day_index,exercise_id' }
    );
  } else {
    await supabase
      .from('exercise_completions')
      .delete()
      .eq('user_id', userId)
      .eq('week_key', weekKey)
      .eq('day_index', dayIndex)
      .eq('exercise_id', exerciseId);
  }
}

export async function syncLoggedSession(
  userId: string,
  session: LoggedSession
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  await supabase.from('progress_history').insert({
    id: session.id,
    user_id: userId,
    entry_type: 'session',
    recorded_date: session.date,
    session_title: session.dayTitle,
    duration_minutes: session.durationMinutes,
    rpe: session.rpe,
    total_volume_kg: session.totalVolumeKg,
    sets_payload: session.sets,
    pr_exercises: session.newPrExercises,
    notes: session.notes,
  });
}

export async function syncCheckpoint(
  userId: string,
  cp: BodyCheckpoint
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  await supabase.from('progress_history').insert({
    id: cp.id,
    user_id: userId,
    entry_type: 'checkpoint',
    recorded_date: cp.date,
    weight_kg: cp.weightKg,
    waist_cm: cp.waistCm ?? null,
    hip_cm: cp.hipCm ?? null,
    thigh_cm: cp.thighCm ?? null,
    arm_cm: cp.armCm ?? null,
    photo_url: cp.photoDataUrl ?? null,
    notes: cp.note ?? '',
  });
}

export async function deleteProgressEntry(
  userId: string,
  entryId: string
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase
    .from('progress_history')
    .delete()
    .eq('user_id', userId)
    .eq('id', entryId);
}

export async function syncDailyCheckin(
  userId: string,
  entry: DailyCheckinEntry
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  await supabase.from('daily_checkins').upsert(
    {
      user_id: userId,
      checkin_date: entry.date,
      mood: entry.mood,
      energy_label: entry.energyLabel,
      nauhan_reply: entry.nauhanReply,
      notes: entry.notes ?? '',
    },
    { onConflict: 'user_id,checkin_date' }
  );
}

export async function syncDailyMessageLog(
  userId: string,
  messageDate: string,
  messageIndex: number,
  messageText: string
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  await supabase.from('daily_messages').upsert(
    {
      user_id: userId,
      message_date: messageDate,
      message_index: messageIndex,
      message_text: messageText,
    },
    { onConflict: 'user_id,message_date' }
  );
}
