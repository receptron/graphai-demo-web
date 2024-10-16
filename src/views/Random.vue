<template>
  <div class="home">
    <div class="items-center justify-center">
      <div>
        <div class="w-10/12 h-96 bg-white rounded-md mt-4 mx-auto border-2">
          <div ref="cytoscapeRef" class="w-full h-full" />
        </div>
      </div>
      <div class="mt-2">
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="run">Run</button>
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="logClear">Clear</button>
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="toggleZoom">
          Zoom({{ zoomingEnabled }})
        </button>
      </div>

      <div class="mt-2">
        <div>Static Node: <input type="number" class="border-2 rounded-md p-2" v-model="staticNode" /></div>
        <div>Dynamic Node: <input type="number" class="border-2 rounded-md p-2" v-model="computedNode" /></div>
        <div>Concurrency: <input type="number" class="border-2 rounded-md p-2" v-model="concurrency" /></div>
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="update">Update</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

import { GraphAI, agentInfoWrapper } from "graphai";
import { pushAgent, popAgent } from "@graphai/vanilla";

import { sleepTestAgent, httpAgent } from "@/utils/agents";

import { generateGraph } from "@/utils/graph";

// import { useCytoscape } from "@receptron/graphai_vue_cytoscape";
import { useCytoscape } from "../utils/cytoscape";

// const layouts = ["grid", "cose", "random", "circle", "concentric", "fcose", "breadthfirst"];

export default defineComponent({
  name: "HomePage",
  components: {},
  setup() {
    const staticNode = ref(20);
    const computedNode = ref(30);
    const concurrency = ref(8);

    const selectedGraph = ref(generateGraph(staticNode.value, computedNode.value));

    const { updateCytoscape, cytoscapeRef, resetCytoscape, zoomingEnabled  } = useCytoscape(selectedGraph);

    const graphaiResponse = ref({});
    const logs = ref<unknown[]>([]);

    const run = async () => {
      const graphai = new GraphAI(selectedGraph.value, {
        pushAgent,
        popAgent,
        sleepTestAgent: agentInfoWrapper(sleepTestAgent),
        httpAgent: agentInfoWrapper(httpAgent),
      });
      graphai.onLogCallback = ({ nodeId, state, inputs, result, errorMessage }) => {
        logs.value.push({ nodeId, state, inputs, result, errorMessage });
        updateCytoscape(nodeId, state);
        console.log(nodeId, state);
      };
      const results = await graphai.run();
      graphaiResponse.value = results;
    };
    const logClear = () => {
      logs.value = [];
      resetCytoscape();
    };
    const update = () => {
      console.log("update");
      selectedGraph.value = generateGraph(staticNode.value, computedNode.value, concurrency.value);
    };

    const toggleZoom = () => {
      zoomingEnabled.value = !zoomingEnabled.value;
    };

    return {
      run,
      logs,
      logClear,
      graphaiResponse,
      cytoscapeRef,
      selectedGraph,

      update,

      staticNode,
      computedNode,
      concurrency,

      toggleZoom,
      zoomingEnabled,

    };
  },
});
</script>
