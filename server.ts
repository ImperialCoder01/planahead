import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client to prevent startup crashes if API Key is not yet populated
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.PRIMARY_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.BACKUP_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: No Gemini API Key found in environment variables. Falling back to mock answers.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_API_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return geminiClient;
}

// ---------------------------------------------------------
// 1. /api/health
// ---------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy",
    timestamp: new Date().toISOString(),
    api: "v1"
  });
});

// ---------------------------------------------------------
// 1b. /login-details
// ---------------------------------------------------------
app.get("/login-details", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>User Login Details</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; }
        code, pre, .mono { font-family: 'JetBrains Mono', monospace; }
      </style>
    </head>
    <body class="bg-[#09090b] text-slate-100 min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/15 via-[#09090b] to-[#09090b]">
      <div class="max-w-md w-full bg-[#121214] border border-[#27272a]/50 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl"></div>
        
        <div class="flex flex-col items-center text-center mb-8">
          <div class="w-20 h-20 bg-indigo-500/10 rounded-2xl p-1.5 border border-indigo-500/25 mb-4 shadow-lg shadow-indigo-500/10 flex items-center justify-center">
            <img 
              src="https://api.dicebear.com/7.x/adventurer/svg?seed=Explorer" 
              alt="Avatar" 
              class="w-full h-full rounded-xl object-cover bg-slate-800"
            />
          </div>
          <h1 class="text-xl font-extrabold tracking-tight text-white">User Login Profile</h1>
          <p class="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-widest mt-1.5 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-md">Status: Active Session</p>
        </div>

        <div class="space-y-4 text-xs">
          <div class="p-4 bg-slate-950/40 border border-[#27272a]/40 rounded-2xl flex flex-col gap-1">
            <span class="text-slate-500 font-mono text-[10px] uppercase tracking-wider">Profile ID</span>
            <span class="text-slate-200 font-bold mono">user-123</span>
          </div>
          
          <div class="p-4 bg-slate-950/40 border border-[#27272a]/40 rounded-2xl flex flex-col gap-1">
            <span class="text-slate-500 font-mono text-[10px] uppercase tracking-wider">Full Name</span>
            <span class="text-white font-bold">PlanAhead Explorer</span>
          </div>

          <div class="p-4 bg-slate-950/40 border border-[#27272a]/40 rounded-2xl flex flex-col gap-1">
            <span class="text-slate-500 font-mono text-[10px] uppercase tracking-wider">Email Address</span>
            <span class="text-indigo-300 font-bold mono">explorer@planahead.io</span>
          </div>

          <div class="p-4 bg-slate-950/40 border border-[#27272a]/40 rounded-2xl flex flex-col gap-1">
            <span class="text-slate-500 font-mono text-[10px] uppercase tracking-wider">Identity Provider</span>
            <span class="text-slate-300 font-bold">Firebase Auth (Sandbox)</span>
          </div>

          <div class="p-4 bg-slate-950/40 border border-[#27272a]/40 rounded-2xl flex flex-col gap-1">
            <span class="text-slate-500 font-mono text-[10px] uppercase tracking-wider">Current Session Established</span>
            <span class="text-slate-300 font-bold mono">${new Date().toUTCString()}</span>
          </div>
        </div>

        <div class="mt-8 text-center border-t border-[#27272a]/30 pt-4 flex flex-col items-center gap-1">
          <p class="text-[10px] text-slate-500 font-medium">PlanAhead Execution Platform &copy; 2026</p>
          <span class="text-[9px] text-slate-600 font-mono">You can close this tab safely.</span>
        </div>
      </div>
    </body>
    </html>
  `);
});

// ---------------------------------------------------------
// 2. /api/webhooks (Clerk webhook)
// ---------------------------------------------------------
app.post("/api/webhooks", (req, res) => {
  console.log("Clerk webhook received:", req.body);
  res.status(200).json({ received: true });
});

// ---------------------------------------------------------
// 3. /api/auth/sync-profile
// ---------------------------------------------------------
app.post("/api/auth/sync-profile", (req, res) => {
  const { clerk_user_id, email, full_name, avatar_url } = req.body;
  console.log(`Syncing profile for user: ${full_name} (${email})`);
  res.json({
    success: true,
    profile: {
      id: "user-123",
      clerk_user_id,
      email,
      full_name,
      avatar_url,
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  });
});

// ---------------------------------------------------------
// 4. /api/onboarding
// ---------------------------------------------------------
app.post("/api/onboarding", (req, res) => {
  res.json({ success: true, onboarding_completed: true });
});

// ---------------------------------------------------------
// 5. /api/actions/next
// ---------------------------------------------------------
app.get("/api/actions/next", (req, res) => {
  res.json({
    next_action: {
      id: "task-next",
      title: "Confirm Core Visual Layouts",
      description: "Match design assets to standard spacing rules.",
      priority: "high"
    }
  });
});

// ---------------------------------------------------------
// 6. /api/focus/coach
// ---------------------------------------------------------
app.post("/api/focus/coach", async (req, res) => {
  const { taskTitle, elapsedMinutes, currentStreak } = req.body;
  
  const apiKey = process.env.PRIMARY_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.BACKUP_GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      tip: `Focusing on "${taskTitle || "your task"}". Keep going! You've maintained deep work block for ${elapsedMinutes || 0}m.`,
      energy_boost: "Drink a glass of water and adjust your posture for absolute concentration."
    });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Give a short, high-impact focus tip (max 20 words) for someone working on the task: "${taskTitle || "SaaS Project Design"}". They have been working for ${elapsedMinutes || 10} minutes. Their current streak is ${currentStreak || 0} sessions.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite productivity psychologist coach. Keep feedback extremely brief, laser-focused, and motivating."
      }
    });

    res.json({
      tip: response.text || "Eliminate external triggers. Keep eye level aligned with top of the screen.",
      energy_boost: "Focus is a muscle. Take 3 deep diaphragmatic breaths to reset your mental frame."
    });
  } catch (error) {
    console.error(error);
    res.json({ tip: "Eliminate external triggers and commit completely to the immediate action block." });
  }
});

// ---------------------------------------------------------
// 7. /api/goals/sync-health
// ---------------------------------------------------------
app.post("/api/goals/sync-health", (req, res) => {
  res.json({ success: true, health_score: 95 });
});

// ---------------------------------------------------------
// 8. /api/goals/[id]/health
// ---------------------------------------------------------
app.get("/api/goals/:id/health", (req, res) => {
  res.json({ id: req.params.id, health_score: 100, updated_at: new Date().toISOString() });
});

// ---------------------------------------------------------
// 9. /api/goals/[id]/decompose
// ---------------------------------------------------------
app.post("/api/goals/:id/decompose", async (req, res) => {
  const { goal } = req.body;
  const goalTitle = goal?.title || "Launch my startup";
  const goalDesc = goal?.description || "Build and validate SaaS product";

  const apiKey = process.env.PRIMARY_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.BACKUP_GEMINI_API_KEY;
  if (!apiKey) {
    // Elegant hardcoded mock response so the app still works beautifully without keys
    return res.json({
      feasibility: "75%",
      tasks: [
        { title: "Define Value Proposition & Target Audience", description: "Develop clear customer segments and visual messaging channels.", priority: "high", estimated_minutes: 180 },
        { title: "Create Interactive Figma Prototypes", description: "Design low-fidelity mockups of onboarding, home view, and key widgets.", priority: "medium", estimated_minutes: 240 },
        { title: "Build Waitlist Landing Page", description: "Use Tailwind UI to set up email capture form synced to local database.", priority: "high", estimated_minutes: 120 }
      ]
    });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Decompose this goal: "${goalTitle}" (${goalDesc}) into 3 actionable tasks. Provide each task with 'title', 'description' (max 15 words), 'priority' ('high', 'medium', 'low'), and 'estimated_minutes' (integer). Also output an overall 'feasibility' percentage (string).`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["feasibility", "tasks"],
          properties: {
            feasibility: { type: Type.STRING },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "description", "priority", "estimated_minutes"],
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  estimated_minutes: { type: Type.INTEGER }
                }
              }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error) {
    console.error(error);
    res.json({
      feasibility: "80%",
      tasks: [
        { title: "Identify core customer profiles", description: "Validate pain points with 5 target users.", priority: "high", estimated_minutes: 120 }
      ]
    });
  }
});

// ---------------------------------------------------------
// 10. /api/goals/[id]/recover
// ---------------------------------------------------------
app.post("/api/goals/:id/recover", (req, res) => {
  res.json({
    status: "recovery_plan_generated",
    recovery_plan: {
      actions: ["Reschedule 2 non-essential items", "Limit daily goals to single high-priority milestone", "Start with 15-minute warmup block"]
    }
  });
});

// ---------------------------------------------------------
// 11. /api/momentum/stats
// ---------------------------------------------------------
app.get("/api/momentum/stats", (req, res) => {
  res.json({
    streak: 3,
    weekly_xp: [120, 300, 0, 450, 0, 0, 150],
    level: 2,
    xp_to_next: 850
  });
});

// ---------------------------------------------------------
// 12. /api/momentum/coach
// ---------------------------------------------------------
app.post("/api/momentum/coach", async (req, res) => {
  const { command, goals, momentum } = req.body;
  const commandType = command || "general";

  const apiKey = process.env.PRIMARY_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.BACKUP_GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      recommendation: {
        title: `Dynamic ${commandType.charAt(0).toUpperCase() + commandType.slice(1)} Nudge`,
        description: `Execute a dedicated focus block to keep your momentum streak running smoothly. Limit task parallelization to protect processing capacity.`,
        insight: `Optimal efficiency matches disciplined breaks. Stick to 25/5 Pomodoro rhythm.`
      }
    });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Formulate a highly professional execution recommendation for the user. Command selected: "${commandType}". User is working on goals like "${goals?.[0]?.title || "SaaS product"}". Their current momentum score is: ${momentum?.current_score || 0}. Keep it practical and structured with 'title' (max 5 words), 'description' (max 20 words), and 'insight' (max 15 words).`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["recommendation"],
          properties: {
            recommendation: {
              type: Type.OBJECT,
              required: ["title", "description", "insight"],
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                insight: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error) {
    console.error(error);
    res.json({
      recommendation: {
        title: "Focus Block Routine",
        description: "Secure a structured morning execution block to make uninterrupted progress on core milestones.",
        insight: "Consistency breeds performance."
      }
    });
  }
});

// ---------------------------------------------------------
// 13. /api/notifications/sync
// ---------------------------------------------------------
app.post("/api/notifications/sync", (req, res) => {
  res.json({ success: true, count: 0 });
});

// ---------------------------------------------------------
// 14. /api/planner/orchestrate
// ---------------------------------------------------------
app.post("/api/planner/orchestrate", async (req, res) => {
  const { goals, tasks } = req.body;
  const apiKey = process.env.PRIMARY_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.BACKUP_GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.json({
      recommendation: {
        title: "Optimal Daily Routing",
        description: `Command center autopilot run: Prioritize 'Define Value Proposition & Target Audience' in your next focus block today for maximum traction.`,
        insight: "Feasibility ranking suggests immediate execution of customer interviews."
      }
    });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Run complete execution orchestration. We have the following active goal targets: "${goals?.[0]?.title || "SaaS Project"}" and ${tasks?.length || 0} pending tasks. Provide an optimized next recommendation with a 'title' (max 5 words), 'description' (max 25 words), and a 'insight' (max 15 words).`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["recommendation"],
          properties: {
            recommendation: {
              type: Type.OBJECT,
              required: ["title", "description", "insight"],
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                insight: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error) {
    console.error(error);
    res.json({
      recommendation: {
        title: "Autopilot Recommendation",
        description: "Align your high priority task directly in the morning focus slot when cognitive reserve is highest.",
        insight: "Highest impact task confirmed."
      }
    });
  }
});

// ---------------------------------------------------------
// 15. /api/reviews/weekly
// ---------------------------------------------------------
app.get("/api/reviews/weekly", (req, res) => {
  res.json({
    review_status: "complete",
    week_summary: "A robust week of deep execution! Completed 3 major focus blocks totaling 75 minutes of deep focus. Level up achievement unlocked.",
    achievements: ["First Execution"],
    recommendations: ["Ensure to block next week's focus slots on Monday morning to secure progress."]
  });
});

// ---------------------------------------------------------
// 16. /api/tasks/[id]/complete
// ---------------------------------------------------------
app.post("/api/tasks/:id/complete", (req, res) => {
  res.json({ id: req.params.id, status: "completed", timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------
// 16b. /api/tasks/suggest-category
// ---------------------------------------------------------
app.post("/api/tasks/suggest-category", async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "No task title provided" });
  }

  const apiKey = process.env.PRIMARY_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.BACKUP_GEMINI_API_KEY;
  if (!apiKey) {
    // Elegant local classification fallback
    const lowerTitle = title.toLowerCase();
    let suggested = "personal";
    if (lowerTitle.includes("code") || lowerTitle.includes("learn") || lowerTitle.includes("react") || lowerTitle.includes("study") || lowerTitle.includes("course") || lowerTitle.includes("book") || lowerTitle.includes("read") || lowerTitle.includes("write")) {
      suggested = "learning";
    } else if (lowerTitle.includes("work") || lowerTitle.includes("saas") || lowerTitle.includes("project") || lowerTitle.includes("client") || lowerTitle.includes("meeting") || lowerTitle.includes("build") || lowerTitle.includes("launch") || lowerTitle.includes("market") || lowerTitle.includes("design") || lowerTitle.includes("app")) {
      suggested = "work";
    } else if (lowerTitle.includes("run") || lowerTitle.includes("gym") || lowerTitle.includes("health") || lowerTitle.includes("workout") || lowerTitle.includes("diet") || lowerTitle.includes("sleep") || lowerTitle.includes("meditat") || lowerTitle.includes("breathe") || lowerTitle.includes("walk")) {
      suggested = "health";
    } else if (lowerTitle.includes("money") || lowerTitle.includes("tax") || lowerTitle.includes("finance") || lowerTitle.includes("budget") || lowerTitle.includes("pay") || lowerTitle.includes("spend") || lowerTitle.includes("save")) {
      suggested = "finance";
    }
    return res.json({ category: suggested });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Classify the task title: "${title}" into one of the following goal categories: "work", "learning", "health", "finance", "personal". Reply with ONLY the category string as JSON with a 'category' key.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["category"],
          properties: {
            category: { type: Type.STRING }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json({ category: (parsedData.category || "personal").toLowerCase() });
  } catch (error) {
    console.error(error);
    res.json({ category: "personal" });
  }
});

// ---------------------------------------------------------
// 17. /api/voice/intent
// ---------------------------------------------------------
app.post("/api/voice/intent", async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) {
    return res.status(400).json({ error: "No transcript provided" });
  }

  const apiKey = process.env.PRIMARY_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.BACKUP_GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      action: "add_task",
      task_title: transcript,
      task_description: "Added via voice command",
      text: `Understood command: "${transcript}". Created matching actionable item.`
    });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Analyze this voice transcription: "${transcript}". Map it to an execution intent. Return JSON with 'action' ('add_goal', 'add_task', or 'unknown'), 'goal_title' (string if goal, else empty), 'task_title' (string if task, else empty), and a response 'text' confirming the command back to the user.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["action", "text"],
          properties: {
            action: { type: Type.STRING },
            goal_title: { type: Type.STRING },
            task_title: { type: Type.STRING },
            text: { type: Type.STRING }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error) {
    console.error(error);
    res.json({
      action: "add_task",
      task_title: transcript,
      text: `Command parsed: "${transcript}".`
    });
  }
});

// ---------------------------------------------------------
// 18. /api/voice/transcribe
// ---------------------------------------------------------
app.post("/api/voice/transcribe", (req, res) => {
  res.json({ transcript: "Create a goal to launch my marketing campaign." });
});

// ---------------------------------------------------------
// 19. /api/schedule/suggest
// ---------------------------------------------------------
app.post("/api/schedule/suggest", async (req, res) => {
  const { tasks, days } = req.body;
  const apiKey = process.env.PRIMARY_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.BACKUP_GEMINI_API_KEY;

  if (!apiKey) {
    const updatedTasks = tasks.map((t: any, index: number) => {
      if (t.status === "completed") return t;
      const dayIndex = index % days.length;
      const targetDay = days[dayIndex];
      let hour = 18;
      if (t.priority === "high") hour = 9;
      else if (t.priority === "medium") hour = 14;
      return {
        id: t.id,
        scheduled_date: targetDay,
        scheduled_hour: hour
      };
    });
    return res.json({
      tasks: updatedTasks,
      explanation: "Fallback scheduler distributed your tasks based on Priority. High-priority items are placed in morning Peak Focus slots, and mid-priority in Creative slots."
    });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `You are an elite productivity scheduler for "The Last-Minute Life Saver" app.
We have ${tasks.length} tasks and a 7-day schedule window: ${JSON.stringify(days)}.
Analyze the priority, estimated_minutes, and due_date of each task.
Assign an optimal 'scheduled_date' (one of the strings in the list ${JSON.stringify(days)}) and 'scheduled_hour' (an integer representing the hour, strictly choosing from 9, 11, 14, 16, or 18) for each pending task.
High-priority or tight-deadline tasks MUST be scheduled earliest in the 9 (AM) or 11 (AM) Peak Focus blocks when cognitive energy is highest.
Provide your response in JSON format.
Return a list of tasks with their corresponding 'id', 'scheduled_date', 'scheduled_hour' and a brief 'explanation' (max 40 words) of why this schedule is optimized for performance.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["tasks", "explanation"],
          properties: {
            explanation: { type: Type.STRING },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "scheduled_date", "scheduled_hour"],
                properties: {
                  id: { type: Type.STRING },
                  scheduled_date: { type: Type.STRING },
                  scheduled_hour: { type: Type.INTEGER }
                }
              }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error) {
    console.error(error);
    res.json({
      tasks: tasks.map((t: any, index: number) => ({
        id: t.id,
        scheduled_date: days[index % days.length],
        scheduled_hour: t.priority === "high" ? 9 : 14
      })),
      explanation: "Scheduled automatically to protect upcoming deadlines."
    });
  }
});


// ---------------------------------------------------------
// 20. /api/agent/chat (HTTP Voice Chat Fallback)
// ---------------------------------------------------------
app.post("/api/agent/chat", async (req, res) => {
  const { message, language } = req.body;
  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  const apiKey = process.env.PRIMARY_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.BACKUP_GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      text: `Hello! I am your PlanAhead companion in mock offline mode. Configure a Gemini API Key to enable my real-time voice and intelligent planning support.`,
      audio: null
    });
  }

  try {
    const ai = getGeminiClient();
    const targetLang = language || "English";
    
    // Step 1: Generate text response
    const textResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: `You are 'PlanAhead AI Companion', a friendly and motivating executive function assistant. Keep your answers brief, under 50 words, and focused on helping the user stay organized. IMPORTANT: You MUST generate your response entirely in the requested language: ${targetLang}.`
      }
    });

    const text = textResponse.text || "I am ready to help you plan.";

    // Step 2: Generate TTS audio using gemini-3.1-flash-tts-preview
    let audioBase64 = null;
    try {
      const ttsResponse = await ai.interactions.create({
        model: "gemini-3.1-flash-tts-preview",
        input: `Say the following: ${text}`,
        response_modalities: ["audio"],
      });

      // Find the audio chunk in steps
      for (const step of ttsResponse.steps) {
        if (step.type === 'model_output') {
          const audioContent = step.content?.find(c => c.type === 'audio');
          if (audioContent && audioContent.data) {
            audioBase64 = audioContent.data;
            break;
          }
        }
      }
    } catch (ttsErr) {
      console.error("TTS generation failed, falling back to text-only:", ttsErr);
    }

    res.json({
      text,
      audio: audioBase64
    });

  } catch (error: any) {
    console.error("Agent chat failed:", error);
    res.status(500).json({ error: error.message || "Failed to process chat" });
  }
});


// ---------------------------------------------------------
// Vite Middleware & Production Serving Configuration
// ---------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Vite dev server middleware mode initiating...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`PlanAhead companion backend server active on port ${PORT}`);
  });

  // Attach WebSocket Server
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
    if (pathname === "/api/live-ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", async (ws) => {
    console.log("WebSocket client connected to Live API");
    const apiKey = process.env.PRIMARY_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.BACKUP_GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("No Gemini API key found for Live API. Running in mock voice mode.");
      ws.send(JSON.stringify({ 
        info: "Running in offline mock mode because no GEMINI_API_KEY is configured." 
      }));
      
      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.audio) {
            // Echo back to demonstrate
            setTimeout(() => {
              ws.send(JSON.stringify({
                text: "I received your voice! In mock mode, configure your GEMINI_API_KEY to enable full live conversations.",
              }));
            }, 1000);
          }
        } catch (e) {
          console.error("Mock WebSocket message error:", e);
        }
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              ws.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              ws.send(JSON.stringify({ interrupted: true }));
            }
            
            const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (text) {
              ws.send(JSON.stringify({ text }));
            }
          },
          onclose: () => {
            console.log("Gemini Live session closed");
            ws.close();
          },
          onerror: (err) => {
            console.error("Gemini Live error:", err);
            ws.send(JSON.stringify({ error: err.message || "Gemini Live error" }));
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are 'PlanAhead AI Companion', a helpful and motivating executive function assistant. Keep your answers brief, friendly, and focus-oriented.",
        }
      });

      ws.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" }
            });
          }
        } catch (e) {
          console.error("Error sending input to Gemini Live:", e);
        }
      });

      ws.on("close", () => {
        console.log("Client disconnected from Live API");
        try {
          session.close();
        } catch (e) {
          // ignore
        }
      });

    } catch (err: any) {
      console.error("Failed to connect to Gemini Live:", err);
      ws.send(JSON.stringify({ error: `Connection failed: ${err.message}` }));
      ws.close();
    }
  });
}

startServer();
