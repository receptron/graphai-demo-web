import { ref } from "vue";
import { TransactionLog } from "graphai";
import { eventAgentGenerator, EventData } from "@receptron/event_agent_generator";

export const useLogs = () => {
  const logs = ref<unknown[]>([]);
  const transitions = ref<unknown[]>([]);

  const updateLog = (log: TransactionLog) => {
    const { nodeId, state, inputs, result, errorMessage } = log;
    if (logs.value.length > 0 && (logs.value[logs.value.length - 1] as { nodeId: string }).nodeId === nodeId) {
      transitions.value[transitions.value.length - 1] += " → " + state;
    } else {
      transitions.value.push(nodeId + ": " + state);
    }
    logs.value.push({ nodeId, state, inputs, result, errorMessage });
  };

  const resetLog = () => {
    logs.value = [];
    transitions.value = [];
  };

  return {
    logs,
    transitions,
    updateLog,
    resetLog,
  };
};

export const textInputEvent = () => {
  const userInput = ref("");

  const events = ref<Record<string, EventData>>({});
  const { eventAgent } = eventAgentGenerator((id, data) => {
    events.value[id] = data;
  });
  const submitText = (event: EventData) => {
    const data = {
      text: userInput.value,
      message: { role: "user", content: userInput.value },
    };
    event.onEnd(data);
    /* eslint-disable @typescript-eslint/no-dynamic-delete */
    delete events.value[event.id];
    userInput.value = "";
  };

  return {
    eventAgent,
    userInput,
    events,
    submitText,
  };
};
