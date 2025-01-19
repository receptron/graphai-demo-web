<template>
  <div class="flex flex-col space-y-1 bg-white p-4">
    <MenuItem @click="handleClose" link="/" icon="man" title="menu.top" />
    <MenuItem @click="handleClose" link="/map" icon="public" title="menu.map" />
    <MenuItem @click="handleClose" link="/video" icon="smart_display" title="menu.video" />
    <MenuItem @click="handleClose" link="/chat" icon="man" title="menu.chat" />
    <MenuItem @click="handleClose" link="/reception" icon="man" title="menu.reception" />
    <MenuItem @click="handleClose" link="/sakana" icon="set_meal" title="menu.sakana" />
    <MenuItem @click="handleClose" link="/step" icon="man" title="menu.test" />
    <MenuItem @click="handleClose" link="/random" icon="man" title="menu.random" />
    <MenuItem @click="handleClose" link="/marp" icon="man" title="menu.markdown" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import MenuItem from "@/components/MenuItem.vue";

const emitClose = "close-menu";

export default defineComponent({
  emits: [emitClose],
  components: {
    MenuItem,
  },
  setup(__, ctx) {
    const handleClose = () => {
      ctx.emit(emitClose);
    };
    return {
      handleClose,
    };
  },
});
</script>
