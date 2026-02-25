import { describe, it, expect, vi } from 'vitest';
import { decodeTreeUrl, encodeTreeUrl, getClassStartNode, CLASS_NAMES, ASCENDANCY_NAMES, decodePobCode } from '../pobParser';

describe('decodeTreeUrl', () => {
  it('returns empty result for null/empty input', () => {
    expect(decodeTreeUrl(null)).toEqual({ nodes: [], ascendancy: null, classId: null });
    expect(decodeTreeUrl('')).toEqual({ nodes: [], ascendancy: null, classId: null });
  });

  it('handles invalid base64 gracefully', () => {
    const result = decodeTreeUrl('https://www.pathofexile.com/passive-skill-tree/!!!invalid!!!');
    expect(result).toEqual({ nodes: [], ascendancy: null, classId: null });
  });

  it('extracts encoded portion from passive-skill-tree URL', () => {
    // Minimal valid tree: version 6, class 0, ascendancy 0, 0 nodes
    // bytes: [0,0,0,6, 0, 0, 0, 0,0] = version 6, class 0, asc 0, fullscreen 0, 0 nodes
    const bytes = new Uint8Array([0, 0, 0, 6, 0, 0, 0, 0, 0]);
    const binary = String.fromCharCode(...bytes);
    const base64url = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const url = `https://www.pathofexile.com/passive-skill-tree/${base64url}`;
    const result = decodeTreeUrl(url);
    expect(result.classId).toBe(0);
    expect(result.nodes).toEqual([]);
  });

  it('parses tree with allocated nodes', () => {
    // version 6, class 1 (Marauder), asc 2 (Berserker), fullscreen 0, 2 nodes
    const bytes = new Uint8Array([0, 0, 0, 6, 1, 2, 0, 0, 2, 0, 100, 1, 0]);
    const binary = String.fromCharCode(...bytes);
    const base64url = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const url = `https://www.pathofexile.com/passive-skill-tree/${base64url}`;
    const result = decodeTreeUrl(url);
    expect(result.classId).toBe(1);
    expect(result.ascendancyId).toBe(2);
    expect(result.nodes).toEqual([100, 256]);
  });

  it('handles URL with query params', () => {
    const bytes = new Uint8Array([0, 0, 0, 6, 3, 1, 0, 0, 0]);
    const binary = String.fromCharCode(...bytes);
    const base64url = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const url = `https://www.pathofexile.com/passive-skill-tree/${base64url}?accountName=test`;
    const result = decodeTreeUrl(url);
    expect(result.classId).toBe(3);
  });
});

describe('encodeTreeUrl', () => {
  it('generates a valid URL', () => {
    const url = encodeTreeUrl([100, 200], 1, 2, 6);
    expect(url).toContain('https://www.pathofexile.com/passive-skill-tree/');
  });

  it('round-trips encode/decode', () => {
    const nodes = [100, 200, 300];
    const classId = 2;
    const ascId = 1;
    const url = encodeTreeUrl(nodes, classId, ascId, 6);
    const decoded = decodeTreeUrl(url);
    expect(decoded.nodes).toEqual(nodes);
    expect(decoded.classId).toBe(classId);
    expect(decoded.ascendancyId).toBe(ascId);
  });

  it('handles empty nodes', () => {
    const url = encodeTreeUrl([], 0, 0, 6);
    const decoded = decodeTreeUrl(url);
    expect(decoded.nodes).toEqual([]);
  });
});

describe('decodePobCode', () => {
  it('returns null for null/empty input', () => {
    expect(decodePobCode(null)).toBeNull();
    expect(decodePobCode('')).toBeNull();
  });

  it('returns null for pastebin URLs', () => {
    expect(decodePobCode('https://pastebin.com/abcdef')).toBeNull();
  });

  it('returns null for non-base64 characters', () => {
    expect(decodePobCode('this has spaces and !special! chars')).toBeNull();
  });

  it('returns null for too-short input', () => {
    expect(decodePobCode('abc')).toBeNull();
  });

  it('returns null for valid base64 but invalid zlib data', () => {
    // Valid base64 but not zlib compressed
    expect(decodePobCode('SGVsbG8gV29ybGQhIFRoaXMgaXMgbm90IHpsaWI=')).toBeNull();
  });
});

describe('getClassStartNode', () => {
  it('returns correct node for each class', () => {
    expect(getClassStartNode(0)).toBe(47175); // Scion
    expect(getClassStartNode(1)).toBe(50459); // Marauder
    expect(getClassStartNode(6)).toBe(40633); // Shadow
  });

  it('returns null for invalid class', () => {
    expect(getClassStartNode(99)).toBeNull();
  });
});

describe('CLASS_NAMES', () => {
  it('has all 7 classes', () => {
    expect(Object.keys(CLASS_NAMES)).toHaveLength(7);
    expect(CLASS_NAMES[0]).toBe('Scion');
    expect(CLASS_NAMES[6]).toBe('Shadow');
  });
});

describe('ASCENDANCY_NAMES', () => {
  it('has ascendancies for each class', () => {
    expect(Object.keys(ASCENDANCY_NAMES)).toHaveLength(7);
    expect(ASCENDANCY_NAMES[1][1]).toBe('Juggernaut');
    expect(ASCENDANCY_NAMES[6][3]).toBe('Saboteur');
  });
});
