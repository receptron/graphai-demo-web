import { ref } from "vue";
import { TransactionLog } from "graphai";

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
