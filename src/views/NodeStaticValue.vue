<template>
  <label class="text-xs text-gray-300">Value</label>
  boolean, data(array or object), text
  {{ nodeData.value }}
  <textarea
    placeholder="Enter the text"
    class="w-full border border-gray-300 rounded-md p-1 text-black resize-none"
    :value="nodeData.value"
    ref="textarea"
    :rows="rows"
  ></textarea>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, onMounted, onUnmounted } from "vue";
import type { GUINodeData } from "../utils/gui/type";
export default defineComponent({
  props: {
    nodeData: {
      type: Object as PropType<GUINodeData>,
      required: true,
    },
  },
  emits: ["focusEvent", "blurEvent"],
  setup(__, ctx) {
    const textarea = ref();
    const rows = ref(3);
    const focusEvent = (event) => {
      ctx.emit("focusEvent");
      rows.value = 10;
      event.target.style.background = "pink";
    };
    const blueEvent = (event) => {
      event.target.style.background = "red";
      rows.value = 3;
      ctx.emit("blurEvent");
    };
    onMounted(() => {
      textarea.value.addEventListener("focus", focusEvent);
      textarea.value.addEventListener("blur", blueEvent);
    });
    onUnmounted(() => {
      textarea.value.removeEventListener("focus", focusEvent);
      textarea.value.removeEventListener("blur", blueEvent);
    });
    return {
      textarea,
      rows,
    };
  },
});
</script>
