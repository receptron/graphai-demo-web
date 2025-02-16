<template>
  <div>
    <b>Graph Template</b>
    <select class="w-full border-2 border-gray-300 rounded-md p-1 text-black resize-none mt-2" v-model="template">
      <option v-for="(graph, k) in graphs" :key="k" :value="k">{{ graph.name }}</option>
    </select>
    <div>
      <button @click="setGraph" class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700">Set Graph</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { graphChat as graphChatOpenAI } from "../graph/chat";
import { graphChat as graphChatTinySwallow } from "../graph/chat_tinyswallow";

const graphs = [
  { name: "Chat(WebLLM)", graph: graphChatTinySwallow },
  { name: "Chat(OpenAI)", graph: graphChatOpenAI },
];

export default defineComponent({
  emits: ["setGraph"],
  setup(__, ctx) {
    const template = ref(0);
    const setGraph = () => {
      console.log(graphs[template.value]);
      ctx.emit("setGraph", graphs[template.value].graph);
    };
    return {
      graphs,
      template,
      setGraph,
    };
  },
});
</script>
