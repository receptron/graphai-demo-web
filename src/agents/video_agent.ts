import { AgentFunction } from "graphai";

/* eslint-disable require-await */
const videoAgent: AgentFunction<unknown, { content: string }, { arg: { time: number }; func: string }, { videoElement: HTMLVideoElement | null }> = async ({
  namedInputs,
  config,
}) => {
  if (!config) {
    return { content: "failed" };
  }

  const { videoElement } = config;
  const { arg, func } = namedInputs;
  if (videoElement === null) {
    return { content: "faild" };
  }
  if (func === "pause") {
    videoElement.pause();
  }
  if (func === "play") {
    videoElement.play();
  }
  if (func === "seek") {
    videoElement.currentTime = Number(arg.time ?? 0);
  }
  if (func === "getCurrentTime") {
    return {
      content: JSON.stringify({ currenTimeSeconds: videoElement.currentTime }),
      hasNext: true,
    };
  }

  return { content: "success" };
};

const videoAgentInfo = {
  name: "videoAgent",
  agent: videoAgent,
  mock: videoAgent,
  samples: [],
  description: "",
  category: [],
  author: "",
  repository: "",
  tools: [
    {
      type: "function",
      function: {
        name: "videoAgent--pause",
        description: "pause Video",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
    {
      type: "function",
      function: {
        name: "videoAgent--play",
        description: "play video",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
    {
      type: "function",
      function: {
        name: "videoAgent--seek",
        description: "seek video",
        parameters: {
          type: "object",
          properties: {
            time: {
              type: "number",
              description: "seek time (s)",
            },
          },
          required: ["time"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "videoAgent--getCurrentTime",
        description: "get current time",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
  ],
  license: "",
};

export default videoAgentInfo;
