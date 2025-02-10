<template>
  <label class="text-xs text-gray-300">Value</label>
  <select v-model="dataType" class="w-full border border-gray-300 rounded-md p-1 text-black resize-none">
    <option v-for="(option, k) in options" :value="option.value" :key="k">{{option.name}}</option>
  </select>
  <div v-show="['text', 'data'].includes(dataType)">
    <textarea
      placeholder="Enter the text"
      class="w-full border border-gray-300 rounded-md p-1 text-black resize-none"
      :value="String(nodeData.data.value ?? '')"
      ref="textarea"
      :rows="rows"
    ></textarea>
  </div>
  <div v-show="['number'].includes(dataType)">
    <input
      type="number" class="w-full border border-gray-300 rounded-md p-1 text-black resize-none"  :value="String(nodeData.data.value ?? '')"
      ref="numberInput"
      />
  </div>
  <div v-show="['boolean'].includes(dataType)">
    <select v-model="booleanValue" ref="selectForm">
      <option value="true">True</option>
      <option value="false">False</option>
    </select>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, onMounted, onBeforeUnmount } from "vue";
import type { GUINodeData } from "../utils/gui/type";

const options = [
  {value: "text", name: "Text"},
  {value: "number", name: "Number"},
  {value: "data", name: "Data(JSON format array or object)"},
  {value: "boolean", name: "Boolean"},
];

export default defineComponent({
  props: {
    nodeData: {
      type: Object as PropType<GUINodeData>,
      required: true,
    },
  },
  emits: ["focusEvent", "blurEvent", "updateValue"],
  setup(props, ctx) {
    const textarea = ref();
    const numberInput = ref();
    const selectForm = ref();
    const rows = ref(3);
    
    const dataType = ref(props.nodeData.data.staticNodeType ?? "text");
    const booleanValue = ref("true");

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

        const value = (() => {
          if (dataType.value === "text") {
            return textarea.value.value;
          }
        })();
        console.log(value);
        
        ctx.emit("updateValue", {
          value,
          staticNodeType: "text",
        });
      }
    };
    const blueUpdateEvent = () => {
      const value = (() => {
        if (dataType.value === "number") {
          return Number(numberInput.value.value);
        }
        if (dataType.value === "boolean") {
          return booleanValue.value === "true"
        }
        return "";
      })();
      console.log(value);
      ctx.emit("updateValue", {
        value,
        staticNodeType: dataType.value,
      });
    }
    onMounted(() => {
      textarea.value.addEventListener("focus", focusEvent);
      textarea.value.addEventListener("blur", blueEvent);
      numberInput.value.addEventListener("blur", blueUpdateEvent);
      selectForm.value.addEventListener("blur", blueUpdateEvent);
    });
    onBeforeUnmount(() => {
      textarea.value.removeEventListener("focus", focusEvent);
      textarea.value.removeEventListener("blur", blueEvent);
      numberInput.value.removeEventListener("blur", blueUpdateEvent);
      selectForm.value.removeEventListener("blur", blueUpdateEvent);
    });
    return {
      numberInput,
      textarea,
      selectForm,
      dataType,
      rows,
      booleanValue,
      options,
    };
  },
});
</script>
