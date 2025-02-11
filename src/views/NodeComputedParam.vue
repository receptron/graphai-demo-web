<template>
  <div>
    <label class="text-xs text-gray-300">{{ param.name }}</label>
    <div v-if="param.type === 'string'">
      <input type="text" class="w-full border border-gray-300 rounded-md p-1 text-black" />
    </div>
    <div v-else-if="param.type === 'text'">
      <textarea
        ref="textarea"
        :rows="rows"
        class="w-full border border-gray-300 rounded-md p-1 text-black resize-none"
        ></textarea>
    </div>
    <div v-else-if="param.type === 'data'">
      <textarea
        ref="textarea"
        :rows="rows"
        class="w-full border border-gray-300 rounded-md p-1 text-black resize-none"
        ></textarea>
    </div>
    <div v-else-if="param.type === 'int'">
      <!-- TODO convert int after user input: min, max, defaultValue -->
      <input type="number" class="w-full border border-gray-300 rounded-md p-1 text-black" step="1" pattern="\d*" inputmode="numeric"/>
    </div>
    <div v-else-if="param.type === 'float'">
      <!-- TODO min, max, defaultValue -->
      <input type="number" class="w-full border border-gray-300 rounded-md p-1 text-black" />
    </div>
    <div v-else-if="param.type === 'boolean'">
      <select v-model="booleanValue" ref="selectForm">
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType, ref, onBeforeUnmount, onMounted } from "vue";
import type { ParamType } from "../utils/gui/type";

export default defineComponent({
  props: {
    param: {
      type: Object as PropType<ParamType>,
      required: true,
    },
  },
  emits: ["focusEvent", "blurEvent", "updateValue"],
  setup(__props, ctx) {
    const textarea = ref();
    const rows = ref(3);
    
    const booleanValue = ref("true");

    const focusEvent = (event: FocusEvent) => {
      if (event.target instanceof HTMLTextAreaElement) {
        ctx.emit("focusEvent");
        rows.value = 10;
      }
    };
    const blurEvent = (event: FocusEvent) => {
      if (event.target instanceof HTMLTextAreaElement) {
        rows.value = 3;
        ctx.emit("blurEvent");
      }
    };
    onMounted(() => {
      if (textarea.value) {
        textarea.value.addEventListener("focus", focusEvent);
        textarea.value.addEventListener("blur", blurEvent);
      }
    });
    onBeforeUnmount(() => {
      if (textarea.value) {
        textarea.value.removeEventListener("focus", focusEvent);
        textarea.value.removeEventListener("blur", blurEvent);
      }
    });

    return {
      booleanValue,
      textarea,
      rows,
    };
  },
});
</script>
