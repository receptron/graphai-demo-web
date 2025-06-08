import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Layout from "@/components/Layout.vue";
import Blank from "@/components/Blank.vue";
import NotFound from "@/components/NotFound.vue";

import Home from "@/views/Home.vue";
import Step from "@/views/Step.vue";
import Chat from "@/views/Chat.vue";
import GraphAI from "@/views/GraphAI.vue";
import Reception from "@/views/Reception.vue";
import Random from "@/views/Random.vue";
import About from "@/views/About.vue";
import Sakana from "@/views/Sakana.vue";
import Agents from "@/views/Agents.vue";
import Agent from "@/views/Agent.vue";
import GoogleMap from "@/views/GoogleMap.vue";
import Markdown from "@/views/Markdown.vue";
import Video from "@/views/Video.vue";
import InterView from "@/views/InterView.vue";
import InterView2 from "@/views/InterView2.vue";
import llm from "@/views/tinyswallow.vue";
import gui from "@/views/GUI.vue";

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
    path: "agent",
    component: Agent,
  },
  {
    path: "map",
    component: GoogleMap,
  },
  {
    path: "video",
    component: Video,
  },
  {
    path: "markdown",
    component: Markdown,
  },
  {
    path: "interview",
    component: InterView,
  },
  {
    path: "interview2",
    component: InterView2,
  },
  {
    path: "llm",
    component: llm,
  },
  {
    path: "gui",
    component: gui,
  },
  {
    path: "graphai",
    component: GraphAI,
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
