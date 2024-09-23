import Anthropic from "@anthropic-ai/sdk";
import { MessageParam } from "@anthropic-ai/sdk/resources";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import { blue, green } from "./colors";
import { runTool, Tools, tools } from "./tools";

const systemPrompt = `
You are an expert developer, and I am a computer program.
I am here to help you with your coding tasks. I create code examples, write documentation, and more.
I can create files and directories. Any code should be returned in the tools section and NOT in the message content.
You can return the following tools: ${tools
  .map((tool) => tool.name)
  .join(", ")}. If you need the result of a tool to proceed, please use the "${
  Tools.getToolResults
}" tool.

Do not say "Let's start with the first step:" or "Next, we will:".
Instead, use the getToolResult tool to get the result of the previous step which will allow you to proceed to the next step.

Think carefully whether you need the result of the previous step to proceed. If you do, use the getToolResult tool. You can call multiple tools in a single message.
`;

export type ModelMessageParam = {
  role: "user" | "assistant";
  content: string;
};

export type ModelContentBlock = {
  type: string;
  text: string;
};

export type ModelToolUseBlock = {
  name: string;
  input: any;
};

export type ModelBlock = ModelContentBlock | ModelToolUseBlock;
export type ModelResponse = {
  text: string | null;
  tools: ModelToolUseBlock[];
};

enum ModelProvider {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
}

const provider: ModelProvider = ModelProvider.OPENAI;

export async function callModel(
  content: string,
  history: ModelMessageParam[] = []
) {
  switch (provider) {
    case ModelProvider.OPENAI:
      return callOpenAI(content, history);

    case ModelProvider.ANTHROPIC:
      return callAnthropic(content, history);
    default:
      throw new Error(`Invalid model provider: ${provider}`);
  }
}

export async function callOpenAI(
  content: string,
  history: ChatCompletionMessageParam[] = []
): Promise<ModelResponse> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
  });

  const messages = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...history,
      { role: "user", content },
    ],
    tools: tools.map((tool) => {
      return {
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.input_schema,
        },
      };
    }),
  });
  console.log(JSON.stringify(messages.choices));
  const choice = messages.choices[0];
  const text = choice.message.content;
  const toolUses = (choice.message.tool_calls ?? []).map((tool) => {
    return {
      name: tool.function.name,
      input: JSON.parse(tool.function.arguments),
    };
  });

  return { text, tools: toolUses };
}

export async function callAnthropic(
  content: string,
  history: MessageParam[] = []
): Promise<ModelResponse> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const messages: Anthropic.Message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 8024,
    system: systemPrompt,
    messages: [...history, { role: "user", content }],
    tools,
  });

  const text = messages.content
    .filter((block) => block.type === "text")
    .join("\n");
  const toolUses = messages.content.filter(
    (block) => block.type === "tool_use"
  );
  return { text, tools: toolUses };
}

export async function actionResponse(messages: ModelResponse) {
  // Parse the response from the Anthropic API and return the relevant information
  const completedActions = [];
  console.log(green(messages.text ?? ""));

  for (const tool of messages.tools) {
    const completedAction = await runTool(tool);
    completedActions.push(completedAction);
    break;
  }
  return completedActions;
}
