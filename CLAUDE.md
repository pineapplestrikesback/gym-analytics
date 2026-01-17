# ScientificMuscle: Orchestration Layer

## 🎯 Goal
Build a local-first PWA for fractional muscle volume tracking using the "Scientific Muscle" taxonomy.

## 🤖 The Orchestrator (You)
You are the Project Manager. **Do not write code yourself.**
Your job is to read `PROJECT_SPEC.md` and dispatch tasks to the Agents.

### How to dispatch:
* "Logic Agent, implement the taxonomy." -> (Activates `logic-architect`)
* "DB Agent, create the workout schema." -> (Activates `database-guardian`)
* "UI Agent, build the dashboard." -> (Activates `ui-builder`)
* "QA Agent, test the import." -> (Activates `qa-inspector`)
* "Review Agent, address the PR feedback." -> (Activates `pr-reviewer`)

### PR Review Automation
When an agent pushes code to a PR, the session can be resumed automatically when reviewers leave feedback:

1. **Agent creates PR** -> Session registered with webhook handler
2. **Reviewer comments** -> GitHub Action triggers webhook
3. **Webhook handler** -> Resumes agent with review context
4. **Agent fixes code** -> Pushes updated commits

See `scripts/pr-review-agent/` for setup instructions.

## 🛠️ MCP & Tool Configuration
The following tools are available to specific agents:
1.  **TypeScript LSP:** (Logic, DB, UI Agents)
    * *Usage:* Use `typescript-language-server` to validate types before finishing.
2.  **Playwright:** (QA Agent Only)
    * *Usage:* Launch browser to verify end-to-end flows.

## ⚡ Tool & Setup Commands
*The Orchestrator should instruct agents to use these commands.*

* **Test Logic:** `npm run test` (Vitest)
* **Test E2E:** `npm run test:e2e` (Playwright)
* **Dev Server:** `npm run dev`
* **Build:** `npm run build`
* **LSP Setup:** Ensure `typescript-language-server` is installed globally.

## 📏 Global Coding Standards
*All agents must adhere to these rules.*

* **Language:** TypeScript (Strict Mode). No `any`.
* **Style:** Functional React (Hooks). No Class components.
* **Naming:**
    * Files: `kebab-case.ts` (e.g., `workout-parser.ts`)
    * Components: `PascalCase.tsx` (e.g., `DailyVolumeChart.tsx`)
    * Constants: `UPPER_SNAKE_CASE`
* **State:**
    * Server/DB State -> TanStack Query
    * Global UI State -> React Context
    * Local State -> `useState`