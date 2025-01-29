export const graph_data = {
  version: 0.5,
  nodes: {
    system_interviewer: {
      value:
        "You are a professional interviewer. It is your job to dig into the personality of the person, making some tough questions. In order to engage the audience, ask questions one by one, and respond to the answer before moving to the next topic.",
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
          system: "You are ${:name}.",
          greeting: "Hi, I'm ${:name}",
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
            agent: "openAIAgent",
            params: {
              model: "gpt-4o",
            },
            inputs: { messages: ":messages" },
          },
          translate: {
            // Asks the LLM to translate it into Japanese.
            agent: "openAIAgent",
            isResult: true,
            params: {
              system: "この文章を日本語に訳して。意訳でも良いので、出来るだけ自然に相手に敬意を払う言葉遣いで。余計なことは書かずに、翻訳の結果だけ返して。",
              model: "gpt-4o",
            },
            inputs: { prompt: ":messages.$last.content" },
          },
          output: {
            // Displays the response to the user.
            agent: "copyAgent",
            inputs: {
              content: ":translate.text",
              role: ":context.person1.name",
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
