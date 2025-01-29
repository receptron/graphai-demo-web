<template>
  <div>Result</div>
  <div class="w-10/12 m-auto">
    <textarea class="border-2 p-2 w-full" rows="20">{{ graphaiResponse }}</textarea>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  props: {
    graphaiResponse: {
      type: Object,
      default: () => {
        return {};
      },
    },
  },
});
</script>
