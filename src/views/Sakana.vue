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
      <div class="w-10/12 m-auto">
        <textarea class="border-2 p-2 w-full" rows="20">{{ transitions.join("\n") }}</textarea>
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

import { GraphAI, AgentFunction, AgentFilterFunction, AgentFilterInfo, sleep } from "graphai";
import * as agents from "@graphai/vanilla";
import { agentInfoWrapper } from "graphai/lib/utils/utils";

import { graphReception } from "@/utils/graph_data";
import { openAIAgent } from "@graphai/openai_agent";
import { httpAgentFilter } from "@graphai/agent_filters";
import { getGraphData, code, seedIdeas, prompt } from "../utils/sakana/graph";

import { useCytoscape } from "@receptron/graphai_vue_cytoscape";

export default defineComponent({
  name: "HomePage",
  components: {},
  setup() {

    const graphData = getGraphData(10,5);

    const selectedGraph = computed(() => {
      return graphData;
    });

    const { updateCytoscape, cytoscapeRef, resetCytoscape } = useCytoscape(selectedGraph);

    const messages = ref<{ role: string; content: string }[]>([]);
    const graphaiResponse = ref({});
    const logs = ref<unknown[]>([]);
    const transitions = ref<unknown[]>([]);

    const run = async () => {
      const graphai = new GraphAI(
        selectedGraph.value,
        {
          ...agents,
          openAIAgent,
        },
      );
      const ideaStrArchive = seedIdeas.map((m: unknown) => JSON.stringify(m));

      graphai.injectValue("idea_str_archive", ideaStrArchive);
      graphai.injectValue("ideaSystemPrompt", prompt["system"]);
      graphai.injectValue("taskDescription", prompt["task_description"]);
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
        console.log(nodeId, state, result);
        if (state === "completed" && result) {
          if (nodeId === "llm_tools") {
            if ((result as { tool: { arguments: string } })?.tool?.arguments) {
              messages.value.push({ role: "bot", content: (result as { tool: { arguments: string } })?.tool.arguments });
            } else {
              messages.value.push({ role: "bot", content: (result as { text: string }).text });
            }
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

    };
  },
});
</script>
