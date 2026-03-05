# Design & Architecture

This document describes the high-level architecture of Code Vision and key implementation details.

Overview

- The system is client-side, built with Vite, and uses Monaco Editor for editing.
- Main pipeline: Editor -> Transpiler -> Interpreter -> UI components.

Components

1. Editor (`src/editor.js`)
   - Hosts Monaco, manages user input and example loading.
   - Validates code and forwards it to the transpiler.

2. Transpiler (`src/transpiler.js`)
   - Parses source code (using `acorn`) and walks the AST (`acorn-walk`).
   - Injects instrumentation points (trace emitters) around statements, expressions, function entries/exits, and assignments.
   - Keeps original semantics while adding lightweight trace calls.

3. Interpreter (`src/interpreter.js`)
   - Executes the instrumented code inside a controlled environment.
   - Emits trace events rather than side-effecting global state directly.
   - Provides a replayable trace stream that UI components subscribe to.

4. UI Components (`src/components/*`)
   - Each component subscribes to the interpreter's trace bus and updates a local model.
   - Components should be pure renderers of that model.

Trace design

- A trace is a small JSON-like object with these fields: `type`, `id`, `time`, `payload`.
- Keep traces small; payloads reference value ids where possible to avoid copying large objects.
- Trace types: `step`, `call`, `return`, `assign`, `throw`, `output`.

Extensibility

- Add new trace types to handle additional language constructs.
- Implement transpiler plugins to transform other languages into the instrumented IR.
- UI components should be isolated; new components can subscribe to traces without changing the interpreter.

Performance

- Instrumentation aims to be minimal: only add traces where they meaningfully affect teaching/debugging.
- The interpreter can batch traces per tick to avoid overwhelming the renderer.

Security

- The interpreter runs in a controlled sandbox; avoid executing raw user code without instrumentation.
- Do not introduce direct DOM access from executed code—expose only allowed host APIs if needed.

Maintenance notes

- When changing trace formats, add migration helpers and keep consumers tolerant of additional fields.
- Add unit tests that validate the mapping from source snippets to expected traces.

