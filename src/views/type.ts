export type GUINodeData = { type: string; position: { x: number; y: number, width: number, height: number } };


export type NewEdgeEventData = {
  on: string;
  target: string;
  index: number;
  nodeId: string;
  x: number;
  y: number;
};
