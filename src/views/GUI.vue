<script lang="ts">
import { defineComponent, ref, watch, computed } from "vue";
import Node from "./Node.vue";

export default defineComponent({
  components: {
    Node,
  },
  setup() {
    const nodes = ref([{type: "aa", position: {x: 10, y: 10}}, {type: "bb", position: {x: 70, y: 70}}]);
    const edges = [{type: "AA"}, {type: "BB"}]

    const nodeElements = ref([]);

    const updatePosition = (index, pos) => {
      const node = nodes.value[index];
      node.position = pos;
      nodes.value[index] = node;
    };
    const edgeData = computed(() => {
      if (nodeElements.value[0] && nodeElements.value[0].$el) {
        const data = nodeElements.value[0].$el.getBoundingClientRect();

        const { x, y } = nodes.value[0].position;
        const { x: x2, y: y2 } = nodes.value[1].position;

        const d = `M ${x + data.width} ${y} ${x2} ${y2}`
        return { x, y, d};
      }
      return {};
    });
    const isHover = ref(false);
    return {
      updatePosition,
      nodes,
      edges,
      edgeData,

      nodeElements,
      isHover,
    };
  },
});
</script>

<template>
<div class="w-screen h-screen relative">
  <svg x="0" y="0" width="100%" height="100%" class="absolute">
    <path :d="edgeData.d" :stroke="isHover ? 'blue':'red'" fill="none" :stroke-width="isHover ? 4 : 2" @mouseover="isHover=true" @mouseleave="isHover = false"/>
  </svg>  
  <Node v-for="(node, index) in nodes" :key="index" ref="nodeElements" :nodeData="node" @updatePosition="(pos) => updatePosition(index, pos)" />
  <div v-for="(edge, index) in edges" :key="index">
    aa
  </div>
  {{ edgeData }}
</div>
</template>
