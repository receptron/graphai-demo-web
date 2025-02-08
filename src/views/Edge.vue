<template>
  <path
    :d="edgePath.d"
    :stroke="isHover ? 'blue' : 'red'"
    fill="none"
    :stroke-width="isHover ? 4 : 2"
    @mouseover="isHover = true"
    @mouseleave="isHover = false"
  />
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from "vue";
import { EdgeData2 } from "../utils/gui/type";

export default defineComponent({
  components: {},
  props: {
    fromData: {
      type: Object as PropType<EdgeData2>,
      required: true,
    },
    toData: {
      type: Object as PropType<EdgeData2>,
      required: true,
    },
  },
  setup(props) {
    const isHover = ref(false);
    const edgePath = computed(() => {
      const { x, y, width, outputCenters } = props.fromData.data.position;
      const { index } = props.fromData;
      const { x: x2, y: y2, inputCenters } = props.toData.data.position;
      const { index: index2 } = props.toData;
      const y1Offset = index === undefined ? 0 : outputCenters && outputCenters.length >= index ? outputCenters[index] : 0;
      const y2Offset = index2 === undefined ? 0 : inputCenters && inputCenters.length >= index2 ? inputCenters[index2] : 0;

      const d = `M ${x + (width ?? 0)} ${y + y1Offset} ${x2} ${y2 + y2Offset}`;
      return { x, y, d };
    });

    return {
      edgePath,
      isHover,
    };
  },
});
</script>
