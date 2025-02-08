import { ref, computed } from "vue";
import { GUINodeData, GUIEdgeData } from "../views/gui/type";
import { agent2NodeParams } from "../views/gui/utils";
import { defineStore } from "pinia";
import { NodeData, StaticNodeData } from "graphai";
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
    return edges.value
      .map((edge) => {
        const { from: fromEdge, to: toEdge } = edge;

        const fromNode = nodeRecords.value[fromEdge.nodeId];
        const toNode = nodeRecords.value[toEdge.nodeId];
        const fromData = (() => {
          if (fromNode && fromNode.type === "computed") {
            const fromAgent = fromNode.guiAgentId ?? fromNode.agent ?? ""; // undefined is static node.
            const props = agent2NodeParams[fromAgent].outputs[fromEdge.index]?.name;
            return `:${fromEdge.nodeId}.${props}`;
          }
          return `:${fromEdge.nodeId}`;
        })();
        const toPropId = (() => {
          if (toNode && toNode.type === "computed") {
            const toAgent = toNode.guiAgentId ?? toNode.agent ?? ""; // undefined is static node.
            const toProp = agent2NodeParams[toAgent].inputs[toEdge.index]?.name;
            return toProp;
          }
          return "update";
        })();

        return {
          fromData,
          toNodeId: toEdge.nodeId,
          toPropId,
        };
      })
      .reduce((tmp: Record<string, Record<string, string[]>>, current) => {
        if (!tmp[current.toNodeId]) {
          tmp[current.toNodeId] = {};
        }
        if (!tmp[current.toNodeId][current.toPropId]) {
          tmp[current.toNodeId][current.toPropId] = [];
        }
        tmp[current.toNodeId][current.toPropId].push(current.fromData);
        return tmp;
      }, {});
  });
  const graphData = computed(() => {
    console.log(edges.value);
    console.log(edgeObject.value);

    const newNodes = nodes.value.reduce((tmp: Record<string, NodeData>, node) => {
      const inputs = edgeObject.value[node.nodeId];
      console.log(edgeObject.value, node.nodeId);
      if (node.agent) {
        tmp[node.nodeId] = {
          agent: node.agent,
          params: node.params,
          inputs: inputs ?? {},
          // isResult: true,
          // anyInput (boolean)
          // if/unless (edge)
          // defaultValue (object?)
          // retry ?
        };
      } else {
        tmp[node.nodeId] = {
          value: node.value,
          ...inputs,
        } as StaticNodeData;
      }
      return tmp;
    }, {});
    const newGraphData = {
      version: 0.5,
      nodes: newNodes,
    };
    return newGraphData;
    // nodes.
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
