import { useState, useMemo } from 'react';
import { decodeTreeUrl, decodePobCode, CLASS_NAMES, ASCENDANCY_NAMES, extractKeystones } from '../../utils/pobParser';
import { GemBadge, GemLinkGroup } from '../GemLinks/GemLinks';
import EquipmentDisplay from '../EquipmentDisplay';
import SkillTree from '../SkillTree/SkillTree';

/**
 * Enhanced PoB code/URL import component with full build visualization
 */
export default function PoBImport({ onImport, onViewTree, className = '' }) {
  const [input, setInput] = useState('');
  const [parsedBuild, setParsedBuild] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tree');
  const [showImportPanel, setShowImportPanel] = useState(true);

  const handleParse = async () => {
    if (!input.trim()) {
      setError('Please enter a PoB code or skill tree URL');
      return;
    }

    setLoading(true);
    setError(null);
    setParsedBuild(null);

    try {
      const trimmed = input.trim();

      // Check if it's a tree URL
      if (trimmed.includes('pathofexile.com') || trimmed.includes('poe-planner') || trimmed.includes('poeplanner')) {
        const treeData = decodeTreeUrl(trimmed);

        if (treeData.nodes.length === 0) {
          throw new Error('Could not parse any nodes from the URL');
        }

        setParsedBuild({
          type: 'tree',
          allocatedNodes: treeData.nodes,
          classId: treeData.classId,
          ascendancyId: treeData.ascendancyId,
          className: CLASS_NAMES[treeData.classId] || 'Unknown',
          ascendancyName: ASCENDANCY_NAMES[treeData.classId]?.[treeData.ascendancyId] || 'None',
          url: trimmed,
          gems: [],
          equipment: [],
        });
        setShowImportPanel(false);
      }
      // Check if it's a PoB code (base64-ish string)
      else if (trimmed.length > 50 && !trimmed.includes(' ')) {
        const pobData = decodePobCode(trimmed);

        if (!pobData) {
          throw new Error('Could not parse PoB code. Make sure you copied the full code.');
        }

        setParsedBuild({
          type: 'pob',
          ...pobData,
          allocatedNodes: pobData.allocatedNodes || [],
        });
        setShowImportPanel(false);
      }
      // Could be a pastebin URL
      else if (trimmed.includes('pastebin.com')) {
        throw new Error('Pastebin URLs are not directly supported. Please copy the raw PoB code from the pastebin page.');
      }
      else {
        throw new Error('Input not recognized. Please enter a valid skill tree URL or PoB code.');
      }
    } catch (err) {
      setError(err.message || 'Failed to parse input');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setParsedBuild(null);
    setInput('');
    setShowImportPanel(true);
    setActiveTab('tree');
  };

  const handleImport = () => {
    if (parsedBuild && onImport) {
      onImport(parsedBuild);
    }
  };

  // Categorize gems into skill groups
  const gemGroups = useMemo(() => {
    if (!parsedBuild?.gems) return { main: [], auras: [], utility: [], other: [] };

    const enabledGems = parsedBuild.gems.filter(g => g.enabled !== false);

    // Keywords for categorization
    const auraKeywords = ['Aura', 'Herald', 'Aspect', 'Purity', 'Determination', 'Grace', 'Discipline', 'Vitality', 'Clarity', 'Hatred', 'Wrath', 'Anger', 'Zealotry', 'Malevolence', 'Pride', 'Defiance Banner', 'War Banner', 'Dread Banner'];
    const movementKeywords = ['Dash', 'Leap Slam', 'Flame Dash', 'Shield Charge', 'Whirling Blades', 'Blink Arrow', 'Frostblink', 'Lightning Warp'];
    const supportKeywords = ['Support', 'Awakened'];

    const isSupport = (name) => supportKeywords.some(kw => name.includes(kw));
    const isAura = (name) => auraKeywords.some(kw => name.includes(kw));
    const isMovement = (name) => movementKeywords.some(kw => name.includes(kw));

    const activeGems = enabledGems.filter(g => !isSupport(g.name || ''));
    const supportGems = enabledGems.filter(g => isSupport(g.name || ''));

    // Find main skill (highest level non-aura, non-movement active)
    const mainSkills = activeGems.filter(g => !isAura(g.name) && !isMovement(g.name));
    const auras = activeGems.filter(g => isAura(g.name));
    const movement = activeGems.filter(g => isMovement(g.name));

    return {
      main: mainSkills,
      supports: supportGems,
      auras,
      movement,
      all: enabledGems,
    };
  }, [parsedBuild?.gems]);

  const tabs = [
    { id: 'tree', label: 'Skill Tree', icon: '🌳' },
    { id: 'gear', label: 'Equipment', icon: '🎒', count: parsedBuild?.equipment?.length },
    { id: 'gems', label: 'Gems', icon: '💎', count: parsedBuild?.gems?.filter(g => g.enabled !== false).length },
    { id: 'stats', label: 'Build Info', icon: '📊' },
  ];

  return (
    <div className={`bg-gray-900/50 rounded-lg border border-gray-800 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">PoB Import</h3>
            {parsedBuild && (
              <span className="text-xs px-2 py-0.5 bg-green-900/50 text-green-400 rounded">
                Build Loaded
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {parsedBuild && (
              <>
                <button
                  onClick={() => setShowImportPanel(!showImportPanel)}
                  className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                >
                  {showImportPanel ? 'Hide Import' : 'New Import'}
                </button>
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* Build Overview (when loaded) */}
        {parsedBuild && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚔️</span>
              <div>
                <div className="text-white font-semibold">
                  {parsedBuild.ascendClassName || parsedBuild.ascendancyName || parsedBuild.className || 'Unknown'} Build
                </div>
                <div className="text-xs text-gray-500">
                  {parsedBuild.className}
                  {parsedBuild.level && ` • Level ${parsedBuild.level}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <div className="text-cyan-400 font-semibold">{parsedBuild.allocatedNodes?.length || 0}</div>
                <div className="text-xs text-gray-500">Passives</div>
              </div>
              {parsedBuild.gems && (
                <div className="text-center">
                  <div className="text-purple-400 font-semibold">{parsedBuild.gems.filter(g => g.enabled !== false).length}</div>
                  <div className="text-xs text-gray-500">Gems</div>
                </div>
              )}
              {parsedBuild.equipment && (
                <div className="text-center">
                  <div className="text-amber-400 font-semibold">{parsedBuild.equipment.filter(e => e.rarity === 'Unique').length}</div>
                  <div className="text-xs text-gray-500">Uniques</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Import Input Panel */}
      {showImportPanel && (
        <div className="p-4 border-b border-gray-800 bg-gray-800/30">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                PoB Code or Tree URL
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your PoB code (from Path of Building export) or pathofexile.com/passive-skill-tree/... URL here"
                className="w-full h-24 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none resize-none font-mono"
              />
            </div>

            {/* Parse button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleParse}
                disabled={loading || !input.trim()}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Parsing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Parse Build
                  </>
                )}
              </button>
              <div className="text-xs text-gray-600">
                Supports: Official tree URLs, PoE Planner, Path of Building codes
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Build Content */}
      {parsedBuild && (
        <>
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-800">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gray-800 text-white border-b-2 border-cyan-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-700 rounded-full">{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {/* Skill Tree Tab */}
            {activeTab === 'tree' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    <span className="text-lg">🌳</span> Passive Skill Tree
                    <span className="text-xs text-gray-500">
                      ({parsedBuild.allocatedNodes?.length || 0} points)
                    </span>
                  </h4>
                  {parsedBuild.url && (
                    <a
                      href={parsedBuild.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      Open in Browser →
                    </a>
                  )}
                </div>

                {/* Embedded Skill Tree */}
                <div className="rounded-lg overflow-hidden border border-gray-700">
                  <SkillTree
                    allocatedNodes={parsedBuild.allocatedNodes || []}
                    ascendancyName={parsedBuild.ascendClassName || parsedBuild.ascendancyName}
                    className="w-full"
                  />
                </div>

                {/* Keystones Summary */}
                {parsedBuild.allocatedNodes?.length > 0 && (
                  <KeystonesSummary allocatedNodes={parsedBuild.allocatedNodes} />
                )}
              </div>
            )}

            {/* Equipment Tab */}
            {activeTab === 'gear' && (
              <div className="space-y-4">
                <EquipmentDisplay
                  equipment={parsedBuild.equipment || []}
                />
              </div>
            )}

            {/* Gems Tab */}
            {activeTab === 'gems' && (
              <div className="space-y-6">
                {/* Main Skills */}
                {gemGroups.main.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <span className="text-lg">⚔️</span> Active Skills ({gemGroups.main.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {gemGroups.main.map((gem, i) => (
                        <GemCard key={i} gem={gem} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Support Gems */}
                {gemGroups.supports.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <span className="text-lg">🔗</span> Support Gems ({gemGroups.supports.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {gemGroups.supports.map((gem, i) => (
                        <GemBadge key={i} name={gem.name} size="sm" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Auras */}
                {gemGroups.auras.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <span className="text-lg">✨</span> Auras & Heralds ({gemGroups.auras.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {gemGroups.auras.map((gem, i) => (
                        <GemBadge key={i} name={gem.name} size="sm" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Movement */}
                {gemGroups.movement.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <span className="text-lg">🏃</span> Movement ({gemGroups.movement.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {gemGroups.movement.map((gem, i) => (
                        <GemBadge key={i} name={gem.name} size="sm" />
                      ))}
                    </div>
                  </div>
                )}

                {/* No gems */}
                {gemGroups.all.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl mb-4 block">💎</span>
                    <p>No gem data available</p>
                    <p className="text-xs mt-1">Gem info is only available from full PoB codes</p>
                  </div>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                {/* Build Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="Class"
                    value={parsedBuild.className || 'Unknown'}
                    icon="👤"
                  />
                  <StatCard
                    label="Ascendancy"
                    value={parsedBuild.ascendClassName || parsedBuild.ascendancyName || 'None'}
                    icon="⭐"
                  />
                  <StatCard
                    label="Level"
                    value={parsedBuild.level || '-'}
                    icon="📈"
                  />
                  <StatCard
                    label="Passive Points"
                    value={parsedBuild.allocatedNodes?.length || 0}
                    icon="🌳"
                  />
                </div>

                {/* Equipment Summary */}
                {parsedBuild.equipment && parsedBuild.equipment.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">Equipment Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <StatCard
                        label="Unique Items"
                        value={parsedBuild.equipment.filter(e => e.rarity === 'Unique').length}
                        color="text-amber-400"
                      />
                      <StatCard
                        label="Rare Items"
                        value={parsedBuild.equipment.filter(e => e.rarity === 'Rare').length}
                        color="text-yellow-400"
                      />
                      <StatCard
                        label="Magic Items"
                        value={parsedBuild.equipment.filter(e => e.rarity === 'Magic').length}
                        color="text-blue-400"
                      />
                      <StatCard
                        label="Total Items"
                        value={parsedBuild.equipment.length}
                        color="text-gray-400"
                      />
                    </div>
                  </div>
                )}

                {/* Gem Summary */}
                {parsedBuild.gems && parsedBuild.gems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">Gem Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <StatCard
                        label="Active Skills"
                        value={gemGroups.main.length}
                        color="text-red-400"
                      />
                      <StatCard
                        label="Support Gems"
                        value={gemGroups.supports.length}
                        color="text-blue-400"
                      />
                      <StatCard
                        label="Auras"
                        value={gemGroups.auras.length}
                        color="text-green-400"
                      />
                      <StatCard
                        label="Total Gems"
                        value={gemGroups.all.length}
                        color="text-purple-400"
                      />
                    </div>
                  </div>
                )}

                {/* Tree Version Info */}
                {parsedBuild.treeSpec && (
                  <div className="text-xs text-gray-500 border-t border-gray-800 pt-4">
                    Tree Version: {parsedBuild.treeSpec}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-800">
                  {onImport && (
                    <button
                      onClick={handleImport}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                    >
                      Save to My Builds
                    </button>
                  )}
                  <button
                    onClick={() => setShowImportPanel(true)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Import Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {!parsedBuild && !showImportPanel && (
        <div className="p-8 text-center text-gray-500">
          <span className="text-4xl mb-4 block">📋</span>
          <p>No build loaded</p>
          <button
            onClick={() => setShowImportPanel(true)}
            className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
          >
            Import Build
          </button>
        </div>
      )}
    </div>
  );
}

// Helper Components
function GemCard({ gem }) {
  const getGemColor = (name) => {
    if (name?.includes('Vaal')) return 'border-red-500 bg-red-900/20';
    if (name?.includes('Awakened')) return 'border-purple-500 bg-purple-900/20';
    return 'border-gray-600 bg-gray-800/30';
  };

  return (
    <div className={`rounded-lg border p-3 ${getGemColor(gem.name)}`}>
      <div className="flex items-center justify-between">
        <span className="text-white font-medium text-sm">{gem.name}</span>
        <div className="flex items-center gap-2 text-xs">
          {gem.level && gem.level !== 20 && (
            <span className="text-gray-400">Lvl {gem.level}</span>
          )}
          {gem.quality > 0 && (
            <span className="text-blue-400">{gem.quality}%</span>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = 'text-white' }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
      {icon && <span className="text-lg mb-1 block">{icon}</span>}
      <div className={`font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function KeystonesSummary({ allocatedNodes }) {
  // This would need tree data to properly identify keystones
  // For now, show a placeholder
  return (
    <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
      <div className="text-xs text-yellow-400 font-medium mb-1">Keystones</div>
      <div className="text-xs text-gray-400">
        Keystone detection requires loading tree data. View the tree above to see allocated keystones highlighted.
      </div>
    </div>
  );
}
