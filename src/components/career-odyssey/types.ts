export interface WorkedWithPerson {
  name: string;
  image: string;
  url?: string;
}

export interface CareerNode {
  id: string;
  label: string;
  description?: string;
  type: 'career' | 'event' | 'spark' | 'inspiration' | 'possiblePath';
  date?: string;
  dateRange?: string;
  active?: boolean;
  pathTaken?: boolean;
  connections?: string[];
  image?: string;
  link?: string;
  iframe?: string;
  x?: number;
  y?: number;
  sequence?: number;
  workedWith?: WorkedWithPerson[];
}

export interface PositionedNode extends CareerNode {
  x: number;
  y: number;
  width: number;
  height: number;
  timestamp: number;
}

export interface CareerOdysseyData {
  nodes: CareerNode[];
}

export interface Connection {
  sourceId: string;
  targetId: string;
  pathTaken: boolean;
}

/** Node type → visual style mapping */
export const NODE_STYLES: Record<string, { fill: string; border: string; text: string }> = {
  career:       { fill: '#1a1a2e', border: '#4a9eff', text: '#ffffff' },
  event:        { fill: '#1a2e1a', border: '#4aff9e', text: '#ffffff' },
  spark:        { fill: '#2e1a2e', border: '#ff4aff', text: '#ffffff' },
  inspiration:  { fill: '#2e2e1a', border: '#ffcf4a', text: '#ffffff' },
  possiblePath: { fill: '#1a1a1a', border: '#888888', text: '#aaaaaa' },
};

/** Node type → dimensions */
export const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  career:       { width: 220, height: 80 },
  event:        { width: 180, height: 64 },
  spark:        { width: 160, height: 56 },
  inspiration:  { width: 170, height: 60 },
  possiblePath: { width: 160, height: 56 },
};
