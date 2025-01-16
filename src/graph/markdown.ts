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
      update: ":updatedMarkdown.text.$0",
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
          "${:md}",
        ].join("\n"),
      },
    },
    messages: {
      value: [],
      update: ":reducer.array",
    },
    userInput: {
      agent: "textInputAgent",
      params: {
        message: "You:",
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
        prompt: ":userInput.text" },
    },
    output: {
      console: true,
      agent: "copyAgent",
      inputs: {
        text: "${:llm.text.codeBlock()}",
      },
    },
    newMarkdown: {
      if: ":output.text",
      console: true,
      agent: "copyAgent",
      inputs: {
        text: ":output.text"
      },
    },
    oldMarkdown: {
      console: true,
      unless: ":output.text",
      agent: "copyAgent",
      inputs: {
        text: ":md"
      },
    },
    updatedMarkdown: {
      //console: true,
      agent: "copyAgent",
      anyInput: true,
      inputs: {
        text: [":newMarkdown.text", ":oldMarkdown.text"],
      },
    },
    reducer: {
      agent: "pushAgent",
      inputs: { array: ":messages", items: [":userInput.message", { content: ":llm.text", role: "assistant" }] },
    },
  },
};
