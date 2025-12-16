import { diablo4, getTierColor, getDifficultyColor } from './diablo4';
import { poe1 as poe1Maxroll, getPoeTierColor, getPoeDifficultyColor } from './poe1';
import { poe1NinjaBuilds } from './poe1-ninja-builds';

// Merge poe1 Maxroll builds with poe.ninja builds
function mergePoe1Builds() {
  const merged = { ...poe1Maxroll };

  // Create a map of existing classes
  const classMap = {};
  merged.classes.forEach(cls => {
    classMap[cls.id] = cls;
  });

  // Merge poe.ninja builds into existing classes
  poe1NinjaBuilds.classes.forEach(ninjaClass => {
    if (classMap[ninjaClass.id]) {
      // Get existing skill IDs to avoid duplicates
      const existingIds = new Set(classMap[ninjaClass.id].skills.map(s => s.id));

      // Add new skills that don't already exist
      ninjaClass.skills.forEach(skill => {
        // Check for duplicate by ID or by name+class combination
        const isDuplicate = existingIds.has(skill.id) ||
          classMap[ninjaClass.id].skills.some(s =>
            s.name.toLowerCase() === skill.name.toLowerCase()
          );

        if (!isDuplicate) {
          classMap[ninjaClass.id].skills.push(skill);
        }
      });
    } else {
      // Add new class (shouldn't happen, but just in case)
      merged.classes.push(ninjaClass);
    }
  });

  return merged;
}

const poe1 = mergePoe1Builds();

export const games = {
  diablo4,
  poe1,
};

export const gameList = Object.values(games);

export { getTierColor, getDifficultyColor };

// Universal tier color function that works for all games
export const getUniversalTierColor = (tier, gameId) => {
  if (gameId === 'poe1') {
    return getPoeTierColor(tier);
  }
  return getTierColor(tier);
};

// Universal difficulty color function
export const getUniversalDifficultyColor = (difficulty, gameId) => {
  if (gameId === 'poe1') {
    return getPoeDifficultyColor(difficulty);
  }
  return getDifficultyColor(difficulty);
};
