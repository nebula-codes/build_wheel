#!/usr/bin/env node
/* eslint-env node */
// Script to fetch and process PoE skill tree data from GGG's official repository

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '../src/data/poe-tree');

// GGG's official skill tree data URL
const TREE_DATA_URL = 'https://raw.githubusercontent.com/grindinggear/skilltree-export/master/data.json';

async function fetchTreeData() {
  console.log('Fetching PoE skill tree data from GGG repository...');

  try {
    const response = await fetch(TREE_DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract and process only what we need for rendering
    const processedData = processTreeData(data);

    // Ensure output directory exists
    mkdirSync(OUTPUT_DIR, { recursive: true });

    // Write the full tree data
    const outputPath = join(OUTPUT_DIR, 'tree-data.json');
    writeFileSync(outputPath, JSON.stringify(processedData, null, 2));
    console.log(`Tree data saved to: ${outputPath}`);

    // Create a minimal version for faster loading
    const minimalData = createMinimalTreeData(processedData);
    const minimalPath = join(OUTPUT_DIR, 'tree-data.min.json');
    writeFileSync(minimalPath, JSON.stringify(minimalData));
    console.log(`Minimal tree data saved to: ${minimalPath}`);

    // Print stats
    console.log('\nTree Statistics:');
    console.log(`- Total nodes: ${Object.keys(processedData.nodes).length}`);
    console.log(`- Total groups: ${Object.keys(processedData.groups).length}`);
    console.log(`- Classes: ${processedData.classes.map(c => c.name).join(', ')}`);

  } catch (error) {
    console.error('Failed to fetch tree data:', error.message);
    process.exit(1);
  }
}

function processTreeData(raw) {
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
    // Skip proxy nodes and hidden nodes
    if (node.isProxy || node.hidden) continue;

    nodes[nodeId] = {
      id: parseInt(nodeId),
      name: node.name || node.dn || '',
      icon: node.icon,
      stats: node.stats || node.sd || [],
      group: node.group || node.g,
      orbit: node.orbit !== undefined ? node.orbit : node.o,
      orbitIndex: node.orbitIndex !== undefined ? node.orbitIndex : node.oidx,
      out: node.out || [],
      in: node.in || [],
      // Node types
      isKeystone: node.isKeystone || node.ks || false,
      isNotable: node.isNotable || node.not || false,
      isMastery: node.isMastery || node.m || false,
      isJewelSocket: node.isJewelSocket || false,
      isAscendancyStart: node.isAscendancyStart || false,
      isMultipleChoice: node.isMultipleChoice || false,
      isMultipleChoiceOption: node.isMultipleChoiceOption || false,
      // Ascendancy info
      ascendancyName: node.ascendancyName,
      // Class start
      classStartIndex: node.classStartIndex,
      // Flavour
      flavourText: node.flavourText
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
      flavourText: asc.flavourText
    }))
  }));

  // Constants for orbital calculations
  const constants = raw.constants || {
    skillsPerOrbit: [1, 6, 16, 16, 40],
    orbitRadii: [0, 82, 162, 335, 493]
  };

  return {
    nodes,
    groups,
    classes,
    constants,
    bounds: {
      minX: raw.min_x,
      maxX: raw.max_x,
      minY: raw.min_y,
      maxY: raw.max_y
    },
    imageRoot: raw.imageRoot || 'https://web.poecdn.com/image/',
    version: raw.tree || 'unknown'
  };
}

function createMinimalTreeData(data) {
  // Create a version with just position and connection data for fast rendering
  const nodes = {};

  for (const [id, node] of Object.entries(data.nodes)) {
    nodes[id] = {
      g: node.group,
      o: node.orbit,
      oi: node.orbitIndex,
      out: node.out,
      t: getNodeType(node) // 0=small, 1=notable, 2=keystone, 3=mastery, 4=jewel, 5=ascendancy
    };
  }

  return {
    nodes,
    groups: data.groups,
    constants: data.constants,
    bounds: data.bounds
  };
}

function getNodeType(node) {
  if (node.isKeystone) return 2;
  if (node.isNotable) return 1;
  if (node.isMastery) return 3;
  if (node.isJewelSocket) return 4;
  if (node.ascendancyName) return 5;
  return 0; // small passive
}

fetchTreeData();
