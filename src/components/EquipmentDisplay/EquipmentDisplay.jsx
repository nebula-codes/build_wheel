import { useState } from 'react';

/**
 * PoE-style equipment slot layout
 * Displays gear in a layout similar to the in-game character panel
 */

// Slot configuration with positions
const EQUIPMENT_SLOTS = {
  'Weapon 1': { row: 1, col: 0, rowSpan: 2, label: 'Weapon', icon: '⚔️' },
  'Weapon 1 Swap': { row: 3, col: 0, rowSpan: 2, label: 'Swap', icon: '🔄', secondary: true },
  'Weapon 2': { row: 1, col: 4, rowSpan: 2, label: 'Off-hand', icon: '🛡️' },
  'Weapon 2 Swap': { row: 3, col: 4, rowSpan: 2, label: 'Swap', icon: '🔄', secondary: true },
  'Helmet': { row: 0, col: 2, label: 'Helmet', icon: '🪖' },
  'Amulet': { row: 1, col: 3, label: 'Amulet', icon: '📿' },
  'Body Armour': { row: 1, col: 2, rowSpan: 2, label: 'Body', icon: '🦺' },
  'Ring 1': { row: 2, col: 1, label: 'Ring', icon: '💍' },
  'Ring 2': { row: 2, col: 3, label: 'Ring', icon: '💍' },
  'Gloves': { row: 3, col: 1, label: 'Gloves', icon: '🧤' },
  'Belt': { row: 3, col: 2, label: 'Belt', icon: '🎗️' },
  'Boots': { row: 3, col: 3, label: 'Boots', icon: '👢' },
};

const FLASK_SLOTS = ['Flask 1', 'Flask 2', 'Flask 3', 'Flask 4', 'Flask 5'];
const JEWEL_SLOTS = ['Jewel 1', 'Jewel 2', 'Jewel 3', 'Jewel 4', 'Jewel 5', 'Jewel 6'];

// Rarity colors
const RARITY_COLORS = {
  'Unique': 'border-amber-500 bg-amber-900/30',
  'Rare': 'border-yellow-500 bg-yellow-900/20',
  'Magic': 'border-blue-500 bg-blue-900/20',
  'Normal': 'border-gray-500 bg-gray-800/30',
};

const RARITY_TEXT_COLORS = {
  'Unique': 'text-amber-400',
  'Rare': 'text-yellow-400',
  'Magic': 'text-blue-400',
  'Normal': 'text-gray-400',
};

function EquipmentSlot({ item, slotConfig, slotName, onClick }) {
  const isEmpty = !item;
  const rarity = item?.rarity || 'Normal';
  const colorClass = RARITY_COLORS[rarity] || RARITY_COLORS['Normal'];
  const textColor = RARITY_TEXT_COLORS[rarity] || RARITY_TEXT_COLORS['Normal'];

  return (
    <div
      onClick={() => onClick?.(item, slotName)}
      className={`
        relative rounded-lg border-2 transition-all cursor-pointer
        ${isEmpty ? 'border-gray-700 bg-gray-800/20 border-dashed' : colorClass}
        ${slotConfig?.secondary ? 'opacity-60' : ''}
        hover:scale-105 hover:z-10
        ${slotConfig?.rowSpan === 2 ? 'row-span-2' : ''}
      `}
      style={{ minHeight: slotConfig?.rowSpan === 2 ? '100px' : '50px' }}
      title={item ? `${item.name}\n${rarity}` : `Empty ${slotConfig?.label || slotName}`}
    >
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-full p-2 text-gray-600">
          <span className="text-lg">{slotConfig?.icon || '❓'}</span>
          <span className="text-[10px] uppercase tracking-wider">{slotConfig?.label || slotName}</span>
        </div>
      ) : (
        <div className="flex flex-col h-full p-2">
          <div className="flex items-start gap-1">
            <span className="text-sm">{slotConfig?.icon || '📦'}</span>
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-medium truncate ${textColor}`}>
                {item.name}
              </div>
              {item.baseName && item.baseName !== item.name && (
                <div className="text-[10px] text-gray-500 truncate">
                  {item.baseName}
                </div>
              )}
            </div>
          </div>
          {item.sockets && (
            <div className="mt-auto flex gap-0.5">
              {item.sockets.split('').map((s, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    s === 'R' ? 'bg-red-500' :
                    s === 'G' ? 'bg-green-500' :
                    s === 'B' ? 'bg-blue-500' :
                    'bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {/* Rarity indicator */}
      {!isEmpty && (
        <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
          rarity === 'Unique' ? 'bg-amber-500' :
          rarity === 'Rare' ? 'bg-yellow-500' :
          rarity === 'Magic' ? 'bg-blue-500' :
          'bg-gray-500'
        }`} />
      )}
    </div>
  );
}

function FlaskSlot({ item, index, onClick }) {
  const isEmpty = !item;
  const isUnique = item?.rarity === 'Unique';

  return (
    <div
      onClick={() => onClick?.(item, `Flask ${index + 1}`)}
      className={`
        flex flex-col items-center justify-center rounded-lg border-2 p-1.5 transition-all cursor-pointer
        ${isEmpty ? 'border-gray-700 bg-gray-800/20 border-dashed' :
          isUnique ? 'border-amber-500 bg-amber-900/30' : 'border-gray-600 bg-gray-800/40'}
        hover:scale-105
      `}
      style={{ minHeight: '60px' }}
      title={item?.name || `Flask ${index + 1}`}
    >
      {isEmpty ? (
        <>
          <span className="text-lg text-gray-600">🧪</span>
          <span className="text-[9px] text-gray-600">{index + 1}</span>
        </>
      ) : (
        <>
          <span className="text-lg">🧪</span>
          <span className={`text-[10px] text-center truncate w-full ${isUnique ? 'text-amber-400' : 'text-gray-300'}`}>
            {item.name?.replace(' Flask', '').replace("Surgeon's ", '').substring(0, 12)}
          </span>
        </>
      )}
    </div>
  );
}

function JewelSlot({ item, index, onClick }) {
  const isEmpty = !item;
  const isUnique = item?.rarity === 'Unique';

  return (
    <div
      onClick={() => onClick?.(item, `Jewel ${index + 1}`)}
      className={`
        flex items-center justify-center rounded-full border-2 w-8 h-8 transition-all cursor-pointer
        ${isEmpty ? 'border-gray-700 bg-gray-800/20 border-dashed' :
          isUnique ? 'border-amber-500 bg-amber-900/30' : 'border-purple-600 bg-purple-900/30'}
        hover:scale-110
      `}
      title={item?.name || `Jewel Socket ${index + 1}`}
    >
      {isEmpty ? (
        <span className="text-xs text-gray-600">💎</span>
      ) : (
        <span className="text-xs">{isUnique ? '✨' : '💎'}</span>
      )}
    </div>
  );
}

export default function EquipmentDisplay({ equipment = [], onItemClick, className = '' }) {
  const [selectedItem, setSelectedItem] = useState(null);

  // Create a map of slot name to item
  const itemsBySlot = {};
  equipment.forEach(item => {
    if (item.slot) {
      itemsBySlot[item.slot] = item;
    }
  });

  // Also map numbered slots (e.g., "1" -> "Weapon 1")
  const slotMappings = {
    '1': 'Weapon 1',
    '2': 'Weapon 2',
    '3': 'Helmet',
    '4': 'Body Armour',
    '5': 'Gloves',
    '6': 'Boots',
    '7': 'Amulet',
    '8': 'Ring 1',
    '9': 'Ring 2',
    '10': 'Belt',
  };

  equipment.forEach(item => {
    if (item.slot && slotMappings[item.slot]) {
      itemsBySlot[slotMappings[item.slot]] = item;
    }
  });

  const handleItemClick = (item, slotName) => {
    setSelectedItem(item ? { ...item, slotName } : null);
    onItemClick?.(item, slotName);
  };

  // Group equipment by type
  const flasks = FLASK_SLOTS.map((slot, i) => itemsBySlot[slot] || itemsBySlot[`${11 + i}`]);
  const jewels = JEWEL_SLOTS.map((slot, i) => itemsBySlot[slot] || itemsBySlot[`Jewel ${i + 1}`]);

  // Count stats
  const uniqueCount = equipment.filter(e => e.rarity === 'Unique').length;
  const rareCount = equipment.filter(e => e.rarity === 'Rare').length;
  const totalCount = equipment.length;

  return (
    <div className={`bg-gray-900/50 rounded-lg border border-gray-800 ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span>🎒</span> Equipment
        </h3>
        <div className="flex items-center gap-3 text-xs">
          {uniqueCount > 0 && (
            <span className="text-amber-400">{uniqueCount} Unique</span>
          )}
          {rareCount > 0 && (
            <span className="text-yellow-400">{rareCount} Rare</span>
          )}
          <span className="text-gray-500">{totalCount} items</span>
        </div>
      </div>

      <div className="p-4">
        {/* Main Equipment Grid - PoE style layout */}
        <div className="grid grid-cols-5 gap-2 mb-4" style={{ gridTemplateRows: 'repeat(4, minmax(50px, auto))' }}>
          {/* Left weapons column */}
          <div className="row-span-2">
            <EquipmentSlot
              item={itemsBySlot['Weapon 1']}
              slotConfig={EQUIPMENT_SLOTS['Weapon 1']}
              slotName="Weapon 1"
              onClick={handleItemClick}
            />
          </div>

          {/* Empty cell for spacing */}
          <div className="row-span-2" />

          {/* Center top - Helmet */}
          <div>
            <EquipmentSlot
              item={itemsBySlot['Helmet']}
              slotConfig={EQUIPMENT_SLOTS['Helmet']}
              slotName="Helmet"
              onClick={handleItemClick}
            />
          </div>

          {/* Empty cell */}
          <div />

          {/* Right weapons column */}
          <div className="row-span-2">
            <EquipmentSlot
              item={itemsBySlot['Weapon 2']}
              slotConfig={EQUIPMENT_SLOTS['Weapon 2']}
              slotName="Weapon 2"
              onClick={handleItemClick}
            />
          </div>

          {/* Row 2: Ring1, Body (center), Amulet */}
          <div>
            <EquipmentSlot
              item={itemsBySlot['Ring 1']}
              slotConfig={EQUIPMENT_SLOTS['Ring 1']}
              slotName="Ring 1"
              onClick={handleItemClick}
            />
          </div>

          <div className="row-span-2">
            <EquipmentSlot
              item={itemsBySlot['Body Armour']}
              slotConfig={EQUIPMENT_SLOTS['Body Armour']}
              slotName="Body Armour"
              onClick={handleItemClick}
            />
          </div>

          <div>
            <EquipmentSlot
              item={itemsBySlot['Amulet']}
              slotConfig={EQUIPMENT_SLOTS['Amulet']}
              slotName="Amulet"
              onClick={handleItemClick}
            />
          </div>

          {/* Row 3: Swap weapon, Gloves, (body continues), Ring2, Swap offhand */}
          <div>
            <EquipmentSlot
              item={itemsBySlot['Weapon 1 Swap']}
              slotConfig={EQUIPMENT_SLOTS['Weapon 1 Swap']}
              slotName="Weapon 1 Swap"
              onClick={handleItemClick}
            />
          </div>

          <div>
            <EquipmentSlot
              item={itemsBySlot['Gloves']}
              slotConfig={EQUIPMENT_SLOTS['Gloves']}
              slotName="Gloves"
              onClick={handleItemClick}
            />
          </div>

          {/* Body continues */}

          <div>
            <EquipmentSlot
              item={itemsBySlot['Ring 2']}
              slotConfig={EQUIPMENT_SLOTS['Ring 2']}
              slotName="Ring 2"
              onClick={handleItemClick}
            />
          </div>

          <div>
            <EquipmentSlot
              item={itemsBySlot['Weapon 2 Swap']}
              slotConfig={EQUIPMENT_SLOTS['Weapon 2 Swap']}
              slotName="Weapon 2 Swap"
              onClick={handleItemClick}
            />
          </div>

          {/* Row 4: empty, Belt, Boots, empty */}
          <div />

          <div>
            <EquipmentSlot
              item={itemsBySlot['Belt']}
              slotConfig={EQUIPMENT_SLOTS['Belt']}
              slotName="Belt"
              onClick={handleItemClick}
            />
          </div>

          <div />

          <div>
            <EquipmentSlot
              item={itemsBySlot['Boots']}
              slotConfig={EQUIPMENT_SLOTS['Boots']}
              slotName="Boots"
              onClick={handleItemClick}
            />
          </div>

          <div />
        </div>

        {/* Flasks Row */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Flasks</div>
          <div className="grid grid-cols-5 gap-2">
            {flasks.map((flask, i) => (
              <FlaskSlot
                key={i}
                item={flask}
                index={i}
                onClick={handleItemClick}
              />
            ))}
          </div>
        </div>

        {/* Jewels Row */}
        {jewels.some(j => j) && (
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Jewels</div>
            <div className="flex gap-2 flex-wrap">
              {jewels.map((jewel, i) => jewel && (
                <JewelSlot
                  key={i}
                  item={jewel}
                  index={i}
                  onClick={handleItemClick}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Item Detail Panel */}
      {selectedItem && (
        <div className="p-4 border-t border-gray-800 bg-gray-800/30">
          <div className="flex items-start justify-between">
            <div>
              <div className={`font-medium ${RARITY_TEXT_COLORS[selectedItem.rarity] || 'text-gray-300'}`}>
                {selectedItem.name}
              </div>
              {selectedItem.baseName && (
                <div className="text-xs text-gray-500">{selectedItem.baseName}</div>
              )}
              <div className="text-xs text-gray-600 mt-1">
                {selectedItem.slotName} • {selectedItem.rarity || 'Normal'}
              </div>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-gray-500 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { EquipmentSlot, FlaskSlot, JewelSlot };
