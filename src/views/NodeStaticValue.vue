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
      ref="textareaRef"
      :rows="rows"
    ></textarea>
    <div v-if="['data'].includes(dataType)">
      {{ isValidData ? "valid" : "invalid" }}
    </div>
  </div>
  <div v-show="['number'].includes(dataType)">
    <input type="number" class="w-full border border-gray-300 rounded-md p-1 text-black resize-none" v-model="numberValue" ref="inputRef" />
  </div>
  <div v-show="['boolean'].includes(dataType)">
    <select v-model="booleanValue" ref="selectFormRef" @change="selectUpdate">
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
    const textareaRef = ref();
    const inputRef = ref();
    const selectFormRef = ref();
    const rows = ref(3);

    const dataType = ref(props.nodeData.data.staticNodeType ?? "text");
    const numberValue = ref(props.nodeData.data.staticNodeType ?? "");
    const booleanValue = ref("true");
    const textAreaValue = ref(
      String(props.nodeData.data.staticNodeType === "data" ? JSON.stringify(props.nodeData.data.value, null, 2) : (props.nodeData.data.value ?? "")),
    );

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
      ctx.emit("updateValue", {
        value,
        staticNodeType: dataType.value,
      });
    };
    /*
    watch([booleanValue, dataType], () => {
      if (dataType.value === "boolean") {
        // TODO history
        ctx.emit("updateValue", {
          value: booleanValue.value === "true",
          staticNodeType: dataType.value,
        });
      }
      });
    */
    const selectUpdate = () => {
      ctx.emit("updateValue", {
        value: booleanValue.value === "true",
        staticNodeType: dataType.value,
      });
    };
    // for redo
    watch(
      () => props.nodeData.data.value,
      (value) => {
        if (dataType.value === "boolean") {
          booleanValue.value = value as string;
        } else if (value !== null && typeof value === "object") {
          textAreaValue.value = JSON.stringify(value, null, 2);
        } else {
          textAreaValue.value = value as string;
        }
      },
    );
    watch(
      () => props.nodeData.data.staticNodeType,
      (staticNodeType) => {
        if (staticNodeType) {
          dataType.value = staticNodeType;
        }
      },
    );
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
      textareaRef.value.addEventListener("focus", focusEvent);
      textareaRef.value.addEventListener("blur", blurEvent);
      inputRef.value.addEventListener("blur", blurUpdateEvent);
    });
    onBeforeUnmount(() => {
      textareaRef.value.removeEventListener("focus", focusEvent);
      textareaRef.value.removeEventListener("blur", blurEvent);
      inputRef.value.removeEventListener("blur", blurUpdateEvent);
    });
    return {
      inputRef,
      textareaRef,
      selectFormRef,
      dataType,
      rows,
      booleanValue,
      numberValue,
      textAreaValue,
      options,
      isValidData,
      selectUpdate,
    };
  },
});
</script>
