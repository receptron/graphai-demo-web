import { GraphData } from "graphai";
import { ref } from "vue";
import { randomInt } from "./graph";

class WordStreamer {
  public onWord = (__word: string | undefined) => {
    // This method will be overridden later
  };
  private message: string;
  constructor(message: string) {
    this.message = message;
  }
  public run() {
    const words = this.message.split(" ");
    const next = () => {
      setTimeout(() => {
        const word = words.shift();
        this.onWord(word);
        if (word) {
          next();
        }
      }, randomInt(800));
    };
    next();
  }
}

export const useGraphData = () => {
  const words = ref<Record<string, string[]>>({});

  const faucatGenerator = (key: string) => {
    words.value[key] = [];
    return (namedInputs: { streamer: WordStreamer }) => {
      const { streamer } = namedInputs;
      return new Promise((resolve) => {
        streamer.run();
        streamer.onWord = (word: string | undefined) => {
          if (word) {
            words.value[key].push(word);
          } else {
            resolve(words.value[key].join(" "));
          }
        };
      });
    };
  };

  const messages = [
    "May the force be with you.",
    "You must unlearn what you have learned.",
    "No. Try not. Do or do not. There is no try.",
    "Named must your fear be before banish it, you can.",
    "Already know you, that which you need.",
    "When you look at the dark side, careful you must be … for the dark side looks back.",
    "Train yourself to let go of everything you fear to lose.",
    "Patience you must have my young padawan.",
    "Much to learn you still have…my old padawan.",
    "Always in motion is the future.",
    "Always two there are, no more, no less. A master and an apprentice.",
    "Use your feelings, Obi-Wan, and find him you will.",
    "I cannot teach him. The boy has no patience.",
    "The dark side clouds everything. Impossible to see the future is.",
    "A Jedi’s strength flows from the Force.",
    "Hmm. In the end, cowards are those who follow the dark side.",
  ];

  const graphdata_any: GraphData = {
    version: 0.5,
    concurrency: 3,
    nodes: {
      message: {
        value: messages,
      },
    },
  };

  Array.from(messages.keys()).forEach((key) => {
    // const message = messages[k];
    graphdata_any.nodes["source" + key] = {
      agent: (namedInputs: { message: string }) => {
        const { message } = namedInputs;
        return new WordStreamer(message);
      },
      inputs: { message: ":message.$" + key },
    };
    graphdata_any.nodes["destination" + key] = {
      agent: faucatGenerator("message" + key),
      inputs: { streamer: ":source" + key },
    };
  });

  return {
    graphdata_any,
    words,
  };
};
