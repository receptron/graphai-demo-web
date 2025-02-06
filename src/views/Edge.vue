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

export default defineComponent({
  components: {},
  props: {
    fromData: Object as PropType<any>,
    toData: Object as PropType<any>,
  },
  setup(props) {
    const isHover = ref(false);
    const edgePath = computed(() => {
      const { x, y, width } = props.fromData.data.position;
      const { index } = props.fromData;
      const { x: x2, y: y2 } = props.toData.data.position;
      const { index: index2 } = props.toData;
      const y1Offset = index === undefined ? 0 : index * 20 + 25;
      const y2Offset = index2 === undefined ? 0 : index2 * 20 + 25;

      console.log(y1Offset, y2Offset);

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
