
import { Transpiler } from './src/transpiler.js';

const t = new Transpiler();
t.setMode('java');

const userCode = `
import java.util.Random;
public class BasicRandomExample {
    public static void main(String[] args) {
        Random random = new Random();
        int x = random.nextInt(100);
        System.out.println("Random: " + x);
    }
}
`;

console.log("--- Original User Java ---");
console.log(userCode);

const js = t.transpile(userCode);
console.log("\n--- Transpiled JS ---");
console.log(js);

// Syntax check
try {
    // Run it!
    // We expect successful execution
    // Note: console.log will print to stdout because we are in Node
    // But 'System' mock handles System.in. System.out is replaced by console.log.
    // 'random' is now a Factory Function call.
    new Function(js)();
    console.log("\n✅ Execution SUCCESS!");
} catch (e) {
    console.error("\n❌ Execution FAILED:", e.message);
}
