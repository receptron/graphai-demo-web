import { AgentFunction } from "graphai";
import { sleep } from "@/utils/utils";

export const sleepTestAgent: AgentFunction<{ duration?: number }> = async (context) => {
  const { params, inputs } = context;
  await sleep(params?.duration ?? 500);
  return inputs[0];
};

export const httpAgent: AgentFunction = async ({ inputs, params }) => {
  const { agent } = params;
  const url = "https://graphai-demo.web.app/api/agents/" + agent;

  const postData = { inputs, params };

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
export const slashGPTFuncitons2TextAgent: AgentFunction<{ function_data_key: string; result_key: number }, Record<string, string[]>, any[]> = async ({
  params,
  inputs,
}) => {
  const message = inputs[0].find((mess) => mess.role === "function_result");
  if (!message) {
    return null;
  }
  const result = (message.function_data[params.function_data_key] || []).map((record: Record<string, string>) => {
    const { title, description } = record;
    return ["title:", title, "description:", description].join("\n");
  });
  // console.log(result)
  console.log(result);
  return result;
};
