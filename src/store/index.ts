import { ref, computed } from "vue";
import { GUINodeData, GUIEdgeData, GUINodeDataRecord, UpdateStaticValue, HistoryData, HistoryPayload } from "../utils/gui/type";
import { edges2inputs, store2graphData } from "../utils/gui/utils";
import { defineStore } from "pinia";

export const useStore = defineStore("store", () => {
  const histories = ref<HistoryData[]>([]);
  const currentData = ref<HistoryPayload>({ nodes: [], edges: [] });
  const index = ref(0);

  const reset = () => {
    // histories.value = [{data: { nodes: [], edges: [] }, name: "reset"}];
    updateData([], [], "reset", true);
    //currentData.value = { nodes: [], edges: [] };
    // index.value = 1;
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

  const updateData = (nodeData: GUINodeData[], edgeData: GUIEdgeData[], name: string, saveHistory: boolean) => {
    const data = { nodes: nodeData, edges: edgeData };
    currentData.value = data;
    if (saveHistory) {
      histories.value.length = index.value;
      histories.value.push({ data, name });
      index.value = index.value + 1;
    }
  };
  const saveNodeData = () => {
    // just special case. only use position update.
    histories.value.length = index.value;
    histories.value.push({ data: currentData.value, name: "position" });
    index.value = index.value + 1;
  };

  const initData = (nodeData: GUINodeData[], edgeData: GUIEdgeData[]) => {
    // this time, node position is not set. save after mounted.
    updateData(nodeData, edgeData, "init", false);
  };

  // node
  const pushNode = (nodeData: GUINodeData) => {
    updateData([...nodes.value, nodeData], [...edges.value], "addNode", true);
  };

  const updateNodePosition = (positionIndex: number, pos: { x: number; y: number; width: number; height: number }) => {
    const newNode = { ...nodes.value[positionIndex] };
    newNode.position = { ...newNode.position, ...pos };
    const newNodes = [...nodes.value];
    newNodes[positionIndex] = newNode;
    updateData(newNodes, [...edges.value], "updatePosition", false);
  };
  const updateNodeParam = (positionIndex: number, key: string, value: unknown) => {
    const newNode = { ...nodes.value[positionIndex] };
    if (value === "" || value === undefined || (value === null && newNode.data.params && newNode.data.params[key] !== undefined)) {
      // delete operation
      const { [key]: __, ...updatedParams } = newNode.data.params || {};
      newNode.data.params = updatedParams;
    } else {
      // upsert
      newNode.data.params = { ...(newNode.data.params || {}), [key]: value };
    }
    const newNodes = [...nodes.value];
    newNodes[positionIndex] = newNode;
    updateData(newNodes, [...edges.value], "updateParams", true);
  };
  const updateStaticNodeValue = (positionIndex: number, value: UpdateStaticValue) => {
    const newNode = { ...nodes.value[positionIndex] };
    newNode.data = { ...newNode.data, ...value };
    const newNodes = [...nodes.value];
    newNodes[positionIndex] = newNode;
    updateData(newNodes, [...edges.value], "updateStaticValue", true);
  };

  // edge
  const pushEdge = (edgeData: GUIEdgeData) => {
    updateData([...nodes.value], [...edges.value, edgeData], "addEdge", true);
  };
  const deleteEdge = (edgeIndex: number) => {
    updateData([...nodes.value], [...edges.value.filter((__, idx) => idx !== edgeIndex)], "deleteEdge", true);
  };
  const deleteNode = (nodeIndex: number) => {
    const node = nodes.value[nodeIndex];
    updateData(
      [...nodes.value.filter((__, idx) => idx !== nodeIndex)],
      [
        ...edges.value.filter((edge) => {
          const { source, target } = edge;
          return source.nodeId !== node.nodeId && target.nodeId !== node.nodeId;
        }),
      ],
      "deleteNode",
      true,
    );
  };

  // history api
  const undoable = computed(() => {
    return index.value > 1;
  });
  const undo = () => {
    if (undoable.value) {
      console.log(histories.value);
      currentData.value = histories.value[index.value - 2].data;
      index.value = index.value - 1;
    }
  };

  const redoable = computed(() => {
    return index.value < histories.value.length;
  });
  const redo = () => {
    if (redoable.value) {
      currentData.value = histories.value[index.value].data;
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
    updateNodeParam,
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
