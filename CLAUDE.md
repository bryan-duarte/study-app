# Project Context

This project uses **Next.js 16.2.6** with **React 19.2.4** and **Tailwind CSS v4**.

These are recent versions with breaking changes from earlier versions. Before writing code, consult the documentation in `node_modules/next/dist/docs/` and heed any deprecation notices.

# Dependency Management

**IMPORTANT:** Always install dependencies using package manager commands, never by editing dependency files directly.

- Use `pnpm install <package>` or `npm install <package>` to add dependencies
- Use `pnpm install -D <package>` or `npm install --save-dev <package>` for dev dependencies
- Never manually edit `package.json` or `pnpm-lock.yaml` to add dependencies

This ensures proper lockfile generation and version resolution.

# Design Guidelines

**CRITICAL:** All UI development MUST follow the Linear design system specified in [`DESIGN.md`](/Users/bryan.duarte/Documents/personal/aws-preparation/DESIGN.md).

Before implementing any UI components, consult the design system for:

- **Colors:** Dark theme palette with Pitch Black (#08090a) canvas, Porcelain (#f7f8f8) primary text, and Neon Lime (#e4f222) for primary actions
- **Typography:** Inter Variable for UI text, Berkeley Mono for code. Specific weights: 300, 400, 510, 590
- **Spacing:** 4px base unit, compact density with 8px element gap
- **Components:** Pre-defined styles for buttons, cards, inputs, badges, and navigation elements
- **Borders:** 6px default radius for cards and buttons, 2px for tags
- **Theme:** Dark mode only — no light theme variants

@AGENTS.md
