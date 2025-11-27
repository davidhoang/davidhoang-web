import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PersonAvatar } from './PersonAvatar';

// Dynamic imports for Konva to avoid SSR issues
// Store Konva components in module-level cache with versioning
let konvaCache: {
  Stage: any;
  Layer: any;
  Circle: any;
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
    console.log('Konva cache cleared');
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
    console.log('Clearing outdated Konva cache (version mismatch)');
    konvaCache = null;
  }
  
  try {
    console.log('Loading Konva...');
    const [reactKonva, konvaLib] = await Promise.all([
      import('react-konva'),
      import('konva')
    ]);
    
    // Handle both default and named exports for Konva
    const Konva = konvaLib.default || konvaLib;
    
    // Check for LinearGradient - it might be in different locations
    let LinearGradientClass = null;
    if (Konva && Konva.LinearGradient) {
      LinearGradientClass = Konva.LinearGradient;
    } else if (konvaLib && konvaLib.LinearGradient) {
      LinearGradientClass = konvaLib.LinearGradient;
    } else if (konvaLib.default && konvaLib.default.LinearGradient) {
      LinearGradientClass = konvaLib.default.LinearGradient;
    }
    
    console.log('Konva loaded, checking LinearGradient:', {
      hasKonva: !!Konva,
      hasLinearGradient: !!LinearGradientClass,
      konvaKeys: Konva ? Object.keys(Konva).slice(0, 20) : [],
      konvaLibKeys: konvaLib ? Object.keys(konvaLib).slice(0, 20) : []
    });
    
    konvaCache = {
      Stage: reactKonva.Stage,
      Layer: reactKonva.Layer,
      Circle: reactKonva.Circle,
      Line: reactKonva.Line,
      Text: reactKonva.Text,
      Image: reactKonva.Image,
      Group: reactKonva.Group,
      Path: reactKonva.Path,
      Konva: Konva,
      LinearGradient: LinearGradientClass,
      version: KONVA_CACHE_VERSION,
    };
    
    console.log('Konva loaded successfully', { version: KONVA_CACHE_VERSION });
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
  type: 'milestone' | 'company' | 'event' | 'transition' | 'spark';
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
  radius: number;
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
const MAX_NODE_RADIUS = 120;
const DEFAULT_NODE_RADIUS = 80; // Default node radius for grid calculation
const GRID_DOTS_PER_NODE = 8; // Number of grid dots visible across default node diameter
// For 8 dots across diameter, we need 7 intervals: spacing = diameter / 7
const BASE_GRID_SPACING = (DEFAULT_NODE_RADIUS * 2) / (GRID_DOTS_PER_NODE - 1); // 8-dot grid: 160px diameter / 7 ≈ 22.86px spacing
const MAIN_PATH_Y = 800; // Centered vertically to use more canvas space
const BRANCH_SPACING = 320; // Increased for better vertical distribution
const CANVAS_WIDTH = 3600; // Increased from 2400 for more horizontal space
const CANVAS_HEIGHT = 2000; // Increased to use more vertical space
const PADDING = 200; // Increased padding to allow nodes to spread to edges
const TEXT_FONT_SIZE = 12;
const TEXT_PADDING = 16; // Padding around text inside node
const TEXT_PADDING_NOT_TAKEN = 10; // Reduced padding for paths not taken
const MIN_NODE_SPACING = 80; // Significantly increased from 40 - Minimum space between node edges

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

// Format date for display
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  if (dateStr.length === 4) return dateStr; // Year only
  if (dateStr.length === 7) return dateStr; // YYYY-MM
  return dateStr; // YYYY-MM-DD
};

// Calculate node positions
const calculateLayout = (nodes: Node[]): PositionedNode[] => {
  // Parse dates and create positioned nodes with calculated radii
  const positionedNodes: PositionedNode[] = nodes.map(node => ({
    ...node,
    timestamp: parseDate(node.date),
    x: node.x || 0,
    y: node.y || 0,
    radius: calculateNodeRadius(node),
    pathTaken: node.pathTaken !== false, // Default to true
  }));

  // Sort by date, then by pathTaken status (true first), then by sequence if dates are very close
  positionedNodes.sort((a, b) => {
    const dateDiff = a.timestamp - b.timestamp;
    // If dates are within the same year (approximately), prioritize pathTaken status
    if (Math.abs(dateDiff) < 365 * 24 * 60 * 60 * 1000) { // Within 1 year
      // Path taken nodes should come before path not taken nodes
      if (a.pathTaken !== b.pathTaken) {
        return a.pathTaken ? -1 : 1;
      }
      // If same pathTaken status, use sequence
      const seqA = a.sequence ?? 0;
      const seqB = b.sequence ?? 0;
      if (seqA !== seqB) {
        return seqA - seqB;
      }
    }
    return dateDiff;
  });

  // Auto-connect true nodes to the previous chronological true node if no connections specified
  positionedNodes.forEach((node, index) => {
    if (node.pathTaken && (!node.connections || node.connections.length === 0)) {
      // Find the previous true node in chronological order
      for (let i = index - 1; i >= 0; i--) {
        if (positionedNodes[i].pathTaken) {
          node.connections = [positionedNodes[i].id];
          break;
        }
      }
    }
  });

  // Separate Present nodes from regular nodes
  const presentNodes = positionedNodes.filter(n => isPresentNode(n));
  const nonPresentNodes = positionedNodes.filter(n => !isPresentNode(n));

  // Find date range (excluding Present nodes for timeline calculation)
  const timestamps = nonPresentNodes.map(n => n.timestamp);
  const minTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : Date.now();
  const maxTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
  const dateRange = maxTimestamp - minTimestamp || 1;

  // Calculate horizontal positions based on dates (for non-Present nodes)
  // Use more of the canvas width for better distribution
  const horizontalRange = CANVAS_WIDTH - (PADDING * 2);
  const leftEdge = PADDING;
  
  nonPresentNodes.forEach(node => {
    if (!node.x) {
      const ratio = dateRange > 0 
        ? (node.timestamp - minTimestamp) / dateRange 
        : 0.5;
      // Distribute nodes across the full horizontal range, leaving space for Present nodes on the right
      // Reserve right edge for Present nodes (about 15% of canvas width)
      const reservedRightSpace = CANVAS_WIDTH * 0.15;
      const availableWidth = horizontalRange - reservedRightSpace;
      node.x = leftEdge + (ratio * availableWidth);
    }
  });

  // Position Present nodes on the far right of the canvas
  // All Present nodes share the same X position (far right)
  // Override any manual x positioning to ensure Present nodes are always on the right
  const rightEdgeX = CANVAS_WIDTH - PADDING;
  
  presentNodes.forEach((node) => {
    // Always position Present nodes at the far right, overriding any manual x values
    node.x = rightEdgeX;
  });

  // Separate spark nodes from regular nodes for special handling
  const sparkNodes = positionedNodes.filter(n => n.type === 'spark');
  const regularNodes = positionedNodes.filter(n => n.type !== 'spark');
  
  // Calculate vertical positions for regular nodes (non-spark)
  const branchCounts = new Map<string, number>();
  const mainPathBranches = new Map<string, PositionedNode[]>();
  
  // First pass: identify nodes that share the same connection source
  regularNodes.forEach(node => {
    if (node.y) return; // Manual override
    
    const connectionKey = node.connections?.[0] || 'root';
    
    if (node.pathTaken) {
      // Track main path nodes that share the same source
      if (!mainPathBranches.has(connectionKey)) {
        mainPathBranches.set(connectionKey, []);
      }
      mainPathBranches.get(connectionKey)!.push(node);
    }
  });
  
  // Second pass: assign positions for regular nodes
  regularNodes.forEach(node => {
    if (node.y) return; // Manual override
    
    const connectionKey = node.connections?.[0] || 'root';
    
    if (node.pathTaken) {
      // Check if this node shares a source with other main path nodes
      const sharedNodes = mainPathBranches.get(connectionKey) || [];
      
      if (sharedNodes.length > 1) {
        // Multiple nodes from same source - create divergent paths
        const index = sharedNodes.indexOf(node);
        const totalNodes = sharedNodes.length;
        
        // Alternate above/below, with first node on main path if odd number
        if (totalNodes === 1) {
          node.y = MAIN_PATH_Y;
        } else {
          // Calculate offset: center nodes around main path
          const centerIndex = (totalNodes - 1) / 2;
          const offsetIndex = index - centerIndex;
          
          // Use branch spacing for divergence
          // Give more space if this divergent path contains "Made first Angel Investment"
          const hasAngelInvestment = sharedNodes.some(n => n.id === 'first-angel-investment');
          const spacing = hasAngelInvestment ? BRANCH_SPACING * 1.8 : BRANCH_SPACING; // 80% more space
          
          const offset = offsetIndex * spacing;
          node.y = MAIN_PATH_Y + offset;
          
          // Ensure nodes don't go outside canvas bounds
          const minY = PADDING + node.radius;
          const maxY = CANVAS_HEIGHT - PADDING - node.radius;
          node.y = Math.max(minY, Math.min(maxY, node.y));
        }
      } else {
        // Single node from this source - keep on main path
        node.y = MAIN_PATH_Y;
      }
    } else {
      // Branch nodes (pathTaken: false)
      const branchIndex = branchCounts.get(connectionKey) || 0;
      branchCounts.set(connectionKey, branchIndex + 1);
      
      // Alternate above/below with better vertical distribution
      const offset = (branchIndex % 2 === 0 ? 1 : -1) * BRANCH_SPACING * Math.ceil((branchIndex + 1) / 2);
      node.y = MAIN_PATH_Y + offset;
      
      // Ensure branch nodes don't go outside canvas bounds
      const minY = PADDING + node.radius;
      const maxY = CANVAS_HEIGHT - PADDING - node.radius;
      node.y = Math.max(minY, Math.min(maxY, node.y));
    }
  });

  // Group regular nodes by year and add spacing for same-year nodes
  // Exclude Present nodes from year-grouping to keep them on the far right
  const yearGroups = new Map<string, PositionedNode[]>();
  regularNodes.forEach(node => {
    // Skip Present nodes - they should stay on the far right
    if (isPresentNode(node)) return;
    
    const year = node.date || node.dateRange?.split('-')[0] || 'unknown';
    if (!yearGroups.has(year)) {
      yearGroups.set(year, []);
    }
    yearGroups.get(year)!.push(node);
  });

  // Add spacing for regular nodes in the same year
  yearGroups.forEach((yearNodes, year) => {
    if (yearNodes.length > 1) {
      // Sort nodes: pathTaken nodes first (left), then pathNotTaken nodes (right)
      // Within each group, sort by timestamp (chronological order), then by x position, then by sequence
      yearNodes.sort((a, b) => {
        // First, separate pathTaken (false) from pathTaken (true)
        // pathTaken: true should come first (left), pathTaken: false should come after (right)
        if (a.pathTaken !== b.pathTaken) {
          // If a is pathTaken and b is not, a comes first (left)
          // If a is not pathTaken and b is, b comes first (left)
          return a.pathTaken ? -1 : 1;
        }
        
        // If both have same pathTaken status, sort by timestamp (chronological order)
        const timeDiff = a.timestamp - b.timestamp;
        if (Math.abs(timeDiff) > 1000) { // More than 1 second difference
          return timeDiff;
        }
        
        // If timestamps are very close, sort by x position
        const xDiff = a.x - b.x;
        // If x positions are very close (within 50px), use sequence
        if (Math.abs(xDiff) < 50) {
          const seqA = a.sequence ?? 0;
          const seqB = b.sequence ?? 0;
          if (seqA !== seqB) {
            return seqA - seqB;
          }
        }
        return xDiff;
      });
      
      // Calculate spacing based on node sizes - significantly increased spacing for better readability
      const minSpacing = 250; // Significantly increased from 150 - Minimum spacing between nodes of same year
      let currentX = yearNodes[0]?.x || 0;
      
      yearNodes.forEach((node, index) => {
        if (index > 0) {
          // Ensure minimum spacing from previous node
          const prevNode = yearNodes[index - 1];
          // Add extra spacing based on node sizes to prevent overlap
          const spacing = Math.max(minSpacing, prevNode.radius + node.radius + minSpacing);
          const requiredX = prevNode.x + prevNode.radius + spacing;
          if (currentX < requiredX) {
            currentX = requiredX;
          }
        }
        node.x = currentX;
        // Calculate next position with proper spacing
        currentX = node.x + node.radius + minSpacing;
      });
    }
  });

  // Group spark nodes by year and position them in clusters
  const sparkYearGroups = new Map<string, PositionedNode[]>();
  sparkNodes.forEach(node => {
    const year = node.date || node.dateRange?.split('-')[0] || 'unknown';
    if (!sparkYearGroups.has(year)) {
      sparkYearGroups.set(year, []);
    }
    sparkYearGroups.get(year)!.push(node);
  });

  // Position spark nodes close to their connected main nodes (20px to 60px away)
  sparkNodes.forEach((sparkNode) => {
    // Find the connected main node
    const connectedNodeId = sparkNode.connections?.[0];
    if (!connectedNodeId) {
      // Fallback: position at year center if no connection
      const year = sparkNode.date || sparkNode.dateRange?.split('-')[0] || 'unknown';
      const yearRatio = dateRange > 0 
        ? (sparkNode.timestamp - minTimestamp) / dateRange 
        : 0.5;
      const reservedRightSpace = CANVAS_WIDTH * 0.15;
      const availableWidth = (CANVAS_WIDTH - (PADDING * 2)) - reservedRightSpace;
      sparkNode.x = PADDING + (yearRatio * availableWidth);
      sparkNode.y = MAIN_PATH_Y;
      return;
    }
    
    const connectedNode = positionedNodes.find(n => n.id === connectedNodeId);
    if (!connectedNode) {
      // Fallback: position at year center if connected node not found
      const year = sparkNode.date || sparkNode.dateRange?.split('-')[0] || 'unknown';
      const yearRatio = dateRange > 0 
        ? (sparkNode.timestamp - minTimestamp) / dateRange 
        : 0.5;
      const reservedRightSpace = CANVAS_WIDTH * 0.15;
      const availableWidth = (CANVAS_WIDTH - (PADDING * 2)) - reservedRightSpace;
      sparkNode.x = PADDING + (yearRatio * availableWidth);
      sparkNode.y = MAIN_PATH_Y;
      return;
    }
    
    // Calculate distance from connected node (20px to 60px)
    // If multiple spark nodes connect to the same node, space them around it
    const allSparksToSameNode = sparkNodes.filter(n => 
      n.connections?.[0] === connectedNodeId
    );
    
    // Find this spark node's index among all sparks connected to the same node
    const sparkIndex = allSparksToSameNode.findIndex(n => n.id === sparkNode.id);
    const totalSparks = allSparksToSameNode.length;
    
    let distance: number;
    let angle: number;
    
    if (totalSparks === 1) {
      // Single spark node - position at a fixed distance (40px) at a nice angle
      distance = 40;
      angle = Math.PI / 4; // 45 degrees (top-right)
    } else {
      // Multiple spark nodes - distribute them around the connected node
      const angleStep = (2 * Math.PI) / totalSparks;
      angle = (sparkIndex * angleStep) + (Math.PI / 2); // Start at top (90 degrees)
      
      // Distance varies from 20px to 60px based on number of spark nodes
      // More spark nodes = slightly further to prevent overlap
      const minDistance = 20;
      const maxDistance = 60;
      distance = minDistance + ((maxDistance - minDistance) * Math.min(1, totalSparks / 4));
    }
    
    // Position spark node relative to connected node
    sparkNode.x = connectedNode.x + Math.cos(angle) * distance;
    sparkNode.y = connectedNode.y + Math.sin(angle) * distance;
    
    // Ensure spark nodes don't go outside canvas bounds
    const minX = PADDING + sparkNode.radius;
    const maxX = CANVAS_WIDTH - PADDING - sparkNode.radius;
    const minY = PADDING + sparkNode.radius;
    const maxY = CANVAS_HEIGHT - PADDING - sparkNode.radius;
    sparkNode.x = Math.max(minX, Math.min(maxX, sparkNode.x));
    sparkNode.y = Math.max(minY, Math.min(maxY, sparkNode.y));
  });

  // Handle clustering - adjust nodes with same/similar dates (for proximity-based clustering)
  // Use larger cluster key to reduce aggressive clustering
  // Exclude Present nodes from clustering to keep them on the far right
  const clusters = new Map<number, PositionedNode[]>();
  positionedNodes.forEach(node => {
    // Skip Present nodes - they should stay on the far right
    if (isPresentNode(node)) return;
    
    const clusterKey = Math.floor(node.x / 200) * 200; // Increased from 100px to 200px for much less aggressive clustering
    if (!clusters.has(clusterKey)) {
      clusters.set(clusterKey, []);
    }
    clusters.get(clusterKey)!.push(node);
  });

  clusters.forEach((clusterNodes, key) => {
    if (clusterNodes.length > 1) {
      // Only apply clustering offset if nodes aren't already spaced by year
      const hasSameYear = clusterNodes.some(node => {
        const nodeYear = node.date || node.dateRange?.split('-')[0] || 'unknown';
        return clusterNodes.some(other => 
          other !== node && 
          (other.date || other.dateRange?.split('-')[0] || 'unknown') === nodeYear
        );
      });
      
      if (!hasSameYear) {
        // Only cluster if nodes don't share the same year
        // Significantly increased offset spacing from 50 to 100
        clusterNodes.forEach((node, index) => {
          const offset = (index - (clusterNodes.length - 1) / 2) * 100;
          node.x += offset;
        });
      }
    }
  });

  // Collision detection and resolution
  resolveCollisions(positionedNodes);

  // Final pass: ensure minimum spacing between all nodes
  // This helps catch any remaining tight spacing issues
  // Preserve Present nodes' X position - only adjust Y if needed
  for (let i = 0; i < positionedNodes.length; i++) {
    for (let j = i + 1; j < positionedNodes.length; j++) {
      const node1 = positionedNodes[i];
      const node2 = positionedNodes[j];
      
      const isNode1Present = isPresentNode(node1);
      const isNode2Present = isPresentNode(node2);
      
      const distance = getDistance(node1, node2);
      const minDistance = node1.radius + node2.radius + MIN_NODE_SPACING;
      
      if (distance < minDistance) {
        // Calculate direction to push nodes apart
        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const angle = Math.atan2(dy, dx);
        
        const overlap = minDistance - distance;
        const pushAmount = overlap * 0.5; // Gentle push
        
        // Move nodes apart, but preserve Present nodes' X position
        if (!isNode1Present) {
          node1.x -= Math.cos(angle) * pushAmount;
        }
        node1.y -= Math.sin(angle) * pushAmount;
        
        if (!isNode2Present) {
          node2.x += Math.cos(angle) * pushAmount;
        }
        node2.y += Math.sin(angle) * pushAmount;
      }
    }
  }
  
  // Final pass: ensure all Present nodes are still on the far right
  // This ensures they stay there even after collision resolution
  presentNodes.forEach((node) => {
    node.x = rightEdgeX;
  });

  return positionedNodes;
};

// Calculate distance between two nodes
const getDistance = (node1: PositionedNode, node2: PositionedNode): number => {
  const dx = node2.x - node1.x;
  const dy = node2.y - node1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Check if two nodes are colliding
const areColliding = (node1: PositionedNode, node2: PositionedNode): boolean => {
  const distance = getDistance(node1, node2);
  const minDistance = node1.radius + node2.radius + MIN_NODE_SPACING;
  return distance < minDistance;
};

// Check if a point is within a node's radius (with padding)
const isPointInNode = (point: { x: number; y: number }, node: PositionedNode, padding: number = 0): boolean => {
  const dx = point.x - node.x;
  const dy = point.y - node.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (node.radius + padding);
};

// Check if a bezier curve segment intersects with a node
const doesConnectionIntersectNode = (
  source: PositionedNode,
  target: PositionedNode,
  node: PositionedNode
): boolean => {
  // Skip if node is the source or target of this connection
  if (node.id === source.id || node.id === target.id) {
    return false;
  }

  // Calculate connection path points (same as getConnectionPath)
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const angle = Math.atan2(dy, dx);
  
  const startX = source.x + source.radius * Math.cos(angle);
  const startY = source.y + source.radius * Math.sin(angle);
  const endX = target.x - target.radius * Math.cos(angle);
  const endY = target.y - target.radius * Math.sin(angle);
  
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

        const isNode1Present = isPresentNode(node1);
        const isNode2Present = isPresentNode(node2);

        if (areColliding(node1, node2)) {
          hasCollisions = true;
          
          const distance = getDistance(node1, node2);
          const minDistance = node1.radius + node2.radius + MIN_NODE_SPACING;
          
          if (distance < 0.1) {
            // Nodes are on top of each other, separate them
            // Don't move Present nodes horizontally
            if (!isNode2Present) {
              node2.x += 50;
            }
            node2.y += 50;
            continue;
          }

          // Calculate the overlap
          const overlap = minDistance - distance;
          
          // Add extra push factor to ensure nodes separate more
          const pushFactor = 1.3; // Push nodes 30% further apart than minimum
          const adjustedOverlap = overlap * pushFactor;
          
          // Calculate direction vector
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const angle = Math.atan2(dy, dx);
          
          // Calculate how much each node should move
          // Larger nodes move less, smaller nodes move more
          const totalRadius = node1.radius + node2.radius;
          const move1 = (adjustedOverlap * node2.radius) / totalRadius;
          const move2 = (adjustedOverlap * node1.radius) / totalRadius;
          
          // Preserve Present nodes' X position - only move them vertically
          // Preserve pathTaken nodes on main path when possible
          // If one is on main path and other isn't, move the branch node more
          if (node1.pathTaken && !node2.pathTaken) {
            // Move branch node (node2) more
            if (!isNode2Present) {
              node2.x += Math.cos(angle) * (adjustedOverlap * 0.7);
            }
            node2.y += Math.sin(angle) * (adjustedOverlap * 0.7);
            if (!isNode1Present) {
              node1.x -= Math.cos(angle) * (adjustedOverlap * 0.3);
            }
            node1.y -= Math.sin(angle) * (adjustedOverlap * 0.3);
          } else if (node2.pathTaken && !node1.pathTaken) {
            // Move branch node (node1) more
            if (!isNode1Present) {
              node1.x -= Math.cos(angle) * (adjustedOverlap * 0.7);
            }
            node1.y -= Math.sin(angle) * (adjustedOverlap * 0.7);
            if (!isNode2Present) {
              node2.x += Math.cos(angle) * (adjustedOverlap * 0.3);
            }
            node2.y += Math.sin(angle) * (adjustedOverlap * 0.3);
          } else {
            // Both same type, move both proportionally
            if (!isNode1Present) {
              node1.x -= Math.cos(angle) * move1;
            }
            node1.y -= Math.sin(angle) * move1;
            if (!isNode2Present) {
              node2.x += Math.cos(angle) * move2;
            }
            node2.y += Math.sin(angle) * move2;
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

          const isOtherNodePresent = isPresentNode(otherNode);
          const isNodePresent = isPresentNode(node);

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
    milestone: { main: '#9333ea', branch: '#c084fc' }, // Purple
    company: { main: '#3b82f6', branch: '#60a5fa' }, // Blue
    event: { main: '#eab308', branch: '#fde047' }, // Yellow
    transition: { main: '#6b7280', branch: '#9ca3af' }, // Gray
    spark: { main: '#f97316', branch: '#fb923c' }, // Orange - represents inspiration and new paths
  };
  
  const colorSet = colors[type] || colors.milestone;
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
  // Calculate hop height based on size
  const hopHeights = { small: 15, medium: 25, large: 40 };
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

// Calculate connection path - routes around nodes and other connections to avoid intersections
const getConnectionPath = (
  source: PositionedNode, 
  target: PositionedNode, 
  allNodes: PositionedNode[],
  allConnections?: Array<{ source: PositionedNode; target: PositionedNode; path: string }>
): string => {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate angle between nodes
  const angle = Math.atan2(dy, dx);
  
  // Calculate start point (on source node edge)
  const startX = source.x + source.radius * Math.cos(angle);
  const startY = source.y + source.radius * Math.sin(angle);
  
  // Calculate end point (on target node edge)
  const endX = target.x - target.radius * Math.cos(angle);
  const endY = target.y - target.radius * Math.sin(angle);
  
  // Find nodes that the direct path would intersect
  const intersectingNodes: Array<{ node: PositionedNode; t: number }> = [];
  
  // Sample points along the direct path to check for intersections
  // Use more samples for better detection
  const numSamples = Math.max(100, Math.ceil(distance / 5));
  const seenNodes = new Set<string>();
  
  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    // Linear interpolation along direct path
    const x = startX + (endX - startX) * t;
    const y = startY + (endY - startY) * t;
    
    // Check if this point is inside any node (excluding source and target)
    for (const node of allNodes) {
      if (node.id === source.id || node.id === target.id) continue;
      if (seenNodes.has(node.id)) continue; // Skip if we already found this node
      
      const nodeDx = x - node.x;
      const nodeDy = y - node.y;
      const distToNode = Math.sqrt(nodeDx * nodeDx + nodeDy * nodeDy);
      
      // Check if point is within node radius + padding (with extra margin for safety)
      const requiredClearance = node.radius + MIN_NODE_SPACING + 10;
      if (distToNode < requiredClearance) {
        // Only add if we haven't seen this node yet, or if it's a significant distance away
        const existing = intersectingNodes.find(item => item.node.id === node.id);
        if (!existing) {
          intersectingNodes.push({ node, t });
          seenNodes.add(node.id);
        } else if (Math.abs(existing.t - t) > 0.2) {
          // Update t to the earliest intersection point
          if (t < existing.t) {
            existing.t = t;
          }
        }
        break; // Only count each node once per sample
      }
    }
  }
  
  // If no intersections, use simple smooth bezier curve
  if (intersectingNodes.length === 0) {
    const horizontalDistance = Math.abs(endX - startX);
    const verticalDistance = Math.abs(endY - startY);
    const totalDistance = Math.sqrt(horizontalDistance * horizontalDistance + verticalDistance * verticalDistance);
    
    // Use consistent curve factors for smooth, flowing curves
    // Ensure minimum distance to prevent sharp angles at start/end
    const minCurveFactor = 0.2; // Minimum 20% of distance
    const maxCurveFactor = 0.4; // Maximum 40% of distance
    const adaptiveFactor = Math.min(maxCurveFactor, Math.max(minCurveFactor, totalDistance / 600));
    
    const cp1x = startX + (endX - startX) * adaptiveFactor;
    const cp1y = startY + (endY - startY) * adaptiveFactor * 0.5;
    const cp2x = endX - (endX - startX) * adaptiveFactor;
    const cp2y = endY - (endY - startY) * adaptiveFactor * 0.5;
    
    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  }
  
  // Sort intersecting nodes by their position along the path (by t value)
  intersectingNodes.sort((a, b) => a.t - b.t);
  
  // Calculate waypoints to route around intersecting nodes
  const waypoints: Array<{ x: number; y: number }> = [];
  
  // For each intersecting node, calculate a waypoint that routes around it
  for (const { node, t } of intersectingNodes) {
    // Calculate the point on the direct path where we encounter this node
    const pathX = startX + (endX - startX) * t;
    const pathY = startY + (endY - startY) * t;
    
    // Calculate direction from node center to path point
    const nodeToPathDx = pathX - node.x;
    const nodeToPathDy = pathY - node.y;
    const nodeToPathDist = Math.sqrt(nodeToPathDx * nodeToPathDx + nodeToPathDy * nodeToPathDy);
    
    // If the path point is very close to or inside the node center, use a default direction
    let normalizedDx: number;
    let normalizedDy: number;
    if (nodeToPathDist < 1) {
      // Use perpendicular to the source-target line
      const lineDx = endX - startX;
      const lineDy = endY - startY;
      const lineLength = Math.sqrt(lineDx * lineDx + lineDy * lineDy);
      if (lineLength > 0) {
        normalizedDx = -lineDy / lineLength;
        normalizedDy = lineDx / lineLength;
      } else {
        normalizedDx = 1;
        normalizedDy = 0;
      }
    } else {
      // Normalize the direction vector
      normalizedDx = nodeToPathDx / nodeToPathDist;
      normalizedDy = nodeToPathDy / nodeToPathDist;
    }
    
    // Calculate perpendicular direction (90 degrees rotated)
    // Perpendicular to (dx, dy) is (-dy, dx)
    const perpDx = -normalizedDy;
    const perpDy = normalizedDx;
    
    // Determine which side to route around
    // Check which side of the line from source to target the node is on
    const lineDx = endX - startX;
    const lineDy = endY - startY;
    const nodeDx = node.x - startX;
    const nodeDy = node.y - startY;
    const crossProduct = lineDx * nodeDy - lineDy * nodeDx;
    
    // If cross product is positive, node is on one side; negative on the other
    // Choose the side that gives more clearance and avoids other nodes
    const sideMultiplier = crossProduct > 0 ? 1 : -1;
    
    // Calculate waypoint position - route around the node with safe clearance
    // Use larger clearance to ensure path doesn't get too close and allows for smooth curves
    const clearance = node.radius + MIN_NODE_SPACING + 120; // Increased clearance for smoother curves
    let waypointX = node.x + perpDx * clearance * sideMultiplier;
    let waypointY = node.y + perpDy * clearance * sideMultiplier;
    
    // Adjust waypoint to be further from source/target line for smoother routing
    // This helps create more gradual curves instead of sharp turns
    const lineLength = Math.sqrt(lineDx * lineDx + lineDy * lineDy);
    if (lineLength > 0) {
      const linePerpDx = -lineDy / lineLength;
      const linePerpDy = lineDx / lineLength;
      // Add additional offset perpendicular to the line for smoother curves
      const additionalOffset = clearance * 0.4; // Increased from 0.3 for smoother curves
      waypointX += linePerpDx * additionalOffset * sideMultiplier;
      waypointY += linePerpDy * additionalOffset * sideMultiplier;
    }
    
    waypoints.push({ x: waypointX, y: waypointY });
  }
  
  // Verify waypoints don't intersect nodes and adjust if needed
  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i];
    for (const node of allNodes) {
      if (node.id === source.id || node.id === target.id) continue;
      
      const wpDx = wp.x - node.x;
      const wpDy = wp.y - node.y;
      const wpDist = Math.sqrt(wpDx * wpDx + wpDy * wpDy);
      
      // If waypoint is too close to a node, push it further away
      if (wpDist < node.radius + MIN_NODE_SPACING + 60) {
        const angle = Math.atan2(wpDy, wpDx);
        const requiredDist = node.radius + MIN_NODE_SPACING + 100; // Increased to match new spacing
        waypoints[i] = {
          x: node.x + Math.cos(angle) * requiredDist,
          y: node.y + Math.sin(angle) * requiredDist
        };
      }
    }
  }
  
  // Build smooth path - use a single bezier curve that naturally avoids obstacles
  // Instead of routing through waypoints, we'll use them to influence the curve direction
  let path = `M ${startX} ${startY}`;
  
  const startToEndDx = endX - startX;
  const startToEndDy = endY - startY;
  const startToEndDist = Math.sqrt(startToEndDx * startToEndDx + startToEndDy * startToEndDy);
  
  if (waypoints.length === 0) {
    // No obstacles - use simple smooth bezier
    const curveFactor = Math.min(0.4, Math.max(0.2, startToEndDist / 800));
    
    const cp1x = startX + startToEndDx * curveFactor;
    const cp1y = startY + startToEndDy * curveFactor * 0.5;
    const cp2x = endX - startToEndDx * curveFactor;
    const cp2y = endY - startToEndDy * curveFactor * 0.5;
    
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  } else {
    // Calculate smooth control points that create flowing curves without sharp bends
    // Use waypoints to influence curve direction, but ensure smooth S-curves
    
    // Calculate average waypoint position for overall deflection
    let avgWaypointX = 0;
    let avgWaypointY = 0;
    for (const wp of waypoints) {
      avgWaypointX += wp.x;
      avgWaypointY += wp.y;
    }
    avgWaypointX /= waypoints.length;
    avgWaypointY /= waypoints.length;
    
    // Calculate perpendicular vector from direct path to average waypoint
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const pathPerpDx = -startToEndDy / startToEndDist;
    const pathPerpDy = startToEndDx / startToEndDist;
    
    const waypointOffsetX = avgWaypointX - midX;
    const waypointOffsetY = avgWaypointY - midY;
    const perpProjection = waypointOffsetX * pathPerpDx + waypointOffsetY * pathPerpDy;
    
    // Calculate deflection amount - limit to prevent sharp bends
    // Use a smooth, gradual deflection that creates S-curves
    const maxDeflection = startToEndDist * 0.3; // Maximum 30% of distance for deflection
    const deflectionAmount = Math.max(-maxDeflection, Math.min(maxDeflection, perpProjection * 0.5));
    
    // Calculate base curve factors - ensure minimum distance from start/end to prevent sharp angles
    const minCurveDistance = startToEndDist * 0.15; // At least 15% of distance for smooth curves
    const maxCurveDistance = startToEndDist * 0.45; // At most 45% for gentle curves
    const baseCurveFactor1 = Math.min(maxCurveDistance, Math.max(minCurveDistance, startToEndDist * 0.3)) / startToEndDist;
    const baseCurveFactor2 = Math.min(maxCurveDistance, Math.max(minCurveDistance, startToEndDist * 0.3)) / startToEndDist;
    
    // Calculate control points with smooth deflection
    // First control point: positioned along path with perpendicular deflection
    const cp1x = startX + startToEndDx * baseCurveFactor1 + pathPerpDx * deflectionAmount;
    const cp1y = startY + startToEndDy * baseCurveFactor1 + pathPerpDy * deflectionAmount;
    
    // Second control point: mirror the deflection for smooth S-curve
    const cp2x = endX - startToEndDx * baseCurveFactor2 - pathPerpDx * deflectionAmount;
    const cp2y = endY - startToEndDy * baseCurveFactor2 - pathPerpDy * deflectionAmount;
    
    // Ensure control points create smooth curves by verifying they're not too close to start/end
    // and that the angle between segments is not too sharp
    const cp1Dist = Math.sqrt((cp1x - startX) ** 2 + (cp1y - startY) ** 2);
    const cp2Dist = Math.sqrt((cp2x - endX) ** 2 + (cp2y - endY) ** 2);
    
    // If control points are too close, adjust them to maintain minimum curve radius
    const minControlDistance = startToEndDist * 0.1;
    if (cp1Dist < minControlDistance) {
      const scale = minControlDistance / cp1Dist;
      const adjustedCp1x = startX + (cp1x - startX) * scale;
      const adjustedCp1y = startY + (cp1y - startY) * scale;
      path += ` C ${adjustedCp1x} ${adjustedCp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
    } else if (cp2Dist < minControlDistance) {
      const scale = minControlDistance / cp2Dist;
      const adjustedCp2x = endX + (cp2x - endX) * scale;
      const adjustedCp2y = endY + (cp2y - endY) * scale;
      path += ` C ${cp1x} ${cp1y}, ${adjustedCp2x} ${adjustedCp2y}, ${endX} ${endY}`;
    } else {
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
    }
  }
  
  // Check for intersections with other connections and add line hops
  if (allConnections && allConnections.length > 0) {
    // Parse the current path to get control points
    const currentPathMatch = path.match(/C\s+([\d.]+)\s+([\d.]+),\s+([\d.]+)\s+([\d.]+),\s+([\d.]+)\s+([\d.]+)/);
    if (currentPathMatch) {
      const cp1x = parseFloat(currentPathMatch[1]);
      const cp1y = parseFloat(currentPathMatch[2]);
      const cp2x = parseFloat(currentPathMatch[3]);
      const cp2y = parseFloat(currentPathMatch[4]);
      const endX = parseFloat(currentPathMatch[5]);
      const endY = parseFloat(currentPathMatch[6]);
      
      const currentCurve = { startX, startY, cp1x, cp1y, cp2x, cp2y, endX, endY };
      
      // Find all intersections with other connections
      const intersections: Array<{ intersection: { t1: number; t2: number; point: { x: number; y: number } }; otherConn: typeof allConnections[0] }> = [];
      
      for (const otherConn of allConnections) {
        // Skip if this is the same connection
        if ((otherConn.source.id === source.id && otherConn.target.id === target.id) ||
            (otherConn.source.id === target.id && otherConn.target.id === source.id)) {
          continue;
        }
        
        // Parse the other connection's path
        const otherPathMatch = otherConn.path.match(/C\s+([\d.]+)\s+([\d.]+),\s+([\d.]+)\s+([\d.]+),\s+([\d.]+)\s+([\d.]+)/);
        if (!otherPathMatch) continue;
        
        const otherStartMatch = otherConn.path.match(/M\s+([\d.]+)\s+([\d.]+)/);
        if (!otherStartMatch) continue;
        
        const otherStartX = parseFloat(otherStartMatch[1]);
        const otherStartY = parseFloat(otherStartMatch[2]);
        const otherCp1x = parseFloat(otherPathMatch[1]);
        const otherCp1y = parseFloat(otherPathMatch[2]);
        const otherCp2x = parseFloat(otherPathMatch[3]);
        const otherCp2y = parseFloat(otherPathMatch[4]);
        const otherEndX = parseFloat(otherPathMatch[5]);
        const otherEndY = parseFloat(otherPathMatch[6]);
        
        const otherCurve = { startX: otherStartX, startY: otherStartY, cp1x: otherCp1x, cp1y: otherCp1y, cp2x: otherCp2x, cp2y: otherCp2y, endX: otherEndX, endY: otherEndY };
        
        // Find actual crossing/overlap (not just proximity)
        const intersection = doCurvesCross(currentCurve, otherCurve, 8);
        if (intersection) {
          intersections.push({ intersection, otherConn });
        }
      }
      
      // If we have intersections, add line hops
      // Use the first (closest) intersection for the hop
      if (intersections.length > 0) {
        // Sort by t1 (position along our curve) to get the first intersection
        intersections.sort((a, b) => a.intersection.t1 - b.intersection.t1);
        const firstIntersection = intersections[0];
        
        // Determine hop direction based on which side of the other line we're on
        const otherConn = firstIntersection.otherConn;
        const otherPathMatch = otherConn.path.match(/C\s+([\d.]+)\s+([\d.]+),\s+([\d.]+)\s+([\d.]+),\s+([\d.]+)\s+([\d.]+)/);
        const otherStartMatch = otherConn.path.match(/M\s+([\d.]+)\s+([\d.]+)/);
        
        if (otherPathMatch && otherStartMatch) {
          const otherStartX = parseFloat(otherStartMatch[1]);
          const otherStartY = parseFloat(otherStartMatch[2]);
          const otherEndX = parseFloat(otherPathMatch[5]);
          const otherEndY = parseFloat(otherPathMatch[6]);
          
          // Calculate which side of the other line our midpoint is on
          const otherDx = otherEndX - otherStartX;
          const otherDy = otherEndY - otherStartY;
          const ourMidX = (startX + endX) / 2;
          const ourMidY = (startY + endY) / 2;
          const toOtherStartDx = ourMidX - otherStartX;
          const toOtherStartDy = ourMidY - otherStartY;
          const crossProduct = otherDx * toOtherStartDy - otherDy * toOtherStartDx;
          
          // Determine hop direction (up if we're on one side, down if on the other)
          // Also determine hop size based on how many intersections we have
          const hopDirection: 'up' | 'down' = crossProduct > 0 ? 'up' : 'down';
          const hopSize: 'small' | 'medium' | 'large' = intersections.length === 1 ? 'medium' : 'large';
          
          // Add the line hop
          path = addLineHop(
            startX, startY,
            cp1x, cp1y,
            cp2x, cp2y,
            endX, endY,
            firstIntersection.intersection.point,
            firstIntersection.intersection.t1,
            hopSize,
            hopDirection
          );
        }
      }
    }
  }
  
  return path;
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
const calculateNodeRadius = (node: Node): number => {
  const pathTaken = node.pathTaken !== false;
  const minRadius = pathTaken ? MIN_NODE_RADIUS : MIN_NODE_RADIUS * 0.75; // Smaller min for paths not taken
  const maxRadius = pathTaken ? MAX_NODE_RADIUS : MAX_NODE_RADIUS * 0.85; // Smaller max for paths not taken
  
  if (node.image) {
    // If there's an image, use minimum radius (scaled for paths not taken)
    return minRadius;
  }
  
  // Use reduced padding for paths not taken
  const padding = pathTaken ? TEXT_PADDING : TEXT_PADDING_NOT_TAKEN;
  
  // Start with an estimated width and refine
  // Estimate based on average characters per line for 3 lines
  const words = node.label.split(/\s+/);
  const avgCharsPerWord = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  const estimatedCharsPerLine = Math.ceil(words.length / 3) * (avgCharsPerWord + 1); // +1 for space
  const estimatedLineWidth = calculateTextWidth('x'.repeat(estimatedCharsPerLine), TEXT_FONT_SIZE);
  
  // Calculate required radius based on estimated line width
  const requiredWidth = estimatedLineWidth + (padding * 2);
  let radius = requiredWidth / 2;
  
  // Refine by checking actual wrapped text
  // Binary search for optimal radius
  let low = minRadius;
  let high = maxRadius;
  let bestRadius = Math.max(minRadius, Math.min(maxRadius, radius));
  
  for (let iteration = 0; iteration < 10; iteration++) {
    const testRadius = (low + high) / 2;
    const diameter = testRadius * 2;
    const availableWidth = diameter - (padding * 2);
    
    // Wrap text to fit this width (max 3 lines)
    const lines = wrapTextToLines(node.label, availableWidth, TEXT_FONT_SIZE);
    
    // Check if all lines fit and we have <= 3 lines
    let allLinesFit = true;
    let maxLineWidth = 0;
    for (const line of lines) {
      const lineWidth = calculateTextWidth(line, TEXT_FONT_SIZE);
      maxLineWidth = Math.max(maxLineWidth, lineWidth);
      if (lineWidth > availableWidth) {
        allLinesFit = false;
        break;
      }
    }
    
    if (allLinesFit && lines.length <= 3) {
      bestRadius = testRadius;
      // Check if we can go smaller
      const requiredWidthForLines = maxLineWidth + (padding * 2);
      const requiredRadiusForLines = requiredWidthForLines / 2;
      if (requiredRadiusForLines < testRadius) {
        high = testRadius;
      } else {
        // This radius works, use it
        bestRadius = testRadius;
        break;
      }
    } else {
      // Need larger radius
      low = testRadius;
    }
  }
  
  // Clamp between min and max (with different values for paths not taken)
  return Math.max(minRadius, Math.min(maxRadius, bestRadius));
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
            0, '#3b82f6',
            0.3, '#f59e0b',
            0.5, '#f97316',
            0.7, '#f59e0b',
            1, '#3b82f6',
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
        0, '#3b82f6',
        0.3, '#f59e0b',
        0.5, '#f97316',
        0.7, '#f59e0b',
        1, '#3b82f6',
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
      console.warn('Failed to cache node group:', error);
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
    
    // Create smooth transition
    hoverTweenRef.current = new Konva.Tween({
      node: group,
      duration: 0.2, // 200ms smooth transition
      easing: Konva.Easings.EaseOut,
      scaleX: targetScale,
      scaleY: targetScale,
      opacity: targetOpacity,
      onUpdate: () => {
        scaleRef.current = group.scaleX();
        opacityRef.current = group.opacity();
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

// Animated Circle component for hover glow
const AnimatedHoverGlow: React.FC<{
  x: number;
  y: number;
  radius: number;
  stroke: string;
  isHovered: boolean;
  Konva?: any;
  Circle?: any;
}> = ({ x, y, radius, stroke, isHovered, Konva, Circle }) => {
  const circleRef = useRef<any>(null);
  const opacityTweenRef = useRef<any>(null);
  
  useEffect(() => {
    if (!circleRef.current || !Konva) return;
    
    const circle = circleRef.current;
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
      node: circle,
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
  
  if (!Circle) return null;
  
  return (
    <Circle
      ref={circleRef}
      x={x}
      y={y}
      radius={radius}
      fill=""
      stroke={stroke}
      strokeWidth={2}
      opacity={0}
      listening={false}
    />
  );
};

// Animated shadow for node circle
const AnimatedNodeCircle: React.FC<{
  x: number;
  y: number;
  radius: number;
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
  Konva?: any;
  Circle?: any;
}> = ({ x, y, radius, fill, opacity, stroke, strokeWidth, dash, isHovered, onMouseEnter, onMouseLeave, onMouseDown, onClick, Konva, Circle }) => {
  const circleRef = useRef<any>(null);
  const shadowTweenRef = useRef<any>(null);
  
  useEffect(() => {
    if (!circleRef.current || !Konva) return;
    
    const circle = circleRef.current;
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
      node: circle,
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
  
  if (!Circle) return null;
  
  return (
    <Circle
      ref={circleRef}
      x={x}
      y={y}
      radius={radius}
      fill={fill}
      opacity={opacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
      dash={dash}
      shadowBlur={0}
      shadowColor="rgba(0,0,0,0.2)"
      listening={true}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onClick={onClick}
    />
  );
};

// Node Image component with loading and smooth transitions
// Uses a Group with a Circle mask to properly contain the image within the circular node
const NodeImage: React.FC<{
  src: string;
  x: number;
  y: number;
  radius: number;
  opacity?: number;
  scale?: number;
  KonvaImage?: any;
  Konva?: any;
  Group?: any;
  Circle?: any;
  isHovered?: boolean;
}> = ({ src, x, y, radius, opacity = 1, scale = 1, KonvaImage, Konva, Group, Circle, isHovered = false }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const groupRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const opacityTweenRef = useRef<any>(null);
  
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = src;
  }, [src]);
  
  // Animate opacity on hover change
  useEffect(() => {
    if (!groupRef.current || !Konva) return;
    
    const group = groupRef.current;
    const targetOpacity = isHovered ? 0.85 : opacity;
    
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
  }, [isHovered, opacity, Konva]);
  
  if (!image || !KonvaImage || !Group || !Circle) return null;
  
  // Use the full radius for the mask circle
  const maskRadius = radius - 2; // Slight padding to account for stroke
  
  // Create clip function for circular masking
  const clipFunc = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    ctx.arc(0, 0, maskRadius, 0, Math.PI * 2, false);
    ctx.clip();
  };
  
  // Calculate image scale to cover the circle (maintain aspect ratio)
  const imgAspectRatio = image.width / image.height;
  const scaleX = (maskRadius * 2) / image.width;
  const scaleY = (maskRadius * 2) / image.height;
  // Use the larger scale to ensure the image covers the entire circle
  const patternScale = Math.max(scaleX, scaleY);
  
  // Center horizontally: pattern X should be at -image.width/2 (centered)
  // Align to top: pattern Y should be at -maskRadius (top of circle)
  const patternX = -image.width / 2;
  const patternY = -maskRadius;
  
  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      opacity={opacity}
      clipFunc={clipFunc}
    >
      {/* Create a circle with the image as a fill pattern */}
      <Circle
        ref={circleRef}
        x={0}
        y={0}
        radius={maskRadius}
        fillPatternImage={image}
        fillPatternX={patternX}
        fillPatternY={patternY}
        fillPatternScaleX={patternScale}
        fillPatternScaleY={patternScale}
        listening={false}
      />
    </Group>
  );
};

const CareerOdyssey: React.FC<CareerOdysseyProps> = ({ careerData }) => {
  try {
    console.log('CareerOdyssey component rendering, careerData:', careerData ? 'present' : 'missing');
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
  const [nodeDragOffsets, setNodeDragOffsets] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null);
  const [konvaComponents, setKonvaComponents] = useState<typeof konvaCache>(null);
  const touchStartRef = useRef<{ x: number; y: number; viewBoxX: number; viewBoxY: number } | null>(null);
  const nodeDragStartRef = useRef<{ nodeId: string; startX: number; startY: number; originalX: number; originalY: number; lastOffsetX: number; lastOffsetY: number } | null>(null);
  const [initialViewBox, setInitialViewBox] = useState<ViewBox | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastWheelTime = useRef<number>(0);
  const wheelEventCount = useRef<number>(0);
  const viewBoxRef = useRef<ViewBox>(viewBox); // Track current viewBox without triggering re-renders
  const rafIdRef = useRef<number | null>(null); // Track requestAnimationFrame ID
  const isDraggingRef = useRef<boolean>(false); // Track drag state without triggering re-renders
  const cardPositionUpdateTimeoutRef = useRef<number | null>(null); // Track card position update timeout
  
  // Load Konva on client side only
  useEffect(() => {
    console.log('CareerOdyssey useEffect running, window:', typeof window !== 'undefined');
    if (typeof window !== 'undefined') {
      console.log('Starting Konva load...');
      loadKonva().then((components) => {
        console.log('Konva load completed, components:', components ? 'loaded' : 'failed');
        if (components) {
          console.log('Setting konvaComponents state');
          setKonvaComponents(components);
        } else {
          console.error('Konva components failed to load');
        }
      }).catch((error) => {
        console.error('Error loading Konva:', error);
      });
    } else {
      console.log('Window is undefined, skipping Konva load');
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

  // Initialize nodes
  useEffect(() => {
    if (!careerData || !careerData.nodes || careerData.nodes.length === 0) {
      console.error('No career data provided or nodes array is empty', { careerData: !!careerData });
      return;
    }
    
    console.log('Initializing nodes, careerData.nodes length:', careerData.nodes.length);
    try {
      const positionedNodes = calculateLayout(careerData.nodes as Node[]);
      
      // Safety check: ensure nodes were created
      if (!positionedNodes || positionedNodes.length === 0) {
        console.error('No nodes were created from career data');
        return;
      }
      
      console.log('Nodes initialized:', positionedNodes.length, 'nodes', {
        firstNode: positionedNodes[0] ? { id: positionedNodes[0].id, x: positionedNodes[0].x, y: positionedNodes[0].y } : null
      });
      setNodes(positionedNodes);
      
      // Center view on "Studied Art" node as the nexus point
      if (positionedNodes.length > 0) {
        // Find the "Studied Art" node
        const nexusNode = positionedNodes.find(n => n.id === 'studied-art');
        
        if (nexusNode) {
          // Use a fixed zoom level centered on the nexus node
          // This matches the "actual size" view shown in the image
          // Adjusted to show the nexus node clearly with surrounding nodes visible
          const defaultZoomWidth = CANVAS_WIDTH * 0.32; // Adjusted zoom level to match image
          const defaultZoomHeight = CANVAS_HEIGHT * 0.32;
          
          const defaultVB = {
            x: nexusNode.x - defaultZoomWidth / 2,
            y: nexusNode.y - defaultZoomHeight / 2,
            width: defaultZoomWidth,
            height: defaultZoomHeight,
          };
          
          // Ensure viewBox has valid dimensions
          if (defaultVB.width > 0 && defaultVB.height > 0) {
            setViewBox(defaultVB);
            // Store this as the "actual size" reference (for home button)
            setInitialViewBox(defaultVB);
          } else {
            // Fallback to default viewBox if calculation fails
            console.warn('Invalid viewBox calculated, using default');
            const fallbackVB = {
              x: nexusNode.x - CANVAS_WIDTH * 0.16,
              y: nexusNode.y - CANVAS_HEIGHT * 0.16,
              width: CANVAS_WIDTH * 0.32,
              height: CANVAS_HEIGHT * 0.32,
            };
            setViewBox(fallbackVB);
            setInitialViewBox(fallbackVB);
          }
        } else {
          // Fallback if nexus node not found
          console.warn('Nexus node (studied-art) not found, using default view');
          const fallbackVB = {
            x: 0,
            y: 0,
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
          };
          setViewBox(fallbackVB);
          setInitialViewBox(fallbackVB);
        }
      }
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
          console.log('Updating stage size:', newSize);
          setStageSize(newSize);
        } else {
          console.warn('Container has zero size:', rect);
        }
      } else {
        console.warn('containerRef.current is null, cannot update stage size');
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


  // Pan functionality with Konva (optimized to reduce flicker)
  const handleStageMouseDown = useCallback((e: any) => {
    if (e.evt.button !== 0) return; // Only left mouse button
    if (e.evt.metaKey || e.evt.ctrlKey) return; // Prevent macOS swipe gestures
    
    setIsDragging(true);
    isDraggingRef.current = true;
    if (!stageRef.current || !containerRef.current) return;
    
    const stage = stageRef.current;
    const startX = e.evt.clientX;
    const startY = e.evt.clientY;
    const startPos = { x: stage.x(), y: stage.y() };
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!stageRef.current || !containerRef.current) return;
      
      // Cancel any pending RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      // Update stage position directly (no React re-render)
      stage.position({
        x: startPos.x + deltaX,
        y: startPos.y + deltaY,
      });
      
      // Throttle viewBox state update using requestAnimationFrame
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
        
        // Only update state occasionally to reduce re-renders
        // This will be synced properly on mouse up
      });
      
      // Force redraw for smooth animation
      stage.batchDraw();
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      
      // Cancel any pending RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
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
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);
  }, [stageStateToViewBox]);

  // Touch support for mobile/trackpad with Konva
  const handleStageTouchStart = useCallback((e: any) => {
    if (e.evt.touches.length !== 1) return; // Only handle single touch for panning
    
    setIsDragging(true);
    isDraggingRef.current = true;
    if (!stageRef.current) return;
    
    const stage = stageRef.current;
    const touch = e.evt.touches[0];
    const currentViewBox = viewBoxRef.current;
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      viewBoxX: currentViewBox.x,
      viewBoxY: currentViewBox.y,
    };
  }, []);

  const handleStageTouchMove = useCallback((e: any) => {
    if (!touchStartRef.current || e.evt.touches.length !== 1 || !stageRef.current) return;
    
    const stage = stageRef.current;
    const touch = e.evt.touches[0];
    if (!containerRef.current) return;
    
    // Cancel any pending RAF
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
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
    rafIdRef.current = requestAnimationFrame(() => {
      setViewBox(newViewBox);
    });
  }, [viewBoxToStageState]);

  const handleStageTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    touchStartRef.current = null;
    setIsDragging(false);
    
    // Cancel any pending RAF
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    
    // Final sync of viewBox state
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
  }, [stageStateToViewBox]);

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
    console.log('handleNodeMouseDown called', { nodeId: node.id, button: e.button, metaKey: e.metaKey, ctrlKey: e.ctrlKey });
    
    e.stopPropagation(); // Prevent canvas panning
    
    if (e.button !== 0) return; // Only left mouse button
    if (e.metaKey || e.ctrlKey) return; // Don't drag with modifier keys
    
    console.log('Starting node drag for:', node.id);
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
      console.log('handleMouseUp for node drag', { nodeId: node.id, hasMoved });
      
      // Use the offset from the ref (captured during drag) instead of state
      // This ensures we have the most up-to-date value, especially on first drag
      const currentOffset = nodeDragStartRef.current && nodeDragStartRef.current.nodeId === node.id
        ? { x: nodeDragStartRef.current.lastOffsetX, y: nodeDragStartRef.current.lastOffsetY }
        : (nodeDragOffsets.get(node.id) || { x: 0, y: 0 });
      
      // Check if node is within bounds (60px radius)
      if (!containerRef.current) {
        console.log('No container ref, clearing drag state');
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
      
      console.log('Drag vs click check', { hasMoved, screenDistance, wasActualDrag, distance, maxDistance });
      
      // If within bounds and was a drag, animate back to original position
      if (wasActualDrag && distance > 0 && distance <= maxDistance) {
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
            requestAnimationFrame(animate);
          } else {
            // Ensure we end at exactly 0,0
            setNodeDragOffsets(prev => {
              const newMap = new Map(prev);
              newMap.set(node.id, { x: 0, y: 0 });
              return newMap;
            });
          }
        };
        
        requestAnimationFrame(animate);
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
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
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
    console.log('[CLICK] ===== NODE CLICKED =====', { 
      nodeId: node.id, 
      nodeLabel: node.label,
      currentSelected: selectedNode?.id,
      wasDragging: draggingNodeId === node.id,
      dragDistance: nodeDragDistanceRef.current?.nodeId === node.id ? nodeDragDistanceRef.current.distance : 0
    });
    
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // Check if this was actually a drag (moved more than 5px)
    const wasActualDrag = nodeDragDistanceRef.current?.nodeId === node.id && 
                          nodeDragDistanceRef.current.distance > 5;
    
    if (wasActualDrag) {
      console.log('[CLICK] Ignoring - was a drag, not a click');
      nodeDragDistanceRef.current = null;
      return;
    }
    
    // If clicking a different node while one is open, dismiss the current card immediately
    if (selectedNode && selectedNode.id !== node.id) {
      console.log('[CLICK] Dismissing current card - different node clicked');
      setSelectedNode(null);
      setCardPosition(null);
    }
    
    // Toggle selection - if clicking the same node, close it
    if (selectedNode?.id === node.id) {
      console.log('[CLICK] Closing card - same node clicked');
      setSelectedNode(null);
      setCardPosition(null);
      nodeDragDistanceRef.current = null;
      return;
    }
    
    console.log('[CLICK] Opening card for node:', node.id, node.label);
    
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
        setSelectedNode(node);
        
        // Set a default position
        const defaultPos = isMobile 
          ? { x: window.innerWidth / 2 - 180, y: 100 }
          : { x: window.innerWidth / 2 - 190, y: 100 };
        setCardPosition(defaultPos);
        
        console.log('[CLICK] Card shown after centering animation completed:', { selectedNode: node.id, position: defaultPos });
      }, animationDuration);
    } else {
      // Fallback: if no container, show immediately
      setSelectedNode(node);
      const defaultPos = isMobile 
        ? { x: window.innerWidth / 2 - 180, y: 100 }
        : { x: window.innerWidth / 2 - 190, y: 100 };
      setCardPosition(defaultPos);
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

  // Update card position when selectedNode or viewBox changes
  useEffect(() => {
    if (!selectedNode) {
      setCardPosition(null);
      return;
    }
    
    // Always ensure we have a position
    if (!cardPosition) {
      const defaultPos = isMobile 
        ? { x: window.innerWidth / 2 - 180, y: 100 }
        : { x: window.innerWidth / 2 - 190, y: 100 };
      setCardPosition(defaultPos);
    }
    
    // Update position based on node location (debounced)
    if (cardPositionUpdateTimeoutRef.current !== null) {
      clearTimeout(cardPositionUpdateTimeoutRef.current);
    }
    
    cardPositionUpdateTimeoutRef.current = window.setTimeout(() => {
      if (!selectedNode || !containerRef.current) return;
      
      const nodeOffset = nodeDragOffsets.get(selectedNode.id) || { x: 0, y: 0 };
      const nodeDisplayX = selectedNode.x + nodeOffset.x;
      const nodeDisplayY = selectedNode.y + nodeOffset.y;
      
      const screenPos = svgToScreen(nodeDisplayX, nodeDisplayY);
      
      if (screenPos) {
        if (isMobile) {
          const cardWidth = window.innerWidth < 640 ? 320 : 360;
          setCardPosition({
            x: window.innerWidth / 2 - cardWidth / 2,
            y: Math.max(20, screenPos.y - 150),
          });
        } else {
          const cardWidth = 380;
          const rightEdge = window.innerWidth - 20;
          const leftEdge = 20;
          let cardX = screenPos.x + selectedNode.radius + 20;
          
          if (cardX + cardWidth > rightEdge) {
            cardX = screenPos.x - selectedNode.radius - cardWidth - 20;
            if (cardX < leftEdge) {
              cardX = (window.innerWidth - cardWidth) / 2;
            }
          }
          
          setCardPosition({
            x: cardX,
            y: Math.max(20, screenPos.y - 150),
          });
        }
      }
    }, 100);
    
    return () => {
      if (cardPositionUpdateTimeoutRef.current !== null) {
        clearTimeout(cardPositionUpdateTimeoutRef.current);
      }
    };
  }, [selectedNode, viewBox, nodeDragOffsets, isMobile, svgToScreen, cardPosition]);

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

  // Home button - center on "Studied Art and Computer Science" at 3x zoom (default actual size)
  const handleHome = useCallback(() => {
    if (!containerRef.current || !initialViewBox) return;
    
    // Find the "Studied Art and Computer Science" node
    const homeNode = nodes.find(node => node.id === 'studied-art');
    if (!homeNode) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Get node position (with any drag offset)
    const nodeOffset = nodeDragOffsets.get(homeNode.id) || { x: 0, y: 0 };
    const nodeDisplayX = homeNode.x + nodeOffset.x;
    const nodeDisplayY = homeNode.y + nodeOffset.y;
    
    // Calculate viewBox to center the node at actual size
    const newX = nodeDisplayX - (centerX / rect.width) * initialViewBox.width;
    const newY = nodeDisplayY - (centerY / rect.height) * initialViewBox.height;
    
    // Animate to home position
    animateViewBox({
      x: newX,
      y: newY,
      width: initialViewBox.width,
      height: initialViewBox.height,
    }, 600);
  }, [nodes, nodeDragOffsets, initialViewBox, animateViewBox]);

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

  // Memoize visible nodes based on viewport
  const visibleNodes = useMemo(() => {
    const visible = nodes.filter(node => {
      const dragOffset = nodeDragOffsets.get(node.id) || { x: 0, y: 0 };
      const isVisible = isNodeVisible(node, dragOffset);
      if (!isVisible && nodes.length > 0) {
        // Log first few non-visible nodes for debugging
        const nodeIndex = nodes.indexOf(node);
        if (nodeIndex < 3) {
          console.log(`Node ${node.id} not visible:`, {
            nodeX: node.x,
            nodeY: node.y,
            viewBox,
            displayX: node.x + dragOffset.x,
            displayY: node.y + dragOffset.y
          });
        }
      }
      return isVisible;
    });
    return visible;
  }, [nodes, nodeDragOffsets, isNodeVisible, viewBox]);

  // Memoize connections - MUST be before early return to follow Rules of Hooks
  const connectionsWithPaths = useMemo(() => {
    if (!nodes.length) return [];
    
    // Memoized connection calculation - single pass with optimization
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
        
        // Only include if connection is visible
        if (isConnectionVisible(sourceNode, node, sourceOffset, targetOffset)) {
          allConnections.push({ 
            source: sourceNode, 
            target: node,
            sourceDisplay, 
            targetDisplay,
            sourceOffset,
            targetOffset
          });
        }
      });
    });
    
    // Calculate paths for all visible connections (first pass - initial paths)
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
  }, [nodes, nodeDragOffsets, isConnectionVisible]);

  // Stage click handler - fallback for node clicks if shape events don't work
  // Must be defined after findNodeAtPoint and handleNodeClick
  const handleStageClick = useCallback((e: any) => {
    // Only handle if we're not dragging the stage
    if (isDragging) {
      console.log('Stage click ignored - stage is being dragged');
      return;
    }
    
    // Don't handle if we just finished dragging a node
    if (draggingNodeId) {
      console.log('Stage click ignored - node was being dragged');
      return;
    }
    
    if (!stageRef.current || !konvaComponents) return;
    
    const stage = stageRef.current;
    const pointerPos = stage.getPointerPosition();
    
    if (!pointerPos) return;
    
    console.log('Stage clicked at:', pointerPos);
    
    // Find node at this position
    const clickedNode = findNodeAtPoint(pointerPos.x, pointerPos.y);
    
    if (clickedNode) {
      console.log('Node found at click position:', clickedNode.id);
      // Use a small delay to ensure drag state is cleared
      setTimeout(() => {
        handleNodeClick(clickedNode);
      }, 10);
    } else {
      console.log('No node found at click position');
      // Click on empty space - close card if open
      if (selectedNode) {
        setSelectedNode(null);
        setCardPosition(null);
      }
    }
  }, [isDragging, draggingNodeId, selectedNode, findNodeAtPoint, handleNodeClick, konvaComponents]);

  // Don't render Konva components during SSR or before Konva is loaded
  if (typeof window === 'undefined' || !konvaComponents) {
    console.log('Showing loading state:', { window: typeof window !== 'undefined', konvaComponents: !!konvaComponents });
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
  const { Stage, Layer, Circle, Line, Text: KonvaText, Image: KonvaImage, Group, Path, Konva } = konvaComponents;

  // Debug logging
  console.log('Rendering canvas:', {
    nodes: nodes.length,
    visibleNodes: visibleNodes.length,
    stageSize,
    viewBox,
    konvaComponents: !!konvaComponents
  });

  return (
    <div className="career-odyssey-wrapper">
      <div
        ref={containerRef}
        className={`career-odyssey-container ${isDragging ? 'is-dragging' : ''}`}
        style={{ 
          cursor: hoveredNode ? 'pointer' : (isDragging ? 'grabbing' : 'grab')
        }}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
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
                
                // Get endpoint positions for dots
                const sourceX = sourceNode.x + (nodeDragOffsets.get(sourceNode.id) || { x: 0, y: 0 }).x;
                const sourceY = sourceNode.y + (nodeDragOffsets.get(sourceNode.id) || { x: 0, y: 0 }).y;
                const targetX = targetNode.x + (nodeDragOffsets.get(targetNode.id) || { x: 0, y: 0 }).x;
                const targetY = targetNode.y + (nodeDragOffsets.get(targetNode.id) || { x: 0, y: 0 }).y;
                
                const connectionColor = isActivePath ? activeGradient : (pathTaken ? textColor : '#6b7280');
                const dotRadius = isActivePath ? 4 : (pathTaken ? 3 : 2.5);
                
                return (
                  <Group key={connectionKey} listening={false} perfectDrawEnabled={false}>
                    {/* Glowing background path for active (Present) connections only */}
                    {isActivePath && (
                      <Path
                        data={path}
                        fill=""
                        stroke={activeGradient}
                        strokeWidth={5}
                        lineCap="round"
                        opacity={connectionOpacity * 0.4}
                        shadowBlur={3}
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
                        strokeWidth={3}
                        lineCap="round"
                        dash={[20, 100]}
                        opacity={connectionOpacity * 0.8}
                        Path={Path}
                        Konva={Konva}
                      />
                    )}
                    {/* Main path */}
                    <Path
                      data={path}
                      fill=""
                      stroke={connectionColor}
                      strokeWidth={isActivePath ? 4 : (pathTaken ? 2 : 1.5)}
                      dash={pathTaken ? undefined : [8, 4]}
                      lineCap="round"
                      opacity={connectionOpacity}
                      listening={false}
                      perfectDrawEnabled={false}
                    />
                    {/* Dot endpoints */}
                    <Circle
                      x={sourceX}
                      y={sourceY}
                      radius={dotRadius}
                      fill={connectionColor}
                      opacity={connectionOpacity}
                      listening={false}
                      perfectDrawEnabled={false}
                    />
                    <Circle
                      x={targetX}
                      y={targetY}
                      radius={dotRadius}
                      fill={connectionColor}
                      opacity={connectionOpacity}
                      listening={false}
                      perfectDrawEnabled={false}
                    />
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
                const borderColor = getThemeColor('--color-border', '#e5e7eb');
                const textColor = getThemeColor('--color-text', '#000000');
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
                    {/* White background circle (when no image) */}
                    {!node.image && (
                      <Circle
                        x={0}
                        y={0}
                        radius={node.radius - 2}
                        fill={bgColor}
                        listening={false}
                        perfectDrawEnabled={false}
                      />
                    )}
                    
                    {/* Hover glow ring - animated */}
                    <AnimatedHoverGlow
                      x={0}
                      y={0}
                      radius={node.radius + 8}
                      stroke={nodeColor}
                      isHovered={isHovered}
                      Konva={Konva}
                      Circle={Circle}
                    />
                    
                    {/* Node circle - animated shadow */}
                    <AnimatedNodeCircle
                      x={0}
                      y={0}
                      radius={node.radius}
                      fill={nodeColor}
                      opacity={pathTaken ? 0.2 : 0.1}
                      stroke={borderColor}
                      strokeWidth={pathTaken ? 3 : 2}
                      dash={pathTaken ? undefined : [5, 5]}
                      isHovered={isHovered}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onMouseDown={(e) => {
                        e.cancelBubble = true;
                        e.evt.stopPropagation();
                        if (e.evt.button === 0 && !e.evt.metaKey && !e.evt.ctrlKey) {
                          handleNodeMouseDown(node, e.evt);
                        }
                      }}
                      onClick={(e) => {
                        console.log('Konva Circle onClick fired', { nodeId: node.id, evt: e.evt });
                        e.cancelBubble = true;
                        e.evt.stopPropagation();
                        e.evt.preventDefault();
                        handleNodeClick(node, e.evt);
                      }}
                      Konva={Konva}
                      Circle={Circle}
                    />
                  
                    {/* Node image */}
                    {node.image && (
                      <NodeImage
                        src={node.image}
                        x={0}
                        y={0}
                        radius={node.radius}
                        opacity={1}
                        KonvaImage={KonvaImage}
                        scale={1}
                        Konva={Konva}
                        Group={Group}
                        Circle={Circle}
                        isHovered={isHovered}
                      />
                    )}
                    
                    {/* Node label - only show when no image */}
                    {!node.image && (() => {
                      // Calculate available width for text (diameter minus padding)
                      const diameter = node.radius * 2;
                      const padding = pathTaken ? TEXT_PADDING : TEXT_PADDING_NOT_TAKEN;
                      const availableWidth = diameter - (padding * 2);
                      
                      // Wrap text to fit in max 3 lines
                      const lines = wrapTextToLines(node.label, availableWidth, TEXT_FONT_SIZE);
                      
                      // Limit to 3 lines maximum
                      const displayLines = lines.slice(0, 3);
                      
                      // Calculate line height for vertical centering
                      const lineHeight = TEXT_FONT_SIZE * 1.2;
                      const totalHeight = displayLines.length * lineHeight;
                      
                      // Calculate the maximum width of all lines for proper centering
                      const maxLineWidth = Math.max(...displayLines.map(line => calculateTextWidth(line, TEXT_FONT_SIZE)));
                      
                      return (
                        <KonvaText
                          x={0}
                          y={0}
                          text={displayLines.join('\n')}
                          align="center"
                          fill={textColor}
                          fontSize={TEXT_FONT_SIZE}
                          fontStyle={pathTaken ? 'bold' : 'normal'}
                          opacity={pathTaken ? 0.95 : 0.75}
                          listening={false}
                          perfectDrawEnabled={false}
                          lineHeight={lineHeight / TEXT_FONT_SIZE}
                          width={availableWidth}
                          offsetX={maxLineWidth / 2}
                          offsetY={totalHeight / 2}
                        />
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

      {/* Node card - ALWAYS render when selectedNode exists */}
      {selectedNode && (() => {
        // Find connected nodes
        const connectedNodes: PositionedNode[] = [];
        const incomingNodes: PositionedNode[] = [];
        
        if (selectedNode.connections) {
          selectedNode.connections.forEach(connId => {
            const connectedNode = nodes.find(n => n.id === connId);
            if (connectedNode) {
              connectedNodes.push(connectedNode);
            }
          });
        }
        
        nodes.forEach(node => {
          if (node.connections && node.connections.includes(selectedNode.id)) {
            incomingNodes.push(node);
          }
        });
        
        // Always use a valid position - fallback to center if needed
        const finalPosition = cardPosition || {
          x: isMobile ? window.innerWidth / 2 : window.innerWidth / 2 - 190,
          y: 100
        };
        
        return (
          <motion.div
            key={`card-${selectedNode.id}`}
            className={`node-card-wrapper ${isMobile ? 'node-card-mobile' : ''}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              left: isMobile ? '50%' : `${finalPosition.x}px`,
              top: `${finalPosition.y}px`,
              transform: isMobile ? 'translateX(-50%) translateY(-50%)' : 'none',
              zIndex: 10000,
              pointerEvents: 'auto',
            }}
          >
          <div 
            className="node-card"
            onWheel={(e) => {
              // Stop wheel events from propagating to canvas panning
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              // Stop mouse events from propagating to canvas panning
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              // Stop touch events from propagating to canvas panning
              e.stopPropagation();
            }}
          >
            {selectedNode.image && (
              <div 
                className="node-card-image"
                style={{
                  backgroundImage: `url(${selectedNode.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                <button
                  className="node-card-close"
                  onClick={handleCloseModal}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            )}
            
            {!selectedNode.image && !selectedNode.iframe && (
              <button
                className="node-card-close"
                onClick={handleCloseModal}
                aria-label="Close"
              >
                ×
              </button>
            )}
            
            <div className="node-card-content">
              <h2 className="node-card-title">{selectedNode.label}</h2>
              
              {(selectedNode.dateRange || selectedNode.date) && (
                <div className="node-card-date">
                  {selectedNode.dateRange || formatDate(selectedNode.date)}
                </div>
              )}
              
              {selectedNode.description && (
                <p className="node-card-description">{selectedNode.description}</p>
              )}
              
              {selectedNode.iframe && (
                <div className="node-card-embed">
                  <iframe
                    src={selectedNode.iframe}
                    title={selectedNode.label}
                    className="node-card-embed-content"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              )}
              
              {selectedNode.workedWith && selectedNode.workedWith.length > 0 && (
                <div className="node-card-worked-with">
                  <h3 className="node-card-worked-with-title">Worked with</h3>
                  <div className="node-card-worked-with-list">
                    {selectedNode.workedWith.map((person, index) => (
                      <div key={index} className="node-card-worked-with-person">
                        <PersonAvatar 
                          person={person} 
                          size={40}
                          className="node-card-person-avatar"
                          />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Connections section - compact text-based labels */}
              {(connectedNodes.length > 0 || incomingNodes.length > 0) && (
                <div className="node-card-connections">
                  {incomingNodes.length > 0 && (
                    <div className="node-card-connections-inline">
                      <span className="node-card-connections-label">From:</span>
                      <div className="node-card-connections-items">
                        {incomingNodes.map((node, index) => (
                          <React.Fragment key={node.id}>
                            {index > 0 && <span className="node-card-connections-separator">, </span>}
                            <button
                              className="node-card-connection-link"
                              onClick={() => {
                                // Center on the connected node
                                const nodeOffset = nodeDragOffsets.get(node.id) || { x: 0, y: 0 };
                                const nodeDisplayX = node.x + nodeOffset.x;
                                const nodeDisplayY = node.y + nodeOffset.y;
                                
                                if (containerRef.current) {
                                  const rect = containerRef.current.getBoundingClientRect();
                                  const centerX = rect.width / 2;
                                  const centerY = rect.height / 2;
                                  
                                  const newX = nodeDisplayX - (centerX / rect.width) * viewBox.width;
                                  const newY = nodeDisplayY - (centerY / rect.height) * viewBox.height;
                                  
                                  animateViewBox({
                                    x: newX,
                                    y: newY,
                                    width: viewBox.width,
                                    height: viewBox.height,
                                  }, 600);
                                }
                                
                                setSelectedNode(node);
                              }}
                            >
                              {node.label}
                            </button>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {connectedNodes.length > 0 && (
                    <div className="node-card-connections-inline">
                      <span className="node-card-connections-label">To:</span>
                      <div className="node-card-connections-items">
                        {connectedNodes.map((node, index) => (
                          <React.Fragment key={node.id}>
                            {index > 0 && <span className="node-card-connections-separator">, </span>}
                            <button
                              className="node-card-connection-link"
                              onClick={() => {
                                // Center on the connected node
                                const nodeOffset = nodeDragOffsets.get(node.id) || { x: 0, y: 0 };
                                const nodeDisplayX = node.x + nodeOffset.x;
                                const nodeDisplayY = node.y + nodeOffset.y;
                                
                                if (containerRef.current) {
                                  const rect = containerRef.current.getBoundingClientRect();
                                  const centerX = rect.width / 2;
                                  const centerY = rect.height / 2;
                                  
                                  const newX = nodeDisplayX - (centerX / rect.width) * viewBox.width;
                                  const newY = nodeDisplayY - (centerY / rect.height) * viewBox.height;
                                  
                                  animateViewBox({
                                    x: newX,
                                    y: newY,
                                    width: viewBox.width,
                                    height: viewBox.height,
                                  }, 600);
                                }
                                
                                setSelectedNode(node);
                              }}
                            >
                              {node.label}
                            </button>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {selectedNode.link && (
                <a
                  href={selectedNode.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="node-card-link"
                >
                  link →
                </a>
              )}
            </div>
          </div>
        </motion.div>
        );
      })()}

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


        .node-card-wrapper {
          pointer-events: none;
        }

        .node-card {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          width: 380px;
          min-height: 200px;
          max-height: 580px;
          height: fit-content;
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
            left: 50% !important;
            transform: translateX(-50%);
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
            left: 50% !important;
            transform: translateX(-50%);
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
            max-height: 580px;
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
          z-index: 1000;
          pointer-events: none;
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
