import { memo } from 'react';
import { getUniversalTierColor, getUniversalDifficultyColor } from '../../data/games';
import { GemListCompact } from '../GemLinks/GemLinks';
import { ItemList } from '../ItemDisplay/ItemDisplay';
import PantheonBandit from '../BuildDetails/PantheonBandit';
import BuildProgression from '../BuildDetails/BuildProgression';
import MapModWarnings from '../BuildDetails/MapModWarnings';

export default memo(function BuildCard({ build, gameId, isExpanded, onToggle, onViewSkillTree, onAskAI }) {
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
          {build.league && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400">
              {build.league.split(' ')[0]}
            </span>
          )}
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
            </div>
          )}

          <div className="grid grid-cols-2 divide-x divide-gray-800">
            {build.skills && build.skills.length > 0 && (
              <div className="p-3">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Skills</h4>
                <GemListCompact skills={build.skills} maxShow={6} />
              </div>
            )}

            {build.keyItems && build.keyItems.length > 0 && (
              <div className="p-3">
                <ItemList items={build.keyItems} title="Key Items" maxShow={4} />
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

          {/* Pantheon & Bandit (PoE only) */}
          {gameId === 'poe1' && (build.pantheon || build.bandit) && (
            <div className="px-4 py-3 border-t border-gray-800">
              <PantheonBandit
                majorPantheon={build.pantheon?.major}
                minorPantheon={build.pantheon?.minor}
                bandit={build.bandit}
              />
            </div>
          )}

          {/* Build Progression (if data exists) */}
          {build.progression && (
            <div className="px-4 py-3 border-t border-gray-800">
              <BuildProgression progression={build.progression} />
            </div>
          )}

          {/* Map Mod Warnings */}
          {gameId === 'poe1' && (
            <div className="px-4 py-3 border-t border-gray-800">
              <MapModWarnings build={build} />
            </div>
          )}

          {(build.guideUrl || build.plannerUrl || (build.keystones && build.keystones.length > 0)) && (
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
              {onViewSkillTree && build.keystones && build.keystones.length > 0 && (
                <button
                  onClick={() => onViewSkillTree(build)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  Skill Tree
                </button>
              )}
              {onAskAI && gameId === 'poe1' && (
                <button
                  onClick={() => onAskAI(build)}
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 ml-auto"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Ask AI
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
})
