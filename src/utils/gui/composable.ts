import { NewEdgeEventData, NewEdgeData, GUINodeData } from "./type";
import { ref, computed } from "vue";
import { useStore } from "@/store";
import { edgeStartEventData, edgeUpdateEventData } from "./utils";

export const useNewEdge = () => {
  const store = useStore();
  //  newEdge
  const svgRef = ref();
  const newEdgeData = ref<NewEdgeData | null>(null);
  const mouseCurrentPosition = ref({ x: 0, y: 0 });
  const targetNode = ref("");
  //

  const newEdgeStartEvent = (data: NewEdgeEventData) => {
    targetNode.value = data.nodeId;
    const { mousePosition, startEdgeData } = edgeStartEventData(data, svgRef.value, store.nodeRecords[data.nodeId]);
    mouseCurrentPosition.value = mousePosition;
    newEdgeData.value = startEdgeData;
  };
  const newEdgeEvent = (data: NewEdgeEventData) => {
    if (newEdgeData.value) {
      const { mousePosition, updateEdgeData } = edgeUpdateEventData(data, svgRef.value, newEdgeData.value);
      mouseCurrentPosition.value = mousePosition;
      newEdgeData.value = updateEdgeData;
    }
  };

  const newEdgeEndEvent = () => {
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
    newEdgeStartEvent,
    newEdgeEvent,
    newEdgeEndEvent,
    nearestData,
  };
};
