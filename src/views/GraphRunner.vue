<template>
  <div>
    <button @click="run">run</button>

    <div class="items-center justify-center">
      <div class="mt-2">
        <chat :messages="messages" :is-streaming="isStreaming" :stream-data="streamData" :stream-node-ids="streamNodes" />
      </div>
      <div class="mt-2">
        <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="run">Run</button>
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
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "@/store";
import { GraphAI } from "graphai";

import { useStreamData } from "@/utils/stream";
import { textInputEvent, useChatPlugin } from "../utils/graphai";

import Chat from "../components/Chat.vue";

import * as agents from "@graphai/vanilla";
import { openAIAgent } from "@graphai/openai_agent";

export default defineComponent({
  components: {
    Chat,
  },
  setup() {
    const store = useStore();

    const streamNodes = ["llm"];
    const outputNodes = ["llm", "userInput"];
    const { eventAgent, userInput, events, submitText } = textInputEvent();
    const { messages, chatMessagePlugin } = useChatPlugin();
    const { streamData, streamAgentFilter, streamPlugin, isStreaming } = useStreamData();

    const agentFilters = [
      {
        name: "streamAgentFilter",
        agent: streamAgentFilter,
      },
    ];

    const run = async () => {
      const graphai = new GraphAI(
        store.graphData,
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
              forWeb: true,
            },
          },
        },
      );
      graphai.registerCallback(streamPlugin(streamNodes));
      graphai.registerCallback(chatMessagePlugin(outputNodes));

      await graphai.run();
      console.log(store.graphData);
    };
    return {
      run,

      streamData,
      isStreaming,

      submitText,
      userInput,
      messages,
      events,
      streamNodes,
    };
  },
});
</script>
