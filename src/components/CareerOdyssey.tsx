import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Node {
  id: string;
  label: string;
  description?: string;
  type: 'milestone' | 'company' | 'event' | 'transition';
  date?: string;
  dateRange?: string;
  active?: boolean;
  pathTaken?: boolean;
  connections?: string[];
  image?: string;
  link?: string;
  x?: number;
  y?: number;
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
const MAIN_PATH_Y = 400;
const BRANCH_SPACING = 120;
const CANVAS_WIDTH = 2400;
const CANVAS_HEIGHT = 1000;
const PADDING = 100;
const BASE_GRID_SPACING = 50;
const TEXT_FONT_SIZE = 12;
const TEXT_PADDING = 16; // Padding around text inside node
const MIN_NODE_SPACING = 10; // Minimum space between node edges

// Date parsing utility
const parseDate = (dateStr?: string): number => {
  if (!dateStr) return Date.now();
  
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parts[1] ? parseInt(parts[1], 10) - 1 : 5; // Default to mid-year
  const day = parts[2] ? parseInt(parts[2], 10) : 15;
  
  return new Date(year, month, day).getTime();
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

  // Sort by date
  positionedNodes.sort((a, b) => a.timestamp - b.timestamp);

  // Find date range
  const timestamps = positionedNodes.map(n => n.timestamp);
  const minTimestamp = Math.min(...timestamps);
  const maxTimestamp = Math.max(...timestamps);
  const dateRange = maxTimestamp - minTimestamp || 1;

  // Calculate horizontal positions based on dates
  positionedNodes.forEach(node => {
    if (!node.x) {
      const ratio = dateRange > 0 
        ? (node.timestamp - minTimestamp) / dateRange 
        : 0.5;
      node.x = PADDING + (ratio * (CANVAS_WIDTH - 2 * PADDING));
    }
  });

  // Calculate vertical positions
  const branchCounts = new Map<string, number>();
  const mainPathBranches = new Map<string, PositionedNode[]>();
  
  // First pass: identify nodes that share the same connection source
  positionedNodes.forEach(node => {
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
  
  // Second pass: assign positions
  positionedNodes.forEach(node => {
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
        }
      } else {
        // Single node from this source - keep on main path
        node.y = MAIN_PATH_Y;
      }
    } else {
      // Branch nodes (pathTaken: false)
      const branchIndex = branchCounts.get(connectionKey) || 0;
      branchCounts.set(connectionKey, branchIndex + 1);
      
      // Alternate above/below
      const offset = (branchIndex % 2 === 0 ? 1 : -1) * BRANCH_SPACING * Math.ceil((branchIndex + 1) / 2);
      node.y = MAIN_PATH_Y + offset;
    }
  });

  // Group nodes by year and add spacing for same-year nodes
  const yearGroups = new Map<string, PositionedNode[]>();
  positionedNodes.forEach(node => {
    const year = node.date || node.dateRange?.split('-')[0] || 'unknown';
    if (!yearGroups.has(year)) {
      yearGroups.set(year, []);
    }
    yearGroups.get(year)!.push(node);
  });

  // Add spacing for nodes in the same year
  yearGroups.forEach((yearNodes, year) => {
    if (yearNodes.length > 1) {
      // Sort by x position to maintain order
      yearNodes.sort((a, b) => a.x - b.x);
      
      // Calculate spacing based on node sizes
      const minSpacing = 80; // Minimum spacing between nodes of same year
      let currentX = yearNodes[0].x;
      
      yearNodes.forEach((node, index) => {
        if (index > 0) {
          // Ensure minimum spacing from previous node
          const prevNode = yearNodes[index - 1];
          const requiredX = prevNode.x + prevNode.radius + minSpacing + node.radius;
          if (currentX < requiredX) {
            currentX = requiredX;
          }
        }
        node.x = currentX;
        currentX = node.x + node.radius + minSpacing;
      });
    }
  });

  // Handle clustering - adjust nodes with same/similar dates (for proximity-based clustering)
  const clusters = new Map<number, PositionedNode[]>();
  positionedNodes.forEach(node => {
    const clusterKey = Math.floor(node.x / 50) * 50; // Cluster by 50px
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
        clusterNodes.forEach((node, index) => {
          const offset = (index - (clusterNodes.length - 1) / 2) * 30;
          node.x += offset;
        });
      }
    }
  });

  // Collision detection and resolution
  resolveCollisions(positionedNodes);

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

// Resolve collisions between nodes
const resolveCollisions = (nodes: PositionedNode[]): void => {
  const maxIterations = 50;
  let iterations = 0;
  let hasCollisions = true;

  while (hasCollisions && iterations < maxIterations) {
    hasCollisions = false;
    iterations++;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];

        if (areColliding(node1, node2)) {
          hasCollisions = true;
          
          const distance = getDistance(node1, node2);
          const minDistance = node1.radius + node2.radius + MIN_NODE_SPACING;
          
          if (distance < 0.1) {
            // Nodes are on top of each other, separate them
            node2.x += 50;
            node2.y += 50;
            continue;
          }

          // Calculate the overlap
          const overlap = minDistance - distance;
          
          // Calculate direction vector
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const angle = Math.atan2(dy, dx);
          
          // Calculate how much each node should move
          // Larger nodes move less, smaller nodes move more
          const totalRadius = node1.radius + node2.radius;
          const move1 = (overlap * node2.radius) / totalRadius;
          const move2 = (overlap * node1.radius) / totalRadius;
          
          // Preserve pathTaken nodes on main path when possible
          // If one is on main path and other isn't, move the branch node more
          if (node1.pathTaken && !node2.pathTaken) {
            // Move branch node (node2) more
            node2.x += Math.cos(angle) * (overlap * 0.7);
            node2.y += Math.sin(angle) * (overlap * 0.7);
            node1.x -= Math.cos(angle) * (overlap * 0.3);
            node1.y -= Math.sin(angle) * (overlap * 0.3);
          } else if (node2.pathTaken && !node1.pathTaken) {
            // Move branch node (node1) more
            node1.x -= Math.cos(angle) * (overlap * 0.7);
            node1.y -= Math.sin(angle) * (overlap * 0.7);
            node2.x += Math.cos(angle) * (overlap * 0.3);
            node2.y += Math.sin(angle) * (overlap * 0.3);
          } else {
            // Both same type, move both proportionally
            node1.x -= Math.cos(angle) * move1;
            node1.y -= Math.sin(angle) * move1;
            node2.x += Math.cos(angle) * move2;
            node2.y += Math.sin(angle) * move2;
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
  };
  
  const colorSet = colors[type] || colors.milestone;
  return pathTaken ? colorSet.main : colorSet.branch;
};

// Calculate connection path - magnetic connector style with orthogonal segments
const getConnectionPath = (source: PositionedNode, target: PositionedNode): string => {
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
  
  // Smooth bezier curve with better control points
  // Calculate distance and direction
  const horizontalDistance = Math.abs(endX - startX);
  const verticalDistance = Math.abs(endY - startY);
  const totalDistance = Math.sqrt(horizontalDistance * horizontalDistance + verticalDistance * verticalDistance);
  
  // Use a smoother curve factor - adjust based on distance for natural feel
  // For longer distances, use more curve; for shorter, use less
  const curveFactor = Math.min(0.4, Math.max(0.2, totalDistance / 500));
  
  // Control points positioned to create a smooth S-curve
  // First control point: extends in the direction of travel
  const cp1x = startX + (endX - startX) * curveFactor;
  const cp1y = startY + (endY - startY) * curveFactor * 0.5;
  
  // Second control point: extends back from the end
  const cp2x = endX - (endX - startX) * curveFactor;
  const cp2y = endY - (endY - startY) * curveFactor * 0.5;
  
  return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
};

// Calculate text width (approximate)
const calculateTextWidth = (text: string, fontSize: number): number => {
  // Approximate: average character width is about 0.6 * fontSize for most fonts
  // Add some extra for safety
  return text.length * fontSize * 0.65;
};

// Calculate node radius based on text width
const calculateNodeRadius = (node: Node): number => {
  if (node.image) {
    // If there's an image, use minimum radius
    return MIN_NODE_RADIUS;
  }
  
  // Calculate radius needed for text
  const textWidth = calculateTextWidth(node.label, TEXT_FONT_SIZE);
  // Radius needs to accommodate text width (diameter = 2 * radius)
  // Add padding on both sides
  const requiredRadius = (textWidth + TEXT_PADDING * 2) / 2;
  
  // Clamp between min and max
  return Math.max(MIN_NODE_RADIUS, Math.min(MAX_NODE_RADIUS, requiredRadius));
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
  const touchStartRef = useRef<{ x: number; y: number; viewBoxX: number; viewBoxY: number } | null>(null);
  const nodeDragStartRef = useRef<{ nodeId: string; startX: number; startY: number; originalX: number; originalY: number } | null>(null);
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
    
    // Center view on nodes
    if (positionedNodes.length > 0) {
      // Calculate bounds including node radii
      const minX = Math.min(...positionedNodes.map(n => n.x - n.radius)) - 200;
      const maxX = Math.max(...positionedNodes.map(n => n.x + n.radius)) + 200;
      const minY = Math.min(...positionedNodes.map(n => n.y - n.radius)) - 200;
      const maxY = Math.max(...positionedNodes.map(n => n.y + n.radius)) + 200;
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const contentWidth = Math.max(maxX - minX, CANVAS_WIDTH * 0.6);
      const contentHeight = Math.max(maxY - minY, CANVAS_HEIGHT * 0.6);
      
      // Calculate base "actual size" viewBox (unzoomed)
      const actualSizeVB = {
        x: centerX - contentWidth / 2,
        y: centerY - contentHeight / 2,
        width: contentWidth,
        height: contentHeight,
      };
      
      // Apply 3x zoom in (equivalent to clicking zoom in 3 times)
      // Each zoom in divides by 1.2, so 3 times = divide by 1.2^3
      const zoomFactor = Math.pow(1.2, 3); // ≈ 1.728
      const defaultWidth = actualSizeVB.width / zoomFactor;
      const defaultHeight = actualSizeVB.height / zoomFactor;
      
      // Keep the center point the same
      const defaultVB = {
        x: centerX - defaultWidth / 2,
        y: centerY - defaultHeight / 2,
        width: defaultWidth,
        height: defaultHeight,
      };
      
      // Ensure viewBox has valid dimensions
      if (defaultVB.width > 0 && defaultVB.height > 0) {
        setViewBox(defaultVB);
        setInitialViewBox(defaultVB); // Store 3x zoomed view as the default "actual size"
      } else {
        // Fallback to default viewBox if calculation fails
        console.warn('Invalid viewBox calculated, using default');
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
        setNodeDragOffsets(prev => {
          const newMap = new Map(prev);
          newMap.set(node.id, { x: clampedX, y: clampedY });
          return newMap;
        });
      }
    };

    const handleMouseUp = () => {
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

  // Close modal
  const handleCloseModal = useCallback(() => {
    setSelectedNode(null);
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
  const gridSpacing = BASE_GRID_SPACING * (CANVAS_WIDTH / viewBox.width);
  const gridStartX = Math.floor(viewBox.x / gridSpacing) * gridSpacing;
  const gridStartY = Math.floor(viewBox.y / gridSpacing) * gridSpacing;
  const gridEndX = viewBox.x + viewBox.width;
  const gridEndY = viewBox.y + viewBox.height;

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
          <g className="grid-layer">
            {gridDots.map((dot, i) => (
              <circle
                key={`grid-${i}`}
                cx={dot.x}
                cy={dot.y}
                r={2}
                fill="var(--color-border)"
                opacity="0.3"
              />
            ))}
          </g>

          {/* Connection lines - rendered before nodes so they appear behind */}
          <g className="connections-layer">
            {nodes.map(node => {
              if (!node.connections) return null;
              
              return node.connections.map(connectionId => {
                const sourceNode = nodes.find(n => n.id === connectionId);
                if (!sourceNode) return null;
                
                // Get display positions (with drag offsets)
                const sourceOffset = nodeDragOffsets.get(sourceNode.id) || { x: 0, y: 0 };
                const targetOffset = nodeDragOffsets.get(node.id) || { x: 0, y: 0 };
                const sourceDisplay = { ...sourceNode, x: sourceNode.x + sourceOffset.x, y: sourceNode.y + sourceOffset.y };
                const targetDisplay = { ...node, x: node.x + targetOffset.x, y: node.y + targetOffset.y };
                
                const pathTaken = node.pathTaken !== false;
                const path = getConnectionPath(sourceDisplay, targetDisplay);
                
                // Fade connection if neither node is selected, or if selectedNode exists and this connection doesn't involve it
                const isConnectionToSelected = selectedNode && 
                  (sourceNode.id === selectedNode.id || node.id === selectedNode.id);
                const connectionOpacity = selectedNode 
                  ? (isConnectionToSelected ? (pathTaken ? 0.6 : 0.3) : 0.15)
                  : (pathTaken ? 0.6 : 0.3);
                
                return (
                  <g key={`${sourceNode.id}-${node.id}`}>
                    <motion.path
                      d={path}
                      fill="none"
                      stroke={pathTaken ? 'var(--color-text)' : 'var(--color-border)'}
                      strokeWidth={pathTaken ? 2 : 1.5}
                      strokeDasharray={pathTaken ? '0' : '5,5'}
                      opacity={connectionOpacity}
                      initial={{ opacity: connectionOpacity }}
                      animate={{ opacity: connectionOpacity }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </g>
                );
              });
            })}
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
                  {node.image && (
                      <motion.image
                        href={node.image}
                        x={displayX - node.radius + 5}
                        y={displayY - node.radius + 5}
                        width={(node.radius - 5) * 2}
                        height={(node.radius - 5) * 2}
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
                  )}
                  
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
                    // Split label into words and group by 5
                    const words = node.label.split(/\s+/);
                    const lines: string[] = [];
                    for (let i = 0; i < words.length; i += 5) {
                      lines.push(words.slice(i, i + 5).join(' '));
                    }
                    
                    // Calculate line height for vertical centering
                    const lineHeight = TEXT_FONT_SIZE * 1.2;
                    const totalHeight = lines.length * lineHeight;
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
                        {lines.map((line, index) => (
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

          {/* Node card positioned to the right of the centered node */}
          {selectedNode && (() => {
            // Get the node's display position (with drag offset)
            const nodeOffset = nodeDragOffsets.get(selectedNode.id) || { x: 0, y: 0 };
            const nodeDisplayX = selectedNode.x + nodeOffset.x;
            const nodeDisplayY = selectedNode.y + nodeOffset.y;
            
            // Position card to the right of the node
            const cardX = nodeDisplayX + selectedNode.radius + 20;
            const cardY = nodeDisplayY - 200; // Offset upward by half card height
            
            return (
              <motion.foreignObject
                x={cardX}
                y={cardY}
                width="400"
                height="600"
                className="node-card-foreign"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'tween', duration: 0.3, ease: 'easeOut', delay: 0.1 }}
                style={{ overflow: 'visible' }}
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
            </motion.foreignObject>
            );
          })()}
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


        .node-card-foreign {
          overflow: visible;
          pointer-events: auto;
        }

        .node-card {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          min-width: 280px;
          max-width: 380px;
          width: 100%;
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
          color: var(--color-text);
          z-index: 10;
          box-shadow: none;
          padding: 0;
          margin: 0;
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
          display: inline-block;
          padding: 0.6rem 1.2rem;
          background: var(--color-text);
          color: var(--color-bg);
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        [data-theme="dark"] .node-card-link {
          background: var(--color-link);
          color: var(--color-bg);
        }

        .node-card-link:hover {
          background: var(--color-link-hover);
          color: var(--color-bg);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        [data-theme="dark"] .node-card-link:hover {
          background: var(--color-link);
          color: var(--color-bg);
        }

        .node-card-link:focus {
          outline: 2px solid var(--color-link);
          outline-offset: 2px;
          background: var(--color-link-hover);
          color: var(--color-bg);
        }

        [data-theme="dark"] .node-card-link:focus {
          outline: 2px solid var(--color-link);
          outline-offset: 2px;
          background: var(--color-link);
          color: var(--color-bg);
        }

        .node-card-link:active {
          background: var(--color-link-hover);
          color: var(--color-bg);
          transform: translateY(0);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        [data-theme="dark"] .node-card-link:active {
          background: var(--color-link);
          color: var(--color-bg);
          transform: translateY(0);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .node-card-link:visited {
          background: var(--color-text);
          color: var(--color-bg);
        }

        [data-theme="dark"] .node-card-link:visited {
          background: var(--color-link);
          color: var(--color-bg);
        }

        @media (max-width: 768px) {
          .career-odyssey-wrapper {
            height: 70vh;
            min-height: 400px;
          }

          .node-card {
            min-width: 240px;
            max-width: 320px;
            max-height: 500px;
          }

          .node-card-content {
            padding: 1.25rem;
          }

          .node-card-title {
            font-size: 1.25rem;
          }

          .node-card-image {
            min-height: 120px;
            max-height: 200px;
          }
          
          .node-card-image img {
            min-height: 120px;
            max-height: 200px;
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

        @media (max-width: 768px) {
          .zoom-controls {
            top: 50%;
            right: 1rem;
            transform: translateY(-50%);
            padding: 0.4rem;
          }

          .zoom-control-btn {
            width: 2.25rem;
            height: 2.25rem;
            font-size: 1.1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CareerOdyssey;
