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
    <div @dblclick="(e) => openNodeMenu(e)">
      <div class="w-full text-center py-1 leading-none rounded-t-md" :class="nodeHeaderClass(expectNearNode, nodeData)">{{ nodeData.nodeId }}</div>
      <div class="w-full text-center py-1 leading-none text-xs" v-if="nodeData.type === 'computed'" :class="nodeHeaderClass(expectNearNode, nodeData)">
        {{ nodeData.data.guiAgentId?.replace(/Agent$/, "") }}
      </div>
    </div>
    <div class="flex flex-col items-end mt-1">
      <div v-for="(output, index) in edgeIO.outputs" :key="['out', output.name, index].join('-')" class="relative flex items-center" ref="outputsRef">
        <span class="mr-2 text-xs whitespace-nowrap">{{ output.name }}</span>
        <div
          class="w-4 h-4 rounded-full absolute right-[-10px] min-w-[12px]"
          :class="nodeOutputClass(isExpectNearButton('inbound', index), nodeData)"
          @mousedown="(e) => onStartEdge(e, 'outbound', index)"
          @touchstart="(e) => onStartEdge(e, 'outbound', index)"
        ></div>
      </div>
    </div>

    <div class="flex flex-col items-start mt-1 mb-1">
      <div v-for="(input, index) in edgeIO.inputs" :key="['in', input.name, index].join('-')" class="relative flex items-center" ref="inputsRef">
        <div
          class="w-4 h-4 rounded-full absolute left-[-10px] min-w-[12px]"
          :class="nodeInputClass(isExpectNearButton('outbound', index), nodeData)"
          @mousedown="(e) => onStartEdge(e, 'inbound', index)"
          @touchstart="(e) => onStartEdge(e, 'inbound', index)"
        ></div>
        <span class="ml-2 text-xs whitespace-nowrap">{{ input.name }}</span>
      </div>
    </div>
    <div class="w-full p-2 flex flex-col gap-1" v-if="nodeData.type === 'static'">
      <NodeStaticValue :node-data="nodeData" @focus-event="focusEvent" @blur-event="blurEvent" @update-value="updateValue" />
    </div>
    <div class="w-full p-2 flex flex-col gap-1" v-if="nodeData.type === 'computed'">
      <NodeComputedParams :node-data="nodeData" @focus-event="focusEvent" @blur-event="blurEvent" :node-index="nodeIndex" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect, computed, PropType, onMounted } from "vue";
import type { GUINodeData, GUINearestData, NewEdgeEventDirection, UpdateStaticValue } from "../utils/gui/type";
import { getClientPos } from "../utils/gui/utils";
import { agentProfiles, staticNodeParams } from "../utils/gui/data";
import { nodeMainClass, nodeHeaderClass, nodeOutputClass, nodeInputClass } from "../utils/gui/classUtils";

import NodeStaticValue from "./NodeStaticValue.vue";
import NodeComputedParams from "./NodeComputedParams.vue";

export default defineComponent({
  components: {
    NodeStaticValue,
    NodeComputedParams,
  },
  props: {
    nodeData: {
      type: Object as PropType<GUINodeData>,
      required: true,
    },
    nearestData: {
      type: Object as PropType<GUINearestData>,
      default: undefined,
    },
    nodeIndex: {
      type: Number,
      required: true,
    },
  },
  emits: ["updatePosition", "savePosition", "newEdgeStart", "newEdge", "newEdgeEnd", "updateStaticNodeValue", "openNodeMenu"],
  setup(props, ctx) {
    const agentParams = props.nodeData.type === "computed" ? agentProfiles[props.nodeData.data.guiAgentId ?? ""] : staticNodeParams;

    const thisRef = ref();
    const inputsRef = ref<HTMLElement[]>([]);
    const outputsRef = ref<HTMLElement[]>([]);

    const isDragging = ref(false);
    const isNewEdge = ref(false);
    const offset = ref({ x: 0, y: 0 });

    const startPosition = { x: 0, y: 0 };
    let d = 0;
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

      // for update detection
      startPosition.x = position.x;
      startPosition.y = position.y;
      d = 0;
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
      const x = clientX - offset.value.x;
      const y = clientY - offset.value.y;
      const newPosition = { ...getWH(), x, y };
      ctx.emit("updatePosition", newPosition);
      d = (startPosition.x - x) ** 2 + (startPosition.y - y) ** 2;
    };

    const onEndNode = () => {
      isDragging.value = false;
      if (d > 4) {
        ctx.emit("savePosition");
      }
    };

    // edge event
    const onStartEdge = (event: MouseEvent | TouchEvent, direction: NewEdgeEventDirection, index: number) => {
      console.log("edge", event);
      isNewEdge.value = true;
      const { clientX, clientY } = getClientPos(event);
      ctx.emit("newEdgeStart", { on: "start", nodeId: props.nodeData.nodeId, x: clientX, y: clientY, index, direction });
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

    const isExpectNearButton = (direction: NewEdgeEventDirection, index: number) => {
      if (!expectNearNode.value) {
        return false;
      }
      return props.nearestData?.direction === direction && props.nearestData?.index === index;
    };

    let currentWidth = 0;
    let currentHeight = 0;
    const focusEvent = () => {
      currentWidth = thisRef.value.offsetWidth;
      currentHeight = thisRef.value.offsetHeight;
      thisRef.value.style.width = currentWidth * 3 + "px";
      thisRef.value.style.height = currentHeight * 3 + "px";
      thisRef.value.style.zIndex = 100;
      ctx.emit("updatePosition", getWH());
    };
    const blurEvent = () => {
      thisRef.value.style.width = currentWidth + "px";
      thisRef.value.style.height = currentHeight + "px";
      thisRef.value.style.zIndex = 1;
      ctx.emit("updatePosition", getWH());
    };
    const updateValue = (value: UpdateStaticValue) => {
      ctx.emit("updateStaticNodeValue", value);
    };
    const openNodeMenu = (event: MouseEvent) => {
      ctx.emit("openNodeMenu", event);
    };
    return {
      focusEvent,
      blurEvent,

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

      updateValue,
      openNodeMenu,
      // helper
      nodeMainClass,
      nodeHeaderClass,
      nodeOutputClass,
      nodeInputClass,
    };
  },
});
</script>
