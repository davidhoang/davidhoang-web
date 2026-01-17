import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PersonAvatar } from './PersonAvatar';

// Dynamic imports for Konva to avoid SSR issues
// Store Konva components in module-level cache with versioning
let konvaCache: {
  Stage: any;
  Layer: any;
  Circle: any;
  Rect: any;
  Line: any;
  Text: any;
  Image: any;
  Group: any;
  Path: any;
  Konva: any;
  LinearGradient: any;
  version?: string;
} | null = null;

// Cache version - increment this to force cache refresh
const KONVA_CACHE_VERSION = '1.0.0';

// Function to clear Konva cache (useful for development/debugging)
if (typeof window !== 'undefined') {
  (window as any).__clearKonvaCache = () => {
    konvaCache = null;
    if (process.env.NODE_ENV === 'development') {
      console.log('Konva cache cleared');
    }
  };
}

// Lazy load Konva only on client
const loadKonva = async () => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Check if cache exists and is valid version
  if (konvaCache && konvaCache.version === KONVA_CACHE_VERSION) {
    return konvaCache;
  }
  
  // Clear old cache if version mismatch
  if (konvaCache && konvaCache.version !== KONVA_CACHE_VERSION) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Clearing outdated Konva cache (version mismatch)');
    }
    konvaCache = null;
  }
  
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Loading Konva...');
    }
    const [reactKonva, konvaLib] = await Promise.all([
      import('react-konva'),
      import('konva')
    ]);
    
    // Handle both default and named exports for Konva
    const Konva = konvaLib.default || konvaLib;
    
    // Check for LinearGradient - it might be in different locations
    let LinearGradientClass = null;
    if (Konva && (Konva as any).LinearGradient) {
      LinearGradientClass = (Konva as any).LinearGradient;
    } else if (konvaLib && (konvaLib as any).LinearGradient) {
      LinearGradientClass = (konvaLib as any).LinearGradient;
    } else if (konvaLib.default && (konvaLib.default as any).LinearGradient) {
      LinearGradientClass = (konvaLib.default as any).LinearGradient;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Konva loaded, checking LinearGradient:', {
        hasKonva: !!Konva,
        hasLinearGradient: !!LinearGradientClass,
        konvaKeys: Konva ? Object.keys(Konva).slice(0, 20) : [],
        konvaLibKeys: konvaLib ? Object.keys(konvaLib).slice(0, 20) : []
      });
    }
    
    konvaCache = {
      Stage: reactKonva.Stage,
      Layer: reactKonva.Layer,
      Circle: reactKonva.Circle,
      Rect: reactKonva.Rect,
      Line: reactKonva.Line,
      Text: reactKonva.Text,
      Image: reactKonva.Image,
      Group: reactKonva.Group,
      Path: reactKonva.Path,
      Konva: Konva,
      LinearGradient: LinearGradientClass,
      version: KONVA_CACHE_VERSION,
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Konva loaded successfully', { version: KONVA_CACHE_VERSION });
    }
    return konvaCache;
  } catch (error) {
    console.error('Failed to load Konva:', error);
    return null;
  }
};

interface WorkedWithPerson {
  name: string;
  image: string;
  url?: string;
}

interface Node {
  id: string;
  label: string;
  description?: string;
  type: 'milestone' | 'company' | 'event' | 'transition' | 'spark' | 'future' | 'inspiration' | 'career' | 'possiblePath';
  date?: string;
  dateRange?: string;
  active?: boolean;
  pathTaken?: boolean;
  connections?: string[];
  image?: string;
  link?: string;
  iframe?: string; // URL for embedded iframe content (e.g., games)
  x?: number;
  y?: number;
  sequence?: number; // Optional sequence order for nodes with same/similar dates
  workedWith?: WorkedWithPerson[];
}

interface PositionedNode extends Node {
  x: number;
  y: number;
  timestamp: number;
  radius: number; // Kept for backward compatibility during transition
  width: number;
  height: number;
}

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface StageState {
  scale: number;
  x: number;
  y: number;
}

interface CareerOdysseyProps {
  careerData: {
    nodes: Node[];
  };
}

const MIN_NODE_RADIUS = 40;
// MAX_NODE_RADIUS removed - width is now calculated fluidly from text requirements
const DEFAULT_NODE_RADIUS = 80; // Default node radius for grid calculation
const GRID_DOTS_PER_NODE = 8; // Number of grid dots visible across default node diameter
// For 8 dots across diameter, we need 7 intervals: spacing = diameter / 7
const BASE_GRID_SPACING = (DEFAULT_NODE_RADIUS * 2) / (GRID_DOTS_PER_NODE - 1); // 8-dot grid: 160px diameter / 7 ≈ 22.86px spacing
const MAIN_PATH_Y = 250; // Centered vertically
const BRANCH_SPACING = 40; // Tight vertical distribution
const CANVAS_WIDTH = 2000; // Width for horizontal flow
const CANVAS_HEIGHT = 500; // Compact height
const PADDING = 40; // Tight padding
const MAX_NODE_DISTANCE = 250; // Maximum distance between connected nodes
const NODE_GAP = 30; // Gap between adjacent nodes
const BASE_FONT_SIZE = 12;
const TEXT_PADDING = 12; // Padding around text inside node
const TEXT_PADDING_NOT_TAKEN = 12; // Padding for paths not taken (same as regular padding)

// Calculate adaptive font size based on node radius
const calculateFontSize = (width: number): number => {
  // Scale font size proportionally with node width
  // Base: 14px for 250px width (minimum), scale linearly
  const baseWidth = 250;
  const minFontSize = 10;
  const maxFontSize = 16;
  const fontSize = (width / baseWidth) * BASE_FONT_SIZE;
  return Math.max(minFontSize, Math.min(maxFontSize, fontSize));
};
const MIN_NODE_SPACING = 15; // Reduced for much tighter alignment - Minimum space between node edges (was 30)

// Date parsing utility
const parseDate = (dateStr?: string): number => {
  if (!dateStr) return Date.now();
  
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parts[1] ? parseInt(parts[1], 10) - 1 : 5; // Default to mid-year
  const day = parts[2] ? parseInt(parts[2], 10) : 15;
  
  return new Date(year, month, day).getTime();
};

// Helper function to check if a node is "Present"
const isPresentNode = (n: Node): boolean => {
  if (n.active === true) return true;
  if (n.dateRange && typeof n.dateRange === 'string') {
    return n.dateRange.includes('Present');
  }
  return false;
};

const isFutureNode = (n: Node): boolean => {
  if (n.dateRange && typeof n.dateRange === 'string') {
    return n.dateRange.includes('Future');
  }
  return false;
};

// Format date for display
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  if (dateStr.length === 4) return dateStr; // Year only
  if (dateStr.length === 7) return dateStr; // YYYY-MM
  return dateStr; // YYYY-MM-DD
};

// Calculate node positions - COMPACT FLOW LAYOUT
// Nodes are placed sequentially with max 250px between connected nodes
const calculateLayout = (nodes: Node[]): PositionedNode[] => {
  // Create a map of original node data to check for explicit positions
  const originalNodeMap = new Map<string, any>();
  nodes.forEach(node => {
    originalNodeMap.set(node.id, node);
  });

  // Parse dates and create positioned nodes with calculated dimensions
  const positionedNodes: PositionedNode[] = nodes.map(node => {
    const { width, height, radius } = calculateNodeSize(node, nodes);
    const hasExplicitX = (node as any).x !== undefined;
    const hasExplicitY = (node as any).y !== undefined;
    return {
      ...node,
      timestamp: parseDate(node.date),
      x: hasExplicitX ? (node as any).x : 0,  // Use explicit x if provided
      y: hasExplicitY ? (node as any).y : 0,  // Use explicit y if provided
      radius,
      width,
      height,
      pathTaken: node.pathTaken !== false,
    };
  });

  // HYBRID LAYOUT: Nodes with explicit x/y keep their positions
  // Nodes without explicit positions get auto-laid out

  // Sort all nodes by date for sequential layout
  const sortedNodes = [...positionedNodes].sort((a, b) => {
    const dateDiff = a.timestamp - b.timestamp;
    if (Math.abs(dateDiff) < 365 * 24 * 60 * 60 * 1000) {
      return (a.sequence ?? 0) - (b.sequence ?? 0);
    }
    return dateDiff;
  });

  // Separate nodes: those with explicit x positions vs those needing auto-layout
  // A node is "manual" if the original JSON has an x property defined
  const manualNodeIds = new Set<string>();
  nodes.forEach(node => {
    if ((node as any).x !== undefined) {
      manualNodeIds.add(node.id);
    }
  });

  const manualNodes = sortedNodes.filter(n => manualNodeIds.has(n.id));
  const autoNodes = sortedNodes.filter(n => !manualNodeIds.has(n.id));

  // STEP 1: Auto-layout nodes without explicit positions
  let currentX = PADDING;
  let prevYear = 0;

  // Group auto-nodes by year for vertical stacking
  const nodesByYear = new Map<number, PositionedNode[]>();
  autoNodes.forEach(node => {
    const year = new Date(node.timestamp).getFullYear();
    if (!nodesByYear.has(year)) {
      nodesByYear.set(year, []);
    }
    nodesByYear.get(year)!.push(node);
  });

  autoNodes.forEach((node) => {
    const nodeWidth = node.width || 200;
    const nodeHeight = node.height || 120;
    const year = new Date(node.timestamp).getFullYear();

    // Add small gap for year changes
    if (prevYear > 0 && year > prevYear) {
      const yearGap = Math.min(year - prevYear, 3);
      currentX += yearGap * 20;
    }

    // Vertical offset for nodes in same year
    const nodesInYear = nodesByYear.get(year) || [];
    const indexInYear = nodesInYear.indexOf(node);
    const totalInYear = nodesInYear.length;
    const verticalOffset = (indexInYear - (totalInYear - 1) / 2) * (nodeHeight * 0.6 + NODE_GAP);

    node.x = currentX + nodeWidth / 2;
    node.y = MAIN_PATH_Y + verticalOffset;

    currentX += nodeWidth + NODE_GAP;
    prevYear = year;
  });

  // STEP 2: Manual nodes already have their x positions, just set y if not specified
  manualNodes.forEach(node => {
    if (node.y === 0) {
      node.y = MAIN_PATH_Y;
    }
  });

  // STEP 3: Resolve overlaps using rectangular bounding box collision
  // Each node needs padding around it to prevent overlap
  const COLLISION_PADDING = 20; // Extra padding between nodes
  const allNodes = positionedNodes;

  // manualNodeIds already defined above - these should NOT be moved during collision resolution

  // Run multiple iterations to resolve all overlaps
  for (let iteration = 0; iteration < 50; iteration++) {
    let hasOverlap = false;

    for (let i = 0; i < allNodes.length; i++) {
      for (let j = i + 1; j < allNodes.length; j++) {
        const nodeA = allNodes[i];
        const nodeB = allNodes[j];

        // Check if nodes are pinned (have explicit positions)
        const aIsPinned = manualNodeIds.has(nodeA.id);
        const bIsPinned = manualNodeIds.has(nodeB.id);

        // If both nodes are pinned, skip collision resolution between them
        if (aIsPinned && bIsPinned) continue;

        // Get actual dimensions with padding
        const aWidth = (nodeA.width || 200) + COLLISION_PADDING;
        const aHeight = (nodeA.height || 120) + COLLISION_PADDING;
        const bWidth = (nodeB.width || 200) + COLLISION_PADDING;
        const bHeight = (nodeB.height || 120) + COLLISION_PADDING;

        // Calculate bounding boxes
        const aLeft = nodeA.x - aWidth / 2;
        const aRight = nodeA.x + aWidth / 2;
        const aTop = nodeA.y - aHeight / 2;
        const aBottom = nodeA.y + aHeight / 2;

        const bLeft = nodeB.x - bWidth / 2;
        const bRight = nodeB.x + bWidth / 2;
        const bTop = nodeB.y - bHeight / 2;
        const bBottom = nodeB.y + bHeight / 2;

        // Check for rectangular overlap
        const overlapX = Math.min(aRight, bRight) - Math.max(aLeft, bLeft);
        const overlapY = Math.min(aBottom, bBottom) - Math.max(aTop, bTop);

        if (overlapX > 0 && overlapY > 0) {
          hasOverlap = true;

          // Push apart in the direction of least overlap
          // Only move unpinned nodes
          if (overlapX < overlapY) {
            // Push horizontally
            const pushX = overlapX + 2;
            if (aIsPinned) {
              // Only move B
              nodeB.x += (nodeA.x < nodeB.x) ? pushX : -pushX;
            } else if (bIsPinned) {
              // Only move A
              nodeA.x += (nodeA.x < nodeB.x) ? -pushX : pushX;
            } else {
              // Move both
              const halfPush = pushX / 2;
              if (nodeA.x < nodeB.x) {
                nodeA.x -= halfPush;
                nodeB.x += halfPush;
              } else {
                nodeA.x += halfPush;
                nodeB.x -= halfPush;
              }
            }
          } else {
            // Push vertically
            const pushY = overlapY + 2;
            if (aIsPinned) {
              // Only move B
              nodeB.y += (nodeA.y < nodeB.y) ? pushY : -pushY;
            } else if (bIsPinned) {
              // Only move A
              nodeA.y += (nodeA.y < nodeB.y) ? -pushY : pushY;
            } else {
              // Move both
              const halfPush = pushY / 2;
              if (nodeA.y < nodeB.y) {
                nodeA.y -= halfPush;
                nodeB.y += halfPush;
              } else {
                nodeA.y += halfPush;
                nodeB.y -= halfPush;
              }
            }
          }
        }
      }
    }

    if (!hasOverlap) break;
  }

  // Keep nodes within canvas bounds (only for auto-laid out nodes)
  allNodes.forEach(node => {
    // Skip bounds clamping for manually positioned nodes
    if (manualNodeIds.has(node.id)) return;

    const nodeWidth = node.width || 200;
    const nodeHeight = node.height || 120;
    const minX = PADDING + nodeWidth / 2;
    const maxX = CANVAS_WIDTH * 2 - PADDING - nodeWidth / 2; // Allow canvas to grow
    const minY = PADDING + nodeHeight / 2;
    const maxY = CANVAS_HEIGHT - PADDING - nodeHeight / 2;

    node.x = Math.max(minX, node.x);
    node.y = Math.max(minY, Math.min(maxY, node.y));
  });

  // STEP 4: Ensure no node is more than MAX_NODE_DISTANCE from its connection
  // Skip for manually positioned nodes
  positionedNodes.forEach(node => {
    // Skip if this node has explicit position
    if (manualNodeIds.has(node.id)) return;
    if (!node.connections || node.connections.length === 0) return;

    const connectedNode = positionedNodes.find(n => n.id === node.connections![0]);
    if (!connectedNode) return;

    const dx = node.x - connectedNode.x;
    const dy = node.y - connectedNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > MAX_NODE_DISTANCE) {
      // Pull node closer to its connection
      const scale = MAX_NODE_DISTANCE / distance;
      node.x = connectedNode.x + dx * scale;
      node.y = connectedNode.y + dy * scale;
    }
  });

  // STEP 5: Handle spark nodes - position them close to connected nodes
  // Skip for manually positioned spark nodes
  const sparkNodes = positionedNodes.filter(n => n.type === 'spark');
  sparkNodes.forEach(sparkNode => {
    // Skip if this spark node has explicit position
    if (manualNodeIds.has(sparkNode.id)) return;

    const connectedId = sparkNode.connections?.[0];
    const connectedNode = connectedId ? positionedNodes.find(n => n.id === connectedId) : null;

    if (connectedNode) {
      // Position spark nodes in a small cluster around connected node
      const allSparks = sparkNodes.filter(n => n.connections?.[0] === connectedId);
      const sparkIndex = allSparks.indexOf(sparkNode);
      const totalSparks = allSparks.length;

      const angleStep = (2 * Math.PI) / Math.max(totalSparks, 1);
      const angle = sparkIndex * angleStep - Math.PI / 2;
      const distance = 60;

      sparkNode.x = connectedNode.x + Math.cos(angle) * distance;
      sparkNode.y = connectedNode.y + Math.sin(angle) * distance;
    }
  });

  // STEP 6: Final collision resolution pass (after all positioning adjustments)
  // Also respects manually positioned nodes
  const FINAL_PADDING = 15;
  const finalAllNodes = positionedNodes.filter(n => n.x !== undefined && n.y !== undefined);

  for (let iteration = 0; iteration < 100; iteration++) {
    let hasOverlap = false;

    for (let i = 0; i < finalAllNodes.length; i++) {
      for (let j = i + 1; j < finalAllNodes.length; j++) {
        const nodeA = finalAllNodes[i];
        const nodeB = finalAllNodes[j];

        // Check if nodes are pinned (have explicit positions)
        const aIsPinned = manualNodeIds.has(nodeA.id);
        const bIsPinned = manualNodeIds.has(nodeB.id);

        // If both nodes are pinned, skip collision resolution between them
        if (aIsPinned && bIsPinned) continue;

        const aWidth = (nodeA.width || 200) + FINAL_PADDING;
        const aHeight = (nodeA.height || 120) + FINAL_PADDING;
        const bWidth = (nodeB.width || 200) + FINAL_PADDING;
        const bHeight = (nodeB.height || 120) + FINAL_PADDING;

        const aLeft = nodeA.x - aWidth / 2;
        const aRight = nodeA.x + aWidth / 2;
        const aTop = nodeA.y - aHeight / 2;
        const aBottom = nodeA.y + aHeight / 2;

        const bLeft = nodeB.x - bWidth / 2;
        const bRight = nodeB.x + bWidth / 2;
        const bTop = nodeB.y - bHeight / 2;
        const bBottom = nodeB.y + bHeight / 2;

        const overlapX = Math.min(aRight, bRight) - Math.max(aLeft, bLeft);
        const overlapY = Math.min(aBottom, bBottom) - Math.max(aTop, bTop);

        if (overlapX > 0 && overlapY > 0) {
          hasOverlap = true;

          // Push apart - prefer horizontal separation to maintain timeline flow
          // Only move unpinned nodes
          if (overlapX <= overlapY) {
            const pushX = overlapX + 4;
            if (aIsPinned) {
              nodeB.x += (nodeA.x < nodeB.x) ? pushX : -pushX;
            } else if (bIsPinned) {
              nodeA.x += (nodeA.x < nodeB.x) ? -pushX : pushX;
            } else {
              const halfPush = pushX / 2;
              if (nodeA.x < nodeB.x) {
                nodeA.x -= halfPush;
                nodeB.x += halfPush;
              } else {
                nodeA.x += halfPush;
                nodeB.x -= halfPush;
              }
            }
          } else {
            const pushY = overlapY + 4;
            if (aIsPinned) {
              nodeB.y += (nodeA.y < nodeB.y) ? pushY : -pushY;
            } else if (bIsPinned) {
              nodeA.y += (nodeA.y < nodeB.y) ? -pushY : pushY;
            } else {
              const halfPush = pushY / 2;
              if (nodeA.y < nodeB.y) {
                nodeA.y -= halfPush;
                nodeB.y += halfPush;
              } else {
                nodeA.y += halfPush;
                nodeB.y -= halfPush;
              }
            }
          }
        }
      }
    }

    if (!hasOverlap) break;
  }

  return positionedNodes;
};

// Calculate distance between two nodes
const getDistance = (node1: PositionedNode, node2: PositionedNode): number => {
  const dx = node2.x - node1.x;
  const dy = node2.y - node1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Check if two nodes are colliding (rectangular bounding box collision)
const areColliding = (node1: PositionedNode, node2: PositionedNode): boolean => {
  // Calculate bounding boxes using full width/height (outer edges)
  const node1Width = node1.width || node1.radius * 2;
  const node1Height = node1.height || node1.radius * 2;
  const node2Width = node2.width || node2.radius * 2;
  const node2Height = node2.height || node2.radius * 2;
  
  const node1Left = node1.x - node1Width / 2;
  const node1Right = node1.x + node1Width / 2;
  const node1Top = node1.y - node1Height / 2;
  const node1Bottom = node1.y + node1Height / 2;
  
  const node2Left = node2.x - node2Width / 2;
  const node2Right = node2.x + node2Width / 2;
  const node2Top = node2.y - node2Height / 2;
  const node2Bottom = node2.y + node2Height / 2;
  
  // Check for overlap with spacing - nodes should never overlap
  // Return true if there's any overlap (even with spacing)
  return !(node1Right + MIN_NODE_SPACING < node2Left ||
           node1Left - MIN_NODE_SPACING > node2Right ||
           node1Bottom + MIN_NODE_SPACING < node2Top ||
           node1Top - MIN_NODE_SPACING > node2Bottom);
};

// Check if a point is within a node's rectangular bounds (with padding)
const isPointInNode = (point: { x: number; y: number }, node: PositionedNode, padding: number = 0): boolean => {
  const nodeWidth = node.width || node.radius * 2;
  const nodeHeight = node.height || node.radius * 2;
  
  const left = node.x - nodeWidth / 2 - padding;
  const right = node.x + nodeWidth / 2 + padding;
  const top = node.y - nodeHeight / 2 - padding;
  const bottom = node.y + nodeHeight / 2 + padding;
  
  return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
};

// Check if a bezier curve segment intersects with a node (using rectangular bounds)
const doesConnectionIntersectNode = (
  source: PositionedNode,
  target: PositionedNode,
  node: PositionedNode
): boolean => {
  // Skip if node is the source or target of this connection
  if (node.id === source.id || node.id === target.id) {
    return false;
  }

  // Calculate connection path points using port positions (same as getConnectionPath)
  // Port squares are inside the node, but connections connect at the edge
  const sidePadding = 8; // Must match the sidePadding in calculateNodePorts
  const sourcePorts = calculateNodePorts(source, [source, target, node]);
  const targetPorts = calculateNodePorts(target, [source, target, node]);
  
  const outputPort = sourcePorts.outputs.find(p => p.connectionId === target.id);
  const inputPort = targetPorts.inputs.find(p => p.connectionId === source.id);
  
  // Connections start/end at the edge, using port's Y position
  const startX = outputPort ? source.x + source.width / 2 : source.x + source.width / 2;
  const startY = outputPort ? source.y + outputPort.y : source.y;
  const endX = inputPort ? target.x - target.width / 2 : target.x - target.width / 2;
  const endY = inputPort ? target.y + inputPort.y : target.y;
  
  const horizontalDistance = Math.abs(endX - startX);
  const verticalDistance = Math.abs(endY - startY);
  const totalDistance = Math.sqrt(horizontalDistance * horizontalDistance + verticalDistance * verticalDistance);
  const curveFactor = Math.min(0.4, Math.max(0.2, totalDistance / 500));
  
  const cp1x = startX + (endX - startX) * curveFactor;
  const cp1y = startY + (endY - startY) * curveFactor * 0.5;
  const cp2x = endX - (endX - startX) * curveFactor;
  const cp2y = endY - (endY - startY) * curveFactor * 0.5;

  // Sample points along the bezier curve to check for intersection
  // Use more samples for longer curves
  const numSamples = Math.max(20, Math.ceil(totalDistance / 10));
  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    // Bezier curve formula: (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
    const x = Math.pow(1 - t, 3) * startX + 3 * Math.pow(1 - t, 2) * t * cp1x + 3 * (1 - t) * Math.pow(t, 2) * cp2x + Math.pow(t, 3) * endX;
    const y = Math.pow(1 - t, 3) * startY + 3 * Math.pow(1 - t, 2) * t * cp1y + 3 * (1 - t) * Math.pow(t, 2) * cp2y + Math.pow(t, 3) * endY;
    
    if (isPointInNode({ x, y }, node, MIN_NODE_SPACING)) {
      return true;
    }
  }
  
  return false;
};

// Resolve collisions between nodes
const resolveCollisions = (nodes: PositionedNode[]): void => {
  const maxIterations = 100; // Increased from 50 for better resolution
  let iterations = 0;
  let hasCollisions = true;

  while (hasCollisions && iterations < maxIterations) {
    hasCollisions = false;
    iterations++;

    // Check node-to-node collisions
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];

        const isNode1Present = isPresentNode(node1) || isFutureNode(node1);
        const isNode2Present = isPresentNode(node2) || isFutureNode(node2);

        if (areColliding(node1, node2)) {
          hasCollisions = true;
          
          // Calculate rectangular bounds for both nodes
          const node1Width = node1.width || node1.radius * 2;
          const node1Height = node1.height || node1.radius * 2;
          const node2Width = node2.width || node2.radius * 2;
          const node2Height = node2.height || node2.radius * 2;
          
          const node1Left = node1.x - node1Width / 2;
          const node1Right = node1.x + node1Width / 2;
          const node1Top = node1.y - node1Height / 2;
          const node1Bottom = node1.y + node1Height / 2;
          
          const node2Left = node2.x - node2Width / 2;
          const node2Right = node2.x + node2Width / 2;
          const node2Top = node2.y - node2Height / 2;
          const node2Bottom = node2.y + node2Height / 2;
          
          // Calculate overlap in X and Y directions
          const overlapX = Math.min(node1Right, node2Right) - Math.max(node1Left, node2Left);
          const overlapY = Math.min(node1Bottom, node2Bottom) - Math.max(node1Top, node2Top);
          
          // Calculate minimum required distance (half width + half width + spacing)
          const minDistanceX = node1Width / 2 + node2Width / 2 + MIN_NODE_SPACING;
          const minDistanceY = node1Height / 2 + node2Height / 2 + MIN_NODE_SPACING;
          
          if (overlapX > 0 && overlapY > 0) {
            // Nodes are overlapping - calculate separation needed
            const currentDistanceX = Math.abs(node2.x - node1.x);
            const currentDistanceY = Math.abs(node2.y - node1.y);
            
            const neededSeparationX = minDistanceX - currentDistanceX;
            const neededSeparationY = minDistanceY - currentDistanceY;
            
            // Add extra push factor to ensure nodes separate more
            const pushFactor = 1.3; // Push nodes 30% further apart than minimum
            const adjustedSeparationX = neededSeparationX * pushFactor;
            const adjustedSeparationY = neededSeparationY * pushFactor;
            
            // Calculate direction vector
            const dx = node2.x - node1.x;
            const dy = node2.y - node1.y;
            const angle = Math.atan2(dy, dx);
            
            // Calculate how much each node should move based on size
            const totalSize = node1Width + node1Height + node2Width + node2Height;
            const node1Size = node1Width + node1Height;
            const node2Size = node2Width + node2Height;
            
            // Calculate movement amounts proportional to node sizes
            const move1X = (adjustedSeparationX * node2Size) / totalSize;
            const move2X = (adjustedSeparationX * node1Size) / totalSize;
            const move1Y = (adjustedSeparationY * node2Size) / totalSize;
            const move2Y = (adjustedSeparationY * node1Size) / totalSize;
            
            // Determine which direction to move based on relative positions
            const moveX1 = node1.x < node2.x ? -move1X : move1X;
            const moveX2 = node2.x < node1.x ? -move2X : move2X;
            const moveY1 = node1.y < node2.y ? -move1Y : move1Y;
            const moveY2 = node2.y < node1.y ? -move2Y : move2Y;
            
            // Preserve Present and Future nodes' X position - only move them vertically
            // Preserve pathTaken nodes on main path when possible
            // If one is on main path and other isn't, move the branch node more
            if (node1.pathTaken && !node2.pathTaken) {
              // Move branch node (node2) more
              if (!isNode2Present) {
                node2.x += moveX2 * 0.7;
              }
              node2.y += moveY2 * 0.7;
              if (!isNode1Present) {
                node1.x += moveX1 * 0.3;
              }
              node1.y += moveY1 * 0.3;
            } else if (node2.pathTaken && !node1.pathTaken) {
              // Move branch node (node1) more
              if (!isNode1Present) {
                node1.x += moveX1 * 0.7;
              }
              node1.y += moveY1 * 0.7;
              if (!isNode2Present) {
                node2.x += moveX2 * 0.3;
              }
              node2.y += moveY2 * 0.3;
            } else {
              // Both same type, move both proportionally
              if (!isNode1Present) {
                node1.x += moveX1;
              }
              node1.y += moveY1;
              if (!isNode2Present) {
                node2.x += moveX2;
              }
              node2.y += moveY2;
            }
          } else {
            // Nodes are very close but not overlapping - ensure minimum spacing
            const currentDistanceX = Math.abs(node2.x - node1.x);
            const currentDistanceY = Math.abs(node2.y - node1.y);
            
            if (currentDistanceX < minDistanceX) {
              const neededX = minDistanceX - currentDistanceX;
              const moveX = neededX / 2;
              if (!isNode1Present) node1.x -= moveX;
              if (!isNode2Present) node2.x += moveX;
            }
            
            if (currentDistanceY < minDistanceY) {
              const neededY = minDistanceY - currentDistanceY;
              const moveY = neededY / 2;
              node1.y -= moveY;
              node2.y += moveY;
            }
          }
        }
      }
    }

    // Check connection-to-node collisions
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node.connections || node.connections.length === 0) continue;

      for (const connectionId of node.connections) {
        const sourceNode = nodes.find(n => n.id === connectionId);
        if (!sourceNode) continue;

        // Check if this connection intersects with any other node
        for (let j = 0; j < nodes.length; j++) {
          const otherNode = nodes[j];
          
          // Skip if this is the source or target of the connection
          if (otherNode.id === sourceNode.id || otherNode.id === node.id) continue;

          const isOtherNodePresent = isPresentNode(otherNode) || isFutureNode(otherNode);
          const isNodePresent = isPresentNode(node) || isFutureNode(node);

          if (doesConnectionIntersectNode(sourceNode, node, otherNode)) {
            hasCollisions = true;
            
            // Move the intersecting node away from the connection
            // Find the closest point on the connection to the node center
            const dx = node.x - sourceNode.x;
            const dy = node.y - sourceNode.y;
            const angle = Math.atan2(dy, dx);
            
            // Calculate perpendicular direction to push the node away
            const perpAngle = angle + Math.PI / 2;
            
          // Calculate how much to move (based on node radius and spacing)
          // Increased move distance for better separation
          const moveDistance = otherNode.radius + MIN_NODE_SPACING + 30;
            
            // Prefer moving branch nodes more than main path nodes
            // Preserve Present nodes' X position
            if (otherNode.pathTaken && !node.pathTaken) {
              // Move the branch node (node) more
              if (!isNodePresent) {
                node.x += Math.cos(perpAngle) * moveDistance * 0.3;
              }
              node.y += Math.sin(perpAngle) * moveDistance * 0.3;
            } else if (!otherNode.pathTaken && node.pathTaken) {
              // Move the branch node (otherNode) more
              if (!isOtherNodePresent) {
                otherNode.x -= Math.cos(perpAngle) * moveDistance * 0.7;
              }
              otherNode.y -= Math.sin(perpAngle) * moveDistance * 0.7;
            } else {
              // Move the intersecting node perpendicular to the connection
              if (!isOtherNodePresent) {
                otherNode.x += Math.cos(perpAngle) * moveDistance * 0.5;
              }
              otherNode.y += Math.sin(perpAngle) * moveDistance * 0.5;
            }
          }
        }
      }
    }
  }
};

// Helper to get CSS variable color (for theme support)
const getThemeColor = (varName: string, fallback: string = '#000000'): string => {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
};

// Get node color by type
const getNodeColor = (type: string, pathTaken: boolean): string => {
  const colors: Record<string, { main: string; branch: string }> = {
    career: { main: '#3b82f6', branch: '#60a5fa' }, // Blue - full-time roles (biggest nodes)
    event: { main: '#eab308', branch: '#fde047' }, // Yellow - something that happened
    spark: { main: '#f97316', branch: '#fb923c' }, // Orange - inspiration
    inspiration: { main: '#a855f7', branch: '#c084fc' }, // Purple - inspiration nodes (often orphaned)
    possiblePath: { main: '#6b7280', branch: '#9ca3af' }, // Gray - paths not taken
    // Legacy types for backward compatibility
    milestone: { main: '#9333ea', branch: '#c084fc' }, // Purple
    company: { main: '#3b82f6', branch: '#60a5fa' }, // Blue
    transition: { main: '#6b7280', branch: '#9ca3af' }, // Gray
    future: { main: '#10b981', branch: '#34d399' }, // Green
  };
  
  const colorSet = colors[type] || colors.event;
  return pathTaken ? colorSet.main : colorSet.branch;
};

// Helper function to sample points along a bezier curve
const sampleBezierCurve = (
  startX: number, startY: number,
  cp1x: number, cp1y: number,
  cp2x: number, cp2y: number,
  endX: number, endY: number,
  numSamples: number
): Array<{ x: number; y: number }> => {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    const x = Math.pow(1 - t, 3) * startX + 3 * Math.pow(1 - t, 2) * t * cp1x + 3 * (1 - t) * Math.pow(t, 2) * cp2x + Math.pow(t, 3) * endX;
    const y = Math.pow(1 - t, 3) * startY + 3 * Math.pow(1 - t, 2) * t * cp1y + 3 * (1 - t) * Math.pow(t, 2) * cp2y + Math.pow(t, 3) * endY;
    points.push({ x, y });
  }
  return points;
};

// Check if two bezier curves intersect (get too close to each other)
const doBezierCurvesIntersect = (
  curve1: { startX: number; startY: number; cp1x: number; cp1y: number; cp2x: number; cp2y: number; endX: number; endY: number },
  curve2: { startX: number; startY: number; cp1x: number; cp1y: number; cp2x: number; cp2y: number; endX: number; endY: number },
  minDistance: number = 30 // Increased from 15 to 30 for better detection
): boolean => {
  // Use more samples for better intersection detection
  const samples1 = sampleBezierCurve(curve1.startX, curve1.startY, curve1.cp1x, curve1.cp1y, curve1.cp2x, curve1.cp2y, curve1.endX, curve1.endY, 100);
  const samples2 = sampleBezierCurve(curve2.startX, curve2.startY, curve2.cp1x, curve2.cp1y, curve2.cp2x, curve2.cp2y, curve2.endX, curve2.endY, 100);
  
  // Check if any points from curve1 are too close to any points from curve2
  for (const p1 of samples1) {
    for (const p2 of samples2) {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < minDistance) {
        return true;
      }
    }
  }
  return false;
};

// Check if two bezier curves actually cross/overlap (not just get close)
const doCurvesCross = (
  curve1: { startX: number; startY: number; cp1x: number; cp1y: number; cp2x: number; cp2y: number; endX: number; endY: number },
  curve2: { startX: number; startY: number; cp1x: number; cp1y: number; cp2x: number; cp2y: number; endX: number; endY: number },
  overlapThreshold: number = 8 // Very tight threshold - only when lines actually overlap
): { t1: number; t2: number; point: { x: number; y: number } } | null => {
  const samples1 = sampleBezierCurve(curve1.startX, curve1.startY, curve1.cp1x, curve1.cp1y, curve1.cp2x, curve1.cp2y, curve1.endX, curve1.endY, 150);
  const samples2 = sampleBezierCurve(curve2.startX, curve2.startY, curve2.cp1x, curve2.cp1y, curve2.cp2x, curve2.cp2y, curve2.endX, curve2.endY, 150);
  
  // Check for actual overlap - lines must be very close (overlapping)
  for (let i = 0; i < samples1.length; i++) {
    const p1 = samples1[i];
    const t1 = i / (samples1.length - 1);
    
    for (let j = 0; j < samples2.length; j++) {
      const p2 = samples2[j];
      const t2 = j / (samples2.length - 1);
      
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Only consider it an overlap if the distance is very small (lines actually cross)
      if (distance < overlapThreshold) {
        // Verify this is a crossing by checking if curves are on opposite sides before/after
        // This helps ensure we only catch actual crossings, not just parallel lines
        const prevI = Math.max(0, i - 5);
        const nextI = Math.min(samples1.length - 1, i + 5);
        const prevJ = Math.max(0, j - 5);
        const nextJ = Math.min(samples2.length - 1, j + 5);
        
        const prevP1 = samples1[prevI];
        const nextP1 = samples1[nextI];
        const prevP2 = samples2[prevJ];
        const nextP2 = samples2[nextJ];
        
        // Calculate which side of curve2 the points on curve1 are on
        const sideBefore = ((p1.x - prevP2.x) * (nextP2.y - prevP2.y) - (p1.y - prevP2.y) * (nextP2.x - prevP2.x));
        const sideAfter = ((nextP1.x - prevP2.x) * (nextP2.y - prevP2.y) - (nextP1.y - prevP2.y) * (nextP2.x - prevP2.x));
        
        // If the signs are different, the curves cross
        if (sideBefore * sideAfter < 0 || distance < overlapThreshold * 0.5) {
          return { 
            t1, 
            t2, 
            point: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 } 
          };
        }
      }
    }
  }
  
  return null;
};

// Add a line hop to a bezier curve path at a specific point
const addLineHop = (
  startX: number, startY: number,
  cp1x: number, cp1y: number,
  cp2x: number, cp2y: number,
  endX: number, endY: number,
  hopPoint: { x: number; y: number },
  hopT: number,
  hopSize: 'small' | 'medium' | 'large' = 'medium',
  hopDirection: 'up' | 'down' = 'up'
): string => {
  // Calculate hop height based on size - make hops more visible
  const hopHeights = { small: 20, medium: 30, large: 45 }; // Increased for better visibility
  const hopHeight = hopHeights[hopSize];
  
  // Determine hop direction (perpendicular to the curve at that point)
  // Calculate tangent at hop point
  const t = hopT;
  const tangentX = 3 * Math.pow(1 - t, 2) * (cp1x - startX) + 
                   6 * (1 - t) * t * (cp2x - cp1x) + 
                   3 * Math.pow(t, 2) * (endX - cp2x);
  const tangentY = 3 * Math.pow(1 - t, 2) * (cp1y - startY) + 
                   6 * (1 - t) * t * (cp2y - cp1y) + 
                   3 * Math.pow(t, 2) * (endY - cp2y);
  
  const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
  if (tangentLength === 0) {
    // Fallback: use simple bezier if tangent can't be calculated
    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  }
  
  // Perpendicular vector (rotate 90 degrees)
  const perpX = -tangentY / tangentLength;
  const perpY = tangentX / tangentLength;
  
  // Apply hop direction
  const directionMultiplier = hopDirection === 'up' ? -1 : 1;
  const hopOffsetX = perpX * hopHeight * directionMultiplier;
  const hopOffsetY = perpY * hopHeight * directionMultiplier;
  
  // Calculate hop center point
  const hopCenterX = hopPoint.x + hopOffsetX;
  const hopCenterY = hopPoint.y + hopOffsetY;
  
  // Split the curve at the hop point
  // We'll create a path that goes: start -> before hop -> hop arc -> after hop -> end
  const beforeHopT = Math.max(0.05, hopT - 0.12);
  const afterHopT = Math.min(0.95, hopT + 0.12);
  
  // Calculate points before and after hop on the original curve
  const bezierPoint = (t: number) => {
    const mt = 1 - t;
    return {
      x: mt * mt * mt * startX + 3 * mt * mt * t * cp1x + 3 * mt * t * t * cp2x + t * t * t * endX,
      y: mt * mt * mt * startY + 3 * mt * mt * t * cp1y + 3 * mt * t * t * cp2y + t * t * t * endY
    };
  };
  
  const beforeHop = bezierPoint(beforeHopT);
  const afterHop = bezierPoint(afterHopT);
  
  // Calculate control points for the first segment (start to before hop)
  // Use De Casteljau's algorithm to split the curve
  const splitAtT = (t: number) => {
    const q0x = startX + t * (cp1x - startX);
    const q0y = startY + t * (cp1y - startY);
    const q1x = cp1x + t * (cp2x - cp1x);
    const q1y = cp1y + t * (cp2y - cp1y);
    const q2x = cp2x + t * (endX - cp2x);
    const q2y = cp2y + t * (endY - cp2y);
    
    const r0x = q0x + t * (q1x - q0x);
    const r0y = q0y + t * (q1y - q0y);
    const r1x = q1x + t * (q2x - q1x);
    const r1y = q1y + t * (q2y - q1y);
    
    return {
      firstCp1x: q0x, firstCp1y: q0y,
      firstCp2x: r0x, firstCp2y: r0y,
      pointX: r0x + t * (r1x - r0x), pointY: r0y + t * (r1y - r0y),
      secondCp1x: r1x, secondCp1y: r1y,
      secondCp2x: q2x, secondCp2y: q2y
    };
  };
  
  // Split at beforeHopT to get control points for first segment
  const splitBefore = splitAtT(beforeHopT);
  
  // Split at afterHopT to get control points for last segment
  const splitAfter = splitAtT(afterHopT);
  
  // Create control points for the hop arc (smooth transition)
  // The hop arc should smoothly connect beforeHop to afterHop via hopCenter
  const hopCp1X = beforeHop.x + (hopCenterX - beforeHop.x) * 0.6;
  const hopCp1Y = beforeHop.y + (hopCenterY - beforeHop.y) * 0.6;
  const hopCp2X = hopCenterX + (afterHop.x - hopCenterX) * 0.6;
  const hopCp2Y = hopCenterY + (afterHop.y - hopCenterY) * 0.6;
  
  // Build path with hop: start -> beforeHop -> hopCenter -> afterHop -> end
  return `M ${startX} ${startY} C ${splitBefore.firstCp1x} ${splitBefore.firstCp1y}, ${splitBefore.firstCp2x} ${splitBefore.firstCp2y}, ${beforeHop.x} ${beforeHop.y} C ${hopCp1X} ${hopCp1Y}, ${hopCp2X} ${hopCp2Y}, ${afterHop.x} ${afterHop.y} C ${splitAfter.secondCp1x} ${splitAfter.secondCp1y}, ${splitAfter.secondCp2x} ${splitAfter.secondCp2y}, ${endX} ${endY}`;
};

// Calculate connection path - simple bezier curve between ports
// No hops, no waypoints - just a clean curve
const getConnectionPath = (
  source: PositionedNode,
  target: PositionedNode,
  allNodes: PositionedNode[],
  allConnections?: Array<{ source: PositionedNode; target: PositionedNode; path: string }>
): string => {
  // Find the specific port positions for this connection
  const sourcePorts = calculateNodePorts(source, allNodes);
  const targetPorts = calculateNodePorts(target, allNodes);

  // Find the output port on source that connects to target
  const outputPort = sourcePorts.outputs.find(p => p.connectionId === target.id);
  // Find the input port on target that receives from source
  const inputPort = targetPorts.inputs.find(p => p.connectionId === source.id);

  // Get port positions (relative to node center)
  let startX: number, startY: number, endX: number, endY: number;

  // Start point: always from right edge of source (where output ports are)
  if (outputPort) {
    startX = source.x + source.width / 2; // Right edge of source node
    startY = source.y + outputPort.y; // Use port's Y position
  } else {
    startX = source.x + source.width / 2;
    startY = source.y;
  }

  // End point: determine best edge based on relative position
  // Calculate the relative position of target from the start point
  const targetCenterX = target.x;
  const targetCenterY = target.y;
  const relativeX = targetCenterX - startX;
  const relativeY = targetCenterY - startY;

  // Determine which edge of the target to connect to
  // If target is primarily to the right and above/below, connect to left edge
  // If target is primarily above (more vertical than horizontal), connect to bottom edge
  // If target is primarily below, connect to top edge
  const absRelX = Math.abs(relativeX);
  const absRelY = Math.abs(relativeY);

  // Calculate the angle to determine approach direction
  const angle = Math.atan2(relativeY, relativeX);
  const angleDeg = (angle * 180) / Math.PI;

  // If target is mostly to the right (within ±60 degrees of horizontal)
  if (absRelX > absRelY * 0.5 && relativeX > 0) {
    // Connect to left edge of target
    if (inputPort) {
      endX = target.x - target.width / 2;
      endY = target.y + inputPort.y;
    } else {
      endX = target.x - target.width / 2;
      endY = target.y;
    }
  } else if (relativeY < 0 && absRelY > absRelX * 0.3) {
    // Target is primarily above - connect to bottom edge
    endX = target.x;
    endY = target.y + target.height / 2;
  } else if (relativeY > 0 && absRelY > absRelX * 0.3) {
    // Target is primarily below - connect to top edge
    endX = target.x;
    endY = target.y - target.height / 2;
  } else {
    // Default: connect to left edge
    if (inputPort) {
      endX = target.x - target.width / 2;
      endY = target.y + inputPort.y;
    } else {
      endX = target.x - target.width / 2;
      endY = target.y;
    }
  }

  // Calculate bezier curve
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Adjust curve factor based on distance and direction
  const curveFactor = Math.min(0.4, Math.max(0.15, distance / 800));

  // Control points for smooth bezier curve
  // Adjust control points based on connection direction
  let cp1x: number, cp1y: number, cp2x: number, cp2y: number;

  if (absRelY > absRelX * 0.5) {
    // More vertical connection - curve horizontally first, then vertically
    const horizontalOffset = Math.min(100, distance * 0.3);
    cp1x = startX + horizontalOffset;
    cp1y = startY;
    cp2x = endX;
    cp2y = endY - (relativeY < 0 ? -1 : 1) * Math.min(50, distance * 0.2);
  } else {
    // More horizontal connection - standard curve
    cp1x = startX + dx * curveFactor;
    cp1y = startY + dy * curveFactor * 0.3;
    cp2x = endX - dx * curveFactor;
    cp2y = endY - dy * curveFactor * 0.3;
  }

  return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
};

// Calculate text width (approximate)
const calculateTextWidth = (text: string, fontSize: number): number => {
  // Approximate: average character width is about 0.6 * fontSize for most fonts
  // Add some extra for safety
  return text.length * fontSize * 0.65;
};

// Wrap text into maximum 3 lines, breaking at word boundaries
const wrapTextToLines = (text: string, maxWidth: number, fontSize: number): string[] => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = calculateTextWidth(testLine, fontSize);
    
    if (testWidth <= maxWidth && lines.length < 3) {
      // Word fits on current line
      currentLine = testLine;
    } else {
      // Word doesn't fit, start a new line
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Single word is too long, add it anyway and break if needed
        lines.push(word);
        currentLine = '';
      }
      
      // Stop if we've reached max lines
      if (lines.length >= 3) {
        if (currentLine) {
          lines.push(currentLine);
        }
        break;
      }
    }
  }
  
  // Add remaining line if we haven't reached max
  if (currentLine && lines.length < 3) {
    lines.push(currentLine);
  }
  
  return lines;
};

// Calculate the maximum width needed for wrapped text (up to 3 lines)
const calculateWrappedTextWidth = (text: string, fontSize: number, maxLines: number = 3): number => {
  // Estimate max width per line based on typical node diameter
  // We'll refine this in calculateNodeRadius, but start with a reasonable estimate
  const estimatedMaxWidth = 200; // pixels, will be refined
  const lines = wrapTextToLines(text, estimatedMaxWidth, fontSize);
  
  // Find the longest line
  let maxLineWidth = 0;
  for (const line of lines) {
    const lineWidth = calculateTextWidth(line, fontSize);
    maxLineWidth = Math.max(maxLineWidth, lineWidth);
  }
  
  return maxLineWidth;
};

// Calculate node radius based on text width (accounting for multi-line wrapping)
// This is kept for backward compatibility and used to calculate width/height
// Calculate required width directly from text requirements (more fluid approach)
const calculateRequiredWidth = (node: Node): number => {
  const pathTaken = node.pathTaken !== false;
  const padding = pathTaken ? TEXT_PADDING : TEXT_PADDING_NOT_TAKEN;
  
  // Career nodes should be the biggest, Spark, Inspiration, and PossiblePath nodes should be smaller
  const typeMultiplier = node.type === 'career' ? 1.4 : (node.type === 'spark' || node.type === 'inspiration' || node.type === 'possiblePath' ? 0.8 : 1.0);
  const minWidth = node.type === 'career' ? 350 : (node.type === 'spark' || node.type === 'inspiration' || node.type === 'possiblePath' ? 200 : 250); // Career nodes have larger minimum width, Spark, Inspiration, and PossiblePath nodes smaller
  const maxWidth = 480; // Max width to prevent nodes from getting too long
  
  // Start with an estimated width based on text
  const words = node.label.split(/\s+/);
  const avgCharsPerWord = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  const estimatedCharsPerLine = Math.ceil(words.length / 2) * (avgCharsPerWord + 1); // Max 2 lines
  const estimatedLineWidth = calculateTextWidth('x'.repeat(estimatedCharsPerLine), BASE_FONT_SIZE);
  
  // Binary search for optimal width (respecting max width)
  let low = minWidth;
  let high = Math.min(maxWidth, Math.max(minWidth * 2, estimatedLineWidth + (padding * 2) * 2)); // Cap high at maxWidth
  let bestWidth = Math.max(minWidth, Math.min(maxWidth, estimatedLineWidth + (padding * 2)));
  
  for (let iteration = 0; iteration < 15; iteration++) {
    const testWidth = Math.min(maxWidth, (low + high) / 2); // Ensure testWidth never exceeds maxWidth
    const availableWidth = testWidth - (padding * 2);
    
    // Calculate adaptive font size for this width
    const fontSize = calculateFontSize(testWidth);
    
    // Wrap text to fit this width (max 2 lines)
    const lines = wrapTextToLines(node.label, availableWidth, fontSize);
    const displayLines = lines.slice(0, 2); // Max 2 lines
    
    // Check if all lines fit
    let allLinesFit = true;
    let maxLineWidth = 0;
    for (const line of displayLines) {
      const lineWidth = calculateTextWidth(line, fontSize);
      maxLineWidth = Math.max(maxLineWidth, lineWidth);
      if (lineWidth > availableWidth) {
        allLinesFit = false;
        break;
      }
    }
    
    if (allLinesFit && displayLines.length <= 2) {
      bestWidth = testWidth;
      // Check if we can go smaller
      const requiredWidthForLines = maxLineWidth + (padding * 2);
      if (requiredWidthForLines < testWidth && requiredWidthForLines >= minWidth) {
        high = testWidth;
      } else {
        // This width works, use it
        bestWidth = testWidth;
        break;
      }
    } else {
      // Need larger width, but don't exceed maxWidth
      low = testWidth;
      if (high > maxWidth) {
        high = maxWidth;
      }
    }
  }
  
  // Apply type multiplier to make career nodes bigger
  const finalWidth = Math.max(minWidth, bestWidth * typeMultiplier);
  
  // Apply max width constraint to prevent nodes from getting too long
  return Math.min(finalWidth, maxWidth);
};

// Keep calculateNodeRadius for backward compatibility (derived from width)
const calculateNodeRadius = (node: Node): number => {
  const width = calculateRequiredWidth(node);
  // Radius is half the width for backward compatibility
  // But we don't use radius for positioning anymore
  return width / 2;
};

// Calculate node dimensions for rectangular patch nodes
// Width is calculated fluidly from text requirements
// Height is dynamic based on number of input/output ports
const calculateNodeSize = (node: Node, allNodes: Node[] = []): { width: number; height: number; radius: number } => {
  // Calculate width directly from text requirements (fluid, no fixed multiplier)
  const width = calculateRequiredWidth(node);
  
  // Calculate number of input and output ports
  let inputCount = 0;
  let outputCount = 0;
  
  // Count input ports (nodes that connect TO this node)
  allNodes.forEach(sourceNode => {
    if (sourceNode.connections && sourceNode.connections.includes(node.id)) {
      inputCount++;
    }
  });
  
  // Count output ports (nodes that this node connects TO)
  if (node.connections) {
    outputCount = node.connections.length;
  }
  
  // Port spacing constants - small 4x4px ports inside nodes
  const portSize = 4; // Port size (4x4px)
  const portSpacing = 20; // Vertical spacing between ports (matches calculateNodePorts)
  const bottomPadding = 12; // Padding from bottom edge
  const topPadding = 8; // Padding from top edge
  
  // Calculate image cover height if image exists (30% of width or 80px min)
  const imageCoverHeight = node.image ? Math.max(width * 0.3, 80) : 0;
  const imageGap = node.image ? 8 : 0; // Gap between image and title
  
  // Calculate title height using the actual width
  const fontSize = calculateFontSize(width);
  const textPadding = TEXT_PADDING;
  const availableWidth = width - (textPadding * 2);
  const lines = wrapTextToLines(node.label, availableWidth, fontSize);
  const displayLines = lines.slice(0, 2); // Max 2 lines
  const lineHeight = fontSize * 1.2;
  const titleHeight = displayLines.length * lineHeight;
  const typeLabelHeight = 14; // Approximate height for type label
  const typeLabelGap = 4; // Gap after title
  
  // Calculate ports area height
  const maxPortCount = Math.max(inputCount, outputCount);
  const portsHeight = maxPortCount > 0 
    ? (maxPortCount - 1) * portSpacing + 8 // Add some padding for port area
    : 0;
  
  // Calculate total required height: image + gap + title + type label + gap + ports + padding
  const totalContentHeight = imageCoverHeight + 
                            imageGap + 
                            titleHeight + 
                            typeLabelGap + 
                            typeLabelHeight + 
                            8 + // Gap after type label
                            portsHeight + 
                            topPadding + 
                            bottomPadding;
  
  // Minimum height based on content (no longer tied to radius)
  const minHeight = 120; // Minimum height for readability
  const height = Math.max(totalContentHeight, minHeight);
  
  // Radius is derived from width for backward compatibility only
  const radius = width / 2;
  
  return { width, height, radius };
};

// Port interface for input/output ports
interface Port {
  x: number;
  y: number;
  label: string;
  connectionId: string; // ID of the connected node
  index: number; // Index in the port array
}

// Calculate input and output ports for a node
// Input ports: nodes that connect TO this node
// Output ports: nodes that this node connects TO
const calculateNodePorts = (node: PositionedNode, allNodes: PositionedNode[]): { inputs: Port[]; outputs: Port[] } => {
  const inputs: Port[] = [];
  const outputs: Port[] = [];
  
  // Find input ports (nodes that connect to this node)
  // Only include nodes where pathTaken is true
  allNodes.forEach(sourceNode => {
    if (sourceNode.connections && sourceNode.connections.includes(node.id)) {
      // Only add as input if the source node was actually taken
      if (sourceNode.pathTaken !== false) {
        inputs.push({
          x: 0, // Will be calculated based on position on left edge
          y: 0, // Will be calculated based on position on left edge
          label: sourceNode.label,
          connectionId: sourceNode.id,
          index: inputs.length,
        });
      }
    }
  });
  
  // Find output ports (nodes that this node connects to)
  // Only include nodes where pathTaken is true
  if (node.connections) {
    node.connections.forEach(targetId => {
      const targetNode = allNodes.find(n => n.id === targetId);
      if (targetNode && targetNode.pathTaken !== false) {
        outputs.push({
          x: 0, // Will be calculated based on position on right edge
          y: 0, // Will be calculated based on position on right edge
          label: targetNode.label,
          connectionId: targetId,
          index: outputs.length,
        });
      }
    });
  }
  
  // Calculate port positions inside the node
  // Ports are small 4x4px squares positioned inside the node boundaries
  // Input ports on the left side, output ports on the right side
  // Ports are positioned BELOW the title
  const portSize = 4; // Size of port square (4x4px)
  const portSpacing = 20; // Vertical spacing between ports (reduced for tighter grouping)
  const topPadding = 8; // Padding from top edge (for title)
  const bottomPadding = 12; // Padding from bottom edge
  const sidePadding = 8; // Horizontal padding from left/right edges (ports inside node) - MUST MATCH RENDERING CODE
  
  // Calculate title height to position ports below it
  // Use the same calculation as the rendering code
  const fontSize = calculateFontSize(node.width);
  const textPadding = TEXT_PADDING;
  const availableWidth = node.width - (textPadding * 2);
  const lines = wrapTextToLines(node.label, availableWidth, fontSize);
  const displayLines = lines.slice(0, 2); // Max 2 lines for top placement
  const lineHeight = fontSize * 1.2;
  const titleHeight = displayLines.length * lineHeight;
  const titleGap = 8; // Gap after title before ports
  
  // Account for image cover at top if image exists
  // Check if node has image property (PositionedNode extends Node which has image)
  const hasImage = (node as any).image !== undefined && (node as any).image !== null;
  const imageCoverHeight = hasImage ? Math.max(node.width * 0.3, 80) : 0; // Use width-based calculation for consistency
  const imageGap = hasImage ? 8 : 0; // Gap between image and title
  
  // Calculate title area height: image + gap + title + gap before ports
  const titleAreaHeight = topPadding + imageCoverHeight + imageGap + titleHeight + titleGap;
  
  // Calculate input port positions (left side, below title)
  // All ports positioned below title area, left-aligned
  // Ports are positioned relative to node center (0,0)
  // Port squares are positioned inside the node, but connections will use the edge
  if (inputs.length > 0) {
    // Calculate where ports start (below title area)
    const portsStartY = -node.height / 2 + titleAreaHeight;
    
    inputs.forEach((port, index) => {
      // Position inside the left edge of the node (for port square display)
      port.x = -node.width / 2 + sidePadding;
      // Position below title, distributed vertically
      port.y = portsStartY + (index * portSpacing);
    });
  }
  
  // Calculate output port positions (right side, below title)
  // All ports positioned below title area, right-aligned
  // Ports are positioned relative to node center (0,0)
  // Port squares are positioned inside the node, but connections will use the edge
  if (outputs.length > 0) {
    // Calculate where ports start (below title area)
    const portsStartY = -node.height / 2 + titleAreaHeight;
    
    outputs.forEach((port, index) => {
      // Position inside the right edge of the node (for port square display)
      port.x = node.width / 2 - sidePadding;
      // Position below title, distributed vertically
      port.y = portsStartY + (index * portSpacing);
    });
  }
  
  return { inputs, outputs };
};

// Calculate arrowhead position
const getArrowheadPoints = (source: PositionedNode, target: PositionedNode): string => {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const angle = Math.atan2(dy, dx);
  const arrowLength = 12;
  const arrowWidth = 8;
  
  const x1 = target.x - target.radius * Math.cos(angle);
  const y1 = target.y - target.radius * Math.sin(angle);
  const x2 = x1 - arrowLength * Math.cos(angle) + arrowWidth * Math.cos(angle - Math.PI / 2);
  const y2 = y1 - arrowLength * Math.sin(angle) + arrowWidth * Math.sin(angle - Math.PI / 2);
  const x3 = x1 - arrowLength * Math.cos(angle) + arrowWidth * Math.cos(angle + Math.PI / 2);
  const y3 = y1 - arrowLength * Math.sin(angle) + arrowWidth * Math.sin(angle + Math.PI / 2);
  
  return `${x1},${y1} ${x2},${y2} ${x3},${y3}`;
};

// Helper to create Konva LinearGradient for active paths
// Konva gradients use normalized coordinates (0-1) relative to shape bounding box
const createActivePathGradient = (): any => {
  // Try to get LinearGradient from cache
  const LinearGradientClass = konvaCache?.LinearGradient;
  
  if (!LinearGradientClass) {
    // Fallback: try to get it from Konva object
    const Konva = konvaCache?.Konva;
    if (Konva && Konva.LinearGradient) {
      try {
        const gradient = new Konva.LinearGradient({
          start: { x: 0, y: 0 },
          end: { x: 1, y: 0 },
          colorStops: [
            0, '#3b82f6',      // Blue
            0.2, '#f59e0b',    // Amber
            0.4, '#eab308',    // Yellow
            0.5, '#f97316',    // Orange
            0.6, '#eab308',    // Yellow
            0.8, '#f59e0b',    // Amber
            1, '#3b82f6',      // Blue
          ],
        });
        return gradient;
      } catch (error) {
        console.error('Error creating LinearGradient from Konva:', error);
        return null;
      }
    }
    // If still not available, return null (will use fallback color)
    return null;
  }
  
  try {
    const gradient = new LinearGradientClass({
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
      colorStops: [
        0, '#3b82f6',      // Blue
        0.2, '#f59e0b',    // Amber
        0.4, '#eab308',    // Yellow
        0.5, '#f97316',    // Orange
        0.6, '#eab308',    // Yellow
        0.8, '#f59e0b',    // Amber
        1, '#3b82f6',      // Blue
      ],
    });
    return gradient;
  } catch (error) {
    console.error('Error creating LinearGradient:', error);
    return null;
  }
};

// Animated Path component for dash animation
const AnimatedPath: React.FC<{
  data: string;
  fill?: string;
  stroke?: string | any;
  strokeWidth?: number;
  lineCap?: 'round' | 'butt' | 'square';
  dash?: number[];
  opacity?: number;
  Path?: any;
  Konva?: any;
}> = ({ data, fill, stroke, strokeWidth, lineCap, dash, opacity, Path, Konva }) => {
  const pathRef = useRef<any>(null);
  
  useEffect(() => {
    if (!pathRef.current || !dash || !Konva) return;
    
    const anim = new Konva.Animation((frame: any) => {
      if (pathRef.current) {
        const offset = -((frame?.time || 0) / 3) % 120;
        pathRef.current.dashOffset(offset);
      }
    }, pathRef.current.getLayer());
    
    anim.start();
    return () => anim.stop();
  }, [dash, Konva]);
  
  if (!Path) return null;
  
  return (
    <Path
      ref={pathRef}
      data={data}
      fill={fill || ''}
      stroke={stroke}
      strokeWidth={strokeWidth}
      lineCap={lineCap}
      dash={dash}
      opacity={opacity}
      listening={false}
    />
  );
};

// Animated Node Group component with smooth hover transitions and caching
const AnimatedNodeGroup: React.FC<{
  nodeId: string;
  x: number;
  y: number;
  isHovered: boolean;
  isSelected: boolean;
  hasOtherSelected: boolean;
  children: React.ReactNode;
  Konva?: any;
  Group?: any;
}> = ({ nodeId, x, y, isHovered, isSelected, hasOtherSelected, children, Konva, Group }) => {
  const groupRef = useRef<any>(null);
  const hoverTweenRef = useRef<any>(null);
  const scaleRef = useRef<number>(1);
  const opacityRef = useRef<number>(1);
  const cacheInitializedRef = useRef<boolean>(false);
  
  // Initialize cache on mount
  useEffect(() => {
    if (!groupRef.current || !Konva || cacheInitializedRef.current) return;
    
    const group = groupRef.current;
    // Cache the group for better performance (only cache when not hovered/selected)
    // We'll invalidate cache on hover/selection changes
    try {
      // Get the node's radius from children to calculate cache size
      // Approximate cache size: 2x radius + padding for hover effects
      const estimatedRadius = 120; // Max node radius
      const cacheSize = (estimatedRadius * 2 + 50) * 2; // 2x for scale, + padding
      group.cache({
        x: -cacheSize / 2,
        y: -cacheSize / 2,
        width: cacheSize,
        height: cacheSize,
        pixelRatio: 2, // Higher quality cache
      });
      cacheInitializedRef.current = true;
    } catch (error) {
      // Cache might fail if group has no children yet, that's okay
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to cache node group:', error);
      }
    }
  }, [Konva]);
  
  useEffect(() => {
    if (!groupRef.current || !Konva) return;
    
    const group = groupRef.current;
    const targetScale = isHovered ? 1.15 : isSelected ? 1.05 : 1;
    const targetOpacity = (hasOtherSelected === true) ? 0.3 : 1;
    
    // Invalidate cache when hover/selection state changes (will be recached after animation)
    if (cacheInitializedRef.current) {
      try {
        group.clearCache();
      } catch (error) {
        // Ignore cache errors
      }
    }
    
    // Stop any existing animation safely
    if (hoverTweenRef.current) {
      try {
        hoverTweenRef.current.stop();
        hoverTweenRef.current.destroy();
      } catch (error) {
        // Tween may already be destroyed, ignore
      }
      hoverTweenRef.current = null;
    }
    
    // Create smooth spring-like transition for growth effect
    // Use different easing for hover in vs out
    const isGrowing = targetScale > scaleRef.current;
    const duration = isGrowing ? 0.3 : 0.2; // Slightly longer for growth

    // Custom elastic easing for bouncy growth effect
    const easing = isGrowing ? Konva.Easings.EaseOut : Konva.Easings.EaseOut;

    hoverTweenRef.current = new Konva.Tween({
      node: group,
      duration: duration,
      easing: easing,
      scaleX: targetScale,
      scaleY: targetScale,
      opacity: targetOpacity,
      onUpdate: () => {
        scaleRef.current = group.scaleX();
        opacityRef.current = group.opacity();
        // Force redraw for smooth animation
        group.getLayer()?.batchDraw();
      },
      onFinish: () => {
        // Re-cache after animation completes for better performance
        if (cacheInitializedRef.current && !isHovered && !isSelected) {
          try {
            const estimatedRadius = 120;
            const cacheSize = (estimatedRadius * 2 + 50) * 2;
            group.cache({
              x: -cacheSize / 2,
              y: -cacheSize / 2,
              width: cacheSize,
              height: cacheSize,
              pixelRatio: 2,
            });
          } catch (error) {
            // Ignore cache errors
          }
        }
      },
    });

    // For hover growth, add a secondary bounce tween
    if (isGrowing && isHovered) {
      // First overshoot slightly, then settle
      const overshootScale = targetScale * 1.03;
      hoverTweenRef.current = new Konva.Tween({
        node: group,
        duration: 0.15,
        easing: Konva.Easings.EaseOut,
        scaleX: overshootScale,
        scaleY: overshootScale,
        opacity: targetOpacity,
        onUpdate: () => {
          scaleRef.current = group.scaleX();
          opacityRef.current = group.opacity();
        },
        onFinish: () => {
          // Settle back to target scale
          const settleTween = new Konva.Tween({
            node: group,
            duration: 0.15,
            easing: Konva.Easings.EaseOut,
            scaleX: targetScale,
            scaleY: targetScale,
            onUpdate: () => {
              scaleRef.current = group.scaleX();
            },
          });
          settleTween.play();
        },
      });
    }
    
    hoverTweenRef.current.play();
    
    return () => {
      if (hoverTweenRef.current) {
        try {
          hoverTweenRef.current.stop();
          hoverTweenRef.current.destroy();
        } catch (error) {
          // Tween may already be destroyed, ignore
        }
        hoverTweenRef.current = null;
      }
    };
  }, [isHovered, isSelected, hasOtherSelected, Konva]);
  
  if (!Group) return null;
  
  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      scaleX={scaleRef.current}
      scaleY={scaleRef.current}
      opacity={opacityRef.current}
      listening={true}
    >
      {children}
    </Group>
  );
};

// Animated Rectangle component for hover glow (patch node style)
const AnimatedHoverGlow: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  cornerRadius: number;
  stroke: string;
  isHovered: boolean;
  Konva?: any;
  Rect?: any;
}> = ({ x, y, width, height, cornerRadius, stroke, isHovered, Konva, Rect }) => {
  const rectRef = useRef<any>(null);
  const opacityTweenRef = useRef<any>(null);
  
  useEffect(() => {
    if (!rectRef.current || !Konva) return;
    
    const rect = rectRef.current;
    const targetOpacity = isHovered ? 0.4 : 0;
    
    if (opacityTweenRef.current) {
      try {
        opacityTweenRef.current.stop();
        opacityTweenRef.current.destroy();
      } catch (error) {
        // Tween may already be destroyed, ignore
      }
      opacityTweenRef.current = null;
    }
    
    opacityTweenRef.current = new Konva.Tween({
      node: rect,
      duration: 0.2,
      easing: Konva.Easings.EaseOut,
      opacity: targetOpacity,
    });
    
    opacityTweenRef.current.play();
    
    return () => {
      if (opacityTweenRef.current) {
        try {
          opacityTweenRef.current.stop();
          opacityTweenRef.current.destroy();
        } catch (error) {
          // Tween may already be destroyed, ignore
        }
        opacityTweenRef.current = null;
      }
    };
  }, [isHovered, Konva]);
  
  if (!Rect) return null;
  
  return (
    <Rect
      ref={rectRef}
      x={x - width / 2 - 8}
      y={y - height / 2 - 8}
      width={width + 16}
      height={height + 16}
      cornerRadius={cornerRadius + 4}
      fill=""
      stroke={stroke}
      strokeWidth={2}
      opacity={0}
      listening={false}
    />
  );
};

// Animated shadow for node rectangle (patch node style)
const AnimatedNodeRect: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  cornerRadius: number;
  fill: string;
  opacity: number;
  stroke: string;
  strokeWidth: number;
  dash?: number[];
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMouseDown: (e: any) => void;
  onClick: (e: any) => void;
  onContextMenu?: (e: any) => void;
  Konva?: any;
  Rect?: any;
}> = ({ x, y, width, height, cornerRadius, fill, opacity, stroke, strokeWidth, dash, isHovered, onMouseEnter, onMouseLeave, onMouseDown, onClick, onContextMenu, Konva, Rect }) => {
  const rectRef = useRef<any>(null);
  const shadowTweenRef = useRef<any>(null);

  // Animate shadow on hover
  useEffect(() => {
    if (!rectRef.current || !Konva) return;

    const rect = rectRef.current;
    const targetShadowBlur = isHovered ? 8 : 0;

    if (shadowTweenRef.current) {
      try {
        shadowTweenRef.current.stop();
        shadowTweenRef.current.destroy();
      } catch (error) {
        // Tween may already be destroyed, ignore
      }
      shadowTweenRef.current = null;
    }

    shadowTweenRef.current = new Konva.Tween({
      node: rect,
      duration: 0.2,
      easing: Konva.Easings.EaseOut,
      shadowBlur: targetShadowBlur,
    });

    shadowTweenRef.current.play();

    return () => {
      if (shadowTweenRef.current) {
        try {
          shadowTweenRef.current.stop();
          shadowTweenRef.current.destroy();
        } catch (error) {
          // Tween may already be destroyed, ignore
        }
        shadowTweenRef.current = null;
      }
    };
  }, [isHovered, Konva]);

  if (!Rect) return null;

  return (
    <Rect
      ref={rectRef}
      x={x - width / 2}
      y={y - height / 2}
      width={width}
      height={height}
      cornerRadius={cornerRadius}
      fill={fill}
      opacity={opacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
      dash={dash}
      shadowBlur={0}
      shadowColor="rgba(0,0,0,0.2)"
      listening={true}
      perfectDrawEnabled={false}
      strokeScaleEnabled={false}
      lineJoin="miter"
      lineCap="butt"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onContextMenu={onContextMenu}
    />
  );
};

// Image cache for preloading node images
const imageCache = new Map<string, HTMLImageElement>();
const imageLoadPromises = new Map<string, Promise<HTMLImageElement | null>>();

// Preload an image and cache it
const preloadImage = (src: string): Promise<HTMLImageElement | null> => {
  // Return cached image if available
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }
  
  // Return existing promise if already loading
  if (imageLoadPromises.has(src)) {
    return imageLoadPromises.get(src)!;
  }
  
  // Create new load promise
  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = src;
  });
  
  imageLoadPromises.set(src, promise);
  return promise;
};

// Preload all images from nodes
const preloadAllImages = (nodes: Node[]): Promise<void> => {
  const imageSources = nodes
    .filter(node => node.image)
    .map(node => node.image!)
    .filter((src, index, self) => self.indexOf(src) === index); // Unique sources only
  
  const promises = imageSources.map(src => preloadImage(src));
  return Promise.all(promises).then(() => {});
};

// Node Image component with loading and smooth transitions
// Full-width cover image positioned at the top of the node, above the title
const NodeImage: React.FC<{
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  cornerRadius?: number;
  opacity?: number;
  scale?: number;
  KonvaImage?: any;
  Konva?: any;
  Group?: any;
  Rect?: any;
  isHovered?: boolean;
}> = ({ src, x, y, width, height, cornerRadius = 12, opacity = 1, scale = 1, KonvaImage, Konva, Group, Rect, isHovered = false }) => {
  // Initialize with cached image if available
  const [image, setImage] = useState<HTMLImageElement | null>(() => {
    return imageCache.get(src) || null;
  });
  const groupRef = useRef<any>(null);
  const imageRef = useRef<any>(null);
  const opacityTweenRef = useRef<any>(null);
  
  // Load image immediately on mount - don't wait for hover
  useEffect(() => {
    // Check cache first (synchronous)
    if (imageCache.has(src)) {
      setImage(imageCache.get(src)!);
      return;
    }
    
    // Start loading immediately - don't wait for hover
    // This ensures images load automatically when nodes are rendered
    preloadImage(src).then(img => {
      if (img) {
        setImage(img);
      }
    });
  }, [src]);
  
  // Set initial opacity when image loads, then animate on hover change
  useEffect(() => {
    if (!groupRef.current || !Konva || !image) return;
    
    const group = groupRef.current;
    const targetOpacity = isHovered ? 0.85 : opacity;
    
    // Set initial opacity immediately when image first loads
    // This ensures images appear right away without waiting for animation
    const currentOpacity = group.opacity();
    if (currentOpacity === 0 || currentOpacity === undefined || currentOpacity === null) {
      group.opacity(targetOpacity);
    }
    
    if (opacityTweenRef.current) {
      try {
        opacityTweenRef.current.stop();
        opacityTweenRef.current.destroy();
      } catch (error) {
        // Tween may already be destroyed, ignore
      }
      opacityTweenRef.current = null;
    }
    
    opacityTweenRef.current = new Konva.Tween({
      node: group,
      duration: 0.2,
      easing: Konva.Easings.EaseOut,
      opacity: targetOpacity,
    });
    
    opacityTweenRef.current.play();
    
    return () => {
      if (opacityTweenRef.current) {
        try {
          opacityTweenRef.current.stop();
          opacityTweenRef.current.destroy();
        } catch (error) {
          // Tween may already be destroyed, ignore
        }
        opacityTweenRef.current = null;
      }
    };
  }, [isHovered, opacity, Konva, image]);
  
  if (!image || !Group || !KonvaImage || !Rect) return null;
  
  // Full-width cover image at the top of the node
  // Use calculated cover height: 30% of width or minimum 80px (matches calculateNodeSize)
  // This ensures the image fits within the node without clipping
  const coverHeight = Math.max(width * 0.3, 80);
  const coverX = -width / 2; // Full width, starting from left edge
  const coverY = -height / 2; // At the very top of the node
  
  // Calculate scale to fill the rectangle while maintaining aspect ratio
  // Use cover behavior: scale to fill, cropping if needed, but preserve aspect ratio
  const scaleX = width / image.width;
  const scaleY = coverHeight / image.height;
  const imageScale = Math.max(scaleX, scaleY); // Cover: use larger scale to fill, maintaining aspect ratio
  
  // Calculate image position to fill the rectangle, top-center aligned
  const scaledWidth = image.width * imageScale;
  const scaledHeight = image.height * imageScale;
  const imageX = coverX + (width - scaledWidth) / 2; // Center horizontally
  const imageY = coverY; // Align to top
  
  // Create clip function for rounded corner masking to match node corners
  // Only round the top corners since the image is at the top of the node
  const clipFunc = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    // Create rounded rectangle with corner radius matching the node
    // Only round top-left and top-right corners since image is at top
    const radius = cornerRadius;
    ctx.moveTo(coverX + radius, coverY);
    ctx.lineTo(coverX + width - radius, coverY);
    ctx.quadraticCurveTo(coverX + width, coverY, coverX + width, coverY + radius);
    ctx.lineTo(coverX + width, coverY + coverHeight);
    ctx.lineTo(coverX, coverY + coverHeight);
    ctx.lineTo(coverX, coverY + radius);
    ctx.quadraticCurveTo(coverX, coverY, coverX + radius, coverY);
    ctx.closePath();
    ctx.clip();
  };
  
  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      opacity={opacity}
      clipFunc={clipFunc}
    >
      {/* Grey background to prevent white gaps while image loads */}
      <Rect
        x={coverX}
        y={coverY}
        width={width}
        height={coverHeight}
        cornerRadius={cornerRadius}
        fill="#e5e7eb"
        listening={false}
        perfectDrawEnabled={false}
      />
      <KonvaImage
        ref={imageRef}
        image={image}
        x={imageX}
        y={imageY}
        scaleX={imageScale}
        scaleY={imageScale}
        listening={false}
      />
    </Group>
  );
};

const CareerOdyssey: React.FC<CareerOdysseyProps> = ({ careerData }) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('CareerOdyssey component rendering, careerData:', careerData ? 'present' : 'missing');
    }
  } catch (e) {
    console.error('Error in CareerOdyssey render:', e);
  }
  
  const [nodes, setNodes] = useState<PositionedNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<PositionedNode | null>(null);
  const [viewBox, setViewBox] = useState<ViewBox>({
    x: 0,
    y: 0,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [nodeDragOffsets, setNodeDragOffsets] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Velocity tracking for momentum scrolling
  const velocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPositionRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const momentumAnimationRef = useRef<number | null>(null);
  const [konvaComponents, setKonvaComponents] = useState<typeof konvaCache>(null);
  const touchStartRef = useRef<{ x: number; y: number; viewBoxX: number; viewBoxY: number } | null>(null);
  const nodeDragStartRef = useRef<{ nodeId: string; startX: number; startY: number; originalX: number; originalY: number; lastOffsetX: number; lastOffsetY: number } | null>(null);
  const [initialViewBox, setInitialViewBox] = useState<ViewBox | null>(null);
  const [homeViewBox, setHomeViewBox] = useState<ViewBox | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastWheelTime = useRef<number>(0);
  const wheelEventCount = useRef<number>(0);
  const viewBoxRef = useRef<ViewBox>(viewBox); // Track current viewBox without triggering re-renders
  const rafIdRef = useRef<number | null>(null); // Track requestAnimationFrame ID for panning
  const activeRafIdsRef = useRef<Set<number>>(new Set()); // Track all active RAF IDs for cleanup
  const isDraggingRef = useRef<boolean>(false); // Track drag state without triggering re-renders
  const cardPositionUpdateTimeoutRef = useRef<number | null>(null); // Track card position update timeout
  const animateViewBoxRafIdRef = useRef<number | null>(null); // Track RAF ID for viewBox animation
  const nodeAnimationRafIdRef = useRef<number | null>(null); // Track RAF ID for node drag animation
  const prevViewBoxRef = useRef<ViewBox>(viewBox); // Track previous viewBox to detect changes

  // Physics simulation refs for subtle bounce effect
  const nodeVelocitiesRef = useRef<Map<string, { vx: number; vy: number }>>(new Map());
  const nodeOffsetsRef = useRef<Map<string, { x: number; y: number }>>(new Map()); // Track offsets in ref to avoid re-render loops
  const physicsRafIdRef = useRef<number | null>(null);
  const physicsActiveRef = useRef<boolean>(true);

  // Physics simulation for subtle node bounce/repulsion - only when nodes actually collide
  useEffect(() => {
    if (nodes.length === 0) return;

    // Physics constants - keep subtle
    const REPULSION_STRENGTH = 0.8; // How strongly nodes push apart (increased for expanded nodes)
    const DAMPING = 0.85; // Velocity decay (lower = faster settle)
    const MIN_VELOCITY = 0.05; // Stop when velocity is tiny
    const COLLISION_PADDING = 15; // Detection padding

    // Initialize velocities for new nodes
    nodes.forEach(node => {
      if (!nodeVelocitiesRef.current.has(node.id)) {
        nodeVelocitiesRef.current.set(node.id, { vx: 0, vy: 0 });
      }
      if (!nodeOffsetsRef.current.has(node.id)) {
        nodeOffsetsRef.current.set(node.id, { x: 0, y: 0 });
      }
    });

    let lastTime = performance.now();

    const simulatePhysics = () => {
      if (!physicsActiveRef.current) {
        physicsRafIdRef.current = requestAnimationFrame(simulatePhysics);
        return;
      }

      const now = performance.now();
      const deltaTime = Math.min((now - lastTime) / 16.67, 2); // Cap delta to prevent jumps
      lastTime = now;

      // Don't run physics while dragging a node
      if (draggingNodeId) {
        physicsRafIdRef.current = requestAnimationFrame(simulatePhysics);
        return;
      }

      const nodesWithVelocity = new Set<string>();

      // Calculate repulsion forces only between overlapping node pairs
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];

          const offsetA = nodeOffsetsRef.current.get(nodeA.id) || { x: 0, y: 0 };
          const offsetB = nodeOffsetsRef.current.get(nodeB.id) || { x: 0, y: 0 };

          const posAX = nodeA.x + offsetA.x;
          const posAY = nodeA.y + offsetA.y;
          const posBX = nodeB.x + offsetB.x;
          const posBY = nodeB.y + offsetB.y;

          // Get node dimensions with collision padding
          const aWidth = (nodeA.width || 200) + COLLISION_PADDING;
          const aHeight = (nodeA.height || 120) + COLLISION_PADDING;
          const bWidth = (nodeB.width || 200) + COLLISION_PADDING;
          const bHeight = (nodeB.height || 120) + COLLISION_PADDING;

          // Check rectangular overlap
          const overlapX = (aWidth / 2 + bWidth / 2) - Math.abs(posBX - posAX);
          const overlapY = (aHeight / 2 + bHeight / 2) - Math.abs(posBY - posAY);

          if (overlapX > 0 && overlapY > 0) {
            // Only these two nodes are colliding - apply repulsion just to them
            const dx = posBX - posAX;
            const dy = posBY - posAY;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;

            // Normalize direction
            const nx = dx / distance;
            const ny = dy / distance;

            // Force proportional to overlap
            const overlap = Math.min(overlapX, overlapY);
            const force = overlap * REPULSION_STRENGTH * deltaTime;

            // Apply force to velocities of just these two nodes
            const velA = nodeVelocitiesRef.current.get(nodeA.id) || { vx: 0, vy: 0 };
            const velB = nodeVelocitiesRef.current.get(nodeB.id) || { vx: 0, vy: 0 };

            velA.vx -= nx * force;
            velA.vy -= ny * force;
            velB.vx += nx * force;
            velB.vy += ny * force;

            nodeVelocitiesRef.current.set(nodeA.id, velA);
            nodeVelocitiesRef.current.set(nodeB.id, velB);

            nodesWithVelocity.add(nodeA.id);
            nodesWithVelocity.add(nodeB.id);
          }
        }
      }

      // Update positions only for nodes that have velocity
      const updatedNodes: string[] = [];

      nodes.forEach(node => {
        const vel = nodeVelocitiesRef.current.get(node.id);
        if (!vel) return;

        // Only process nodes that have or had velocity
        if (Math.abs(vel.vx) > MIN_VELOCITY || Math.abs(vel.vy) > MIN_VELOCITY) {
          // Apply damping
          vel.vx *= DAMPING;
          vel.vy *= DAMPING;

          const currentOffset = nodeOffsetsRef.current.get(node.id) || { x: 0, y: 0 };
          const newOffset = {
            x: currentOffset.x + vel.vx,
            y: currentOffset.y + vel.vy,
          };
          nodeOffsetsRef.current.set(node.id, newOffset);
          updatedNodes.push(node.id);

          nodeVelocitiesRef.current.set(node.id, vel);
        } else if (vel.vx !== 0 || vel.vy !== 0) {
          // Stop tiny velocities
          vel.vx = 0;
          vel.vy = 0;
          nodeVelocitiesRef.current.set(node.id, vel);
        }
      });

      // Only update React state for nodes that actually moved
      if (updatedNodes.length > 0) {
        setNodeDragOffsets(prev => {
          const next = new Map(prev);
          updatedNodes.forEach(nodeId => {
            const offset = nodeOffsetsRef.current.get(nodeId);
            if (offset) {
              next.set(nodeId, { ...offset });
            }
          });
          return next;
        });
      }

      // Continue animation loop
      physicsRafIdRef.current = requestAnimationFrame(simulatePhysics);
    };

    // Start physics loop
    physicsRafIdRef.current = requestAnimationFrame(simulatePhysics);

    return () => {
      if (physicsRafIdRef.current) {
        cancelAnimationFrame(physicsRafIdRef.current);
      }
    };
  }, [nodes, draggingNodeId, selectedNode]); // Re-run when nodes change, dragging, or selection changes

  // Sync nodeOffsetsRef with nodeDragOffsets when user drags
  useEffect(() => {
    nodeDragOffsets.forEach((offset, nodeId) => {
      nodeOffsetsRef.current.set(nodeId, { ...offset });
    });
  }, [nodeDragOffsets]);

  // Load Konva on client side only
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('CareerOdyssey useEffect running, window:', typeof window !== 'undefined');
    }
    if (typeof window !== 'undefined') {
      if (process.env.NODE_ENV === 'development') {
        console.log('Starting Konva load...');
      }
      loadKonva().then((components) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Konva load completed, components:', components ? 'loaded' : 'failed');
        }
        if (components) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Setting konvaComponents state');
          }
          setKonvaComponents(components);
        } else {
          console.error('Konva components failed to load');
        }
      }).catch((error) => {
        console.error('Error loading Konva:', error);
      });
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('Window is undefined, skipping Konva load');
      }
    }
  }, []);
  
  // Helper to convert viewBox to Konva stage state
  const viewBoxToStageState = useCallback((vb: ViewBox, containerWidth: number, containerHeight: number): StageState => {
    const scale = containerWidth / vb.width;
    return {
      scale,
      x: -vb.x * scale,
      y: -vb.y * scale,
    };
  }, []);
  
  // Helper to convert Konva stage state to viewBox
  const stageStateToViewBox = useCallback((state: StageState, containerWidth: number, containerHeight: number): ViewBox => {
    const width = containerWidth / state.scale;
    const height = containerHeight / state.scale;
    return {
      x: -state.x / state.scale,
      y: -state.y / state.scale,
      width,
      height,
    };
  }, []);
  
  // Get current stage state from viewBox
  const stageState = useMemo(() => {
    if (stageSize.width === 0 || stageSize.height === 0) {
      return { scale: 1, x: 0, y: 0 };
    }
    return viewBoxToStageState(viewBox, stageSize.width, stageSize.height);
  }, [viewBox, stageSize, viewBoxToStageState]);
  
  // Keep viewBoxRef in sync with viewBox state
  useEffect(() => {
    viewBoxRef.current = viewBox;
  }, [viewBox]);

  // Sync stage with viewBox changes (only when not dragging to avoid flicker)
  // Use debouncing to reduce flicker during rapid updates
  const syncStageTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (konvaComponents && stageRef.current && stageSize.width > 0 && stageSize.height > 0 && konvaComponents.Konva && !isDraggingRef.current) {
      // Clear any pending sync
      if (syncStageTimeoutRef.current !== null) {
        clearTimeout(syncStageTimeoutRef.current);
      }
      
      // Debounce stage sync to reduce flicker (only sync after 16ms of no changes)
      syncStageTimeoutRef.current = window.setTimeout(() => {
        if (stageRef.current && !isDraggingRef.current) {
          const state = viewBoxToStageState(viewBox, stageSize.width, stageSize.height);
          stageRef.current.scale({ x: state.scale, y: state.scale });
          stageRef.current.position({ x: state.x, y: state.y });
          stageRef.current.batchDraw(); // Use batchDraw for better performance
        }
      }, 16); // ~60fps
    }
    
    return () => {
      if (syncStageTimeoutRef.current !== null) {
        clearTimeout(syncStageTimeoutRef.current);
      }
    };
  }, [viewBox, stageSize, viewBoxToStageState, konvaComponents]);

  // Cleanup effect: Cancel all RAFs, remove event listeners, and clear timeouts on unmount
  useEffect(() => {
    return () => {
      // Cancel all active RAFs
      activeRafIdsRef.current.forEach(rafId => {
        cancelAnimationFrame(rafId);
      });
      activeRafIdsRef.current.clear();
      
      // Clear specific RAF refs
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (animateViewBoxRafIdRef.current !== null) {
        cancelAnimationFrame(animateViewBoxRafIdRef.current);
        animateViewBoxRafIdRef.current = null;
      }
      if (nodeAnimationRafIdRef.current !== null) {
        cancelAnimationFrame(nodeAnimationRafIdRef.current);
        nodeAnimationRafIdRef.current = null;
      }
      
      // Clear timeouts
      if (syncStageTimeoutRef.current !== null) {
        clearTimeout(syncStageTimeoutRef.current);
        syncStageTimeoutRef.current = null;
      }
      if (cardPositionUpdateTimeoutRef.current !== null) {
        clearTimeout(cardPositionUpdateTimeoutRef.current);
        cardPositionUpdateTimeoutRef.current = null;
      }
      
      // Reset dragging states
      isDraggingRef.current = false;
      touchStartRef.current = null;
      nodeDragStartRef.current = null;
      
      // Cleanup momentum animation
      if (momentumAnimationRef.current !== null) {
        cancelAnimationFrame(momentumAnimationRef.current);
        momentumAnimationRef.current = null;
      }
    };
  }, []);

  // Initialize nodes
  useEffect(() => {
    if (!careerData || !careerData.nodes || careerData.nodes.length === 0) {
      console.error('No career data provided or nodes array is empty', { careerData: !!careerData });
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Initializing nodes, careerData.nodes length:', careerData.nodes.length);
    }
    
    // Start preloading images immediately (don't wait for layout calculation)
    preloadAllImages(careerData.nodes as Node[]).catch((error) => {
      console.error('Error preloading images:', error);
    });
    
    try {
      const positionedNodes = calculateLayout(careerData.nodes as Node[]);
      
      // Safety check: ensure nodes were created
      if (!positionedNodes || positionedNodes.length === 0) {
        console.error('No nodes were created from career data');
        return;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Nodes initialized:', positionedNodes.length, 'nodes', {
          firstNode: positionedNodes[0] ? { id: positionedNodes[0].id, x: positionedNodes[0].x, y: positionedNodes[0].y } : null
        });
      }
      
      // Set nodes immediately for faster rendering
      setNodes(positionedNodes);
      
      // Set actual size viewBox (1:1 scale, full canvas visible)
      // This is the "actual size" reference for the home button
      const actualSizeVB = {
        x: 0,
        y: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      };
      setInitialViewBox(actualSizeVB);
      
      // Calculate bounds of all nodes to fit them in the initial view
      const nodeBounds = positionedNodes.reduce((bounds, node) => {
        const nodeLeft = node.x - (node.width || node.radius * 2) / 2;
        const nodeRight = node.x + (node.width || node.radius * 2) / 2;
        const nodeTop = node.y - (node.height || node.radius * 2) / 2;
        const nodeBottom = node.y + (node.height || node.radius * 2) / 2;
        
        return {
          minX: Math.min(bounds.minX, nodeLeft),
          maxX: Math.max(bounds.maxX, nodeRight),
          minY: Math.min(bounds.minY, nodeTop),
          maxY: Math.max(bounds.maxY, nodeBottom),
        };
      }, {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity,
      });
      
      // Add padding around nodes
      const boundsPadding = 200;
      const contentWidth = nodeBounds.maxX - nodeBounds.minX + (boundsPadding * 2);
      const contentHeight = nodeBounds.maxY - nodeBounds.minY + (boundsPadding * 2);
      const contentCenterX = (nodeBounds.minX + nodeBounds.maxX) / 2;
      const contentCenterY = (nodeBounds.minY + nodeBounds.maxY) / 2;
      
      // Find Present/Now nodes to center the view on them
      const presentNodesForView = positionedNodes.filter(n => isPresentNode(n));

      let defaultVB: ViewBox;

      if (presentNodesForView.length > 0) {
        // Calculate bounds of Present nodes
        const presentBounds = presentNodesForView.reduce((bounds, node) => {
          const nodeLeft = node.x - (node.width || node.radius * 2) / 2;
          const nodeRight = node.x + (node.width || node.radius * 2) / 2;
          const nodeTop = node.y - (node.height || node.radius * 2) / 2;
          const nodeBottom = node.y + (node.height || node.radius * 2) / 2;

          return {
            minX: Math.min(bounds.minX, nodeLeft),
            maxX: Math.max(bounds.maxX, nodeRight),
            minY: Math.min(bounds.minY, nodeTop),
            maxY: Math.max(bounds.maxY, nodeBottom),
          };
        }, {
          minX: Infinity,
          maxX: -Infinity,
          minY: Infinity,
          maxY: -Infinity,
        });

        // Add padding around Present nodes
        const viewPadding = 200;
        const presentWidth = presentBounds.maxX - presentBounds.minX + (viewPadding * 2);
        const presentHeight = presentBounds.maxY - presentBounds.minY + (viewPadding * 2);
        const presentCenterX = (presentBounds.minX + presentBounds.maxX) / 2;
        const presentCenterY = (presentBounds.minY + presentBounds.maxY) / 2;

        // Use 16:9 aspect ratio for consistent display
        const aspectRatio = 16 / 9;
        let defaultWidth = presentWidth;
        let defaultHeight = presentHeight;

        // Adjust to maintain aspect ratio
        if (defaultWidth / defaultHeight > aspectRatio) {
          // Too wide, increase height
          defaultHeight = defaultWidth / aspectRatio;
        } else {
          // Too tall, increase width
          defaultWidth = defaultHeight * aspectRatio;
        }

        defaultVB = {
          x: presentCenterX - defaultWidth / 2,
          y: presentCenterY - defaultHeight / 2,
          width: defaultWidth,
          height: defaultHeight,
        };
      } else {
        // Fallback: center on all content
        const defaultWidth = contentWidth * 1.2;
        const defaultHeight = contentHeight * 1.2;

        defaultVB = {
          x: contentCenterX - defaultWidth / 2,
          y: contentCenterY - defaultHeight / 2,
          width: defaultWidth,
          height: defaultHeight,
        };
      }
      
      setViewBox(defaultVB);
      // Store the fit-all view as the home view
      setHomeViewBox(defaultVB);
    } catch (error) {
      console.error('Error initializing nodes:', error);
    }
  }, [careerData]);

  // Track window size for responsive behavior and update stage size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    const updateStageSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newSize = { width: rect.width, height: rect.height };
        if (newSize.width > 0 && newSize.height > 0) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Updating stage size:', newSize);
          }
          setStageSize(newSize);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Container has zero size:', rect);
          }
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('containerRef.current is null, cannot update stage size');
        }
      }
    };
    
    // Check on mount
    checkIsMobile();
    
    // Use multiple attempts to ensure containerRef is set and has size
    const attemptUpdate = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          updateStageSize();
        } else {
          // Retry if size is still zero
          setTimeout(attemptUpdate, 50);
        }
      } else {
        // Retry if ref is not set
        setTimeout(attemptUpdate, 50);
      }
    };
    
    // Initial attempt
    setTimeout(attemptUpdate, 0);
    
    // Use ResizeObserver for better size tracking
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            setStageSize({ width, height });
          }
        }
      });
      resizeObserver.observe(containerRef.current);
    }
    
    // Listen for resize events as fallback
    const handleResize = () => {
      checkIsMobile();
      updateStageSize();
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Handle Escape key to close card
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedNode) {
        setSelectedNode(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNode]);


  // Apply momentum scrolling after drag ends
  const applyMomentum = useCallback(() => {
    if (!stageRef.current || !containerRef.current) return;
    
    const stage = stageRef.current;
    const minVelocity = 0.5; // Stop when velocity is below this threshold
    
    // Calculate initial speed to determine dynamic friction
    const initialSpeed = Math.sqrt(velocityRef.current.x ** 2 + velocityRef.current.y ** 2);
    
    // Dynamic friction based on initial velocity
    // Faster pans = less friction (more momentum), slower pans = more friction (less momentum)
    // Speed ranges: 0-2 = 0.92 friction, 2-5 = 0.94 friction, 5-10 = 0.96 friction, 10+ = 0.98 friction
    // This makes fast pans "fly" more
    let baseFriction: number;
    if (initialSpeed < 2) {
      baseFriction = 0.92; // Slower pans decelerate faster
    } else if (initialSpeed < 5) {
      baseFriction = 0.94;
    } else if (initialSpeed < 10) {
      baseFriction = 0.96;
    } else {
      baseFriction = 0.98; // Fast pans have very little friction initially
    }
    
    // Boost velocity for very fast pans to make them "fly"
    let velocityMultiplier = 1;
    if (initialSpeed > 8) {
      velocityMultiplier = 1.3; // 30% boost for very fast pans
    } else if (initialSpeed > 5) {
      velocityMultiplier = 1.15; // 15% boost for fast pans
    }
    
    // Apply velocity multiplier
    velocityRef.current = {
      x: velocityRef.current.x * velocityMultiplier,
      y: velocityRef.current.y * velocityMultiplier,
    };
    
    // Progressive friction: start with less friction, gradually increase as speed decreases
    // This creates a more natural deceleration curve
    let frameCount = 0;
    
    const animate = () => {
      if (!stageRef.current || !containerRef.current) {
        momentumAnimationRef.current = null;
        return;
      }
      
      frameCount++;
      
      const vx = velocityRef.current.x;
      const vy = velocityRef.current.y;
      const currentSpeed = Math.sqrt(vx ** 2 + vy ** 2);
      
      // Stop if velocity is too low
      if (currentSpeed < minVelocity) {
        velocityRef.current = { x: 0, y: 0 };
        momentumAnimationRef.current = null;
        
        // Final sync of viewBox state
        const rect = containerRef.current.getBoundingClientRect();
        const newViewBox = stageStateToViewBox(
          { scale: stage.scaleX(), x: stage.x(), y: stage.y() },
          rect.width,
          rect.height
        );
        viewBoxRef.current = newViewBox;
        setViewBox(newViewBox);
        return;
      }
      
      // Progressive friction: as speed decreases, friction increases (deceleration gets stronger)
      // This creates a more natural feel - fast movement coasts longer, slow movement stops quicker
      let dynamicFriction = baseFriction;
      if (currentSpeed < initialSpeed * 0.3) {
        // When speed drops below 30% of initial, increase friction significantly
        dynamicFriction = baseFriction * 0.97; // More aggressive deceleration
      } else if (currentSpeed < initialSpeed * 0.5) {
        // When speed drops below 50% of initial, slightly increase friction
        dynamicFriction = baseFriction * 0.99;
      }
      
      // Apply velocity to stage position
      const currentX = stage.x();
      const currentY = stage.y();
      stage.position({
        x: currentX + vx,
        y: currentY + vy,
      });
      
      // Apply dynamic friction to velocity
      velocityRef.current = {
        x: vx * dynamicFriction,
        y: vy * dynamicFriction,
      };
      
      // Update viewBox
      const rect = containerRef.current.getBoundingClientRect();
      const newViewBox = stageStateToViewBox(
        { scale: stage.scaleX(), x: stage.x(), y: stage.y() },
        rect.width,
        rect.height
      );
      viewBoxRef.current = newViewBox;
      
      // Force redraw
      stage.batchDraw();
      
      // Continue animation
      momentumAnimationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    momentumAnimationRef.current = requestAnimationFrame(animate);
  }, [stageStateToViewBox]);

  // Pan functionality with Konva (optimized to reduce flicker)
  const handleStageMouseDown = useCallback((e: any) => {
    if (e.evt.button !== 0) return; // Only left mouse button
    if (e.evt.metaKey || e.evt.ctrlKey) return; // Prevent macOS swipe gestures
    
    // Cancel any ongoing momentum animation
    if (momentumAnimationRef.current !== null) {
      cancelAnimationFrame(momentumAnimationRef.current);
      momentumAnimationRef.current = null;
    }
    velocityRef.current = { x: 0, y: 0 };
    lastPositionRef.current = null;
    
    setIsDragging(true);
    isDraggingRef.current = true;
    if (!stageRef.current || !containerRef.current) return;
    
    const stage = stageRef.current;
    const startX = e.evt.clientX;
    const startY = e.evt.clientY;
    const startPos = { x: stage.x(), y: stage.y() };
    const startTime = performance.now();
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!stageRef.current || !containerRef.current) return;
      
      const currentTime = performance.now();
      const currentX = moveEvent.clientX;
      const currentY = moveEvent.clientY;
      
      // Calculate velocity based on recent movement
      if (lastPositionRef.current) {
        const timeDelta = currentTime - lastPositionRef.current.time;
        if (timeDelta > 0) {
          const distanceX = currentX - lastPositionRef.current.x;
          const distanceY = currentY - lastPositionRef.current.y;
          // Velocity in pixels per millisecond, smoothed
          velocityRef.current = {
            x: distanceX / timeDelta,
            y: distanceY / timeDelta,
          };
        }
      }
      
      // Update last position for next velocity calculation
      lastPositionRef.current = {
        x: currentX,
        y: currentY,
        time: currentTime,
      };
      
      // Cancel any pending RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      
      // Update stage position directly (no React re-render)
      stage.position({
        x: startPos.x + deltaX,
        y: startPos.y + deltaY,
      });
      
      // Throttle viewBox state update using requestAnimationFrame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        activeRafIdsRef.current.delete(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => {
        if (!containerRef.current || !stageRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const newViewBox = stageStateToViewBox(
          { scale: stage.scaleX(), x: stage.x(), y: stage.y() },
          rect.width,
          rect.height
        );
        
        // Update ref immediately for calculations
        viewBoxRef.current = newViewBox;
        
        // Remove from active set when completed
        if (rafIdRef.current !== null) {
          activeRafIdsRef.current.delete(rafIdRef.current);
        }
      });
      if (rafIdRef.current !== null) {
        activeRafIdsRef.current.add(rafIdRef.current);
      }
      
      // Force redraw for smooth animation
      stage.batchDraw();
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      
      // Cancel any pending RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        activeRafIdsRef.current.delete(rafIdRef.current);
        rafIdRef.current = null;
      }
      
      // Final sync of viewBox state after drag ends
      if (containerRef.current && stageRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newViewBox = stageStateToViewBox(
          { scale: stageRef.current.scaleX(), x: stageRef.current.x(), y: stageRef.current.y() },
          rect.width,
          rect.height
        );
        viewBoxRef.current = newViewBox;
        setViewBox(newViewBox);
      }
      
      // Apply momentum if there's significant velocity
      const speed = Math.sqrt(velocityRef.current.x ** 2 + velocityRef.current.y ** 2);
      if (speed > 0.1) {
        applyMomentum();
      } else {
        velocityRef.current = { x: 0, y: 0 };
      }
      
      lastPositionRef.current = null;
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };

    // Initialize last position
    lastPositionRef.current = {
      x: startX,
      y: startY,
      time: startTime,
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);
  }, [stageStateToViewBox, applyMomentum]);

  // Touch support for mobile/trackpad with Konva
  const handleStageTouchStart = useCallback((e: any) => {
    if (e.evt.touches.length !== 1) return; // Only handle single touch for panning
    
    // Cancel any ongoing momentum animation
    if (momentumAnimationRef.current !== null) {
      cancelAnimationFrame(momentumAnimationRef.current);
      momentumAnimationRef.current = null;
    }
    velocityRef.current = { x: 0, y: 0 };
    lastPositionRef.current = null;
    
    setIsDragging(true);
    isDraggingRef.current = true;
    if (!stageRef.current) return;
    
    const stage = stageRef.current;
    const touch = e.evt.touches[0];
    const currentViewBox = viewBoxRef.current;
    const startTime = performance.now();
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      viewBoxX: currentViewBox.x,
      viewBoxY: currentViewBox.y,
    };
    
    // Initialize last position for velocity tracking
    lastPositionRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: startTime,
    };
  }, []);

  const handleStageTouchMove = useCallback((e: any) => {
    if (!touchStartRef.current || e.evt.touches.length !== 1 || !stageRef.current) return;
    
    const stage = stageRef.current;
    const touch = e.evt.touches[0];
    if (!containerRef.current) return;
    
    const currentTime = performance.now();
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    
    // Calculate velocity based on recent movement
    if (lastPositionRef.current) {
      const timeDelta = currentTime - lastPositionRef.current.time;
      if (timeDelta > 0) {
        const distanceX = currentX - lastPositionRef.current.x;
        const distanceY = currentY - lastPositionRef.current.y;
        // Velocity in screen pixels per millisecond (same as mouse handler)
        // This will be applied directly to stage position
        velocityRef.current = {
          x: distanceX / timeDelta,
          y: distanceY / timeDelta,
        };
      }
    }
    
    // Update last position for next velocity calculation
    lastPositionRef.current = {
      x: currentX,
      y: currentY,
      time: currentTime,
    };
    
    // Cancel any pending RAF
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    const deltaX = currentX - touchStartRef.current.x;
    const deltaY = currentY - touchStartRef.current.y;
    
    const rect = containerRef.current.getBoundingClientRect();
    const currentViewBox = viewBoxRef.current;
    const svgDeltaX = (deltaX / rect.width) * currentViewBox.width;
    const svgDeltaY = (deltaY / rect.height) * currentViewBox.height;
    
    const newViewBox = {
      ...currentViewBox,
      x: touchStartRef.current.viewBoxX - svgDeltaX,
      y: touchStartRef.current.viewBoxY - svgDeltaY,
    };
    
    // Update ref immediately
    viewBoxRef.current = newViewBox;
    
    // Update stage position directly
    const newState = viewBoxToStageState(newViewBox, rect.width, rect.height);
    stage.position({ x: newState.x, y: newState.y });
    stage.batchDraw();
    
    // Throttle state update
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      activeRafIdsRef.current.delete(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      setViewBox(newViewBox);
      // Remove from active set when completed
      if (rafIdRef.current !== null) {
        activeRafIdsRef.current.delete(rafIdRef.current);
      }
    });
    if (rafIdRef.current !== null) {
      activeRafIdsRef.current.add(rafIdRef.current);
    }
  }, [viewBoxToStageState]);

  const handleStageTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    
    // Cancel any pending RAF
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      activeRafIdsRef.current.delete(rafIdRef.current);
      rafIdRef.current = null;
    }
    
    // Final sync of viewBox state after drag ends
    if (containerRef.current && stageRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newViewBox = stageStateToViewBox(
        { scale: stageRef.current.scaleX(), x: stageRef.current.x(), y: stageRef.current.y() },
        rect.width,
        rect.height
      );
      viewBoxRef.current = newViewBox;
      setViewBox(newViewBox);
    }
    
    // Apply momentum if there's significant velocity
    const speed = Math.sqrt(velocityRef.current.x ** 2 + velocityRef.current.y ** 2);
    if (speed > 0.1) {
      applyMomentum();
    } else {
      velocityRef.current = { x: 0, y: 0 };
    }
    
    touchStartRef.current = null;
    lastPositionRef.current = null;
  }, [stageStateToViewBox, applyMomentum]);

  // Trackpad vs mouse wheel detection
  const isTrackpadPan = useCallback((e: React.WheelEvent): boolean => {
    const now = Date.now();
    const timeSinceLastWheel = now - lastWheelTime.current;
    
    // Trackpad typically sends many small events in quick succession
    if (timeSinceLastWheel < 50) {
      wheelEventCount.current++;
    } else {
      wheelEventCount.current = 1;
    }
    
    lastWheelTime.current = now;
    
    // If multiple wheel events in quick succession with small deltas, it's likely a trackpad
    const isLikelyTrackpad = 
      Math.abs(e.deltaY) < 50 && 
      Math.abs(e.deltaX) < 50 &&
      (wheelEventCount.current > 1 || Math.abs(e.deltaY) < 10);
    
    return isLikelyTrackpad;
  }, []);

  // Zoom functionality with trackpad panning support (Konva) - optimized to reduce flicker
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!stageRef.current || !containerRef.current) return;
    
    // Cancel any pending RAF
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    const stage = stageRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    const currentViewBox = viewBoxRef.current;
    
    // Check for Control/Cmd + scroll for zoom
    const isZoomGesture = e.ctrlKey || e.metaKey;
    
    // If Control/Cmd is held, always zoom (ignore trackpad pan detection)
    if (isZoomGesture) {
      // Zoom functionality
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Convert mouse position to SVG coordinates
      const svgX = currentViewBox.x + (mouseX / rect.width) * currentViewBox.width;
      const svgY = currentViewBox.y + (mouseY / rect.height) * currentViewBox.height;
      
      // Zoom factor (invert deltaY for natural zoom direction)
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newWidth = currentViewBox.width * zoomFactor;
      const newHeight = currentViewBox.height * zoomFactor;
      
      // Clamp zoom
      const minZoom = CANVAS_WIDTH / 4;
      const maxZoom = CANVAS_WIDTH * 2;
      if (newWidth < minZoom || newWidth > maxZoom) return;
      
      // Adjust viewBox to zoom towards mouse position
      const newX = svgX - (mouseX / rect.width) * newWidth;
      const newY = svgY - (mouseY / rect.height) * newHeight;
      
      const newViewBox = {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      };
      
      // Update ref immediately
      viewBoxRef.current = newViewBox;
      
      // Update stage position and scale directly
      const newState = viewBoxToStageState(newViewBox, rect.width, rect.height);
      stage.scale({ x: newState.scale, y: newState.scale });
      stage.position({ x: newState.x, y: newState.y });
      stage.batchDraw();
      
      // Throttle state update
      rafIdRef.current = requestAnimationFrame(() => {
        setViewBox(newViewBox);
      });
      
      return;
    }
    
    // Detect trackpad panning (two-finger scroll) - only if not zooming
    if (isTrackpadPan(e)) {
      // Pan instead of zoom - smooth trackpad scrolling
      const panSpeed = 0.8;
      const svgDeltaX = (e.deltaX * panSpeed * currentViewBox.width) / rect.width;
      const svgDeltaY = (e.deltaY * panSpeed * currentViewBox.height) / rect.height;
      
      const newViewBox = {
        ...currentViewBox,
        x: currentViewBox.x - svgDeltaX,
        y: currentViewBox.y - svgDeltaY,
      };
      
      // Update ref immediately
      viewBoxRef.current = newViewBox;
      
      // Update stage position directly
      const newState = viewBoxToStageState(newViewBox, rect.width, rect.height);
      stage.position({ x: newState.x, y: newState.y });
      stage.batchDraw();
      
      // Throttle state update
      rafIdRef.current = requestAnimationFrame(() => {
        setViewBox(newViewBox);
      });
      return;
    }
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert mouse position to SVG coordinates
    const svgX = currentViewBox.x + (mouseX / rect.width) * currentViewBox.width;
    const svgY = currentViewBox.y + (mouseY / rect.height) * currentViewBox.height;
    
    // Calculate zoom
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const newWidth = currentViewBox.width * zoomFactor;
    const newHeight = currentViewBox.height * zoomFactor;
    
    // Clamp zoom
    const minZoom = CANVAS_WIDTH / 4;
    const maxZoom = CANVAS_WIDTH * 2;
    if (newWidth < minZoom || newWidth > maxZoom) return;
    
    // Adjust viewBox to zoom towards mouse position
    const newX = svgX - (mouseX / rect.width) * newWidth;
    const newY = svgY - (mouseY / rect.height) * newHeight;
    
    const newViewBox = {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    };
    
    // Update ref immediately
    viewBoxRef.current = newViewBox;
    
    // Update stage scale and position directly
    const newState = viewBoxToStageState(newViewBox, rect.width, rect.height);
    stage.scale({ x: newState.scale, y: newState.scale });
    stage.position({ x: newState.x, y: newState.y });
    stage.batchDraw();
    
    // Throttle state update
    rafIdRef.current = requestAnimationFrame(() => {
      setViewBox(newViewBox);
    });
  }, [isTrackpadPan, viewBoxToStageState]);

  // Node drag handler (updated for Konva)
  const handleNodeMouseDown = useCallback((node: PositionedNode, e: MouseEvent) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('handleNodeMouseDown called', { nodeId: node.id, button: e.button, metaKey: e.metaKey, ctrlKey: e.ctrlKey });
    }
    
    e.stopPropagation(); // Prevent canvas panning
    
    if (e.button !== 0) return; // Only left mouse button
    if (e.metaKey || e.ctrlKey) return; // Don't drag with modifier keys
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Starting node drag for:', node.id);
    }
    setDraggingNodeId(node.id);
    const currentOffset = nodeDragOffsets.get(node.id) || { x: 0, y: 0 };
    
    nodeDragStartRef.current = {
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      originalX: node.x + currentOffset.x,
      originalY: node.y + currentOffset.y,
      lastOffsetX: currentOffset.x,
      lastOffsetY: currentOffset.y,
    };

    let hasMoved = false;
    let maxDragDistance = 0;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!nodeDragStartRef.current || nodeDragStartRef.current.nodeId !== node.id) return;
      
      const deltaX = moveEvent.clientX - nodeDragStartRef.current.startX;
      const deltaY = moveEvent.clientY - nodeDragStartRef.current.startY;
      const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Track maximum drag distance
      maxDragDistance = Math.max(maxDragDistance, dragDistance);
      
      // Track if mouse has moved significantly (more than 3px)
      if (dragDistance > 3) {
        hasMoved = true;
      }
      
      // Convert screen pixels to SVG coordinates
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const svgDeltaX = (deltaX / rect.width) * viewBox.width;
      const svgDeltaY = (deltaY / rect.height) * viewBox.height;
      
      // Calculate new offset
      const newOffsetX = currentOffset.x + svgDeltaX;
      const newOffsetY = currentOffset.y + svgDeltaY;
      
      // Constrain to 60px radius from original position
      const maxDistance = (60 / rect.width) * viewBox.width; // Convert 60px to SVG units
      const offsetDistance = Math.sqrt(newOffsetX * newOffsetX + newOffsetY * newOffsetY);
      
      if (offsetDistance <= maxDistance) {
        // Update the ref with the latest offset
        if (nodeDragStartRef.current && nodeDragStartRef.current.nodeId === node.id) {
          nodeDragStartRef.current.lastOffsetX = newOffsetX;
          nodeDragStartRef.current.lastOffsetY = newOffsetY;
        }
        setNodeDragOffsets(prev => {
          const newMap = new Map(prev);
          newMap.set(node.id, { x: newOffsetX, y: newOffsetY });
          return newMap;
        });
      } else {
        // Clamp to max distance
        const angle = Math.atan2(newOffsetY, newOffsetX);
        const clampedX = Math.cos(angle) * maxDistance;
        const clampedY = Math.sin(angle) * maxDistance;
        // Update the ref with the clamped offset
        if (nodeDragStartRef.current && nodeDragStartRef.current.nodeId === node.id) {
          nodeDragStartRef.current.lastOffsetX = clampedX;
          nodeDragStartRef.current.lastOffsetY = clampedY;
        }
        setNodeDragOffsets(prev => {
          const newMap = new Map(prev);
          newMap.set(node.id, { x: clampedX, y: clampedY });
          return newMap;
        });
      }
    };

    const handleMouseUp = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('handleMouseUp for node drag', { nodeId: node.id, hasMoved });
      }
      
      // Use the offset from the ref (captured during drag) instead of state
      // This ensures we have the most up-to-date value, especially on first drag
      const currentOffset = nodeDragStartRef.current && nodeDragStartRef.current.nodeId === node.id
        ? { x: nodeDragStartRef.current.lastOffsetX, y: nodeDragStartRef.current.lastOffsetY }
        : (nodeDragOffsets.get(node.id) || { x: 0, y: 0 });
      
      // Check if node is within bounds (60px radius)
      if (!containerRef.current) {
        if (process.env.NODE_ENV === 'development') {
          console.log('No container ref, clearing drag state');
        }
        setDraggingNodeId(null);
        nodeDragStartRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        return;
      }
      
      const rect = containerRef.current.getBoundingClientRect();
      const maxDistance = (60 / rect.width) * viewBox.width;
      const distance = Math.sqrt(currentOffset.x * currentOffset.x + currentOffset.y * currentOffset.y);
      
      // Only consider it a drag if mouse moved significantly (more than 3px screen space)
      // or if the node offset is significant
      const screenDistance = (distance / viewBox.width) * rect.width;
      const wasActualDrag = hasMoved || screenDistance > 3;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Drag vs click check', { hasMoved, screenDistance, wasActualDrag, distance, maxDistance });
      }
      
      // If within bounds and was a drag, animate back to original position
      if (wasActualDrag && distance > 0 && distance <= maxDistance) {
        // Cancel any existing node animation
        if (nodeAnimationRafIdRef.current !== null) {
          cancelAnimationFrame(nodeAnimationRafIdRef.current);
          activeRafIdsRef.current.delete(nodeAnimationRafIdRef.current);
        }
        
        const startOffset = { ...currentOffset };
        const startTime = performance.now();
        const duration = 300; // 300ms animation
        
        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Easing function (ease-out cubic)
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          
          const newOffsetX = startOffset.x * (1 - easeOutCubic);
          const newOffsetY = startOffset.y * (1 - easeOutCubic);
          
          setNodeDragOffsets(prev => {
            const newMap = new Map(prev);
            newMap.set(node.id, { x: newOffsetX, y: newOffsetY });
            return newMap;
          });
          
          if (progress < 1) {
            nodeAnimationRafIdRef.current = requestAnimationFrame(animate);
            if (nodeAnimationRafIdRef.current !== null) {
              activeRafIdsRef.current.add(nodeAnimationRafIdRef.current);
            }
          } else {
            // Ensure we end at exactly 0,0
            setNodeDragOffsets(prev => {
              const newMap = new Map(prev);
              newMap.set(node.id, { x: 0, y: 0 });
              return newMap;
            });
            // Animation complete, clean up
            if (nodeAnimationRafIdRef.current !== null) {
              activeRafIdsRef.current.delete(nodeAnimationRafIdRef.current);
            }
            nodeAnimationRafIdRef.current = null;
          }
        };
        
        nodeAnimationRafIdRef.current = requestAnimationFrame(animate);
        if (nodeAnimationRafIdRef.current !== null) {
          activeRafIdsRef.current.add(nodeAnimationRafIdRef.current);
        }
      }
      
      // Store drag distance for click handler to check
      nodeDragDistanceRef.current = {
        nodeId: node.id,
        distance: maxDragDistance
      };
      
      // Clear dragging state
      setDraggingNodeId(null);
      
      // If it wasn't a drag, trigger click after a small delay
      if (!wasActualDrag) {
        // Small delay to ensure state is cleared, then trigger click
        setTimeout(() => {
          handleNodeClick(node);
        }, 50);
      } else {
        // Clear the drag distance ref after a delay
        setTimeout(() => {
          nodeDragDistanceRef.current = null;
        }, 100);
      }
      
      nodeDragStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [nodeDragOffsets, viewBox]);

  // Animate viewBox smoothly
  const animateViewBox = useCallback((targetViewBox: ViewBox, duration: number = 600) => {
    if (!containerRef.current) return;
    
    // Cancel any existing animation
    if (animateViewBoxRafIdRef.current !== null) {
      cancelAnimationFrame(animateViewBoxRafIdRef.current);
      activeRafIdsRef.current.delete(animateViewBoxRafIdRef.current);
    }
    
    const startViewBox = { ...viewBox };
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentX = startViewBox.x + (targetViewBox.x - startViewBox.x) * easeOut;
      const currentY = startViewBox.y + (targetViewBox.y - startViewBox.y) * easeOut;
      
      setViewBox({
        x: currentX,
        y: currentY,
        width: targetViewBox.width,
        height: targetViewBox.height,
      });
      
      if (progress < 1) {
        animateViewBoxRafIdRef.current = requestAnimationFrame(animate);
        if (animateViewBoxRafIdRef.current !== null) {
          activeRafIdsRef.current.add(animateViewBoxRafIdRef.current);
        }
      } else {
        // Animation complete, clean up
        if (animateViewBoxRafIdRef.current !== null) {
          activeRafIdsRef.current.delete(animateViewBoxRafIdRef.current);
        }
        animateViewBoxRafIdRef.current = null;
      }
    };
    
    animateViewBoxRafIdRef.current = requestAnimationFrame(animate);
    if (animateViewBoxRafIdRef.current !== null) {
      activeRafIdsRef.current.add(animateViewBoxRafIdRef.current);
    }
  }, [viewBox]);

  // Helper to find node at a point (for stage-level click detection)
  const findNodeAtPoint = useCallback((stageX: number, stageY: number): PositionedNode | null => {
    // Convert stage coordinates to SVG coordinates
    if (!stageRef.current || !containerRef.current) return null;
    
    const stage = stageRef.current;
    const scale = stage.scaleX();
    const stagePos = stage.position();
    
    // Convert stage coordinates to SVG coordinates
    const svgX = (stageX - stagePos.x) / scale;
    const svgY = (stageY - stagePos.y) / scale;
    
    // Find the node at this point (check all nodes in reverse order so top nodes are checked first)
    // We need to check visibility inline since visibleNodes might not be available yet
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const nodeOffset = nodeDragOffsets.get(node.id) || { x: 0, y: 0 };
      const nodeDisplayX = node.x + nodeOffset.x;
      const nodeDisplayY = node.y + nodeOffset.y;
      
      // Quick visibility check
      const padding = node.radius + 50;
      const isVisible = nodeDisplayX + padding >= viewBox.x &&
                       nodeDisplayX - padding <= viewBox.x + viewBox.width &&
                       nodeDisplayY + padding >= viewBox.y &&
                       nodeDisplayY - padding <= viewBox.y + viewBox.height;
      
      if (!isVisible) continue;
      
      const dx = svgX - nodeDisplayX;
      const dy = svgY - nodeDisplayY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= node.radius) {
        return node;
      }
    }
    
    return null;
  }, [nodes, nodeDragOffsets, viewBox]);

  // Track if we actually dragged (vs just clicked)
  const nodeDragDistanceRef = useRef<{ nodeId: string; distance: number } | null>(null);

  // Simple, direct node click handler
  const handleNodeClick = useCallback((node: PositionedNode, e?: MouseEvent) => {
    // CRITICAL: Clear all dragging states immediately to release cursor from grab/grabbing state
    setIsDragging(false);
    isDraggingRef.current = false;
    setDraggingNodeId(null);
    nodeDragStartRef.current = null;
    setHoveredNode(null);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[CLICK] ===== NODE CLICKED =====', { 
        nodeId: node.id, 
        nodeLabel: node.label,
        currentSelected: selectedNode?.id,
        wasDragging: draggingNodeId === node.id,
        dragDistance: nodeDragDistanceRef.current?.nodeId === node.id ? nodeDragDistanceRef.current.distance : 0
      });
    }
    
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // Check if this was actually a drag (moved more than 5px)
    const wasActualDrag = nodeDragDistanceRef.current?.nodeId === node.id && 
                          nodeDragDistanceRef.current.distance > 5;
    
    if (wasActualDrag) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[CLICK] Ignoring - was a drag, not a click');
      }
      nodeDragDistanceRef.current = null;
      return;
    }
    
    // If clicking a different node while one is open, dismiss the current card immediately
    if (selectedNode && selectedNode.id !== node.id) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[CLICK] Dismissing current card - different node clicked');
      }
      setSelectedNode(null);
      setCardPosition(null);
    }
    
    // Toggle selection - if clicking the same node, close it
    if (selectedNode?.id === node.id) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[CLICK] Closing card - same node clicked');
      }
      setSelectedNode(null);
      setCardPosition(null);
      nodeDragDistanceRef.current = null;
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[CLICK] Opening card for node:', node.id, node.label);
    }
    
    // First, center the node in the viewport with smooth animation
    // Then show the card only after the centering animation completes
    if (containerRef.current) {
      const nodeOffset = nodeDragOffsets.get(node.id) || { x: 0, y: 0 };
      const nodeDisplayX = node.x + nodeOffset.x;
      const nodeDisplayY = node.y + nodeOffset.y;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate new viewBox to center the node
      const newX = nodeDisplayX - (centerX / rect.width) * viewBox.width;
      const newY = nodeDisplayY - (centerY / rect.height) * viewBox.height;
      
      const animationDuration = 600; // ms
      
      // Start centering animation
      animateViewBox({
        x: newX,
        y: newY,
        width: viewBox.width,
        height: viewBox.height,
      }, animationDuration);
      
      // Show card only after the centering animation completes
      setTimeout(() => {
        // Batch state updates to reduce re-renders
        // Use center-center positioning (50% with translate(-50%, -50%))
        // This ensures perfect centering regardless of card size
        setSelectedNode(node);
        setCardPosition({ x: 50, y: 50 }); // Use percentage for CSS transform centering
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[CLICK] Card shown after centering animation completed:', { selectedNode: node.id, position: 'center-center' });
        }
      }, animationDuration);
    } else {
      // Fallback: if no container, show immediately
      setSelectedNode(node);
      // Use center-center positioning (50% with translate(-50%, -50%))
      setCardPosition({ x: 50, y: 50 }); // Use percentage for CSS transform centering
    }
    
    nodeDragDistanceRef.current = null;
  }, [selectedNode, draggingNodeId, nodeDragOffsets, viewBox, animateViewBox, isMobile]);

  // Convert SVG coordinates to screen coordinates (Konva)
  const svgToScreen = useCallback((svgX: number, svgY: number): { x: number; y: number } | null => {
    if (!containerRef.current || !stageRef.current) return null;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const stage = stageRef.current;
    
    // Calculate the ratio between SVG viewBox and actual screen size
    const scaleX = containerRect.width / viewBox.width;
    const scaleY = containerRect.height / viewBox.height;
    
    // Convert SVG coordinates to screen coordinates
    const screenX = containerRect.left + (svgX - viewBox.x) * scaleX;
    const screenY = containerRect.top + (svgY - viewBox.y) * scaleY;
    
    return { x: screenX, y: screenY };
  }, [viewBox]);

  // Update card position when viewBox changes (user pans/zooms)
  // Note: We don't update position on initial selection - that's handled in handleNodeClick
  useEffect(() => {
    if (!selectedNode) {
      setCardPosition(null);
      prevViewBoxRef.current = viewBox;
      return;
    }
    
    // Always ensure we have a position on initial selection
    if (!cardPosition) {
      // Use center-center positioning (50% with translate(-50%, -50%))
      setCardPosition({ x: 50, y: 50 });
      prevViewBoxRef.current = viewBox;
      return;
    }
    
    // Only update position if viewBox actually changed (user panned/zoomed)
    const viewBoxChanged = 
      prevViewBoxRef.current.x !== viewBox.x ||
      prevViewBoxRef.current.y !== viewBox.y ||
      prevViewBoxRef.current.width !== viewBox.width ||
      prevViewBoxRef.current.height !== viewBox.height;
    
    if (!viewBoxChanged) {
      return;
    }
    
    prevViewBoxRef.current = viewBox;
    
    // Keep card centered when viewBox changes (user pans/zooms)
    // Position stays at center-center
  }, [selectedNode, viewBox, isMobile, cardPosition]);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setSelectedNode(null);
    setCardPosition(null);
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const svgX = viewBox.x + (centerX / rect.width) * viewBox.width;
    const svgY = viewBox.y + (centerY / rect.height) * viewBox.height;
    
    const zoomFactor = 1.2;
    const newWidth = viewBox.width / zoomFactor;
    const newHeight = viewBox.height / zoomFactor;
    
    const minZoom = CANVAS_WIDTH / 4;
    if (newWidth < minZoom) return;
    
    setViewBox({
      x: svgX - (centerX / rect.width) * newWidth,
      y: svgY - (centerY / rect.height) * newHeight,
      width: newWidth,
      height: newHeight,
    });
  }, [viewBox]);

  const handleZoomOut = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const svgX = viewBox.x + (centerX / rect.width) * viewBox.width;
    const svgY = viewBox.y + (centerY / rect.height) * viewBox.height;
    
    const zoomFactor = 1.2;
    const newWidth = viewBox.width * zoomFactor;
    const newHeight = viewBox.height * zoomFactor;
    
    const maxZoom = CANVAS_WIDTH * 2;
    if (newWidth > maxZoom) return;
    
    setViewBox({
      x: svgX - (centerX / rect.width) * newWidth,
      y: svgY - (centerY / rect.height) * newHeight,
      width: newWidth,
      height: newHeight,
    });
  }, [viewBox]);

  // Home button - show fit-all view (zoomed out to see all nodes)
  const handleHome = useCallback(() => {
    if (!homeViewBox) return;

    // Animate to the fit-all home view
    animateViewBox(homeViewBox, 600);
  }, [homeViewBox, animateViewBox]);

  // Calculate grid spacing based on zoom
  // Apple Freeform style: consistent visual spacing that scales with zoom
  const zoomLevel = CANVAS_WIDTH / viewBox.width;
  
  // Freeform-style grid: ~20px visual spacing on screen (in canvas coordinates)
  // Convert screen pixels to canvas coordinates based on current viewBox
  let gridSpacing: number;
  let dotRadius: number;
  
  if (!containerRef.current) {
    // Fallback if container not ready
    gridSpacing = 20 * zoomLevel;
    dotRadius = 0.5 * zoomLevel;
  } else {
    const rect = containerRef.current.getBoundingClientRect();
    // 20px on screen = (20 / rect.width) * viewBox.width in canvas coordinates
    const screenSpacingPx = 20; // Freeform uses ~20px spacing on screen
    gridSpacing = (screenSpacingPx / rect.width) * viewBox.width;
    
    // Dot size: ~0.75px on screen (Freeform style - very subtle)
    const screenDotRadiusPx = 0.75;
    dotRadius = (screenDotRadiusPx / rect.width) * viewBox.width;
  }
  
  // Add padding to ensure full coverage of the view
  const padding = gridSpacing * 2;
  const gridStartX = Math.floor((viewBox.x - padding) / gridSpacing) * gridSpacing;
  const gridStartY = Math.floor((viewBox.y - padding) / gridSpacing) * gridSpacing;
  const gridEndX = viewBox.x + viewBox.width + padding;
  const gridEndY = viewBox.y + viewBox.height + padding;

  // Memoize visible year range calculation
  const getVisibleYearRange = useCallback((): { startYear: number; endYear: number; showNow: boolean } => {
    if (nodes.length === 0) {
      return { startYear: 1993, endYear: 2024, showNow: false };
    }

    // Get all nodes with valid timestamps (including Present nodes for max year)
    const allNodes = nodes.filter(n => n.timestamp);
    if (allNodes.length === 0) {
      return { startYear: 1993, endYear: 2024, showNow: false };
    }

    // Get non-Present nodes to calculate the date range for positioning
    const nonPresentNodes = nodes.filter(n => !isPresentNode(n) && n.timestamp);
    if (nonPresentNodes.length === 0) {
      // If only Present nodes, just return their year range
      const timestamps = allNodes.map(n => n.timestamp);
      const minYear = Math.min(...timestamps.map(ts => new Date(ts).getFullYear()));
      const maxYear = Math.max(...timestamps.map(ts => new Date(ts).getFullYear()));
      return { startYear: minYear, endYear: maxYear, showNow: true };
    }

    // Get timestamps for non-Present nodes
    const timestamps = nonPresentNodes.map(n => n.timestamp);
    const minTimestamp = Math.min(...timestamps);
    const maxTimestamp = Math.max(...timestamps);
    const dateRange = maxTimestamp - minTimestamp || 1;

    // Calculate the horizontal range (same logic as in calculateLayout)
    const horizontalRange = CANVAS_WIDTH - (PADDING * 2);
    const leftEdge = PADDING;
    const reservedRightSpace = CANVAS_WIDTH * 0.15;
    const availableWidth = horizontalRange - reservedRightSpace;

    // Convert viewBox x coordinates to timestamps
    const leftX = viewBox.x;
    const rightX = viewBox.x + viewBox.width;

    // Convert x to ratio, then to timestamp
    // Clamp ratios to handle viewBox extending beyond canvas
    const leftRatio = Math.max(0, Math.min(1, (leftX - leftEdge) / availableWidth));
    const rightRatio = Math.max(0, Math.min(1, (rightX - leftEdge) / availableWidth));

    const leftTimestamp = minTimestamp + leftRatio * dateRange;
    const rightTimestamp = minTimestamp + rightRatio * dateRange;

    // Convert timestamps to years
    let startYear = Math.floor(new Date(leftTimestamp).getFullYear());
    let endYear = Math.ceil(new Date(rightTimestamp).getFullYear());

    // Check if Present nodes are visible in the viewBox
    const rightEdgeX = CANVAS_WIDTH - PADDING;
    const presentNodes = nodes.filter(n => isPresentNode(n));
    let showNow = false;
    
    if (presentNodes.length > 0 && rightX >= rightEdgeX - 50) { // 50px threshold
      // Check if any Present nodes are actually visible in the viewBox
      presentNodes.forEach(node => {
        const nodeX = node.x || rightEdgeX;
        const nodeY = node.y || 0;
        const nodeRadius = node.radius || 0;
        
        // Check if node is within viewBox bounds (with some padding for radius)
        if (nodeX - nodeRadius <= rightX && 
            nodeX + nodeRadius >= leftX &&
            nodeY - nodeRadius <= viewBox.y + viewBox.height &&
            nodeY + nodeRadius >= viewBox.y) {
          showNow = true;
        }
      });
      
      if (showNow) {
        // Get the latest year from Present nodes
        const presentTimestamps = presentNodes.map(n => n.timestamp);
        const latestPresentYear = Math.max(...presentTimestamps.map(ts => new Date(ts).getFullYear()));
        endYear = Math.max(endYear, latestPresentYear);
      }
    }

    // Ensure startYear <= endYear
    if (startYear > endYear) {
      endYear = startYear;
    }

    return { startYear, endYear, showNow };
  }, [nodes, viewBox]);

  // Memoize visible year range
  const visibleYearRange = useMemo(() => getVisibleYearRange(), [getVisibleYearRange]);

  // Memoize grid dots generation - only recalculate when viewBox or zoom changes
  const gridDots = useMemo(() => {
    const dots: Array<{ x: number; y: number }> = [];
    for (let x = gridStartX; x <= gridEndX; x += gridSpacing) {
      for (let y = gridStartY; y <= gridEndY; y += gridSpacing) {
        dots.push({ x, y });
      }
    }
    return dots;
  }, [gridStartX, gridStartY, gridEndX, gridEndY, gridSpacing]);

  // Helper function to check if a node is visible in viewport (with padding for partial visibility)
  const isNodeVisible = useCallback((node: PositionedNode, dragOffset: { x: number; y: number }): boolean => {
    const displayX = node.x + dragOffset.x;
    const displayY = node.y + dragOffset.y;
    const padding = node.radius + 50; // Extra padding to account for node size
    
    return displayX + padding >= viewBox.x &&
           displayX - padding <= viewBox.x + viewBox.width &&
           displayY + padding >= viewBox.y &&
           displayY - padding <= viewBox.y + viewBox.height;
  }, [viewBox]);

  // Helper function to check if a connection path is visible in viewport
  const isConnectionVisible = useCallback((source: PositionedNode, target: PositionedNode, 
    sourceOffset: { x: number; y: number }, targetOffset: { x: number; y: number }): boolean => {
    const sourceX = source.x + sourceOffset.x;
    const sourceY = source.y + sourceOffset.y;
    const targetX = target.x + targetOffset.x;
    const targetY = target.y + targetOffset.y;
    
    // Check if either endpoint is visible, or if the connection passes through viewport
    const padding = 100; // Padding for bezier curves that extend beyond endpoints
    
    const sourceVisible = sourceX + padding >= viewBox.x && sourceX - padding <= viewBox.x + viewBox.width &&
                          sourceY + padding >= viewBox.y && sourceY - padding <= viewBox.y + viewBox.height;
    const targetVisible = targetX + padding >= viewBox.x && targetX - padding <= viewBox.x + viewBox.width &&
                          targetY + padding >= viewBox.y && targetY - padding <= viewBox.y + viewBox.height;
    
    // If both endpoints are outside, check if connection might pass through viewport
    if (!sourceVisible && !targetVisible) {
      const midX = (sourceX + targetX) / 2;
      const midY = (sourceY + targetY) / 2;
      return midX + padding >= viewBox.x && midX - padding <= viewBox.x + viewBox.width &&
             midY + padding >= viewBox.y && midY - padding <= viewBox.y + viewBox.height;
    }
    
    return sourceVisible || targetVisible;
  }, [viewBox]);

  // Render all nodes upfront for snappy scrolling (pre-load optimization)
  // Previously filtered by viewport, but now rendering all for better UX
  const visibleNodes = useMemo(() => {
    // Return all nodes - no viewport filtering for pre-loaded experience
    return nodes;
  }, [nodes]);

  // Memoize connections - render all connections upfront for pre-loaded experience
  // Previously filtered by viewport, but now rendering all for better UX
  const connectionsWithPaths = useMemo(() => {
    if (!nodes.length) return [];
    
    // Collect all connections with their display positions (no visibility filtering)
    const allConnections: Array<{ 
      source: PositionedNode; 
      target: PositionedNode; 
      sourceDisplay: PositionedNode;
      targetDisplay: PositionedNode;
      sourceOffset: { x: number; y: number };
      targetOffset: { x: number; y: number };
    }> = [];
    
    // Collect all connections with their display positions
    nodes.forEach(node => {
      if (!node.connections) return;
      
      node.connections.forEach(connectionId => {
        const sourceNode = nodes.find(n => n.id === connectionId);
        if (!sourceNode) return;
        
        const sourceOffset = nodeDragOffsets.get(sourceNode.id) || { x: 0, y: 0 };
        const targetOffset = nodeDragOffsets.get(node.id) || { x: 0, y: 0 };
        const sourceDisplay = { ...sourceNode, x: sourceNode.x + sourceOffset.x, y: sourceNode.y + sourceOffset.y };
        const targetDisplay = { ...node, x: node.x + targetOffset.x, y: node.y + targetOffset.y };
        
        // Include all connections - no visibility filtering for pre-loaded experience
        allConnections.push({ 
          source: sourceNode, 
          target: node,
          sourceDisplay, 
          targetDisplay,
          sourceOffset,
          targetOffset
        });
      });
    });
    
    // Calculate paths for all connections (first pass - initial paths)
    const connectionsWithInitialPaths = allConnections.map(conn => ({
      ...conn,
      path: getConnectionPath(conn.sourceDisplay, conn.targetDisplay, nodes)
    }));
    
    // Second pass: recalculate paths with connection-to-connection avoidance
    const finalConnections = connectionsWithInitialPaths.map(conn => {
      const finalPath = getConnectionPath(conn.sourceDisplay, conn.targetDisplay, nodes, connectionsWithInitialPaths);
      return { ...conn, path: finalPath };
    });
    
    return finalConnections;
  }, [nodes, nodeDragOffsets]);

  // Stage click handler - fallback for node clicks if shape events don't work
  // Must be defined after findNodeAtPoint and handleNodeClick
  const handleStageClick = useCallback((e: any) => {
    // Only handle if we're not dragging the stage
    if (isDragging) {
      // Clear dragging state even if we're ignoring the click
      setIsDragging(false);
      isDraggingRef.current = false;
      if (process.env.NODE_ENV === 'development') {
        console.log('Stage click ignored - stage is being dragged');
      }
      return;
    }
    
    // Don't handle if we just finished dragging a node
    if (draggingNodeId) {
      // Clear dragging state
      setIsDragging(false);
      isDraggingRef.current = false;
      if (process.env.NODE_ENV === 'development') {
        console.log('Stage click ignored - node was being dragged');
      }
      return;
    }
    
    if (!stageRef.current || !konvaComponents) return;
    
    const stage = stageRef.current;
    const pointerPos = stage.getPointerPosition();
    
    if (!pointerPos) return;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Stage clicked at:', pointerPos);
    }
    
    // Find node at this position
    const clickedNode = findNodeAtPoint(pointerPos.x, pointerPos.y);
    
    if (clickedNode) {
      // CRITICAL: Clear dragging state when node is found
      setIsDragging(false);
      isDraggingRef.current = false;
      setHoveredNode(null);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Node found at click position:', clickedNode.id);
      }
      // Use a small delay to ensure drag state is cleared
      setTimeout(() => {
        handleNodeClick(clickedNode);
      }, 10);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('No node found at click position');
      }
      // Click on empty space - close card if open
      if (selectedNode) {
        setSelectedNode(null);
        setCardPosition(null);
      }
    }
  }, [isDragging, draggingNodeId, selectedNode, findNodeAtPoint, handleNodeClick, konvaComponents]);

  // Don't render Konva components during SSR or before Konva is loaded
  if (typeof window === 'undefined' || !konvaComponents) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Showing loading state:', { window: typeof window !== 'undefined', konvaComponents: !!konvaComponents });
    }
    return (
      <div className="career-odyssey-wrapper" style={{ width: '100%', height: '100vh', position: 'relative' }}>
        <div 
          className="career-odyssey-container" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '100%',
            height: '100vh',
            backgroundColor: '#ffffff',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }}
        >
          <div style={{ fontSize: '18px', color: '#000000' }}>Loading canvas...</div>
        </div>
      </div>
    );
  }
  
  // Extract Konva components for easier use
  const { Stage, Layer, Circle, Rect, Line, Text: KonvaText, Image: KonvaImage, Group, Path, Konva } = konvaComponents;

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Rendering canvas:', {
      nodes: nodes.length,
      visibleNodes: visibleNodes.length,
      stageSize,
      viewBox,
      konvaComponents: !!konvaComponents
    });
  }

  return (
    <div className="career-odyssey-wrapper">
      <div
        ref={containerRef}
        className={`career-odyssey-container ${isDragging ? 'is-dragging' : ''}`}
        style={{ 
          cursor: hoveredNode ? 'pointer' : (isDragging ? 'grabbing' : 'grab')
        }}
        onWheel={handleWheel}
        onContextMenu={(e) => {
          // Only prevent default if not hovering over a node (allow node inspection)
          if (!hoveredNode) {
            e.preventDefault();
          }
        }}
        onMouseMove={(e) => {
          if (debugMode && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setMousePosition({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top
            });
          }
        }}
      >
        {stageSize.width > 0 && stageSize.height > 0 && (
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            scaleX={stageState.scale}
            scaleY={stageState.scale}
            x={stageState.x}
            y={stageState.y}
            onMouseDown={handleStageMouseDown}
            onTouchStart={handleStageTouchStart}
            onTouchMove={handleStageTouchMove}
            onTouchEnd={handleStageTouchEnd}
            onClick={handleStageClick}
          >
            {/* Grid Layer - non-interactive for performance */}
            <Layer listening={false} perfectDrawEnabled={false}>
              {gridDots.map((dot, i) => (
                <Circle
                  key={`grid-${i}`}
                  x={dot.x}
                  y={dot.y}
                  radius={dotRadius}
                  fill="#000000"
                  opacity={0.15}
                  listening={false}
                  perfectDrawEnabled={false}
                />
              ))}
            </Layer>

            {/* Connections Layer - rendered before nodes so they appear behind */}
            <Layer perfectDrawEnabled={false} listening={false}>
              {connectionsWithPaths.map((conn, index): React.ReactElement | null => {
                const { source, target, path } = conn;
                const sourceNode = source;
                const targetNode = target;
                if (!sourceNode || !targetNode) return null;
                
                // Memoize connection rendering to avoid unnecessary re-renders
                const connectionKey = `${sourceNode.id}-${targetNode.id}-${path}`;
                
                // A path is "not taken" if the target node has pathTaken: false
                const pathTaken = targetNode.pathTaken !== false;
                
                // Check if this connection leads to a "Present" node
                const isPresentNode = (n: Node): boolean => {
                  if (n.active === true) return true;
                  if (n.id === 'now') return true;
                  if (n.dateRange && typeof n.dateRange === 'string') {
                    return n.dateRange.includes('Present') || n.dateRange === 'Now';
                  }
                  return false;
                };
                
                // Recursively check if a node or any of its forward connections lead to Present nodes
                const leadsToPresent = (targetNode: Node, visited: Set<string> = new Set()): boolean => {
                  if (visited.has(targetNode.id)) return false; // Prevent infinite loops
                  visited.add(targetNode.id);
                  
                  if (isPresentNode(targetNode)) return true;
                  
                  // Check all nodes that connect FROM this node (forward in timeline)
                  // A node connects FROM targetNode if its connections array includes targetNode.id
                  const forwardNodes = nodes.filter(n => 
                    n.connections && n.connections.includes(targetNode.id) && n.pathTaken !== false
                  );
                  
                  return forwardNodes.some(n => leadsToPresent(n, visited));
                };
                
                const isActivePath = pathTaken && leadsToPresent(targetNode);
                
                // Fade connection if neither node is selected, or if selectedNode exists and this connection doesn't involve it
                const isConnectionToSelected = selectedNode && 
                  (sourceNode.id === selectedNode.id || targetNode.id === selectedNode.id);
                const connectionOpacity = selectedNode 
                  ? (isConnectionToSelected ? (pathTaken ? 0.6 : 0.4) : 0.15)
                  : (pathTaken ? 0.6 : 0.4);
                
                // Create gradient for active paths (fallback to solid color if gradient fails)
                let activeGradient = null;
                if (isActivePath) {
                  activeGradient = createActivePathGradient();
                  // If gradient creation fails, use a solid color instead
                  if (!activeGradient) {
                    activeGradient = '#3b82f6'; // Fallback to blue
                  }
                }
                const textColor = getThemeColor('--color-text', '#000000');
                
                // Get node center positions
                const sourceCenterX = sourceNode.x + (nodeDragOffsets.get(sourceNode.id) || { x: 0, y: 0 }).x;
                const sourceCenterY = sourceNode.y + (nodeDragOffsets.get(sourceNode.id) || { x: 0, y: 0 }).y;
                const targetCenterX = targetNode.x + (nodeDragOffsets.get(targetNode.id) || { x: 0, y: 0 }).x;
                const targetCenterY = targetNode.y + (nodeDragOffsets.get(targetNode.id) || { x: 0, y: 0 }).y;
                
                const connectionColor = isActivePath ? activeGradient : (pathTaken ? textColor : '#6b7280');
                
                return (
                  <Group key={connectionKey} listening={false} perfectDrawEnabled={false}>
                    {/* Glowing background path for active (Present) connections only */}
                    {isActivePath && (
                      <Path
                        data={path}
                        fill=""
                        stroke={activeGradient}
                        strokeWidth={3}
                        lineCap="round"
                        opacity={connectionOpacity * 0.3}
                        shadowBlur={4}
                        shadowColor="#3b82f6"
                        listening={false}
                        perfectDrawEnabled={false}
                      />
                    )}
                    {/* Animated highlight for active (Present) connections only */}
                    {isActivePath && (
                      <AnimatedPath
                        data={path}
                        fill=""
                        stroke={activeGradient}
                        strokeWidth={2.5}
                        lineCap="round"
                        dash={[20, 100]}
                        opacity={connectionOpacity * 0.9}
                        Path={Path}
                        Konva={Konva}
                      />
                    )}
                    {/* Main path - cleaner styling for patch node connectors */}
                    {/* Use dotted line for pathTaken: false connections */}
                    <Path
                      data={path}
                      fill=""
                      stroke={connectionColor}
                      strokeWidth={isActivePath ? 2.5 : (pathTaken ? 2 : 1.5)}
                      dash={pathTaken ? undefined : [5, 5]}
                      lineCap="round"
                      opacity={connectionOpacity}
                      listening={false}
                      perfectDrawEnabled={false}
                    />
                    {/* Ports are now rendered on the nodes themselves, so no connector dots needed */}
                  </Group>
                );
              }).filter(Boolean)}
            </Layer>

            {/* Nodes Layer */}
            <Layer perfectDrawEnabled={false} listening={true}>
              {visibleNodes.map(node => {
                const isHovered = hoveredNode === node.id;
                const isSelected = selectedNode?.id === node.id;
                const nodeColor = getNodeColor(node.type, node.pathTaken !== false);
                const pathTaken = node.pathTaken !== false;
                
                const dragOffset = nodeDragOffsets.get(node.id) || { x: 0, y: 0 };
                const displayX = node.x + dragOffset.x;
                const displayY = node.y + dragOffset.y;
                const isDraggingThisNode = draggingNodeId === node.id;
                const bgColor = getThemeColor('--color-bg', '#ffffff');
                const textColor = getThemeColor('--color-text', '#000000');
                // Use nodeColor for border instead of theme border color
                const borderColor = nodeColor;
                const hasOtherSelected = !!(selectedNode && selectedNode.id !== node.id);
                
                return (
                  <AnimatedNodeGroup
                    key={node.id}
                    nodeId={node.id}
                    x={displayX}
                    y={displayY}
                    isHovered={isHovered}
                    isSelected={isSelected}
                    hasOtherSelected={hasOtherSelected}
                    Konva={Konva}
                    Group={Group}
                  >
                    {/* Node renders with expanded state when selected */}
                    {(() => {
                      const { inputs, outputs } = calculateNodePorts(node, nodes);
                      const cornerRadius = 12;

                      // Use base dimensions (panel presentation handles expanded view)
                      const nodeWidth = node.width;
                      const nodeHeight = node.height;

                      // Calculate layout dimensions
                      const imageCoverHeight = node.image ? Math.max(nodeWidth * 0.3, 80) : 0;
                      const imageGap = node.image ? 8 : 0;
                      const topPadding = 8;
                      const textPadding = TEXT_PADDING;
                      const availableWidth = nodeWidth - (textPadding * 2);

                      // Calculate title dimensions
                      let fontSize = calculateFontSize(nodeWidth);
                      let lines = wrapTextToLines(node.label, availableWidth, fontSize);
                      let displayLines = lines.slice(0, 2);
                      
                      // Verify text fits
                      let allLinesFit = true;
                      for (const line of displayLines) {
                        const lineWidth = calculateTextWidth(line, fontSize);
                        if (lineWidth > availableWidth) {
                          allLinesFit = false;
                          break;
                        }
                      }
                      if (!allLinesFit && fontSize > 10) {
                        fontSize = Math.max(10, fontSize - 1);
                        lines = wrapTextToLines(node.label, availableWidth, fontSize);
                        displayLines = lines.slice(0, 2);
                      }
                      
                      const lineHeight = fontSize * 1.2;
                      const titleHeight = displayLines.length * lineHeight;
                      const titleGap = 8; // Gap after title before ports
                      
                      // Calculate positions (relative to node center at 0,0)
                      const imageTopY = -nodeHeight / 2;
                      const imageBottomY = imageTopY + imageCoverHeight;
                      const titleTopY = imageBottomY + imageGap + topPadding;
                      const titleCenterY = titleTopY + titleHeight / 2;
                      const portsStartY = titleTopY + titleHeight + titleGap; // Start of ports area
                      
                      // Determine border style based on node type
                      const isCareer = node.type === 'career';
                      const isPossiblePath = node.type === 'possiblePath';
                      const isSpark = node.type === 'spark';
                      
                      // Career: 4px thick border
                      // PossiblePath: greyed out with dotted border
                      // Others: default
                      const borderStrokeWidth = isCareer ? 4 : (isPossiblePath ? 2 : (pathTaken ? 3 : 2));
                      const borderStroke = isPossiblePath ? '#9ca3af' : (pathTaken ? nodeColor : '#9ca3af');
                      const borderDash = isPossiblePath ? [8, 4] : undefined;
                      const nodeOpacity = isPossiblePath ? 0.5 : 1.0;
                      
                      return (
                        <>
                          {/* 1. Node Container - Background rectangle */}
                          <AnimatedNodeRect
                            x={0}
                            y={0}
                            width={nodeWidth}
                            height={nodeHeight}
                            cornerRadius={cornerRadius}
                            fill="#ffffff"
                            opacity={nodeOpacity}
                            stroke={borderStroke}
                            strokeWidth={borderStrokeWidth}
                            dash={borderDash}
                            isHovered={isHovered}
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => {
                              setHoveredNode(null);
                            }}
                            onMouseDown={(e) => {
                              e.cancelBubble = true;
                              e.evt.stopPropagation();
                              if (e.evt.button === 0 && !e.evt.metaKey && !e.evt.ctrlKey) {
                                handleNodeMouseDown(node, e.evt);
                              }
                            }}
                            onClick={(e) => {
                              setIsDragging(false);
                              isDraggingRef.current = false;
                              setHoveredNode(null);
                              e.cancelBubble = true;
                              e.evt.stopPropagation();
                              e.evt.preventDefault();
                              handleNodeClick(node, e.evt);
                            }}
                            onContextMenu={(e) => {
                              // Allow right-click inspection - stop propagation so canvas doesn't prevent default
                              e.cancelBubble = true;
                              e.evt.stopPropagation();
                              // Keep the node hovered so it stays visible in inspector
                              // Don't call setHoveredNode(null) here
                              // Explicitly allow default behavior for browser context menu
                              // Log node data for inspection
                              console.group('🔍 Node Inspection');
                              console.log('Node Data:', {
                                id: node.id,
                                label: node.label,
                                type: node.type,
                                date: node.date,
                                dateRange: node.dateRange,
                                connections: node.connections,
                                pathTaken: node.pathTaken,
                                image: node.image,
                                position: { x: node.x, y: node.y },
                                dimensions: { width: node.width, height: node.height }
                              });
                              console.log('Full Node Object:', node);
                              console.log('Node in Console:', node);
                              // Store node in window for easy access
                              (window as any).__inspectedNode = node;
                              console.log('💡 Tip: Access this node via window.__inspectedNode');
                              console.groupEnd();
                            }}
                            Konva={Konva}
                            Rect={Rect}
                          />
                          
                          {/* Hover glow - hide for possiblePath nodes */}
                          {!isPossiblePath && (
                            <AnimatedHoverGlow
                              x={0}
                              y={0}
                              width={nodeWidth}
                              height={nodeHeight}
                              cornerRadius={cornerRadius}
                              stroke={nodeColor}
                              isHovered={isHovered}
                              Konva={Konva}
                              Rect={Rect}
                            />
                          )}
                          
                          {/* 2. Cover Image - Top center if exists */}
                          {node.image && (
                            <NodeImage
                              src={node.image}
                              x={0}
                              y={0}
                              width={nodeWidth}
                              height={nodeHeight}
                              cornerRadius={cornerRadius}
                              opacity={isPossiblePath ? 0.5 : 1}
                              KonvaImage={KonvaImage}
                              scale={1}
                              Konva={Konva}
                              Group={Group}
                              Rect={Rect}
                              isHovered={isHovered}
                            />
                          )}
                          
                          {/* 3. Title Container - Between image and ports, properly positioned */}
                          <Group
                            x={0}
                            y={titleCenterY}
                            listening={false}
                          >
                            <KonvaText
                              x={-availableWidth / 2}
                              y={-titleHeight / 2}
                              text={displayLines.join('\n')}
                              align="center"
                              verticalAlign="middle"
                              fill={textColor}
                              fontSize={fontSize}
                              fontFamily="'ABC Diatype', sans-serif"
                              fontStyle="normal"
                              fontWeight={500}
                              opacity={isPossiblePath ? 0.5 : (pathTaken ? 0.95 : 0.75)}
                              listening={false}
                              perfectDrawEnabled={false}
                              lineHeight={lineHeight / fontSize}
                              width={availableWidth}
                              height={titleHeight}
                            />
                          </Group>

                          {/* 4. Input Ports - Left side, below title, each with its own square */}
                          {/* Hide inputs/outputs for spark nodes */}
                          {!isSpark && inputs.map((port, index) => {
                            const portSize = 4;
                            const sidePadding = 8; // Reduced padding - MUST MATCH calculateNodePorts
                            const portSpacing = 20;
                            const labelGap = 4; // Reduced gap between port and label
                            // Use port positions from calculateNodePorts (already calculated)
                            const portX = port.x; // Already calculated in calculateNodePorts
                            const portY = port.y; // Already calculated in calculateNodePorts
                            
                            // Input section is 50% width (left half of node)
                            const inputSectionLeft = -nodeWidth / 2;
                            const inputSectionRight = 0; // Center of node
                            const inputSectionWidth = nodeWidth / 2;
                            const textPadding = 4; // Minimal padding around text
                            
                            // Container spans the full input section width (50%)
                            const containerLeft = inputSectionLeft + sidePadding;
                            const containerRight = inputSectionRight - sidePadding;
                            const containerWidth = inputSectionWidth - sidePadding * 2;
                            
                            // Text area: from just after the port to container right edge
                            const textAreaLeft = portX + portSize / 2 + labelGap;
                            const textAreaRight = containerRight - textPadding;
                            const textAreaWidth = Math.max(0, textAreaRight - textAreaLeft);
                            
                            // Truncate label text to fit within available width
                            const labelText = port.label;
                            const labelFontSize = 8; // Slightly smaller
                            const maxChars = Math.floor(textAreaWidth / (labelFontSize * 0.65)); // Approximate chars that fit
                            const truncatedLabel = labelText.length > maxChars 
                              ? labelText.substring(0, Math.max(1, maxChars - 3)) + '...' 
                              : labelText;
                            
                            // Calculate actual text dimensions
                            const actualTextHeight = labelFontSize * 1.2; // Line height
                            const containerHeight = actualTextHeight + textPadding * 2;
                            
                            // Text position: left edge of text area (for left alignment)
                            // Vertically align with port square center
                            const textX = textAreaLeft;
                            
                            return (
                              <Group key={`input-${port.connectionId}`} listening={false}>
                                {/* Input port square */}
                                <Rect
                                  x={portX - portSize / 2}
                                  y={portY - portSize / 2}
                                  width={portSize}
                                  height={portSize}
                                  cornerRadius={1}
                                  fill={nodeColor}
                                  opacity={0.9}
                                  stroke={borderColor}
                                  strokeWidth={0.5}
                                  listening={false}
                                  perfectDrawEnabled={false}
                                />
                                {/* Input label - left-aligned, vertically aligned with port square */}
                                <KonvaText
                                  x={textX}
                                  y={portY}
                                  text={truncatedLabel}
                                  fontSize={labelFontSize}
                                  fontFamily="'ABC Diatype', sans-serif"
                                  fill="#333333"
                                  opacity={1}
                                  align="left"
                                  verticalAlign="middle"
                                  width={textAreaWidth}
                                  listening={false}
                                  perfectDrawEnabled={false}
                                />
                              </Group>
                            );
                          })}
                          
                          {/* 5. Output Ports - Right side, below title, each with its own square */}
                          {/* Hide inputs/outputs for spark nodes and outputs for possiblePath nodes */}
                          {!isSpark && !isPossiblePath && outputs.map((port, index) => {
                            const portSize = 4;
                            const sidePadding = 8; // Reduced padding - MUST MATCH calculateNodePorts
                            const portSpacing = 20;
                            const labelGap = 4; // Reduced gap between port and label
                            // Use port positions from calculateNodePorts (already calculated)
                            const portX = port.x; // Already calculated in calculateNodePorts
                            const portY = port.y; // Already calculated in calculateNodePorts
                            
                            // Output section is 50% width (right half of node)
                            const outputSectionLeft = 0; // Center of node
                            const outputSectionRight = nodeWidth / 2;
                            const outputSectionWidth = nodeWidth / 2;
                            const textPadding = 4; // Minimal padding around text
                            
                            // Container spans the full output section width (50%)
                            const containerLeft = outputSectionLeft + sidePadding;
                            const containerRight = outputSectionRight - sidePadding;
                            const containerWidth = outputSectionWidth - sidePadding * 2;
                            
                            // Text area within container (with padding)
                            const textAreaLeft = containerLeft + textPadding;
                            const textAreaRight = containerRight - textPadding;
                            const textAreaWidth = textAreaRight - textAreaLeft;
                            
                            // Truncate label text to fit within available width
                            const labelText = port.label;
                            const labelFontSize = 8; // Match input font size
                            const maxChars = Math.floor(textAreaWidth / (labelFontSize * 0.65)); // Approximate chars that fit
                            const truncatedLabel = labelText.length > maxChars 
                              ? labelText.substring(0, Math.max(1, maxChars - 3)) + '...' 
                              : labelText;
                            
                            // Calculate actual text dimensions
                            const actualTextHeight = labelFontSize * 1.2; // Line height
                            const containerHeight = actualTextHeight + textPadding * 2;
                            
                            // Container Y position - same as port Y (floats next to inputs)
                            const containerY = portY - containerHeight / 2;
                            
                            // For left-aligned text in Konva:
                            // x = left edge of text box (where text starts)
                            // width = width of text box (text extends right from x)
                            const textX = textAreaLeft; // Left edge of text area
                            const textY = portY; // Same Y as port (centered vertically in container)
                            
                            return (
                              <Group key={`output-${port.connectionId}`} listening={false}>
                                {/* Output port square */}
                                <Rect
                                  x={portX - portSize / 2}
                                  y={portY - portSize / 2}
                                  width={portSize}
                                  height={portSize}
                                  cornerRadius={1}
                                  fill={nodeColor}
                                  opacity={0.9}
                                  stroke={borderColor}
                                  strokeWidth={0.5}
                                  listening={false}
                                  perfectDrawEnabled={false}
                                />
                                {/* Output label - left-aligned, each output item on its own line */}
                                {/* For align="left": x is the LEFT edge, text extends rightward by width */}
                                <KonvaText
                                  x={textX}
                                  y={textY}
                                  text={truncatedLabel}
                                  fontSize={labelFontSize}
                                  fontFamily="'ABC Diatype', sans-serif"
                                  fill="#333333"
                                  opacity={1}
                                  align="left"
                                  verticalAlign="middle"
                                  width={textAreaWidth}
                                  listening={false}
                                  perfectDrawEnabled={false}
                                />
                              </Group>
                            );
                          })}
                        </>
                      );
                    })()}
                  </AnimatedNodeGroup>
                );
              })}
            </Layer>
          </Stage>
        )}
      </div>

      {/* Zoom controls */}
      <div className="zoom-controls">
        <button
          className="zoom-control-btn home-btn"
          onClick={handleHome}
          aria-label="Home"
          title="Center on 'Studied Art and Computer Science' at default zoom (3x)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </button>
        <button
          className="zoom-control-btn"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          title="Zoom in"
        >
          +
        </button>
        <button
          className="zoom-control-btn"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          title="Zoom out"
        >
          −
        </button>
      </div>

      {/* Debug Overlay - DOM elements above canvas for easy inspection */}
      {debugMode && hoveredNode && (() => {
        const node = nodes.find(n => n.id === hoveredNode);
        if (!node) return null;
        
        const { inputs, outputs } = calculateNodePorts(node, nodes);
        
        return (
          <div
            style={{
              position: 'fixed',
              top: mousePosition ? `${mousePosition.y + 20}px` : '20px',
              left: mousePosition ? `${mousePosition.x + 20}px` : '20px',
              background: 'white',
              border: '2px solid #f97316',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 10001,
              maxWidth: '400px',
              fontFamily: 'monospace',
              fontSize: '12px',
              pointerEvents: 'auto',
            }}
            data-node-id={node.id}
            data-node-type={node.type}
            className="node-debug-overlay"
          >
            <div style={{ marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>🔍 Node Debug</div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>
                Right-click node to inspect in console
              </div>
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <strong>ID:</strong> <code>{node.id}</code>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Label:</strong> {node.label}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Type:</strong> {node.type}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Date:</strong> {node.date || node.dateRange || 'N/A'}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Path Taken:</strong> {node.pathTaken !== false ? 'Yes' : 'No'}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Position:</strong> x: {node.x?.toFixed(1)}, y: {node.y?.toFixed(1)}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Dimensions:</strong> {node.width} × {node.height}
            </div>
            {node.image && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Image:</strong> <code style={{ fontSize: '10px' }}>{node.image}</code>
              </div>
            )}
            
            <div style={{ marginTop: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
              <div style={{ marginBottom: '4px' }}>
                <strong>Inputs ({inputs.length}):</strong>
              </div>
              {inputs.length > 0 ? (
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {inputs.map(port => (
                    <li key={port.connectionId} style={{ fontSize: '11px' }}>
                      <code>{port.connectionId}</code>: {port.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: '11px', color: '#6b7280' }}>None</div>
              )}
            </div>
            
            <div style={{ marginTop: '8px' }}>
              <div style={{ marginBottom: '4px' }}>
                <strong>Outputs ({outputs.length}):</strong>
              </div>
              {outputs.length > 0 ? (
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {outputs.map(port => (
                    <li key={port.connectionId} style={{ fontSize: '11px' }}>
                      <code>{port.connectionId}</code>: {port.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: '11px', color: '#6b7280' }}>None</div>
              )}
            </div>
            
            <div style={{ marginTop: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '8px', fontSize: '10px', color: '#6b7280' }}>
              <div>💡 Tip: Inspect this element in DevTools</div>
              <div style={{ marginTop: '4px' }}>
                <code>window.__inspectedNode</code> contains full node data
              </div>
            </div>
          </div>
        );
      })()}
      
      {/* Debug Toggle Button */}
      <button
        onClick={() => setDebugMode(!debugMode)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 10000,
          padding: '8px 12px',
          background: debugMode ? '#f97316' : '#6b7280',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          fontFamily: 'monospace',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
        title="Toggle debug mode to see node information on hover"
      >
        {debugMode ? '🔍 Debug ON' : '🔍 Debug OFF'}
      </button>

      {/* Timeline */}
      <div className="timeline">
        <div className="timeline-content">
          {visibleYearRange.startYear === visibleYearRange.endYear ? (
            visibleYearRange.showNow ? (
              <a href="/now" className="timeline-year timeline-link">Now</a>
            ) : (
              <span className="timeline-year">{visibleYearRange.startYear}</span>
            )
          ) : (
            <>
              <span className="timeline-year">{visibleYearRange.startYear}</span>
              <span className="timeline-separator">—</span>
              {visibleYearRange.showNow ? (
                <a href="/now" className="timeline-year timeline-link">Now</a>
              ) : (
                <span className="timeline-year">{visibleYearRange.endYear}</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Canvas fade overlay when node is selected */}
      {selectedNode && (
        <div
          className="canvas-fade-overlay"
          onClick={() => setSelectedNode(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            cursor: 'pointer',
          }}
        />
      )}

      {/* Node detail panel - Desktop: right side panel, Mobile: full modal */}
      {selectedNode && (
        <div
          className={`node-panel-overlay ${isMobile ? 'node-panel-mobile' : 'node-panel-desktop'}`}
          onClick={(e) => {
            // Close only if clicking the overlay, not the panel content
            if (e.target === e.currentTarget) {
              setSelectedNode(null);
            }
          }}
        >
          <div className="node-panel">
            {/* Close button */}
            <button
              className="node-card-close"
              onClick={() => setSelectedNode(null)}
              aria-label="Close"
            >
              ×
            </button>

            {/* Cover image */}
            {selectedNode.image && (
              <div
                className="node-card-image"
                style={{
                  backgroundImage: `url(${selectedNode.image})`,
                }}
              />
            )}

            {/* Content */}
            <div className="node-card-content">
              <h2 className="node-card-title">{selectedNode.label}</h2>

              {(selectedNode.date || selectedNode.dateRange) && (
                <div className="node-card-date">
                  {selectedNode.dateRange || selectedNode.date}
                </div>
              )}

              {selectedNode.description && (
                <p className="node-card-description">{selectedNode.description}</p>
              )}

              {/* External link if available */}
              {selectedNode.link && (
                <a
                  href={selectedNode.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="node-card-link"
                >
                  Learn more →
                </a>
              )}

              {/* Connected nodes */}
              {selectedNode.connections && selectedNode.connections.length > 0 && (
                <div className="node-card-connections">
                  <div className="node-card-connections-inline">
                    <span className="node-card-connections-label">Connected to:</span>
                    <span className="node-card-connections-items">
                      {selectedNode.connections.map((connId: string, index: number) => {
                        const connectedNode = nodes.find(n => n.id === connId);
                        if (!connectedNode) return null;
                        return (
                          <span key={connId}>
                            {index > 0 && <span className="node-card-connections-separator">, </span>}
                            <button
                              className="node-card-connection-link"
                              onClick={() => {
                                const node = nodes.find(n => n.id === connId);
                                if (node) {
                                  setSelectedNode(node);
                                  // Pan to the new node
                                  const nodeX = node.x;
                                  const nodeY = node.y;
                                  setViewBox(prev => ({
                                    ...prev,
                                    x: nodeX - prev.width / 2,
                                    y: nodeY - prev.height / 2,
                                  }));
                                }
                              }}
                            >
                              {connectedNode.label}
                            </button>
                          </span>
                        );
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .career-odyssey-wrapper {
          width: 100vw;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          overflow: hidden;
          background: #faf8f5; /* Warm cream background */
          z-index: 0;
        }

        [data-theme="dark"] .career-odyssey-wrapper {
          background: #1a1816; /* Warmer dark background */
        }

        .career-odyssey-container {
          width: 100%;
          height: 100%;
          position: relative;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
          cursor: grab;
          transition: cursor 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .career-odyssey-container.is-dragging {
          cursor: grabbing;
        }

        /* Node panel overlay */
        .node-panel-overlay {
          position: fixed;
          z-index: 1001;
          pointer-events: auto;
        }

        /* Desktop: right side panel with 30% padding on top, bottom, right */
        .node-panel-desktop {
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          display: flex;
          align-items: stretch;
          justify-content: flex-end;
          padding-top: 15vh;
          padding-bottom: 15vh;
          padding-right: 15vw;
        }

        .node-panel-desktop .node-panel {
          width: 420px;
          max-width: 35vw;
          height: 100%;
          overflow-y: auto;
          background: var(--color-bg, #ffffff);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
          position: relative;
        }

        [data-theme="dark"] .node-panel-desktop .node-panel {
          background: #1a1a1a;
        }

        /* Mobile: full modal */
        .node-panel-mobile {
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .node-panel-mobile .node-panel {
          width: 100%;
          max-width: 400px;
          max-height: 85vh;
          overflow-y: auto;
          background: var(--color-bg, #ffffff);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
          position: relative;
        }

        [data-theme="dark"] .node-panel-mobile .node-panel {
          background: #1a1a1a;
        }

        .node-card {
          background: var(--color-bg, #ffffff);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          width: 100%;
          height: auto;
          overflow-y: auto;
          overflow-x: hidden;
          position: relative;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          pointer-events: auto;
          padding: 0;
          display: flex;
          flex-direction: column;
        }

        .node-card > *:last-child {
          padding-bottom: 1.5rem;
        }

        .node-card::-webkit-scrollbar {
          width: 8px;
        }

        .node-card::-webkit-scrollbar-track {
          background: transparent;
        }

        .node-card::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 4px;
        }

        .node-card::-webkit-scrollbar-thumb:hover {
          background: var(--color-muted);
        }

        .node-card-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: var(--color-sidebar-bg);
          border: 1px solid var(--color-border);
          border-radius: 50%;
          width: 2rem;
          height: 2rem;
          min-width: 2rem;
          min-height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.25rem;
          line-height: 1;
          color: var(--color-text);
          z-index: 10;
          box-shadow: none;
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-weight: 300;
          letter-spacing: 0;
        }

        .node-card-close:hover {
          background: var(--color-sidebar-bg);
        }

        .node-card-image {
          width: 100%;
          height: 200px;
          min-height: 150px;
          max-height: 250px;
          overflow: hidden;
          border-radius: 12px 12px 0 0;
          margin: 0;
          padding: 0;
          position: relative;
          flex-shrink: 0;
          background: var(--color-border);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .node-card-embed {
          width: 100%;
          margin: 1.5rem 0;
          border-radius: 12px;
          overflow: hidden;
          background: #000;
          position: relative;
          min-height: 400px;
          max-height: 600px;
          height: 500px;
        }

        .node-card-embed-content {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }

        .node-card-content {
          padding: 1.5rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          gap: 0;
        }

        .node-card-title {
          font-size: 1.5rem;
          margin: 0 0 0.75rem 0;
          color: var(--color-text);
          line-height: 1.3;
          font-weight: 600;
          font-family: var(--font-primary);
        }

        .node-card-date {
          font-size: 1rem;
          color: var(--color-muted);
          margin: 0 0 1rem 0;
          font-weight: 500;
        }

        .node-card-description {
          font-size: 0.95rem;
          line-height: 1.5;
          color: var(--color-text);
          margin: 0 0 1rem 0;
        }

        .node-card-worked-with {
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--color-border);
        }

        .node-card-worked-with-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }

        .node-card-worked-with-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .node-card-worked-with-person {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        /* PersonAvatar component styles */
        .person-avatar-link,
        .person-avatar-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        .person-avatar-link:hover {
          opacity: 0.8;
        }

        .person-avatar-image {
          width: var(--avatar-size, 24px);
          height: var(--avatar-size, 24px);
          min-width: var(--avatar-size, 24px);
          min-height: var(--avatar-size, 24px);
          max-width: var(--avatar-size, 24px);
          max-height: var(--avatar-size, 24px);
          border-radius: 50%;
          object-fit: cover;
          display: block;
          flex-shrink: 0;
          background: var(--color-border);
        }

        .person-avatar-name {
          font-size: 0.9rem;
          color: var(--color-text);
          white-space: nowrap;
          font-weight: 500;
        }

        .person-avatar-link .person-avatar-name {
          color: var(--color-link);
          text-decoration: none;
        }

        .person-avatar-link:hover .person-avatar-name {
          color: var(--color-link-hover);
        }

        .node-card-link {
          display: inline;
          color: var(--color-link);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.9rem;
          transition: color 0.2s ease;
        }

        .node-card-link:hover {
          color: var(--color-link-hover);
          text-decoration: none;
        }

        .node-card-link:focus {
          outline: 2px solid var(--color-link);
          outline-offset: 2px;
          border-radius: 2px;
        }

        .node-card-link:visited {
          color: var(--color-link);
          text-decoration: none;
        }



        .node-card-connections {
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .node-card-connections-inline {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .node-card-connections-label {
          font-weight: 500;
          color: var(--color-muted);
          flex-shrink: 0;
        }

        .node-card-connections-items {
          display: inline-flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 0;
        }

        .node-card-connections-separator {
          color: var(--color-muted);
        }

        .node-card-connection-link {
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          color: var(--color-link);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s ease;
          display: inline;
          line-height: inherit;
        }



        .node-card-connection-link:hover {
          color: var(--color-link-hover);
          text-decoration: underline;
        }

        .node-card-connection-link:focus {
          outline: 2px solid var(--color-link);
          outline-offset: 2px;
          border-radius: 2px;
        }



        .node-card-connection-date {
          font-size: 0.8125rem;
          color: var(--color-muted);
          font-weight: 400;
        }

        /* Mobile: < 640px */
        @media (max-width: 639px) {
          .career-odyssey-wrapper {
            height: 100vh;
            min-height: 500px;
          }

          .node-card {
            width: 320px;
            max-width: calc(100vw - 2rem);
            max-height: 60vh;
          }
          
          .node-card-wrapper.node-card-mobile {
            /* Center-center positioning handled by inline styles */
          }

          .node-card-content {
            padding: 1rem;
          }

          .node-card-title {
            font-size: 1.125rem;
          }

          .node-card-image {
            min-height: 120px;
            max-height: 180px;
          }

          .node-card-embed {
            min-height: 250px;
            max-height: 350px;
            height: 300px;
          }

          .node-card-close {
            top: 0.5rem;
            right: 0.5rem;
            width: 2rem;
            height: 2rem;
            font-size: 1.125rem;
          }
        }

        /* Tablet: 640px - 1023px */
        @media (min-width: 640px) and (max-width: 1023px) {
          .career-odyssey-wrapper {
            height: 100vh;
            min-height: 600px;
          }

          .node-card {
            width: 360px;
            max-height: 70vh;
          }
          
          .node-card-wrapper.node-card-mobile {
            /* Center-center positioning handled by inline styles */
          }

          .node-card-content {
            padding: 1.25rem;
          }

          .node-card-title {
            font-size: 1.375rem;
          }

          .node-card-image {
            min-height: 150px;
            max-height: 220px;
          }

          .node-card-embed {
            min-height: 300px;
            max-height: 450px;
            height: 400px;
          }
        }

        /* Mobile/Tablet: < 1024px (shared styles) */
        @media (max-width: 1023px) {
          .career-odyssey-container {
            /* Improve touch interactions on mobile/tablet */
            -webkit-tap-highlight-color: transparent;
            touch-action: pan-x pan-y pinch-zoom;
          }
        }

        /* Desktop: >= 1024px */
        @media (min-width: 1024px) {
          .career-odyssey-wrapper {
            height: 100vh;
          }

          .node-card {
            width: 380px;
            max-height: 85vh;
          }
        }

        /* Large Desktop: >= 1440px */
        @media (min-width: 1440px) {
          .node-card {
            max-width: 420px;
          }
        }

        .zoom-controls {
          position: fixed;
          top: 50%;
          right: 1.5rem;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          z-index: 1001;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .zoom-control-btn {
          width: 2.5rem;
          height: 2.5rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          color: var(--color-text);
          font-size: 1.25rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          user-select: none;
        }

        .zoom-control-btn:hover {
          background: var(--color-sidebar-bg);
          transform: scale(1.05);
        }

        .zoom-control-btn:active {
          transform: scale(0.95);
        }

        /* Mobile: < 640px */
        @media (max-width: 639px) {
          .zoom-controls {
            top: auto;
            bottom: 1rem;
            right: 1rem;
            left: auto;
            transform: none;
            flex-direction: row;
            padding: 0.5rem;
            gap: 0.5rem;
          }

          .zoom-control-btn {
            width: 2.5rem;
            height: 2.5rem;
            font-size: 1.125rem;
          }
        }

        /* Tablet: 640px - 1023px */
        @media (min-width: 640px) and (max-width: 1023px) {
          .zoom-controls {
            top: 50%;
            right: 1rem;
            transform: translateY(-50%);
            padding: 0.5rem;
          }

          .zoom-control-btn {
            width: 2.5rem;
            height: 2.5rem;
            font-size: 1.125rem;
          }
        }

        /* Mobile/Tablet: < 1024px */
        @media (max-width: 1023px) {
          .zoom-controls {
            /* Ensure controls are accessible on touch devices */
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }
        }

        .timeline {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1002;
          pointer-events: none;
          height: auto;
          width: auto;
          max-height: 3rem;
        }

        .timeline-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text);
          letter-spacing: 0.025em;
          background: rgba(250, 248, 245, 0.5);
          border: 1px solid var(--color-border);
          border-radius: 9999px;
          backdrop-filter: blur(10px);
          pointer-events: auto;
          height: auto;
          width: auto;
          white-space: nowrap;
        }

        [data-theme="dark"] .timeline-content {
          background: rgba(26, 24, 22, 0.5);
        }

        .timeline-year {
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }

        .timeline-link {
          color: var(--color-link);
          text-decoration: none;
          transition: color 0.2s ease;
          cursor: pointer;
        }

        .timeline-link:hover {
          color: var(--color-link-hover);
          text-decoration: underline;
        }

        .timeline-separator {
          color: var(--color-muted);
          font-weight: 400;
        }

        /* Mobile: < 640px */
        @media (max-width: 639px) {
          .timeline {
            bottom: 1rem;
          }

          .timeline-content {
            padding: 0.5rem 1rem;
            font-size: 0.8125rem;
            gap: 0.5rem;
          }
        }

        /* Tablet: 640px - 1023px */
        @media (min-width: 640px) and (max-width: 1023px) {
          .timeline {
            bottom: 1.25rem;
          }

          .timeline-content {
            padding: 0.5625rem 1.125rem;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CareerOdyssey;
