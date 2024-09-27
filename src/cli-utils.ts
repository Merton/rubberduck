import inquirer from "inquirer";
import { blue, green, red } from "./colors";
import { actionTools } from "./models";
import { tools, Tools } from "./tools";
import { ModelMessageParam } from "./model-utils";

export const internalCommands = new Map<
  string,
  (
    history: ModelMessageParam[]
  ) => Promise<{ history: ModelMessageParam[]; askForInput: boolean }>
>([
  ["", handleInvalidCommand],
  ["history", handleHistoryCommand],
  ["save", handleSaveCommand],
  ["load", handleLoadCommand],
  ["clear", handleClearCommand],
  ["tools", handleToolsCommand],
]);

async function handleInvalidCommand(history: ModelMessageParam[]) {
  logColored("Please enter a valid command", "blue");
  return { history, askForInput: true };
}

async function handleHistoryCommand(history: ModelMessageParam[]) {
  console.log(history.length ? history : "No previous mentions");
  return { history, askForInput: true };
}

async function handleClearCommand() {
  logColored("History cleared!", "blue");
  return { history: [], askForInput: true };
}

async function handleToolsCommand(history: ModelMessageParam[]) {
  logColored("Available tools:", "blue");
  logColored(tools.map((tool) => tool.name).join(", "), "blue");
  return { history, askForInput: true };
}

async function handleSaveCommand(history: ModelMessageParam[]) {
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
  return { history, askForInput: true };
}

async function handleLoadCommand(history: ModelMessageParam[]) {
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
  logColored("Loaded history:", "blue");
  return { history: parsedHistory, askForInput: true };
}

export function logColored(
  message: string,
  color: "blue" | "green" | "red"
): void {
  const colorFunc = color === "blue" ? blue : color === "green" ? green : red;
  console.log(colorFunc(message));
}
