# Wikingo — Wikipedia Micro-learning

**Repository:** [https://github.com/aresthebellator/HackathonMessina2026-WebApp](https://github.com/aresthebellator/HackathonMessina2026-WebApp)

[![CI Status](https://github.com/aresthebellator/HackathonMessina2026-WebApp/actions/workflows/ci.yml/badge.svg?branch=main&style=flat-square)](https://github.com/aresthebellator/HackathonMessina2026-WebApp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black&style=flat-square)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org/)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vite.dev/)
[![Tailwind CSS 3](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_RTDB-FFCA28?logo=firebase&logoColor=black&style=flat-square)](https://firebase.google.com/)
[![Node.js 22+](https://img.shields.io/badge/Node.js-22+-5FA04E?logo=nodedotjs&logoColor=white&style=flat-square)](https://nodejs.org/)
[![Tested with Vitest](https://img.shields.io/badge/tested_with-Vitest-6E9F18?logo=vitest&logoColor=white&style=flat-square)](https://vitest.dev/)
[![Wikipedia](https://img.shields.io/badge/content-Wikipedia-000000?logo=wikipedia&logoColor=white&style=flat-square)](https://www.wikipedia.org/)
[![SWH](https://archive.softwareheritage.org/badge/origin/https://github.com/aresthebellator/HackathonMessina2026-WebApp/)](https://archive.softwareheritage.org/browse/origin/?origin_url=https://github.com/aresthebellator/HackathonMessina2026-WebApp)
[![SWH](https://archive.softwareheritage.org/badge/swh:1:dir:49db3ffbbfcd6cdd5d8f8a44b622204f9bbd2cdc/)](https://archive.softwareheritage.org/swh:1:dir:49db3ffbbfcd6cdd5d8f8a44b622204f9bbd2cdc;origin=https://github.com/aresthebellator/HackathonMessina2026-WebApp;visit=swh:1:snp:f74267f0b9bfa571cd89b977bb03401ccedc943c;anchor=swh:1:rev:d8a3588efb88c498292c03bc5987bbfa7beeae32)

**Wikingo** is a gamified micro-learning web app built at the **Wikipedia Hackathon in Messina (2–4 October 2026)**.
It turns random Wikipedia article summaries into short, Duolingo-style quiz rounds, so you can learn something new in a couple of minutes, on any device.

---

## ✨ Key Features

- **📚 Live Wikipedia content**: questions are generated on the fly from random article summaries fetched from the Wikipedia REST API (Italian and English editions).
- **🧩 Four question types**: multiple choice, cloze (fill-in-the-blank), true/false and subject recognition, with plausible distractors.
- **🗺️ Lesson path**: 10 themed sections (history, science, art, geography, philosophy, literature, music & cinema, nature & technology, sport, computer science), with lesson previews and unit banners.
- **❤️ Game mechanics**: hearts, streaks, progress bar, mascot reactions, sound feedback and a round summary with confetti.
- **🔎 Go deeper**: open the source article, save articles for later and browse your quiz history.
- **🌍 Bilingual UI**: complete Italian/English localisation, switchable at runtime.
- **📴 Offline fallback**: a curated pool of offline articles keeps the app playable when Wikipedia cannot be reached; a service worker caches the app shell.
- **🔐 Optional accounts**: Firebase Authentication (email/password, Google, anonymous); progress, settings and history are persisted locally in the browser.
- **🎨 Themes & accessibility**: light/dark themes and keyboard shortcuts for answering quizzes.

---

## 📂 Project Structure

```
HackathonMessina2026-WebApp/
├── .github/workflows/
│   └── ci.yml                  # CI: license headers, citation metadata, type check, build & tests
├── public/                     # Static assets served as-is
│   ├── manifest.json           # PWA web app manifest
│   ├── sw.js                   # Service worker (app-shell caching)
│   └── *.png, *.jpg            # Launcher icons and loading artwork
├── scripts/
│   └── license-headers.mjs     # Checks/adds the MIT header to first-party source files
├── server/                     # Server-only code (never bundled into the browser)
│   ├── firebaseAdmin.js        # Firebase Admin SDK initialisation (Realtime Database)
│   ├── firebaseAdmin.test.js   # node:test suite for the Admin helper
│   └── README.md               # Service-account setup instructions
├── src/                        # React + TypeScript single-page app
│   ├── main.tsx                # Entry point (React Query provider)
│   ├── App.tsx                 # Top-level screen switching (home ↔ quiz)
│   ├── index.css               # Tailwind layers and global styles
│   ├── components/
│   │   ├── auth/               # Sign-in / sign-up / reset modals, welcome screen
│   │   ├── common/             # Loader, settings, hackathon easter egg
│   │   ├── history/            # Quiz history modal
│   │   ├── home/               # Home dashboard, saved articles
│   │   ├── path/               # Duolingo-style lesson path, nodes, unit banners
│   │   ├── quiz/               # Question cards, drawer, mascot, round summary
│   │   └── ui/                 # Buttons, hearts, progress bar, streak badge
│   ├── hooks/                  # Firebase auth, keyboard shortcuts, quiz fetching
│   ├── lib/                    # Firebase client, i18n, offline pool, sounds, units, utils
│   ├── services/
│   │   ├── wikipedia.ts        # Wikipedia REST API client with retries and fallback
│   │   └── quizGenerator.ts    # Question and distractor generation
│   ├── store/useQuizStore.ts   # Zustand global state, persisted to localStorage
│   ├── types/                  # Shared TypeScript types
│   └── __tests__/              # Vitest unit tests
├── index.html                  # Vite HTML entry (registers the service worker)
├── vite.config.ts              # Vite + Vitest configuration
├── tailwind.config.js          # Tailwind theme (Duolingo-inspired palette)
├── .env.example                # Firebase configuration template
├── CITATION.cff                # Citation metadata
├── codemeta.json               # CodeMeta software metadata
├── CODE_OF_CONDUCT.md          # Code of Conduct
├── LICENSE                     # MIT License
└── SKILLS_INDEX.md             # Index of the third-party AI agent skill collections
```

The remaining top-level folders (`agent-skills/`, `anti-slop/`, `awesome-ai-agent-skills/`, `duolingo-design-system/`, `frontend-first-skills/`, `gemini-dev-kit/`, `geminikit/`, `mantis/`, `tdd-xp-skill/`, `ui-design-system/`, `ultraship/`, `ux-ui-skills/`) are AI agent skill collections used during development. They are not part of the app, and the downloaded ones keep their original licenses; see [SKILLS_INDEX.md](SKILLS_INDEX.md).

---

## 🛠️ Setup

Requirements: **Node.js 22.12+** and npm.

```bash
npm ci
cp .env.example .env    # optional: the defaults point to the public Wikingo Firebase project
npm run dev             # http://localhost:3000
```

The web Firebase configuration is public and has built-in defaults; set the `VITE_FIREBASE_*` variables in `.env` to point the app to a different Firebase project. For the server-side Admin SDK, see [server/README.md](server/README.md). **Never commit service-account JSON files.**

### Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server on port 3000 |
| `npm run build` | Type-check with `tsc`, then build the production bundle into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the Vitest unit tests |
| `npm run test:admin` | Run the Firebase Admin tests with `node:test` |
| `npm run license:check` | Verify that every first-party source file has the MIT header |
| `npm run license:fix` | Add the MIT header where it is missing |

---

## 🧪 Testing & Continuous Integration

The test suite covers quiz generation, the lesson path, hearts, sound feedback, theme settings, Firebase authentication helpers and the Firebase Admin initialisation.

Every push and pull request to `main` runs the [CI workflow](.github/workflows/ci.yml) on GitHub Actions:

1. **License headers**: every first-party source file must carry the MIT header (`npm run license:check`).
2. **Citation metadata**: `CITATION.cff` is validated with `cffconvert` and `codemeta.json` must be well-formed JSON.
3. **Build & test** on Node.js 22 and 24: `npm ci`, type check and production build, Vitest and `node:test` suites. The production `dist/` bundle is uploaded as a workflow artifact.

---

## 📜 Citation

If you use Wikingo, please cite it using the metadata in [CITATION.cff](CITATION.cff) (GitHub shows a *Cite this repository* button) or [codemeta.json](codemeta.json).
The source code is archived by [Software Heritage](https://archive.softwareheritage.org/browse/origin/?origin_url=https://github.com/aresthebellator/HackathonMessina2026-WebApp); the snapshot of commit `d8a3588` is identified by `swh:1:dir:49db3ffbbfcd6cdd5d8f8a44b622204f9bbd2cdc`.

---

## 🤝 Code of Conduct

The development of this software is covered by a [Code of Conduct](CODE_OF_CONDUCT.md).

## ⚖️ License

Released under the [MIT License](LICENSE). Copyright (c) 2026 aresthebellator (exertia group).

Article content comes from [Wikipedia](https://www.wikipedia.org/) and is available under the [Creative Commons Attribution-ShareAlike License](https://creativecommons.org/licenses/by-sa/4.0/).
