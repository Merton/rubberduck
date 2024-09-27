import inquirer from "inquirer";
import { actionTools, callModel } from "./models";
import { CompletedAction } from "./tools";
import { internalCommands, logColored } from "./cli-utils";
import { ModelMessageParam } from "./model-utils";

async function processModelResponse(
  input: string,
  history: ModelMessageParam[] = [],
  toolResults?: CompletedAction[]
): Promise<{
  completedActions: CompletedAction[];
  history: ModelMessageParam[];
}> {
  try {
    const {
      text,
      history: updatedHistory,
      tools,
    } = await callModel(input, history, toolResults);
    logColored(text ?? "", "green");

    const completedActions = await actionTools(tools);
    if (completedActions.length > 0) {
      logColored(
        `Completed ${completedActions.length} action${
          completedActions.length > 1 ? "s" : ""
        }.`,
        "blue"
      );
      return processModelResponse("", updatedHistory, completedActions);
    }
    return { completedActions, history: updatedHistory ?? history };
  } catch (error) {
    logColored("An error occurred calling anthropic: ", "red");
    console.error(error);
    return { completedActions: [], history };
  }
}

async function handleInternalCommand(
  input: string,
  history: ModelMessageParam[]
): Promise<{ history: ModelMessageParam[]; askForInput: boolean }> {
  const command = internalCommands.get(input.trim());
  if (command) {
    return command(history);
  }
  return { history, askForInput: false };
}

async function promptLoop(history: ModelMessageParam[] = []): Promise<void> {
  while (true) {
    const { prompt: input } = await inquirer.prompt([
      {
        type: "input",
        name: "prompt",
        message: "What would you like to do? (Type 'exit' to quit)",
      },
    ]);

    if (input.toLowerCase() === "exit") {
      logColored("Goodbye!", "blue");
      return;
    }

    const { history: updatedHistory, askForInput } =
      await handleInternalCommand(input, history);

    if (askForInput) {
      history = updatedHistory;
      continue;
    }

    const { history: historyWithActions } = await processModelResponse(
      input,
      updatedHistory
    );
    history = historyWithActions;
  }
}

export async function run(): Promise<void> {
  await promptLoop();
}
