import { useEffect, useRef } from 'react';
import { Application, Graphics, Container, Text, TextStyle } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { getNodePosition, getNodeType, getNodeRadius, getNodeColor } from '../../utils/treeUtils';

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
          .clampZoom({ minScale: 0.05, maxScale: 2 });

        app.stage.addChild(viewport);
        viewportRef.current = viewport;

        // Create containers for rendering layers
        const connectionsContainer = new Container();
        const nodesContainer = new Container();

        viewport.addChild(connectionsContainer);
        viewport.addChild(nodesContainer);

        connectionsContainerRef.current = connectionsContainer;
        nodesContainerRef.current = nodesContainer;

        // Render the tree
        renderTree(
          treeData,
          allocatedNodes,
          highlightedKeystones,
          ascendancyName,
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

    renderTree(
      treeData,
      allocatedNodes,
      highlightedKeystones,
      ascendancyName,
      nodesContainerRef.current,
      connectionsContainerRef.current,
      onNodeHoverRef,
      onNodeClickRef
    );
  }, [allocatedNodes, highlightedKeystones, ascendancyName, treeData]);
}

function renderTree(
  treeData,
  allocatedNodes,
  highlightedKeystones,
  ascendancyName,
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

  // Render connections first (behind nodes)
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
      const lineColor = isBothAllocated ? 0xffd700 : 0x2a3a4a;
      const lineAlpha = isBothAllocated ? 1 : 0.5;
      const lineWidth = isBothAllocated ? 3 : 1.5;

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
      smallNode.circle(0, 0, 5);
      smallNode.fill({ color: 0x1a2a3a, alpha: 0.3 });
      smallNode.position.set(pos.x, pos.y);
      nodesContainer.addChild(smallNode);
      continue;
    }

    const nodeGraphic = createNodeGraphic(node, nodeType, isAllocated, isHighlighted);
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
      nodeGraphic.scale.set(1.2);
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

function createNodeGraphic(node, nodeType, isAllocated, isHighlighted) {
  const container = new Container();
  const graphics = new Graphics();

  const radius = getNodeRadius(nodeType);
  const color = getNodeColor(nodeType, isAllocated);

  // Outer glow for allocated/highlighted nodes
  if (isAllocated || isHighlighted) {
    const glowColor = isHighlighted ? 0xff6b35 : color;
    graphics.circle(0, 0, radius + 8);
    graphics.fill({ color: glowColor, alpha: 0.3 });
  }

  // Main node circle
  graphics.circle(0, 0, radius);

  if (isAllocated) {
    graphics.fill({ color });
    graphics.stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
  } else {
    graphics.fill({ color, alpha: 0.6 });
    graphics.stroke({ width: 1, color: 0x4a5a6a, alpha: 0.5 });
  }

  container.addChild(graphics);

  // Add icon/symbol for special nodes
  if (nodeType === 'keystone') {
    const symbol = new Graphics();
    // Diamond shape for keystone
    symbol.moveTo(0, -radius * 0.5);
    symbol.lineTo(radius * 0.5, 0);
    symbol.lineTo(0, radius * 0.5);
    symbol.lineTo(-radius * 0.5, 0);
    symbol.closePath();
    symbol.stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
    container.addChild(symbol);
  } else if (nodeType === 'notable') {
    const symbol = new Graphics();
    // Star shape for notable
    symbol.circle(0, 0, radius * 0.3);
    symbol.fill({ color: 0xffffff, alpha: 0.8 });
    container.addChild(symbol);
  } else if (nodeType === 'jewel') {
    const symbol = new Graphics();
    // Hexagon for jewel socket
    const sides = 6;
    const innerRadius = radius * 0.5;
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
      const x = Math.cos(angle) * innerRadius;
      const y = Math.sin(angle) * innerRadius;
      if (i === 0) {
        symbol.moveTo(x, y);
      } else {
        symbol.lineTo(x, y);
      }
    }
    symbol.closePath();
    symbol.stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
    container.addChild(symbol);
  } else if (nodeType === 'mastery') {
    // Crown-like symbol for mastery
    const symbol = new Graphics();
    symbol.circle(0, 0, radius * 0.4);
    symbol.fill({ color: 0xffffff, alpha: 0.6 });
    container.addChild(symbol);
  }

  // Add name label for keystones and notables
  if ((nodeType === 'keystone' || nodeType === 'notable') && node.name) {
    const style = new TextStyle({
      fontFamily: 'Arial',
      fontSize: nodeType === 'keystone' ? 12 : 10,
      fill: isAllocated ? 0xffffff : 0xaaaaaa,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 100
    });

    const text = new Text({ text: truncateText(node.name, 20), style });
    text.anchor.set(0.5, 0);
    text.position.set(0, radius + 5);
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
    viewport.setZoom(0.1); // Start zoomed out to see full tree
  }
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1) + '…';
}
