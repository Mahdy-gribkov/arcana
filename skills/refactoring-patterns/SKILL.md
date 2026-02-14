---
name: refactoring-patterns
description: Code refactoring patterns including extract, inline, move, rename, dead code removal, dependency injection, SOLID principles, code smell detection, and tech debt prioritization.
---

## Purpose

Apply systematic refactoring patterns to improve code structure without changing behavior. This skill covers identifying when to refactor, which pattern to apply, and how to prioritize technical debt.

## Extract Method

- Pull a block of code into a named function when the block does one logical thing and the surrounding function does more.
- Name the extracted method after what it does, not how it does it. `validateUserInput()` over `checkStuff()`.
- Pass only the data the method needs. If you pass more than 3 parameters, consider an object or struct.
- Preserve return semantics. If the original block returned early, the extracted method should return a value the caller can act on.
- Test before and after extraction. The behavior must not change.
- Extract when you see comments explaining what a code block does. The method name replaces the comment.

## Extract Class

- Move a group of related fields and methods into a new class when a class has multiple responsibilities.
- Look for fields that are always used together. They likely belong in their own class.
- The original class delegates to the new class. Keep the public API stable during the transition.
- Apply when a class exceeds 200-300 lines or when you cannot describe its purpose in one sentence.
- Name the new class after its single responsibility.

## Inline

- Inline a method when its body is as clear as its name. Remove the indirection.
- Inline a variable when it is used once and the expression is self-explanatory.
- Inline a class when it does too little to justify its existence. Move its members back to the caller.
- Do not inline if the method is called from multiple places. That indicates it earns its existence.
- Inline temporary variables that obscure the flow: `let x = getPrice(); return x;` becomes `return getPrice();`.

## Move

- Move a method to the class that owns most of the data it uses. Follow the data.
- Move a field when another class accesses it more than the owning class does.
- Move a file when its directory no longer reflects its purpose.
- Update all references after moving. IDE refactoring tools handle this, but verify with a build.
- Move tests alongside the code they test. Co-location reduces cognitive load.

## Rename

- Rename when the current name is misleading, abbreviated, or outdated.
- Use the project's naming conventions consistently. Do not mix `camelCase` and `snake_case` within a module.
- Rename in a dedicated commit. Mixing renames with logic changes makes review harder.
- Search for string references (config files, documentation, API contracts) that the IDE rename tool misses.
- Prefer longer, descriptive names over short, ambiguous ones. `userAccountBalance` over `bal`.

## Dead Code Elimination

- Delete code that is never called. Version control preserves history if you need it back.
- Search for unused exports, unreachable branches, and commented-out blocks.
- Use static analysis tools: `ts-prune` for TypeScript, `deadcode` for Go, `vulture` for Python.
- Remove feature flags for features that shipped months ago. Stale flags are dead code with extra complexity.
- Delete unused dependencies from package manifests. Each dependency is an attack surface and a build cost.
- Remove unused test fixtures and helpers. They slow down comprehension.

## Dependency Injection

- Pass dependencies as constructor or function parameters instead of creating them internally.
- This makes testing trivial: inject a mock instead of the real dependency.
- Use interfaces (TypeScript) or protocols (Python) to define the contract, not the concrete type.
- Avoid service locator patterns. They hide dependencies and make call graphs opaque.
- Keep the dependency graph shallow. If A depends on B depends on C depends on D, consider flattening.
- Constructor injection for required dependencies. Method injection for optional or context-specific ones.

## SOLID Principles Applied

- **Single Responsibility:** Each module, class, or function has one reason to change. If a function parses input and writes to a database, split it.
- **Open/Closed:** Extend behavior through composition or new implementations, not by modifying existing code. Use strategy patterns.
- **Liskov Substitution:** Subtypes must work anywhere the parent type is expected. Do not override methods to throw "not implemented".
- **Interface Segregation:** Define small, focused interfaces. A client should not depend on methods it does not use.
- **Dependency Inversion:** High-level modules depend on abstractions, not concrete implementations. Define interfaces at the boundary.

## Code Smell Detection

- **Long Method:** Over 20-30 lines. Extract smaller methods.
- **Large Class:** Over 200-300 lines or more than one responsibility. Extract classes.
- **Feature Envy:** A method uses another class's data more than its own. Move the method.
- **Data Clumps:** Groups of variables that appear together repeatedly. Extract into a struct or class.
- **Primitive Obsession:** Using strings or numbers where a domain type would be clearer. Create value objects.
- **Shotgun Surgery:** One change requires edits in many files. Consolidate related logic.
- **Divergent Change:** One class changes for multiple unrelated reasons. Split responsibilities.

## Technical Debt Prioritization

- Score each debt item on: frequency of encounter, blast radius if it causes a bug, and effort to fix.
- Fix debt that blocks current feature work first. Do not create a separate "refactoring sprint."
- Apply the boy scout rule: leave code cleaner than you found it, one small improvement per pull request.
- Track debt items in the issue tracker with a dedicated label. Make them visible, not hidden.
- Prioritize debt in shared code paths over debt in rarely-touched modules.
- Measure improvement: track cyclomatic complexity, test coverage, and build times over months.

## Refactoring Workflow

- Write tests first if none exist. Refactoring without tests is gambling.
- Make one refactoring move per commit. Small commits are easy to review and easy to revert.
- Run tests after every move. If tests fail, the refactoring changed behavior.
- Use IDE automated refactoring tools when available. They are less error-prone than manual edits.
- Review the diff before committing. Automated tools sometimes produce unexpected changes.
- Communicate refactoring intent in pull request descriptions. Explain why the structure changed.
