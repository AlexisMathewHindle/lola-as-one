<template>
  <div class="sidebar">
    <div
      v-for="(item, index) in menuItems"
      :key="index"
      v-tooltip="item.tooltip"
      :class="['menu-item', { active: activeItem === index }]"
      @click="setActiveItem(index, item.path)"
    >
      <v-icon :icon="item.icon"></v-icon>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

// Define the state to track the active menu item
const activeItem = ref(0);
const router = useRouter();

// List of menu items with their icon classes
const menuItems = [
  {
    icon: "mdi-monitor-dashboard",
    path: "dashboard",
    tooltip: {
      text: "Dashboard",
    },
  },
  {
    icon: "mdi-ticket-account",
    path: "bookings",
    tooltip: { text: "Bookings" },
  },
  { icon: "mdi-calendar", path: "events", tooltip: { text: "Events" } },
  { icon: "mdi-download", path: "downloads", tooltip: { text: "Downloads" } },
  { icon: "mdi-file-upload", path: "upload", tooltip: { text: "Upload" } },
  { icon: "mdi-ticket-percent", path: "coupons", tooltip: { text: "Coupons" } },
  { icon: "mdi-cog", path: "settings", tooltip: { text: "Settings" } },
];

// Function to set the active item when clicked
const setActiveItem = (index, path) => {
  router.push("/admin/" + path);
  activeItem.value = index;
};
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 60px;
  background-color: #f8f9fa;
  /* padding: 10px 0; */
  position: absolute;
  height: 100vh;
  left: 0px;
  top: -39px;
}

.menu-item {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.menu-item i {
  font-size: 24px; /* Icon size */
}

.menu-item.active {
  background-color: #e0e0e0; /* Active item background color */
}

.menu-item:hover {
  background-color: #d3d3d3; /* Hover effect for menu items */
}
</style>
