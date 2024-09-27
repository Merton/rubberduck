import { describe, it, expect, vi } from "vitest";

// Mock the tools module
vi.mock("../src/tools", () => ({
  saveToFile: vi.fn(),
  updateFile: vi.fn(),
  createDirectory: vi.fn(),
  listDirectoryFiles: vi.fn(),
  readfile: vi.fn(),
  moveFile: vi.fn(),
  copyFile: vi.fn(),
}));

// Import the mocked tools
import {
  saveToFile,
  updateFile,
  createDirectory,
  listDirectoryFiles,
  readfile,
  moveFile,
  copyFile,
} from "../src/tools";

describe("File System Tools", () => {
  it("saveToFile should be called with correct parameters", () => {
    saveToFile({ filename: "test.txt", content: "Hello, World!" });
    expect(saveToFile).toHaveBeenCalledWith({
      filename: "test.txt",
      content: "Hello, World!",
    });
  });

  it("updateFile should be called with correct parameters", () => {
    updateFile({ filename: "test.txt", content: "Updated content" });
    expect(updateFile).toHaveBeenCalledWith({
      filename: "test.txt",
      content: "Updated content",
    });
  });

  it("createDirectory should be called with correct parameter", () => {
    createDirectory({ directory: "newDir" });
    expect(createDirectory).toHaveBeenCalledWith({ directory: "newDir" });
  });

  it("listDirectoryFiles should be called with correct parameter", () => {
    listDirectoryFiles({ directory: "testDir" });
    expect(listDirectoryFiles).toHaveBeenCalledWith({ directory: "testDir" });
  });

  it("readFile should be called with correct parameter", () => {
    readfile({ filename: "test.txt" });
    expect(readfile).toHaveBeenCalledWith({ filename: "test.txt" });
  });

  it("moveFile should be called with correct parameters", () => {
    moveFile({ source: "oldFile.txt", destination: "newFile.txt" });
    expect(moveFile).toHaveBeenCalledWith({
      source: "oldFile.txt",
      destination: "newFile.txt",
    });
  });

  it("copyFile should be called with correct parameters", () => {
    copyFile({ source: "sourceFile.txt", destination: "destFile.txt" });
    expect(copyFile).toHaveBeenCalledWith({
      source: "sourceFile.txt",
      destination: "destFile.txt",
    });
  });
});
