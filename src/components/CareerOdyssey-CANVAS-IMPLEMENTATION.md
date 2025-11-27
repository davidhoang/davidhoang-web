# CareerOdyssey Canvas Implementation Documentation

## Tech Stack

### Core Framework & Language
- **React** (v18+) - Component framework with functional components and hooks
- **TypeScript** - Type-safe JavaScript for better developer experience and code reliability

### React Hooks Used
- `useState` - Component state management (viewBox, nodes, selection, interactions)
- `useEffect` - Side effects (initialization, window resize, keyboard events)
- `useRef` - DOM references (SVG element, container, touch/ drag state)
- `useCallback` - Memoized event handlers (pan, zoom, node interactions)
- `useMemo` - Memoized computed values (grid dots, visible nodes, connection paths)

### Graphics & Rendering
- **SVG (Scalable Vector Graphics)** - Declarative XML-based vector graphics (NOT HTML5 Canvas API)
- **React/TypeScript** - Generates SVG elements declaratively via JSX (not imperative JavaScript drawing)
- **SVG ViewBox** - Coordinate system transformation for pan/zoom functionality
- **SVG Paths** - Bezier curves for smooth connection routing
- **SVG Filters** - Gaussian blur for glow effects
- **SVG Gradients** - Linear gradients for active path styling
- **SVG Markers** - Arrowheads for connection directionality
- **SVG Clip Paths** - Circular clipping for node images
- **DOM Elements** - All graphics are actual DOM nodes (`<svg>`, `<circle>`, `<path>`, etc.) that can be styled with CSS and manipulated with React

### Animation & Motion
- **Framer Motion** - React animation library for node card transitions
- **CSS Transitions** - Hardware-accelerated animations (opacity, transform, filter)
- **RequestAnimationFrame** - Smooth 60fps pan/zoom updates
- **Easing Functions** - Cubic ease-out for natural motion

### Event Handling
- **Mouse Events** - Click, drag, wheel for desktop interactions
- **Touch Events** - Touch start/move/end for mobile/tablet support
- **Wheel Events** - Zoom and trackpad pan detection
- **Keyboard Events** - Escape key for closing modals

### Performance Optimizations
- **Viewport Culling** - Only render visible nodes and connections
- **Memoization** - React.useMemo for expensive calculations
- **CSS will-change** - Browser optimization hints
- **Passive Event Listeners** - Improved scroll performance

### Styling
- **CSS-in-JS** - Inline styles via `<style>` tag in component
- **CSS Variables** - Theme-aware colors (`--color-text`, `--color-bg`, etc.)
- **Media Queries** - Responsive design for mobile, tablet, desktop
- **CSS Grid/Flexbox** - Layout for controls and cards

### Browser APIs
- **Performance API** - `performance.now()` for animation timing
- **Intersection Observer** (potential) - For future visibility optimizations
- **Canvas API** (potential) - For future large-scale rendering optimizations

## Overview

The `CareerOdyssey` component is an interactive SVG-based visualization that renders a career timeline as a network graph. It uses **SVG (Scalable Vector Graphics)**, not the HTML5 Canvas API.

### Important Distinction: SVG vs Canvas API

**What's Actually Used:**
- **SVG (Scalable Vector Graphics)** - Declarative XML-based vector graphics
- Rendered as DOM elements (`<svg>`, `<circle>`, `<path>`, etc.)
- Manipulated via React/TypeScript (not pure JavaScript drawing commands)
- Elements are accessible, selectable, and styleable via CSS

**What's NOT Used:**
- ❌ **HTML5 Canvas API** - Imperative pixel-based drawing
- ❌ **Pure JavaScript drawing** - No `ctx.fillRect()`, `ctx.stroke()`, etc.
- ❌ **Canvas 2D Context** - No `getContext('2d')` calls

**Why SVG?**
- Vector graphics scale perfectly at any zoom level
- DOM-based elements enable easy event handling and React integration
- CSS styling and animations work seamlessly
- Accessibility: elements can be selected, inspected, and styled
- Better for interactive elements (hover, click, drag)

The component visualizes nodes (milestones, companies, events) connected by paths, with support for panning, zooming, node interaction, and dynamic layout calculations. All rendering is done through React components that generate SVG elements declaratively.

## Architecture

### Canvas Dimensions
- **Canvas Width**: 3600px
- **Canvas Height**: 2000px
- **Padding**: 200px
- **Main Path Y**: 800px (vertical center for main timeline)
- **Branch Spacing**: 320px (vertical spacing for divergent paths)

## Data Structures

### Node Types
```typescript
type NodeType = 'milestone' | 'company' | 'event' | 'transition' | 'spark';
```

### Node Interface
```typescript
interface Node {
  id: string;
  label: string;
  description?: string;
  type: NodeType;
  date?: string;              // YYYY-MM-DD format
  dateRange?: string;          // e.g., "2020-2024" or "2020-Present"
  active?: boolean;            // Marks "Present" nodes
  pathTaken?: boolean;         // Whether this path was taken (default: true)
  connections?: string[];      // IDs of connected nodes
  image?: string;              // Image URL
  link?: string;               // External link
  iframe?: string;             // Embedded content URL
  x?: number;                  // Manual X position override
  y?: number;                  // Manual Y position override
  sequence?: number;           // Order for same-date nodes
  workedWith?: WorkedWithPerson[];
}
```

### PositionedNode
Extends `Node` with calculated layout properties:
```typescript
interface PositionedNode extends Node {
  x: number;          // Calculated X position
  y: number;          // Calculated Y position
  timestamp: number;  // Parsed date as timestamp
  radius: number;     // Calculated node radius (40-120px)
}
```

## Layout Algorithm

### 1. Date Parsing and Sorting

The `calculateLayout` function processes nodes through multiple passes:

**Date Parsing** (`parseDate`):
- Parses date strings (YYYY, YYYY-MM, YYYY-MM-DD)
- Converts to timestamps for chronological sorting
- Defaults to mid-year (June 15) for year-only dates

**Sorting Strategy**:
1. Primary: Chronological order by timestamp
2. Secondary: Within same year (±365 days), prioritize `pathTaken: true` nodes
3. Tertiary: Use `sequence` property for fine-grained ordering

### 2. Auto-Connection

Nodes without explicit `connections` automatically connect to the previous chronological node with `pathTaken: true`:

```typescript
// Auto-connect true nodes to previous chronological true node
positionedNodes.forEach((node, index) => {
  if (node.pathTaken && (!node.connections || node.connections.length === 0)) {
    // Find previous true node in chronological order
    for (let i = index - 1; i >= 0; i--) {
      if (positionedNodes[i].pathTaken) {
        node.connections = [positionedNodes[i].id];
        break;
      }
    }
  }
});
```

### 3. Horizontal Positioning

**Non-Present Nodes**:
- Distributed across canvas width based on date ratio
- Formula: `x = leftEdge + (dateRatio * availableWidth)`
- 15% of right edge reserved for Present nodes

**Present Nodes**:
- Always positioned at far right: `CANVAS_WIDTH - PADDING`
- Override any manual X positioning

### 4. Vertical Positioning

**Main Path Nodes** (`pathTaken: true`):
- Default to `MAIN_PATH_Y` (800px)
- If multiple nodes share same connection source, create divergent paths:
  - Alternate above/below main path
  - Use `BRANCH_SPACING` (320px) for vertical offset
  - Special handling for "Made first Angel Investment" (1.8x spacing)

**Branch Nodes** (`pathTaken: false`):
- Alternate above/below main path
- Vertical offset: `BRANCH_SPACING * ceil((branchIndex + 1) / 2)`
- Clamped to canvas bounds

**Spark Nodes**:
- Positioned 20-60px from connected main node
- Distributed in circular pattern around connected node
- Angle: `(sparkIndex * angleStep) + (π/2)` (start at top)

### 5. Year-Based Spacing

Nodes with same year are spaced horizontally:
- Minimum spacing: 250px between node edges
- Sorted by: `pathTaken` status → timestamp → X position → sequence
- `pathTaken: true` nodes appear left of `pathTaken: false` nodes

### 6. Collision Detection and Resolution

**Collision Detection** (`resolveCollisions`):
- Checks all node pairs for overlap
- Minimum distance: `node1.radius + node2.radius + MIN_NODE_SPACING` (80px)
- Uses force-based resolution: pushes nodes apart along collision vector

**Final Spacing Pass**:
- Ensures minimum spacing between all nodes
- Preserves Present nodes' X position (only adjusts Y if needed)

### 7. Node Radius Calculation

Radius based on content:
```typescript
const calculateNodeRadius = (node: Node): number => {
  const baseRadius = DEFAULT_NODE_RADIUS; // 80px
  
  // Factor in text width
  const textWidth = calculateWrappedTextWidth(node.label, TEXT_FONT_SIZE);
  const textRadius = (textWidth / 2) + TEXT_PADDING;
  
  // Factor in image size (if present)
  const imageRadius = node.image ? baseRadius : 0;
  
  // Return clamped value between MIN and MAX
  return Math.max(MIN_NODE_RADIUS, Math.min(MAX_NODE_RADIUS, 
    Math.max(baseRadius, textRadius, imageRadius)));
};
```

## Connection Path Routing

### Path Calculation (`getConnectionPath`)

The connection path algorithm routes connections around nodes and other connections:

1. **Direct Path Calculation**:
   - Start point: Source node edge
   - End point: Target node edge
   - Angle: `atan2(dy, dx)`

2. **Intersection Detection**:
   - Samples 100+ points along direct path
   - Checks if any point is within node radius + padding
   - Collects intersecting nodes sorted by position along path

3. **Waypoint Generation**:
   - For each intersecting node, calculates perpendicular waypoint
   - Clearance: `node.radius + MIN_NODE_SPACING + 120px`
   - Chooses side based on cross product (left/right of source-target line)
   - Verifies waypoints don't intersect other nodes

4. **Bezier Curve Construction**:
   - If no intersections: Simple smooth bezier (20-40% curve factor)
   - If intersections: S-curve using waypoints to influence control points
   - Control points positioned 15-45% along path
   - Ensures minimum curve radius to prevent sharp angles

5. **Line Hop Detection**:
   - Checks for intersections with other connection paths
   - Uses `doCurvesCross` to detect actual crossings (not just proximity)
   - Adds visual "hop" at intersection point using `addLineHop`
   - Hop direction based on which side of other line midpoint is on

### Path Styling

- **Path Taken**: Solid line, 2px width, 60% opacity
- **Path Not Taken**: Dashed line (8px dash, 4px gap), 1.5px width, 40% opacity
- **Active Path** (leads to Present): 
  - Gradient stroke (blue → orange → blue)
  - Animated dash pattern
  - Glow effect with Gaussian blur
  - 4px width

## Rendering Pipeline

### SVG Structure

```xml
<svg viewBox="{x} {y} {width} {height}">
  <defs>
    <!-- Filters, gradients, markers, clip paths -->
  </defs>
  
  <!-- Grid layer (background dots) -->
  <!-- Connections layer (paths) -->
  <!-- Nodes layer (circles, images, text) -->
</svg>
```

### Rendering Layers (Bottom to Top)

1. **Grid Background**:
   - Dot pattern with zoom-adaptive spacing
   - Spacing: `BASE_GRID_SPACING * zoomLevel` (22.86px base)
   - Dot radius scales with zoom
   - Only renders dots visible in viewport

2. **Connections**:
   - Rendered before nodes (appear behind)
   - Memoized path calculations
   - Two-pass rendering: initial paths, then connection-to-connection avoidance
   - Visibility culling: only render connections with visible endpoints

3. **Nodes**:
   - White background circle (if no image)
   - Node circle with color based on type and `pathTaken`
   - Image (if present) with circular clip path
   - Text label (if no image) with 3-line wrapping
   - Hover glow ring
   - Transform animations on hover/select

### Viewport Optimization

**Visibility Culling**:
- `isNodeVisible`: Checks if node (with padding) is in viewport
- `isConnectionVisible`: Checks if connection endpoints or midpoint are visible
- Only renders visible nodes and connections

**Memoization**:
- Grid dots: `useMemo` based on viewBox
- Visible nodes: `useMemo` based on nodes and viewBox
- Connection paths: `useMemo` with two-pass calculation

## Interactions

### Panning

**Mouse Pan**:
- Left mouse button drag
- Converts pixel movement to SVG coordinate movement
- Uses `requestAnimationFrame` for smooth updates
- Prevents text selection and default behaviors

**Touch Pan**:
- Single touch drag
- Same coordinate conversion as mouse
- Prevents default touch behaviors

**Trackpad Pan**:
- Detects trackpad vs mouse wheel
- Two-finger scroll pans instead of zooms
- Detection: Multiple small delta events in quick succession

### Zooming

**Mouse Wheel**:
- Zoom factor: 1.1x per scroll
- Zooms toward mouse cursor position
- Clamped: `CANVAS_WIDTH / 4` to `CANVAS_WIDTH * 2`
- Converts mouse position to SVG coordinates for zoom center

**Zoom Controls**:
- Zoom In/Out buttons (1.2x factor)
- Home button: Centers on "studied-art" node at default zoom (3x)
- Smooth animation using `animateViewBox`

### Node Interaction

**Node Dragging**:
- Nodes can be dragged within 60px radius of original position
- Constrained to circular boundary
- Animates back to original position on release
- Uses ease-out cubic animation (300ms)

**Node Click**:
- Opens detail card with node information
- Centers node in viewport with smooth animation
- Card positioned to right of node (desktop) or centered (mobile)
- Escape key closes card

**Node Hover**:
- Glow ring appears (8px radius increase)
- Scale transform: 1.2x
- Opacity fade for non-selected nodes
- Image nodes show overlay with title and date

## Performance Optimizations

### 1. Viewport Culling
- Only renders nodes and connections visible in current viewBox
- Reduces DOM elements significantly at high zoom levels

### 2. Memoization
- Grid dots: Recalculated only when viewBox changes
- Visible nodes: Filtered based on viewport
- Connection paths: Two-pass memoized calculation

### 3. CSS Transitions
- Opacity, transform, filter transitions handled by CSS
- Reduces JavaScript animation overhead
- Uses `willChange` hints for browser optimization

### 4. RequestAnimationFrame
- Pan updates batched through RAF
- Smooth 60fps animations
- Prevents excessive state updates

### 5. Event Handling
- Passive event listeners where possible
- Event propagation stopped for node interactions
- Prevents default behaviors (text selection, context menu)

### 6. SVG Optimization
- Clip paths only generated for visible nodes with images
- Gradients and filters defined once in `<defs>`
- Reusable markers for arrowheads

## Key Features

### 1. Present Node Handling
- Special positioning: Always on far right
- Active path detection: Connections leading to Present nodes get special styling
- Recursive path checking: Traverses forward connections to find Present nodes

### 2. Path Taken vs Not Taken
- Visual distinction: Solid vs dashed lines, different opacities
- Layout priority: Path taken nodes positioned first
- Auto-connection: Only connects path taken nodes automatically

### 3. Spark Nodes
- Special node type for small events
- Positioned near connected main nodes
- Circular distribution for multiple sparks

### 4. Responsive Design
- Mobile: < 640px (centered cards, bottom zoom controls)
- Tablet: 640-1023px (centered cards, side zoom controls)
- Desktop: ≥ 1024px (side-positioned cards, side zoom controls)

### 5. Timeline Display
- Shows visible year range based on viewport
- Updates dynamically as user pans/zooms
- "Now" link when Present nodes are visible

### 6. Node Cards
- Detail view with image, description, date
- Embedded iframe support (e.g., games)
- "Worked with" section with avatars
- External links
- Smooth animations with Framer Motion

## Constants and Configuration

```typescript
const MIN_NODE_RADIUS = 40;
const MAX_NODE_RADIUS = 120;
const DEFAULT_NODE_RADIUS = 80;
const GRID_DOTS_PER_NODE = 8;
const BASE_GRID_SPACING = 22.86; // (DEFAULT_NODE_RADIUS * 2) / 7
const MAIN_PATH_Y = 800;
const BRANCH_SPACING = 320;
const CANVAS_WIDTH = 3600;
const CANVAS_HEIGHT = 2000;
const PADDING = 200;
const TEXT_FONT_SIZE = 12;
const TEXT_PADDING = 16;
const TEXT_PADDING_NOT_TAKEN = 10;
const MIN_NODE_SPACING = 80;
```

## State Management

### ViewBox State
```typescript
const [viewBox, setViewBox] = useState<ViewBox>({
  x: 0,
  y: 0,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
});
```

### Node State
- `nodes`: PositionedNode[] - All nodes with calculated positions
- `selectedNode`: PositionedNode | null - Currently selected node
- `hoveredNode`: string | null - Currently hovered node ID
- `nodeDragOffsets`: Map<string, {x, y}> - Drag offsets for each node

### Interaction State
- `isDragging`: boolean - Canvas panning state
- `draggingNodeId`: string | null - Node being dragged
- `isMobile`: boolean - Responsive breakpoint detection

## Animation System

### ViewBox Animation
- Ease-out cubic: `1 - (1 - progress)³`
- Duration: 600ms default
- Used for home button and node centering

### Node Drag Animation
- Ease-out cubic
- Duration: 300ms
- Returns to original position (0,0 offset)

### CSS Transitions
- Opacity: 0.3s ease-out
- Transform: 0.2s ease-out
- Filter: 0.2s ease-out

## Browser Compatibility

- Modern browsers with SVG support
- Touch events for mobile/tablet
- CSS transforms and transitions
- RequestAnimationFrame for smooth animations
- Passive event listeners for performance

## Future Optimization Opportunities

1. **Virtual Scrolling**: Only render nodes/connections in viewport
2. **Web Workers**: Offload path calculations to worker thread
3. **Canvas Rendering**: Consider Canvas API for very large graphs
4. **CSS Background Pattern**: Replace SVG grid dots with CSS pattern
5. **Intersection Observer**: Use for more efficient visibility detection
