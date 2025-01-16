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
      update: ":updatedText.resultText.text",
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
        prompt: ":userInput.text",
      },
    },
    updateText: {
      agent: "nestedAgent",
      inputs: {
        newText: ":llm.text.codeBlock()",
        oldText: ":md",
      },
      graph: {
        version: 0.5,
        nodes: {
          isNewText: {
            if: ":newText",
            agent: "copyAgent",
            inputs: {
              text: ":newText",
            },
          },
          isOldText: {
            unless: ":newText",
            agent: "copyAgent",
            inputs: {
              text: ":oldText",
            },
          },
          updatedText: {
            agent: "copyAgent",
            anyInput: true,
            inputs: {
              text: [":isNewText.text", ":isOldText.text"],
            },
          },
          resultText: {
            agent: "copyAgent",
            anyInput: true,
            inputs: {
              text: updatedText.text.$0,
            },
          },
        },
      },
    },
    reducer: {
      agent: "pushAgent",
      inputs: { array: ":messages", items: [":userInput.message", { content: ":llm.text", role: "assistant" }] },
    },
  },
};
