/**
 * Build data schema validation
 * Validates build objects at import time to catch data issues early
 */

const REQUIRED_FIELDS = {
  id: 'string',
  name: 'string',
};

const OPTIONAL_FIELDS = {
  description: 'string',
  tier: 'string',
  difficulty: 'string',
  playstyle: 'string',
  damageType: 'string',
  league: 'string',
  source: 'string',
  gameplay: 'string',
  guideUrl: 'string',
  plannerUrl: 'string',
  skills: 'array',
  keyItems: 'array',
  keystones: 'array',
  ascendancy: 'array',
  tags: 'array',
  statPriorities: 'array',
  paragonGlyphs: 'array',
  pantheon: 'object',
  bandit: 'string',
  progression: 'object',
  topBuilds: 'array',
};

const REQUIRED_CLASS_FIELDS = {
  id: 'string',
  name: 'string',
  color: 'string',
  skills: 'array',
};

function checkType(value, expectedType) {
  if (expectedType === 'array') return Array.isArray(value);
  if (expectedType === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  return typeof value === expectedType;
}

/**
 * Validate a single build object
 * Returns an array of warning messages (empty = valid)
 */
export function validateBuild(build, className = 'unknown') {
  const warnings = [];

  for (const [field, type] of Object.entries(REQUIRED_FIELDS)) {
    if (build[field] === undefined || build[field] === null) {
      warnings.push(`Build "${build.name || build.id || '?'}" in class "${className}" missing required field: ${field}`);
    } else if (!checkType(build[field], type)) {
      warnings.push(`Build "${build.name}" field "${field}" expected ${type}, got ${typeof build[field]}`);
    }
  }

  for (const [field, type] of Object.entries(OPTIONAL_FIELDS)) {
    if (build[field] !== undefined && build[field] !== null && !checkType(build[field], type)) {
      warnings.push(`Build "${build.name}" field "${field}" expected ${type}, got ${typeof build[field]}`);
    }
  }

  return warnings;
}

/**
 * Validate a class object
 */
export function validateClass(cls) {
  const warnings = [];

  for (const [field, type] of Object.entries(REQUIRED_CLASS_FIELDS)) {
    if (cls[field] === undefined || cls[field] === null) {
      warnings.push(`Class "${cls.name || cls.id || '?'}" missing required field: ${field}`);
    } else if (!checkType(cls[field], type)) {
      warnings.push(`Class "${cls.name}" field "${field}" expected ${type}, got ${typeof cls[field]}`);
    }
  }

  if (cls.skills) {
    cls.skills.forEach(skill => {
      warnings.push(...validateBuild(skill, cls.name));
    });
  }

  return warnings;
}

/**
 * Validate an entire game data object
 * Logs warnings to console in development
 */
export function validateGameData(gameData, gameName = 'unknown') {
  if (!gameData || !gameData.classes) {
    console.warn(`[Schema] Game "${gameName}" has no classes array`);
    return;
  }

  const allWarnings = [];

  gameData.classes.forEach(cls => {
    allWarnings.push(...validateClass(cls));
  });

  if (allWarnings.length > 0 && import.meta.env.DEV) {
    console.warn(`[Schema] ${allWarnings.length} validation warning(s) in "${gameName}":`);
    allWarnings.slice(0, 10).forEach(w => console.warn(`  - ${w}`));
    if (allWarnings.length > 10) {
      console.warn(`  ... and ${allWarnings.length - 10} more`);
    }
  }

  return allWarnings;
}
