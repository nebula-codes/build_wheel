import { useState, useRef, useMemo, useCallback } from 'react';
import Wheel from './components/Wheel';
import ResultDisplay from './components/ResultDisplay';
import BuildBrowser from './components/BuildBrowser';
import { games, gameList } from './data/games';

function App() {
  const [selectedGameId, setSelectedGameId] = useState('diablo4');
  const [activeView, setActiveView] = useState('wheel'); // 'wheel' or 'browser'
  const [excludedClasses, setExcludedClasses] = useState([]);
  const [excludedSkills, setExcludedSkills] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [spinningClass, setSpinningClass] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('classes');

  const classWheelRef = useRef(null);
  const skillWheelRef = useRef(null);

  const currentGame = games[selectedGameId];

  const availableClasses = useMemo(() => {
    return currentGame.classes.filter(cls => !excludedClasses.includes(cls.id));
  }, [currentGame.classes, excludedClasses]);

  const getSkillsForClass = useCallback((classData) => {
    if (!classData) return [];
    return classData.skills
      .filter(skill => !excludedSkills.includes(skill.id))
      .map(skill => ({
        ...skill,
        classId: classData.id,
        className: classData.name,
        color: classData.color,
      }));
  }, [excludedSkills]);

  const displayedSkills = useMemo(() => {
    const targetClass = spinningClass || selectedClass;
    if (targetClass) {
      return getSkillsForClass(targetClass);
    }
    const allSkills = [];
    availableClasses.forEach(cls => {
      cls.skills.forEach(skill => {
        if (!excludedSkills.includes(skill.id)) {
          allSkills.push({
            ...skill,
            classId: cls.id,
            className: cls.name,
            color: cls.color,
          });
        }
      });
    });
    return allSkills;
  }, [spinningClass, selectedClass, availableClasses, excludedSkills, getSkillsForClass]);

  const hasAnySkills = useMemo(() => {
    return availableClasses.some(cls =>
      cls.skills.some(skill => !excludedSkills.includes(skill.id))
    );
  }, [availableClasses, excludedSkills]);

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
  }, []);

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
    setExcludedClasses([]);
    setExcludedSkills([]);
    setSelectedClass(null);
    setSelectedSkill(null);
    setSpinningClass(null);
  }, []);

  const handleSpin = useCallback(() => {
    if (isSpinning) return;
    if (availableClasses.length === 0 || !hasAnySkills) {
      alert('Please enable at least one class and one skill to spin!');
      return;
    }

    setIsSpinning(true);
    setSelectedClass(null);
    setSelectedSkill(null);
    setSpinningClass(null);

    classWheelRef.current?.spin();
  }, [isSpinning, availableClasses.length, hasAnySkills]);

  const handleClassSpinComplete = useCallback((cls) => {
    setSelectedClass(cls);
    setSpinningClass(cls);

    setTimeout(() => {
      skillWheelRef.current?.spin();
    }, 100);
  }, []);

  const handleSkillSpinComplete = useCallback((skill) => {
    setSelectedSkill(skill);
    setSpinningClass(null);
    setIsSpinning(false);
  }, []);

  const isClassExcluded = (classId) => excludedClasses.includes(classId);
  const isSkillExcluded = (skillId) => excludedSkills.includes(skillId);

  const totalBuilds = useMemo(() => {
    return currentGame.classes.reduce((acc, cls) => acc + cls.skills.length, 0);
  }, [currentGame]);

  return (
    <div className="min-h-screen bg-[#0f0f17] flex">
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
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {sidebarTab === 'classes' && (
                <div className="space-y-1">
                  {currentGame.classes.map(cls => (
                    <label
                      key={cls.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
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
                      <span className="text-sm text-gray-300">{cls.name}</span>
                      <span className="ml-auto text-xs text-gray-600">
                        {cls.skills.filter(s => !isSkillExcluded(s.id)).length}
                      </span>
                    </label>
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
                          <label
                            key={skill.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer transition-colors ${
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
                            <span className="text-sm text-gray-400">{skill.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
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
          </div>
        )}

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-gray-800 text-xs text-gray-600 text-center">
          More games coming soon
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
          </div>

          {activeView === 'wheel' && (
            <button
              className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
                isSpinning || availableClasses.length === 0 || !hasAnySkills
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-diablo-orange to-diablo-gold text-white hover:shadow-lg hover:shadow-diablo-orange/20'
              }`}
              onClick={handleSpin}
              disabled={isSpinning || availableClasses.length === 0 || !hasAnySkills}
            >
              {isSpinning ? 'Spinning...' : 'Spin'}
            </button>
          )}
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeView === 'wheel' && (
            <>
              {/* Wheels */}
              <div className="flex flex-wrap items-start justify-center gap-8 mb-8">
                <div className="bg-[#1a1a24] rounded-xl p-6 border border-gray-800">
                  <Wheel
                    ref={classWheelRef}
                    items={availableClasses}
                    title="Class"
                    onSpinComplete={handleClassSpinComplete}
                  />
                </div>
                <div className="bg-[#1a1a24] rounded-xl p-6 border border-gray-800">
                  <Wheel
                    ref={skillWheelRef}
                    items={displayedSkills}
                    title="Build"
                    onSpinComplete={handleSkillSpinComplete}
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
