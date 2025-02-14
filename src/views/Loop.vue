<template>
  <div class="w-36 text-white text-center cursor-grab select-none absolute flex flex-col rounded-md bg-green-400">
    <div class="w-full text-center py-1 leading-none rounded-t-md bg-green-500">Loop</div>
    <div class="my-4 p-2">
      <select class="w-full border border-gray-300 rounded-md p-1 text-black resize-none" @change="(e) => (loopType = e.target.value)" :value="loopType">
        <option value="none">None</option>
        <option value="while">While</option>
        <option value="count">Count</option>
      </select>

      <div v-if="loopType === 'while'">
        <select class="w-full border border-gray-300 rounded-md p-1 text-black resize-none" @change="(e) => (loopType = e.target.value)" :value="loopType">
          <option v-for="item in list" :key="item">{{ item }}</option>
        </select>
      </div>
      <div v-if="loopType === 'count'" class="mt-2">
        <input type="number" class="w-full border border-gray-300 rounded-md p-1 text-black" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useStore } from "@/store";
import { agentProfiles } from "../utils/gui/data";

export default defineComponent({
  setup() {
    const store = useStore();

    const list = computed(() => {
      const tmp: string[] = [];
      store.nodes.forEach((node) => {
        const agent = node.data.guiAgentId;
        if (agent) {
          const profile = agentProfiles[agent];
          profile.outputs.forEach((prop) => {
            tmp.push(`:${node.nodeId}.${prop.name}`);
          });
        } else {
          tmp.push(`:${node.nodeId}`);
        }
      });
      return tmp;
    });

    const loopType = ref("none");
    return {
      loopType,
      list,
    };
  },
});
</script>
