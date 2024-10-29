import express from "express";
import cors from "cors";

import { AgentFunctionInfoDictionary } from "graphai";
import { agentDispatcher, agentsList, agentDoc } from "@receptron/graphai_express";

import * as agents from "@graphai/agents";

const hostName = "https://graphai-demo.web.app";
const agentDictionary: AgentFunctionInfoDictionary = agents;

export const app = express();

const allowedOrigins = ["http://localhost:8080", hostName];

const options: cors.CorsOptions = {
  origin: allowedOrigins,
};

app.use(express.json());
app.use(cors(options));
app.post("/api/agents/:agentId", agentDispatcher(agentDictionary));

app.get("/api/agents", agentsList(agentDictionary, hostName, "/api/agents"));
app.get("/api/agents/:agentId", agentDoc(agentDictionary, hostName, "/api/agents"));
