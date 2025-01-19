export const getToolsChatGraph = (systemPrompt: string) => {
  return {
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
            content: systemPrompt,
          },
        ],
        update: ":toolWorkFlowStep.reducer.array",
      },
      userInput: {
        agent: "eventAgent",
        params: {
          message: "You:",
          type: "text",
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
};
