<template>
  <div class="home bg-gray-50 min-h-screen py-4">
    <div class="container mx-auto px-4">
      <!-- Chat Section -->
      <div class="chat-section bg-white rounded-md shadow-md p-4 mb-6">
        <div v-for="(m, k) in messages" :key="k" class="message my-2">
          <div v-if="m.role === 'user'" class="user-message bg-blue-100 rounded-lg px-4 py-2 text-left">👱 {{ m.content }}</div>
          <div v-else class="bot-message bg-gray-100 rounded-lg px-4 py-2 text-left ml-12">🤖 {{ m.content }}</div>
        </div>
        <div v-if="isStreaming" class="bot-message bg-gray-100 rounded-lg px-4 py-2 text-left ml-12">🤖 {{ streamData["llm"] }}</div>
      </div>

      <!-- Input Section -->
      <div class="input-section bg-white rounded-md shadow-md p-4 mb-6">
        <div v-for="(event, k) in events" :key="k">
          <div v-if="event.type === 'text'">
            <div class="font-bold text-red-600 mb-2">Write message to bot!!</div>
            <div class="flex items-center">
              <input
                v-model="userInput"
                class="border border-gray-300 rounded-md flex-1 p-2 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                :disabled="events.length === 0"
                placeholder="Type your message here..."
              />
              <button
                class="ml-2 px-4 py-2 rounded-md text-white font-bold transition-all duration-200"
                :class="events.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-sky-500 hover:bg-sky-700'"
                @click="submit()"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Markdown Editor and Preview -->
      <div class="markdown-section grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Markdown Editor -->
        <div class="editor bg-white rounded-md shadow-md p-4">
          <h2 class="text-lg font-bold mb-2">Markdown Editor</h2>
          <textarea
            v-model="markdown"
            class="w-full resize-none overflow-hidden border border-gray-300 rounded-md p-2 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            placeholder="Write your markdown here..."
            @input="adjustTextareaHeight()"
            ref="textareaRef"
          ></textarea>
        </div>

        <!-- Markdown Preview -->
        <div class="preview bg-white rounded-md shadow-md p-4">
          <h2 class="text-lg font-bold mb-2">Preview</h2>
          <div class="article-list text-left" v-html="md.render(markdown)"></div>
        </div>
      </div>

      <!-- Cytoscape Visualization -->
      <div class="visualization bg-white rounded-md shadow-md mt-6 p-4">
        <h2 class="text-lg font-bold mb-2">Visualization</h2>
        <div ref="cytoscapeRef" class="w-full h-60 border border-gray-300 rounded-md"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from "vue";

import { GraphAI } from "graphai";
import * as agents from "@graphai/vanilla";

import { graphMarkdown } from "@/graph/markdown";
import { openAIAgent } from "@graphai/openai_agent";

import { useStreamData } from "@/utils/stream";

import { useCytoscape } from "@receptron/graphai_vue_cytoscape";
import { eventAgentGenerator, EventData } from "@receptron/event_agent_generator";

import MarkdownIt from "markdown-it";

export default defineComponent({
  name: "HomePage",
  components: {},
  setup() {
    const selectedGraph = computed(() => {
      return graphMarkdown;
    });

    const textareaRef = ref<HTMLTextAreaElement | null>(null);
    const adjustTextareaHeight = () => {
      if (textareaRef.value) {
        textareaRef.value.style.height = "auto";
        textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`;
      }
    };
    onMounted(() => {
      if (textareaRef.value) {
        textareaRef.value.style.height = "auto";
        textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`;
      }
    });

    // input
    const userInput = ref("");
    const events = ref<EventData[]>([]);
    const { eventAgent } = eventAgentGenerator((id, data) => {
      if (data.type === "markdown") {
        const { namedInputs } = data;
        markdown.value = namedInputs.markdown;
      }
      events.value.push(data);
    });

    const submit = () => {
      events.value.forEach((event) => {
        if (event.type === "text") {
          const data = {
            text: userInput.value,
            message: { role: "user", content: userInput.value },
          };
          event.onEnd(data);
        }
        if (event.type === "markdown") {
          event.onEnd({ text: markdown.value });
        }
      });
      events.value = [];
      userInput.value = "";
      adjustTextareaHeight();
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
    const markdown = ref(graphMarkdown.nodes.md.value);

    const run = async () => {
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
      graphai.onLogCallback = ({ nodeId, state, result }) => {
        if (state === "completed" && result) {
          if (nodeId === "llm") {
            isStreaming.value = false;
            messages.value.push((result as { message: { role: string; content: string } }).message);
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
    run();

    return {
      run,
      graphaiResponse,
      cytoscapeRef,
      selectedGraph,
      streamData,
      isStreaming,

      submit,
      userInput,
      messages,
      events,

      markdown,

      md: new MarkdownIt(),

      textareaRef,
      adjustTextareaHeight,
    };
  },
});
</script>

<style scoped>
@reference "../index.css";
/* Headings */
::v-deep(h1) {
  @apply text-3xl text-blue-500 font-bold;
}
::v-deep(h2) {
  @apply text-2xl text-red-500 font-bold;
}
::v-deep(h3) {
  @apply text-xl text-green-500 font-bold;
}
::v-deep(h4) {
  @apply text-lg text-purple-500 font-bold;
}
::v-deep(h5) {
  @apply text-base text-indigo-500 font-bold;
}
::v-deep(h6) {
  @apply text-sm text-pink-500 font-bold;
}

/* Text formatting */
::v-deep(strong) {
  @apply font-bold text-yellow-500;
}
::v-deep(em) {
  @apply italic text-gray-700;
}
::v-deep(a) {
  @apply text-blue-600 underline hover:text-blue-800;
}

/* Lists */
::v-deep(ul) {
  @apply list-disc list-inside;
}
::v-deep(ol) {
  @apply list-decimal list-inside;
}
::v-deep(li) {
  @apply my-2;
}

/* Blockquotes */
::v-deep(blockquote) {
  @apply border-l-4 border-gray-400 pl-4 italic text-gray-600;
}

/* Code blocks */
::v-deep(pre) {
  @apply bg-gray-800 text-white p-4 rounded-lg overflow-x-auto;
}
::v-deep(code) {
  @apply bg-gray-200 text-red-600 px-1 rounded;
}

/* Horizontal rules */
::v-deep(hr) {
  @apply border-t-2 border-gray-300 my-4;
}

/* Tables */
::v-deep(table) {
  @apply table-auto border-collapse border border-gray-300 w-full;
}
::v-deep(th) {
  @apply border border-gray-300 px-4 py-2 bg-gray-100 font-bold text-left;
}
::v-deep(td) {
  @apply border border-gray-300 px-4 py-2;
}
</style>
