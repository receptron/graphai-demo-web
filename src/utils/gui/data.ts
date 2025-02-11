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

export const agentProfiles: Record<string, InputOutput> = {
  eventAgent: {
    inputs: [{ name: "wait", type: "array" }],
    outputs: [{ name: "text" }],
    params: [],
  },
  openAIAgent: {
    inputs: [
      { name: "messages", type: "string" },
      { name: "prompt", type: "string" },
      { name: "model", type: "string" },
    ],
    outputs: [{ name: "message" }, { name: "text", type: "string" }],
    params: [
      { name: "system", type: "text" },
      { name: "prompt", type: "text" },
      { name: "model", type: "string" },
      { name: "stream", type: "boolean" },
      { name: "temperature", type: "float", defaultValue: 0.7, max: 1, min: 0 },
      { name: "int", type: "int", defaultValue: 1, max: 100, min: 0 }
    ],
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
