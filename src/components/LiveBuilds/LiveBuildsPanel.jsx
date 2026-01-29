import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchBuildStats,
  fetchTopBuildsForSkill,
  fetchAscendancyRankings,
  fetchTrendingKeystones,
  getCurrentLeague,
} from '../../utils/poeNinjaApi';
import { GemBadge } from '../GemLinks/GemLinks';

// Current/Permanent leagues
const CURRENT_LEAGUES = [
  { id: 'Keepers of the Flame', name: 'Keepers of the Flame', type: 'current' },
  { id: 'Hardcore Keepers of the Flame', name: 'HC Keepers', type: 'current' },
  { id: 'Standard', name: 'Standard', type: 'permanent' },
  { id: 'Hardcore', name: 'Hardcore', type: 'permanent' },
];

// Historical leagues (most recent first)
const HISTORICAL_LEAGUES = [
  { id: 'Settlers of Kalguur', name: 'Settlers of Kalguur', version: '3.25' },
  { id: 'Necropolis', name: 'Necropolis', version: '3.24' },
  { id: 'Affliction', name: 'Affliction', version: '3.23' },
  { id: 'Trial of the Ancestors', name: 'Trial of the Ancestors', version: '3.22' },
  { id: 'Crucible', name: 'Crucible', version: '3.21' },
  { id: 'Sanctum', name: 'Sanctum', version: '3.20' },
  { id: 'Kalandra', name: 'Lake of Kalandra', version: '3.19' },
  { id: 'Sentinel', name: 'Sentinel', version: '3.18' },
  { id: 'Archnemesis', name: 'Archnemesis', version: '3.17' },
  { id: 'Scourge', name: 'Scourge', version: '3.16' },
  { id: 'Expedition', name: 'Expedition', version: '3.15' },
  { id: 'Ultimatum', name: 'Ultimatum', version: '3.14' },
  { id: 'Ritual', name: 'Ritual', version: '3.13' },
  { id: 'Heist', name: 'Heist', version: '3.12' },
  { id: 'Harvest', name: 'Harvest', version: '3.11' },
  { id: 'Delirium', name: 'Delirium', version: '3.10' },
  { id: 'Metamorph', name: 'Metamorph', version: '3.9' },
  { id: 'Blight', name: 'Blight', version: '3.8' },
  { id: 'Legion', name: 'Legion', version: '3.7' },
  { id: 'Synthesis', name: 'Synthesis', version: '3.6' },
  { id: 'Betrayal', name: 'Betrayal', version: '3.5' },
  { id: 'Delve', name: 'Delve', version: '3.4' },
  { id: 'Incursion', name: 'Incursion', version: '3.3' },
  { id: 'Bestiary', name: 'Bestiary', version: '3.2' },
  { id: 'Abyss', name: 'Abyss', version: '3.1' },
  { id: 'Harbinger', name: 'Harbinger', version: '3.0' },
];

/**
 * Live poe.ninja builds browser with league selection
 */
export default function LiveBuildsPanel({ onSelectBuild, className = '' }) {
  const [selectedLeague, setSelectedLeague] = useState('Keepers of the Flame');
  const [leagueType, setLeagueType] = useState('current'); // 'current' or 'historical'
  const [historicalSearch, setHistoricalSearch] = useState('');
  const [showHistoricalDropdown, setShowHistoricalDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [buildStats, setBuildStats] = useState(null);
  const [ascendancyRankings, setAscendancyRankings] = useState([]);
  const [trendingKeystones, setTrendingKeystones] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skillBuilds, setSkillBuilds] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'ascendancies', 'keystones', 'skills'

  // Filter historical leagues based on search
  const filteredHistoricalLeagues = HISTORICAL_LEAGUES.filter(league =>
    league.name.toLowerCase().includes(historicalSearch.toLowerCase()) ||
    league.version.includes(historicalSearch)
  );

  // Handle selecting a historical league
  const handleHistoricalLeagueSelect = (league) => {
    setSelectedLeague(league.id);
    setLeagueType('historical');
    setShowHistoricalDropdown(false);
    setHistoricalSearch('');
  };

  // Handle selecting a current league
  const handleCurrentLeagueSelect = (leagueId) => {
    setSelectedLeague(leagueId);
    setLeagueType('current');
  };

  // Ref for click-outside detection
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowHistoricalDropdown(false);
      }
    };

    if (showHistoricalDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHistoricalDropdown]);

  // Fetch data when league changes
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [stats, ascendancies, keystones] = await Promise.all([
        fetchBuildStats(selectedLeague),
        fetchAscendancyRankings(selectedLeague),
        fetchTrendingKeystones(selectedLeague, 15),
      ]);

      setBuildStats(stats);
      setAscendancyRankings(ascendancies);
      setTrendingKeystones(keystones);
    } catch (err) {
      setError(err.message || 'Failed to fetch data from poe.ninja');
    } finally {
      setLoading(false);
    }
  }, [selectedLeague]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch builds for a specific skill
  const handleSkillClick = async (skillName) => {
    setSelectedSkill(skillName);
    setLoading(true);

    try {
      const builds = await fetchTopBuildsForSkill(skillName, selectedLeague, 10);
      setSkillBuilds(builds);
    } catch (err) {
      setError('Failed to fetch skill builds');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-gray-900/50 rounded-lg border border-gray-800 ${className}`}>
      {/* Header with league selector */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <img
              src="https://web.poecdn.com/protected/image/layout/logo-b01.png?key=Bbhn2u8m5S8s7WGkPqq6rQ"
              alt="PoE"
              className="h-5"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            Live poe.ninja Data
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Real-time build statistics from the ladder</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Current League Selector */}
          <div className="flex items-center gap-1">
            <select
              value={leagueType === 'current' ? selectedLeague : ''}
              onChange={(e) => handleCurrentLeagueSelect(e.target.value)}
              className={`bg-gray-800 border rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none ${
                leagueType === 'current' ? 'border-blue-600' : 'border-gray-700'
              }`}
            >
              <option value="" disabled>Current</option>
              {CURRENT_LEAGUES.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>

          {/* Historical League Selector with Search */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowHistoricalDropdown(!showHistoricalDropdown)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-sm transition-colors ${
                leagueType === 'historical'
                  ? 'bg-purple-900/50 border border-purple-600 text-purple-300'
                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {leagueType === 'historical' ? (
                <span className="max-w-[100px] truncate">
                  {HISTORICAL_LEAGUES.find(l => l.id === selectedLeague)?.name || 'Historical'}
                </span>
              ) : (
                'Historical'
              )}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Historical League Dropdown */}
            {showHistoricalDropdown && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
                {/* Search Input */}
                <div className="p-2 border-b border-gray-800">
                  <input
                    type="text"
                    value={historicalSearch}
                    onChange={(e) => setHistoricalSearch(e.target.value)}
                    placeholder="Search leagues..."
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                </div>
                {/* League List */}
                <div className="max-h-64 overflow-y-auto">
                  {filteredHistoricalLeagues.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 text-center">No leagues found</div>
                  ) : (
                    filteredHistoricalLeagues.map((league) => (
                      <button
                        key={league.id}
                        onClick={() => handleHistoricalLeagueSelect(league)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-800 transition-colors flex items-center justify-between ${
                          selectedLeague === league.id ? 'bg-purple-900/30 text-purple-300' : 'text-gray-300'
                        }`}
                      >
                        <span>{league.name}</span>
                        <span className="text-xs text-gray-500">{league.version}</span>
                      </button>
                    ))
                  )}
                </div>
                {/* Note about data availability */}
                <div className="p-2 border-t border-gray-800 text-xs text-gray-600 text-center">
                  Note: Historical data may be limited or unavailable
                </div>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'ascendancies', label: 'Ascendancies' },
          { id: 'keystones', label: 'Keystones' },
          { id: 'skills', label: 'Top Skills' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400 -mb-px'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="text-amber-300 font-medium text-sm">Unable to load live data</h4>
                <p className="text-amber-200/70 text-xs mt-1">
                  poe.ninja's API doesn't allow direct browser requests (CORS restriction).
                  Visit poe.ninja directly for live data:
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <a
                    href={`https://poe.ninja/builds/challenge`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Builds on poe.ninja
                  </a>
                  <button onClick={fetchData} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors">
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && !buildStats && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
          </div>
        )}

        {/* Fallback content when no data */}
        {!loading && !buildStats && !error && (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">Loading build statistics...</p>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && buildStats && (
          <div className="space-y-6">
            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {buildStats.totalBuilds?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Total Builds</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {ascendancyRankings[0]?.name || '-'}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Top Ascendancy</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {trendingKeystones[0]?.name || '-'}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Top Keystone</div>
              </div>
            </div>

            {/* Quick lists */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Top 5 Ascendancies</h4>
                <div className="space-y-1">
                  {ascendancyRankings.slice(0, 5).map((asc, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{asc.name}</span>
                      <span className="text-gray-500">{asc.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Top 5 Keystones</h4>
                <div className="space-y-1">
                  {trendingKeystones.slice(0, 5).map((ks, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{ks.name}</span>
                      <span className="text-gray-500">{ks.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ascendancies Tab */}
        {activeTab === 'ascendancies' && (
          <div className="space-y-2">
            {ascendancyRankings.map((asc, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
              >
                <span className="text-lg font-bold text-gray-600 w-6">#{asc.rank}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{asc.name}</div>
                  <div className="text-xs text-gray-500">{asc.count?.toLocaleString()} builds</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-blue-400">{asc.percentage}%</div>
                  <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(asc.percentage * 2, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Keystones Tab */}
        {activeTab === 'keystones' && (
          <div className="space-y-2">
            {trendingKeystones.map((ks, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
              >
                <span className="text-lg font-bold text-gray-600 w-6">#{idx + 1}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-amber-300">{ks.name}</div>
                  <div className="text-xs text-gray-500">{ks.count?.toLocaleString()} builds</div>
                </div>
                <div className="text-sm font-semibold text-amber-400">{ks.percentage}%</div>
              </div>
            ))}
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && buildStats?.skills && (
          <div className="space-y-4">
            {/* Skill list */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {buildStats.skills.slice(0, 18).map((skill, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSkillClick(skill.name)}
                  className={`p-2 rounded-lg text-left transition-colors ${
                    selectedSkill === skill.name
                      ? 'bg-blue-900/50 border border-blue-700'
                      : 'bg-gray-800/30 hover:bg-gray-800/50 border border-transparent'
                  }`}
                >
                  <div className="text-sm text-white truncate">{skill.name}</div>
                  <div className="text-xs text-gray-500">{skill.percentage}%</div>
                </button>
              ))}
            </div>

            {/* Selected skill builds */}
            {selectedSkill && skillBuilds.length > 0 && (
              <div className="mt-4 border-t border-gray-800 pt-4">
                <h4 className="text-sm font-medium text-white mb-3">
                  Top {selectedSkill} Builds
                </h4>
                <div className="space-y-2">
                  {skillBuilds.map((build, idx) => (
                    <a
                      key={idx}
                      href={build.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                    >
                      <div>
                        <div className="text-sm text-white">{build.character}</div>
                        <div className="text-xs text-gray-500">
                          {build.class} • Level {build.level}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        {build.dps && (
                          <span className="text-green-400">
                            DPS: {(build.dps / 1000000).toFixed(1)}M
                          </span>
                        )}
                        {build.life && (
                          <span className="text-red-400">Life: {build.life?.toLocaleString()}</span>
                        )}
                        {build.energyShield && (
                          <span className="text-blue-400">ES: {build.energyShield?.toLocaleString()}</span>
                        )}
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick links to poe.ninja */}
        {!buildStats && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <a
              href="https://poe.ninja/builds/challenge"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-center transition-colors"
            >
              <div className="text-lg mb-1">📊</div>
              <div className="text-sm text-white">All Builds</div>
              <div className="text-xs text-gray-500">View ladder</div>
            </a>
            <a
              href="https://poe.ninja/builds/challenge?class=Deadeye,Pathfinder,Raider"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-center transition-colors"
            >
              <div className="text-lg mb-1">🏹</div>
              <div className="text-sm text-white">Rangers</div>
              <div className="text-xs text-gray-500">Deadeye, Pathfinder, Raider</div>
            </a>
            <a
              href="https://poe.ninja/builds/challenge?class=Necromancer,Elementalist,Occultist"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-center transition-colors"
            >
              <div className="text-lg mb-1">🧙</div>
              <div className="text-sm text-white">Witches</div>
              <div className="text-xs text-gray-500">Necro, Ele, Occultist</div>
            </a>
            <a
              href="https://poe.ninja/economy/challenge/currency"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-center transition-colors"
            >
              <div className="text-lg mb-1">💰</div>
              <div className="text-sm text-white">Economy</div>
              <div className="text-xs text-gray-500">Currency prices</div>
            </a>
          </div>
        )}

        {/* Note about data source */}
        <div className="mt-4 text-xs text-gray-600 text-center">
          {buildStats ? (
            <span>Data from poe.ninja API • League: {selectedLeague}</span>
          ) : (
            <span>
              Visit{' '}
              <a href="https://poe.ninja" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                poe.ninja
              </a>
              {' '}for live build statistics
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
