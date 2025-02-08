<script lang="ts">
import { defineComponent, computed, onMounted, ref } from "vue";
import Node from "./Node.vue";
import Edge from "./Edge.vue";
import AddNode from "./AddNode.vue";
import ContextMenu from "./ContextMenu.vue";

import { EdgeData, NodePosition } from "../utils/gui/type";

import { graphChat } from "../graph/chat";
import { useNewEdge } from "../utils/gui/composable";
import { graphToGUIData } from "../utils/gui/utils";

import { useStore } from "@/store";

export default defineComponent({
  components: {
    Node,
    Edge,
    AddNode,
    ContextMenu,
  },
  setup() {
    const store = useStore();
    const contextMenu = ref();

    const { rawEdge, rawNode } = graphToGUIData(graphChat);

    store.initData(rawNode, rawEdge);
    onMounted(() => {
      saveNodePosition();
    });

    const updateNodePosition = (index: number, pos: NodePosition) => {
      store.updateNodePosition(index, pos);
    };
    const saveNodePosition = () => {
      store.saveNodeData();
    };

    const edgeDataList = computed<EdgeData[]>(() => {
      return store.edges.map((edge) => {
        const { type, from, to } = edge;
        return {
          type,
          from: {
            ...from,
            data: store.nodeRecords[edge.from.nodeId],
          },
          to: {
            ...to,
            data: store.nodeRecords[edge.to.nodeId],
          },
        };
      });
    });

    const { svgRef, newEdgeData, newEdgeStartEvent, newEdgeEvent, newEdgeEndEvent, nearestData } = useNewEdge();

    const openMenu = (event: MouseEvent, edgeIndex: number) => {
      const rect = svgRef.value.getBoundingClientRect();
      contextMenu.value.openMenu(event, rect.top, edgeIndex);
    };
    const closeMenu = () => {
      contextMenu.value.closeMenu();
    };

    return {
      updateNodePosition,
      saveNodePosition,

      store,

      edgeDataList,
      newEdgeStartEvent,
      newEdgeEvent,
      newEdgeEndEvent,
      newEdgeData,
      svgRef,
      nearestData,

      contextMenu,
      openMenu,
      closeMenu,
    };
  },
});
</script>

<template>
  <div>
    <div class="w-screen h-[80vh] relative" @click="closeMenu">
      <svg x="0" y="0" width="100%" height="80%" class="absolute pointer-events-none" ref="svgRef">
        <Edge
          v-for="(edge, index) in edgeDataList"
          :key="index"
          :from-data="edge.from"
          :to-data="edge.to"
          class="pointer-events-auto"
          @dblclick="(e) => openMenu(e, index)"
        />
        <Edge v-if="newEdgeData" :from-data="newEdgeData.from" :to-data="newEdgeData.to" class="pointer-events-auto" />
      </svg>
      <Node
        v-for="(node, index) in store.nodes"
        :key="index"
        :node-data="node"
        :nearest-data="nearestData"
        @update-position="(pos) => updateNodePosition(index, pos)"
        @save-position="saveNodePosition"
        @new-edge-start="newEdgeStartEvent"
        @new-edge="newEdgeEvent"
        @new-edge-end="newEdgeEndEvent"
      />
      <ContextMenu ref="contextMenu" />
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
    <div class="text-left">
      <pre>
        {{ JSON.stringify(store.graphData, null, 2) }}
      </pre>
    </div>
  </div>
</template>
