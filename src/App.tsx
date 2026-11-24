import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthView } from './components/AuthView';
import { CalendarView } from './components/CalendarView';
import { CockpitDashboard } from './components/CockpitDashboard';
import { EvolutionView } from './components/EvolutionView';
import { Garage3DView } from './components/Garage3DView';
import { GoalSelection } from './components/GoalSelection';
import { getWeekKeyPrefix, MyWorkoutView } from './components/MyWorkoutView';
import { NauhanMessagesView } from './components/NauhanMessagesView';
import { ProfileView } from './components/ProfileView';
import { QuestionnaireWizard } from './components/QuestionnaireWizard';
import { StartingGrid } from './components/StartingGrid';
import { TopBar } from './components/TopBar';
import {
  DAILY_CHECKIN_OPTIONS,
  getDailyNauhanMessage,
} from './data/nauhanMessages';
import { generateWeeklySchedule } from './engine/workoutPlanner';
import { getSupabaseClient } from './lib/supabase';
import {
  deleteProgressEntry,
  getCurrentSessionUser,
  loadUserAppData,
  persistFullUserData,
  saveUserProfileAndPlan,
  signOutUser,
  syncCheckpoint,
  syncDailyCheckin,
  syncDailyMessageLog,
  syncExerciseCompletion,
  syncLoggedSession,
} from './services/database';
import {
  AppStage,
  AuthUser,
  BodyCheckpoint,
  DailyCheckinEntry,
  DailyMoodId,
  DriverProfile,
  FitnessGoal,
  LoggedSession,
  NavSection,
  UserAppData,
  WorkoutDay,
} from './types/racing';

const EMPTY_DATA: UserAppData = {
  profile: null,
  completedExerciseIdsByDay: {},
  completedDayKeys: [],
  loggedSessions: [],
  checkpoints: [],
  checkinsByDate: {},
};

function getTodayDayIndex(): number {
  const jsDay = new Date().getDay(); // 0=Sun..6=Sat
  return jsDay === 0 ? 6 : jsDay - 1;
}

export default function App() {
  const [stage, setStage] = useState<AppStage>(AppStage.STARTING_GRID);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [userData, setUserData] = useState<UserAppData>(EMPTY_DATA);
  const [booting, setBooting] = useState<boolean>(true);

  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal | null>(null);
  const [activeSection, setActiveSection] = useState<NavSection>(NavSection.INICIO);
  const [selectedWorkoutDayIdx, setSelectedWorkoutDayIdx] = useState<number>(
    getTodayDayIndex
  );
  const [evolutionSubTab, setEvolutionSubTab] = useState<'diario' | 'cargas'>('diario');
  const [loggerPreselectedDay, setLoggerPreselectedDay] = useState<WorkoutDay | null>(
    null
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const weekKey = useMemo(() => getWeekKeyPrefix(), []);
  const todayDayIndex = useMemo(() => getTodayDayIndex(), []);

  const hydrateForUser = useCallback(
    async (user: AuthUser, moveAfterLoad: boolean) => {
      let loaded = EMPTY_DATA;
      try {
        loaded = await loadUserAppData(user.id);
      } catch {
        loaded = EMPTY_DATA;
      }

      setAuthUser(user);
      setUserData(loaded);
      setSelectedGoal(loaded.profile?.goal ?? null);

      const daily = getDailyNauhanMessage(todayStr);
      void syncDailyMessageLog(user.id, todayStr, daily.index, daily.text).catch(() => {});

      if (moveAfterLoad) {
        try {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        } catch {
          // Ignora erro de blur em WebViews mobile
        }
        if (loaded.profile) {
          setStage(AppStage.DASHBOARD);
          setActiveSection(NavSection.INICIO);
        } else {
          setStage(AppStage.GOAL_SELECTION);
        }
        try {
          window.scrollTo(0, 0);
        } catch {
          // Ignora erro de scrollTo
        }
      }
    },
    [todayStr]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const sessionUser = await getCurrentSessionUser();
        if (active && sessionUser) {
          await hydrateForUser(sessionUser, false);
        }
      } finally {
        if (active) setBooting(false);
      }
    })();

    const supabase = getSupabaseClient();
    const subscription = supabase?.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setAuthUser(null);
        setUserData(EMPTY_DATA);
      } else if (event === 'SIGNED_IN' && session?.user) {
        setAuthUser((prev) =>
          prev ?? {
            id: session.user.id,
            email: session.user.email ?? '',
            name: (session.user.user_metadata?.name as string | undefined) ?? undefined,
          }
        );
      }
    });

    return () => {
      active = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, [hydrateForUser]);

  const schedule = useMemo(() => {
    if (!userData.profile) return [];
    return generateWeeklySchedule(userData.profile);
  }, [userData.profile]);

  const handleStartJourney = () => {
    if (!authUser) {
      setStage(AppStage.AUTH);
    } else if (userData.profile) {
      setStage(AppStage.DASHBOARD);
      setActiveSection(NavSection.INICIO);
    } else {
      setStage(AppStage.GOAL_SELECTION);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResumeDashboard = () => {
    if (!authUser) {
      setStage(AppStage.AUTH);
      return;
    }
    if (!userData.profile) {
      setStage(AppStage.GOAL_SELECTION);
      return;
    }
    setStage(AppStage.DASHBOARD);
    setActiveSection(NavSection.INICIO);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthenticated = async (user: AuthUser) => {
    await hydrateForUser(user, true);
  };

  const handleSelectGoal = (goal: FitnessGoal) => {
    setSelectedGoal(goal);
    setStage(AppStage.QUESTIONNAIRE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteQuestionnaire = async (profile: DriverProfile) => {
    if (!authUser) return;
    const generatedSchedule = generateWeeklySchedule(profile);

    const hasBaseline = userData.checkpoints.length > 0;
    const initialCheckpoint: BodyCheckpoint | null = hasBaseline
      ? null
      : {
          id:
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID()
              : `cp-init-${Date.now()}`,
          date: todayStr,
          weightKg: profile.currentWeightKg,
          note: 'Largada oficial da temporada',
        };

    const baseData: UserAppData = {
      ...userData,
      checkpoints: initialCheckpoint
        ? [initialCheckpoint]
        : userData.checkpoints,
    };

    const saved = await saveUserProfileAndPlan(
      authUser.id,
      profile,
      generatedSchedule,
      baseData
    );
    if (initialCheckpoint) {
      void syncCheckpoint(authUser.id, initialCheckpoint);
    }

    setUserData(saved);
    setStage(AppStage.DASHBOARD);
    setActiveSection(NavSection.INICIO);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleExercise = (
    dayKey: string,
    exerciseId: string,
    exerciseName: string
  ) => {
    if (!authUser) return;
    const current = userData.completedExerciseIdsByDay[dayKey] ?? [];
    const exists = current.includes(exerciseId);
    const updatedList = exists
      ? current.filter((id) => id !== exerciseId)
      : [...current, exerciseId];

    const nextData: UserAppData = {
      ...userData,
      completedExerciseIdsByDay: {
        ...userData.completedExerciseIdsByDay,
        [dayKey]: updatedList,
      },
    };
    setUserData(nextData);
    void persistFullUserData(authUser.id, nextData);

    const dayIdxStr = dayKey.split('_d')[1];
    const parsedDayIdx = Number(dayIdxStr);
    void syncExerciseCompletion(
      authUser.id,
      weekKey,
      Number.isNaN(parsedDayIdx) ? 0 : parsedDayIdx,
      exerciseId,
      exerciseName,
      !exists
    );
  };

  const handleToggleDayComplete = (dayKey: string, dayTitle: string) => {
    if (!authUser) return;
    const exists = userData.completedDayKeys.includes(dayKey);
    const updatedKeys = exists
      ? userData.completedDayKeys.filter((k) => k !== dayKey)
      : [...userData.completedDayKeys, dayKey];

    const nextData: UserAppData = {
      ...userData,
      completedDayKeys: updatedKeys,
    };
    setUserData(nextData);
    void persistFullUserData(authUser.id, nextData);

    const dayIdxStr = dayKey.split('_d')[1];
    const parsedDayIdx = Number(dayIdxStr);
    void syncExerciseCompletion(
      authUser.id,
      weekKey,
      Number.isNaN(parsedDayIdx) ? 0 : parsedDayIdx,
      '__DAY_DONE__',
      dayTitle,
      !exists
    );
  };

  const handleSaveSession = (session: LoggedSession) => {
    if (!authUser) return;
    const nextData: UserAppData = {
      ...userData,
      loggedSessions: [session, ...userData.loggedSessions],
    };
    setUserData(nextData);
    void persistFullUserData(authUser.id, nextData);
    void syncLoggedSession(authUser.id, session);
  };

  const handleDeleteSession = (id: string) => {
    if (!authUser) return;
    const nextData: UserAppData = {
      ...userData,
      loggedSessions: userData.loggedSessions.filter((s) => s.id !== id),
    };
    setUserData(nextData);
    void persistFullUserData(authUser.id, nextData);
    void deleteProgressEntry(authUser.id, id);
  };

  const handleAddCheckpoint = (cp: BodyCheckpoint) => {
    if (!authUser) return;
    const nextCheckpoints = [...userData.checkpoints, cp].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const nextData: UserAppData = {
      ...userData,
      checkpoints: nextCheckpoints,
    };
    setUserData(nextData);
    void persistFullUserData(authUser.id, nextData);
    void syncCheckpoint(authUser.id, cp);
  };

  const handleDeleteCheckpoint = (id: string) => {
    if (!authUser) return;
    const nextData: UserAppData = {
      ...userData,
      checkpoints: userData.checkpoints.filter((c) => c.id !== id),
    };
    setUserData(nextData);
    void persistFullUserData(authUser.id, nextData);
    void deleteProgressEntry(authUser.id, id);
  };

  const handleSaveCheckin = (mood: DailyMoodId) => {
    if (!authUser) return;
    const opt =
      DAILY_CHECKIN_OPTIONS.find((o) => o.id === mood) ?? DAILY_CHECKIN_OPTIONS[0];
    const entry: DailyCheckinEntry = {
      date: todayStr,
      mood: opt.id,
      energyLabel: opt.energyLabel,
      nauhanReply: opt.nauhanReply,
    };

    const nextData: UserAppData = {
      ...userData,
      checkinsByDate: {
        ...userData.checkinsByDate,
        [todayStr]: entry,
      },
    };
    setUserData(nextData);
    void persistFullUserData(authUser.id, nextData);
    void syncDailyCheckin(authUser.id, entry);
  };

  const handleSignOut = async () => {
    await signOutUser();
    setAuthUser(null);
    setUserData(EMPTY_DATA);
    setSelectedGoal(null);
    setStage(AppStage.STARTING_GRID);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateTo = (section: NavSection) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-[#080B0E] text-white flex items-center justify-center">
        <p className="font-mono-telemetry text-xs tracking-[0.22em] text-[#00D2BE] uppercase">
          REBECA RACING · PREPARANDO TELEMETRIA...
        </p>
      </div>
    );
  }

  // Stage 1: Starting Grid
  if (stage === AppStage.STARTING_GRID) {
    return (
      <StartingGrid
        hasSavedProfile={Boolean(authUser && userData.profile)}
        onStartJourney={handleStartJourney}
        onResumeDashboard={handleResumeDashboard}
      />
    );
  }

  // Auth Gate — no personal data accessible until logged in
  if (!authUser || stage === AppStage.AUTH) {
    return (
      <AuthView
        onAuthenticated={handleAuthenticated}
        onBackToGrid={() => setStage(AppStage.STARTING_GRID)}
      />
    );
  }

  // Stage 2: Goal Selection
  if (stage === AppStage.GOAL_SELECTION) {
    return (
      <GoalSelection
        selectedGoal={selectedGoal ?? userData.profile?.goal ?? null}
        onSelectGoal={handleSelectGoal}
        onBack={() =>
          setStage(userData.profile ? AppStage.DASHBOARD : AppStage.STARTING_GRID)
        }
      />
    );
  }

  // Stage 3: 5-Step Questionnaire
  if (stage === AppStage.QUESTIONNAIRE || !userData.profile) {
    return (
      <QuestionnaireWizard
        goal={selectedGoal ?? userData.profile?.goal ?? FitnessGoal.FICAR_GOSTOSA}
        initialProfile={userData.profile}
        defaultName={authUser.name ?? 'Rebeca'}
        onBackToGoals={() => setStage(AppStage.GOAL_SELECTION)}
        onComplete={handleCompleteQuestionnaire}
      />
    );
  }

  // Authenticated Cockpit Dashboard
  const todayCheckin = userData.checkinsByDate[todayStr] ?? null;

  return (
    <div className="min-h-screen bg-[#080B0E] text-white flex flex-col">
      <TopBar
        activeSection={activeSection}
        onSelectSection={navigateTo}
        onOpenGarage3D={() => navigateTo(NavSection.GARAGEM_3D)}
      />

      <main className="flex-1">
        {activeSection === NavSection.INICIO && (
          <CockpitDashboard
            profile={userData.profile}
            schedule={schedule}
            todayDayIndex={todayDayIndex}
            completedExerciseIdsByDay={userData.completedExerciseIdsByDay}
            completedDayKeys={userData.completedDayKeys}
            loggedSessions={userData.loggedSessions}
            todayCheckin={todayCheckin}
            onSaveCheckin={handleSaveCheckin}
            onOpenWorkoutDay={(dayIdx) => {
              setSelectedWorkoutDayIdx(dayIdx);
              navigateTo(NavSection.MEU_TREINO);
            }}
            onNavigate={navigateTo}
          />
        )}

        {activeSection === NavSection.MEU_TREINO && (
          <MyWorkoutView
            profile={userData.profile}
            schedule={schedule}
            selectedDayIdx={selectedWorkoutDayIdx}
            onSelectDayIdx={setSelectedWorkoutDayIdx}
            completedExerciseIds={userData.completedExerciseIdsByDay}
            completedDayKeys={userData.completedDayKeys}
            onToggleExercise={handleToggleExercise}
            onToggleDayComplete={handleToggleDayComplete}
            onOpenLoadLogger={(day) => {
              setLoggerPreselectedDay(day);
              setEvolutionSubTab('cargas');
              navigateTo(NavSection.MINHA_EVOLUCAO);
            }}
          />
        )}

        {activeSection === NavSection.CALENDARIO && (
          <CalendarView
            profile={userData.profile}
            schedule={schedule}
            todayDayIndex={todayDayIndex}
            completedDayKeys={userData.completedDayKeys}
            completedExerciseIdsByDay={userData.completedExerciseIdsByDay}
            onOpenWorkoutDay={(dayIdx) => {
              setSelectedWorkoutDayIdx(dayIdx);
              navigateTo(NavSection.MEU_TREINO);
            }}
          />
        )}

        {activeSection === NavSection.MINHA_EVOLUCAO && (
          <EvolutionView
            profile={userData.profile}
            schedule={schedule}
            preselectedDay={loggerPreselectedDay}
            initialSubTab={evolutionSubTab}
            sessions={userData.loggedSessions}
            checkpoints={userData.checkpoints}
            completedDaysCount={userData.completedDayKeys.length}
            onAddCheckpoint={handleAddCheckpoint}
            onDeleteCheckpoint={handleDeleteCheckpoint}
            onSaveSession={handleSaveSession}
            onDeleteSession={handleDeleteSession}
          />
        )}

        {activeSection === NavSection.RECADOS_NAUHAN && <NauhanMessagesView />}

        {activeSection === NavSection.MEU_PERFIL && (
          <ProfileView
            authUser={authUser}
            profile={userData.profile}
            onEditGoalAndQuestionnaire={() => {
              setSelectedGoal(userData.profile?.goal ?? null);
              setStage(AppStage.GOAL_SELECTION);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenGarage3D={() => navigateTo(NavSection.GARAGEM_3D)}
            onSignOut={handleSignOut}
          />
        )}

        {activeSection === NavSection.GARAGEM_3D && (
          <Garage3DView
            profile={userData.profile}
            completedSessionsCount={
              userData.loggedSessions.length + userData.completedDayKeys.length
            }
          />
        )}
      </main>
    </div>
  );
}
