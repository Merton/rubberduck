type Value = string | number | boolean;

export const blue = (value: Value) => `\u001b[34m${value}\u001b[39m`;

export const cyan = (value: Value) => `\u001b[36m${value}\u001b[39m`;

export const green = (value: Value) => `\u001b[32m${value}\u001b[39m`;

export const magenta = (value: Value) => `\u001b[35m${value}\u001b[39m`;

export const red = (value: Value) => `\u001b[31m${value}\u001b[39m`;

export const yellow = (value: Value) => `\u001b[33m${value}\u001b[39m`;

export const grey = (value: Value) => `\u001b[90m${value}\u001b[39m`;
