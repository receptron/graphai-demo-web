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
      <div class="w-10/12 m-auto text-left">Transitions</div>
      <div class="flex">
        <div class="w-5/12 m-auto">
          <textarea class="border-2 p-2 w-full" rows="20">{{ transitions.join("\n") }}</textarea>
        </div>
        <div class="w-5/12 m-auto">
          <textarea class="border-2 p-2 w-full" rows="20">{{ output }}</textarea>
        </div>
      </div>

      <div class="mt-2">Graph Data</div>
      <div class="w-10/12 m-auto font-mono">
        <textarea class="border-2 p-2 rounded-md w-full" rows="20">{{ selectedGraph }}</textarea>
      </div>
      <div>Result</div>
      <div class="w-10/12 m-auto">
        <textarea class="border-2 p-2 w-full" rows="20">{{ graphaiResponse }}</textarea>
      </div>
      <div>Logs</div>
      <div class="w-10/12 m-auto">
        <textarea class="border-2 p-2 w-full" rows="20">{{ logs }}</textarea>
      </div>
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

export default defineComponent({
  name: "HomePage",
  components: {},
  setup() {
    const graphData = getGraphData(10, 5);

    const selectedGraph = computed(() => {
      return graphData;
    });

    const { updateCytoscape, cytoscapeRef, resetCytoscape } = useCytoscape(selectedGraph);

    const graphaiResponse = ref({});
    const logs = ref<unknown[]>([]);
    const transitions = ref<unknown[]>([]);
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

      // console.log({ code, ideaStrArchive, prompt });

      graphai.onLogCallback = ({ nodeId, state, inputs, result, errorMessage }) => {
        if (logs.value.length > 0 && (logs.value[logs.value.length - 1] as { nodeId: string }).nodeId === nodeId) {
          transitions.value[transitions.value.length - 1] += " → " + state;
        } else {
          transitions.value.push(nodeId + ": " + state);
        }
        logs.value.push({ nodeId, state, inputs, result, errorMessage });
        updateCytoscape(nodeId, state);
        // console.log(nodeId, state, result);
        if (state === "completed" && result) {
          if (nodeId === "task2") {
            // console.log(result.message.content);
            output.value = (result as { message: { content: string } }).message.content;
          }
        }
      };
      const results = await graphai.run();
      graphaiResponse.value = results;
    };
    const logClear = () => {
      logs.value = [];
      transitions.value = [];

      resetCytoscape();
    };

    return {
      run,
      logs,
      transitions,
      logClear,
      graphaiResponse,
      cytoscapeRef,
      selectedGraph,
      output,
    };
  },
});
</script>
