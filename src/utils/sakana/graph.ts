import idea_first_prompt from "./text?raw";

import seed_ideas_text from "./grokking/seed_ideas.json?raw";
import promptText from "./grokking/prompt.json?raw";
import code  from "./grokking/experiment.py?raw";

export { code } 
export const seedIdeas = JSON.parse(seed_ideas_text);
export const prompt =  JSON.parse(promptText);

export const getGraphData = (maxNumGenerations: number, numReflections: number) => {
  const graphData = {
    version: 0.5,
    loop: {
      count: maxNumGenerations,
    },
    nodes: {
      idea_str_archive: {
        value: [], // array. injectValue
        update: ":nextIdeas.array",
      },
      ideaSystemPrompt: {},
      taskDescription: {},
      code: {},
      ideaPrompt: {
        agent: "stringTemplateAgent",
        params: {
          template: idea_first_prompt,
        },
        inputs: {
          taskDescription: ":taskDescription",
          code: ":code",
          numReflections,
          prev_ideas_string: ":idea_str_archive.join(,)",
        },
        // isResult: true,
      },
      task1: {
        agent: "openAIAgent",
        params: {
          prompt: ":ideaPrompt",
          system: ":ideaSystemPrompt",
          forWeb: true,
          apiKey: import.meta.env.VITE_OPEN_API_KEY,
        },
      },
      jsonParse: {
        agent: "jsonParserAgent", // just for data validate
        inputs: { text: ":task1.text" },
        // isResult: true,
      },
      improveTask: {
        agent: "nestedAgent",
        inputs: {
          history: [
            { role: "user", content: ":ideaPrompt" },
            { role: "assistant", content: ":task1.text" },
          ],
          ideaSystemPrompt: ":ideaSystemPrompt",
        },
        graph: {
          version: 0.5,
          loop: {
            count: numReflections - 1,
          },
          nodes: {
            history: {
              value: "",
              update: ":task2.messages",
            },
            counter: {
              value: 2, // j + 2, j is loop counter
              update: ":counter.add(1)",
            },
            prompt: {
              agent: "stringTemplateAgent",
              params: {
                template: idea_first_prompt,
              },
              inputs: {
                current_round: [":counter"],
                numReflections,
              },
            },
            task2: {
              agent: "openAIAgent",
              params: {
                system: ":ideaSystemPrompt",
                model: "gpt-4o-mini",
                forWeb: true,
                apiKey: import.meta.env.VITE_OPEN_API_KEY,
              },
              inputs: {
                messages: ":history",
                prompt: ":prompt",
              },
              isResult: true,
            },
          },
        },
      },
      nextIdeas: {
        agent: "pushAgent",
        inputs: {
          array: ":idea_str_archive",
          item: ":improveTask.task2.text.codeBlock()",
        },
      },
      debug: {
        agent: "copyAgent",
        isResult: true,
        // console: {after: true},
        inputs: { last_history: ":improveTask.task2" },
      },
    },
  };
  return graphData;
};
