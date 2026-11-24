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
const LOCAL_FALLBACK_USERS_KEY = 'rr_fallback_users_v1';
const LOCAL_FALLBACK_DATA_KEY = 'rr_fallback_data_v1';

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

const memoryFallbackMap = new Map<string, string>();

function safeStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
  } catch {
    return memoryFallbackMap.get(key) ?? null;
  }
}

function safeStorageSet(key: string, value: string): void {
  memoryFallbackMap.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Fallback para Safari privado / webviews com localStorage restrito
  }
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignora erro caso sessionStorage esteja indisponível
  }
}

function safeStorageRemove(key: string): void {
  memoryFallbackMap.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignora
  }
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignora
  }
}

function generateSafeId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${rand}`;
}

function getRandomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return toHex(bytes);
}

// Pure-JS SHA-256 fallback exclusively for non-HTTPS LAN testing where crypto.subtle is unavailable
function sha256HexFallback(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);
  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const bitLen = bytes.length * 8;
  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 4, bitLen >>> 0, false);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);

  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  const w = new Uint32Array(64);
  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }
  return Array.from(H)
    .map((v) => v.toString(16).padStart(8, '0'))
    .join('');
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
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

async function hashPassword(
  password: string,
  saltHex?: string
): Promise<{ saltHex: string; hashHex: string }> {
  const actualSaltHex = saltHex ?? getRandomHex(16);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const saltBytes = new Uint8Array(
      actualSaltHex.match(/.{1,2}/g)!.map((h) => parseInt(h, 16))
    );
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
      saltHex: actualSaltHex,
      hashHex: toHex(derived),
    };
  }

  // Fallback seguro para contextos HTTP locais no celular (sem crypto.subtle)
  let acc = `${actualSaltHex}:${password}`;
  for (let i = 0; i < 64; i++) {
    acc = sha256HexFallback(`${acc}:${actualSaltHex}`);
  }
  return {
    saltHex: actualSaltHex,
    hashHex: `js_${acc}`,
  };
}

function readLocalStoreMap<T>(storageKey: string): Record<string, T> {
  try {
    const raw = safeStorageGet(storageKey);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, T>;
  } catch {
    return {};
  }
}

function writeLocalStoreMap<T>(storageKey: string, map: Record<string, T>): void {
  try {
    safeStorageSet(storageKey, JSON.stringify(map));
  } catch {
    // Ignora erro de quota
  }
}

async function idbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  try {
    const db = await openIdb();
    const res = await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
    if (res !== undefined) return res;
  } catch {
    // Fallback para storage caso IndexedDB esteja bloqueado no mobile
  }

  const fallbackKey =
    storeName === STORE_USERS ? LOCAL_FALLBACK_USERS_KEY : LOCAL_FALLBACK_DATA_KEY;
  const map = readLocalStoreMap<T>(fallbackKey);
  return map[key];
}

async function idbPut<T extends Record<string, unknown>>(
  storeName: string,
  value: T
): Promise<void> {
  const keyField = storeName === STORE_USERS ? 'email' : 'userId';
  const keyVal = String(value[keyField] ?? '');
  const fallbackKey =
    storeName === STORE_USERS ? LOCAL_FALLBACK_USERS_KEY : LOCAL_FALLBACK_DATA_KEY;

  if (keyVal) {
    const map = readLocalStoreMap<T>(fallbackKey);
    map[keyVal] = value;
    writeLocalStoreMap(fallbackKey, map);
  }

  try {
    const db = await openIdb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Já salvo no fallback map acima
  }
}

function translateSupabaseAuthError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('email not confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou spam.';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (msg.includes('user already registered')) {
    return 'Já existe uma conta cadastrada com este e-mail.';
  }
  if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('fetch')) {
    return 'Falha de conexão com o servidor. Verifique sua internet e tente novamente.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Muitas tentativas seguidas. Aguarde alguns instantes e tente novamente.';
  }
  return message || 'Não foi possível concluir a autenticação.';
}

export async function getCurrentSessionUser(): Promise<AuthUser | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session?.user) return null;
      const u = data.session.user;
      return {
        id: u.id,
        email: u.email ?? '',
        name: (u.user_metadata?.name as string | undefined) ?? undefined,
      };
    } catch {
      return null;
    }
  }

  try {
    const raw = safeStorageGet(SESSION_KEY);
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

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { user: null, error: 'Informe um e-mail válido.' };
  }
  if (password.length < 6) {
    return { user: null, error: 'A senha precisa ter pelo menos 6 caracteres.' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { name: cleanName } },
      });
      if (error) {
        return { user: null, error: translateSupabaseAuthError(error.message) };
      }
      if (!data.session && data.user) {
        return {
          user: null,
          error: null,
          info: 'Conta criada! Confirme o link enviado ao seu e-mail antes de entrar.',
        };
      }
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
    } catch {
      return {
        user: null,
        error: 'Erro de conexão ao criar conta. Verifique sua internet e tente novamente.',
      };
    }
  }

  const existing = await idbGet<StoredUserRecord>(STORE_USERS, cleanEmail);
  if (existing) {
    return { user: null, error: 'Já existe uma conta cadastrada com este e-mail.' };
  }

  const { saltHex, hashHex } = await hashPassword(password);
  const newId = generateSafeId('usr');
  const record: StoredUserRecord = {
    id: newId,
    email: cleanEmail,
    name: cleanName,
    saltHex,
    passwordHashHex: hashHex,
    createdAt: new Date().toISOString(),
  };
  await idbPut(STORE_USERS, record as unknown as Record<string, unknown>);
  await idbPut(STORE_DATA, { userId: newId, ...EMPTY_USER_DATA } as unknown as Record<string, unknown>);

  const authUser: AuthUser = { id: newId, email: cleanEmail, name: cleanName };
  safeStorageSet(SESSION_KEY, JSON.stringify(authUser));
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { user: null, error: 'Informe um e-mail válido.' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) {
        return { user: null, error: translateSupabaseAuthError(error.message) };
      }
      if (!data.user) {
        return { user: null, error: 'Sessão não retornada. Tente novamente.' };
      }
      return {
        user: {
          id: data.user.id,
          email: data.user.email ?? cleanEmail,
          name: (data.user.user_metadata?.name as string | undefined) ?? undefined,
        },
        error: null,
      };
    } catch {
      return {
        user: null,
        error: 'Erro de conexão ao tentar entrar. Verifique sua internet e tente novamente.',
      };
    }
  }

  const record = await idbGet<StoredUserRecord>(STORE_USERS, cleanEmail);
  if (!record) {
    return {
      user: null,
      error:
        'Conta não encontrada neste navegador. Se o Supabase ainda não estiver conectado, crie seu cadastro na aba "Criar Conta".',
    };
  }

  const { hashHex } = await hashPassword(password, record.saltHex);
  if (hashHex !== record.passwordHashHex) {
    return { user: null, error: 'E-mail ou senha incorretos. Tente novamente.' };
  }

  const authUser: AuthUser = { id: record.id, email: record.email, name: record.name };
  safeStorageSet(SESSION_KEY, JSON.stringify(authUser));
  return { user: authUser, error: null };
}

export async function requestPasswordReset(
  email: string
): Promise<{ ok: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { ok: false, message: 'Informe um e-mail válido para recuperação.' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin,
      });
      if (error) return { ok: false, message: translateSupabaseAuthError(error.message) };
      return {
        ok: true,
        message: 'Link de redefinição enviado para o seu e-mail via Supabase Auth.',
      };
    } catch {
      return {
        ok: false,
        message: 'Erro de conexão ao solicitar redefinição. Tente novamente.',
      };
    }
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
      'No ambiente conectado ao Supabase, você receberá o link oficial de redefinição por e-mail. No modo local, crie uma nova conta ou entre com sua senha atual.',
  };
}

export async function signOutUser(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Continua limpando sessão local
    }
  }
  safeStorageRemove(SESSION_KEY);
}

export async function loadUserAppData(userId: string): Promise<UserAppData> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
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
    } catch {
      return { ...EMPTY_USER_DATA };
    }
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

  await idbPut(STORE_DATA, { userId, ...nextData } as unknown as Record<string, unknown>);
  return nextData;
}

export async function persistFullUserData(
  userId: string,
  data: UserAppData
): Promise<void> {
  if (!isSupabaseConfigured) {
    await idbPut(STORE_DATA, { userId, ...data } as unknown as Record<string, unknown>);
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
