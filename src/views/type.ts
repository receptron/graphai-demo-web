export type GUINodeData = {
  type: string;
  nodeId: string;
  position: { x: number; y: number; width?: number; height?: number; outputCenters?: number[]; inputCenters?: number[] };
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
  target: "output" | "input";
  index: number;
  nodeId: string;
  x: number;
  y: number;
};

type NewEdgeMouseData = {
  data: { position: { x: number; y: number; width?: number; outputCenters?: number[]; inputCenters?: number[] } };
  index?: number; // index and width never exists
};
type NewEdgeNodeData = {
  nodeId: string;
  index: number;
  data: GUINodeData;
};

export type EdgeData2 = NewEdgeMouseData | NewEdgeNodeData;

export type NewEdgeData1 = {
  target: "output";
  from: NewEdgeNodeData;
  to: NewEdgeMouseData;
};

export type NewEdgeData2 = {
  target: "input";
  from: NewEdgeMouseData;
  to: NewEdgeNodeData;
};

export type NewEdgeData = NewEdgeData1 | NewEdgeData2;
