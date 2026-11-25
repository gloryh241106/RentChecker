# 0007 AI reads the prompt, code reads the values

Status: Accepted, 2026-11-25. Extends [0003](0003-code-decides-ai-only-finds-clauses.md)

## Context

F9 lets a tenant start with a prompt. A model is good at understanding intent and weak at copying numbers. A wrong deposit or date would make every result wrong, and the tenant might not notice.

## Decision

- Gemini chooses one task from a fixed list and points at the words of the prompt that state each fact. It returns no amount and no date.
- The server keeps only words that are in the prompt. Code in `shared/` reads the values from them.
- Code chooses the next question, checks the input for likely mistakes and opens the page. The tenant confirms before anything is filled in.
- Answers to the questions are read by code in the browser, so one prompt is one AI request.
- Without AI, code reads the prompt with the rules of F8.

## Consequences

- The model cannot invent or change a number. It can choose the wrong words, which the tenant sees next to the value.
- A prompt injection can at worst choose another task.
- Amounts in words ("thirty thousand") and dates without a year are asked for.

## Alternatives

- The model returns the values: shorter code, but a changed digit cannot be noticed.
- A chat with tool calls: more flexible, hard to test, and every turn is sent to the model.
- A form wizard without AI: what the Moving out steps already are.
