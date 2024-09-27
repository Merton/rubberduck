# Rubberduck

An advanced AI-powered CLI tool for coding assistance and project generation.

## Description

Rubberduck is a powerful command-line interface (CLI) tool that leverages AI to assist developers in various coding tasks and project generation. It provides an interactive environment where users can communicate with an AI model to perform actions, generate code, and manage files.

Key features:
- Interactive AI-powered coding assistant
- File system operations (create, read, update, delete)
- Project generation capabilities
- History management (save, load, clear)
- Customizable tool set
- Support for custom environment variables

## Installation

```bash
npm install -g rubberduck
```

## Usage

To start the Rubberduck CLI, run:

```bash
rubberduck
```

Follow the prompts to interact with the AI coding assistant. You can:

- Ask for coding help or project generation
- Use built-in commands like 'history', 'save', 'load', 'clear', and 'tools'
- Perform file system operations through the AI assistant

## Custom Environment Variables

Rubberduck supports custom environment variables. To use your own configuration:

1. Create a `.env` file in the root directory of your project.
2. Add your custom environment variables to this file.

Example `.env` file:

```
NODE_ENV=production
PORT=8080
API_KEY=your_custom_api_key
```

If a custom `.env` file is not found, Rubberduck will use its default configuration.

## Available Commands

- `history`: Display previous interactions
- `save`: Save the current session history to a file
- `load`: Load a previous session history from a file
- `clear`: Clear the current session history
- `tools`: Display available tools and actions
- `exit`: Quit the application

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Run in development mode: `npm run dev`
4. Build: `npm run build`

## Project Structure

- `src/index.ts`: Main entry point and core functionality
- `src/cli.ts`: CLI-specific code
- `src/colors.ts`: Color formatting for console output
- `src/models.ts`: AI model interaction and processing
- `src/tools.ts`: Definition and implementation of available tools

## License

ISC