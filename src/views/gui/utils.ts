import { ref, computed } from "vue";
import { NewEdgeEventData, GUINodeData, NewEdgeData, GUIEdgeData, InputOutput } from "./type";
import { inputs2dataSources, GraphData, isComputedNodeData } from "graphai";

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
        console.log(toData);
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
  const rawNode = Object.keys(graphData.nodes).map((nodeId) => {
    i = i + 200;
    if (i > 800) {
      i = 100;
      j = j + 300;
    }
    const node = graphData.nodes[nodeId];
    inputs2dataSources(node).forEach((source) => {
      const expect = source.value || source.nodeId;
      if (nodeIds.includes(expect)) {
        rawEdge.push({
          from: { nodeId: expect, index: 0 },
          to: { nodeId, index: 0 },
          type: "AA",
        });
      }
    });
    const isComputed = isComputedNodeData(node);
    return {
      type: isComputed ? "computed" : "static",
      nodeId,
      position: { x: i, y: j },

      agent: isComputed ? (node.agent as string) : undefined,
      guiAgentId: isComputed ? (node.agent as string) : undefined,
      params: isComputed ? node.params : undefined,
    };
  });

  return {
    rawEdge,
    rawNode,
  };
};

export const agent2NodeParams: Record<string, InputOutput> = {
  eventAgent: {
    inputs: [{ name: "wait" }],
    outputs: [{ name: "text" }],
    params: [],
  },
  openAIAgent: {
    inputs: [{ name: "messages" }, { name: "text" }, { name: "model" }],
    outputs: [{ name: "message" }, { name: "text" }],
    params: [],
  },
  stringTemplateAgent: {
    inputs: [{ name: "message1" }, { name: "message2" }],
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
