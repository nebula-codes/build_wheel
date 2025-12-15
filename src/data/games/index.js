import { diablo4, getTierColor, getDifficultyColor } from './diablo4';
import { poe1, getPoeTierColor, getPoeDifficultyColor } from './poe1';

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
