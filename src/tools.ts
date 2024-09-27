import { Tool } from "@anthropic-ai/sdk/resources";
import fs from "fs";
import { blue, green, red } from "./colors";
import { ModelToolUseBlock } from "./models";

export type CompletedAction = {
  id: string;
  tool: string;
  result: string;
  isError: boolean;
};

export enum Tools {
  saveToFile = "saveToFile",
  updateFile = "updateFile",
  createDirectory = "createDirectory",
  listDirectory = "listDirectory",
  readFile = "readFile",
  mv = "mv",
  cp = "cp",
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
  [Tools.mv]: {
    source: string;
    destination: string;
  };
  [Tools.cp]: {
    source: string;
    destination: string;
  };
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
    name: Tools.mv,
    description: "Move a file or directory",
    input_schema: {
      type: "object",
      properties: {
        source: {
          type: "string",
          title: "source",
          description: "The source file or directory to move",
        },
        destination: {
          type: "string",
          title: "destination",
          description: "The destination file or directory",
        },
      },
      required: ["source", "destination"],
    },
  },
  {
    name: Tools.cp,
    description: "Copy a file or directory",
    input_schema: {
      type: "object",
      properties: {
        source: {
          type: "string",
          title: "source",
          description: "The source file or directory to copy",
        },
        destination: {
          type: "string",
          title: "destination",
          description: "The destination file or directory",
        },
      },
      required: ["source", "destination"],
    },
  },
];

const toolFunctions = {
  [Tools.saveToFile]: handleErrors(saveToFile),
  [Tools.updateFile]: handleErrors(updateFile),
  [Tools.createDirectory]: handleErrors(createDirectory),
  [Tools.listDirectory]: handleErrors(listDirectoryFiles),
  [Tools.readFile]: handleErrors(readfile),
  [Tools.mv]: handleErrors(moveFile),
  [Tools.cp]: handleErrors(copyFile),
};

// Error handling wrapper
function handleErrors(fn: (...args: any[]) => any) {
  return (...args: any[]): { result: string; isError: boolean } => {
    try {
      const result = fn(...args);
      return { result, isError: false };
    } catch (error) {
      // @ts-ignore
      console.error(red(`Error: ${error.message}`));
      // @ts-ignore
      return { result: error.message, isError: true };
    }
  };
}

export async function runTool(
  message: ModelToolUseBlock
): Promise<CompletedAction> {
  const tool = message.name;
  console.log(blue(`🛠️ Tool: ${tool}`));

  const actionResult: CompletedAction = {
    id: message.id,
    tool,
    result: "",
    isError: false,
  };

  if (tool in toolFunctions) {
    // @ts-ignore
    const { result, isError } = toolFunctions[tool](message.input);
    actionResult.result = result;
    actionResult.isError = isError;
  } else {
    actionResult.result = `Tool is not linked to an action: ${tool}`;
    actionResult.isError = true;
  }

  console.log(
    actionResult.isError
      ? red(`\t Error: ${actionResult.result}`)
      : green(`\t Result: ${actionResult.result}`)
  );
  return actionResult;
}

// Tool functions
function saveToFile(params: ToolParams[Tools.saveToFile]) {
  const { filename, content } = params;
  if (!filename || !content) {
    throw new Error("Filename and content are required to save to a file");
  }
  console.log(blue(`\t Saving to file: ${filename}`));
  fs.writeFileSync(filename, content);
  return `Saved to file: ${filename}`;
}

function updateFile(params: ToolParams[Tools.updateFile]) {
  const { filename, content } = params;
  if (!filename || !content) {
    throw new Error("Filename and content are required to update a file");
  }
  console.log(blue(`\t Updating file: ${filename}`));
  fs.writeFileSync(filename, content);
  return `Updated file: ${filename}`;
}

function createDirectory(params: ToolParams[Tools.createDirectory]) {
  const { directory } = params;
  if (!directory) {
    throw new Error("Directory name is required to create a directory");
  }
  console.log(blue(`\t Creating directory: ${directory}`));
  fs.mkdirSync(directory);
  return `Created directory: ${directory}`;
}

function listDirectoryFiles(params: ToolParams[Tools.listDirectory]) {
  const { directory } = params;
  if (!directory) {
    throw new Error("Directory name is required to list directory");
  }
  console.log(blue(`\t Listing directory: ${directory}`));
  const files = fs.readdirSync(directory);
  return files.map((res) => `- ${res}`).join("\n");
}

function readfile(params: ToolParams[Tools.readFile]) {
  const { filename } = params;
  if (!filename) {
    throw new Error("Filename is required to read a file");
  }
  console.log(blue(`\t Reading file: ${filename}`));
  return fs.readFileSync(filename, "utf-8");
}

function moveFile(params: ToolParams[Tools.mv]) {
  const { source, destination } = params;
  if (!source || !destination) {
    throw new Error("Source and destination are required to move a file");
  }
  console.log(blue(`\t Moving file: ${source} to ${destination}`));
  fs.renameSync(source, destination);
  return `Moved file: ${source} to ${destination}`;
}

function copyFile(params: ToolParams[Tools.cp]) {
  const { source, destination } = params;
  if (!source || !destination) {
    throw new Error("Source and destination are required to copy a file");
  }
  console.log(blue(`\t Copying file: ${source} to ${destination}`));
  fs.copyFileSync(source, destination);
  return `Copied file: ${source} to ${destination}`;
}
