import { nestedAgentGenerator } from "@graphai/vanilla/lib/graph_agents/nested_agent";

const toolWorkFlowStep = {
  version: 0.5,
  nodes: {
    llm: {
      agent: ":llmAgent",
      isResult: true,
      params: {
        forWeb: true,
        stream: true,
        tools: ":tools",
      },
      inputs: { messages: ":messages", prompt: ":userInput.text" },
    },
    textMessage: {
      unless: ":llm.tool.id",
      agent: "copyAgent",
      inputs: {
        messages: [":userInput.message", { role: "assistant", content: ":llm.message.content" }],
      },
    },
    tool_calls: {
      if: ":llm.tool_calls",
      agent: "mapAgent",
      inputs: { rows: ":llm.tool_calls" },
      params: {
        compositeResult: true,
      },
      graph: {
        version: 0.5,
        nodes: {
          tool: {
            agent: ":row.name.split(--).$0",
            inputs: {
              arg: ":row.arguments",
              func: ":row.name.split(--).$1",
              tool_call: ":row",
            },
          },
          message: {
            isResult: true,
            agent: "copyAgent",
            inputs: {
              role: "tool",
              tool_call_id: ":row.id",
              name: ":row.name",
              content: ":tool.result",
            },
          },
        },
      },
    },
    toolsMessage: {
      agent: "pushAgent",
      console: { before: true },
      inputs: {
        array: [":userInput.message", ":llm.message"],
        items: ":tool_calls.message",
      },
    },
    buffer: {
      agent: "copyAgent",
      anyInput: true,
      inputs: { array: [":textMessage.messages", ":toolsMessage.array"] },
      console: { after: true },
    },
    reducer: {
      isResult: true,
      agent: "pushAgent",
      inputs: { array: ":messages", items: ":buffer.array.$0" },
    },
  },
};

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
