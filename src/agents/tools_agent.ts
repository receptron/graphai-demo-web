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
    // just tools
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
            isResult: true,
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
    // tools response if hasNext in response.
    toolsMessage: {
      agent: "pushAgent",
      inputs: {
        array: [":userInput.message", ":llm.message"],
        items: ":tool_calls.message",
      },
    },
    hasNext: {
      agent: (namedInputs: {array: {hasNext: boolean}[]}) => {
        return namedInputs.array.some(ele => ele.hasNext);
      },
      inputs: {
        array: ":tool_calls.tool"
      },
    },
    toolsResponseLlm: {
      if: ":hasNext",
      agent: ":llmAgent",
      params: {
        forWeb: true,
      },
      inputs: { messages: ":toolsMessage.array" },
    },
    toolsResMessage: {
      agent: "pushAgent",
      inputs: {
        array: ":toolsMessage.array",
        item: ":toolsResponseLlm.message",
      },
    },
    justTools: {
      unless: ":hasNext",
      agent: "copyAgent",
      inputs: {
        array: ":toolsMessage.array",
      }
    },
    mergeToolsResponse: {
      agent: "copyAgent",
      anyInput: true,
      inputs: { array: [":toolsResMessage.array", ":justTools.array"] },
    },
    buffer: {
      agent: "copyAgent",
      anyInput: true,
      inputs: { array: [":textMessage.messages", ":mergeToolsResponse.array.$0"] },
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
  samples: [
    {
      inputs: {
        llmAgent: "openAIAgent",
        tools: [
          {
            type: "function",
            function: {
              name: "lightAgent--toggleLight",
              description: "Switch of light",
              parameters: {
                type: "object",
                properties: {
                  switch: {
                    type: "boolean",
                    description: "change light state",
                  },
                },
              },
            },
          },
        ],
        messages: [
          {
            role: "system",
            content: "You are a light switch. Please follow the user's instructions.",
          },
        ],
        userInput: {
          text: "turn on the light.",
          message: {
            role: "user",
            content: "turn on the light.",
          },
        },
      },
      params: {},
      result: "",
    },
  ],
  description: "",
  category: [],
  author: "",
  repository: "",
  tools: [],
  license: "",
  hasGraphData: true,
};

export default toolsAgentInfo;
