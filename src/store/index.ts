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
  const index = ref(0);

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
      hisotories.value.length = index.value;
      hisotories.value.push(data);
      index.value = index.value + 1;
    }
  };
  const saveData = () => {
    // just special case. only use position update.
    hisotories.value.length = index.value;
    hisotories.value.push(currentData.value);
    index.value = index.value + 1;
  };

  const initHistory = (nodeData: GUINodeData[], edgeData: GUIEdgeData[]) => {
    // this time, node position is not set. save after mounted.
    updateData(nodeData, edgeData, false);
  };

  const pushNode = (nodeData: GUINodeData) => {
    updateData([...nodes.value, nodeData], [...edges.value], true);
  };

  const pushEdge = (edgeData: GUIEdgeData) => {
    updateData([...nodes.value], [...edges.value, edgeData], true);
  };

  const updatePosition = (positionIndex: number, pos: { x: number; y: number; width: number; height: number }) => {
    const newNode = { ...nodes.value[positionIndex] };
    newNode.position = { ...newNode.position, ...pos };
    const newNodes = [...nodes.value];
    newNodes[positionIndex] = newNode;
    // const newData = { nodes: newNodes, edges: [...edges.value] };
    updateData(newNodes, [...edges.value], false);
  };

  const undoable = computed(() => {
    return index.value > 1;
  });
  const undo = () => {
    if (undoable.value) {
      currentData.value = hisotories.value[index.value - 2];
      index.value = index.value - 1;
    }
  };

  const redoable = computed(() => {
    console.log(index.value, hisotories.value.length);
    return index.value < hisotories.value.length;
  });
  const redo = () => {
    if (redoable.value) {
      currentData.value = hisotories.value[index.value];
      index.value = index.value + 1;
    }
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
    redo,

    // computed
    nodes,
    edges,
    currentData,
    nodeRecords,

    undoable,
    redoable,
  };
});
