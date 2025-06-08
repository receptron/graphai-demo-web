<template>
  <div class="home">
    <div class="items-center justify-center">
      <div>
        <div class="w-10/12 h-60 bg-white rounded-md mt-4 p-2 mx-auto border-2">
          <div ref="cytoscapeRef" class="w-full h-full" />
        </div>
      </div>
      <div class="mt-2">
        <chat :messages="messages" />
      </div>
      <div class="mt-2 hidden">
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="run">Run</button>
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="logClear">Clear</button>
      </div>

      <div>
        <div class="w-10/12 m-auto my-4">
          <div v-if="inputPromise.length > 0" class="font-bold text-red-600 hidden">Write message to bot!!</div>
          <div class="flex">
            <input v-model="userInput" class="border-2 p-2 rounded-md flex-1" :disabled="inputPromise.length == 0" />
            <button
              class="text-white font-bold items-center rounded-md px-4 py-2 ml-1 hover:bg-sky-700 flex-none"
              :class="inputPromise.length == 0 ? 'bg-sky-200' : 'bg-sky-500'"
              @click="submit"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
      <button
        :class="isServer ? 'bg-sky-500 hover:bg-sky-700' : ' bg-red-200 hover:bg-red-300'"
        class="text-white font-bold items-center rounded-full px-4 py-2 m-1"
        @click="isServer = !isServer"
      >
        Server
      </button>
      <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="run">Run</button>

      <Transitions :transitions="transitions" />
      <GraphData :selected-graph="selectedGraph" />
      <Result :graphai-response="graphaiResponse" />
      <Logs :logs="logs" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";

import { GraphAI, AgentFunction, AgentFilterFunction, AgentFilterInfo, sleep } from "graphai";
import * as agents from "@graphai/vanilla";
import { agentInfoWrapper } from "graphai/lib/utils/utils";

import { graphReception } from "@/graph/reception";
import { openAIAgent } from "@graphai/openai_agent";
import { httpAgentFilter } from "@graphai/http_client_agent_filter";

import { useCytoscape } from "@receptron/graphai_vue_cytoscape";
import { useLogs } from "../utils/graphai";

import Chat from "../components/Chat.vue";
import Transitions from "../components/Transitions.vue";
import GraphData from "../components/GraphData.vue";
import Result from "../components/Result.vue";
import Logs from "../components/Logs.vue";

export default defineComponent({
  name: "HomePage",
  components: {
    Chat,
    Transitions,
    GraphData,
    Result,
    Logs,
  },
  setup() {
    const userInput = ref("");
    const isServer = ref(false);

    const selectedGraph = computed(() => {
      return graphReception;
    });

    const inputPromise = ref<((message: string) => void)[]>([]);
    const submit = () => {
      if (inputPromise.value.length > 0) {
        const task = inputPromise.value.shift();
        if (task) {
          task(userInput.value);
          userInput.value = "";
        }
      }
    };
    const textPromise = () => {
      return new Promise((resolved) => {
        const task = (message: string) => {
          resolved(message);
        };
        inputPromise.value.push(task);
      });
    };

    const textInputAgent: AgentFunction = async (__context) => {
      const result = await textPromise();
      // console.log(result);
      return {
        text: result as string,
        message: { role: "user", content: result as string },
      };
    };

    const { updateCytoscape, cytoscapeRef, resetCytoscape } = useCytoscape(selectedGraph);

    const demoAgentFilter: AgentFilterFunction = async (context, next) => {
      await sleep(1000);
      return next(context);
    };

    const agentFilters = computed(() => {
      const ret: AgentFilterInfo[] = [
        {
          name: "demoAgentFilter",
          agent: demoAgentFilter,
        },
      ];
      if (isServer.value) {
        ret.push({
          name: "httpAgentFilter",
          agent: httpAgentFilter,
          filterParams: {
            server: {
              baseUrl: "http://localhost:8085/agents",
            },
          },
          agentIds: ["openAIAgent"],
        });
      }
      return ret;
    });
    const messages = ref<{ role: string; content: string }[]>([]);
    const graphaiResponse = ref({});

    const { logs, transitions, updateLog, resetLog } = useLogs();

    const run = async () => {
      const graphai = new GraphAI(
        selectedGraph.value,
        {
          ...agents,
          openAIAgent,
          textInputAgent: agentInfoWrapper(textInputAgent),
        },
        {
          agentFilters: agentFilters.value,
          config: {
            openAIAgent: {
              apiKey: import.meta.env.VITE_OPEN_API_KEY,
            },
          },
        },
      );
      graphai.registerCallback(updateCytoscape);
      graphai.registerCallback(updateLog);
      graphai.onLogCallback = ({ nodeId, state, result }) => {
        if (state === "completed" && result) {
          if (nodeId === "llm_tools") {
            if ((result as { tool: { arguments: string } })?.tool?.arguments) {
              messages.value.push({ role: "bot", content: (result as { tool: { arguments: string } })?.tool.arguments });
            } else {
              messages.value.push({ role: "bot", content: (result as { text: string }).text });
            }
          }
          if (nodeId === "userInput") {
            console.log(result);
            messages.value.push({ role: "user", content: (result as { text: string }).text });
          }
        }
      };
      const results = await graphai.run();
      graphaiResponse.value = results;
    };
    const logClear = () => {
      resetLog();
      resetCytoscape();
    };

    // run();

    return {
      run,
      logs,
      transitions,
      logClear,
      graphaiResponse,
      cytoscapeRef,
      selectedGraph,

      submit,
      userInput,
      messages,
      inputPromise,

      isServer,
    };
  },
});
</script>
