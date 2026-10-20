# Agent Instructions

## TypeScript Style

- Format TypeScript and TSX with the repository's Prettier config. Use two spaces and spaces, never tabs.
- Use explicit relative extensions: `.ts` for TypeScript modules and `.tsx` for TSX modules.
- Keep imports in the order enforced by `@tjsr/eslint-config`'s `import/order` rule; do not use a separate alphabetic import sorter.
- Format and apply ESLint fixes on save. Run the repository's lint check after changing imports or formatting rules.
