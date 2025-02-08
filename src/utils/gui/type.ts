import type { DefaultParamsType } from "graphai";

export type GUINodeData = {
  type: string;
  agent?: string;
  guiAgentId?: string;
  params?: DefaultParamsType;
  isResult?: boolean;
  nodeId: string;
  position: { x: number; y: number; width?: number; height?: number; outputCenters?: number[]; inputCenters?: number[] };
  value?: unknown; // ResultData<DefaultResultData>;
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

export type EdgeFormToData = {
  nodeId: string;
  index: number;
  data: GUINodeData;
};

export type EdgeData = {
  type: string;
  from: EdgeFormToData;
  to: EdgeFormToData;
};

type NewEdgeEventTargetType = "output" | "input";

// x, y is clientX, clientY of mouse pointer
export type NewEdgeEventData = {
  on: string;
  target: NewEdgeEventTargetType;
  index: number;
  nodeId: string;
  x: number;
  y: number;
};

export type GUINearestData = {
  nodeId: string;
  index: number;
  target: NewEdgeEventTargetType;
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

// TODO good name
export type InputOutputParam = { name: string; type?: string };
export type InputOutput = { inputs: InputOutputParam[]; outputs: InputOutputParam[]; params?: InputOutputParam[]; agent?: string; inputSchema?: unknown };
