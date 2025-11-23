import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

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
  x?: number;
  y?: number;
  sequence?: number; // Optional sequence order for nodes with same/similar dates
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

interface CareerOdysseyProps {
  careerData: {
    nodes: Node[];
  };
}

const MIN_NODE_RADIUS = 40;
const MAX_NODE_RADIUS = 120;
const MAIN_PATH_Y = 800; // Centered vertically to use more canvas space
const BRANCH_SPACING = 320; // Increased for better vertical distribution
const CANVAS_WIDTH = 3600; // Increased from 2400 for more horizontal space
const CANVAS_HEIGHT = 2000; // Increased to use more vertical space
const PADDING = 200; // Increased padding to allow nodes to spread to edges
const BASE_GRID_SPACING = 20; // Set for exactly 8 dots per average node (avg node diameter ~160px, so 160/8 = 20px spacing) - tight grid
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
  
  // If no intersections, use simple bezier curve
  if (intersectingNodes.length === 0) {
    const horizontalDistance = Math.abs(endX - startX);
    const verticalDistance = Math.abs(endY - startY);
    const totalDistance = Math.sqrt(horizontalDistance * horizontalDistance + verticalDistance * verticalDistance);
    const curveFactor = Math.min(0.4, Math.max(0.2, totalDistance / 500));
    
    const cp1x = startX + (endX - startX) * curveFactor;
    const cp1y = startY + (endY - startY) * curveFactor * 0.5;
    const cp2x = endX - (endX - startX) * curveFactor;
    const cp2y = endY - (endY - startY) * curveFactor * 0.5;
    
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
    // Calculate a smooth influence vector from waypoints
    // Instead of passing through waypoints, we'll use them to create a smooth deflection
    let influenceX = 0;
    let influenceY = 0;
    let totalWeight = 0;
    
    for (const wp of waypoints) {
      // Calculate perpendicular vector from the direct path to the waypoint
      const pathToWpDx = wp.x - (startX + (endX - startX) * 0.5);
      const pathToWpDy = wp.y - (startY + (endY - startY) * 0.5);
      
      // Project onto perpendicular to the path direction
      const pathPerpDx = -startToEndDy / startToEndDist;
      const pathPerpDy = startToEndDx / startToEndDist;
      
      const perpProjection = pathToWpDx * pathPerpDx + pathToWpDy * pathPerpDy;
      
      // Weight by distance from path center (closer obstacles have more influence)
      const distFromPath = Math.abs(perpProjection);
      const weight = 1 / (1 + distFromPath / 200); // Decay with distance
      
      influenceX += pathPerpDx * perpProjection * weight;
      influenceY += pathPerpDy * perpProjection * weight;
      totalWeight += weight;
    }
    
    if (totalWeight > 0) {
      influenceX /= totalWeight;
      influenceY /= totalWeight;
    }
    
    // Create smooth control points that gently curve around obstacles
    // Use a moderate curve factor that creates smooth, flowing curves
    const baseCurveFactor = Math.min(0.5, Math.max(0.25, startToEndDist / 1000));
    
    // First control point: start with base curve, add gentle influence
    const cp1x = startX + startToEndDx * baseCurveFactor + influenceX * 0.6;
    const cp1y = startY + startToEndDy * baseCurveFactor * 0.5 + influenceY * 0.6;
    
    // Second control point: mirror the influence for smoothness
    const cp2x = endX - startToEndDx * baseCurveFactor - influenceX * 0.6;
    const cp2y = endY - startToEndDy * baseCurveFactor * 0.5 - influenceY * 0.6;
    
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
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

const CareerOdyssey: React.FC<CareerOdysseyProps> = ({ careerData }) => {
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
  const touchStartRef = useRef<{ x: number; y: number; viewBoxX: number; viewBoxY: number } | null>(null);
  const nodeDragStartRef = useRef<{ nodeId: string; startX: number; startY: number; originalX: number; originalY: number; lastOffsetX: number; lastOffsetY: number } | null>(null);
  const [initialViewBox, setInitialViewBox] = useState<ViewBox | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastWheelTime = useRef<number>(0);
  const wheelEventCount = useRef<number>(0);

  // Initialize nodes
  useEffect(() => {
    if (!careerData || !careerData.nodes || careerData.nodes.length === 0) {
      console.error('No career data provided or nodes array is empty');
      return;
    }
    
    const positionedNodes = calculateLayout(careerData.nodes as Node[]);
    
    // Safety check: ensure nodes were created
    if (!positionedNodes || positionedNodes.length === 0) {
      console.error('No nodes were created from career data');
      return;
    }
    
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
  }, [careerData]);

  // Track window size for responsive behavior
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    // Check on mount
    checkIsMobile();
    
    // Listen for resize events
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
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


  // Pan functionality with smooth animation (Figma-like)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    e.preventDefault(); // Prevent text selection and default behaviors
    
    // Prevent macOS swipe gestures
    if (e.metaKey || e.ctrlKey) return;
    
    setIsDragging(true);
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startViewBoxX = viewBox.x;
    const startViewBoxY = viewBox.y;
    
    let animationFrameId: number | null = null;
    let lastUpdateTime = performance.now();
    const targetViewBox = { x: startViewBoxX, y: startViewBoxY };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault(); // Prevent default behaviors
      
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      // Convert pixel movement to SVG coordinate movement
      const svgDeltaX = (deltaX / rect.width) * viewBox.width;
      const svgDeltaY = (deltaY / rect.height) * viewBox.height;
      
      // Update target position
      targetViewBox.x = startViewBoxX - svgDeltaX;
      targetViewBox.y = startViewBoxY - svgDeltaY;
      
      // Use requestAnimationFrame for smooth updates
      const now = performance.now();
      if (now - lastUpdateTime >= 16) { // ~60fps
        setViewBox(prev => ({
          ...prev,
          x: targetViewBox.x,
          y: targetViewBox.y,
        }));
        lastUpdateTime = now;
      } else if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(() => {
          setViewBox(prev => ({
            ...prev,
            x: targetViewBox.x,
            y: targetViewBox.y,
          }));
          animationFrameId = null;
          lastUpdateTime = performance.now();
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);
  }, [viewBox]);

  // Touch support for mobile/trackpad
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return; // Only handle single touch for panning
    e.preventDefault();
    
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      viewBoxX: viewBox.x,
      viewBoxY: viewBox.y,
    };
    setIsDragging(true);
  }, [viewBox]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    const svgDeltaX = (deltaX / rect.width) * viewBox.width;
    const svgDeltaY = (deltaY / rect.height) * viewBox.height;
    
    setViewBox({
      ...viewBox,
      x: touchStartRef.current.viewBoxX - svgDeltaX,
      y: touchStartRef.current.viewBoxY - svgDeltaY,
    });
  }, [viewBox]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    setIsDragging(false);
  }, []);

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

  // Zoom functionality with trackpad panning support
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!svgRef.current || !containerRef.current) return;
    
    // Detect trackpad panning (two-finger scroll)
    if (isTrackpadPan(e)) {
      // Pan instead of zoom - smooth trackpad scrolling
      const panSpeed = 0.8;
      const svgDeltaX = (e.deltaX * panSpeed * viewBox.width) / containerRef.current.clientWidth;
      const svgDeltaY = (e.deltaY * panSpeed * viewBox.height) / containerRef.current.clientHeight;
      
      setViewBox(prev => ({
        ...prev,
        x: prev.x - svgDeltaX,
        y: prev.y - svgDeltaY,
      }));
      return;
    }
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert mouse position to SVG coordinates
    const svgX = viewBox.x + (mouseX / rect.width) * viewBox.width;
    const svgY = viewBox.y + (mouseY / rect.height) * viewBox.height;
    
    // Calculate zoom
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const newWidth = viewBox.width * zoomFactor;
    const newHeight = viewBox.height * zoomFactor;
    
    // Clamp zoom
    const minZoom = CANVAS_WIDTH / 4;
    const maxZoom = CANVAS_WIDTH * 2;
    if (newWidth < minZoom || newWidth > maxZoom) return;
    
    // Adjust viewBox to zoom towards mouse position
    const newX = svgX - (mouseX / rect.width) * newWidth;
    const newY = svgY - (mouseY / rect.height) * newHeight;
    
    setViewBox({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  }, [viewBox, isTrackpadPan]);

  // Node drag handler
  const handleNodeMouseDown = useCallback((node: PositionedNode, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent canvas panning
    
    if (e.button !== 0) return; // Only left mouse button
    if (e.metaKey || e.ctrlKey) return; // Don't drag with modifier keys
    
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

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!nodeDragStartRef.current || nodeDragStartRef.current.nodeId !== node.id) return;
      
      const deltaX = moveEvent.clientX - nodeDragStartRef.current.startX;
      const deltaY = moveEvent.clientY - nodeDragStartRef.current.startY;
      
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
      const distance = Math.sqrt(newOffsetX * newOffsetX + newOffsetY * newOffsetY);
      
      if (distance <= maxDistance) {
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
      // Use the offset from the ref (captured during drag) instead of state
      // This ensures we have the most up-to-date value, especially on first drag
      const currentOffset = nodeDragStartRef.current && nodeDragStartRef.current.nodeId === node.id
        ? { x: nodeDragStartRef.current.lastOffsetX, y: nodeDragStartRef.current.lastOffsetY }
        : (nodeDragOffsets.get(node.id) || { x: 0, y: 0 });
      
      // Check if node is within bounds (60px radius)
      if (!containerRef.current) {
        setDraggingNodeId(null);
        nodeDragStartRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        return;
      }
      
      const rect = containerRef.current.getBoundingClientRect();
      const maxDistance = (60 / rect.width) * viewBox.width;
      const distance = Math.sqrt(currentOffset.x * currentOffset.x + currentOffset.y * currentOffset.y);
      
      // If within bounds, animate back to original position
      if (distance > 0 && distance <= maxDistance) {
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
      
      setDraggingNodeId(null);
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

  // Node click handler
  const handleNodeClick = useCallback((node: PositionedNode, e: React.MouseEvent) => {
    // Only handle click if we didn't just drag
    if (draggingNodeId === node.id) {
      return;
    }
    e.stopPropagation();
    
    // Toggle selection - if clicking the same node, close it
    if (selectedNode?.id === node.id) {
      setSelectedNode(null);
      return;
    }
    
    // Get the node's display position (with drag offset)
    const nodeOffset = nodeDragOffsets.get(node.id) || { x: 0, y: 0 };
    const nodeDisplayX = node.x + nodeOffset.x;
    const nodeDisplayY = node.y + nodeOffset.y;
    
    // Center the node in the viewport with smooth animation
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate new viewBox to center the node
      const newX = nodeDisplayX - (centerX / rect.width) * viewBox.width;
      const newY = nodeDisplayY - (centerY / rect.height) * viewBox.height;
      
      // Animate to the new position
      animateViewBox({
        x: newX,
        y: newY,
        width: viewBox.width,
        height: viewBox.height,
      }, 600);
    }
    
    setSelectedNode(node);
  }, [selectedNode, draggingNodeId, nodeDragOffsets, viewBox, animateViewBox]);

  // Convert SVG coordinates to screen coordinates
  const svgToScreen = useCallback((svgX: number, svgY: number): { x: number; y: number } | null => {
    if (!containerRef.current || !svgRef.current) return null;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const svgRect = svgRef.current.getBoundingClientRect();
    
    // Calculate the ratio between SVG viewBox and actual screen size
    const scaleX = svgRect.width / viewBox.width;
    const scaleY = svgRect.height / viewBox.height;
    
    // Convert SVG coordinates to screen coordinates
    const screenX = containerRect.left + (svgX - viewBox.x) * scaleX;
    const screenY = containerRect.top + (svgY - viewBox.y) * scaleY;
    
    return { x: screenX, y: screenY };
  }, [viewBox]);

  // Update card position when selectedNode or viewBox changes
  useEffect(() => {
    if (!selectedNode || !containerRef.current) {
      setCardPosition(null);
      return;
    }
    
    const nodeOffset = nodeDragOffsets.get(selectedNode.id) || { x: 0, y: 0 };
    const nodeDisplayX = selectedNode.x + nodeOffset.x;
    const nodeDisplayY = selectedNode.y + nodeOffset.y;
    
    const screenPos = svgToScreen(nodeDisplayX, nodeDisplayY);
    if (screenPos) {
      // Position card to the right of the node on desktop, centered on mobile/tablet
      if (isMobile) {
        // Center the card horizontally on the screen
        // Use appropriate width based on screen size
        const cardWidth = window.innerWidth < 640 ? 320 : 360;
        setCardPosition({
          x: window.innerWidth / 2 - cardWidth / 2,
          y: screenPos.y - 200, // Offset upward
        });
      } else {
        // Position to the right of the node on desktop
        setCardPosition({
          x: screenPos.x + selectedNode.radius + 20,
          y: screenPos.y - 200, // Offset upward
        });
      }
    }
  }, [selectedNode, viewBox, nodeDragOffsets, isMobile, svgToScreen]);

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
  const zoomLevel = CANVAS_WIDTH / viewBox.width;
  const gridSpacing = BASE_GRID_SPACING * zoomLevel;
  
  // Add padding to ensure full coverage of the view
  const padding = gridSpacing * 2;
  const gridStartX = Math.floor((viewBox.x - padding) / gridSpacing) * gridSpacing;
  const gridStartY = Math.floor((viewBox.y - padding) / gridSpacing) * gridSpacing;
  const gridEndX = viewBox.x + viewBox.width + padding;
  const gridEndY = viewBox.y + viewBox.height + padding;

  // Calculate dot radius based on zoom (scale with zoom level) - very small, tight dots
  const baseDotRadius = 0.4;
  const dotRadius = baseDotRadius * zoomLevel;

  // Calculate visible year range based on viewBox
  const getVisibleYearRange = useCallback((): { startYear: number; endYear: number } => {
    if (nodes.length === 0) {
      return { startYear: 1993, endYear: 2024 };
    }

    // Get all nodes with valid timestamps (including Present nodes for max year)
    const allNodes = nodes.filter(n => n.timestamp);
    if (allNodes.length === 0) {
      return { startYear: 1993, endYear: 2024 };
    }

    // Get non-Present nodes to calculate the date range for positioning
    const nonPresentNodes = nodes.filter(n => !isPresentNode(n) && n.timestamp);
    if (nonPresentNodes.length === 0) {
      // If only Present nodes, just return their year range
      const timestamps = allNodes.map(n => n.timestamp);
      const minYear = Math.min(...timestamps.map(ts => new Date(ts).getFullYear()));
      const maxYear = Math.max(...timestamps.map(ts => new Date(ts).getFullYear()));
      return { startYear: minYear, endYear: maxYear };
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

    // Handle Present nodes - if viewBox extends to the right edge, include Present year
    const rightEdgeX = CANVAS_WIDTH - PADDING;
    if (rightX >= rightEdgeX - 50) { // 50px threshold
      const presentNodes = nodes.filter(n => isPresentNode(n) && n.timestamp);
      if (presentNodes.length > 0) {
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

    return { startYear, endYear };
  }, [nodes, viewBox]);

  const visibleYearRange = getVisibleYearRange();

  // Generate grid dots
  const gridDots: Array<{ x: number; y: number }> = [];
  for (let x = gridStartX; x <= gridEndX; x += gridSpacing) {
    for (let y = gridStartY; y <= gridEndY; y += gridSpacing) {
      gridDots.push({ x, y });
    }
  }

  return (
    <div className="career-odyssey-wrapper">
      <div
        ref={containerRef}
        className={`career-odyssey-container ${isDragging ? 'is-dragging' : ''}`}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
      >
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          className="career-odyssey-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Glow filter for active timeline */}
            <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Glow gradient for active (Present) connections - blue and warm color blend */}
            <linearGradient id="activePathGlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="30%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#f97316" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
            </linearGradient>
            
            {/* Gradient for active path main stroke - blue to warm blend */}
            <linearGradient id="activePathStrokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            
            {/* Glow gradient for regular pathTaken connections */}
            <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-text)" stopOpacity="0.1" />
              <stop offset="50%" stopColor="var(--color-text)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--color-text)" stopOpacity="0.1" />
            </linearGradient>
            
            {/* Arrowhead marker */}
            <marker
              id="arrowhead-taken"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="var(--color-text)" opacity="0.6" />
            </marker>
            <marker
              id="arrowhead-untaken"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="var(--color-text)" opacity="0.3" />
            </marker>
            {/* Clip paths for node images */}
            {nodes.map(node => {
              const dragOffset = nodeDragOffsets.get(node.id) || { x: 0, y: 0 };
              const displayX = node.x + dragOffset.x;
              const displayY = node.y + dragOffset.y;
              return node.image && (
                <clipPath key={`clip-${node.id}`} id={`clip-${node.id}`} clipPathUnits="userSpaceOnUse">
                  <circle cx={displayX} cy={displayY} r={node.radius - 5} />
                </clipPath>
              );
            })}
          </defs>

          {/* Dot grid background */}
          <g className="grid-layer" style={{ pointerEvents: 'none' }}>
            {gridDots.map((dot, i) => (
              <circle
                key={`grid-${i}`}
                cx={dot.x}
                cy={dot.y}
                r={dotRadius}
                fill="var(--color-text)"
                opacity="0.25"
              />
            ))}
          </g>

          {/* Connection lines - rendered before nodes so they appear behind */}
          <g className="connections-layer">
            {(() => {
              // First pass: collect all connections with their paths (without connection-to-connection avoidance)
              const allConnections: Array<{ source: PositionedNode; target: PositionedNode; path: string }> = [];
              
              nodes.forEach(node => {
                if (!node.connections) return;
                
                node.connections.forEach(connectionId => {
                  const sourceNode = nodes.find(n => n.id === connectionId);
                  if (!sourceNode) return;
                  
                  const sourceOffset = nodeDragOffsets.get(sourceNode.id) || { x: 0, y: 0 };
                  const targetOffset = nodeDragOffsets.get(node.id) || { x: 0, y: 0 };
                  const sourceDisplay = { ...sourceNode, x: sourceNode.x + sourceOffset.x, y: sourceNode.y + sourceOffset.y };
                  const targetDisplay = { ...node, x: node.x + targetOffset.x, y: node.y + targetOffset.y };
                  
                  // Get initial path (without connection-to-connection avoidance)
                  const initialPath = getConnectionPath(sourceDisplay, targetDisplay, nodes);
                  allConnections.push({ source: sourceDisplay, target: targetDisplay, path: initialPath });
                });
              });
              
              // Second pass: recalculate paths with connection-to-connection avoidance
              const finalConnections = allConnections.map(conn => {
                const finalPath = getConnectionPath(conn.source, conn.target, nodes, allConnections);
                return { ...conn, path: finalPath };
              });
              
              // Third pass: render connections
              return finalConnections.map((conn, index): React.ReactElement | null => {
                const { source: sourceDisplay, target: targetDisplay, path } = conn;
                const sourceNode = nodes.find(n => n.id === sourceDisplay.id);
                const targetNode = nodes.find(n => n.id === targetDisplay.id);
                if (!sourceNode || !targetNode) return null;
                
                // A path is "not taken" if the target node has pathTaken: false
                const pathTaken = targetNode.pathTaken !== false;
                
                // Check if this connection leads to a "Present" node
                const isPresentNode = (n: Node): boolean => {
                  if (n.active === true) return true;
                  if (n.dateRange && typeof n.dateRange === 'string') {
                    return n.dateRange.includes('Present');
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
                
                return (
                  <g key={`${sourceNode.id}-${targetNode.id}-${index}`}>
                    {/* Glowing background path for active (Present) connections only */}
                    {isActivePath && (
                      <path
                        d={path}
                        fill="none"
                        stroke="url(#activePathGlowGradient)"
                        strokeWidth={5}
                        strokeLinecap="round"
                        opacity={connectionOpacity * 0.4}
                        filter="url(#glow-filter)"
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                    {/* Animated highlight for active (Present) connections only */}
                    {isActivePath && (
                      <path
                        d={path}
                        fill="none"
                        stroke="url(#activePathStrokeGradient)"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeDasharray="20 100"
                        opacity={connectionOpacity * 0.8}
                        style={{ pointerEvents: 'none' }}
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          values="0;-120"
                          dur="3s"
                          repeatCount="indefinite"
                        />
                      </path>
                    )}
                    {/* Main path */}
                    <motion.path
                      d={path}
                      fill="none"
                      stroke={isActivePath ? 'url(#activePathStrokeGradient)' : (pathTaken ? 'var(--color-text)' : '#6b7280')}
                      strokeWidth={isActivePath ? 4 : (pathTaken ? 2 : 1.5)}
                      strokeDasharray={pathTaken ? '0' : '8,4'}
                      strokeLinecap="round"
                      opacity={connectionOpacity}
                      initial={{ opacity: connectionOpacity }}
                      animate={{ opacity: connectionOpacity }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </g>
                );
              }).filter(Boolean);
            })()}
          </g>

          {/* Nodes */}
          <g className="nodes-layer">
            {nodes.map(node => {
              const isHovered = hoveredNode === node.id;
              const isSelected = selectedNode?.id === node.id;
              const nodeColor = getNodeColor(node.type, node.pathTaken !== false);
              const pathTaken = node.pathTaken !== false;
              
              const dragOffset = nodeDragOffsets.get(node.id) || { x: 0, y: 0 };
              const displayX = node.x + dragOffset.x;
              const displayY = node.y + dragOffset.y;
              const isDraggingThisNode = draggingNodeId === node.id;
              
              return (
                <g
                  key={node.id}
                  className="node-group"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onMouseDown={(e) => handleNodeMouseDown(node, e)}
                  onClick={(e) => handleNodeClick(node, e)}
                  style={{ 
                    cursor: isDraggingThisNode ? 'grabbing' : 'pointer',
                    opacity: selectedNode && selectedNode.id !== node.id ? 0.3 : 1,
                    transition: 'opacity 0.3s ease-out'
                  }}
                >
                  {/* White background circle (when no image) */}
                  {!node.image && (
                    <circle
                      cx={displayX}
                      cy={displayY}
                      r={node.radius - 2}
                      fill="var(--color-bg)"
                      stroke="none"
                    />
                  )}
                  
                  {/* Hover glow ring */}
                  <motion.circle
                    cx={displayX}
                    cy={displayY}
                    r={node.radius + 8}
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth={2}
                    strokeOpacity={0}
                    initial={{ strokeOpacity: 0, scale: 1 }}
                    animate={{
                      strokeOpacity: isHovered ? 0.4 : 0,
                      scale: isHovered ? 1.2 : 1,
                    }}
                    transition={{
                      type: 'tween',
                      duration: 0.3,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    style={{ pointerEvents: 'none' }}
                  />
                  
                  {/* Node circle */}
                  <motion.circle
                    cx={displayX}
                    cy={displayY}
                    r={node.radius}
                    fill={nodeColor}
                    fillOpacity={pathTaken ? 0.2 : 0.1}
                    stroke="var(--color-border)"
                    strokeWidth={pathTaken ? 3 : 2}
                    strokeDasharray={pathTaken ? '0' : '5,5'}
                    initial={{ scale: 1 }}
                    animate={{
                      scale: isHovered ? 1.2 : isSelected ? 1.05 : 1,
                    }}
                    transition={{
                      type: 'tween',
                      duration: 0.2,
                      ease: 'easeOut',
                    }}
                    style={{ filter: isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none' }}
                  />
                  
                  {/* Node image background */}
                  {node.image && (() => {
                    const imageRadius = node.radius - 5;
                    const imageSize = imageRadius * 2 * 1.3; // Make image larger to ensure full circle coverage
                    const imageOffset = (imageSize - imageRadius * 2) / 2;
                    return (
                      <motion.image
                        href={node.image}
                        x={displayX - node.radius + 5 - imageOffset}
                        y={displayY - node.radius + 5 - imageOffset}
                        width={imageSize}
                        height={imageSize}
                        clipPath={`url(#clip-${node.id})`}
                        preserveAspectRatio="xMidYMid slice"
                        initial={{ opacity: 1, scale: 1 }}
                        animate={{ 
                          opacity: isHovered ? 0.7 : 1,
                          scale: isHovered ? 1.2 : 1
                        }}
                        transition={{ duration: 0.2 }}
                        onError={(e) => {
                          // Hide image if it fails to load
                          (e.target as SVGImageElement).style.display = 'none';
                        }}
                      />
                    );
                  })()}
                  
                  {/* Hover overlay with title and date for image nodes */}
                  {node.image && (
                    <motion.foreignObject
                      x={displayX - node.radius}
                      y={displayY - node.radius}
                      width={node.radius * 2}
                      height={node.radius * 2}
                      style={{ pointerEvents: 'none', overflow: 'hidden' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isHovered ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          padding: '0.75rem',
                          boxSizing: 'border-box',
                          borderRadius: '50%',
                          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.7) 50%, transparent 100%)',
                        }}
                      >
                        <div
                          style={{
                            color: '#fff',
                            textAlign: 'center',
                            width: '100%',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              lineHeight: '1.3',
                              marginBottom: '0.25rem',
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                            }}
                          >
                            {node.label}
                          </div>
                          {(node.dateRange || node.date) && (
                            <div
                              style={{
                                fontSize: '0.65rem',
                                opacity: 0.9,
                                textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                              }}
                            >
                              {node.dateRange || formatDate(node.date)}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.foreignObject>
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
                    const startY = displayY - (totalHeight / 2) + (lineHeight / 2);
                    
                    return (
                      <motion.text
                        x={displayX}
                        y={startY}
                        textAnchor="middle"
                        fill="var(--color-text)"
                        fontSize={TEXT_FONT_SIZE}
                        fontWeight={pathTaken ? 600 : 500}
                        opacity={pathTaken ? 0.95 : 0.75}
                        style={{
                          pointerEvents: 'none',
                          userSelect: 'none',
                        }}
                      >
                        {displayLines.map((line, index) => (
                          <tspan
                            key={index}
                            x={displayX}
                            dy={index === 0 ? 0 : lineHeight}
                          >
                            {line}
                          </tspan>
                        ))}
                      </motion.text>
                    );
                  })()}
                </g>
              );
            })}
          </g>

        </svg>
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
            <span className="timeline-year">{visibleYearRange.startYear}</span>
          ) : (
            <>
              <span className="timeline-year">{visibleYearRange.startYear}</span>
              <span className="timeline-separator">—</span>
              <span className="timeline-year">{visibleYearRange.endYear}</span>
            </>
          )}
        </div>
      </div>

      {/* Node card positioned using fixed CSS positioning */}
      {selectedNode && cardPosition && (
        <motion.div
          className={`node-card-wrapper ${isMobile ? 'node-card-mobile' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'tween', duration: 0.3, ease: 'easeOut', delay: 0.1 }}
          style={{
            position: 'fixed',
            left: isMobile ? undefined : `${cardPosition.x}px`,
            top: `${cardPosition.y}px`,
            zIndex: 1000,
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
              <div className="node-card-image">
                <img
                  src={selectedNode.image}
                  alt={selectedNode.label}
                  loading="lazy"
                />
                <button
                  className="node-card-close"
                  onClick={handleCloseModal}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            )}
            
            {!selectedNode.image && (
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

        .career-odyssey-svg {
          width: 100%;
          height: 100%;
          display: block;
          transition: none;
        }

        .node-group {
          transition: transform 0.2s ease, cursor 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
          /* Ensure content can scroll without clipping */
          padding: 0;
          padding-bottom: 1rem;
          /* Allow content to extend beyond card bounds when scrolling */
          clip-path: none;
          display: flex;
          flex-direction: column;
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
        }

        .node-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          margin: 0;
          padding: 0;
        }

        .node-card-content {
          padding: 1.5rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .node-card-title {
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
          color: var(--color-text);
          line-height: 1.3;
        }

        .node-card-date {
          font-size: 1rem;
          color: var(--color-muted);
          margin-bottom: 1rem;
          font-weight: 500;
        }

        .node-card-description {
          font-size: 0.95rem;
          line-height: 1.5;
          color: var(--color-text);
          margin-bottom: 1rem;
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
          
          .node-card-image img {
            min-height: 120px;
            max-height: 180px;
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
          
          .node-card-image img {
            min-height: 150px;
            max-height: 220px;
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
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--color-border);
          z-index: 1000;
          pointer-events: none;
          backdrop-filter: blur(10px);
          background: rgba(250, 248, 245, 0.9);
        }

        [data-theme="dark"] .timeline {
          background: rgba(26, 24, 22, 0.9);
        }

        .timeline-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text);
          letter-spacing: 0.025em;
        }

        .timeline-year {
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }

        .timeline-separator {
          color: var(--color-muted);
          font-weight: 400;
        }

        /* Mobile: < 640px */
        @media (max-width: 639px) {
          .timeline {
            padding: 0.75rem 1rem;
          }

          .timeline-content {
            font-size: 0.8125rem;
            gap: 0.5rem;
          }
        }

        /* Tablet: 640px - 1023px */
        @media (min-width: 640px) and (max-width: 1023px) {
          .timeline {
            padding: 0.875rem 1.25rem;
          }

          .timeline-content {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CareerOdyssey;
