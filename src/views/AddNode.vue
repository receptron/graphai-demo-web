<template>
  <div class="text-left">
    NodeId:<input type="text" v-model="nodeId" class="border-2 w-full" :class="isError ? 'border-red-600' : ''" />
    <select class="border-2 w-full mt-2" v-model="agent">
      <option>StaticNode</option>
      <option v-for="(agentName, k) in nodesKey" :key="k">{{ agentName }}</option>
    </select>
  </div>
  <div>
    <button @click="addNode" class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700">Add node</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { useStore } from "@/store";
import { agentProfiles } from "../utils/gui/data";

export default defineComponent({
  components: {},
  setup() {
    const nodesKey = Object.keys(agentProfiles);
    const nodeId = ref("");
    const agent = ref(nodesKey[0]);
    const isError = ref(false);

    const store = useStore();

    watch(nodeId, () => {
      isError.value = false;
    });

    const addNode = () => {
      if (nodeId.value === "") {
        isError.value = true;
        return;
      }
      if (store.nodeRecords[nodeId.value]) {
        isError.value = true;
        return;
      }

      const isStatic = agent.value === "StaticNode";
      const targetAgent = agentProfiles[agent.value];
      const data = {
        data: isStatic
          ? {}
          : {
              agent: targetAgent.agent ? targetAgent.agent : agent.value,
              guiAgentId: agent.value,
            },
      };

      store.pushNode({
        ...data,
        nodeId: nodeId.value,
        type: isStatic ? "static" : "computed",
        position: { x: Math.random() * 200, y: Math.random() * 200 },
      });

      nodeId.value = "";
    };
    return {
      addNode,
      nodesKey,
      nodeId,
      agent,

      isError,
    };
  },
});
</script>
