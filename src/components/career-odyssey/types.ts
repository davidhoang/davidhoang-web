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

/** All nodes are moments — single dimension */
export const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  moment: { width: 200, height: 72 },
};
