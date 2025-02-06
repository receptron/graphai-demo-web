<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { inputs2dataSources } from "graphai";
import Node from "./Node.vue";
import Edge from "./Edge.vue";
import { GUINodeData, GUIEdgeData, EdgeData } from "./gui/type";

import { graphChat } from "../graph/chat";
import { useNewEdge } from "./gui/newEdge";
export default defineComponent({
  components: {
    Node,
    Edge,
  },
  setup() {
    let i = -50,
      j = 10;

    const nodeIds = Object.keys(graphChat.nodes);
    const rawEdge: GUIEdgeData[] = [];
    const rawNode = Object.keys(graphChat.nodes).map((nodeId) => {
      i = i + 150;
      if (i > 800) {
        i = 100;
        j = j + 150;
      }
      const node = graphChat.nodes[nodeId];
      inputs2dataSources(node).forEach((source) => {
        const expect = source.value || source.nodeId;
        if (nodeIds.includes(expect)) {
          rawEdge.push({
            from: { nodeId: expect, index: 0 },
            to: { nodeId, index: 1 },
            type: "AA",
          });
        }
      });
      return {
        type: "computed",
        nodeId,
        position: { x: i, y: j },
      };
    });

    const nodes = ref<GUINodeData[]>(rawNode);
    const edges = ref<GUIEdgeData[]>(rawEdge);
    const nodeRecords = computed(() => {
      return nodes.value.reduce((tmp: Record<string, GUINodeData>, current) => {
        tmp[current.nodeId] = current;
        return tmp;
      }, {});
    });

    const updatePosition = (index: number, pos: { x: number; y: number; width: number; height: number }) => {
      const node = nodes.value[index];
      node.position = { ...node.position, ...pos };
      nodes.value[index] = node;
    };

    const edgeDataList = computed<EdgeData[]>(() => {
      return edges.value.map((edge) => {
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
      console.log(uuid);
      nodes.value.push({
        nodeId: uuid,
        type: "aa",
        position: { x: Math.random() * 200, y: Math.random() * 200 },
      });
    };

    const { svgRef, newEdgeData, newEdgeEvent, newEdgeEventEnd, nearestData } = useNewEdge(nodes, edges, nodeRecords);

    return {
      updatePosition,
      nodes,
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
    <div class="w-screen h-screen relative">
      <svg x="0" y="0" width="100%" height="100%" class="absolute" ref="svgRef">
        <Edge v-for="(edge, index) in edgeDataList" :key="index" :from-data="edge.from" :to-data="edge.to" />
        <Edge v-if="newEdgeData" :from-data="newEdgeData.from" :to-data="newEdgeData.to" />
      </svg>
      <Node
        v-for="(node, index) in nodes"
        :key="index"
        :node-data="node"
        :nearest-data="nearestData"
        @update-position="(pos) => updatePosition(index, pos)"
        @new-edge="newEdgeEvent"
        @new-edge-end="newEdgeEventEnd"
      />
    </div>
    <div><button @click="addNode">Add node</button></div>
  </div>
</template>
