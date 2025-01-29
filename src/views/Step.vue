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
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="nextRun">Next</button>
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="saveLayoutCytoscape">Save</button>
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="loadLayoutCytoscape">Load</button>
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="toggleZoom">
          Zoom({{ zoomingEnabled }})
        </button>
      </div>

      <div>
        <select v-model="selectedGraphIndex" class="border rounded-md p-2 m-2">
          <option v-for="(option, index) in graphDataSet" :value="index" :key="index">
            {{ option.name }}
          </option>
        </select>
      </div>

      <div v-if="selectedGraphName === 'stream'">
        <div>streamData</div>
        <div class="w-10/12 m-auto">
          <textarea class="border-2 p-2 w-full" rows="20">{{ streamData }}</textarea>
        </div>
      </div>
      <div v-if="selectedGraphName === 'stream2'">
        <div>streamData</div>
        <div class="w-10/12 m-auto">
          <textarea class="border-2 p-2 w-full" rows="20">{{ Object.values(words).map((a) => a.join(" ")) }}</textarea>
        </div>
      </div>

      <div class="mt-2">Graph Data</div>
      <div class="w-10/12 m-auto">
        <textarea class="border-2 p-2 w-full" rows="20">{{ selectedGraph }}</textarea>
      </div>
      <div>Result</div>
      <div class="w-10/12 m-auto">
        <textarea class="border-2 p-2 w-full" rows="20">{{ graphaiResponse }}</textarea>
      </div>
      <div>Log</div>
      <div class="w-10/12 m-auto">
        <textarea class="border-2 p-2 w-full" rows="20">{{ logs }}</textarea>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from "vue";

import { GraphAI, AgentFilterFunction } from "graphai";
import * as agents from "@graphai/vanilla";
import { agentInfoWrapper } from "graphai/lib/utils/utils";

import { sleepTestAgent, httpAgent, slashGPTFuncitons2TextAgent } from "@/utils/agents";
import { generateGraph } from "@/utils/graph";
import { graph_data, graph_data2, graph_data_co2, graph_data_http, graph_data_stream } from "@/graph/graph_data";
import { graph_data_morning } from "@/utils/morning";

import { useStreamData, useGraphData } from "@/utils/stream";

import { useCytoscape } from "@receptron/graphai_vue_cytoscape";

export default defineComponent({
  name: "HomePage",
  components: {},
  setup() {
    const { graphdata_any, words } = useGraphData();
    const graph_random = generateGraph();
    const graphDataSet = [
      { name: "sample2", data: graph_data2 },
      { name: "sample", data: graph_data },
      { name: "random", data: graph_random },
      { name: "http", data: graph_data_http },
      { name: "co2", data: graph_data_co2 },
      { name: "stream", data: graph_data_stream },
      { name: "stream2", data: graphdata_any },
      { name: "morning", data: graph_data_morning },
    ];

    const selectedGraphIndex = ref(0);
    const selectedGraph = computed(() => {
      return graphDataSet[selectedGraphIndex.value].data;
    });
    const selectedGraphName = computed(() => {
      return graphDataSet[selectedGraphIndex.value].name;
    });

    const { updateCytoscape, cytoscapeRef, resetCytoscape, layoutCytoscape, loadLayout, zoomingEnabled } = useCytoscape(selectedGraph);

    const { streamData, streamAgentFilter } = useStreamData();

    const eventQueue: (() => void)[] = [];
    watch(selectedGraphIndex, () => {
      eventQueue.splice(0);
    });
    const waitAction = () => {
      return new Promise((resolve) => {
        const onClickHandler = () => {
          resolve(true);
        };
        eventQueue.push(onClickHandler);
      });
    };

    const awaitActionFilter: AgentFilterFunction = async (context, next) => {
      const res = await next(context);
      await waitAction();
      return res;
    };
    const agentFilters = [
      {
        name: "streamAgentFilter",
        agent: streamAgentFilter,
      },
      {
        name: "awaitActionFilter",
        agent: awaitActionFilter,
      },
    ];
    const nextRun = () => {
      const event = eventQueue.shift();
      if (event) {
        event();
      }
    };

    const graphaiResponse = ref({});
    const logs = ref<unknown[]>([]);

    const run = async () => {
      const graphai = new GraphAI(
        selectedGraph.value,
        {
          ...agents,
          sleepTestAgent: agentInfoWrapper(sleepTestAgent),
          httpAgent: agentInfoWrapper(httpAgent),
          slashGPTFuncitons2TextAgent: agentInfoWrapper(slashGPTFuncitons2TextAgent),
        },
        { agentFilters },
      );
      graphai.registerCallback(updateCytoscape);
      graphai.registerCallback((log) => {
        logs.value.push(log);
      });
      const results = await graphai.run();
      graphaiResponse.value = results;
    };
    const logClear = () => {
      logs.value = [];
      eventQueue.splice(0);

      resetCytoscape();
    };

    const saveLayoutCytoscape = () => {
      layoutCytoscape(selectedGraphName.value);
    };
    const loadLayoutCytoscape = () => {
      loadLayout(selectedGraphName.value);
    };
    const toggleZoom = () => {
      zoomingEnabled.value = !zoomingEnabled.value;
    };

    return {
      run,
      nextRun,
      logs,
      logClear,
      graphaiResponse,
      cytoscapeRef,
      selectedGraphIndex,
      selectedGraphName,
      selectedGraph,
      graphDataSet,
      streamData,
      words,

      saveLayoutCytoscape,
      loadLayoutCytoscape,
      toggleZoom,
      zoomingEnabled,
    };
  },
});
</script>
