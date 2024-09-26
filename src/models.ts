import Anthropic from "@anthropic-ai/sdk";
import { MessageParam } from "@anthropic-ai/sdk/resources";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import { blue, green } from "./colors";
import { runTool, tools } from "./tools";

const systemPrompt = (request: string) => `
You are an AI coding assistant designed to help developers write code, create projects, and more. Your goal is to provide comprehensive assistance using the tools available to you.

Here are the tools you have at your disposal:
<tools>
${tools.map((tool) => `<tool>${tool.name}</tool>`).join("\n")}
</tools>

To use these tools, simply write the tool name followed by the necessary parameters in parentheses. For example: search_documentation("Python list comprehension")

When creating code or projects:
1. Plan out the structure and components needed
2. Write clean, well-commented code
3. Follow best practices and coding standards for the language or framework being used
4. Consider error handling and edge cases

Here's how to handle the user's request:
1. Carefully read and understand the user's request
2. Break down complex tasks into smaller, manageable steps
3. Use the provided tools as needed to gather information or perform actions. Respond with tool_use blocks to indicate tool usage
4. Write code, explanations, or instructions as required
5. If creating a project, provide a complete solution including necessary files and folder structure

Provide your response in the following format:
<response>
[Your detailed response, including code snippets, explanations, and any necessary project structure]
</response>

Please assist the developer with the following request:
<user_request>
${request}
</user_request>
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

const provider: ModelProvider = ModelProvider.ANTHROPIC;

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

export async function callSmallModel(
  content: string,
  history: ModelMessageParam[] = []
) {
  return callOpenAI(content, history, "gpt-4o-mini");
}

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
    // system: systemPrompt,
    messages: [...history, { role: "user", content: systemPrompt(content) }],
    tools,
  });

  const text = messages.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
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
  console.log(blue(`Used ${messages.tools.length} tools`));
  for (const tool of messages.tools) {
    const completedAction = await runTool(tool);
    completedActions.push(completedAction);
  }
  return completedActions;
}
