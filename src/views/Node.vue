<template>
  <div
    class="w-24 bg-blue-400 text-white text-center cursor-grab select-none absolute flex flex-col"
    :style="{
      transform: transform,
      cursor: isDragging ? 'grabbing' : 'grab',
    }"
    ref="thisRef"
    @mousedown="onStartNode"
    @touchstart="onStartNode"
  >
    <div class="w-full text-center bg-blue-500 py-1 leading-none">{{ nodeData.nodeId }}</div>

    <div class="flex flex-col items-end mt-1">
      <div v-for="(output, index) in edgeIO.outputs" :key="'out-' + index" class="relative flex items-center" ref="outputsRef">
        <span class="mr-2 text-xs whitespace-nowrap">{{ output }}</span>
        <div
          class="w-4 h-4 bg-green-500 rounded-full absolute right-[-10px] min-w-[12px]"
          @mousedown="(e) => onStartEdge(e, 'output', index)"
          @touchstart="(e) => onStartEdge(e, 'output', index)"
        ></div>
      </div>
    </div>

    <div class="flex flex-col items-start mt-1 mb-1">
      <div v-for="(input, index) in edgeIO.inputs" :key="'in-' + index" class="relative flex items-center" ref="inputsRef">
        <div
          class="w-4 h-4 bg-blue-500 rounded-full absolute left-[-10px] min-w-[12px]"
          @mousedown="(e) => onStartEdge(e, 'input', index)"
          @touchstart="(e) => onStartEdge(e, 'input', index)"
        ></div>
        <span class="ml-2 text-xs whitespace-nowrap">{{ input }}</span>
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
    const inputsRef = ref<HTMLElement[]>([]);
    const outputsRef = ref<HTMLElement[]>([]);

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

      const parentTop = rect.top;
      const outputCenters = outputsRef.value.map((el) => {
        if (el) {
          const oRect = el.getBoundingClientRect();
          return oRect.top - parentTop + oRect.height / 2;
        }
        return null;
      });
      const inputCenters = inputsRef.value.map((el) => {
        if (el) {
          const iRect = el.getBoundingClientRect();
          return iRect.top - parentTop + iRect.height / 2;
        }
        return null;
      });

      // console.log("Output Centers:", outputCenters);
      // console.log("Input Centers:", inputCenters);
      ctx.emit("updatePosition", { width: rect.width, height: rect.height, outputCenters, inputCenters });
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
      inputs: ["messages", "text", "model"],
      outputs: ["message", "text"],
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

      inputsRef,
      outputsRef,
    };
  },
});
</script>
