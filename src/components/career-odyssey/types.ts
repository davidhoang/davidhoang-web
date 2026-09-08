export interface WorkedWithPerson {
  name: string;
  image: string;
  url?: string;
}

export interface CareerNode {
  id: string;
  label: string;
  description?: string;
  type: string;
  date?: string;
  dateRange?: string;
  active?: boolean;
  pathTaken?: boolean;
  connections?: string[];
  image?: string;
  imageAlt?: string;
  presentation?: 'photo' | 'note' | 'quote' | 'moment';
  kicker?: string;
  tags?: string[];
  featured?: boolean;
  sourceLabel?: string;
  link?: string;
  iframe?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
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
  connections?: Connection[];
  startingNodeId?: string;
}

export interface Connection {
  sourceId: string;
  targetId: string;
  pathTaken: boolean;
  label?: string;
}

/** Board coordinates and dimensions are in canvas pixels; x/y are centers. */
export const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  photo: { width: 480, height: 354 },
  note: { width: 270, height: 170 },
  quote: { width: 280, height: 190 },
  moment: { width: 270, height: 170 },
};
