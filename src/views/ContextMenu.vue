<template>
  <div class="w-full h-screen flex items-center justify-center bg-gray-100" @click="closeMenu">
    <ul v-if="menuVisible" :style="menuStyle" class="absolute bg-white border border-gray-300 shadow-md rounded-md py-2 w-40">
      <li class="px-4 py-2 hover:bg-gray-100 cursor-pointer" @click="selectOption('Option 1')">Option 1</li>
      <li class="px-4 py-2 hover:bg-gray-100 cursor-pointer" @click="selectOption('Option 2')">Option 2</li>
      <li class="px-4 py-2 hover:bg-gray-100 cursor-pointer" @click="selectOption('Option 3')">Option 3</li>
    </ul>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent } from "vue";

export default defineComponent({
  setup() {
    const menuVisible = ref(false);
    const menuStyle = ref({ top: "0px", left: "0px" });

    const openMenu = (event: MouseEvent, topOffset: number) => {
      event.preventDefault();
      menuStyle.value = {
        top: `${event.clientY - topOffset}px`,
        left: `${event.clientX}px`,
      };
      menuVisible.value = true;
    };

    const closeMenu = () => {
      menuVisible.value = false;
    };

    const selectOption = (option: string) => {
      console.log(`Selected: ${option}`);
      closeMenu();
    };
    return {
      menuVisible,
      menuStyle,
      openMenu,
      closeMenu,
      selectOption,
    };
  },
});
</script>
