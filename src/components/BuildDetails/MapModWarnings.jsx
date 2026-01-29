// Map mod warnings for builds - shows which map mods to avoid

// Map mod categories and their effects
const MAP_MODS = {
  // Reflect mods
  'Monsters reflect Physical Damage': {
    category: 'reflect',
    severity: 'critical',
    description: 'Physical damage is reflected back to attacker',
    icon: '🔄',
  },
  'Monsters reflect Elemental Damage': {
    category: 'reflect',
    severity: 'critical',
    description: 'Elemental damage is reflected back to attacker',
    icon: '🔄',
  },

  // Recovery mods
  'Players cannot Regenerate Life, Mana or Energy Shield': {
    category: 'recovery',
    severity: 'critical',
    description: 'No regeneration - relies on leech and flasks only',
    icon: '💔',
  },
  'Players have 60% less Recovery Rate of Life and Energy Shield': {
    category: 'recovery',
    severity: 'high',
    description: 'Significantly reduced recovery',
    icon: '💔',
  },
  'Monsters Poison on Hit': {
    category: 'damage',
    severity: 'medium',
    description: 'All monster hits apply poison',
    icon: '☠️',
  },

  // Damage mods
  'Monsters deal extra Physical Damage as Fire': {
    category: 'damage',
    severity: 'medium',
    description: 'Extra fire damage from all monsters',
    icon: '🔥',
  },
  'Monsters deal extra Physical Damage as Cold': {
    category: 'damage',
    severity: 'medium',
    description: 'Extra cold damage from all monsters',
    icon: '❄️',
  },
  'Monsters deal extra Physical Damage as Lightning': {
    category: 'damage',
    severity: 'medium',
    description: 'Extra lightning damage from all monsters',
    icon: '⚡',
  },
  'Monsters deal extra Physical Damage as Chaos': {
    category: 'damage',
    severity: 'high',
    description: 'Extra chaos damage bypasses ES',
    icon: '💀',
  },

  // Curse mods
  'Players are Cursed with Enfeeble': {
    category: 'curse',
    severity: 'medium',
    description: 'Reduced accuracy and damage',
    icon: '🔮',
  },
  'Players are Cursed with Temporal Chains': {
    category: 'curse',
    severity: 'high',
    description: 'Slower actions and buff expiration',
    icon: '⏳',
  },
  'Players are Cursed with Elemental Weakness': {
    category: 'curse',
    severity: 'high',
    description: 'Reduced elemental resistances',
    icon: '🔮',
  },
  'Players are Cursed with Vulnerability': {
    category: 'curse',
    severity: 'high',
    description: 'Increased physical damage taken',
    icon: '🔮',
  },

  // Ailment mods
  'Monsters Ignite on Hit': {
    category: 'ailment',
    severity: 'medium',
    description: 'All hits apply ignite',
    icon: '🔥',
  },
  'Monsters Freeze on Hit': {
    category: 'ailment',
    severity: 'high',
    description: 'All hits can freeze',
    icon: '❄️',
  },
  'Monsters have a chance to Shock on Hit': {
    category: 'ailment',
    severity: 'medium',
    description: 'Chance to be shocked',
    icon: '⚡',
  },

  // Avoidance mods
  'Monsters have increased Accuracy Rating': {
    category: 'accuracy',
    severity: 'medium',
    description: 'Evasion less effective',
    icon: '🎯',
  },
  'Monsters\' skills Chain 2 additional times': {
    category: 'chain',
    severity: 'high',
    description: 'Projectiles chain more',
    icon: '🔗',
  },

  // Critical mods
  'Monsters have increased Critical Strike Chance': {
    category: 'crit',
    severity: 'medium',
    description: 'More crits from monsters',
    icon: '💥',
  },
  '+X% Monster Critical Strike Multiplier': {
    category: 'crit',
    severity: 'high',
    description: 'Crits deal more damage',
    icon: '💥',
  },

  // Monster buffs
  'Monsters are Hexproof': {
    category: 'hexproof',
    severity: 'medium',
    description: 'Curses don\'t work',
    icon: '🛡️',
  },
  'Monsters cannot be Leeched from': {
    category: 'leech',
    severity: 'critical',
    description: 'No leech recovery',
    icon: '🚫',
  },
  'Monsters have X% chance to Avoid Poison, Bleed, and Impale': {
    category: 'ailment_avoid',
    severity: 'high',
    description: 'Reduced DoT/Impale effectiveness',
    icon: '🛡️',
  },
};

// Build archetype vulnerabilities
const BUILD_VULNERABILITIES = {
  // Damage types
  physical: ['Monsters reflect Physical Damage'],
  elemental: ['Monsters reflect Elemental Damage'],
  fire: ['Monsters reflect Elemental Damage'],
  cold: ['Monsters reflect Elemental Damage'],
  lightning: ['Monsters reflect Elemental Damage'],
  chaos: [], // Chaos has no reflect

  // Recovery methods
  regen: ['Players cannot Regenerate Life, Mana or Energy Shield'],
  leech: ['Monsters cannot be Leeched from'],
  lowRecovery: ['Players have 60% less Recovery Rate of Life and Energy Shield'],

  // Defense types
  evasion: ['Monsters have increased Accuracy Rating'],
  lowChaosRes: ['Monsters deal extra Physical Damage as Chaos'],

  // Offense types
  curse: ['Monsters are Hexproof'],
  poison: ['Monsters have X% chance to Avoid Poison, Bleed, and Impale'],
  bleed: ['Monsters have X% chance to Avoid Poison, Bleed, and Impale'],
  impale: ['Monsters have X% chance to Avoid Poison, Bleed, and Impale'],

  // Generic dangerous
  crit_vulnerable: ['+X% Monster Critical Strike Multiplier', 'Monsters have increased Critical Strike Chance'],
  elemental_vulnerable: ['Players are Cursed with Elemental Weakness'],
};

/**
 * Get map mod warnings for a build based on its properties
 */
export function getMapModWarnings(build) {
  const warnings = [];
  const damageType = build.damageType?.toLowerCase() || '';
  const playstyle = build.playstyle?.toLowerCase() || '';
  const tags = (build.tags || []).map(t => t.toLowerCase());

  // Check damage type vulnerabilities
  if (damageType.includes('physical') || damageType.includes('phys')) {
    warnings.push(...BUILD_VULNERABILITIES.physical);
  }
  if (damageType.includes('elemental') || damageType.includes('fire') ||
      damageType.includes('cold') || damageType.includes('lightning')) {
    warnings.push(...BUILD_VULNERABILITIES.elemental);
  }

  // Check for poison/bleed builds
  if (damageType.includes('poison') || tags.includes('poison')) {
    warnings.push(...BUILD_VULNERABILITIES.poison);
  }
  if (damageType.includes('bleed') || tags.includes('bleed') || tags.includes('bleeding')) {
    warnings.push(...BUILD_VULNERABILITIES.bleed);
  }

  // Check for impale
  if (tags.includes('impale')) {
    warnings.push(...BUILD_VULNERABILITIES.impale);
  }

  // Check for curse-reliant builds
  if (tags.includes('curse') || build.skills?.some(s => s.toLowerCase().includes('curse'))) {
    warnings.push(...BUILD_VULNERABILITIES.curse);
  }

  // Check recovery vulnerabilities
  if (tags.includes('regen') || tags.includes('rf') || tags.includes('righteous fire')) {
    warnings.push(...BUILD_VULNERABILITIES.regen);
  }
  if (tags.includes('leech') || playstyle.includes('melee')) {
    warnings.push(...BUILD_VULNERABILITIES.leech);
  }

  // Evasion builds
  if (tags.includes('evasion') || tags.includes('dodge')) {
    warnings.push(...BUILD_VULNERABILITIES.evasion);
  }

  // Add common dangerous mods for most builds
  warnings.push('Players cannot Regenerate Life, Mana or Energy Shield');
  warnings.push('Players are Cursed with Temporal Chains');

  // Deduplicate
  return [...new Set(warnings)];
}

const severityColors = {
  critical: 'bg-red-900/50 border-red-700/60 text-red-300',
  high: 'bg-orange-900/50 border-orange-700/60 text-orange-300',
  medium: 'bg-yellow-900/50 border-yellow-700/60 text-yellow-300',
  low: 'bg-gray-800/50 border-gray-600/60 text-gray-300',
};

const severityLabels = {
  critical: 'Avoid',
  high: 'Caution',
  medium: 'Moderate',
  low: 'Minor',
};

/**
 * Single map mod warning display
 */
function MapModWarning({ mod, severity = 'medium' }) {
  const modData = MAP_MODS[mod] || {
    category: 'other',
    severity,
    description: mod,
    icon: '⚠️',
  };

  return (
    <div className={`
      flex items-start gap-2 p-2 rounded border
      ${severityColors[modData.severity]}
    `}>
      <span className="text-lg flex-shrink-0">{modData.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium leading-tight">{mod}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">{modData.description}</div>
      </div>
      <span className={`
        text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider
        ${modData.severity === 'critical' ? 'bg-red-800 text-red-200' :
          modData.severity === 'high' ? 'bg-orange-800 text-orange-200' :
          'bg-gray-700 text-gray-300'}
      `}>
        {severityLabels[modData.severity]}
      </span>
    </div>
  );
}

/**
 * Full map mod warnings display for a build
 */
export default function MapModWarnings({ build, className = '' }) {
  const warnings = getMapModWarnings(build);

  // Sort by severity
  const sortedWarnings = warnings
    .map(mod => ({ mod, data: MAP_MODS[mod] }))
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aSev = a.data?.severity || 'medium';
      const bSev = b.data?.severity || 'medium';
      return severityOrder[aSev] - severityOrder[bSev];
    });

  if (sortedWarnings.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No specific map mod warnings for this build.
      </div>
    );
  }

  // Group by severity
  const critical = sortedWarnings.filter(w => w.data?.severity === 'critical');
  const high = sortedWarnings.filter(w => w.data?.severity === 'high');
  const medium = sortedWarnings.filter(w => w.data?.severity === 'medium');

  return (
    <div className={`space-y-4 ${className}`}>
      <h4 className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
        <span>Map Mod Warnings</span>
        <span className="flex-1 h-px bg-gray-800" />
      </h4>

      {/* Critical warnings */}
      {critical.length > 0 && (
        <div>
          <div className="text-[10px] text-red-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Must Avoid ({critical.length})
          </div>
          <div className="space-y-1.5">
            {critical.map((w, idx) => (
              <MapModWarning key={idx} mod={w.mod} />
            ))}
          </div>
        </div>
      )}

      {/* High priority warnings */}
      {high.length > 0 && (
        <div>
          <div className="text-[10px] text-orange-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            Caution ({high.length})
          </div>
          <div className="space-y-1.5">
            {high.map((w, idx) => (
              <MapModWarning key={idx} mod={w.mod} />
            ))}
          </div>
        </div>
      )}

      {/* Medium warnings */}
      {medium.length > 0 && (
        <div>
          <div className="text-[10px] text-yellow-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            Moderate ({medium.length})
          </div>
          <div className="space-y-1.5">
            {medium.map((w, idx) => (
              <MapModWarning key={idx} mod={w.mod} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Export constants for external use
export { MAP_MODS, BUILD_VULNERABILITIES };
