import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import Wheel from './components/Wheel';
import ResultDisplay from './components/ResultDisplay';
import BuildBrowser from './components/BuildBrowser';
import { games, gameList } from './data/games';

// Sound effects (base64 encoded short sounds)
const TICK_SOUND = 'data:audio/wav;base64,UklGRl9vT19teleVBmZm10IBAAABAAEARKwAAIhYAQACABAAZGF0YQAAAA==';
const CELEBRATION_SOUND = 'data:audio/wav;base64,UklGRl9vT19teleVBmZm10IBAAABAAEARKwAAIhYAQACABAAZGF0YQAAAA==';

function App() {
  const [selectedGameId, setSelectedGameId] = useState('poe1');
  const [activeView, setActiveView] = useState('wheel');
  const [excludedClasses, setExcludedClasses] = useState(['raider']);
  const [excludedSkills, setExcludedSkills] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [spinningClass, setSpinningClass] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('classes');

  // New feature states
  const [spinHistory, setSpinHistory] = useState([]);
  const [lockedClass, setLockedClass] = useState(null);
  const [lockedBuild, setLockedBuild] = useState(null);
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [playstyleFilter, setPlaystyleFilter] = useState('all');
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('buildWheel_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('buildWheel_soundEnabled');
    return saved ? JSON.parse(saved) : true;
  });
  const [copied, setCopied] = useState(false);

  const classWheelRef = useRef(null);
  const skillWheelRef = useRef(null);
  const tickAudioRef = useRef(null);
  const celebrationAudioRef = useRef(null);

  const currentGame = games[selectedGameId];

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('buildWheel_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Save sound preference
  useEffect(() => {
    localStorage.setItem('buildWheel_soundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  // Keyboard shortcut for spinning (spacebar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && activeView === 'wheel' && !isSpinning) {
        e.preventDefault();
        handleSpin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, isSpinning]);

  // Get unique playstyles from current game
  const availablePlaystyles = useMemo(() => {
    const playstyles = new Set();
    currentGame.classes.forEach(cls => {
      cls.skills.forEach(skill => {
        if (skill.playstyle) playstyles.add(skill.playstyle);
      });
    });
    return Array.from(playstyles).sort();
  }, [currentGame]);

  // Get unique difficulties
  const availableDifficulties = ['Easy', 'Medium', 'Hard'];

  const availableClasses = useMemo(() => {
    return currentGame.classes.filter(cls => {
      // First check if class is excluded
      if (excludedClasses.includes(cls.id)) return false;

      // Then check if class has any skills matching the current filters
      const hasMatchingSkills = cls.skills.some(skill => {
        if (excludedSkills.includes(skill.id)) return false;
        if (difficultyFilter !== 'all' && skill.difficulty !== difficultyFilter) return false;
        if (playstyleFilter !== 'all' && skill.playstyle !== playstyleFilter) return false;
        return true;
      });

      return hasMatchingSkills;
    });
  }, [currentGame.classes, excludedClasses, excludedSkills, difficultyFilter, playstyleFilter]);

  const getSkillsForClass = useCallback((classData) => {
    if (!classData) return [];
    return classData.skills
      .filter(skill => {
        if (excludedSkills.includes(skill.id)) return false;
        if (difficultyFilter !== 'all' && skill.difficulty !== difficultyFilter) return false;
        if (playstyleFilter !== 'all' && skill.playstyle !== playstyleFilter) return false;
        return true;
      })
      .map(skill => ({
        ...skill,
        classId: classData.id,
        className: classData.name,
        color: classData.color,
      }));
  }, [excludedSkills, difficultyFilter, playstyleFilter]);

  const displayedSkills = useMemo(() => {
    const targetClass = spinningClass || selectedClass || lockedClass;
    if (targetClass) {
      return getSkillsForClass(targetClass);
    }
    const allSkills = [];
    availableClasses.forEach(cls => {
      cls.skills.forEach(skill => {
        if (excludedSkills.includes(skill.id)) return;
        if (difficultyFilter !== 'all' && skill.difficulty !== difficultyFilter) return;
        if (playstyleFilter !== 'all' && skill.playstyle !== playstyleFilter) return;
        allSkills.push({
          ...skill,
          classId: cls.id,
          className: cls.name,
          color: cls.color,
        });
      });
    });
    return allSkills;
  }, [spinningClass, selectedClass, lockedClass, availableClasses, excludedSkills, getSkillsForClass, difficultyFilter, playstyleFilter]);

  const hasAnySkills = useMemo(() => {
    return displayedSkills.length > 0;
  }, [displayedSkills]);

  const handleToggleClass = useCallback((classId) => {
    setExcludedClasses(prev => {
      if (prev.includes(classId)) {
        return prev.filter(id => id !== classId);
      }
      return [...prev, classId];
    });
    setSelectedClass(null);
    setSelectedSkill(null);
    setSpinningClass(null);
    if (lockedClass?.id === classId) setLockedClass(null);
  }, [lockedClass]);

  const handleToggleSkill = useCallback((skillId) => {
    setExcludedSkills(prev => {
      if (prev.includes(skillId)) {
        return prev.filter(id => id !== skillId);
      }
      return [...prev, skillId];
    });
    setSelectedClass(null);
    setSelectedSkill(null);
    setSpinningClass(null);
  }, []);

  const handleGameChange = useCallback((gameId) => {
    setSelectedGameId(gameId);
    setExcludedClasses(gameId === 'poe1' ? ['raider'] : []);
    setExcludedSkills([]);
    setSelectedClass(null);
    setSelectedSkill(null);
    setSpinningClass(null);
    setLockedClass(null);
    setLockedBuild(null);
    setDifficultyFilter('all');
    setPlaystyleFilter('all');
  }, []);

  const playTickSound = useCallback(() => {
    if (soundEnabled && tickAudioRef.current) {
      tickAudioRef.current.currentTime = 0;
      tickAudioRef.current.play().catch(() => {});
    }
  }, [soundEnabled]);

  const playCelebrationSound = useCallback(() => {
    if (soundEnabled && celebrationAudioRef.current) {
      celebrationAudioRef.current.currentTime = 0;
      celebrationAudioRef.current.play().catch(() => {});
    }
  }, [soundEnabled]);

  const handleSpin = useCallback(() => {
    if (isSpinning) return;

    // If both are locked, nothing to spin
    if (lockedClass && lockedBuild) {
      return;
    }

    const classesToUse = lockedClass ? [lockedClass] : availableClasses;
    if (classesToUse.length === 0 || !hasAnySkills) {
      alert('Please enable at least one class and one build to spin!');
      return;
    }

    setIsSpinning(true);
    if (!lockedClass) {
      setSelectedClass(null);
    }
    if (!lockedBuild) {
      setSelectedSkill(null);
    }
    setSpinningClass(null);

    if (lockedClass) {
      // Skip class wheel, go straight to build wheel
      setSelectedClass(lockedClass);
      setSpinningClass(lockedClass);
      setTimeout(() => {
        skillWheelRef.current?.spin();
      }, 100);
    } else {
      classWheelRef.current?.spin();
    }
  }, [isSpinning, lockedClass, lockedBuild, availableClasses, hasAnySkills]);

  const handleClassSpinComplete = useCallback((cls) => {
    setSelectedClass(cls);
    setSpinningClass(cls);
    playTickSound();

    if (lockedBuild) {
      // If build is locked, we're done
      setSelectedSkill(lockedBuild);
      setSpinningClass(null);
      setIsSpinning(false);
      playCelebrationSound();
      // Add to history
      setSpinHistory(prev => [{
        id: Date.now(),
        class: cls,
        skill: lockedBuild,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]);
    } else {
      setTimeout(() => {
        skillWheelRef.current?.spin();
      }, 100);
    }
  }, [lockedBuild, playTickSound, playCelebrationSound]);

  const handleSkillSpinComplete = useCallback((skill) => {
    setSelectedSkill(skill);
    setSpinningClass(null);
    setIsSpinning(false);
    playCelebrationSound();

    // Add to history
    const finalClass = lockedClass || selectedClass;
    setSpinHistory(prev => [{
      id: Date.now(),
      class: finalClass,
      skill: skill,
      timestamp: new Date()
    }, ...prev.slice(0, 9)]);
  }, [lockedClass, selectedClass, playCelebrationSound]);

  const handleCopyResult = useCallback(() => {
    if (selectedClass && selectedSkill) {
      const text = `${selectedClass.name} - ${selectedSkill.name}`;
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [selectedClass, selectedSkill]);

  const toggleFavorite = useCallback((cls, skill) => {
    const key = `${cls.id}-${skill.id}`;
    setFavorites(prev => {
      if (prev.some(f => f.key === key)) {
        return prev.filter(f => f.key !== key);
      }
      return [...prev, {
        key,
        classId: cls.id,
        className: cls.name,
        classColor: cls.color,
        skillId: skill.id,
        skillName: skill.name,
        gameId: selectedGameId
      }];
    });
  }, [selectedGameId]);

  const isFavorite = useCallback((cls, skill) => {
    const key = `${cls.id}-${skill.id}`;
    return favorites.some(f => f.key === key);
  }, [favorites]);

  const handleLockClass = useCallback((cls) => {
    setLockedClass(prev => prev?.id === cls.id ? null : cls);
    setSelectedClass(null);
    setSelectedSkill(null);
  }, []);

  const handleLockBuild = useCallback((skill) => {
    setLockedBuild(prev => prev?.id === skill.id ? null : skill);
    setSelectedSkill(null);
  }, []);

  const isClassExcluded = (classId) => excludedClasses.includes(classId);
  const isSkillExcluded = (skillId) => excludedSkills.includes(skillId);

  const totalBuilds = useMemo(() => {
    return currentGame.classes.reduce((acc, cls) => acc + cls.skills.length, 0);
  }, [currentGame]);

  const filteredBuildCount = useMemo(() => {
    return displayedSkills.length;
  }, [displayedSkills]);

  return (
    <div className="min-h-screen bg-[#0f0f17] flex">
      {/* Hidden audio elements */}
      <audio ref={tickAudioRef} src={TICK_SOUND} preload="auto" />
      <audio ref={celebrationAudioRef} src={CELEBRATION_SOUND} preload="auto" />

      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1a24] border-r border-gray-800 flex flex-col">
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
          </nav>
        </div>

        {/* Game Selector */}
        <div className="p-3 border-b border-gray-800">
          <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Game</label>
          <select
            className="w-full bg-[#0f0f17] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-diablo-orange focus:outline-none"
            value={selectedGameId}
            onChange={(e) => handleGameChange(e.target.value)}
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
                  onChange={(e) => setDifficultyFilter(e.target.value)}
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
                  onChange={(e) => setPlaystyleFilter(e.target.value)}
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
              <button
                className={`flex-1 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                  sidebarTab === 'classes'
                    ? 'text-diablo-orange border-b-2 border-diablo-orange bg-diablo-orange/5'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                onClick={() => setSidebarTab('classes')}
              >
                Classes
              </button>
              <button
                className={`flex-1 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                  sidebarTab === 'builds'
                    ? 'text-diablo-orange border-b-2 border-diablo-orange bg-diablo-orange/5'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                onClick={() => setSidebarTab('builds')}
              >
                Builds
              </button>
              <button
                className={`flex-1 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                  sidebarTab === 'history'
                    ? 'text-diablo-orange border-b-2 border-diablo-orange bg-diablo-orange/5'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                onClick={() => setSidebarTab('history')}
              >
                History
              </button>
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
                        onChange={() => handleToggleClass(cls.id)}
                        className="w-4 h-4 rounded border-gray-600 text-diablo-orange focus:ring-diablo-orange/50 bg-gray-800"
                      />
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cls.color }}
                      />
                      <span className="text-sm text-gray-300 flex-1">{cls.name}</span>
                      <button
                        onClick={() => handleLockClass(cls)}
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
                              onChange={() => handleToggleSkill(skill.id)}
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
                  {spinHistory.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-4">
                      No spins yet. Press Space or click Spin!
                    </div>
                  ) : (
                    spinHistory.map((entry, idx) => (
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-14 bg-[#1a1a24] border-b border-gray-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-white font-medium">{currentGame.name}</h2>
            <span className="text-gray-600">•</span>
            <span className="text-sm text-gray-400">
              {activeView === 'wheel' ? 'Randomizer' : 'Build Browser'}
            </span>
            {/* Lock indicators */}
            {activeView === 'wheel' && (lockedClass || lockedBuild) && (
              <>
                <span className="text-gray-600">•</span>
                <div className="flex items-center gap-2">
                  {lockedClass && (
                    <span className="text-xs px-2 py-1 bg-diablo-orange/20 text-diablo-orange rounded flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      {lockedClass.name}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {activeView === 'wheel' && (
            <div className="flex items-center gap-3">
              {/* Copy button - only show when we have a result */}
              {selectedClass && selectedSkill && !isSpinning && (
                <button
                  onClick={handleCopyResult}
                  className="px-3 py-2 rounded-lg text-sm transition-all bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                  {copied ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </span>
                  )}
                </button>
              )}

              {/* Favorite button - only show when we have a result */}
              {selectedClass && selectedSkill && !isSpinning && (
                <button
                  onClick={() => toggleFavorite(selectedClass, selectedSkill)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    isFavorite(selectedClass, selectedSkill)
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill={isFavorite(selectedClass, selectedSkill) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    {isFavorite(selectedClass, selectedSkill) ? 'Saved' : 'Save'}
                  </span>
                </button>
              )}

              <button
                className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
                  isSpinning || availableClasses.length === 0 || !hasAnySkills || (lockedClass && lockedBuild)
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-diablo-orange to-diablo-gold text-white hover:shadow-lg hover:shadow-diablo-orange/20'
                }`}
                onClick={handleSpin}
                disabled={isSpinning || availableClasses.length === 0 || !hasAnySkills || (lockedClass && lockedBuild)}
              >
                {isSpinning ? 'Spinning...' : 'Spin'}
              </button>
            </div>
          )}
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeView === 'wheel' && (
            <>
              {/* Wheels */}
              <div className="flex flex-wrap items-start justify-center gap-8 mb-8">
                <div className={`bg-[#1a1a24] rounded-xl p-6 border border-gray-800 ${lockedClass ? 'ring-2 ring-diablo-orange/50' : ''}`}>
                  {lockedClass && (
                    <div className="text-center mb-2">
                      <span className="text-xs text-diablo-orange flex items-center justify-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Locked
                      </span>
                    </div>
                  )}
                  <Wheel
                    ref={classWheelRef}
                    items={lockedClass ? [lockedClass] : availableClasses}
                    title="Class"
                    onSpinComplete={handleClassSpinComplete}
                    locked={!!lockedClass}
                    onTick={playTickSound}
                  />
                </div>
                <div className="bg-[#1a1a24] rounded-xl p-6 border border-gray-800">
                  <Wheel
                    ref={skillWheelRef}
                    items={displayedSkills}
                    title="Build"
                    onSpinComplete={handleSkillSpinComplete}
                    onTick={playTickSound}
                  />
                </div>
              </div>

              {/* Results */}
              <ResultDisplay
                selectedClass={selectedClass}
                selectedSkill={selectedSkill}
                isSpinning={isSpinning}
                gameId={selectedGameId}
              />
            </>
          )}

          {activeView === 'browser' && (
            <BuildBrowser game={currentGame} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
