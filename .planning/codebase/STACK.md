# Technology Stack

**Analysis Date:** 2026-01-18

## Languages

**Primary:**

- TypeScript 5.9.3 - All source code in `src/`
- Strict mode enabled with `noUncheckedIndexedAccess`

**Secondary:**

- JavaScript - Config files (`eslint.config.js`, `tailwind.config.js`, `postcss.config.js`)

## Runtime

**Environment:**

- Node.js 22.20.0
- Browser (PWA with IndexedDB)

**Package Manager:**

- npm 10.9.3
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**

- React 19.2.3 - UI framework (`src/ui/`)
- React Router 7.12.0 - Client-side routing (`src/App.tsx`)
- TanStack Query 5.90.16 - Server state management (`src/db/hooks/`)
- Dexie.js 4.2.1 - IndexedDB wrapper (`src/db/schema.ts`)

**Styling:**

- Tailwind CSS 4.1.18 - Utility-first CSS (`src/index.css`, all components)
- PostCSS 8.5.6 - CSS processing with `@tailwindcss/postcss` plugin

**Testing:**

- Vitest 4.0.16 - Unit testing (`src/core/__tests__/`)
- Playwright 1.57.0 - E2E testing (`tests/e2e/`)
- Testing Library React 16.3.1 - React component testing
- jsdom 27.4.0 - DOM environment for unit tests

**Build/Dev:**

- Vite 7.3.1 - Build tool and dev server (`vite.config.ts`)
- vite-plugin-pwa 1.2.0 - PWA support with Workbox
- @vitejs/plugin-react 5.1.2 - React Fast Refresh

## Key Dependencies

**Critical:**

- `dexie` 4.2.1 - All data persistence via IndexedDB
- `@tanstack/react-query` 5.90.16 - All async state management
- `react-router-dom` 7.12.0 - All navigation

**UI Components:**

- `recharts` 3.6.0 - Charts and data visualization
- `lucide-react` 0.562.0 - Icon library
- `react-body-highlighter` 2.0.5 - Anatomy diagrams

**Infrastructure:**

- `@vercel/analytics` 1.6.1 - Production analytics
- `sharp` 0.34.5 - Image processing (dev dependency for PWA icons)

**Code Quality:**

- `eslint` 9.39.2 with typescript-eslint 8.52.0
- `prettier` 3.7.4 - Code formatting
- `typescript` 5.9.3 - Type checking

## Configuration

**TypeScript (`tsconfig.json`):**

- Target: ES2020
- Module: ESNext with bundler resolution
- Strict mode: enabled
- Path aliases configured:
  - `@/*` -> `src/*`
  - `@core/*` -> `src/core/*`
  - `@db/*` -> `src/db/*`
  - `@ui/*` -> `src/ui/*`

**Vite (`vite.config.ts`):**

- Dev server port: 3000
- Path aliases mirrored from tsconfig
- PWA configuration with Workbox caching
- Runtime caching for Google Fonts

**ESLint (`eslint.config.js`):**

- Strict TypeScript rules
- No explicit `any` allowed
- React Hooks rules enforced
- Prettier integration

**Prettier (`.prettierrc`):**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**Tailwind (`tailwind.config.js`):**

- Custom `primary` color palette (purple tones)
- Custom `accent` colors (orange, blue, cyan)
- Custom `slideDown` animation

## Platform Requirements

**Development:**

- Node.js 22.x
- npm 10.x
- Modern browser with IndexedDB support

**Production:**

- Static hosting (Vercel)
- PWA-capable browser
- IndexedDB for data persistence (no backend required)

**Browser Support:**

- Desktop Chrome (tested via Playwright)
- Mobile Safari/Chrome (iPhone 12 tested via Playwright)
- PWA installable on iOS and Android

## Build Commands

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # TypeScript check + Vite production build
npm run preview      # Preview production build
npm run test         # Run Vitest unit tests
npm run test:e2e     # Run Playwright E2E tests
npm run lint         # Check ESLint violations
npm run lint:fix     # Auto-fix ESLint violations
npm run format       # Format with Prettier
```

---

_Stack analysis: 2026-01-18_
