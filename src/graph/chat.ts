import { GraphData } from "graphai";
export const graphChat: GraphData = {
  version: 0.5,
  loop: {
    while: ":continue",
  },
  nodes: {
    continue: {
      value: true,
    },
    messages: {
      value: [],
      update: ":reducer.array",
    },
    userInput: {
      agent: "eventAgent",
      params: {
        message: "You:",
        isResult: true,
      },
    },
    llm: {
      agent: "openAIAgent",
      isResult: true,
      params: {
        forWeb: true,
        stream: true,
        isResult: true,
      },
      inputs: { messages: ":messages", prompt: ":userInput.text" },
    },
    output: {
      agent: "stringTemplateAgent",
      inputs: {
        text: "\x1b[32mAgent\x1b[0m: ${:llm.text}",
      },
    },
    reducer: {
      agent: "pushAgent",
      inputs: { array: ":messages", items: [":userInput.message", ":llm.message"] },
    },
  },
};
