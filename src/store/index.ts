import { ref, computed } from "vue";
import { GUINodeData, GUIEdgeData, GUINodeDataRecord, UpdateStaticValue } from "../utils/gui/type";
import { edges2inputs, store2graphData } from "../utils/gui/utils";
import { defineStore } from "pinia";

type HistoryData = {
  nodes: GUINodeData[];
  edges: GUIEdgeData[];
};
export const useStore = defineStore("store", () => {
  const histories = ref<HistoryData[]>([]);
  const currentData = ref<HistoryData>({ nodes: [], edges: [] });
  const index = ref(0);

  const reset = () => {
    histories.value = [{ nodes: [], edges: [] }];
    currentData.value = { nodes: [], edges: [] };
  };

  const nodes = computed(() => {
    return currentData.value.nodes;
  });

  const edges = computed(() => {
    return currentData.value.edges;
  });
  const nodeRecords = computed<GUINodeDataRecord>(() => {
    return nodes.value.reduce((tmp: GUINodeDataRecord, current) => {
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
      histories.value.length = index.value;
      histories.value.push(data);
      index.value = index.value + 1;
    }
  };
  const saveNodeData = () => {
    // just special case. only use position update.
    histories.value.length = index.value;
    histories.value.push(currentData.value);
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

  const updateNodePosition = (positionIndex: number, pos: { x: number; y: number; width: number; height: number }) => {
    const newNode = { ...nodes.value[positionIndex] };
    newNode.position = { ...newNode.position, ...pos };
    const newNodes = [...nodes.value];
    newNodes[positionIndex] = newNode;
    updateData(newNodes, [...edges.value], false);
  };
  const updateStaticNodeValue = (positionIndex: number, value: UpdateStaticValue) => {
    const newNode = { ...nodes.value[positionIndex] };
    newNode.data = { ...newNode.data, ...value };
    const newNodes = [...nodes.value];
    console.log(newNode, value);
    newNodes[positionIndex] = newNode;
    updateData(newNodes, [...edges.value], true);
  };

  // edge
  const pushEdge = (edgeData: GUIEdgeData) => {
    updateData([...nodes.value], [...edges.value, edgeData], true);
  };
  const deleteEdge = (edgeIndex: number) => {
    updateData([...nodes.value], [...edges.value.filter((__, idx) => idx !== edgeIndex)], true);
  };
  const deleteNode = (nodeIndex: number) => {
    const node =  nodes.value[nodeIndex]
    updateData([...nodes.value.filter((__, idx) => idx !== nodeIndex)], [...edges.value.filter(edge => {
      const { source, target } = edge;
      return source.nodeId !== node.nodeId && target.nodeId !== node.nodeId
    })], true);
  };

  // history api
  const undoable = computed(() => {
    return index.value > 1;
  });
  const undo = () => {
    if (undoable.value) {
      console.log(histories.value);
      currentData.value = histories.value[index.value - 2];
      index.value = index.value - 1;
    }
  };

  const redoable = computed(() => {
    return index.value < histories.value.length;
  });
  const redo = () => {
    if (redoable.value) {
      currentData.value = histories.value[index.value];
      index.value = index.value + 1;
    }
  };

  return {
    // variables
    histories,
    currentData,

    // methods
    initData,
    pushNode,
    pushEdge,
    deleteEdge,
    deleteNode,

    updateNodePosition,
    saveNodeData,

    updateStaticNodeValue,

    undo,
    redo,

    reset,

    // computed
    nodes,
    edges,
    graphData,
    nodeRecords,

    undoable,
    redoable,
  };
});
