# Contributing to Plexus UI

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/plexus-oss/ui.git
cd ui
npm install
npm run dev          # starts the playground at localhost:3000
```

## Project Structure

- `packages/cli/` — the `@plexusui/cli` npm package
- `packages/components/` — source components (distributed via the CLI, not published to npm)
- `playground/` — Next.js app for developing and previewing components

## Linting & Type Checking

```bash
npm run lint         # biome check
npm run lint:fix     # biome auto-fix
npx tsc --build     # type check
```

## Submitting Changes

1. Fork the repo and create a branch from `main`
2. Make your changes — test them in the playground
3. Run lint and type check and make sure both pass
4. Open a pull request with a clear description of what and why

## Adding a New Component

1. Create the component in `packages/components/charts/`
2. Add an entry to `packages/components/registry.json`
3. Add a playground example in `playground/examples/`
4. Test it with `npx plexusui add <component-name>` from a fresh project

## Reporting Bugs

Open an issue at [GitHub Issues](https://github.com/plexus-oss/ui/issues) with:

- Browser and OS
- GPU info (if rendering-related)
- Steps to reproduce
- Screenshots if applicable

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
