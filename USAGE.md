# Usage Recipes & Examples

This guide contains step-by-step recipes showing common workflows inside Code Vision.

1) Run and inspect a basic function

- Open the app and paste the following code into the editor:

```js
function sum(a, b) {
  const r = a + b;
  return r;
}

console.log(sum(2, 3));
```

- Click `Run` (or the equivalent button in the UI). Observe:
  - A `call` trace for `sum` and a `return` trace with the return value.
  - The call stack grows and shrinks.
  - The memory view shows local variables for the function frame.

2) Step through loops and conditionals

- Example:

```js
let total = 0;
for (let i = 0; i < 5; i++) {
  total += i;
}
console.log(total);
```

- Expected behaviour:
  - Each iteration emits `step` traces for the loop body.
  - The execution flow component highlights the current statement.

3) Inspecting closures and scopes

- Example:

```js
function makeAdder(x) {
  return function(y) { return x + y; };
}
const add5 = makeAdder(5);
console.log(add5(3));
```

- Expected behaviour:
  - The memory view shows environment captured by the closure.
  - When `add5` is called, the call stack displays the closure frame with captured `x`.

4) Exporting traces

- Use the UI export button to download a trace JSON file for offline analysis.
- Traces can be reloaded into the app or used for testing.

5) Adding a new example

- Edit `src/examples.js` and add an object with `name`, `code`, and optional `description`.
- The editor's examples menu will include the new snippet on reload.

Troubleshooting

- No output: check the console for transpiler or interpreter errors.
- UI not updating: verify the interpreter emits traces with the expected `type` fields.

