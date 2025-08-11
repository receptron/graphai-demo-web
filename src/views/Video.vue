<template>
  <div class="home">
    <div>
      <video preload="none" width="1280" height="720" ref="videoRef" controls>
        <source src="http://docs.evostream.com/sample_content/assets/bunny.mp4" type="video/mp4" />
      </video>
    </div>
    <div class="items-center justify-center">
      <div class="mt-2">
        <div class="w-10/12 m-auto text-left">
          <div v-for="(m, k) in messages" :key="k">
            <div v-if="m.role === 'user'" class="mr-8">👱{{ m.content }}</div>
            <div class="ml-20" v-else>🤖{{ m.content }}</div>
          </div>
          <div class="ml-20" v-if="isStreaming['llm']">🤖{{ streamData["llm"] }}</div>
        </div>
      </div>
      <div class="mt-2 hidden">
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="run">Run</button>
      </div>

      <div>
        <div class="w-10/12 m-auto my-4">
          <div v-if="events.length > 0">
            <div v-for="(event, k) in events" :key="k">
              <div v-if="event.type === 'text'" class="flex">
                <input v-model="userInput" class="border-2 p-2 rounded-md m-4 flex-1" :placeholder="event.nodeId" />
                <button
                  class="text-white font-bold items-center rounded-md px-4 py-2 ml-1 hover:bg-sky-700 flex-none m-4 bg-sky-500"
                  @click="submitText(event)"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="w-10/12 h-60 bg-white rounded-md mt-4 p-2 mx-auto border-2">
          <div ref="cytoscapeRef" class="w-full h-full" />
        </div>
      </div>
      <div>
        <div>streamData</div>
        <div class="w-10/12 m-auto">
          <textarea class="border-2 p-2 w-full" rows="10">{{ streamData }}</textarea>
        </div>
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
import { toolsAgent } from "@graphai/tools_agent";

import { useStreamData } from "@/composables/useStreamData";
import { textInputEvent } from "../utils/graphai";

import { useCytoscape } from "@receptron/graphai_vue_cytoscape";

import { hasToolCalls, hasMessage } from "./tools";

const systemPrompt = "You are an operator for Html Video. Follow the user's instructions and call the necessary functions accordingly.";
const graphData = getToolsChatGraph(systemPrompt);

export default defineComponent({
  name: "HomePage",
  components: {},
  setup() {
    const videoRef = ref();

    const selectedGraph = computed(() => {
      return graphData;
    });

    const { eventAgent, userInput, events, submitText } = textInputEvent();
    const { updateCytoscape, cytoscapeRef } = useCytoscape(selectedGraph);
    const { streamData, streamAgentFilter, streamPlugin, isStreaming } = useStreamData();
    const agentFilters = [
      {
        name: "streamAgentFilter",
        agent: streamAgentFilter,
      },
    ];

    const messages = ref<{ role: string; content: string }[]>([]);
    const run = async () => {
      const graphai = new GraphAI(
        selectedGraph.value,
        {
          ...agents,
          openAIAgent,
          eventAgent,
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
      graphai.registerCallback(updateCytoscape);
      graphai.registerCallback(streamPlugin(["llmCallWithTools", "toolsResponseLLM"]));
      graphai.registerCallback((log) => {
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
      });
      await graphai.run();
    };
    onMounted(() => {
      run();
    });

    return {
      run,
      cytoscapeRef,
      selectedGraph,
      streamData,
      isStreaming,

      submitText,
      userInput,
      messages,
      videoRef,

      events,
    };
  },
});
</script>
