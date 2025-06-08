<template>
  <div class="home">
    <div class="items-center justify-center">
      <div>
        <div class="w-10/12 h-60 bg-white rounded-md mt-4 p-2 mx-auto border-2">
          <div ref="cytoscapeRef" class="w-full h-full" />
        </div>
      </div>
      <div class="mt-2">
        <chat :messages="messages" :is-streaming="isStreaming" :stream-data="streamData" :stream-node-ids="streamNodes" />
      </div>
      <div class="mt-2 hidden">
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="run">Run</button>
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="logClear">Clear</button>
      </div>

      <div>
        <div class="w-10/12 m-auto my-4">
          <div v-if="events.length > 0" class="font-bold text-red-600 hidden">Write message to bot!!</div>
          <div class="flex">
            <input v-model="userInput" class="border-2 p-2 rounded-md flex-1" :disabled="events.length == 0" />
            <button
              class="text-white font-bold items-center rounded-md px-4 py-2 ml-1 hover:bg-sky-700 flex-none"
              :class="!ready || events.length == 0 ? 'bg-sky-200' : 'bg-sky-500'"
              :disabled="!ready"
              @click="submitText(events[0])"
            >
              送信
            </button>
          </div>
        </div>
        <div v-if="!ready">モデル読込中</div>
        <div v-else>準備完了</div>
        <div>
          {{ loading }}
        </div>
      </div>
      <Transitions :transitions="transitions" />
      <Stream :stream-data="streamData" />
      <GraphData :selected-graph="selectedGraph" />
      <Logs :logs="logs" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "vue";

import { GraphAI } from "graphai";
import * as agents from "@graphai/vanilla";
import tinyswallowAgent, { modelLoad, loadEngine, CallbackReport } from "../agents/tinyswallow";

import { graphChat } from "@/graph/chat_tinyswallow";

import { useStreamData } from "@/composables/useStreamData";
import { textInputEvent, useChatPlugin, useLogs } from "../utils/graphai";

import { useCytoscape } from "@receptron/graphai_vue_cytoscape";

import Chat from "../components/Chat.vue";
import Stream from "../components/Stream.vue";
import Transitions from "../components/Transitions.vue";
import GraphData from "../components/GraphData.vue";
import Logs from "../components/Logs.vue";

// import { useEngine } from "./webllm";

export default defineComponent({
  name: "HomePage",
  components: {
    Chat,
    Stream,
    Transitions,
    GraphData,
    Logs,
  },
  setup() {
    const selectedGraph = computed(() => {
      return graphChat;
    });
    const streamNodes = ["llm"];
    const outputNodes = ["llm", "userInput"];

    loadEngine();
    const { eventAgent, userInput, events, submitText } = textInputEvent();
    const { messages, chatMessagePlugin } = useChatPlugin();
    const { updateCytoscape, cytoscapeRef, resetCytoscape } = useCytoscape(selectedGraph);
    const { logs, transitions, updateLog, resetLog } = useLogs();
    const { streamData, streamAgentFilter, streamPlugin, isStreaming } = useStreamData();
    const agentFilters = [
      {
        name: "streamAgentFilter",
        agent: streamAgentFilter,
      },
    ];

    const run = async () => {
      const graphai = new GraphAI(
        selectedGraph.value,
        {
          ...agents,
          eventAgent,
          tinyswallowAgent,
        },
        {
          agentFilters,
          config: {},
        },
      );
      graphai.registerCallback(updateCytoscape);
      graphai.registerCallback(updateLog);
      graphai.registerCallback(streamPlugin(streamNodes));
      graphai.registerCallback(chatMessagePlugin(outputNodes));
      await graphai.run();
    };
    const logClear = () => {
      resetLog();
      resetCytoscape();
    };

    run();

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
      logs,
      transitions,
      logClear,
      cytoscapeRef,
      selectedGraph,
      streamData,
      isStreaming,

      submitText,
      userInput,
      messages,
      events,
      streamNodes,

      loading,
      ready,
    };
  },
});
</script>
