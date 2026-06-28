# Product Requirement Document (PRD): PlanAhead — AI Execution Companion

PlanAhead is a comprehensive, production-ready, full-stack personal productivity and execution orchestration engine. It acts as an **AI Execution Companion**, bridging the gap between high-level ambition (Goal Planning) and granular, focused execution (Daily Operating Plans, Pomodoro Coaching, and Velocity Tracking).

---

## 1. Executive Summary & Vision

Traditional planners and calendar apps manage *time*, but they fail to manage *momentum, cognitive load, and motivation*. PlanAhead provides an active, feedback-driven execution system powered by high-concurrency LLM decomposition and a conversational audio interface.

### Core Value Propositions
*   **Active Decomposition**: Turn abstract goals into sequential operating plans with a single click.
*   **Momentum Over Logging**: Track focus density (sprints completed, streak counts, attention spans) instead of just static checkmarks.
*   **Conversational Guidance**: An immersive vocal AI agent that responds contextually to productivity blocks and motivation deficits.
*   **Secure & Portable Sync**: Portable session persistence using a client-side Firebase sandbox environment, alongside secure Google OAuth integration.

---

## 2. Feature & Functional Specifications

### 2.1 Today's Operating Plan (Dashboard)
The command center of PlanAhead. Displays current metrics, daily progress arcs, and the parsed timeline of active tasks.
*   **Dynamic Decomposition**: Pulls from the Goal Planner to list actionable operational steps.
*   **Streak Tracking**: Tracks consecutive active days of focus and completion.
*   **Real-time Clock**: Live local/UTC timestamp tracking for absolute time awareness.

### 2.2 Interactive Objective Map (Goal Planner)
A structured node layout for strategic, long-term goals.
*   **Goal Formulation**: Create specific objectives with targeting parameters (due dates, urgency, categories).
*   **One-Click AI Breakdowns**: Integrated server-side Gemini decomposition endpoint parses goals and populates active nested sub-task checklists dynamically.

### 2.3 AI Scheduler & Calendar
Combines automated duration estimation with multi-day structural views.
*   **Google Calendar Integrator**: Enables secure Google OAuth connection to synchronize tasks directly with real-world schedules.
*   **Interactive Deadlines**: Resilient drag-and-drop/clickable scheduling grid for simple manual time blocks.

### 2.4 Focus Timer & Coaching Engine
A highly tailored, sensory-friendly Pomodoro coach designed to maintain flow states.
*   **Focus Sprints**: Custom intervals with configurable intervals.
*   **Dynamic UI Cues**: Dark ambient theme with subtle breathing loops and color shifts based on the current session status (Focus, Short Break, Long Break).
*   **Attention Indicators**: Visual indicators showing current focus density.

### 2.5 Productivity Velocity Engine (Momentum Center)
Interactive performance dashboard mapping quantitative execution patterns.
*   **Activity Distribution**: Bar, line, and pie charts rendered through Recharts tracking daily execution velocities and categories.
*   **Sprint Volume Metrics**: Comprehensive visualization of Pomodoro sprints completed over historical periods.

### 2.6 Immersive Talking Agent
An interactive, voice-first companion providing motivation and real-time guidance.
*   **Vocal Diagnostics**: Users activate microphone input to communicate productivity blocks (e.g., "I'm procrastinating", "I feel overwhelmed").
*   **Dynamic Response Loop**: Server-side Gemini processing generates contextual guidance and motivation.

### 2.7 Secure User Security Profile
A secure user space incorporating complete account telemetry.
*   **Identity Provider**: Tracks Firebase Auth state or active Google OAuth parameters.
*   **Profile Integrity**: Renders detailed user avatars, email targets, sandbox profiles, and verified active session timestamps.
*   **Flexible Localization**: Complete application UI available across 9+ global languages.

---

## 3. Technology Stack & System Architecture

PlanAhead leverages a resilient full-stack architecture built on modern technologies:

```
┌────────────────────────────────────────────────────────┐
│                      Client App                        │
│   (Vite + React 19 + Tailwind CSS 4 + Motion + Recharts)│
└───────────────────────────┬────────────────────────────┘
                            │
               HTTPS / WS   │
                            ▼
┌────────────────────────────────────────────────────────┐
│                    Express Backend                     │
│                  (Node.js + tsx + ESM)                 │
└─────────────┬─────────────────────────────┬────────────┘
              │                             │
              ▼                             ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│     Gemini AI Engine      │ │   External Integrations  │
│  (@google/genai SDK)      │ │  (Firebase Auth, Google) │
└───────────────────────────┘ └──────────────────────────┘
```

### 3.1 Frontend
*   **Framework**: React 19 with functional hooks and strict type safety.
*   **Styling**: Tailwind CSS v4 using modern custom properties and fluid layouts.
*   **State Management**: Zustand lightweight reactive stores.
*   **Animations**: Framer Motion (`motion/react`) for smooth, non-intrusive page-level transitions and indicator effects.
*   **Data Visualization**: Recharts for fully responsive performance charts.

### 3.2 Backend
*   **Runtime**: Node.js utilizing `tsx` for dev speed and TypeScript execution.
*   **Framework**: Express 4 running behind an Nginx reverse-proxy on port `3000`.
*   **Build System**: Bundled into CJS format with `esbuild` to ensure strict runtime compatibility and single-entry cold starts.
*   **AI Gateway**: `@google/genai` TypeScript SDK executing models server-side, protecting user/system keys.

### 3.3 Auth & Storage
*   **Client Database**: Local browser cache combined with optional persistent integration.
*   **Identity System**: Multi-provider configuration supporting sandbox setups and direct OAuth callback integrations.

---

## 4. UI/UX Design & Aesthetic Systems

*   **Aesthetic Tone**: Clean Swiss Modernism. High-contrast negative spaces, fine margins, and crisp geometric layouts.
*   **Visual Themes**:
    *   *Light Mode*: High-contrast crisp whites, Slate-900 typography, subtle borders, and light-indigo accents.
    *   *Dark Mode*: Deep anthracite card canvases, glowing accent rings, and clean, high-readability mono indicators.
*   **Typography**: Clean sans-serif font pairing paired with monospace fonts for performance indicators and IDs.
*   **Responsiveness**: Mobile-first design structures with touch-friendly controls (minimum 44px clickable areas) that scale gracefully into desktop panels.

---

## 5. Security & Privacy Safeguards

1.  **API Key Encapsulation**: Absolutely zero browser leakage of API keys. All integrations, prompts, and model interactions are handled through secure Express proxy endpoints (`/api/*`).
2.  **Sandbox Isolation**: Secure fallbacks for authentication, allowing users to securely test and explore all functionality without requiring heavy cloud signups.
3.  **Strict Permission Scopes**: Mic permissions are requested inline and declared in `metadata.json` to prevent malicious background capture.
