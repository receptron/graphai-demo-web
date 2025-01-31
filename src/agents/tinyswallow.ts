import { AgentFunction, AgentFunctionInfo } from "graphai";
import { getMergeValue, getMessages } from "@graphai/llm_utils";

import * as webllm from "@mlc-ai/web-llm";

const appConfig = {
  model_list: [
    {
      model: "https://huggingface.co/SakanaAI/TinySwallow-1.5B-Instruct-q4f32_1-MLC",
      model_id: "TinySwallow-1.5B",
      model_lib:
        // https://github.com/mlc-ai/binary-mlc-llm-libs/tree/main/web-llm-models/v0_2_48
        webllm.modelLibURLPrefix + webllm.modelVersion + "/Qwen2-1.5B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
    },
  ],
};

let engine: null | webllm.MLCEngine = null;

let callback = (__report: webllm.InitProgressReport) => {
  console.log("not implement callback");
};
export type CallbackReport = webllm.InitProgressReport;
export const modelLoad = (_callback: (report: webllm.InitProgressReport) => void) => {
  callback = _callback;
};

export const updateEngineInitProgressCallback: webllm.InitProgressCallback = (report: webllm.InitProgressReport) => {
  // console.log("initialize", report.progress);
  // console.log(report.text);
  callback(report);
};
export const loadEngine = async () => {
  if (engine === null) {
    /* eslint new-cap: 0 */
    /* eslint require-atomic-updates: 0 */
    engine = await webllm.CreateMLCEngine("TinySwallow-1.5B", {
      appConfig,
      initProgressCallback: updateEngineInitProgressCallback,
    });
  }
  return engine;
};

export const tinyswallowAgent: AgentFunction = async ({ filterParams, params, namedInputs, config }) => {
  const { system, prompt, messages } = {
    ...params,
    ...namedInputs,
  };

  const { stream } = {
    ...(config || {}),
    ...params,
  };

  const userPrompt = getMergeValue(namedInputs, params, "mergeablePrompts", prompt);
  const systemPrompt = getMergeValue(namedInputs, params, "mergeableSystem", system);

  const messagesCopy = getMessages<webllm.ChatCompletionMessageParam>(systemPrompt, messages);

  if (userPrompt) {
    messagesCopy.push({
      role: "user",
      content: userPrompt,
    });
  }

  if (engine === null) {
    engine = await loadEngine();
  }

  const completion = await engine.chat.completions.create({
    stream: true,
    messages: messagesCopy,
    stream_options: { include_usage: true },
    temperature: 0.7,
    top_p: 0.95,
    logit_bias: { "14444": -100 },
    // repetition_penalty: 1.2,
    frequency_penalty: 0.5,
  });

  const tokens = [];
  for await (const chunk of completion) {
    if (chunk.choices && chunk.choices[0]) {
      const token = chunk.choices[0].delta.content;
      tokens.push(token);
      if (stream && filterParams && filterParams.streamTokenCallback && token) {
        filterParams.streamTokenCallback(token);
      }
    }
  }
  const text = tokens.join("");
  const message = {
    role: "assistant" as const,
    content: text,
  };
  messagesCopy.push(message);

  return {
    message,
    messages: messagesCopy,
    text,
  };
};

const tinyswallowAgentInfo: AgentFunctionInfo = {
  name: "tinyswallowAgent",
  agent: tinyswallowAgent,
  mock: tinyswallowAgent,
  inputs: {},
  output: {},
  params: {},
  outputFormat: {},
  samples: [],
  description: "Tinyswallow Agent",
  category: ["llm"],
  author: "Receptron team",
  repository: "https://github.com/receptron/graphai",
  license: "MIT",
  stream: true,
  npms: ["tinyswallow"],
  environmentVariables: [],
};

export default tinyswallowAgentInfo;
