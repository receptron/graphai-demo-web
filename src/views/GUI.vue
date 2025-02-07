<script lang="ts">
import { defineComponent, computed } from "vue";
import Node from "./Node.vue";
import Edge from "./Edge.vue";
import { GUINodeData, EdgeData } from "./gui/type";

import { graphChat } from "../graph/chat";
import { useNewEdge, graphToGUIData } from "./gui/utils";

import { useStore } from "@/store";

export default defineComponent({
  components: {
    Node,
    Edge,
  },
  setup() {
    const store = useStore();

    const { rawEdge, rawNode } = graphToGUIData(graphChat);

    store.initHistory(rawNode, rawEdge);

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

    const addNode = () => {
      const uuid = self.crypto.randomUUID();
      store.pushNode({
        nodeId: uuid,
        type: "aa",
        position: { x: Math.random() * 200, y: Math.random() * 200 },
      });
    };

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
      addNode,
    };
  },
});
</script>

<template>
  <div>
    <div class="w-screen h-[80vh] relative">
      <svg x="0" y="0" width="100%" height="80%" class="absolute" ref="svgRef">
        <Edge v-for="(edge, index) in edgeDataList" :key="index" :from-data="edge.from" :to-data="edge.to" />
        <Edge v-if="newEdgeData" :from-data="newEdgeData.from" :to-data="newEdgeData.to" />
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
      <select>
        <option>aa</option>
      </select>
      <button @click="addNode">Add node</button>
      <button @click="store.undo">Undo</button>
    </div>
  </div>
</template>
