// Utility functions for PoE skill tree data processing

// Base URL for GGG's skill tree data (JSON files still fetched remotely)
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/grindinggear/skilltree-export';

// Local path for bundled sprite assets (avoids CORS issues)
const LOCAL_ASSETS_PATH = '/assets/skill-tree/';

// Available league versions with their details
export const LEAGUE_VERSIONS = [
  { version: '3.27.0g', name: 'Legacy of Phrecia 2', tag: '3.27.0g', isLatest: true },
  { version: '3.27.0', name: 'Keepers of the Flame', tag: '3.27.0' },
  { version: '3.26.0', name: 'Secrets of the Atlas', tag: '3.26.0' },
  { version: '3.25.3d', name: 'Legacy of Phrecia', tag: '3.25.3d', hasAlternateAscendancies: true },
  { version: '3.25.0', name: 'Settlers of Kalguur', tag: '3.25.0' },
  { version: '3.24.0', name: 'Necropolis', tag: '3.24.0' },
  { version: '3.23.0', name: 'Affliction', tag: '3.23.0' },
];

// Tree variants available
export const TREE_VARIANTS = [
  { id: 'default', name: 'Standard', file: 'data.json' },
  { id: 'alternate', name: 'Alternate Ascendancies', file: 'alternate.json' },
  { id: 'ruthless', name: 'Ruthless', file: 'ruthless.json' },
];

/**
 * Get the URL for tree data based on version and variant
 */
export function getTreeDataUrl(version = 'master', variant = 'default') {
  const variantInfo = TREE_VARIANTS.find(v => v.id === variant) || TREE_VARIANTS[0];
  return `${GITHUB_RAW_BASE}/${version}/${variantInfo.file}`;
}

/**
 * Get the URL for sprite assets
 */
export function getSpriteUrl(version = 'master', spritePath) {
  return `${GITHUB_RAW_BASE}/${version}/assets/${spritePath}`;
}

// Default tree data URL (latest)
export const TREE_DATA_URL = getTreeDataUrl('master');

// Orbit configuration - how many nodes can fit in each orbit ring
export const SKILLS_PER_ORBIT = [1, 6, 16, 16, 40];
export const ORBIT_RADII = [0, 82, 162, 335, 493];

/**
 * Calculate the world position of a node based on its group and orbit
 */
export function getNodePosition(node, group, constants = { skillsPerOrbit: SKILLS_PER_ORBIT, orbitRadii: ORBIT_RADII }) {
  if (!group) return { x: 0, y: 0 };

  const orbit = node.orbit ?? node.o ?? 0;
  const orbitIndex = node.orbitIndex ?? node.oi ?? node.oidx ?? 0;

  const radius = constants.orbitRadii[orbit] || 0;
  const nodesInOrbit = constants.skillsPerOrbit[orbit] || 1;
  const angle = (2 * Math.PI * orbitIndex) / nodesInOrbit;

  return {
    x: group.x + radius * Math.sin(angle),
    y: group.y - radius * Math.cos(angle)
  };
}

/**
 * Get node type for rendering (determines size and style)
 */
export function getNodeType(node) {
  if (node.isKeystone || node.ks) return 'keystone';
  if (node.isNotable || node.not) return 'notable';
  if (node.isMastery || node.m) return 'mastery';
  if (node.isJewelSocket) return 'jewel';
  if (node.ascendancyName) return 'ascendancy';
  if (node.classStartIndex !== undefined) return 'classStart';
  return 'small';
}

/**
 * Get node radius based on type
 */
export function getNodeRadius(nodeType) {
  switch (nodeType) {
    case 'keystone': return 40;
    case 'notable': return 25;
    case 'mastery': return 30;
    case 'jewel': return 35;
    case 'ascendancy': return 20;
    case 'classStart': return 50;
    case 'small':
    default: return 15;
  }
}

/**
 * Get node color based on type and allocation state
 */
export function getNodeColor(nodeType, isAllocated) {
  const colors = {
    keystone: { allocated: 0xffd700, unallocated: 0x8b7355 },
    notable: { allocated: 0x00bfff, unallocated: 0x4a6278 },
    mastery: { allocated: 0xff69b4, unallocated: 0x6b4a5e },
    jewel: { allocated: 0x9932cc, unallocated: 0x4a3a5e },
    ascendancy: { allocated: 0xff6b35, unallocated: 0x5e3a2e },
    classStart: { allocated: 0xffffff, unallocated: 0x888888 },
    small: { allocated: 0x90ee90, unallocated: 0x3a4a3a }
  };

  const nodeColors = colors[nodeType] || colors.small;
  return isAllocated ? nodeColors.allocated : nodeColors.unallocated;
}

/**
 * Decode a PoE passive tree URL to get allocated node IDs
 * Format: base64url encoded binary data per GGG spec
 */
export function decodePassiveTreeUrl(url) {
  if (!url) return [];

  try {
    // Extract the encoded part from URL
    // Formats:
    // - pathofexile.com/passive-skill-tree/XXXXXXXXX
    // - poe.ninja: encoded in different format
    // - Maxroll: uses their own planner format

    // Try to find the encoded portion
    let encoded = '';

    if (url.includes('passive-skill-tree/')) {
      encoded = url.split('passive-skill-tree/')[1]?.split('?')[0] || '';
    } else if (url.includes('/fullscreen/')) {
      encoded = url.split('/fullscreen/')[1]?.split('?')[0] || '';
    } else {
      // Just try the last path segment
      encoded = url.split('/').pop()?.split('?')[0] || '';
    }

    if (!encoded) return [];

    // Convert base64url to base64
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');

    // Decode base64 to binary
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Parse the binary format (per GGG spec)
    return parsePassiveTreeBytes(bytes);
  } catch (error) {
    console.warn('Failed to decode passive tree URL:', error);
    return [];
  }
}

/**
 * Parse the binary passive tree data per GGG specification
 */
function parsePassiveTreeBytes(bytes) {
  if (bytes.length < 6) return [];

  const nodeIds = [];
  let offset = 0;

  // Version (4 bytes)
  const version = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
  offset += 4;

  // Class (1 byte) - read but not used in output
  offset += 1;

  // Ascendancy (1 byte) - read but not used in output
  offset += 1;

  // Full screen flag (1 byte) - if present
  if (version >= 4) {
    offset += 1;
  }

  // Number of nodes (1 byte)
  const nodeCount = bytes[offset];
  offset += 1;

  // Node IDs (2 bytes each, big-endian)
  for (let i = 0; i < nodeCount && offset + 1 < bytes.length; i++) {
    const nodeId = (bytes[offset] << 8) | bytes[offset + 1];
    nodeIds.push(nodeId);
    offset += 2;
  }

  return nodeIds;
}

/**
 * Process raw GGG tree data into a renderable format
 */
export function processTreeData(raw, leagueVersion = 'master') {
  const nodes = {};
  const groups = {};

  // Process groups
  for (const [groupId, group] of Object.entries(raw.groups || {})) {
    groups[groupId] = {
      x: group.x,
      y: group.y,
      orbits: group.orbits || [],
      nodes: group.nodes || [],
      background: group.background
    };
  }

  // Process nodes
  for (const [nodeId, node] of Object.entries(raw.nodes || {})) {
    // Skip proxy and hidden nodes
    if (node.isProxy || node.hidden) continue;

    nodes[nodeId] = {
      id: parseInt(nodeId),
      name: node.name || node.dn || '',
      icon: node.icon,
      activeIcon: node.activeIcon,
      inactiveIcon: node.inactiveIcon,
      activeEffectImage: node.activeEffectImage,
      stats: node.stats || node.sd || [],
      group: node.group || node.g,
      orbit: node.orbit ?? node.o ?? 0,
      orbitIndex: node.orbitIndex ?? node.oidx ?? node.oi ?? 0,
      out: node.out || [],
      in: node.in || [],
      isKeystone: node.isKeystone || node.ks || false,
      isNotable: node.isNotable || node.not || false,
      isMastery: node.isMastery || node.m || false,
      isJewelSocket: node.isJewelSocket || false,
      isAscendancyStart: node.isAscendancyStart || false,
      isMultipleChoice: node.isMultipleChoice || false,
      isMultipleChoiceOption: node.isMultipleChoiceOption || false,
      ascendancyName: node.ascendancyName,
      classStartIndex: node.classStartIndex,
      flavourText: node.flavourText,
      recipe: node.recipe, // For masteries
      grantedStrength: node.grantedStrength,
      grantedDexterity: node.grantedDexterity,
      grantedIntelligence: node.grantedIntelligence,
      grantedPassivePoints: node.grantedPassivePoints
    };
  }

  // Extract class information
  const classes = (raw.classes || []).map(cls => ({
    name: cls.name,
    baseStr: cls.base_str,
    baseDex: cls.base_dex,
    baseInt: cls.base_int,
    ascendancies: (cls.ascendancies || []).map(asc => ({
      id: asc.id,
      name: asc.name,
      flavourText: asc.flavourText,
      flavourTextColour: asc.flavourTextColour
    }))
  }));

  // Constants for orbital calculations
  const constants = raw.constants || {
    skillsPerOrbit: SKILLS_PER_ORBIT,
    orbitRadii: ORBIT_RADII
  };

  // Process sprite information
  const sprites = {
    skillSprites: raw.skillSprites || {},
    assets: raw.assets || {},
    imageZoomLevels: raw.imageZoomLevels || [0.1246, 0.2109, 0.2972, 0.3835]
  };

  return {
    nodes,
    groups,
    classes,
    constants,
    sprites,
    bounds: {
      minX: raw.min_x || -10000,
      maxX: raw.max_x || 10000,
      minY: raw.min_y || -10000,
      maxY: raw.max_y || 10000
    },
    imageRoot: raw.imageRoot || 'https://web.poecdn.com/image/',
    assetsRoot: LOCAL_ASSETS_PATH,
    version: raw.tree || 'unknown',
    leagueVersion
  };
}

/**
 * Find the path between connected nodes (for highlighting allocated paths)
 */
export function findAllocatedPaths(nodes, allocatedNodeIds) {
  const allocatedSet = new Set(allocatedNodeIds.map(id => id.toString()));
  const connections = [];

  for (const nodeId of allocatedNodeIds) {
    const node = nodes[nodeId.toString()];
    if (!node) continue;

    // Check outgoing connections
    for (const outId of node.out || []) {
      if (allocatedSet.has(outId.toString())) {
        connections.push({
          from: nodeId,
          to: outId
        });
      }
    }
  }

  return connections;
}

/**
 * Get ascendancy nodes for a specific ascendancy class
 */
export function getAscendancyNodes(nodes, ascendancyName) {
  return Object.values(nodes).filter(node =>
    node.ascendancyName === ascendancyName
  );
}

/**
 * Calculate bounds for a subset of nodes (e.g., just ascendancy)
 */
export function calculateNodeBounds(nodes, groups, constants) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const node of Object.values(nodes)) {
    const group = groups[node.group];
    if (!group) continue;

    const pos = getNodePosition(node, group, constants);
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y);
  }

  return { minX, maxX, minY, maxY };
}
