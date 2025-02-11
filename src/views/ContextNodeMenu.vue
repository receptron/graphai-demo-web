<template>
  <ContextMenu ref="contextMenu" class="z-100">
    <li class="px-4 py-2 hover:bg-gray-100 cursor-pointer" @click="deleteNode()">Delete</li>
  </ContextMenu>
</template>

<script lang="ts">
import { ref, defineComponent } from "vue";

import ContextMenu from "./ContextMenu.vue";
import { useStore } from "@/store";

export default defineComponent({
  components: {
    ContextMenu,
  },
  setup() {
    const contextMenu = ref();

    const store = useStore();
    const selectedEdgeIndex = ref(0);

    const openMenu = (event: MouseEvent | TouchEvent, topOffset: number, edgeIndex: number) => {
      event.preventDefault();
      contextMenu.value.openMenu(event, topOffset);
      selectedEdgeIndex.value = edgeIndex;
    };

    const closeMenu = () => {
      contextMenu.value.closeMenu();
    };

    const deleteNode = () => {
      store.deleteNode(selectedEdgeIndex.value);
    };
    return {
      contextMenu,
      openMenu,
      closeMenu,
      deleteNode,
    };
  },
});
</script>
