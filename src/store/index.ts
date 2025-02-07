import { ref, computed } from "vue";
import { GUINodeData, GUIEdgeData } from "../views/gui/type";
import { defineStore } from "pinia";

type HistoryData = {
  nodes: GUINodeData[];
  edges: GUIEdgeData[];
};
export const useStore = defineStore("store", () => {
  const hisotories = ref<HistoryData[]>([]);
  const currentData = ref<HistoryData>({ nodes: [], edges: [] });

  const nodes = computed(() => {
    return currentData.value.nodes;
  });

  const edges = computed(() => {
    return currentData.value.edges;
  });
  const nodeRecords = computed(() => {
    return nodes.value.reduce((tmp: Record<string, GUINodeData>, current) => {
      tmp[current.nodeId] = current;
      return tmp;
    }, {});
  });
  // end of computed

  const updateData = (nodeData: GUINodeData[], edgeData: GUIEdgeData[], saveHistory: boolean) => {
    const data = { nodes: nodeData, edges: edgeData };
    currentData.value = data;
    if (saveHistory) {
      hisotories.value.push(data);
    }
  };
  const saveData = () => {
    hisotories.value.push(currentData.value);
  };

  const initHistory = (nodeData: GUINodeData[], edgeData: GUIEdgeData[]) => {
    updateData(nodeData, edgeData, true);
  };

  const pushNode = (nodeData: GUINodeData) => {
    updateData([...nodes.value, nodeData], [...edges.value], true);
  };

  const pushEdge = (edgeData: GUIEdgeData) => {
    updateData([...nodes.value], [...edges.value, edgeData], true);
  };

  const updatePosition = (index: number, pos: { x: number; y: number; width: number; height: number }) => {
    const newNode = { ...nodes.value[index] };
    newNode.position = { ...newNode.position, ...pos };
    const newNodes = [...nodes.value];
    newNodes[index] = newNode;
    // const newData = { nodes: newNodes, edges: [...edges.value] };
    updateData(newNodes, [...edges.value], false);
  };

  const undo = () => {
    const currentLen = hisotories.value.length;
    currentData.value = hisotories.value[currentLen - 2];
    hisotories.value.length = currentLen - 1;
  };

  return {
    // variables
    hisotories,

    // methods
    initHistory,
    pushNode,
    pushEdge,
    updatePosition,
    saveData,

    undo,

    // computed
    nodes,
    edges,
    currentData,
    nodeRecords,
  };
});
