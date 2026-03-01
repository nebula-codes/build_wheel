import { useEffect, useRef } from 'react';
import { Application, Graphics, Container, Assets, Sprite, Texture, Rectangle } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { getNodePosition, getNodeType, getNodeRadius, getNodeColor, getOrbitAngle } from '../../utils/treeUtils';

// Sprite sheet cache
const spriteCache = new Map();
const spriteRegionCache = new Map();
const spriteLoadFailures = new Set();
const coordLookupCache = new WeakMap();
const nodeTextureCache = new Map();
const UI_ZOOM_LEVEL = 3;

// Spatial index for fast node lookups on hover/click
const SPATIAL_CELL_SIZE = 100;

function buildSpatialIndex(nodePositions, nodes) {
  const index = new Map();
  for (const [nodeId, pos] of nodePositions) {
    const cellX = Math.floor(pos.x / SPATIAL_CELL_SIZE);
    const cellY = Math.floor(pos.y / SPATIAL_CELL_SIZE);
    const key = `${cellX},${cellY}`;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push({ nodeId, pos, node: nodes[nodeId] });
  }
  return index;
}

function findNearestNode(index, worldX, worldY, maxDist) {
  const cellX = Math.floor(worldX / SPATIAL_CELL_SIZE);
  const cellY = Math.floor(worldY / SPATIAL_CELL_SIZE);
  let nearest = null;
  let nearestDist = maxDist * maxDist; // Compare squared distances

  // Check 3x3 neighborhood of cells
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const key = `${cellX + dx},${cellY + dy}`;
      const entries = index.get(key);
      if (!entries) continue;
      for (const entry of entries) {
        const distSq = (entry.pos.x - worldX) ** 2 + (entry.pos.y - worldY) ** 2;
        if (distSq < nearestDist) {
          nearestDist = distSq;
          nearest = entry;
        }
      }
    }
  }
  return nearest;
}

export function useTreeRenderer({
  containerRef,
  treeData,
  allocatedNodes = [],
  highlightedKeystones = [],
  ascendancyName = null,
  onNodeHover,
  onNodeClick
}) {
  const appRef = useRef(null);
  const viewportRef = useRef(null);
  const nodesContainerRef = useRef(null);
  const connectionsContainerRef = useRef(null);
  const backgroundContainerRef = useRef(null);
  const spatialIndexRef = useRef(null);
  const highlightRingRef = useRef(null);
  const hoveredNodeIdRef = useRef(null);

  // Use refs for callbacks to avoid stale closures
  const onNodeHoverRef = useRef(onNodeHover);
  const onNodeClickRef = useRef(onNodeClick);

  // Update refs when callbacks change
  useEffect(() => {
    onNodeHoverRef.current = onNodeHover;
    onNodeClickRef.current = onNodeClick;
  }, [onNodeHover, onNodeClick]);

  // Initialize PixiJS application
  useEffect(() => {
    if (!containerRef.current || !treeData) return;

    let destroyed = false;
    let resizeHandler = null;

    async function initApp() {
      // Cleanup previous instance
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }

      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Create application
      const app = new Application();

      try {
        await app.init({
          width,
          height,
          backgroundColor: 0x0c0c14,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true
        });

        if (destroyed) {
          app.destroy(true);
          return;
        }

        // Remove previous canvas if any, then add new one
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        container.appendChild(app.canvas);

        appRef.current = app;

        // Calculate world bounds
        const bounds = treeData.bounds;
        const worldWidth = bounds.maxX - bounds.minX + 2000;
        const worldHeight = bounds.maxY - bounds.minY + 2000;

        // Create viewport for pan/zoom
        const viewport = new Viewport({
          screenWidth: width,
          screenHeight: height,
          worldWidth,
          worldHeight,
          events: app.renderer.events
        });

        viewport
          .drag()
          .pinch()
          .wheel({ smooth: 5 })
          .decelerate({ friction: 0.95 })
          .clampZoom({ minScale: 0.02, maxScale: 3 });

        app.stage.addChild(viewport);
        viewportRef.current = viewport;

        // Create containers for rendering layers (back to front)
        const backgroundContainer = new Container();
        const connectionsContainer = new Container();
        const nodesContainer = new Container();

        viewport.addChild(backgroundContainer);
        viewport.addChild(connectionsContainer);
        viewport.addChild(nodesContainer);

        backgroundContainerRef.current = backgroundContainer;
        connectionsContainerRef.current = connectionsContainer;
        nodesContainerRef.current = nodesContainer;

        // Load sprites and render
        await loadSprites(treeData);

        if (destroyed) return;

        // Render the tree
        const renderResult = renderTree(
          treeData,
          allocatedNodes,
          highlightedKeystones,
          ascendancyName,
          backgroundContainer,
          nodesContainer,
          connectionsContainer,
        );

        // Build spatial index for hover/click
        if (renderResult) {
          spatialIndexRef.current = buildSpatialIndex(renderResult.nodePositions, treeData.nodes);
        }

        // Create reusable highlight ring (added to nodesContainer so it transforms with nodes)
        const highlightRing = new Graphics();
        highlightRing.visible = false;
        nodesContainer.addChild(highlightRing);
        highlightRingRef.current = highlightRing;

        // Viewport-level pointer handlers (replaces per-node events)
        let hoverRaf = null;
        let pendingHoverEvent = null;

        viewport.eventMode = 'static';

        viewport.on('pointermove', (e) => {
          // Skip expensive hover lookups while dragging.
          if (e.buttons > 0) return;

          pendingHoverEvent = e;
          if (hoverRaf) return;

          hoverRaf = requestAnimationFrame(() => {
            hoverRaf = null;
            const latest = pendingHoverEvent;
            pendingHoverEvent = null;
            if (!latest) return;

            const worldPos = viewport.toWorld(latest.global.x, latest.global.y);
            const zoom = viewport.scale.x || 0.1;
            const maxDist = Math.min(38 / zoom, 120); // tighter hit radius = fewer false positives

            const hit = spatialIndexRef.current
              ? findNearestNode(spatialIndexRef.current, worldPos.x, worldPos.y, maxDist)
              : null;

            if (hit) {
              if (hoveredNodeIdRef.current !== hit.nodeId) {
                hoveredNodeIdRef.current = hit.nodeId;
                onNodeHoverRef.current?.(hit.node, { x: latest.global.x, y: latest.global.y });

                // Position highlight ring
                const ring = highlightRingRef.current;
                if (ring) {
                  const nodeType = getNodeType(hit.node);
                  const radius = getNodeRadius(nodeType) + 6;
                  ring.clear();
                  ring.circle(0, 0, radius);
                  ring.stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
                  ring.position.set(hit.pos.x, hit.pos.y);
                  ring.visible = true;
                }
              }
            } else if (hoveredNodeIdRef.current !== null) {
              hoveredNodeIdRef.current = null;
              onNodeHoverRef.current?.(null, { x: 0, y: 0 });
              if (highlightRingRef.current) {
                highlightRingRef.current.visible = false;
              }
            }
          });
        });

        viewport.on('pointertap', (e) => {
          const worldPos = viewport.toWorld(e.global.x, e.global.y);
          const zoom = viewport.scale.x || 0.1;
          const maxDist = Math.min(38 / zoom, 120);

          const hit = spatialIndexRef.current
            ? findNearestNode(spatialIndexRef.current, worldPos.x, worldPos.y, maxDist)
            : null;

          if (hit) {
            onNodeClickRef.current?.(hit.node);
          }
        });

        // Center the viewport
        centerViewport(viewport, treeData, allocatedNodes);

        // Handle resize
        resizeHandler = () => {
          if (!appRef.current || !viewportRef.current) return;
          const newWidth = container.clientWidth;
          const newHeight = container.clientHeight;
          app.renderer.resize(newWidth, newHeight);
          viewport.resize(newWidth, newHeight);
        };

        window.addEventListener('resize', resizeHandler);
      } catch (err) {
        console.error('Failed to initialize PixiJS:', err);
      }
    }

    initApp();

    return () => {
      destroyed = true;
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Re-init only when container or tree data changes, updates handled by second useEffect
  }, [containerRef, treeData]);

  // Update when allocated nodes change
  useEffect(() => {
    if (!nodesContainerRef.current || !connectionsContainerRef.current || !treeData || !viewportRef.current) return;

    // Clear and re-render
    nodesContainerRef.current.removeChildren();
    connectionsContainerRef.current.removeChildren();
    if (backgroundContainerRef.current) {
      backgroundContainerRef.current.removeChildren();
    }

    const renderResult = renderTree(
      treeData,
      allocatedNodes,
      highlightedKeystones,
      ascendancyName,
      backgroundContainerRef.current,
      nodesContainerRef.current,
      connectionsContainerRef.current,
    );

    // Rebuild spatial index
    if (renderResult) {
      spatialIndexRef.current = buildSpatialIndex(renderResult.nodePositions, treeData.nodes);
    }

    // Re-add highlight ring
    if (highlightRingRef.current) {
      highlightRingRef.current.visible = false;
      nodesContainerRef.current.addChild(highlightRingRef.current);
    } else {
      const highlightRing = new Graphics();
      highlightRing.visible = false;
      nodesContainerRef.current.addChild(highlightRing);
      highlightRingRef.current = highlightRing;
    }
    hoveredNodeIdRef.current = null;
  }, [allocatedNodes, highlightedKeystones, ascendancyName, treeData]);
}

/**
 * Map remote sprite filenames to local bundled assets
 * The tree data references filenames like "skills-3.jpg" which we've downloaded locally
 */
function mapToLocalSprite(filename, assetsRoot) {
  return assetsRoot + filename;
}

function getSpriteInfo(spriteType, zoomLevel = UI_ZOOM_LEVEL) {
  if (!spriteType || spriteType.length === 0) return null;
  return spriteType[zoomLevel] || spriteType[spriteType.length - 1] || null;
}

function buildCoordLookup(coords) {
  if (!coords) return { full: new Map(), basename: new Map() };
  const cached = coordLookupCache.get(coords);
  if (cached) return cached;

  const lookup = {
    full: new Map(),
    basename: new Map()
  };

  for (const key of Object.keys(coords)) {
    const lower = key.toLowerCase();
    lookup.full.set(lower, key);

    const basename = key.split('/').pop().toLowerCase();
    if (!lookup.basename.has(basename)) {
      lookup.basename.set(basename, key);
    }
  }

  coordLookupCache.set(coords, lookup);
  return lookup;
}

function resolveSpriteCoords(coords, iconKey) {
  if (!coords || !iconKey) return null;
  if (coords[iconKey]) return coords[iconKey];

  const lookup = buildCoordLookup(coords);
  const normalized = iconKey.toLowerCase();
  const fullKey = lookup.full.get(normalized);
  if (fullKey && coords[fullKey]) return coords[fullKey];

  const basename = iconKey.split('/').pop().toLowerCase();
  const basenameKey = lookup.basename.get(basename);
  if (basenameKey && coords[basenameKey]) return coords[basenameKey];

  return null;
}

function getTextureRegion(sheetUrl, sheetTexture, coords) {
  const regionKey = `${sheetUrl}|${coords.x}|${coords.y}|${coords.w}|${coords.h}`;
  const cached = spriteRegionCache.get(regionKey);
  if (cached && !cached.destroyed) {
    return cached;
  }

  const frame = new Rectangle(coords.x, coords.y, coords.w, coords.h);
  const regionTexture = new Texture({ source: sheetTexture.source, frame });
  spriteRegionCache.set(regionKey, regionTexture);
  return regionTexture;
}

function getSpriteTextureByType(spriteType, coordKey, treeData) {
  if (!spriteType || !coordKey) return null;

  const assetsRoot = treeData.assetsRoot || `${import.meta.env.BASE_URL}assets/skill-tree/`;
  const spriteInfo = getSpriteInfo(spriteType, UI_ZOOM_LEVEL);
  if (!spriteInfo?.filename || !spriteInfo.coords) return null;

  const sheetUrl = mapToLocalSprite(spriteInfo.filename, assetsRoot);
  const sheetTexture = spriteCache.get(sheetUrl);
  if (!sheetTexture) return null;

  const coords = resolveSpriteCoords(spriteInfo.coords, coordKey);
  if (!coords) return null;

  try {
    return getTextureRegion(sheetUrl, sheetTexture, coords);
  } catch {
    return null;
  }
}

function getFallbackTextureByIcon(iconKey, spriteMap, treeData) {
  if (!iconKey || !spriteMap) return null;

  for (const spriteType of Object.values(spriteMap)) {
    const texture = getSpriteTextureByType(spriteType, iconKey, treeData);
    if (texture) return texture;
  }
  return null;
}

/**
 * Load sprite sheets for the tree
 */
async function loadSprites(treeData) {
  if (!treeData.sprites) return;

  const assetsRoot = treeData.assetsRoot || `${import.meta.env.BASE_URL}assets/skill-tree/`;

  // Collect unique sprite sheet URLs
  const spriteSheetUrls = new Set();

  const addCollection = (collection) => {
    if (!collection) return;
    for (const spriteType of Object.values(collection)) {
      const spriteInfo = getSpriteInfo(spriteType, UI_ZOOM_LEVEL);
      if (spriteInfo?.filename) {
        spriteSheetUrls.add(mapToLocalSprite(spriteInfo.filename, assetsRoot));
      }
    }
  };

  addCollection(treeData.sprites.byType);
  addCollection(treeData.sprites.skillSprites);
  addCollection(treeData.sprites.uiSprites);
  addCollection(treeData.sprites.specialIconSprites);

  // Load all sprite sheets
  for (const url of spriteSheetUrls) {
    if (!spriteCache.has(url)) {
      try {
        const texture = await Assets.load(url);
        spriteCache.set(url, texture);
      } catch (err) {
        if (!spriteLoadFailures.has(url)) {
          spriteLoadFailures.add(url);
          console.warn('Failed to load sprite sheet:', url, err);
        }
      }
    }
  }
}

/**
 * Get sprite texture for a node
 */
function getNodeSpriteTexture(node, treeData, isAllocated) {
  if (!treeData.sprites?.skillSprites) return null;

  const cacheKey = `${treeData.leagueVersion || 'master'}:${treeData.version}:${node.id}:${isAllocated ? 1 : 0}`;
  if (nodeTextureCache.has(cacheKey)) {
    return nodeTextureCache.get(cacheKey);
  }

  const { skillSprites } = treeData.sprites;
  let texture = null;

  if (node.isMastery) {
    const masteryType = isAllocated
      ? (skillSprites.masteryActiveSelected || skillSprites.masteryConnected || skillSprites.mastery)
      : (skillSprites.masteryInactive || skillSprites.mastery);
    const masteryKey = isAllocated ? (node.activeIcon || node.icon) : (node.inactiveIcon || node.icon);
    texture = getSpriteTextureByType(masteryType, masteryKey, treeData)
      || getSpriteTextureByType(skillSprites.mastery, node.icon, treeData);
  } else {
    let baseSpriteType = null;
    if (node.isKeystone) {
      baseSpriteType = isAllocated ? skillSprites.keystoneActive : skillSprites.keystoneInactive;
    } else if (node.isNotable) {
      baseSpriteType = isAllocated ? skillSprites.notableActive : skillSprites.notableInactive;
    } else {
      baseSpriteType = isAllocated ? skillSprites.normalActive : skillSprites.normalInactive;
    }

    texture = getSpriteTextureByType(baseSpriteType, node.icon, treeData);

    // League-specific nodes (bloodline/atlas ascendancy sets) are in separate sprite atlases.
    if (!texture && node.icon) {
      texture = getFallbackTextureByIcon(node.icon, treeData.sprites.specialIconSprites, treeData);
    }

    // Last-resort lookup across all known sprite types for unexpected icon-sheet changes.
    if (!texture && node.icon) {
      texture = getFallbackTextureByIcon(node.icon, treeData.sprites.byType, treeData);
    }
  }

  nodeTextureCache.set(cacheKey, texture || null);
  return texture;
}

function getNodeFrameTexture(nodeType, isAllocated, treeData) {
  const frameSprites = treeData.sprites?.uiSprites?.frame;
  if (!frameSprites) return null;

  let frameKey = null;
  if (nodeType === 'keystone') {
    frameKey = isAllocated ? 'KeystoneFrameAllocated' : 'KeystoneFrameUnallocated';
  } else if (nodeType === 'notable') {
    frameKey = isAllocated ? 'NotableFrameAllocated' : 'NotableFrameUnallocated';
  } else if (nodeType === 'jewel') {
    frameKey = isAllocated ? 'JewelSocketAltActive' : 'JewelSocketAltNormal';
  } else if (nodeType === 'mastery') {
    frameKey = isAllocated ? 'JewelFrameAllocated' : 'JewelFrameUnallocated';
  }

  if (!frameKey) return null;
  return getSpriteTextureByType(frameSprites, frameKey, treeData);
}

function getNodeVisualDiameter(nodeType) {
  switch (nodeType) {
    case 'keystone': return 72;
    case 'notable': return 52;
    case 'mastery': return 56;
    case 'jewel': return 60;
    case 'classStart': return 82;
    case 'ascendancy': return 40;
    case 'small':
    default: return 30;
  }
}

function renderTree(
  treeData,
  allocatedNodes,
  highlightedKeystones,
  ascendancyName,
  backgroundContainer,
  nodesContainer,
  connectionsContainer,
) {
  const { nodes, groups, constants } = treeData;
  const allocatedSet = new Set(allocatedNodes.map(id => id.toString()));
  const highlightedSet = new Set(highlightedKeystones.map(k => k.toLowerCase()));

  // Calculate positions for all nodes first
  const nodePositions = new Map();
  for (const [nodeId, node] of Object.entries(nodes)) {
    const group = groups[node.group];
    if (!group) continue;

    // Filter by ascendancy if specified
    if (ascendancyName && node.ascendancyName && node.ascendancyName !== ascendancyName) {
      continue;
    }

    const pos = getNodePosition(node, group, constants);
    nodePositions.set(nodeId, pos);
  }

  // Render group backgrounds
  if (backgroundContainer) {
    renderGroupBackgrounds(treeData, groups, nodes, backgroundContainer);
  }

  // Render connections (behind nodes)
  const connectionGraphics = new Graphics();
  const renderedEdges = new Set();

  for (const [nodeId, node] of Object.entries(nodes)) {
    const fromPos = nodePositions.get(nodeId);
    if (!fromPos) continue;

    const isFromAllocated = allocatedSet.has(nodeId);

    for (const outId of node.out || []) {
      const outKey = outId.toString();
      const edgeKey = nodeId < outKey ? `${nodeId}-${outKey}` : `${outKey}-${nodeId}`;
      if (renderedEdges.has(edgeKey)) continue;
      renderedEdges.add(edgeKey);

      const toPos = nodePositions.get(outKey);
      if (!toPos) continue;

      const targetNode = nodes[outKey];
      const isToAllocated = allocatedSet.has(outKey);
      const isBothAllocated = isFromAllocated && isToAllocated;

      // Connection style
      const lineColor = isBothAllocated ? 0xffd700 : 0x3a4a5a;
      const lineAlpha = isBothAllocated ? 1 : 0.6;
      const lineWidth = isBothAllocated ? 4 : 2;

      // Check if both nodes share the same group and orbit (for arc drawing)
      const sameGroup = targetNode && node.group === targetNode.group && node.group != null;
      const fromOrbit = node.orbit ?? 0;
      const toOrbit = targetNode ? (targetNode.orbit ?? 0) : 0;
      const sameOrbit = sameGroup && fromOrbit === toOrbit && fromOrbit > 0;

      if (sameOrbit) {
        // Draw arc along the orbit ring
        const group = groups[node.group];
        if (group) {
          const orbitRadius = constants.orbitRadii[fromOrbit] || 0;
          // Calculate angles in tree space (0=up, clockwise)
          const fromAngle = getOrbitAngle(fromOrbit, node.orbitIndex ?? 0, constants.skillsPerOrbit);
          const toAngle = getOrbitAngle(toOrbit, targetNode.orbitIndex ?? 0, constants.skillsPerOrbit);

          // Convert tree angles to PixiJS arc angles (0=right, clockwise)
          const arcFromAngle = fromAngle - Math.PI / 2;
          const arcToAngle = toAngle - Math.PI / 2;

          // Choose the shorter arc direction
          let diff = arcToAngle - arcFromAngle;
          while (diff > Math.PI) diff -= 2 * Math.PI;
          while (diff < -Math.PI) diff += 2 * Math.PI;
          const anticlockwise = diff < 0;

          connectionGraphics.moveTo(fromPos.x, fromPos.y);
          connectionGraphics.arc(group.x, group.y, orbitRadius, arcFromAngle, arcToAngle, anticlockwise);
          connectionGraphics.stroke({ width: lineWidth, color: lineColor, alpha: lineAlpha });
        }
      } else {
        // Straight line for cross-group or cross-orbit connections
        connectionGraphics.moveTo(fromPos.x, fromPos.y);
        connectionGraphics.lineTo(toPos.x, toPos.y);
        connectionGraphics.stroke({ width: lineWidth, color: lineColor, alpha: lineAlpha });
      }
    }
  }

  connectionsContainer.addChild(connectionGraphics);

  // Render nodes (no per-node event handlers; spatial index handles interaction)
  for (const [nodeId, node] of Object.entries(nodes)) {
    const pos = nodePositions.get(nodeId);
    if (!pos) continue;

    const nodeType = getNodeType(node);
    const isAllocated = allocatedSet.has(nodeId);
    const isHighlighted = node.isKeystone && highlightedSet.has((node.name || '').toLowerCase());

    const nodeGraphic = createNodeGraphic(node, nodeType, isAllocated, isHighlighted, treeData);
    nodeGraphic.position.set(pos.x, pos.y);
    nodesContainer.addChild(nodeGraphic);
  }

  return { nodePositions };
}

/**
 * Render group background images
 */
function renderGroupBackgrounds(treeData, groups, nodes, container) {
  const backgroundTexture = getSpriteTextureByType(treeData.sprites?.uiSprites?.background, 'Background2', treeData);
  if (backgroundTexture) {
    const backdrop = new Sprite(backgroundTexture);
    backdrop.anchor.set(0.5);
    backdrop.position.set(
      (treeData.bounds.minX + treeData.bounds.maxX) / 2,
      (treeData.bounds.minY + treeData.bounds.maxY) / 2
    );
    backdrop.width = treeData.bounds.maxX - treeData.bounds.minX + 1200;
    backdrop.height = treeData.bounds.maxY - treeData.bounds.minY + 1200;
    backdrop.alpha = 0.08;
    container.addChild(backdrop);
  }

  for (const [, group] of Object.entries(groups)) {
    if (!group.orbits || group.orbits.length === 0) continue;

    const maxOrbit = Math.max(...group.orbits);
    if (maxOrbit <= 0) continue;

    const radius = treeData.constants.orbitRadii[maxOrbit] || 200;
    const diameter = radius * 2 + 140;
    const hasAscendancyNodes = (group.nodes || []).some((id) => {
      const key = id?.toString?.() || id;
      const node = nodes[key];
      return Boolean(node?.ascendancyName);
    });

    const groupBackgroundKey = maxOrbit >= 4
      ? (hasAscendancyNodes ? 'GroupBackgroundLargeHalfAlt' : 'PSGroupBackground3')
      : maxOrbit >= 3
        ? (hasAscendancyNodes ? 'GroupBackgroundMediumAlt' : 'PSGroupBackground2')
        : (hasAscendancyNodes ? 'GroupBackgroundSmallAlt' : 'PSGroupBackground1');

    const groupTexture = getSpriteTextureByType(treeData.sprites?.uiSprites?.groupBackground, groupBackgroundKey, treeData);
    if (groupTexture) {
      if (maxOrbit >= 4) {
        // Large atlas backgrounds are provided as half-images.
        const topHalf = new Sprite(groupTexture);
        topHalf.anchor.set(0.5, 1);
        topHalf.position.set(group.x, group.y);
        topHalf.width = diameter;
        topHalf.height = diameter / 2;
        topHalf.alpha = hasAscendancyNodes ? 0.9 : 0.8;
        container.addChild(topHalf);

        const bottomHalf = new Sprite(groupTexture);
        bottomHalf.anchor.set(0.5, 1);
        bottomHalf.position.set(group.x, group.y);
        bottomHalf.width = diameter;
        bottomHalf.height = diameter / 2;
        bottomHalf.alpha = hasAscendancyNodes ? 0.9 : 0.8;
        bottomHalf.scale.y = -1;
        container.addChild(bottomHalf);
      } else {
        const bgSprite = new Sprite(groupTexture);
        bgSprite.anchor.set(0.5);
        bgSprite.position.set(group.x, group.y);
        bgSprite.width = diameter;
        bgSprite.height = diameter;
        bgSprite.alpha = hasAscendancyNodes ? 0.88 : 0.72;
        container.addChild(bgSprite);
      }
    } else {
      const fallbackBg = new Graphics();
      fallbackBg.circle(group.x, group.y, radius + 30);
      fallbackBg.fill({ color: 0x1a2030, alpha: 0.2 });
      container.addChild(fallbackBg);
    }

    // Keep orbital guides for readability.
    const orbitGuides = new Graphics();
    for (const orbit of group.orbits) {
      if (orbit === 0) continue;
      const orbitRadius = treeData.constants.orbitRadii[orbit];
      if (orbitRadius) {
        orbitGuides.circle(group.x, group.y, orbitRadius);
        orbitGuides.stroke({ width: 1, color: 0x425162, alpha: 0.22 });
      }
    }
    container.addChild(orbitGuides);
  }
}

function createNodeGraphic(node, nodeType, isAllocated, isHighlighted, treeData) {
  const container = new Container();

  const diameter = getNodeVisualDiameter(nodeType);
  const frameTexture = getNodeFrameTexture(nodeType, isAllocated, treeData);
  const spriteTexture = getNodeSpriteTexture(node, treeData, isAllocated);

  if (isHighlighted) {
    const glow = new Graphics();
    glow.circle(0, 0, diameter * 0.7);
    glow.fill({ color: 0xff6b35, alpha: 0.32 });
    container.addChild(glow);
  }

  if (spriteTexture || frameTexture) {
    if (spriteTexture) {
      const sprite = new Sprite(spriteTexture);
      sprite.anchor.set(0.5);
      sprite.width = diameter;
      sprite.height = diameter;
      container.addChild(sprite);
    }

    if (frameTexture) {
      const frame = new Sprite(frameTexture);
      frame.anchor.set(0.5);
      frame.width = diameter + 8;
      frame.height = diameter + 8;
      container.addChild(frame);
    }
  } else {
    // Fallback if icon atlas does not contain this node.
    const graphics = new Graphics();
    const radius = getNodeRadius(nodeType);
    const color = getNodeColor(nodeType, isAllocated);
    const stroke = isAllocated ? 0xd8e8ff : 0x4a5a6a;

    graphics.circle(0, 0, radius);
    graphics.fill({ color, alpha: isAllocated ? 0.95 : 0.72 });
    graphics.stroke({ width: 1.5, color: stroke, alpha: 0.8 });
    container.addChild(graphics);
  }

  return container;
}

function centerViewport(viewport, treeData, allocatedNodes) {
  const { bounds } = treeData;

  if (allocatedNodes.length > 0) {
    // Center on allocated nodes
    const positions = [];
    for (const nodeId of allocatedNodes) {
      const node = treeData.nodes[nodeId.toString()];
      if (!node) continue;
      const group = treeData.groups[node.group];
      if (!group) continue;
      positions.push(getNodePosition(node, group, treeData.constants));
    }

    if (positions.length > 0) {
      const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
      const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;

      // Calculate bounds of allocated nodes
      const minX = Math.min(...positions.map(p => p.x));
      const maxX = Math.max(...positions.map(p => p.x));
      const minY = Math.min(...positions.map(p => p.y));
      const maxY = Math.max(...positions.map(p => p.y));

      const width = maxX - minX + 500;
      const height = maxY - minY + 500;

      // Fit to allocated nodes with padding
      viewport.fit(true, width, height);
      viewport.moveCenter(avgX, avgY);
      viewport.setZoom(Math.min(viewport.scale.x * 0.8, 0.5));
    }
  } else {
    // Center on the full tree
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    viewport.moveCenter(centerX, centerY);
    viewport.setZoom(0.08); // Start zoomed out to see full tree
  }
}
