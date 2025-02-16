import {
  Position,
  GUINodeData,
  GUIEdgeData,
  GUINodeDataRecord,
  GUINearestData,
  EdgeData,
  InputOutput,
  InputOutputType,
  NewEdgeEventData,
  NewEdgeData,
  ClosestNodeData,
  EdgeEndPointData,
  HistoryPayload,
} from "./type";
import { inputs2dataSources, GraphData, isComputedNodeData, NodeData, StaticNodeData } from "graphai";
import { LoopData } from "graphai/lib/type";
import { resultsOf } from "./result";
import { agentProfiles } from "./data";

const isTouch = (event: MouseEvent | TouchEvent): event is TouchEvent => {
  return "touches" in event;
};
export const getClientPos = (event: MouseEvent | TouchEvent) => {
  const clientX = isTouch(event) ? event.touches[0].clientX : event.clientX;
  const clientY = isTouch(event) ? event.touches[0].clientY : event.clientY;
  return { clientX, clientY };
};

export const graphToGUIData = (graphData: GraphData) => {
  const positions = graphData?.metadata?.positions ?? {};

  const nodeIds = Object.keys(graphData.nodes);
  const rawEdge: GUIEdgeData[] = [];
  const node2agent = Object.keys(graphData.nodes).reduce((tmp: Record<string, string | null>, nodeId) => {
    const node = graphData.nodes[nodeId];
    tmp[nodeId] = isComputedNodeData(node) ? (node.agent as string) : null;
    return tmp;
  }, {});

  const getIndex = (nodeId: string, propId: string, key: keyof InputOutput) => {
    const agent = node2agent[nodeId];
    const indexes = agent ? (agentProfiles[agent][key] as InputOutputType[]) : [];
    const index = indexes.findIndex((data) => data.name === propId);
    if (index === -1) {
      console.log(`${key} ${nodeId}.${propId} is not hit`);
    }
    return index;
  };

  let positionIndex = 1;
  const rawNode = Object.keys(graphData.nodes).map((nodeId) => {
    const node = graphData.nodes[nodeId];
    const isComputed = isComputedNodeData(node);
    const inputs = isComputed ? (graphData?.metadata?.inputs ?? node.inputs ?? {}) : node.update ? { update: node.update } : {};
    Object.keys(inputs).forEach((inputProp) => {
      // node, props
      // inputs(to), oututs(from)
      inputs2dataSources([inputs[inputProp]]).forEach((source) => {
        const outputNodeId = source.nodeId;
        if (outputNodeId) {
          // source is computed node
          if (source.propIds && source.propIds.length > 0) {
            source.propIds.forEach((outputPropId) => {
              if (nodeIds.includes(outputNodeId)) {
                const sourceIndex = getIndex(outputNodeId, outputPropId, "outputs");
                const targetIndex = isComputed ? getIndex(nodeId, inputProp, "inputs") : 0;
                rawEdge.push({
                  source: { nodeId: outputNodeId, index: sourceIndex > -1 ? sourceIndex : 0 },
                  target: { nodeId, index: targetIndex > -1 ? targetIndex : 0 },
                  type: "edge",
                });
              }
            });
          } else {
            // source is static nodeData
            const targetIndex = isComputed ? getIndex(nodeId, inputProp, "inputs") : 0;
            rawEdge.push({
              source: { nodeId: outputNodeId, index: 0 },
              target: { nodeId, index: targetIndex > -1 ? targetIndex : 0 },
              type: "edge",
            });
          }
        }
      });
    });

    const position = positions[nodeId] ?? { x: (positionIndex % 4) * 200 + 100, y: Math.floor(positionIndex / 4) * 300 + 50 };
    positionIndex += 1;
    const data = (() => {
      if (isComputed) {
        return {
          params: node.params,
          // agent: node.agent as string,
          guiAgentId: node.agent as string,
        };
      }
      const staticNodeType = (() => {
        if (node.value === undefined) {
          return "text";
        }
        if (typeof node.value === "object" || Array.isArray(node.value)) {
          return "data";
        }
        if (node.value === true || node.value === false) {
          return "boolean";
        }
        if (node.value) {
          return "number";
        }
        return "text";
      })();
      return {
        value: node.value,
        staticNodeType,
      };
    })();
    return {
      type: isComputed ? "computed" : "static",
      nodeId,
      position,

      data,
    };
  });

  // graph loop 2 store loop
  const loop2loop = (graphLoop: LoopData) => {
    if (graphLoop.while) {
      return {
        loopType: "while",
        while: graphLoop.while,
      };
    }
    if (graphLoop.count) {
      return {
        loopType: "count",
        count: graphLoop.count,
      };
    }
    return {
      loopType: "none",
    };
  };
  const { loop: graphLoop } = graphData;
  return {
    rawEdge,
    rawNode,
    loop: loop2loop(graphLoop ?? {}),
  };
};

export const edgeEnd2agentProfile = (edgeEndPointData: EdgeEndPointData, nodeRecords: GUINodeDataRecord, sorceOrTarget: "source" | "target") => {
  const node = nodeRecords[edgeEndPointData.nodeId];
  if (node && node.type === "computed") {
    const specializedAgent = node.data.guiAgentId ?? ""; // undefined is static node.

    const profile = agentProfiles[specializedAgent];
    const IOData = sorceOrTarget === "source" ? profile.outputs[edgeEndPointData.index] : profile.inputs[edgeEndPointData.index];

    return {
      agent: specializedAgent,
      profile,
      IOData,
    };
  }
};

// for store to generate new graphData
type SourceTargetIntermediateData = {
  sourceData: string;
  targetNodeId: string;
  targetPropId: string;
  targetIndex: number;
};
type SourceTargetTmpObject = Record<string, Record<string, SourceTargetIntermediateData[]>>;

type NodeEdgeMap = Record<string, string | string[]>;
type EdgeRecord = Record<string, NodeEdgeMap>;

export const edges2inputs = (edges: GUIEdgeData[], nodeRecords: GUINodeDataRecord) => {
  const records = edges
    .map((edge) => {
      const { source: sourceEdge, target: targetEdge } = edge;

      const sourceData = (() => {
        const sourceAgentProfile = edgeEnd2agentProfile(sourceEdge, nodeRecords, "source");
        if (sourceAgentProfile) {
          const props = sourceAgentProfile.IOData?.name;
          return `:${sourceEdge.nodeId}.${props}`;
        }
        return `:${sourceEdge.nodeId}`;
      })();
      const targetPropId = (() => {
        const targetAgentProfile = edgeEnd2agentProfile(targetEdge, nodeRecords, "target");
        if (targetAgentProfile) {
          const targetProp = targetAgentProfile.IOData?.name;
          return targetProp;
        }
        return "update";
      })();

      return {
        sourceData,
        targetNodeId: targetEdge.nodeId,
        targetPropId,
        targetIndex: targetEdge.index,
      };
    })
    .reduce((tmp: SourceTargetTmpObject, current) => {
      if (!tmp[current.targetNodeId]) {
        tmp[current.targetNodeId] = {};
      }
      if (!tmp[current.targetNodeId][current.targetPropId]) {
        tmp[current.targetNodeId][current.targetPropId] = [];
      }
      tmp[current.targetNodeId][current.targetPropId].push(current);
      return tmp;
    }, {});

  return Object.keys(records).reduce((edgeRecord: EdgeRecord, nodeId) => {
    const inputsRecord = Object.keys(records[nodeId]).reduce((nodeEdgeMap: NodeEdgeMap, propId) => {
      const { targetIndex } = records[nodeId][propId][0];
      const targetProfile = edgeEnd2agentProfile({ nodeId, index: targetIndex }, nodeRecords, "target");
      if (!targetProfile) {
        nodeEdgeMap[propId] = records[nodeId][propId][0].sourceData;
      } else if (targetProfile.IOData.type === "text") {
        nodeEdgeMap[propId] = records[nodeId][propId][0].sourceData;
      } else if (targetProfile.IOData.type === "array") {
        nodeEdgeMap[propId] = records[nodeId][propId].map((data) => data.sourceData);
      } else if (records[nodeId][propId].length === 1) {
        nodeEdgeMap[propId] = records[nodeId][propId][0].sourceData;
      } else {
        nodeEdgeMap[propId] = records[nodeId][propId].map((data) => data.sourceData);
      }
      return nodeEdgeMap;
    }, {});

    edgeRecord[nodeId] = inputsRecord;
    return edgeRecord;
  }, {});
};

export const store2graphData = (nodeRecords: GUINodeDataRecord, edgeObject: EdgeRecord, loop: LoopData, currentData: HistoryPayload) => {
  const nodes = Object.values(nodeRecords);
  const newNodes = nodes.reduce((tmp: Record<string, NodeData>, node) => {
    const { guiAgentId } = nodeRecords[node.nodeId].data;
    const profile = agentProfiles[guiAgentId ?? ""];
    const inputs = profile?.inputSchema ? resultsOf(profile.inputSchema as NodeEdgeMap, edgeObject[node.nodeId]) : edgeObject[node.nodeId];

    // static node don't have profile and guiAgentId
    if (profile) {
      tmp[node.nodeId] = {
        agent: profile.agent,
        params: node.data.params,
        inputs: inputs ?? {},
        isResult: node.data?.params?.isResult ?? false,
        // anyInput (boolean)
        // if/unless (edge)
        // defaultValue (object?)
        // retry ?
      };
    } else {
      tmp[node.nodeId] = {
        value: node.data.value,
        ...inputs,
      } as StaticNodeData;
    }
    return tmp;
  }, {});

  // save inputs
  const newGraphData = {
    version: 0.5,
    nodes: newNodes,
    loop,
    metadata: {
      data: currentData,
    },
  };
  return newGraphData;
};

// composable
export const guiEdgeData2edgeData = (guiEdges: GUIEdgeData[], nodeRecords: GUINodeDataRecord): EdgeData[] => {
  return guiEdges.map((edge) => {
    const { type, source, target } = edge;
    return {
      type,
      source: {
        ...source,
        data: nodeRecords[edge.source.nodeId],
      },
      target: {
        ...target,
        data: nodeRecords[edge.target.nodeId],
      },
    };
  });
};

export const edgeStartEventData = (data: NewEdgeEventData, parentElement: HTMLElement, nodeData: GUINodeData) => {
  // Since x and y are clientX and clientY, adjust the height by the header.
  // If there is a horizontal menu, you will need to adjust x.
  const rect = parentElement.getBoundingClientRect();
  const mousePosition = { x: data.x - rect.left, y: data.y - rect.top };

  const edgeNodeData = {
    nodeId: data.nodeId,
    data: nodeData,
    index: data.index,
  };

  const positionData = {
    data: { position: mousePosition },
  };
  const startEdgeData: NewEdgeData = (() => {
    if (data.direction === "outbound") {
      return {
        direction: data.direction,
        source: edgeNodeData,
        target: positionData,
      };
    }
    return {
      direction: data.direction,
      source: positionData,
      target: edgeNodeData,
    };
  })();
  return {
    mousePosition,
    startEdgeData,
  };
};

export const edgeUpdateEventData = (data: NewEdgeEventData, parentElement: HTMLElement, prevEdgeData: NewEdgeData) => {
  const rect = parentElement.getBoundingClientRect();
  const mousePosition = { x: data.x - rect.left, y: data.y - rect.top };

  const newData = { data: { position: mousePosition } };

  const updateEdgeData =
    prevEdgeData.direction === "outbound"
      ? {
          ...prevEdgeData,
          target: newData,
        }
      : {
          ...prevEdgeData,
          source: newData,
        };
  return {
    mousePosition,
    updateEdgeData,
  };
};

export const edgeEndEventData = (newEdgeData: NewEdgeData, nearestData: GUINearestData): GUIEdgeData | null => {
  if (newEdgeData.direction === "outbound") {
    const sourceData = newEdgeData.source;
    const { nodeId, index } = sourceData;
    const addEdge = {
      type: "edge",
      source: {
        nodeId,
        index,
      },
      target: nearestData,
    };
    return addEdge;
  }
  if (newEdgeData.direction === "inbound") {
    const targetData = newEdgeData.target;
    const { nodeId, index } = targetData;
    const addEdge = {
      type: "edge",
      source: nearestData,
      target: {
        nodeId,
        index,
      },
    };
    return addEdge;
  }
  return null;
};

export const pickNearestNode = (nodes: GUINodeData[], targetNode: string, mouseCurrentPosition: Position) => {
  return nodes.reduce((closest: null | ClosestNodeData, node) => {
    if (targetNode === node.nodeId) {
      return closest;
    }
    /*
    const nodeCenterX = node.position.x + (node.position.width ?? 0) / 2;
    const nodeCenterY = node.position.y + (node.position.height ?? 0) / 2;
    */
    const mouseX = mouseCurrentPosition.x;
    const mouseY = mouseCurrentPosition.y;

    const { x, y, width, height } = node.position;

    const closestX = Math.max(x, Math.min(mouseX, x + (width ?? 0)));
    const closestY = Math.max(y, Math.min(mouseY, y + (height ?? 0)));

    // const distance = Math.sqrt((nodeCenterX - mouseX) ** 2 + (nodeCenterY - mouseY) ** 2);
    const distance = Math.sqrt((closestX - mouseX) ** 2 + (closestY - mouseY) ** 2);

    if (!closest || distance < closest.distance) {
      return { node, distance };
    }

    return closest;
  }, null);
};

export const pickNearestConnect = (nearestNode: ClosestNodeData, newEdgeData: NewEdgeData, mouseCurrentPosition: Position) => {
  const nodePos = nearestNode.node.position;
  const { inputCenters, outputCenters } = nodePos;
  const isOutput = newEdgeData.direction === "outbound";
  const centers = (isOutput ? inputCenters : outputCenters) ?? [];
  return centers.reduce((closest: null | { index: number; distance: number }, center: number, index: number) => {
    const nodeX = nodePos.x + (isOutput ? 0 : (nodePos?.width ?? 0));
    const nodeY = nodePos.y + center;
    const mouseX = mouseCurrentPosition.x;
    const mouseY = mouseCurrentPosition.y;

    const distance = Math.sqrt((nodeX - mouseX) ** 2 + (nodeY - mouseY) ** 2);
    if (!closest || distance < closest.distance) {
      return { index, distance };
    }

    return closest;
  }, null);
};

const sameEdge = (edge1: EdgeData | GUIEdgeData, edge2: EdgeData | GUIEdgeData) => {
  return (
    edge1.source.nodeId === edge2.source.nodeId &&
    edge1.source.index === edge2.source.index &&
    edge1.target.nodeId === edge2.target.nodeId &&
    edge1.target.index === edge2.target.index
  );
};
const sameTargetEdge = (edge1: EdgeData | GUIEdgeData, edge2: EdgeData | GUIEdgeData) => {
  return edge1.target.nodeId === edge2.target.nodeId && edge1.target.index === edge2.target.index;
};

export const isEdgeConnectale = (expectEdge: GUIEdgeData | null, edges: GUIEdgeData[], nodeRecords: GUINodeDataRecord) => {
  if (!expectEdge) {
    return false;
  }
  if (edges.find((edge) => sameEdge(edge, expectEdge))) {
    return false;
  }
  const existanceEdges = edges.filter((edge) => {
    return sameTargetEdge(edge, expectEdge);
  });
  const profile = edgeEnd2agentProfile(expectEdge.target, nodeRecords, "target");
  if (!profile) {
    // maybe static node
    return true;
  }
  if (profile.IOData.type === "text") {
    return existanceEdges.length === 0;
  }
  return true;
};
