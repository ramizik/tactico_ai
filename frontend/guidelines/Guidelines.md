You are Figma Make AI. Your sole job is to generate a production-quality, frontend-only React (TypeScript) codebase for the TacticoAI MVP.
You must not create any backend code or network integrations.
You must annotate the code with informative comments and clearly mark where backend connections will later be wired.\*\*

## 🔒 Non-Negotiable Rules

1. **Frontend-only.** Do **not** implement backend logic, servers, DB, auth, or actual API calls.
2. **No live network calls.** Use **typed mock data** and **stubbed services** only.
3. **TypeScript + React + Vite.** Generate TS React components with strong props typing.
4. **UI kit & styling.** Use **TailwindCSS** + **shadcn/ui** + **Lucide icons**.
5. **Routing.** Use **React Router** for client routes; no server routing.
6. **State.** Use **React Context** for global UI state (theme, session, demo flags).
7. **A11y & DX.** Add ARIA labels, keyboard focus states, and **helpful comments** for devs.
8. **Backend handoff markers.** Where backend will connect, add clear comments:

   ```ts
   // BACKEND_HOOK: describe expected API, payloads, and success/error states
   ```

9. **Testability.** Add `data-testid` attributes to significant elements.
10. **Copy & micro-UX.** Provide sensible labels, empty states, loading skeletons, and error banners.

## 🚨 CRITICAL: Import & Build Rules

### **Asset Imports**
- **NEVER** use `figma:asset/` prefix for imports
- **ALWAYS** use relative paths: `../assets/filename.png`
- **ALWAYS** create proper TypeScript declarations for assets in `types/assets.d.ts`
- **NEVER** import assets with version numbers or special prefixes

### **Package Imports**
- **NEVER** include version numbers in import statements
- **CORRECT**: `import { Button } from '@radix-ui/react-button'`
- **WRONG**: `import { Button } from '@radix-ui/react-button@1.2.3'`
- **ALWAYS** use clean package names without version suffixes

### **TypeScript Configuration**
- **ALWAYS** exclude `vite.config.ts` from main tsconfig.json compilation
- **ALWAYS** include proper type declarations for asset files
- **NEVER** leave implicit `any` types - always provide explicit types
- **ALWAYS** remove unused imports and variables to prevent build errors

### **Build Validation**
- **MANDATORY**: Code must compile with `npm run build` without errors
- **MANDATORY**: Development server must start with `npm run dev` without errors
- **NEVER** commit code that fails TypeScript compilation
- **ALWAYS** test build process before considering code complete

---

## 🧱 Project Overview (Pages & Purpose)

Generate a multi-page React app with these routes and responsibilities:

1. **Landing / Intro** (`/`)
   - Centered CTA ("Get Started") and short value prop.
   - Secondary CTA: "View Demo Matches".
   - **Theme preview** chips (soccer + college variants).
   - Animated background with gradient overlays.

2. **Selection** (`/selection`)
   - University selection (UOP, UC California) with dynamic theming.
   - Sport selection (Soccer) with emoji icons.
   - Smooth transitions and theme application.

3. **Dashboard** (`/dashboard`)
   - **Recent Matches**: cards with thumbnails, scores, and status badges.
   - **Upcoming Matches**: schedule with dates and opponents.
   - **Performance Widget**: win rate, offense/defense metrics.
   - Real-time data from mock Supabase integration.

4. **Past Games** (`/past-games`)
   - **Match History Table**: date, teams, video links, status badges.
   - **Upload Panel**: drag-drop file → show queued "job" with progress bar.
   - **AI Coach Section**: voice coach integration UI.
   - Filters: by sport, opponent, date range (client-only).

5. **My Team** (`/my-team`)
   - **Roster Grid**: FIFA-style player cards with avatars, positions, stats.
   - **Team Stats Summary**: league position, average rating, active players.
   - **Add/Remove Players**: modals for roster management.
   - College/sport theming applied.

6. **Match Detail** (`/match/:id`)
   - **Embedded video player** (use local placeholder mp4).
   - **AI Summary panel** (mock text from JSON).
   - **Formation card** (simple SVG pitch/court visualization).
   - **Metrics grid** (possession, press index, width, compactness).
   - **Events table** (minute, type, player, zone).
   - "Call Voice Coach" (UI modal) + "Download Report" button.

---

## 🎨 Theming & Layout Requirements

- **Theme engine** driven by **sport** (soccer) + **college** (UOP, UC California):
  - Colors, logo, accent borders, background textures.
  - Provide **mock theme registry** (TS) keyed by `{ sport, collegeCode }`.
- **Design tokens** via CSS variables (in Tailwind layer).
- **Responsive** (mobile → desktop), minimum 320px width; use grid systems for cards.
- **Dynamic theming** that updates instantly on university/sport selection.

---

## 🧩 Data & Mock Services (strictly local)

Create a small **`/src/mocks`** folder with typed fixtures and "fake service" functions:

- `themes.ts`: typed map of colleges & sport themes (colors, logos).
- `user.ts`: mock session object after "login".
- `matches.ts`: sample matches for soccer with statuses.
- `analysis.ts`: per-match **LLM-ready JSON** examples:

  ```ts
  export type Analysis = {
    matchId: string;
    summary: string;
    formation: {
      team: string;
      opponent: string;
      confidence: number;
    };
    metrics: {
      possessionPct: number;
      pressIndex: number;
      widthM: number;
      compactness: number;
      shots: number;
    };
    events: {
      id: string;
      minute: number;
      type:
        | "line_break"
        | "shot"
        | "turnover"
        | "press_trigger";
      player?: number;
      zone?: string;
    }[];
    playerStats: {
      playerId: string;
      jersey: number;
      xfactor?: string;
      involvements?: number;
    }[];
  };
  ```

- `players.ts`: roster for two demo teams with soccer positions.
- `uploads.ts`: a fake queue API (in-memory) to simulate: `queued → processing → analyzed` with timeouts.

**All code must compile and run without network connectivity.**

---

## 🧭 File/Folder Blueprint

Create this structure and populate it:

```
/src
  /components
    /common         // Buttons, Cards, StatChip, Badge, EmptyState, Skeleton, Toast
    /analysis       // UploadPanel, MatchCard, FilterBar, VoiceCoachModal
    /match          // VideoPlayer, FormationCard, MetricsGrid, EventsTable, PlayersTable, DownloadCard
    /team           // RosterGrid, PlayerCard, AddPlayerModal, RemovePlayerModal, TeamFormWidget
    /theming        // ThemeProvider, ThemePreview, Logo
    /navigation     // Navigation, GlobalHeader, SportSwitcher
    /ui             // shadcn/ui components (40+ components)
  /contexts         // ThemeContext, SessionContext
  /hooks            // useTheme, useSession, useUploadQueue, useToasts, useSupabaseData
  /lib              // supabase.ts, api.ts, database.types.ts, utils
  /mocks            // typed fixtures listed above
  /styles           // tailwind.css, globals.css, tokens.css
  /assets           // placeholder videos, logos, icons
  App.tsx
  main.tsx
  index.css
```

- Each component must include **top-of-file JSDoc** explaining what it does and where backend will connect, e.g.:

  ```ts
  /**
   * UploadPanel
   * Renders drag-drop area and mocked queue progression.
   * BACKEND_HOOK:
   *  - Will POST /api/matches with video upload reference (Supabase/Firebase)
   *  - Poll GET /api/jobs/:id for status {queued|running|completed|failed}
   */
  ```

---

## 🧑‍💻 Coding & UX Standards

- **TypeScript first.** Define component props & domain types; no `any`.
- **ARIA & keyboard**: focus rings, `aria-live` for progress, labels for forms.
- **Shadcn/ui** for Cards, Tabs, Dialog/Modal, Dropdown, Badge, Progress.
- **Tailwind** utility classes w/ sensible `className` composition (no inline styles).
- **Data-testids** on: upload dropzone, match cards, summary text, metrics grid, events table, roster cards, theme chips, voice coach button.
- **Empty states** (no matches, no players), **loading skeletons**, **error banners**.
- **Copywriting**: concise, coach-friendly ("Quick Brief", "View Evidence", "Formation Confidence").
- **No lorem ipsum**; use realistic microcopy.
- **All pages mobile-responsive**; verify card stacking and tap targets.

---

## 🧪 Demo-First Interactions (mocked end-to-end)

- **Upload flow:** selecting a file enqueues a **fake job**; show progress → then reveal "analysis available".
- **Analysis page:** filters update client-side; clicking a match enters **Match Detail**.
- **Match Detail:** show a playable local video, render summary/metrics/events from mock data; "Download PDF" opens a nice printable view (no real PDF).
- **Voice Coach:** modal with example prompts visually "streaming" responses from mock fixtures (no TTS).

---

## 🏷️ Backend Hook Annotations (examples to include in code)

- Landing: none.
- Selection:

  ```ts
  // BACKEND_HOOK (Theme & Team Selection):
  // - Store user's university/sport preference in Supabase
  // - Load team data based on selection
  ```

- Dashboard (Data):

  ```ts
  // BACKEND_HOOK (Dashboard Data):
  // - GET /api/teams/{id}/matches (recent + upcoming)
  // - GET /api/teams/{id}/form (aggregated stats)
  ```

- Past Games (Upload):

  ```ts
  // BACKEND_HOOK (Upload + Job):
  // - Upload video to Supabase Storage
  // - POST /api/matches { teamId, opponent, sport, videoPath }
  // - Poll GET /api/jobs/:jobId for processing status
  ```

- Match Detail (Data):

  ```ts
  // BACKEND_HOOK (Analysis Data):
  // - GET /api/analyses/:matchId → summary, metrics, events, playerStats
  // - GET /api/matches/:id → video signed URL
  ```

- My Team (Roster):

  ```ts
  // BACKEND_HOOK (Roster CRUD):
  // - GET/POST/DELETE /api/players for this team
  // - Aggregate last 5 matches: GET /api/team/:id/form
  ```

---

## 🎯 Specific Implementation Requirements

### **Theme System**

- Implement dynamic theming based on university + sport selection
- UOP: Orange (#FF671D) + Black (#231F20)
- UC California: Blue (#1295D8) + Gold (#FFB511)
- Soccer: Green accent (#22c55e)

### **Navigation Structure**

- Global header with branding and sport switcher
- Tab-based navigation (Dashboard, Past Games, My Team)
- Smooth page transitions

### **Data Integration**

- Use custom hooks for Supabase data fetching
- Mock data that matches your actual database schema
- Realistic demo data for UOP and UC California teams

### **Component Library**

- 40+ shadcn/ui components already implemented
- Consistent design system with Tailwind
- Accessible components with proper ARIA labels

---

## ✅ Acceptance Criteria

- `npm install && npm run dev` runs the app offline with **no errors**.
- All routes function with **mock data** and **clear UI**.
- Every major component has **JSDoc** + **BACKEND_HOOK** comments.
- Theming updates instantly when selecting college/sport.
- Upload queue simulates status changes to "Analyzed" within ~10s.
- Match Detail shows **video, summary, formation SVG, metrics grid, events table, players table**, and **voice coach modal**.
- Lighthouse a11y score ≥ 90 on core pages (rough).

## 🔧 Code Quality & Validation Checklist

### **Pre-Commit Validation**
- [ ] `npm run build` completes without TypeScript errors
- [ ] `npm run dev` starts without errors
- [ ] All imports use correct paths (no `figma:asset/` prefixes)
- [ ] All package imports are clean (no version numbers)
- [ ] No unused imports or variables
- [ ] All TypeScript types are explicit (no implicit `any`)
- [ ] Asset imports use relative paths: `../assets/filename.png`

### **Import Standards**
```typescript
// ✅ CORRECT Asset Imports
import logoImage from '../assets/logo.png';
import coachImage from '../assets/coach.png';

// ❌ WRONG Asset Imports
import logoImage from 'figma:asset/logo.png';
import coachImage from 'figma:asset/coach.png';

// ✅ CORRECT Package Imports
import { Button } from '@radix-ui/react-button';
import { Dialog } from '@radix-ui/react-dialog';

// ❌ WRONG Package Imports
import { Button } from '@radix-ui/react-button@1.2.3';
import { Dialog } from '@radix-ui/react-dialog@1.1.6';
```

### **TypeScript Configuration Requirements**
```json
// tsconfig.json must include:
{
  "exclude": ["vite.config.ts"],
  "include": ["**/*.ts", "**/*.tsx", "types/**/*.d.ts"]
}
```

### **Asset Type Declarations**
```typescript
// types/assets.d.ts must exist with:
declare module "*.png" {
  const value: string;
  export default value;
}
declare module "*.jpg" {
  const value: string;
  export default value;
}
```

---

## ⚠️ Common Pitfalls & Prevention

### **Asset Import Errors**
- **Problem**: Using `figma:asset/` prefix causes module resolution failures
- **Solution**: Always use relative paths `../assets/filename.png`
- **Prevention**: Never use special prefixes for asset imports

### **Package Import Errors**
- **Problem**: Including version numbers in imports causes build failures
- **Solution**: Use clean package names without version suffixes
- **Prevention**: Always import packages by name only, never with `@version`

### **TypeScript Configuration Issues**
- **Problem**: `vite.config.ts` conflicts with main TypeScript compilation
- **Solution**: Exclude `vite.config.ts` from main tsconfig.json
- **Prevention**: Always separate build configs from app configs

### **Unused Variable Errors**
- **Problem**: Unused imports and variables cause TypeScript strict mode failures
- **Solution**: Remove all unused imports and variables
- **Prevention**: Use ESLint rules to catch unused variables automatically

### **Implicit Any Types**
- **Problem**: Missing type annotations cause TypeScript errors
- **Solution**: Always provide explicit types for function parameters
- **Prevention**: Enable strict TypeScript mode and avoid `any` types

### **Build Validation Process**
1. **Before coding**: Ensure `npm run build` works
2. **During development**: Run `npm run build` frequently
3. **Before committing**: Always test both `npm run build` and `npm run dev`
4. **After changes**: Verify no new TypeScript errors introduced

---

## 🧰 Optional niceties (only if time allows)

- Simple **print view** for the match report.
- **Toast system** for success/error messages.
- **LocalStorage** persistence for session + theme.
- Minimal **unit tests** for pure utils (formatting, sorting).

---

**Generate the complete codebase now following this spec. Do not include any backend or network code. Prioritize clarity, comments, and hackathon velocity.**