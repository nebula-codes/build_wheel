import { useState } from 'react';
import { FILTER_ACTIONS } from '../reducers/filterReducer';

export default function Sidebar({
  activeView,
  setActiveView,
  selectedGameId,
  currentGame,
  gameList,
  onGameChange,
  filterState,
  filterDispatch,
  spinState,
  sidebarTab,
  setSidebarTab,
  availableDifficulties,
  availablePlaystyles,
  filteredBuildCount,
  totalBuilds,
  favorites,
  setFavorites,
  toggleFavorite,
  isFavorite,
  soundEnabled,
  setSoundEnabled,
  isSkillExcluded,
  isClassExcluded,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { excludedClasses, difficultyFilter, playstyleFilter, lockedClass } = filterState;

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-[#1a1a24] border border-gray-700 rounded-lg text-gray-400 hover:text-white"
        aria-label="Open sidebar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-[#1a1a24] border-r border-gray-800 flex flex-col
        transform transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-8 h-8 bg-gradient-to-br from-diablo-orange to-diablo-gold rounded-lg flex items-center justify-center text-white text-sm">
            BW
          </span>
          Build Wheel
        </h1>
      </div>

      {/* Navigation */}
      <div className="p-3 border-b border-gray-800">
        <nav className="space-y-1">
          <button
            onClick={() => setActiveView('wheel')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'wheel'
                ? 'bg-diablo-orange/10 text-diablo-orange'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Randomizer
          </button>
          <button
            onClick={() => setActiveView('browser')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'browser'
                ? 'bg-diablo-orange/10 text-diablo-orange'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Build Browser
            <span className="ml-auto text-xs text-gray-600">{totalBuilds}</span>
          </button>
          {selectedGameId === 'poe1' && (
            <button
              onClick={() => setActiveView('tree')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'tree'
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Skill Tree
            </button>
          )}
        </nav>
      </div>

      {/* Game Selector */}
      <div className="p-3 border-b border-gray-800">
        <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Game</label>
        <select
          className="w-full bg-[#0f0f17] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-diablo-orange focus:outline-none"
          value={selectedGameId}
          onChange={(e) => onGameChange(e.target.value)}
        >
          {gameList.map(game => (
            <option key={game.id} value={game.id}>{game.name}</option>
          ))}
        </select>
      </div>

      {/* Filter Section - Only show for wheel view */}
      {activeView === 'wheel' && (
        <>
          {/* Pre-spin Filters */}
          <div className="p-3 border-b border-gray-800 space-y-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Difficulty</label>
              <select
                className="w-full bg-[#0f0f17] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-diablo-orange focus:outline-none"
                value={difficultyFilter}
                onChange={(e) => filterDispatch({ type: FILTER_ACTIONS.SET_DIFFICULTY, value: e.target.value })}
              >
                <option value="all">All Difficulties</option>
                {availableDifficulties.map(diff => (
                  <option key={diff} value={diff}>{diff}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Playstyle</label>
              <select
                className="w-full bg-[#0f0f17] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-diablo-orange focus:outline-none"
                value={playstyleFilter}
                onChange={(e) => filterDispatch({ type: FILTER_ACTIONS.SET_PLAYSTYLE, value: e.target.value })}
              >
                <option value="all">All Playstyles</option>
                {availablePlaystyles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
            <div className="text-xs text-gray-500">
              {filteredBuildCount} builds available
            </div>
          </div>

          <div className="flex border-b border-gray-800">
            {['classes', 'builds', 'history'].map(tab => (
              <button
                key={tab}
                className={`flex-1 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                  sidebarTab === tab
                    ? 'text-diablo-orange border-b-2 border-diablo-orange bg-diablo-orange/5'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                onClick={() => setSidebarTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {sidebarTab === 'classes' && (
              <div className="space-y-1">
                {currentGame.classes.map(cls => (
                  <div
                    key={cls.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isClassExcluded(cls.id)
                        ? 'opacity-50'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!isClassExcluded(cls.id)}
                      onChange={() => filterDispatch({ type: FILTER_ACTIONS.TOGGLE_CLASS, classId: cls.id })}
                      className="w-4 h-4 rounded border-gray-600 text-diablo-orange focus:ring-diablo-orange/50 bg-gray-800"
                    />
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cls.color }}
                    />
                    <span className="text-sm text-gray-300 flex-1">{cls.name}</span>
                    <button
                      onClick={() => filterDispatch({ type: FILTER_ACTIONS.LOCK_CLASS, cls })}
                      disabled={isClassExcluded(cls.id)}
                      className={`p-1 rounded transition-colors ${
                        lockedClass?.id === cls.id
                          ? 'text-diablo-orange bg-diablo-orange/20'
                          : 'text-gray-600 hover:text-gray-400'
                      } ${isClassExcluded(cls.id) ? 'opacity-30 cursor-not-allowed' : ''}`}
                      title={lockedClass?.id === cls.id ? 'Unlock class' : 'Lock class'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {lockedClass?.id === cls.id ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        )}
                      </svg>
                    </button>
                    <span className="text-xs text-gray-600">
                      {cls.skills.filter(s => !isSkillExcluded(s.id)).length}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {sidebarTab === 'builds' && (
              <div className="space-y-4">
                {currentGame.classes.map(cls => (
                  <div key={cls.id} className={isClassExcluded(cls.id) ? 'opacity-30' : ''}>
                    <div className="flex items-center gap-2 px-2 mb-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cls.color }}
                      />
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {cls.name}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {cls.skills.map(skill => (
                        <div
                          key={skill.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
                            isSkillExcluded(skill.id) || isClassExcluded(cls.id)
                              ? 'opacity-50'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!isSkillExcluded(skill.id) && !isClassExcluded(cls.id)}
                            disabled={isClassExcluded(cls.id)}
                            onChange={() => filterDispatch({ type: FILTER_ACTIONS.TOGGLE_SKILL, skillId: skill.id })}
                            className="w-3.5 h-3.5 rounded border-gray-600 text-diablo-orange focus:ring-diablo-orange/50 bg-gray-800"
                          />
                          <span className="text-sm text-gray-400 flex-1">{skill.name}</span>
                          <button
                            onClick={() => toggleFavorite(cls, skill)}
                            className={`p-0.5 transition-colors ${
                              isFavorite(cls, skill) ? 'text-yellow-500' : 'text-gray-600 hover:text-gray-400'
                            }`}
                            title={isFavorite(cls, skill) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <svg className="w-3.5 h-3.5" fill={isFavorite(cls, skill) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sidebarTab === 'history' && (
              <div className="space-y-2">
                {spinState.spinHistory.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-4">
                    No spins yet. Press Space or click Spin!
                  </div>
                ) : (
                  spinState.spinHistory.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg"
                    >
                      <span className="text-xs text-gray-600 w-4">{idx + 1}.</span>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: entry.class?.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{entry.skill?.name}</div>
                        <div className="text-xs text-gray-500">{entry.class?.name}</div>
                      </div>
                      <button
                        onClick={() => toggleFavorite(entry.class, entry.skill)}
                        className={`p-1 transition-colors ${
                          isFavorite(entry.class, entry.skill) ? 'text-yellow-500' : 'text-gray-600 hover:text-gray-400'
                        }`}
                      >
                        <svg className="w-4 h-4" fill={isFavorite(entry.class, entry.skill) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Browser view sidebar content */}
      {activeView === 'browser' && (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Quick Stats</div>
          <div className="space-y-2">
            {currentGame.classes.map(cls => (
              <div key={cls.id} className="flex items-center gap-2 px-2 py-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cls.color }}
                />
                <span className="text-sm text-gray-400 flex-1">{cls.name}</span>
                <span className="text-xs text-gray-600">{cls.skills.length}</span>
              </div>
            ))}
          </div>

          {/* Favorites Section */}
          {favorites.filter(f => f.gameId === selectedGameId).length > 0 && (
            <div className="mt-6">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Favorites</div>
              <div className="space-y-1">
                {favorites.filter(f => f.gameId === selectedGameId).map(fav => (
                  <div key={fav.key} className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: fav.classColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{fav.skillName}</div>
                      <div className="text-xs text-gray-500">{fav.className}</div>
                    </div>
                    <button
                      onClick={() => setFavorites(prev => prev.filter(f => f.key !== fav.key))}
                      className="text-gray-600 hover:text-red-400 p-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sidebar Footer with Sound Toggle */}
      <div className="p-3 border-t border-gray-800 flex items-center justify-between">
        <span className="text-xs text-gray-600">Press Space to spin</span>
        <button
          onClick={() => setSoundEnabled(prev => !prev)}
          className={`p-1.5 rounded transition-colors ${
            soundEnabled ? 'text-diablo-orange' : 'text-gray-600'
          }`}
          title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {soundEnabled ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zm7.414-7l4 4m0-4l-4 4" />
            )}
          </svg>
        </button>
      </div>
    </aside>
    </>
  );
}
