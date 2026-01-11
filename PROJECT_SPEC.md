# Project Spec: ScientificMuscle

## 1. Product Overview
**ScientificMuscle** is a local-first PWA for advanced bodybuilders who track fractional volume (e.g., "1 set Dip = 1.0 Chest + 0.7 Triceps"). It prioritizes data ownership (IndexedDB) and precision.

### Core Architecture
* **Stack:** Vite + React (SPA) + TypeScript.
* **Data:** IndexedDB (via Dexie.js).
* **State:** TanStack Query (managing async DB state).
* **Styles:** Tailwind CSS + shadcn/ui.
* **Deployment:** Static Web Host (e.g., Vercel/Netlify).

## 2. Development Protocol (Strict)
1.  **Database First:** The UI Agent MUST NOT mock data. It must connect to the real IndexedDB. If the DB isn't ready, the UI Agent waits for the Database Agent.
2.  **Strict TDD (Logic Only):**
    * **Step 1:** Write a `.test.ts` file asserting the desired behavior.
    * **Step 2:** Run the test (It MUST fail).
    * **Step 3:** Write the minimum `.ts` implementation to pass the test.
    * **Step 4:** Refactor.
3.  **Migration Strategy:** For MVP, schema changes = "Nuke & Rebuild" (Delete DB).

## 3. Features & Modules

### A. Core Logic (Logic Agent)
* **Scope:** `src/core/`
* **Key Types:** `ScientificMuscle`, `FunctionalGroup`.
* **Math:** Fractional set aggregation (summing `0.7` sets across weeks).
* **Parsers:** Hevy CSV parser, Strong CSV parser.

### B. Persistence (Database Agent)
* **Scope:** `src/db/`
* **Schema:** `workouts`, `exercises`, `profiles`.
* **Hooks:** `useWorkouts()`, `useStats()`.

### C. Interface (UI Agent)
* **Scope:** `src/ui/`
* **Pages:** Dashboard (Weekly Volume), Analysis (Muscle Heatmap), Settings.
* **Components:** Charts (Recharts), Forms (shadcn/ui).

### D. Quality Assurance (QA Agent)
* **Tool:** Playwright (E2E).
* **Workflow:** Agent launches app -> clicks flows -> verifies charts render.