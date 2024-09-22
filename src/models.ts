import Anthropic from "@anthropic-ai/sdk";
import { MessageParam } from "@anthropic-ai/sdk/resources";
import { tools, runTool } from "./tools";
import { blue, green } from "./colors";

export async function callAnthropic(
  content: string,
  history: MessageParam[] = []
) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const messages: Anthropic.Message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 8024,
    system: `You are an expert developer, and I am a computer program. 
        I am here to help you with your coding tasks. I create code examples, write documentation, and more. 
        I can create files and directories. Any code should be returned in the tools section and NOT in the message content.`,
    messages: [...history, { role: "user", content }],
    tools,
  });

  return messages.content;
}

export function parseResponse(messages: Anthropic.ContentBlock[]) {
  console.log(messages);
  // Parse the response from the Anthropic API and return the relevant information
  for (const message of messages) {
    console.log(blue(`💭 Processing message: ${message.type}`));
    switch (message.type) {
      case "text":
        const text = message.text;
        console.log(green(text));
        break;
      case "tool_use":
        const tool = message as Anthropic.ToolUseBlock;
        runTool(tool);
        break;
    }
  }
}
