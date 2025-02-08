import {
  Position,
  GUINodeData,
  GUIEdgeData,
  InputOutput,
  InputOutputParam,
  NewEdgeEventData,
  NewEdgeData,
  GUINearestData,
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
              const fromIndex = getIndex(outputNodeId, outputPropId, "outputs");
              const toIndex = isComputed ? getIndex(nodeId, inputProp, "inputs") : 0;

              rawEdge.push({
                from: { nodeId: outputNodeId, index: fromIndex > -1 ? fromIndex : 0 },
                to: { nodeId, index: toIndex > -1 ? toIndex : 0 },
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

export const edgeEnd2agentProfile = (edgeEndPointData: EdgeEndPointData, nodeRecords: Record<string, GUINodeData>) => {
  const node = nodeRecords[edgeEndPointData.nodeId];
  if (node && node.type === "computed") {
    const specializedAgent = node.guiAgentId ?? node.agent ?? ""; // undefined is static node.

    const profile = agentProfiles[specializedAgent];
    return {
      agent: specializedAgent,
      profile,
    };
  }
};

// for store
export const edges2inputs = (edges: GUIEdgeData[], nodeRecords: Record<string, GUINodeData>) => {
  return edges
    .map((edge) => {
      const { from: fromEdge, to: toEdge } = edge;

      const fromNode = nodeRecords[fromEdge.nodeId];
      const toNode = nodeRecords[toEdge.nodeId];
      const fromData = (() => {
        if (fromNode && fromNode.type === "computed") {
          const fromAgent = fromNode.guiAgentId ?? fromNode.agent ?? ""; // undefined is static node.
          const props = agentProfiles[fromAgent].outputs[fromEdge.index]?.name;
          return `:${fromEdge.nodeId}.${props}`;
        }
        return `:${fromEdge.nodeId}`;
      })();
      const toPropId = (() => {
        if (toNode && toNode.type === "computed") {
          const toAgent = toNode.guiAgentId ?? toNode.agent ?? ""; // undefined is static node.
          const toProp = agentProfiles[toAgent].inputs[toEdge.index]?.name;
          return toProp;
        }
        return "update";
      })();

      return {
        fromData,
        toNodeId: toEdge.nodeId,
        toPropId,
      };
    })
    .reduce((tmp: Record<string, Record<string, string[]>>, current) => {
      if (!tmp[current.toNodeId]) {
        tmp[current.toNodeId] = {};
      }
      if (!tmp[current.toNodeId][current.toPropId]) {
        tmp[current.toNodeId][current.toPropId] = [];
      }
      tmp[current.toNodeId][current.toPropId].push(current.fromData);
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
  const startEdgeData = (() => {
    if (data.target === "outbound") {
      return {
        target: data.target,
        from: edgeNodeData,
        to: positionData,
      };
    }
    return {
      target: data.target,
      from: positionData,
      to: edgeNodeData,
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
    prevEdgeData.target === "outbound"
      ? {
          ...prevEdgeData,
          to: newData,
        }
      : {
          ...prevEdgeData,
          from: newData,
        };
  return {
    mousePosition,
    updateEdgeData,
  };
};

export const edgeEndEventData = (newEdgeData: NewEdgeData, nearestData: GUINearestData) => {
  if (newEdgeData.target === "outbound") {
    const fromData = newEdgeData.from;
    const { nodeId, index } = fromData;
    const addEdge = {
      type: "AA",
      from: {
        nodeId,
        index,
      },
      to: nearestData,
    };
    return addEdge;
  }
  if (newEdgeData.target === "inbound") {
    const toData = newEdgeData.to;
    const { nodeId, index } = toData;
    const addEdge = {
      type: "AA",
      from: nearestData,
      to: {
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
  const isOutput = newEdgeData.target === "outbound";
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
