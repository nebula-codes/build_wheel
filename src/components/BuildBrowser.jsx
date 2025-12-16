import React, { useState, useMemo } from 'react';
import { getUniversalTierColor, getUniversalDifficultyColor } from '../data/games';

function BuildBrowser({ game }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'offmeta'
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBuild, setExpandedBuild] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

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

  // Get unique sources for filter
  const sources = useMemo(() => {
    const sourceSet = new Set(allBuilds.map(b => b.source).filter(Boolean));
    return Array.from(sourceSet);
  }, [allBuilds]);

  // Separate off-meta (poe.ninja) builds
  const offMetaBuilds = useMemo(() => {
    return allBuilds.filter(b => b.source === 'poe.ninja');
  }, [allBuilds]);

  // Check if this game has off-meta builds
  const hasOffMetaBuilds = offMetaBuilds.length > 0;

  const filteredBuilds = useMemo(() => {
    return allBuilds.filter(build => {
      // On "all" tab, exclude poe.ninja builds (they have their own tab)
      if (activeTab === 'all' && build.source === 'poe.ninja') return false;
      if (selectedClass !== 'all' && build.classId !== selectedClass) return false;
      if (selectedTier !== 'all' && build.tier !== selectedTier) return false;
      if (selectedSource !== 'all' && build.source !== selectedSource) return false;
      if (searchQuery && !build.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [allBuilds, selectedClass, selectedTier, selectedSource, searchQuery, activeTab]);

  // Filtered and sorted off-meta builds for the table
  const filteredOffMetaBuilds = useMemo(() => {
    let builds = offMetaBuilds.filter(build => {
      if (selectedClass !== 'all' && build.classId !== selectedClass) return false;
      if (searchQuery && !build.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    // Sort builds
    builds.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle string vs number sorting
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
        if (sortConfig.direction === 'asc') {
          return aVal.localeCompare(bVal);
        }
        return bVal.localeCompare(aVal);
      }

      // Number sorting
      aVal = aVal || 0;
      bVal = bVal || 0;
      if (sortConfig.direction === 'asc') {
        return aVal - bVal;
      }
      return bVal - aVal;
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

  return (
    <div className="h-full flex flex-col">
      {/* Tabs (only show if game has off-meta builds) */}
      {hasOffMetaBuilds && (
        <div className="flex gap-1 mb-4 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-diablo-orange border-b-2 border-diablo-orange'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Meta Builds
          </button>
          <button
            onClick={() => setActiveTab('offmeta')}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'offmeta'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Off-Meta</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
              poe.ninja
            </span>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search builds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1a24] border border-gray-800 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-diablo-orange focus:outline-none"
          />
        </div>

        {/* Class Filter */}
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="bg-[#1a1a24] border border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:border-diablo-orange focus:outline-none"
        >
          <option value="all">All Classes</option>
          {game.classes.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.name} {cls.baseClass ? `(${cls.baseClass})` : ''}
            </option>
          ))}
        </select>

        {/* Tier Filter (only on main tab) */}
        {activeTab === 'all' && (
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="bg-[#1a1a24] border border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:border-diablo-orange focus:outline-none"
          >
            <option value="all">All Tiers</option>
            {tiers.map(tier => (
              <option key={tier} value={tier}>{tier}-Tier</option>
            ))}
          </select>
        )}

        {/* Source Filter (only on main tab for PoE) */}
        {activeTab === 'all' && sources.length > 1 && (
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="bg-[#1a1a24] border border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:border-diablo-orange focus:outline-none"
          >
            <option value="all">All Sources</option>
            {sources.filter(s => s !== 'poe.ninja').map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        )}

        <span className="text-sm text-gray-500">
          {activeTab === 'all' ? filteredBuilds.length : filteredOffMetaBuilds.length} builds
        </span>
      </div>

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

        {/* Off-Meta Builds Tab - Sortable Table */}
        {activeTab === 'offmeta' && (
          <div className="bg-[#1a1a24] border border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-[#0f0f17]">
                    <th
                      className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <span className="flex items-center gap-1">
                        Build
                        {sortConfig.key === 'name' && (
                          <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </span>
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('className')}
                    >
                      <span className="flex items-center gap-1">
                        Class
                        {sortConfig.key === 'className' && (
                          <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </span>
                    </th>
                    <th
                      className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('difficulty')}
                    >
                      <span className="flex items-center justify-center gap-1">
                        Difficulty
                        {sortConfig.key === 'difficulty' && (
                          <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </span>
                    </th>
                    <th
                      className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('popularity')}
                    >
                      <span className="flex items-center justify-center gap-1">
                        Pop%
                        {sortConfig.key === 'popularity' && (
                          <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </span>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      poe.ninja
                    </th>
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
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: build.classColor }}
                              />
                              <div>
                                <div className="font-medium text-white text-sm">{build.name}</div>
                                <div className="text-xs text-gray-500">{build.playstyle} • {build.damageType}</div>
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
                          <td className="px-4 py-3 text-center">
                            {build.popularity && (
                              <span
                                className={`text-xs px-2 py-1 rounded font-medium ${
                                  build.popularity >= 3 ? 'bg-green-500/20 text-green-400' :
                                  build.popularity >= 1 ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}
                              >
                                {build.popularity}%
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {build.tags?.filter(t => t !== 'Off-Meta').slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="text-xs px-1.5 py-0.5 bg-gray-700/50 text-gray-400 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
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
                        {/* Expansion Panel */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="bg-[#0f0f17] border-t border-gray-800">
                              <div className="px-6 py-4 space-y-4">
                                {/* Description */}
                                {build.description && (
                                  <p className="text-sm text-gray-400">{build.description}</p>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {/* Keystones */}
                                  {build.keystones && build.keystones.length > 0 && (
                                    <div>
                                      <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Keystones</h4>
                                      <div className="flex flex-wrap gap-1">
                                        {build.keystones.map((keystone, idx) => (
                                          <span key={idx} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                                            {keystone}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Skills */}
                                  {build.skills && build.skills.length > 0 && (
                                    <div>
                                      <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Main Skills</h4>
                                      <div className="flex flex-wrap gap-1">
                                        {build.skills.map((skill, idx) => (
                                          <span key={idx} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Key Items */}
                                  {build.keyItems && build.keyItems.length > 0 && (
                                    <div>
                                      <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Key Items</h4>
                                      <div className="flex flex-wrap gap-1">
                                        {build.keyItems.map((item, idx) => (
                                          <span key={idx} className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded">
                                            {item}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Ascendancy */}
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

                                {/* Gameplay */}
                                {build.gameplay && (
                                  <div>
                                    <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Gameplay</h4>
                                    <p className="text-sm text-gray-400">{build.gameplay}</p>
                                  </div>
                                )}

                                {/* Top Builds from poe.ninja */}
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
                                            {topBuild.dps && (
                                              <span className="text-green-400" title="DPS">
                                                <span className="text-gray-500 mr-1">DPS:</span>
                                                {topBuild.dps}
                                              </span>
                                            )}
                                            {topBuild.life && (
                                              <span className="text-red-400" title="Life">
                                                <span className="text-gray-500 mr-1">Life:</span>
                                                {topBuild.life}
                                              </span>
                                            )}
                                            {topBuild.es && (
                                              <span className="text-purple-400" title="Energy Shield">
                                                <span className="text-gray-500 mr-1">ES:</span>
                                                {topBuild.es}
                                              </span>
                                            )}
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
      </div>
    </div>
  );
}

function BuildCard({ build, gameId, isExpanded, onToggle }) {
  const tierColor = build.tier ? getUniversalTierColor(build.tier, gameId) : null;
  const difficultyColor = build.difficulty ? getUniversalDifficultyColor(build.difficulty, gameId) : null;

  return (
    <div className="bg-[#1a1a24] border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: build.classColor }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white truncate">{build.name}</div>
          <div className="text-xs text-gray-500">
            {build.className}
            {build.baseClass && ` (${build.baseClass})`}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {build.source && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              build.source === 'Maxroll'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {build.source}
            </span>
          )}
          {build.tier && (
            <span
              className="text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ backgroundColor: tierColor, color: '#fff' }}
            >
              {build.tier}
            </span>
          )}
          {build.difficulty && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${difficultyColor}20`,
                color: difficultyColor
              }}
            >
              {build.difficulty}
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-800">
          {build.description && (
            <div className="px-4 py-3 border-b border-gray-800">
              <p className="text-sm text-gray-400">{build.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {build.playstyle && (
                  <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                    {build.playstyle}
                  </span>
                )}
                {build.damageType && (
                  <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded">
                    {build.damageType}
                  </span>
                )}
                {build.tags?.map((tag, idx) => (
                  <span key={idx} className="text-xs px-2 py-0.5 bg-gray-700/50 text-gray-400 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              {build.league && (
                <div className="mt-2 text-xs text-gray-500">
                  League: {build.league}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 divide-x divide-gray-800">
            {build.skills && build.skills.length > 0 && (
              <div className="p-3">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Skills</h4>
                <div className="space-y-1">
                  {build.skills.slice(0, 6).map((skill, idx) => (
                    <div key={idx} className="text-xs text-gray-400">{skill}</div>
                  ))}
                </div>
              </div>
            )}

            {build.keyItems && build.keyItems.length > 0 && (
              <div className="p-3">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Key Items</h4>
                <div className="flex flex-wrap gap-1">
                  {build.keyItems.map((item, idx) => (
                    <span key={idx} className="text-xs px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ascendancy for PoE */}
          {build.ascendancy && build.ascendancy.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-800">
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
            <div className="px-4 py-3 border-t border-gray-800">
              <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Gameplay</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{build.gameplay}</p>
            </div>
          )}

          {(build.guideUrl || build.plannerUrl) && (
            <div className="px-4 py-2 border-t border-gray-800 bg-[#0f0f17] flex items-center gap-4">
              {build.guideUrl && (
                <a
                  href={build.guideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-diablo-orange hover:text-diablo-gold transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Guide
                </a>
              )}
              {build.plannerUrl && (
                <a
                  href={build.plannerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  PoB Planner
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BuildBrowser;
