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
        </div>
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

import { GraphAI, AgentFunction, AgentFunctionInfo } from "graphai";
import * as agents from "@graphai/vanilla";
import { agentInfoWrapper } from "graphai/lib/utils/utils";

import { graphAgent } from "@/utils/graph_data";
import { openAIAgent } from "@graphai/openai_agent";

import { useCytoscape } from "@receptron/graphai_vue_cytoscape";

export default defineComponent({
  name: "HomePage",
  components: {},
  setup() {
    const messages = ref<{ role: string; content: string }[]>([]);

    const agentsInfo = ref({});
    fetch("http://localhost:8085/api/agents").then(async (res) => {
      agentsInfo.value = (await res.json()).agents.map((agent: AgentFunctionInfo) => {
        const { name, description, inputs, output } = agent;
        return { name, description, inputs, output };
      });
      console.log(agentsInfo.value);
    });

    const userInput = ref("");

    const selectedGraph = computed(() => {
      return graphAgent;
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

    const graphaiResponse = ref({});
    const logs = ref<unknown[]>([]);
    const transitions = ref<unknown[]>([]);

    const run = async () => {
      const graphai = new GraphAI(selectedGraph.value, {
        ...agents,
        openAIAgent,
        textInputAgent: agentInfoWrapper(textInputAgent),
      });
      graphai.injectValue("messages", [
        {
          role: "system",
          content: [
            "以下のデータからユーザにとって必要なagentを選んでください。",
            "name, description, inputs, outputが書いてあります。inputs, outputはopanapiのスキーマです。",
            "積極的にユーザにエージェントをすすめて、一致するagentがあればその名前と詳細をユーザに教えて下さい\\n\n## AGENT ##\n\n",
            JSON.stringify(agentsInfo.value),
          ].join("\n"),
        },
      ]);
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
      logs.value = [];
      transitions.value = [];

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
    };
  },
});
</script>
