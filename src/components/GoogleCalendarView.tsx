import React, { useState, useEffect } from "react";
import { useStore } from "../store/use-store";
import { 
  Calendar as CalendarIcon, 
  RefreshCw, 
  Check, 
  Plus, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays,
  Lock,
  Sparkles,
  AlertTriangle,
  LogOut,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task } from "../types";
import { getTranslation } from "../lib/translations";

export function GoogleCalendarView() {
  const isDark = useStore(state => state.theme === "dark");
  const googleAccessToken = useStore(state => state.googleAccessToken);
  const setGoogleAccessToken = useStore(state => state.setGoogleAccessToken);
  const signInWithGoogle = useStore(state => state.signInWithGoogle);
  const signInWithGoogleRedirect = useStore(state => state.signInWithGoogleRedirect);
  const authError = useStore(state => state.authError);
  const tasks = useStore(state => state.tasks);
  const updateTask = useStore(state => state.updateTask);
  const goals = useStore(state => state.goals);
  const voiceLanguageCode = useStore(state => state.voiceLanguageCode);

  const t = (key: string): string => {
    return getTranslation(key, voiceLanguageCode);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [syncingTaskId, setSyncingTaskId] = useState<string | null>(null);
  const [showSyncModal, setShowSyncModal] = useState<Task | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Get next 7 days helper matching App.tsx logic
  const getNext7Days = () => {
    const days = [];
    const options: Intl.DateTimeFormatOptions = { weekday: "short" };
    const monthOptions: Intl.DateTimeFormatOptions = { month: "short" };
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateString = d.toISOString().split("T")[0]; // YYYY-MM-DD
      
      days.push({
        dateString,
        dayLabel: d.toLocaleDateString(voiceLanguageCode || "en-US", options),
        dateLabel: d.getDate(),
        monthLabel: d.toLocaleDateString(voiceLanguageCode || "en-US", monthOptions),
        fullDate: d
      });
    }
    return days;
  };

  const daysList = getNext7Days();

  // Load events if we have access token
  const fetchCalendarEvents = async () => {
    if (!googleAccessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const timeMin = new Date();
      timeMin.setHours(0, 0, 0, 0);
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 7);
      timeMax.setHours(23, 59, 59, 999);

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin.toISOString())}&timeMax=${encodeURIComponent(timeMax.toISOString())}&singleEvents=true&orderBy=startTime`;
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Token expired or invalid
          setGoogleAccessToken(null);
          throw new Error("Google Calendar session expired. Please reconnect.");
        }
        throw new Error("Failed to fetch Google Calendar events.");
      }

      const data = await res.json();
      setEvents(data.items || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not load calendar events.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (googleAccessToken) {
      fetchCalendarEvents();
    }
  }, [googleAccessToken]);

  // Sync / Save a task to Google Calendar
  const syncTaskToGoogleCalendar = async (task: Task) => {
    if (!googleAccessToken) return;
    
    // Explicit confirmation mandated by security/Workspace guideline
    const confirmed = window.confirm(
      `Are you sure you want to sync the task "${task.title}" to your Google Calendar?`
    );
    if (!confirmed) return;

    setSyncingTaskId(task.id);
    try {
      const startHour = task.scheduled_hour || 9;
      // Format to scheduled date
      const startDate = new Date(`${task.scheduled_date}T${String(startHour).padStart(2, "0")}:00:00`);
      const endDate = new Date(startDate.getTime() + (task.estimated_minutes || 60) * 60 * 1000);

      const eventBody = {
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
      };

      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(eventBody)
      });

      if (!res.ok) {
        throw new Error("Failed to create Google Calendar event.");
      }

      const data = await res.json();
      if (data.id) {
        updateTask(task.id, { google_event_id: data.id });
        setNotification({
          message: `Successfully synced "${task.title}" to Google Calendar!`,
          type: "success"
        });
        // Refresh events to show in UI
        fetchCalendarEvents();
      }
    } catch (err: any) {
      console.error(err);
      setNotification({
        message: err.message || "Error syncing to Google Calendar.",
        type: "error"
      });
    } finally {
      setSyncingTaskId(null);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Helper to disconnect
  const handleDisconnect = () => {
    if (window.confirm("Disconnect your Google Calendar integration?")) {
      setGoogleAccessToken(null);
      setEvents([]);
    }
  };

  // Parse time label from iso string
  const formatEventTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 max-w-md ${
              notification.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            <div className={`p-1.5 rounded-lg ${notification.type === "success" ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
              <Check className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold leading-normal">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!googleAccessToken ? (
        <div className={`p-12 border rounded-3xl text-center flex flex-col items-center justify-center max-w-2xl mx-auto ${
          isDark ? "bg-[#121214]/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-500 mb-6">
            <CalendarIcon className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold font-display">{t("connect_google")}</h2>
          <p className="text-sm text-slate-500 mt-2.5 max-w-md leading-relaxed">
            {t("connect_calendar_desc")}
          </p>

          <div className="mt-8 flex justify-center">
            <button
              onClick={signInWithGoogle}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold text-sm transition shadow-lg shadow-indigo-600/10 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              {t("connect_google_popup")}
            </button>
          </div>

          {authError && (
            <div className="mt-6 p-4 bg-red-950/20 border border-red-500/25 rounded-2xl text-left relative overflow-hidden text-xs max-w-md">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-200">{t("connection_failed_title")}</h4>
                  <p className="text-[11px] text-red-300 mt-1 leading-relaxed">
                    {authError.includes("popup-closed-by-user")
                      ? t("popup_warning")
                      : authError}
                  </p>
                  <div className="text-[11px] text-indigo-300 font-medium mt-2 leading-relaxed flex items-start gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                    <span>
                      {t("try_new_tab")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className={`p-4 border rounded-2xl flex flex-wrap items-center justify-between gap-4 ${
            isDark ? "bg-[#121214]/60 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/15 text-indigo-500 rounded-xl">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-display">{t("google_calendar_connected")}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{t("showing_7_days")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchCalendarEvents}
                disabled={isLoading}
                className={`p-2.5 rounded-xl border transition flex items-center gap-2 text-xs font-semibold ${
                  isDark 
                    ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
                }`}
                title="Refresh Calendar"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? t("refreshing") : t("sync_now")}
              </button>

              <button
                onClick={handleDisconnect}
                className="p-2.5 text-xs text-red-500 hover:bg-red-500/10 rounded-xl font-semibold transition flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                {t("disconnect")}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 7-Day Live Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {daysList.map(day => {
              const isToday = new Date().toISOString().split("T")[0] === day.dateString;
              
              // Filter Google events for this day
              const dayEvents = events.filter(event => {
                const start = event.start?.dateTime || event.start?.date;
                return start && start.startsWith(day.dateString);
              });

              // Filter PlanAhead tasks scheduled for this day
              const dayTasks = tasks.filter(task => task.scheduled_date === day.dateString);

              return (
                <div 
                  key={day.dateString} 
                  className={`p-4 border rounded-2xl flex flex-col min-h-[350px] transition-all ${
                    isToday 
                      ? isDark 
                        ? "bg-indigo-950/15 border-indigo-500/30 shadow-indigo-950/10" 
                        : "bg-indigo-50/50 border-indigo-200 shadow-sm"
                      : isDark
                        ? "bg-[#121214]/35 border-slate-800"
                        : "bg-white border-slate-200 shadow-xs"
                  }`}
                >
                  {/* Date Header */}
                  <div className="border-b pb-3 mb-3 border-slate-500/10 flex items-center justify-between">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                        isToday ? "text-indigo-500" : "text-slate-500"
                      }`}>
                        {day.dayLabel}
                      </span>
                      <h4 className={`text-xl font-black font-display tracking-tight leading-none mt-0.5 ${
                        isToday ? "text-indigo-500" : isDark ? "text-white" : "text-slate-900"
                      }`}>
                        {day.dateLabel} <span className="text-[11px] font-normal font-sans text-slate-500">{day.monthLabel}</span>
                      </h4>
                    </div>
                    {isToday && (
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase rounded-full font-mono tracking-widest">
                        {t("today_word")}
                      </span>
                    )}
                  </div>

                  {/* Combined Day Schedule */}
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[320px] pr-1">
                    {/* PLAN AHEAD TASKS SECTION */}
                    {dayTasks.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono font-bold tracking-widest text-indigo-500 uppercase block">
                          {t("tasks_word")} ({dayTasks.length})
                        </span>
                        {dayTasks.map(task => {
                          const isHigh = task.priority === "high";
                          const isMed = task.priority === "medium";
                          const hasSynced = !!task.google_event_id;

                          return (
                            <div 
                              key={task.id}
                              className={`p-3 border rounded-xl flex flex-col justify-between gap-2.5 transition relative ${
                                task.status === "completed"
                                  ? isDark ? "bg-slate-900/40 border-slate-800/60 opacity-50" : "bg-slate-100 border-slate-200 text-slate-500 opacity-60"
                                  : isHigh 
                                    ? isDark ? "bg-red-950/10 border-red-500/20" : "bg-red-50 border-red-150"
                                    : isMed
                                      ? isDark ? "bg-amber-950/10 border-amber-500/20" : "bg-amber-50 border-amber-150"
                                      : isDark ? "bg-blue-950/10 border-blue-500/20" : "bg-indigo-50 border-indigo-150"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="text-[8px] uppercase font-mono font-bold text-slate-500 shrink-0">
                                    {t("slot_word")}: {task.scheduled_hour === 9 ? "09:00 AM" : task.scheduled_hour === 11 ? "11:00 AM" : task.scheduled_hour === 14 ? "02:00 PM" : task.scheduled_hour === 16 ? "04:00 PM" : "06:00 PM"}
                                  </span>
                                  {hasSynced ? (
                                    <span className="text-[8px] uppercase font-mono font-bold text-emerald-500 flex items-center gap-0.5">
                                      <Check className="w-2.5 h-2.5" /> {t("synced_word")}
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => syncTaskToGoogleCalendar(task)}
                                      disabled={syncingTaskId === task.id}
                                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition flex items-center gap-0.5 shrink-0 ${
                                        isDark 
                                          ? "bg-slate-800 text-indigo-400 hover:bg-slate-700" 
                                          : "bg-white text-indigo-600 hover:bg-slate-50 border border-slate-200"
                                      }`}
                                    >
                                      {syncingTaskId === task.id ? "..." : t("sync_btn")}
                                    </button>
                                  )}
                                </div>
                                <h5 className={`text-xs font-bold leading-tight ${
                                  task.status === "completed" ? "line-through text-slate-400" : isDark ? "text-slate-100" : "text-slate-900"
                                }`}>
                                  {task.title}
                                </h5>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* GOOGLE CALENDAR EVENTS SECTION */}
                    {dayEvents.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-500/5">
                        <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase block">
                          {t("calendar_word")} ({dayEvents.length})
                        </span>
                        {dayEvents.map(event => (
                          <div 
                            key={event.id}
                            className={`p-2.5 border rounded-xl flex items-start gap-2 ${
                              isDark 
                                ? "bg-slate-900/60 border-slate-800 text-slate-300" 
                                : "bg-slate-50 border-slate-200 text-slate-700 shadow-xs"
                            }`}
                          >
                            <Clock className="w-3 h-3 text-indigo-400 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[9px] font-mono text-slate-500">
                                {event.start?.dateTime ? formatEventTime(event.start.dateTime) : "All Day"}
                              </span>
                              <h5 className={`text-xs font-semibold leading-tight truncate ${isDark ? "text-slate-200" : "text-slate-850"}`}>
                                {event.summary || "No Title"}
                              </h5>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {dayTasks.length === 0 && dayEvents.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                        <CalendarIcon className="w-6 h-6 text-slate-600/30 stroke-[1.5]" />
                        <span className="text-[10px] text-slate-500 font-medium mt-1.5">{t("free_schedule")}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
