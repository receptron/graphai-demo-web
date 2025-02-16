import { InputOutput } from "./type";

// data type
//  - string
//    - string, form = input text
//  - text
//    - string, form = textarea
//  - boolean
//  - float
//    - number, form = input number
//  - int
//    - number, form = input number
//  - data
//    - json formated data(array, object)
//  - message
//  - messages
//  - array

const llmAgentProfile = {
  inputs: [
    { name: "message", type: "string" },
    { name: "messages", type: "string" },
    { name: "prompt", type: "string" },
    { name: "model", type: "string" },
  ],
  outputs: [{ name: "message" }, { name: "messages" }, { name: "text", type: "string" }],
  params: [
    { name: "system", type: "text" },
    { name: "prompt", type: "text" },
    { name: "model", type: "string" },
    { name: "stream", type: "boolean" },
    { name: "isResult", type: "boolean" },
    { name: "temperature", type: "float", defaultValue: 0.7, max: 1, min: 0 },
  ],
};

export const agentProfiles: Record<string, InputOutput> = {
  eventAgent: {
    agent: "eventAgent",
    inputs: [{ name: "wait", type: "array" }],
    outputs: [{ name: "text" }, { name: "message" }],
    params: [{ name: "isResult", type: "boolean" }],
  },
  tinyswallowAgent: {
    agent: "tinyswallowAgent",
    ...llmAgentProfile,
  },
  openAIAgent: {
    agent: "openAIAgent",
    ...llmAgentProfile,
  },
  stringTemplateAgent: {
    agent: "stringTemplateAgent",
    inputs: [{ name: "text" }, { name: "message1" }, { name: "message2" }],
    outputs: [{ name: "text" }],
    params: [],
  },
  pushAgent: {
    agent: "pushAgent",
    inputs: [{ name: "array" }, { name: "item" }, { name: "items" }],
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
