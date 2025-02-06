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
import { EdgeData2 } from "./type";

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
      const { x, y, width, inputCenters, outputCenters } = props.fromData.data.position;
      console.log( props.fromData.data);
      const { index } = props.fromData;
      const { x: x2, y: y2 } = props.toData.data.position;
      const { index: index2 } = props.toData;
      const y1Offset = index === undefined ? 0 : outputCenters[index];
      const y2Offset = index2 === undefined ? 0 : inputCenters[index2];

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
