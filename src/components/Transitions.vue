<template>
  <div class="w-10/12 m-auto text-left">Transitions</div>
  <div class="w-10/12 m-auto">
    <textarea class="border-2 p-2 w-full" rows="20">{{ transitions.join("\n") }}</textarea>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  props: {
    transitions: {
      type: Array<string>,
      default: () => [],
    },
  },
});
</script>
