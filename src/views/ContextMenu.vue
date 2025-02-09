<template>
  <ul v-if="menuVisible" :style="menuStyle" class="absolute bg-white border border-gray-300 shadow-md rounded-md py-2 w-40">
    <li class="px-4 py-2 hover:bg-gray-100 cursor-pointer" @click="deleteEdge()">Delete</li>
  </ul>
</template>

<script lang="ts">
import { ref, defineComponent } from "vue";

import { getClientPos } from "../utils/gui/utils";
import { useStore } from "@/store";

export default defineComponent({
  setup() {
    const store = useStore();

    const menuVisible = ref(false);
    const menuStyle = ref({ top: "0px", left: "0px" });
    const selectedEdgeIndex = ref(0);

    const openMenu = (event: MouseEvent | TouchEvent, topOffset: number, edgeIndex: number) => {
      event.preventDefault();
      const { clientX, clientY } = getClientPos(event);
      menuStyle.value = {
        top: `${clientY - topOffset}px`,
        left: `${clientX}px`,
      };
      menuVisible.value = true;
      selectedEdgeIndex.value = edgeIndex;
    };

    const closeMenu = () => {
      menuVisible.value = false;
    };

    const deleteEdge = () => {
      store.deleteEdge(selectedEdgeIndex.value);
    };
    return {
      menuVisible,
      menuStyle,
      openMenu,
      closeMenu,
      deleteEdge,
    };
  },
});
</script>
