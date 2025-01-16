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
            <div v-if="m.role === 'user'" class="mr-8">👱{{ m.content }}</div>
            <div class="ml-20" v-else>🤖{{ m.content }}</div>
          </div>
          <div class="ml-20" v-if="isStreaming">🤖{{ streamData["llm"] }}</div>
        </div>
      </div>
      <div class="mt-2 hidden">
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="run">Run</button>
      </div>

      <div>
        <div class="w-10/12 m-auto my-4">
          <div v-if="inputPromises.length > 0" class="font-bold text-red-600 hidden">Write message to bot!!</div>
          <div class="flex">
            <input v-model="userInput" class="border-2 p-2 rounded-md flex-1" :disabled="inputPromises.length == 0" />
            <button
              class="text-white font-bold items-center rounded-md px-4 py-2 ml-1 hover:bg-sky-700 flex-none"
              :class="inputPromises.length == 0 ? 'bg-sky-200' : 'bg-sky-500'"
              @click="callSubmit"
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      <div class="mt-2">
        <div class="article-list m-2 border-2 text-left" v-html="md.render(markdown)" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";

import { GraphAI } from "graphai";
import * as agents from "@graphai/vanilla";

import { graphMarkdown } from "@/graph/markdown";
import { openAIAgent } from "@graphai/openai_agent";
// import updateTextAgent from "../agents/update_text_agent";

import { useStreamData } from "@/utils/stream";

import { useCytoscape } from "@receptron/graphai_vue_cytoscape";
import { textInputAgentGenerator, InputPromises } from "@receptron/text_input_agent_generator";

import MarkdownIt from "markdown-it";

export default defineComponent({
  name: "HomePage",
  components: {},
  setup() {
    const selectedGraph = computed(() => {
      return graphMarkdown;
    });

    // input
    const userInput = ref("");
    const inputPromises = ref<InputPromises>([]);
    const { textInputAgent, submit } = textInputAgentGenerator(inputPromises.value);
    const callSubmit = () => {
      submit(inputPromises.value[0].id, userInput.value, () => {
        userInput.value = "";
      });
    };
    // end of input

    const { updateCytoscape, cytoscapeRef } = useCytoscape(selectedGraph);

    // streaming
    const { streamData, streamAgentFilter, resetStreamData } = useStreamData();
    const agentFilters = [
      {
        name: "streamAgentFilter",
        agent: streamAgentFilter,
      },
    ];
    // end of streaming

    const messages = ref<{ role: string; content: string }[]>([]);
    const graphaiResponse = ref({});
    const isStreaming = ref(false);
    const markdown = ref("#hello");

    const run = async () => {
      const graphai = new GraphAI(
        selectedGraph.value,
        {
          ...agents,
          openAIAgent,
          textInputAgent,
        },
        {
          agentFilters,
          config: {
            openAIAgent: {
              apiKey: import.meta.env.VITE_OPEN_API_KEY,
            },
          },
        },
      );
      graphai.onLogCallback = ({ nodeId, state, result }) => {
        updateCytoscape(nodeId, state);
        console.log(nodeId, state, result);
        if (state === "completed" && result) {
          if (nodeId === "llm") {
            isStreaming.value = false;
            messages.value.push((result as { message: { role: string; content: string } }).message);
          }
          if (nodeId === "userInput") {
            messages.value.push((result as { message: { role: string; content: string } }).message);
          }
        }
        if (nodeId === "updateText" && result) {
          markdown.value = (result as { text: string }).text;
        }
        if (nodeId === "llm") {
          if (state === "queued") {
            resetStreamData("llm");
          }
          if (state === "executing") {
            isStreaming.value = true;
          }
        }
      };
      const results = await graphai.run();
      graphaiResponse.value = results;
    };
    run();

    return {
      run,
      graphaiResponse,
      cytoscapeRef,
      selectedGraph,
      streamData,
      isStreaming,

      callSubmit,
      userInput,
      messages,
      inputPromises,
      markdown,

      md: new MarkdownIt(),
    };
  },
});
</script>
