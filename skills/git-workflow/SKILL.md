---
name: git-workflow
description: "Git workflow automation covering conventional commits, branch strategies, rebase guidance, merge conflict resolution, git hooks, and monorepo patterns for teams and solo developers."
---

## Purpose

Standardize git workflows across projects. Reduce merge pain, enforce commit quality, and keep history clean regardless of team size or repo structure.

## Conventional Commits

- Format: `type(scope): description` where type is one of: feat, fix, docs, style, refactor, perf, test, build, ci, chore.
- Keep the subject line under 72 characters. Use imperative mood ("add feature", not "added feature").
- Body is optional. Use it to explain **why**, not what. Wrap at 80 characters.
- Breaking changes: add `BREAKING CHANGE:` in the footer or `!` after the type.
- Scopes should match project modules, directories, or packages.

### Commit Linting

- Install commitlint with `@commitlint/config-conventional`.
- Add a `commitlint.config.js` at the repo root:
  ```js
  module.exports = { extends: ['@commitlint/config-conventional'] };
  ```
- Wire it into a commit-msg hook via Husky or lefthook.

## Branch Strategies

### Trunk-Based Development

- Single long-lived branch (main). Short-lived feature branches (1-2 days max).
- Merge via squash or rebase to keep history linear.
- Best for small teams, CI/CD-heavy projects, and rapid iteration.

### Git Flow

- Long-lived branches: main, develop. Supporting branches: feature/*, release/*, hotfix/*.
- Use when you need parallel release tracks or formal release cycles.
- Avoid for solo projects or small teams. The overhead is not worth it.

### Release Branches

- Cut a release branch from main when stabilizing: `release/v1.2.0`.
- Cherry-pick fixes from main into the release branch, not the reverse.
- Tag the release branch tip, then delete the branch.

## Rebase Guidance

- Rebase feature branches onto main before merging: `git rebase main`.
- Never rebase branches that others have pulled. Rebase is for local cleanup only.
- Interactive rebase (`git rebase -i HEAD~N`) to squash fixup commits before PR.
- If a rebase goes wrong, `git reflog` shows every HEAD position. Find the pre-rebase commit and reset.

### Rebase vs Merge

- Rebase: clean linear history, better for bisect, harder to recover from mistakes.
- Merge: preserves branch topology, safer for shared branches, noisier history.
- Pick one strategy per repo and document it in CONTRIBUTING.md.

## Merge Conflict Resolution

- Run `git diff --name-only --diff-filter=U` to list conflicted files.
- Use `git checkout --theirs <file>` or `git checkout --ours <file>` when one side is clearly correct.
- For complex conflicts, use a three-way merge tool: `git mergetool`.
- After resolving, always run the test suite before committing the merge.

### Prevention

- Keep feature branches short-lived (under 2 days).
- Rebase onto main daily when working on long features.
- Split large changes into smaller, independent PRs.

## Git Hooks

### Pre-commit

- Run linters, formatters, and type checks on staged files only.
- Use lint-staged to scope checks: `"*.ts": ["eslint --fix", "prettier --write"]`.
- Keep hooks fast (under 5 seconds). Move slow checks to CI.

### Commit-msg

- Validate commit message format with commitlint.
- Reject commits that lack a type prefix or exceed line length.

### Pre-push

- Run the full test suite before push.
- Check for secrets with tools like gitleaks or trufflehog.
- Validate that the branch name matches the team convention.

### Hook Management

- Use Husky (Node.js) or lefthook (polyglot) to manage hooks.
- Store hook configs in the repo so every contributor gets them.
- Never skip hooks in CI. If a hook is too slow for local dev, fix the hook.

## Monorepo Patterns

### Structure

- Use a `packages/` or `apps/` directory for each workspace member.
- Shared config (tsconfig, eslint, prettier) lives at the repo root.
- Each package has its own package.json with scoped dependencies.

### Tooling

- Turborepo, Nx, or Lerna for orchestration. Turborepo is the lightest option.
- Use workspace protocols (`workspace:*`) for internal dependencies.
- Configure task pipelines so builds respect dependency order.

### Git Considerations

- Use path-based CODEOWNERS to assign reviewers per package.
- Sparse checkout for contributors who only touch one package.
- Tag releases per package: `@scope/package@v1.2.0`.

## Tagging and Releases

- Use semver: MAJOR.MINOR.PATCH.
- Automate version bumps with standard-version or release-please.
- Annotated tags only: `git tag -a v1.0.0 -m "Release v1.0.0"`.
- Push tags explicitly: `git push origin --tags`.

## Troubleshooting

- Lost commits: `git reflog` shows all recent HEAD movements.
- Wrong branch: `git stash`, switch, `git stash pop`.
- Undo last commit (keep changes): `git reset --soft HEAD~1`.
- Remove file from history: use `git filter-repo` (not filter-branch, it is deprecated).
