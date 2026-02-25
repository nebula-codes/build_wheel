export default function AppHeader({
  activeView,
  currentGame,
  isSpinning,
  selectedClass,
  selectedSkill,
  lockedClass,
  lockedBuild,
  availableClasses,
  hasAnySkills,
  copied,
  onSpin,
  onCopyResult,
  toggleFavorite,
  isFavorite,
}) {
  return (
    <header className="h-14 bg-[#1a1a24] border-b border-gray-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-white font-medium">{currentGame.name}</h2>
        <span className="text-gray-600">&bull;</span>
        <span className="text-sm text-gray-400">
          {activeView === 'wheel' ? 'Randomizer' : 'Build Browser'}
        </span>
        {/* Lock indicators */}
        {activeView === 'wheel' && (lockedClass || lockedBuild) && (
          <>
            <span className="text-gray-600">&bull;</span>
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
              onClick={onCopyResult}
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
            onClick={onSpin}
            disabled={isSpinning || availableClasses.length === 0 || !hasAnySkills || (lockedClass && lockedBuild)}
          >
            {isSpinning ? 'Spinning...' : 'Spin'}
          </button>
        </div>
      )}
    </header>
  );
}
