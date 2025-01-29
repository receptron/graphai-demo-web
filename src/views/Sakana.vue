<template>
  <div class="home">
    <div class="items-center justify-center">
      <div>
        <div class="w-10/12 h-96 bg-white rounded-md mt-4 p-2 mx-auto border-2">
          <div ref="cytoscapeRef" class="w-full h-full" />
        </div>
      </div>
      <div class="mt-2 hidden">
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="run">Run</button>
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="logClear">Clear</button>
      </div>

      <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="run">Run</button>
      <div class="flex items-start w-10/12 m-auto">
        <div class="w-1/2">
          <div v-for="(nodeId, key) in Object.keys(transitions)" :key="key">
            <div>
              <div @click="toggle(nodeId)" :class="color(transitions[nodeId].state)" class="text-left border-2 m-1 p-1 text-white font-bold cursor-pointer">
                {{ nodeId }} / {{ transitions[nodeId].state }}
              </div>
              <div v-if="transitionToggles[nodeId]">
                <div
                  v-for="(log, logKey) in transitions[nodeId].log"
                  class="border-2 m-1 p-1 font-bold"
                  :class="truncate(nodeId, logKey)"
                  :key="logKey"
                  @click="toggleTruncate(nodeId, logKey)"
                >
                  <div v-if="log.state === 'executing'">{{ log.state }} {{ log.inputs }} {{ log.updated }}</div>
                  <div v-else-if="log.state === 'completed'">{{ log.state }} {{ log.result }} {{ log.updated }}</div>
                  <div v-else>{{ log.state }} {{ log.updated }}</div>
                </div>
              </div>
              <div class="truncate cursor-pointer" @click="toggle(nodeId)" v-else>
                {{ transitions[nodeId].log.slice(-1) }}
              </div>
            </div>
          </div>
        </div>
        <div class="w-1/2">
          <textarea class="border-2 p-2 w-full m-1" rows="20">{{ output }}</textarea>
        </div>
      </div>

      <GraphData :selected-graph="selectedGraph" />
      <Result :graphai-response="graphaiResponse" />
      <Logs :logs="logs" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";

import { GraphAI } from "graphai";
import * as agents from "@graphai/vanilla";

import { openAIAgent } from "@graphai/openai_agent";
import { getGraphData, code, seedIdeas, prompt } from "../utils/sakana/graph";

import { useCytoscape } from "@receptron/graphai_vue_cytoscape";

import GraphData from "../components/GraphData.vue";
import Result from "../components/Result.vue";
import Logs from "../components/Logs.vue";

export default defineComponent({
  name: "HomePage",
  components: {
    GraphData,
    Result,
    Logs,
  },
  setup() {
    const graphData = getGraphData(10, 5);

    const selectedGraph = computed(() => {
      return graphData;
    });

    const { updateCytoscape, cytoscapeRef, resetCytoscape } = useCytoscape(selectedGraph);

    const graphaiResponse = ref({});
    const logs = ref<unknown[]>([]);
    const transitions = ref<
      Record<string, { state: string; log: { state: string; updated: number; inputs?: unknown; result?: unknown; errorMessage: unknown }[] }>
    >({});
    const output = ref("");

    const run = async () => {
      const graphai = new GraphAI(selectedGraph.value, {
        ...agents,
        openAIAgent,
      });
      const ideaStrArchive = seedIdeas.map((message: unknown) => JSON.stringify(message));

      graphai.injectValue("idea_str_archive", ideaStrArchive);
      graphai.injectValue("ideaSystemPrompt", prompt.system);
      graphai.injectValue("taskDescription", prompt.task_description);
      graphai.injectValue("code", code);

      graphai.registerCallback(updateCytoscape);
      graphai.registerCallback((log) => {
        const { nodeId, state, inputs, result, errorMessage } = log;
        if (transitions.value[nodeId]) {
          transitions.value[nodeId].state = state;
        } else {
          transitions.value[nodeId] = { state, log: [] };
        }
        transitions.value[nodeId].log.push({ inputs, result, state, errorMessage, updated: Date.now() });
        logs.value.push({ inputs, result });
      });
      graphai.registerCallback((log) => {
        const { nodeId, state, result } = log;
        if (state === "completed" && result && nodeId === "task2") {
          output.value = (result as { message: { content: string } }).message.content;
        }
      });
      const results = await graphai.run();
      graphaiResponse.value = results;
    };
    const logClear = () => {
      logs.value = [];
      transitions.value = {};

      resetCytoscape();
    };

    const color = (state: string) => {
      if (state === "executing") {
        return "bg-green-500";
      }
      if (state === "updated") {
        return "bg-black";
      }
      if (state === "completed") {
        return "bg-black";
      }
      if (state === "waiting") {
        return "bg-gray-500";
      }
      if (state === "injected") {
        return "bg-blue-500";
      }
      console.log(state);
      return "";
    };
    const transitionToggles = ref<Record<string, boolean>>({});
    const toggle = (nodeId: string) => {
      transitionToggles.value[nodeId] = !transitionToggles.value[nodeId];
    };
    const toggleTruncateData = ref<Record<string, Record<string, boolean>>>({});
    const truncate = (nodeId: string, key: number) => {
      if (toggleTruncateData.value[nodeId] && toggleTruncateData.value[nodeId][String(key)]) {
        return "bg-gray-100";
      }
      return "truncate";
    };
    const toggleTruncate = (nodeId: string, key: number) => {
      if (!toggleTruncateData.value[nodeId]) {
        toggleTruncateData.value[nodeId] = {};
      }
      toggleTruncateData.value[nodeId][String(key)] = !toggleTruncateData.value[nodeId][String(key)];
    };
    return {
      color,
      run,
      logs,
      transitions,
      logClear,
      graphaiResponse,
      cytoscapeRef,
      selectedGraph,
      output,

      transitionToggles,
      toggle,

      truncate,
      toggleTruncate,
    };
  },
});
</script>
