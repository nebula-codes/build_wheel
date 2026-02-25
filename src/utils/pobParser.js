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
/** Max decompressed size (5MB) to prevent decompression bombs */
const MAX_DECOMPRESSED_SIZE = 5 * 1024 * 1024;

export function decodePobCode(code) {
  if (!code) return null;

  try {
    // Remove pastebin URL if present
    let encoded = code.trim();
    if (encoded.includes('pastebin.com/')) {
      console.warn('Pastebin URLs require fetching - use raw code instead');
      return null;
    }

    // Validate base64 format (standard or URL-safe base64)
    if (!/^[A-Za-z0-9+/\-_=]+$/.test(encoded)) {
      console.warn('Invalid PoB code: contains non-base64 characters');
      return null;
    }

    if (encoded.length < 10) {
      console.warn('Invalid PoB code: too short');
      return null;
    }

    // PoB codes are base64 encoded, then zlib compressed
    // Decode base64
    const binaryString = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Decompress with zlib (with size limit)
    const decompressed = pako.inflate(bytes, { to: 'string' });

    if (decompressed.length > MAX_DECOMPRESSED_SIZE) {
      console.warn('PoB code decompressed data exceeds size limit');
      return null;
    }

    // Parse XML
    return parsePobXml(decompressed);
  } catch (error) {
    console.warn('Failed to decode PoB code:', error);
    return null;
  }
}

/**
 * Parse PoB XML content - Enhanced to support multiple specs/progression
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
      mainSocketGroup: parseInt(build?.getAttribute('mainSocketGroup') || '1'),
      // Multiple specs/progression stages
      specs: [],
      activeSpec: 0,
      // Gem link groups (organized by socket group)
      skillGroups: [],
      // All gems (flat list for compatibility)
      gems: [],
      // Items with full parsing
      equipment: [],
      // Item sets for different specs
      itemSets: [],
      // Legacy fields for compatibility
      treeSpec: null,
      allocatedNodes: [],
    };

    // Parse all tree specs (progression stages)
    if (tree) {
      const activeSpecAttr = tree.getAttribute('activeSpec');
      result.activeSpec = activeSpecAttr ? parseInt(activeSpecAttr) - 1 : 0; // Convert to 0-indexed

      const specs = tree.querySelectorAll('Spec');
      specs.forEach((spec, index) => {
        const title = spec.getAttribute('title') || `Spec ${index + 1}`;
        const treeVersion = spec.getAttribute('treeVersion');
        const nodesStr = spec.getAttribute('nodes') || '';
        const nodes = nodesStr.split(',').map(n => parseInt(n)).filter(n => !isNaN(n));

        // Parse masteries if present
        const masteryEffects = spec.getAttribute('masteryEffects') || '';

        result.specs.push({
          index,
          title,
          treeVersion,
          nodes,
          masteryEffects,
          nodeCount: nodes.length,
        });
      });

      // Set legacy fields from active spec
      if (result.specs.length > 0) {
        const activeSpec = result.specs[result.activeSpec] || result.specs[0];
        result.treeSpec = activeSpec.treeVersion;
        result.allocatedNodes = activeSpec.nodes;
      }
    }

    // Parse skill groups (gem links)
    if (skills) {
      const activeSkillSet = parseInt(skills.getAttribute('activeSkillSet') || '1') - 1;
      const skillSets = skills.querySelectorAll('SkillSet');

      // If there are skill sets, parse them; otherwise parse direct Skill elements
      if (skillSets.length > 0) {
        skillSets.forEach((skillSet, setIndex) => {
          const setTitle = skillSet.getAttribute('title') || `Skill Set ${setIndex + 1}`;
          const groups = parseSkillGroups(skillSet, setIndex === activeSkillSet);
          result.skillGroups.push({
            setIndex,
            title: setTitle,
            isActive: setIndex === activeSkillSet,
            groups,
          });
        });
      } else {
        // No skill sets, parse Skill elements directly
        const groups = parseSkillGroups(skills, true);
        result.skillGroups.push({
          setIndex: 0,
          title: 'Main',
          isActive: true,
          groups,
        });
      }

      // Flatten gems for compatibility (from active skill set)
      const activeSet = result.skillGroups.find(s => s.isActive) || result.skillGroups[0];
      if (activeSet) {
        activeSet.groups.forEach(group => {
          group.gems.forEach(gem => {
            result.gems.push(gem);
          });
        });
      }
    }

    // Parse items with full details
    if (items) {
      const activeItemSet = parseInt(items.getAttribute('activeItemSet') || '1') - 1;

      // Parse item sets
      const itemSetElements = items.querySelectorAll('ItemSet');
      if (itemSetElements.length > 0) {
        itemSetElements.forEach((itemSet, setIndex) => {
          const setTitle = itemSet.getAttribute('title') || `Item Set ${setIndex + 1}`;
          const slots = parseItemSlots(itemSet);
          result.itemSets.push({
            setIndex,
            title: setTitle,
            isActive: setIndex === activeItemSet,
            slots,
          });
        });
      }

      // Parse all items (they're referenced by ID)
      const itemElements = items.querySelectorAll('Item');
      itemElements.forEach(item => {
        const parsed = parseItemElement(item);
        if (parsed) {
          result.equipment.push(parsed);
        }
      });

      // If we have item sets, map items to the active set's slots
      if (result.itemSets.length > 0) {
        const activeSet = result.itemSets.find(s => s.isActive) || result.itemSets[0];
        if (activeSet) {
          // Map slot references to actual items
          activeSet.slots.forEach(slot => {
            const item = result.equipment.find(e => e.id === slot.itemId);
            if (item) {
              item.slot = slot.slotName;
            }
          });
        }
      }
    }

    return result;
  } catch (error) {
    console.warn('Failed to parse PoB XML:', error);
    return null;
  }
}

/**
 * Parse skill groups from a parent element
 */
function parseSkillGroups(parent, isActive) {
  const groups = [];
  const skillElements = parent.querySelectorAll(':scope > Skill');

  skillElements.forEach((group, groupIndex) => {
    const label = group.getAttribute('label') || '';
    const slot = group.getAttribute('slot') || '';
    const slotEnabled = group.getAttribute('slotEnabled') !== 'false';
    const enabled = group.getAttribute('enabled') !== 'false';
    const mainActiveSkill = parseInt(group.getAttribute('mainActiveSkill') || '1');

    const gems = [];
    const gemElements = group.querySelectorAll('Gem');

    gemElements.forEach((gem, gemIndex) => {
      const gemData = {
        name: gem.getAttribute('nameSpec') || gem.getAttribute('skillId') || '',
        level: parseInt(gem.getAttribute('level') || '20'),
        quality: parseInt(gem.getAttribute('quality') || '0'),
        qualityId: gem.getAttribute('qualityId') || 'Default',
        enabled: gem.getAttribute('enabled') !== 'false',
        skillId: gem.getAttribute('skillId') || '',
        gemId: gem.getAttribute('gemId') || '',
        isSupport: isGemSupport(gem.getAttribute('nameSpec') || gem.getAttribute('skillId') || ''),
        isMainSkill: gemIndex + 1 === mainActiveSkill && !isGemSupport(gem.getAttribute('nameSpec') || ''),
      };
      gems.push(gemData);
    });

    // Determine socket color pattern based on gems
    const socketColors = gems.map(g => getGemColor(g.name)).join('');

    groups.push({
      groupIndex,
      label: label || `Group ${groupIndex + 1}`,
      slot,
      slotEnabled,
      enabled,
      mainActiveSkill,
      gems,
      socketColors,
      linkCount: gems.length,
      isActive,
    });
  });

  return groups;
}

/**
 * Parse item slots from an ItemSet element
 */
function parseItemSlots(itemSet) {
  const slots = [];
  const slotElements = itemSet.querySelectorAll('Slot');

  slotElements.forEach(slot => {
    const slotName = slot.getAttribute('name') || '';
    const itemId = slot.getAttribute('itemId') || '';

    if (slotName && itemId) {
      slots.push({
        slotName,
        itemId,
      });
    }
  });

  return slots;
}

/**
 * Parse a single item element
 */
function parseItemElement(item) {
  const text = item.textContent || '';
  const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l);

  if (lines.length === 0) return null;

  const id = item.getAttribute('id') || '';

  // Parse item properties
  let rarity = 'Normal';
  let name = '';
  let baseName = '';
  let itemLevel = 0;
  let sockets = '';
  const mods = [];
  const implicitMods = [];

  let parsingSection = 'header';

  lines.forEach((line, idx) => {
    if (line.startsWith('Rarity:')) {
      rarity = line.replace('Rarity:', '').trim();
    } else if (line.startsWith('Item Level:')) {
      itemLevel = parseInt(line.replace('Item Level:', '').trim()) || 0;
    } else if (line.startsWith('Sockets:')) {
      sockets = line.replace('Sockets:', '').trim();
    } else if (line.startsWith('Implicits:')) {
      parsingSection = 'implicit';
    } else if (line === '{crafted}' || line === '{fractured}' || line === '{tags:}') {
      // Skip mod tags
    } else if (!line.includes(':') && parsingSection === 'header' && !name) {
      // First non-property line is the name
      name = line;
    } else if (!line.includes(':') && parsingSection === 'header' && name && !baseName) {
      // Second non-property line might be base name
      baseName = line;
    } else if (parsingSection === 'implicit' && !line.startsWith('{')) {
      implicitMods.push(line);
    } else if (!line.includes(':') && !line.startsWith('{') && line.length > 2) {
      // Could be a mod
      if (parsingSection !== 'implicit') {
        mods.push(line);
      }
    }
  });

  // For unique items, the first line after rarity is the unique name, second is base
  // For rare items, first is the rare name, second is base
  if (!baseName && rarity === 'Unique') {
    // Try to identify base from common unique naming
    baseName = name;
  }

  return {
    id,
    name: name || 'Unknown Item',
    baseName: baseName || name,
    rarity,
    itemLevel,
    sockets,
    implicitMods,
    mods: mods.slice(0, 10), // Limit mods to prevent huge data
    slot: '', // Will be filled in by slot mapping
  };
}

/**
 * Check if a gem name indicates it's a support gem
 */
function isGemSupport(name) {
  if (!name) return false;
  const supportIndicators = [
    'Support',
    ' of ', // "Cast on Critical Strike", etc. but could be support
  ];
  const definiteSupports = [
    'Increased', 'Added', 'Greater', 'Lesser', 'Faster', 'Slower',
    'Awakened', 'Empower', 'Enlighten', 'Enhance',
  ];

  if (supportIndicators.some(ind => name.includes(ind))) return true;
  if (definiteSupports.some(s => name.startsWith(s + ' '))) return true;

  return false;
}

/**
 * Get gem socket color based on gem name/type
 */
function getGemColor(name) {
  if (!name) return 'W';

  // Strength (Red) gems
  const redKeywords = ['Slam', 'Strike', 'Melee', 'Fortify', 'Determination', 'Vitality', 'Anger', 'Pride'];
  // Dexterity (Green) gems
  const greenKeywords = ['Arrow', 'Shot', 'Evasion', 'Grace', 'Haste', 'Projectile', 'Trap', 'Mine'];
  // Intelligence (Blue) gems
  const blueKeywords = ['Spell', 'Curse', 'Aura', 'Discipline', 'Clarity', 'Wrath', 'Zealotry'];

  const lowerName = name.toLowerCase();

  if (redKeywords.some(k => lowerName.includes(k.toLowerCase()))) return 'R';
  if (greenKeywords.some(k => lowerName.includes(k.toLowerCase()))) return 'G';
  if (blueKeywords.some(k => lowerName.includes(k.toLowerCase()))) return 'B';

  return 'W'; // White/wildcard
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
