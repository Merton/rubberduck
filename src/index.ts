import * as readline from "node:readline/promises";
import { blue, green, red } from "./colors";
import {
  actionResponse,
  callModel,
  callSmallModel,
  ModelMessageParam,
  ModelResponse,
} from "./models";
import { CompletedAction, Tools, tools } from "./tools";

async function askForInput(rl: readline.Interface) {
  return await rl.question(
    "What would you like to do? (Type 'exit' to quit)\n"
  );
}

function flattenMessages(messages: ModelResponse): string {
  const text = messages.text || "";
  const tools = messages.tools.map((tool) => {
    return `Tool used: ${tool.name}. Input: ${JSON.stringify(tool.input)}`;
  });
  return `${text}\n${tools.join("\n")}`;
}

async function actionInput(input: string, history: ModelMessageParam[] = []) {
  let completedActions: CompletedAction[] = [];
  try {
    // const enhancedResult = await callSmallModel(input);
    // const enhancedInput = enhancedResult.text ?? input;
    // console.log(green(enhancedInput));
    const messages = await callModel(input, history);
    console.log(green(messages.text ?? ""));
    history = [
      ...history,
      { role: "user", content: input },
      { role: "assistant", content: flattenMessages(messages) },
    ];
    completedActions = await actionResponse(messages);
    if (completedActions.length > 0) {
      console.log(
        blue(
          `Completed ${completedActions.length} action${
            completedActions.length > 1 ? "s" : ""
          }.`
        )
      );
      history = [
        ...history,
        {
          role: "user",
          content: `Executing ${
            completedActions.length
          } tool actions. Tools: [${completedActions.map(
            (action) => action?.tool
          )}]`,
        },
        {
          role: "assistant",
          content: `Completed ${
            completedActions.length
          } tool actions. Results: ${JSON.stringify(completedActions)}`,
        },
      ];
    }
  } catch (error) {
    console.error(red("An error occurred calling anthropic: "), error);
  }
  return { completedActions, history };
}

async function actionInternalInputCommands(
  rl: readline.Interface,
  input: string,
  history: ModelMessageParam[]
) {
  let continueInput = false;
  if (input.trim() === "") {
    console.log(blue("Please enter a valid command"));
    input = await askForInput(rl);
    continueInput = true;
  }
  if (input === "history") {
    console.log(history);
    input = await askForInput(rl);
    continueInput = true;
  }
  if (input === "clear") {
    history = [];
    console.log(blue("History cleared!"));
    input = await askForInput(rl);
    continueInput = true;
  }
  if (input === "tools") {
    console.log(blue("Available tools:"));
    console.log(blue(tools.map((tool) => tool.name).join(", ")));
    input = await askForInput(rl);
    continueInput = true;
  }
  return { input, history, continueInput };
}

async function main() {
  console.log(blue("Welcome to RubberDuck 🦆"));
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let history: ModelMessageParam[] = [];
  let input = await askForInput(rl);

  while (input !== "exit") {
    const res = await actionInternalInputCommands(rl, input, history);
    input = res.input;
    history = res.history;
    if (res.continueInput) {
      continue;
    }
    let actions = await actionInput(input, history);
    history = actions.history;
    let continueAction = actions.completedActions.find(
      (action) => action.tool === Tools.getToolResults
    );
    while (continueAction) {
      console.log(blue(`Continuing with action: ${continueAction.result}`));
      actions = await actionInput(continueAction.result, history);
      continueAction = actions.completedActions.find(
        (action) => action.tool === Tools.getToolResults
      );
    }
    input = await askForInput(rl);
  }
}

main().then(() => {
  console.log(blue("Good bye"));
});

// //     "Create me a game in html that resembles the classic game, Snake. Provide all the code needed in a single html file"
// Create me a webpage all in one HTML file that mimics windows 95. Include javascript and functionality so that you can open the start menu, open apps in virtual "window"
// Create a windows 95 emulator in HTML. Provide all the content in one file, called "windows95.html". The emulator should have desktop icons, a start menu and clock, as per Windows 95. It should be as realistic as possible, with windows that open, basic tools that came included like a calculator.
