<template>
  <div>
    <NodeComputedParam
      v-for="(param, k) in params"
      :key="k"
      :param="param"
      @focus-event="focusEvent"
      @blur-event="blurEvent"
      :app-data="nodeData.data"
      :node-index="nodeIndex"
    />
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from "vue";
import type { GUINodeData } from "../utils/gui/type";

import { agentProfiles } from "../utils/gui/data";
import NodeComputedParam from "./NodeComputedParam.vue";

export default defineComponent({
  props: {
    nodeData: {
      type: Object as PropType<GUINodeData>,
      required: true,
    },
    nodeIndex: {
      type: Number,
      required: true,
    },
  },
  components: {
    NodeComputedParam,
  },
  emits: ["focusEvent", "blurEvent", "updateValue"],
  setup(props, ctx) {
    const profile = agentProfiles[props.nodeData.data.guiAgentId ?? ""];
    console.log(profile);
    const { params } = profile;

    const focusEvent = () => {
      console.log("F");
      ctx.emit("focusEvent");
    };
    const blurEvent = () => {
      console.log("B");
      ctx.emit("blurEvent");
    };
    return {
      params,
      focusEvent,
      blurEvent,
    };
  },
});
</script>
