import { nestedAgentGenerator } from "@graphai/vanilla/lib/graph_agents/nested_agent";
import { toolWorkFlowStep } from "../utils/graph_data";

const toolsAgent = nestedAgentGenerator(toolWorkFlowStep);

const toolsAgentInfo = {
  name: "toolsAgent",
  agent: toolsAgent,
  mock: toolsAgent,
  samples: [],
  description: "",
  category: [],
  author: "",
  repository: "",
  tools: [],
  license: "",
  hasGraphData: true,
};

export default toolsAgentInfo;
