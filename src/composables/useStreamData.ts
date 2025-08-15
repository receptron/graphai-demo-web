import { AgentFunctionContext, TransactionLog } from "graphai";
import { GraphAILLMStreamData } from "@graphai/llm_utils";
import { ref } from "vue";
import { streamAgentFilterGenerator } from "@graphai/stream_agent_filter";

export type GraphAILLMStreamDataToolsProgress = {
  type: "response.in_progress";
  response: {
    output: {
      type: "tool_calls";
      data: {
        id?: string;
        type: "function";
        function: {
          arguments: string;
          name: string;
        };
        index: number;
      }[];
    }[];
  };
};

export const useStreamData = () => {
  const streamData = ref<Record<string, string>>({});
  const isStreaming = ref<Record<string, boolean>>({});

  const outSideFunciton = (context: AgentFunctionContext, token: string | GraphAILLMStreamData | GraphAILLMStreamDataToolsProgress) => {
    const { nodeId } = context.debugInfo;
    if (typeof token === "object" && "type" in token) {
      if (token.type === "response.in_progress") {
        const output = token.response.output[0];
        console.log(output);
        if ("type" in output && output.type === "text") {
          const chunk = output.text;
          streamData.value[nodeId] = (streamData.value[nodeId] || "") + chunk;
        }
        if ("type" in output && output.type === "tool_calls" && output?.data?.[0].function?.arguments) {
          streamData.value[nodeId] = (streamData.value[nodeId] || "") + output?.data?.[0].function?.arguments;
        }
      } else {
        if (token.type === "response.created") {
          isStreaming.value[nodeId] = true;
        }
        if (token.type === "response.completed") {
          isStreaming.value[nodeId] = false;
          streamData.value[nodeId] = "";
        }
      }
    } else {
      streamData.value[nodeId] = (streamData.value[nodeId] || "") + token;
    }
  };

  const resetStreamData = (nodeId: string) => {
    if (streamData.value[nodeId]) {
      streamData.value[nodeId] = "";
    }
  };

  const streamAgentFilter = streamAgentFilterGenerator<string>(outSideFunciton);

  const streamPlugin = (targetNodeId: string[]) => {
    return (log: TransactionLog) => {
      const { nodeId, state } = log;
      if (targetNodeId.includes(nodeId)) {
        if (state === "completed") {
          isStreaming.value[nodeId] = false;
        }
        if (state === "queued") {
          resetStreamData(nodeId);
        }
        if (state === "executing") {
          isStreaming.value[nodeId] = true;
        }
      }
    };
  };

  return {
    streamData,
    streamAgentFilter,
    resetStreamData,
    streamPlugin,
    isStreaming,
  };
};
