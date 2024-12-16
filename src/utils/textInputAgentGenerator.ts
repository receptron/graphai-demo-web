import { AgentFunction, AgentFunctionContext } from "graphai";
import { ref } from "vue";

export const textInputAgentGenerator = () => {
  const inputPromise = ref<{ task: (message: string) => void; id: string; nodeId: string; agentId?: string }[]>([]);
  const submit = (id: string, value: string, success?: () => void) => {
    if (inputPromise.value.length > 0) {
      const index = inputPromise.value.findIndex((inp) => inp.id === id); //shift();
      if (index > -1) {
        inputPromise.value[index].task(value);
        inputPromise.value.splice(index, 1);
        if (success) {
          success();
        }
      }
    }
  };
  const textPromise = (context: AgentFunctionContext) => {
    const id = Math.random().toString(32).substring(2);
    return new Promise((resolved) => {
      const task = (message: string) => {
        resolved(message);
      };
      const { nodeId, agentId } = context.debugInfo;
      inputPromise.value.push({ task, id, nodeId, agentId });
    });
  };

  const textInputAgent: AgentFunction = async (context) => {
    const result = await textPromise(context);
    console.log(result);
    return {
      text: result as string,
      message: { role: "user", content: result as string },
    };
  };
  return {
    textInputAgent,
    inputPromise,
    submit,
  };
};
