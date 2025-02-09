import {
  Position,
  GUINodeData,
  GUIEdgeData,
  GUINodeDataRecord,
  GUINearestData,
  EdgeData,
  InputOutput,
  InputOutputParam,
  NewEdgeEventData,
  NewEdgeData,
  ClosestNodeData,
  EdgeEndPointData,
} from "./type";
import { inputs2dataSources, GraphData, isComputedNodeData, NodeData, StaticNodeData } from "graphai";
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
  let i = -50;
  let j = 10;

  const nodeIds = Object.keys(graphData.nodes);
  const rawEdge: GUIEdgeData[] = [];
  const node2agent = Object.keys(graphData.nodes).reduce((tmp: Record<string, string | null>, nodeId) => {
    const node = graphData.nodes[nodeId];
    tmp[nodeId] = isComputedNodeData(node) ? (node.agent as string) : null;
    return tmp;
  }, {});

  const getIndex = (nodeId: string, propId: string, key: keyof InputOutput) => {
    const agent = node2agent[nodeId];
    const indexes = agent ? (agentProfiles[agent][key] as InputOutputParam[]) : [];
    const index = indexes.findIndex((data) => data.name === propId);
    if (index === -1) {
      console.log(`${key} ${nodeId}.${propId} is not hit`);
    }
    return index;
  };

  const rawNode = Object.keys(graphData.nodes).map((nodeId) => {
    i = i + 200;
    if (i > 800) {
      i = 100;
      j = j + 300;
    }
    const node = graphData.nodes[nodeId];
    const isComputed = isComputedNodeData(node);
    const inputs = isComputed ? (node.inputs ?? {}) : node.update ? { update: node.update } : {};
    Object.keys(inputs).forEach((inputProp) => {
      // node, props
      // inputs(to), oututs(from)
      inputs2dataSources([inputs[inputProp]]).forEach((source) => {
        const outputNodeId = source.value || source.nodeId;
        if (source.propIds && source.propIds.length > 0) {
          source.propIds.forEach((outputPropId) => {
            if (nodeIds.includes(outputNodeId)) {
              const sourceIndex = getIndex(outputNodeId, outputPropId, "outputs");
              const targetIndex = isComputed ? getIndex(nodeId, inputProp, "inputs") : 0;

              rawEdge.push({
                source: { nodeId: outputNodeId, index: sourceIndex > -1 ? sourceIndex : 0 },
                target: { nodeId, index: targetIndex > -1 ? targetIndex : 0 },
                type: "AA",
              });
            }
          });
        }
      });
    });
    return {
      type: isComputed ? "computed" : "static",
      nodeId,
      position: { x: i, y: j },

      agent: isComputed ? (node.agent as string) : undefined,
      guiAgentId: isComputed ? (node.agent as string) : undefined,
      params: isComputed ? node.params : undefined,
      value: isComputed ? undefined : node.value,
    };
  });

  return {
    rawEdge,
    rawNode,
  };
};

export const edgeEnd2agentProfile = (edgeEndPointData: EdgeEndPointData, nodeRecords: GUINodeDataRecord, sorceOrTarget: "source" | "target") => {
  const node = nodeRecords[edgeEndPointData.nodeId];
  if (node && node.type === "computed") {
    const specializedAgent = node.guiAgentId ?? node.agent ?? ""; // undefined is static node.

    const profile = agentProfiles[specializedAgent];
    const IOData = sorceOrTarget === "source" ? profile.outputs[edgeEndPointData.index] : profile.inputs[edgeEndPointData.index];

    return {
      agent: specializedAgent,
      profile,
      IOData,
    };
  }
};

// for store
export const edges2inputs = (edges: GUIEdgeData[], nodeRecords: GUINodeDataRecord) => {
  return edges
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
      };
    })
    .reduce((tmp: Record<string, Record<string, string[]>>, current) => {
      if (!tmp[current.targetNodeId]) {
        tmp[current.targetNodeId] = {};
      }
      if (!tmp[current.targetNodeId][current.targetPropId]) {
        tmp[current.targetNodeId][current.targetPropId] = [];
      }
      tmp[current.targetNodeId][current.targetPropId].push(current.sourceData);
      return tmp;
    }, {});
};

export const store2graphData = (nodes: GUINodeData[], edgeObject: Record<string, Record<string, string[]>>) => {
  const newNodes = nodes.reduce((tmp: Record<string, NodeData>, node) => {
    const inputs = edgeObject[node.nodeId];
    if (node.agent) {
      tmp[node.nodeId] = {
        agent: node.agent,
        params: node.params,
        inputs: inputs ?? {},
        // isResult: true,
        // anyInput (boolean)
        // if/unless (edge)
        // defaultValue (object?)
        // retry ?
      };
    } else {
      tmp[node.nodeId] = {
        value: node.value,
        ...inputs,
      } as StaticNodeData;
    }
    return tmp;
  }, {});
  const newGraphData = {
    version: 0.5,
    nodes: newNodes,
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

export const edgeStartEventData = (data: NewEdgeEventData, parantElement: HTMLElement, nodeData: GUINodeData) => {
  // Since x and y are clientX and clientY, adjust the height by the header.
  // If there is a horizontal menu, you will need to adjust x.
  const rect = parantElement.getBoundingClientRect();
  const mousePosition = { x: data.x, y: data.y - rect.top };

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

export const edgeUpdateEventData = (data: NewEdgeEventData, parantElement: HTMLElement, prevEdgeData: NewEdgeData) => {
  const rect = parantElement.getBoundingClientRect();
  const mousePosition = { x: data.x, y: data.y - rect.top };

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
      type: "AA",
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
      type: "AA",
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
    const nodeCenterX = node.position.x + (node.position.width ?? 0) / 2;
    const nodeCenterY = node.position.y + (node.position.height ?? 0) / 2;
    const mouseX = mouseCurrentPosition.x;
    const mouseY = mouseCurrentPosition.y;

    const distance = Math.sqrt((nodeCenterX - mouseX) ** 2 + (nodeCenterY - mouseY) ** 2);

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
