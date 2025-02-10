<template>
  <label class="text-xs text-gray-300">Value</label>
  <select v-model="dataType" class="w-full border border-gray-300 rounded-md p-1 text-black resize-none">
    <option v-for="(option, k) in options" :value="option.value" :key="k">{{ option.name }}</option>
  </select>
  <div v-show="['text', 'data'].includes(dataType)">
    <textarea
      placeholder="Enter the text"
      class="w-full border border-gray-300 rounded-md p-1 text-black resize-none"
      v-model="textAreaValue"
      ref="textarea"
      :rows="rows"
    ></textarea>
    <div v-if="['data'].includes(dataType)">
      {{ isValidData ? "valid" : "invalid" }}
    </div>
  </div>
  <div v-show="['number'].includes(dataType)">
    <input type="number" class="w-full border border-gray-300 rounded-md p-1 text-black resize-none" v-model="numberValue" ref="numberInput" />
  </div>
  <div v-show="['boolean'].includes(dataType)">
    <select v-model="booleanValue" ref="selectForm">
      <option value="true">True</option>
      <option value="false">False</option>
    </select>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType, onMounted, onBeforeUnmount, watch } from "vue";
import type { GUINodeData } from "../utils/gui/type";

const options = [
  { value: "text", name: "Text" },
  { value: "number", name: "Number" },
  { value: "data", name: "Data(JSON format array or object)" },
  { value: "boolean", name: "Boolean" },
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
    const numberValue = ref(props.nodeData.data.staticNodeType ?? "");
    const booleanValue = ref("true");
    const textAreaValue = ref(String(props.nodeData.data.value ?? ""));

    const focusEvent = (event: FocusEvent) => {
      if (event.target instanceof HTMLTextAreaElement) {
        ctx.emit("focusEvent");
        rows.value = 10;
        // event.target.style.background = "pink";
      }
    };
    const blurEvent = (event: FocusEvent) => {
      if (event.target instanceof HTMLTextAreaElement) {
        // event.target.style.background = "red";
        rows.value = 3;
        ctx.emit("blurEvent");
        // text, data
        const value = (() => {
          if (dataType.value === "data" && isValidData.value) {
            return JSON.parse(textAreaValue.value);
          }
          return textAreaValue.value;
        })();

        ctx.emit("updateValue", {
          value,
          staticNodeType: "text",
        });
      }
    };
    const blurUpdateEvent = () => {
      const value = (() => {
        if (dataType.value === "number") {
          return Number(numberValue.value);
        }
      })();
      console.log(value);
      ctx.emit("updateValue", {
        value,
        staticNodeType: dataType.value,
      });
    };
    watch([booleanValue, dataType], () => {
      if (dataType.value === "boolean") {
        // TODO history
        ctx.emit("updateValue", {
          value: booleanValue.value === "true",
          staticNodeType: dataType.value,
        });
      }
    });
    const isValidData = computed(() => {
      if (dataType.value === "data") {
        try {
          JSON.parse(textAreaValue.value);
        } catch (__e) {
          return false;
        }
      }
      return true;
    });

    onMounted(() => {
      textarea.value.addEventListener("focus", focusEvent);
      textarea.value.addEventListener("blur", blurEvent);
      numberInput.value.addEventListener("blur", blurUpdateEvent);
    });
    onBeforeUnmount(() => {
      textarea.value.removeEventListener("focus", focusEvent);
      textarea.value.removeEventListener("blur", blurEvent);
      numberInput.value.removeEventListener("blur", blurUpdateEvent);
    });
    return {
      numberInput,
      textarea,
      selectForm,
      dataType,
      rows,
      booleanValue,
      numberValue,
      textAreaValue,
      options,
      isValidData,
    };
  },
});
</script>
