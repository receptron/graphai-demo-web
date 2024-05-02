import { NodeData } from "graphai/lib/type";
const arrays = (num: number) => {
  return new Array(num).fill(undefined);
};
const randomInt = (num: number) => {
  return Math.floor(Math.random() * num);
};
export const generateGraph = () => {
  const nodes: Record<string, NodeData> = {};
  const inputsNode: string[] = [];
  arrays(10).forEach((__i, k) => {
    const name = "static_" + k;
    inputsNode.push(name);
    nodes[name] = {
      value: name,
    };
  });

  arrays(50).forEach((__i, k) => {
    const name = "node_" + k;

    const inputs = arrays(randomInt(4)).map(() => {
      const rand = randomInt(inputsNode.length);
      return inputsNode[rand];
    });
    nodes[name] = {
      agentId: "sleepTestAgent",
      params: {
        duration: randomInt(10) * 400,
      },
      inputs,
    };
    inputsNode.push(name);
  });

  return {
    nodes,
  };
};
