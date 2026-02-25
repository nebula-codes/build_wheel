import React, { useState, useMemo } from 'react';
import { getUniversalTierColor, getUniversalDifficultyColor } from '../../data/games';
import BuildCard from './BuildCard';
import BuildFilters from './BuildFilters';
import BuildComparison from '../BuildComparison/BuildComparison';
import PoBImport from '../PoBImport/PoBImport';
import { BuildAdvisor } from '../BuildAdvisor';
import { applyFilters } from '../AdvancedFilters/AdvancedFilters';

export default function BuildBrowser({ game, onViewSkillTree }) {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBuild, setExpandedBuild] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advisorBuild, setAdvisorBuild] = useState(null);

  const openAdvisor = (build) => {
    setAdvisorBuild(build);
    setActiveTab('advisor');
  };

  const allBuilds = useMemo(() => {
    const builds = [];
    game.classes.forEach(cls => {
      cls.skills.forEach(skill => {
        builds.push({
          ...skill,
          classId: cls.id,
          className: cls.name,
          classColor: cls.color,
          baseClass: cls.baseClass,
        });
      });
    });
    return builds;
  }, [game]);

  const sources = useMemo(() => {
    const sourceSet = new Set(allBuilds.map(b => b.source).filter(Boolean));
    return Array.from(sourceSet);
  }, [allBuilds]);

  const offMetaBuilds = useMemo(() => {
    return allBuilds.filter(b => b.source === 'poe.ninja');
  }, [allBuilds]);

  const hasOffMetaBuilds = offMetaBuilds.length > 0;

  const filteredBuilds = useMemo(() => {
    let builds = allBuilds.filter(build => {
      if (activeTab === 'all' && build.source === 'poe.ninja') return false;
      if (selectedClass !== 'all' && build.classId !== selectedClass) return false;
      if (selectedTier !== 'all' && build.tier !== selectedTier) return false;
      if (selectedSource !== 'all' && build.source !== selectedSource) return false;
      if (searchQuery && !build.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
    if (Object.keys(advancedFilters).some(k => advancedFilters[k]?.length > 0)) {
      builds = applyFilters(builds, advancedFilters);
    }
    return builds;
  }, [allBuilds, selectedClass, selectedTier, selectedSource, searchQuery, activeTab, advancedFilters]);

  const filteredOffMetaBuilds = useMemo(() => {
    let builds = offMetaBuilds.filter(build => {
      if (selectedClass !== 'all' && build.classId !== selectedClass) return false;
      if (searchQuery && !build.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    builds.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      aVal = aVal || 0;
      bVal = bVal || 0;
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return builds;
  }, [offMetaBuilds, selectedClass, searchQuery, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const tiers = ['S', 'A', 'B', 'C'];

  const buildsByTier = useMemo(() => {
    const grouped = { S: [], A: [], B: [], C: [], other: [] };
    filteredBuilds.forEach(build => {
      if (build.tier && grouped[build.tier]) {
        grouped[build.tier].push(build);
      } else {
        grouped.other.push(build);
      }
    });
    return grouped;
  }, [filteredBuilds]);

  const filteredCount = activeTab === 'all' ? filteredBuilds.length : activeTab === 'offmeta' ? filteredOffMetaBuilds.length : allBuilds.length;

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      {hasOffMetaBuilds && (
        <div className="flex gap-1 mb-4 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'all' ? 'text-diablo-orange border-b-2 border-diablo-orange' : 'text-gray-400 hover:text-white'
            }`}
          >
            Meta Builds
          </button>
          <button
            onClick={() => setActiveTab('offmeta')}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'offmeta' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Off-Meta</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">poe.ninja</span>
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'compare' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Compare</span>
          </button>
          {game.id === 'poe1' && (
            <>
              <button
                disabled
                className="px-4 py-2 text-sm font-medium flex items-center gap-2 text-gray-600 cursor-not-allowed opacity-50"
                title="Coming soon - poe.ninja integration temporarily disabled"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Live Stats</span>
                <span className="text-[10px] px-1 py-0.5 bg-gray-700 rounded">Soon</span>
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'import' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Import PoB</span>
              </button>
              <button
                onClick={() => setActiveTab('advisor')}
                className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'advisor' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>AI Advisor</span>
                {advisorBuild && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
              </button>
            </>
          )}
        </div>
      )}

      {/* Filters */}
      <BuildFilters
        game={game}
        activeTab={activeTab}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        selectedTier={selectedTier}
        setSelectedTier={setSelectedTier}
        selectedSource={selectedSource}
        setSelectedSource={setSelectedSource}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sources={sources}
        filteredCount={filteredCount}
        advancedFilters={advancedFilters}
        setAdvancedFilters={setAdvancedFilters}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
      />

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Meta Builds Tab */}
        {activeTab === 'all' && (
          <div className="space-y-6">
            {tiers.map(tier => {
              const builds = buildsByTier[tier];
              if (builds.length === 0) return null;
              return (
                <div key={tier}>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: getUniversalTierColor(tier, game.id) }}
                    >
                      {tier}
                    </span>
                    <span className="text-sm text-gray-400">{tier}-Tier Builds</span>
                    <span className="text-xs text-gray-600">({builds.length})</span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                    {builds.map(build => (
                      <BuildCard
                        key={build.id}
                        build={build}
                        gameId={game.id}
                        isExpanded={expandedBuild === build.id}
                        onToggle={() => setExpandedBuild(expandedBuild === build.id ? null : build.id)}
                        onViewSkillTree={onViewSkillTree}
                        onAskAI={openAdvisor}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {buildsByTier.other.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-gray-400">Other Builds</span>
                  <span className="text-xs text-gray-600">({buildsByTier.other.length})</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                  {buildsByTier.other.map(build => (
                    <BuildCard
                      key={build.id}
                      build={build}
                      gameId={game.id}
                      isExpanded={expandedBuild === build.id}
                      onToggle={() => setExpandedBuild(expandedBuild === build.id ? null : build.id)}
                      onViewSkillTree={onViewSkillTree}
                      onAskAI={openAdvisor}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredBuilds.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No builds found matching your filters
              </div>
            )}
          </div>
        )}

        {/* Off-Meta Builds Tab */}
        {activeTab === 'offmeta' && (
          <div className="bg-[#1a1a24] border border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-[#0f0f17]">
                    {[
                      { key: 'name', label: 'Build', align: 'left' },
                      { key: 'className', label: 'Class', align: 'left' },
                      { key: 'difficulty', label: 'Difficulty', align: 'center' },
                    ].map(col => (
                      <th
                        key={col.key}
                        className={`text-${col.align} px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors`}
                        onClick={() => handleSort(col.key)}
                      >
                        <span className={`flex items-center ${col.align === 'center' ? 'justify-center' : ''} gap-1`}>
                          {col.label}
                          {sortConfig.key === col.key && (
                            <span>{sortConfig.direction === 'asc' ? '\u2191' : '\u2193'}</span>
                          )}
                        </span>
                      </th>
                    ))}
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Tags</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">League</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">poe.ninja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredOffMetaBuilds.map(build => {
                    const isExpanded = expandedBuild === build.id;
                    return (
                      <React.Fragment key={build.id}>
                        <tr
                          className={`hover:bg-white/5 transition-colors cursor-pointer ${isExpanded ? 'bg-white/5' : ''}`}
                          onClick={() => setExpandedBuild(isExpanded ? null : build.id)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <svg
                                className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: build.classColor }} />
                              <div>
                                <div className="font-medium text-white text-sm">{build.name}</div>
                                <div className="text-xs text-gray-500">{build.playstyle} &bull; {build.damageType}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-300">{build.className}</div>
                            <div className="text-xs text-gray-500">{build.baseClass}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {build.difficulty && (
                              <span
                                className="text-xs px-2 py-1 rounded font-medium"
                                style={{
                                  backgroundColor: `${getUniversalDifficultyColor(build.difficulty, game.id)}20`,
                                  color: getUniversalDifficultyColor(build.difficulty, game.id)
                                }}
                              >
                                {build.difficulty}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {build.tags?.filter(t => t !== 'Off-Meta').slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="text-xs px-1.5 py-0.5 bg-gray-700/50 text-gray-400 rounded">{tag}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {build.league && <span className="text-xs text-gray-400">{build.league.split(' ')[0]}</span>}
                          </td>
                          <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                            {build.guideUrl && (
                              <a
                                href={build.guideUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 bg-blue-500/10 rounded"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View Builds
                              </a>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="bg-[#0f0f17] border-t border-gray-800">
                              <OffMetaExpansion build={build} game={game} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredOffMetaBuilds.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No off-meta builds found matching your filters
              </div>
            )}

            <div className="px-4 py-3 border-t border-gray-800 bg-[#0f0f17]">
              <p className="text-xs text-gray-500">
                Off-meta builds from poe.ninja ladder. Click "View Builds" to see player profiles, DPS, and EHP stats on poe.ninja.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'compare' && <BuildComparison builds={allBuilds} />}

        {activeTab === 'import' && game.id === 'poe1' && (
          <div className="max-w-7xl mx-auto">
            <PoBImport
              onViewTree={(buildData) => {
                if (onViewSkillTree) {
                  onViewSkillTree({
                    name: `${buildData.className} ${buildData.ascendancyName || ''}`.trim(),
                    allocatedNodes: buildData.allocatedNodes,
                    keystones: [],
                  });
                }
              }}
              onImport={(buildData) => {
                setAdvisorBuild({
                  name: `${buildData.className || 'Unknown'} ${buildData.ascendancyName || ''}`.trim(),
                  ...buildData,
                });
                setActiveTab('advisor');
              }}
            />
          </div>
        )}

        {activeTab === 'advisor' && game.id === 'poe1' && (
          <div className="h-full flex gap-4">
            <div className="w-72 flex-shrink-0 bg-gray-900/50 rounded-lg border border-gray-800 flex flex-col max-h-[calc(100vh-12rem)]">
              <div className="p-3 border-b border-gray-800 flex-shrink-0">
                <h4 className="text-sm font-medium text-white mb-2">Select a Build</h4>
                <input
                  type="text"
                  placeholder="Search builds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {allBuilds
                  .filter(b => !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .slice(0, 50)
                  .map((build, idx) => (
                    <button
                      key={build.id || idx}
                      onClick={() => setAdvisorBuild(build)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-800 transition-colors border-b border-gray-800/50 ${
                        advisorBuild?.id === build.id ? 'bg-amber-900/30 text-amber-300' : 'text-gray-300'
                      }`}
                    >
                      <div className="font-medium truncate">{build.name}</div>
                      <div className="text-xs text-gray-500">{build.className}</div>
                    </button>
                  ))}
              </div>
            </div>
            <div className="flex-1 min-w-0 max-h-[calc(100vh-12rem)]">
              <BuildAdvisor build={advisorBuild} onClose={() => setAdvisorBuild(null)} className="h-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Off-meta build expansion panel */
function OffMetaExpansion({ build, game }) {
  return (
    <div className="px-6 py-4 space-y-4">
      {build.description && <p className="text-sm text-gray-400">{build.description}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {build.keystones && build.keystones.length > 0 && (
          <div>
            <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Keystones</h4>
            <div className="flex flex-wrap gap-1">
              {build.keystones.map((keystone, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">{keystone}</span>
              ))}
            </div>
          </div>
        )}
        {build.skills && build.skills.length > 0 && (
          <div>
            <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Main Skills</h4>
            <div className="flex flex-wrap gap-1">
              {build.skills.map((skill, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">{skill}</span>
              ))}
            </div>
          </div>
        )}
        {build.keyItems && build.keyItems.length > 0 && (
          <div>
            <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Key Items</h4>
            <div className="flex flex-wrap gap-1">
              {build.keyItems.map((item, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded">{item}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {build.ascendancy && build.ascendancy.length > 0 && (
        <div>
          <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Ascendancy Order</h4>
          <div className="flex flex-wrap gap-2">
            {build.ascendancy.map((node, idx) => (
              <span key={idx} className="text-xs px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded flex items-center gap-1">
                <span className="text-cyan-600">{idx + 1}.</span> {node}
              </span>
            ))}
          </div>
        </div>
      )}

      {build.gameplay && (
        <div>
          <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Gameplay</h4>
          <p className="text-sm text-gray-400">{build.gameplay}</p>
        </div>
      )}

      {build.topBuilds && build.topBuilds.length > 0 && (
        <div className="pt-3 border-t border-gray-800">
          <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Top Builds on poe.ninja</h4>
          <div className="flex flex-col gap-2">
            {build.topBuilds.slice(0, 3).map((topBuild, idx) => (
              <a
                key={idx}
                href={topBuild.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">#{idx + 1}</span>
                  <span className="text-blue-400 font-medium">{topBuild.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  {topBuild.dps && <span className="text-green-400"><span className="text-gray-500 mr-1">DPS:</span>{topBuild.dps}</span>}
                  {topBuild.life && <span className="text-red-400"><span className="text-gray-500 mr-1">Life:</span>{topBuild.life}</span>}
                  {topBuild.es && <span className="text-purple-400"><span className="text-gray-500 mr-1">ES:</span>{topBuild.es}</span>}
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
