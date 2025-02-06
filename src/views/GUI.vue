<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import Node from "./Node.vue";
import Edge from "./Edge.vue";
import { NewEdgeEventData, GUINodeData, GUIEdgeData, EdgeData, NewEdgeData } from "./type";

export default defineComponent({
  components: {
    Node,
    Edge,
  },
  setup() {
    const svgRef = ref();
    const nodes = ref<GUINodeData[]>([
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
    const edges = ref<GUIEdgeData[]>([
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
    ]);
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

    const newEdgeData = ref<NewEdgeData | null>(null);
    const mouseCurrentPosition = ref({ x: 0, y: 0 });
    const targetNode = ref("");
    const newEdgeEvent = (data: NewEdgeEventData) => {
      const rect = svgRef.value.getBoundingClientRect();
      if (data.on === "start") {
        targetNode.value = data.nodeId;
        const nodeData = {
          nodeId: data.nodeId,
          data: nodeRecords.value[data.nodeId],
          index: data.index,
        };

        mouseCurrentPosition.value = { x: data.x, y: data.y - rect.top };
        const positionData = {
          data: { position: mouseCurrentPosition.value },
        };
        if (data.target === "output") {
          newEdgeData.value = {
            target: data.target,
            from: nodeData,
            to: positionData,
          };
        } else {
          newEdgeData.value = {
            target: data.target,
            from: positionData,
            to: nodeData,
          };
        }
      }
      if (data.on === "move") {
        mouseCurrentPosition.value = { x: data.x, y: data.y - rect.top };
        const newData = { data: { position: mouseCurrentPosition.value } };
        if (newEdgeData.value) {
          if (newEdgeData.value.target === "output") {
            newEdgeData.value.to = newData;
          } else {
            newEdgeData.value.from = newData;
          }
        }
      }
      if (data.on === "end") {
        if (!nearestNode.value || !newEdgeData.value) return;
        const nearest = {
          nodeId: nearestNode.value.node.nodeId,
          index: 0,
        };
        if (newEdgeData.value.target === "output") {
          const fromData = newEdgeData.value.from;
          const addEdge = {
            type: "AA",
            from: fromData,
            to: nearest,
          };
          edges.value.push(addEdge);
        }
        if (newEdgeData.value.target === "input") {
          const toData = newEdgeData.value.to;
          const { nodeId, index } = toData;
          const addEdge = {
            type: "AA",
            from: nearest,
            to: {
              nodeId,
              index,
            },
          };
          edges.value.push(addEdge);
        }
        newEdgeData.value = null;
        // edges.value.push(addEdge);
        console.log(edges.value);
      }
    };

    const nearestNode = computed(() => {
      if (!nodes.value.length) return null;

      return nodes.value.reduce((closest: null | { node: GUINodeData; distance: number }, node) => {
        if (targetNode.value === node.nodeId) {
          return closest;
        }

        const nodeCenterX = node.position.x + (node.position.width ?? 0) / 2;
        const nodeCenterY = node.position.y + (node.position.height ?? 0) / 2;
        const mouseX = mouseCurrentPosition.value.x;
        const mouseY = mouseCurrentPosition.value.y;

        const distance = Math.sqrt((nodeCenterX - mouseX) ** 2 + (nodeCenterY - mouseY) ** 2);

        if (!closest || distance < closest.distance) {
          return { node, distance };
        }

        return closest;
      }, null);
    });

    return {
      updatePosition,
      nodes,
      edgeDataList,
      newEdgeEvent,
      newEdgeData,
      svgRef,
      mouseCurrentPosition,
      nearestNode,
    };
  },
});
</script>

<template>
  <div class="w-screen h-screen relative">
    <svg x="0" y="0" width="100%" height="100%" class="absolute" ref="svgRef">
      <Edge v-for="(edge, index) in edgeDataList" :key="index" :from-data="edge.from" :to-data="edge.to" />
      <Edge v-if="newEdgeData" :from-data="newEdgeData.from" :to-data="newEdgeData.to" />
    </svg>
    <Node v-for="(node, index) in nodes" :key="index" :node-data="node" @update-position="(pos) => updatePosition(index, pos)" @new-edge="newEdgeEvent" />
    aa{{ mouseCurrentPosition }} {{ nearestNode }}
  </div>
</template>
