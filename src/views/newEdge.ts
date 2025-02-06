import { ref, computed, ComputedRef, Ref } from "vue";
import { NewEdgeEventData, GUINodeData, NewEdgeData, GUIEdgeData } from "./type";

export const useNewEdge = (nodes: Ref<GUINodeData[]>, edges: Ref<GUIEdgeData[]>, nodeRecords: ComputedRef<Record<string, GUINodeData>>) => {
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
        data: nodeRecords.value[data.nodeId],
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
        const addEdge = {
          type: "AA",
          from: fromData,
          to: nearestData.value,
        };
        edges.value.push(addEdge);
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
        edges.value.push(addEdge);
      }
      newEdgeData.value = null;
      // edges.value.push(addEdge);
      console.log(edges.value);
    }
  };

  const nearestNode = computed(() => {
    if (!nodes.value.length) return null;

    return nodes.value.reduce((closest: null | { node: GUINodeData; distance: number }, node) => {
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
