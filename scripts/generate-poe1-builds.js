#!/usr/bin/env node

/**
 * Generates poe.ninja builds data and integrates it into poe1.js
 *
 * Usage: node scripts/generate-poe1-builds.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the builds data
import { POE_NINJA_BUILDS, generateBuildId, getAscendancyInfo } from './poe-ninja-builds.js';

function generateBuildEntry(build) {
  const id = generateBuildId(build.skill, build.class);
  const ascInfo = getAscendancyInfo(build.class);

  // Determine description based on playstyle and damage type (fallback if not provided)
  const descriptions = {
    'DoT': `A damage over time build dealing ${build.damageType.toLowerCase()} damage that burns enemies continuously.`,
    'Spell': `A ${build.damageType.toLowerCase()} spell build with strong ${build.tier === 'S' ? 'meta' : build.tier === 'A' ? 'solid' : 'viable'} performance.`,
    'Melee': `A melee build focusing on ${build.damageType.toLowerCase()} damage with ${build.tags.includes('Tanky') ? 'strong defenses' : 'good damage'}.`,
    'Ranged': `A ranged attack build dealing ${build.damageType.toLowerCase()} damage from a distance.`,
    'Minion': `A summoner build that commands ${build.skill.includes('Zombie') ? 'zombies' : build.skill.includes('Skeleton') ? 'skeletons' : build.skill.includes('Spirit') ? 'spirits' : 'minions'} to fight for you.`,
    'Totem': `A totem build that places ${build.skill.toLowerCase()} totems to deal damage automatically.`,
    'Trap': `A trap build that throws ${build.skill.toLowerCase()} traps for burst damage.`,
    'Mine': `A mine build using ${build.skill.toLowerCase()} mines for high single-target damage.`,
    'Brand': `A brand build that attaches ${build.damageType.toLowerCase()} brands to enemies.`,
    'CoC': `A Cast on Crit build triggering ${build.skill} with Cyclone attacks.`,
    'Autobomber': `An autobomber build that clears screens automatically with herald effects.`,
    'Aura': `An aura-based build providing ${build.damageType.toLowerCase()} damage through buffs.`,
    'Buff': `A buff-focused build that enhances damage through ${build.skill}.`,
    'Minion/Spell': `A hybrid spell/minion build using ${build.skill} to summon and deal damage.`,
  };

  const description = descriptions[build.playstyle] ||
    `A ${build.class} build using ${build.skill} for ${build.damageType.toLowerCase()} damage.`;

  const entry = {
    id,
    name: build.skill,
    tier: build.tier,
    description,
    playstyle: build.playstyle,
    damageType: build.damageType,
    difficulty: build.difficulty,
    popularity: build.popularity,
    tags: build.tags,
    source: 'poe.ninja',
    league: '3.27',
    guideUrl: `https://poe.ninja/poe1/builds/keepers?skills=${encodeURIComponent(build.skill)}&class=${build.class}`,
    plannerUrl: null,
  };

  // Add detailed build info if available
  if (build.keystones && build.keystones.length > 0) {
    entry.keystones = build.keystones;
  }
  if (build.skills && build.skills.length > 0) {
    entry.skills = build.skills;
  }
  if (build.keyItems && build.keyItems.length > 0) {
    entry.keyItems = build.keyItems;
  }
  if (build.ascendancy && build.ascendancy.length > 0) {
    entry.ascendancy = build.ascendancy;
  }
  if (build.gameplay) {
    entry.gameplay = build.gameplay;
  }

  return entry;
}

function generatePoe1Data() {
  // Group builds by ascendancy
  const buildsByClass = {};

  POE_NINJA_BUILDS.forEach(build => {
    if (!buildsByClass[build.class]) {
      buildsByClass[build.class] = [];
    }
    buildsByClass[build.class].push(generateBuildEntry(build));
  });

  // Define all ascendancies in order
  const ascendancyOrder = [
    // Ranger
    'Deadeye', 'Pathfinder', 'Raider',
    // Witch
    'Necromancer', 'Occultist', 'Elementalist',
    // Duelist
    'Slayer', 'Gladiator', 'Champion',
    // Marauder
    'Juggernaut', 'Berserker', 'Chieftain',
    // Shadow
    'Assassin', 'Trickster', 'Saboteur',
    // Templar
    'Inquisitor', 'Hierophant', 'Guardian',
    // Scion
    'Ascendant',
  ];

  // Generate classes array
  const classes = ascendancyOrder.map(className => {
    const info = getAscendancyInfo(className);
    const skills = buildsByClass[className] || [];

    // Sort skills by popularity (descending)
    skills.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    return {
      id: className.toLowerCase(),
      name: className,
      baseClass: info.baseClass,
      color: info.color,
      skills,
    };
  });

  return classes;
}

function main() {
  console.log('=== PoE 1 Builds Generator ===\n');
  console.log(`Processing ${POE_NINJA_BUILDS.length} builds...\n`);

  const classes = generatePoe1Data();

  // Count total skills
  let totalSkills = 0;
  classes.forEach(cls => {
    console.log(`${cls.name}: ${cls.skills.length} builds`);
    totalSkills += cls.skills.length;
  });

  console.log(`\nTotal: ${totalSkills} builds across ${classes.length} ascendancies`);

  // Generate the output file content
  const output = `// Auto-generated PoE 1 builds from poe.ninja data
// Generated on: ${new Date().toISOString()}
// Total builds: ${totalSkills}

export const poe1NinjaBuilds = {
  id: 'poe1-ninja',
  name: 'Path of Exile (poe.ninja)',
  classes: ${JSON.stringify(classes, null, 2).replace(/"([^"]+)":/g, '$1:')}
};
`;

  const outputPath = path.join(__dirname, '..', 'src', 'data', 'games', 'poe1-ninja-builds.js');
  fs.writeFileSync(outputPath, output);
  console.log(`\nSaved to: ${outputPath}`);

  // Also save as JSON for reference
  const jsonPath = path.join(__dirname, 'poe1-ninja-builds.json');
  fs.writeFileSync(jsonPath, JSON.stringify(classes, null, 2));
  console.log(`JSON saved to: ${jsonPath}`);
}

main();
