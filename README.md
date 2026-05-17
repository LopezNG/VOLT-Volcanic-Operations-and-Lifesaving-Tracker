# VOLT - Volcanic Operations and Lifesaving Tracker - Current Build Update

**VOLT** is an Expo React Native emergency readiness app for Taal Volcano households, pairing an offline-first mobile interface with a Node/Express bulletin backend, live PHIVOLCS scraping, local SQLite persistence, SMS check-ins, reminders, and optional Gemini-powered bulletin explanations.

## Why This Project

Volcanic risk information is often scattered across official bulletins, local government advisories, household needs, emergency contacts, go-bag readiness, and real-time family status. During a stressful event, that fragmentation makes it harder for families to understand what matters now and what action to take next.

**VOLT** turns that fragmented context into clear, timely utility by combining:

- Official-source Taal bulletin retrieval.
- Household-specific risk and readiness rules.
- Local emergency profiles and contacts.
- Offline emergency card snapshots.
- SMS-based family check-ins.
- Optional AI explanations with deterministic fallback behavior.

The project is scoped as an **Expo-first mobile prototype** with durable on-device state and a separately runnable backend. It includes seeded local demo data for reliable offline flows, while the backend can retrieve live PHIVOLCS Taal bulletin pages and explain them through Gemini when a valid API key is configured.

## Key Features

- **Risk dashboard:** Summarizes current alert context, barangay exposure, checklist progress, family check-in status, and immediate action prompts from locally persisted household data.
- **Live Taal bulletin screen:** Fetches the latest Taal Volcano bulletin through a backend API that scrapes and parses PHIVOLCS bulletin pages.
- **AI bulletin explainer:** Produces concise, source-grounded explanations for official bulletins through Gemini, with a rule-based fallback when Gemini is unavailable.
- **Household readiness profile:** Stores location, family composition, vulnerable household members, transport availability, pets, and emergency contacts locally on-device.
- **Adaptive readiness plan:** Builds action sections for normal preparedness, ashfall, gas exposure, evacuation preparation, and evacuate-now guidance from the household profile, hazard profile, and bulletin.
- **Go-bag checklist:** Tracks seeded and custom emergency supplies, highlights missing critical items, supports category filters, and persists custom edits in SQLite.
- **Family check-in via SMS:** Builds status messages, opens the device SMS composer when available, and saves each check-in event locally.
- **Offline emergency card:** Generates a local snapshot containing household data, contacts, checklist readiness, risk profile, and latest guidance for weak or no internet scenarios.
- **Local reminders:** Schedules device-local reminders for go-bag checks and bulletin reviews using Expo notifications.
- **Mobile shell navigation:** Uses Expo Router, a shared app shell, bottom navigation, reusable cards, badges, buttons, and custom design tokens.

## Workflow / Architecture

```text
User opens VOLT on a mobile device
  -> Expo Router loads the root app shell
  -> Zustand store initializes application state
  -> SQLite database opens, migrates, and seeds demo data if needed
  -> Dashboard renders household profile, bulletin summary, risk metrics, checklist status, and check-in state
  -> User opens the Taal Bulletin screen
  -> React Query calls the configured VOLT backend base URL
  -> Express receives /api/bulletins/taal requests
  -> Backend fetches PHIVOLCS bulletin HTML through Axios
  -> Cheerio parses bulletin text, alert level, date, source URL, and metadata
  -> Backend caches bulletin results for 30 minutes
  -> User requests an explanation
  -> Backend sanitizes optional context and builds a source-grounded Gemini prompt
  -> Gemini returns JSON when GEMINI_API_KEY is configured and the request succeeds
  -> Rule-based fallback returns deterministic guidance if Gemini is unavailable
  -> Mobile UI renders the bulletin, explanation, model/fallback status, and safety notes
  -> User updates checklist, household profile, reminders, check-ins, or offline card
  -> Zustand writes the change back to SQLite
  -> VOLT remains usable with locally saved emergency data
```

## Component / Module Details

| Component / Module | Responsibility | Configuration / Tech Setting |
| --- | --- | --- |
| **Expo Router app shell** | Provides screen routing, root providers, status bar, bottom navigation, safe-area handling, and notification tap navigation. | `app/_layout.tsx`, `app/*.tsx`, Expo Router |
| **Dashboard screen** | Presents current alert context, barangay risk profile, checklist status, family check-in state, and immediate action prompts. | `app/dashboard.tsx`, Zustand selectors, readiness rules |
| **Household profile screen** | Captures location, family needs, transport availability, pets, and emergency contacts. | `app/household.tsx`, SQLite-backed store actions |
| **Checklist screen** | Tracks seeded and custom go-bag items with progress, filters, edit/delete controls, and critical-item warnings. | `app/checklist.tsx`, `src/components/ChecklistRow.tsx` |
| **Readiness rules engine** | Converts household profile, hazard profile, and bulletin state into action-oriented preparedness guidance. | `src/rules/planRules.ts` |
| **Offline card service** | Builds a durable emergency snapshot containing household, contacts, risk, checklist, and latest guidance. | `src/services/offlineCard.ts`, `offline_card_snapshots` table |
| **Zustand app store** | Coordinates app state, optimistic UI updates, SQLite writes, notifications, check-ins, and reset-to-seed behavior. | `src/store/useVoltStore.ts`, Zustand |
| **SQLite data layer** | Owns schema migration, seeded demo data, local CRUD operations, notification preferences, check-ins, and snapshots. | `src/db/index.ts`, `volt-local.db`, `DATABASE_VERSION = 1` |
| **Bulletin API client** | Calls backend bulletin endpoints and exposes typed functions for latest, by-id, and explanation requests. | `src/services/taalBulletinApi.ts`, `app.json` `expo.extra.taalBulletinApiBaseUrl` |
| **React Query hooks** | Caches bulletin and explanation requests with retry and stale-time behavior. | `src/hooks/useTaalBulletins.ts`, `staleTime = 30 minutes` |
| **Backend bulletin service** | Discovers, fetches, parses, and caches PHIVOLCS Taal bulletin pages. | `backend/services/taalBulletins.service.js`, Axios, Cheerio |
| **Gemini explainer service** | Sends JSON-mode bulletin prompts to Gemini, caches explanations, tracks provider status, and falls back safely. | `backend/services/gemini.service.js`, default model `gemini-2.5-flash-lite` |
| **Rule-based explainer** | Generates deterministic explanation sections when Gemini is missing, unavailable, or invalid. | `backend/utils/explainBulletin.js` |
| **SMS check-in service** | Builds family status messages, normalizes recipients, opens native SMS composer, and reports fallback state. | `src/services/checkInSms.ts`, `expo-sms` |
| **Local notification service** | Requests permission, creates Android channel, schedules/cancels daily reminders, and routes notification taps. | `src/services/notifications.ts`, `expo-notifications` |
| **Design system primitives** | Provides shared cards, buttons, badges, progress bars, form controls, shell layout, and theme tokens. | `src/components/*.tsx`, `src/constants/theme.ts`, `lucide-react-native` |

> **Configuration note:** Core app configuration lives in `app.json`, TypeScript settings live in `tsconfig.json`, root mobile scripts live in `package.json`, backend scripts and dependencies live in `backend/package.json`, and backend environment values are loaded from `backend/.env`.

## Provider / System Modes

| Mode | How It Works | Status |
| --- | --- | --- |
| **Offline-first local mode** | The app initializes SQLite, seeds mock household/hazard/checklist/bulletin data, and keeps readiness state available on-device. | Implemented |
| **Live PHIVOLCS bulletin mode** | The backend scrapes PHIVOLCS Taal bulletin pages, parses valid bulletin content, and caches successful responses for 30 minutes. | Implemented |
| **Gemini-backed explanation mode** | The backend sends a constrained JSON prompt to Gemini when `GEMINI_API_KEY` is configured and valid. | Implemented / optional |
| **Rule-based explanation fallback** | If Gemini is unavailable, unconfigured, times out, or returns invalid content, the backend returns deterministic safety guidance. | Implemented |
| **SMS composer mode** | The app uses `expo-sms` to open the native SMS composer with saved emergency contacts and a generated check-in message. | Implemented |
| **SMS fallback mode** | If SMS is unavailable or there are no usable recipients, VOLT saves the check-in locally and displays a copyable fallback message. | Implemented |
| **Local reminder mode** | The app schedules daily local reminders for go-bag checks and bulletin review after notification permission is granted. | Implemented |
| **Remote push notifications** | Remote push token registration and push delivery are intentionally deferred for a future EAS/dev-build backend phase. | Planned / not live |
| **Live LGU integration** | Local government pickup points, shelter assignments, and responder systems are not wired into the app. | Planned / not live |

## Validation Status

| Area | Evidence | Status |
| --- | --- | --- |
| **TypeScript typecheck** | `npm.cmd run typecheck` completed successfully with `tsc --noEmit`. | Passing |
| **Backend syntax check** | `node --check` passed for `backend/server.js`, route modules, services, and utility files. | Passing |
| **Local mobile run path** | Root `package.json` exposes `start`, `android`, `ios`, and `web` Expo commands. | Implemented |
| **Backend run path** | `backend/package.json` exposes `start`, running `node --use-system-ca server.js`. | Implemented |
| **API routes** | Express serves `/health` and `/api/bulletins/taal/*` routes for latest, by-id, explain, and Gemini status. | Implemented |
| **Local persistence** | SQLite migration, seeded data, CRUD operations, check-ins, reminders, and offline snapshots are implemented. | Implemented |
| **Production build script** | No root `build` or `preview` script is currently defined in `package.json`. | Not configured |
| **Automated tests** | No `test` script, test runner, or automated test suite is currently configured. | Not configured |
| **Real integrations** | PHIVOLCS bulletin scraping is live-network dependent; Gemini is optional; LGU systems and remote push are not live. | Partial |

## Tech Stack

- **Mobile frontend:** Expo `~55.0.24`, React Native `0.83.6`, React `19.2.0`, Expo Router.
- **Routing and shell:** `expo-router`, `react-native-safe-area-context`, `react-native-gesture-handler`, `react-native-screens`.
- **State management:** Zustand.
- **Data fetching:** TanStack React Query.
- **Local persistence:** `expo-sqlite` with a versioned SQLite schema and seeded local data.
- **Native device capabilities:** `expo-sms`, `expo-notifications`, `expo-linking`, `expo-constants`.
- **Styling:** React Native `StyleSheet`, shared theme tokens, reusable UI primitives.
- **Icons:** `lucide-react-native` and Expo vector icon dependencies.
- **Backend:** Node.js, Express `5.2.1`, CORS, dotenv.
- **Bulletin scraping:** Axios and Cheerio.
- **AI provider:** Google Gemini REST API through Axios with rule-based fallback.
- **Language and tooling:** TypeScript strict mode, npm, Expo Metro bundler.

## Project Structure

```text
.
├── app/                                      # Expo Router screens and root layout
│   ├── _layout.tsx                           # App providers, SQLite initialization, stack setup, notification tap routing
│   ├── index.tsx                             # Route alias to dashboard
│   ├── dashboard.tsx                         # Risk dashboard and immediate actions
│   ├── bulletin.tsx                          # Live Taal bulletin and explainer UI
│   ├── plan.tsx                              # Household-specific readiness plan
│   ├── checklist.tsx                         # Go-bag checklist and custom items
│   ├── check-in.tsx                          # SMS family check-in flow
│   ├── household.tsx                         # Household profile and emergency contacts
│   ├── offline-card.tsx                      # Offline emergency card snapshot
│   └── settings.tsx                          # Local notification permissions and reminders
├── src/
│   ├── components/                           # Shared shell, form controls, checklist row, and UI primitives
│   │   ├── AppShell.tsx
│   │   ├── ChecklistRow.tsx
│   │   ├── forms.tsx
│   │   └── ui.tsx
│   ├── constants/
│   │   └── theme.ts                          # Colors, typography, radii, and shadows
│   ├── data/
│   │   └── mockData.ts                       # Seed household, hazard profiles, bulletin, and checklist data
│   ├── db/
│   │   └── index.ts                          # SQLite schema, migrations, seed data, and persistence functions
│   ├── hooks/
│   │   └── useTaalBulletins.ts               # React Query hooks for bulletin API calls
│   ├── rules/
│   │   └── planRules.ts                      # Readiness action rules
│   ├── services/
│   │   ├── ai.ts                             # Local mock explainer utility retained for demo-style interpretation
│   │   ├── bulletin.ts                       # Local bulletin lookup and hazard profile matching
│   │   ├── checkInSms.ts                     # SMS message builder and composer integration
│   │   ├── notifications.ts                  # Local notification scheduling and tap handling
│   │   ├── offlineCard.ts                    # Offline card payload builder
│   │   ├── storage.ts                        # Shared storage key constants
│   │   └── taalBulletinApi.ts                # Backend API client and response types
│   ├── store/
│   │   └── useVoltStore.ts                   # Zustand state store and app actions
│   ├── types/
│   │   └── index.ts                          # Shared app domain types
│   └── utils/
│       └── id.ts                             # Local ID generator
├── backend/
│   ├── routes/
│   │   └── taalBulletins.routes.js           # Express routes for Taal bulletin API
│   ├── services/
│   │   ├── gemini.service.js                 # Gemini provider, cache, sanitization, fallback orchestration
│   │   └── taalBulletins.service.js          # PHIVOLCS scraping, parsing, discovery, and cache
│   ├── utils/
│   │   ├── buildGeminiBulletinPrompt.js      # JSON-schema prompt builder
│   │   └── explainBulletin.js                # Rule-based fallback explanation
│   ├── .env.example                          # Backend environment example
│   ├── package.json                          # Backend dependencies and start script
│   └── server.js                             # Express app, middleware, health route, and error handling
├── app.json                                  # Expo app config, scheme, plugins, backend base URL
├── babel.config.js                           # Babel configuration for Expo
├── package.json                              # Mobile app dependencies and scripts
├── package-lock.json                         # Root dependency lockfile
├── tsconfig.json                             # Strict TypeScript config
├── VOLT - Volcanic Operations and Lifesaving Tracker.docx # Project document artifact
├── VOLT - Volcanic Operations and Lifesaving Tracker.pen  # Design artifact
└── README.md
```

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Backend health check returning `{ "ok": true }`. |
| `GET` | `/api/bulletins/taal/latest` | Discovers and returns the latest valid Taal bulletin parsed from PHIVOLCS. |
| `GET` | `/api/bulletins/taal/latest/explain` | Returns an explanation for the latest bulletin using Gemini or rule-based fallback. |
| `GET` | `/api/bulletins/taal/debug/gemini` | Returns public Gemini provider status, configuration state, model, and latest error metadata. |
| `GET` | `/api/bulletins/taal/:id` | Returns a specific PHIVOLCS Taal bulletin by positive integer bulletin ID. |
| `GET` | `/api/bulletins/taal/:id/explain` | Returns an explanation for a specific bulletin without additional context. |
| `POST` | `/api/bulletins/taal/:id/explain` | Returns an explanation for a specific bulletin with optional sanitized household and risk context. |

Example explanation request:

```json
{
  "household": {
    "elderly": true,
    "children": 1,
    "infants": 0,
    "asthma": true,
    "mobilityIssues": false,
    "pets": true,
    "vehicleAvailable": false
  },
  "riskProfile": {
    "barangay": "Banga, Talisay, Batangas",
    "hazards": ["ashfall", "volcanic gas", "lake hazard"]
  }
}
```

Example explanation response shape:

```json
{
  "id": 13947,
  "sourceUrl": "https://wovodat.phivolcs.dost.gov.ph/bulletin/activity-tvo?bid=13947&lang=en",
  "model": "gemini-2.5-flash-lite",
  "whatHappened": [
    "The bulletin reports observed activity for Taal Volcano."
  ],
  "whatItMeans": [
    "Treat this as a source-grounded readiness summary, not a forecast."
  ],
  "whatToAvoid": [
    "Avoid acting on rumors or unofficial volcano updates."
  ],
  "whatToPrepare": [
    "Keep monitoring PHIVOLCS and local government instructions."
  ],
  "highRiskPeople": [
    "People who need help moving, children, elderly people, and those sensitive to ash or gas may need extra support."
  ],
  "uncertainty": "This explanation is based only on the official bulletin text provided.",
  "safetyNote": "Always follow official PHIVOLCS advisories and local government instructions.",
  "generatedAt": "2026-05-17T13:00:00.000Z",
  "fallback": false
}
```

## Local Setup

1. **Install mobile app dependencies.**

```bash
npm install
```

2. **Install backend dependencies.**

```bash
cd backend
npm install
cd ..
```

3. **Create backend environment file.**

```bash
cd backend
copy .env.example .env
cd ..
```

Edit `backend/.env` and add a Gemini key if AI-backed explanations are required. Without a valid key, the backend still works through the rule-based fallback.

4. **Configure the mobile app backend URL.**

Update `app.json` so the Expo app can reach the backend from the target device:

```json
{
  "expo": {
    "extra": {
      "taalBulletinApiBaseUrl": "http://192.168.1.103:3000"
    }
  }
}
```

Use a LAN IP for Expo Go on a physical device. For browser-based web testing on the same machine, `localhost` may be appropriate. For Android emulator workflows, the backend may need an emulator-accessible host such as `10.0.2.2`.

5. **Start the backend API.**

```bash
cd backend
npm start
```

The backend listens on:

```text
http://0.0.0.0:3000
```

6. **Start the Expo development server in a second terminal.**

```bash
npm start
```

Then choose the desired target from Expo:

```text
a = Android
i = iOS
w = Web
```

You can also launch platform-specific commands directly:

```bash
npm run android
npm run ios
npm run web
```

7. **Run the TypeScript check.**

```bash
npm run typecheck
```

8. **Production build / preview status.**

No production `build` or `preview` script is currently defined in the root `package.json`. For submission-grade packaging, add an Expo export or EAS build path, then document the final command here.

## Scripts

| Script | Command | Description |
| --- | --- | --- |
| `start` | `expo start` | Starts the Expo development server. |
| `android` | `expo start --android` | Starts Expo and opens the Android target. |
| `ios` | `expo start --ios` | Starts Expo and opens the iOS target. |
| `web` | `expo start --web` | Starts Expo for web through the configured Metro web bundler. |
| `typecheck` | `tsc --noEmit` | Runs strict TypeScript validation without emitting files. |
| `backend:start` | `cd backend && npm start` | Starts the Express bulletin backend. This is not a root package script, but is the backend run path. |
| `test` | Not configured | No automated test command is currently defined. |
| `build` | Not configured | No production build command is currently defined. |

Backend package script:

| Script | Command | Description |
| --- | --- | --- |
| `start` | `node --use-system-ca server.js` | Starts the VOLT bulletin backend with system CA support. |

## Environment Variables

Backend variables are loaded from `backend/.env` through `dotenv`.

```env
# Optional. If omitted or left as the placeholder value, VOLT uses rule-based explanations.
GEMINI_API_KEY=your_gemini_api_key_here

# Optional. Defaults to gemini-2.5-flash-lite.
GEMINI_MODEL=gemini-2.5-flash-lite

# Optional. Defaults to 10000 milliseconds.
GEMINI_TIMEOUT_MS=10000

# Optional. Defaults to 3000.
PORT=3000
```

Client backend URL configuration currently lives in `app.json`, not in a `.env` file:

```json
{
  "expo": {
    "extra": {
      "taalBulletinApiBaseUrl": "http://192.168.1.103:3000"
    }
  }
}
```

## Deployment / Submission Notes

- **Mobile app delivery:** The repository is Expo-first. Development is ready through Expo commands, but production packaging should be finalized through Expo export or EAS build before a release submission.
- **Backend delivery:** The Express backend runs separately from the mobile app and must be reachable from the device or browser running the Expo client.
- **Live bulletin dependency:** PHIVOLCS scraping depends on the availability and HTML structure of the source bulletin pages. The backend uses a non-aggressive request pattern and 30-minute caching.
- **AI safety boundary:** Gemini explanations are constrained to official bulletin text and optional sanitized context. The fallback path avoids making forecasts or inventing official instructions.
- **Offline behavior:** Household profile, emergency contacts, checklist state, check-ins, notification preferences, and emergency card snapshots persist locally in SQLite.
- **Security warning:** Do not commit `backend/.env` or real API keys. The example file contains only a placeholder.
- **Current integration scope:** PHIVOLCS bulletin retrieval is live-network capable; Gemini is optional; LGU dispatch systems, real shelter assignment feeds, authentication, and remote push notification infrastructure are not wired in.
- **Submission readiness:** VOLT is well-positioned as a functional hackathon prototype: the core mobile flows are implemented, local persistence is durable, backend bulletin routes exist, Gemini fallback behavior is handled, and TypeScript validation currently passes.

**VOLT** is an Expo React Native emergency readiness app for Taal Volcano households, pairing an offline-first mobile interface with a Node/Express bulletin backend, live PHIVOLCS scraping, local SQLite persistence, SMS check-ins, reminders, and optional Gemini-powered bulletin explanations.

## Why This Project

Volcanic risk information is often scattered across official bulletins, local government advisories, household needs, emergency contacts, go-bag readiness, and real-time family status. During a stressful event, that fragmentation makes it harder for families to understand what matters now and what action to take next.

**VOLT** turns that fragmented context into clear, timely utility by combining:

- Official-source Taal bulletin retrieval.
- Household-specific risk and readiness rules.
- Local emergency profiles and contacts.
- Offline emergency card snapshots.
- SMS-based family check-ins.
- Optional AI explanations with deterministic fallback behavior.

The project is scoped as an **Expo-first mobile prototype** with durable on-device state and a separately runnable backend. It includes seeded local demo data for reliable offline flows, while the backend can retrieve live PHIVOLCS Taal bulletin pages and explain them through Gemini when a valid API key is configured.

## Key Features

- **Risk dashboard:** Summarizes current alert context, barangay exposure, checklist progress, family check-in status, and immediate action prompts from locally persisted household data.
- **Live Taal bulletin screen:** Fetches the latest Taal Volcano bulletin through a backend API that scrapes and parses PHIVOLCS bulletin pages.
- **AI bulletin explainer:** Produces concise, source-grounded explanations for official bulletins through Gemini, with a rule-based fallback when Gemini is unavailable.
- **Household readiness profile:** Stores location, family composition, vulnerable household members, transport availability, pets, and emergency contacts locally on-device.
- **Adaptive readiness plan:** Builds action sections for normal preparedness, ashfall, gas exposure, evacuation preparation, and evacuate-now guidance from the household profile, hazard profile, and bulletin.
- **Go-bag checklist:** Tracks seeded and custom emergency supplies, highlights missing critical items, supports category filters, and persists custom edits in SQLite.
- **Family check-in via SMS:** Builds status messages, opens the device SMS composer when available, and saves each check-in event locally.
- **Offline emergency card:** Generates a local snapshot containing household data, contacts, checklist readiness, risk profile, and latest guidance for weak or no internet scenarios.
- **Local reminders:** Schedules device-local reminders for go-bag checks and bulletin reviews using Expo notifications.
- **Mobile shell navigation:** Uses Expo Router, a shared app shell, bottom navigation, reusable cards, badges, buttons, and custom design tokens.

## Workflow / Architecture

```text
User opens VOLT on a mobile device
  -> Expo Router loads the root app shell
  -> Zustand store initializes application state
  -> SQLite database opens, migrates, and seeds demo data if needed
  -> Dashboard renders household profile, bulletin summary, risk metrics, checklist status, and check-in state
  -> User opens the Taal Bulletin screen
  -> React Query calls the configured VOLT backend base URL
  -> Express receives /api/bulletins/taal requests
  -> Backend fetches PHIVOLCS bulletin HTML through Axios
  -> Cheerio parses bulletin text, alert level, date, source URL, and metadata
  -> Backend caches bulletin results for 30 minutes
  -> User requests an explanation
  -> Backend sanitizes optional context and builds a source-grounded Gemini prompt
  -> Gemini returns JSON when GEMINI_API_KEY is configured and the request succeeds
  -> Rule-based fallback returns deterministic guidance if Gemini is unavailable
  -> Mobile UI renders the bulletin, explanation, model/fallback status, and safety notes
  -> User updates checklist, household profile, reminders, check-ins, or offline card
  -> Zustand writes the change back to SQLite
  -> VOLT remains usable with locally saved emergency data
```

## Component / Module Details

| Component / Module | Responsibility | Configuration / Tech Setting |
| --- | --- | --- |
| **Expo Router app shell** | Provides screen routing, root providers, status bar, bottom navigation, safe-area handling, and notification tap navigation. | `app/_layout.tsx`, `app/*.tsx`, Expo Router |
| **Dashboard screen** | Presents current alert context, barangay risk profile, checklist status, family check-in state, and immediate action prompts. | `app/dashboard.tsx`, Zustand selectors, readiness rules |
| **Household profile screen** | Captures location, family needs, transport availability, pets, and emergency contacts. | `app/household.tsx`, SQLite-backed store actions |
| **Checklist screen** | Tracks seeded and custom go-bag items with progress, filters, edit/delete controls, and critical-item warnings. | `app/checklist.tsx`, `src/components/ChecklistRow.tsx` |
| **Readiness rules engine** | Converts household profile, hazard profile, and bulletin state into action-oriented preparedness guidance. | `src/rules/planRules.ts` |
| **Offline card service** | Builds a durable emergency snapshot containing household, contacts, risk, checklist, and latest guidance. | `src/services/offlineCard.ts`, `offline_card_snapshots` table |
| **Zustand app store** | Coordinates app state, optimistic UI updates, SQLite writes, notifications, check-ins, and reset-to-seed behavior. | `src/store/useVoltStore.ts`, Zustand |
| **SQLite data layer** | Owns schema migration, seeded demo data, local CRUD operations, notification preferences, check-ins, and snapshots. | `src/db/index.ts`, `volt-local.db`, `DATABASE_VERSION = 1` |
| **Bulletin API client** | Calls backend bulletin endpoints and exposes typed functions for latest, by-id, and explanation requests. | `src/services/taalBulletinApi.ts`, `app.json` `expo.extra.taalBulletinApiBaseUrl` |
| **React Query hooks** | Caches bulletin and explanation requests with retry and stale-time behavior. | `src/hooks/useTaalBulletins.ts`, `staleTime = 30 minutes` |
| **Backend bulletin service** | Discovers, fetches, parses, and caches PHIVOLCS Taal bulletin pages. | `backend/services/taalBulletins.service.js`, Axios, Cheerio |
| **Gemini explainer service** | Sends JSON-mode bulletin prompts to Gemini, caches explanations, tracks provider status, and falls back safely. | `backend/services/gemini.service.js`, default model `gemini-2.5-flash-lite` |
| **Rule-based explainer** | Generates deterministic explanation sections when Gemini is missing, unavailable, or invalid. | `backend/utils/explainBulletin.js` |
| **SMS check-in service** | Builds family status messages, normalizes recipients, opens native SMS composer, and reports fallback state. | `src/services/checkInSms.ts`, `expo-sms` |
| **Local notification service** | Requests permission, creates Android channel, schedules/cancels daily reminders, and routes notification taps. | `src/services/notifications.ts`, `expo-notifications` |
| **Design system primitives** | Provides shared cards, buttons, badges, progress bars, form controls, shell layout, and theme tokens. | `src/components/*.tsx`, `src/constants/theme.ts`, `lucide-react-native` |

> **Configuration note:** Core app configuration lives in `app.json`, TypeScript settings live in `tsconfig.json`, root mobile scripts live in `package.json`, backend scripts and dependencies live in `backend/package.json`, and backend environment values are loaded from `backend/.env`.

## Provider / System Modes

| Mode | How It Works | Status |
| --- | --- | --- |
| **Offline-first local mode** | The app initializes SQLite, seeds mock household/hazard/checklist/bulletin data, and keeps readiness state available on-device. | Implemented |
| **Live PHIVOLCS bulletin mode** | The backend scrapes PHIVOLCS Taal bulletin pages, parses valid bulletin content, and caches successful responses for 30 minutes. | Implemented |
| **Gemini-backed explanation mode** | The backend sends a constrained JSON prompt to Gemini when `GEMINI_API_KEY` is configured and valid. | Implemented / optional |
| **Rule-based explanation fallback** | If Gemini is unavailable, unconfigured, times out, or returns invalid content, the backend returns deterministic safety guidance. | Implemented |
| **SMS composer mode** | The app uses `expo-sms` to open the native SMS composer with saved emergency contacts and a generated check-in message. | Implemented |
| **SMS fallback mode** | If SMS is unavailable or there are no usable recipients, VOLT saves the check-in locally and displays a copyable fallback message. | Implemented |
| **Local reminder mode** | The app schedules daily local reminders for go-bag checks and bulletin review after notification permission is granted. | Implemented |
| **Remote push notifications** | Remote push token registration and push delivery are intentionally deferred for a future EAS/dev-build backend phase. | Planned / not live |
| **Live LGU integration** | Local government pickup points, shelter assignments, and responder systems are not wired into the app. | Planned / not live |

## Validation Status

| Area | Evidence | Status |
| --- | --- | --- |
| **TypeScript typecheck** | `npm.cmd run typecheck` completed successfully with `tsc --noEmit`. | Passing |
| **Backend syntax check** | `node --check` passed for `backend/server.js`, route modules, services, and utility files. | Passing |
| **Local mobile run path** | Root `package.json` exposes `start`, `android`, `ios`, and `web` Expo commands. | Implemented |
| **Backend run path** | `backend/package.json` exposes `start`, running `node --use-system-ca server.js`. | Implemented |
| **API routes** | Express serves `/health` and `/api/bulletins/taal/*` routes for latest, by-id, explain, and Gemini status. | Implemented |
| **Local persistence** | SQLite migration, seeded data, CRUD operations, check-ins, reminders, and offline snapshots are implemented. | Implemented |
| **Production build script** | No root `build` or `preview` script is currently defined in `package.json`. | Not configured |
| **Automated tests** | No `test` script, test runner, or automated test suite is currently configured. | Not configured |
| **Real integrations** | PHIVOLCS bulletin scraping is live-network dependent; Gemini is optional; LGU systems and remote push are not live. | Partial |

## Tech Stack

- **Mobile frontend:** Expo `~55.0.24`, React Native `0.83.6`, React `19.2.0`, Expo Router.
- **Routing and shell:** `expo-router`, `react-native-safe-area-context`, `react-native-gesture-handler`, `react-native-screens`.
- **State management:** Zustand.
- **Data fetching:** TanStack React Query.
- **Local persistence:** `expo-sqlite` with a versioned SQLite schema and seeded local data.
- **Native device capabilities:** `expo-sms`, `expo-notifications`, `expo-linking`, `expo-constants`.
- **Styling:** React Native `StyleSheet`, shared theme tokens, reusable UI primitives.
- **Icons:** `lucide-react-native` and Expo vector icon dependencies.
- **Backend:** Node.js, Express `5.2.1`, CORS, dotenv.
- **Bulletin scraping:** Axios and Cheerio.
- **AI provider:** Google Gemini REST API through Axios with rule-based fallback.
- **Language and tooling:** TypeScript strict mode, npm, Expo Metro bundler.

## Project Structure

```text
.
├── app/                                      # Expo Router screens and root layout
│   ├── _layout.tsx                           # App providers, SQLite initialization, stack setup, notification tap routing
│   ├── index.tsx                             # Route alias to dashboard
│   ├── dashboard.tsx                         # Risk dashboard and immediate actions
│   ├── bulletin.tsx                          # Live Taal bulletin and explainer UI
│   ├── plan.tsx                              # Household-specific readiness plan
│   ├── checklist.tsx                         # Go-bag checklist and custom items
│   ├── check-in.tsx                          # SMS family check-in flow
│   ├── household.tsx                         # Household profile and emergency contacts
│   ├── offline-card.tsx                      # Offline emergency card snapshot
│   └── settings.tsx                          # Local notification permissions and reminders
├── src/
│   ├── components/                           # Shared shell, form controls, checklist row, and UI primitives
│   │   ├── AppShell.tsx
│   │   ├── ChecklistRow.tsx
│   │   ├── forms.tsx
│   │   └── ui.tsx
│   ├── constants/
│   │   └── theme.ts                          # Colors, typography, radii, and shadows
│   ├── data/
│   │   └── mockData.ts                       # Seed household, hazard profiles, bulletin, and checklist data
│   ├── db/
│   │   └── index.ts                          # SQLite schema, migrations, seed data, and persistence functions
│   ├── hooks/
│   │   └── useTaalBulletins.ts               # React Query hooks for bulletin API calls
│   ├── rules/
│   │   └── planRules.ts                      # Readiness action rules
│   ├── services/
│   │   ├── ai.ts                             # Local mock explainer utility retained for demo-style interpretation
│   │   ├── bulletin.ts                       # Local bulletin lookup and hazard profile matching
│   │   ├── checkInSms.ts                     # SMS message builder and composer integration
│   │   ├── notifications.ts                  # Local notification scheduling and tap handling
│   │   ├── offlineCard.ts                    # Offline card payload builder
│   │   ├── storage.ts                        # Shared storage key constants
│   │   └── taalBulletinApi.ts                # Backend API client and response types
│   ├── store/
│   │   └── useVoltStore.ts                   # Zustand state store and app actions
│   ├── types/
│   │   └── index.ts                          # Shared app domain types
│   └── utils/
│       └── id.ts                             # Local ID generator
├── backend/
│   ├── routes/
│   │   └── taalBulletins.routes.js           # Express routes for Taal bulletin API
│   ├── services/
│   │   ├── gemini.service.js                 # Gemini provider, cache, sanitization, fallback orchestration
│   │   └── taalBulletins.service.js          # PHIVOLCS scraping, parsing, discovery, and cache
│   ├── utils/
│   │   ├── buildGeminiBulletinPrompt.js      # JSON-schema prompt builder
│   │   └── explainBulletin.js                # Rule-based fallback explanation
│   ├── .env.example                          # Backend environment example
│   ├── package.json                          # Backend dependencies and start script
│   └── server.js                             # Express app, middleware, health route, and error handling
├── app.json                                  # Expo app config, scheme, plugins, backend base URL
├── babel.config.js                           # Babel configuration for Expo
├── package.json                              # Mobile app dependencies and scripts
├── package-lock.json                         # Root dependency lockfile
├── tsconfig.json                             # Strict TypeScript config
├── VOLT - Volcanic Operations and Lifesaving Tracker.docx # Project document artifact
├── VOLT - Volcanic Operations and Lifesaving Tracker.pen  # Design artifact
└── README.md
```

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Backend health check returning `{ "ok": true }`. |
| `GET` | `/api/bulletins/taal/latest` | Discovers and returns the latest valid Taal bulletin parsed from PHIVOLCS. |
| `GET` | `/api/bulletins/taal/latest/explain` | Returns an explanation for the latest bulletin using Gemini or rule-based fallback. |
| `GET` | `/api/bulletins/taal/debug/gemini` | Returns public Gemini provider status, configuration state, model, and latest error metadata. |
| `GET` | `/api/bulletins/taal/:id` | Returns a specific PHIVOLCS Taal bulletin by positive integer bulletin ID. |
| `GET` | `/api/bulletins/taal/:id/explain` | Returns an explanation for a specific bulletin without additional context. |
| `POST` | `/api/bulletins/taal/:id/explain` | Returns an explanation for a specific bulletin with optional sanitized household and risk context. |

Example explanation request:

```json
{
  "household": {
    "elderly": true,
    "children": 1,
    "infants": 0,
    "asthma": true,
    "mobilityIssues": false,
    "pets": true,
    "vehicleAvailable": false
  },
  "riskProfile": {
    "barangay": "Banga, Talisay, Batangas",
    "hazards": ["ashfall", "volcanic gas", "lake hazard"]
  }
}
```

Example explanation response shape:

```json
{
  "id": 13947,
  "sourceUrl": "https://wovodat.phivolcs.dost.gov.ph/bulletin/activity-tvo?bid=13947&lang=en",
  "model": "gemini-2.5-flash-lite",
  "whatHappened": [
    "The bulletin reports observed activity for Taal Volcano."
  ],
  "whatItMeans": [
    "Treat this as a source-grounded readiness summary, not a forecast."
  ],
  "whatToAvoid": [
    "Avoid acting on rumors or unofficial volcano updates."
  ],
  "whatToPrepare": [
    "Keep monitoring PHIVOLCS and local government instructions."
  ],
  "highRiskPeople": [
    "People who need help moving, children, elderly people, and those sensitive to ash or gas may need extra support."
  ],
  "uncertainty": "This explanation is based only on the official bulletin text provided.",
  "safetyNote": "Always follow official PHIVOLCS advisories and local government instructions.",
  "generatedAt": "2026-05-17T13:00:00.000Z",
  "fallback": false
}
```

## Local Setup

1. **Install mobile app dependencies.**

```bash
npm install
```

2. **Install backend dependencies.**

```bash
cd backend
npm install
cd ..
```

3. **Create backend environment file.**

```bash
cd backend
copy .env.example .env
cd ..
```

Edit `backend/.env` and add a Gemini key if AI-backed explanations are required. Without a valid key, the backend still works through the rule-based fallback.

4. **Configure the mobile app backend URL.**

Update `app.json` so the Expo app can reach the backend from the target device:

```json
{
  "expo": {
    "extra": {
      "taalBulletinApiBaseUrl": "http://192.168.1.103:3000"
    }
  }
}
```

Use a LAN IP for Expo Go on a physical device. For browser-based web testing on the same machine, `localhost` may be appropriate. For Android emulator workflows, the backend may need an emulator-accessible host such as `10.0.2.2`.

5. **Start the backend API.**

```bash
cd backend
npm start
```

The backend listens on:

```text
http://0.0.0.0:3000
```

6. **Start the Expo development server in a second terminal.**

```bash
npm start
```

Then choose the desired target from Expo:

```text
a = Android
i = iOS
w = Web
```

You can also launch platform-specific commands directly:

```bash
npm run android
npm run ios
npm run web
```

7. **Run the TypeScript check.**

```bash
npm run typecheck
```

8. **Production build / preview status.**

No production `build` or `preview` script is currently defined in the root `package.json`. For submission-grade packaging, add an Expo export or EAS build path, then document the final command here.

## Scripts

| Script | Command | Description |
| --- | --- | --- |
| `start` | `expo start` | Starts the Expo development server. |
| `android` | `expo start --android` | Starts Expo and opens the Android target. |
| `ios` | `expo start --ios` | Starts Expo and opens the iOS target. |
| `web` | `expo start --web` | Starts Expo for web through the configured Metro web bundler. |
| `typecheck` | `tsc --noEmit` | Runs strict TypeScript validation without emitting files. |
| `backend:start` | `cd backend && npm start` | Starts the Express bulletin backend. This is not a root package script, but is the backend run path. |
| `test` | Not configured | No automated test command is currently defined. |
| `build` | Not configured | No production build command is currently defined. |

Backend package script:

| Script | Command | Description |
| --- | --- | --- |
| `start` | `node --use-system-ca server.js` | Starts the VOLT bulletin backend with system CA support. |

## Environment Variables

Backend variables are loaded from `backend/.env` through `dotenv`.

```env
# Optional. If omitted or left as the placeholder value, VOLT uses rule-based explanations.
GEMINI_API_KEY=your_gemini_api_key_here

# Optional. Defaults to gemini-2.5-flash-lite.
GEMINI_MODEL=gemini-2.5-flash-lite

# Optional. Defaults to 10000 milliseconds.
GEMINI_TIMEOUT_MS=10000

# Optional. Defaults to 3000.
PORT=3000
```

Client backend URL configuration currently lives in `app.json`, not in a `.env` file:

```json
{
  "expo": {
    "extra": {
      "taalBulletinApiBaseUrl": "http://192.168.1.103:3000"
    }
  }
}
```

## Deployment / Submission Notes

- **Mobile app delivery:** The repository is Expo-first. Development is ready through Expo commands, but production packaging should be finalized through Expo export or EAS build before a release submission.
- **Backend delivery:** The Express backend runs separately from the mobile app and must be reachable from the device or browser running the Expo client.
- **Live bulletin dependency:** PHIVOLCS scraping depends on the availability and HTML structure of the source bulletin pages. The backend uses a non-aggressive request pattern and 30-minute caching.
- **AI safety boundary:** Gemini explanations are constrained to official bulletin text and optional sanitized context. The fallback path avoids making forecasts or inventing official instructions.
- **Offline behavior:** Household profile, emergency contacts, checklist state, check-ins, notification preferences, and emergency card snapshots persist locally in SQLite.
- **Security warning:** Do not commit `backend/.env` or real API keys. The example file contains only a placeholder.
- **Current integration scope:** PHIVOLCS bulletin retrieval is live-network capable; Gemini is optional; LGU dispatch systems, real shelter assignment feeds, authentication, and remote push notification infrastructure are not wired in.
- **Submission readiness:** VOLT is well-positioned as a functional hackathon prototype: the core mobile flows are implemented, local persistence is durable, backend bulletin routes exist, Gemini fallback behavior is handled, and TypeScript validation currently passes.