<template>
  <div class="home">
    <div class="items-center justify-center">
      <div>
        <div class="w-10/12 h-60 bg-white rounded-md mt-4 p-2 mx-auto border-2">
          <div ref="cytoscapeRef" class="w-full h-full" />
        </div>
      </div>
      <div class="mt-2">
        <div class="w-10/12 m-auto text-left">
          <div v-for="(m, k) in messages" :key="k">
            <div v-if="m.role !== 'interviewer'" class="mr-8">👱{{ m.content }}</div>
            <div class="ml-20" v-else>🤖{{ m.content }}</div>
          </div>
          <div class="ml-20" v-if="isStreaming['translate'] && currentRole === 'interviewer'">🤖{{ streamData["translate"] }}</div>
          <div class="mr-8" v-if="isStreaming['translate'] && currentRole !== 'interviewer'">👱{{ streamData["translate"] }}</div>
        </div>
      </div>
      <div class="mt-2 hidden">
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="run">Run</button>
      </div>

      <div>
        <div class="w-10/12 m-auto my-4">
          <div class="flex">
            <input v-model="userInput" @keyup.enter="callSubmit" class="border-2 p-2 rounded-md flex-1" :disabled="isSubmit" />
            <button
              class="text-white font-bold items-center rounded-md px-4 py-2 ml-1 hover:bg-sky-700 flex-none"
              :class="isSubmit ? 'bg-sky-200' : 'bg-sky-500'"
              @click="callSubmit"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";

import { GraphAI } from "graphai";
import * as agents from "@graphai/vanilla";

import { graph_data } from "@/graph/interview";
import { openAIAgent } from "@graphai/openai_agent";

import { useStreamData } from "@/composables/useStreamData";
import { useChatPlugin } from "../utils/graphai";

import { useCytoscape } from "@receptron/graphai_vue_cytoscape";

export default defineComponent({
  name: "HomePage",
  components: {},
  setup() {
    const selectedGraph = computed(() => {
      return graph_data;
    });

    // input
    const userInput = ref("トム・クルーズ");
    const isSubmit = ref(false);
    const currentRole = ref("");

    const callSubmit = () => {
      isSubmit.value = true;
      run();
    };
    // end of input

    const { updateCytoscape, cytoscapeRef } = useCytoscape(selectedGraph);

    // streaming
    const { streamData, streamAgentFilter, streamPlugin, isStreaming } = useStreamData();
    const agentFilters = [
      {
        name: "streamAgentFilter",
        agent: streamAgentFilter,
      },
    ];
    // end of streaming

    const { messages, chatMessagePlugin } = useChatPlugin();
    const run = async () => {
      const graphai = new GraphAI(
        selectedGraph.value,
        {
          ...agents,
          openAIAgent,
        },
        {
          agentFilters,
          config: {
            openAIAgent: {
              apiKey: import.meta.env.VITE_OPEN_API_KEY,
              forWeb: true,
              stream: true,
            },
          },
        },
      );
      graphai.injectValue("name", userInput.value);
      graphai.registerCallback(updateCytoscape);
      graphai.registerCallback(chatMessagePlugin(["output"]));
      graphai.registerCallback(({ nodeId, result }) => {
        if (nodeId === "context" && result) {
          currentRole.value = (result as { person1: { name: string } }).person1.name;
        }
      });
      graphai.registerCallback(streamPlugin(["translate"]));

      await graphai.run();
    };

    return {
      run,

      cytoscapeRef,
      selectedGraph,
      streamData,
      isStreaming,

      callSubmit,
      userInput,
      messages,
      currentRole,
      isSubmit,
    };
  },
});
</script>
