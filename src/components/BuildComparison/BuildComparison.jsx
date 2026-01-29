import { useState, useMemo } from 'react';
import { GemBadge } from '../GemLinks/GemLinks';
import { UniqueItem } from '../ItemDisplay/ItemDisplay';

// Tier colors for comparison
const tierColors = {
  S: 'text-amber-400',
  A: 'text-green-400',
  B: 'text-blue-400',
  C: 'text-gray-400',
};

const difficultyColors = {
  Easy: 'text-green-400',
  Medium: 'text-yellow-400',
  Hard: 'text-red-400',
};

/**
 * Comparison stat row
 */
function ComparisonRow({ label, values, type = 'text', highlight = false }) {
  const getValueColor = (idx) => {
    if (type === 'tier') return tierColors[values[idx]] || 'text-gray-400';
    if (type === 'difficulty') return difficultyColors[values[idx]] || 'text-gray-400';
    return 'text-white';
  };

  return (
    <div className={`
      grid grid-cols-3 gap-4 py-2 border-b border-gray-800
      ${highlight ? 'bg-gray-800/30' : ''}
    `}>
      <div className="text-xs text-gray-500 uppercase tracking-wider flex items-center">
        {label}
      </div>
      {values.map((value, idx) => (
        <div key={idx} className={`text-sm ${getValueColor(idx)}`}>
          {value || '-'}
        </div>
      ))}
    </div>
  );
}

/**
 * Skill comparison (show overlap and differences)
 */
function SkillComparison({ build1Skills, build2Skills }) {
  const skills1 = build1Skills || [];
  const skills2 = build2Skills || [];

  const shared = skills1.filter((s) => skills2.includes(s));
  const unique1 = skills1.filter((s) => !skills2.includes(s));
  const unique2 = skills2.filter((s) => !skills1.includes(s));

  return (
    <div className="space-y-3">
      {/* Shared skills */}
      {shared.length > 0 && (
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
            Shared Skills ({shared.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {shared.map((skill, idx) => (
              <GemBadge key={idx} name={skill} size="xs" />
            ))}
          </div>
        </div>
      )}

      {/* Build 1 unique */}
      {unique1.length > 0 && (
        <div>
          <div className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">
            Only in Build 1 ({unique1.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {unique1.map((skill, idx) => (
              <GemBadge key={idx} name={skill} size="xs" />
            ))}
          </div>
        </div>
      )}

      {/* Build 2 unique */}
      {unique2.length > 0 && (
        <div>
          <div className="text-[10px] text-purple-400 uppercase tracking-wider mb-1">
            Only in Build 2 ({unique2.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {unique2.map((skill, idx) => (
              <GemBadge key={idx} name={skill} size="xs" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Item comparison
 */
function ItemComparison({ build1Items, build2Items }) {
  const items1 = build1Items || [];
  const items2 = build2Items || [];

  const shared = items1.filter((i) => items2.includes(i));
  const unique1 = items1.filter((i) => !items2.includes(i));
  const unique2 = items2.filter((i) => !items1.includes(i));

  return (
    <div className="space-y-3">
      {/* Shared items */}
      {shared.length > 0 && (
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
            Shared Items ({shared.length})
          </div>
          <div className="space-y-1">
            {shared.map((item, idx) => (
              <UniqueItem key={idx} name={item} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Build 1 unique */}
        {unique1.length > 0 && (
          <div>
            <div className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">
              Only Build 1 ({unique1.length})
            </div>
            <div className="space-y-1">
              {unique1.map((item, idx) => (
                <UniqueItem key={idx} name={item} />
              ))}
            </div>
          </div>
        )}

        {/* Build 2 unique */}
        {unique2.length > 0 && (
          <div>
            <div className="text-[10px] text-purple-400 uppercase tracking-wider mb-1">
              Only Build 2 ({unique2.length})
            </div>
            <div className="space-y-1">
              {unique2.map((item, idx) => (
                <UniqueItem key={idx} name={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Build selector dropdown
 */
function BuildSelector({ builds, selectedId, onSelect, label, color = 'blue' }) {
  const colorClasses = {
    blue: 'border-blue-600 focus:ring-blue-500',
    purple: 'border-purple-600 focus:ring-purple-500',
  };

  return (
    <div>
      <label className={`text-xs uppercase tracking-wider mb-1 block text-${color}-400`}>
        {label}
      </label>
      <select
        value={selectedId || ''}
        onChange={(e) => onSelect(e.target.value)}
        className={`
          w-full bg-gray-800 border ${colorClasses[color]} rounded-lg
          px-3 py-2 text-sm text-white
          focus:outline-none focus:ring-2
        `}
      >
        <option value="">Select a build...</option>
        {builds.map((build) => (
          <option key={build.id} value={build.id}>
            {build.name} ({build.tier || '?'})
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Build comparison component
 */
export default function BuildComparison({ builds, className = '' }) {
  const [build1Id, setBuild1Id] = useState(null);
  const [build2Id, setBuild2Id] = useState(null);

  const build1 = useMemo(
    () => builds.find((b) => b.id === build1Id),
    [builds, build1Id]
  );
  const build2 = useMemo(
    () => builds.find((b) => b.id === build2Id),
    [builds, build2Id]
  );

  const hasBothBuilds = build1 && build2;

  // Calculate similarity score
  const similarityScore = useMemo(() => {
    if (!hasBothBuilds) return null;

    let score = 0;
    let maxScore = 0;

    // Same class
    maxScore += 20;
    if (build1.baseClass === build2.baseClass) score += 20;

    // Same damage type
    maxScore += 15;
    if (build1.damageType === build2.damageType) score += 15;

    // Same playstyle
    maxScore += 15;
    if (build1.playstyle === build2.playstyle) score += 15;

    // Shared skills (up to 30 points)
    const skills1 = build1.skills || [];
    const skills2 = build2.skills || [];
    const sharedSkills = skills1.filter((s) => skills2.includes(s)).length;
    maxScore += 30;
    score += Math.min(30, (sharedSkills / Math.max(skills1.length, skills2.length, 1)) * 30);

    // Shared items (up to 20 points)
    const items1 = build1.keyItems || [];
    const items2 = build2.keyItems || [];
    const sharedItems = items1.filter((i) => items2.includes(i)).length;
    maxScore += 20;
    score += Math.min(20, (sharedItems / Math.max(items1.length, items2.length, 1)) * 20);

    return Math.round((score / maxScore) * 100);
  }, [build1, build2, hasBothBuilds]);

  return (
    <div className={`bg-gray-900/50 rounded-lg border border-gray-800 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-white">Build Comparison</h3>
        <p className="text-xs text-gray-500 mt-1">
          Select two builds to compare their skills, items, and characteristics
        </p>
      </div>

      {/* Build selectors */}
      <div className="p-4 grid grid-cols-2 gap-4 border-b border-gray-800">
        <BuildSelector
          builds={builds}
          selectedId={build1Id}
          onSelect={setBuild1Id}
          label="Build 1"
          color="blue"
        />
        <BuildSelector
          builds={builds}
          selectedId={build2Id}
          onSelect={setBuild2Id}
          label="Build 2"
          color="purple"
        />
      </div>

      {/* Comparison content */}
      {hasBothBuilds ? (
        <div className="p-4 space-y-6">
          {/* Similarity score */}
          {similarityScore !== null && (
            <div className="flex items-center justify-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-400">Similarity:</span>
              <div className="flex-1 max-w-[200px] h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    similarityScore > 70 ? 'bg-green-500' :
                    similarityScore > 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${similarityScore}%` }}
                />
              </div>
              <span className={`text-lg font-bold ${
                similarityScore > 70 ? 'text-green-400' :
                similarityScore > 40 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {similarityScore}%
              </span>
            </div>
          )}

          {/* Basic stats comparison */}
          <div>
            <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Basic Info</h4>
            <ComparisonRow label="Name" values={[build1.name, build2.name]} />
            <ComparisonRow label="Tier" values={[build1.tier, build2.tier]} type="tier" highlight />
            <ComparisonRow label="Difficulty" values={[build1.difficulty, build2.difficulty]} type="difficulty" />
            <ComparisonRow label="Playstyle" values={[build1.playstyle, build2.playstyle]} highlight />
            <ComparisonRow label="Damage Type" values={[build1.damageType, build2.damageType]} />
            <ComparisonRow label="Source" values={[build1.source, build2.source]} highlight />
          </div>

          {/* Skills comparison */}
          <div>
            <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Skills</h4>
            <SkillComparison
              build1Skills={build1.skills}
              build2Skills={build2.skills}
            />
          </div>

          {/* Items comparison */}
          <div>
            <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Key Items</h4>
            <ItemComparison
              build1Items={build1.keyItems}
              build2Items={build2.keyItems}
            />
          </div>

          {/* Tags comparison */}
          <div>
            <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tags</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-wrap gap-1">
                {(build1.tags || []).map((tag, idx) => (
                  <span
                    key={idx}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      (build2.tags || []).includes(tag)
                        ? 'bg-green-900/50 text-green-300'
                        : 'bg-blue-900/50 text-blue-300'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {(build2.tags || []).map((tag, idx) => (
                  <span
                    key={idx}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      (build1.tags || []).includes(tag)
                        ? 'bg-green-900/50 text-green-300'
                        : 'bg-purple-900/50 text-purple-300'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Guide links */}
          <div className="flex gap-4 pt-4 border-t border-gray-800">
            {build1.guideUrl && (
              <a
                href={build1.guideUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2 bg-blue-900/30 text-blue-300 text-sm rounded hover:bg-blue-900/50"
              >
                Build 1 Guide
              </a>
            )}
            {build2.guideUrl && (
              <a
                href={build2.guideUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2 bg-purple-900/30 text-purple-300 text-sm rounded hover:bg-purple-900/50"
              >
                Build 2 Guide
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>Select two builds above to compare them</p>
        </div>
      )}
    </div>
  );
}

// Export helpers
export { BuildSelector, ComparisonRow, SkillComparison, ItemComparison };
