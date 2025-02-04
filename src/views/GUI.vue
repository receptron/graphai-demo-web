<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import Node from "./Node.vue";

export default defineComponent({
  components: {
    Node,
  },
  setup() {
    const nodes = ref([{type: "aa", position: {x: 0, y:0}}, {type: "bb", position: {x: 0, y:0}}]);
    const edges = [{type: "AA"}, {type: "BB"}]

    const updatePosition = (index, pos) => {
      console.log(index, pos);
      const node = nodes.value[index];
      node.position = pos;
      nodes.value[index] = node;
    };
    return {
      updatePosition,
      nodes,
      edges,
    };
  },
});
</script>

<template>
<div class="w-screen h-screen relative">
  <div v-for="(node, index) in nodes" :key="index">
    <Node :nodeData="node" @updatePosition="(pos) => updatePosition(index, pos)" />
  </div>
  <div v-for="(edge, index) in edges" :key="index">
    aa
  </div>

  
  </div>
</template>
