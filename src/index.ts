import Anthropic from "@anthropic-ai/sdk";
import { MessageParam } from "@anthropic-ai/sdk/resources";
import * as readline from "node:readline/promises";
import { callAnthropic, parseResponse } from "./models";
import { blue } from "./colors";

async function askForInput(rl: readline.Interface) {
  return await rl.question(
    "What would you like to do? (Type 'exit' to quit)\n"
  );
}

function flattenMessages(messages: Anthropic.ContentBlock[]): string {
  return messages
    .map((message) => {
      if (message.type === "text") {
        return message.text;
      } else if (message.type === "tool_use") {
        return `Tool used: ${JSON.stringify(message.input)}`;
      }
    })
    .join("\n");
}

async function main() {
  console.log(blue("Welcome to RubberDuck 🦆"));
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let history: MessageParam[] = [];
  let input = await askForInput(rl);

  while (input !== "exit") {
    if (input.trim() === "") {
      console.log(blue("Please enter a valid command"));
      input = await askForInput(rl);
      continue;
    }
    if (input === "history") {
      console.log(history);
      input = await askForInput(rl);
    }
    if (input === "clear") {
      history = [];
      console.log(blue("History cleared!"));
      input = await askForInput(rl);
    }
    const messages = await callAnthropic(input, history);
    history = [
      ...history,
      { role: "user", content: input },
      { role: "assistant", content: flattenMessages(messages) },
    ];
    parseResponse(messages);

    input = await askForInput(rl);
  }
}

main().then(() => {
  console.log(blue("Good bye"));
});

// //     "Create me a game in html that resembles the classic game, Snake. Provide all the code needed in a single html file"
// Create me a webpage all in one HTML file that mimics windows 95. Include javascript and functionality so that you can open the start menu, open apps in virtual "window"
// Create a windows 95 emulator in HTML. Provide all the content in one file, called "windows95.html". The emulator should have desktop icons, a start menu and clock, as per Windows 95. It should be as realistic as possible, with windows that open, basic tools that came included like a calculator.
