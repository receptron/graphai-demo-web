<template>
  <div class="w-36 text-white text-center cursor-grab select-none absolute flex flex-col rounded-md bg-green-400">
    <div class="w-full text-center py-1 leading-none rounded-t-md bg-green-500">Loop</div>
    <div class="my-4 p-2">
      <select class="w-full border border-gray-300 rounded-md p-1 text-black resize-none" @change="updateType" :value="loopType">
        <option value="none">None</option>
        <option value="while">While</option>
        <option value="count">Count</option>
      </select>

      <div v-if="loopType === 'while'" class="mt-2">
        <select class="w-full border border-gray-300 rounded-md p-1 text-black resize-none" @change="updateWhile" :value="whileValue">
          <option v-for="item in lists" :key="item">{{ item }}</option>
        </select>
      </div>
      <div v-show="loopType === 'count'" class="mt-2">
        <input type="number" class="w-full border border-gray-300 rounded-md p-1 text-black" ref="countRef" v-model="countValue" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useStore } from "@/store";
import { agentProfiles } from "../utils/gui/data";

export default defineComponent({
  setup() {
    const store = useStore();

    const lists = computed(() => {
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

    const updateLoop = () => {
      if (loopType.value === "none") {
        store.updateLoop({
          loopType: "none",
        });
      }
      if (loopType.value === "while") {
        store.updateLoop({
          loopType: "while",
          while: whileValue.value,
        });
      }
      if (loopType.value === "count") {
        store.updateLoop({
          loopType: "while",
          count: Number(countValue.value),
        });
      }
    };

    const loopType = ref("none");
    const countValue = ref("1");
    const whileValue = ref(lists.value[0]);
    const countRef = ref();

    const updateType = (event: Event) => {
      loopType.value = event.target.value;
      updateLoop();
    };
    const updateWhile = (event: Event) => {
      whileValue.value = event.target.value;
      updateLoop();
    };
    const blurUpdateEvent = () => {
      updateLoop();
    };
    onMounted(() => {
      if (countRef.value) {
        countRef.value.addEventListener("blur", blurUpdateEvent);
      }
    });
    onBeforeUnmount(() => {
      if (countRef.value) {
        countRef.value.removeEventListener("blur", blurUpdateEvent);
      }
    });

    return {
      loopType,
      countValue,
      whileValue,

      lists,

      updateType,
      updateWhile,

      countRef,
    };
  },
});
</script>
