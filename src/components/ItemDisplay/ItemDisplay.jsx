import { useState } from 'react';
import { getUniqueIconUrl, getFlaskIconUrl, POE_CDN } from '../../utils/poeImages';

/**
 * Display a unique item with icon and tooltip
 */
export function UniqueItem({ name, baseType, links, className = '' }) {
  const [imgError, setImgError] = useState(false);
  const iconUrl = getUniqueIconUrl(name);

  return (
    <div className={`
      flex items-center gap-2 px-2 py-1.5 rounded
      bg-gradient-to-r from-amber-900/30 to-transparent
      border border-amber-700/40
      hover:border-amber-600/60 transition-colors
      group cursor-default
      ${className}
    `}>
      {/* Icon */}
      <div className="w-8 h-8 flex-shrink-0 bg-black/40 rounded border border-amber-800/50 overflow-hidden">
        {iconUrl && !imgError ? (
          <img
            src={iconUrl}
            alt={name}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-amber-600 text-xs">
            ?
          </div>
        )}
      </div>

      {/* Name and info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-amber-300 font-medium truncate group-hover:text-amber-200">
          {name}
        </div>
        {baseType && (
          <div className="text-[10px] text-gray-500 truncate">{baseType}</div>
        )}
      </div>

      {/* Links badge */}
      {links && links >= 5 && (
        <div className="text-[10px] px-1.5 py-0.5 bg-amber-800/50 rounded text-amber-300">
          {links}L
        </div>
      )}
    </div>
  );
}

/**
 * Display a flask with icon
 */
export function FlaskItem({ name, enchant, suffix, prefix, isUnique = false, className = '' }) {
  const [imgError, setImgError] = useState(false);
  const iconUrl = getFlaskIconUrl(name);

  const borderColor = isUnique ? 'border-amber-700/50' : 'border-gray-700/50';
  const bgColor = isUnique ? 'from-amber-900/20' : 'from-blue-900/20';
  const textColor = isUnique ? 'text-amber-300' : 'text-blue-300';

  return (
    <div className={`
      flex flex-col items-center p-2 rounded-lg
      bg-gradient-to-b ${bgColor} to-transparent
      border ${borderColor}
      hover:border-opacity-80 transition-colors
      group
      ${className}
    `}>
      {/* Flask icon */}
      <div className="w-10 h-14 flex items-center justify-center bg-black/30 rounded mb-1">
        {iconUrl && !imgError ? (
          <img
            src={iconUrl}
            alt={name}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`text-2xl ${textColor}`}>
            ⚗
          </div>
        )}
      </div>

      {/* Flask name */}
      <div className={`text-[10px] text-center ${textColor} font-medium`}>
        {name.replace(' Flask', '')}
      </div>

      {/* Modifiers */}
      {(enchant || suffix || prefix) && (
        <div className="mt-1 space-y-0.5 text-center">
          {enchant && (
            <div className="text-[9px] text-cyan-400 truncate max-w-[80px]">
              {enchant}
            </div>
          )}
          {prefix && (
            <div className="text-[9px] text-blue-400 truncate max-w-[80px]">
              {prefix}
            </div>
          )}
          {suffix && (
            <div className="text-[9px] text-blue-400 truncate max-w-[80px]">
              {suffix}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Flask setup display (5 flasks)
 */
export function FlaskSetup({ flasks, className = '' }) {
  if (!flasks || flasks.length === 0) return null;

  return (
    <div className={`${className}`}>
      <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Flask Setup</h4>
      <div className="flex gap-1 justify-center">
        {flasks.slice(0, 5).map((flask, idx) => (
          <FlaskItem
            key={idx}
            name={flask.name}
            enchant={flask.enchant}
            prefix={flask.prefix}
            suffix={flask.suffix}
            isUnique={flask.isUnique}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Compact item list for build cards
 */
export function ItemList({ items, title = 'Key Items', maxShow = 5, className = '' }) {
  const [expanded, setExpanded] = useState(false);

  if (!items || items.length === 0) return null;

  const displayItems = expanded ? items : items.slice(0, maxShow);
  const hasMore = items.length > maxShow;

  return (
    <div className={className}>
      <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">{title}</h4>
      <div className="space-y-1">
        {displayItems.map((item, idx) => (
          <UniqueItem
            key={idx}
            name={typeof item === 'string' ? item : item.name}
            baseType={typeof item === 'object' ? item.baseType : null}
            links={typeof item === 'object' ? item.links : null}
          />
        ))}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-500 hover:text-gray-300 mt-1"
          >
            {expanded ? 'Show less' : `+${items.length - maxShow} more items`}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Jewel display
 */
export function JewelItem({ name, type = 'unique', mods = [], className = '' }) {
  const isUnique = type === 'unique';
  const isCluster = name?.toLowerCase().includes('cluster') || type === 'cluster';

  const bgColor = isUnique ? 'from-amber-900/30' : isCluster ? 'from-purple-900/30' : 'from-blue-900/30';
  const borderColor = isUnique ? 'border-amber-700/50' : isCluster ? 'border-purple-700/50' : 'border-blue-700/50';
  const textColor = isUnique ? 'text-amber-300' : isCluster ? 'text-purple-300' : 'text-blue-300';

  // Get jewel icon from CDN
  const getJewelIcon = () => {
    if (name === 'Watcher\'s Eye') return `${POE_CDN}/Art/2DItems/Jewels/WatchersEye.png`;
    if (name === 'Thread of Hope') return `${POE_CDN}/Art/2DItems/Jewels/ThreadOfHope.png`;
    if (name === 'Forbidden Flame') return `${POE_CDN}/Art/2DItems/Jewels/ForbiddenFlame.png`;
    if (name === 'Forbidden Flesh') return `${POE_CDN}/Art/2DItems/Jewels/ForbiddenFlesh.png`;
    if (name === 'Voices') return `${POE_CDN}/Art/2DItems/Jewels/Voices.png`;
    if (name === 'Unnatural Instinct') return `${POE_CDN}/Art/2DItems/Jewels/UnnaturalInstinct.png`;
    if (name === 'Melding of the Flesh') return `${POE_CDN}/Art/2DItems/Jewels/MeldingOfTheFlesh.png`;
    if (isCluster) return `${POE_CDN}/Art/2DItems/Jewels/JewelPassiveTreeExpansionLarge.png`;
    return null;
  };

  const [imgError, setImgError] = useState(false);
  const iconUrl = getJewelIcon();

  return (
    <div className={`
      flex items-start gap-2 p-2 rounded-lg
      bg-gradient-to-r ${bgColor} to-transparent
      border ${borderColor}
      ${className}
    `}>
      {/* Jewel icon */}
      <div className="w-8 h-8 flex-shrink-0 bg-black/30 rounded overflow-hidden">
        {iconUrl && !imgError ? (
          <img
            src={iconUrl}
            alt={name}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${textColor} text-lg`}>
            ◇
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${textColor}`}>{name}</div>
        {mods && mods.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {mods.slice(0, 3).map((mod, idx) => (
              <li key={idx} className="text-[10px] text-gray-400 leading-tight">
                • {mod}
              </li>
            ))}
            {mods.length > 3 && (
              <li className="text-[10px] text-gray-600">+{mods.length - 3} more</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Jewel setup display
 */
export function JewelSetup({ jewels, className = '' }) {
  if (!jewels || jewels.length === 0) return null;

  return (
    <div className={className}>
      <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Key Jewels</h4>
      <div className="space-y-2">
        {jewels.map((jewel, idx) => (
          <JewelItem
            key={idx}
            name={typeof jewel === 'string' ? jewel : jewel.name}
            type={typeof jewel === 'object' ? jewel.type : 'unique'}
            mods={typeof jewel === 'object' ? jewel.mods : []}
          />
        ))}
      </div>
    </div>
  );
}

// Default export as a combined module
export default {
  UniqueItem,
  FlaskItem,
  FlaskSetup,
  ItemList,
  JewelItem,
  JewelSetup,
};
