# Code Vision — Interactive Code Execution Explorer

Code Vision is a lightweight, browser-based learning and debugging tool that visualizes how JavaScript-like code executes. It combines an editor, transpiler, and interpreter with rich visualizations for the call stack, memory, execution flow, and narration to help learners and developers understand runtime behaviour.

**Why this project exists**

- Teach runtime concepts (scope, stack, heap, control flow) with live, visible examples.
- Provide a sandboxed environment to instrument and trace code for debugging and education.
- Offer a modular platform to experiment with transpilation and instrumentation techniques.

Key features

- Live Monaco-based editor with example programs
- Transpiler that instruments code for tracing
- Interpreter that emits structured execution traces
- Visual components: call stack, memory view, execution timeline, variable inspector, narration
- Exportable traces and reproducible example programs

Quick start

Install dependencies:

```bash
npm install
```

Start development server (Vite):

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

Build & preview production bundle:

```bash
npm run build
npm run preview
```

Directory map (important files)

- [src/main.js](src/main.js) — application entry point and component mounting
- [src/editor.js](src/editor.js) — Monaco setup, editor events, and program submission
- [src/transpiler.js](src/transpiler.js) — transforms user code into an instrumented format
- [src/interpreter.js](src/interpreter.js) — executes instrumented code and produces traces
- [src/examples.js](src/examples.js) — curated sample programs to explore
- [src/components/](src/components/) — UI components and visualization widgets
	- `call-stack.js`, `memory-view.js`, `execution-flow.js`, `variable-inspector.js`, `output-console.js`, `narration.js`
- [public/](public/) — static assets served as-is by Vite

Developer guide

- Run the dev server and edit source files — Vite hot reload updates the UI.
- Instrumentation flow: `editor.js` → `transpiler.js` → `interpreter.js` → UI components.
- Add new visual components under `src/components/` and expose an API for trace subscription (see existing components for patterns).

Testing & verification

This repo includes small verification and helper scripts at project root. Useful commands:

```bash
# runs the transpiler checks and small verifiers
node verify_transpiler.js
node verify_examples.js
node verify_python_blocks.js
node verify_random.js
```

Best practices when contributing

- Keep PRs focused and small. Update or add an example for behavioural changes.
- Add unit tests or example verification scripts for transpiler/interpreter changes.
- When modifying the trace format, update all consumers (components) and existing examples.

Roadmap & ideas

- Add step-by-step guided tutorials (playlists of examples)
- Improve accessibility and keyboard navigation for the visual components
- Add more language front-ends (e.g., Python subset) through transpiler plugins

Further reading & docs

See [DESIGN.md](DESIGN.md) for architecture and internals, and [USAGE.md](USAGE.md) for example workflows and recipes.

Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute and get started.

License

Add a `LICENSE` file if you plan to publish or distribute the project. Default: unlicensed.
