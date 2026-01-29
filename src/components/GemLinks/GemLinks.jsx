import { useState } from 'react';
import { getGemIconUrl, getGemSocketColor, getGemType } from '../../utils/poeImages';

// Socket color to CSS class mapping
const socketColors = {
  red: 'bg-red-600 border-red-400',
  green: 'bg-emerald-600 border-emerald-400',
  blue: 'bg-blue-600 border-blue-400',
  white: 'bg-gray-100 border-gray-300',
};

const socketGlowColors = {
  red: 'shadow-red-500/50',
  green: 'shadow-emerald-500/50',
  blue: 'shadow-blue-500/50',
  white: 'shadow-gray-300/50',
};

/**
 * Single gem socket with icon
 */
function GemSocket({ gem, size = 'md', showLabel = true }) {
  const [imgError, setImgError] = useState(false);
  const color = getGemSocketColor(gem.name);
  const iconUrl = getGemIconUrl(gem.name);
  const gemType = getGemType(gem.name);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const isSupport = gemType === 'support';

  return (
    <div className="flex flex-col items-center gap-1 group">
      <div
        className={`
          ${sizeClasses[size]} rounded-full border-2 ${socketColors[color]}
          flex items-center justify-center overflow-hidden
          shadow-md ${socketGlowColors[color]}
          transition-transform hover:scale-110 hover:shadow-lg
          ${isSupport ? 'opacity-90' : ''}
        `}
        title={gem.name}
      >
        {iconUrl && !imgError ? (
          <img
            src={iconUrl}
            alt={gem.name}
            className="w-full h-full object-contain p-0.5"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-xs font-bold text-white/80">
            {gem.name.charAt(0)}
          </span>
        )}
      </div>
      {showLabel && (
        <span className={`
          text-[10px] text-center max-w-[60px] leading-tight
          ${isSupport ? 'text-gray-500' : 'text-gray-300'}
          group-hover:text-white transition-colors
        `}>
          {gem.name.replace(' Support', '').slice(0, 20)}
        </span>
      )}
    </div>
  );
}

/**
 * A linked group of gems (like a 6-link)
 */
function GemLinkGroup({ gems, label, isMainSkill = false }) {
  if (!gems || gems.length === 0) return null;

  return (
    <div className={`
      rounded-lg p-3
      ${isMainSkill ? 'bg-gradient-to-br from-amber-900/30 to-orange-900/20 border border-amber-700/50' : 'bg-[#1a1a2e]/50 border border-gray-800'}
    `}>
      {label && (
        <div className={`text-xs font-semibold mb-2 ${isMainSkill ? 'text-amber-400' : 'text-gray-400'}`}>
          {label}
          {isMainSkill && <span className="ml-2 text-[10px] text-amber-500/70">MAIN SKILL</span>}
        </div>
      )}
      <div className="flex items-center gap-1 flex-wrap">
        {gems.map((gem, idx) => (
          <div key={idx} className="flex items-center">
            <GemSocket gem={typeof gem === 'string' ? { name: gem } : gem} size="md" />
            {idx < gems.length - 1 && (
              <div className="w-2 h-0.5 bg-gray-600 mx-0.5" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full gem setup display for a build
 */
export default function GemLinks({ gemSetup, className = '' }) {
  if (!gemSetup) return null;

  const { mainSkill, supports, auras, curses, movement, utility } = gemSetup;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main 6-link */}
      {mainSkill && (
        <GemLinkGroup
          gems={[mainSkill, ...(supports || [])].slice(0, 6)}
          label="6-Link Setup"
          isMainSkill={true}
        />
      )}

      {/* Auras */}
      {auras && auras.length > 0 && (
        <GemLinkGroup
          gems={auras}
          label="Auras & Heralds"
        />
      )}

      {/* Curses */}
      {curses && curses.length > 0 && (
        <GemLinkGroup
          gems={curses}
          label="Curses & Marks"
        />
      )}

      {/* Movement */}
      {movement && movement.length > 0 && (
        <GemLinkGroup
          gems={movement}
          label="Movement"
        />
      )}

      {/* Utility */}
      {utility && utility.length > 0 && (
        <GemLinkGroup
          gems={utility}
          label="Utility"
        />
      )}
    </div>
  );
}

/**
 * Compact gem list for build cards
 */
export function GemListCompact({ skills, maxShow = 6 }) {
  if (!skills || skills.length === 0) return null;

  const [expanded, setExpanded] = useState(false);
  const displaySkills = expanded ? skills : skills.slice(0, maxShow);
  const hasMore = skills.length > maxShow;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {displaySkills.map((skill, idx) => (
          <GemBadge key={idx} name={skill} />
        ))}
        {hasMore && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1"
          >
            +{skills.length - maxShow} more
          </button>
        )}
      </div>
      {expanded && hasMore && (
        <button
          onClick={() => setExpanded(false)}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          Show less
        </button>
      )}
    </div>
  );
}

/**
 * Small gem badge with icon
 */
export function GemBadge({ name, size = 'sm' }) {
  const [imgError, setImgError] = useState(false);
  const color = getGemSocketColor(name);
  const iconUrl = getGemIconUrl(name);
  const gemType = getGemType(name);

  const colorClasses = {
    red: 'bg-red-900/40 border-red-700/50 text-red-300',
    green: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-300',
    blue: 'bg-blue-900/40 border-blue-700/50 text-blue-300',
    white: 'bg-gray-700/40 border-gray-600/50 text-gray-300',
  };

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <div className={`
      inline-flex items-center gap-1.5 rounded border
      ${colorClasses[color]} ${sizeClasses[size]}
      ${gemType === 'support' ? 'opacity-80' : ''}
    `}>
      {iconUrl && !imgError ? (
        <img
          src={iconUrl}
          alt=""
          className="w-4 h-4 object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className={`w-3 h-3 rounded-full ${socketColors[color]}`} />
      )}
      <span className="truncate max-w-[120px]">
        {name.replace(' Support', '')}
      </span>
    </div>
  );
}

// Named exports
export { GemSocket, GemLinkGroup };
