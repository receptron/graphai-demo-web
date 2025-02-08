import { NewEdgeEventData, NewEdgeData, ClosestNodeData, GUINearestData } from "./type";
import { ref, computed } from "vue";
import { useStore } from "@/store";
import { edgeStartEventData, edgeUpdateEventData, edgeEndEventData, pickNearestNode } from "./utils";

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

    const newEdge = edgeEndEventData(newEdgeData.value, nearestData.value);
    if (newEdge) {
      store.pushEdge(newEdge);
    }
    newEdgeData.value = null;
  };

  const nearestNode = computed<ClosestNodeData | null>(() => {
    if (!store.nodes.length) return null;

    return pickNearestNode(store.nodes, targetNode.value, mouseCurrentPosition.value);
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

  const nearestData = computed<GUINearestData | undefined>(() => {
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
