# Workflow

How the work in [PLAN.md](PLAN.md) is carried out. Rules for agents are in [AGENTS.md](../AGENTS.md).

## Roles

| Role | Who | Does |
|---|---|---|
| Owner | Project owner | Decides scope, enters secrets, creates accounts, pushes |
| Orchestrator | Claude Code (Opus) | Assigns work, reviews every change, runs all checks, commits |
| Writers | Antigravity, OpenCode, Claude subagents | Write one assigned task |
| Reviewer | An agent that did not write the change | Looks for bugs and broken rules, changes nothing |

## Loop for each task

1. The orchestrator writes a brief: the step, rule IDs, files the writer may touch, files it must not touch, and the exit check.
2. The writer works only in those files. It does not commit, push, switch branches or install anything that the brief does not list.
3. The orchestrator reads the diff and runs typecheck, lint, format check, tests and build itself. A writer's own report is not proof.
4. Changes to `shared/`, the server, security or the database get a second review.
5. Problems go back to the same writer once. After that the orchestrator fixes them or changes the writer.
6. The orchestrator commits to `main`. The owner pushes, or tells the orchestrator to push.

## Assignment

| Step | Writer | Reviewer | Files |
|---|---|---|---|
| 0 Scaffold | Antigravity, Gemini 4 Hydrogen high | Orchestrator | Root config, empty folders |
| 1 Health and Vercel | Claude Sonnet | Orchestrator | `api/`, `server/`, `vercel.json` |
| 2 Shared rules | Claude Opus | Claude Sonnet | `shared/` |
| 3 Moving-out screens | Claude Sonnet | Orchestrator | `client/` |
| 4 Clause matching | Claude Opus | Claude Sonnet | `server/`, quote check in `shared/` |
| 5 Draft message | Claude Sonnet | Orchestrator | `shared/`, `client/` |
| 7 Bills and repairs | OpenCode or Antigravity | Orchestrator | `client/` |
| 8 Cloud save | Claude Opus | Claude Sonnet | `server/`, `db/`, `client/` |
| 9 Before signing | OpenCode or Antigravity | Orchestrator | `client/` |

OpenCode uses its free models only. It starts with small tasks, and a writer that fails review twice is replaced.

## Running tasks at the same time

- Two writers never touch the same file. `package.json` and lock file changes are made by the orchestrator.
- Steps 1 and 2 can run together. Steps 3 and 4 can run together once the types and schemas of step 2 are committed.
- Everyone works in the same checkout on `main`. No worktrees or extra branches.

## Stop and ask the owner

- A rule is missing or two files disagree.
- A step needs a paid service, a new account, a secret or a new dependency.
- A check fails twice for the same reason.
