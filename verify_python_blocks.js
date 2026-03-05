
import { Transpiler } from './src/transpiler.js';

const transpiler = new Transpiler();
transpiler.setMode('python');

const pythonCode = `
import math
from random import randint

# Dictionary Test
student = {
    "name": "Test",
    "score": 100
}

# Loop Test
for i in range(5):
    print(i)
    if i > 2:
        print("Big")

print("Done")
`;

console.log("--- Transpiling Python ---");
const jsCode = transpiler.transpile(pythonCode);
console.log(jsCode);

// Verify Syntax
console.log("--- Verifying Syntax ---");
try {
    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
    new AsyncFunction(jsCode);
    console.log("✅ Syntax Valid!");
} catch (e) {
    console.error("❌ Syntax Error:", e.message);
}
