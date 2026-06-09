---
name: architectural-fixer
description: Diagnose and fix code errors (build, type, or runtime) while strictly preserving established architectural patterns, component hierarchies, and local conventions. Use when encountering regressions or build failures in a complex codebase.
---

# Architectural Fixer

Maintain system integrity while resolving technical debt or regressions.

## Core Principles

1. **Contextual Superiority**: Local `ui.tsx` or shared folder-specific components take precedence over global UI libraries if the local pattern is established.
2. **Prop Integrity**: Never bypass TypeScript errors with `any` or `@ts-ignore`. Update the interface/type definition at the source (e.g., in `ui.tsx`) to accommodate required props.
3. **Traceability**: Before fixing, identify if the error was caused by a recent refactor. Align the fix with the *intent* of that refactor (e.g., a rebranding effort using semantic tokens).
4. **Minimal Surface Area**: Apply surgical changes. Do not refactor unrelated logic while fixing a specific build error.

## Workflow

### 1. Diagnose
- Read the full error trace.
- Identify the file defining the component (`ui.tsx`, `components/*.tsx`) and the file consuming it.
- Check for missing exports or mismatched prop types.

### 2. Strategic Alignment
- **Rebranding/Theme changes**: If the error is related to colors or styles, use the semantic tokens defined in `design-system.css` (e.g., `var(--color-surface-border)`).
- **Component Evolution**: If a component is missing a prop it needs (like `inputMode` in a `TextInput`), update the base component definition rather than casting the consumer.

### 3. Implementation
- Apply the fix to the **definition** first if the issue is a missing feature/prop.
- Verify that the fix doesn't break other consumers of the same component.

### 4. Validation
- Run a local build check (`npm run build` or `tsc`) before committing.
- Ensure the structural pattern remains consistent with surrounding files.
