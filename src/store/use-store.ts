import { create } from "zustand";
import { 
  Profile, Goal, Milestone, Task, FocusSession, 
  Notification, MomentumScore, Achievement, AIRecommendation 
} from "../types";
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut as fbSignOut, GoogleAuthProvider } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

interface AppState {
  // Auth state
  isAuthenticated: boolean;
  profile: Profile | null;
  isLoadingAuth: boolean;
  theme: "light" | "dark";
  googleAccessToken: string | null;
  setGoogleAccessToken: (token: string | null) => void;
  authError: string | null;
  setAuthError: (error: string | null) => void;
  
  // App data
  goals: Goal[];
  milestones: Milestone[];
  tasks: Task[];
  focusSessions: FocusSession[];
  notifications: Notification[];
  momentum: MomentumScore;
  achievements: Achievement[];
  recommendations: AIRecommendation[];
  
  // Interactive UI state
  activeTab: "dashboard" | "planner" | "focus" | "momentum" | "calendar" | "agent" | "profile";
  selectedGoalId: string | null;
  selectedTaskId: string | null;
  latestRunResult: { title: string; content: string; timestamp: string } | null;
  isGeneratingAI: boolean;
  aiInsightMessage: string;
  isVoiceActive: boolean;
  voiceLanguageCode: string;

  // Actions
  setTheme: (theme: "light" | "dark") => void;
  setActiveTab: (tab: "dashboard" | "planner" | "focus" | "momentum" | "calendar" | "agent" | "profile") => void;
  setSelectedGoalId: (id: string | null) => void;
  setSelectedTaskId: (id: string | null) => void;
  setVoiceLanguageCode: (code: string) => void;
  
  // Auth Actions
  signIn: (email: string, fullName: string) => Promise<void>;
  signUp: (email: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleRedirect: () => Promise<void>;
  checkRedirectResult: () => Promise<void>;
  signOut: () => void;
  completeOnboarding: () => void;

  // Goal & Task CRUD
  addGoal: (goal: Omit<Goal, "id" | "user_id" | "created_at" | "updated_at" | "progress" | "health_score" | "status">) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  
  addTask: (task: Omit<Task, "id" | "created_at" | "actual_minutes">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  completeTask: (id: string) => Promise<void>;
  
  // Focus Timer actions
  startFocusSession: (taskId?: string) => string;
  completeFocusSession: (sessionId: string, durationMinutes: number) => Promise<void>;
  
  // AI execution intelligence routes
  runCommandCenter: (type: "prioritize" | "schedule" | "recommend" | "remind" | "habits" | "autopilot") => Promise<void>;
  decomposeGoalAI: (goalId: string) => Promise<void>;
  dismissRecommendation: (id: string) => void;
  applyRecommendation: (id: string) => void;
  updateStreak: (days: number) => void;
  
  // Voice Actions
  processVoiceIntent: (text: string) => Promise<void>;
  setVoiceActive: (active: boolean) => void;
  voiceHistory: any[];
  addVoiceHistoryLog: (log: { type: "chat" | "command" | string; sender: "user" | "agent"; text: string }) => void;
  loadVoiceHistory: () => void;
}

// Initial placeholder data to make the app look stunning immediately (as in the screenshots!)
const DEFAULT_GOAL_ID = "b1f65030-d31c-46b6-8338-13c6ff61a37b";
const DEFAULT_TASK_ID = "4c5b8686-8d39-43a6-832a-2643b318cf6e";

const initialGoals: Goal[] = [
  {
    id: DEFAULT_GOAL_ID,
    user_id: "user-123",
    title: "Launch my startup",
    description: "Build, launch, and validate an innovative SaaS product to get first 10 paying customers.",
    category: "work",
    status: "active",
    health_score: 100,
    target_date: "2026-09-27",
    progress: 15,
    tags: ["SaaS", "Startup", "Tech"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const initialTasks: Task[] = [
  {
    id: DEFAULT_TASK_ID,
    goal_id: DEFAULT_GOAL_ID,
    title: "Define Value Proposition & Target Audience",
    description: "Formulate a strong value proposition canvas and identify primary client archetypes.",
    priority: "high",
    status: "pending",
    estimated_minutes: 300,
    actual_minutes: 0,
    due_date: "2026-07-15",
    is_ai_generated: true,
    created_at: new Date().toISOString()
  },
  {
    id: "task-2",
    goal_id: DEFAULT_GOAL_ID,
    title: "Design Figma Interactive Prototypes",
    description: "Create visual wireframes for the onboarding flow and core workspace dashboard views.",
    priority: "medium",
    status: "pending",
    estimated_minutes: 240,
    actual_minutes: 0,
    due_date: "2026-07-25",
    is_ai_generated: true,
    created_at: new Date().toISOString()
  },
  {
    id: "task-3",
    goal_id: DEFAULT_GOAL_ID,
    title: "Build Landing Page with Tailwind CSS",
    description: "Develop a super fast and responsive static landing page to test email waitlists.",
    priority: "high",
    status: "pending",
    estimated_minutes: 180,
    actual_minutes: 0,
    due_date: "2026-08-01",
    is_ai_generated: false,
    created_at: new Date().toISOString()
  }
];

const initialAchievements: Achievement[] = [
  {
    id: "ach-streak-5",
    user_id: "user-123",
    type: "streak",
    title: "Focus Streak",
    description: "Successfully hit a 5-day focus streak.",
    icon: "Flame",
    xp_awarded: 300,
    unlocked_at: ""
  },
  {
    id: "ach-1",
    user_id: "user-123",
    type: "streak",
    title: "7-Day Streak",
    description: "Maintain a productivity streak for 7 consecutive days.",
    icon: "Flame",
    xp_awarded: 500,
    unlocked_at: ""
  },
  {
    id: "ach-2",
    user_id: "user-123",
    type: "first",
    title: "First Execution",
    description: "Successfully complete your first scheduled focus block.",
    icon: "CheckCircle",
    xp_awarded: 100,
    unlocked_at: new Date().toISOString() // unlocked already!
  },
  {
    id: "ach-3",
    user_id: "user-123",
    type: "ai",
    title: "AI Architect",
    description: "Decompose an objective into actionable milestones using Gemini.",
    icon: "Cpu",
    xp_awarded: 250,
    unlocked_at: ""
  }
];

export const useStore = create<AppState>((set, get) => {
  // Load persisted state if exists
  const isClient = typeof window !== "undefined";
  const savedProfile = isClient ? localStorage.getItem("planahead_profile") : null;
  const savedGoals = isClient ? localStorage.getItem("planahead_goals") : null;
  const savedTasks = isClient ? localStorage.getItem("planahead_tasks") : null;
  const savedMomentum = isClient ? localStorage.getItem("planahead_momentum") : null;
  const savedFocus = isClient ? localStorage.getItem("planahead_focus") : null;
  const savedAchievements = isClient ? localStorage.getItem("planahead_achievements") : null;
  const savedTheme = isClient ? localStorage.getItem("planahead_theme") : "dark";
  const savedVoiceHistory = isClient ? localStorage.getItem("planahead_voice_agent_history") : null;

  const parsedProfile = savedProfile ? JSON.parse(savedProfile) : null;
  const parsedGoals = savedGoals ? JSON.parse(savedGoals) : initialGoals;
  const parsedTasks = savedTasks ? JSON.parse(savedTasks) : initialTasks;
  const parsedFocus = savedFocus ? JSON.parse(savedFocus) : [];
  const parsedAchievements = savedAchievements ? JSON.parse(savedAchievements) : initialAchievements;
  const parsedVoiceHistory = savedVoiceHistory ? JSON.parse(savedVoiceHistory) : [];
  
  const parsedMomentum: MomentumScore = savedMomentum ? JSON.parse(savedMomentum) : {
    id: "momentum-123",
    user_id: "user-123",
    current_score: 0,
    level: 1,
    total_xp: 0,
    streak_days: 0,
    best_streak: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Helper to persist state
  const saveToStorage = (key: string, value: any) => {
    if (isClient) localStorage.setItem(key, JSON.stringify(value));
  };

  return {
    isAuthenticated: !!parsedProfile,
    profile: parsedProfile,
    isLoadingAuth: false,
    authError: null,
    theme: (savedTheme as "light" | "dark") || "dark",
    googleAccessToken: null,
    
    goals: parsedGoals,
    milestones: [],
    tasks: parsedTasks,
    focusSessions: parsedFocus,
    notifications: [
      {
        id: "notif-1",
        user_id: "user-123",
        type: "welcome",
        title: "Welcome to PlanAhead",
        message: "You are ready to plan smarter and stay ahead. Run Autopilot to analyze your focus block goals.",
        read: false,
        created_at: new Date().toISOString()
      }
    ],
    momentum: parsedMomentum,
    achievements: parsedAchievements,
    recommendations: [],
    
    activeTab: "dashboard",
    selectedGoalId: DEFAULT_GOAL_ID,
    selectedTaskId: DEFAULT_TASK_ID,
    latestRunResult: null,
    isGeneratingAI: false,
    aiInsightMessage: `Decomposition complete for "Launch my startup". Feasibility: 65%.`,
    isVoiceActive: false,
    voiceLanguageCode: isClient ? (localStorage.getItem("planahead_voice_lang") || "en-US") : "en-US",
    voiceHistory: parsedVoiceHistory,

    setTheme: (theme) => {
      set({ theme });
      if (isClient) localStorage.setItem("planahead_theme", theme);
    },
    
    setActiveTab: (tab) => set({ activeTab: tab }),
    setSelectedGoalId: (id) => set({ selectedGoalId: id }),
    setSelectedTaskId: (id) => set({ selectedTaskId: id }),
    setVoiceLanguageCode: (code) => {
      set({ voiceLanguageCode: code });
      if (isClient) localStorage.setItem("planahead_voice_lang", code);
    },
    setGoogleAccessToken: (token) => set({ googleAccessToken: token }),
    setAuthError: (error) => set({ authError: error }),

    loadVoiceHistory: () => {
      try {
        const stored = localStorage.getItem("planahead_voice_agent_history");
        if (stored) {
          set({ voiceHistory: JSON.parse(stored) });
        }
      } catch (e) {
        console.error("Failed to load voice history in store:", e);
      }
    },

    addVoiceHistoryLog: (log) => {
      try {
        const existing = get().voiceHistory;
        const newLog = {
          id: Math.random().toString(),
          timestamp: new Date().toISOString(),
          ...log
        };
        const updated = [newLog, ...existing].slice(0, 50);
        set({ voiceHistory: updated });
        if (isClient) {
          localStorage.setItem("planahead_voice_agent_history", JSON.stringify(updated));
        }
      } catch (e) {
        console.error("Failed to append voice history in store:", e);
      }
    },

    signIn: async (email, fullName) => {
      set({ isLoadingAuth: true });
      // Simulate API sync with Clerk / Supabase
      try {
        const dummyProfile: Profile = {
          id: "user-123",
          clerk_user_id: "clerk_user_123",
          email,
          full_name: fullName,
          avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`,
          onboarding_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Sync with real Express server auth sync endpoint!
        await fetch("/api/auth/sync-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerk_user_id: dummyProfile.clerk_user_id,
            email: dummyProfile.email,
            full_name: dummyProfile.full_name,
            avatar_url: dummyProfile.avatar_url
          })
        }).catch(() => console.log("Offline or dev environment sync skipped."));

        set({ profile: dummyProfile, isAuthenticated: true });
        saveToStorage("planahead_profile", dummyProfile);
      } catch (err) {
        console.error(err);
      } finally {
        set({ isLoadingAuth: false });
      }
    },

    signUp: async (email, fullName) => {
      set({ isLoadingAuth: true });
      try {
        const dummyProfile: Profile = {
          id: "user-123",
          clerk_user_id: "clerk_user_123",
          email,
          full_name: fullName,
          avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`,
          onboarding_completed: false, // will go to onboarding first
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        set({ profile: dummyProfile, isAuthenticated: true });
        saveToStorage("planahead_profile", dummyProfile);
      } catch (err) {
        console.error(err);
      } finally {
        set({ isLoadingAuth: false });
      }
    },

    signInWithGoogle: async () => {
      set({ isLoadingAuth: true, authError: null });
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential?.accessToken || null;
        const user = result.user;
        const email = user.email || "";
        const fullName = user.displayName || "Google User";
        const avatarUrl = user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`;
        
        // Check if there's any existing onboarding or profile in localStorage
        const savedProfileStr = isClient ? localStorage.getItem("planahead_profile") : null;
        let onboardingCompleted = false;
        if (savedProfileStr) {
          try {
            const parsed = JSON.parse(savedProfileStr);
            if (parsed && parsed.email === email) {
              onboardingCompleted = parsed.onboarding_completed;
            }
          } catch (e) {}
        }

        const googleProfile: Profile = {
          id: user.uid,
          clerk_user_id: user.uid,
          email,
          full_name: fullName,
          avatar_url: avatarUrl,
          onboarding_completed: onboardingCompleted,
          created_at: user.metadata.creationTime || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Sync with real Express server auth sync endpoint
        await fetch("/api/auth/sync-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerk_user_id: googleProfile.clerk_user_id,
            email: googleProfile.email,
            full_name: googleProfile.full_name,
            avatar_url: googleProfile.avatar_url
          })
        }).catch(() => console.log("Express auth sync skipped."));

        set({ profile: googleProfile, isAuthenticated: true, googleAccessToken: accessToken, authError: null });
        saveToStorage("planahead_profile", googleProfile);
      } catch (err: any) {
        console.error("Google Auth error:", err);
        set({ authError: err?.message || String(err) });
      } finally {
        set({ isLoadingAuth: false });
      }
    },

    signInWithGoogleRedirect: async () => {
      set({ isLoadingAuth: true, authError: null });
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (err: any) {
        console.error("Google Redirect Auth error:", err);
        set({ authError: err?.message || String(err), isLoadingAuth: false });
      }
    },

    checkRedirectResult: async () => {
      set({ isLoadingAuth: true });
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const accessToken = credential?.accessToken || null;
          const user = result.user;
          const email = user.email || "";
          const fullName = user.displayName || "Google User";
          const avatarUrl = user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`;
          
          const savedProfileStr = isClient ? localStorage.getItem("planahead_profile") : null;
          let onboardingCompleted = false;
          if (savedProfileStr) {
            try {
              const parsed = JSON.parse(savedProfileStr);
              if (parsed && parsed.email === email) {
                onboardingCompleted = parsed.onboarding_completed;
              }
            } catch (e) {}
          }

          const googleProfile: Profile = {
            id: user.uid,
            clerk_user_id: user.uid,
            email,
            full_name: fullName,
            avatar_url: avatarUrl,
            onboarding_completed: onboardingCompleted,
            created_at: user.metadata.creationTime || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          await fetch("/api/auth/sync-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clerk_user_id: googleProfile.clerk_user_id,
              email: googleProfile.email,
              full_name: googleProfile.full_name,
              avatar_url: googleProfile.avatar_url
            })
          }).catch(() => console.log("Express auth sync skipped."));

          set({ profile: googleProfile, isAuthenticated: true, googleAccessToken: accessToken, authError: null });
          saveToStorage("planahead_profile", googleProfile);
        }
      } catch (err: any) {
        console.error("Google Redirect Result error:", err);
        set({ authError: err?.message || String(err) });
      } finally {
        set({ isLoadingAuth: false });
      }
    },

    signOut: () => {
      fbSignOut(auth).catch((err) => console.error("Firebase signout error:", err));
      set({ profile: null, isAuthenticated: false, activeTab: "dashboard", googleAccessToken: null });
      if (isClient) {
        localStorage.removeItem("planahead_profile");
      }
    },

    completeOnboarding: () => {
      const p = get().profile;
      if (p) {
        const updated = { ...p, onboarding_completed: true };
        set({ profile: updated });
        saveToStorage("planahead_profile", updated);
        
        // Push a notification about completing onboarding
        const welcomeNotif: Notification = {
          id: Math.random().toString(),
          user_id: p.id,
          type: "system",
          title: "Setup Complete",
          message: "Onboarding completed successfully! Your personal execution coach is active.",
          read: false,
          created_at: new Date().toISOString()
        };
        set(state => {
          const notifs = [welcomeNotif, ...state.notifications];
          return { notifications: notifs };
        });
      }
    },

    addGoal: (goalData) => {
      const newGoal: Goal = {
        ...goalData,
        id: Math.random().toString(),
        user_id: get().profile?.id || "user-123",
        status: "active",
        progress: 0,
        health_score: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const goals = [...get().goals, newGoal];
      set({ goals, selectedGoalId: newGoal.id });
      saveToStorage("planahead_goals", goals);
    },

    updateGoal: (id, updates) => {
      const goals = get().goals.map(g => g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g);
      set({ goals });
      saveToStorage("planahead_goals", goals);
    },

    deleteGoal: (id) => {
      const goals = get().goals.filter(g => g.id !== id);
      set({ goals });
      saveToStorage("planahead_goals", goals);
    },

    addTask: (taskData) => {
      const newTask: Task = {
        ...taskData,
        id: Math.random().toString(),
        actual_minutes: 0,
        created_at: new Date().toISOString()
      };
      const tasks = [...get().tasks, newTask];
      set({ tasks });
      saveToStorage("planahead_tasks", tasks);
    },

    updateTask: (id, updates) => {
      const tasks = get().tasks.map(t => t.id === id ? { ...t, ...updates } : t);
      set({ tasks });
      saveToStorage("planahead_tasks", tasks);
    },

    completeTask: async (id) => {
      const tasks = get().tasks.map(t => t.id === id ? { ...t, status: "completed" as const, completed_at: new Date().toISOString() } : t);
      
      // Reward XP for completing task
      const xpEarned = 150;
      const momentum = get().momentum;
      const newTotalXp = momentum.total_xp + xpEarned;
      const newLevel = Math.floor(newTotalXp / 1000) + 1;
      
      // Update streak
      const updatedMomentum: MomentumScore = {
        ...momentum,
        total_xp: newTotalXp,
        level: newLevel,
        current_score: Math.min(100, momentum.current_score + 5),
        updated_at: new Date().toISOString()
      };

      // Check achievements
      const achievements = get().achievements.map(a => {
        if (a.type === "first" && !a.unlocked_at) {
          return { ...a, unlocked_at: new Date().toISOString() };
        }
        return a;
      });

      // Notification
      const notif: Notification = {
        id: Math.random().toString(),
        user_id: get().profile?.id || "user-123",
        type: "xp",
        title: "Task Completed! 🎉",
        message: `You earned +150 XP for completing your task. Current Score: ${updatedMomentum.current_score}`,
        read: false,
        created_at: new Date().toISOString()
      };

      // Set state and persist immediately
      set(state => ({
        tasks,
        momentum: updatedMomentum,
        achievements,
        notifications: [notif, ...state.notifications]
      }));

      saveToStorage("planahead_tasks", tasks);
      saveToStorage("planahead_momentum", updatedMomentum);
      saveToStorage("planahead_achievements", achievements);

      // Complete task on server asynchronously in the background
      fetch(`/api/tasks/${id}/complete`, {
        method: "POST"
      }).catch(() => {});
    },

    startFocusSession: (taskId) => {
      const sessionId = Math.random().toString();
      const newSession: FocusSession = {
        id: sessionId,
        user_id: get().profile?.id || "user-123",
        task_id: taskId || get().selectedTaskId || undefined,
        duration_minutes: 25,
        actual_minutes: 0,
        xp_earned: 0,
        completed: false,
        interrupted: false,
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      set(state => {
        const sessions = [newSession, ...state.focusSessions];
        saveToStorage("planahead_focus", sessions);
        return { focusSessions: sessions };
      });
      return sessionId;
    },

    completeFocusSession: async (sessionId, durationMinutes) => {
      // Reward +250 XP
      const xpEarned = 250;
      const sessions = get().focusSessions.map(s => s.id === sessionId ? {
        ...s,
        completed: true,
        actual_minutes: durationMinutes,
        xp_earned: xpEarned,
        ended_at: new Date().toISOString()
      } : s);
      set({ focusSessions: sessions });
      saveToStorage("planahead_focus", sessions);

      const momentum = get().momentum;
      const newTotalXp = momentum.total_xp + xpEarned;
      const newLevel = Math.floor(newTotalXp / 1000) + 1;
      
      const updatedMomentum: MomentumScore = {
        ...momentum,
        total_xp: newTotalXp,
        level: newLevel,
        streak_days: Math.max(1, momentum.streak_days),
        current_score: Math.min(100, momentum.current_score + 15),
        updated_at: new Date().toISOString()
      };
      set({ momentum: updatedMomentum });
      saveToStorage("planahead_momentum", updatedMomentum);

      // Trigger server logging/updating
      await fetch("/api/goals/sync-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: updatedMomentum.current_score })
      }).catch(() => {});

      // Push notification
      const notif: Notification = {
        id: Math.random().toString(),
        user_id: get().profile?.id || "user-123",
        type: "focus",
        title: "Focus Session Completed! 🧘‍♂️",
        message: `Incredible work. You completed ${durationMinutes} minutes of Deep Work. Earned +250 XP.`,
        read: false,
        created_at: new Date().toISOString()
      };
      set(state => ({ notifications: [notif, ...state.notifications] }));
    },

    runCommandCenter: async (type) => {
      set({ isGeneratingAI: true });
      try {
        // We will call the real server api route!
        const endpoint = type === "autopilot" ? "/api/planner/orchestrate" : `/api/momentum/coach`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: type,
            goals: get().goals,
            tasks: get().tasks,
            momentum: get().momentum
          })
        });
        const data = await res.json();
        
        // Update recommended list based on type
        const newRecommend: AIRecommendation = {
          id: Math.random().toString(),
          user_id: get().profile?.id || "user-123",
          type: type === "autopilot" ? "prioritize" : type,
          title: data.recommendation?.title || `${type.toUpperCase()} execution suggestion`,
          description: data.recommendation?.description || data.text || "AI analyzed your momentum score and recommended a highly effective strategy.",
          priority: "high",
          created_at: new Date().toISOString(),
          applied: false,
          dismissed: false
        };

        set(state => ({
          recommendations: [newRecommend, ...state.recommendations],
          latestRunResult: {
            title: data.recommendation?.title || "Autopilot Analysis Run",
            content: data.recommendation?.description || data.text || "Analyzed tasks successfully.",
            timestamp: new Date().toLocaleTimeString()
          },
          aiInsightMessage: data.recommendation?.insight || "Insights compiled successfully."
        }));
      } catch (err) {
        console.error("AI Generation issue:", err);
        // Clean fallback
        set(state => ({
          latestRunResult: {
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} analysis complete`,
            content: `Your high priority focus targets are active. Maintain a solid workflow to keep your current momentum level high.`,
            timestamp: new Date().toLocaleTimeString()
          }
        }));
      } finally {
        set({ isGeneratingAI: false });
      }
    },

    decomposeGoalAI: async (goalId) => {
      set({ isGeneratingAI: true });
      try {
        const goal = get().goals.find(g => g.id === goalId);
        const res = await fetch(`/api/goals/${goalId}/decompose`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal })
        });
        const data = await res.json();
        
        // The server response returns list of tasks!
        if (data.tasks && data.tasks.length > 0) {
          const generatedTasks: Task[] = data.tasks.map((t: any) => ({
            id: Math.random().toString(),
            goal_id: goalId,
            title: t.title,
            description: t.description,
            priority: t.priority || "medium",
            status: "pending",
            estimated_minutes: t.estimated_minutes || 60,
            actual_minutes: 0,
            due_date: t.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            is_ai_generated: true,
            created_at: new Date().toISOString()
          }));

          set(state => {
            const updatedTasks = [...state.tasks, ...generatedTasks];
            saveToStorage("planahead_tasks", updatedTasks);
            
            // Unlock AI Architect Achievement if not done
            const achievements = state.achievements.map(a => {
              if (a.type === "ai" && !a.unlocked_at) {
                return { ...a, unlocked_at: new Date().toISOString() };
              }
              return a;
            });
            saveToStorage("planahead_achievements", achievements);

            return { 
              tasks: updatedTasks,
              achievements,
              aiInsightMessage: `Decomposition complete for "${goal?.title}". Feasibility: ${data.feasibility || "85%"}.`
            };
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        set({ isGeneratingAI: false });
      }
    },

    dismissRecommendation: (id) => {
      set(state => ({
        recommendations: state.recommendations.map(r => r.id === id ? { ...r, dismissed: true } : r)
      }));
    },

    applyRecommendation: (id) => {
      set(state => {
        const rec = state.recommendations.find(r => r.id === id);
        if (!rec) return {};
        
        // If it was prioritized, add as a high priority task!
        const newTask: Task = {
          id: Math.random().toString(),
          title: rec.title,
          description: rec.description,
          priority: "high",
          status: "pending",
          estimated_minutes: 90,
          actual_minutes: 0,
          due_date: new Date().toISOString().split("T")[0],
          is_ai_generated: true,
          created_at: new Date().toISOString()
        };

        const updatedTasks = [...state.tasks, newTask];
        saveToStorage("planahead_tasks", updatedTasks);

        return {
          tasks: updatedTasks,
          recommendations: state.recommendations.map(r => r.id === id ? { ...r, applied: true } : r)
        };
      });
    },

    updateStreak: (days) => {
      set(state => {
        const momentum = state.momentum;
        const newStreak = Math.max(0, days);
        const updatedMomentum = {
          ...momentum,
          streak_days: newStreak,
          best_streak: Math.max(momentum.best_streak, newStreak),
          updated_at: new Date().toISOString()
        };

        saveToStorage("planahead_momentum", updatedMomentum);

        // Check if we should unlock streak achievements
        let extraXp = 0;
        const notificationsToPush: Notification[] = [];
        
        const updatedAchievements = state.achievements.map(ach => {
          if (ach.id === "ach-streak-5" && newStreak >= 5 && !ach.unlocked_at) {
            extraXp += ach.xp_awarded;
            notificationsToPush.push({
              id: Math.random().toString(),
              user_id: state.profile?.id || "user-123",
              type: "xp",
              title: "Achievement Unlocked! 🏆",
              message: `Unlocked Focus Streak: hit a 5-day focus streak! Earned +${ach.xp_awarded} XP.`,
              read: false,
              created_at: new Date().toISOString()
            });
            return { ...ach, unlocked_at: new Date().toISOString() };
          }
          if (ach.id === "ach-1" && newStreak >= 7 && !ach.unlocked_at) {
            extraXp += ach.xp_awarded;
            notificationsToPush.push({
              id: Math.random().toString(),
              user_id: state.profile?.id || "user-123",
              type: "xp",
              title: "Achievement Unlocked! 🏆",
              message: `Unlocked 7-Day Streak: Maintain a productivity streak for 7 consecutive days! Earned +${ach.xp_awarded} XP.`,
              read: false,
              created_at: new Date().toISOString()
            });
            return { ...ach, unlocked_at: new Date().toISOString() };
          }
          return ach;
        });

        if (extraXp > 0) {
          updatedMomentum.total_xp += extraXp;
          updatedMomentum.level = Math.floor(updatedMomentum.total_xp / 1000) + 1;
          saveToStorage("planahead_momentum", updatedMomentum);
          saveToStorage("planahead_achievements", updatedAchievements);
        }

        return {
          momentum: updatedMomentum,
          achievements: updatedAchievements,
          notifications: [...notificationsToPush, ...state.notifications]
        };
      });
    },

    processVoiceIntent: async (text) => {
      set({ isGeneratingAI: true });
      try {
        const res = await fetch("/api/voice/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: text })
        });
        const data = await res.json();
        
        // Log voice command and result to history using reactive store actions
        get().addVoiceHistoryLog({
          type: "command",
          sender: "user",
          text: `[Voice Command] "${text}"`
        });
        get().addVoiceHistoryLog({
          type: "command",
          sender: "agent",
          text: data.text || `Processed Voice Command: "${text}"`
        });

        if (data.action === "add_goal" && data.goal_title) {
          get().addGoal({
            title: data.goal_title,
            description: data.goal_description || "Voice added goal objective.",
            category: "work",
            target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            tags: ["Voice"]
          });
        } else if (data.action === "add_task" && data.task_title) {
          get().addTask({
            goal_id: get().selectedGoalId || undefined,
            title: data.task_title,
            description: data.task_description || "Voice added task objective.",
            priority: "medium",
            status: "pending",
            estimated_minutes: 60,
            is_ai_generated: false,
            due_date: new Date().toISOString().split("T")[0]
          });
        }

        // Add a smart notification with voice status
        const notif: Notification = {
          id: Math.random().toString(),
          user_id: get().profile?.id || "user-123",
          type: "voice",
          title: "Voice command processed 🎙️",
          message: data.text || `Processed: "${text}". Created appropriate objectives.`,
          read: false,
          created_at: new Date().toISOString()
        };
        set(state => ({ notifications: [notif, ...state.notifications] }));
      } catch (err) {
        console.error(err);
      } finally {
        set({ isGeneratingAI: false });
      }
    },

    setVoiceActive: (active) => set({ isVoiceActive: active })
  };
});
