export const graphMarkdown = {
  version: 0.5,
  loop: {
    while: ":continue",
  },
  nodes: {
    continue: {
      value: true,
    },
    md: {
      value: "```\n# hello\n```",
      update: ":updateText.text",
    },
    messages: {
      value: [],
      update: ":reducer.array",
    },
    markdownText: {
      agent: "eventAgent",
      params: {
        type: "markdown",
      },
      inputs: {
        markdown: ":md",
      },
    },
    system: {
      agent: "copyAgent",
      inputs: {
        value: [
          "あなたはプレゼンテーションツールmarpをmarkdownで編集する編集者です。",
          "ユーザに従ってmarkdownを更新してください。markdownは```で囲ってください。",
          "markdownは更新がなくても**毎回必ず**返信に含めてください",
          "",
          "今までのmarkdown",
          "",
          "${:markdownText.text}",
        ].join("\n"),
      },
    },
    userInput: {
      agent: "eventAgent",
      params: {
        message: "You:",
        type: "text",
      },
    },
    llm: {
      agent: "openAIAgent",
      isResult: true,
      params: {
        forWeb: true,
        stream: true,
      },
      inputs: {
        system: ":system.value",
        messages: ":messages",
        prompt: ":userInput.text",
      },
    },
    updateText: {
      console: true,
      agent: "stringUpdateTextAgent",
      inputs: {
        newText: ":llm.text.codeBlock()",
        oldText: ":md",
      },
    },
    reducer: {
      agent: "pushAgent",
      inputs: { array: ":messages", items: [":userInput.message", { content: ":llm.text", role: "assistant" }] },
    },
  },
};
