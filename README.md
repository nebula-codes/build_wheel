# Build Wheel - Gaming Build Randomizer

A web app for randomizing game builds with an animated spinning wheel. Perfect for challenge runs, trying new playstyles, or when you can't decide what to play next.

**Live Demo:** [https://nebula-codes.github.io/build_wheel/](https://nebula-codes.github.io/build_wheel/)

## Features

- **Dual Wheel System** - Spin for class and build simultaneously
- **Build Browser** - Browse all builds with tier ratings, filters, and search
- **Interactive Skill Tree** - PixiJS-powered passive tree viewer with keystone highlighting
- **AI Build Advisor** - Chat-based build advisor with model selection and web search
- **PoB Import** - Import Path of Building codes and URLs
- **Build Comparison** - Side-by-side build comparison
- **Guide Links** - Direct links to Maxroll.gg guides and PoB planners
- **Dark Gaming Theme** - Sleek UI designed for gamers

## Supported Games

### Path of Exile 1
- All 19 ascendancy classes
- 60+ builds from Maxroll.gg + poe.ninja meta builds
- League starter and endgame builds
- Keystones, ascendancy order, pantheon/bandit choices
- Map mod warnings and build progression guides
- Interactive passive skill tree viewer

### Diablo 4
- All 6 classes (Barbarian, Druid, Necromancer, Rogue, Sorcerer, Spiritborn)
- 40+ endgame builds with tier ratings
- Skills, key items, paragon glyphs, and gameplay tips

## Tech Stack

- React 19 + Vite 7
- Tailwind CSS v4
- PixiJS 8 + pixi-viewport (interactive skill tree)
- pako (zlib decompression for PoB codes)
- SVG-based wheel animations

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint
```

## Data Pipeline

Build data is sourced from Maxroll.gg guides and poe.ninja meta statistics. Scripts in `scripts/` handle scraping, generating, and merging build data:

1. `scrape-popular-builds.js` - Scrapes poe.ninja for top skills per ascendancy
2. `generate-poe1-builds.js` - Generates `poe1-ninja-builds.js` from scraped data
3. `apply-scraped-data.js` - Injects scraped keystones/top builds into `poe1.js` (supports `--dry-run`)
4. `merge-poe1-builds.js` - Merges ninja builds with Maxroll builds (supports `--dry-run`)

## Adding More Games

Game data is stored in `src/data/games/`. Each game exports:
- Game metadata (id, name, classes)
- Class data with builds/skills
- Tier and difficulty color functions

## License

MIT
