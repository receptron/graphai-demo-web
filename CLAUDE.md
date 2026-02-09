# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vue 3 demo web application showcasing GraphAI capabilities. Interactive frontend for demonstrating graph-based AI workflows.

## Commands

```bash
yarn serve      # Start Vite dev server
yarn build      # Build for production (vue-tsc && vite build)
yarn lint       # Run ESLint on src/
yarn test       # Run tests (node:test with ts-node)
yarn format     # Format with Prettier
```

## Architecture

- Vue 3 + Vite + TypeScript
- `src/components/` - Vue components
- `src/composables/` - Vue composables
- `src/graph/` - GraphAI graph definitions
- `src/agents/` - Custom agents
- `src/config/` - Application configuration
- `src/filter/` - Data filters
- Uses Vue Composition API
