<template>
  <path
    :d="edgePath.d"
    :stroke="isConnectable ? (isHover ? colors.hover : colors.edge) : colors.notConnectable"
    fill="none"
    :stroke-width="isHover ? 4 : 2"
    @mouseover="isHover = true"
    @mouseleave="isHover = false"
  />
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from "vue";
import { EdgeData2 } from "../utils/gui/type";

const colors = {
  edge: "red",
  hover: "blue",
  notConnectable: "pink",
};

export default defineComponent({
  components: {},
  props: {
    sourceData: {
      type: Object as PropType<EdgeData2>,
      required: true,
    },
    targetData: {
      type: Object as PropType<EdgeData2>,
      required: true,
    },
    isConnectable: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup(props) {
    const isHover = ref(false);
    const edgePath = computed(() => {
      const { x, y: y1, width, outputCenters } = props.sourceData.data.position;
      const x1 = x + (width ?? 0);
      const { index } = props.sourceData;
      const { x: x2, y: y2, inputCenters } = props.targetData.data.position;
      const { index: index2 } = props.targetData;
      const y1Offset = index === undefined ? 0 : outputCenters && outputCenters.length >= index ? outputCenters[index] : 0;
      const y2Offset = index2 === undefined ? 0 : inputCenters && inputCenters.length >= index2 ? inputCenters[index2] : 0;

      const y1dash = y1 + y1Offset;
      const y2dash = y2 + y2Offset;

      const ydashDiff = Math.abs(y1dash - y2dash);
      const controlYOffset = (ydashDiff > 40 ? 40 : ydashDiff) * (y1dash > y2dash ? 1 : -1);

      const xDiff = x2 - x1;

      const maxOffset = 120;
      const minOffset = 40;
      const offsetThreshold = maxOffset - minOffset;
      const controlXOffset = xDiff > 0 ? minOffset + (xDiff > offsetThreshold ? 0 : offsetThreshold - xDiff) : maxOffset; // xDiff = 0 then x = 120

      const d = `M ${x1} ${y1dash} C ${x1 + controlXOffset} ${y1dash - controlYOffset}, ${x2 - controlXOffset} ${y2dash + controlYOffset}, ${x2} ${y2dash}`;
      // const d = `M ${x1} ${y1dash} ${x2} ${y2dash}`;
      return { d };
    });

    return {
      edgePath,
      isHover,
      colors,
    };
  },
});
</script>
