import { useEffect, useRef, useState, useCallback } from 'react';
import { useTreeRenderer } from './useTreeRenderer';
import { getTreeDataUrl, processTreeData, LEAGUE_VERSIONS, TREE_VARIANTS } from '../../utils/treeUtils';

export default function SkillTree({
  allocatedNodes = [],
  highlightedKeystones = [],
  ascendancyName = null,
  onNodeClick = null,
  onNodeHover = null,
  className = '',
  showTooltip = true,
  initialVersion = null
}) {
  const containerRef = useRef(null);
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // League version state
  const [selectedVersion, setSelectedVersion] = useState(initialVersion || 'master');
  const [selectedVariant, setSelectedVariant] = useState('default');
  const [showSettings, setShowSettings] = useState(false);

  // Fetch tree data when version changes
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Create cache key based on version and variant
        const cacheKey = `poe-tree-data-${selectedVersion}-${selectedVariant}`;

        // Try to fetch from cache first (sessionStorage)
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          if (!cancelled) {
            setTreeData(data);
            setLoading(false);
          }
          return;
        }

        // Fetch from GGG
        const url = getTreeDataUrl(selectedVersion, selectedVariant);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch tree data: ${response.status}`);
        }

        const rawData = await response.json();
        const processed = processTreeData(rawData, selectedVersion);

        // Cache for this session
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(processed));
        } catch (e) {
          // Storage might be full, that's okay
          console.warn('Could not cache tree data:', e);
        }

        if (!cancelled) {
          setTreeData(processed);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [selectedVersion, selectedVariant]);

  // Handle node hover
  const handleNodeHover = useCallback((node, screenPos) => {
    if (node) {
      setHoveredNode(node);
      setTooltipPos(screenPos);
    } else {
      setHoveredNode(null);
    }
    onNodeHover?.(node);
  }, [onNodeHover]);

  // Handle node click
  const handleNodeClick = useCallback((node) => {
    onNodeClick?.(node);
  }, [onNodeClick]);

  // Initialize the renderer
  useTreeRenderer({
    containerRef,
    treeData,
    allocatedNodes,
    highlightedKeystones,
    ascendancyName,
    onNodeHover: handleNodeHover,
    onNodeClick: handleNodeClick
  });

  // Get current league info
  const currentLeague = LEAGUE_VERSIONS.find(l => l.tag === selectedVersion || (selectedVersion === 'master' && l.isLatest));

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-[#0c0c14] ${className}`} style={{ minHeight: '500px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-diablo-orange mx-auto mb-4"></div>
          <p className="text-gray-400">Loading skill tree data...</p>
          <p className="text-gray-600 text-sm mt-2">
            {currentLeague ? `${currentLeague.name} (${currentLeague.version})` : 'Latest version'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-[#0c0c14] ${className}`} style={{ minHeight: '500px' }}>
        <div className="text-center text-red-400">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-semibold">Failed to load skill tree</p>
          <p className="text-sm mt-2">{error}</p>
          <button
            onClick={() => setSelectedVersion('master')}
            className="mt-4 px-4 py-2 bg-diablo-orange/20 hover:bg-diablo-orange/30 border border-diablo-orange/50 rounded text-diablo-orange"
          >
            Try Latest Version
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Version selector overlay */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a2e]/90 hover:bg-[#1a1a2e] border border-gray-700 rounded text-sm text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {currentLeague?.name || 'Latest'}
          <span className="text-xs text-gray-500">{currentLeague?.version || treeData?.version}</span>
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-14 left-4 z-30 bg-[#1a1a2e] border border-gray-700 rounded-lg shadow-xl p-4 min-w-[280px]">
          <h3 className="text-sm font-semibold text-white mb-3">Tree Version</h3>

          {/* League Version */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">League</label>
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="w-full bg-[#0f0f17] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="master">Latest (Master Branch)</option>
              {LEAGUE_VERSIONS.map(league => (
                <option key={league.tag} value={league.tag}>
                  {league.version} - {league.name}
                  {league.hasAlternateAscendancies ? ' ★' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Tree Variant */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Variant</label>
            <select
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value)}
              className="w-full bg-[#0f0f17] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              {TREE_VARIANTS.map(variant => (
                <option key={variant.id} value={variant.id}>
                  {variant.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {selectedVariant === 'alternate' && 'Features alternative ascendancy classes'}
              {selectedVariant === 'ruthless' && 'Ruthless league variant with modified passives'}
            </p>
          </div>

          {/* Info */}
          {currentLeague?.hasAlternateAscendancies && (
            <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded p-2">
              ★ This league features alternate ascendancy classes. Select "Alternate Ascendancies" variant to view them.
            </div>
          )}

          <button
            onClick={() => setShowSettings(false)}
            className="w-full mt-3 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="w-full bg-[#0c0c14]"
        style={{ height: '600px' }}
      />

      {/* Tooltip */}
      {showTooltip && hoveredNode && (
        <NodeTooltip
          node={hoveredNode}
          position={tooltipPos}
          isAllocated={allocatedNodes.includes(hoveredNode.id)}
        />
      )}

      {/* Controls overlay */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-black/50 px-2 py-1 rounded">
        Scroll to zoom • Drag to pan
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 right-4 text-sm bg-black/50 px-3 py-2 rounded">
        {allocatedNodes.length > 0 && (
          <div className="text-gray-400">
            <span className="text-diablo-orange font-semibold">{allocatedNodes.length}</span> points allocated
          </div>
        )}
        <div className="text-xs text-gray-500 mt-1">
          {Object.keys(treeData?.nodes || {}).length.toLocaleString()} nodes
        </div>
      </div>
    </div>
  );
}

// Tooltip component
function NodeTooltip({ node, position, isAllocated }) {
  if (!node) return null;

  const getNodeTypeLabel = () => {
    if (node.isKeystone) return 'Keystone';
    if (node.isNotable) return 'Notable';
    if (node.isMastery) return 'Mastery';
    if (node.isJewelSocket) return 'Jewel Socket';
    if (node.ascendancyName) return `Ascendancy (${node.ascendancyName})`;
    if (node.classStartIndex !== undefined) return 'Class Start';
    return 'Passive';
  };

  const getTypeColor = () => {
    if (node.isKeystone) return 'text-yellow-400';
    if (node.isNotable) return 'text-cyan-400';
    if (node.isMastery) return 'text-pink-400';
    if (node.isJewelSocket) return 'text-purple-400';
    if (node.ascendancyName) return 'text-orange-400';
    return 'text-green-400';
  };

  // Get attribute grants
  const attributeGrants = [];
  if (node.grantedStrength) attributeGrants.push(`+${node.grantedStrength} Strength`);
  if (node.grantedDexterity) attributeGrants.push(`+${node.grantedDexterity} Dexterity`);
  if (node.grantedIntelligence) attributeGrants.push(`+${node.grantedIntelligence} Intelligence`);

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: Math.min(position.x + 15, window.innerWidth - 320),
        top: Math.min(position.y + 15, window.innerHeight - 300),
        maxWidth: '300px'
      }}
    >
      <div className="bg-[#1a1a2e]/95 border border-gray-700 rounded-lg shadow-xl p-3">
        {/* Node name */}
        <div className="font-semibold text-white mb-1">{node.name || 'Passive Skill'}</div>

        {/* Node type badge */}
        <div className={`text-xs ${getTypeColor()} mb-2`}>
          {getNodeTypeLabel()}
          {isAllocated && <span className="ml-2 text-green-400">✓ Allocated</span>}
        </div>

        {/* Attribute grants */}
        {attributeGrants.length > 0 && (
          <div className="text-sm text-gray-300 mb-2">
            {attributeGrants.map((grant, idx) => (
              <div key={idx} className="text-xs text-blue-300">{grant}</div>
            ))}
          </div>
        )}

        {/* Stats */}
        {node.stats && node.stats.length > 0 && (
          <ul className="text-sm text-gray-300 space-y-0.5">
            {node.stats.slice(0, 8).map((stat, idx) => (
              <li key={idx} className="text-xs">• {stat}</li>
            ))}
            {node.stats.length > 8 && (
              <li className="text-xs text-gray-500">...and {node.stats.length - 8} more</li>
            )}
          </ul>
        )}

        {/* Flavour text for keystones */}
        {node.flavourText && (
          <div className="mt-2 text-xs italic text-amber-200/70 border-t border-gray-700 pt-2">
            "{node.flavourText}"
          </div>
        )}

        {/* Node ID for debugging */}
        <div className="mt-2 text-xs text-gray-600 border-t border-gray-800 pt-1">
          ID: {node.id}
        </div>
      </div>
    </div>
  );
}
