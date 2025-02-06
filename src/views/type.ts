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
  target: "output" | "input";
  index: number;
  nodeId: string;
  x: number;
  y: number;
};

type NewEdgeMouseData = {
  data: { position: { x: number; y: number } };
};
type NewEdgeNodeData = {
  nodeId: string;
  index: number;
  data: GUINodeData;
};

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
