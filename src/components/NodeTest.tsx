import React, { useState, useEffect, useRef } from 'react';

// Konva components - will be loaded dynamically on client
let Stage: any, Layer: any, Group: any, Rect: any, KonvaText: any, KonvaImage: any;

// Mock node data for testing
const testNode = {
  id: 'test-node',
  label: 'Command and Conquer',
  type: 'event',
  date: '1995',
  dateRange: '1995',
  pathTaken: true,
  image: '/images/odyssey/img-command-and-conquer.jpg',
  connections: ['output-1', 'output-2'], // Outputs
  x: 0,
  y: 0,
  width: 300,
  height: 400,
  radius: 150,
  timestamp: new Date('1995').getTime(),
};

// Mock input nodes (nodes that connect TO this node)
const mockInputNodes = [
  { id: 'input-1', label: 'Maximum Carnage', connections: ['test-node'] },
  { id: 'input-2', label: 'Thought Visual Basic was a Design Tool', connections: ['test-node'] },
  { id: 'input-3', label: 'Quake and Doom', connections: ['test-node'] },
];

// Mock output nodes (nodes that this node connects TO)
const mockOutputNodes = [
  { id: 'output-1', label: 'Thought Visual Basic was a Design Tool' },
  { id: 'output-2', label: 'Started Xhatch' },
];

// Calculate node ports (simplified version)
const calculateNodePorts = (node: any, allNodes: any[]) => {
  const inputs: Array<{ connectionId: string; label: string; x: number; y: number }> = [];
  const outputs: Array<{ connectionId: string; label: string; x: number; y: number }> = [];
  
  // Find input ports (nodes that connect TO this node)
  allNodes.forEach(sourceNode => {
    if (sourceNode.connections && sourceNode.connections.includes(node.id)) {
      inputs.push({
        connectionId: sourceNode.id,
        label: sourceNode.label || sourceNode.id,
        x: -node.width / 2 + 12, // Left side
        y: 0, // Will be calculated below
      });
    }
  });
  
  // Find output ports (nodes that this node connects TO)
  if (node.connections) {
    node.connections.forEach((targetId: string) => {
      const targetNode = allNodes.find(n => n.id === targetId);
      outputs.push({
        connectionId: targetId,
        label: targetNode?.label || targetId,
        x: node.width / 2 - 12, // Right side
        y: 0, // Will be calculated below
      });
    });
  }
  
  // Calculate port positions
  const portSpacing = 20;
  const imageCoverHeight = node.image ? Math.max(node.width * 0.3, 80) : 0;
  const imageGap = node.image ? 8 : 0;
  const topPadding = 8;
  const fontSize = 14;
  const lineHeight = fontSize * 1.2;
  const titleHeight = lineHeight * 2; // Max 2 lines
  const titleGap = 8;
  const typeLabelHeight = 14;
  const typeLabelGap = 4;
  
  const titleAreaHeight = imageCoverHeight + imageGap + topPadding + titleHeight + typeLabelGap + typeLabelHeight;
  const portsStartY = -node.height / 2 + titleAreaHeight + 8;
  
  // Position inputs (left side)
  inputs.forEach((port, index) => {
    port.y = portsStartY + (index * portSpacing);
  });
  
  // Position outputs (right side)
  outputs.forEach((port, index) => {
    port.y = portsStartY + (index * portSpacing);
  });
  
  return { inputs, outputs };
};

// Node Image component
const NodeImage: React.FC<{
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  cornerRadius?: number;
}> = ({ src, x, y, width, height, cornerRadius = 12 }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const groupRef = useRef<any>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
    };
    img.onerror = () => {
      console.error('Failed to load image:', src);
    };
    img.src = src;
  }, [src]);
  
  if (!image || !Group || !KonvaImage) return null;
  
  const coverHeight = Math.max(width * 0.3, 80);
  const coverX = -width / 2;
  const coverY = -height / 2;
  
  const scaleX = width / image.width;
  const scaleY = coverHeight / image.height;
  const imageScale = Math.max(scaleX, scaleY);
  
  const scaledWidth = image.width * imageScale;
  const scaledHeight = image.height * imageScale;
  const imageX = coverX + (width - scaledWidth) / 2;
  const imageY = coverY + (coverHeight - scaledHeight) / 2;
  
  return (
    <Group ref={groupRef} x={x} y={y} clipFunc={(ctx: any) => {
      ctx.beginPath();
      ctx.moveTo(coverX, coverY + cornerRadius);
      ctx.arcTo(coverX, coverY, coverX + cornerRadius, coverY, cornerRadius);
      ctx.lineTo(coverX + width - cornerRadius, coverY);
      ctx.arcTo(coverX + width, coverY, coverX + width, coverY + cornerRadius, cornerRadius);
      ctx.lineTo(coverX + width, coverY + coverHeight);
      ctx.lineTo(coverX, coverY + coverHeight);
      ctx.closePath();
      ctx.clip();
    }}>
      <KonvaImage
        image={image}
        x={imageX}
        y={imageY}
        width={scaledWidth}
        height={scaledHeight}
        listening={false}
      />
    </Group>
  );
};

const NodeTestComponent: React.FC = () => {
  const [hovered, setHovered] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [konvaLoaded, setKonvaLoaded] = useState(false);
  const [debugMode, setDebugMode] = useState(true); // Default to ON for test page
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  
  useEffect(() => {
    setIsClient(true);
    
    // Dynamically import Konva only on client
    if (typeof window !== 'undefined') {
      import('react-konva').then((konva) => {
        Stage = konva.Stage;
        Layer = konva.Layer;
        Group = konva.Group;
        Rect = konva.Rect;
        KonvaText = konva.Text;
        KonvaImage = konva.Image;
        setKonvaLoaded(true);
      }).catch((err) => {
        console.error('Failed to load Konva:', err);
      });
    }
  }, []);
  
  useEffect(() => {
    if (!isClient) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isClient]);
  
  if (!isClient || !konvaLoaded || !Stage) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f0',
      }}>
        <div>Loading Konva...</div>
      </div>
    );
  }
  
  const allNodes = [testNode, ...mockInputNodes, ...mockOutputNodes];
  const { inputs, outputs } = calculateNodePorts(testNode, allNodes);
  
  const nodeColor = '#f97316'; // Orange
  const borderColor = '#ea580c';
  const textColor = '#1f2937';
  const cornerRadius = 12;
  
  // Calculate layout dimensions
  const imageCoverHeight = testNode.image ? Math.max(testNode.width * 0.3, 80) : 0;
  const imageGap = testNode.image ? 8 : 0;
  const topPadding = 8;
  const textPadding = 16;
  const availableWidth = testNode.width - (textPadding * 2);
  const fontSize = 14;
  const lineHeight = fontSize * 1.2;
  const titleHeight = lineHeight * 2;
  const titleGap = 8;
  const typeLabelHeight = 14;
  const typeLabelGap = 4;
  
  const imageTopY = -testNode.height / 2;
  const imageBottomY = imageTopY + imageCoverHeight;
  const titleTopY = imageBottomY + imageGap + topPadding;
  const titleCenterY = titleTopY + titleHeight / 2;
  const portsStartY = titleTopY + titleHeight + titleGap;
  
  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f0',
        position: 'relative',
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
      <Stage width={stageSize.width} height={stageSize.height}>
        <Layer>
          <Group x={stageSize.width / 2} y={stageSize.height / 2}>
            {/* Node Container */}
            <Rect
              x={-testNode.width / 2}
              y={-testNode.height / 2}
              width={testNode.width}
              height={testNode.height}
              cornerRadius={cornerRadius}
              fill="red"
              opacity={0.3}
              stroke={borderColor}
              strokeWidth={3}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={(e) => {
                // Don't clear hover on right-click to allow inspection
                if (e.evt.button === 2) return;
                setHovered(false);
              }}
              onContextMenu={(e) => {
                // Keep hovered state for inspection
                e.cancelBubble = true;
                e.evt.stopPropagation();
                // Store node in window for easy access
                (window as any).__inspectedNode = testNode;
                console.group('🔍 Node Inspection');
                console.log('Node Data:', testNode);
                console.log('Full Node Object:', testNode);
                console.log('💡 Tip: Access this node via window.__inspectedNode');
                console.groupEnd();
              }}
            />
            
            {/* Hover glow */}
            <Rect
              x={-testNode.width / 2 - 8}
              y={-testNode.height / 2 - 8}
              width={testNode.width + 16}
              height={testNode.height + 16}
              cornerRadius={cornerRadius + 4}
              fill=""
              stroke={nodeColor}
              strokeWidth={2}
              opacity={hovered ? 0.4 : 0}
            />
            
            {/* Cover Image */}
            {testNode.image && (
              <NodeImage
                src={testNode.image}
                x={0}
                y={0}
                width={testNode.width}
                height={testNode.height}
                cornerRadius={cornerRadius}
              />
            )}
            
            {/* Title Container */}
            <Group x={0} y={titleCenterY} listening={false}>
              <KonvaText
                x={0}
                y={0}
                text={testNode.label}
                align="center"
                verticalAlign="middle"
                fill={textColor}
                fontSize={fontSize}
                fontFamily="'EB Garamond', serif"
                fontStyle="normal"
                fontWeight={500}
                opacity={0.95}
                listening={false}
                lineHeight={lineHeight / fontSize}
                width={availableWidth}
                height={titleHeight}
              />
            </Group>
            
            {/* Type Label */}
            <KonvaText
              x={testNode.width / 2 - textPadding}
              y={titleTopY + titleHeight + typeLabelGap}
              text={testNode.type}
              align="right"
              verticalAlign="top"
              fill={textColor}
              fontSize={11}
              opacity={0.5}
              listening={false}
            />
            
            {/* Input Ports */}
            {inputs.map((port, index) => {
              const portSize = 4;
              const labelGap = 6;
              const portX = -testNode.width / 2 + 12;
              const portY = portsStartY + (index * 20);
              const labelStartX = portX + portSize / 2 + labelGap;
              const maxLabelWidth = Math.abs(labelStartX) - 8;
              const maxChars = Math.floor(maxLabelWidth / (9 * 0.65));
              const truncatedLabel = port.label.length > maxChars 
                ? port.label.substring(0, Math.max(1, maxChars - 3)) + '...' 
                : port.label;
              
              return (
                <Group key={`input-${port.connectionId}`} listening={false}>
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
                  />
                  <KonvaText
                    x={labelStartX}
                    y={portY}
                    text={truncatedLabel}
                    fontSize={9}
                    fill={textColor}
                    opacity={0.6}
                    align="left"
                    verticalAlign="middle"
                    width={maxLabelWidth}
                    listening={false}
                  />
                </Group>
              );
            })}
            
            {/* Output Ports */}
            {outputs.map((port, index) => {
              const portSize = 4;
              const labelGap = 8;
              const portX = testNode.width / 2 - 12;
              const portY = portsStartY + (index * 20);
              const labelEndX = portX - portSize / 2 - labelGap;
              const maxLabelWidth = labelEndX - (-testNode.width / 2 + 8);
              const maxChars = Math.floor(maxLabelWidth / (9 * 0.65));
              const truncatedLabel = port.label.length > maxChars 
                ? port.label.substring(0, Math.max(1, maxChars - 3)) + '...' 
                : port.label;
              
              return (
                <Group key={`output-${port.connectionId}`} listening={false}>
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
                  />
                  <KonvaText
                    x={labelEndX}
                    y={portY}
                    text={truncatedLabel}
                    fontSize={9}
                    fill={textColor}
                    opacity={0.6}
                    align="right"
                    verticalAlign="middle"
                    width={maxLabelWidth}
                    listening={false}
                  />
                </Group>
              );
            })}
          </Group>
        </Layer>
      </Stage>
      
      {/* Debug Overlay - DOM elements above canvas for easy inspection */}
      {debugMode && hovered && (
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
          data-node-id={testNode.id}
          data-node-type={testNode.type}
          className="node-debug-overlay"
        >
          <div style={{ marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>🔍 Node Debug</div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>
              Right-click node to inspect in console
            </div>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>ID:</strong> <code>{testNode.id}</code>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Label:</strong> {testNode.label}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Type:</strong> {testNode.type}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Date:</strong> {testNode.date || testNode.dateRange || 'N/A'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Path Taken:</strong> {testNode.pathTaken !== false ? 'Yes' : 'No'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Position:</strong> x: {testNode.x?.toFixed(1)}, y: {testNode.y?.toFixed(1)}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Dimensions:</strong> {testNode.width} × {testNode.height}
          </div>
          {testNode.image && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Image:</strong> <code style={{ fontSize: '10px' }}>{testNode.image}</code>
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
      )}
      
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

      {/* Debug Info Panel */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        fontFamily: 'monospace',
        fontSize: '12px',
        maxWidth: '300px',
        zIndex: 10000,
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Debug Info</h3>
        <div><strong>Node:</strong> {testNode.label}</div>
        <div><strong>Type:</strong> {testNode.type}</div>
        <div><strong>Dimensions:</strong> {testNode.width} × {testNode.height}</div>
        <div><strong>Inputs:</strong> {inputs.length}</div>
        <div><strong>Outputs:</strong> {outputs.length}</div>
        <div><strong>Hovered:</strong> {hovered ? 'Yes' : 'No'}</div>
        <div style={{ marginTop: '12px', fontSize: '10px', color: '#666' }}>
          <div>Image Height: {imageCoverHeight}px</div>
          <div>Title Top: {titleTopY.toFixed(1)}px</div>
          <div>Ports Start: {portsStartY.toFixed(1)}px</div>
        </div>
      </div>
    </div>
  );
};

export default NodeTestComponent;
