import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Layout from "@/components/Layout.vue";
import Blank from "@/components/Blank.vue";
import NotFound from "@/components/NotFound.vue";

import Home from "@/views/Home.vue";
import Home2 from "@/views/Home2.vue";
import Home3 from "@/views/Home3.vue";
import Home4 from "@/views/Home4.vue";
import Random from "@/views/Random.vue";
import About from "@/views/About.vue";

const routeChildren: Array<RouteRecordRaw> = [
  {
    path: "",
    component: Home,
  },
  {
    path: "test",
    component: Home2,
  },
  {
    path: "chat",
    component: Home3,
  },
  {
    path: "reception",
    component: Home4,
  },
  {
    path: "about",
    component: About,
  },
  {
    path: "random",
    component: Random,
  },
];

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    component: Layout,
    children: [
      {
        path: "/:lang",
        component: Blank,
        children: routeChildren,
      },
      {
        path: "",
        component: Blank,
        children: routeChildren,
      },
    ],
  },
  {
    path: "/:page(.*)",
    name: "NotFoundPage",
    component: NotFound,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
