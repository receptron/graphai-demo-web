const tools = [
  {
    type: "function",
    function: {
      name: "report",
      description: "Report the information acquired from the user",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "the name of the patient (first and last)",
          },
          sex: {
            type: "string",
            description: "Gender of the patient.",
            enum: ["male", "female"],
          },
          dob: {
            type: "string",
            description: "Patient's date of birth.",
          },
        },
        required: ["name", "sex", "dob"],
      },
    },
  },
];

export const graphAgent = {
  version: 0.5,
  loop: {
    while: ":continue",
  },
  nodes: {
    // Holds a boolean value, which specifies if we need to contine or not.
    continue: {
      value: true,
      update: ":llm_tools.text",
    },
    messages: {
      // Holds the conversation, the array of messages.
      value: [],
      update: ":llm_tools.messages",
    },
    userInput: {
      // Receives an input from the user.
      agent: "textInputAgent",
      params: {
        message: "You:",
      },
    },
    llm_tools: {
      // Sends those messages to LLM to get a response.
      agent: "openAIAgent",
      params: {
        model: "gpt-4o",
        forWeb: true,
        tools,
      },
      inputs: { messages: ":messages", prompt: ":userInput.text" },
    },
  },
};
///
