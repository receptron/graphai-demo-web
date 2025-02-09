<template>
  <label class="text-xs text-gray-300">Value</label>
  <select v-model="dataType" class="w-full border border-gray-300 rounded-md p-1 text-black resize-none">
    <option value="text">Text</option>
    <option value="number">Number</option>
    <option value="data">Data(JSON format array or oject)</option>
    <option value="boolean">Boolean</option>
  </select>
  <div v-if="['text', 'data'].includes(dataType)">
    <textarea
      placeholder="Enter the text"
      class="w-full border border-gray-300 rounded-md p-1 text-black resize-none"
      :value="String(nodeData.data.value ?? '')"
      ref="textarea"
      :rows="rows"
    ></textarea>
  </div>
  <div v-if="['number'].includes(dataType)">
    <input type="number" class="w-full border border-gray-300 rounded-md p-1 text-black resize-none" />
  </div>
  <div v-if="['boolean'].includes(dataType)">
    <select v-model="booleanValue">
      <option value="true">True</option>
      <option value="false">False</option>
    </select>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, onMounted, onBeforeUnmount } from "vue";
import type { GUINodeData } from "../utils/gui/type";
export default defineComponent({
  props: {
    nodeData: {
      type: Object as PropType<GUINodeData>,
      required: true,
    },
  },
  emits: ["focusEvent", "blurEvent", "updateValue"],
  setup(__, ctx) {
    const textarea = ref();
    const rows = ref(3);
    const dataType = ref("text");
    const booleanValue = ref(true);

    const focusEvent = (event: FocusEvent) => {
      if (event.target instanceof HTMLTextAreaElement) {
        ctx.emit("focusEvent");
        rows.value = 10;
        // event.target.style.background = "pink";
      }
    };
    const blueEvent = (event: FocusEvent) => {
      if (event.target instanceof HTMLTextAreaElement) {
        // event.target.style.background = "red";
        rows.value = 3;
        ctx.emit("blurEvent");
        console.log(textarea.value.value);
        ctx.emit("updateValue", textarea.value.value);
      }
    };
    onMounted(() => {
      textarea.value.addEventListener("focus", focusEvent);
      textarea.value.addEventListener("blur", blueEvent);
    });
    onBeforeUnmount(() => {
      textarea.value.removeEventListener("focus", focusEvent);
      textarea.value.removeEventListener("blur", blueEvent);
    });
    return {
      textarea,
      dataType,
      rows,
      booleanValue,
    };
  },
});
</script>
