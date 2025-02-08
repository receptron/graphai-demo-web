import type { DefaultParamsType } from "graphai";

export type Position = { x: number; y: number };
export type NodePosition = { x: number; y: number; width: number; height: number };
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

export type EdgeEndPointData = {
  nodeId: string;
  index: number;
};

export type GUIEdgeData = {
  type: string;
  from: EdgeEndPointData;
  to: EdgeEndPointData;
};

export type EdgeFormToData = {
  data: GUINodeData;
} & EdgeEndPointData;

export type EdgeData = {
  type: string;
  from: EdgeFormToData;
  to: EdgeFormToData;
};

export type NewEdgeEventTargetType = "outbound" | "inbound";

// x, y is clientX, clientY of mouse pointer
export type NewEdgeEventData = {
  on: string;
  direction: NewEdgeEventTargetType;
  index: number;
  nodeId: string;
  x: number;
  y: number;
};

export type GUINearestData = {
  nodeId: string;
  index: number;
  direction: NewEdgeEventTargetType;
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
  direction: "outbound";
  from: NewEdgeNodeData;
  to: NewEdgeMouseData;
};

export type NewEdgeData2 = {
  direction: "inbound";
  from: NewEdgeMouseData;
  to: NewEdgeNodeData;
};

export type NewEdgeData = NewEdgeData1 | NewEdgeData2;

export type ClosestNodeData = { node: GUINodeData; distance: number };
export type NearestData = {
  nodeId: string;
  index: number;
  direction: string;
};

// TODO good name
export type InputOutputParam = { name: string; type?: string };
export type InputOutput = { inputs: InputOutputParam[]; outputs: InputOutputParam[]; params?: InputOutputParam[]; agent?: string; inputSchema?: unknown };
