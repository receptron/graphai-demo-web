<template>
  <div class="mt-2">Graph Data</div>
  <div class="w-10/12 m-auto font-mono">
    <textarea class="border-2 p-2 rounded-md w-full" rows="20">{{ selectedGraph }}</textarea>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  props: {
    selectedGraph: {
      type: Object,
      default: () => {
        return {};
      },
    },
  },
});
</script>
