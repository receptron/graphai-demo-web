<script lang="ts">
import { defineComponent, computed, onMounted } from "vue";
import Node from "./Node.vue";
import Edge from "./Edge.vue";
import AddNode from "./AddNode.vue";

import { GUINodeData, EdgeData } from "./gui/type";

import { graphChat } from "../graph/chat";
import { useNewEdge, graphToGUIData } from "./gui/utils";

import { useStore } from "@/store";

export default defineComponent({
  components: {
    Node,
    Edge,
    AddNode,
  },
  setup() {
    const store = useStore();

    const { rawEdge, rawNode } = graphToGUIData(graphChat);

    store.initData(rawNode, rawEdge);
    onMounted(() => {
      savePosition();
    });

    const nodeRecords = computed(() => {
      return store.nodes.reduce((tmp: Record<string, GUINodeData>, current) => {
        tmp[current.nodeId] = current;
        return tmp;
      }, {});
    });

    const updatePosition = (index: number, pos: { x: number; y: number; width: number; height: number }) => {
      store.updatePosition(index, pos);
    };
    const savePosition = () => {
      store.saveData();
    };

    const edgeDataList = computed<EdgeData[]>(() => {
      return store.edges.map((edge) => {
        const { type, from, to } = edge;
        return {
          type,
          from: {
            ...from,
            data: nodeRecords.value[edge.from.nodeId],
          },
          to: {
            ...to,
            data: nodeRecords.value[edge.to.nodeId],
          },
        };
      });
    });

    const { svgRef, newEdgeData, newEdgeEvent, newEdgeEventEnd, nearestData } = useNewEdge();

    return {
      updatePosition,
      savePosition,

      store,

      edgeDataList,
      newEdgeEvent,
      newEdgeEventEnd,
      newEdgeData,
      svgRef,
      nearestData,
    };
  },
});
</script>

<template>
  <div>
    <div class="w-screen h-[80vh] relative">
      <svg x="0" y="0" width="100%" height="80%" class="absolute pointer-events-none" ref="svgRef">
        <Edge v-for="(edge, index) in edgeDataList" :key="index" :from-data="edge.from" :to-data="edge.to" class="pointer-events-auto" />
        <Edge v-if="newEdgeData" :from-data="newEdgeData.from" :to-data="newEdgeData.to" class="pointer-events-auto" />
      </svg>
      <Node
        v-for="(node, index) in store.nodes"
        :key="index"
        :node-data="node"
        :nearest-data="nearestData"
        @update-position="(pos) => updatePosition(index, pos)"
        @save-position="savePosition"
        @new-edge="newEdgeEvent"
        @new-edge-end="newEdgeEventEnd"
      />
    </div>
    <div>
      <AddNode />
      <button
        @click="store.undo"
        class="text-white font-bold items-center rounded-full px-4 py-2 m-1"
        :class="store.undoable ? 'bg-sky-500 hover:bg-sky-700' : 'bg-sky-200'"
      >
        Undo
      </button>
      <button
        @click="store.redo"
        class="text-white font-bold items-center rounded-full px-4 py-2 m-1"
        :class="store.redoable ? 'bg-sky-500 hover:bg-sky-700' : 'bg-sky-200'"
      >
        Redo
      </button>
    </div>
  </div>
</template>
