<script lang="ts">
import { defineComponent, ref, watch, computed, ComponentPublicInstance } from "vue";
import Node from "./Node.vue";
import Edge from "./Edge.vue";

export default defineComponent({
  components: {
    Node,
    Edge,
  },
  setup() {
    const svgRef = ref();
    const nodes = ref([
      {
        nodeId: "a",
        type: "aa",
        position: { x: 10, y: 10 },
      },
      {
        nodeId: "b",
        type: "bb",
        position: { x: 270, y: 70 },
      },
      {
        nodeId: "c",
        type: "bb",
        position: { x: 570, y: 40 },
      },
    ]);
    const edges = [
      {
        from: { nodeId: "a", index: 0 },
        to: { nodeId: "b", index: 1 },
        type: "AA",
      },
      {
        from: { nodeId: "a", index: 2 },
        to: { nodeId: "b", index: 0 },
        type: "AA",
      },
      {
        from: { nodeId: "b", index: 1 },
        to: { nodeId: "c", index: 2 },
        type: "BB",
      },
    ];
    const nodeRecors = computed(() => {
      return nodes.value.reduce((tmp, current) => {
        tmp[current.nodeId] = current;
        return tmp;
      }, {});
    });

    const updatePosition = (index: number, pos: { x: number; y: number; width: number; height: number }) => {
      const node = nodes.value[index];
      node.position = { ...node.position, ...pos };
      nodes.value[index] = node;
    };

    const edgeDataList = computed(() => {
      return edges.map((edge) => {
        edge.from.data = nodeRecors.value[edge.from.nodeId];
        edge.to.data = nodeRecors.value[edge.to.nodeId];
        return edge;
      });
    });

    const newEdgeData = ref<any | null>(null);
    const newEdgeEvent = (data) => {
      const rect = svgRef.value.getBoundingClientRect();
      if (data.on === "start") {
        const nodeData = {
          data: nodeRecors.value[data.nodeId],
          index: data.index,
        };

        const positionData = {
          data: { position: { x: data.x, y: data.y - rect.top } },
        };
        newEdgeData.value = {
          target: data.target,
          from: data.target === "output" ? nodeData : positionData,
          to: data.target === "output" ? positionData : nodeData,
        };
      }
      if (data.on === "move") {
        const newData = { data: { position: { x: data.x, y: data.y - rect.top } } };
        if (newEdgeData.value.target === "output") {
          newEdgeData.value.to = newData;
        } else {
          newEdgeData.value.from = newData;
        }
      }
      if (data.on === "end") {
        newEdgeData.value = null;
      }
    };
    return {
      updatePosition,
      nodes,
      edges,
      edgeDataList,
      newEdgeEvent,
      newEdgeData,
      svgRef,
    };
  },
});
</script>

<template>
  <div class="w-screen h-screen relative">
    <svg x="0" y="0" width="100%" height="100%" class="absolute" ref="svgRef">
      <Edge v-for="(edge, index) in edgeDataList" :key="index" :fromData="edge.from" :toData="edge.to" />
      <Edge v-if="newEdgeData" :fromData="newEdgeData.from" :toData="newEdgeData.to" />
    </svg>
    <Node v-for="(node, index) in nodes" :key="index" :nodeData="node" @updatePosition="(pos) => updatePosition(index, pos)" @newEdge="newEdgeEvent" />
  </div>
</template>
