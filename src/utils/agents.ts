import { AgentFunction } from "graphai";
import { sleep } from "@/utils/utils";

export const sleepTestAgent: AgentFunction<{ duration?: number }> = async (context) => {
  const { params, namedInputs } = context;
  await sleep(params?.duration ?? 500);
  if (namedInputs && namedInputs.array) {
    return namedInputs.array[0];
  }
  if (namedInputs && namedInputs.item) {
    return namedInputs.item;
  }
  return "";
};

export const httpAgent: AgentFunction = async ({ params, namedInputs }) => {
  const { agent } = params;
  const url = "https://graphai-demo.web.app/api/agents/" + agent;

  const postData = { params, namedInputs };

  const response = await fetch(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });
  return await response.json();
};

/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint require-await: 0 */
export const slashGPTFuncitons2TextAgent: AgentFunction<
  { function_data_key: string; result_key: number },
  Record<string, string[]>,
  { array: any[] }
> = async ({ params, namedInputs }) => {
  const messages = namedInputs.array.find((message) => message.role === "function_result");
  if (!messages) {
    return null;
  }
  const result = (messages.function_data[params.function_data_key] || []).map((record: Record<string, string>) => {
    const { title, description } = record;
    return ["title:", title, "description:", description].join("\n");
  });
  // console.log(result)
  console.log(result);
  return result;
};
