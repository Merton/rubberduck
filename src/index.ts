import * as readline from "node:readline/promises";
import { blue, green, red } from "./colors";
import {
  actionTools,
  callModel,
  ModelMessageParam,
  ModelResponse,
} from "./models";
import { CompletedAction, Tools, tools } from "./tools";
import inquirer from "inquirer";
import { program } from "commander";

async function actionPrompt(
  input: string,
  history: ModelMessageParam[] = [],
  toolResults?: CompletedAction[]
) {
  let completedActions: CompletedAction[] = [];
  try {
    const {
      text,
      history: updatedHistory,
      tools,
    } = await callModel(input, history, toolResults);
    console.log(green(text ?? ""));

    completedActions = await actionTools(tools);
    if (completedActions.length > 0) {
      console.log(
        blue(
          `Completed ${completedActions.length} action${
            completedActions.length > 1 ? "s" : ""
          }.`
        )
      );
      return actionPrompt("", updatedHistory, completedActions);
    }
    return { completedActions, history: updatedHistory };
  } catch (error) {
    console.error(red("An error occurred calling anthropic: "), error);
  }
  throw new Error("An error occurred calling");
}

async function actionInternalInputCommands(
  input: string,
  history: ModelMessageParam[]
) {
  let askForInput = true;
  if (input.trim() === "") {
    console.log(blue("Please enter a valid command"));
  } else if (input === "history") {
    console.log(history ?? "No previous mentions");
  } else if (input === "save") {
    const { filename } = await inquirer.prompt([
      {
        type: "input",
        name: "filename",
        message: "Enter filename",
      },
    ]);
    const saveHistory = JSON.stringify(history, null, 2);
    await actionTools([
      {
        id: "save",
        name: Tools.saveToFile,
        input: {
          filename: filename.trim() + ".json",
          content: saveHistory,
        },
      },
    ]);
  } else if (input === "load") {
    const { filename } = await inquirer.prompt([
      {
        type: "input",
        name: "filename",
        message: "Enter filename",
      },
    ]);
    const results = await actionTools([
      {
        id: "load",
        name: Tools.readFile,
        input: {
          filename: filename.trim() + ".json",
        },
      },
    ]);
    const parsedHistory = JSON.parse(results[0].result);
    console.log(blue("Loaded history:"));
    history = parsedHistory;
  } else if (input === "clear") {
    history = [];
    console.log(blue("History cleared!"));
  } else if (input === "tools") {
    console.log(blue("Available tools:"));
    console.log(blue(tools.map((tool) => tool.name).join(", ")));
  } else {
    askForInput = false;
  }
  return { history, askForInput };
}

async function askForPrompt(history: ModelMessageParam[] = []) {
  inquirer
    .prompt([
      {
        type: "input",
        name: "prompt",
        message: "What would you like to do? (Type 'exit' to quit)",
      },
    ])
    .then(async (answers) => {
      const input = answers.prompt;
      const { history: updatedHistory, askForInput } =
        await actionInternalInputCommands(input, history);

      if (askForInput) {
        return await askForPrompt(updatedHistory);
      }

      const { history: historyWithActions } = await actionPrompt(
        input,
        updatedHistory
      );

      return await askForPrompt(historyWithActions);
    });
}

program.version("1.0.0").description("RubberDuck CLI");

program.action(async () => {
  await askForPrompt();
});

program.parse(process.argv);

// //     "Create me a game in html that resembles the classic game, Snake. Provide all the code needed in a single html file"
// Create me a webpage all in one HTML file that mimics windows 95. Include javascript and functionality so that you can open the start menu, open apps in virtual "window"
// Create a windows 95 emulator in HTML. Provide all the content in one file, called "windows95.html". The emulator should have desktop icons, a start menu and clock, as per Windows 95. It should be as realistic as possible, with windows that open, basic tools that came included like a calculator.
