import React, { useState, useRef, useEffect } from 'react';
import './CareerOdyssey.css';

export interface CareerNodeInput {
  id: string;
  label: string;
  description?: string;
  type: 'milestone' | 'company' | 'event' | 'transition';
  connections?: string[];
  // Next node in the path (easier way to define forward path)
  next?: string;
  image?: string;
  link?: string;
  // Date for timeline clustering (YYYY-MM format or YYYY-MM-DD)
  date?: string;
  // Indicates if this is part of the main path taken
  pathTaken?: boolean;
  // Optional: manual override for position
  x?: number;
  y?: number;
}

export interface CareerNode extends CareerNodeInput {
  x: number;
  y: number;
  radius: number; // Dynamic radius based on text content
}

interface CareerOdysseyProps {
  nodes: CareerNodeInput[];
}

// Convert 'next' field to 'connections' for easier path definition
// If node A has next: "B", then node B will have A in its connections
function convertNextToConnections(nodes: CareerNodeInput[]): CareerNodeInput[] {
  const nodeMap = new Map<string, CareerNodeInput>();
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node });
  });

  // Process each node's 'next' field
  nodes.forEach(node => {
    if (node.next) {
      const nextNode = nodeMap.get(node.next);
      if (nextNode) {
        // Add current node to next node's connections
        if (!nextNode.connections) {
          nextNode.connections = [];
        }
        if (!nextNode.connections.includes(node.id)) {
          nextNode.connections.push(node.id);
        }
      }
    }
  });

  return Array.from(nodeMap.values());
}

// Parse date string to timestamp for sorting
// Supports: YYYY, YYYY-MM, or YYYY-MM-DD format
function parseDate(dateStr?: string): number {
  if (!dateStr) {
    return 0;
  }
  const parts = dateStr.split('-');
  const year = parseInt(parts[0]) || 2000;
  const month = parts[1] ? parseInt(parts[1]) : 6; // Default to mid-year if only year provided
  const day = parts[2] ? parseInt(parts[2]) : 1;
  const timestamp = new Date(year, month - 1, day).getTime();
  if (isNaN(timestamp)) {
    return 0;
  }
  return timestamp;
}

// Calculate node size based on text content (for rectangular nodes)
// Uses a canvas to measure text width and calculates appropriate rectangular size
function calculateNodeRadius(label: string): number {
  // Create a temporary canvas to measure text
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    // Fallback if canvas not available
    return 60; // Default size
  }
  
  // Set font to match the node label style (0.75rem, 500 weight)
  context.font = '500 0.75rem -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  
  // Measure text width
  const textMetrics = context.measureText(label);
  const textWidth = textMetrics.width;
  
  // Calculate size: ensure minimum size, add padding for rectangular nodes
  // For rectangles, we use this as half-width/height for consistent sizing
  // Text width should fit comfortably inside with padding
  const padding = 40; // Horizontal padding
  const minSize = 50;
  const calculatedSize = Math.max(minSize, (textWidth + padding) / 2);
  
  // Also consider line breaks - if text is long, we might need more vertical space
  // Estimate: if text is very long, increase size
  const maxSize = 100; // Maximum size to prevent huge nodes
  const finalSize = Math.min(maxSize, calculatedSize);
  
  return Math.ceil(finalSize);
}

// Automatic layout algorithm - timeline-oriented with date clustering
function calculateNodePositions(nodes: CareerNodeInput[]): CareerNode[] {
  const nodeMap = new Map<string, CareerNodeInput>();
  const positionedNodes = new Map<string, CareerNode>();
  const incomingConnections = new Map<string, string[]>();
  
  // Build node map and track incoming connections
  nodes.forEach(node => {
    nodeMap.set(node.id, node);
    incomingConnections.set(node.id, []);
  });
  
  // Build reverse connection map
  nodes.forEach(node => {
    node.connections?.forEach(connId => {
      const existing = incomingConnections.get(node.id) || [];
      if (!existing.includes(connId)) {
        existing.push(connId);
      }
      incomingConnections.set(node.id, existing);
    });
  });
  
  // Find root nodes
  const roots: CareerNodeInput[] = [];
  nodes.forEach(node => {
    const incoming = incomingConnections.get(node.id) || [];
    if (incoming.length === 0 || node.x !== undefined || node.y !== undefined) {
      roots.push(node);
    }
  });
  
  if (roots.length === 0) {
    nodes.forEach(node => {
      if (!node.connections || node.connections.length === 0) {
        roots.push(node);
      }
    });
  }
  
  if (roots.length === 0 && nodes.length > 0) {
    roots.push(nodes[0]);
  }
  
  // Timeline-oriented layout constants
  const HORIZONTAL_SPACING = 250; // More spacing for timeline feel
  const VERTICAL_SPACING = 150;
  const START_X = 150;
  const START_Y = 200;
  const MAIN_PATH_Y_OFFSET = 0; // Main path stays centered
  const BRANCH_Y_OFFSET = 100; // Branches go up/down
  
  // Group nodes by date (for clustering)
  const dateGroups = new Map<number, CareerNodeInput[]>();
  nodes.forEach(node => {
    const date = parseDate(node.date);
    const roundedDate = Math.floor(date / (1000 * 60 * 60 * 24 * 30)); // Round to months
    if (!dateGroups.has(roundedDate)) {
      dateGroups.set(roundedDate, []);
    }
    dateGroups.get(roundedDate)!.push(node);
  });
  
  // BFS to assign timeline positions (horizontal = time)
  const timelinePositions = new Map<string, number>();
  const visited = new Set<string>();
  const queue: { id: string; xPos: number }[] = roots.map(r => ({ 
    id: r.id, 
    xPos: parseDate(r.date) || 0 
  }));
  
  roots.forEach(r => {
    visited.add(r.id);
    timelinePositions.set(r.id, parseDate(r.date) || 0);
  });
  
  while (queue.length > 0) {
    const { id, xPos } = queue.shift()!;
    
    const node = nodeMap.get(id);
    // Find nodes that have this node in their connections
    nodes.forEach(otherNode => {
      if (otherNode.connections?.includes(id) && !visited.has(otherNode.id)) {
        visited.add(otherNode.id);
        // Use date if available, otherwise use parent's position + spacing
        const nodeDate = parseDate(otherNode.date);
        const newXPos = nodeDate || (xPos + HORIZONTAL_SPACING);
        timelinePositions.set(otherNode.id, newXPos);
        queue.push({ id: otherNode.id, xPos: newXPos });
      }
    });
  }
  
  // Handle unvisited nodes
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      timelinePositions.set(node.id, parseDate(node.date) || 0);
    }
  });
  
  // Convert timestamps to months for easier calculation
  const positionsInMonths = new Map<string, number>();
  const allMonths: number[] = [];
  
  timelinePositions.forEach((timestamp, id) => {
    if (timestamp === 0) {
      // If no date, try to get from node directly
      const node = nodeMap.get(id);
      if (node?.date) {
        const parts = node.date.split('-');
        const year = parseInt(parts[0]) || 2000;
        const month = parts[1] ? parseInt(parts[1]) : 6; // Default to mid-year if only year provided
        const months = year * 12 + (month - 1);
        positionsInMonths.set(id, months);
        allMonths.push(months);
      } else {
        positionsInMonths.set(id, 0);
        allMonths.push(0);
      }
    } else {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        const months = date.getFullYear() * 12 + date.getMonth();
        positionsInMonths.set(id, months);
        allMonths.push(months);
      } else {
        positionsInMonths.set(id, 0);
        allMonths.push(0);
      }
    }
  });
  
  // Normalize to start from 0
  const minMonths = allMonths.length > 0 ? Math.min(...allMonths) : 0;
  const normalizedMonths = new Map<string, number>();
  positionsInMonths.forEach((months, id) => {
    normalizedMonths.set(id, months - minMonths);
  });
  
  // Group nodes by normalized timeline position (cluster by time)
  const timeClusters = new Map<number, CareerNodeInput[]>();
  nodes.forEach(node => {
    const normalizedMonthsPos = normalizedMonths.get(node.id) || 0;
    const clusterKey = Math.floor(normalizedMonthsPos / 3); // Cluster within 3 months
    if (!timeClusters.has(clusterKey)) {
      timeClusters.set(clusterKey, []);
    }
    timeClusters.get(clusterKey)!.push(node);
  });
  
  // Calculate final positions
  nodes.forEach(node => {
    // Use manual position if provided
    if (node.x !== undefined && node.y !== undefined) {
      positionedNodes.set(node.id, { ...node, x: node.x, y: node.y });
      return;
    }
    
    const normalizedMonthsPos = normalizedMonths.get(node.id) || 0;
    // Convert months to horizontal spacing (1 month = HORIZONTAL_SPACING/12)
    // Ensure minimum spacing so nodes don't overlap
    const x = START_X + (normalizedMonthsPos * (HORIZONTAL_SPACING / 12));
    
    // Determine Y position: main path vs branches
    const clusterKey = Math.floor(normalizedMonthsPos / 3);
    const clusterNodes = timeClusters.get(clusterKey) || [];
    
    // Sort cluster by pathTaken (main path first) then by connections
    const sortedCluster = [...clusterNodes].sort((a, b) => {
      if (a.pathTaken !== b.pathTaken) {
        return a.pathTaken ? -1 : 1;
      }
      return 0;
    });
    
    const indexInCluster = sortedCluster.indexOf(node);
    const isMainPath = node.pathTaken !== false; // Default to true if not specified
    
    // Main path nodes stay centered, others branch up/down
    let y = START_Y + MAIN_PATH_Y_OFFSET;
    if (!isMainPath && clusterNodes.length > 1) {
      // Alternate branches above and below
      const branchIndex = indexInCluster - (sortedCluster.filter(n => n.pathTaken !== false).length);
      y += branchIndex > 0 
        ? BRANCH_Y_OFFSET * (1 + Math.floor(branchIndex / 2))
        : -BRANCH_Y_OFFSET * (1 + Math.floor(Math.abs(branchIndex) / 2));
    } else if (clusterNodes.length > 1) {
      // Even main path nodes can be slightly offset if multiple in same time cluster
      y += (indexInCluster - Math.floor(clusterNodes.length / 2)) * 40;
    }
    
    positionedNodes.set(node.id, { ...node, x, y });
  });
  
  // Calculate radii for all nodes and add to positioned nodes
  const nodesWithRadii: CareerNode[] = [];
  positionedNodes.forEach((node, id) => {
    const radius = calculateNodeRadius(node.label);
    nodesWithRadii.push({ ...node, radius });
  });
  
  // Collision detection and resolution with variable node sizes
  const positionedNodesArray = nodesWithRadii;
  const maxIterations = 100;
  let iterations = 0;
  
  // Simple force-directed collision resolution
  while (iterations < maxIterations) {
    let hasCollisions = false;
    
    for (let i = 0; i < positionedNodesArray.length; i++) {
      for (let j = i + 1; j < positionedNodesArray.length; j++) {
        const nodeA = positionedNodesArray[i];
        const nodeB = positionedNodesArray[j];
        
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate minimum distance based on actual node radii
        const minDistance = (nodeA.radius + nodeB.radius) * 1.5; // 1.5x padding between nodes
        
        // Check for collision (distance less than minimum required)
        if (distance < minDistance && distance > 0) {
          hasCollisions = true;
          
          // Calculate separation force - more aggressive
          const overlap = minDistance - distance;
          const separationX = (dx / distance) * overlap;
          const separationY = (dy / distance) * overlap;
          
          // Move nodes apart, but try to maintain timeline structure
          // Main path nodes have priority - they move less
          const isAMainPath = nodeA.pathTaken !== false;
          const isBMainPath = nodeB.pathTaken !== false;
          
          if (isAMainPath && !isBMainPath) {
            // Branch node moves more
            nodeB.x += separationX * 1.8;
            nodeB.y += separationY * 1.8;
            nodeA.x -= separationX * 0.2;
            nodeA.y -= separationY * 0.2;
          } else if (!isAMainPath && isBMainPath) {
            // Branch node moves more
            nodeA.x -= separationX * 1.8;
            nodeA.y -= separationY * 1.8;
            nodeB.x += separationX * 0.2;
            nodeB.y += separationY * 0.2;
          } else if (isAMainPath && isBMainPath) {
            // Both main path - move both equally but try to maintain horizontal alignment
            // Prefer vertical separation for main path nodes
            const verticalSeparation = Math.abs(dy) < Math.abs(dx) ? separationY * 1.5 : separationY;
            nodeA.y -= verticalSeparation * 0.5;
            nodeB.y += verticalSeparation * 0.5;
            nodeA.x -= separationX * 0.5;
            nodeB.x += separationX * 0.5;
          } else {
            // Both branches (pathTaken: false) - move both equally to ensure no collision
            nodeA.x -= separationX * 0.5;
            nodeA.y -= separationY * 0.5;
            nodeB.x += separationX * 0.5;
            nodeB.y += separationY * 0.5;
          }
          
          // Ensure pathTaken: false nodes get proper spacing too
          if (!isAMainPath && !isBMainPath) {
            // Extra push for false nodes to ensure clear separation
            const extraPush = overlap * 0.3;
            nodeA.x -= (dx / distance) * extraPush;
            nodeA.y -= (dy / distance) * extraPush;
            nodeB.x += (dx / distance) * extraPush;
            nodeB.y += (dy / distance) * extraPush;
          }
          
          // Update the positioned nodes map
          positionedNodes.set(nodeA.id, nodeA);
          positionedNodes.set(nodeB.id, nodeB);
        }
      }
    }
    
    if (!hasCollisions) {
      break;
    }
    
    iterations++;
  }
  
  // Additional pass: check all pairs again to ensure no collisions remain
  for (let i = 0; i < positionedNodesArray.length; i++) {
    for (let j = i + 1; j < positionedNodesArray.length; j++) {
      const nodeA = positionedNodesArray[i];
      const nodeB = positionedNodesArray[j];
      
      const dx = nodeB.x - nodeA.x;
      const dy = nodeB.y - nodeA.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const minDistance = (nodeA.radius + nodeB.radius) * 1.5;
      if (distance < minDistance && distance > 0) {
        // Force separation - push nodes apart more aggressively
        const overlap = minDistance - distance;
        const separationX = (dx / distance) * overlap * 1.2;
        const separationY = (dy / distance) * overlap * 1.2;
        
        nodeA.x -= separationX * 0.5;
        nodeA.y -= separationY * 0.5;
        nodeB.x += separationX * 0.5;
        nodeB.y += separationY * 0.5;
        
        positionedNodes.set(nodeA.id, nodeA);
        positionedNodes.set(nodeB.id, nodeB);
      }
    }
  }
  
  // Final pass: ensure nodes in same time cluster are properly spaced
  timeClusters.forEach((clusterNodes, clusterKey) => {
    if (clusterNodes.length > 1) {
      // Sort by x position
      const sorted = clusterNodes
        .map(n => positionedNodesArray.find(n2 => n2.id === n.id))
        .filter((n): n is CareerNode => n !== undefined)
        .sort((a, b) => a.x - b.x);
      
      // Ensure minimum horizontal spacing
      for (let i = 0; i < sorted.length - 1; i++) {
        const nodeA = sorted[i];
        const nodeB = sorted[i + 1];
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const minDistance = (nodeA.radius + nodeB.radius) * 1.5;
        if (distance < minDistance) {
          const overlap = minDistance - distance;
          const adjustmentX = (dx / distance) * overlap;
          const adjustmentY = (dy / distance) * overlap;
          
          nodeA.x -= adjustmentX * 0.5;
          nodeA.y -= adjustmentY * 0.5;
          nodeB.x += adjustmentX * 0.5;
          nodeB.y += adjustmentY * 0.5;
          
          positionedNodes.set(nodeA.id, nodeA);
          positionedNodes.set(nodeB.id, nodeB);
        }
      }
    }
  });
  
  // Final verification pass: check all pairs one more time
  const finalNodesArray = positionedNodesArray;
  for (let i = 0; i < finalNodesArray.length; i++) {
    for (let j = i + 1; j < finalNodesArray.length; j++) {
      const nodeA = finalNodesArray[i];
      const nodeB = finalNodesArray[j];
      
      const dx = nodeB.x - nodeA.x;
      const dy = nodeB.y - nodeA.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const minDistance = (nodeA.radius + nodeB.radius) * 1.5;
      if (distance < minDistance && distance > 0) {
        // Last resort: force minimum distance (treat all nodes equally)
        const angle = Math.atan2(dy, dx);
        const targetDistance = minDistance;
        const midX = (nodeA.x + nodeB.x) / 2;
        const midY = (nodeA.y + nodeB.y) / 2;
        
        nodeA.x = midX - Math.cos(angle) * (targetDistance / 2);
        nodeA.y = midY - Math.sin(angle) * (targetDistance / 2);
        nodeB.x = midX + Math.cos(angle) * (targetDistance / 2);
        nodeB.y = midY + Math.sin(angle) * (targetDistance / 2);
        
        positionedNodes.set(nodeA.id, nodeA);
        positionedNodes.set(nodeB.id, nodeB);
      }
    }
  }
  
  // Check and resolve line-node intersections
  // For each connection, ensure the line doesn't pass through other nodes
  let hasLineIntersections = true;
  let lineIterations = 0;
  const maxLineIterations = 30;
  
  while (hasLineIntersections && lineIterations < maxLineIterations) {
    hasLineIntersections = false;
    
    // Check all connections
    nodes.forEach(node => {
      node.connections?.forEach(connectionId => {
        const targetNode = positionedNodes.get(connectionId);
        if (!targetNode) return;
        
        const sourceNode = positionedNodes.get(node.id);
        if (!sourceNode) return;
        
        // Check if this line passes through any other node
        finalNodesArray.forEach(otherNode => {
          if (otherNode.id === node.id || otherNode.id === connectionId) return;
          
          // Calculate distance from line segment to node center
          const x1 = sourceNode.x;
          const y1 = sourceNode.y;
          const x2 = targetNode.x;
          const y2 = targetNode.y;
          const x0 = otherNode.x;
          const y0 = otherNode.y;
          
          // Vector from start to end of line
          const dx = x2 - x1;
          const dy = y2 - y1;
          const lineLength = Math.sqrt(dx * dx + dy * dy);
          
          if (lineLength === 0) return;
          
          // Vector from start to other node
          const dx0 = x0 - x1;
          const dy0 = y0 - y1;
          
          // Project other node onto line
          const t = Math.max(0, Math.min(1, (dx0 * dx + dy0 * dy) / (lineLength * lineLength)));
          
          // Closest point on line segment to other node
          const closestX = x1 + t * dx;
          const closestY = y1 + t * dy;
          
          // Distance from other node to line
          const distToLine = Math.sqrt((x0 - closestX) ** 2 + (y0 - closestY) ** 2);
          
          // Use variable radius for clearance
          const lineNodeClearance = otherNode.radius + 10; // Extra clearance around nodes for lines
          
          // Check if line passes too close to this node
          if (distToLine < lineNodeClearance) {
            hasLineIntersections = true;
            
            // Push the interfering node away from the line
            const pushDistance = lineNodeClearance - distToLine + 5; // Extra push
            const pushAngle = Math.atan2(y0 - closestY, x0 - closestX);
            
            // Determine which node to move (prefer moving the interfering node)
            const isOtherMainPath = otherNode.pathTaken !== false;
            const isSourceMainPath = sourceNode.pathTaken !== false;
            const isTargetMainPath = targetNode.pathTaken !== false;
            
            if (!isOtherMainPath || (!isSourceMainPath && !isTargetMainPath)) {
              // Move the interfering node
              otherNode.x += Math.cos(pushAngle) * pushDistance;
              otherNode.y += Math.sin(pushAngle) * pushDistance;
              positionedNodes.set(otherNode.id, otherNode);
            } else {
              // Move the connection nodes slightly
              const moveAmount = pushDistance * 0.3;
              if (!isSourceMainPath) {
                sourceNode.x -= Math.cos(pushAngle) * moveAmount;
                sourceNode.y -= Math.sin(pushAngle) * moveAmount;
                positionedNodes.set(sourceNode.id, sourceNode);
              }
              if (!isTargetMainPath) {
                targetNode.x -= Math.cos(pushAngle) * moveAmount;
                targetNode.y -= Math.sin(pushAngle) * moveAmount;
                positionedNodes.set(targetNode.id, targetNode);
              }
            }
          }
        });
      });
    });
    
    lineIterations++;
  }
  
  // Update final nodes array with latest positions
  const finalNodesWithRadii = finalNodesArray.map(node => {
    const updated = positionedNodes.get(node.id);
    return updated || node;
  });
  
  return finalNodesWithRadii;
}

export default function CareerOdyssey({ nodes: inputNodes }: CareerOdysseyProps) {
  const initialNodes = React.useMemo(() => {
    if (!inputNodes || inputNodes.length === 0) {
      return [];
    }
    try {
      // Convert 'next' fields to 'connections' before calculating positions
      const processedNodes = convertNextToConnections(inputNodes);
      return calculateNodePositions(processedNodes);
    } catch (error) {
      return [];
    }
  }, [inputNodes]);
  
  const [selectedNode, setSelectedNode] = useState<CareerNode | null>(null);
  const [zoom, setZoom] = useState(0.6);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Node dragging state
  const [draggedNode, setDraggedNode] = useState<CareerNode | null>(null);
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const nodeDragStart = useRef({ x: 0, y: 0, nodeId: '' });
  
  // Click feedback state
  const [clickedNodeId, setClickedNodeId] = useState<string | null>(null);
  
  // Initialize node positions map
  React.useEffect(() => {
    const positions = new Map<string, { x: number; y: number }>();
    initialNodes.forEach(node => {
      positions.set(node.id, { x: node.x, y: node.y });
    });
    setNodePositions(positions);
  }, [initialNodes]);
  
  // Use dynamic positions if dragging, otherwise use initial positions
  const careerNodes = React.useMemo(() => {
    if (nodePositions.size === 0) {
      return initialNodes;
    }
    return initialNodes.map(node => {
      const dynamicPos = nodePositions.get(node.id);
      if (dynamicPos) {
        return { ...node, x: dynamicPos.x, y: dynamicPos.y };
      }
      return node;
    });
  }, [initialNodes, nodePositions]);

  // Find closest node connections for pathTaken: false nodes without explicit connections
  const closestNodeConnections = React.useMemo(() => {
    const connections: Array<{ from: string; to: string }> = [];
    
    careerNodes.forEach(node => {
      // Only process nodes with pathTaken: false that don't have explicit connections
      if (node.pathTaken === false && (!node.connections || node.connections.length === 0)) {
        let closestNode: CareerNode | null = null;
        let closestDistance = Infinity;
        
        // Find the closest node (prefer pathTaken: true nodes if they exist)
        careerNodes.forEach(otherNode => {
          if (otherNode.id === node.id) return;
          
          const dx = otherNode.x - node.x;
          const dy = otherNode.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Prefer pathTaken: true nodes, but accept any if none found
          if (distance < closestDistance) {
            const preferThis = otherNode.pathTaken !== false;
            const preferCurrent = closestNode?.pathTaken !== false;
            
            if (preferThis && !preferCurrent) {
              closestNode = otherNode;
              closestDistance = distance;
            } else if (preferThis === preferCurrent && distance < closestDistance) {
              closestNode = otherNode;
              closestDistance = distance;
            }
          }
        });
        
        if (closestNode) {
          connections.push({ from: node.id, to: closestNode.id });
        }
      }
    });
    
    return connections;
  }, [careerNodes]);
  
  // Calculate canvas bounds
  const canvasSize = React.useMemo(() => {
    if (careerNodes.length === 0) {
      return { width: 2000, height: 1000 };
    }
    const maxX = Math.max(...careerNodes.map(n => n.x), 0) + 400;
    const maxY = Math.max(...careerNodes.map(n => n.y), 0) + 400;
    return { width: Math.max(maxX, 2000), height: Math.max(maxY, 1000) };
  }, [careerNodes]);

  const centerView = (zoomLevel?: number) => {
    if (canvasRef.current) {
      const canvasWidth = canvasRef.current.offsetWidth;
      const canvasHeight = canvasRef.current.offsetHeight;
      const canvasInnerWidth = canvasSize.width;
      const canvasInnerHeight = canvasSize.height;
      const currentZoom = zoomLevel ?? zoom;
      
      setPan({
        x: (canvasWidth - canvasInnerWidth * currentZoom) / 2,
        y: (canvasHeight - canvasInnerHeight * currentZoom) / 2,
      });
    }
  };

  const centerOnNode = (nodeId: string, zoomLevel?: number) => {
    if (canvasRef.current) {
      const node = careerNodes.find(n => n.id === nodeId);
      if (!node) {
        centerView(zoomLevel);
        return;
      }

      const canvasWidth = canvasRef.current.offsetWidth;
      const canvasHeight = canvasRef.current.offsetHeight;
      const currentZoom = zoomLevel ?? zoom;
      
      // Center the view on the node
      setPan({
        x: canvasWidth / 2 - node.x * currentZoom,
        y: canvasHeight / 2 - node.y * currentZoom,
      });
    }
  };

  // Center the view on mount and when canvas size changes
  useEffect(() => {
    if (careerNodes.length > 0 && canvasRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        setTimeout(() => {
          centerView(0.6);
        }, 50);
      });
    }
  }, [canvasSize.width, canvasSize.height, careerNodes.length]);

  const handleNodeClick = (e: React.MouseEvent, node: CareerNode) => {
    e.stopPropagation();
    
    // Trigger click feedback animation
    setClickedNodeId(node.id);
    setTimeout(() => setClickedNodeId(null), 300);
    
    // Toggle if clicking the same node, otherwise select the new node
    if (selectedNode?.id === node.id) {
      setSelectedNode(null);
    } else {
      setSelectedNode(node);
    }
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: CareerNode) => {
    e.stopPropagation();
    if (e.button === 0) {
      setIsDraggingNode(true);
      setDraggedNode(node);
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        // Store the offset from mouse to node center
        const nodeCenterX = node.x;
        const nodeCenterY = node.y;
        const mouseCanvasX = (e.clientX - canvasRect.left) / zoom - pan.x / zoom;
        const mouseCanvasY = (e.clientY - canvasRect.top) / zoom - pan.y / zoom;
        
        nodeDragStart.current = {
          x: mouseCanvasX - nodeCenterX, // Offset from mouse to node center
          y: mouseCanvasY - nodeCenterY,
          nodeId: node.id
        };
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !isDraggingNode) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingNode && draggedNode) {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        const mouseCanvasX = (e.clientX - canvasRect.left) / zoom - pan.x / zoom;
        const mouseCanvasY = (e.clientY - canvasRect.top) / zoom - pan.y / zoom;
        
        // Get original position from initialNodes
        const originalNode = initialNodes.find(n => n.id === draggedNode.id);
        if (!originalNode) return;
        
        // Calculate new position with offset
        const newX = mouseCanvasX - nodeDragStart.current.x;
        const newY = mouseCanvasY - nodeDragStart.current.y;
        
        // Constrain movement - limit how far from original position (elastic effect)
        const MAX_DRAG_DISTANCE = 100; // Maximum pixels from original position
        const dx = newX - originalNode.x;
        const dy = newY - originalNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let constrainedX = newX;
        let constrainedY = newY;
        
        if (distance > MAX_DRAG_DISTANCE) {
          // Apply resistance - the further you drag, the harder it gets
          const resistance = MAX_DRAG_DISTANCE / distance;
          constrainedX = originalNode.x + (dx * resistance);
          constrainedY = originalNode.y + (dy * resistance);
        }
        
        // Update dragged node position
        const newPositions = new Map(nodePositions);
        newPositions.set(draggedNode.id, { x: constrainedX, y: constrainedY });
        
        // Apply physics: push nearby nodes away (but they also resist)
        const NODE_RADIUS = 60;
        const PUSH_DISTANCE = 150;
        const PUSH_STRENGTH = 0.2; // Reduced strength
        
        careerNodes.forEach(otherNode => {
          if (otherNode.id !== draggedNode.id) {
            const otherOriginal = initialNodes.find(n => n.id === otherNode.id);
            if (!otherOriginal) return;
            
            const dx = otherNode.x - constrainedX;
            const dy = otherNode.y - constrainedY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < PUSH_DISTANCE && distance > 0) {
              const pushFactor = (PUSH_DISTANCE - distance) / PUSH_DISTANCE;
              const pushX = (dx / distance) * pushFactor * PUSH_STRENGTH * 15;
              const pushY = (dy / distance) * pushFactor * PUSH_STRENGTH * 15;
              
              const currentPos = newPositions.get(otherNode.id) || { x: otherNode.x, y: otherNode.y };
              // Constrain pushed nodes too - they resist movement
              const newPosX = currentPos.x + pushX;
              const newPosY = currentPos.y + pushY;
              
              // Limit how far pushed nodes can move from original
              const pushDx = newPosX - otherOriginal.x;
              const pushDy = newPosY - otherOriginal.y;
              const pushDistance = Math.sqrt(pushDx * pushDx + pushDy * pushDy);
              const MAX_PUSH_DISTANCE = 50;
              
              if (pushDistance > MAX_PUSH_DISTANCE) {
                const pushResistance = MAX_PUSH_DISTANCE / pushDistance;
                newPositions.set(otherNode.id, {
                  x: otherOriginal.x + (pushDx * pushResistance),
                  y: otherOriginal.y + (pushDy * pushResistance)
                });
              } else {
                newPositions.set(otherNode.id, {
                  x: newPosX,
                  y: newPosY
                });
              }
            }
          }
        });
        
        setNodePositions(newPositions);
      }
    } else if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    if (isDraggingNode) {
      // Spring back to original positions
      const newPositions = new Map<string, { x: number; y: number }>();
      initialNodes.forEach(node => {
        newPositions.set(node.id, { x: node.x, y: node.y });
      });
      setNodePositions(newPositions);
      
      setIsDraggingNode(false);
      setDraggedNode(null);
    }
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleZoom(e.deltaY > 0 ? -0.1 : 0.1);
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, []);

  if (!inputNodes || inputNodes.length === 0 || careerNodes.length === 0) {
    return (
      <div className="career-odyssey">
        <div className="career-odyssey-header">
          <h1>Career Odyssey</h1>
          <p>Loading career nodes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="career-odyssey">
      <div className="career-odyssey-header">
        <h1>Career Odyssey</h1>
        <p>Click on nodes to explore my career journey</p>
      </div>

      <div
        className="career-canvas"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          // Close detail panel when clicking outside of it
          const target = e.target as HTMLElement;
          const isNode = target.closest('.career-node');
          const isDetailPanel = target.closest('.node-details');
          
          // If clicking on canvas background (not on a node or detail panel), close the panel
          if (!isNode && !isDetailPanel) {
            setSelectedNode(null);
          }
        }}
      >
        <div
          className="career-canvas-inner"
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            minWidth: `${canvasSize.width}px`,
            minHeight: `${canvasSize.height}px`,
          }}
        >
          <div
            className="career-canvas-transform"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
          <svg className="connections-layer" viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`} preserveAspectRatio="none">
            {/* Render explicit connections */}
            {careerNodes.map((node) =>
              node.connections?.map((connectionId) => {
                const targetNode = careerNodes.find((n) => n.id === connectionId);
                if (!targetNode) return null;
                
                // Use actual node radii
                const sourceRadius = node.radius;
                const targetRadius = targetNode.radius;
                
                // Calculate direction vector from node to target
                const dx = targetNode.x - node.x;
                const dy = targetNode.y - node.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Calculate angle to target
                const angle = Math.atan2(dy, dx);
                
                // Start point on the edge of the source node circle
                const startX = node.x + Math.cos(angle) * sourceRadius;
                const startY = node.y + Math.sin(angle) * sourceRadius;
                
                // End point on the edge of the target node circle
                const endAngle = Math.atan2(node.y - targetNode.y, node.x - targetNode.x);
                const endX = targetNode.x + Math.cos(endAngle) * targetRadius;
                const endY = targetNode.y + Math.sin(endAngle) * targetRadius;
                
                // Create straight line path from edge to edge
                const path = `M ${startX} ${startY} L ${endX} ${endY}`;
                
                // Determine if this is a main path connection
                const isMainPath = (node.pathTaken !== false) && (targetNode.pathTaken !== false);
                
                return (
                  <path
                    key={`${node.id}-${connectionId}`}
                    d={path}
                    fill="none"
                    stroke="var(--color-border)"
                    strokeWidth={isMainPath ? "3" : "2"}
                    strokeDasharray={isMainPath ? "0" : "4,4"}
                    opacity={isMainPath ? "0.6" : "0.3"}
                    className={`connection-line ${isMainPath ? 'connection-line--main-path' : 'connection-line--branch'}`}
                  />
                );
              })
            )}
            
            {/* Render closest node connections for pathTaken: false nodes without explicit connections */}
            {closestNodeConnections.map(({ from, to }) => {
              const fromNode = careerNodes.find((n) => n.id === from);
              const toNode = careerNodes.find((n) => n.id === to);
              if (!fromNode || !toNode) return null;
              
              // Use actual node radii
              const sourceRadius = fromNode.radius;
              const targetRadius = toNode.radius;
              
              // Calculate direction vector from node to target
              const dx = toNode.x - fromNode.x;
              const dy = toNode.y - fromNode.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Calculate angle to target
              const angle = Math.atan2(dy, dx);
              
              // Start point on the edge of the source node circle
              const startX = fromNode.x + Math.cos(angle) * sourceRadius;
              const startY = fromNode.y + Math.sin(angle) * sourceRadius;
              
              // End point on the edge of the target node circle
              const endAngle = Math.atan2(fromNode.y - toNode.y, fromNode.x - toNode.x);
              const endX = toNode.x + Math.cos(endAngle) * targetRadius;
              const endY = toNode.y + Math.sin(endAngle) * targetRadius;
              
              // Create straight line path from edge to edge
              const path = `M ${startX} ${startY} L ${endX} ${endY}`;
              
              return (
                <path
                  key={`closest-${from}-${to}`}
                  d={path}
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth="2"
                  strokeDasharray="6,4"
                  opacity="0.25"
                  className="connection-line connection-line--closest"
                />
              );
            })}
          </svg>

          <div className="nodes-layer">
            {careerNodes.map((node) => (
              <div
                key={node.id}
                className={`career-node career-node--${node.type} ${
                  selectedNode?.id === node.id ? 'career-node--selected' : ''
                } ${node.pathTaken !== false ? 'career-node--path-taken' : 'career-node--branch'} ${
                  isDraggingNode && draggedNode?.id === node.id ? 'career-node--dragging' : ''
                } ${clickedNodeId === node.id ? 'career-node--clicked' : ''}`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  cursor: isDraggingNode && draggedNode?.id === node.id ? 'grabbing' : 'grab',
                }}
                onClick={(e) => !isDraggingNode && handleNodeClick(e, node)}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                role="button"
                tabIndex={0}
                aria-label={`${node.label}${node.description && typeof node.description === 'string' && node.description.trim() !== '' ? `: ${node.description}` : ''}`}
              >
                <div 
                  className="career-node-content"
                  style={{
                    width: `${node.radius * 2}px`,
                    height: `${node.radius * 2}px`,
                  }}
                >
                  <div className="career-node-label">{node.label}</div>
                </div>
                {node.pathTaken !== false && node.date && (
                  <div className="career-node-year">
                    {node.date.split('-')[0]}
                  </div>
                )}
              </div>
            ))}
            
            {/* Zoom controls positioned at bottom-right */}
            <div 
              className="canvas-controls"
              style={{
                left: `${canvasSize.width - 120}px`,
                top: `${canvasSize.height - 200}px`,
              }}
            >
              <button onClick={() => handleZoom(0.1)}>Zoom In</button>
              <button onClick={() => handleZoom(-0.1)}>Zoom Out</button>
              <button onClick={() => { 
                setZoom(0.6); 
                setTimeout(() => centerOnNode('studied-art', 0.6), 0); 
              }}>Reset View</button>
            </div>
          </div>
          
          {selectedNode && (() => {
            // Position detail panel to the right of the node, but adjust if it would go off canvas
            const panelWidth = 320;
            const offsetX = 80;
            let left = selectedNode.x + offsetX;
            
            // If panel would go off right edge, position to the left instead
            if (left + panelWidth > canvasSize.width) {
              left = selectedNode.x - panelWidth - offsetX;
            }
            
            // Ensure it doesn't go off left edge
            if (left < 0) {
              left = 20;
            }
            
            return (
              <div 
                className="node-details"
                style={{
                  left: `${left}px`,
                  top: `${selectedNode.y}px`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
              <h2>{selectedNode.label}</h2>
              {selectedNode.description && typeof selectedNode.description === 'string' && selectedNode.description.trim() !== '' && (
                <p>{selectedNode.description}</p>
              )}
              {selectedNode.link && (
                <a href={selectedNode.link} target="_blank" rel="noopener noreferrer">
                  Learn more →
                </a>
              )}
              </div>
            );
          })()}
          </div>
        </div>
      </div>
    </div>
  );
}

