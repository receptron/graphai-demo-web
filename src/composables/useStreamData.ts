import { AgentFunctionContext, TransactionLog } from "graphai";
import { GraphAILLMStreamData } from "@graphai/llm_utils";
import { ref } from "vue";
import { streamAgentFilterGenerator } from "@graphai/stream_agent_filter";

type GraphAILLMStreamDataToolsProgress = {
  type: "response.in_progress";
  response: {
    output: {
      type: "tool_calls";
      function: {
        arguments: string;
      };
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
        if (token.response.output[0].type === "text") {
          const chunk = token.response.output[0].text;
          streamData.value[nodeId] = (streamData.value[nodeId] || "") + chunk;
        }
        if (token.response.output[0].type === "tool_calls" && token.response.output[0]?.function?.arguments) {
          streamData.value[nodeId] = (streamData.value[nodeId] || "") + token.response.output[0]?.function?.arguments;
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
