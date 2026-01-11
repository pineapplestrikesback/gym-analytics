# GymAnalytics

A local-first PWA for advanced bodybuilders who track fractional muscle volume per set.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

## Available Scripts

| Command            | Description               |
| ------------------ | ------------------------- |
| `npm run dev`      | Start development server  |
| `npm run build`    | Build for production      |
| `npm run preview`  | Preview production build  |
| `npm run test`     | Run unit tests            |
| `npm run test:e2e` | Run Playwright E2E tests  |
| `npm run lint`     | Check for linting errors  |
| `npm run lint:fix` | Fix linting errors        |
| `npm run format`   | Format code with Prettier |

## Features

- **Fractional Volume Tracking**: Each set contributes fractional amounts to multiple muscles (e.g., Bench Press = 1.0 Chest + 0.8 Front Delts + 0.7 Triceps)
- **Hevy Integration**: Sync workouts via API or import CSV exports
- **Profile Isolation**: Separate data per profile
- **Local-First**: All data stored in IndexedDB via Dexie.js

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Dexie.js (IndexedDB)
- TanStack Query
- Vitest + Playwright

## Project Structure

```
src/
├── core/           # Pure logic (taxonomy, parsers, calculators)
├── db/             # Database schema and hooks
└── ui/             # React components and pages
```
