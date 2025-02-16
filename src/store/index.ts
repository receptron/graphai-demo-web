import { ref, computed } from "vue";
import { GUINodeData, GUIEdgeData, GUINodeDataRecord, UpdateStaticValue, HistoryData, HistoryPayload, LoopData } from "../utils/gui/type";
import { edges2inputs, store2graphData } from "../utils/gui/utils";
import { defineStore } from "pinia";

export const useStore = defineStore("store", () => {
  const histories = ref<HistoryData[]>([]);
  const currentData = ref<HistoryPayload>({ nodes: [], edges: [], loop: { loopType: "none" } });
  const index = ref(0);

  const reset = () => {
    updateData([], [], "reset", true);
  };

  const nodes = computed(() => {
    return currentData.value.nodes;
  });

  const edges = computed(() => {
    return currentData.value.edges;
  });

  const loop = computed(() => {
    return currentData.value.loop;
  });
  // stpre loop 2 graph loop
  const loopObj = computed(() => {
    if (loop.value.loopType === "while") {
      return {
        while: loop.value.while,
      };
    }
    if (loop.value.loopType === "count") {
      return {
        count: loop.value.count,
      };
    }
    return {};
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
    return store2graphData(nodeRecords.value, edgeObject.value, loopObj.value, currentData.value);
  });
  const streamNodes = computed(() => {
    return nodes.value
      .filter((node) => {
        return node.data?.params?.stream ?? false;
      })
      .map((node) => node.nodeId);
  });
  const resultNodes = computed(() => {
    return nodes.value
      .filter((node) => {
        return node.data?.params?.isResult ?? false;
      })
      .map((node) => node.nodeId);
  });
  // end of computed

  const loadData = (data: HistoryPayload) => {
    currentData.value = data;
    pushDataToHistory("load", data);
  };
  const updateData = (nodeData: GUINodeData[], edgeData: GUIEdgeData[], name: string, saveHistory: boolean) => {
    const data = { nodes: nodeData, edges: edgeData, loop: loop.value };
    currentData.value = data;
    if (saveHistory) {
      pushDataToHistory(name, data);
    }
  };
  const pushDataToHistory = (name: string, data: HistoryPayload) => {
    // don't call directory.
    histories.value.length = index.value;
    histories.value.push({ data, name });
    index.value = index.value + 1;
  };
  const saveNodePositionData = () => {
    // just special case. only use position update.
    pushDataToHistory("position", currentData.value);
  };

  const initData = (nodeData: GUINodeData[], edgeData: GUIEdgeData[], loopData: LoopData) => {
    const data = { nodes: nodeData, edges: edgeData, loop: loopData };
    currentData.value = data;
    // this time, node position is not set. save after mounted.
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
    const oldNode = nodes.value[positionIndex];
    const newNode = {
      ...oldNode,
      data: {
        ...oldNode.data,
        params: oldNode.data.params ? { ...oldNode.data.params } : {},
      },
    };

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
  const updateStaticNodeValue = (positionIndex: number, value: UpdateStaticValue, saveHistory: boolean) => {
    const newNode = { ...nodes.value[positionIndex] };
    newNode.data = { ...newNode.data, ...value };
    const newNodes = [...nodes.value];
    newNodes[positionIndex] = newNode;
    updateData(newNodes, [...edges.value], "updateStaticValue", saveHistory);
  };

  const updateLoop = (loopData: LoopData) => {
    const data = { nodes: nodes.value, edges: edges.value, loop: loopData };
    console.log(data);
    currentData.value = data;
    pushDataToHistory("loopUpdate", data);
    // console.log(loopData)
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
    // pushDataToHistory,
    saveNodePositionData,

    loadData,

    updateStaticNodeValue,
    updateLoop,

    undo,
    redo,

    reset,

    // computed
    nodes,
    edges,
    loop,
    graphData,
    nodeRecords,
    streamNodes,
    resultNodes,

    undoable,
    redoable,
  };
});
