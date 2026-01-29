import { useState } from 'react';
import { decodeTreeUrl, decodePobCode, CLASS_NAMES, ASCENDANCY_NAMES } from '../../utils/pobParser';
import { GemBadge } from '../GemLinks/GemLinks';
import { UniqueItem } from '../ItemDisplay/ItemDisplay';

/**
 * PoB code/URL input component for build visualization
 */
export default function PoBImport({ onImport, onViewTree, className = '' }) {
  const [input, setInput] = useState('');
  const [parsedBuild, setParsedBuild] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleParse = async () => {
    if (!input.trim()) {
      setError('Please enter a PoB code or skill tree URL');
      return;
    }

    setLoading(true);
    setError(null);
    setParsedBuild(null);

    try {
      const trimmed = input.trim();

      // Check if it's a tree URL
      if (trimmed.includes('pathofexile.com') || trimmed.includes('poe-planner') || trimmed.includes('poeplanner')) {
        const treeData = decodeTreeUrl(trimmed);

        if (treeData.nodes.length === 0) {
          throw new Error('Could not parse any nodes from the URL');
        }

        setParsedBuild({
          type: 'tree',
          nodes: treeData.nodes,
          classId: treeData.classId,
          ascendancyId: treeData.ascendancyId,
          className: CLASS_NAMES[treeData.classId] || 'Unknown',
          ascendancyName: ASCENDANCY_NAMES[treeData.classId]?.[treeData.ascendancyId] || 'None',
          url: trimmed,
        });
      }
      // Check if it's a PoB code (base64-ish string)
      else if (trimmed.length > 50 && !trimmed.includes(' ')) {
        const pobData = decodePobCode(trimmed);

        if (!pobData) {
          throw new Error('Could not parse PoB code. Make sure you copied the full code.');
        }

        setParsedBuild({
          type: 'pob',
          ...pobData,
        });
      }
      // Could be a pastebin URL
      else if (trimmed.includes('pastebin.com')) {
        throw new Error('Pastebin URLs are not directly supported. Please copy the raw PoB code from the pastebin page.');
      }
      else {
        throw new Error('Input not recognized. Please enter a valid skill tree URL or PoB code.');
      }
    } catch (err) {
      setError(err.message || 'Failed to parse input');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTree = () => {
    if (parsedBuild && onViewTree) {
      onViewTree({
        allocatedNodes: parsedBuild.nodes || parsedBuild.allocatedNodes || [],
        className: parsedBuild.className,
        ascendancyName: parsedBuild.ascendancyName || parsedBuild.ascendClassName,
      });
    }
  };

  const handleImport = () => {
    if (parsedBuild && onImport) {
      onImport(parsedBuild);
    }
  };

  return (
    <div className={`bg-gray-900/50 rounded-lg border border-gray-800 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-white">Import Build</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Paste a Path of Building code or skill tree URL to visualize it
        </p>
      </div>

      {/* Input area */}
      <div className="p-4 space-y-4">
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
            PoB Code or Tree URL
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your PoB code or pathofexile.com/passive-skill-tree/... URL here"
            className="w-full h-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none resize-none font-mono"
          />
        </div>

        {/* Parse button */}
        <button
          onClick={handleParse}
          disabled={loading || !input.trim()}
          className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Parsing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Parse Build
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Parsed result */}
        {parsedBuild && (
          <div className="border-t border-gray-800 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">Parsed Build</h4>
              <span className="text-xs px-2 py-0.5 bg-green-900/50 text-green-400 rounded">
                {parsedBuild.type === 'tree' ? 'Tree URL' : 'PoB Code'}
              </span>
            </div>

            {/* Build info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/50 rounded p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Class</div>
                <div className="text-sm text-white">
                  {parsedBuild.className || parsedBuild.className || 'Unknown'}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ascendancy</div>
                <div className="text-sm text-white">
                  {parsedBuild.ascendancyName || parsedBuild.ascendClassName || 'None'}
                </div>
              </div>
              {parsedBuild.level && (
                <div className="bg-gray-800/50 rounded p-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Level</div>
                  <div className="text-sm text-white">{parsedBuild.level}</div>
                </div>
              )}
              <div className="bg-gray-800/50 rounded p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nodes</div>
                <div className="text-sm text-white">
                  {(parsedBuild.nodes || parsedBuild.allocatedNodes || []).length} allocated
                </div>
              </div>
            </div>

            {/* Gems from PoB */}
            {parsedBuild.gems && parsedBuild.gems.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  Gems ({parsedBuild.gems.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {parsedBuild.gems.filter(g => g.enabled).slice(0, 12).map((gem, idx) => (
                    <GemBadge key={idx} name={gem.name} size="xs" />
                  ))}
                  {parsedBuild.gems.filter(g => g.enabled).length > 12 && (
                    <span className="text-xs text-gray-500 px-2 py-1">
                      +{parsedBuild.gems.filter(g => g.enabled).length - 12} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Equipment from PoB */}
            {parsedBuild.equipment && parsedBuild.equipment.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  Equipment ({parsedBuild.equipment.length})
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {parsedBuild.equipment.filter(e => e.rarity === 'Unique').slice(0, 6).map((item, idx) => (
                    <UniqueItem key={idx} name={item.name} />
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              {onViewTree && (
                <button
                  onClick={handleViewTree}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  View Skill Tree
                </button>
              )}
              {onImport && (
                <button
                  onClick={handleImport}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  Save Build
                </button>
              )}
            </div>
          </div>
        )}

        {/* Help text */}
        <div className="text-xs text-gray-600 space-y-1">
          <p>Supported formats:</p>
          <ul className="list-disc list-inside text-gray-500 space-y-0.5">
            <li>Official tree URL (pathofexile.com/passive-skill-tree/...)</li>
            <li>PoE Planner URL (poeplanner.com/...)</li>
            <li>Path of Building export code (base64 string)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
