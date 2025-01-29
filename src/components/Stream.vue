<template>
  <div>streamData</div>
  <div class="w-10/12 m-auto">
    <textarea class="border-2 p-2 w-full" rows="10">{{ streamData }}</textarea>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from "vue";
export default defineComponent({
  props: {
    streamData: {
      type: Object as PropType<Record<string, string>>,
      default: () => {
        return {};
      },
    },
  },
});
</script>
