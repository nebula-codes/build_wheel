import { useState, useMemo } from 'react';
import { decodeTreeUrl, decodePobCode, CLASS_NAMES, ASCENDANCY_NAMES } from '../../utils/pobParser';
import { GemBadge } from '../GemLinks/GemLinks';
import EquipmentDisplay from '../EquipmentDisplay';
import SkillTree from '../SkillTree/SkillTree';

/**
 * Enhanced PoB code/URL import component with full build visualization
 * Supports multiple specs/progression stages
 */
export default function PoBImport({ onImport, className = '' }) {
  const [input, setInput] = useState('');
  const [parsedBuild, setParsedBuild] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tree');
  const [showImportPanel, setShowImportPanel] = useState(true);
  const [selectedSpecIndex, setSelectedSpecIndex] = useState(0);
  const [selectedSkillSetIndex, setSelectedSkillSetIndex] = useState(0);

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
          specs: [{
            index: 0,
            title: 'Imported Tree',
            nodes: treeData.nodes,
            nodeCount: treeData.nodes.length,
          }],
          activeSpec: 0,
          allocatedNodes: treeData.nodes,
          classId: treeData.classId,
          ascendancyId: treeData.ascendancyId,
          className: CLASS_NAMES[treeData.classId] || 'Unknown',
          ascendancyName: ASCENDANCY_NAMES[treeData.classId]?.[treeData.ascendancyId] || 'None',
          url: trimmed,
          skillGroups: [],
          gems: [],
          equipment: [],
          itemSets: [],
        });
        setShowImportPanel(false);
        setSelectedSpecIndex(0);
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
        });
        setShowImportPanel(false);
        setSelectedSpecIndex(pobData.activeSpec || 0);
        // Find active skill set
        const activeSet = pobData.skillGroups?.findIndex(s => s.isActive);
        setSelectedSkillSetIndex(activeSet >= 0 ? activeSet : 0);
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
    setSelectedSpecIndex(0);
    setSelectedSkillSetIndex(0);
  };

  const handleImport = () => {
    if (parsedBuild && onImport) {
      onImport(parsedBuild);
    }
  };

  // Get current spec data
  const currentSpec = useMemo(() => {
    if (!parsedBuild?.specs?.length) return null;
    return parsedBuild.specs[selectedSpecIndex] || parsedBuild.specs[0];
  }, [parsedBuild, selectedSpecIndex]);

  // Get current skill set
  const currentSkillSet = useMemo(() => {
    if (!parsedBuild?.skillGroups?.length) return null;
    return parsedBuild.skillGroups[selectedSkillSetIndex] || parsedBuild.skillGroups[0];
  }, [parsedBuild, selectedSkillSetIndex]);

  // Get allocated nodes for current spec
  const currentNodes = useMemo(() => {
    return currentSpec?.nodes || parsedBuild?.allocatedNodes || [];
  }, [currentSpec, parsedBuild]);

  // SVG icons for cross-platform compatibility (emojis render as squares on Linux)
  const tabIcons = {
    tree: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L8 8h8L12 2z" />
        <path d="M12 8L6 16h12L12 8z" />
        <path d="M12 16L4 24h16L12 16z" />
        <path d="M12 8v16" />
      </svg>
    ),
    skills: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ),
    gear: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h5v6H4zM15 4h5v6h-5zM4 14h5v6H4zM15 14h5v6h-5z" />
        <path d="M9 7h6M9 17h6" />
      </svg>
    ),
    stats: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  };

  const tabs = [
    { id: 'tree', label: 'Skill Tree', icon: tabIcons.tree },
    { id: 'skills', label: 'Skills', icon: tabIcons.skills, count: currentSkillSet?.groups?.length },
    { id: 'gear', label: 'Equipment', icon: tabIcons.gear, count: parsedBuild?.equipment?.length },
    { id: 'stats', label: 'Build Info', icon: tabIcons.stats },
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
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-7 h-7 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                  <path d="M13 19l6-6" />
                  <path d="M16 16l4 4" />
                  <path d="M19 21l2-2" />
                </svg>
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
                  <div className="text-cyan-400 font-semibold">{currentNodes.length}</div>
                  <div className="text-xs text-gray-500">Passives</div>
                </div>
                {currentSkillSet && (
                  <div className="text-center">
                    <div className="text-purple-400 font-semibold">{currentSkillSet.groups?.length || 0}</div>
                    <div className="text-xs text-gray-500">Skill Groups</div>
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

            {/* Spec/Progression Selector */}
            {parsedBuild.specs?.length > 1 && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500">Progression:</span>
                <select
                  value={selectedSpecIndex}
                  onChange={(e) => setSelectedSpecIndex(parseInt(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  {parsedBuild.specs.map((spec, idx) => (
                    <option key={idx} value={idx}>
                      {spec.title} ({spec.nodeCount} points)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Skill Set Selector */}
            {parsedBuild.skillGroups?.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Skill Set:</span>
                <select
                  value={selectedSkillSetIndex}
                  onChange={(e) => setSelectedSkillSetIndex(parseInt(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  {parsedBuild.skillGroups.map((set, idx) => (
                    <option key={idx} value={idx}>
                      {set.title} {set.isActive && '(Active)'}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
                    <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L8 8h8L12 2z" />
                      <path d="M12 8L6 16h12L12 8z" />
                      <path d="M12 16L4 24h16L12 16z" />
                      <path d="M12 8v16" />
                    </svg>
                    {currentSpec?.title || 'Passive Skill Tree'}
                    <span className="text-xs text-gray-500">
                      ({currentNodes.length} points)
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

                <div className="rounded-lg overflow-hidden border border-gray-700">
                  <SkillTree
                    allocatedNodes={currentNodes}
                    ascendancyName={parsedBuild.ascendClassName || parsedBuild.ascendancyName}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Skills Tab - Show Gem Link Groups */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                {currentSkillSet?.groups?.length > 0 ? (
                  currentSkillSet.groups.map((group, idx) => (
                    <GemLinkGroupDisplay key={idx} group={group} />
                  ))
                ) : parsedBuild.gems?.length > 0 ? (
                  // Fallback to flat gem list
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">All Gems</h4>
                    <div className="flex flex-wrap gap-2">
                      {parsedBuild.gems.filter(g => g.enabled !== false).map((gem, i) => (
                        <GemBadge key={i} name={gem.name} size="sm" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                    <p>No skill data available</p>
                    <p className="text-xs mt-1">Skill info is only available from full PoB codes</p>
                  </div>
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

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                {/* Build Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="Class"
                    value={parsedBuild.className || 'Unknown'}
                    icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                  />
                  <StatCard
                    label="Ascendancy"
                    value={parsedBuild.ascendClassName || parsedBuild.ascendancyName || 'None'}
                    icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>}
                  />
                  <StatCard
                    label="Level"
                    value={parsedBuild.level || '-'}
                    icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>}
                  />
                  <StatCard
                    label="Passive Points"
                    value={currentNodes.length}
                    icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L8 8h8L12 2z"/><path d="M12 8L6 16h12L12 8z"/><path d="M12 16L4 24h16L12 16z"/><path d="M12 8v16"/></svg>}
                  />
                </div>

                {/* Specs Summary */}
                {parsedBuild.specs?.length > 1 && (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">Progression Stages ({parsedBuild.specs.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {parsedBuild.specs.map((spec, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedSpecIndex(idx);
                            setActiveTab('tree');
                          }}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            idx === selectedSpecIndex
                              ? 'border-cyan-500 bg-cyan-900/20'
                              : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                          }`}
                        >
                          <div className="text-sm text-white font-medium">{spec.title}</div>
                          <div className="text-xs text-gray-500">{spec.nodeCount} points</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skill Sets Summary */}
                {parsedBuild.skillGroups?.length > 1 && (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">Skill Sets ({parsedBuild.skillGroups.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {parsedBuild.skillGroups.map((set, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedSkillSetIndex(idx);
                            setActiveTab('skills');
                          }}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            idx === selectedSkillSetIndex
                              ? 'border-purple-500 bg-purple-900/20'
                              : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                          }`}
                        >
                          <div className="text-sm text-white font-medium">{set.title}</div>
                          <div className="text-xs text-gray-500">{set.groups?.length || 0} skill groups</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
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

// Gem Link Group Display Component
function GemLinkGroupDisplay({ group }) {
  const activeGems = group.gems.filter(g => !g.isSupport);
  const supportGems = group.gems.filter(g => g.isSupport);
  const mainSkill = group.gems.find(g => g.isMainSkill);

  // Determine link color based on slot
  const getLinkColor = () => {
    if (group.slot?.includes('Weapon')) return 'border-red-700';
    if (group.slot?.includes('Body')) return 'border-cyan-700';
    if (group.slot?.includes('Helmet')) return 'border-purple-700';
    if (group.slot?.includes('Gloves')) return 'border-green-700';
    if (group.slot?.includes('Boots')) return 'border-amber-700';
    return 'border-gray-700';
  };

  if (!group.gems || group.gems.length === 0) return null;

  return (
    <div className={`rounded-lg border-2 ${getLinkColor()} bg-gray-800/30 overflow-hidden`}>
      {/* Header */}
      <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">
            {group.label || mainSkill?.name || `${group.linkCount}-Link`}
          </span>
          <span className="text-xs px-1.5 py-0.5 bg-gray-700 rounded text-gray-400">
            {group.linkCount}L
          </span>
        </div>
        {group.slot && (
          <span className="text-xs text-gray-500">{group.slot}</span>
        )}
      </div>

      {/* Gems */}
      <div className="p-4">
        {/* Main/Active Skills */}
        {activeGems.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Active Skills</div>
            <div className="flex flex-wrap gap-2">
              {activeGems.map((gem, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                    gem.isMainSkill
                      ? 'bg-amber-900/40 border border-amber-600'
                      : 'bg-gray-700/50'
                  }`}
                >
                  <GemSocket color={getGemSocketColor(gem.name)} size="sm" />
                  <span className={`text-sm ${gem.isMainSkill ? 'text-amber-300 font-medium' : 'text-white'}`}>
                    {gem.name}
                  </span>
                  {gem.level !== 20 && (
                    <span className="text-xs text-gray-400">Lv{gem.level}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Support Gems */}
        {supportGems.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
              Supports ({supportGems.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {supportGems.map((gem, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-700/30 text-xs"
                >
                  <GemSocket color={getGemSocketColor(gem.name)} size="xs" />
                  <span className="text-gray-300">{gem.name.replace(' Support', '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Small gem socket indicator
function GemSocket({ color, size = 'sm' }) {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  const colorClasses = {
    R: 'bg-red-500',
    G: 'bg-green-500',
    B: 'bg-blue-500',
    W: 'bg-gray-300',
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color] || colorClasses.W} rounded-full`} />
  );
}

// Get gem socket color based on name
function getGemSocketColor(name) {
  if (!name) return 'W';

  const lowerName = name.toLowerCase();

  // Strength (Red)
  if (['strike', 'slam', 'melee', 'fortify', 'determination', 'vitality', 'anger', 'pride', 'blood', 'life', 'physical'].some(k => lowerName.includes(k))) {
    return 'R';
  }
  // Dexterity (Green)
  if (['arrow', 'shot', 'evasion', 'grace', 'haste', 'projectile', 'trap', 'mine', 'poison', 'bleed', 'frenzy'].some(k => lowerName.includes(k))) {
    return 'G';
  }
  // Intelligence (Blue)
  if (['spell', 'curse', 'aura', 'discipline', 'clarity', 'wrath', 'zealotry', 'energy', 'mana', 'cold', 'lightning', 'fire'].some(k => lowerName.includes(k))) {
    return 'B';
  }

  return 'W';
}

function StatCard({ label, value, icon, color = 'text-white' }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
      {icon && <span className="text-lg mb-1 flex justify-center text-gray-400">{icon}</span>}
      <div className={`font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
