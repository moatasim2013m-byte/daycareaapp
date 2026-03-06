# AGENTS

## Execution Rules
- ONE TASK per prompt.
- NO REFACTOR unless explicitly asked.
- NO NEW DEPS unless explicitly asked.

## Required Output Format
Every response must include:
- FILES CHANGED
- CHANGES
- TEST STEPS

## Branching Rules
Always work on one of these branch patterns:
- `emergent/<feature>`
- `codex/review-<feature>`

## Completion Rules
Before finishing:
- COMMIT all changes.
- PUSH the branch.
