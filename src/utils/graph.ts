import { GraphData } from "graphai";
import { NodeData } from "graphai/lib/type";

const arrays = (num: number) => {
  return new Array(num).fill(undefined);
};
export const randomInt = (num: number) => {
  return Math.floor(Math.random() * num);
};
export const randomInt2 = (num: number) => {
  return Math.floor((1 - Math.random() * Math.random()) * num);
};
export const generateGraph = (staticNode: number = 10, computedNode: number = 50, concurrency: number = 8): GraphData => {
  const nodes: Record<string, NodeData> = {};
  const inputsNode: string[] = [];
  // const outputNode: Record<number, string> = {};

  arrays(staticNode).forEach((__i, key) => {
    const name = "static_" + key;
    inputsNode.push(name);
    nodes[name] = {
      value: name,
    };
  });

  arrays(computedNode).forEach((__i, key) => {
    const name = "node_" + key;

    const inputs = arrays(randomInt(3) + 1).map(() => {
      const rand = randomInt2(inputsNode.length);
      return ":" + inputsNode[rand];
    });

    // Ensure that all static nodes are used by other nodes
    if (key < staticNode) {
      inputs.push(":" + inputsNode[key]);
    }

    nodes[name] = {
      agent: "sleepTestAgent",
      params: {
        duration: randomInt(10) * 400,
      },
      priority: Math.random() > 0.5 ? 1 : 0, // 50% will have priority = 1
      inputs: { array: inputs },
    };
    inputsNode.push(name);
  });

  return {
    version: 0.5,
    nodes,
    concurrency,
  };
};

export const agentListApi = async () => {
  const url = "https://graphai-demo.web.app/api/agents";

  const response = await fetch(url);
  return await response.json();
};
