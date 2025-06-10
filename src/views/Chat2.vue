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
      <div class="mt-2">
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="logClear">Clear</button>
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="resetData">Reset</button>
      </div>
      <div>
        <div class="w-10/12 m-auto my-4">
          <div v-if="events.length > 0" class="font-bold text-red-600 hidden">Write message to bot!!</div>
          <div class="flex">
            <input v-model="userInput" class="border-2 p-2 rounded-md flex-1" :disabled="events.length == 0" />
            <button
              class="text-white font-bold items-center rounded-md px-4 py-2 ml-1 hover:bg-sky-700 flex-none"
              :class="events.length == 0 ? 'bg-sky-200' : 'bg-sky-500'"
              @click="submitText(events[0])"
            >
              Submit
            </button>
          </div>
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

import { graphChat } from "@/graph/chat";
import { openAIAgent } from "@graphai/openai_agent";

import { useStreamData } from "@/composables/useStreamData";
import { textInputEvent, useChatPlugin, useLogs } from "../utils/graphai";

import { useCytoscape } from "@receptron/graphai_vue_cytoscape";

import Chat from "../components/Chat.vue";
import Stream from "../components/Stream.vue";
import Transitions from "../components/Transitions.vue";
import GraphData from "../components/GraphData.vue";
import Logs from "../components/Logs.vue";

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

    const { eventAgent, userInput, events, submitText, resetEvents } = textInputEvent();
    const { messages, chatMessagePlugin } = useChatPlugin();
    const { updateCytoscape, cytoscapeRef, resetCytoscape } = useCytoscape(selectedGraph);
    const { logs, transitions, updateLog, resetLog } = useLogs();
    const { streamData, streamAgentFilter, isStreaming } = useStreamData();
    const agentFilters = [
      {
        name: "streamAgentFilter",
        agent: streamAgentFilter,
      },
    ];

    const internalData = ref({});
    const graphai = new GraphAI(
      selectedGraph.value,
      {
        ...agents,
        openAIAgent,
        eventAgent,
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
    graphai.registerCallback(updateCytoscape);
    graphai.registerCallback(updateLog);
    graphai.registerCallback((log) => {
      console.log(log);
      // if (log.state === "completed" || log.state === "injected") {
      if (log.state === "injected") {
        internalData.value[log.nodeId] = log.result;
        console.log(log.nodeId);
        console.log(log.result);
      }
    });
    graphai.registerCallback(chatMessagePlugin(outputNodes));
    const run = async () => {
      await graphai.run();
    };
    const logClear = () => {
      resetLog();
      resetCytoscape();
    };
    const resetData = () => {
      const copyData = JSON.parse(JSON.stringify(internalData.value));
      internalData.value = {};

      // abort
      graphai.abort();
      graphai.initializeGraphAI();
      // inject

      Object.keys(graphai.nodes).forEach((nodeId) => {
        if (graphai.nodes[nodeId].isStaticNode) {
          graphai.injectValue(nodeId, copyData[nodeId]);
        }
      });

      resetEvents();

      graphai.run();

      // message
    };
    run();

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

      internalData,
      resetData,
    };
  },
});
</script>
