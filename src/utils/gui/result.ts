const resultsOfInner = (input: unknown, nodes: Record<string, string | string[]>): unknown => {
  if (Array.isArray(input)) {
    return input.map((inp) => resultsOfInner(inp, nodes));
  }
  if (isNamedInputs(input)) {
    return resultsOf(input, nodes);
  }
  if (typeof input === "string") {
    const templateMatch = [...input.matchAll(/\${(:[^}]+)}/g)].map((ma) => ma[1]);
    if (templateMatch.length > 0) {
      const results = resultsOfInner(templateMatch, nodes);
      return Array.from(templateMatch.keys()).reduce((tmp, key) => {
        return tmp.replaceAll("${" + templateMatch[key] + "}", (results as Record<string, string>)[key]);
      }, input);
    }
  }
  return resultOf(input, nodes);
};

export const resultsOf = (inputs: Record<string, unknown>, nodes: Record<string, string | string[]>) => {
  return Object.keys(inputs).reduce((tmp: Record<string, string | string[]>, key) => {
    const input = inputs[key];
    tmp[key] = (isNamedInputs(input) ? resultsOf(input, nodes) : resultsOfInner(input, nodes)) as string | string[];
    return tmp;
  }, {});
};

const resultOf = (source: unknown, nodes: Record<string, string | string[]>) => {
  if (typeof source === "string" && source[0] === ":") {
    const key = source.slice(1);
    if (nodes && nodes[key]) {
      return "${" + nodes[key] + "}";
    }
  }
  return source;
};

const isObject = (x: unknown): x is Record<string, unknown> => {
  return x !== null && typeof x === "object";
};

const isNamedInputs = (namedInputs: unknown): namedInputs is Record<string, unknown> => {
  return isObject(namedInputs) && !Array.isArray(namedInputs) && Object.keys(namedInputs || {}).length > 0;
};
