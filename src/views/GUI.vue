<script lang="ts">
import { defineComponent, computed, onMounted, ref } from "vue";
import Node from "./Node.vue";
import Edge from "./Edge.vue";
import AddNode from "./AddNode.vue";
import ContextEdgeMenu from "./ContextEdgeMenu.vue";
import ContextNodeMenu from "./ContextNodeMenu.vue";

import { EdgeData, NodePosition, UpdateStaticValue } from "../utils/gui/type";

import { graphChat } from "../graph/chat";
import { useNewEdge } from "../utils/gui/composable";
import { graphToGUIData, guiEdgeData2edgeData } from "../utils/gui/utils";

import { useStore } from "@/store";

export default defineComponent({
  components: {
    Node,
    Edge,
    AddNode,
    ContextEdgeMenu,
    ContextNodeMenu,
  },
  setup() {
    const store = useStore();
    const contextEdgeMenu = ref();
    const contextNodeMenu = ref();

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
    const updateNodeValue = (index: number, value: UpdateStaticValue) => {
      store.updateStaticNodeValue(index, value);
      console.log(index, value);
    };

    const edgeDataList = computed<EdgeData[]>(() => {
      return guiEdgeData2edgeData(store.edges, store.nodeRecords);
    });

    const { svgRef, newEdgeData, newEdgeStartEvent, newEdgeEvent, newEdgeEndEvent, nearestData, edgeConnectable } = useNewEdge();

    const openEdgeMenu = (event: MouseEvent, edgeIndex: number) => {
      const rect = svgRef.value.getBoundingClientRect();
      contextEdgeMenu.value.openMenu(event, rect, edgeIndex);
    };
    const closeMenu = () => {
      contextEdgeMenu.value.closeMenu();
      contextNodeMenu.value.closeMenu();
    };
    const openNodeMenu = (event: MouseEvent, nodeIndex: number) => {
      const rect = svgRef.value.getBoundingClientRect();
      contextNodeMenu.value.openMenu(event, rect, nodeIndex);
    };

    const debug1 = () => {
      store.reset();
    };

    return {
      updateNodePosition,
      saveNodePosition,
      updateNodeValue,

      store,

      edgeDataList,
      newEdgeStartEvent,
      newEdgeEvent,
      newEdgeEndEvent,
      newEdgeData,
      svgRef,
      nearestData,

      contextEdgeMenu,
      contextNodeMenu,
      openEdgeMenu,
      openNodeMenu,
      closeMenu,

      edgeConnectable,

      debug1,
    };
  },
});
</script>

<template>
  <div>
    <div class="flex h-screen">
      <aside class="w-48 p-4">
        <h2 class="text-lg font-bold">Menu</h2>

        <AddNode />
        <hr />
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
        <hr />
        <div>
          <button @click="debug1" class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500">Clear Graph</button>
        </div>
      </aside>
      <main class="flex-1">
        <div class="h-[100vh] relative overflow-hidden" @click="closeMenu">
          <svg x="0" y="0" class="absolute pointer-events-none w-full h-[100%]" ref="svgRef">
            <Edge
              v-for="(edge, index) in edgeDataList"
              :key="index"
              :source-data="edge.source"
              :target-data="edge.target"
              class="pointer-events-auto"
              @dblclick="(e) => openEdgeMenu(e, index)"
            />
            <Edge
              v-if="newEdgeData"
              :source-data="newEdgeData.source"
              :target-data="newEdgeData.target"
              class="pointer-events-auto"
              :is-connectable="edgeConnectable"
            />
          </svg>
          <Node
            v-for="(node, index) in store.nodes"
            :key="index"
            :node-index="index"
            :node-data="node"
            :nearest-data="nearestData"
            @update-position="(pos) => updateNodePosition(index, pos)"
            @update-value="(value) => updateNodeValue(index, value)"
            @save-position="saveNodePosition"
            @new-edge-start="newEdgeStartEvent"
            @new-edge="newEdgeEvent"
            @new-edge-end="newEdgeEndEvent"
            @open-node-menu="(event) => openNodeMenu(event, index)"
          />
          <ContextEdgeMenu ref="contextEdgeMenu" />
          <ContextNodeMenu ref="contextNodeMenu" />
        </div>
      </main>
    </div>
    <div>
      <div class="text-left">
        <pre>
        {{ JSON.stringify(store.graphData, null, 2) }}
      </pre
        >
      </div>
    </div>
    <div>
      <div class="text-left">
        <div v-for="(history, k) in store.histories" :key="k">
          {{ history.name }}
        </div>
      </div>
    </div>
  </div>
</template>
