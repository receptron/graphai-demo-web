import { ref, computed } from "vue";
import { GUINodeData, GUIEdgeData } from "../utils/gui/type";
import { edges2inputs, store2graphData } from "../utils/gui/utils";
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
  const edgeObject = computed(() => {
    return edges2inputs(edges.value, nodeRecords.value);
  });
  const graphData = computed(() => {
    return store2graphData(nodes.value, edgeObject.value);
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

  const initData = (nodeData: GUINodeData[], edgeData: GUIEdgeData[]) => {
    // this time, node position is not set. save after mounted.
    updateData(nodeData, edgeData, false);
  };

  // node
  const pushNode = (nodeData: GUINodeData) => {
    updateData([...nodes.value, nodeData], [...edges.value], true);
  };

  const updatePosition = (positionIndex: number, pos: { x: number; y: number; width: number; height: number }) => {
    const newNode = { ...nodes.value[positionIndex] };
    newNode.position = { ...newNode.position, ...pos };
    const newNodes = [...nodes.value];
    newNodes[positionIndex] = newNode;
    updateData(newNodes, [...edges.value], false);
  };

  // edge
  const pushEdge = (edgeData: GUIEdgeData) => {
    updateData([...nodes.value], [...edges.value, edgeData], true);
  };
  const deleteEdge = (edgeIndex: number) => {
    updateData([...nodes.value], [...edges.value.filter((__, i) => i !== edgeIndex)], true);
  };

  // history api
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
    currentData,

    // methods
    initData,
    pushNode,
    pushEdge,
    deleteEdge,

    updatePosition,
    saveData,

    undo,
    redo,

    // computed
    nodes,
    edges,
    graphData,
    nodeRecords,

    undoable,
    redoable,
  };
});
