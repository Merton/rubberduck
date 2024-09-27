import Anthropic from "@anthropic-ai/sdk";
import {
  ImageBlockParam,
  MessageParam,
  TextBlockParam,
  ToolResultBlockParam,
  ToolUseBlockParam,
} from "@anthropic-ai/sdk/resources";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import { blue, green } from "./colors";
import { CompletedAction, runTool, tools } from "./tools";

const systemPrompt = (request: string) => `
You are an advanced AI coding copilot with access to the file system through a set of provided tools. Your role is to assist programmers in creating projects quickly and efficiently. You must only communicate by using the function tools provided and NEVER respond with direct code.

Here are the tools available to you:
<available_tools>
${tools
  .map(
    (tool) =>
      `<tool><name>${tool.name}</name><description>${
        tool.description
      }</description><input_schema>${JSON.stringify(
        tool.input_schema
      )}</input_schema></tool>`
  )
  .join("\n")}
</available_tools>

You will receive the result of the function call, which you can use to inform your next action or response.

Guidelines for interaction:
1. Always use the provided tools to perform actions on the file system.
2. Never write or suggest code directly in your responses.
3. If you need more information to complete a task, use the appropriate tool to gather that information.
4. If a requested action is not possible with the available tools, explain why and suggest an alternative approach if possible.
5. Always think through your approach before making function calls.


Begin by analyzing the request in a <thinking> block. Then, use the appropriate tools to complete the task. If multiple steps are required, explain each step before executing it.

Format your final response like this:
<response>
(Your explanation of what was done and any relevant information)
</response>

Remember, your goal is to assist the programmer efficiently while only using the provided tools and never writing code directly in your responses.
`;

// Use the getToolResult tool to get the result of the previous step which will allow you to proceed to the next step.

// Think carefully whether you need the result of the previous step to proceed. If you do, use the getToolResult tool.
// You can call multiple tools in a single message.

const miniPrompt = `
  You are an expert solutions architect. A developer will give you a high level idea or topic. Your job is to return the next steps to implement the idea or topic. You can return the following tools: ${tools
    .map((tool) => tool.name)
    .join(", ")}".
  Do not provide code examples. Nor is it your job to execute. You purely inspire and help the developer to implement the idea or topic.

  The steps should expand on the original idea or topic, and be used to follow as a guide to implement the idea or topic. It could be naming the files and what they should do, creating or listing directories.
  It should be in the format:

  # Steps
  - 1. ...
  - 2. ...
`;

export type ModelMessageParam = {
  role: "user" | "assistant";
  content:
    | string
    | (
        | ToolResultBlockParam
        | TextBlockParam
        | ImageBlockParam
        | ToolUseBlockParam
      )[];
};

export type ModelContentBlock = {
  type: string;
  text: string;
};

export type ModelToolUseBlock = {
  id: string;
  name: string;
  input: any;
};

export type ModelBlock = ModelContentBlock | ModelToolUseBlock;
export type ModelResponse = {
  text: string | null;
  history?: ModelMessageParam[];
  tools: ModelToolUseBlock[];
};

enum ModelProvider {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
}

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

// export async function callSmallModel(
//   content: string,
//   history: ModelMessageParam[] = []
// ) {
//   return callOpenAI(content, history, "gpt-4o-mini");
// }

export async function callOpenAI(
  content: string,
  history: ChatCompletionMessageParam[] = [],
  model: "gpt-4o" | "gpt-4o-mini" = "gpt-4o"
): Promise<ModelResponse> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
  });

  const messages = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: model == "gpt-4o" ? systemPrompt(content) : miniPrompt,
      },
      ...history,
      { role: "user", content },
    ],
    tool_choice: "auto",
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
  const choice = messages.choices[0];
  const text = choice.message.content;
  const toolUses = (choice.message.tool_calls ?? []).map((tool) => {
    return {
      id: tool.id,
      name: tool.function.name,
      input: JSON.parse(tool.function.arguments),
    };
  });

  return { text, tools: toolUses };
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
