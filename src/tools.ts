import { Tool } from "@anthropic-ai/sdk/resources";
import fs from "fs";
import { blue, green } from "./colors";
import { ModelToolUseBlock } from "./models";

export type CompletedAction = {
  tool: string;
  result: string;
};

export enum Tools {
  saveToFile = "saveToFile",
  updateFile = "updateFile",
  createDirectory = "createDirectory",
  listDirectory = "listDirectory",
  readFile = "readFile",
  getToolResults = "getToolResults",
}

type ToolParams = {
  [Tools.saveToFile]: {
    filename: string;
    content: string;
  };
  [Tools.updateFile]: {
    filename: string;
    content: string;
  };
  [Tools.createDirectory]: {
    directory: string;
  };
  [Tools.listDirectory]: {
    directory: string;
  };
  [Tools.readFile]: {
    filename: string;
  };
  [Tools.getToolResults]: {};
};

export const tools: Tool[] = [
  {
    name: Tools.saveToFile,
    description:
      "Save the output to a file. You must provide a filename and content",
    input_schema: {
      type: "object",
      properties: {
        filename: {
          type: "string",
          title: "filename",
          description: "The name of the file to save the output to",
        },
        content: {
          type: "string",
          title: "content",
          description: "The content to save to the file",
        },
      },
      required: ["filename", "content"],
    },
  },
  {
    name: Tools.updateFile,
    description:
      "Update the content of a file. You must provide a filename and content",
    input_schema: {
      type: "object",
      properties: {
        filename: {
          type: "string",
          title: "filename",
          description: "The name of the file to update",
        },
        content: {
          type: "string",
          title: "content",
          description: "The new content for the file",
        },
      },
      required: ["filename", "content"],
    },
  },
  {
    name: Tools.createDirectory,
    description: "Create a new directory",
    input_schema: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          title: "directory",
          description: "The name of the directory to create",
        },
      },
      required: ["directory"],
    },
  },
  {
    name: Tools.listDirectory,
    description: "List all files in a directory",
    input_schema: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          title: "directory",
          description: "The name of the directory to list",
        },
      },
      required: ["directory"],
    },
  },
  {
    name: Tools.readFile,
    description: "Read the contents of a file",
    input_schema: {
      type: "object",
      properties: {
        filename: {
          type: "string",
          title: "filename",
          description: "The name of the file to read",
        },
      },
      required: ["filename"],
    },
  },
  {
    name: Tools.getToolResults,
    description:
      "Immediately get the results of the tasks you requested and return to you the result. No input is required for this tool",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

export async function runTool(
  message: ModelToolUseBlock
): Promise<CompletedAction> {
  const tool = message.name;
  console.log(blue(`🛠️ Tool: ${tool}`));

  let actionResult: CompletedAction = { tool, result: "" };
  switch (tool) {
    case Tools.saveToFile:
      const { filename, content } =
        message.input as ToolParams[Tools.saveToFile];
      if (!filename || !content) {
        console.error("Filename and content are required to save to a file");
      }
      actionResult = { tool, result: saveToFile(filename, content) };
      break;

    case Tools.updateFile:
      const { filename: updateFilename, content: updateContent } =
        message.input as ToolParams[Tools.saveToFile];
      if (!updateFilename || !updateContent) {
        console.error("Filename and content are required to update a file");
      }
      actionResult = {
        tool,
        result: updateFile(updateFilename, updateContent),
      };
      break;

    case Tools.createDirectory:
      const { directory } = message.input as ToolParams[Tools.createDirectory];
      if (!directory) {
        console.error("Directory name is required to create a directory");
      }
      actionResult = { tool, result: createDirectory(directory) };
      break;

    case Tools.listDirectory:
      const { directory: listDirectory } =
        message.input as ToolParams[Tools.listDirectory];
      if (!listDirectory) {
        console.error("Directory name is required to list directory");
      }
      actionResult = { tool, result: listDirectoryFiles(listDirectory) };
      break;

    case Tools.readFile:
      const { filename: readFilename } =
        message.input as ToolParams[Tools.readFile];
      if (!readFilename) {
        console.error("Filename is required to read a file");
      }
      actionResult = { tool, result: readfile(readFilename) };
      break;

    default:
      console.error(`Tool is not linked to an action: ${tool}`);
      actionResult = {
        tool,
        result: `Tool is not linked to an action: ${tool}`,
      };
  }

  console.log(green(`\t Result: ${actionResult.result}`));
  return actionResult;
}

// Tool functions
function saveToFile(filename: string, text: string) {
  console.log(blue(`\t Saving to file: ${filename}`));
  fs.writeFileSync(filename, text);
  return `Saved to file: ${filename}`;
}

function updateFile(filename: string, text: string) {
  console.log(blue(`\t Updating file: ${filename}`));
  saveToFile(filename, text);
  return `Updated file: ${filename}`;
}

function createDirectory(directory: string) {
  console.log(blue(`\t Creating directory: ${directory}`));
  try {
    fs.mkdirSync(directory);
    return `Created directory: ${directory}`;
  } catch (error) {
    console.error(error);
    return `Error creating directory: ${directory}`;
  }
}

function listDirectoryFiles(directory: string) {
  console.log(blue(`\t Listing directory: ${directory}`));
  try {
    const files = fs.readdirSync(directory);
    const filesString = files.map((res) => `- ${res}`).join("\n");
    return filesString;
  } catch (error) {
    console.error(error);
    return `Error listing directory: ${directory}`;
  }
}

function readfile(filename: string): string {
  console.log(blue(`\t Reading file: ${filename}`));
  return fs.readFileSync(filename, "utf-8");
}
