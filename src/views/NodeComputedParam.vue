<template>
  <div>
    <label class="text-xs text-gray-300">{{ param.name }}</label>
    <div v-if="param.type === 'string'">
      <input ref="inputRef" type="text" class="w-full border border-gray-300 rounded-md p-1 text-black" v-model="inputValue" />
    </div>
    <div v-else-if="param.type === 'text'">
      <textarea ref="textareaRef" :rows="rows" class="w-full border border-gray-300 rounded-md p-1 text-black resize-none" v-model="textAreaValue"></textarea>
    </div>
    <div v-else-if="param.type === 'data'">
      <textarea ref="textareaRef" :rows="rows" class="w-full border border-gray-300 rounded-md p-1 text-black resize-none" v-model="textAreaValue"></textarea>
    </div>
    <div v-else-if="param.type === 'int'">
      <!-- TODO convert int after user input: min, max, defaultValue -->
      <input
        ref="inputRef"
        type="number"
        class="w-full border border-gray-300 rounded-md p-1 text-black"
        step="1"
        pattern="\d*"
        inputmode="numeric"
        v-model="inputValue"
      />
    </div>
    <div v-else-if="param.type === 'float'">
      <!-- TODO min, max, defaultValue -->
      <input ref="inputRef" type="number" class="w-full border border-gray-300 rounded-md p-1 text-black" v-model="inputValue" />
    </div>
    <div v-else-if="param.type === 'boolean'">
      <select v-model="booleanValue" ref="selectFormRef">
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType, ref, onBeforeUnmount, onMounted, watch } from "vue";
import type { ParamType, ApplicationData } from "../utils/gui/type";

import { useStore } from "@/store";

export default defineComponent({
  props: {
    param: {
      type: Object as PropType<ParamType>,
      required: true,
    },
    appData: {
      type: Object as PropType<ApplicationData>,
      required: true,
    },
    nodeIndex: {
      type: Number,
      required: true,
    },
  },
  emits: ["focusEvent", "blurEvent", "updateValue"],
  setup(props, ctx) {
    const store = useStore();

    const textareaRef = ref();
    const inputRef = ref();
    const selectFormRef = ref();

    const rows = ref(3);

    const key = props.param.name;
    const value = (props.appData.params ?? {})[key];

    const inputValue = ref(value ?? "");
    const booleanValue = ref(value === true ? "true" : "false");
    const textAreaValue = ref(String(value ?? ""));

    watch(
      () => props.appData,
      (updateParams) => {
        const updateValue = (updateParams.params ?? {})[key];

        if (props.param.type === "text" && updateValue !== textAreaValue.value) {
          textAreaValue.value = updateValue;
        }
        if (props.param.type === "data") {
          if (typeof updateValue === "object" || Array.isArray(updateValue)) {
            textAreaValue.value = JSON.stringify(updateValue, null, 2);
          } else {
            textAreaValue.value = updateValue;
          }
        }
        if (props.param.type === "int" || props.param.type === "float") {
          const numberValue = Number(inputValue.value);
          if (numberValue !== updateValue) {
            inputValue.value = updateValue;
          }
        }
        // inputValue
      },
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
        console.log(textAreaValue.value);
        store.updateNodeParam(props.nodeIndex, key, textAreaValue.value);
      }
    };
    const blurUpdateEvent = () => {
      store.updateNodeParam(props.nodeIndex, key, inputValue.value);
    };
    watch([booleanValue], () => {
      if (props.param.type === "boolean") {
        store.updateNodeParam(props.nodeIndex, key, booleanValue.value === "true");
      }
    });

    onMounted(() => {
      if (textareaRef.value) {
        textareaRef.value.addEventListener("focus", focusEvent);
        textareaRef.value.addEventListener("blur", blurEvent);
      }
      if (inputRef.value) {
        inputRef.value.addEventListener("blur", blurUpdateEvent);
      }
    });
    onBeforeUnmount(() => {
      if (textareaRef.value) {
        textareaRef.value.removeEventListener("focus", focusEvent);
        textareaRef.value.removeEventListener("blur", blurEvent);
      }
      if (inputRef.value) {
        inputRef.value.removeEventListener("blur", blurUpdateEvent);
      }
    });

    return {
      booleanValue,
      inputValue,
      textAreaValue,

      inputRef,
      textareaRef,
      selectFormRef,

      rows,
    };
  },
});
</script>
