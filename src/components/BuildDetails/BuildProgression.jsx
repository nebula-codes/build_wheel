import { useState } from 'react';
import { UniqueItem } from '../ItemDisplay/ItemDisplay';
import { GemBadge } from '../GemLinks/GemLinks';

// Budget tier definitions
const BUDGET_TIERS = {
  starter: {
    name: 'League Start',
    budget: '0-10c',
    description: 'Day 1-3 gear, self-found or cheap trades',
    color: 'from-gray-700/50 border-gray-600',
    icon: '🌱',
  },
  budget: {
    name: 'Budget',
    budget: '10c-1div',
    description: 'First upgrades after campaign',
    color: 'from-green-900/40 border-green-700/50',
    icon: '💰',
  },
  midgame: {
    name: 'Mid-Game',
    budget: '1-10div',
    description: 'Yellow/early red maps capable',
    color: 'from-blue-900/40 border-blue-700/50',
    icon: '⚔️',
  },
  endgame: {
    name: 'End-Game',
    budget: '10-50div',
    description: 'All content viable',
    color: 'from-purple-900/40 border-purple-700/50',
    icon: '👑',
  },
  minmax: {
    name: 'Min-Max',
    budget: '50div+',
    description: 'Fully optimized, mirror-tier aspirations',
    color: 'from-amber-900/40 border-amber-700/50',
    icon: '💎',
  },
};

// Leveling progression milestones
const LEVELING_MILESTONES = [
  { level: 1, act: 1, name: 'Twilight Strand', tips: 'Pick up any 3-link' },
  { level: 12, act: 1, name: 'Merveil', tips: 'Have your main skill 3-linked' },
  { level: 24, act: 3, name: 'Dominus', tips: 'Upgrade to 4-link, cap fire res' },
  { level: 33, act: 4, name: 'Malachai', tips: 'Get movement skill, cap all res' },
  { level: 40, act: 5, name: 'Innocence', tips: 'Ascend after Izaro' },
  { level: 45, act: 6, name: 'Brine King', tips: 'Re-cap resistances after penalty' },
  { level: 50, act: 7, name: 'Arakaali', tips: 'Start looking for 5-link' },
  { level: 55, act: 8, name: 'Lunaris/Solaris', tips: 'Second Ascendancy' },
  { level: 60, act: 9, name: 'Depraved Trinity', tips: 'Finalize leveling setup' },
  { level: 68, act: 10, name: 'Kitava', tips: 'Enter maps, re-cap resistances again' },
];

/**
 * Single progression tier display
 */
function ProgressionTier({ tier, data, isActive, onClick }) {
  const tierInfo = BUDGET_TIERS[tier];

  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer p-4 rounded-lg border transition-all
        bg-gradient-to-br ${tierInfo.color} to-transparent
        ${isActive ? 'ring-2 ring-white/30 scale-[1.02]' : 'hover:scale-[1.01]'}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{tierInfo.icon}</span>
          <div>
            <div className="text-sm font-semibold text-white">{tierInfo.name}</div>
            <div className="text-[10px] text-gray-400">{tierInfo.budget}</div>
          </div>
        </div>
        {isActive && (
          <span className="text-xs px-2 py-0.5 bg-white/20 rounded text-white">Selected</span>
        )}
      </div>
      <div className="text-xs text-gray-400">{tierInfo.description}</div>

      {/* Show item/gem count if data exists */}
      {data && (
        <div className="mt-2 flex gap-3 text-[10px] text-gray-500">
          {data.items?.length > 0 && <span>{data.items.length} items</span>}
          {data.gems?.length > 0 && <span>{data.gems.length} gems</span>}
        </div>
      )}
    </div>
  );
}

/**
 * Progression tier details panel
 */
function TierDetails({ tier, data }) {
  if (!data) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No progression data available for this tier.</p>
        <p className="text-xs mt-1">Check the build guide for upgrade recommendations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Description */}
      {data.description && (
        <p className="text-sm text-gray-300">{data.description}</p>
      )}

      {/* DPS/Stats preview */}
      {data.stats && (
        <div className="flex gap-4 text-sm">
          {data.stats.dps && (
            <div className="bg-red-900/30 rounded px-3 py-1.5">
              <span className="text-gray-400 text-xs">DPS</span>
              <span className="ml-2 text-red-300 font-semibold">{data.stats.dps}</span>
            </div>
          )}
          {data.stats.life && (
            <div className="bg-red-900/30 rounded px-3 py-1.5">
              <span className="text-gray-400 text-xs">Life</span>
              <span className="ml-2 text-red-300 font-semibold">{data.stats.life}</span>
            </div>
          )}
          {data.stats.es && (
            <div className="bg-blue-900/30 rounded px-3 py-1.5">
              <span className="text-gray-400 text-xs">ES</span>
              <span className="ml-2 text-blue-300 font-semibold">{data.stats.es}</span>
            </div>
          )}
        </div>
      )}

      {/* Key items for this tier */}
      {data.items && data.items.length > 0 && (
        <div>
          <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Key Items</h5>
          <div className="grid grid-cols-2 gap-1.5">
            {data.items.map((item, idx) => (
              <UniqueItem
                key={idx}
                name={typeof item === 'string' ? item : item.name}
                baseType={typeof item === 'object' ? item.baseType : null}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gem changes */}
      {data.gems && data.gems.length > 0 && (
        <div>
          <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Gem Setup Changes</h5>
          <div className="flex flex-wrap gap-1.5">
            {data.gems.map((gem, idx) => (
              <GemBadge key={idx} name={gem} size="sm" />
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {data.tips && data.tips.length > 0 && (
        <div>
          <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Upgrade Tips</h5>
          <ul className="space-y-1">
            {data.tips.map((tip, idx) => (
              <li key={idx} className="text-xs text-gray-400 flex items-start gap-1.5">
                <span className="text-green-500 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* PoB Link */}
      {data.pobUrl && (
        <a
          href={data.pobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
          Open in Path of Building
        </a>
      )}
    </div>
  );
}

/**
 * Leveling guide timeline
 */
function LevelingTimeline({ levelingData }) {
  const milestones = levelingData || LEVELING_MILESTONES;

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700" />

      <div className="space-y-3">
        {milestones.map((milestone, idx) => (
          <div key={idx} className="relative flex items-start gap-3 pl-10">
            {/* Level dot */}
            <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center">
              <span className="text-[8px] text-gray-300">{milestone.level}</span>
            </div>

            {/* Content */}
            <div className="flex-1 bg-gray-800/30 rounded-lg p-2 border border-gray-700/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white font-medium">{milestone.name}</span>
                <span className="text-[10px] text-gray-500">Act {milestone.act}</span>
              </div>
              {milestone.tips && (
                <p className="text-xs text-gray-400 mt-0.5">{milestone.tips}</p>
              )}
              {milestone.skill && (
                <div className="mt-1.5">
                  <GemBadge name={milestone.skill} size="xs" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full build progression component
 */
export default function BuildProgression({ progression, className = '' }) {
  const [activeTier, setActiveTier] = useState('budget');
  const [showLeveling, setShowLeveling] = useState(false);

  // Default progression if none provided
  const defaultProgression = {
    starter: {
      description: 'Focus on getting your main skill linked and capping resistances.',
      items: [],
      tips: ['Get a 4-link with correct colors', 'Cap elemental resistances to 75%', 'Get life on every piece of gear'],
    },
    budget: {
      description: 'First meaningful upgrades that significantly boost clear speed.',
      items: [],
      tips: ['Upgrade to a 5-link chest', 'Get your first unique items', 'Quality your main gems'],
    },
    midgame: {
      description: 'Capable of running all map tiers comfortably.',
      items: [],
      tips: ['6-link your main skill', 'Get Awakened gems if applicable', 'Optimize flask suffixes'],
    },
    endgame: {
      description: 'All content viable including pinnacle bosses.',
      items: [],
      tips: ['Double influenced gear', 'Awakened/Anomalous gems', 'Perfect enchantments'],
    },
    minmax: {
      description: 'Push damage and defenses to their limits.',
      items: [],
      tips: ['Mirror-tier rares', 'Triple elevated mods', 'Perfect corruption implicits'],
    },
  };

  const tierData = progression || defaultProgression;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs text-gray-500 uppercase tracking-wider">Build Progression</h4>
        <button
          onClick={() => setShowLeveling(!showLeveling)}
          className={`
            text-xs px-2 py-1 rounded transition-colors
            ${showLeveling ? 'bg-cyan-900/50 text-cyan-300' : 'bg-gray-800 text-gray-400 hover:text-gray-300'}
          `}
        >
          {showLeveling ? 'Hide Leveling' : 'Show Leveling'}
        </button>
      </div>

      {/* Leveling timeline */}
      {showLeveling && (
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
          <h5 className="text-sm font-medium text-white mb-3">Leveling Guide</h5>
          <LevelingTimeline levelingData={progression?.leveling} />
        </div>
      )}

      {/* Budget tier selector */}
      <div className="grid grid-cols-5 gap-2">
        {Object.keys(BUDGET_TIERS).map((tier) => (
          <ProgressionTier
            key={tier}
            tier={tier}
            data={tierData[tier]}
            isActive={activeTier === tier}
            onClick={() => setActiveTier(tier)}
          />
        ))}
      </div>

      {/* Selected tier details */}
      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
        <TierDetails tier={activeTier} data={tierData[activeTier]} />
      </div>
    </div>
  );
}

// Export individual components
export { ProgressionTier, TierDetails, LevelingTimeline, BUDGET_TIERS, LEVELING_MILESTONES };
