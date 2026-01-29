// Path of Building and skill tree URL parsing utilities

import pako from 'pako';

/**
 * Decode a PoE passive skill tree URL to extract allocated nodes
 * Supports official tree URLs and PoE Planner URLs
 */
export function decodeTreeUrl(url) {
  if (!url) return { nodes: [], ascendancy: null, classId: null };

  try {
    let encoded = '';

    // Extract encoded portion based on URL format
    if (url.includes('passive-skill-tree/')) {
      encoded = url.split('passive-skill-tree/')[1]?.split(/[?#]/)[0] || '';
    } else if (url.includes('/fullscreen/')) {
      encoded = url.split('/fullscreen/')[1]?.split(/[?#]/)[0] || '';
    } else if (url.includes('poe-planner/')) {
      // Maxroll PoE Planner format
      encoded = url.split('poe-planner/')[1]?.split(/[?#]/)[0] || '';
    } else if (url.includes('poeplanner.com')) {
      encoded = url.split('/').pop()?.split(/[?#]/)[0] || '';
    } else {
      // Try last path segment
      encoded = url.split('/').pop()?.split(/[?#]/)[0] || '';
    }

    if (!encoded) return { nodes: [], ascendancy: null, classId: null };

    // Decode base64url to base64
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(encoded.length + (4 - encoded.length % 4) % 4, '=');

    // Decode to bytes
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return parseTreeBytes(bytes);
  } catch (error) {
    console.warn('Failed to decode tree URL:', error);
    return { nodes: [], ascendancy: null, classId: null };
  }
}

/**
 * Parse the binary tree data (GGG format)
 */
function parseTreeBytes(bytes) {
  if (bytes.length < 6) return { nodes: [], ascendancy: null, classId: null };

  let offset = 0;

  // Version (4 bytes, big-endian)
  const version = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
  offset += 4;

  // Class ID (1 byte)
  const classId = bytes[offset];
  offset += 1;

  // Ascendancy ID (1 byte)
  const ascendancyId = bytes[offset];
  offset += 1;

  // Fullscreen flag (version 4+)
  if (version >= 4 && offset < bytes.length) {
    offset += 1;
  }

  // Node count (1 byte for version < 6, 2 bytes for version >= 6)
  let nodeCount = 0;
  if (version >= 6) {
    nodeCount = (bytes[offset] << 8) | bytes[offset + 1];
    offset += 2;
  } else {
    nodeCount = bytes[offset];
    offset += 1;
  }

  // Parse node IDs (2 bytes each, big-endian)
  const nodes = [];
  for (let i = 0; i < nodeCount && offset + 1 < bytes.length; i++) {
    const nodeId = (bytes[offset] << 8) | bytes[offset + 1];
    nodes.push(nodeId);
    offset += 2;
  }

  return {
    nodes,
    classId,
    ascendancyId,
    version,
  };
}

/**
 * Decode a Path of Building pastebin/code
 */
export function decodePobCode(code) {
  if (!code) return null;

  try {
    // Remove pastebin URL if present
    let encoded = code;
    if (code.includes('pastebin.com/')) {
      // Would need to fetch the pastebin content
      console.warn('Pastebin URLs require fetching - use raw code instead');
      return null;
    }

    // PoB codes are base64 encoded, then zlib compressed
    // Decode base64
    const binaryString = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Decompress with zlib
    const decompressed = pako.inflate(bytes, { to: 'string' });

    // Parse XML
    return parsePobXml(decompressed);
  } catch (error) {
    console.warn('Failed to decode PoB code:', error);
    return null;
  }
}

/**
 * Parse PoB XML content
 */
function parsePobXml(xml) {
  if (!xml) return null;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    // Extract build info
    const build = doc.querySelector('Build');
    const tree = doc.querySelector('Tree');
    const skills = doc.querySelector('Skills');
    const items = doc.querySelector('Items');

    const result = {
      className: build?.getAttribute('className') || null,
      ascendClassName: build?.getAttribute('ascendClassName') || null,
      level: parseInt(build?.getAttribute('level') || '1'),
      treeSpec: null,
      allocatedNodes: [],
      gems: [],
      equipment: [],
    };

    // Parse tree
    if (tree) {
      const spec = tree.querySelector('Spec');
      if (spec) {
        result.treeSpec = spec.getAttribute('treeVersion');
        const nodes = spec.getAttribute('nodes')?.split(',').map(n => parseInt(n)).filter(n => !isNaN(n)) || [];
        result.allocatedNodes = nodes;
      }
    }

    // Parse gems from skill groups
    if (skills) {
      const skillGroups = skills.querySelectorAll('Skill');
      skillGroups.forEach(group => {
        const gems = group.querySelectorAll('Gem');
        gems.forEach(gem => {
          result.gems.push({
            name: gem.getAttribute('nameSpec') || gem.getAttribute('skillId'),
            level: parseInt(gem.getAttribute('level') || '20'),
            quality: parseInt(gem.getAttribute('quality') || '0'),
            enabled: gem.getAttribute('enabled') !== 'false',
          });
        });
      });
    }

    // Parse equipment
    if (items) {
      const itemSlots = items.querySelectorAll('Item');
      itemSlots.forEach(item => {
        const text = item.textContent || '';
        const lines = text.trim().split('\n');
        if (lines.length > 0) {
          const rarity = lines.find(l => l.startsWith('Rarity:'))?.replace('Rarity: ', '') || 'Normal';
          const name = lines.find(l => !l.includes(':') && l.trim()) || 'Unknown';
          result.equipment.push({
            name: name.trim(),
            rarity,
            slot: item.getAttribute('id'),
          });
        }
      });
    }

    return result;
  } catch (error) {
    console.warn('Failed to parse PoB XML:', error);
    return null;
  }
}

/**
 * Generate a tree URL from allocated nodes
 */
export function encodeTreeUrl(nodes, classId = 0, ascendancyId = 0, version = 6) {
  const bytes = [];

  // Version (4 bytes)
  bytes.push((version >> 24) & 0xff);
  bytes.push((version >> 16) & 0xff);
  bytes.push((version >> 8) & 0xff);
  bytes.push(version & 0xff);

  // Class and ascendancy
  bytes.push(classId & 0xff);
  bytes.push(ascendancyId & 0xff);

  // Fullscreen flag (version 4+)
  if (version >= 4) {
    bytes.push(0);
  }

  // Node count
  if (version >= 6) {
    bytes.push((nodes.length >> 8) & 0xff);
    bytes.push(nodes.length & 0xff);
  } else {
    bytes.push(nodes.length & 0xff);
  }

  // Node IDs
  for (const nodeId of nodes) {
    bytes.push((nodeId >> 8) & 0xff);
    bytes.push(nodeId & 0xff);
  }

  // Encode to base64url
  const binary = String.fromCharCode(...bytes);
  const base64 = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `https://www.pathofexile.com/passive-skill-tree/${base64}`;
}

/**
 * Extract keystones from a list of allocated nodes
 */
export function extractKeystones(nodes, treeData) {
  if (!nodes || !treeData?.nodes) return [];

  return nodes
    .map(nodeId => treeData.nodes[nodeId.toString()])
    .filter(node => node?.isKeystone)
    .map(node => node.name);
}

/**
 * Calculate minimum path between nodes in the tree
 * Uses BFS to find shortest path
 */
export function findPath(startNodeId, endNodeId, treeData) {
  if (!treeData?.nodes) return [];

  const visited = new Set();
  const queue = [[startNodeId]];

  while (queue.length > 0) {
    const path = queue.shift();
    const currentId = path[path.length - 1];

    if (currentId === endNodeId) {
      return path;
    }

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const currentNode = treeData.nodes[currentId.toString()];
    if (!currentNode) continue;

    const neighbors = [...(currentNode.out || []), ...(currentNode.in || [])];
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        queue.push([...path, neighborId]);
      }
    }
  }

  return []; // No path found
}

/**
 * Get class starting node ID
 */
export function getClassStartNode(classId) {
  // Class start node IDs in the official tree
  const classStartNodes = {
    0: 47175, // Scion
    1: 50459, // Marauder
    2: 47867, // Ranger
    3: 58833, // Witch
    4: 44683, // Duelist
    5: 51198, // Templar
    6: 40633, // Shadow
  };
  return classStartNodes[classId] || null;
}

// Class name mapping
export const CLASS_NAMES = {
  0: 'Scion',
  1: 'Marauder',
  2: 'Ranger',
  3: 'Witch',
  4: 'Duelist',
  5: 'Templar',
  6: 'Shadow',
};

// Ascendancy mapping
export const ASCENDANCY_NAMES = {
  // Scion
  0: { 1: 'Ascendant' },
  // Marauder
  1: { 1: 'Juggernaut', 2: 'Berserker', 3: 'Chieftain' },
  // Ranger
  2: { 1: 'Warden', 2: 'Deadeye', 3: 'Pathfinder' },
  // Witch
  3: { 1: 'Occultist', 2: 'Elementalist', 3: 'Necromancer' },
  // Duelist
  4: { 1: 'Slayer', 2: 'Gladiator', 3: 'Champion' },
  // Templar
  5: { 1: 'Inquisitor', 2: 'Hierophant', 3: 'Guardian' },
  // Shadow
  6: { 1: 'Assassin', 2: 'Trickster', 3: 'Saboteur' },
};
