# Build Wheel - Gaming Build Randomizer

A web app for randomizing game builds with an animated spinning wheel. Perfect for challenge runs, trying new playstyles, or when you can't decide what to play next.

**Live Demo:** [https://nebula-codes.github.io/build_wheel/](https://nebula-codes.github.io/build_wheel/)

## Features

- **Dual Wheel System** - Spin for class and build simultaneously
- **Build Browser** - Browse all builds with tier ratings, filters, and search
- **Guide Links** - Direct links to Maxroll.gg guides and PoB planners
- **Dark Gaming Theme** - Sleek UI designed for gamers

## Supported Games

### Diablo 4
- All 6 classes (Barbarian, Druid, Necromancer, Rogue, Sorcerer, Spiritborn)
- 40+ endgame builds with tier ratings
- Skills, key items, paragon glyphs, and gameplay tips

### Path of Exile 1
- All 19 ascendancy classes
- 60+ builds from Maxroll.gg
- League starter and endgame builds
- Direct links to build guides and PoB planners

## Tech Stack

- React 18 + Vite
- Tailwind CSS v4
- SVG-based wheel animations

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## Adding More Games

Game data is stored in `src/data/games/`. Each game exports:
- Game metadata (id, name, classes)
- Class data with builds/skills
- Tier and difficulty color functions

## License

MIT
