// set tailwind/safelist
import { GUINodeData } from "./type";

export const nodeMainClass = (expectNearNode: boolean, nodeData: GUINodeData) => {
  if (nodeData.type === "computed") {
    return expectNearNode ? "bg-blue-200" : "bg-blue-400";
  }
  return expectNearNode ? "bg-red-200" : "bg-red-400";
};

export const nodeHeaderClass = (expectNearNode: boolean, nodeData: GUINodeData) => {
  if (nodeData.type === "computed") {
    return expectNearNode ? "bg-blue-300" : "bg-blue-500";
  }
  return expectNearNode ? "bg-red-300" : "bg-red-500";
};

export const nodeOutputClass = (expectNearNode: boolean, nodeData: GUINodeData) => {
  if (nodeData.type === "computed") {
    return expectNearNode ? "bg-green-200" : "bg-green-500";
  }
  return expectNearNode ? "bg-yellow-200" : "bg-yellow-500";
};

export const nodeInputClass = (expectNearNode: boolean, nodeData: GUINodeData) => {
  if (nodeData.type === "computed") {
    return expectNearNode ? "bg-blue-200" : "bg-blue-500";
  }
  return expectNearNode ? "bg-violet-200" : "bg-violet-500";
};
