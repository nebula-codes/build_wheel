# Build Wheel - Project Guide

## Overview
Gaming build randomizer web app with animated spinning wheels for Path of Exile 1 and Diablo 4. Deployed to GitHub Pages at https://nebula-codes.github.io/build_wheel/.

## Tech Stack
- **Frontend:** React 19 + Vite 7 (JSX, no TypeScript)
- **Styling:** Tailwind CSS v4 with PostCSS
- **Graphics:** PixiJS 8 + pixi-viewport for interactive skill tree rendering
- **Compression:** pako (zlib) for PoB code decoding
- **Analytics:** GoatCounter
- **Scraping:** Puppeteer (dev scripts only)

## Project Structure
```
src/
  App.jsx              # Root component - wheel view, browser view, skill tree view (~925 lines)
  main.jsx             # Entry point with StrictMode
  index.css            # Tailwind import + dark theme variables
  components/
    Wheel.jsx          # SVG spinning wheel with forwardRef
    ResultDisplay.jsx  # Build result details after spin
    BuildBrowser.jsx   # Filterable build browser (~954 lines, largest component)
    AdvancedFilters/   # Multi-category filter chips
    BuildAdvisor/      # AI chat advisor (OpenAI API integration)
    BuildComparison/   # Side-by-side build comparison
    BuildDetails/      # Progression, Pantheon/Bandit, Map Mod warnings
    EquipmentDisplay/  # PoE-style equipment grid
    GemLinks/          # Skill gem display with socket colors
    ItemDisplay/       # Unique items, flasks, jewels
    LiveBuilds/        # poe.ninja live stats panel (CORS limited)
    PoBImport/         # Path of Building code/URL importer
    SkillTree/         # PixiJS interactive passive tree viewer
  data/games/
    index.js           # Game registry + poe.ninja build merge logic
    poe1.js            # PoE 1 Maxroll builds (~1,761 lines)
    poe1-ninja-builds.js  # Auto-generated poe.ninja builds (~5,443 lines)
    diablo4.js         # D4 Season 11 builds (~516 lines)
  hooks/
    useWheelSpin.js    # Wheel animation logic with easing
  utils/
    pobParser.js       # PoB code decoder (base64, zlib, XML parsing)
    poeImages.js       # Gem/item icon URL mappings (~250 entries)
    poeNinjaApi.js     # poe.ninja API wrapper with 5-min cache
    treeUtils.js       # Skill tree data processing + node positioning
scripts/               # Data pipeline scripts (Puppeteer scrapers, mergers)
public/assets/skill-tree/  # Sprite sheets for passive tree rendering
```

## Commands
```bash
npm run dev      # Start dev server on port 4500
npm run build    # Production build (base: /build_wheel/ for GH Pages)
npm run lint     # ESLint check
npm run preview  # Preview production build
```

## Key Conventions
- **No TypeScript** - project uses plain JSX throughout
- **Tailwind utility classes** - no separate CSS modules, inline Tailwind in JSX
- **Custom colors** defined in index.css: `--color-diablo-orange`, `--color-diablo-gold`, `--color-diablo-red`
- **Component barrel exports** - each component folder has an `index.js` re-export
- **localStorage** used for: favorites (`buildWheel_favorites`), sound prefs (`buildWheel_soundEnabled`), API keys (`poe_advisor_apiKey`)
- **sessionStorage** used for: skill tree data cache
- **Dark theme only** - bg `#0f0f17`, sidebar `#1a1a24`
- **forwardRef pattern** on Wheel component to expose `spin()` and `reset()` to parent
- **No router** - view switching via `activeView` state in App.jsx

## Data Pipeline
1. `scripts/scrape-popular-builds.js` - Scrapes poe.ninja for top skills per ascendancy
2. `scripts/poe-ninja-builds.js` - Central build data source
3. `scripts/generate-poe1-builds.js` - Generates `poe1-ninja-builds.js` from scraped data
4. `scripts/scrape-poeninja.js` - Scrapes keystones + top builds for off-meta builds
5. `scripts/apply-scraped-data.js` - Injects scraped data back into `poe1.js`
6. `scripts/merge-poe1-builds.js` - Merges ninja builds with Maxroll builds

## Important Notes
- `poe1-ninja-builds.js` is auto-generated but has manual additions - regenerating loses manual edits
- LiveBuilds panel is disabled due to CORS issues with poe.ninja API
- PoB parser uses browser DOMParser - not portable to Node.js
- Hardcoded 'raider' class excluded by default on game load (App.jsx line 15)
- Build data files are large (poe1-ninja-builds.js ~5.4k lines) - avoid reading in full when possible
- The `base` in vite.config.js changes between dev (`/`) and prod (`/build_wheel/`)
