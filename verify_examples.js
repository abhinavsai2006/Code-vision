
import { Transpiler } from './src/transpiler.js';
import { examples } from './src/examples.js';

const t = new Transpiler();
t.setMode('java');

// Test all Java examples
Object.keys(examples.java).forEach(key => {
    console.log(`\n--- Testing Java Example: ${key} ---`);
    const code = examples.java[key];
    try {
        const js = t.transpile(code);
        // Basic syntax check
        new Function(js);
        console.log(`✅ ${key} passed.`);
    } catch (e) {
        console.error(`❌ ${key} FAILED transpilation/syntax check.`);
        console.error(e.message);
        console.log("Code causing error:");
        console.log(t.transpile(code)); // Log the bad JS
    }
});
