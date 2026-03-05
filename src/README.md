# Source Overview — Developer Guide

This folder contains the app logic and UI components. The following expands on responsibilities, trace formats, and how to extend the system.

Core responsibilities

- `main.js` — application bootstrap and component mounting points.
- `editor.js` — integrates Monaco editor, loads examples, and sends code to the transpiler.
- `transpiler.js` — the transformation layer: it instruments user code to emit trace events for the interpreter.
- `interpreter.js` — a safe runtime that consumes instrumented code; it produces a stream of structured trace objects describing statements, variable assignments, function calls, returns, exceptions, and outputs.
- `examples.js` — curated example programs used by the UI and tests.
- `components/` — reactive UI modules that subscribe to interpreter traces and update the visualization.

Trace format (summary)

Trace objects follow a consistent shape (example):

```json
{
  "type": "step",         // step | call | return | assign | output | error
  "id": "uuid",
  "time": 163..., 
  "payload": { /* step-specific */ }
}
```

When extending the tracer, aim to keep backwards compatibility by adding new `type` values or optional payload fields rather than changing existing ones.

Extending components

- Components listen for trace events via the central event bus provided in `main.js`.
- New components should expose a `subscribe(bus)` function that registers handlers and a `render(container, state)` function to draw UI.

Debugging tips

- Use `console.log` inside `transpiler.js` and `interpreter.js` to inspect intermediate instrumented ASTs and emitted traces.
- Run the verification scripts at the repository root to validate example behaviour.

Adding features

- For new language features, update `transpiler.js` to produce trace points, then update `interpreter.js` to handle the instrumented constructs.
- Update or add examples in `examples.js` demonstrating expected behaviour.

Local development

1. `npm install`
2. `npm run dev` — open the app and test changes.

Testing

- Use the provided `verify_*.js` scripts in the repo root to run lightweight checks.

Contact points

- If a change affects the trace shape, update all components and document the change in `DESIGN.md`.
