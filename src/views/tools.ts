type ToolResult = { tool_calls: { id: string; name: string; arguments: unknown }[] };
type MessageResult = { message: { content: string } };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
export const hasToolCalls = (value: unknown): value is ToolResult =>
  isRecord(value) && "tool_calls" in value && Array.isArray(value.tool_calls) && value.tool_calls.length > 0;
export const hasMessage = (value: unknown): value is MessageResult =>
  isRecord(value) && "message" in value && isRecord(value.message) && "content" in value.message && Boolean(value.message.content);
