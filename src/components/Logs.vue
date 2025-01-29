<template>
  <div>Logs</div>
  <div class="w-10/12 m-auto">
    <textarea class="border-2 p-2 w-full" rows="20">{{ logs }}</textarea>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  props: {
    logs: {
      type: Array<unknown>,
      default: () => [],
    },
  },
});
</script>
