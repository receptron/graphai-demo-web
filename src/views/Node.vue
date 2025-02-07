<template>
  <div
    class="w-36 text-white text-center cursor-grab select-none absolute flex flex-col rounded-md"
    :class="nodeMainClass(expectNearNode, nodeData)"
    :style="{
      transform: transform,
      cursor: isDragging ? 'grabbing' : 'grab',
    }"
    ref="thisRef"
    @mousedown="onStartNode"
    @touchstart="onStartNode"
  >
    <div class="w-full text-center py-1 leading-none rounded-t-md" :class="nodeHeaderClass(expectNearNode, nodeData)">{{ nodeData.nodeId }}</div>
    <div class="w-full text-center py-1 leading-none text-xs" v-if="nodeData.type === 'computed'" :class="nodeHeaderClass(expectNearNode, nodeData)">
      {{ nodeData.agent?.replace(/Agent$/, "") }}
    </div>
    <div class="flex flex-col items-end mt-1">
      <div v-for="(output, index) in edgeIO.outputs" :key="'out-' + index" class="relative flex items-center" ref="outputsRef">
        <span class="mr-2 text-xs whitespace-nowrap">{{ output }}</span>
        <div
          class="w-4 h-4 rounded-full absolute right-[-10px] min-w-[12px]"
          :class="nodeOutputClass(isExpectNearButton('input', index), nodeData)"
          @mousedown="(e) => onStartEdge(e, 'output', index)"
          @touchstart="(e) => onStartEdge(e, 'output', index)"
        ></div>
      </div>
    </div>

    <div class="flex flex-col items-start mt-1 mb-1">
      <div v-for="(input, index) in edgeIO.inputs" :key="'in-' + index" class="relative flex items-center" ref="inputsRef">
        <div
          class="w-4 h-4 rounded-full absolute left-[-10px] min-w-[12px]"
          :class="nodeInputClass(isExpectNearButton('output', index), nodeData)"
          @mousedown="(e) => onStartEdge(e, 'input', index)"
          @touchstart="(e) => onStartEdge(e, 'input', index)"
        ></div>
        <span class="ml-2 text-xs whitespace-nowrap">{{ input }}</span>
      </div>
    </div>
    <div class="w-full p-2 flex flex-col gap-1">
      <label class="text-xs text-gray-300">Name</label>
      <input type="text" placeholder="Enter the name" class="w-full border border-gray-300 rounded-md p-1 text-black" />
      <label class="text-xs text-gray-300">Messages</label>
      <textarea placeholder="Enter the text" class="w-full border border-gray-300 rounded-md p-1 text-black resize-none"></textarea>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect, computed, PropType, onMounted } from "vue";
import type { GUINodeData, GUINearestData } from "./gui/type";
import { getClientPos, agent2NodeParams } from "./gui/utils";
import { nodeMainClass, nodeHeaderClass, nodeOutputClass, nodeInputClass } from "./gui/classUtils";

export default defineComponent({
  components: {},
  props: {
    nodeData: {
      type: Object as PropType<GUINodeData>,
      required: true,
    },
    nearestData: {
      type: Object as PropType<GUINearestData>,
      default: undefined,
    },
  },
  emits: ["updatePosition", "newEdge", "newEdgeEnd"],
  setup(props, ctx) {
    const agentParams = props.nodeData.type === "computed" ? agent2NodeParams[props.nodeData.agent ?? ""] : { inputs: ["update"], outputs: ["date"] };
    console.log(agentParams);

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
      const { clientX, clientY } = getClientPos(event);
      const position = props.nodeData.position;
      offset.value.x = clientX - position.x;
      offset.value.y = clientY - position.y;
    };

    const getWH = () => {
      const rect = thisRef.value.getBoundingClientRect();
      const parentTop = rect.top;

      const getCenterHeight = (el: HTMLElement) => {
        const oRect = el.getBoundingClientRect();
        return oRect.top - parentTop + oRect.height / 2;
      };
      const outputCenters = outputsRef.value.map(getCenterHeight);
      const inputCenters = inputsRef.value.map(getCenterHeight);
      return { width: rect.width, height: rect.height, outputCenters, inputCenters };
    };
    onMounted(() => {
      ctx.emit("updatePosition", getWH());
    });

    const onMoveNode = (event: MouseEvent | TouchEvent) => {
      if (!isDragging.value) return;
      const { clientX, clientY } = getClientPos(event);
      const newPosition = { ...getWH(), x: clientX - offset.value.x, y: clientY - offset.value.y };
      ctx.emit("updatePosition", newPosition);
    };

    const onEndNode = () => {
      isDragging.value = false;
    };

    // edge event
    const onStartEdge = (event: MouseEvent | TouchEvent, target: string, index: number) => {
      console.log("edge", event);
      isNewEdge.value = true;
      const { clientX, clientY } = getClientPos(event);
      ctx.emit("newEdge", { on: "start", nodeId: props.nodeData.nodeId, x: clientX, y: clientY, index, target });
    };
    const onEndEdge = () => {
      isNewEdge.value = false;
      ctx.emit("newEdgeEnd", { on: "end" });
    };
    const onMoveEdge = (event: MouseEvent | TouchEvent) => {
      if (!isNewEdge.value) return;
      const { clientX, clientY } = getClientPos(event);
      ctx.emit("newEdge", { on: "move", x: clientX, y: clientY });
    };
    // end of edge event

    const edgeIO = agentParams;

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
    const expectNearNode = computed(() => {
      return props.nodeData.nodeId === props.nearestData?.nodeId;
    });

    const isExpectNearButton = (targetType: string, index: number) => {
      if (!expectNearNode.value) {
        return false;
      }
      return props.nearestData?.target === targetType && props.nearestData?.index === index;
    };

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

      expectNearNode,
      isExpectNearButton,

      // helper
      nodeMainClass,
      nodeHeaderClass,
      nodeOutputClass,
      nodeInputClass,
    };
  },
});
</script>
