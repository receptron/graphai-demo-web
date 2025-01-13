import { GraphData } from "graphai";
import { randomInt } from "./graph";

export const graph_data: GraphData = {
  version: 0.5,
  loop: {
    while: ":source",
  },
  nodes: {
    source: {
      value: ["orange", "banana", "lemon", "orange", "banana", "lemon", "orange", "banana", "lemon", "orange", "banana", "lemon"],
      update: ":popper.array",
    },
    result: {
      value: [],
      update: ":reducer",
      isResult: true,
    },
    sleeper1: {
      agent: "sleepTestAgent",
      params: {
        duration: 200,
      },
      inputs: { array: [":source"] },
    },
    sleeper2: {
      agent: "sleepTestAgent",
      params: {
        duration: 200,
      },
      inputs: { item: ":sleeper1" },
    },
    sleeper3: {
      agent: "sleepTestAgent",
      params: {
        duration: 200,
      },
      inputs: { item: ":sleeper2" },
    },
    sleeper4: {
      agent: "sleepTestAgent",
      params: {
        duration: 200,
      },
      inputs: { item: ":sleeper3" },
    },
    popper: {
      inputs: { array: ":sleeper4" },
      agent: "popAgent", // returns { array, item }
    },
    reducer: {
      agent: "pushAgent",
      inputs: { array: ":result", item: ":popper.item" },
    },
  },
};

export const graph_data2: GraphData = {
  version: 0.5,
  nodes: {
    node1: {
      value: { message: "Hello World" },
    },
    node2: {
      agent: "sleepTestAgent",
      inputs: { array: [":node1"] },
    },
    node3: {
      agent: "sleepTestAgent",
      inputs: { array: [":node2"] },
    },
    node4: {
      agent: "sleepTestAgent",
      inputs: { array: [":node2", ":node3"] },
    },
    node5: {
      agent: "sleepTestAgent",
      inputs: { array: [":node3", ":node4"] },
    },
    node6: {
      agent: "sleepTestAgent",
      inputs: { array: [":node1", ":node5"] },
    },
    node7: {
      agent: "sleepTestAgent",
      inputs: { array: [":node3", ":node5"] },
    },
    node8: {
      agent: "sleepTestAgent",
      inputs: { array: [":node2", ":node5", ":node3"] },
    },
    node9: {
      agent: "sleepTestAgent",
      inputs: { array: [":node4", ":node8", ":node6"] },
    },
    node10: {
      agent: "sleepTestAgent",
      inputs: { array: [":node5", ":node6", ":node7"] },
    },
    node11: {
      agent: "sleepTestAgent",
      inputs: { array: [":node3", ":node6", ":node7"] },
    },
    node12: {
      agent: "sleepTestAgent",
      inputs: { array: [":node10", ":node11", ":node9"] },
    },
  },
};

export const graph_data_http = {
  version: 0.5,
  nodes: {
    echo: {
      agent: "httpAgent",
      params: {
        agent: "echoAgent",
        message: "hello",
      },
      isResult: true,
    },
    copyAgent: {
      agent: "httpAgent",
      inputs: { text: ":echo.message" },
      params: {
        agent: "copyAgent",
      },
      isResult: true,
    },
    sleepAgent: {
      agent: "httpAgent",
      inputs: { text: ":echo.message" },
      params: {
        agent: "sleeperAgent",
        duration: 1000,
      },
      isResult: true,
    },
    copyAgent2: {
      agent: "httpAgent",
      inputs: { text: ":copyAgent.text" },
      params: {
        agent: "copyAgent",
      },
      isResult: true,
    },
  },
};

export const graph_data_nested = {
  version: 0.5,
  nodes: {
    node1: {
      value: { message: "Hello World" },
    },
    node2: {
      agent: "sleepTestAgent",
      inputs: { array: [":node1"] },
    },
    node3: {
      agent: "sleepTestAgent",
      inputs: { array: [":node2"] },
    },
    node4Nested: {
      agent: "nestedAgent",
      inputs: { node1data: ":node1", node2data: ":node2", node3data: ":node3" },
      graph: {
        nodes: {
          node5Child: {
            agent: "sleepTestAgent",
            inputs: { array: [":node3data"] },
          },
          node6Child: {
            agent: "sleepTestAgent",
            inputs: { array: [":node1data", ":node5Child"] },
            isResult: true,
          },
          node7Child: {
            agent: "sleepTestAgent",
            inputs: { array: [":node3data", ":node5Child"] },
          },
          node8Child: {
            agent: "sleepTestAgent",
            inputs: { array: [":node2data", ":node5Child", ":node3data"] },
          },
          node9Child: {
            agent: "sleepTestAgent",
            inputs: { array: [":node8Child", ":node6Child"] },
            isResult: true,
          },
          node10: {
            agent: "sleepTestAgent",
            inputs: { array: [":node5Child", ":node6Child", ":node7Child"] },
            isResult: true,
          },
        },
      },
    },
    node11: {
      agent: "sleepTestAgent",
      inputs: { array: [":node3", ":node4Nested.node6Child", ":node4Nested.node10"] },
    },
    node12: {
      agent: "sleepTestAgent",
      inputs: { array: [":node11", ":node4Nested.node9Child"] },
    },
  },
};

export const graph_data_co2 = {
  version: 0.5,
  nodes: {
    slashGPTAgent: {
      agent: "httpAgent",
      params: {
        agent: "slashGPTAgent",
        function_result: true,
        query: "世界で協力してco2を減らす方法を教えて下さい",
        manifest: {
          prompt: "あなたは世界経済の専門家です。ユーザの問い合わせについて考え、10この結果をfunctionsの結果に返してください。",
          skip_function_result: true,
          actions: {
            your_ideas: {
              type: "message_template",
              message: "dummy",
            },
          },
          functions: [
            {
              name: "your_ideas",
              description: "Your answer to a user's inquiry",
              parameters: {
                type: "object",
                properties: {
                  methods: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: {
                          type: "string",
                          description: "title",
                        },
                        description: {
                          type: "string",
                          description: "description",
                        },
                      },
                      required: ["title", "description"],
                    },
                  },
                },
              },
            },
          ],
        },
      },
    },
    function2prompt0: {
      params: {
        function_data_key: "methods",
        result_key: 0,
      },
      inputs: { array: ":slashGPTAgent" },
      agent: "slashGPTFuncitons2TextAgent",
    },
    mapNode: {
      agent: "mapAgent",
      inputs: { rows: ":function2prompt0" },
      params: {
        injectionTo: ["memory"],
      },
      isResult: true,
      graph: {
        nodes: {
          slashGPTAgent0: {
            agent: "httpAgent",
            params: {
              agent: "slashGPTAgent",
              manifest: {
                prompt: "ユーザの問い合わせにある文章の専門家です。専門家として、ユーザのアイデアに対して実現可能なシナリオを100文字で書いてください。",
              },
            },
            inputs: { array: [":row"] },
          },
          copyAgent: {
            agent: "copyAgent",
            inputs: { result: ":slashGPTAgent0.$last.content" },
            isResult: true,
          },
        },
      },
    },
  },
};

export const graph_data_stream: GraphData = {
  version: 0.5,
  nodes: {
    echo: {
      agent: "echoAgent",
      params: {
        message: "hello",
      },
    },
  },
};

const messages = [
  "French: Bonjour. Ceci est un test de diffusion en continu.",
  "German: Hallo. Dies ist ein Streaming-Test.",
  "Italian: Ciao. Questo è un test di streaming.",
  "Portuguese: Olá. Este é um teste de streaming.",
  "Chinese (Simplified): 你好。这是一个流媒体测试。",
  "Japanese: こんにちは。これはストリーミングのテストです。",
  "Korean: 안녕하세요. 이것은 스트리밍 테스트입니다.",
  "Hindi: नमस्ते। यह एक स्ट्रीमिंग परीक्षण है।",
  "Dutch: Hallo. Dit is een streamingtest.",
  "Greek: Γεια σας. Αυτό είναι ένα τεστ ροής.",
  "Swedish: Hej. Det här är ett streamingtest.",
  "Turkish: Merhaba. Bu bir akış testidir.",
  "Polish: Cześć. To test przesyłania strumieniowego.",
  "Vietnamese: Xin chào. Đây là một bài kiểm tra phát sóng.",
];

Array.from(messages.keys()).forEach((key) => {
  const message = messages[key];
  const inputs = key > 2 ? { text: ":streamMockAgent" + (key - 3) } : { text: ":echo" };
  graph_data_stream.nodes["streamMockAgent" + key] = {
    agent: "streamMockAgent",
    inputs,
    isResult: true,
    params: {
      message,
      sleep: randomInt(800),
    },
  };
});

export const graphChat = {
  version: 0.5,
  loop: {
    while: ":continue",
  },
  nodes: {
    continue: {
      value: true,
      update: ":checkInput",
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
    checkInput: {
      // Checks if the user wants to terminate the chat or not.
      agent: "compareAgent",
      inputs: { array: [":userInput.text", "!=", "/bye"] },
    },
    llm: {
      agent: "openAIAgent",
      isResult: true,
      params: {
        forWeb: true,
        apiKey: import.meta.env.VITE_OPEN_API_KEY,
        stream: true,
      },
      inputs: { messages: ":messages", prompt: ":userInput.text" },
    },
    output: {
      agent: "stringTemplateAgent",
      inputs: {
        text: "\x1b[32mAgent\x1b[0m: ${:llm.text}",
      },
    },
    reducer: {
      agent: "pushAgent",
      inputs: { array: ":messages", items: [":userInput.message", { content: ":llm.text", role: "assistant" }] },
    },
  },
};

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

export const graphReception = {
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
      value: [
        {
          role: "system",
          content:
            "You are responsible in retrieving following information from the user.\n" +
            "name: both first and last name\n" +
            "dob: date of birth. It MUST include the year\n" +
            "sex: gender (NEVER guess from the name)\n" +
            "When you get all the information from the user, call the function 'report'.\n" +
            "The first message should be a greeting and ask the user for the necessary information.\n",
        },
      ],
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
        apiKey: import.meta.env.VITE_OPEN_API_KEY,
        tools,
      },
      inputs: { messages: ":messages", prompt: ":userInput.text" },
    },
  },
};

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
        apiKey: import.meta.env.VITE_OPEN_API_KEY,
        tools,
      },
      inputs: { messages: ":messages", prompt: ":userInput.text" },
    },
  },
};

export const graphMap = {
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
    debug: {
      agent: "copyAgent",
      inputs: {
        tools: ":tools",
      },
      console: {before: true},
    },
    messages: {
      value: [
        {
          role: "system",
          content:
            "You are an operator for Google Maps. Follow the user's instructions and call the necessary functions accordingly.",
        },
      ],
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
        apiKey: import.meta.env.VITE_OPEN_API_KEY,
        stream: true,
        tools: ":tools",
      },
      inputs: { messages: ":messages", prompt: ":userInput.text" },
    },
    textMessage: {
      unless: ":llm.tool.id",
      console: { before: true, after: true },
      agent: "stringTemplateAgent",
      params: {
        template: { messages: ["${one}", { role: "assistant", content: "${content}" }] },
      },
      inputs: {
        one: ":userInput.message",
        content: ":llm.message.content",
      },
    },
    tool_calls: {
      if: ":llm.tool_calls",
      agent: "mapAgent",
      inputs: { rows: ":llm.tool_calls" },
      params: {
        compositeResult: true,
      },
      graph: {
        version: 0.5,
        nodes: {
          tool: {
            agent: ":row.name.split(--).$0",
            inputs: {
              arg: ":row.arguments",
              func: ":row.name.split(--).$1",
              tool_call: ":row",
            },
          },
          message: {
            isResult: true,
            console: { after: true },
            agent: "copyAgent",
            inputs: {
              role: "tool",
              tool_call_id: ":row.id",
              name: ":row.name",
              content: ":tool.result",
            },
          },
        },
      },
    },
    toolsMessage: {
      agent: "pushAgent",
      console: { before: true },
      inputs: {
        array: [":userInput.message", ":llm.message"],
        items: ":tool_calls.message",
      },
    },
    buffer: {
      agent: "copyAgent",
      anyInput: true,
      inputs: { array: [":textMessage.messages", ":toolsMessage.array"] },
      console: { after: true },
    },
    reducer: {
      agent: "pushAgent",
      inputs: { array: ":messages", items: ":buffer.array.$0" },
    },
  },
};
