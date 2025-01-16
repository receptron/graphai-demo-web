export const graphGoogleMap = {
  version: 0.5,
  loop: {
    while: ":continue",
  },
  nodes: {
    continue: {
      value: true,
    },
    tools: {
      update: ":tools",
    },
    messages: {
      value: [
        {
          role: "system",
          content: "You are an operator for Google Maps. Follow the user's instructions and call the necessary functions accordingly.",
        },
      ],
      update: ":toolWorkFlowStep.reducer.array",
    },
    userInput: {
      agent: "textInputAgent",
      params: {
        message: "You:",
      },
    },
    toolWorkFlowStep: {
      agent: "toolsAgent",
      inputs: {
        llmAgent: "openAIAgent",
        tools: ":tools",
        messages: ":messages",
        userInput: ":userInput",
      },
    },
  },
};

