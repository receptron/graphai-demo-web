export type GUINodeData = {
  type: string;
  nodeId: string;
  position: { x: number; y: number; width?: number; height?: number };
};

export type GUIEdgeData = {
  type: string;
  from: {
    nodeId: string;
    index: number;
  };
  to: {
    nodeId: string;
    index: number;
  };
};

export type EdgeData = {
  type: string;
  from: {
    nodeId: string;
    index: number;
    data: GUINodeData;
  };
  to: {
    nodeId: string;
    index: number;
    data: GUINodeData;
  };
};

export type NewEdgeEventData = {
  on: string;
  target: string;
  index: number;
  nodeId: string;
  x: number;
  y: number;
};
