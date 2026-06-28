import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, LayoutDashboard, Target, Timer, Zap, Moon, Sun, 
  Bell, LogOut, Play, Pause, RotateCcw, Plus, Trash, Check, 
  CheckCircle2, Flame, TrendingUp, X, ChevronRight, Mic, MicOff, 
  Cpu, Layers, Calendar, Award, CheckSquare, BookOpen, UserCheck,
  Menu, ArrowLeft, Layout, AlertTriangle, Shield, Fingerprint, Mail, Key, Clock, Info
} from "lucide-react";
import { useStore } from "./store/use-store";
import { getTranslation } from "./lib/translations";
import { Goal, Task } from "./types";
import { GoogleCalendarView } from "./components/GoogleCalendarView";
import TalkingAgent, { languages } from "./components/TalkingAgent";

const LEVEL_NAMES = [
  "Explorer",      // Level 1
  "Initiator",     // Level 2
  "Achiever",      // Level 3
  "Strategist",    // Level 4
  "Executor",      // Level 5
  "Optimizer",     // Level 6
  "Focus Master",  // Level 7
  "Velocity Sage", // Level 8
  "Peak Performer",// Level 9
  "Grandmaster"    // Level 10+
];

function getLevelName(level: number): string {
  return LEVEL_NAMES[Math.min(Math.max(1, level) - 1, LEVEL_NAMES.length - 1)] || "Explorer";
}

export default function App() {
  const {
    isAuthenticated,
    profile,
    theme,
    goals,
    authError,
    setAuthError,
    tasks,
    focusSessions,
    notifications,
    momentum,
    achievements,
    recommendations,
    activeTab,
    selectedGoalId,
    selectedTaskId,
    latestRunResult,
    isGeneratingAI,
    aiInsightMessage,
    isVoiceActive,
    setTheme,
    setActiveTab,
    setSelectedGoalId,
    setSelectedTaskId,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGoogleRedirect,
    checkRedirectResult,
    signOut,
    completeOnboarding,
    addGoal,
    updateGoal,
    deleteGoal,
    addTask,
    updateTask,
    completeTask,
    startFocusSession,
    completeFocusSession,
    runCommandCenter,
    decomposeGoalAI,
    dismissRecommendation,
    applyRecommendation,
    updateStreak,
    processVoiceIntent,
    setVoiceActive,
    googleAccessToken,
    voiceLanguageCode,
    setVoiceLanguageCode,
    voiceHistory,
    loadVoiceHistory
  } = useStore();

  const t = (key: string): string => {
    return getTranslation(key, voiceLanguageCode);
  };

  // Auth local UI state
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  // Onboarding local state
  const [onboardGoal, setOnboardGoal] = useState("");
  const [onboardCategory, setOnboardCategory] = useState("work");
  const [isOnboardCustomCategoryActive, setIsOnboardCustomCategoryActive] = useState(false);
  const [onboardTime, setOnboardTime] = useState(25);
  const [isOnboardCustomTimeActive, setIsOnboardCustomTimeActive] = useState(false);

  // New Goal modal state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState<any>("work");
  const [isCustomCategoryActive, setIsCustomCategoryActive] = useState(false);
  const [newGoalDate, setNewGoalDate] = useState("");
  const [newGoalTags, setNewGoalTags] = useState("");

  // New Task state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);

  useEffect(() => {
    if (!newTaskTitle || newTaskTitle.trim().length < 4) {
      setSuggestedCategory(null);
      setIsSuggestingCategory(false);
      return;
    }

    setIsSuggestingCategory(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch("/api/tasks/suggest-category", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTaskTitle })
        });
        if (response.ok) {
          const data = await response.json();
          setSuggestedCategory(data.category);
        }
      } catch (err) {
        console.error("Failed to fetch suggested category", err);
      } finally {
        setIsSuggestingCategory(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [newTaskTitle]);

  // Timer state
  const [timerMode, setTimerMode] = useState<"work" | "break">("work");
  const [timeLeft, setTimeLeft] = useState(1500); // 25m
  const [timerRunning, setTimerRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Focus coach live response state
  const [liveCoachTip, setLiveCoachTip] = useState("Start the timer to activate live coaching.");
  const [liveCoachBoost, setLiveCoachBoost] = useState("");

  // Notifications Popover state
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);

  // Premium UI state for both light and dark mode enhancements
  const [isPremiumUI, setIsPremiumUI] = useState<boolean>(() => {
    const saved = localStorage.getItem("planahead_premium_ui");
    return saved !== "false";
  });

  const togglePremiumUI = () => {
    setIsPremiumUI(prev => {
      const next = !prev;
      localStorage.setItem("planahead_premium_ui", String(next));
      return next;
    });
  };

  // Weekly review report modal
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [loadingWeeklyReport, setLoadingWeeklyReport] = useState(false);

  // Voice recording mock state
  const [voiceText, setVoiceText] = useState("");
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [cmdBarText, setCmdBarText] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // AI Scheduler local state
  const [selectedScheduleCell, setSelectedScheduleCell] = useState<{ dateString: string; hour: number } | null>(null);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [scheduleExplanation, setScheduleExplanation] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [schedulerSubTab, setSchedulerSubTab] = useState<"peaks" | "google">("peaks");
  const [syncingTaskId, setSyncingTaskId] = useState<string | null>(null);

  // History Hub local states
  const [historyTab, setHistoryTab] = useState<"focus" | "voice" | "completed">("focus");

  const [showCelebration, setShowCelebration] = useState(false);

  // Dynamic Global Health Score calculation
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === "completed").length;
  const taskCompletionRate = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) : 0.8;
  const calculatedGlobalHealthScore = Math.min(100, Math.max(15, Math.round(
    (taskCompletionRate * 60) + ((momentum.current_score / 100) * 40)
  )));

  const getHealthDescriptionText = (score: number) => {
    if (score >= 80) return "Peak execution state. System is operating at maximum efficiency.";
    if (score >= 50) return "Steady progress detected. Keep executing tasks to maintain momentum.";
    return "Health is declining. Try scheduling your pending tasks to recover focus.";
  };

  const getLast7DaysXP = () => {
    const days = [];
    const today = new Date();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const startOfDay = d.getTime();
      const endOfDay = d.getTime() + 24 * 60 * 60 * 1000 - 1;
      
      const focusXp = focusSessions
        .filter(s => {
          const dateStr = s.ended_at || s.created_at || s.started_at;
          if (!dateStr) return false;
          const time = new Date(dateStr).getTime();
          return time >= startOfDay && time <= endOfDay && s.completed;
        })
        .reduce((sum, s) => sum + (s.xp_earned || 250), 0);
        
      const taskXp = tasks
        .filter(t => {
          if (t.status !== "completed" || !t.completed_at) return false;
          const time = new Date(t.completed_at).getTime();
          return time >= startOfDay && time <= endOfDay;
        })
        .length * 150;
        
      const baselines = [100, 200, 50, 400, 150, 100, 0];
      const baselineIndex = 6 - i;
      const totalXpOnDay = focusXp + taskXp + baselines[baselineIndex];
      
      days.push({
        dayName: dayNames[d.getDay()],
        xp: totalXpOnDay,
        focusXp,
        taskXp
      });
    }
    return days;
  };

  const getMomentumUpdates = () => {
    const updates: any[] = [];
    
    focusSessions.forEach(session => {
      const task = tasks.find(t => t.id === session.task_id);
      const dateStr = session.ended_at || session.created_at || session.started_at;
      if (dateStr) {
        updates.push({
          id: `focus-${session.id}`,
          type: "focus",
          title: session.completed 
            ? `Completed Focus Block: ${task ? task.title : "General session"}`
            : `Interrupted Focus Block: ${task ? task.title : "General session"}`,
          timestamp: new Date(dateStr),
          xp: session.completed ? (session.xp_earned || 250) : 0,
          meta: `${session.actual_minutes}m active duration`
        });
      }
    });
    
    tasks.filter(t => t.status === "completed").forEach(task => {
      if (task.completed_at) {
        updates.push({
          id: `task-${task.id}`,
          type: "task",
          title: `Finished Task: ${task.title}`,
          timestamp: new Date(task.completed_at),
          xp: 150,
          meta: `${task.priority.toUpperCase()} priority task`
        });
      }
    });
    
    achievements.filter(ach => ach.unlocked_at).forEach(ach => {
      updates.push({
        id: `ach-${ach.id}`,
        type: "achievement",
        title: `Unlocked Achievement: ${ach.title}`,
        timestamp: new Date(ach.unlocked_at!),
        xp: ach.type === "first" ? 500 : 250,
        meta: ach.description
      });
    });
    
    return updates.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
  };

  useEffect(() => {
    loadVoiceHistory();
  }, [activeTab, historyTab]);

  const syncToGoogleCalendar = async (task: Task) => {
    if (!googleAccessToken) {
      alert("Please connect Google Calendar under the Google Calendar View tab first.");
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to sync "${task.title}" to your Google Calendar?`);
    if (!confirmed) return;

    setSyncingTaskId(task.id);
    try {
      const startHour = task.scheduled_hour || 9;
      const startDate = new Date(`${task.scheduled_date}T${String(startHour).padStart(2, "0")}:00:00`);
      const endDate = new Date(startDate.getTime() + (task.estimated_minutes || 60) * 60 * 1000);

      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${googleAccessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          summary: `PlanAhead: ${task.title}`,
          description: task.description || "Scheduled and optimized using PlanAhead AI.",
          start: {
            dateTime: startDate.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: endDate.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          reminders: {
            useDefault: true
          }
        })
      });

      if (!res.ok) {
        throw new Error("Failed to sync event to Google Calendar.");
      }

      const data = await res.json();
      if (data.id) {
        updateTask(task.id, { google_event_id: data.id });
        alert(`Successfully synced "${task.title}" to Google Calendar!`);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error syncing to Google Calendar.");
    } finally {
      setSyncingTaskId(null);
    }
  };

  // Tab navigation history for back button functionality
  const [tabHistory, setTabHistory] = useState<string[]>([]);

  useEffect(() => {
    if (activeTab) {
      setTabHistory((prev) => {
        // Avoid duplicate entries at the end of the history
        if (prev[prev.length - 1] === activeTab) return prev;
        return [...prev, activeTab];
      });
    }
  }, [activeTab]);

  const handleTabBack = () => {
    if (tabHistory.length > 1) {
      const newHistory = [...tabHistory];
      newHistory.pop(); // Remove the current tab
      const previousTab = newHistory[newHistory.length - 1];
      setTabHistory(newHistory);
      // Directly call useStore's setActiveTab
      setActiveTab(previousTab as any);
    }
  };

  const getNext7Days = () => {
    const arr = [];
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateString = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const dayLabel = daysOfWeek[d.getDay()];
      const dateLabel = d.getDate();
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      arr.push({ dateString, dayLabel, dateLabel, monthLabel, rawDate: d });
    }
    return arr;
  };

  const TIMESLOTS = [
    { hour: 9, label: "09:00 AM", peak: "Peak Focus", energy: "95% Energy", desc: "Best for heavy cognitive loads.", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { hour: 11, label: "11:00 AM", peak: "Strategic", energy: "85% Energy", desc: "Structured problem solving.", color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
    { hour: 14, label: "02:00 PM", peak: "Creative", energy: "75% Energy", desc: "Prototyping, writing.", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { hour: 16, label: "04:00 PM", peak: "Collaborative", energy: "60% Energy", desc: "Check-ins and coordination.", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { hour: 18, label: "06:00 PM", peak: "Maintenance", energy: "45% Energy", desc: "Email, admin, reviews.", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  ];

  const recognitionRef = useRef<any>(null);
  const fallbackIntervalRef = useRef<any>(null);

  // Initialize SpeechRecognition on mount if supported
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const currentText = finalTranscript || interimTranscript;
        if (currentText) {
          setVoiceText(currentText);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === "not-allowed") {
          setVoiceText("Microphone access denied. Please check permissions.");
        }
      };

      rec.onend = () => {
        // Speech recognition ended
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
      }
    };
  }, []);

  // -------------------------------------------------------------
  // Effects & Lifecycles
  // -------------------------------------------------------------

  // Check for Google Auth redirect result on load
  useEffect(() => {
    checkRedirectResult();
  }, []);
  
  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else if (timeLeft === 0 && timerRunning) {
      setTimerRunning(false);
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  // Request focus coach live tips every 20 seconds during session
  useEffect(() => {
    if (timerRunning && secondsElapsed > 0 && secondsElapsed % 20 === 0) {
      triggerLiveCoachUpdate();
    }
  }, [timerRunning, secondsElapsed]);

  const handleTimerComplete = async () => {
    if (activeSessionId) {
      const minutesCompleted = Math.round(secondsElapsed / 60) || 1;
      await completeFocusSession(activeSessionId, minutesCompleted);
      setActiveSessionId(null);
      setSecondsElapsed(0);
      setTimeLeft(timerMode === "work" ? customMinutes * 60 : customBreak * 60);
      setTimerMode(timerMode === "work" ? "break" : "work");
    }
  };

  const triggerLiveCoachUpdate = async () => {
    const activeTask = tasks.find(t => t.id === selectedTaskId);
    try {
      const res = await fetch("/api/focus/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: activeTask?.title || "SaaS Project Design",
          elapsedMinutes: Math.floor(secondsElapsed / 60) || 1,
          currentStreak: momentum.streak_days
        })
      });
      const data = await res.json();
      setLiveCoachTip(data.tip);
      if (data.energy_boost) {
        setLiveCoachBoost(data.energy_boost);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const startTimer = () => {
    if (!timerRunning) {
      const sid = startFocusSession(selectedTaskId || undefined);
      setActiveSessionId(sid);
      setTimerRunning(true);
      setSecondsElapsed(0);
      setLiveCoachTip("Elite Focus block initialized. Keep browser active.");
      setLiveCoachBoost("Optimize respiratory depth. Eliminate external noise sources.");
    } else {
      setTimerRunning(false);
    }
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(customMinutes * 60);
    setTimerMode("work");
    setActiveSessionId(null);
    setSecondsElapsed(0);
    setLiveCoachTip("Timer reset. Choose goal context above to begin.");
    setLiveCoachBoost("");
  };

  const setTimerPreset = (workMins: number, breakMins: number) => {
    setTimerRunning(false);
    setCustomMinutes(workMins);
    setCustomBreak(breakMins);
    setTimeLeft(workMins * 60);
    setTimerMode("work");
    setActiveSessionId(null);
    setSecondsElapsed(0);
  };

  const applyCustomTimer = () => {
    setTimerRunning(false);
    setTimeLeft(customMinutes * 60);
    setTimerMode("work");
    setActiveSessionId(null);
    setSecondsElapsed(0);
  };

  // Submit Goal
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    addGoal({
      title: newGoalTitle,
      description: newGoalDesc,
      category: newGoalCategory,
      target_date: newGoalDate || "2026-12-31",
      tags: newGoalTags ? newGoalTags.split(",").map(t => t.trim()) : []
    });
    setNewGoalTitle("");
    setNewGoalDesc("");
    setNewGoalTags("");
    setNewGoalCategory("work");
    setIsCustomCategoryActive(false);
    setShowGoalModal(false);
  };

  // Submit Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask({
      goal_id: selectedGoalId || undefined,
      title: newTaskTitle,
      description: "Added to execution pool.",
      priority: newTaskPriority,
      status: "pending",
      estimated_minutes: 60,
      is_ai_generated: false,
      due_date: new Date().toISOString().split("T")[0]
    });
    setNewTaskTitle("");
  };

  // Trigger Weekly Review Report
  const triggerWeeklyReview = async () => {
    setShowWeeklyReview(true);
    setLoadingWeeklyReport(true);
    try {
      const res = await fetch("/api/reviews/weekly");
      const data = await res.json();
      setWeeklyReport(data);
    } catch (e) {
      setWeeklyReport({
        week_summary: "Review system compiled offline. Standard metrics are active.",
        achievements: ["First Execution"],
        recommendations: ["Ensure priority items are scheduled on the Command center early."]
      });
    } finally {
      setLoadingWeeklyReport(false);
    }
  };

  // Real voice interface with Web Speech API and simulated fallback
  const toggleVoiceRecording = () => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }

    if (isVoiceRecording) {
      setIsVoiceRecording(false);
      
      // Stop recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error(e);
        }
      }

      const finalSpeech = voiceText.trim();
      if (finalSpeech && !finalSpeech.includes("Microphone access denied") && !finalSpeech.includes("Listening")) {
        processVoiceIntent(finalSpeech);
        setVoiceText("");
      }
    } else {
      setIsVoiceRecording(true);
      setVoiceText("");
      
      // Start recognition if available
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Failed to start SpeechRecognition", e);
          simulateVoiceFallback();
        }
      } else {
        simulateVoiceFallback();
      }
    }
  };

  const simulateVoiceFallback = () => {
    const fallbackTexts = [
      "Create",
      "Create a",
      "Create a task",
      "Create a task to build",
      "Create a task to build live microphone input and save."
    ];
    let step = 0;
    fallbackIntervalRef.current = setInterval(() => {
      if (step < fallbackTexts.length) {
        setVoiceText(fallbackTexts[step]);
        step++;
      } else {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    }, 600);
  };

  // UI state checking for theme classes
  const isDark = theme === "dark";

  // Active theme classes on root element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Dynamic aesthetic styling classes for Premium Polish vs Classic look
  const styles = {
    // Main container backgrounds
    mainBg: isPremiumUI 
      ? isDark 
        ? "bg-[#07070a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/15 via-[#07070a] to-[#07070a]" 
        : "bg-[#f8fafc] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/20 via-[#f8fafc] to-[#f8fafc]"
      : isDark 
        ? "bg-[#09090b]" 
        : "bg-slate-50",
    
    // Standard cards
    card: isPremiumUI 
      ? isDark 
        ? "glass-card shadow-2xl shadow-black/30 hover:border-indigo-500/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.03)] transition-all duration-300 rounded-3xl" 
        : "glass-card-light shadow-[0_8px_30px_rgb(0,0,0,0.015),0_1px_2px_rgb(0,0,0,0.01)] hover:border-indigo-100 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgb(99,102,241,0.025),0_1px_3px_rgb(0,0,0,0.01)] transition-all duration-300 rounded-3xl"
      : isDark 
        ? "bg-[#121214] border border-slate-800 rounded-3xl shadow-sm" 
        : "bg-white border border-slate-200 shadow-sm rounded-3xl",
    
    // Header styling
    header: isPremiumUI 
      ? isDark 
        ? "glass-card border-b border-slate-800/40" 
        : "glass-card-light border-b border-slate-200/40 shadow-[0_2px_15px_rgba(0,0,0,0.01)]"
      : isDark 
        ? "bg-[#09090b] border-b border-slate-800" 
        : "bg-white border-b border-slate-200 shadow-sm",

    // Sidebar styling
    sidebar: isPremiumUI
      ? isDark 
        ? "glass-card border-r border-slate-800/40 shadow-2xl" 
        : "glass-card-light border-r border-slate-200/40 shadow-[1px_0_15px_rgba(0,0,0,0.015)]"
      : isDark 
        ? "bg-[#0c0c0e] border-r border-slate-800" 
        : "bg-white border-r border-slate-200 shadow-sm",

    // Badge colors
    primaryBadge: isPremiumUI 
      ? isDark 
        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 shadow-inner" 
        : "bg-indigo-50/70 text-indigo-700 border border-indigo-150 shadow-3xs"
      : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",

    // Navigation buttons
    navBtnActive: isPremiumUI 
      ? isDark 
        ? "bg-gradient-to-r from-indigo-500/15 to-violet-500/5 text-indigo-300 border border-indigo-500/25 shadow-lg shadow-indigo-500/5" 
        : "bg-gradient-to-r from-indigo-50 to-indigo-100/50 text-indigo-700 font-semibold border border-indigo-150/70 shadow-sm shadow-indigo-600/5"
      : isDark 
        ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-inner" 
        : "bg-indigo-50 text-indigo-700 font-bold border border-indigo-100",

    navBtnInactive: isDark 
      ? "text-slate-400 hover:bg-[#18181b]/60 hover:text-slate-100" 
      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-950",

    // Input fields
    input: isPremiumUI 
      ? isDark 
        ? "bg-[#0c0d12]/80 border-slate-800/80 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 text-slate-200 transition-all rounded-2xl" 
        : "bg-[#f8fafc]/90 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-800 transition-all rounded-2xl shadow-inner-sm"
      : isDark 
        ? "bg-[#18181b] border-slate-800 text-slate-200 rounded-xl" 
        : "bg-slate-100 border-slate-200 text-slate-800 rounded-xl",

    // Buttons
    btnPrimary: isPremiumUI
      ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 active:scale-[0.98] transition-all"
      : "bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all",

    btnSecondary: isPremiumUI 
      ? isDark 
        ? "bg-[#0f111a] hover:bg-[#151724] text-slate-200 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all" 
        : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 hover:shadow-sm rounded-2xl transition-all"
      : isDark 
        ? "bg-[#18181b] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl" 
        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl",

    // Typography styles
    h1: isPremiumUI 
      ? "text-3xl font-bold font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 dark:from-white dark:via-slate-100 dark:to-slate-300"
      : "text-3xl font-bold font-display tracking-tight",
  };

  // Auth actions helper
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    signIn(emailInput, nameInput || "Explorer Guest");
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !nameInput.trim()) return;
    signUp(emailInput, nameInput);
  };

  const handleOnboardingSubmit = () => {
    if (!onboardGoal.trim()) return;
    // create a goal from onboarding
    addGoal({
      title: onboardGoal,
      description: "Primary objective initialized in onboarding.",
      category: onboardCategory as any,
      target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      tags: ["Primary"]
    });
    completeOnboarding();
  };

  const handleCmdBarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = cmdBarText.trim().toLowerCase();
    if (!text) return;
    
    if (text.includes("prioritize") || text.includes("urgency") || text.includes("impact") || text.includes("rank")) {
      runCommandCenter("prioritize");
    } else if (text.includes("schedule") || text.includes("calendar") || text.includes("block")) {
      runCommandCenter("schedule");
    } else if (text.includes("recommend") || text.includes("suggest") || text.includes("next")) {
      runCommandCenter("recommend");
    } else if (text.includes("remind") || text.includes("nudge") || text.includes("alert")) {
      runCommandCenter("remind");
    } else if (text.includes("habit") || text.includes("routine") || text.includes("streak")) {
      runCommandCenter("habits");
    } else {
      runCommandCenter("autopilot");
    }
    setCmdBarText("");
  };

  // Filter tasks based on goal
  const filteredTasks = selectedGoalId 
    ? tasks.filter(t => t.goal_id === selectedGoalId)
    : tasks;

  // -------------------------------------------------------------
  // RENDER AUTH SCREEN
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#09090b] px-4 text-white relative overflow-hidden transition-all duration-300">
        {/* Deep tech ambient aura circles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-sm z-10">
          {/* Main Logo & Subtitle */}
          <div className="flex flex-col items-center justify-center text-center gap-1.5 mb-5">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-2xl shadow-indigo-600/20 mb-0.5">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight font-display bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">PlanAhead</span>
              <span className="block text-[9px] font-mono tracking-widest uppercase text-indigo-400 font-bold mt-0.5">Execution Engine</span>
            </div>
          </div>

          {/* Compact Form Card */}
          <div className="bg-[#121214] border border-[#1f1f23] rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
            
            <h2 className="text-lg font-bold text-center mb-1 font-display text-white">
              {authMode === "signin" ? "Sign In to PlanAhead" : "Create Account"}
            </h2>
            <p className="text-slate-400 text-[11px] text-center mb-4">
              Access your personalized goal execution assistant
            </p>

            {/* Google Sign Up and Sign In */}
            <div className="space-y-1.5 mb-2.5">
              <button 
                onClick={() => {
                  signInWithGoogle();
                }}
                className="w-full py-2 bg-[#ffffff] hover:bg-[#f3f4f6] active:scale-[0.99] border border-[#e5e7eb] text-[#1f2937] hover:text-[#111827] transition-all duration-200 text-xs rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>

              <button 
                type="button"
                onClick={() => {
                  signInWithGoogleRedirect();
                }}
                className="w-full py-1.5 bg-transparent hover:bg-slate-800/20 active:scale-[0.99] border border-slate-700 hover:border-slate-500 text-slate-300 transition-all duration-200 text-[10px] rounded-xl font-medium flex items-center justify-center gap-2 cursor-pointer"
              >
                Or use Redirect Sign-In (Safe for Iframes)
              </button>
            </div>

            {/* Google Auth Error Message with New Tab guidance */}
            {authError && (
              <div className="mb-3 p-3.5 bg-red-950/40 border border-red-500/30 rounded-xl text-left relative overflow-hidden text-xs">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-200">Authentication Alert</h4>
                    <p className="text-[11px] text-red-300 mt-1 leading-relaxed">
                      {authError.includes("popup-closed-by-user") 
                        ? "Google sign-in was closed or blocked. Browsers often restrict popups within iframes." 
                        : authError}
                    </p>
                    <div className="text-[11px] text-indigo-300 font-medium mt-2 leading-relaxed flex items-start gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                      <span>
                        Try clicking <strong>"Open in new tab"</strong> at the top right of this screen to sign in with Google safely!
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Access Action */}
            <button 
              onClick={() => {
                setEmailInput("explorer@planahead.ai");
                setNameInput("Vishal Kumar Tripathi");
                setPasswordInput("password123");
              }}
              className="w-full py-2 mb-3 bg-[#18181b] hover:bg-[#202024] border border-[#27272a] hover:border-indigo-500/30 transition-all duration-200 text-[11px] rounded-xl font-bold flex items-center justify-center gap-2 text-indigo-300"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              Use Demo Credentials (Instant Access)
            </button>

            <div className="relative flex py-1 items-center mb-2.5">
              <div className="flex-grow border-t border-[#1f1f23]"></div>
              <span className="flex-shrink mx-3 text-slate-500 text-[9px] uppercase tracking-widest font-mono font-bold">or secure credentials</span>
              <div className="flex-grow border-t border-[#1f1f23]"></div>
            </div>

            <form onSubmit={authMode === "signin" ? handleSignIn : handleSignUp} className="space-y-3">
              {authMode === "signup" && (
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Full Name</label>
                  <input 
                    type="text" 
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3.5 py-2.5 bg-[#0c0c0e] border border-[#1f1f23] focus:border-indigo-500 rounded-xl outline-none text-xs transition duration-200 font-sans text-slate-100"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Email Address</label>
                <input 
                  type="email" 
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3.5 py-2.5 bg-[#0c0c0e] border border-[#1f1f23] focus:border-indigo-500 rounded-xl outline-none text-xs transition duration-200 font-sans text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Password</label>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-[#0c0c0e] border border-[#1f1f23] focus:border-indigo-500 rounded-xl outline-none text-xs transition duration-200 font-sans text-slate-100"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] transition-all duration-200 font-bold text-xs uppercase tracking-wider rounded-xl text-white shadow-xl shadow-indigo-600/10"
              >
                {authMode === "signin" ? "Sign In" : "Register Account"}
              </button>
            </form>

            <div className="mt-4 text-center border-t border-[#1f1f23] pt-3.5">
              <p className="text-xs text-slate-400">
                {authMode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button 
                  onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
                  className="text-indigo-400 hover:text-indigo-300 hover:underline font-bold transition text-xs"
                >
                  {authMode === "signin" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </div>

          {/* Secure indicator pushed just slightly below the card */}
          <div className="text-center mt-4 text-[9px] text-slate-500 font-mono tracking-wide">
            Secure Workspace &bull; Real-time AI by Gemini
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER ONBOARDING SCREEN
  // -------------------------------------------------------------
  if (profile && !profile.onboarding_completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1d] p-4 text-white">
        <div className="w-full max-w-xl bg-[#121a2e]/90 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
          
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Onboarding Checklist</span>
          </div>

          <h2 className="text-2xl font-bold font-display mb-2">Welcome to your Execution cockpit</h2>
          <p className="text-slate-400 text-sm mb-6">
            Let's configure your companion workspace to align with your immediate goals.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">What is your primary goal right now?</label>
              <input 
                type="text"
                value={onboardGoal}
                onChange={(e) => setOnboardGoal(e.target.value)}
                placeholder="e.g. Launch my startup website"
                className="w-full px-4 py-3 bg-[#0d1424] border border-slate-800 focus:border-blue-500 rounded-xl outline-none text-sm transition font-sans text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Goal Category</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOnboardCustomCategoryActive(!isOnboardCustomCategoryActive);
                      if (!isOnboardCustomCategoryActive) {
                        setOnboardCategory("");
                      } else {
                        setOnboardCategory("work");
                      }
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold uppercase tracking-wider transition font-mono"
                  >
                    {isOnboardCustomCategoryActive ? "Show List" : "+ Custom"}
                  </button>
                </div>
                {isOnboardCustomCategoryActive ? (
                  <input
                    type="text"
                    required
                    value={onboardCategory === "work" || onboardCategory === "__custom__" ? "" : onboardCategory}
                    onChange={(e) => setOnboardCategory(e.target.value)}
                    placeholder="e.g. fitness, hobbies"
                    className="w-full px-4 py-3 bg-[#0d1424] border border-slate-800 focus:border-blue-500 rounded-xl outline-none text-sm text-slate-200 transition font-sans"
                  />
                ) : (
                  <select 
                    value={onboardCategory}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") {
                        setIsOnboardCustomCategoryActive(true);
                        setOnboardCategory("");
                      } else {
                        setOnboardCategory(e.target.value);
                      }
                    }}
                    className="w-full px-4 py-3 bg-[#0d1424] border border-slate-800 rounded-xl outline-none text-sm text-slate-300"
                  >
                    <option value="work">Work & SaaS</option>
                    <option value="learning">Learning & Code</option>
                    <option value="health">Health & Bio</option>
                    <option value="finance">Finance</option>
                    <option value="personal">Personal</option>
                    <option value="__custom__">+ Add Custom Category...</option>
                  </select>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Daily Focus Block</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOnboardCustomTimeActive(!isOnboardCustomTimeActive);
                      if (!isOnboardCustomTimeActive) {
                        setOnboardTime(30); // Default custom minutes
                      } else {
                        setOnboardTime(25);
                      }
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold uppercase tracking-wider transition font-mono"
                  >
                    {isOnboardCustomTimeActive ? "Show List" : "+ Custom"}
                  </button>
                </div>
                {isOnboardCustomTimeActive ? (
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      required
                      min={1}
                      max={480}
                      value={onboardTime}
                      onChange={(e) => setOnboardTime(Math.max(1, Number(e.target.value)))}
                      placeholder="e.g. 45"
                      className="w-full px-4 py-3 bg-[#0d1424] border border-slate-800 focus:border-blue-500 rounded-xl outline-none text-sm text-slate-200 transition font-sans pr-16"
                    />
                    <span className="absolute right-4 text-xs font-mono text-slate-500">minutes</span>
                  </div>
                ) : (
                  <select 
                    value={onboardTime}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") {
                        setIsOnboardCustomTimeActive(true);
                        setOnboardTime(30);
                      } else {
                        setOnboardTime(Number(e.target.value));
                      }
                    }}
                    className="w-full px-4 py-3 bg-[#0d1424] border border-slate-800 rounded-xl outline-none text-sm text-slate-300"
                  >
                    <option value={25}>25 minutes (Standard)</option>
                    <option value={50}>50 minutes (Deep Work)</option>
                    <option value={90}>90 minutes (Ultra-Focus)</option>
                    <option value="__custom__">+ Add Custom Time...</option>
                  </select>
                )}
              </div>
            </div>

            <button
              onClick={handleOnboardingSubmit}
              disabled={!onboardGoal.trim()}
              className="w-full py-3.5 mt-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition font-medium text-sm rounded-xl text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Workspace Initialization
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER APP CHASSIS
  // -------------------------------------------------------------
  return (
    <div className={`min-h-screen flex ${isDark ? "bg-[#09090b] text-slate-100" : "bg-slate-50 text-slate-800"} font-sans transition-all duration-300 relative overflow-x-hidden`}>
      
      {/* Mobile Sidebar backdrop/overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* ----------------- SIDEBAR ----------------- */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto transform ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 md:static md:flex flex-col justify-between border-r ${
        styles.sidebar
      } p-5 transition-transform duration-300 ease-out shrink-0`}>
        <div className="space-y-8">
          {/* Logo with tech accent and mobile close button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <span className="text-white font-extrabold text-base">P</span>
              </div>
              <div>
                <span className={`text-lg font-black tracking-tight font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>PlanAhead</span>
                <span className={`block text-[9px] font-mono tracking-widest uppercase ${isDark ? 'text-indigo-400' : 'text-indigo-600'} font-bold`}>{t("execution_engine")}</span>
              </div>
            </div>

            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 md:hidden transition active:scale-95 cursor-pointer"
              title="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
              { id: "planner", label: t("planner"), icon: Target },
              { id: "calendar", label: t("calendar"), icon: Calendar },
              { id: "focus", label: t("focus"), icon: Timer },
              { id: "momentum", label: t("momentum"), icon: Zap },
              { id: "agent", label: t("agent"), icon: Sparkles },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                    isActive ? styles.navBtnActive : styles.navBtnInactive
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? ("scale-110 " + (isDark ? "text-indigo-400" : "text-indigo-600")) : (isDark ? "text-slate-400 group-hover:text-slate-200" : "text-slate-500 group-hover:text-slate-900")}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Language Change Feature */}
          <div className={`mt-5 p-3.5 rounded-2xl border transition-all ${
            isDark 
              ? "bg-[#141416]/60 border-slate-800/40" 
              : "bg-slate-50 border-slate-200 shadow-3xs"
          }`}>
            <span className={`block text-[10px] font-bold uppercase tracking-wider font-mono mb-2 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}>
              {t("companion_lang")}
            </span>
            <select
              value={voiceLanguageCode}
              onChange={(e) => setVoiceLanguageCode(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none transition-all ${
                isDark 
                  ? "bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500" 
                  : "bg-white border-slate-200 text-slate-700 focus:border-indigo-500 shadow-2xs"
              }`}
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bottom stats and profile with beautiful design */}
        <div className={`space-y-5 pt-5 border-t ${isDark ? "border-[#1f1f23]/80" : "border-slate-200"}`}>
          
          {/* Momentum level widget in Sidebar */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark 
              ? "bg-gradient-to-r from-indigo-950/20 to-violet-950/10 border-indigo-500/20 text-indigo-300" 
              : "bg-indigo-50/60 border-indigo-100 text-indigo-800"
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <p className={`text-[9px] uppercase font-bold tracking-widest font-mono ${isDark ? "text-indigo-300" : "text-indigo-700"}`}>
                {t("momentum_lvl")} {Math.floor(momentum.total_xp / 1000) + 1}
              </p>
              <p className={`text-[9px] font-mono font-bold ${isDark ? "text-slate-500" : "text-indigo-500"}`}>{t("xp_level")}</p>
            </div>
            <div className={`w-full ${isDark ? "bg-[#18181b]" : "bg-indigo-200/40"} h-1.5 rounded-full overflow-hidden`}>
              <div 
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-500" 
                style={{ width: `${((momentum.total_xp % 1000) / 1000) * 100}%` }}
              />
            </div>
            <p className={`text-[10px] mt-2 font-mono font-medium ${isDark ? "text-slate-400" : "text-indigo-700"}`}>
              {momentum.total_xp % 1000} <span className={isDark ? "text-slate-600" : "text-indigo-300"}>/</span> 1000 XP
            </p>
          </div>

          <div className="space-y-2.5">
            <span className={`text-[10px] font-bold tracking-widest uppercase font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t("aesthetic_mode")}</span>
            
            <div className="flex flex-col gap-2">
              {/* Premium Polish (Default) vs Classic (Optional) */}
              <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl border transition-all ${
                isDark 
                  ? "bg-[#121214] border-[#27272a]/50" 
                  : "bg-slate-100 border-slate-200"
              }`}>
                <button
                  onClick={() => setIsPremiumUI(true)}
                  className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    isPremiumUI
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isDark
                        ? "text-slate-400 hover:text-indigo-400 hover:bg-[#18181b]/30"
                        : "text-slate-600 hover:text-indigo-600 hover:bg-slate-200/30"
                  }`}
                  title="Enable the default, highly polished Premium UI theme"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{t("polish_default")}</span>
                </button>
                <button
                  onClick={() => setIsPremiumUI(false)}
                  className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    !isPremiumUI
                      ? "bg-indigo-600 text-white shadow-sm border border-indigo-600"
                      : isDark
                        ? "text-slate-400 hover:text-indigo-400 hover:bg-[#18181b]/30"
                        : "text-slate-600 hover:text-indigo-600 hover:bg-slate-200/30"
                  }`}
                  title="Switch to the optional Classic look"
                >
                  <Layout className="w-3 h-3" />
                  <span>{t("classic_opt")}</span>
                </button>
              </div>

              {/* Theme Selector */}
              <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl border transition-all ${
                isDark 
                  ? "bg-[#121214] border-[#27272a]/50" 
                  : "bg-slate-100 border-slate-200"
              }`}>
                <button
                  onClick={() => setTheme("light")}
                  className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    !isDark
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isDark
                        ? "text-slate-400 hover:text-indigo-400 hover:bg-[#18181b]/30"
                        : "text-slate-600 hover:text-indigo-600 hover:bg-slate-200/30"
                  }`}
                >
                  <Sun className="w-3 h-3" />
                  <span>{t("light")}</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    isDark
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isDark
                        ? "text-slate-400 hover:text-indigo-400 hover:bg-[#18181b]/30"
                        : "text-slate-600 hover:text-indigo-600 hover:bg-slate-200/30"
                  }`}
                >
                  <Moon className="w-3 h-3" />
                  <span>{t("dark")}</span>
                </button>
              </div>
            </div>
          </div>

          <div 
            className="flex items-center gap-3 relative"
            onMouseEnter={() => setShowProfilePopover(true)}
            onMouseLeave={() => setShowProfilePopover(false)}
          >
            {/* Clickable Profile Login ID Area - Opens login details inside app */}
            <div 
              id="profile-details-toggle"
              onClick={() => {
                setActiveTab("profile");
                setShowProfilePopover(false);
                setIsMobileMenuOpen(false);
              }}
              className={`flex-1 flex items-center gap-2.5 min-w-0 p-1 rounded-xl cursor-pointer transition-all duration-200 ${
                isDark 
                  ? "hover:bg-slate-900/60" 
                  : "hover:bg-slate-100/80"
              }`}
              title="Click to view profile details inside the app"
            >
              <img 
                src={profile?.avatar_url || "https://api.dicebear.com/7.x/adventurer/svg?seed=Explorer"} 
                alt="Avatar" 
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className={`block text-xs font-bold truncate ${isDark ? "text-slate-200" : "text-slate-900"}`}>{profile?.full_name}</span>
                <span className={`block text-[9px] truncate font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>{profile?.email}</span>
              </div>
            </div>

            {/* Profile Popover Details */}
            <AnimatePresence>
              {showProfilePopover && (
                <motion.div 
                  id="profile-details-popover"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className={`absolute bottom-14 left-0 right-0 border rounded-3xl shadow-2xl p-4.5 z-50 ${
                    isDark 
                      ? "bg-[#121214] border-[#27272a] text-white" 
                      : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/20">
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest font-mono ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                      User Profile Details
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowProfilePopover(false);
                      }} 
                      className="text-slate-400 hover:text-indigo-600 transition"
                    >
                       <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-3 mb-4">
                    <img 
                      src={profile?.avatar_url || "https://api.dicebear.com/7.x/adventurer/svg?seed=Explorer"} 
                      alt="Avatar Large" 
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-indigo-500 object-cover shadow-md"
                    />
                    <div className="w-full min-w-0">
                      <h4 className="text-sm font-bold font-display truncate w-full" title={profile?.full_name}>
                        {profile?.full_name || "Gaurav Kumar Tripathi"}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate w-full" title={profile?.email}>
                        {profile?.email}
                      </p>
                    </div>
                  </div>

                  <div className={`space-y-2.5 p-3 rounded-2xl text-[11px] font-mono mb-4 border ${
                    isDark ? "bg-[#18181b]/50 border-slate-800/60" : "bg-slate-50 border-slate-100"
                  }`}>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400">User ID:</span>
                      <span className="text-right truncate max-w-[100px] font-medium" title={profile?.id || profile?.clerk_user_id}>
                        {profile?.id || profile?.clerk_user_id || "local-user"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-emerald-500 font-bold">Active</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400">Onboarding:</span>
                      <span className={profile?.onboarding_completed ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                        {profile?.onboarding_completed ? "Completed" : "Pending"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400">Auth Method:</span>
                      <span className="text-indigo-500 font-semibold truncate max-w-[100px]" title={googleAccessToken ? "Google OAuth" : "Password"}>
                        {googleAccessToken ? "Google OAuth" : "Password"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProfilePopover(false);
                      signOut();
                    }}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
                  >
                    Sign Out Account
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notifications toggle button */}
            <button 
              id="notifications-button"
              onClick={() => setShowNotifPopover(!showNotifPopover)}
              className={`relative p-2 rounded-xl transition duration-200 ${isDark ? "bg-[#18181b] hover:bg-slate-800 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
            >
              <Bell className="w-3.5 h-3.5" />
              {notifications.some(n => !n.read) && (
                <span className={`absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 ${isDark ? "border-[#09090b]" : "border-white"}`} />
              )}
            </button>

            {/* Notifications Popover: Positions correctly and responsively */}
            <AnimatePresence>
              {showNotifPopover && (
                <motion.div 
                  id="notifications-popover"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className={`absolute bottom-14 left-0 right-0 border rounded-3xl shadow-2xl p-4 z-50 ${isDark ? "bg-[#121214] border-[#27272a] text-white" : "bg-white border-slate-200 text-slate-800"}`}
                >
                  <div className="flex items-center justify-between mb-3.5">
                    <span className={`text-xs font-extrabold uppercase tracking-widest font-mono ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>Workspace Alerts</span>
                    <button onClick={() => setShowNotifPopover(false)} className="text-slate-500 hover:text-indigo-600 transition">
                       <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4 italic">No alerts yet.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 rounded-2xl text-xs border ${isDark ? "bg-[#18181b] border-slate-800/80" : "bg-slate-50 border-slate-100"}`}>
                          <span className={`font-bold block ${isDark ? "text-indigo-400" : "text-indigo-600"} mb-1`}>{n.title}</span>
                          <p className={`text-[11px] leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={signOut}
            className={`w-full py-2.5 rounded-xl border text-[10px] font-bold tracking-wider uppercase transition flex items-center justify-center gap-2 ${
              isDark 
                ? "border-slate-800 bg-[#121214] hover:bg-slate-800 hover:text-red-400 text-slate-400" 
                : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:text-red-600 text-slate-600"
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ----------------- MAIN VIEW CONTENT ----------------- */}
      <main className={`flex-1 flex flex-col min-h-screen overflow-y-auto relative ${styles.mainBg}`}>
        
        {/* Header / Command Center */}
        <header className={`h-16 border-b ${styles.header} flex items-center px-4 md:px-6 justify-between shrink-0 z-10 sticky top-0`}>
          <div className="flex items-center gap-3 flex-grow max-w-md">
            {/* Hamburger Toggle (3 lines) on top left corner */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className={`p-2 rounded-xl border md:hidden transition active:scale-95 shrink-0 ${
                isDark ? "border-slate-800 bg-[#121214] text-slate-400 hover:text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
              title="Open Navigation"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Tab Back Button on the left side of the productivity command center */}
            {tabHistory.length > 1 && (
              <button 
                onClick={handleTabBack}
                className={`p-2 rounded-xl border transition-all duration-200 active:scale-95 flex items-center justify-center shrink-0 ${
                  isDark 
                    ? "border-slate-800 bg-[#121214] text-indigo-400 hover:text-indigo-300 hover:border-slate-700 hover:bg-[#18181b]" 
                    : "border-slate-200 bg-white text-indigo-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                }`}
                title="Go to Previous Tab"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <form onSubmit={handleCmdBarSubmit} className="flex-grow">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500 text-xs font-mono">⌘</span>
                <input 
                  type="text" 
                  placeholder="Productivity Command Center..." 
                  value={cmdBarText}
                  onChange={(e) => setCmdBarText(e.target.value)}
                  className={`w-full ${isPremiumUI ? (isDark ? "bg-[#0c0d12]/80 border-slate-800/80 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 text-slate-200" : "bg-[#f8fafc]/90 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-800 shadow-inner-sm") : (isDark ? "bg-[#18181b] border-slate-800 text-slate-200" : "bg-slate-100 border-slate-200 text-slate-800")} border rounded-full py-1.5 pl-9 pr-4 text-xs focus:outline-none transition-all`} 
                />
              </div>
            </form>
          </div>

          <div className="flex items-center gap-2 md:gap-3 ml-2">
            {/* Notifications Button in place of AI Sync */}
            <div className="relative">
              <button 
                id="header-notifications-toggle"
                onClick={() => setShowNotifPopover(!showNotifPopover)}
                className={`w-7 h-7 rounded-full ${isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white" : "bg-slate-200 border-slate-300 text-slate-600 hover:bg-slate-300"} border flex items-center justify-center shrink-0 transition duration-200 hover:scale-105 active:scale-95 relative`}
                title="Notifications"
              >
                <Bell className="w-3.5 h-3.5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {/* Notifications Popover: positions responsively below the header button */}
              <AnimatePresence>
                {showNotifPopover && (
                  <motion.div 
                    id="header-notifications-popover"
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className={`absolute top-9 right-0 w-80 border rounded-3xl shadow-2xl p-4.5 z-50 ${isDark ? "bg-[#121214] border-[#27272a] text-white" : "bg-white border-slate-200 text-slate-800"}`}
                  >
                    <div className="flex items-center justify-between mb-3.5">
                      <span className={`text-xs font-extrabold uppercase tracking-widest font-mono ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>Workspace Alerts</span>
                      <button onClick={() => setShowNotifPopover(false)} className="text-slate-500 hover:text-indigo-600 transition">
                         <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4 italic">No alerts yet.</p>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`p-3 rounded-2xl text-xs border ${isDark ? "bg-[#18181b] border-slate-800/80" : "bg-slate-50 border-slate-100"}`}>
                            <span className={`font-bold block ${isDark ? "text-indigo-400" : "text-indigo-600"} mb-1`}>{n.title}</span>
                            <p className={`text-[11px] leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Change Button in place of Gemini star logo */}
            <button 
              id="header-theme-toggle"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`w-7 h-7 rounded-full ${isDark ? "bg-slate-800 border-slate-700 text-yellow-400 hover:text-yellow-300" : "bg-slate-200 border-slate-300 text-indigo-600 hover:bg-slate-350"} border flex items-center justify-center shrink-0 transition duration-200 hover:scale-105 active:scale-95`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </header>

        <div className="p-3 md:p-6 flex-1">
          {/* Loading overlay for AI generation tasks */}
          <AnimatePresence>
            {isGeneratingAI && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#09090b]/85 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6 text-center"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                  <Cpu className="w-6 h-6 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h3 className="text-lg font-bold font-display text-white mb-2">Automating Plan Decompositions</h3>
                <p className="text-slate-400 text-sm max-w-sm">
                  Gemini is optimizing daily routing lists, analyzing focus block data, and configuring recommendations.
                </p>
                <span className="block mt-4 text-xs font-mono text-indigo-400 tracking-widest animate-pulse">CONNECTING TO GEMINI-3.5-FLASH</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ----------------- TAB: DASHBOARD ----------------- */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Header Area */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/10 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold tracking-widest text-indigo-500 uppercase">AI Execution Companion</span>
                  <h1 className="text-3xl font-bold font-display tracking-tight mt-1">{t("todays_operating_plan")}</h1>
                  <p className={`text-sm mt-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {t("today_subtitle")}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={triggerWeeklyReview}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition active:scale-[0.98] ${
                      isDark 
                        ? "border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300" 
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {t("weekly_review")}
                  </button>
                  <button 
                    onClick={() => setActiveTab("momentum")}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-600/10 transition active:scale-[0.98] flex items-center gap-1.5"
                  >
                    {t("momentum_center")} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Daily Focus Summary Alert Block */}
              <div className={`p-5 border ${styles.card} relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-500/5 via-indigo-500/0 to-violet-500/5`}>
                <div className="flex items-start gap-3.5 max-w-3xl">
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-2xl shrink-0 border border-indigo-500/25">
                    <Target className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"} font-display flex items-center gap-1.5`}>
                      🎯 {t("daily_goal_summary")}
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 rounded font-bold uppercase tracking-wider">
                        {t("active_today")}
                      </span>
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      {t("you_have_goals_1")} <strong className={isDark ? "text-indigo-400" : "text-indigo-600"}>{goals.length} {t("you_have_goals_2")}</strong> {t("you_have_goals_3")} <strong className={isDark ? "text-indigo-400" : "text-indigo-600"}>{tasks.filter(t => t.scheduled_date === new Date().toISOString().split("T")[0]).length} {t("you_have_goals_4")}</strong> {t("you_have_goals_5")} 
                      {tasks.length > 0 ? (
                        <>
                          {" "}{t("highest_priority_target")} <strong className={isDark ? "text-slate-200" : "text-slate-850"}>“{tasks.find(t => t.id === selectedTaskId)?.title || tasks[0].title}”</strong>. 
                        </>
                      ) : (
                        <>
                          {" "}{t("no_active_tasks_yet")}
                        </>
                      )}
                      {" "}{t("maintain_streak_1")} <strong className={isDark ? "text-amber-400" : "text-amber-600"}>{momentum.streak_days}{t("maintain_streak_2")}</strong> {t("maintain_streak_3")} <strong className={isDark ? "text-indigo-400" : "text-indigo-600"}>{customMinutes}m {t("maintain_streak_4")}</strong> {t("maintain_streak_5")}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0">
                  <button 
                    onClick={() => {
                      const firstTask = tasks.find(t => t.id === selectedTaskId) || tasks[0];
                      if (firstTask) setSelectedTaskId(firstTask.id);
                      setActiveTab("focus");
                    }}
                    className="w-full md:w-auto px-4.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/10 transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {t("focus_block_btn")}
                  </button>
                </div>
              </div>

              {/* Bento Grid Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* 1. Next Best Action Card (Large) - Col span 8 */}
                <div className={`col-span-1 md:col-span-8 border ${styles.card} p-6 flex flex-col justify-between`}>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase rounded-full border border-indigo-500/20">
                        {t("ai_recommendation")}
                      </span>
                      <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} text-xs font-mono font-bold uppercase tracking-wider`}>{t("priority_high")}</span>
                    </div>
                    
                    {tasks.length > 0 ? (
                      <>
                        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'} font-display mt-0.5`}>
                          {t("execute_word")} “{tasks.find(t => t.id === selectedTaskId)?.title || tasks[0].title}”
                        </h2>
                        <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm leading-relaxed max-w-lg`}>
                          {tasks.find(t => t.id === selectedTaskId)?.description || "Execution health is declining due to task ambiguity. I've identified several sub-tasks that can be automatically scheduled based on your current velocity."}
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'} font-display`}>{t("create_first_objective")}</h2>
                        <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm leading-relaxed max-w-lg`}>
                          {t("no_active_goals_planner")}
                        </p>
                      </>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    {tasks.length > 0 ? (
                      <button 
                        onClick={() => {
                          setSelectedTaskId(selectedTaskId || tasks[0].id);
                          setActiveTab("focus");
                        }}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-indigo-600/10 cursor-pointer"
                      >
                        Execute Now
                      </button>
                    ) : (
                      <button 
                        onClick={() => setActiveTab("planner")}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-indigo-600/10 cursor-pointer"
                      >
                        Open Planner
                      </button>
                    )}
                    <button 
                      onClick={() => setActiveTab("planner")}
                      className={`px-6 py-2 ${styles.btnSecondary}`}
                    >
                      Details
                    </button>
                  </div>
                </div>

                {/* 2. Health Score Widget (Square) - Col span 4 */}
                <div className={`col-span-1 md:col-span-4 border ${styles.card} p-6 flex flex-col items-center justify-center text-center`}>
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="transparent" className={`${isDark ? 'text-slate-800/60' : 'text-slate-100'}`} />
                      <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="301.59" strokeDashoffset={301.59 - (301.59 * calculatedGlobalHealthScore) / 100} className="text-indigo-500 transition-all duration-500" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{calculatedGlobalHealthScore}</span>
                      <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'} font-bold uppercase tracking-widest font-mono`}>Health</span>
                    </div>
                  </div>
                  <p className={`mt-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} leading-relaxed min-h-[32px]`}>
                    {getHealthDescriptionText(calculatedGlobalHealthScore)}
                  </p>
                </div>

                {/* Today's Hourly Operating Plan Timeline - Col span 12 */}
                <div className={`col-span-1 md:col-span-12 border ${styles.card} p-6`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800/10 dark:border-slate-100/10 pb-4">
                    <div>
                      <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'} font-display flex items-center gap-2`}>
                        <Layers className="w-4 h-4 text-indigo-500 animate-pulse" />
                        Today's Scheduled Operating Plan
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-550'} mt-0.5`}>
                        Optimal timeslots aligned to your personal peak cognitive productivity bands.
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTab("calendar")}
                      className={`px-3 py-1.5 text-xs font-semibold ${styles.btnSecondary} flex items-center gap-1 shrink-0 self-start sm:self-auto`}
                    >
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      Manage Schedule
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                    {TIMESLOTS.map(slot => {
                      const todayStr = new Date().toISOString().split("T")[0];
                      const slotTasks = tasks.filter(t => t.scheduled_date === todayStr && t.scheduled_hour === slot.hour);
                      
                      return (
                        <div 
                          key={slot.hour}
                          className={`p-4 border rounded-2xl flex flex-col justify-between h-[170px] transition-all relative overflow-hidden group ${
                            slotTasks.length > 0 
                              ? isDark 
                                ? "bg-indigo-950/10 border-indigo-500/30 hover:border-indigo-500/50" 
                                : "bg-indigo-50/45 border-indigo-150 hover:border-indigo-300"
                              : isDark 
                                ? "bg-[#0c0c0e]/40 border-slate-800/60 hover:border-slate-700/60" 
                                : "bg-slate-50/80 border-slate-200/80 hover:bg-slate-100/60"
                          }`}
                        >
                          {/* Top row: Label & Energy */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/15 px-2 py-0.5 rounded-md border border-indigo-500/15">
                              {slot.label}
                            </span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded">
                              {slot.energy}
                            </span>
                          </div>

                          {/* Task center display */}
                          <div className="flex-grow flex flex-col justify-center my-1.5">
                            {slotTasks.length > 0 ? (
                              slotTasks.map(t => (
                                <div key={t.id} className="space-y-1">
                                  <span className={`font-bold text-xs line-clamp-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{t.title}</span>
                                  <span className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'} line-clamp-2 leading-relaxed`}>{t.description || "No description provided."}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-2">
                                <span className={`text-[10px] italic block mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No Tasks Scheduled</span>
                                <button 
                                  onClick={() => {
                                    setActiveTab("calendar");
                                  }}
                                  className={`px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider uppercase border border-dashed rounded-lg transition-all ${
                                    isDark 
                                      ? "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600" 
                                      : "border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400"
                                  }`}
                                >
                                  + Assign
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Bottom Row */}
                          <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-2.5 mt-1 flex items-center justify-between">
                            <span className={`text-[9px] font-bold font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {slot.peak}
                            </span>
                            {slotTasks.length > 0 && (
                              <button 
                                onClick={() => {
                                  setSelectedTaskId(slotTasks[0].id);
                                  setActiveTab("focus");
                                }}
                                className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold uppercase tracking-widest rounded-md shadow-sm transition active:scale-95"
                              >
                                Start
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. AI Insights Widget (Tall) - Col span 4 */}
                <div className={`col-span-1 md:col-span-4 border ${styles.card} p-5`}>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <h3 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono`}>AI Insights</h3>
                  </div>
                  <div className="space-y-5">
                    <div className={`border-l-2 ${isDark ? 'border-slate-800' : 'border-slate-200'} pl-4 py-1 hover:border-indigo-500 transition-colors`}>
                      <h4 className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Focus Peak</h4>
                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-1 leading-relaxed`}>Your deep work capacity is 40% higher between 8 AM and 10 AM.</p>
                    </div>
                    <div className={`border-l-2 ${isDark ? 'border-slate-800' : 'border-slate-200'} pl-4 py-1 hover:border-indigo-500 transition-colors`}>
                      <h4 className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Slippage Warning</h4>
                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-1 leading-relaxed`}>
                        {goals.length > 0 ? `Goal "${goals[0].title}" is at risk. Consider allocating 30 mins today.` : 'No critical goals at risk currently. Plan your targets!'}
                      </p>
                    </div>
                    <div className={`border-l-2 ${isDark ? 'border-slate-800' : 'border-slate-200'} pl-4 py-1 hover:border-indigo-500 transition-colors`}>
                      <h4 className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Momentum Bonus</h4>
                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-1 leading-relaxed`}>Complete 2 more tasks to extend your {momentum.streak_days}-day streak.</p>
                    </div>
                  </div>
                </div>
                      {/* 4. Goal Overview (Center Large) - Col span 8 */}
                <div className={`col-span-1 md:col-span-8 border ${styles.card} p-6`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono`}>Active Goals</h3>
                    <button onClick={() => setActiveTab("planner")} className="text-xs text-indigo-400 hover:underline">Manage</button>
                  </div>
                  
                  <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                    {goals.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-xs italic">
                        No active goals in planner.
                      </div>
                    ) : (
                      goals.slice(0, 3).map(g => {
                        const totalTasks = tasks.filter(t => t.goal_id === g.id).length;
                        const compTasks = tasks.filter(t => t.goal_id === g.id && t.status === "completed").length;
                        const calculatedProgress = totalTasks > 0 ? Math.round((compTasks / totalTasks) * 100) : 0;
                        return (
                          <div key={g.id} className={`p-4 ${isDark ? 'bg-slate-800/30' : 'bg-slate-50'} rounded-2xl border ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                            <div className="flex justify-between items-center mb-2">
                               <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'} truncate pr-4`}>{g.title}</span>
                              <span className="text-xs font-mono text-indigo-400 font-bold">{calculatedProgress}%</span>
                            </div>
                            <div className={`w-full ${isDark ? 'bg-slate-900' : 'bg-slate-200'} h-1.5 rounded-full overflow-hidden`}>
                              <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${calculatedProgress}%` }}></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 6. Command Center Card - Col span 12 or 8 */}
                {/* Intelligent Actions & Autopilot */}
                <div className={`col-span-1 md:col-span-8 p-6 border ${styles.card}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      <span className={`text-xs font-bold uppercase tracking-widest font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Execution Intelligence</span>
                    </div>
                    <button 
                      onClick={() => runCommandCenter("autopilot")}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-[0.98] shadow-sm shadow-indigo-600/10"
                    >
                      Run Autopilot
                    </button>
                  </div>

                  <h3 className={`text-xl font-bold mb-4 font-display ${isDark ? 'text-slate-200' : 'text-slate-850'}`}>Execution Actions</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: "prioritize", label: "Prioritize", desc: "Urgency - health - impact" },
                      { id: "schedule", label: "Schedule", desc: "Focus blocks - sync planner" },
                      { id: "recommend", label: "Recommend", desc: "Personal next moves" },
                      { id: "remind", label: "Remind", desc: "Context-aware nudges" },
                      { id: "habits", label: "Habits", desc: "Goals - streaks - routines" },
                    ].map(cmd => (
                      <div 
                        key={cmd.id}
                        className={`p-3 border rounded-2xl flex items-center justify-between transition-all group hover:border-indigo-500/40 hover:bg-indigo-500/5 ${isDark ? "bg-[#0c0c0e]/60 border-slate-800/60" : "bg-slate-50 border-slate-200"}`}
                      >
                        <div>
                          <span className={`font-bold text-xs block group-hover:text-indigo-400 transition-colors ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{cmd.label}</span>
                          <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} block mt-0.5`}>{cmd.desc}</span>
                        </div>
                        <button 
                          onClick={() => runCommandCenter(cmd.id as any)}
                          className={`px-3 py-1 text-[9px] uppercase font-bold tracking-widest rounded-lg border hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all ${isDark ? "border-slate-800 text-slate-400 bg-slate-900/30" : "border-slate-300 text-slate-600 bg-white"}`}
                        >
                          Run
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. Recent Activity - Col span 4 */}
                <div className={`col-span-1 md:col-span-4 p-6 border ${styles.card} flex flex-col justify-between`}>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-widest font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'} block mb-4`}>Recent Activity</span>
                    
                    {focusSessions.length === 0 ? (
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} text-center py-8 italic`}>No focus sessions run yet today.</p>
                    ) : (
                      <div className="space-y-3.5 max-h-[160px] overflow-y-auto pr-1">
                        {focusSessions.slice(0, 3).map(s => (
                          <div key={s.id} className="flex gap-2.5 items-start text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Deep Focus Block Finished</p>
                              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>Completed {s.actual_minutes} minutes &bull; +{s.xp_earned} XP</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-100'} flex justify-between items-center text-xs font-mono`}>
                    <span className="text-slate-500">Workspace status:</span>
                    <span className="text-emerald-500 flex items-center gap-1.5 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      ACTIVE
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}

        {/* ----------------- TAB: GOAL PLANNER ----------------- */}
        {activeTab === "planner" && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/20 pb-6">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-indigo-500 uppercase">Interactive Objective Map</span>
                <h1 className="text-3xl font-bold font-display tracking-tight mt-1">{t("goal_planner_title")}</h1>
                <p className={`text-sm mt-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {t("goal_planner_subtitle")}
                </p>
              </div>

              <button 
                onClick={() => setShowGoalModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition shadow-lg shadow-indigo-600/10 active:scale-[0.98] flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create Goal
              </button>
            </div>

            {/* Goals grid list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map(g => {
                const totalTasks = tasks.filter(t => t.goal_id === g.id).length;
                const compTasks = tasks.filter(t => t.goal_id === g.id && t.status === "completed").length;
                const calculatedProgress = totalTasks > 0 ? Math.round((compTasks / totalTasks) * 100) : 0;
                const calculatedHealth = totalTasks > 0 ? Math.min(100, Math.max(25, Math.round(100 - (totalTasks - compTasks) * 12))) : 100;
                
                return (
                  <div 
                    key={g.id}
                    className={`p-6 border rounded-3xl relative flex flex-col justify-between transition hover:shadow-xl ${
                      selectedGoalId === g.id 
                        ? isDark 
                          ? "bg-slate-900/50 border-indigo-500 shadow-indigo-500/5 shadow-2xl" 
                          : "bg-white border-indigo-600 shadow-lg"
                        : isDark 
                          ? "bg-[#121214]/40 border-[#1f1f23]" 
                          : "bg-white border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono text-[10px] uppercase font-bold border border-indigo-500/20">
                          {g.category}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => deleteGoal(g.id)}
                            className="p-1 hover:text-red-400 text-slate-500 transition"
                            title="Delete Goal"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 
                        onClick={() => setSelectedGoalId(g.id)}
                        className={`text-lg font-bold font-display hover:text-indigo-400 cursor-pointer transition mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}
                      >
                        {g.title}
                      </h3>
                      
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} leading-relaxed mb-4`}>
                        {g.description}
                      </p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-[#1f1f23]/40">
                      {/* Health & progress scores */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono uppercase tracking-wide`}>Health</span>
                          <span className="text-indigo-400 font-bold">{calculatedHealth}%</span>
                        </div>
                        <div className={`w-full ${isDark ? 'bg-[#18181b]' : 'bg-slate-200'} rounded-full h-1`}>
                          <div className="bg-indigo-500 h-full transition-all" style={{ width: `${calculatedHealth}%` }} />
                        </div>
                      </div>

                      <div className={`flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono`}>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Due {g.target_date}
                        </span>
                        <span className="text-emerald-500 font-bold">{calculatedProgress}% progress</span>
                      </div>

                      {/* Decompose list action */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => decomposeGoalAI(g.id)}
                          className={`w-full py-2 text-[11px] font-bold tracking-wider uppercase rounded-xl transition border flex items-center justify-center gap-1.5 ${
                            isDark 
                              ? 'bg-[#121214] hover:bg-[#18181b] border-[#1f1f23] text-slate-300' 
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <Cpu className="w-3.5 h-3.5" /> Decompose AI
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Task Checklist workspace aligned to active goal */}
            {selectedGoalId && (
              <div className={`p-6 border rounded-3xl ${isDark ? "bg-[#121214]/40 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b ${isDark ? "border-slate-800/40" : "border-slate-200"}`}>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Action items for</span>
                    <h3 className="text-lg font-bold font-display text-indigo-400">
                      {goals.find(g => g.id === selectedGoalId)?.title}
                    </h3>
                  </div>
                  <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {filteredTasks.filter(t => t.status === "completed").length} of {filteredTasks.length} objectives finished
                  </span>
                </div>

                {/* Checklist pool */}
                <div className="space-y-3">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-sm italic">
                      No actionable objectives defined yet. Click "Decompose AI" above to generate with Gemini automatically.
                    </div>
                  ) : (
                    filteredTasks.map(t => (
                      <div 
                        key={t.id}
                        className={`p-4 border rounded-xl flex items-center justify-between transition hover:border-indigo-500/40 ${
                          t.status === "completed" 
                            ? isDark
                              ? "opacity-60 border-slate-800/60 bg-[#0c0c0e]/30" 
                              : "opacity-65 border-slate-200 bg-slate-100/60"
                            : isDark 
                              ? "bg-[#0c0c0e] border-slate-800" 
                              : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button 
                            disabled={t.status === "completed"}
                            onClick={() => completeTask(t.id)}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all mt-0.5 ${
                              t.status === "completed" 
                                ? "bg-emerald-500 border-emerald-500 text-white" 
                                : isDark 
                                  ? "border-slate-700 hover:border-indigo-500 text-white" 
                                  : "border-slate-300 bg-white hover:border-indigo-500 text-slate-800"
                            }`}
                          >
                            {t.status === "completed" && <Check className="w-3.5 h-3.5" />}
                          </button>
                          
                          <div>
                            <span className={`text-sm font-bold block ${t.status === "completed" ? "line-through text-slate-500" : isDark ? "text-slate-200" : "text-slate-800"}`}>{t.title}</span>
                            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} block mt-0.5`}>{t.description}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                            t.priority === "high" 
                              ? isDark ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-50 text-red-700 border-red-200" 
                              : t.priority === "medium" 
                                ? isDark ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-amber-50 text-amber-700 border-amber-200" 
                                : isDark ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-indigo-50 text-indigo-700 border-indigo-150"
                          }`}>
                            {t.priority}
                          </span>
                          
                          {t.is_ai_generated && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[9px] font-mono uppercase font-semibold">
                              AI
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add standard task manual form */}
                <form onSubmit={handleCreateTask} className="mt-5 flex gap-3">
                  <input 
                    type="text"
                    placeholder="Enter manual objective description..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className={`flex-grow px-4 py-2.5 border rounded-xl outline-none text-sm transition focus:border-indigo-500 ${
                      isDark 
                        ? "bg-[#0c0c0e] border-slate-800 text-slate-200" 
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                  
                  <select 
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className={`px-3 border rounded-xl text-xs outline-none focus:border-indigo-500 ${
                      isDark 
                        ? "bg-[#0c0c0e] border-slate-800 text-slate-300" 
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase rounded-xl transition shadow-lg shadow-indigo-600/10"
                  >
                    Add Task
                  </button>
                </form>

                {newTaskTitle.trim().length >= 4 && (
                  <div className={`mt-2 p-3 border rounded-xl flex items-center justify-between text-xs gap-3 ${
                    isDark ? "bg-[#18181b]/40 border-slate-800/60" : "bg-slate-50/50 border-slate-200"
                  }`}>
                    {isSuggestingCategory ? (
                      <span className="flex items-center gap-1.5 text-slate-400 font-mono animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                        AI is analyzing task title for goal category suggestion...
                      </span>
                    ) : suggestedCategory ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                          Suggested Category: 
                          <span className={`px-2 py-0.5 rounded font-mono font-bold uppercase text-[9px] border ${
                            suggestedCategory === "work" 
                              ? isDark ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : suggestedCategory === "learning"
                                ? isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : suggestedCategory === "health"
                                  ? isDark ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-700 border-rose-200"
                                  : suggestedCategory === "finance"
                                    ? isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-200"
                                    : isDark ? "bg-slate-500/10 text-slate-400 border-slate-500/20" : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>
                            {suggestedCategory}
                          </span>
                        </span>

                        {(() => {
                          const matchingGoals = goals.filter(g => g.category.toLowerCase() === suggestedCategory.toLowerCase());
                          if (matchingGoals.length > 0) {
                            const currentGoal = goals.find(g => g.id === selectedGoalId);
                            if (currentGoal && currentGoal.category.toLowerCase() !== suggestedCategory.toLowerCase()) {
                              return (
                                <span className="text-[11px] text-slate-400">
                                  Better matches:{" "}
                                  {matchingGoals.map((mg, idx) => (
                                    <React.Fragment key={mg.id}>
                                      {idx > 0 && ", "}
                                      <button
                                        type="button"
                                        onClick={() => setSelectedGoalId(mg.id)}
                                        className="text-indigo-500 hover:text-indigo-400 underline font-semibold cursor-pointer"
                                      >
                                        "{mg.title}"
                                      </button>
                                    </React.Fragment>
                                  ))}
                                </span>
                              );
                            }
                          } else {
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCustomCategoryActive(false);
                                  setNewGoalCategory(suggestedCategory);
                                  setNewGoalTitle(`Achieve ${suggestedCategory.charAt(0).toUpperCase() + suggestedCategory.slice(1)} milestone`);
                                  setShowGoalModal(true);
                                }}
                                className="text-[11px] text-indigo-500 hover:text-indigo-400 underline font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                + Create a goal in this category
                              </button>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ) : null}
                  </div>
                )}

              </div>
            )}

            {/* Goal Creation Modal */}
            <AnimatePresence>
              {showGoalModal && (
                <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`w-full max-w-lg border rounded-2xl shadow-2xl relative overflow-hidden ${isDark ? "bg-[#11192e] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                  >
                    <div className={`flex items-center justify-between p-5 border-b ${isDark ? "border-slate-800/40" : "border-slate-100"}`}>
                      <h3 className="text-lg font-bold font-display">Create Goal Objective</h3>
                      <button onClick={() => setShowGoalModal(false)} className={`transition ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateGoal} className="p-5 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Goal Title</label>
                        <input 
                          type="text" 
                          required
                          value={newGoalTitle}
                          onChange={(e) => setNewGoalTitle(e.target.value)}
                          placeholder="e.g. Master React Native"
                          className={`w-full px-4 py-2.5 border focus:border-indigo-500 rounded-xl outline-none text-sm ${
                            isDark ? "bg-[#0d1424] border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Objective Description</label>
                        <textarea 
                          value={newGoalDesc}
                          onChange={(e) => setNewGoalDesc(e.target.value)}
                          placeholder="What would success look like?"
                          rows={3}
                          className={`w-full px-4 py-2.5 border focus:border-indigo-500 rounded-xl outline-none text-sm resize-none ${
                            isDark ? "bg-[#0d1424] border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Category</label>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomCategoryActive(!isCustomCategoryActive);
                                if (!isCustomCategoryActive) {
                                  setNewGoalCategory("");
                                } else {
                                  setNewGoalCategory("work");
                                }
                              }}
                              className="text-[10px] text-indigo-500 hover:text-indigo-400 flex items-center gap-1 font-semibold uppercase tracking-wider transition font-mono"
                            >
                              {isCustomCategoryActive ? "Show List" : "+ Custom"}
                            </button>
                          </div>
                          {isCustomCategoryActive ? (
                            <input
                              type="text"
                              required
                              value={newGoalCategory === "work" || newGoalCategory === "__custom__" ? "" : newGoalCategory}
                              onChange={(e) => setNewGoalCategory(e.target.value)}
                              placeholder="e.g. fitness, hobbies"
                              className={`w-full px-4 py-2.5 border focus:border-indigo-500 rounded-xl outline-none text-sm ${
                                isDark ? "bg-[#0d1424] border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                            />
                          ) : (
                            <select 
                              value={newGoalCategory}
                              onChange={(e) => {
                                if (e.target.value === "__custom__") {
                                  setIsCustomCategoryActive(true);
                                  setNewGoalCategory("");
                                } else {
                                  setNewGoalCategory(e.target.value);
                                }
                              }}
                              className={`w-full px-4 py-2.5 border focus:border-indigo-500 rounded-xl outline-none text-sm ${
                                isDark ? "bg-[#0d1424] border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                            >
                              <option value="work">Work & SaaS</option>
                              <option value="learning">Learning & Code</option>
                              <option value="health">Health & Bio</option>
                              <option value="finance">Finance</option>
                              <option value="personal">Personal</option>
                              <option value="__custom__">+ Add Custom Category...</option>
                            </select>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Target Date</label>
                          <input 
                            type="date" 
                            value={newGoalDate}
                            onChange={(e) => setNewGoalDate(e.target.value)}
                            className={`w-full px-4 py-2.5 border focus:border-indigo-500 rounded-xl outline-none text-sm ${
                              isDark ? "bg-[#0d1424] border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Tags (comma separated)</label>
                        <input 
                          type="text" 
                          value={newGoalTags}
                          onChange={(e) => setNewGoalTags(e.target.value)}
                          placeholder="e.g. mobile, swift, production"
                          className={`w-full px-4 py-2.5 border focus:border-indigo-500 rounded-xl outline-none text-sm ${
                            isDark ? "bg-[#0d1424] border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-indigo-600/10 cursor-pointer"
                      >
                        Create Goal
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* ----------------- TAB: AI SCHEDULER & CALENDAR ----------------- */}
        {activeTab === "calendar" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/10 pb-4">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-indigo-500 uppercase">Interactive Deadline Shield</span>
                <h1 className="text-3xl font-bold font-display tracking-tight mt-1">{t("ai_scheduler_title")}</h1>
                <p className={`text-sm mt-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {t("ai_scheduler_subtitle")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={async () => {
                    setIsAutoScheduling(true);
                    setScheduleExplanation("");
                    try {
                      const daysList = getNext7Days().map(d => d.dateString);
                      const pending = tasks.filter(t => t.status === "pending");
                      if (pending.length === 0) {
                        setScheduleExplanation("No pending tasks to schedule! Create a task first in the Goal Planner.");
                        setIsAutoScheduling(false);
                        return;
                      }
                      const res = await fetch("/api/schedule/suggest", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tasks: pending, days: daysList })
                      });
                      const data = await res.json();
                      if (data.tasks) {
                        data.tasks.forEach((item: any) => {
                          updateTask(item.id, {
                            scheduled_date: item.scheduled_date,
                            scheduled_hour: item.scheduled_hour
                          });
                        });
                        setScheduleExplanation(data.explanation || "AI Scheduler successfully prioritized your high-intensity tasks.");
                      }
                    } catch (e) {
                      console.error(e);
                      setScheduleExplanation("Error connecting to scheduler service. Defaulting to priority slots.");
                    } finally {
                      setIsAutoScheduling(false);
                    }
                  }}
                  disabled={isAutoScheduling}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-lg shadow-indigo-600/10 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                >
                  {isAutoScheduling ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {isAutoScheduling ? "Generating Layout..." : "AI Auto-Schedule"}
                </button>

                <button
                  onClick={() => {
                    // Reset all schedules for testing
                    tasks.forEach(t => {
                      updateTask(t.id, { scheduled_date: undefined, scheduled_hour: undefined });
                    });
                    setScheduleExplanation("Cleared all timeslots. Ready for AI Auto-Schedule.");
                  }}
                  className={`px-3 py-2.5 text-xs font-semibold rounded-xl border transition ${
                    isDark 
                      ? "bg-slate-800/40 hover:bg-slate-800 border-slate-800 text-slate-300" 
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs"
                  }`}
                >
                  Clear Board
                </button>
              </div>
            </div>

            {/* Calendar View Option Tabs */}
            <div className={`flex border-b gap-6 mb-6 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <button
                onClick={() => setSchedulerSubTab("peaks")}
                className={`pb-3 text-xs font-bold uppercase tracking-wider font-mono transition-all relative ${
                  schedulerSubTab === "peaks" 
                    ? "text-indigo-500 border-b-2 border-indigo-500 font-semibold" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Cognitive Peak Hours
              </button>
              <button
                onClick={() => setSchedulerSubTab("google")}
                className={`pb-3 text-xs font-bold uppercase tracking-wider font-mono transition-all relative ${
                  schedulerSubTab === "google" 
                    ? "text-indigo-500 border-b-2 border-indigo-500 font-semibold" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Google Calendar View
              </button>
            </div>

            {schedulerSubTab === "google" ? (
              <GoogleCalendarView />
            ) : (
              <>

            {/* AI Explanation Insight banner */}
            {scheduleExplanation && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs rounded-2xl flex items-start gap-2.5 font-sans leading-relaxed"
              >
                <div className="p-1 bg-indigo-500/20 rounded-lg shrink-0 text-indigo-400 font-bold">💡 AI SCHEDULE INSIGHT</div>
                <div>{scheduleExplanation}</div>
              </motion.div>
            )}

            {/* Deadline Crisis Alert Panel (The Last-Minute Life Saver) */}
            {(() => {
              const now = new Date();
              // Unscheduled tasks with due dates in next 3 days
              const criticalTasks = tasks.filter(t => {
                if (t.status === "completed" || t.scheduled_date) return false;
                const dueDate = new Date(t.due_date);
                const diffTime = dueDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= -1 && diffDays <= 3;
              });

              if (criticalTasks.length === 0) return null;

              return (
                <div className={`relative overflow-hidden bg-gradient-to-r ${isDark ? "from-red-500/10 to-amber-500/5 border-red-500/20" : "from-red-50 to-amber-50/50 border-red-200"} border rounded-3xl p-6 shadow-lg shadow-red-500/5 animate-pulse-subtle`}>
                  <div className={`absolute right-0 top-0 text-[100px] font-black ${isDark ? "text-red-500/5" : "text-red-500/[0.02]"} select-none pointer-events-none font-mono`}>CRISIS</div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-500/20 rounded-xl text-red-500 animate-bounce">
                      <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono tracking-widest font-bold text-red-500 uppercase">Last-Minute Life Saver Alert</span>
                      <h4 className={`text-base font-bold font-display ${isDark ? "text-slate-100" : "text-slate-900"}`}>Active Deadline Threats Detected ({criticalTasks.length})</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {criticalTasks.map(ct => {
                      const daysLeft = Math.ceil((new Date(ct.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      const labelText = daysLeft === 0 ? "Due Today!" : daysLeft === 1 ? "Due Tomorrow!" : `Due in ${daysLeft} days!`;
                      
                      return (
                        <div key={ct.id} className={`p-4 border rounded-2xl flex flex-col justify-between gap-3 ${
                          isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-red-100 shadow-xs"
                        }`}>
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                                isDark ? "bg-red-500/15 text-red-400 border-red-500/20" : "bg-red-50 text-red-700 border-red-200"
                              }`}>
                                {labelText}
                              </span>
                              <span className={`text-[10px] font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>Due {ct.due_date}</span>
                            </div>
                            <h5 className={`text-sm font-bold mt-2 truncate ${isDark ? "text-white" : "text-slate-900"}`}>{ct.title}</h5>
                            <p className={`text-xs mt-1 line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{ct.description || "Unscheduled priority commitment."}</p>
                          </div>

                          <button
                            onClick={() => {
                              // Shield Task: schedule immediately to the closest open Peak Focus slot (9 AM) in the calendar
                              const next7 = getNext7Days();
                              const availableDay = next7[0].dateString; // Today
                              updateTask(ct.id, {
                                scheduled_date: availableDay,
                                scheduled_hour: 9
                              });
                              // Add success notification
                              addTask({
                                goal_id: ct.goal_id,
                                title: `Shielded: ${ct.title}`,
                                description: "Crisis averted! Task successfully scheduled into today's 9 AM Peak Focus slot.",
                                priority: "high",
                                status: "completed",
                                estimated_minutes: 0,
                                is_ai_generated: true,
                                due_date: ct.due_date
                              });
                            }}
                            className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-[0.98]"
                          >
                            Shield This Task (Auto-Schedule)
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Split layout: Calendar Grid vs. Unscheduled Task Pool */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              
              {/* Massive 7-Day Scheduler Grid */}
              <div className="xl:col-span-3 space-y-4">
                <div className={`overflow-x-auto border rounded-3xl ${isDark ? "bg-[#121214]/30 border-slate-800" : "bg-white border-slate-200"}`}>
                  <table className="w-full min-w-[800px] border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-slate-800/10">
                        {/* Time slot label header */}
                        <th className="w-48 p-4 text-left text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">Cognitive Peaks</th>
                        {/* 7 Days columns */}
                        {getNext7Days().map(day => {
                          const isToday = new Date().toISOString().split("T")[0] === day.dateString;
                          return (
                            <th key={day.dateString} className={`p-4 text-center border-l ${isDark ? 'border-slate-800/40' : 'border-slate-200/50'} ${isToday ? 'bg-indigo-500/5' : ''}`}>
                              <span className={`block text-[10px] font-bold uppercase font-mono tracking-widest ${isToday ? 'text-indigo-400' : 'text-slate-500'}`}>
                                {day.dayLabel}
                              </span>
                              <span className={`block text-xl font-black font-display tracking-tight mt-0.5 ${isToday ? 'text-indigo-400' : isDark ? 'text-white' : 'text-slate-900'}`}>
                                {day.dateLabel}
                              </span>
                              <span className="block text-[9px] text-slate-500 uppercase tracking-widest font-mono">{day.monthLabel}</span>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {TIMESLOTS.map(slot => (
                        <tr key={slot.hour} className={`border-b ${isDark ? "border-slate-800/10 hover:bg-slate-800/5" : "border-slate-100 hover:bg-slate-50/50"} transition-colors`}>
                          {/* Time label column details */}
                          <td className="p-4 align-top">
                            <div className={`font-bold text-xs font-mono tracking-tight ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>{slot.label}</div>
                            <div className="text-[10px] font-black uppercase font-mono text-slate-400 mt-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                              {slot.peak}
                            </div>
                            <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold ${
                              isDark ? "bg-slate-850 text-slate-400" : "bg-slate-100 border border-slate-200 text-slate-600"
                            }`}>
                              {slot.energy}
                            </span>
                            <p className="text-[10px] text-slate-500 leading-normal mt-2 font-sans">{slot.desc}</p>
                          </td>

                          {/* 7 columns for matching days */}
                          {getNext7Days().map(day => {
                            const matchingTasks = tasks.filter(t => t.scheduled_date === day.dateString && t.scheduled_hour === slot.hour);
                            const isToday = new Date().toISOString().split("T")[0] === day.dateString;

                            return (
                              <td 
                                key={day.dateString} 
                                className={`p-2.5 align-top border-l relative group ${isDark ? 'border-slate-800/40' : 'border-slate-200/50'} ${isToday ? 'bg-indigo-500/5' : ''}`}
                              >
                                <div className="space-y-2 min-h-[90px]">
                                  {matchingTasks.map(t => {
                                    const matchingGoal = goals.find(g => g.id === t.goal_id);
                                    const isHigh = t.priority === "high";
                                    const isMed = t.priority === "medium";
                                    
                                    return (
                                      <div
                                        key={t.id}
                                        className={`p-3 border rounded-xl relative transition hover:scale-[1.02] active:scale-[0.99] group shadow-sm flex flex-col justify-between ${
                                          t.status === "completed"
                                            ? isDark 
                                              ? "bg-slate-900/30 border-slate-800/50 opacity-50" 
                                              : "bg-slate-100 border-slate-200 text-slate-500 opacity-60"
                                            : isHigh
                                              ? isDark 
                                                ? "bg-red-950/20 border-red-500/20 text-red-200 hover:border-red-500/40" 
                                                : "bg-red-50 border-red-150 text-red-800 hover:border-red-300 hover:bg-red-100/30 shadow-xs"
                                              : isMed
                                                ? isDark 
                                                  ? "bg-amber-950/20 border-amber-500/20 text-amber-200 hover:border-amber-500/40" 
                                                  : "bg-amber-50 border-amber-150 text-amber-800 hover:border-amber-300 hover:bg-amber-100/30 shadow-xs"
                                                : isDark 
                                                  ? "bg-blue-950/20 border-blue-500/20 text-blue-200 hover:border-blue-500/40" 
                                                  : "bg-indigo-50 border-indigo-150 text-indigo-800 hover:border-indigo-300 hover:bg-indigo-100/30 shadow-xs"
                                        }`}
                                      >
                                        <div>
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-slate-500 truncate max-w-[60px]">
                                              {matchingGoal ? matchingGoal.title : "Workspace"}
                                            </span>
                                            <button
                                              onClick={() => {
                                                // Unschedule
                                                updateTask(t.id, { scheduled_date: undefined, scheduled_hour: undefined });
                                              }}
                                              className="p-0.5 text-slate-500 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                              title="Unschedule"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                          <h5 className={`text-xs font-bold tracking-tight line-clamp-2 ${
                                            t.status === "completed" 
                                              ? "line-through text-slate-400" 
                                              : isDark ? "text-slate-100" : "text-slate-900"
                                          }`}>
                                            {t.title}
                                          </h5>
                                        </div>

                                        <div className={`flex items-center justify-between mt-3 pt-2 border-t ${isDark ? "border-slate-800/30" : "border-slate-200/50"}`}>
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-[9px] font-mono text-slate-500 font-semibold">{t.estimated_minutes}m</span>
                                            {googleAccessToken && (
                                              t.google_event_id ? (
                                                <span className="text-[8px] font-mono font-bold text-emerald-500 shrink-0" title="Synced to Google Calendar">
                                                  ● GCal
                                                </span>
                                              ) : (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    syncToGoogleCalendar(t);
                                                  }}
                                                  disabled={syncingTaskId === t.id}
                                                  className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition shrink-0 ${
                                                    isDark 
                                                      ? "bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 border border-indigo-500/20" 
                                                      : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
                                                  }`}
                                                  title="Sync to Google Calendar"
                                                >
                                                  {syncingTaskId === t.id ? "..." : "Sync"}
                                                </button>
                                              )
                                            )}
                                          </div>
                                          <button
                                            onClick={() => {
                                              if (t.status === "pending") {
                                                completeTask(t.id);
                                              }
                                            }}
                                            disabled={t.status === "completed"}
                                            className={`p-1 rounded-md transition ${
                                              t.status === "completed" 
                                                ? "bg-emerald-500/10 text-emerald-400" 
                                                : isDark 
                                                  ? "bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white" 
                                                  : "bg-slate-100 hover:bg-emerald-600 text-slate-600 hover:text-white border border-slate-200"
                                            }`}
                                          >
                                            <Check className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* Quick slot placement trigger */}
                                  <button
                                    onClick={() => setSelectedScheduleCell({ dateString: day.dateString, hour: slot.hour })}
                                    className={`w-full h-8 border border-dashed rounded-xl flex items-center justify-center transition opacity-0 group-hover:opacity-100 duration-150 ${
                                      isDark 
                                        ? "border-slate-800/60 text-slate-600 hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/5" 
                                        : "border-slate-300 text-slate-400 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50/50"
                                    }`}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sidebar: Unscheduled Task Inventory */}
              <div className="space-y-6">
                
                {/* Voice command fast dispatch widget */}
                <div className={`p-6 border rounded-3xl ${isDark ? "bg-[#121214]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Mic className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400">Voice Commander</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                    Say "Schedule defined tasks" or "Create a task to audit landing pages" to program your workspace.
                  </p>
                  
                  <div className="space-y-2">
                    <button
                      onClick={toggleVoiceRecording}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-[0.98] ${
                        isVoiceRecording
                          ? "bg-red-600 animate-pulse text-white font-bold cursor-pointer"
                          : isDark
                            ? "bg-indigo-600/15 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 cursor-pointer"
                            : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer shadow-xs"
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      {isVoiceRecording ? "Listening..." : "Speak Intent Command"}
                    </button>
                    {voiceText && (
                      <div className={`p-3 border rounded-xl text-[11px] font-mono italic ${
                        isDark ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}>
                        "{voiceText}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Inventory Card */}
                <div className={`p-6 border rounded-3xl ${isDark ? "bg-[#121214]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                  <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400 block mb-3">Unscheduled Inventory</span>
                  
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {tasks.filter(t => !t.scheduled_date && t.status === "pending").length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-xs italic">
                        All pending tasks are locked in timeslots!
                      </div>
                    ) : (
                      tasks.filter(t => !t.scheduled_date && t.status === "pending").map(t => {
                        const isHigh = t.priority === "high";
                        const isMed = t.priority === "medium";
                        
                        return (
                          <div 
                            key={t.id}
                            className={`p-3.5 border rounded-xl hover:scale-[1.01] transition-all ${
                              isDark ? 'bg-slate-900/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5 mb-1.5">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${
                                isHigh 
                                  ? isDark ? "bg-red-500/10 text-red-400 border-red-500/10" : "bg-red-50 text-red-700 border-red-200"
                                  : isMed 
                                    ? isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/10" : "bg-amber-50 text-amber-700 border-amber-200"
                                    : isDark ? "bg-blue-500/10 text-blue-400 border-blue-500/10" : "bg-indigo-50 text-indigo-700 border-indigo-200"
                              }`}>
                                {t.priority}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 shrink-0">Due {t.due_date}</span>
                            </div>
                            <h5 className={`text-xs font-bold leading-normal truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {t.title}
                            </h5>

                            {/* Placement control row */}
                            <div className={`flex items-center justify-between gap-2 mt-3 pt-2 border-t ${isDark ? "border-slate-800/15" : "border-slate-200"}`}>
                              <span className="text-[10px] text-slate-500 font-mono">{t.estimated_minutes}m</span>
                              
                              <button
                                onClick={() => {
                                  // Quick optimal slot: put to tomorrow at 9 AM
                                  const tomorrow = getNext7Days()[1].dateString;
                                  updateTask(t.id, {
                                    scheduled_date: tomorrow,
                                    scheduled_hour: 9
                                  });
                                }}
                                className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition ${
                                  isDark 
                                    ? "bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-400" 
                                    : "bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-100 shadow-xs cursor-pointer"
                                }`}
                              >
                                Quick Peak Slot
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Quick Manual Task Picker Modal */}
            <AnimatePresence>
              {selectedScheduleCell && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`w-full max-w-md p-6 border rounded-3xl ${isDark ? 'bg-[#0b0c10] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold font-display">Schedule Task to Slot</h3>
                      <button 
                        onClick={() => setSelectedScheduleCell(null)}
                        className={`p-1 rounded-lg transition ${isDark ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"}`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 mb-4 leading-normal font-sans">
                      Timeslot: <span className="font-bold text-indigo-500 font-mono">{selectedScheduleCell.hour === 9 ? "09:00 AM" : selectedScheduleCell.hour === 11 ? "11:00 AM" : selectedScheduleCell.hour === 14 ? "02:00 PM" : selectedScheduleCell.hour === 16 ? "04:00 PM" : "06:00 PM"}</span> on <span className="font-bold text-indigo-500 font-mono">{selectedScheduleCell.dateString}</span>. Select a pending task from your inventory below:
                    </p>

                    <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                      {tasks.filter(t => !t.scheduled_date && t.status === "pending").length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs italic">
                          No unscheduled pending tasks found. Create a new task in the Goal Planner.
                        </div>
                      ) : (
                        tasks.filter(t => !t.scheduled_date && t.status === "pending").map(t => (
                          <button
                            key={t.id}
                            onClick={() => {
                              updateTask(t.id, {
                                scheduled_date: selectedScheduleCell.dateString,
                                scheduled_hour: selectedScheduleCell.hour
                              });
                              setSelectedScheduleCell(null);
                            }}
                            className={`w-full p-3.5 border rounded-2xl text-left transition flex items-center justify-between gap-3 ${
                              isDark 
                                ? "bg-slate-900/60 border-slate-800 hover:border-indigo-500/50 text-slate-200 hover:text-white cursor-pointer" 
                                : "bg-slate-50 border-slate-200 hover:border-indigo-500 text-slate-800 hover:bg-slate-50/50 cursor-pointer shadow-xs"
                            }`}
                          >
                            <div className="truncate">
                              <h5 className={`text-xs font-bold truncate ${isDark ? "text-slate-200" : "text-slate-850"}`}>{t.title}</h5>
                              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Due {t.due_date}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-mono border ${
                              isDark 
                                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/10" 
                                : "bg-indigo-50 text-indigo-700 border-indigo-200"
                            }`}>
                              {t.priority}
                            </span>
                          </button>
                        ))
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedScheduleCell(null)}
                      className={`w-full mt-4 py-2.5 rounded-xl text-xs font-bold uppercase transition ${
                        isDark 
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer" 
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer shadow-xs"
                      }`}
                    >
                      Close
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

              </>
            )}

          </div>
        )}

        {/* ----------------- TAB: FOCUS TIMER ----------------- */}
        {activeTab === "focus" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/10 pb-4">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-indigo-500 uppercase">Pomodoro Engine & Live Feedback</span>
                <h1 className="text-3xl font-bold font-display tracking-tight mt-1">{t("focus_timer_title")}</h1>
                <p className={`text-sm mt-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {t("focus_timer_subtitle")}
                </p>
              </div>
            </div>

            {/* Split work layouts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Massive clock panel */}
              <div className={`lg:col-span-2 p-8 border rounded-3xl flex flex-col items-center justify-center text-center ${isDark ? "bg-[#121214]/40 border-slate-800" : "bg-white border-slate-200"}`}>
                
                {/* Mode presets */}
                <div className="flex gap-2 mb-8 bg-slate-800/10 p-1.5 border border-slate-800/20 rounded-xl">
                  <button 
                    onClick={() => setTimerPreset(25, 5)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide hover:bg-slate-800/40 transition active:scale-[0.98] bg-indigo-600 text-white shadow"
                  >
                    25/5 Pomodoro
                  </button>
                  <button 
                    onClick={() => setTimerPreset(50, 10)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide hover:bg-slate-800/40 transition active:scale-[0.98] text-slate-400"
                  >
                    50/10 Deep Work
                  </button>
                  <button 
                    onClick={() => setTimerPreset(90, 20)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide hover:bg-slate-800/40 transition active:scale-[0.98] text-slate-400"
                  >
                    90/20 Sprint
                  </button>
                </div>

                {/* Main timer display */}
                <div className="relative inline-flex items-center justify-center mb-8">
                  <div className="text-[120px] font-bold font-display leading-none tracking-tighter text-indigo-500">
                    {Math.floor(timeLeft / 60).toString().padStart(2, "0")}:
                    {(timeLeft % 60).toString().padStart(2, "0")}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4 mb-8">
                  <button 
                    onClick={startTimer}
                    className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold tracking-wider text-sm uppercase rounded-full shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
                  >
                    {timerRunning ? <><Pause className="w-4 h-4 fill-white" /> Pause</> : <><Play className="w-4 h-4 fill-white" /> Start</>}
                  </button>
                  
                  <button 
                    onClick={resetTimer}
                    className={`p-3.5 rounded-full transition ${
                      isDark 
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300" 
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 shadow-xs"
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Custom input drawer */}
                <div className={`w-full max-w-sm flex items-center justify-between gap-2 p-2.5 rounded-xl text-xs border transition ${
                  isDark 
                    ? "bg-[#121214]/60 border-slate-800/60 text-slate-300" 
                    : "bg-slate-50 border-slate-200 text-slate-700 shadow-inner"
                }`}>
                  <span className="font-bold text-[10px] uppercase font-mono text-slate-400 shrink-0">Custom</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <input 
                      type="number" 
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(Number(e.target.value))}
                      className={`w-10 rounded text-center py-1 text-xs border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none shrink-0 ${
                        isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    />
                    <span className="text-slate-500 text-[11px] whitespace-nowrap shrink-0">m work</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 min-w-0">
                    <input 
                      type="number" 
                      value={customBreak}
                      onChange={(e) => setCustomBreak(Number(e.target.value))}
                      className={`w-10 rounded text-center py-1 text-xs border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none shrink-0 ${
                        isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    />
                    <span className="text-slate-500 text-[11px] whitespace-nowrap shrink-0">break</span>
                  </div>

                  <button 
                    onClick={applyCustomTimer} 
                    className={`px-3 py-1 rounded border text-[11px] font-bold transition active:scale-95 shrink-0 ${
                      isDark 
                        ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300" 
                        : "bg-indigo-600 border-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
                    }`}
                  >
                    Set
                  </button>
                </div>

              </div>

              {/* Sidebar stats panel */}
              <div className="space-y-6">
                
                {/* Focus selection target */}
                <div className={`p-6 border rounded-3xl ${isDark ? "bg-[#121214]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                  <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400 block mb-4">Current Focus</span>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">Goal context</label>
                      <select 
                        value={selectedGoalId || ""}
                        onChange={(e) => setSelectedGoalId(e.target.value || null)}
                        className={`w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-indigo-500 transition ${
                          isDark ? "bg-slate-800/30 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        <option value="">No goal selected</option>
                        {goals.map(g => (
                          <option key={g.id} value={g.id} className={isDark ? "bg-[#121214]" : "bg-white"}>{g.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">Task context</label>
                      <select 
                        value={selectedTaskId || ""}
                        onChange={(e) => setSelectedTaskId(e.target.value || null)}
                        className={`w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-indigo-500 transition ${
                          isDark ? "bg-slate-800/30 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        <option value="">No task selected</option>
                        {filteredTasks.map(t => (
                          <option key={t.id} value={t.id} className={isDark ? "bg-[#121214]" : "bg-white"}>{t.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={`space-y-3 pt-5 mt-5 border-t ${isDark ? "border-slate-800/40" : "border-slate-200"}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Projected Impact</span>
                    
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className={isDark ? "text-slate-400" : "text-slate-600"}>Momentum XP</span>
                      <span className={`${isDark ? "text-indigo-400" : "text-indigo-600"} font-bold`}>+250 XP</span>
                    </div>
                    <div className={`w-full rounded-full h-1 ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
                      <div className="bg-indigo-500 h-full w-[80%]" />
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className={isDark ? "text-slate-400" : "text-slate-600"}>Health Score</span>
                      <span className="text-emerald-500 font-bold">+2</span>
                    </div>
                    <div className={`w-full rounded-full h-1 ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
                      <div className="bg-emerald-500 h-full w-[40%]" />
                    </div>
                  </div>
                </div>

                {/* AI Focus Coach live widget */}
                <div className={`p-6 border rounded-2xl ${isDark ? "bg-[#0e1628]/80 border-slate-800" : "bg-white border-slate-200"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-500 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400">AI Focus Coach</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Live telemetry</span>
                  </div>

                  <div className={`p-4 rounded-xl text-xs italic leading-relaxed font-sans mb-3 border ${
                    isDark 
                      ? "bg-[#0b101f]/40 border-slate-800/60 text-slate-300" 
                      : "bg-indigo-50/50 border-indigo-100/60 text-slate-700"
                  }`}>
                    "{liveCoachTip}"
                  </div>

                  {liveCoachBoost && (
                    <div className={`p-3 border rounded-xl text-[11px] leading-relaxed font-mono ${
                      isDark 
                        ? "bg-indigo-500/5 border-indigo-500/10 text-indigo-400" 
                        : "bg-indigo-50 border-indigo-100/50 text-indigo-700"
                    }`}>
                      ⚡ BOOST: {liveCoachBoost}
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ----------------- TAB: MOMENTUM ----------------- */}
        {activeTab === "momentum" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/10 pb-4">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-indigo-500 uppercase">Productivity Velocity Engine</span>
                <h1 className="text-3xl font-bold font-display tracking-tight mt-1">{t("momentum_center_title")}</h1>
                <p className={`text-sm mt-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {t("momentum_center_subtitle")}
                </p>
              </div>
            </div>

            {/* Level progress bar banner */}
            <div className={`p-8 border rounded-3xl relative overflow-hidden ${isDark ? "bg-gradient-to-r from-slate-950/40 to-indigo-950/20 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                
                <div className="md:col-span-2">
                  <span className={`text-xs font-bold uppercase tracking-widest font-mono ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>Current Level</span>
                  <div className="flex items-center gap-3 mt-1 mb-4">
                    <h2 className="text-4xl font-bold font-display">{getLevelName(momentum.level || Math.floor(momentum.total_xp / 1000) + 1)}</h2>
                    <Award className="w-8 h-8 text-yellow-500" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono font-semibold">
                      <span>Progress to Next Level</span>
                      <span>{Math.round(((momentum.total_xp % 1000) / 1000) * 100)}%</span>
                    </div>
                    {/* Horizontal bar */}
                    <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                      <div 
                        className="bg-indigo-500 h-full transition-all duration-500" 
                        style={{ width: `${((momentum.total_xp % 1000) / 1000) * 100}%` }} 
                      />
                    </div>
                    <span className="block text-[10px] text-slate-500 text-right font-mono mt-1">
                      {1000 - (momentum.total_xp % 1000)} XP to go
                    </span>
                  </div>
                </div>

                {/* Score counter block */}
                <div className={`p-6 border rounded-3xl flex flex-col items-center justify-center text-center ${isDark ? "bg-[#121214]/60 border-slate-800/80" : "bg-slate-50 border-slate-200"}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block mb-1">Total XP</span>
                  <span className={`text-4xl font-bold font-display ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>{momentum.total_xp}</span>
                </div>

              </div>
            </div>

            {/* Velocity metrics widgets */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { id: "streak", label: "Active Streak", value: `${momentum.streak_days} Days`, desc: "Consecutive focus days", icon: Flame, iconColor: "text-orange-500" },
                { id: "velocity", label: "Current Velocity", value: `${momentum.current_score}/100`, desc: "Productivity level output", icon: TrendingUp, iconColor: isDark ? "text-indigo-400" : "text-indigo-600" },
                { id: "crushed", label: "Goals Crushed", value: `${goals.filter(g => g.status === "completed").length}`, desc: "Milestones completely resolved", icon: Target, iconColor: "text-emerald-500" },
                { id: "work", label: "Deep Work", value: `${focusSessions.reduce((acc, s) => acc + s.actual_minutes, 0)}m`, desc: "Total focused minutes", icon: Timer, iconColor: isDark ? "text-indigo-400" : "text-indigo-600" },
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.id} className={`p-5 border rounded-3xl ${isDark ? "bg-[#121214]/40 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block mb-1">{stat.label}</span>
                    <span className="text-2xl font-bold font-display">{stat.value}</span>
                    <span className="block text-[11px] text-slate-500 mt-1 font-sans">{stat.desc}</span>
                  </div>
                );
              })}
            </div>

            {/* 7-Day Velocity line chart */}
            <div className={`p-6 border rounded-3xl ${isDark ? "bg-[#121214]/40 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold font-display">7-Day XP Velocity</h3>
                  <p className="text-xs text-slate-400">Experience points earned over the last week through execution.</p>
                </div>
              </div>

              {/* Chart stage */}
              <div className="w-full h-64 relative">
                {(() => {
                  const daysData = getLast7DaysXP();
                  const points = daysData.map((d, index) => {
                    const x = 50 + index * 150;
                    const y = Math.max(50, Math.min(250, 250 - (d.xp / 1000) * 200));
                    return { x, y, ...d };
                  });
                  const linePath = points.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                  const areaPath = points.length > 0 
                    ? `M 50 250 ${points.map(p => `L ${p.x} ${p.y}`).join(' ')} L 950 250 Z`
                    : '';

                  return (
                    <svg viewBox="0 0 1000 300" className="w-full h-full overflow-visible">
                      {/* Grid lines */}
                      <line x1="50" y1="50" x2="950" y2="50" stroke={isDark ? "#1e293b" : "#e2e8f0"} strokeWidth="0.5" strokeDasharray="5,5" />
                      <line x1="50" y1="125" x2="950" y2="125" stroke={isDark ? "#1e293b" : "#e2e8f0"} strokeWidth="0.5" strokeDasharray="5,5" />
                      <line x1="50" y1="200" x2="950" y2="200" stroke={isDark ? "#1e293b" : "#e2e8f0"} strokeWidth="0.5" strokeDasharray="5,5" />
                      <line x1="50" y1="250" x2="950" y2="250" stroke={isDark ? "#1e293b" : "#e2e8f0"} strokeWidth="0.5" />

                      {/* Horizontal Labels */}
                      {points.map((p, idx) => (
                        <text key={idx} x={p.x} y="275" fill="#64748b" fontSize="12" textAnchor="middle" fontFamily="var(--font-mono)">
                          {p.dayName}
                        </text>
                      ))}

                      {/* Vertical scale indicators */}
                      <text x="30" y="54" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">1000</text>
                      <text x="30" y="129" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">500</text>
                      <text x="30" y="204" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">250</text>
                      <text x="30" y="254" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">0</text>

                      {/* Line area gradient */}
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Shaded Area */}
                      {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

                      {/* Connecting Line */}
                      {linePath && <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="3" />}

                      {/* Dot anchors with dynamic labels */}
                      {points.map((p, idx) => (
                        <g key={idx} className="group cursor-pointer">
                          <circle cx={p.x} cy={p.y} r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" className="transition-all duration-300 group-hover:r-7" />
                          <text x={p.x} y={p.y - 12} fill={isDark ? "#a5b4fc" : "#4f46e5"} fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {p.xp} XP
                          </text>
                        </g>
                      ))}
                    </svg>
                  );
                })()}
              </div>
            </div>

            {/* Execution Trophies section */}
            <div className={`p-6 border rounded-3xl ${isDark ? "bg-[#121214]/40 border-slate-800" : "bg-white border-slate-200"}`}>
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400 block mb-5">Execution Trophies</span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {achievements.map(ach => {
                  const isUnlocked = !!ach.unlocked_at;
                  return (
                    <div 
                      key={ach.id}
                      className={`p-5 border rounded-2xl flex items-center gap-4 transition ${
                        isUnlocked 
                          ? isDark 
                            ? "bg-indigo-950/10 border-indigo-500/30" 
                            : "bg-indigo-50/50 border-indigo-100/80 shadow-xs"
                          : `opacity-40 ${isDark ? "bg-slate-800/10 border-slate-800" : "bg-slate-100/50 border-slate-200"}`
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${
                        isUnlocked 
                          ? isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600 border border-indigo-100" 
                          : isDark ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400 border border-slate-250"
                      }`}>
                        <Award className="w-6 h-6" />
                      </div>

                      <div>
                        <span className="text-sm font-bold block">{ach.title}</span>
                        <span className="text-xs text-slate-400 block mt-0.5">{ach.description}</span>
                        {isUnlocked && (
                          <span className="block text-[9px] text-emerald-500 font-mono mt-1 font-semibold">Unlocked</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Momentum Activity Feed */}
            <div className={`p-6 border rounded-3xl ${isDark ? "bg-[#121214]/40 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold font-display">Live Momentum Activity Feed</h3>
                  <p className="text-xs text-slate-400">A real-time, chronological log of focus milestones, task updates, and unlocked achievements.</p>
                </div>
                <div className={`text-[10px] font-mono px-3 py-1 rounded-full font-bold uppercase ${
                  isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"
                }`}>
                  {getMomentumUpdates().length} updates tracked
                </div>
              </div>

              <div className="space-y-3">
                {getMomentumUpdates().length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs font-medium italic">
                    No recent momentum updates yet. Complete tasks or start focus blocks to populate your activity feed!
                  </div>
                ) : (
                  getMomentumUpdates().map(update => (
                    <div key={update.id} className={`p-4 border rounded-2xl flex items-start md:items-center justify-between gap-4 transition ${
                      isDark ? "bg-[#18181b]/30 border-slate-800/60 hover:bg-[#18181b]/50" : "bg-slate-50/50 border-slate-150 hover:bg-slate-50 shadow-3xs"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${
                          update.type === "focus" 
                            ? "bg-indigo-500/10 text-indigo-400" 
                            : update.type === "task"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {update.type === "focus" ? <Timer className="w-4 h-4" /> : update.type === "task" ? <CheckCircle2 className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold block leading-snug">
                            {update.title}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">
                            {update.meta} • {update.timestamp.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                      </div>
                      {update.xp > 0 && (
                        <span className={`text-xs font-extrabold font-mono shrink-0 ${
                          update.type === "achievement" ? "text-amber-500" : "text-indigo-500"
                        }`}>
                          +{update.xp} XP
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ----------------- PRODUCTIVITY HISTORY HUB ----------------- */}
            <div className={`p-6 border rounded-3xl ${isDark ? "bg-[#121214]/40 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold font-display">Productivity History Hub</h3>
                  <p className="text-xs text-slate-400">Review your past performance logs, conversation logs, and executed workflows.</p>
                </div>
                
                {/* Sub-tabs selector */}
                <div className={`flex p-1 rounded-2xl border shrink-0 self-start transition-all ${
                  isDark 
                    ? "bg-[#18181b]/80 border-slate-800" 
                    : "bg-slate-100 border-slate-200/50"
                }`}>
                  {[
                    { id: "focus", label: "Focus Blocks" },
                    { id: "voice", label: "Voice Agent" },
                    { id: "completed", label: "Completed Tasks" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setHistoryTab(tab.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        historyTab === tab.id
                          ? isDark
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                            : "bg-white text-indigo-700 shadow-sm font-bold"
                          : isDark
                            ? "text-slate-300 hover:text-white"
                            : "text-slate-600 hover:text-slate-950 font-medium"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Contents */}
              {historyTab === "focus" && (
                <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                  {focusSessions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs font-medium">
                      No focus sessions logged yet. Activate a focus block to earn XP and record focus sessions!
                    </div>
                  ) : (
                    focusSessions.map(session => {
                      const associatedTask = tasks.find(t => t.id === session.task_id);
                      return (
                        <div key={session.id} className={`p-4 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
                          isDark ? "bg-[#18181b]/30 border-slate-800/60 hover:bg-[#18181b]/50" : "bg-slate-50/50 border-slate-150 hover:bg-slate-50"
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl shrink-0 ${isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                              <Timer className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-bold block leading-snug">
                                {associatedTask ? associatedTask.title : "General Focus block"}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                                {new Date(session.created_at || session.started_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold font-mono tracking-wide ${
                              session.completed 
                                ? "bg-emerald-500/10 text-emerald-400" 
                                : "bg-amber-500/10 text-amber-400"
                            }`}>
                              {session.completed ? "COMPLETED" : "INTERRUPTED"}
                            </span>
                            <span className="text-xs font-bold text-indigo-500 font-mono">
                              +{session.xp_earned} XP
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                              {session.actual_minutes}m duration
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {historyTab === "voice" && (
                <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                  {voiceHistory.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs font-medium">
                      No companion talk logs recorded yet. Speak or chat with your AI Companion to log events!
                    </div>
                  ) : (
                    voiceHistory.map((item: any) => (
                      <div key={item.id} className={`p-4 border rounded-2xl flex flex-col gap-2 transition-all ${
                        isDark ? "bg-[#18181b]/30 border-slate-800/60" : "bg-slate-50/50 border-slate-150"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold font-mono ${
                            item.sender === "user" 
                              ? isDark 
                                ? "bg-slate-800 text-slate-300" 
                                : "bg-slate-150 text-slate-700"
                              : isDark 
                                ? "bg-indigo-950/60 text-indigo-300" 
                                : "bg-indigo-50 text-indigo-700"
                          }`}>
                            {item.sender === "user" ? "USER QUERY" : "COMPANION RESPONDED"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(item.timestamp).toLocaleDateString()})
                          </span>
                        </div>
                        <p className={`text-xs ${isDark ? "text-slate-200" : "text-slate-800"} leading-relaxed font-sans`}>
                          {item.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {historyTab === "completed" && (
                <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                  {tasks.filter(t => t.status === "completed").length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs font-medium">
                      No completed tasks yet. Crushing your tasks on the Planner or Dashboard automatically updates this list!
                    </div>
                  ) : (
                    tasks.filter(t => t.status === "completed").map(task => (
                      <div key={task.id} className={`p-4 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
                        isDark ? "bg-[#18181b]/30 border-slate-800/60 hover:bg-[#18181b]/50" : "bg-slate-50/50 border-slate-150 hover:bg-slate-50"
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl shrink-0 ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                            <CheckSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold block leading-snug line-through opacity-85 text-slate-400">
                              {task.title}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              Completed: {task.completed_at ? new Date(task.completed_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : "Just now"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono font-bold tracking-wider ${
                            task.priority === "high" 
                              ? "bg-red-500/10 text-red-400" 
                              : task.priority === "medium" 
                                ? "bg-amber-500/10 text-amber-400" 
                                : "bg-slate-500/10 text-slate-400"
                          }`}>
                            {task.priority.toUpperCase()} PRIORITY
                          </span>
                          <span className="text-xs font-medium text-slate-400">
                            Est: {task.estimated_minutes}m
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

          </div>
        )}
        </div>
      </main>

      {/* ----------------- MODAL: WEEKLY REVIEW REPORT ----------------- */}
      <AnimatePresence>
        {showWeeklyReview && (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`w-full max-w-2xl border rounded-3xl shadow-2xl relative overflow-hidden ${isDark ? "bg-[#121214] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
            >
              <div className={`flex items-center justify-between p-6 border-b ${isDark ? "border-slate-800/40" : "border-slate-100"}`}>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-bold font-display">Weekly Executive Summary</h3>
                </div>
                <button onClick={() => setShowWeeklyReview(false)} className={`transition ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingWeeklyReport ? (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-slate-400">Compiling execution metadata...</span>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  <div className={`p-4 rounded-xl border ${isDark ? "bg-[#09090b] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-xs font-bold uppercase tracking-widest font-mono text-slate-400 block mb-1">Performance Overview</span>
                    <p className={`text-xs leading-relaxed font-sans ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      {weeklyReport?.week_summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest font-mono text-slate-400 block mb-2">XP Achievements Unlocked</span>
                      <div className="space-y-2">
                        {weeklyReport?.achievements?.map((ach: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
                            <CheckCircle2 className="w-4 h-4" /> {ach}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest font-mono text-slate-400 block mb-2">Coach Strategy Guidelines</span>
                      <div className="space-y-2">
                        {weeklyReport?.recommendations?.map((rec: string, idx: number) => (
                          <div key={idx} className={`text-xs flex items-start gap-1.5 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" /> {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowWeeklyReview(false)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition animate-pulse cursor-pointer"
                  >
                    Return to Dashboard
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- TAB: PROFILE (USER PROFILE SECURITY) ----------------- */}
      {activeTab === "profile" && (
        <div className="space-y-6 max-w-4xl mx-auto px-4 md:px-0 pt-8 pb-12">
          {/* Elegant Page Header */}
          <div className="flex flex-col gap-4 border-b border-slate-500/10 pb-6 pt-4">
            {/* Minimalist Back Button at Top Left (placed above the header content) */}
            <div className="flex justify-start">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`p-2.5 rounded-xl border transition-all active:scale-[0.95] cursor-pointer shadow-sm hover:shadow ${
                  isDark 
                    ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-slate-700" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
                aria-label="Back"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Centered Heading Content */}
            <div className="text-center max-w-lg mx-auto">
              <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-500 uppercase flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5 stroke-[2]" />
                {t("profile_sec_title")}
              </span>
              <h1 className="text-3xl font-extrabold font-display tracking-tight mt-1.5 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                {t("user_profile_title")}
              </h1>
              <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {t("user_profile_subtitle")}
              </p>
            </div>
          </div>

          {/* Premium Profile Card */}
          <div className={`border rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row gap-8 items-center md:items-start ${
            isDark 
              ? "bg-[#121214] border-[#27272a] text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/10 via-[#121214] to-[#121214]" 
              : "bg-white border-slate-200 text-slate-800 shadow-sm"
          }`}>
            {/* Absolute visual glows in dark mode */}
            {isDark && (
              <>
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
              </>
            )}

            {/* Left side: Premium Avatar Card */}
            <div className="flex flex-col items-center text-center shrink-0 w-full md:w-auto">
              <div className={`w-32 h-32 rounded-3xl p-1.5 border mb-4 relative shadow-xl ${
                isDark ? "bg-slate-900 border-indigo-500/20 shadow-indigo-500/5" : "bg-slate-100 border-slate-200 shadow-slate-200/50"
              }`}>
                <img 
                  src={profile?.avatar_url || "https://api.dicebear.com/7.x/adventurer/svg?seed=Explorer"} 
                  alt="Avatar" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-2xl object-cover bg-slate-800"
                />
              </div>
              <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 border rounded-full ${
                isDark 
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                  : "text-emerald-700 bg-emerald-50 border-emerald-200"
              }`}>
                ● {t("active_session")}
              </span>
            </div>

            {/* Right side: Detailed Information Fields with elegant icons */}
            <div className="flex-1 w-full space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile ID */}
                <div className={`p-4 border rounded-2xl flex items-start gap-3.5 transition-all hover:border-indigo-500/30 ${
                  isDark ? "bg-slate-950/40 border-[#27272a]/40" : "bg-slate-50 border-slate-100"
                }`}>
                  <div className={`p-2.5 rounded-xl ${isDark ? "bg-slate-900 text-slate-400" : "bg-white text-slate-500 shadow-sm"}`}>
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className={`font-mono text-[9px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      {t("profile_id")}
                    </span>
                    <span className={`font-mono text-xs font-bold break-all ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                      {profile?.id || profile?.clerk_user_id || "local-user"}
                    </span>
                  </div>
                </div>

                {/* Full Name */}
                <div className={`p-4 border rounded-2xl flex items-start gap-3.5 transition-all hover:border-indigo-500/30 ${
                  isDark ? "bg-slate-950/40 border-[#27272a]/40" : "bg-slate-50 border-slate-100"
                }`}>
                  <div className={`p-2.5 rounded-xl ${isDark ? "bg-slate-900 text-slate-400" : "bg-white text-slate-500 shadow-sm"}`}>
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className={`font-mono text-[9px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      {t("full_name")}
                    </span>
                    <span className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
                      {profile?.full_name || "Gaurav Kumar Tripathi"}
                    </span>
                  </div>
                </div>

                {/* Email Address */}
                <div className={`p-4 border rounded-2xl flex items-start gap-3.5 transition-all hover:border-indigo-500/30 ${
                  isDark ? "bg-slate-950/40 border-[#27272a]/40" : "bg-slate-50 border-slate-100"
                }`}>
                  <div className={`p-2.5 rounded-xl ${isDark ? "bg-slate-900 text-indigo-400/80" : "bg-white text-indigo-500 shadow-sm"}`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0 w-full">
                    <span className={`font-mono text-[9px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      {t("email_address")}
                    </span>
                    <span className={`font-mono text-sm font-bold break-all ${isDark ? "text-indigo-300" : "text-indigo-600"}`}>
                      {profile?.email}
                    </span>
                  </div>
                </div>

                {/* Identity Provider */}
                <div className={`p-4 border rounded-2xl flex items-start gap-3.5 transition-all hover:border-indigo-500/30 ${
                  isDark ? "bg-slate-950/40 border-[#27272a]/40" : "bg-slate-50 border-slate-100"
                }`}>
                  <div className={`p-2.5 rounded-xl ${isDark ? "bg-slate-900 text-slate-400" : "bg-white text-slate-500 shadow-sm"}`}>
                    <Key className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className={`font-mono text-[9px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      {t("identity_provider")}
                    </span>
                    <span className={`text-sm font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      {googleAccessToken ? "Google OAuth" : "Firebase Auth (Sandbox)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Session Details */}
              <div className={`p-4 border rounded-2xl flex items-start gap-3.5 transition-all hover:border-indigo-500/30 ${
                isDark ? "bg-slate-950/40 border-[#27272a]/40" : "bg-slate-50 border-slate-100"
              }`}>
                <div className={`p-2.5 rounded-xl ${isDark ? "bg-slate-900 text-slate-400" : "bg-white text-slate-500 shadow-sm"}`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className={`font-mono text-[9px] uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {t("session_established")}
                  </span>
                  <span className={`font-mono text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {new Date().toUTCString()}
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-5 border-t border-slate-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Secure session certified by Firebase Sandbox protocol.</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-sm bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  {t("sign_out_account")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB: AGENT (AI COMPANION) ----------------- */}
      {activeTab === "agent" && (
        <TalkingAgent />
      )}

      {/* ----------------- FIXED FLOATING VOICE ORB (BOTTOM RIGHT) ----------------- */}
      {activeTab !== "agent" && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5 pointer-events-none">
          <AnimatePresence>
            {isVoiceRecording && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className={`p-4 rounded-2xl border shadow-2xl max-w-xs ${
                  isDark 
                    ? "bg-[#121214] border-red-500/20 text-white" 
                    : "bg-white border-red-200 text-slate-800"
                } backdrop-blur-md pointer-events-auto`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 font-mono">Listening...</span>
                </div>
                <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"} font-medium leading-normal`}>
                  {voiceText ? `"${voiceText}"` : "Speak now..."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            onClick={toggleVoiceRecording}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 pointer-events-auto hover:scale-105 active:scale-95 border-4 ${
              isVoiceRecording 
                ? "bg-red-500 hover:bg-red-600 border-red-500/20 text-white animate-pulse" 
                : isDark
                  ? "bg-indigo-600 hover:bg-indigo-500 border-indigo-500/20 text-white"
                  : "bg-indigo-600 hover:bg-indigo-500 border-indigo-100 text-white"
            }`}
            title="Voice Command Center"
          >
            {isVoiceRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>
      )}

    </div>
  );
}
