import { nestedAgentGenerator } from "@graphai/vanilla/lib/graph_agents/nested_agent";

const updateTextGraph = {
  version: 0.5,
  nodes: {
    isNewText: {
      if: ":newText",
      agent: "copyAgent",
      inputs: {
        text: ":newText",
      },
    },
    isOldText: {
      unless: ":newText",
      agent: "copyAgent",
      inputs: {
        text: ":oldText",
      },
    },
    updatedText: {
      agent: "copyAgent",
      anyInput: true,
      inputs: {
        text: [":isNewText.text", ":isOldText.text"],
      },
    },
    resultText: {
      isResult: true,
      agent: "copyAgent",
      anyInput: true,
      inputs: {
        text: ":updatedText.text.$0",
      },
    },
  },
};

const updateTextAgent = nestedAgentGenerator(updateTextGraph);

const updateTextAgentInfo = {
  name: "updateTextAgent",
  agent: updateTextAgent,
  mock: updateTextAgent,
  samples: [],
  description: "",
  category: [],
  author: "",
  repository: "",
  tools: [],
  license: "",
  hasGraphData: true,
};

export default updateTextAgentInfo;
