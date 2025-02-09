import { InputOutput } from "./type";

export const agentProfiles: Record<string, InputOutput> = {
  eventAgent: {
    inputs: [{ name: "wait", type: "array" }],
    outputs: [{ name: "text" }],
    params: [],
  },
  openAIAgent: {
    inputs: [{ name: "messages" }, { name: "prompt", type: "string" }, { name: "model", type: "string" }],
    outputs: [{ name: "message" }, { name: "text" }],
    params: [],
  },
  stringTemplateAgent: {
    inputs: [{ name: "text" }, { name: "message1" }, { name: "message2" }],
    outputs: [{ name: "text" }],
    params: [],
  },
  pushAgent: {
    inputs: [{ name: "array" }, { name: "item" }],
    outputs: [{ name: "array" }],
    params: [],
  },
  convertAgent: {
    agent: "copyAgent",
    inputSchema: {
      context: {
        inputs: {
          person0: {
            name: "interviewer",
            system: ":interviewer",
          },
          person1: {
            name: ":name",
            system: "You are ${:name}.",
            greeting: "Hi, I'm ${:name}",
          },
        },
      },
    },
    inputs: [
      { name: "interviewer", type: "text" },
      { name: "name", type: "text" },
    ],
    outputs: [{ name: "array" }],
    params: [],
  },
};

export const staticNodeParams: InputOutput = { inputs: [{ name: "update" }], outputs: [{ name: "date" }] };
