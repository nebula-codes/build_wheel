import { getUniversalTierColor, getUniversalDifficultyColor } from '../data/games';

function ResultDisplay({ selectedClass, selectedSkill, isSpinning, gameId }) {
  if (isSpinning) {
    return (
      <div className="bg-[#1a1a24] rounded-xl border border-gray-800 p-12 text-center">
        <div className="inline-block w-6 h-6 border-2 border-diablo-orange/30 border-t-diablo-orange rounded-full animate-spin" />
      </div>
    );
  }

  if (!selectedClass && !selectedSkill) {
    return (
      <div className="bg-[#1a1a24] rounded-xl border border-dashed border-gray-700 p-12 text-center">
        <p className="text-gray-600 text-sm">Click Spin to randomize your build</p>
      </div>
    );
  }

  const tierColor = selectedSkill?.tier ? getUniversalTierColor(selectedSkill.tier, gameId) : null;
  const difficultyColor = selectedSkill?.difficulty ? getUniversalDifficultyColor(selectedSkill.difficulty, gameId) : null;

  return (
    <div className="bg-[#1a1a24] rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selectedClass && (
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedClass.color }}
              />
              <span className="font-medium text-white">{selectedClass.name}</span>
              {selectedClass.baseClass && (
                <span className="text-xs text-gray-500">({selectedClass.baseClass})</span>
              )}
            </div>
          )}
          {selectedClass && selectedSkill && (
            <span className="text-gray-700">/</span>
          )}
          {selectedSkill && (
            <span className="font-medium text-white">{selectedSkill.name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedSkill?.tier && (
            <span
              className="text-xs px-2 py-1 rounded font-medium"
              style={{ backgroundColor: tierColor, color: '#fff' }}
            >
              {selectedSkill.tier}-Tier
            </span>
          )}
          {selectedSkill?.difficulty && (
            <span
              className="text-xs px-2 py-1 rounded font-medium"
              style={{
                backgroundColor: `${difficultyColor}20`,
                color: difficultyColor
              }}
            >
              {selectedSkill.difficulty}
            </span>
          )}
          {selectedSkill?.source && (
            <span className={`text-xs px-2 py-1 rounded ${
              selectedSkill.source === 'Maxroll'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {selectedSkill.source}
            </span>
          )}
        </div>
      </div>

      {selectedSkill && (
        <>
          {/* Description */}
          {selectedSkill.description && (
            <div className="px-6 py-4 border-b border-gray-800">
              <p className="text-gray-400 text-sm leading-relaxed">{selectedSkill.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedSkill.playstyle && (
                  <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded">
                    {selectedSkill.playstyle}
                  </span>
                )}
                {selectedSkill.damageType && (
                  <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded">
                    {selectedSkill.damageType}
                  </span>
                )}
                {selectedSkill.tags?.map((tag, idx) => (
                  <span key={idx} className="text-xs px-2 py-1 bg-gray-700/50 text-gray-400 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              {selectedSkill.league && (
                <div className="mt-2 text-xs text-gray-500">
                  League: {selectedSkill.league}
                </div>
              )}
            </div>
          )}

          {/* Build Info Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-800">
            {/* Skills */}
            {selectedSkill.skills && selectedSkill.skills.length > 0 && (
              <div className="p-4">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Skills</h4>
                <div className="space-y-1.5">
                  {selectedSkill.skills.slice(0, 6).map((skill, idx) => (
                    <div key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-4">{idx + 1}.</span>
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Items */}
            {selectedSkill.keyItems && selectedSkill.keyItems.length > 0 && (
              <div className="p-4">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Key Items</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSkill.keyItems.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Paragon Glyphs (D4) or Ascendancy (PoE) */}
            {selectedSkill.paragonGlyphs && selectedSkill.paragonGlyphs.length > 0 && (
              <div className="p-4">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Glyphs</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSkill.paragonGlyphs.map((glyph, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded"
                    >
                      {glyph}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedSkill.ascendancy && selectedSkill.ascendancy.length > 0 && (
              <div className="p-4">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Ascendancy</h4>
                <div className="space-y-1">
                  {selectedSkill.ascendancy.map((node, idx) => (
                    <div key={idx} className="text-xs text-gray-400 flex items-center gap-2">
                      <span className="text-cyan-500">{idx + 1}.</span>
                      {node}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stat Priorities */}
            {selectedSkill.statPriorities && selectedSkill.statPriorities.length > 0 && (
              <div className="p-4">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Stats</h4>
                <div className="space-y-1">
                  {selectedSkill.statPriorities.slice(0, 5).map((stat, idx) => (
                    <div key={idx} className="text-xs text-gray-400 flex items-center gap-2">
                      <span className="text-gray-600 w-4">{idx + 1}.</span>
                      {stat}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Gameplay */}
          {selectedSkill.gameplay && (
            <div className="px-6 py-4 border-t border-gray-800">
              <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Gameplay</h4>
              <p className="text-sm text-gray-400 leading-relaxed">{selectedSkill.gameplay}</p>
            </div>
          )}

          {/* Guide & Planner Links */}
          {(selectedSkill.guideUrl || selectedSkill.plannerUrl) && (
            <div className="px-6 py-3 border-t border-gray-800 bg-[#0f0f17] flex items-center gap-4">
              {selectedSkill.guideUrl && (
                <a
                  href={selectedSkill.guideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-diablo-orange hover:text-diablo-gold transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Build Guide
                </a>
              )}
              {selectedSkill.plannerUrl && (
                <a
                  href={selectedSkill.plannerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  PoB Planner
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ResultDisplay;
