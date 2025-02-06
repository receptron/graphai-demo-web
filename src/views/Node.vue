<template>
  <div
    class="w-24 h-24 bg-blue-400 text-white text-center leading-[6rem] cursor-grab select-none absolute"
    :style="{
      transform: transform,
      cursor: isDragging ? 'grabbing' : 'grab',
    }"
    ref="thisRef"
    @mousedown="onStartNode"
    @touchstart="onStartNode"
  >
    <div class="relative w-full h-full flex items-center justify-between p-[2px]">
      <div class="flex flex-col gap-2">
        <div
          v-for="(input, index) in edgeIO.inputs"
          :key="'in-' + index"
          class="w-4 h-4 bg-blue-500 rounded-full"
          @mousedown="(e) => onStartEdge(e, 'input', index)"
          @touchstart="(e) => onStartEdge(e, 'input', index)"
        ></div>
      </div>

      <div class="flex-1 flex items-center justify-center">Node</div>

      <div class="flex flex-col gap-2">
        <div
          v-for="(output, index) in edgeIO.outputs"
          :key="'out-' + index"
          class="w-4 h-4 bg-green-500 rounded-full"
          @mousedown="(e) => onStartEdge(e, 'output', index)"
          @touchstart="(e) => onStartEdge(e, 'output', index)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect, computed, PropType, onMounted } from "vue";
import type { GUINodeData } from "./type";

const isTouch = (event: MouseEvent | TouchEvent): event is TouchEvent => {
  return "touches" in event;
};

export default defineComponent({
  components: {},
  props: {
    nodeData: {
      type: Object as PropType<GUINodeData>,
      required: true,
    },
  },
  emits: ["updatePosition", "newEdge", "newEdgeEnd"],
  setup(props, ctx) {
    const thisRef = ref();
    const isDragging = ref(false);
    const isNewEdge = ref(false);
    const offset = ref({ x: 0, y: 0 });

    const onStartNode = (event: MouseEvent | TouchEvent) => {
      console.log("node");
      if (isNewEdge.value) {
        return;
      }
      isDragging.value = true;
      const clientX = isTouch(event) ? event.touches[0].clientX : event.clientX;
      const clientY = isTouch(event) ? event.touches[0].clientY : event.clientY;
      const position = props.nodeData.position;
      offset.value.x = clientX - position.x;
      offset.value.y = clientY - position.y;
    };

    onMounted(() => {
      const rect = thisRef.value.getBoundingClientRect();
      ctx.emit("updatePosition", { width: rect.width, height: rect.height });
    });

    const onMoveNode = (event: MouseEvent | TouchEvent) => {
      if (!isDragging.value) return;
      const rect = thisRef.value.getBoundingClientRect();
      const clientX = isTouch(event) ? event.touches[0].clientX : event.clientX;
      const clientY = isTouch(event) ? event.touches[0].clientY : event.clientY;
      const newPosition = { x: clientX - offset.value.x, y: clientY - offset.value.y, width: rect.width, height: rect.height };
      ctx.emit("updatePosition", newPosition);
    };

    const onEndNode = () => {
      isDragging.value = false;
    };

    const onStartEdge = (event: MouseEvent | TouchEvent, target: string, index: number) => {
      console.log("edge", event);
      isNewEdge.value = true;
      const clientX = isTouch(event) ? event.touches[0].clientX : event.clientX;
      const clientY = isTouch(event) ? event.touches[0].clientY : event.clientY;
      ctx.emit("newEdge", { on: "start", nodeId: props.nodeData.nodeId, x: clientX, y: clientY, index, target });
    };
    const onEndEdge = () => {
      isNewEdge.value = false;
      ctx.emit("newEdgeEnd", { on: "end" });
    };
    const onMoveEdge = (event: MouseEvent | TouchEvent) => {
      if (!isNewEdge.value) return;
      const clientX = isTouch(event) ? event.touches[0].clientX : event.clientX;
      const clientY = isTouch(event) ? event.touches[0].clientY : event.clientY;
      ctx.emit("newEdge", { on: "move", x: clientX, y: clientY });
    };

    const edgeIO = {
      inputs: ["A", "B", "C"],
      outputs: ["X", "Y", "Z"],
    };

    watchEffect((onCleanup) => {
      if (isDragging.value) {
        window.addEventListener("mousemove", onMoveNode);
        window.addEventListener("mouseup", onEndNode);
        window.addEventListener("touchmove", onMoveNode, { passive: false });
        window.addEventListener("touchend", onEndNode);
        onCleanup(() => {
          window.removeEventListener("mousemove", onMoveNode);
          window.removeEventListener("mouseup", onEndNode);
          window.removeEventListener("touchmove", onMoveNode);
          window.removeEventListener("touchend", onEndNode);
        });
      }
    });

    watchEffect((onCleanup) => {
      if (isNewEdge.value) {
        window.addEventListener("mousemove", onMoveEdge);
        window.addEventListener("mouseup", onEndEdge);
        window.addEventListener("touchmove", onMoveEdge, { passive: false });
        window.addEventListener("touchend", onEndEdge);
        onCleanup(() => {
          window.removeEventListener("mousemove", onMoveEdge);
          window.removeEventListener("mouseup", onEndEdge);
          window.removeEventListener("touchmove", onMoveEdge);
          window.removeEventListener("touchend", onEndEdge);
        });
      }
    });

    const transform = computed(() => {
      return `translate(${props.nodeData.position.x}px, ${props.nodeData.position.y}px)`;
    });
    return {
      transform,
      onStartNode,
      isDragging,
      edgeIO,
      thisRef,
      isNewEdge,
      onStartEdge,
    };
  },
});
</script>
