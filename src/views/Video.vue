<template>
  <div class="home">
    <div>
      <video preload="none" width="1280" height="720" ref="videoRef" controls>
        <source src="http://docs.evostream.com/sample_content/assets/bunny.mp4" type="video/mp4" />
      </video>
      <button @click="play">play</button>
    </div>
    <div class="items-center justify-center">
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
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="logClear">Clear</button>
      </div>

      <div>
        <div class="w-10/12 h-60 bg-white rounded-md mt-4 p-2 mx-auto border-2">
          <div ref="cytoscapeRef" class="w-full h-full" />
        </div>
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
      <div class="w-10/12 m-auto text-left">Transitions</div>
      <div class="w-10/12 m-auto">
        <textarea class="border-2 p-2 w-full" rows="20">{{ transitions.join("\n") }}</textarea>
      </div>
      <div>
        <div>streamData</div>
        <div class="w-10/12 m-auto">
          <textarea class="border-2 p-2 w-full" rows="10">{{ streamData }}</textarea>
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
import { defineComponent, ref, computed, onMounted } from "vue";

import { GraphAI } from "graphai";
import * as agents from "@graphai/vanilla";

import { getToolsChatGraph } from "@/graph/tools";
import { openAIAgent } from "@graphai/openai_agent";
import videoAgent from "../agents/video_agent";
import toolsAgent from "../agents/tools_agent";
//import { toolsAgent } from "@graphai/tools_agent";

import { useStreamData } from "@/utils/stream";

import { useCytoscape } from "@receptron/graphai_vue_cytoscape";
import { textInputAgentGenerator, InputEvents } from "@receptron/event_agent_generator";

type ToolResult = { tool_calls: { id: string; name: string; arguments: unknown }[] };
type MessageResult = { message: { content: string } };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const hasToolCalls = (value: unknown): value is ToolResult =>
  isRecord(value) && "tool_calls" in value && Array.isArray(value.tool_calls) && value.tool_calls.length > 0;
const hasMessage = (value: unknown): value is MessageResult =>
  isRecord(value) && "message" in value && isRecord(value.message) && "content" in value.message && Boolean(value.message.content);

const systemPrompt = "You are an operator for Html Video. Follow the user's instructions and call the necessary functions accordingly.";
const graphData = getToolsChatGraph(systemPrompt);

export default defineComponent({
  name: "HomePage",
  components: {},
  setup() {
    const videoRef = ref();

    // https://developers.google.com/maps/documentation/javascript/reference/map?hl=ja#Map.setCenter
    onMounted(() => {
      run();
    });
    const play = () => {
      videoRef.value.play();
    };

    const selectedGraph = computed(() => {
      return graphData;
    });

    // input
    const userInput = ref("");
    const inputPromises = ref<InputEvents>([]);
    const { textInputAgent, submit } = textInputAgentGenerator(inputPromises.value);
    const callSubmit = () => {
      submit(inputPromises.value[0].id, userInput.value, () => {
        userInput.value = "";
      });
    };
    // end of input

    const { updateCytoscape, cytoscapeRef, resetCytoscape } = useCytoscape(selectedGraph);

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
    const logs = ref<unknown[]>([]);
    const transitions = ref<unknown[]>([]);
    const isStreaming = ref(false);

    const run = async () => {
      const graphai = new GraphAI(
        selectedGraph.value,
        {
          ...agents,
          openAIAgent,
          textInputAgent,
          videoAgent,
          toolsAgent,
        },
        {
          agentFilters,
          config: {
            videoAgent: {
              videoElement: videoRef.value,
            },
            openAIAgent: {
              apiKey: import.meta.env.VITE_OPEN_API_KEY,
            },
          },
        },
      );
      graphai.injectValue("tools", videoAgent.tools);
      /* eslint sonarjs/cognitive-complexity: 0 */
      graphai.onLogCallback = ({ nodeId, state, inputs, result, errorMessage }) => {
        if (logs.value.length > 0 && (logs.value[logs.value.length - 1] as { nodeId: string }).nodeId === nodeId) {
          transitions.value[transitions.value.length - 1] += " → " + state;
        } else {
          transitions.value.push(nodeId + ": " + state);
        }
        logs.value.push({ nodeId, state, inputs, result, errorMessage });
        updateCytoscape(nodeId, state);

        if (state === "completed" && result) {
          if (nodeId === "llm" || nodeId === "toolsResponseLLM") {
            isStreaming.value = false;
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
    const logClear = () => {
      logs.value = [];
      transitions.value = [];

      resetCytoscape();
    };

    return {
      play,

      run,
      logs,
      transitions,
      logClear,
      graphaiResponse,
      cytoscapeRef,
      selectedGraph,
      streamData,
      isStreaming,

      callSubmit,
      userInput,
      messages,
      inputPromises,
      videoRef,
    };
  },
});
</script>
