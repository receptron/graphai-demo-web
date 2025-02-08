import { GUINodeData, GUIEdgeData, InputOutput, InputOutputParam } from "./type";
import { inputs2dataSources, GraphData, isComputedNodeData, NodeData, StaticNodeData } from "graphai";

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

  const getIndex = (nodeId: string, PropId: string, key: keyof InputOutput) => {
    const agent = node2agent[nodeId];
    const indexes = agent ? (agent2NodeParams[agent][key] as InputOutputParam[]) : [];
    const index = indexes.findIndex((data) => data.name === PropId);
    if (index === -1) {
      console.log(`${key} ${nodeId}.${PropId} is not hit`);
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

export const agent2NodeParams: Record<string, InputOutput> = {
  eventAgent: {
    inputs: [{ name: "wait", type: "array" }],
    outputs: [{ name: "text" }],
    params: [],
  },
  openAIAgent: {
    inputs: [{ name: "messages" }, { name: "prompt", type: "string" }, { name: "model", type: "string" }],
    outputs: [{ name: "message" }, { name: "text" }],
    params: [],
  },
  stringTemplateAgent: {
    inputs: [{ name: "text" }, { name: "message1" }, { name: "message2" }],
    outputs: [{ name: "text" }],
    params: [],
  },
  pushAgent: {
    inputs: [{ name: "array" }, { name: "item" }],
    outputs: [{ name: "array" }],
    params: [],
  },
  convertAgent: {
    agent: "copyAgent",
    inputSchema: {
      context: {
        inputs: {
          person0: {
            name: "interviewer",
            system: ":interviewer",
          },
          person1: {
            name: ":name",
            system: "You are ${:name}.",
            greeting: "Hi, I'm ${:name}",
          },
        },
      },
    },
    inputs: [
      { name: "interviewer", type: "text" },
      { name: "name", type: "text" },
    ],
    outputs: [{ name: "array" }],
    params: [],
  },
};

export const staticNodeParams: InputOutput = { inputs: [{ name: "update" }], outputs: [{ name: "date" }] };

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
          const props = agent2NodeParams[fromAgent].outputs[fromEdge.index]?.name;
          return `:${fromEdge.nodeId}.${props}`;
        }
        return `:${fromEdge.nodeId}`;
      })();
      const toPropId = (() => {
        if (toNode && toNode.type === "computed") {
          const toAgent = toNode.guiAgentId ?? toNode.agent ?? ""; // undefined is static node.
          const toProp = agent2NodeParams[toAgent].inputs[toEdge.index]?.name;
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
