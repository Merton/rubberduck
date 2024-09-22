import { ContentBlock, Tool, ToolUseBlock } from "@anthropic-ai/sdk/resources";
import fs from "fs";
import { blue } from "./colors";

enum Tools {
  saveToFile = "saveToFile",
  updateFile = "updateFile",
  createDirectory = "createDirectory",
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
};

export const tools: Tool[] = [
  {
    name: "saveToFile",
    description:
      "Save the output to a file. You must provide a filename and content",
    input_schema: {
      type: "object",
      properties: {
        filename: {
          type: "string",
          title: "Filename",
          description: "The name of the file to save the output to",
        },
        content: {
          type: "string",
          title: "Content",
          description: "The content to save to the file",
        },
      },
      required: ["filename", "content"],
    },
  },
  {
    name: "updateFile",
    description:
      "Update the content of a file. You must provide a filename and content",
    input_schema: {
      type: "object",
      properties: {
        filename: {
          type: "string",
          title: "Filename",
          description: "The name of the file to update",
        },
        content: {
          type: "string",
          title: "Content",
          description: "The new content for the file",
        },
      },
      required: ["filename", "content"],
    },
  },
  {
    name: "createDirectory",
    description: "Create a new directory",
    input_schema: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          title: "Directory",
          description: "The name of the directory to create",
        },
      },
      required: ["directory"],
    },
  },
];

export async function runTool(message: ToolUseBlock) {
  console.log(blue(`🛠️ Tool: ${message.name}`));
  switch (message.name) {
    case Tools.saveToFile:
      const { filename, content } =
        message.input as ToolParams[Tools.saveToFile];
      if (!filename || !content) {
        console.error("Filename and content are required to save to a file");
      }
      saveToFile(filename, content);
      break;

    case Tools.updateFile:
      const { filename: updateFilename, content: updateContent } =
        message.input as ToolParams[Tools.saveToFile];
      if (!updateFilename || !updateContent) {
        console.error("Filename and content are required to update a file");
      }
      updateFile(updateFilename, updateContent);
      break;

    case Tools.createDirectory:
      const { directory } = message.input as ToolParams[Tools.createDirectory];
      if (!directory) {
        console.error("Directory name is required to create a directory");
      }
      createDirectory(directory);
      break;
  }
}

function saveToFile(filename: string, text: string) {
  console.log(blue(`\t Saving to file: ${filename}`));
  fs.writeFileSync(filename, text);
}

function updateFile(filename: string, text: string) {
  console.log(blue(`\t Updating file: ${filename}`));
  saveToFile(filename, text);
}

export function createDirectory(directory: string) {
  console.log(blue(`\t Creating directory: ${directory}`));
  try {
    fs.mkdirSync(directory);
  } catch (error) {
    console.error(error);
  }
}

function readfile(filename: string): string {
  return fs.readFileSync(filename, "utf-8");
}
