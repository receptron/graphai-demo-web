<template>
  <div class="home">
    <div class="items-center justify-center space-x-8">
      <!-- Use Tailwind CSS h-40 (=10rem=160px) instead of .logo. -->
      <div class="w-full h-96 bg-white rounded-md mt-4 mx-auto border-2">
        <div ref="cyRef" class="w-full h-full" />
      </div>
      <div class="mt-2">
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="run">Run</button>
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="logClear">Clear</button>
      </div>

      <select v-model="selectedGraphIndex" class="border rounded-md p-2 m-2">
        <option v-for="(option, index) in graphDataSet" :value="index" :key="index">
          {{ option.name }}
        </option>
      </select>

      <div class="mt-2">Graph Data</div>
      <div class="w-6/8">
        <textarea class="border-8" rows="20" cols="100">{{ selectedGraph }}</textarea>
      </div>
      <div>Result</div>
      <div class="w-6/8">
        <textarea class="border-8" rows="20" cols="100">{{ res }}</textarea>
      </div>
      <div>Log</div>
      <div>
        <textarea class="border-8" rows="20" cols="100">{{ logs }}</textarea>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, computed } from "vue";

import { GraphAI, GraphData, AgentFunction } from "graphai";
import { NodeState, NodeData } from "graphai/lib/type";
import { pushAgent, popAgent } from "graphai/lib/experimental_agents/array_agents";
import { sleep } from "@/utils/utils";
import { generateGraph } from "@/utils/graph";

import { graph_data, graph_data2 } from "@/utils/graph_data";

import cytoscape, {
  //  ElementDefinition,
  //  ElementsDefinition,
  // Position,
  // EventObject,
  Core,
  NodeSingular,
  NodeDefinition,
  EdgeDefinition,
  EdgeSingular,
} from "cytoscape";
import fcose from "cytoscape-fcose";

cytoscape.use(fcose);

// const layouts = ["grid", "cose", "random", "circle", "concentric", "fcose", "breadthfirst"];

const calcNodeWidth = (label: string) => {
  if (label === null || label === undefined) {
    return "50px";
  }
  return Math.max(50, label.length * 8) + "px";
};

const parseInput = (input: string) => {
  const ids = input.split(".");
  const source = ids.shift() || "";
  const label = ids.length ? ids.join(".") : undefined;
  return { source, label };
};

const cyStyle = [
  {
    selector: "node",
    style: {
      "background-color": "data(color)",
      label: "data(id)",
      shape: (ele: NodeSingular) => (ele.data("isStatic") ? "rectangle" : "roundrectangle"),
      width: (ele: EdgeSingular) => calcNodeWidth(ele.data("id")),
      color: "#fff",
      height: "30px",
      "text-valign": "center" as const,
      "text-halign": "center" as const,
      "font-size": "12px",
    },
  },
  {
    selector: "edge",
    style: {
      width: 3,
      "line-color": "#888",
      "target-arrow-color": "#888",
      "target-arrow-shape": "triangle",
      "curve-style": "unbundled-bezier" as const,
      "text-background-color": "#ffffff",
      "text-background-opacity": 0.8,
      "text-background-shape": "rectangle" as const,
      "font-size": "10px",
    },
  },
  {
    selector: "edge[label]",
    style: {
      label: "data(label)",
    },
  },
  {
    selector: "edge[isUpdate]",
    style: {
      color: "#ddd",
      "line-color": "#ddd",
      "line-style": "dashed",
      "target-arrow-color": "#ddd",
    },
  },
];

const colorMap = {
  [NodeState.Waiting]: "#888",
  [NodeState.Completed]: "#000",
  [NodeState.Executing]: "#0f0",
  [NodeState.Queued]: "#ff0",
  [NodeState.Injected]: "#00f",
  [NodeState.TimedOut]: "#f0f",
  [NodeState.Failed]: "#f00",
};

const cytoscapeFromGraph = (graph_data: GraphData) => {
  const elements = Object.keys(graph_data.nodes).reduce(
    (tmp: { nodes: NodeDefinition[]; edges: EdgeDefinition[]; map: Record<string, NodeDefinition> }, nodeId) => {
      const node: NodeData = graph_data.nodes[nodeId];
      const cyNode = {
        data: {
          id: nodeId,
          color: colorMap[NodeState.Waiting],
          isStatic: "value" in node,
        },
      };
      tmp.nodes.push(cyNode);
      tmp.map[nodeId] = cyNode;
      if ("inputs" in node) {
        // computed node
        (node.inputs ?? []).forEach((input: string) => {
          const { source, label } = parseInput(input);
          tmp.edges.push({
            data: {
              source,
              target: nodeId,
              label,
            },
          });
        });
      }
      if ("update" in node && node.update) {
        // static node
        const { source, label } = parseInput(node.update);
        tmp.edges.push({
          data: {
            source,
            target: nodeId,
            isUpdate: true,
            label,
          },
        });
      }
      return tmp;
    },
    { nodes: [], edges: [], map: {} },
  );
  return { elements };
};

export const sleepTestAgent: AgentFunction<{ duration?: number }> = async (context) => {
  const { params, inputs } = context;
  await sleep(params?.duration ?? 500);
  return inputs[0];
};

export default defineComponent({
  name: "HomePage",
  components: {},
  setup() {
    const cyRef = ref();

    const selectedGraphIndex = ref(0);
    const graph_random = generateGraph() as GraphData;
    const graphDataSet = [
      { name: "sample2", data: graph_data2 },
      { name: "sample", data: graph_data },
      { name: "random", data: graph_random },
    ];
    const cytoData = ref(cytoscapeFromGraph(graphDataSet[0].data));

    const res = ref({});
    const logs = ref<unknown[]>([]);
    let cy: null | Core = null;

    const selectedGraph = computed(() => {
      return graphDataSet[selectedGraphIndex.value].data;
    });
    watch(selectedGraph, () => {
      cytoData.value = cytoscapeFromGraph(selectedGraph.value);
    });

    const run = async () => {
      const graph = new GraphAI(selectedGraph.value, { pushAgent, popAgent, sleepTestAgent });
      graph.onLogCallback = async ({ nodeId, state, inputs, result, errorMessage }) => {
        logs.value.push({ nodeId, state, inputs, result, errorMessage });
        console.log();

        console.log(nodeId, state);
        const elements = cytoData.value.elements;
        if (state === NodeState.Completed) {
          await sleep(100);
        }
        elements.map[nodeId].data.color = colorMap[state];
        if (state === NodeState.Queued) {
          const graph = selectedGraph.value;
          const nodeData = graph.nodes[nodeId]; // REVIEW: ComputedNodeData
          if ("priority" in nodeData && (nodeData.priority ?? 0) > 0) {
            elements.map[nodeId].data.color = "#f80";
          }
        }

        cytoData.value = { elements };
        if (state === NodeState.Injected) {
          await sleep(100);
          elements.map[nodeId].data.color = colorMap[NodeState.Waiting];
          cytoData.value = { elements };
        }
      };
      const results = await graph.run();
      res.value = results;
    };
    const logClear = () => {
      logs.value = [];
      const elements = cytoData.value.elements;
      Object.keys(elements.map).forEach((nodeId) => {
        elements.map[nodeId].data.color = colorMap[NodeState.Waiting];
      });
      cytoData.value = { elements };
    };

    const storePositions = () => {
      console.log("storePositions");
      if (cy) {
        cy.nodes().forEach((cynode: NodeSingular) => {
          const id = cynode.id();
          const pos = cynode.position();
          const node = cytoData.value.elements.map[id];
          node.position = pos;
        });
      }
    };

    const createCytoscope = () => {
      try {
        cy = cytoscape({
          container: cyRef.value,
          style: cyStyle,
          layout: {
            name: "cose",
            fit: true,
            padding: 30,
            avoidOverlap: true,
          },
        });
        cy.on("mouseup", storePositions);
        cy.on("touchend", storePositions);
        // cy.on("select", "node", callback);
        // cy.on("select", "edge", callback);
        //store.commit("setCytoscape", cy);
      } catch (error) {
        console.error(error);
        // store.commit("setCytoscape", null);
        // error_msg.value = `${error}`;
      }
    };
    const updateGraphData = async () => {
      if (cy) {
        cy.elements().remove();
        cy.add(cytoData.value.elements);
        const name = cytoData.value.elements.nodes.reduce((prevName: string, node: NodeDefinition) => {
          if (node.position) {
            return "preset";
          }
          return prevName;
        }, "cose");
        console.log("layout", name);
        cy.layout({ name }).run();
        cy.fit();
        if (name === "cose") {
          await sleep(400);
          storePositions();
        }
      }
    };
    watch(cytoData, () => {
      console.log("updated");
      updateGraphData();
    });

    onMounted(() => {
      createCytoscope();
      updateGraphData();
    });

    return {
      run,
      logs,
      logClear,
      graph_data,
      res,
      cyRef,
      selectedGraphIndex,
      selectedGraph,
      graphDataSet,
    };
  },
});
</script>
