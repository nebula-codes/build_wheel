import { useEffect, useRef, useState, useCallback } from 'react';
import { useTreeRenderer } from './useTreeRenderer';
import { TREE_DATA_URL, processTreeData } from '../../utils/treeUtils';

export default function SkillTree({
  allocatedNodes = [],
  highlightedKeystones = [],
  ascendancyName = null,
  onNodeClick = null,
  onNodeHover = null,
  className = '',
  showTooltip = true
}) {
  const containerRef = useRef(null);
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Fetch tree data on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch from cache first (sessionStorage)
        const cached = sessionStorage.getItem('poe-tree-data');
        if (cached) {
          const data = JSON.parse(cached);
          if (!cancelled) {
            setTreeData(data);
            setLoading(false);
          }
          return;
        }

        // Fetch from GGG
        const response = await fetch(TREE_DATA_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch tree data: ${response.status}`);
        }

        const rawData = await response.json();
        const processed = processTreeData(rawData);

        // Cache for this session
        try {
          sessionStorage.setItem('poe-tree-data', JSON.stringify(processed));
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
  }, []);

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

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-[#0c0c14] ${className}`} style={{ minHeight: '500px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-diablo-orange mx-auto mb-4"></div>
          <p className="text-gray-400">Loading skill tree data...</p>
          <p className="text-gray-600 text-sm mt-2">Fetching from Path of Exile servers</p>
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
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-diablo-orange/20 hover:bg-diablo-orange/30 border border-diablo-orange/50 rounded text-diablo-orange"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
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
      {allocatedNodes.length > 0 && (
        <div className="absolute top-4 right-4 text-sm text-gray-400 bg-black/50 px-3 py-2 rounded">
          <span className="text-diablo-orange font-semibold">{allocatedNodes.length}</span> points allocated
        </div>
      )}
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

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: position.x + 15,
        top: position.y + 15,
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

        {/* Stats */}
        {node.stats && node.stats.length > 0 && (
          <ul className="text-sm text-gray-300 space-y-0.5">
            {node.stats.slice(0, 5).map((stat, idx) => (
              <li key={idx} className="text-xs">• {stat}</li>
            ))}
            {node.stats.length > 5 && (
              <li className="text-xs text-gray-500">...and {node.stats.length - 5} more</li>
            )}
          </ul>
        )}

        {/* Flavour text for keystones */}
        {node.flavourText && (
          <div className="mt-2 text-xs italic text-amber-200/70 border-t border-gray-700 pt-2">
            "{node.flavourText}"
          </div>
        )}
      </div>
    </div>
  );
}
