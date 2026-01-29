import { useState, useMemo } from 'react';

// Filter categories and their options
const FILTER_CATEGORIES = {
  damageType: {
    label: 'Damage Type',
    options: [
      { value: 'physical', label: 'Physical', color: 'bg-gray-500' },
      { value: 'fire', label: 'Fire', color: 'bg-red-500' },
      { value: 'cold', label: 'Cold', color: 'bg-blue-400' },
      { value: 'lightning', label: 'Lightning', color: 'bg-yellow-400' },
      { value: 'chaos', label: 'Chaos', color: 'bg-purple-500' },
      { value: 'elemental', label: 'Elemental (Mixed)', color: 'bg-gradient-to-r from-red-500 via-blue-500 to-yellow-500' },
      { value: 'poison', label: 'Poison', color: 'bg-green-500' },
      { value: 'bleed', label: 'Bleed', color: 'bg-red-700' },
      { value: 'minion', label: 'Minion', color: 'bg-teal-500' },
    ],
  },
  playstyle: {
    label: 'Playstyle',
    options: [
      { value: 'melee', label: 'Melee' },
      { value: 'ranged', label: 'Ranged' },
      { value: 'caster', label: 'Caster/Spell' },
      { value: 'summoner', label: 'Summoner' },
      { value: 'totem', label: 'Totem' },
      { value: 'trap', label: 'Trap' },
      { value: 'mine', label: 'Mine' },
      { value: 'dot', label: 'Damage over Time' },
      { value: 'channeling', label: 'Channeling' },
    ],
  },
  defense: {
    label: 'Defense Type',
    options: [
      { value: 'life', label: 'Life-based' },
      { value: 'es', label: 'Energy Shield' },
      { value: 'hybrid', label: 'Hybrid (Life + ES)' },
      { value: 'lowlife', label: 'Low Life' },
      { value: 'ci', label: 'Chaos Inoculation' },
      { value: 'armor', label: 'Armor Stacking' },
      { value: 'evasion', label: 'Evasion/Dodge' },
      { value: 'block', label: 'Block' },
      { value: 'ward', label: 'Ward' },
    ],
  },
  mechanic: {
    label: 'Key Mechanics',
    options: [
      { value: 'crit', label: 'Critical Strike' },
      { value: 'ailment', label: 'Elemental Ailments' },
      { value: 'impale', label: 'Impale' },
      { value: 'ignite', label: 'Ignite' },
      { value: 'freeze', label: 'Freeze/Chill' },
      { value: 'shock', label: 'Shock' },
      { value: 'wither', label: 'Wither' },
      { value: 'curse', label: 'Curse-based' },
      { value: 'aura', label: 'Aura Stacker' },
      { value: 'conversion', label: 'Damage Conversion' },
      { value: 'brand', label: 'Brand' },
      { value: 'trigger', label: 'Trigger/CoC/CwC' },
    ],
  },
  content: {
    label: 'Content Suitability',
    options: [
      { value: 'leaguestarter', label: 'League Starter' },
      { value: 'ssf', label: 'SSF Viable' },
      { value: 'hc', label: 'Hardcore Viable' },
      { value: 'mapping', label: 'Fast Mapping' },
      { value: 'bossing', label: 'Boss Killer' },
      { value: 'allaround', label: 'All-Rounder' },
      { value: 'delve', label: 'Delve' },
      { value: 'heist', label: 'Heist' },
      { value: 'simulacrum', label: 'Simulacrum' },
      { value: 'ubers', label: 'Uber Bosses' },
    ],
  },
  budget: {
    label: 'Budget',
    options: [
      { value: 'free', label: 'No Uniques Required' },
      { value: 'cheap', label: 'Under 1 Divine' },
      { value: 'medium', label: '1-10 Divines' },
      { value: 'expensive', label: '10-50 Divines' },
      { value: 'mirror', label: '50+ Divines' },
    ],
  },
};

/**
 * Filter chip component
 */
function FilterChip({ label, isActive, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-2.5 py-1 text-xs rounded-full border transition-all
        ${isActive
          ? 'bg-cyan-900/50 border-cyan-600 text-cyan-300'
          : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
        }
      `}
    >
      {color && <span className={`inline-block w-2 h-2 rounded-full ${color} mr-1.5`} />}
      {label}
    </button>
  );
}

/**
 * Filter category section
 */
function FilterCategory({ category, options, activeFilters, onToggle }) {
  return (
    <div>
      <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">{category}</h4>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            color={option.color}
            isActive={activeFilters.includes(option.value)}
            onClick={() => onToggle(option.value)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Apply filters to a list of builds
 */
export function applyFilters(builds, filters) {
  if (!filters || Object.keys(filters).length === 0) {
    return builds;
  }

  return builds.filter((build) => {
    // Check each active filter category
    for (const [category, values] of Object.entries(filters)) {
      if (!values || values.length === 0) continue;

      const buildValue = getBuildValueForCategory(build, category);
      const matches = values.some((v) => matchesFilter(buildValue, v, build));

      if (!matches) return false;
    }
    return true;
  });
}

/**
 * Get the relevant value from a build for a filter category
 */
function getBuildValueForCategory(build, category) {
  switch (category) {
    case 'damageType':
      return build.damageType?.toLowerCase() || '';
    case 'playstyle':
      return build.playstyle?.toLowerCase() || '';
    case 'defense':
    case 'mechanic':
    case 'content':
    case 'budget':
      return (build.tags || []).map((t) => t.toLowerCase());
    default:
      return '';
  }
}

/**
 * Check if a build matches a specific filter value
 */
function matchesFilter(buildValue, filterValue, build) {
  const fv = filterValue.toLowerCase();

  // Array values (tags)
  if (Array.isArray(buildValue)) {
    return buildValue.some((v) => v.includes(fv) || fv.includes(v));
  }

  // String values
  if (typeof buildValue === 'string') {
    return buildValue.includes(fv);
  }

  // Special cases
  if (fv === 'leaguestarter' || fv === 'league starter') {
    return (build.tags || []).some((t) => t.toLowerCase().includes('league') && t.toLowerCase().includes('start'));
  }
  if (fv === 'ssf') {
    return (build.tags || []).some((t) => t.toLowerCase().includes('ssf'));
  }
  if (fv === 'hc' || fv === 'hardcore') {
    return (build.tags || []).some((t) => t.toLowerCase().includes('hardcore') || t.toLowerCase().includes('hc'));
  }

  return false;
}

/**
 * Advanced filters panel
 */
export default function AdvancedFilters({
  filters = {},
  onFiltersChange,
  className = '',
  collapsible = true,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).reduce((count, arr) => count + (arr?.length || 0), 0);
  }, [filters]);

  const toggleFilter = (category, value) => {
    const current = filters[category] || [];
    const newFilters = {
      ...filters,
      [category]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    };
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const content = (
    <div className="space-y-4">
      {Object.entries(FILTER_CATEGORIES).map(([key, { label, options }]) => (
        <FilterCategory
          key={key}
          category={label}
          options={options}
          activeFilters={filters[key] || []}
          onToggle={(value) => toggleFilter(key, value)}
        />
      ))}

      {/* Clear all button */}
      {activeFilterCount > 0 && (
        <div className="pt-2 border-t border-gray-800">
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            Clear all filters ({activeFilterCount})
          </button>
        </div>
      )}
    </div>
  );

  if (!collapsible) {
    return <div className={className}>{content}</div>;
  }

  return (
    <div className={`bg-gray-900/50 rounded-lg border border-gray-800 ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-sm font-medium text-white">Advanced Filters</span>
          {activeFilterCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-cyan-900/50 text-cyan-300 rounded">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {isExpanded ? 'Click to collapse' : 'Click to expand'}
        </span>
      </button>

      {/* Content */}
      {isExpanded && <div className="p-4 pt-0 border-t border-gray-800">{content}</div>}
    </div>
  );
}

// Export constants and helpers
export { FILTER_CATEGORIES, FilterChip, FilterCategory };
