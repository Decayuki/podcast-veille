# podcast-veille

PWA Next.js 15 pour ecouter des episodes de veille tech/IA/dev generes automatiquement.
Episodes produits par Sally (Discord bot) via pipeline Gemini + Edge TTS + ffmpeg.

## Stack

- **Framework:** Next.js 15 (App Router, static export)
- **UI:** React 19, Tailwind CSS 3, TypeScript 5
- **Deploy:** Vercel (auto-deploy on push main) + GitHub Pages
- **Pipeline:** generate-podcast.sh -> generate-podcast.py (Gemini API dialogue -> Edge TTS -> ffmpeg MP3)
- **Branch:** main
- **Port dev:** 3000

## Quick Start

```bash
# Dev
npm run dev          # http://localhost:3000

# Build (static export)
npm run build        # Output in out/

# Generate a new episode (from Mac Mini)
cd /Users/marc/dev/scripts
./generate-podcast.sh
```

## Architecture

```
app/
  layout.tsx              Root layout, PWA metadata, ServiceWorker registration
  page.tsx                SSG, reads episodes.json, renders EpisodeList
  globals.css             CSS vars, waveform animations, range input styling
components/
  AudioPlayer.tsx         Fixed bottom player (play/pause, skip +/-15s, speed, progress, waveform)
  EpisodeList.tsx         Episode cards, manages active player state
  SearchBar.tsx           Filter episodes by keyword
  TranscriptView.tsx      Show dialogue transcript
  ChapterList.tsx         Clickable chapter timestamps
  DownloadButton.tsx      Offline download per episode
  NotificationBell.tsx    Push notification subscription
  CoverArt.tsx            Episode cover art display
  ServiceWorker.tsx       SW registration
types/
  index.ts                Episode interface
public/
  episodes.json           Episode metadata (sorted newest-first)
  podcast.xml             RSS feed
  audio/                  MP3 files (YYYY-MM-DD.mp3)
  transcripts/            Dialogue JSON per episode
  chapters/               Chapter data per episode
  covers/                 Cover art per episode
  icons/                  PWA icons
  sw.js                   Service Worker
  manifest.json           PWA manifest
scripts/ (at /Users/marc/dev/scripts/)
  generate-podcast.sh     Orchestrator
  generate-podcast.py     Gemini + Edge TTS + ffmpeg
```

## Conventions

### Naming
- **Pages:** kebab-case.tsx (e.g. `page.tsx`)
- **Components:** PascalCase.tsx (e.g. `AudioPlayer.tsx`)
- **Audio files:** `YYYY-MM-DD.mp3`

### Colors & Theme
- Dark theme only (`#0d0d0d` background)
- CSS variables: `--bg`, `--surface`, `--border`, `--text`, `--muted`, `--accent` (`#e8834a`)
- Defined in `globals.css`, never use hardcoded colors in components

### Layout
- Mobile-first, `max-w-lg` centered layout
- Fixed bottom audio player

### State Management
- No external state library. React state + prop drilling.
- Active episode state managed in `EpisodeList.tsx`, passed down to `AudioPlayer.tsx`.

## Episode Generation Pipeline

1. **`generate-podcast.sh`** (orchestrator on Mac Mini)
   - Collects latest tech/AI/dev news from configured sources
   - Calls `generate-podcast.py` with topic data

2. **`generate-podcast.py`**
   - Sends prompt to **Gemini API** to generate a natural dialogue script
   - Converts dialogue to speech via **Edge TTS** (multiple voices)
   - Merges audio segments with **ffmpeg** into final MP3
   - Outputs: MP3 file + metadata for `episodes.json`

3. **Deployment**
   - New MP3 placed in `public/audio/YYYY-MM-DD.mp3`
   - `episodes.json` updated with new entry (newest-first)
   - `podcast.xml` RSS feed regenerated
   - Push to `main` triggers Vercel auto-deploy

## Feature Routing Table

| Feature              | Key Files                                      |
|----------------------|------------------------------------------------|
| Audio playback       | `components/AudioPlayer.tsx`                   |
| Episode list/cards   | `components/EpisodeList.tsx`, `app/page.tsx`   |
| Episode search       | `components/SearchBar.tsx`                     |
| Transcript display   | `components/TranscriptView.tsx`                |
| Chapter navigation   | `components/ChapterList.tsx`                   |
| Offline download     | `components/DownloadButton.tsx`                |
| Push notifications   | `components/NotificationBell.tsx`              |
| Cover art            | `components/CoverArt.tsx`                      |
| PWA / Service Worker | `components/ServiceWorker.tsx`, `public/sw.js` |
| Styling / theme      | `app/globals.css`                              |
| Types                | `types/index.ts`                               |
| Episode data         | `public/episodes.json`                         |
| RSS feed             | `public/podcast.xml`                           |
| Build config         | `next.config.ts`, `tailwind.config.ts`         |
| Generation pipeline  | `/Users/marc/dev/scripts/generate-podcast.*`   |

## Known Pitfalls

### basePath double-path
`next.config.ts` sets `basePath: "/podcast-veille"` for production. All asset references
must use relative paths or `process.env.BASE_PATH`. Do NOT hardcode `/podcast-veille/` in
component code — Next.js prepends it automatically for `<Link>` and `next/image`.
For raw `<audio src>` or `<img src>`, prefix with `basePath` manually.

### Service Worker caching
`sw.js` caches audio files aggressively. After updating an episode MP3 with the same
filename, users may hear the old version. Bust cache by changing the SW version string
or using a unique filename.

### Static export limitations
`output: "export"` means:
- No API routes (`app/api/` will not work)
- No `getServerSideProps` / server components with dynamic data
- No ISR / on-demand revalidation
- All data must be available at build time (episodes.json read at build)
- Dynamic routes need `generateStaticParams()`

### Audio autoplay
Mobile browsers block autoplay. The player must wait for a user gesture (tap/click)
before calling `audio.play()`. This is already handled in `AudioPlayer.tsx`.

## Deploy

```bash
# Vercel (automatic)
git push origin main    # Triggers auto-deploy

# Manual build check
npm run build           # Verify static export succeeds
npx serve out           # Preview production build locally
```

Vercel config in `vercel.json`. Domain and env vars managed in Vercel dashboard.

## Testing

```bash
# Unit tests
npx vitest              # Run vitest suite
npx vitest --watch      # Watch mode

# E2E tests
npx playwright test     # Run Playwright suite
npx playwright test --ui  # Interactive UI mode
```

- Unit tests: Vitest + React Testing Library
- E2E tests: Playwright
- Test files colocated next to source or in `__tests__/` directories
