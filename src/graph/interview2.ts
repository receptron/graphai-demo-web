export const graph_data = {
  version: 0.5,
  nodes: {
    system_interviewer: {
      value:
        "あなたはプロのインタビュアーです。相手の個性や本質を深掘りし、時には鋭い質問を投げかけながら、核心に迫るインタビューを行ってください。観客を引き込むために、質問は一つずつ投げかけ、相手の回答にしっかり反応してから次の話題に進んでください。対話の流れを大切にし、相手の言葉からさらに深い洞察を引き出してください。",
    },
    name: {
      value: "",
    },
    context: {
      // prepares the context for this interview.
      agent: "copyAgent",
      inputs: {
        person0: {
          name: "interviewer",
          system: ":system_interviewer",
        },
        person1: {
          name: ":name",
          system: "あなたは${:name}です.",
          greeting: "こんにちは、私は${:name}です",
        },
      },
    },
    chat: {
      // performs the conversation using nested graph
      agent: "nestedAgent",
      inputs: {
        messages: [
          {
            role: "system",
            content: ":context.person0.system",
          },
          {
            role: "user",
            content: ":context.person1.greeting",
          },
        ],
        context: ":context",
      },
      graph: {
        loop: {
          count: 6,
        },
        nodes: {
          messages: {
            // Holds the conversation, array of messages.
            value: [], // to be filled with inputs[2]
            update: ":swappedMessages",
          },
          context: {
            // Holds the context, which is swapped for each iteration.
            value: {}, // te be mfilled with inputs[1]
            update: ":swappedContext",
          },
          llm: {
            // Sends those messages to the LLM to get a response.
            agent: "tinyswallowAgent",
            isResult: true,
            params: {
              model: "gpt-4o",
              stream: true,
            },
            inputs: { messages: ":messages" },
          },
          output: {
            // Displays the response to the user.
            agent: "copyAgent",
            inputs: {
              message: {
                content: ":llm.text",
                role: ":context.person1.name",
              },
            },
          },
          reducer: {
            // Append the responce to the messages.
            agent: "pushAgent",
            inputs: { array: ":messages", item: { content: ":llm.message.content", role: ":llm.message.role" } },
          },
          swappedContext: {
            // Swaps the context
            agent: "propertyFilterAgent",
            params: {
              swap: {
                person0: "person1",
              },
            },
            inputs: { item: ":context" },
          },
          swappedMessages: {
            // Swaps the user and assistant of messages
            agent: "propertyFilterAgent",
            params: {
              inject: [
                {
                  propId: "content",
                  index: 0,
                  from: 1,
                },
              ],
              alter: {
                role: {
                  assistant: "user",
                  user: "assistant",
                },
              },
            },
            inputs: { array: [":reducer.array", ":swappedContext.person0.system"] },
          },
        },
      },
    },
  },
};
