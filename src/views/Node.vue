<script lang="ts">
import { defineComponent, ref, watchEffect, computed, PropType } from "vue";

export default defineComponent({
  components: {},
  props: {
    nodeData: Object as PropType<{type: string, position: {x: number, y: number}}>,
  },
  emits: ["updatePosition"],
  setup(props, ctx) {
    const isDragging = ref(false);
    const offset = ref({ x: 0, y: 0 });

    const onStart = (event) => {
      console.log("AAA");
      isDragging.value = true;
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;
      const position = props.nodeData.position;
      offset.value.x = clientX - position.x;
      offset.value.y = clientY - position.y;
    };

    const onMove = (event) => {
      if (!isDragging.value) return;
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;
      const newPosition = {x: clientX - offset.value.x, y: clientY - offset.value.y};
      ctx.emit("updatePosition", newPosition);
    };

    const onEnd = () => {
      isDragging.value = false;
    };

    const edgeIO = {
      inputs: ["A", "B", "C"],
      outputs: ["X", "Y", "Z"],
    };

    watchEffect((onCleanup) => {
      if (isDragging.value) {
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onEnd);
        window.addEventListener("touchmove", onMove, { passive: false });
        window.addEventListener("touchend", onEnd);
        onCleanup(() => {
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseup", onEnd);
          window.removeEventListener("touchmove", onMove);
          window.removeEventListener("touchend", onEnd);
        });
      }
    });
    const transform = computed(() => {
      return `translate(${props.nodeData.position.x}px, ${props.nodeData.position.y}px)`;
    });
    return {
      transform,
      onStart,
      isDragging,
      edgeIO,
    };
  },
});
</script>

<template>
  <div
    class="w-24 h-24 bg-blue-400 text-white text-center leading-[6rem] cursor-grab select-none absolute"
    :style="{
      transform: transform,
      cursor: isDragging ? 'grabbing' : 'grab',
    }"
    @mousedown="onStart"
    @touchstart="onStart"
  >
    <div class="relative w-full h-full flex items-center justify-between p-[2px]">
      <div class="flex flex-col gap-2">
        <div v-for="(input, index) in edgeIO.inputs" :key="'in-' + index" class="w-4 h-4 bg-blue-500 rounded-full"
             @mousedown="(e) => { e.preventDefault();}"
             @click="(e) => {console.log(123);}"
             ></div>
      </div>

      <div class="flex-1 flex items-center justify-center">ノード</div>

      <div class="flex flex-col gap-2">
        <div v-for="(output, index) in edgeIO.outputs" :key="'out-' + index" class="w-4 h-4 bg-green-500 rounded-full"></div>
      </div>
    </div>
  </div>
</template>
