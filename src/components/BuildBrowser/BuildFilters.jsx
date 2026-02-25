import AdvancedFilters from '../AdvancedFilters/AdvancedFilters';

export default function BuildFilters({
  game,
  activeTab,
  selectedClass,
  setSelectedClass,
  selectedTier,
  setSelectedTier,
  selectedSource,
  setSelectedSource,
  searchQuery,
  setSearchQuery,
  sources,
  filteredCount,
  advancedFilters,
  setAdvancedFilters,
  showAdvancedFilters,
  setShowAdvancedFilters,
}) {
  const tiers = ['S', 'A', 'B', 'C'];

  return (
    <>
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
          {filteredCount} builds
        </span>

        {/* Advanced filters toggle (PoE only) */}
        {game.id === 'poe1' && activeTab !== 'compare' && (
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`text-sm px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              showAdvancedFilters || Object.keys(advancedFilters).some(k => advancedFilters[k]?.length > 0)
                ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-700'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Advanced
            {Object.keys(advancedFilters).some(k => advancedFilters[k]?.length > 0) && (
              <span className="text-xs px-1 py-0.5 bg-cyan-600 rounded text-white">
                {Object.values(advancedFilters).reduce((c, a) => c + (a?.length || 0), 0)}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && game.id === 'poe1' && activeTab !== 'compare' && (
        <AdvancedFilters
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          collapsible={false}
          className="mb-4"
        />
      )}
    </>
  );
}
