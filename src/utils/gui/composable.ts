import { Position, NewEdgeEventData, NewEdgeData, ClosestNodeData, GUINearestData } from "./type";
import { ref, computed } from "vue";
import { useStore } from "@/store";
import { edgeStartEventData, edgeUpdateEventData, edgeEndEventData, pickNearestNode, pickNearestConnect } from "./utils";

export const useNewEdge = () => {
  const store = useStore();

  const svgRef = ref();
  const newEdgeData = ref<NewEdgeData | null>(null);
  const mouseCurrentPosition = ref<Position>({ x: 0, y: 0 });
  const targetNode = ref<string>("");

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

    return pickNearestConnect(nearestNode.value, newEdgeData.value, mouseCurrentPosition.value);
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
