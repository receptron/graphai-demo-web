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
          <div class="ml-20" v-if="isStreaming['llm'] && currentRole === 'interviewer'">🤖{{ streamData["llm"] }}</div>
          <div class="mr-8" v-if="isStreaming['llm'] && currentRole !== 'interviewer'">👱{{ streamData["llm"] }}</div>
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
              :class="!ready || isSubmit ? 'bg-sky-200' : 'bg-sky-500'"
              :disabled="!ready"
              @click="callSubmit"
            >
              Submit
            </button>
          </div>
        </div>
        <div v-if="!ready">
          モデル読込中
        </div>
        {{ loading }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";

import { GraphAI } from "graphai";
import * as agents from "@graphai/vanilla";

import { graph_data } from "@/graph/interview2";
import tinyswallowAgent, { modelLoad, loadEngine, CallbackReport } from "../agents/tinyswallow";

import { useStreamData } from "@/utils/stream";
import { useChatPlugin } from "../utils/graphai";

import { useCytoscape } from "@receptron/graphai_vue_cytoscape";

export default defineComponent({
  name: "HomePage",
  components: {},
  setup() {
    const selectedGraph = computed(() => {
      return graph_data;
    });

    loadEngine();
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
          tinyswallowAgent,
        },
        {
          agentFilters,
          config: {
          },
        },
      );
      graphai.injectValue("name", userInput.value);
      graphai.registerCallback(updateCytoscape);
      graphai.registerCallback(chatMessagePlugin(["output"]));
      graphai.registerCallback(({ nodeId, result }) => {
        console.log(nodeId, result );
        if (nodeId === "context" && result) {
          currentRole.value = (result as { person1: { name: string } }).person1.name;
          console.log(currentRole.value);
        }
      });
      graphai.registerCallback(streamPlugin(["llm"]));

      await graphai.run();
    };

    const loading = ref("");
    const ready = ref(false);
    modelLoad((report: CallbackReport) => {
      if (report.progress === 1) {
        ready.value = true;
      }
      loading.value = report.text;
      console.log(report.text);
    });

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

      loading,
      ready,
    };
  },
});
</script>
