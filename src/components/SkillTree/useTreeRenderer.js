import { useEffect, useRef } from 'react';
import { Application, Graphics, Container, Text, TextStyle, Assets, Sprite, Texture, Rectangle } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { getNodePosition, getNodeType, getNodeRadius, getNodeColor } from '../../utils/treeUtils';

// Sprite sheet cache
const spriteCache = new Map();

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

        // Clear container and add canvas
        container.innerHTML = '';
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
        await renderTree(
          treeData,
          allocatedNodes,
          highlightedKeystones,
          ascendancyName,
          backgroundContainer,
          nodesContainer,
          connectionsContainer,
          onNodeHoverRef,
          onNodeClickRef
        );

        // Center the viewport
        centerViewport(viewport, treeData, allocatedNodes);

        // Handle resize
        const handleResize = () => {
          if (!appRef.current || !viewportRef.current) return;
          const newWidth = container.clientWidth;
          const newHeight = container.clientHeight;
          app.renderer.resize(newWidth, newHeight);
          viewport.resize(newWidth, newHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
          window.removeEventListener('resize', handleResize);
        };
      } catch (err) {
        console.error('Failed to initialize PixiJS:', err);
      }
    }

    initApp();

    return () => {
      destroyed = true;
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

    renderTree(
      treeData,
      allocatedNodes,
      highlightedKeystones,
      ascendancyName,
      backgroundContainerRef.current,
      nodesContainerRef.current,
      connectionsContainerRef.current,
      onNodeHoverRef,
      onNodeClickRef
    );
  }, [allocatedNodes, highlightedKeystones, ascendancyName, treeData]);
}

/**
 * Map remote sprite filenames to local bundled assets
 * The tree data references filenames like "skills-3.jpg" which we've downloaded locally
 */
function mapToLocalSprite(filename, assetsRoot) {
  // If already using local assets path, just concatenate
  if (assetsRoot.startsWith('/assets/')) {
    return assetsRoot + filename;
  }
  // Otherwise use the full URL (fallback)
  return assetsRoot + filename;
}

/**
 * Load sprite sheets for the tree
 */
async function loadSprites(treeData) {
  if (!treeData.sprites?.skillSprites) return;

  const { skillSprites } = treeData.sprites;
  const assetsRoot = treeData.assetsRoot || `${import.meta.env.BASE_URL}assets/skill-tree/`;

  // Get the highest zoom level sprites (best quality)
  const zoomLevel = 3; // 0.3835 zoom = highest detail

  // Collect unique sprite sheet URLs
  const spriteSheetUrls = new Set();

  for (const spriteType of Object.values(skillSprites)) {
    const spriteInfo = spriteType[zoomLevel] || spriteType[spriteType.length - 1];
    if (spriteInfo?.filename) {
      spriteSheetUrls.add(mapToLocalSprite(spriteInfo.filename, assetsRoot));
    }
  }

  // Load all sprite sheets
  for (const url of spriteSheetUrls) {
    if (!spriteCache.has(url)) {
      try {
        const texture = await Assets.load(url);
        spriteCache.set(url, texture);
      } catch (err) {
        console.warn('Failed to load sprite sheet:', url, err);
      }
    }
  }
}

/**
 * Get sprite texture for a node
 */
function getNodeSpriteTexture(node, treeData, isAllocated) {
  if (!treeData.sprites?.skillSprites) return null;

  const { skillSprites } = treeData.sprites;
  const assetsRoot = treeData.assetsRoot || `${import.meta.env.BASE_URL}assets/skill-tree/`;
  const zoomLevel = 3;

  // Determine which sprite type to use based on node type
  let spriteType = null;
  let iconKey = node.icon;

  if (node.isKeystone) {
    spriteType = isAllocated ? skillSprites.keystoneActive : skillSprites.keystoneInactive;
  } else if (node.isNotable) {
    spriteType = isAllocated ? skillSprites.notableActive : skillSprites.notableInactive;
  } else if (node.isMastery) {
    spriteType = skillSprites.mastery;
    iconKey = node.inactiveIcon || node.icon;
  } else if (node.isJewelSocket) {
    spriteType = isAllocated ? skillSprites.jewelSocketActive : skillSprites.jewelSocketNormal;
  } else {
    spriteType = isAllocated ? skillSprites.normalActive : skillSprites.normalInactive;
  }

  if (!spriteType) return null;

  const spriteInfo = spriteType[zoomLevel] || spriteType[spriteType.length - 1];
  if (!spriteInfo?.filename || !spriteInfo.coords) return null;

  const sheetUrl = mapToLocalSprite(spriteInfo.filename, assetsRoot);
  const sheetTexture = spriteCache.get(sheetUrl);
  if (!sheetTexture) return null;

  // Find the coordinates for this icon
  const coords = spriteInfo.coords[iconKey];
  if (!coords) return null;

  // Create texture from sprite sheet region
  try {
    const frame = new Rectangle(coords.x, coords.y, coords.w, coords.h);
    return new Texture({ source: sheetTexture.source, frame });
  } catch (err) {
    return null;
  }
}

async function renderTree(
  treeData,
  allocatedNodes,
  highlightedKeystones,
  ascendancyName,
  backgroundContainer,
  nodesContainer,
  connectionsContainer,
  onNodeHoverRef,
  onNodeClickRef
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
    renderGroupBackgrounds(treeData, groups, backgroundContainer);
  }

  // Render connections (behind nodes)
  const connectionGraphics = new Graphics();

  for (const [nodeId, node] of Object.entries(nodes)) {
    const fromPos = nodePositions.get(nodeId);
    if (!fromPos) continue;

    const isFromAllocated = allocatedSet.has(nodeId);

    for (const outId of node.out || []) {
      const toPos = nodePositions.get(outId.toString());
      if (!toPos) continue;

      const isToAllocated = allocatedSet.has(outId.toString());
      const isBothAllocated = isFromAllocated && isToAllocated;

      // Connection style
      const lineColor = isBothAllocated ? 0xffd700 : 0x3a4a5a;
      const lineAlpha = isBothAllocated ? 1 : 0.6;
      const lineWidth = isBothAllocated ? 4 : 2;

      connectionGraphics.moveTo(fromPos.x, fromPos.y);
      connectionGraphics.lineTo(toPos.x, toPos.y);
      connectionGraphics.stroke({ width: lineWidth, color: lineColor, alpha: lineAlpha });
    }
  }

  connectionsContainer.addChild(connectionGraphics);

  // Render nodes
  for (const [nodeId, node] of Object.entries(nodes)) {
    const pos = nodePositions.get(nodeId);
    if (!pos) continue;

    const nodeType = getNodeType(node);
    const isAllocated = allocatedSet.has(nodeId);
    const isHighlighted = node.isKeystone && highlightedSet.has((node.name || '').toLowerCase());

    // Skip small unallocated nodes if we have allocated nodes (focus on the build)
    if (allocatedNodes.length > 0 && nodeType === 'small' && !isAllocated) {
      // Draw smaller, dimmer for context
      const smallNode = new Graphics();
      smallNode.circle(0, 0, 8);
      smallNode.fill({ color: 0x2a3a4a, alpha: 0.4 });
      smallNode.position.set(pos.x, pos.y);
      nodesContainer.addChild(smallNode);
      continue;
    }

    // Try to create sprite-based node, fall back to graphics
    const nodeGraphic = createNodeGraphic(node, nodeType, isAllocated, isHighlighted, treeData);
    nodeGraphic.position.set(pos.x, pos.y);

    // Store node data for interactions
    nodeGraphic.node = node;
    nodeGraphic.eventMode = 'static';
    nodeGraphic.cursor = 'pointer';

    // Hover events
    nodeGraphic.on('pointerover', (e) => {
      const globalPos = e.global;
      onNodeHoverRef.current?.(node, { x: globalPos.x, y: globalPos.y });

      // Scale up on hover
      nodeGraphic.scale.set(1.15);
    });

    nodeGraphic.on('pointerout', () => {
      onNodeHoverRef.current?.(null, { x: 0, y: 0 });
      nodeGraphic.scale.set(1);
    });

    nodeGraphic.on('pointertap', () => {
      onNodeClickRef.current?.(node);
    });

    nodesContainer.addChild(nodeGraphic);
  }
}

/**
 * Render group background images
 */
function renderGroupBackgrounds(treeData, groups, container) {
  // For now, render orbit circles for each group
  for (const [, group] of Object.entries(groups)) {
    if (!group.orbits || group.orbits.length === 0) continue;

    const bgGraphics = new Graphics();
    const maxOrbit = Math.max(...group.orbits);

    if (maxOrbit > 0) {
      const radius = treeData.constants.orbitRadii[maxOrbit] || 200;

      // Draw subtle background circle
      bgGraphics.circle(group.x, group.y, radius + 30);
      bgGraphics.fill({ color: 0x1a2030, alpha: 0.15 });

      // Draw orbit rings
      for (const orbit of group.orbits) {
        if (orbit === 0) continue;
        const orbitRadius = treeData.constants.orbitRadii[orbit];
        if (orbitRadius) {
          bgGraphics.circle(group.x, group.y, orbitRadius);
          bgGraphics.stroke({ width: 1, color: 0x2a3a4a, alpha: 0.3 });
        }
      }
    }

    container.addChild(bgGraphics);
  }
}

function createNodeGraphic(node, nodeType, isAllocated, isHighlighted, treeData) {
  const container = new Container();

  // Try to use sprite texture
  const spriteTexture = getNodeSpriteTexture(node, treeData, isAllocated);

  if (spriteTexture) {
    // Use sprite-based rendering
    const sprite = new Sprite(spriteTexture);
    sprite.anchor.set(0.5);

    // Scale based on node type
    const scale = nodeType === 'keystone' ? 0.8 :
                  nodeType === 'notable' ? 0.7 :
                  nodeType === 'mastery' ? 0.75 :
                  nodeType === 'jewel' ? 0.7 : 0.6;
    sprite.scale.set(scale);

    // Add glow for highlighted nodes
    if (isHighlighted) {
      const glow = new Graphics();
      glow.circle(0, 0, sprite.width * scale / 2 + 15);
      glow.fill({ color: 0xff6b35, alpha: 0.4 });
      container.addChild(glow);
    }

    container.addChild(sprite);
  } else {
    // Fallback to graphics-based rendering with enhanced visuals
    const graphics = new Graphics();
    const radius = getNodeRadius(nodeType);
    const color = getNodeColor(nodeType, isAllocated);

    // Outer glow for allocated/highlighted nodes
    if (isAllocated || isHighlighted) {
      const glowColor = isHighlighted ? 0xff6b35 : color;
      // Multiple layered glows for better effect
      graphics.circle(0, 0, radius + 15);
      graphics.fill({ color: glowColor, alpha: 0.15 });
      graphics.circle(0, 0, radius + 10);
      graphics.fill({ color: glowColor, alpha: 0.25 });
      graphics.circle(0, 0, radius + 5);
      graphics.fill({ color: glowColor, alpha: 0.35 });
    }

    // Main node shape based on type
    if (nodeType === 'keystone') {
      // Diamond shape for keystones with inner detail
      const r = radius;

      // Outer diamond border
      graphics.moveTo(0, -r - 4);
      graphics.lineTo(r + 4, 0);
      graphics.lineTo(0, r + 4);
      graphics.lineTo(-r - 4, 0);
      graphics.closePath();
      graphics.fill({ color: isAllocated ? 0x2a2000 : 0x1a1510, alpha: 0.9 });

      // Main diamond
      graphics.moveTo(0, -r);
      graphics.lineTo(r, 0);
      graphics.lineTo(0, r);
      graphics.lineTo(-r, 0);
      graphics.closePath();
      graphics.fill({ color, alpha: isAllocated ? 1 : 0.75 });
      graphics.stroke({ width: 3, color: isAllocated ? 0xffd700 : 0x7a6a4a });

      // Inner diamond accent
      const innerR = r * 0.5;
      graphics.moveTo(0, -innerR);
      graphics.lineTo(innerR, 0);
      graphics.lineTo(0, innerR);
      graphics.lineTo(-innerR, 0);
      graphics.closePath();
      graphics.fill({ color: isAllocated ? 0xffee88 : 0x5a4a3a, alpha: isAllocated ? 0.6 : 0.4 });

    } else if (nodeType === 'notable') {
      // Octagon for notables with layered effect
      const sides = 8;

      // Outer ring
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const x = Math.cos(angle) * (radius + 3);
        const y = Math.sin(angle) * (radius + 3);
        if (i === 0) graphics.moveTo(x, y);
        else graphics.lineTo(x, y);
      }
      graphics.closePath();
      graphics.fill({ color: isAllocated ? 0x003040 : 0x1a2028, alpha: 0.9 });

      // Main octagon
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) graphics.moveTo(x, y);
        else graphics.lineTo(x, y);
      }
      graphics.closePath();
      graphics.fill({ color, alpha: isAllocated ? 1 : 0.75 });
      graphics.stroke({ width: 2, color: isAllocated ? 0x00bfff : 0x5a7088 });

      // Inner circle accent
      graphics.circle(0, 0, radius * 0.4);
      graphics.fill({ color: isAllocated ? 0x88ddff : 0x3a4a58, alpha: isAllocated ? 0.5 : 0.3 });

    } else if (nodeType === 'jewel') {
      // Hexagon for jewel sockets with gem-like appearance
      const sides = 6;

      // Outer hexagon
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const x = Math.cos(angle) * (radius + 4);
        const y = Math.sin(angle) * (radius + 4);
        if (i === 0) graphics.moveTo(x, y);
        else graphics.lineTo(x, y);
      }
      graphics.closePath();
      graphics.fill({ color: 0x1a1a2e, alpha: 0.95 });
      graphics.stroke({ width: 3, color: isAllocated ? 0x9932cc : 0x5a4a6a });

      // Inner hexagon
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const x = Math.cos(angle) * (radius * 0.65);
        const y = Math.sin(angle) * (radius * 0.65);
        if (i === 0) graphics.moveTo(x, y);
        else graphics.lineTo(x, y);
      }
      graphics.closePath();
      graphics.fill({ color: isAllocated ? 0x6020a0 : 0x2a2040, alpha: 0.8 });
      graphics.stroke({ width: 2, color: isAllocated ? 0xcc66ff : 0x5a4a6a });

      // Center circle
      graphics.circle(0, 0, radius * 0.25);
      graphics.fill({ color: isAllocated ? 0xee88ff : 0x4a3a5a, alpha: 0.9 });

    } else if (nodeType === 'mastery') {
      // Star-like shape for masteries
      // Outer glow ring
      graphics.circle(0, 0, radius + 3);
      graphics.fill({ color: isAllocated ? 0x401030 : 0x201020, alpha: 0.8 });

      graphics.circle(0, 0, radius);
      graphics.fill({ color, alpha: isAllocated ? 1 : 0.7 });
      graphics.stroke({ width: 2, color: isAllocated ? 0xff69b4 : 0x7b5a6e });

      // Inner star pattern
      const starPoints = 6;
      const innerRadius = radius * 0.35;
      const outerStarRadius = radius * 0.6;
      for (let i = 0; i < starPoints * 2; i++) {
        const angle = (i * Math.PI) / starPoints - Math.PI / 2;
        const r = i % 2 === 0 ? outerStarRadius : innerRadius;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) graphics.moveTo(x, y);
        else graphics.lineTo(x, y);
      }
      graphics.closePath();
      graphics.fill({ color: isAllocated ? 0xffaacc : 0x5a4050, alpha: isAllocated ? 0.7 : 0.4 });

    } else {
      // Circle for small passives with ring
      graphics.circle(0, 0, radius + 2);
      graphics.fill({ color: isAllocated ? 0x103010 : 0x151a15, alpha: 0.8 });

      graphics.circle(0, 0, radius);
      graphics.fill({ color, alpha: isAllocated ? 1 : 0.65 });
      graphics.stroke({ width: 1.5, color: isAllocated ? 0x90ee90 : 0x4a5a4a });

      // Small center dot for allocated
      if (isAllocated) {
        graphics.circle(0, 0, radius * 0.3);
        graphics.fill({ color: 0xccffcc, alpha: 0.6 });
      }
    }

    container.addChild(graphics);
  }

  // Add name label for keystones and notables
  if ((nodeType === 'keystone' || nodeType === 'notable') && node.name) {
    const style = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: nodeType === 'keystone' ? 14 : 11,
      fontWeight: nodeType === 'keystone' ? 'bold' : 'normal',
      fill: isAllocated ? 0xffffff : 0xaaaaaa,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 120,
      dropShadow: {
        color: 0x000000,
        blur: 4,
        distance: 1
      }
    });

    const radius = getNodeRadius(nodeType);
    const text = new Text({ text: truncateText(node.name, 25), style });
    text.anchor.set(0.5, 0);
    text.position.set(0, radius + 8);
    container.addChild(text);
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

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1) + '…';
}
