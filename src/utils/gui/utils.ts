import { ref, computed } from "vue";
import { NewEdgeEventData, GUINodeData, NewEdgeData, GUIEdgeData, InputOutput, InputOutputParam } from "./type";
import { inputs2dataSources, GraphData, isComputedNodeData, NodeData, StaticNodeData } from "graphai";

import { useStore } from "@/store";

export const useNewEdge = () => {
  const store = useStore();
  //  newEdge
  const svgRef = ref();
  const newEdgeData = ref<NewEdgeData | null>(null);
  const mouseCurrentPosition = ref({ x: 0, y: 0 });
  const targetNode = ref("");
  const newEdgeEvent = (data: NewEdgeEventData) => {
    const rect = svgRef.value.getBoundingClientRect();
    mouseCurrentPosition.value = { x: data.x, y: data.y - rect.top };
    if (data.on === "start") {
      targetNode.value = data.nodeId;
      const nodeData = {
        nodeId: data.nodeId,
        data: store.nodeRecords[data.nodeId],
        index: data.index,
      };

      const positionData = {
        data: { position: mouseCurrentPosition.value },
      };
      if (data.target === "output") {
        newEdgeData.value = {
          target: data.target,
          from: nodeData,
          to: positionData,
        };
      } else {
        newEdgeData.value = {
          target: data.target,
          from: positionData,
          to: nodeData,
        };
      }
    }
    if (data.on === "move") {
      const newData = { data: { position: mouseCurrentPosition.value } };
      if (newEdgeData.value) {
        if (newEdgeData.value.target === "output") {
          newEdgeData.value.to = newData;
        } else {
          newEdgeData.value.from = newData;
        }
      }
    }
  };

  const newEdgeEventEnd = (data: NewEdgeEventData) => {
    if (data.on === "end") {
      if (!nearestData.value || !newEdgeData.value) return;

      if (newEdgeData.value.target === "output") {
        const fromData = newEdgeData.value.from;
        const { nodeId, index } = fromData;
        const addEdge = {
          type: "AA",
          from: {
            nodeId,
            index,
          },
          to: nearestData.value,
        };
        store.pushEdge(addEdge);
      }
      if (newEdgeData.value.target === "input") {
        const toData = newEdgeData.value.to;
        const { nodeId, index } = toData;
        const addEdge = {
          type: "AA",
          from: nearestData.value,
          to: {
            nodeId,
            index,
          },
        };
        store.pushEdge(addEdge);
      }
      newEdgeData.value = null;
    }
  };

  const nearestNode = computed(() => {
    if (!store.nodes.length) return null;

    return store.nodes.reduce((closest: null | { node: GUINodeData; distance: number }, node) => {
      if (targetNode.value === node.nodeId) {
        return closest;
      }
      const nodeCenterX = node.position.x + (node.position.width ?? 0) / 2;
      const nodeCenterY = node.position.y + (node.position.height ?? 0) / 2;
      const mouseX = mouseCurrentPosition.value.x;
      const mouseY = mouseCurrentPosition.value.y;

      const distance = Math.sqrt((nodeCenterX - mouseX) ** 2 + (nodeCenterY - mouseY) ** 2);

      if (!closest || distance < closest.distance) {
        return { node, distance };
      }

      return closest;
    }, null);
  });

  const nearestConnect = computed(() => {
    if (!newEdgeData.value || !nearestNode.value) return;
    const nodePos = nearestNode.value.node.position;
    const { inputCenters, outputCenters } = nodePos;
    const isOutput = newEdgeData.value.target === "output";
    const centers = (isOutput ? inputCenters : outputCenters) ?? [];
    return centers.reduce((closest: null | { index: number; distance: number }, center: number, index: number) => {
      const nodeX = nodePos.x + (isOutput ? 0 : (nodePos?.width ?? 0));
      const nodeY = nodePos.y + center;
      const mouseX = mouseCurrentPosition.value.x;
      const mouseY = mouseCurrentPosition.value.y;

      const distance = Math.sqrt((nodeX - mouseX) ** 2 + (nodeY - mouseY) ** 2);
      if (!closest || distance < closest.distance) {
        return { index, distance };
      }

      return closest;
    }, null);
  });

  const nearestData = computed(() => {
    if (!nearestNode.value || !nearestConnect.value || !newEdgeData.value) return;
    return {
      nodeId: nearestNode.value.node.nodeId,
      index: nearestConnect.value.index,
      target: newEdgeData.value.target,
    };
  });

  return {
    svgRef,
    newEdgeData,
    newEdgeEvent,
    newEdgeEventEnd,
    nearestData,
  };
};

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
export const edges2inputs = (edges:GUIEdgeData[], nodeRecords: Record<string, GUINodeData>) => {
  return edges.map((edge) => {
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

export const store2graphData = (nodes:GUINodeData[], edgeObject: Record<string, Record<string, string[]>>) => {
  const newNodes = nodes.reduce((tmp: Record<string, NodeData>, node) => {
    const inputs = edgeObject.value[node.nodeId];
    console.log(edgeObject.value, node.nodeId);
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
