import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Layout from "@/components/Layout.vue";
import Blank from "@/components/Blank.vue";
import NotFound from "@/components/NotFound.vue";

import About from "@/views/About.vue";
import Random from "@/views/Random.vue";
import Agent from "@/views/Agent.vue";
import InterView2 from "@/views/InterView2.vue";
import llm from "@/views/tinyswallow.vue";

const routeChildren: Array<RouteRecordRaw> = [
  {
    path: "",
    component: llm,
  },
  {
    path: "about",
    component: About,
  },
  {
    path: "random", // big node
    component: Random,
  },
  {
  {
    path: "agent",
    component: Agent,
  },
  {
    path: "interview2",
    component: InterView2,
  },
  {
    path: "llm",
    component: llm,
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
