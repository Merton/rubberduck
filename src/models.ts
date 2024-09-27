import Anthropic from "@anthropic-ai/sdk";
import {
  MessageParam,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources";
import { blue, green } from "./colors";
import {
  ModelMessageParam,
  ModelProvider,
  ModelResponse,
  ModelToolUseBlock,
  systemPrompt,
} from "./model-utils";
import { CompletedAction, runTool, tools } from "./tools";

const provider: ModelProvider = ModelProvider.ANTHROPIC;

export async function callModel(
  content: string,
  history: ModelMessageParam[] = [],
  toolResults?: CompletedAction[]
): Promise<ModelResponse> {
  switch (provider) {
    case ModelProvider.OPENAI:
      console.log("Not implemented");
      break;
    // return callOpenAI(content, history);

    case ModelProvider.ANTHROPIC:
      return callAnthropic(content, history, toolResults);
    default:
      throw new Error(`Invalid model provider: ${provider}`);
  }
  throw new Error("Model provider not implemented");
}

export async function callAnthropic(
  content: string,
  history: MessageParam[] = [],
  toolResults: CompletedAction[] = []
): Promise<ModelResponse> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const formattedToolResult: ToolResultBlockParam[] = toolResults?.map(
    (tool) => {
      return {
        type: "tool_result",
        tool_use_id: tool.id,
        content: tool.result,
        is_error: tool.isError,
      };
    }
  );

  if (!content && formattedToolResult && formattedToolResult.length > 0) {
    console.log(green("Sending completed tool result to anthropic"));
  }

  const messageContent =
    content !== "" && formattedToolResult ? content : formattedToolResult;

  if (!content && !formattedToolResult) {
    throw new Error("No content or tool results provided");
  }

  const messages: Anthropic.Message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 8024,
    system: systemPrompt(""),
    messages: [...history, { role: "user", content: messageContent }],
    tools,
  });

  const text = messages.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
  const toolUses = messages.content.filter(
    (block) => block.type === "tool_use"
  );

  const updatedHistory = [
    ...history,
    { role: "user" as const, content: messageContent },
    { role: "assistant" as const, content: messages.content },
  ];
  return { text, history: updatedHistory, tools: toolUses };
}

export async function actionTools(toolsUsed: ModelToolUseBlock[]) {
  // Parse the response from the Anthropic API and return the relevant information
  const completedActions = [];
  console.log(blue(`Used ${toolsUsed.length} tools`));
  for (const tool of toolsUsed) {
    const completedAction = await runTool(tool);
    completedActions.push(completedAction);
  }
  return completedActions;
}
