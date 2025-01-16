import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Layout from "@/components/Layout.vue";
import Blank from "@/components/Blank.vue";
import NotFound from "@/components/NotFound.vue";

import Home from "@/views/Home.vue";
import Step from "@/views/Step.vue";
import Chat from "@/views/Chat.vue";
import Reception from "@/views/Reception.vue";
import Random from "@/views/Random.vue";
import About from "@/views/About.vue";
import Sakana from "@/views/Sakana.vue";
import Agents from "@/views/Agents.vue";
import GoogleMap from "@/views/GoogleMap.vue";
import Marp from "@/views/Marp.vue";

const routeChildren: Array<RouteRecordRaw> = [
  {
    path: "",
    component: Home,
  },
  {
    path: "step",
    component: Step,
  },
  {
    path: "chat",
    component: Chat,
  },
  {
    path: "reception",
    component: Reception,
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
    path: "sakana",
    component: Sakana,
  },
  {
    path: "agents",
    component: Agents,
  },
  {
    path: "map",
    component: GoogleMap,
  },
  {
    path: "marp",
    component: Marp,
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
