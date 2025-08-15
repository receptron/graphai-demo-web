<template>
  <div class="home">
    <div>
      <div ref="mapRef" class="w-full h-[33vh]"></div>
    </div>
    <div class="items-center justify-center">
      <div class="mt-2">
        <chat :messages="messages" :is-streaming="isStreaming" :stream-data="streamData" :stream-node-ids="streamNodes" />
      </div>
      <div class="mt-2 hidden">
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="run">Run</button>
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="logClear">Clear</button>
      </div>

      <div>
        <div class="w-10/12 m-auto my-4">
          <div v-for="(event, k) in events" :key="k">
            <div v-if="event.type === 'text'" class="flex">
              <input v-model="userInput" class="border-2 p-2 rounded-md m-4 flex-1" :placeholder="event.nodeId" />
              <button class="text-white font-bold items-center rounded-md px-4 py-2 ml-1 hover:bg-sky-700 flex-none m-4 bg-sky-500" @click="submitText(event)">
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div class="w-10/12 h-60 bg-white rounded-md mt-4 p-2 mx-auto border-2">
          <div ref="cytoscapeRef" class="w-full h-full" />
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
import { defineComponent, ref, computed, onMounted } from "vue";

import { GraphAI, TransactionLog } from "graphai";
import * as agents from "@graphai/vanilla";

import { getToolsChatGraph } from "@/graph/tools";
import { openAIAgent } from "@graphai/openai_agent";
import googleMapAgent from "../agents/google_map_agent";
import { toolsAgent } from "@graphai/tools_agent";
// import toolsAgent from "../agents/tools_agent";

import { useStreamData } from "@/composables/useStreamData";

import { useCytoscape } from "@receptron/graphai_vue_cytoscape";
import { useLogs, textInputEvent } from "../utils/graphai";

import { hasToolCalls, hasMessage } from "./tools";

import Chat from "../components/Chat.vue";
import Stream from "../components/Stream.vue";
import Transitions from "../components/Transitions.vue";
import GraphData from "../components/GraphData.vue";
import Logs from "../components/Logs.vue";

const systemPrompt = "You are an operator for Google Maps. Follow the user's instructions and call the necessary functions accordingly.";
const graphData = getToolsChatGraph(systemPrompt);

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
    const streamNodes = ["llmCallWithTools", "toolsResponseLLM"];
    const mapRef = ref();

    let map: google.maps.Map | null = null;
    // https://developers.google.com/maps/documentation/javascript/reference/map?hl=ja#Map.setCenter
    onMounted(async () => {
      const { Map: GoogleMap } = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
      map = new GoogleMap(mapRef.value as HTMLElement, {
        center: { lat: 35.6712, lng: 139.7665 },
        zoom: 8,
        mapId: "DEMO_MAP_ID",
      });
      run();
    });

    const selectedGraph = computed(() => {
      return graphData;
    });

    const { eventAgent, userInput, events, submitText } = textInputEvent();

    const { logs, transitions, updateLog, resetLog } = useLogs();
    const { updateCytoscape, cytoscapeRef, resetCytoscape } = useCytoscape(selectedGraph);

    // streaming
    const { streamData, streamAgentFilter, streamPlugin, isStreaming } = useStreamData();
    const agentFilters = [
      {
        name: "streamAgentFilter",
        agent: streamAgentFilter,
      },
    ];

    const messages = ref<{ role: string; content: string }[]>([]);
    const setMessages = (log: TransactionLog) => {
      const { nodeId, state, result } = log;
      if (state === "completed" && result) {
        if (nodeId === "llmCallWithTools" || nodeId === "toolsResponseLLM") {
          if (hasToolCalls(result)) {
            const calls = result.tool_calls.map((tool) => [tool.name.split("--").join("/"), JSON.stringify(tool.arguments)].join(" ")).join(", ");
            messages.value.push({ role: "assistant", content: "[call api]" + calls });
          }
          if (hasMessage(result) && result.message.content) {
            messages.value.push((result as { message: { role: string; content: string } }).message);
          }
        }
        if (nodeId === "userInput") {
          messages.value.push((result as { message: { role: string; content: string } }).message);
        }
      }
    };

    const run = async () => {
      const graphai = new GraphAI(
        selectedGraph.value,
        {
          ...agents,
          openAIAgent,
          eventAgent,
          googleMapAgent,
          toolsAgent,
        },
        {
          agentFilters,
          config: {
            googleMapAgent: {
              map,
            },
            openAIAgent: {
              apiKey: import.meta.env.VITE_OPEN_API_KEY,
            },
          },
        },
      );
      graphai.injectValue("tools", googleMapAgent.tools);
      graphai.registerCallback(updateCytoscape);
      graphai.registerCallback(updateLog);
      graphai.registerCallback(streamPlugin(streamNodes));
      graphai.registerCallback(setMessages);

      await graphai.run();
    };
    const logClear = () => {
      resetLog();
      resetCytoscape();
    };

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

      mapRef,
      events,
      streamNodes,
    };
  },
});
</script>
