# PlanAhead — AI Execution Companion

PlanAhead is a professional, full-stack personal planning and focus optimization platform. Engineered with **React 19, Vite, Express, and Tailwind CSS v4**, it leverages the modern **Gemini SDK** (`@google/genai`) to provide smart, context-aware goal decomposition, real-time focus coaching, and velocity visualization.

---

## 🚀 Key Features

*   📅 **Smart Operating Plan (Dashboard)**: Start each day with an automated, digestible breakdown of goals, focus streaks, and dynamic operation timers.
*   🎯 **Objective Map & Goal Planner**: Visually outline objectives and decompose complex goals into discrete actionable sub-tasks with a single click.
*   📅 **AI Scheduler & Calendar**: Visualize and plan upcoming deadlines. Complete with robust Google OAuth / Calendar synchronization support.
*   ⏱️ **Focus Coaching & Pomodoro Engine**: Stay in the flow with a highly stylized, interactive focus timer featuring ambient visual pacing, sprint counters, and interactive productivity coaching.
*   📊 **Momentum Center**: Gain insight into your execution speed, task categories, and daily sprint volume through interactive, responsive charts.
*   🎙️ **Conversational AI Companion**: Interact with your personal assistant via real-time microphone diagnostics to navigate motivation drops and productivity blockages.
*   🔒 **Secure Sandbox & Profiles**: Complete account telemetry, secure Firebase sandbox profiles, multi-language localization (9 languages), and complete dark/light theme options.

---

## 🛠️ Technology Stack

*   **Frontend**: React 19, Tailwind CSS v4, Zustand (State Management), Framer Motion (Animations), Recharts (Visualizations), Lucide React (Icons).
*   **Backend**: Node.js, Express (API routes & server-side Vite middleware proxying).
*   **AI Engine**: `@google/genai` TypeScript SDK executing models securely on the server side.
*   **Compilation**: Compiled into an ultra-fast CommonJS package using `esbuild` for maximum container cold-start and runtime optimization.

---

## 📂 Project Structure

```text
├── server.ts                  # Full-stack Express server with Vite middleware integration
├── package.json               # Manifest file containing scripts and dependencies
├── metadata.json              # Applet configuration, permissions, and descriptors
├── tsconfig.json              # TypeScript compilation configurations
├── vite.config.ts             # Vite server and bundler plugin setup
├── .env.example               # Template documenting required environment variables
├── PRD.md                     # Complete Product Requirement Document
└── src/
    ├── main.tsx               # Frontend client-side React entry point
    ├── App.tsx                # Main client UI application file (tabs, state, views)
    ├── index.css              # Global styling importing Tailwind CSS v4 and custom themes
    ├── store/
    │   └── use-store.ts       # Main Zustand store for localized reactive state
    └── lib/
        └── translations.ts    # Comprehensive multi-language dictionaries
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory based on `.env.example`:

```env
# Secure model execution key (never exposed to browser)
GEMINI_API_KEY="your_api_key_here"

# Public application base URL
APP_URL="http://localhost:3000"
```

---

## 💻 Getting Started

### 1. Install Dependencies
Install all required libraries using your package manager:
```bash
npm install
```

### 2. Run the Development Server
Starts the full-stack server locally (runs Express + Vite on port `3000` with hot-reloading):
```bash
npm run dev
```
Open your browser to `http://localhost:3000` to interact with the application.

### 3. Production Build
Compile the frontend bundle and package the Express server using `esbuild` for production-ready container execution:
```bash
npm run build
```

### 4. Start Production Server
Launch the self-contained production bundle:
```bash
npm run start
```

---

## 🛡️ Security, Best Practices & Performance
*   **Zero Leakage**: Strict server-side proxying ensures API keys (`GEMINI_API_KEY`) are kept fully hidden from client inspection.
*   **Clean Bundle**: Bundled as a self-contained CommonJS file under `dist/server.cjs` to bypass Node runtime ESM overheads and ensure high-efficiency boots.
*   **Accessible Typography**: Generous padding, fully responsive grids, clear semantic HTML elements, and high-contrast styling adhering to strict Web Content Accessibility Guidelines.
