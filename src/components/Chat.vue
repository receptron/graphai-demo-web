<template>
  <div class="w-10/12 m-auto text-left">
    <div v-for="(m, k) in messages" :key="k">
      <div v-if="m.role === 'user'" class="mr-8">👱{{ m.content }}</div>
      <div class="ml-20" v-else>🤖{{ m.content }}</div>
    </div>
    <div v-for="(nodeId, k) in streamNodeIds" :key="k">
      <div class="ml-20" v-if="isStreaming[nodeId]">🤖{{ streamData[nodeId] }}</div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from "vue";
export default defineComponent({
  props: {
    messages: {
      type: Array<{ role: string; content: string }>,
      default: () => [],
    },
    isStreaming: {
      type: Object as PropType<Record<string, boolean>>,
      default: () => {
        return {};
      },
    },
    streamData: {
      type: Object as PropType<Record<string, string>>,
      default: () => {
        return {};
      },
    },
    streamNodeIds: {
      type: Array<string>,
      default: () => [],
    },
  },
});
</script>
