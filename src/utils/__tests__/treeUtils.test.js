import { describe, it, expect } from 'vitest';
import {
  getNodePosition,
  getNodeType,
  getNodeRadius,
  getNodeColor,
  SKILLS_PER_ORBIT,
  ORBIT_RADII,
  findAllocatedPaths,
  getAscendancyNodes,
  calculateNodeBounds,
  LEAGUE_VERSIONS,
  TREE_VARIANTS,
} from '../treeUtils';

describe('getNodePosition', () => {
  const group = { x: 100, y: 200 };

  it('returns group position for orbit 0', () => {
    const node = { orbit: 0, orbitIndex: 0 };
    const pos = getNodePosition(node, group);
    expect(pos.x).toBe(100);
    expect(pos.y).toBe(200);
  });

  it('returns { 0, 0 } for null group', () => {
    const node = { orbit: 0, orbitIndex: 0 };
    const pos = getNodePosition(node, null);
    expect(pos).toEqual({ x: 0, y: 0 });
  });

  it('calculates correct position for orbit 1, index 0 (top)', () => {
    const node = { orbit: 1, orbitIndex: 0 };
    const pos = getNodePosition(node, group);
    // orbit 1: radius 82, 6 nodes, angle = 0 => sin(0)=0, cos(0)=1
    expect(pos.x).toBeCloseTo(100); // group.x + 82 * sin(0)
    expect(pos.y).toBeCloseTo(200 - 82); // group.y - 82 * cos(0)
  });

  it('calculates correct position for orbit 1, index 3 (bottom)', () => {
    const node = { orbit: 1, orbitIndex: 3 };
    const pos = getNodePosition(node, group);
    // angle = 2*PI*3/6 = PI => sin(PI)~0, cos(PI)=-1
    expect(pos.x).toBeCloseTo(100, 0);
    expect(pos.y).toBeCloseTo(200 + 82, 0);
  });

  it('handles alternate property names (o, oi)', () => {
    const node = { o: 1, oi: 0 };
    const pos = getNodePosition(node, group);
    expect(pos.x).toBeCloseTo(100);
    expect(pos.y).toBeCloseTo(200 - 82);
  });

  it('handles oidx property name', () => {
    const node = { orbit: 1, oidx: 0 };
    const pos = getNodePosition(node, group);
    expect(pos.x).toBeCloseTo(100);
  });
});

describe('getNodeType', () => {
  it('identifies keystone nodes', () => {
    expect(getNodeType({ isKeystone: true })).toBe('keystone');
    expect(getNodeType({ ks: true })).toBe('keystone');
  });

  it('identifies notable nodes', () => {
    expect(getNodeType({ isNotable: true })).toBe('notable');
    expect(getNodeType({ not: true })).toBe('notable');
  });

  it('identifies mastery nodes', () => {
    expect(getNodeType({ isMastery: true })).toBe('mastery');
    expect(getNodeType({ m: true })).toBe('mastery');
  });

  it('identifies jewel socket nodes', () => {
    expect(getNodeType({ isJewelSocket: true })).toBe('jewel');
  });

  it('identifies ascendancy nodes', () => {
    expect(getNodeType({ ascendancyName: 'Juggernaut' })).toBe('ascendancy');
  });

  it('identifies class start nodes', () => {
    expect(getNodeType({ classStartIndex: 0 })).toBe('classStart');
  });

  it('defaults to small', () => {
    expect(getNodeType({})).toBe('small');
  });

  it('prioritizes keystone over notable', () => {
    expect(getNodeType({ isKeystone: true, isNotable: true })).toBe('keystone');
  });
});

describe('getNodeRadius', () => {
  it('returns correct radius for each type', () => {
    expect(getNodeRadius('keystone')).toBe(40);
    expect(getNodeRadius('notable')).toBe(25);
    expect(getNodeRadius('mastery')).toBe(30);
    expect(getNodeRadius('jewel')).toBe(35);
    expect(getNodeRadius('ascendancy')).toBe(20);
    expect(getNodeRadius('classStart')).toBe(50);
    expect(getNodeRadius('small')).toBe(15);
  });

  it('defaults to small radius for unknown type', () => {
    expect(getNodeRadius('unknown')).toBe(15);
  });
});

describe('getNodeColor', () => {
  it('returns different colors for allocated vs unallocated', () => {
    const allocated = getNodeColor('keystone', true);
    const unallocated = getNodeColor('keystone', false);
    expect(allocated).not.toBe(unallocated);
  });

  it('returns gold for allocated keystones', () => {
    expect(getNodeColor('keystone', true)).toBe(0xffd700);
  });

  it('returns colors for all node types', () => {
    const types = ['keystone', 'notable', 'mastery', 'jewel', 'ascendancy', 'classStart', 'small'];
    for (const type of types) {
      expect(getNodeColor(type, true)).toBeDefined();
      expect(getNodeColor(type, false)).toBeDefined();
    }
  });
});

describe('findAllocatedPaths', () => {
  const nodes = {
    '1': { id: 1, out: [2, 3], in: [] },
    '2': { id: 2, out: [3], in: [1] },
    '3': { id: 3, out: [], in: [1, 2] },
    '4': { id: 4, out: [], in: [] },
  };

  it('finds connections between allocated nodes', () => {
    const paths = findAllocatedPaths(nodes, [1, 2, 3]);
    expect(paths.length).toBeGreaterThan(0);
    expect(paths).toContainEqual({ from: 1, to: 2 });
    expect(paths).toContainEqual({ from: 1, to: 3 });
  });

  it('returns empty for disconnected nodes', () => {
    const paths = findAllocatedPaths(nodes, [1, 4]);
    expect(paths).toEqual([]);
  });

  it('returns empty for empty input', () => {
    const paths = findAllocatedPaths(nodes, []);
    expect(paths).toEqual([]);
  });
});

describe('getAscendancyNodes', () => {
  const nodes = {
    '1': { id: 1, ascendancyName: 'Juggernaut' },
    '2': { id: 2, ascendancyName: 'Juggernaut' },
    '3': { id: 3, ascendancyName: 'Berserker' },
    '4': { id: 4 },
  };

  it('filters nodes by ascendancy name', () => {
    const result = getAscendancyNodes(nodes, 'Juggernaut');
    expect(result).toHaveLength(2);
    expect(result.every(n => n.ascendancyName === 'Juggernaut')).toBe(true);
  });

  it('returns empty for non-existent ascendancy', () => {
    const result = getAscendancyNodes(nodes, 'Slayer');
    expect(result).toHaveLength(0);
  });
});

describe('constants', () => {
  it('SKILLS_PER_ORBIT has 5 entries', () => {
    expect(SKILLS_PER_ORBIT).toHaveLength(5);
    expect(SKILLS_PER_ORBIT[0]).toBe(1);
  });

  it('ORBIT_RADII has 5 entries', () => {
    expect(ORBIT_RADII).toHaveLength(5);
    expect(ORBIT_RADII[0]).toBe(0);
  });

  it('LEAGUE_VERSIONS has entries', () => {
    expect(LEAGUE_VERSIONS.length).toBeGreaterThan(0);
    expect(LEAGUE_VERSIONS[0]).toHaveProperty('version');
    expect(LEAGUE_VERSIONS[0]).toHaveProperty('name');
  });

  it('TREE_VARIANTS has default variant', () => {
    const defaultVariant = TREE_VARIANTS.find(v => v.id === 'default');
    expect(defaultVariant).toBeDefined();
    expect(defaultVariant.file).toBe('data.json');
  });
});

describe('calculateNodeBounds', () => {
  it('calculates correct bounds for simple nodes', () => {
    const nodes = {
      '1': { orbit: 0, orbitIndex: 0, group: '1' },
      '2': { orbit: 0, orbitIndex: 0, group: '2' },
    };
    const groups = {
      '1': { x: -100, y: -50 },
      '2': { x: 200, y: 300 },
    };
    const constants = { skillsPerOrbit: SKILLS_PER_ORBIT, orbitRadii: ORBIT_RADII };
    const bounds = calculateNodeBounds(nodes, groups, constants);
    expect(bounds.minX).toBe(-100);
    expect(bounds.maxX).toBe(200);
    expect(bounds.minY).toBe(-50);
    expect(bounds.maxY).toBe(300);
  });
});
