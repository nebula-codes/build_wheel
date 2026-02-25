import { useState, useRef, useMemo, useCallback, useEffect, useReducer, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import AppHeader from './components/AppHeader';
import WheelView from './components/WheelView';
import ErrorBoundary from './components/ErrorBoundary';
import { games, gameList } from './data/games';

// Lazy-load heavy components
const BuildBrowser = lazy(() => import('./components/BuildBrowser'));
const SkillTree = lazy(() => import('./components/SkillTree').then(m => ({ default: m.SkillTree })));
import { spinReducer, initialSpinState, SPIN_ACTIONS } from './reducers/spinReducer';
import { filterReducer, createInitialFilterState, FILTER_ACTIONS } from './reducers/filterReducer';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-diablo-orange/30 border-t-diablo-orange rounded-full animate-spin" />
    </div>
  );
}

// Sound effects (base64 encoded short sounds)
const TICK_SOUND = 'data:audio/wav;base64,UklGRl9vT19teleVBmZm10IBAAABAAEARKwAAIhYAQACABAAZGF0YQAAAA==';
const CELEBRATION_SOUND = 'data:audio/wav;base64,UklGRl9vT19teleVBmZm10IBAAABAAEARKwAAIhYAQACABAAZGF0YQAAAA==';

function App() {
  const [selectedGameId, setSelectedGameId] = useState('poe1');
  const [activeView, setActiveView] = useState('wheel');
  const [sidebarTab, setSidebarTab] = useState('classes');

  const [spinState, spinDispatch] = useReducer(spinReducer, initialSpinState);
  const [filterState, filterDispatch] = useReducer(filterReducer, createInitialFilterState('poe1'));

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('buildWheel_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('buildWheel_soundEnabled');
    return saved ? JSON.parse(saved) : true;
  });
  const [copied, setCopied] = useState(false);
  const [skillTreeBuild, setSkillTreeBuild] = useState(null);

  const classWheelRef = useRef(null);
  const skillWheelRef = useRef(null);
  const tickAudioRef = useRef(null);
  const celebrationAudioRef = useRef(null);
  const handleSpinRef = useRef(null);

  const currentGame = games[selectedGameId];

  // Destructure reducer states for convenience
  const { isSpinning, spinningClass, selectedClass, selectedSkill } = spinState;
  const { excludedClasses, excludedSkills, difficultyFilter, playstyleFilter, lockedClass, lockedBuild } = filterState;

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('buildWheel_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Save sound preference
  useEffect(() => {
    localStorage.setItem('buildWheel_soundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

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

  const availableDifficulties = ['Easy', 'Medium', 'Hard'];

  const availableClasses = useMemo(() => {
    return currentGame.classes.filter(cls => {
      if (excludedClasses.includes(cls.id)) return false;
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

  const hasAnySkills = displayedSkills.length > 0;

  const totalBuilds = useMemo(() => {
    return currentGame.classes.reduce((acc, cls) => acc + cls.skills.length, 0);
  }, [currentGame]);

  const filteredBuildCount = displayedSkills.length;

  const handleGameChange = useCallback((gameId) => {
    setSelectedGameId(gameId);
    filterDispatch({ type: FILTER_ACTIONS.RESET_FILTERS, gameId });
    spinDispatch({ type: SPIN_ACTIONS.RESET });
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
    if (lockedClass && lockedBuild) return;

    const classesToUse = lockedClass ? [lockedClass] : availableClasses;
    if (classesToUse.length === 0 || !hasAnySkills) {
      alert('Please enable at least one class and one build to spin!');
      return;
    }

    spinDispatch({ type: SPIN_ACTIONS.SPIN_START, lockedClass });

    if (lockedClass) {
      setTimeout(() => {
        skillWheelRef.current?.spin();
      }, 100);
    } else {
      classWheelRef.current?.spin();
    }
  }, [isSpinning, lockedClass, lockedBuild, availableClasses, hasAnySkills]);

  useEffect(() => {
    handleSpinRef.current = handleSpin;
  }, [handleSpin]);

  // Keyboard shortcut for spinning (spacebar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && activeView === 'wheel' && !isSpinning) {
        e.preventDefault();
        handleSpinRef.current?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, isSpinning]);

  const handleClassSpinComplete = useCallback((cls) => {
    spinDispatch({ type: SPIN_ACTIONS.CLASS_SELECTED, cls });
    playTickSound();

    if (lockedBuild) {
      spinDispatch({ type: SPIN_ACTIONS.SKILL_SELECTED, skill: lockedBuild, cls });
      playCelebrationSound();
    } else {
      setTimeout(() => {
        skillWheelRef.current?.spin();
      }, 100);
    }
  }, [lockedBuild, playTickSound, playCelebrationSound]);

  const handleSkillSpinComplete = useCallback((skill) => {
    const finalClass = lockedClass || selectedClass;
    spinDispatch({ type: SPIN_ACTIONS.SKILL_SELECTED, skill, cls: finalClass });
    playCelebrationSound();
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

  const isClassExcluded = (classId) => excludedClasses.includes(classId);
  const isSkillExcluded = (skillId) => excludedSkills.includes(skillId);

  return (
    <div className="min-h-screen bg-[#0f0f17] flex">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-diablo-orange focus:text-white focus:rounded-lg"
      >
        Skip to content
      </a>

      {/* Hidden audio elements */}
      <audio ref={tickAudioRef} src={TICK_SOUND} preload="auto" />
      <audio ref={celebrationAudioRef} src={CELEBRATION_SOUND} preload="auto" />

      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        selectedGameId={selectedGameId}
        currentGame={currentGame}
        gameList={gameList}
        onGameChange={handleGameChange}
        filterState={filterState}
        filterDispatch={filterDispatch}
        spinState={spinState}
        sidebarTab={sidebarTab}
        setSidebarTab={setSidebarTab}
        availableDifficulties={availableDifficulties}
        availablePlaystyles={availablePlaystyles}
        filteredBuildCount={filteredBuildCount}
        totalBuilds={totalBuilds}
        favorites={favorites}
        setFavorites={setFavorites}
        toggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        isSkillExcluded={isSkillExcluded}
        isClassExcluded={isClassExcluded}
      />

      {/* Main Content */}
      <main id="main-content" className="flex-1 flex flex-col md:ml-0">
        <AppHeader
          activeView={activeView}
          currentGame={currentGame}
          isSpinning={isSpinning}
          selectedClass={selectedClass}
          selectedSkill={selectedSkill}
          lockedClass={lockedClass}
          lockedBuild={lockedBuild}
          availableClasses={availableClasses}
          hasAnySkills={hasAnySkills}
          copied={copied}
          onSpin={handleSpin}
          onCopyResult={handleCopyResult}
          toggleFavorite={toggleFavorite}
          isFavorite={isFavorite}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeView === 'wheel' && (
            <WheelView
              classWheelRef={classWheelRef}
              skillWheelRef={skillWheelRef}
              lockedClass={lockedClass}
              availableClasses={availableClasses}
              displayedSkills={displayedSkills}
              selectedClass={selectedClass}
              selectedSkill={selectedSkill}
              isSpinning={isSpinning}
              selectedGameId={selectedGameId}
              onClassSpinComplete={handleClassSpinComplete}
              onSkillSpinComplete={handleSkillSpinComplete}
              onTick={playTickSound}
            />
          )}

          {activeView === 'browser' && (
            <ErrorBoundary name="Build Browser">
              <Suspense fallback={<LoadingSpinner />}>
                <BuildBrowser
                  game={currentGame}
                  onViewSkillTree={(build) => {
                    setSkillTreeBuild(build);
                    setActiveView('tree');
                  }}
                />
              </Suspense>
            </ErrorBoundary>
          )}

          {activeView === 'tree' && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-white">Passive Skill Tree</h2>
                  {skillTreeBuild && (
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: skillTreeBuild.classColor }}
                      />
                      <span className="text-gray-400">{skillTreeBuild.name}</span>
                      <span className="text-gray-600">({skillTreeBuild.className})</span>
                    </div>
                  )}
                </div>
                {skillTreeBuild && (
                  <button
                    onClick={() => setSkillTreeBuild(null)}
                    className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear Build
                  </button>
                )}
              </div>

              {!skillTreeBuild && (
                <div className="mb-4 p-4 bg-[#1a1a24] rounded-lg border border-gray-800">
                  <p className="text-gray-400 text-sm mb-3">
                    Select a build to highlight its keystones on the tree, or explore the full passive tree below.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentGame.classes.slice(0, 6).flatMap(cls =>
                      cls.skills.filter(s => s.keystones?.length > 0).slice(0, 2).map(skill => (
                        <button
                          key={skill.id}
                          onClick={() => setSkillTreeBuild({
                            ...skill,
                            classColor: cls.color,
                            className: cls.name
                          })}
                          className="px-3 py-1.5 text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/30 transition-colors"
                        >
                          {skill.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              <ErrorBoundary name="Skill Tree">
                <Suspense fallback={<LoadingSpinner />}>
                  <SkillTree
                    className="flex-1 rounded-lg overflow-hidden border border-gray-800"
                    highlightedKeystones={skillTreeBuild?.keystones || []}
                    ascendancyName={skillTreeBuild?.className}
                    onNodeClick={(node) => {
                      console.log('Node clicked:', node);
                    }}
                  />
                </Suspense>
              </ErrorBoundary>

              {skillTreeBuild?.keystones && skillTreeBuild.keystones.length > 0 && (
                <div className="mt-4 p-4 bg-[#1a1a24] rounded-lg border border-gray-800">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                    Build Keystones
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skillTreeBuild.keystones.map((keystone, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded text-sm border border-yellow-500/30"
                      >
                        {keystone}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
